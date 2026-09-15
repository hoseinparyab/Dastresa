import { describe, expect, it } from 'vitest';
import { THEME_CSS, findControlChrome } from '@/features/themes';

function mockRect(el: HTMLElement, width: number, height: number): void {
  el.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      width,
      height,
      toJSON() {
        return {};
      },
    }) as DOMRect;
}

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

  it('keeps search, dialog and menu chrome visible', () => {
    expect(THEME_CSS.dark).toContain('[data-dastresa-theme-chrome]');
    expect(THEME_CSS.dark).toContain('box-shadow: 0 0 0 1px #94a3b8 !important');
    expect(THEME_CSS.dark).toContain('[role="dialog"]');
    expect(THEME_CSS.dark).toContain('[role="menu"]');
    expect(THEME_CSS.dark).not.toContain('border-color: transparent !important');
    expect(THEME_CSS.dark).not.toContain('box-shadow: none !important');
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

describe('findControlChrome', () => {
  it('picks the rounded wider ancestor that includes the search button', () => {
    const shell = document.createElement('div');
    const inner = document.createElement('div');
    const input = document.createElement('input');
    const button = document.createElement('button');
    input.setAttribute('role', 'combobox');
    shell.style.borderRadius = '24px';
    shell.style.boxShadow = 'rgba(0, 0, 0, 0.08) 0px 0px 0px 1px';
    inner.append(input);
    shell.append(inner, button);
    document.body.append(shell);

    mockRect(input, 500, 40);
    mockRect(inner, 500, 40);
    mockRect(shell, 616, 40);
    mockRect(button, 40, 40);

    expect(findControlChrome(input)).toBe(shell);
    shell.remove();
  });
});
