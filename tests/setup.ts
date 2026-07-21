import '@testing-library/jest-dom/vitest';

class MockSpeechSynthesis {
  speaking = false;
  pending = false;
  paused = false;
  private voices: SpeechSynthesisVoice[] = [];

  getVoices() {
    return this.voices;
  }

  speak() {
    this.speaking = true;
  }

  cancel() {
    this.speaking = false;
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }
}

Object.defineProperty(window, 'speechSynthesis', {
  configurable: true,
  value: new MockSpeechSynthesis(),
});

Object.defineProperty(window, 'SpeechSynthesisUtterance', {
  configurable: true,
  value: class {
    text = '';
    rate = 1;
    pitch = 1;
    volume = 1;
    voice = null;
    onstart: ((ev: Event) => void) | null = null;
    onend: ((ev: Event) => void) | null = null;
    onerror: ((ev: Event) => void) | null = null;
    constructor(text?: string) {
      this.text = text ?? '';
    }
  },
});
