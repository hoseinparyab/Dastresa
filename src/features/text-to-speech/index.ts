import type { FeatureContext, IFeature, ISpeechEngine, SpeechState } from '@/core/contracts';
import { EVENTS, FEATURE_IDS, STORAGE_KEYS } from '@/core/constants';
import { chunkTextForTts } from '@/core/api/persian-tts';
import { parseSettings, type SpeechSettings } from '@/core/settings';

type SynthResponse = { ok: true; dataUrl: string } | { ok: false; error?: string };

async function requestPersianAudio(text: string): Promise<string> {
  const response = (await chrome.runtime.sendMessage({
    type: 'dastresa-persian-tts',
    text,
  })) as SynthResponse | undefined;
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
  private cancelled = false;

  constructor(
    private readonly synth: SpeechSynthesis,
    private readonly onState: (state: SpeechState) => void,
    private readonly onParagraph: (index: number, text: string) => void,
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
    if (this.paragraphs.length === 0) return;
    this.index = 0;

    if (this.settings.provider === 'persian-server') {
      try {
        await this.speakRemoteCurrent();
        return;
      } catch (error) {
        console.warn('[Dastresa] Persian TTS failed, falling back to browser', error);
      }
    }
    this.synth.cancel();
    this.speakBrowserCurrent();
  }

  pause(): void {
    if (this.state !== 'playing') return;
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
      this.setState('paused');
      return;
    }
    this.synth.pause();
    this.setState('paused');
  }

  resume(): void {
    if (this.state !== 'paused') return;
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
    if (this.audio) {
      this.audio.onended = null;
      this.audio.onerror = null;
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
  }

  private async speakRemoteCurrent(): Promise<void> {
    if (this.cancelled) return;
    const text = this.paragraphs[this.index];
    if (!text) {
      this.setState('idle');
      return;
    }

    this.setState('playing');
    this.onParagraph(this.index, text);
    this.scrollToHighlight(text);

    const dataUrl = await requestPersianAudio(text);
    if (this.cancelled) return;

    await new Promise<void>((resolve, reject) => {
      const audio = new Audio(dataUrl);
      this.audio = audio;
      audio.volume = Math.min(1, Math.max(0, this.settings.volume));
      // Map speech rate roughly onto playbackRate (0.5–2).
      audio.playbackRate = Math.min(2, Math.max(0.5, this.settings.rate));
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('persian_tts_play_error'));
      void audio.play().catch(reject);
    });

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
      this.onParagraph(this.index, text);
      this.scrollToHighlight(text);
    };
    utterance.onend = () => {
      this.index += 1;
      if (this.index < this.paragraphs.length) this.speakBrowserCurrent();
      else this.setState('idle');
    };
    utterance.onerror = () => this.setState('stopped');

    this.synth.speak(utterance);
  }

  private pickVoice(): SpeechSynthesisVoice | null {
    const voices = this.synth.getVoices();
    if (this.settings.voiceURI) {
      const exact = voices.find((v) => v.voiceURI === this.settings.voiceURI);
      if (exact) return exact;
    }
    if (this.settings.preferPersian) {
      const fa =
        voices.find((v) => v.lang.toLowerCase().startsWith('fa')) ||
        voices.find((v) => /persian|farsi/i.test(v.name));
      if (fa) return fa;
    }
    return voices[0] ?? null;
  }

  private scrollToHighlight(text: string): void {
    const nodes = Array.from(document.querySelectorAll('p, li, h1, h2, h3'));
    const match = nodes.find((n) => (n.textContent ?? '').includes(text.slice(0, 48)));
    if (!match || !(match instanceof HTMLElement)) return;
    match.setAttribute('data-Dastresa-speech', 'active');
    match.scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.querySelectorAll('[data-Dastresa-speech="active"]').forEach((el) => {
      if (el !== match) el.removeAttribute('data-Dastresa-speech');
    });
  }

  private setState(state: SpeechState): void {
    this.state = state;
    this.onState(state);
  }
}

export class TextToSpeechFeature implements IFeature {
  readonly id = FEATURE_IDS.TEXT_TO_SPEECH;
  readonly name = 'Text To Speech';
  readonly version = '1.3.0';
  private enabled = true;
  private engine?: SpeechEngine;
  private paragraphs: string[] = [];
  private unsubs: Array<() => void> = [];
  private autoReadTimer: ReturnType<typeof setTimeout> | undefined;

  initialize(ctx: FeatureContext): void {
    this.engine = new SpeechEngine(
      ctx.window.speechSynthesis,
      (state) => ctx.bus.emit(EVENTS.SPEECH_STATE, { state }),
      (index, text) => ctx.bus.emit(EVENTS.SPEECH_PARAGRAPH, { index, text }),
    );

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
        if (command === 'read') void this.startReading();
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
        this.engine?.stop();
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
          await this.startReading();
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

  private async startReading(): Promise<void> {
    if (!this.engine) return;
    await this.engine.play(this.paragraphs.length ? this.paragraphs : this.fromPage());
  }

  private fromPage(): string[] {
    return Array.from(document.querySelectorAll('p, article p, main p'))
      .map((p) => p.textContent?.trim() ?? '')
      .filter((t) => t.length > 20);
  }

  dispose(): void {
    this.clearAutoRead();
    this.engine?.stop();
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    this.enabled = false;
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.clearAutoRead();
    this.engine?.stop();
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
