/** Minimum characters before a selection is treated as readable content. */
export const MIN_SELECTION_CHARS = 2;

/**
 * Split a user text selection into speakable paragraphs.
 * Prefers blank-line breaks; falls back to a single normalized block.
 */
export function selectionToParagraphs(text: string): string[] {
  const clean = text.replace(/\r\n/g, '\n').trim();
  if (!clean) return [];

  const byBlank = clean
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  if (byBlank.length > 1) return byBlank;

  return [clean.replace(/\s+/g, ' ').trim()].filter(Boolean);
}

/**
 * Caches page text selection so toolbar clicks (which collapse the selection)
 * still can read the last meaningful range the user highlighted.
 */
export class SelectionCapture {
  private cached = '';
  private listening = false;
  private readonly onSave = (): void => {
    const sel = this.doc.getSelection?.() ?? this.win.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    // Ignore selections that live entirely inside our Shadow DOM hosts.
    const anchor = sel.anchorNode;
    if (anchor && this.isInsideExtensionUi(anchor)) return;
    const text = sel.toString().replace(/\s+/g, ' ').trim();
    if (text.length >= MIN_SELECTION_CHARS) this.cached = text;
  };

  /** Plain page click (not a drag-select) clears the cached range so "read" returns to full page. */
  private readonly onPageClick = (event: MouseEvent): void => {
    const target = event.target;
    if (target instanceof Node && this.isInsideExtensionUi(target)) return;
    queueMicrotask(() => {
      const sel = this.doc.getSelection?.() ?? this.win.getSelection();
      if (sel && !sel.isCollapsed) return;
      this.cached = '';
    });
  };

  constructor(
    private readonly doc: Document,
    private readonly win: Window = doc.defaultView ?? window,
  ) {}

  start(): void {
    if (this.listening) return;
    this.doc.addEventListener('mouseup', this.onSave, true);
    this.doc.addEventListener('keyup', this.onSave, true);
    this.doc.addEventListener('selectionchange', this.onSave);
    this.doc.addEventListener('click', this.onPageClick, true);
    this.listening = true;
  }

  stop(): void {
    if (!this.listening) return;
    this.doc.removeEventListener('mouseup', this.onSave, true);
    this.doc.removeEventListener('keyup', this.onSave, true);
    this.doc.removeEventListener('selectionchange', this.onSave);
    this.doc.removeEventListener('click', this.onPageClick, true);
    this.listening = false;
  }

  /** Current cached selection text (may outlive a collapsed DOM selection). */
  peek(): string {
    return this.cached;
  }

  /** Paragraphs from the cache; empty when nothing useful was selected. */
  paragraphs(): string[] {
    return selectionToParagraphs(this.cached);
  }

  clear(): void {
    this.cached = '';
  }

  private isInsideExtensionUi(node: Node): boolean {
    const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
    if (!el) return false;
    if (el.closest?.('[data-dastresa-root], #dastresa-root, [id^="dastresa"]')) return true;
    // Walk into shadow hosts if needed.
    let root: Node | null = el;
    while (root) {
      const parent: Node | null = root.parentNode;
      if (parent instanceof ShadowRoot) {
        const host: Element = parent.host;
        const hostId = host.id?.toLowerCase() ?? '';
        if (hostId.includes('dastresa') || host.hasAttribute('data-dastresa-root')) {
          return true;
        }
        root = host;
        continue;
      }
      root = parent;
    }
    return false;
  }
}
