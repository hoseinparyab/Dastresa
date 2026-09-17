import type {
  DomSnapshot,
  FeatureContext,
  IDomAnalyzer,
  IFeature,
  ISemanticPageAnalyzer,
} from '@/core/contracts';
import { EVENTS, FEATURE_IDS } from '@/core/constants';
import {
  analyzeFormsOnly,
  analyzePage,
  classifyPage,
  type FormAnalysisResult,
  type PageStructure,
  type PageTypeResult,
} from '@/core/semantics';
import { debounce, safeQueryAll } from '@/core/utils';

export class DomAnalyzerService implements IDomAnalyzer, ISemanticPageAnalyzer {
  private cache: PageStructure | null = null;
  private cacheUrl = '';

  analyze(doc: Document = document): DomSnapshot {
    const structure = this.analyzeStructure(doc);
    return {
      title: structure.title,
      lang: structure.lang,
      paragraphCount: structure.paragraphCount,
      imageCount: structure.imageCount,
      ready: this.isReady(doc),
      textLength: structure.textLength,
    };
  }

  analyzeStructure(doc: Document = document): PageStructure {
    const url = doc.URL || doc.location?.href || '';
    if (this.cache && this.cacheUrl === url && Date.now() - this.cache.analyzedAt < 1500) {
      return this.cache;
    }
    const structure = analyzePage(doc);
    this.cache = structure;
    this.cacheUrl = url;
    return structure;
  }

  detectType(doc: Document = document): PageTypeResult {
    return classifyPage(this.analyzeStructure(doc));
  }

  analyzeForms(doc: Document = document): FormAnalysisResult {
    return analyzeFormsOnly(doc);
  }

  getCachedStructure(): PageStructure | null {
    return this.cache;
  }

  invalidateCache(): void {
    this.cache = null;
    this.cacheUrl = '';
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
  readonly version = '1.2.0';
  private enabled = true;
  private observer?: MutationObserver;
  private service = new DomAnalyzerService();
  private ctx?: FeatureContext;

  initialize(ctx: FeatureContext): void {
    this.ctx = ctx;
    const ready = this.service.isReady(ctx.document);
    ctx.bus.emit(EVENTS.DOM_READY, { ready });

    const runAnalysis = debounce(() => {
      if (!this.enabled || !this.ctx) return;
      this.service.invalidateCache();
      const structure = this.service.analyzeStructure(this.ctx.document);
      const pageType = classifyPage(structure);
      const forms = analyzeFormsOnly(this.ctx.document);
      this.ctx.bus.emit(EVENTS.PAGE_ANALYZED, { structure });
      this.ctx.bus.emit(EVENTS.PAGE_TYPE_DETECTED, { result: pageType });
      this.ctx.bus.emit(EVENTS.FORM_ANALYZED, { result: forms });
      this.ctx.bus.emit(EVENTS.DOM_CHANGED, { reason: 'mutation' });
    }, 400);

    // Initial pass once DOM is ready
    if (ready) runAnalysis();

    this.observer = new MutationObserver(runAnalysis);
    if (ctx.document.body) {
      this.observer.observe(ctx.document.body, {
        childList: true,
        subtree: true,
        characterData: false,
      });
    }
  }

  dispose(): void {
    this.observer?.disconnect();
    this.enabled = false;
    this.service.invalidateCache();
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
