import type { PageStructure, PageType, PageTypeResult } from './types';

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function pathOf(url: string): string {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Deterministic page classification — no LLM.
 * Returns confidence < 0.55 as UNKNOWN when signals are weak.
 */
export function detectPageType(structure: PageStructure): PageTypeResult {
  const signals: string[] = [];
  const scores: Partial<Record<PageType, number>> = {};
  const bump = (type: PageType, amount: number, signal: string) => {
    scores[type] = (scores[type] ?? 0) + amount;
    signals.push(signal);
  };

  const host = hostOf(structure.url);
  const path = pathOf(structure.url);
  const fieldCount = structure.inputs.length;
  const formCount = structure.forms.length;
  const linkCount = structure.links.length;
  const headingCount = structure.headingFlat.length;
  const hasMain = Boolean(structure.landmarks.main);
  const hasArticle = structure.articles.length > 0;
  const para = structure.paragraphCount;
  const text = structure.textLength;

  // URL / host hints
  if (/search|q=|query=/.test(path) || /google\.|bing\.|duckduckgo\.|yahoo\./.test(host)) {
    bump('SEARCH', 0.45, 'search URL or host pattern');
  }
  if (/cart|checkout|product|shop|store|buy|sku/.test(path) || /amazon\.|ebay\.|digikala\.|shopify\./.test(host)) {
    bump('SHOPPING', 0.4, 'shopping URL or host pattern');
  }
  if (/login|signin|signup|register|account/.test(path)) {
    bump('FORM', 0.3, 'auth/register path pattern');
  }
  if (/gov|irs|tax/.test(path) || /\.gov(\.|$)/.test(host)) {
    bump('GOVERNMENT', 0.35, 'government URL pattern');
  }
  if (/bank|iban|payment|transfer|wallet/.test(path) || /bank|paypal|stripe/.test(host)) {
    bump('BANKING', 0.35, 'banking URL or host pattern');
  }
  if (/twitter\.|x\.com|facebook\.|instagram\.|linkedin\.|reddit\./.test(host)) {
    bump('SOCIAL', 0.45, 'social host pattern');
  }
  if (/news|blog|post|article|\d{4}\/\d{2}/.test(path)) {
    bump('NEWS', 0.2, 'news/blog path pattern');
    bump('ARTICLE', 0.15, 'article-like path pattern');
  }

  // Structure signals
  if (formCount >= 1 && fieldCount >= 3) {
    bump('FORM', 0.4 + Math.min(0.3, fieldCount * 0.04), 'form with multiple fields');
  } else if (fieldCount >= 5 && formCount === 0) {
    bump('FORM', 0.35, 'many inputs without wrapping form');
  }

  if (hasArticle) bump('ARTICLE', 0.3, 'article element detected');
  if (hasMain && para >= 4) bump('ARTICLE', 0.15, 'main landmark with paragraphs');
  if (headingCount >= 1 && para >= 5 && text > 800) {
    bump('ARTICLE', 0.25, 'high paragraph density');
  }
  if (structure.headingFlat.some((h) => h.level === 1) && para >= 3) {
    bump('ARTICLE', 0.1, 'single dominant heading pattern');
  }
  if (/news|خبر|گزارش/.test(structure.title.toLowerCase()) || para >= 8) {
    bump('NEWS', 0.15, 'news-like title or density');
  }

  if (path.endsWith('.pdf') || /docs?|manual|wiki|help|support/.test(path)) {
    bump('DOCUMENT', 0.3, 'document-like path');
  }
  if (structure.sections.length >= 4 && para >= 6) {
    bump('DOCUMENT', 0.15, 'multi-section document layout');
  }

  if (structure.buttons.filter((b) => /add to cart|خرید|buy|checkout/i.test(b.text)).length) {
    bump('SHOPPING', 0.3, 'commerce action buttons');
  }

  if (structure.landmarks.navigation.length >= 2 && linkCount > 40 && para < 3) {
    bump('SEARCH', 0.1, 'nav-heavy low-content page');
  }

  let best: PageType = 'UNKNOWN';
  let bestScore = 0;
  for (const [type, score] of Object.entries(scores) as Array<[PageType, number]>) {
    if (score > bestScore) {
      bestScore = score;
      best = type;
    }
  }

  const confidence = Math.max(0, Math.min(0.98, bestScore));
  if (confidence < 0.55) {
    return {
      type: 'UNKNOWN',
      confidence: Math.min(confidence, 0.5),
      signals: signals.length ? signals : ['insufficient structural evidence'],
    };
  }

  return { type: best, confidence, signals };
}
