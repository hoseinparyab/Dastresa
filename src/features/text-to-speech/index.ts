import type { FeatureContext, IFeature, ISpeechEngine, SpeechState } from '@/core/contracts';
import { EVENTS, FEATURE_IDS, STORAGE_KEYS } from '@/core/constants';
import { chunkTextForTts } from '@/core/api/persian-tts';
import { parseSettings, type SpeechSettings } from '@/core/settings';
import {
  clearSpeechHighlight,
  ensureSpeechHighlightStyles,
  highlightSpeechText,
  removeSpeechHighlightStyles,
} from '@/features/text-to-speech/highlight';
import { SelectionCapture } from '@/features/text-to-speech/selection';

type SynthResponse = { ok: true; dataUrl: string } | { ok: false; error?: string };

export type SpeechNoticeCode =
  | 'speechLoading'
  | 'speechPlaying'
  | 'speechPaused'
  | 'speechEmpty'
  | 'speechFallbackBrowser'
  | 'speechReloadPage'
  | 'speechNoPersianVoice'
  | 'speechErrorPlay'
  | 'speechErrorGeneric';

function isExtensionContextInvalidated(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? '');
  return /extension context invalidated/i.test(msg) || !chrome.runtime?.id;
}

async function requestPersianAudio(text: string): Promise<string> {
  if (!chrome.runtime?.id) {
    throw new Error('Extension context invalidated.');
  }
  let response: SynthResponse | undefined;
  try {
    response = (await chrome.runtime.sendMessage({
      type: 'dastresa-persian-tts',
      text,
    })) as SynthResponse | undefined;
  } catch (error) {
    if (isExtensionContextInvalidated(error)) {
      throw new Error('Extension context invalidated.');
    }
    throw error;
  }
  if (!response?.ok || !('dataUrl' in response) || !response.dataUrl) {
    throw new Error(
      response && 'error' in response ? String(response.error) : 'persian_tts_failed',
    );
  }
  return response.dataUrl;
}

export class SpeechEngine implements ISpeechEngine {
  private state: SpeechState = 'idle';
  private index = 0;
  private paragraphs: string[] = [];
  private settings: SpeechSettings = {
    rate: 1,
    pitch: 1,
    volume: 1,
    voiceURI: '',
    preferPersian: true,
    provider: 'persian-server',
    autoReadOnEnable: true,
  };
  private audio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private bufferSource: AudioBufferSourceNode | null = null;
  private cancelled = false;

  constructor(
    private readonly synth: SpeechSynthesis,
    private readonly onState: (state: SpeechState) => void,
    private readonly onParagraph: (index: number, text: string) => void,
    private readonly onNotice?: (level: 'info' | 'warn' | 'error', code: SpeechNoticeCode) => void,
    private readonly doc: Document = document,
    private readonly win: Window = window,
  ) {}

  configure(settings: SpeechSettings): void {
    this.settings = settings;
  }

  async play(paragraphs: string[] = this.paragraphs): Promise<void> {
    this.cancelled = false;
    this.stopPlaybackOnly();
    this.paragraphs = paragraphs
      .flatMap((p) => chunkTextForTts(p))
      .filter((p) => p.trim().length > 0);
    if (this.paragraphs.length === 0) {
      this.setState('idle');
      this.onNotice?.('error', 'speechEmpty');
      return;
    }
    this.index = 0;

    if (this.settings.provider === 'persian-server') {
      try {
        // Unlock audio during the user gesture; otherwise play() fails after the long TTS wait.
        await this.ensureAudioContext();
        this.setState('loading');
        this.onNotice?.('info', 'speechLoading');
        await this.speakRemoteCurrent();
        return;
      } catch (error) {
        if (this.cancelled) return;
        // After Reload of the extension, old content scripts cannot talk to the new SW.
        if (isExtensionContextInvalidated(error)) {
          console.warn('[Dastresa] Extension context invalidated — refresh the page', error);
          this.setState('stopped');
          this.onNotice?.('error', 'speechReloadPage');
          return;
        }
        console.warn('[Dastresa] Persian TTS failed', error);
        // Prefer silence + clear error over an English browser voice when Persian is required.
        if (this.settings.preferPersian && !this.findPersianVoice()) {
          this.setState('stopped');
          this.onNotice?.('error', 'speechNoPersianVoice');
          return;
        }
        this.onNotice?.('warn', 'speechFallbackBrowser');
      }
    }

    this.synth.cancel();
    this.speakBrowserCurrent();
  }

  pause(): void {
    if (this.state !== 'playing') return;
    if (this.audioCtx && this.bufferSource) {
      void this.audioCtx.suspend().then(() => {
        this.setState('paused');
        this.onNotice?.('info', 'speechPaused');
      });
      return;
    }
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
      this.setState('paused');
      this.onNotice?.('info', 'speechPaused');
      return;
    }
    this.synth.pause();
    this.setState('paused');
    this.onNotice?.('info', 'speechPaused');
  }

  resume(): void {
    if (this.state !== 'paused') return;
    if (this.audioCtx && this.bufferSource) {
      void this.audioCtx.resume().then(() => this.setState('playing'));
      return;
    }
    if (this.audio) {
      void this.audio.play().then(() => this.setState('playing'));
      return;
    }
    this.synth.resume();
    this.setState('playing');
  }

  stop(): void {
    this.cancelled = true;
    this.stopPlaybackOnly();
    this.index = 0;
    clearSpeechHighlight(this.doc);
    this.setState('stopped');
  }

  setVoice(voiceURI: string): void {
    this.settings.voiceURI = voiceURI;
  }

  setRate(rate: number): void {
    this.settings.rate = rate;
  }

  setPitch(pitch: number): void {
    this.settings.pitch = pitch;
  }

  setVolume(volume: number): void {
    this.settings.volume = volume;
  }

  getState(): SpeechState {
    return this.state;
  }

  private stopPlaybackOnly(): void {
    this.synth.cancel();
    if (this.bufferSource) {
      try {
        this.bufferSource.onended = null;
        this.bufferSource.stop();
      } catch {
        // already stopped
      }
      this.bufferSource.disconnect();
      this.bufferSource = null;
    }
    if (this.audio) {
      this.audio.onended = null;
      this.audio.onerror = null;
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
  }

  private async ensureAudioContext(): Promise<AudioContext> {
    const g = globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext };
    const AC = g.AudioContext ?? g.webkitAudioContext;
    if (!AC) throw new Error('persian_tts_no_audio_context');
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      this.audioCtx = new AC();
    }
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  private async playDataUrl(dataUrl: string): Promise<void> {
    const ctx = await this.ensureAudioContext();
    const res = await fetch(dataUrl);
    if (!res.ok) throw new Error('persian_tts_play_error');
    const raw = await res.arrayBuffer();
    const buffer = await ctx.decodeAudioData(raw.slice(0));
    if (this.cancelled) return;

    await new Promise<void>((resolve, reject) => {
      try {
        if (this.bufferSource) {
          try {
            this.bufferSource.onended = null;
            this.bufferSource.stop();
          } catch {
            // ignore
          }
          this.bufferSource.disconnect();
        }
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        gain.gain.value = Math.min(1, Math.max(0, this.settings.volume));
        source.buffer = buffer;
        source.playbackRate.value = Math.min(2, Math.max(0.5, this.settings.rate));
        source.connect(gain);
        gain.connect(ctx.destination);
        this.bufferSource = source;
        source.onended = () => {
          if (this.bufferSource === source) this.bufferSource = null;
          resolve();
        };
        this.setState('playing');
        this.onNotice?.('info', 'speechPlaying');
        source.start(0);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('persian_tts_play_error'));
      }
    });
  }

  private async speakRemoteCurrent(): Promise<void> {
    if (this.cancelled) return;
    const text = this.paragraphs[this.index];
    if (!text) {
      this.setState('idle');
      return;
    }

    this.setState('loading');
    this.onNotice?.('info', 'speechLoading');
    this.onParagraph(this.index, text);
    this.scrollToHighlight(text);

    const dataUrl = await requestPersianAudio(text);
    if (this.cancelled) return;

    try {
      await this.playDataUrl(dataUrl);
    } catch (error) {
      this.onNotice?.('error', 'speechErrorPlay');
      throw error;
    }

    if (this.cancelled) return;
    this.index += 1;
    if (this.index < this.paragraphs.length) await this.speakRemoteCurrent();
    else this.setState('idle');
  }

  private speakBrowserCurrent(): void {
    const text = this.paragraphs[this.index];
    if (!text) {
      this.setState('idle');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.settings.rate;
    utterance.pitch = this.settings.pitch;
    utterance.volume = this.settings.volume;
    const voice = this.pickVoice();
    if (voice) utterance.voice = voice;
    utterance.lang =
      voice?.lang ||
      (/[\u0600-\u06FF]/.test(text) ? 'fa-IR' : document.documentElement.lang || 'en-US');

    utterance.onstart = () => {
      this.setState('playing');
      this.onNotice?.('info', 'speechPlaying');
      this.onParagraph(this.index, text);
      this.scrollToHighlight(text);
    };
    utterance.onend = () => {
      this.index += 1;
      if (this.index < this.paragraphs.length) this.speakBrowserCurrent();
      else this.setState('idle');
    };
    utterance.onerror = () => {
      this.onNotice?.('error', 'speechErrorPlay');
      this.setState('stopped');
    };

    this.setState('loading');
    this.synth.speak(utterance);
  }

  private findPersianVoice(): SpeechSynthesisVoice | null {
    const voices = this.synth.getVoices();
    return (
      voices.find((v) => v.lang.toLowerCase().startsWith('fa')) ||
      voices.find((v) => /persian|farsi/i.test(v.name)) ||
      null
    );
  }

  private pickVoice(): SpeechSynthesisVoice | null {
    const voices = this.synth.getVoices();
    if (this.settings.voiceURI) {
      const exact = voices.find((v) => v.voiceURI === this.settings.voiceURI);
      if (exact) return exact;
    }
    if (this.settings.preferPersian) {
      return this.findPersianVoice();
    }
    return voices[0] ?? null;
  }

  private scrollToHighlight(text: string): void {
    highlightSpeechText(this.doc, text, this.win);
  }

  private setState(state: SpeechState): void {
    this.state = state;
    this.onState(state);
    if (state === 'idle' || state === 'stopped') {
      clearSpeechHighlight(this.doc);
    }
  }
}

export class TextToSpeechFeature implements IFeature {
  readonly id = FEATURE_IDS.TEXT_TO_SPEECH;
  readonly name = 'Text To Speech';
  readonly version = '1.4.0';
  private enabled = true;
  private engine?: SpeechEngine;
  private paragraphs: string[] = [];
  private unsubs: Array<() => void> = [];
  private autoReadTimer: ReturnType<typeof setTimeout> | undefined;
  private selection = new SelectionCapture(document);
  private bus?: FeatureContext['bus'];
  private storage?: FeatureContext['storage'];

  initialize(ctx: FeatureContext): void {
    this.bus = ctx.bus;
    this.storage = ctx.storage;
    ensureSpeechHighlightStyles(ctx.document);
    this.engine = new SpeechEngine(
      ctx.window.speechSynthesis,
      (state) => ctx.bus.emit(EVENTS.SPEECH_STATE, { state }),
      (index, text) => ctx.bus.emit(EVENTS.SPEECH_PARAGRAPH, { index, text }),
      (level, code) => ctx.bus.emit(EVENTS.SPEECH_NOTICE, { level, code }),
      ctx.document,
      ctx.window,
    );
    this.selection = new SelectionCapture(ctx.document, ctx.window);
    this.selection.start();
    void this.hydrateSpeechSettings();

    this.unsubs.push(
      ctx.bus.on(EVENTS.READER_CONTENT_READY, ({ paragraphs }) => {
        this.paragraphs = paragraphs;
      }),
    );
    this.unsubs.push(
      ctx.bus.on(EVENTS.SETTINGS_CHANGED, ({ settings }) => {
        this.engine?.configure(settings.speech);
      }),
    );
    this.unsubs.push(
      ctx.bus.on(EVENTS.TOOLBAR_COMMAND, ({ command }) => {
        if (!this.enabled || !this.engine) return;
        if (command === 'read') void this.startReading({ preferSelection: true });
        if (command === 'pause') this.engine.pause();
        if (command === 'resume') this.engine.resume();
        if (command === 'stop') this.engine.stop();
      }),
    );
    this.unsubs.push(
      ctx.bus.on(EVENTS.EXTENSION_ACTIVATED, () => {
        void this.maybeAutoRead(ctx);
      }),
    );
    this.unsubs.push(
      ctx.bus.on(EVENTS.EXTENSION_EXITED, () => {
        this.clearAutoRead();
        this.selection.clear();
        this.engine?.stop();
        clearSpeechHighlight(ctx.document);
      }),
    );
  }

  private async maybeAutoRead(ctx: FeatureContext): Promise<void> {
    this.clearAutoRead();
    // Delay so DOM + toolbar settle after enable.
    this.autoReadTimer = setTimeout(() => {
      void (async () => {
        try {
          const raw = await ctx.storage.get<unknown>(STORAGE_KEYS.SETTINGS);
          const settings = parseSettings(raw);
          this.engine?.configure(settings.speech);
          if (!this.enabled || !settings.speech.autoReadOnEnable) return;
          // Auto-read always uses page/reader content, never a stale selection.
          await this.startReading({ preferSelection: false });
        } catch (error) {
          console.warn('[Dastresa] auto-read failed', error);
        }
      })();
    }, 700);
  }

  private clearAutoRead(): void {
    if (this.autoReadTimer) clearTimeout(this.autoReadTimer);
    this.autoReadTimer = undefined;
  }

  private async hydrateSpeechSettings(): Promise<void> {
    if (!this.storage || !this.engine) return;
    try {
      const raw = await this.storage.get<unknown>(STORAGE_KEYS.SETTINGS);
      this.engine.configure(parseSettings(raw).speech);
    } catch (error) {
      console.warn('[Dastresa] speech settings hydrate failed', error);
    }
  }

  private async startReading(opts: { preferSelection: boolean }): Promise<void> {
    if (!this.engine) return;
    try {
      await this.hydrateSpeechSettings();
      const selected = opts.preferSelection ? this.selection.paragraphs() : [];
      if (selected.length > 0) {
        await this.engine.play(selected);
        return;
      }
      await this.engine.play(this.paragraphs.length ? this.paragraphs : this.fromPage());
    } catch (error) {
      console.warn('[Dastresa] startReading failed', error);
      if (isExtensionContextInvalidated(error)) {
        this.bus?.emit(EVENTS.SPEECH_NOTICE, { level: 'error', code: 'speechReloadPage' });
        return;
      }
      this.bus?.emit(EVENTS.SPEECH_NOTICE, { level: 'error', code: 'speechErrorGeneric' });
    }
  }

  private fromPage(): string[] {
    return Array.from(document.querySelectorAll('p, article p, main p'))
      .map((p) => p.textContent?.trim() ?? '')
      .filter((t) => t.length > 20);
  }

  dispose(): void {
    this.clearAutoRead();
    this.selection.stop();
    this.selection.clear();
    this.engine?.stop();
    removeSpeechHighlightStyles(document);
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    this.enabled = false;
  }

  enable(): void {
    this.enabled = true;
    this.selection.start();
    ensureSpeechHighlightStyles(document);
  }

  disable(): void {
    this.clearAutoRead();
    this.selection.stop();
    this.selection.clear();
    this.engine?.stop();
    clearSpeechHighlight(document);
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getEngine(): SpeechEngine | undefined {
    return this.engine;
  }
}

export const feature = new TextToSpeechFeature();
export default feature;
