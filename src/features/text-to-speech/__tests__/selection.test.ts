import { describe, expect, it } from 'vitest';
import { selectionToParagraphs } from '@/features/text-to-speech/selection';

describe('selectionToParagraphs', () => {
  it('returns empty for blank input', () => {
    expect(selectionToParagraphs('   ')).toEqual([]);
  });

  it('keeps a single block as one paragraph', () => {
    expect(selectionToParagraphs('سلام دنیا  این یک تست است')).toEqual([
      'سلام دنیا این یک تست است',
    ]);
  });

  it('splits on blank lines', () => {
    expect(selectionToParagraphs('اولین بند\n\nدومین بند')).toEqual(['اولین بند', 'دومین بند']);
  });
});
