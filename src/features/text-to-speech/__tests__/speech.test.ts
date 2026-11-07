import { describe, expect, it, vi } from 'vitest';
import { SpeechEngine } from '@/features/text-to-speech';

describe('SpeechEngine', () => {
  it('transitions to playing on play', async () => {
    const states: string[] = [];
    const synth = window.speechSynthesis;
    const speakSpy = vi.spyOn(synth, 'speak').mockImplementation((utterance) => {
      const handler = utterance.onstart as ((ev: Event) => void) | null;
      handler?.(new Event('start'));
    });

    const engine = new SpeechEngine(
      synth,
      (state) => states.push(state),
      () => undefined,
    );
    engine.configure({
      rate: 1,
      pitch: 1,
      volume: 1,
      voiceURI: '',
      preferPersian: true,
      provider: 'browser',
      autoReadOnEnable: false,
    });

    await engine.play(['First paragraph']);
    expect(speakSpy).toHaveBeenCalled();
    expect(states).toContain('playing');
  });

  it('stops speech', async () => {
    const engine = new SpeechEngine(
      window.speechSynthesis,
      () => undefined,
      () => undefined,
    );
    engine.configure({
      rate: 1,
      pitch: 1,
      volume: 1,
      voiceURI: '',
      preferPersian: true,
      provider: 'browser',
      autoReadOnEnable: false,
    });
    await engine.play(['Hello']);
    engine.stop();
    expect(engine.getState()).toBe('stopped');
  });
});
