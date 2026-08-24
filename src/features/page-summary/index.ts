import type { FeatureContext, IFeature } from '@/core/contracts';
import { EVENTS, FEATURE_IDS, STORAGE_KEYS } from '@/core/constants';
import { parseSettings } from '@/core/settings';
import { ReaderModeService } from '@/features/reader-mode';
import { SummaryOverlay } from '@/features/page-summary/overlay';
import type { AppLocale } from '@/shared/i18n/messages';
import { t } from '@/shared/i18n/messages';

type SummarizeResponse =
  | { ok: true; summary: string }
  | { ok: false; error: string; code?: string };

export class PageSummaryFeature implements IFeature {
  readonly id = FEATURE_IDS.PAGE_SUMMARY;
  readonly name = 'Page Summary';
  readonly version = '0.1.0';
  private enabled = true;
  private ctx?: FeatureContext;
  private unsubs: Array<() => void> = [];
  private overlay = new SummaryOverlay();
  private reader = new ReaderModeService();
  private busy = false;

  initialize(ctx: FeatureContext): void {
    this.ctx = ctx;
    this.unsubs.push(
      ctx.bus.on(EVENTS.TOOLBAR_COMMAND, ({ command }) => {
        if (command === 'summary') void this.runSummary();
      }),
    );
  }

  private async localeDir(): Promise<{ locale: AppLocale; dir: 'ltr' | 'rtl' }> {
    if (!this.ctx) return { locale: 'fa', dir: 'rtl' };
    const raw = await this.ctx.storage.get<unknown>(STORAGE_KEYS.SETTINGS);
    const settings = parseSettings(raw);
    return {
      locale: settings.locale === 'en' ? 'en' : 'fa',
      dir: settings.dir === 'ltr' ? 'ltr' : 'rtl',
    };
  }

  private async runSummary(): Promise<void> {
    if (!this.ctx || this.busy || !this.enabled) return;
    this.busy = true;
    // Immediate feedback before any async work (storage / extract / network).
    this.ctx.bus.emit(EVENTS.SUMMARY_STARTED, undefined);
    this.overlay.showLoading(this.ctx.document, 'fa', 'rtl', this.ctx.document.title || '');

    try {
      const { locale, dir } = await this.localeDir();
      const content = this.reader.extract(this.ctx.document);
      this.overlay.showLoading(this.ctx.document, locale, dir, content.title);

      const response = (await chrome.runtime.sendMessage({
        type: 'dastresa-summarize',
        title: content.title,
        text: content.text,
        locale,
      })) as SummarizeResponse | undefined;

      if (chrome.runtime.lastError) {
        throw new Error(chrome.runtime.lastError.message || t(locale, 'summaryFailed'));
      }

      if (!response?.ok) {
        const code = response && 'code' in response ? response.code : undefined;
        const message =
          code === 'missing_api_key'
            ? t(locale, 'summaryNeedKey')
            : (response && 'error' in response ? response.error : null) ||
              t(locale, 'summaryFailed');
        this.overlay.showError(this.ctx.document, locale, dir, content.title, message);
        this.ctx.bus.emit(EVENTS.SUMMARY_FAILED, { message });
        return;
      }

      this.overlay.showSummary(this.ctx.document, locale, dir, content.title, response.summary);
      this.ctx.bus.emit(EVENTS.SUMMARY_READY, {
        summary: response.summary,
        title: content.title,
      });
    } catch (error) {
      const { locale, dir } = await this.localeDir().catch(() => ({
        locale: 'fa' as const,
        dir: 'rtl' as const,
      }));
      const message = error instanceof Error ? error.message : t(locale, 'summaryFailed');
      this.overlay.showError(
        this.ctx.document,
        locale,
        dir,
        this.ctx.document.title || '',
        message,
      );
      this.ctx.bus.emit(EVENTS.SUMMARY_FAILED, { message });
    } finally {
      this.busy = false;
    }
  }

  dispose(): void {
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    this.overlay.close();
    this.enabled = false;
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
    this.overlay.close();
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const feature = new PageSummaryFeature();
export default feature;
