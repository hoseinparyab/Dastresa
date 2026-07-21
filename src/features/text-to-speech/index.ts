import type { FeatureContext, IFeature, ISpeechEngine, SpeechState } from '@/core/contracts';
import { EVENTS, FEATURE_IDS } from '@/core/constants';
import type { SpeechSettings } from '@/features/settings/schema/settings-schema';

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
  };

  constructor(
    private readonly synth: SpeechSynthesis,
    private readonly onState: (state: SpeechState) => void,
    private readonly onParagraph: (index: number, text: string) => void,
  ) {}

  configure(settings: SpeechSettings): void {
    this.settings = settings;
  }

  async play(paragraphs: string[] = this.paragraphs): Promise<void> {
    this.paragraphs = paragraphs.filter((p) => p.trim().length > 0);
    if (this.paragraphs.length === 0) return;
    this.synth.cancel();
    this.index = 0;
    this.speakCurrent();
  }

  pause(): void {
    if (this.state !== 'playing') return;
    this.synth.pause();
    this.setState('paused');
  }

  resume(): void {
    if (this.state !== 'paused') return;
    this.synth.resume();
    this.setState('playing');
  }

  stop(): void {
    this.synth.cancel();
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

  private speakCurrent(): void {
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

    utterance.onstart = () => {
      this.setState('playing');
      this.onParagraph(this.index, text);
      this.scrollToHighlight(text);
    };
    utterance.onend = () => {
      this.index += 1;
      if (this.index < this.paragraphs.length) this.speakCurrent();
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
  readonly version = '0.1.0';
  private enabled = true;
  private engine?: SpeechEngine;
  private paragraphs: string[] = [];
  private unsubs: Array<() => void> = [];

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
        if (command === 'read')
          void this.engine.play(this.paragraphs.length ? this.paragraphs : this.fromPage());
        if (command === 'pause') this.engine.pause();
        if (command === 'resume') this.engine.resume();
        if (command === 'stop') this.engine.stop();
      }),
    );
  }

  private fromPage(): string[] {
    return Array.from(document.querySelectorAll('p'))
      .map((p) => p.textContent?.trim() ?? '')
      .filter(Boolean);
  }

  dispose(): void {
    this.engine?.stop();
    this.unsubs.forEach((u) => u());
    this.enabled = false;
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
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
