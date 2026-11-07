import { HOST_STYLE_ATTR } from '@/core/constants';

const STYLE_ID = 'Dastresa-speech-highlight-style';
const HIGHLIGHT_NAME = 'dastresa-speech';
const BLOCK_SELECTOR = 'p, li, h1, h2, h3, h4, blockquote, td, th, figcaption, pre, dt, dd';

function isExtensionUi(el: Element): boolean {
  if (
    el.closest(`[${HOST_STYLE_ATTR}], #Dastresa-toolbar-host, #Dastresa-root, [id^="Dastresa"]`)
  ) {
    return true;
  }
  return false;
}

/** Inject once — cyan active line matching brand accent. */
export function ensureSpeechHighlightStyles(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.setAttribute(HOST_STYLE_ATTR, 'speech');
  style.textContent = `
    [data-Dastresa-speech="active"] {
      outline: 3px solid #38bdf8 !important;
      outline-offset: 4px !important;
      background-color: rgba(56, 189, 248, 0.22) !important;
      border-radius: 8px;
      box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.12);
      transition: background-color 120ms ease, outline-color 120ms ease;
    }
    ::highlight(${HIGHLIGHT_NAME}) {
      background-color: rgba(56, 189, 248, 0.4);
      color: inherit;
    }
    @media (prefers-reduced-motion: reduce) {
      [data-Dastresa-speech="active"] { transition: none !important; }
    }
  `;
  doc.documentElement.appendChild(style);
}

export function clearSpeechHighlight(doc: Document): void {
  doc.querySelectorAll('[data-Dastresa-speech="active"]').forEach((el) => {
    el.removeAttribute('data-Dastresa-speech');
  });
  try {
    const highlights = doc.defaultView?.CSS?.highlights;
    highlights?.delete(HIGHLIGHT_NAME);
  } catch {
    // Highlight API unavailable
  }
}

export function removeSpeechHighlightStyles(doc: Document): void {
  clearSpeechHighlight(doc);
  doc.getElementById(STYLE_ID)?.remove();
}

/**
 * Mark and scroll to the block (and precise text span when possible)
 * that matches the spoken chunk.
 */
export function highlightSpeechText(
  doc: Document,
  text: string,
  win: Window = doc.defaultView ?? window,
): HTMLElement | null {
  clearSpeechHighlight(doc);
  const needle = text.replace(/\s+/g, ' ').trim();
  if (!needle) return null;

  const probe = needle.slice(0, Math.min(64, needle.length));
  const nodes = Array.from(doc.querySelectorAll(BLOCK_SELECTOR));
  let match: HTMLElement | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const node of nodes) {
    if (!(node instanceof HTMLElement) || isExtensionUi(node)) continue;
    const content = (node.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (!content || content.length < 2) continue;
    const idx = content.indexOf(probe);
    if (idx < 0) continue;
    // Prefer the tightest matching block.
    const score = (idx === 0 ? 200 : 0) - content.length;
    if (score > bestScore) {
      bestScore = score;
      match = node;
    }
  }

  if (!match) return null;

  match.setAttribute('data-Dastresa-speech', 'active');
  highlightExactRange(doc, match, probe);

  if (typeof match.scrollIntoView === 'function') {
    const reduce = win.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    match.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  }
  return match;
}

function highlightExactRange(doc: Document, root: HTMLElement, needle: string): void {
  const CSSApi = doc.defaultView?.CSS;
  if (!CSSApi?.highlights || typeof Highlight === 'undefined') return;

  const pieces: Array<{ node: Text; start: number; end: number }> = [];
  let full = '';
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    const textNode = current as Text;
    const value = textNode.nodeValue ?? '';
    pieces.push({ node: textNode, start: full.length, end: full.length + value.length });
    full += value;
    current = walker.nextNode();
  }

  const idx = full.indexOf(needle);
  if (idx < 0) return;
  const end = Math.min(
    full.length,
    idx + Math.max(needle.length, Math.min(120, full.length - idx)),
  );

  const startPoint = pointAt(pieces, idx);
  const endPoint = pointAt(pieces, end);
  if (!startPoint || !endPoint) return;

  try {
    const range = doc.createRange();
    range.setStart(startPoint.node, startPoint.offset);
    range.setEnd(endPoint.node, endPoint.offset);
    CSSApi.highlights.set(HIGHLIGHT_NAME, new Highlight(range));
  } catch {
    // Corrupt DOM ranges are ignored; block outline still shows.
  }
}

function pointAt(
  pieces: Array<{ node: Text; start: number; end: number }>,
  index: number,
): { node: Text; offset: number } | null {
  for (const piece of pieces) {
    if (index >= piece.start && index <= piece.end) {
      return { node: piece.node, offset: index - piece.start };
    }
  }
  const last = pieces[pieces.length - 1];
  if (!last) return null;
  return { node: last.node, offset: last.node.nodeValue?.length ?? 0 };
}
