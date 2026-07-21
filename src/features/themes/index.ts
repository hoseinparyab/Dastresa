import type { FeatureContext, IFeature } from '@/core/contracts';
import { EVENTS, FEATURE_IDS, HOST_STYLE_ATTR, STORAGE_KEYS } from '@/core/constants';
import { parseSettings, type ThemeId } from '@/features/settings/schema/settings-schema';

/**
 * Site-safe themes: avoid rewriting every link/control size and avoid
 * universal border overrides that shatter dense app layouts (GitHub, etc.).
 * Users opt into stronger looks; default theme is `normal` (no CSS).
 */
const THEME_CSS: Record<ThemeId, string> = {
  normal: '',
  dark: `
    html { color-scheme: dark; }
    html { background-color: #0f172a !important; }
    body { background-color: transparent !important; color: #e2e8f0 !important; }
  `,
  light: `
    html { color-scheme: light; }
    html { background-color: #ffffff !important; }
    body { background-color: transparent !important; color: #0f172a !important; }
  `,
  'high-contrast': `
    html { color-scheme: dark; background-color: #000 !important; }
    body { background-color: transparent !important; color: #fff !important; }
    a, a:visited { color: #ffe566 !important; text-decoration: underline !important; }
  `,
  'black-white': `
    html { filter: grayscale(1) contrast(1.15); }
  `,
  'yellow-black': `
    html { color-scheme: dark; background-color: #000 !important; }
    body { background-color: transparent !important; color: #ffe566 !important; }
    a, a:visited { color: #fff176 !important; }
  `,
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
    const raw = await this.ctx.storage.get<unknown>(STORAGE_KEYS.SETTINGS);
    const next = parseSettings(raw);
    await this.ctx.storage.set(STORAGE_KEYS.SETTINGS, {
      ...next,
      theme: this.theme,
    });
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
