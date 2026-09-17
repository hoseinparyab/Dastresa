import { describe, expect, it } from 'vitest';
import {
  analyzeField,
  analyzeForms,
  analyzePage,
  buildHeadingTree,
  detectPageType,
} from '@/core/semantics';

function docFrom(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

describe('semantic analyzer', () => {
  it('detects landmarks, headings tree, and articles', () => {
    const doc = docFrom(`<!doctype html><html lang="fa"><body>
      <header>Top</header>
      <nav aria-label="Main">Nav</nav>
      <main>
        <article>
          <h1>Title</h1>
          <h2>Intro</h2>
          <p>${'paragraph '.repeat(40)}</p>
          <h3>Detail</h3>
          <p>${'more '.repeat(30)}</p>
        </article>
      </main>
      <footer>End</footer>
    </body></html>`);

    const structure = analyzePage(doc);
    expect(structure.landmarks.header).toBeTruthy();
    expect(structure.landmarks.main).toBeTruthy();
    expect(structure.landmarks.navigation.length).toBeGreaterThan(0);
    expect(structure.articles.length).toBe(1);
    expect(structure.headingFlat[0]?.level).toBe(1);
    expect(structure.headings[0]?.children[0]?.level).toBe(2);
  });

  it('builds heading tree hierarchy', () => {
    const doc = docFrom(`<h1>A</h1><h2>B</h2><h3>C</h3><h2>D</h2>`);
    const { tree, flat } = buildHeadingTree(doc);
    expect(flat.map((h) => h.text)).toEqual(['A', 'B', 'C', 'D']);
    expect(tree[0]?.children[0]?.text).toBe('B');
    expect(tree[0]?.children[0]?.children[0]?.text).toBe('C');
    expect(tree[0]?.children[1]?.text).toBe('D');
  });
});

describe('page type detection', () => {
  it('classifies article-like pages', () => {
    const doc = docFrom(`<!doctype html><html><body>
      <main><article>
        <h1>Long article</h1>
        ${Array.from({ length: 8 }, () => `<p>${'text '.repeat(50)}</p>`).join('')}
      </article></main>
    </body></html>`);
    Object.defineProperty(doc, 'URL', { value: 'https://example.com/blog/post' });
    const result = detectPageType(analyzePage(doc));
    expect(['ARTICLE', 'NEWS']).toContain(result.type);
    expect(result.confidence).toBeGreaterThanOrEqual(0.55);
    expect(result.signals.length).toBeGreaterThan(0);
  });

  it('classifies form-heavy pages', () => {
    const doc = docFrom(`<!doctype html><html><body>
      <form>
        <label for="n">Name</label><input id="n" name="n" required />
        <label for="e">Email</label><input id="e" name="e" type="email" required />
        <label for="p">Phone</label><input id="p" name="p" />
        <button type="submit">Send</button>
      </form>
    </body></html>`);
    Object.defineProperty(doc, 'URL', { value: 'https://example.com/register' });
    const result = detectPageType(analyzePage(doc));
    expect(result.type).toBe('FORM');
  });

  it('returns UNKNOWN when evidence is weak', () => {
    const doc = docFrom(`<!doctype html><html><body><p>Hi</p></body></html>`);
    Object.defineProperty(doc, 'URL', { value: 'https://example.com/' });
    const result = detectPageType(analyzePage(doc));
    expect(result.type).toBe('UNKNOWN');
  });
});

describe('form analyzer', () => {
  it('associates labels via for/id and wrapping label', () => {
    const doc = docFrom(`<form>
      <label for="code">کد ملی</label>
      <input id="code" name="nationalId" required minlength="10" />
      <label>نام <input name="firstName" /></label>
    </form>`);
    const forms = analyzeForms(doc);
    expect(forms[0]?.fields.length).toBe(2);
    const national = forms[0]?.fields.find((f) => f.name === 'nationalId');
    expect(national?.label).toContain('کد ملی');
    expect(national?.required).toBe(true);
    expect(national?.validation?.minLength).toBe(10);
    expect(forms[0]?.fields.find((f) => f.name === 'firstName')?.label).toContain('نام');
  });

  it('reads aria-label when no visible label', () => {
    const doc = docFrom(`<input aria-label="Search query" name="q" />`);
    const field = analyzeField(doc.querySelector('input')!);
    expect(field?.label).toBe('Search query');
  });
});
