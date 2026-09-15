import { describe, expect, it } from 'vitest';
import { THEME_CSS } from '@/features/themes';

describe('THEME_CSS', () => {
  it('paints dark surfaces so light text is not left on white panels', () => {
    expect(THEME_CSS.dark).toContain('background-color: #0f172a !important');
    expect(THEME_CSS.dark).toContain('color: #e2e8f0 !important');
    expect(THEME_CSS.dark).toContain('box-shadow: none !important');
    expect(THEME_CSS.dark).toContain('background-image: none !important');
  });

  it('uses soft borders and elevated input surfaces for dark themes', () => {
    expect(THEME_CSS.dark).toContain('background-color: #1e293b !important');
    expect(THEME_CSS['high-contrast']).toContain('border-color: #a3a3a3 !important');
    expect(THEME_CSS['high-contrast']).not.toContain('border-color: #ffffff !important');
  });

  it('paints high-contrast and yellow-black with solid black backgrounds', () => {
    expect(THEME_CSS['high-contrast']).toContain('background-color: #000000 !important');
    expect(THEME_CSS['high-contrast']).toContain('color: #ffffff !important');
    expect(THEME_CSS['yellow-black']).toContain('background-color: #000000 !important');
    expect(THEME_CSS['yellow-black']).toContain('color: #ffe566 !important');
  });

  it('keeps normal empty', () => {
    expect(THEME_CSS.normal.trim()).toBe('');
  });
});
