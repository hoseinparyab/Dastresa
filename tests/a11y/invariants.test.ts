import { describe, expect, it } from 'vitest';
import { FUTURE_EXTENSION_POINTS } from '@/core/extension-points';
import { FEATURE_IDS } from '@/core/constants';

describe('accessibility architecture invariants', () => {
  it('keeps future modules unimplemented slots only', () => {
    expect(FUTURE_EXTENSION_POINTS.every((p) => p.status === 'future')).toBe(true);
  });

  it('defines all MVP feature ids', () => {
    expect(Object.values(FEATURE_IDS)).toEqual(
      expect.arrayContaining([
        'storage',
        'settings',
        'dom-analyzer',
        'reader-mode',
        'text-to-speech',
        'smart-zoom',
        'themes',
        'reading-focus',
        'toolbar',
      ]),
    );
  });
});
