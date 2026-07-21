import type { FeatureContext, IFeature, IStyleController, StyleTokenMap } from '@/core/contracts';
import { EVENTS, FEATURE_IDS, HOST_STYLE_ATTR, STORAGE_KEYS } from '@/core/constants';
import { clamp } from '@/core/utils';
import { parseSettings, type ZoomSettings } from '@/features/settings/schema/settings-schema';

const ZOOMED_ATTR = 'data-Dastresa-zoomed';
const BASE_FS_ATTR = 'data-Dastresa-fs';

const SKIP_CLOSEST =
  '#Dastresa-toolbar-host, #Dastresa-focus-cursor, #Dastresa-ruler, [data-Dastresa="toolbar"], script, style, noscript, svg, canvas, video, img, iframe, object, embed';

/**
 * Text-only zoom controller:
 * scales font-size on elements that directly contain text, leaves layout/media alone.
 */
export class StyleController implements IStyleController {
  private styleEl: HTMLStyleElement | null = null;
  private zoomed = new Set<HTMLElement>();

  constructor(private readonly doc: Document) {}

  apply(tokens: StyleTokenMap): void {
    if (!this.styleEl) {
      this.styleEl = this.doc.createElement('style');
      this.styleEl.setAttribute(HOST_STYLE_ATTR, 'zoom');
      this.doc.documentElement.appendChild(this.styleEl);
    }

    const decls = Object.entries(tokens)
      .map(([k, v]) => `${k}: ${v};`)
      .join('\n');

    // Spacing/readability tokens only — no global body/media scaling.
    this.styleEl.textContent = `
      html[${HOST_STYLE_ATTR}-zoom] {
        ${decls}
      }
      html[${HOST_STYLE_ATTR}-zoom] [${ZOOMED_ATTR}="1"] {
        line-height: var(--wp-line-height, 1.7) !important;
        letter-spacing: var(--wp-letter-spacing, 0) !important;
        word-spacing: var(--wp-word-spacing, 0) !important;
      }
      html[${HOST_STYLE_ATTR}-zoom] :is(p, li, dd, dt, blockquote, figcaption)[${ZOOMED_ATTR}="1"] {
        max-width: min(var(--wp-content-width, 72ch), 100%);
      }
    `;

    this.doc.documentElement.setAttribute(`${HOST_STYLE_ATTR}-zoom`, 'true');
    this.applyTextSizes(Number(tokens['--wp-text-scale'] ?? 1));
  }

  private collectTextElements(): HTMLElement[] {
    const root = this.doc.body;
    if (!root) return [];

    const seen = new Set<HTMLElement>();
    const out: HTMLElement[] = [];
    const walker = this.doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const text = node.textContent?.replace(/\s+/g, ' ').trim() ?? '';
        if (text.length < 1) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest(SKIP_CLOSEST)) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEXTAREA') {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let current = walker.nextNode();
    while (current) {
      const el = (current as Text).parentElement;
      if (el && !seen.has(el)) {
        seen.add(el);
        out.push(el);
      }
      current = walker.nextNode();
    }
    return out;
  }

  private applyTextSizes(scale: number): void {
    const elements = this.collectTextElements();
    const alive = new Set<HTMLElement>();

    for (const el of elements) {
      alive.add(el);
      let base = Number(el.getAttribute(BASE_FS_ATTR));
      if (!Number.isFinite(base) || base <= 0) {
        const computed = this.doc.defaultView?.getComputedStyle(el).fontSize ?? '16px';
        base = Number.parseFloat(computed) || 16;
        // Store the pre-zoom size once so repeated nudges stay linear.
        el.setAttribute(BASE_FS_ATTR, String(base));
      }

      const next = Math.round(base * scale * 100) / 100;
      el.style.setProperty('font-size', `${next}px`, 'important');
      el.setAttribute(ZOOMED_ATTR, '1');
      this.zoomed.add(el);
    }

    // Clean nodes that no longer contain text
    for (const el of [...this.zoomed]) {
      if (alive.has(el)) continue;
      el.style.removeProperty('font-size');
      el.removeAttribute(ZOOMED_ATTR);
      el.removeAttribute(BASE_FS_ATTR);
      this.zoomed.delete(el);
    }
  }

  reset(): void {
    for (const el of this.zoomed) {
      el.style.removeProperty('font-size');
      el.removeAttribute(ZOOMED_ATTR);
      el.removeAttribute(BASE_FS_ATTR);
    }
    this.zoomed.clear();

    this.doc.querySelectorAll(`[${ZOOMED_ATTR}], [${BASE_FS_ATTR}]`).forEach((node) => {
      const el = node as HTMLElement;
      el.style.removeProperty('font-size');
      el.removeAttribute(ZOOMED_ATTR);
      el.removeAttribute(BASE_FS_ATTR);
    });

    this.doc.documentElement.removeAttribute(`${HOST_STYLE_ATTR}-zoom`);
    this.styleEl?.remove();
    this.styleEl = null;
  }
}

function toTokens(zoom: ZoomSettings): StyleTokenMap {
  return {
    '--wp-text-scale': String(zoom.textScale),
    // Images/layout stay at 1 — zoom controls text only.
    '--wp-image-scale': '1',
    '--wp-line-height': String(zoom.lineHeight),
    '--wp-letter-spacing': `${zoom.letterSpacing}em`,
    '--wp-word-spacing': `${zoom.wordSpacing}em`,
    '--wp-content-width': `${zoom.contentWidth}ch`,
    '--wp-max-line-length': `${zoom.maxLineLength}ch`,
  };
}

function isNeutralZoom(zoom: ZoomSettings): boolean {
  return (
    zoom.textScale === 1 &&
    zoom.lineHeight <= 1.2 &&
    zoom.letterSpacing === 0 &&
    zoom.wordSpacing === 0 &&
    zoom.contentWidth >= 100 &&
    zoom.maxLineLength >= 100
  );
}

export class SmartZoomFeature implements IFeature {
  readonly id = FEATURE_IDS.SMART_ZOOM;
  readonly name = 'Smart Zoom';
  readonly version = '0.1.0';
  private enabled = true;
  private controller?: StyleController;
  private bus?: FeatureContext['bus'];
  private zoom: ZoomSettings = {
    textScale: 1.15,
    imageScale: 1,
    lineHeight: 1.7,
    letterSpacing: 0.02,
    wordSpacing: 0.05,
    contentWidth: 72,
    maxLineLength: 70,
  };
  private unsubs: Array<() => void> = [];
  private ctx?: FeatureContext;

  async initialize(ctx: FeatureContext): Promise<void> {
    this.ctx = ctx;
    this.bus = ctx.bus;
    this.controller = new StyleController(ctx.document);

    // Load persisted zoom before first apply — refresh must not use defaults.
    await this.syncFromStorage();
    this.apply();

    this.unsubs.push(
      ctx.bus.on(EVENTS.SETTINGS_CHANGED, ({ settings }) => {
        this.zoom = { ...settings.zoom, imageScale: 1 };
        if (this.enabled) this.apply();
      }),
    );

    this.unsubs.push(
      ctx.bus.on(EVENTS.TOOLBAR_COMMAND, ({ command }) => {
        if (command === 'zoom-in') void this.nudge(0.1);
        if (command === 'zoom-out') void this.nudge(-0.1);
      }),
    );
  }

  private async syncFromStorage(): Promise<void> {
    if (!this.ctx) return;
    const raw = await this.ctx.storage.get<unknown>(STORAGE_KEYS.SETTINGS);
    const settings = parseSettings(raw);
    this.zoom = { ...settings.zoom, imageScale: 1 };
  }

  private async nudge(delta: number): Promise<void> {
    this.zoom = {
      ...this.zoom,
      textScale: clamp(Number((this.zoom.textScale + delta).toFixed(2)), 0.8, 2.5),
      imageScale: 1,
    };
    this.apply();
    if (!this.ctx) return;
    const raw = await this.ctx.storage.get<unknown>(STORAGE_KEYS.SETTINGS);
    const next = parseSettings(raw);
    await this.ctx.storage.set(STORAGE_KEYS.SETTINGS, {
      ...next,
      zoom: this.zoom,
    });
  }

  private apply(): void {
    if (isNeutralZoom(this.zoom)) {
      this.controller?.reset();
    } else {
      this.controller?.apply(toTokens(this.zoom));
    }
    this.bus?.emit(EVENTS.ZOOM_APPLIED, { scale: this.zoom.textScale });
  }

  dispose(): void {
    this.unsubs.forEach((u) => u());
    this.controller?.reset();
  }

  enable(): void {
    this.enabled = true;
    this.apply();
  }

  disable(): void {
    this.enabled = false;
    this.controller?.reset();
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const feature = new SmartZoomFeature();
export default feature;
