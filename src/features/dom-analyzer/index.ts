import type { DomSnapshot, FeatureContext, IDomAnalyzer, IFeature } from '@/core/contracts';
import { EVENTS, FEATURE_IDS } from '@/core/constants';
import { debounce, safeQueryAll } from '@/core/utils';

export class DomAnalyzerService implements IDomAnalyzer {
  analyze(doc: Document = document): DomSnapshot {
    const paragraphs = safeQueryAll(doc, 'p, li, article p');
    const images = safeQueryAll(doc, 'img');
    const text = doc.body?.innerText ?? '';
    return {
      title: doc.title || '',
      lang: doc.documentElement.lang || 'en',
      paragraphCount: paragraphs.length,
      imageCount: images.length,
      ready: this.isReady(doc),
      textLength: text.trim().length,
    };
  }

  findReadableRoots(doc: Document = document): HTMLElement[] {
    const candidates = safeQueryAll(
      doc,
      'article, main, [role="main"], .post-content, .entry-content, #content',
    );
    if (candidates.length > 0) return candidates;
    return doc.body ? [doc.body] : [];
  }

  isReady(doc: Document = document): boolean {
    return Boolean(doc.body) && (doc.readyState === 'interactive' || doc.readyState === 'complete');
  }
}

export class DomAnalyzerFeature implements IFeature {
  readonly id = FEATURE_IDS.DOM_ANALYZER;
  readonly name = 'DOM Analyzer';
  readonly version = '0.1.0';
  private enabled = true;
  private observer?: MutationObserver;
  private service = new DomAnalyzerService();

  initialize(ctx: FeatureContext): void {
    const ready = this.service.isReady(ctx.document);
    ctx.bus.emit(EVENTS.DOM_READY, { ready });

    const emitChanged = debounce(() => {
      if (!this.enabled) return;
      ctx.bus.emit(EVENTS.DOM_CHANGED, { reason: 'mutation' });
    }, 250);

    this.observer = new MutationObserver(emitChanged);
    if (ctx.document.body) {
      this.observer.observe(ctx.document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }
  }

  dispose(): void {
    this.observer?.disconnect();
    this.enabled = false;
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getService(): DomAnalyzerService {
    return this.service;
  }
}

export const feature = new DomAnalyzerFeature();
export default feature;
