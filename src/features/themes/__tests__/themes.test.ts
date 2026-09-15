import { describe, expect, it } from 'vitest';
import { THEME_CSS } from '@/features/themes';

describe('THEME_CSS', () => {
  it('uses color-scheme and paints semantic surfaces for dark theme', () => {
    expect(THEME_CSS.dark).toContain('color-scheme: dark !important');
    expect(THEME_CSS.dark).toContain('background-color: #0f172a !important');
    expect(THEME_CSS.dark).toContain('color: #e2e8f0 !important');
    expect(THEME_CSS.dark).toContain('main, article, section');
  });

  it('does not blanket-paint every div (avoids Google nested shells)', () => {
    expect(THEME_CSS.dark).not.toMatch(/div,\s*section,\s*article/);
    expect(THEME_CSS.dark).toContain('background-color: transparent !important');
    expect(THEME_CSS.dark).toContain('background-color: #1e293b !important');
    expect(THEME_CSS.dark).toContain('border: 1px solid #94a3b8 !important');
  });

  it('paints high-contrast and yellow-black with solid black backgrounds', () => {
    expect(THEME_CSS['high-contrast']).toContain('background-color: #000000 !important');
    expect(THEME_CSS['high-contrast']).toContain('color: #ffffff !important');
    expect(THEME_CSS['high-contrast']).toContain('border-color: #a3a3a3 !important');
    expect(THEME_CSS['yellow-black']).toContain('background-color: #000000 !important');
    expect(THEME_CSS['yellow-black']).toContain('color: #ffe566 !important');
  });

  it('keeps normal empty', () => {
    expect(THEME_CSS.normal.trim()).toBe('');
  });
});
