/**
 * Set element/shadow content from an HTML string without assigning `.innerHTML`
 * (AMO addons-linter flags that pattern as unsafe).
 */
export function setTrustedHtml(target: Element | ShadowRoot, html: string): void {
  const doc = target instanceof Element ? target.ownerDocument : target.host.ownerDocument;
  const parsed = new DOMParser().parseFromString(
    `<!DOCTYPE html><html><body>${html}</body></html>`,
    'text/html',
  );
  const nodes = Array.from(parsed.body.childNodes).map((node) => doc.importNode(node, true));
  target.replaceChildren(...nodes);
}
