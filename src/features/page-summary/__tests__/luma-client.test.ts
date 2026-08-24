import { describe, expect, it } from 'vitest';
import { extractLumaText, truncateForSummary } from '@/features/page-summary/luma-client';

describe('luma-client helpers', () => {
  it('extracts output_text from Responses API payload', () => {
    const text = extractLumaText({
      output: [
        {
          type: 'message',
          content: [{ type: 'output_text', text: 'خلاصه تست' }],
        },
      ],
    });
    expect(text).toBe('خلاصه تست');
  });

  it('truncates long page text', () => {
    const long = 'a'.repeat(20_000);
    const cut = truncateForSummary(long, 100);
    expect(cut.length).toBeLessThan(long.length);
    expect(cut.endsWith('[…]')).toBe(true);
  });
});
