import type { FeatureContext, IFeature } from '@/core/contracts';
import { EVENTS, FEATURE_IDS, HOST_STYLE_ATTR, STORAGE_KEYS } from '@/core/constants';
import { safeQueryAll } from '@/core/utils';
import { parseSettings } from '@/features/settings/schema/settings-schema';
import {
  buildFocusPointerSvg,
  FOCUS_CURSOR_PALETTE,
  type FocusCursorColor,
} from '@/features/reading-focus/cursor';

const CURSOR_HOST_ID = 'Dastresa-focus-cursor';
const HTML_CURSOR_CLASS = 'dastresa-focus-cursor-on';

export class ReadingFocusFeature implements IFeature {
  readonly id = FEATURE_IDS.READING_FOCUS;
  readonly name = 'Reading Focus';
  readonly version = '0.1.0';
  private enabled = false;
  private ruler = false;
  private cursorColor: FocusCursorColor = 'yellow';
  private index = 0;
  private paragraphs: HTMLElement[] = [];
  private styleEl?: HTMLStyleElement;
  private rulerEl?: HTMLElement;
  private cursorHost?: HTMLElement;
  private cursorShadow?: ShadowRoot;
  private unsubs: Array<() => void> = [];
  private ctx?: FeatureContext;
  private lastX = 80;
  private lastY = 80;

  initialize(ctx: FeatureContext): void {
    this.ctx = ctx;
    this.styleEl = ctx.document.createElement('style');
    this.styleEl.setAttribute(HOST_STYLE_ATTR, 'focus');
    ctx.document.documentElement.appendChild(this.styleEl);

    void (async () => {
      const shouldEnable = await this.syncFromStorage();
      if (shouldEnable && !this.enabled) {
        await this.enable({ persist: false, scroll: false });
      }
    })();

    this.unsubs.push(
      ctx.bus.on(EVENTS.SETTINGS_CHANGED, ({ settings }) => {
        this.ruler = settings.readingRuler;
        this.cursorColor = settings.focusCursorColor ?? 'yellow';
        if (settings.readingFocus && !this.enabled) {
          void this.enable({ persist: false, scroll: true });
          return;
        }
        if (!settings.readingFocus && this.enabled) {
          void this.disable({ persist: false });
          return;
        }
        if (this.enabled) this.render({ scroll: false });
      }),
    );

    this.unsubs.push(
      ctx.bus.on(EVENTS.TOOLBAR_COMMAND, ({ command }) => {
        if (command !== 'focus') return;
        if (this.enabled) void this.disable({ persist: true });
        else void this.enable({ persist: true, scroll: true });
      }),
    );

    this.unsubs.push(
      ctx.bus.on(EVENTS.SPEECH_PARAGRAPH, ({ index }) => {
        if (!this.enabled) return;
        this.index = index;
        this.render({ scroll: true });
      }),
    );

    ctx.document.addEventListener('keydown', this.onKeyDown, true);
    ctx.document.addEventListener('mousemove', this.onMouseMove, { passive: true, capture: true });
  }

  private async syncFromStorage(): Promise<boolean> {
    if (!this.ctx) return false;
    const raw = await this.ctx.storage.get<unknown>(STORAGE_KEYS.SETTINGS);
    const settings = parseSettings(raw);
    this.ruler = settings.readingRuler;
    this.cursorColor = settings.focusCursorColor ?? 'yellow';
    return settings.readingFocus;
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (!this.enabled) return;
    if (event.key === 'ArrowDown' || event.key === 'j') {
      event.preventDefault();
      this.index = Math.min(this.index + 1, Math.max(this.paragraphs.length - 1, 0));
      this.render({ scroll: true });
    }
    if (event.key === 'ArrowUp' || event.key === 'k') {
      event.preventDefault();
      this.index = Math.max(this.index - 1, 0);
      this.render({ scroll: true });
    }
  };

  private onMouseMove = (event: MouseEvent): void => {
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    if (!this.enabled) return;
    if (this.rulerEl) {
      this.rulerEl.style.top = `${event.clientY - 24}px`;
    }
    this.positionCursor(event.clientX, event.clientY);
  };

  private positionCursor(x: number, y: number): void {
    const layer = this.cursorShadow?.getElementById('layer');
    if (!layer) return;
    layer.style.transform = `translate(${x - 6}px, ${y - 4}px)`;
  }

  private collect(): void {
    if (!this.ctx) return;
    this.paragraphs = safeQueryAll(
      this.ctx.document,
      'article p, main p, [role="main"] p, p',
    ).filter((el) => (el.textContent?.trim().length ?? 0) > 40);
  }

  private ensureCursor(): void {
    if (!this.ctx || this.cursorHost) return;

    const host = this.ctx.document.createElement('div');
    host.id = CURSOR_HOST_ID;
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = `
      all: initial !important;
      position: fixed !important;
      inset: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      pointer-events: none !important;
      z-index: 2147483647 !important;
      overflow: visible !important;
    `;

    const shadow = host.attachShadow({ mode: 'closed' });
    shadow.innerHTML = `
      <style>
        :host { all: initial; }
        #layer {
          position: fixed;
          top: 0;
          left: 0;
          width: 72px;
          height: 72px;
          pointer-events: none;
          will-change: transform;
        }
        #halo {
          position: absolute;
          top: 0;
          left: 0;
          width: 56px;
          height: 56px;
          border-radius: 999px;
          box-sizing: border-box;
        }
        #pointer {
          position: absolute;
          top: 10px;
          left: 10px;
          width: 40px;
          height: 40px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
        }
        #pointer svg { display: block; width: 40px; height: 40px; }
      </style>
      <div id="layer">
        <div id="halo"></div>
        <div id="pointer"></div>
      </div>
    `;

    (this.ctx.document.body ?? this.ctx.document.documentElement).appendChild(host);
    this.cursorHost = host;
    this.cursorShadow = shadow;
  }

  private removeCursor(): void {
    this.cursorHost?.remove();
    this.cursorHost = undefined;
    this.cursorShadow = undefined;
    this.ctx?.document.documentElement.classList.remove(HTML_CURSOR_CLASS);
  }

  private render(opts: { scroll: boolean }): void {
    if (!this.ctx || !this.styleEl) return;
    this.collect();
    const current = this.paragraphs[this.index];
    this.paragraphs.forEach((el, i) => {
      if (i === this.index) el.setAttribute('data-Dastresa-focus', 'current');
      else el.setAttribute('data-Dastresa-focus', 'dim');
    });

    const palette = FOCUS_CURSOR_PALETTE[this.cursorColor] ?? FOCUS_CURSOR_PALETTE.yellow;
    this.ensureCursor();
    this.ctx.document.documentElement.classList.add(HTML_CURSOR_CLASS);

    const halo = this.cursorShadow?.getElementById('halo');
    const pointer = this.cursorShadow?.getElementById('pointer');
    if (halo) {
      halo.style.border = `3px solid ${palette.fill}`;
      halo.style.boxShadow = `0 0 0 3px ${palette.stroke}, 0 0 22px ${palette.halo}`;
      halo.style.background = palette.halo;
    }
    if (pointer) {
      pointer.innerHTML = buildFocusPointerSvg(this.cursorColor);
    }
    this.positionCursor(this.lastX, this.lastY);

    this.styleEl.textContent = `
      html.${HTML_CURSOR_CLASS},
      html.${HTML_CURSOR_CLASS} body,
      html.${HTML_CURSOR_CLASS} body * {
        cursor: none !important;
      }
      [data-Dastresa-focus="dim"] { opacity: 0.35; filter: saturate(0.7); transition: opacity 120ms ease; }
      [data-Dastresa-focus="current"] {
        opacity: 1;
        outline: 3px solid ${palette.fill};
        outline-offset: 6px;
        background: ${palette.halo};
        transition: opacity 120ms ease, outline-color 120ms ease;
      }
      #Dastresa-ruler {
        position: fixed; left: 0; right: 0; height: 48px;
        background: ${palette.halo};
        border-top: 2px solid ${palette.fill};
        border-bottom: 2px solid ${palette.fill};
        pointer-events: none; z-index: 2147483646;
      }
    `;

    if (this.ruler) {
      if (!this.rulerEl) {
        this.rulerEl = this.ctx.document.createElement('div');
        this.rulerEl.id = 'Dastresa-ruler';
        this.rulerEl.setAttribute('aria-hidden', 'true');
        this.ctx.document.documentElement.appendChild(this.rulerEl);
      }
    } else {
      this.rulerEl?.remove();
      this.rulerEl = undefined;
    }

    if (opts.scroll) {
      current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    this.ctx.bus.emit(EVENTS.FOCUS_PARAGRAPH, { index: this.index });
  }

  private async persistFocus(active: boolean): Promise<void> {
    if (!this.ctx) return;
    const raw = await this.ctx.storage.get<unknown>(STORAGE_KEYS.SETTINGS);
    const next = parseSettings(raw);
    await this.ctx.storage.set(STORAGE_KEYS.SETTINGS, {
      ...next,
      readingFocus: active,
    });
  }

  async enable(opts: { persist?: boolean; scroll?: boolean } = {}): Promise<void> {
    await this.syncFromStorage();
    this.enabled = true;
    this.index = 0;
    this.render({ scroll: opts.scroll ?? true });
    if (opts.persist) await this.persistFocus(true);
  }

  async disable(opts: { persist?: boolean } = {}): Promise<void> {
    this.enabled = false;
    this.paragraphs.forEach((el) => el.removeAttribute('data-Dastresa-focus'));
    this.rulerEl?.remove();
    this.rulerEl = undefined;
    this.removeCursor();
    if (this.styleEl) this.styleEl.textContent = '';
    if (opts.persist) await this.persistFocus(false);
  }

  dispose(): void {
    this.unsubs.forEach((u) => u());
    this.ctx?.document.removeEventListener('keydown', this.onKeyDown, true);
    this.ctx?.document.removeEventListener('mousemove', this.onMouseMove, true);
    void this.disable({ persist: false });
    this.styleEl?.remove();
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const feature = new ReadingFocusFeature();
export default feature;
