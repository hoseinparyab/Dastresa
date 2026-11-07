const SKIP_ANCESTOR =
  'aside, nav, footer, [role="complementary"], [role="navigation"], [data-Dastresa], #Dastresa-toolbar-host, #Dastresa-root';

/**
 * Default read target: paragraphs inside the main <article> only.
 * Sidebars / promo / chrome are ignored unless the user selects them.
 */
export function collectArticleParagraphs(doc: Document): string[] {
  const articles = Array.from(doc.querySelectorAll('article')).filter((el) => {
    if (el.closest(SKIP_ANCESTOR)) return false;
    // Ignore tiny / empty shells.
    return (el.textContent ?? '').replace(/\s+/g, ' ').trim().length > 40;
  });

  if (articles.length === 0) return [];

  // Prefer the longest article body (main story vs tiny card articles).
  const root = articles.sort(
    (a, b) => (b.textContent?.length ?? 0) - (a.textContent?.length ?? 0),
  )[0]!;

  return Array.from(root.querySelectorAll('p, h1, h2, h3, li'))
    .filter((el) => !el.closest('aside, nav, footer, [role="complementary"]'))
    .map((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim())
    .filter((t) => t.length > 20);
}
