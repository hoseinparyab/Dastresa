import { Readability } from '@mozilla/readability';
import type {
  FeatureContext,
  IFeature,
  IReadableContentProvider,
  ReadableDocument,
} from '@/core/contracts';
import { EVENTS, FEATURE_IDS } from '@/core/constants';
import { splitParagraphs } from '@/core/utils';
import { patchStoredSettings } from '@/features/settings/services/patch-settings';

const NOISE_SELECTORS = [
  'header',
  'footer',
  'nav',
  'aside',
  '[role="banner"]',
  '[role="navigation"]',
  '[role="complementary"]',
  '.cookie',
  '.cookies',
  '#cookie',
  '.newsletter',
  '.popup',
  '.modal',
  '.ad',
  '.ads',
  '.advertisement',
  '.sidebar',
  '.comments',
  '#comments',
  '.related',
  '.recommend',
].join(',');

export class ReaderModeService implements IReadableContentProvider {
  private content: ReadableDocument | null = null;
  private overlay: HTMLElement | null = null;
  private host: HTMLElement | null = null;

  extract(doc: Document): ReadableDocument {
    const clone = doc.cloneNode(true) as Document;
    clone.querySelectorAll(NOISE_SELECTORS).forEach((el) => el.remove());

    let parsed: ReturnType<Readability['parse']> = null;
    try {
      parsed = new Readability(clone).parse();
    } catch {
      parsed = null;
    }

    if (parsed?.content && parsed.textContent.trim().length > 80) {
      const paragraphs = splitParagraphs(parsed.textContent);
      this.content = {
        title: parsed.title || doc.title,
        byline: parsed.byline ?? undefined,
        html: parsed.content,
        text: parsed.textContent,
        paragraphs,
      };
      return this.content;
    }

    return this.fallback(doc);
  }

  private fallback(doc: Document): ReadableDocument {
    const roots = Array.from(
      doc.querySelectorAll<HTMLElement>('article, main, [role="main"], body'),
    );
    const root = roots[0] ?? doc.body;
    const blocks = Array.from(
      root.querySelectorAll<HTMLElement>('h1, h2, p, li, pre, table, figure, img'),
    );
    const html = blocks.map((el) => el.outerHTML).join('\n') || `<p>${root?.innerText ?? ''}</p>`;
    const text = root?.innerText?.trim() || doc.title;
    this.content = {
      title: doc.title || 'Readable content',
      html: `<article><h1>${doc.title}</h1>${html}</article>`,
      text,
      paragraphs: splitParagraphs(text),
    };
    return this.content;
  }

  getContent(): ReadableDocument | null {
    return this.content;
  }

  mount(doc: Document, content: ReadableDocument): void {
    this.unmount();
    this.host = doc.createElement('div');
    this.host.id = 'Dastresa-reader-host';
    this.host.setAttribute('data-Dastresa', 'reader');
    Object.assign(this.host.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '2147483645',
      background: 'rgba(2, 6, 23, 0.92)',
    });

    const shadow = this.host.attachShadow({ mode: 'open' });
    this.overlay = doc.createElement('div');
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-label', content.title);
    this.overlay.innerHTML = `
      <style>
        :host, * { box-sizing: border-box; }
        .wrap {
          max-width: min(72ch, 92vw);
          margin: 0 auto;
          padding: 2rem 1.25rem 4rem;
          color: #f8fafc;
          font-family: "Source Sans 3", Tahoma, sans-serif;
          line-height: 1.7;
          font-size: 1.125rem;
          overflow: auto;
          height: 100vh;
        }
        h1 { font-family: Fraunces, Georgia, serif; font-size: 2rem; margin: 0 0 0.75rem; }
        .byline { color: #94a3b8; margin-bottom: 1.5rem; }
        img, figure { max-width: 100%; height: auto; }
        a { color: #38bdf8; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #334155; padding: 0.5rem; }
        pre { overflow: auto; background: #0f172a; padding: 1rem; border-radius: 8px; }
        .close {
          position: sticky; top: 0; float: inline-end;
          min-width: 48px; min-height: 48px;
          border: 0; border-radius: 10px;
          background: #1e293b; color: #f8fafc; cursor: pointer; font-size: 1rem;
        }
        .close:focus-visible { outline: 3px solid #38bdf8; outline-offset: 2px; }
      </style>
      <div class="wrap">
        <button type="button" class="close" aria-label="Close reader mode">Close</button>
        <h1>${escapeHtml(content.title)}</h1>
        ${content.byline ? `<p class="byline">${escapeHtml(content.byline)}</p>` : ''}
        <div class="article">${content.html}</div>
      </div>
    `;
    shadow.appendChild(this.overlay);
    doc.documentElement.appendChild(this.host);
  }

  unmount(): void {
    this.host?.remove();
    this.host = null;
    this.overlay = null;
  }

  onClose(handler: () => void): void {
    const btn = this.overlay?.querySelector('.close');
    btn?.addEventListener('click', handler);
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export class ReaderModeFeature implements IFeature, IReadableContentProvider {
  readonly id = FEATURE_IDS.READER_MODE;
  readonly name = 'Reader Mode';
  readonly version = '0.1.0';
  private enabled = false;
  private service = new ReaderModeService();
  private ctx?: FeatureContext;
  private unsubs: Array<() => void> = [];

  initialize(ctx: FeatureContext): void {
    this.ctx = ctx;
    this.unsubs.push(
      ctx.bus.on(EVENTS.TOOLBAR_COMMAND, ({ command }) => {
        if (command === 'reader') {
          if (this.enabled) void this.disable();
          else void this.enable();
        }
      }),
    );
    this.unsubs.push(
      ctx.bus.on(EVENTS.SETTINGS_CHANGED, ({ settings }) => {
        if (settings.readerMode && !this.enabled) void this.enable();
        if (!settings.readerMode && this.enabled) void this.disable();
      }),
    );
  }

  dispose(): void {
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    this.service.unmount();
    this.enabled = false;
  }

  private async persistReader(active: boolean): Promise<void> {
    if (!this.ctx) return;
    await patchStoredSettings(this.ctx.storage, { readerMode: active });
  }

  async enable(): Promise<void> {
    if (!this.ctx) return;
    const content = this.service.extract(this.ctx.document);
    this.service.mount(this.ctx.document, content);
    this.service.onClose(() => void this.disable());
    this.enabled = true;
    this.ctx.bus.emit(EVENTS.READER_ACTIVATED, undefined);
    this.ctx.bus.emit(EVENTS.READER_CONTENT_READY, {
      title: content.title,
      text: content.text,
      paragraphs: content.paragraphs,
      html: content.html,
    });
    await this.persistReader(true);
  }

  async disable(): Promise<void> {
    this.service.unmount();
    this.enabled = false;
    this.ctx?.bus.emit(EVENTS.READER_DEACTIVATED, undefined);
    await this.persistReader(false);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getContent(): ReadableDocument | null {
    return this.service.getContent();
  }
}

export const feature = new ReaderModeFeature();
export default feature;
