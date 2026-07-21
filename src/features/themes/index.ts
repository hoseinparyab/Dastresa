import type { FeatureContext, IFeature } from '@/core/contracts';
import { EVENTS, FEATURE_IDS, HOST_STYLE_ATTR, STORAGE_KEYS } from '@/core/constants';
import { parseSettings, type ThemeId } from '@/features/settings/schema/settings-schema';

const THEME_CSS: Record<ThemeId, string> = {
  normal: '',
  dark: `
    html { color-scheme: dark; }
    body { background: #0f172a !important; color: #f8fafc !important; }
    a { color: #38bdf8 !important; }
  `,
  light: `
    html { color-scheme: light; }
    body { background: #ffffff !important; color: #0f172a !important; }
    a { color: #0369a1 !important; }
  `,
  'high-contrast': `
    body { background: #000 !important; color: #fff !important; }
    a { color: #ffff00 !important; text-decoration: underline !important; }
    * { border-color: #fff !important; }
  `,
  'black-white': `
    html { filter: grayscale(1) contrast(1.2); }
    body { background: #fff !important; color: #000 !important; }
  `,
  'yellow-black': `
    body { background: #000 !important; color: #ffe566 !important; }
    a { color: #fff176 !important; }
  `,
};

export class ThemesFeature implements IFeature {
  readonly id = FEATURE_IDS.THEMES;
  readonly name = 'Themes';
  readonly version = '0.1.0';
  private enabled = true;
  private styleEl?: HTMLStyleElement;
  private theme: ThemeId = 'dark';
  private largeCursor = false;
  private largeButtons = true;
  private unsubs: Array<() => void> = [];
  private ctx?: FeatureContext;
  private themeOrder: ThemeId[] = [
    'dark',
    'light',
    'high-contrast',
    'black-white',
    'yellow-black',
    'normal',
  ];

  async initialize(ctx: FeatureContext): Promise<void> {
    this.ctx = ctx;
    this.styleEl = ctx.document.createElement('style');
    this.styleEl.setAttribute(HOST_STYLE_ATTR, 'theme');
    ctx.document.documentElement.appendChild(this.styleEl);

    // Load persisted Look settings before first paint — otherwise refresh
    // re-applies hardcoded defaults (dark + large buttons) and breaks pages.
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
        this.theme = this.themeOrder[(idx + 1) % this.themeOrder.length] ?? 'dark';
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
      ${this.largeButtons ? `button, [role="button"], a, input, select, textarea { min-height: 48px !important; min-width: 48px !important; }` : ''}
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
    this.styleEl?.remove();
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
