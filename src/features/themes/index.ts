import type { FeatureContext, IFeature } from '@/core/contracts';
import { EVENTS, FEATURE_IDS, HOST_STYLE_ATTR, STORAGE_KEYS } from '@/core/constants';
import { parseSettings, type ThemeId } from '@/core/settings';
import { patchStoredSettings } from '@/features/settings/services/patch-settings';

type PaintTokens = {
  scheme: 'dark' | 'light';
  bg: string;
  fg: string;
  link: string;
  border: string;
  /** Slightly elevated surface for inputs/controls */
  surface: string;
};

/**
 * Force readable surfaces on complex sites (Google, Wikipedia, etc.).
 * Avoid harsh white borders/box-shadows that create "ghost" lines and nested boxes.
 */
function paintTheme({ scheme, bg, fg, link, border, surface }: PaintTokens): string {
  return `
    html {
      color-scheme: ${scheme} !important;
      background-color: ${bg} !important;
      background-image: none !important;
    }
    html body {
      background-color: ${bg} !important;
      background-image: none !important;
      color: ${fg} !important;
    }
    /* Broad paint: sites nest many wrappers with their own light fills/shadows */
    html body *:not(img):not(picture):not(video):not(canvas):not(svg):not(path):not(iframe):not([data-Dastresa]):not([data-Dastresa] *) {
      background-color: ${bg} !important;
      background-image: none !important;
      color: ${fg} !important;
      border-color: ${border} !important;
      outline-color: ${border} !important;
      box-shadow: none !important;
      text-shadow: none !important;
      caret-color: ${fg} !important;
    }
    html body :where(img, picture, video, canvas, svg, iframe) {
      background-color: transparent !important;
      box-shadow: none !important;
    }
    html body :where(a, a:link, a:visited, a:hover, a:active) {
      color: ${link} !important;
      background-color: transparent !important;
      background-image: none !important;
      box-shadow: none !important;
    }
    html body :where(a) * {
      color: inherit !important;
      background-color: transparent !important;
      background-image: none !important;
    }
    /* Form controls: one solid surface so nested search shells don't look patchy */
    html body :where(
      input, textarea, select, button,
      [role="textbox"], [role="searchbox"], [role="combobox"], [contenteditable="true"]
    ):not([data-Dastresa]):not([data-Dastresa] *) {
      background-color: ${surface} !important;
      background-image: none !important;
      color: ${fg} !important;
      border: 1px solid ${border} !important;
      box-shadow: none !important;
      outline-color: ${border} !important;
      caret-color: ${fg} !important;
    }
    html body :where(hr) {
      border-color: ${border} !important;
      background-color: ${border} !important;
      box-shadow: none !important;
    }
    /* Pseudo underlines/dividers (Google tabs, etc.) */
    html body *:not([data-Dastresa]):not([data-Dastresa] *)::before,
    html body *:not([data-Dastresa]):not([data-Dastresa] *)::after {
      border-color: ${border} !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }
  `;
}

/**
 * Default theme is `normal` (no CSS). Color themes must paint containers, not
 * only body — otherwise light text lands on white site panels.
 */
export const THEME_CSS: Record<ThemeId, string> = {
  normal: '',
  dark: paintTheme({
    scheme: 'dark',
    bg: '#0f172a',
    surface: '#1e293b',
    fg: '#e2e8f0',
    link: '#7dd3fc',
    border: '#334155',
  }),
  light: paintTheme({
    scheme: 'light',
    bg: '#ffffff',
    surface: '#f1f5f9',
    fg: '#0f172a',
    link: '#0369a1',
    border: '#cbd5e1',
  }),
  'high-contrast': paintTheme({
    scheme: 'dark',
    bg: '#000000',
    surface: '#171717',
    fg: '#ffffff',
    link: '#ffe566',
    // Soft grey borders — pure white creates harsh ghost lines on Google tabs/search
    border: '#a3a3a3',
  }),
  'black-white': `
    html { filter: grayscale(1) contrast(1.2) !important; }
  `,
  'yellow-black': paintTheme({
    scheme: 'dark',
    bg: '#000000',
    surface: '#1a1a00',
    fg: '#ffe566',
    link: '#fff176',
    border: '#665c00',
  }),
};

/** Touch targets for controls only — never force min-size on every link. */
const LARGE_BUTTON_CSS = `
  button,
  [role="button"],
  input[type="button"],
  input[type="submit"],
  input[type="reset"] {
    min-height: 44px !important;
    padding-block: 0.5rem !important;
  }
`;

export class ThemesFeature implements IFeature {
  readonly id = FEATURE_IDS.THEMES;
  readonly name = 'Themes';
  readonly version = '0.1.0';
  private enabled = true;
  private styleEl?: HTMLStyleElement;
  private theme: ThemeId = 'normal';
  private largeCursor = false;
  private largeButtons = false;
  private unsubs: Array<() => void> = [];
  private ctx?: FeatureContext;
  private themeOrder: ThemeId[] = [
    'normal',
    'dark',
    'light',
    'high-contrast',
    'black-white',
    'yellow-black',
  ];

  async initialize(ctx: FeatureContext): Promise<void> {
    this.ctx = ctx;
    this.styleEl = ctx.document.createElement('style');
    this.styleEl.setAttribute(HOST_STYLE_ATTR, 'theme');
    ctx.document.documentElement.appendChild(this.styleEl);

    // Load persisted Look settings before first paint — otherwise refresh
    // re-applies hardcoded defaults and breaks pages.
    await this.syncFromStorage();
    this.apply();

    this.unsubs.push(
      ctx.bus.on(EVENTS.SETTINGS_CHANGED, ({ settings }) => {
        this.theme = settings.theme;
        this.largeCursor = settings.largeCursor;
        this.largeButtons = settings.largeButtons;
        if (this.enabled) this.apply();
      }),
    );

    this.unsubs.push(
      ctx.bus.on(EVENTS.TOOLBAR_COMMAND, ({ command }) => {
        if (command !== 'contrast') return;
        const idx = this.themeOrder.indexOf(this.theme);
        this.theme = this.themeOrder[(idx + 1) % this.themeOrder.length] ?? 'normal';
        this.apply();
        void this.persistTheme();
      }),
    );
  }

  private async syncFromStorage(): Promise<void> {
    if (!this.ctx) return;
    const raw = await this.ctx.storage.get<unknown>(STORAGE_KEYS.SETTINGS);
    const settings = parseSettings(raw);
    this.theme = settings.theme;
    this.largeCursor = settings.largeCursor;
    this.largeButtons = settings.largeButtons;
  }

  private async persistTheme(): Promise<void> {
    if (!this.ctx) return;
    await patchStoredSettings(this.ctx.storage, { theme: this.theme });
  }

  private apply(): void {
    if (!this.styleEl || !this.ctx) return;
    const extras = `
      ${this.largeCursor ? `* { cursor: url("data:image/svg+xml,${encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"48\" height=\"48\"><path fill=\"%23fff\" stroke=\"%23000\" stroke-width=\"2\" d=\"M8 4 L8 40 L18 30 L26 44 L32 41 L24 27 L38 27 Z\"/></svg>')}"), auto !important; }` : ''}
      ${this.largeButtons ? LARGE_BUTTON_CSS : ''}
    `;
    const themeCss = THEME_CSS[this.theme];
    if (!themeCss.trim() && !this.largeCursor && !this.largeButtons) {
      this.styleEl.textContent = '';
      this.ctx.document.documentElement.removeAttribute(`${HOST_STYLE_ATTR}-theme`);
    } else {
      this.styleEl.textContent = `${themeCss}\n${extras}`;
      this.ctx.document.documentElement.setAttribute(`${HOST_STYLE_ATTR}-theme`, this.theme);
    }
    this.ctx.bus.emit(EVENTS.THEME_APPLIED, { theme: this.theme });
  }

  dispose(): void {
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    this.styleEl?.remove();
    this.styleEl = undefined;
  }

  enable(): void {
    this.enabled = true;
    this.apply();
  }

  disable(): void {
    this.enabled = false;
    if (this.styleEl) this.styleEl.textContent = '';
    this.ctx?.document.documentElement.removeAttribute(`${HOST_STYLE_ATTR}-theme`);
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const feature = new ThemesFeature();
export default feature;
