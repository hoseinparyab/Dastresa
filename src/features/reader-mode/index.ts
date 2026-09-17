import { Readability } from '@mozilla/readability';
import type {
  FeatureContext,
  IFeature,
  IReadableContentProvider,
  ReadableDocument,
} from '@/core/contracts';
import { EVENTS, FEATURE_IDS, STORAGE_KEYS } from '@/core/constants';
import { buildHeadingTree } from '@/core/semantics';
import { parseSettings } from '@/core/settings';
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

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function slugify(text: string, index: number): string {
  const base = text
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return `sec-${base || 'h'}-${index}`;
}

function enrichHtmlWithHeadingIds(html: string): {
  html: string;
  toc: Array<{ id: string; level: number; text: string }>;
} {
  const toc: Array<{ id: string; level: number; text: string }> = [];
  let i = 0;
  const next = html.replace(/<h([1-6])(\b[^>]*)>([\s\S]*?)<\/h\1>/gi, (full, level, attrs, inner) => {
    const text = inner.replace(/<[^>]+>/g, '').trim();
    if (!text) return full;
    const idMatch = /\bid\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const id = idMatch?.[1] || slugify(text, i++);
    toc.push({ id, level: Number(level), text });
    if (idMatch) return full;
    return `<h${level}${attrs} id="${escapeHtml(id)}">${inner}</h${level}>`;
  });
  return { html: next, toc };
}

export class ReaderModeService implements IReadableContentProvider {
  private content: ReadableDocument | null = null;
  private overlay: HTMLElement | null = null;
  private host: HTMLElement | null = null;
  private progressEl: HTMLElement | null = null;

  extract(doc: Document): ReadableDocument {
    const clone = doc.cloneNode(true) as Document;
    clone.querySelectorAll(NOISE_SELECTORS).forEach((el) => el.remove());

    let parsed: ReturnType<Readability['parse']> = null;
    try {
      parsed = new Readability(clone).parse();
    } catch {
      parsed = null;
    }

    // Prefer semantic heading tree from live doc when Readability succeeds
    const { flat } = buildHeadingTree(doc);

    if (parsed?.content && parsed.textContent.trim().length > 80) {
      const { html, toc } = enrichHtmlWithHeadingIds(parsed.content);
      const paragraphs = splitParagraphs(parsed.textContent);
      this.content = {
        title: parsed.title || doc.title,
        byline: parsed.byline ?? undefined,
        html,
        text: parsed.textContent,
        paragraphs,
        toc: toc.length
          ? toc
          : flat.map((h, idx) => ({
              id: h.id || slugify(h.text, idx),
              level: h.level,
              text: h.text,
            })),
      };
      return this.content;
    }

    return this.fallback(doc, flat);
  }

  private fallback(
    doc: Document,
    flat: Array<{ level: number; text: string; id?: string }>,
  ): ReadableDocument {
    const roots = Array.from(
      doc.querySelectorAll<HTMLElement>('article, main, [role="main"], body'),
    );
    const root = roots[0] ?? doc.body;
    const blocks = Array.from(
      root.querySelectorAll<HTMLElement>('h1, h2, h3, h4, p, li, pre, table, figure, img'),
    );
    const rawHtml =
      blocks.map((el) => el.outerHTML).join('\n') || `<p>${root?.innerText ?? ''}</p>`;
    const { html, toc } = enrichHtmlWithHeadingIds(
      `<article><h1>${escapeHtml(doc.title)}</h1>${rawHtml}</article>`,
    );
    const text = root?.innerText?.trim() || doc.title;
    this.content = {
      title: doc.title || 'Readable content',
      html,
      text,
      paragraphs: splitParagraphs(text),
      toc:
        toc.length > 0
          ? toc
          : flat.map((h, idx) => ({
              id: h.id || slugify(h.text, idx),
              level: h.level,
              text: h.text,
            })),
    };
    return this.content;
  }

  getContent(): ReadableDocument | null {
    return this.content;
  }

  mount(doc: Document, content: ReadableDocument, locale: 'fa' | 'en' = 'fa'): void {
    this.unmount();
    this.host = doc.createElement('div');
    this.host.id = 'Dastresa-reader-host';
    this.host.setAttribute('data-Dastresa', 'reader');
    Object.assign(this.host.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '2147483645',
      background: '#020617',
      overflow: 'auto',
    });

    const shadow = this.host.attachShadow({ mode: 'open' });
    this.overlay = doc.createElement('div');
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-label', content.title);
    this.overlay.setAttribute('dir', locale === 'fa' ? 'rtl' : 'ltr');
    this.overlay.setAttribute('lang', locale);

    const labels =
      locale === 'en'
        ? {
            toc: 'Sections',
            tocAria: 'Table of contents',
            prev: 'Prev',
            prevAria: 'Previous section',
            next: 'Next',
            nextAria: 'Next section',
            close: 'Close',
            closeAria: 'Close reader mode',
          }
        : {
            toc: 'بخش‌ها',
            tocAria: 'فهرست مطالب',
            prev: 'قبلی',
            prevAria: 'بخش قبلی',
            next: 'بعدی',
            nextAria: 'بخش بعدی',
            close: 'بستن',
            closeAria: 'بستن حالت مطالعه',
          };

    const toc = content.toc ?? [];
    const tocHtml = toc.length
      ? `<nav class="toc" aria-label="${labels.tocAria}">
          <p class="toc-title">${labels.toc}</p>
          <ol>${toc
            .map(
              (item) =>
                `<li class="l${item.level}"><a href="#${escapeHtml(item.id)}" data-sec="${escapeHtml(item.id)}">${escapeHtml(item.text)}</a></li>`,
            )
            .join('')}</ol>
        </nav>`
      : '';

    this.overlay.innerHTML = `
      <style>
        :host, * { box-sizing: border-box; }
        .scrim { position: fixed; inset: 0; background: #020617; z-index: 0; }
        .layout {
          position: relative; z-index: 1;
          display: grid;
          grid-template-columns: minmax(0, 220px) minmax(0, 1fr);
          gap: 1rem;
          max-width: min(1100px, 96vw);
          margin: 0 auto;
          padding: 1.25rem 1rem 4rem;
          min-height: 100vh;
          color: #f8fafc;
          font-family: "Source Sans 3", Tahoma, sans-serif;
          line-height: 1.7;
          font-size: 1.125rem;
        }
        @media (max-width: 800px) {
          .layout { grid-template-columns: 1fr; }
          .toc { position: static !important; }
        }
        .toc {
          position: sticky; top: 0.75rem; align-self: start;
          max-height: calc(100vh - 1.5rem); overflow: auto;
          padding: 0.75rem; border-radius: 12px;
          background: #0f172a; border: 1px solid #334155;
        }
        .toc-title { margin: 0 0 0.5rem; font-size: 0.85rem; color: #94a3b8; font-weight: 700; }
        .toc ol { list-style: none; margin: 0; padding: 0; }
        .toc li { margin: 0.25rem 0; }
        .toc li.l3, .toc li.l4, .toc li.l5, .toc li.l6 { padding-inline-start: 0.75rem; }
        .toc a {
          color: #e2e8f0; text-decoration: none; display: block;
          padding: 0.35rem 0.4rem; border-radius: 8px; font-size: 0.92rem;
        }
        .toc a:hover, .toc a:focus-visible { background: rgba(56,189,248,0.16); outline: none; }
        .toc a[aria-current="true"] { background: rgba(56,189,248,0.28); color: #fff; }
        .wrap { min-width: 0; }
        .toolbar {
          display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
          position: sticky; top: 0; z-index: 2;
          padding: 0.35rem 0; margin-bottom: 0.75rem; background: #020617;
        }
        .progress-track {
          flex: 1; min-width: 120px; height: 8px; border-radius: 999px;
          background: #1e293b; overflow: hidden;
        }
        .progress-bar {
          height: 100%; width: 0%; background: #38bdf8; border-radius: 999px;
        }
        .nav-btn, .close {
          min-width: 48px; min-height: 48px; padding: 0 12px;
          border: 0; border-radius: 10px;
          background: #1e293b; color: #f8fafc; cursor: pointer; font-size: 0.95rem;
          font-family: inherit;
        }
        .nav-btn:focus-visible, .close:focus-visible { outline: 3px solid #38bdf8; outline-offset: 2px; }
        h1 { font-family: Fraunces, Georgia, serif; font-size: 2rem; margin: 0 0 0.75rem; }
        .byline { color: #94a3b8; margin-bottom: 1.5rem; }
        img, figure { max-width: 100%; height: auto; }
        a { color: #38bdf8; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #334155; padding: 0.5rem; }
        pre { overflow: auto; background: #0f172a; padding: 1rem; border-radius: 8px; }
        .article :is(h1,h2,h3,h4,h5,h6) { scroll-margin-top: 72px; }
      </style>
      <div class="scrim" aria-hidden="true"></div>
      <div class="layout">
        ${tocHtml}
        <div class="wrap">
          <div class="toolbar">
            <button type="button" class="nav-btn prev" aria-label="${labels.prevAria}">${labels.prev}</button>
            <button type="button" class="nav-btn next" aria-label="${labels.nextAria}">${labels.next}</button>
            <div class="progress-track" aria-hidden="true"><div class="progress-bar"></div></div>
            <button type="button" class="close" aria-label="${labels.closeAria}">${labels.close}</button>
          </div>
          <h1>${escapeHtml(content.title)}</h1>
          ${content.byline ? `<p class="byline">${escapeHtml(content.byline)}</p>` : ''}
          <div class="article">${content.html}</div>
        </div>
      </div>
    `;
    shadow.appendChild(this.overlay);
    doc.documentElement.appendChild(this.host);
    doc.documentElement.style.setProperty('overflow', 'hidden', 'important');
    doc.body?.style.setProperty('overflow', 'hidden', 'important');

    this.progressEl = this.overlay.querySelector('.progress-bar');
    this.bindNavigation(toc);
    this.bindProgress();
  }

  private bindNavigation(toc: Array<{ id: string; level: number; text: string }>): void {
    if (!this.overlay || !this.host) return;
    const scrollRoot = this.host;
    const jump = (id: string) => {
      const target = this.overlay?.querySelector(`#${CSS.escape(id)}`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.overlay?.querySelectorAll('.toc a').forEach((a) => {
        a.removeAttribute('aria-current');
        if (a.getAttribute('data-sec') === id) a.setAttribute('aria-current', 'true');
      });
    };

    this.overlay.querySelectorAll('.toc a').forEach((a) => {
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        const id = a.getAttribute('data-sec');
        if (id) jump(id);
      });
    });

    const ids = toc.map((t) => t.id);
    let index = 0;
    this.overlay.querySelector('.prev')?.addEventListener('click', () => {
      if (!ids.length) {
        scrollRoot.scrollBy({ top: -scrollRoot.clientHeight * 0.8, behavior: 'smooth' });
        return;
      }
      index = Math.max(0, index - 1);
      jump(ids[index]!);
    });
    this.overlay.querySelector('.next')?.addEventListener('click', () => {
      if (!ids.length) {
        scrollRoot.scrollBy({ top: scrollRoot.clientHeight * 0.8, behavior: 'smooth' });
        return;
      }
      index = Math.min(ids.length - 1, index + 1);
      jump(ids[index]!);
    });
  }

  private bindProgress(): void {
    if (!this.host || !this.progressEl) return;
    const update = () => {
      const el = this.host!;
      const max = el.scrollHeight - el.clientHeight;
      const pct = max <= 0 ? 100 : Math.min(100, Math.round((el.scrollTop / max) * 100));
      this.progressEl!.style.width = `${pct}%`;
    };
    this.host.addEventListener('scroll', update, { passive: true });
    update();
  }

  unmount(): void {
    const doc = this.host?.ownerDocument;
    this.host?.remove();
    this.host = null;
    this.overlay = null;
    this.progressEl = null;
    if (doc) {
      doc.documentElement.style.removeProperty('overflow');
      doc.body?.style.removeProperty('overflow');
    }
  }

  onClose(handler: () => void): void {
    const btn = this.overlay?.querySelector('.close');
    btn?.addEventListener('click', handler);
  }
}

export class ReaderModeFeature implements IFeature, IReadableContentProvider {
  readonly id = FEATURE_IDS.READER_MODE;
  readonly name = 'Reader Mode';
  readonly version = '1.2.0';
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
    const raw = await this.ctx.storage.get<unknown>(STORAGE_KEYS.SETTINGS);
    const settings = parseSettings(raw);
    const content = this.service.extract(this.ctx.document);
    this.service.mount(this.ctx.document, content, settings.locale === 'en' ? 'en' : 'fa');
    this.service.onClose(() => void this.disable());
    this.enabled = true;
    this.ctx.bus.emit(EVENTS.READER_ACTIVATED, undefined);
    this.ctx.bus.emit(EVENTS.READER_CONTENT_READY, {
      title: content.title,
      text: content.text,
      paragraphs: content.paragraphs,
      html: content.html,
    });
    this.ctx.bus.emit(EVENTS.READER_STRUCTURE_READY, {
      structure: {
        title: content.title,
        byline: content.byline,
        toc: content.toc ?? [],
        sectionCount: content.toc?.length ?? 0,
      },
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
