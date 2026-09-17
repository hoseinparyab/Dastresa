import { safeQueryAll } from '@/core/utils';
import {
  analyzeForms,
  buildHeadingTree,
  collectLandmarks,
} from './forms';
import { detectPageType } from './page-type';
import type {
  ArticleInfo,
  ButtonInfo,
  FormAnalysisResult,
  LinkInfo,
  PageStructure,
  PageTypeResult,
  SectionInfo,
} from './types';

function preview(text: string | null | undefined, max = 140): string | undefined {
  const t = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return undefined;
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function collectArticles(doc: Document): ArticleInfo[] {
  return safeQueryAll(doc, 'article').slice(0, 20).map((el) => {
    const heading = el.querySelector('h1, h2, h3');
    const paragraphs = el.querySelectorAll('p');
    return {
      title: preview(heading?.textContent, 120),
      textPreview: preview(el.textContent, 160),
      paragraphCount: paragraphs.length,
    };
  });
}

function collectLinks(doc: Document): LinkInfo[] {
  const origin = doc.location?.origin ?? '';
  return safeQueryAll(doc, 'a[href]')
    .slice(0, 80)
    .map((el) => {
      const a = el as HTMLAnchorElement;
      const href = a.href || a.getAttribute('href') || undefined;
      let external = false;
      try {
        if (href && origin) external = new URL(href, origin).origin !== origin;
      } catch {
        external = false;
      }
      return {
        text: preview(a.textContent, 60) ?? '',
        href,
        external,
      };
    })
    .filter((l) => l.text || l.href);
}

function collectButtons(doc: Document): ButtonInfo[] {
  const nodes = [
    ...safeQueryAll(doc, 'button'),
    ...safeQueryAll(doc, 'input[type="button"], input[type="submit"], input[type="reset"]'),
    ...safeQueryAll(doc, '[role="button"]'),
  ].slice(0, 60);

  return nodes.map((el) => {
    const disabled =
      (el instanceof HTMLButtonElement && el.disabled) ||
      (el instanceof HTMLInputElement && el.disabled) ||
      el.getAttribute('aria-disabled') === 'true';
    const text =
      preview(el.textContent, 60) ||
      el.getAttribute('aria-label') ||
      (el instanceof HTMLInputElement ? el.value : '') ||
      '';
    const type =
      el instanceof HTMLButtonElement
        ? el.type
        : el instanceof HTMLInputElement
          ? el.type
          : undefined;
    return { text, type, disabled };
  });
}

function collectSections(doc: Document): SectionInfo[] {
  return safeQueryAll(doc, 'section, [role="region"]').slice(0, 30).map((el) => {
    const heading = el.querySelector('h1, h2, h3, h4');
    const level = heading ? Number(heading.tagName.charAt(1)) : undefined;
    return {
      label:
        el.getAttribute('aria-label') ||
        preview(heading?.textContent, 80) ||
        undefined,
      headingLevel: Number.isFinite(level) ? level : undefined,
      textPreview: preview(el.textContent, 120),
    };
  });
}

/** Full semantic pass — targeted selectors only (no querySelectorAll('*')). */
export function analyzePage(doc: Document = document): PageStructure {
  const { tree, flat } = buildHeadingTree(doc);
  const forms = analyzeForms(doc);
  const inputs = forms.flatMap((f) => f.fields);
  const paragraphs = safeQueryAll(doc, 'p, li, article p');
  const images = safeQueryAll(doc, 'img');
  const text = doc.body?.innerText ?? '';

  return {
    url: doc.URL || doc.location?.href || '',
    title: doc.title || '',
    lang: doc.documentElement.lang || 'en',
    landmarks: collectLandmarks(doc),
    headings: tree,
    headingFlat: flat,
    articles: collectArticles(doc),
    links: collectLinks(doc),
    buttons: collectButtons(doc),
    forms,
    inputs,
    sections: collectSections(doc),
    paragraphCount: paragraphs.length,
    imageCount: images.length,
    textLength: text.trim().length,
    analyzedAt: Date.now(),
  };
}

export function analyzeFormsOnly(doc: Document = document): FormAnalysisResult {
  const forms = analyzeForms(doc);
  return {
    forms,
    fieldCount: forms.reduce((n, f) => n + f.fields.length, 0),
  };
}

export function classifyPage(structure: PageStructure): PageTypeResult {
  return detectPageType(structure);
}

export * from './types';
export { analyzeForms, buildHeadingTree, collectLandmarks } from './forms';
export { detectPageType } from './page-type';
