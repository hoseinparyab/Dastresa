import type { AppLocale } from '@/shared/i18n/messages';
import { t } from '@/shared/i18n/messages';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function toHtmlParagraphs(summary: string): string {
  return summary
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split('\n').map((line) => escapeHtml(line)).join('<br/>');
      return `<p>${lines}</p>`;
    })
    .join('');
}

export class SummaryOverlay {
  private host: HTMLElement | null = null;

  show(
    doc: Document,
    opts: {
      locale: AppLocale;
      dir: 'ltr' | 'rtl';
      title: string;
      bodyHtml: string;
      status?: 'loading' | 'ready' | 'error';
    },
  ): void {
    this.close();
    this.host = doc.createElement('div');
    this.host.id = 'Dastresa-summary-host';
    this.host.setAttribute('data-Dastresa', 'summary');
    Object.assign(this.host.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '2147483645',
      background: '#020617',
      overflow: 'auto',
    });

    const shadow = this.host.attachShadow({ mode: 'open' });
    const wrap = doc.createElement('div');
    wrap.innerHTML = `
      <style>
        :host, * { box-sizing: border-box; }
        .wrap {
          max-width: min(64ch, 92vw);
          margin: 0 auto;
          padding: 2rem 1.25rem 4rem;
          min-height: 100vh;
          color: #f8fafc;
          background: #020617;
          font-family: "Source Sans 3", Tahoma, sans-serif;
          line-height: 1.7;
          font-size: 1.125rem;
        }
        h1 { font-family: Fraunces, Georgia, serif; font-size: 1.75rem; margin: 0 0 0.5rem; }
        .hint { color: #94a3b8; margin: 0 0 1.5rem; font-size: 0.95rem; }
        .status { color: #7dd3fc; margin: 1rem 0; }
        .error { color: #fecaca; }
        .close {
          position: sticky; top: 0; float: inline-end;
          min-width: 48px; min-height: 48px;
          border: 0; border-radius: 10px;
          background: #1e293b; color: #f8fafc; cursor: pointer; font-size: 1rem;
        }
        .close:focus-visible { outline: 3px solid #38bdf8; outline-offset: 2px; }
        p { margin: 0 0 1rem; }
      </style>
      <div class="wrap" dir="${opts.dir}" lang="${opts.locale}">
        <button type="button" class="close" aria-label="${escapeHtml(t(opts.locale, 'summaryClose'))}">${escapeHtml(t(opts.locale, 'summaryClose'))}</button>
        <h1>${escapeHtml(t(opts.locale, 'summaryTitle'))}</h1>
        <p class="hint">${escapeHtml(opts.title)}</p>
        <p class="hint">${escapeHtml(t(opts.locale, 'summaryPrivacyHint'))}</p>
        ${
          opts.status === 'loading'
            ? `<p class="status" role="status">${escapeHtml(t(opts.locale, 'summaryLoading'))}</p>`
            : ''
        }
        ${
          opts.status === 'error'
            ? `<div class="error" role="alert">${opts.bodyHtml}</div>`
            : `<div class="article">${opts.bodyHtml}</div>`
        }
      </div>
    `;
    shadow.appendChild(wrap);
    wrap.querySelector('.close')?.addEventListener('click', () => this.close());
    doc.documentElement.appendChild(this.host);
  }

  showLoading(doc: Document, locale: AppLocale, dir: 'ltr' | 'rtl', title: string): void {
    this.show(doc, {
      locale,
      dir,
      title,
      bodyHtml: '',
      status: 'loading',
    });
  }

  showSummary(
    doc: Document,
    locale: AppLocale,
    dir: 'ltr' | 'rtl',
    title: string,
    summary: string,
  ): void {
    this.show(doc, {
      locale,
      dir,
      title,
      bodyHtml: toHtmlParagraphs(summary),
      status: 'ready',
    });
  }

  showError(doc: Document, locale: AppLocale, dir: 'ltr' | 'rtl', title: string, message: string): void {
    this.show(doc, {
      locale,
      dir,
      title,
      bodyHtml: `<p>${escapeHtml(message)}</p>`,
      status: 'error',
    });
  }

  close(): void {
    this.host?.remove();
    this.host = null;
  }
}
