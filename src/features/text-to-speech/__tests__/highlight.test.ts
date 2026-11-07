import { afterEach, describe, expect, it } from 'vitest';
import {
  clearSpeechHighlight,
  ensureSpeechHighlightStyles,
  highlightSpeechText,
  removeSpeechHighlightStyles,
} from '@/features/text-to-speech/highlight';

describe('speech highlight', () => {
  afterEach(() => {
    removeSpeechHighlightStyles(document);
    document.body.innerHTML = '';
  });

  it('injects styles and marks the matching paragraph', () => {
    document.body.innerHTML = `
      <p>بند اول برای تست</p>
      <p>این جمله باید هایلایت شود چون در حال خواندن است</p>
    `;
    ensureSpeechHighlightStyles(document);
    expect(document.getElementById('Dastresa-speech-highlight-style')).toBeTruthy();

    const match = highlightSpeechText(document, 'این جمله باید هایلایت شود چون در حال خواندن است');
    expect(match?.getAttribute('data-Dastresa-speech')).toBe('active');
    expect(document.querySelectorAll('[data-Dastresa-speech="active"]')).toHaveLength(1);

    clearSpeechHighlight(document);
    expect(document.querySelectorAll('[data-Dastresa-speech="active"]')).toHaveLength(0);
  });
});
