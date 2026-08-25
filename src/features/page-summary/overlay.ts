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

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to execCommand
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
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
      /** Plain text used by the Copy button (ready state only). */
      copyText?: string;
    },
  ): void {
    this.close();
    this.host = doc.createElement('div');
    this.host.id = 'Dastresa-summary-host';
    this.host.setAttribute('data-Dastresa', 'summary');
    Object.assign(this.host.style, {
      position: 'fixed',
      inset: '0',
      // Above toolbar so loading/result is never hidden behind it.
      zIndex: '2147483647',
      background: '#020617',
      overflow: 'auto',
      pointerEvents: 'auto',
    });

    const shadow = this.host.attachShadow({ mode: 'open' });
    const wrap = doc.createElement('div');
    const showCopy = opts.status === 'ready' && Boolean(opts.copyText?.trim());
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
        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: flex-end;
          position: sticky;
          top: 0;
          margin-bottom: 0.75rem;
          padding-block: 0.25rem;
          background: #020617;
        }
        h1 { font-family: Fraunces, Georgia, serif; font-size: 1.75rem; margin: 0 0 0.5rem; }
        .hint { color: #94a3b8; margin: 0 0 1.5rem; font-size: 0.95rem; }
        .status {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #7dd3fc;
          margin: 1.5rem 0;
          font-weight: 700;
        }
        .spinner {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          border: 3px solid rgba(125, 211, 252, 0.25);
          border-top-color: #38bdf8;
          animation: dastresa-spin 0.8s linear infinite;
          flex-shrink: 0;
        }
        @keyframes dastresa-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .spinner { animation: none; border-top-color: #38bdf8; }
        }
        .error { color: #fecaca; }
        .action-btn {
          min-width: 48px; min-height: 48px;
          padding: 0 14px;
          border: 0; border-radius: 10px;
          background: #1e293b; color: #f8fafc; cursor: pointer; font-size: 1rem;
          font-family: inherit;
        }
        .action-btn.copy {
          background: rgba(56, 189, 248, 0.18);
          color: #e0f2fe;
          border: 1px solid rgba(56, 189, 248, 0.45);
        }
        .action-btn.copy.done {
          background: rgba(34, 197, 94, 0.2);
          border-color: rgba(74, 222, 128, 0.55);
          color: #bbf7d0;
        }
        .action-btn:focus-visible { outline: 3px solid #38bdf8; outline-offset: 2px; }
        p { margin: 0 0 1rem; }
      </style>
      <div class="wrap" dir="${opts.dir}" lang="${opts.locale}">
        <div class="actions">
          ${
            showCopy
              ? `<button type="button" class="action-btn copy" aria-label="${escapeHtml(t(opts.locale, 'summaryCopy'))}">${escapeHtml(t(opts.locale, 'summaryCopy'))}</button>`
              : ''
          }
          <button type="button" class="action-btn close" aria-label="${escapeHtml(t(opts.locale, 'summaryClose'))}">${escapeHtml(t(opts.locale, 'summaryClose'))}</button>
        </div>
        <h1>${escapeHtml(t(opts.locale, 'summaryTitle'))}</h1>
        <p class="hint">${escapeHtml(opts.title)}</p>
        <p class="hint">${escapeHtml(t(opts.locale, 'summaryPrivacyHint'))}</p>
        ${
          opts.status === 'loading'
            ? `<p class="status" role="status" aria-live="polite"><span class="spinner" aria-hidden="true"></span><span>${escapeHtml(t(opts.locale, 'summaryLoading'))}</span></p>`
            : ''
        }
        ${
          opts.status === 'error'
            ? `<div class="error" role="alert">${opts.bodyHtml}</div>`
            : opts.status === 'ready'
              ? `<div class="article">${opts.bodyHtml}</div>`
              : ''
        }
      </div>
    `;
    shadow.appendChild(wrap);
    wrap.querySelector('.close')?.addEventListener('click', () => this.close());

    const copyBtn = wrap.querySelector<HTMLButtonElement>('.copy');
    const plain = opts.copyText?.trim() ?? '';
    if (copyBtn && plain) {
      copyBtn.addEventListener('click', () => {
        void (async () => {
          const ok = await copyText(plain);
          if (!ok) return;
          copyBtn.textContent = t(opts.locale, 'summaryCopied');
          copyBtn.classList.add('done');
          copyBtn.setAttribute('aria-label', t(opts.locale, 'summaryCopied'));
          window.setTimeout(() => {
            if (!copyBtn.isConnected) return;
            copyBtn.textContent = t(opts.locale, 'summaryCopy');
            copyBtn.classList.remove('done');
            copyBtn.setAttribute('aria-label', t(opts.locale, 'summaryCopy'));
          }, 1600);
        })();
      });
    }

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
      copyText: summary,
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
