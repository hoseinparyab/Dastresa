import { describe, expect, it } from 'vitest';
import { ReaderModeService } from '@/features/reader-mode';

describe('ReaderModeService', () => {
  it('falls back when readability content is thin', () => {
    document.title = 'Hello Article';
    document.body.innerHTML = `
      <main>
        <h1>Hello</h1>
        <p>${'Accessible paragraph. '.repeat(20)}</p>
      </main>
    `;
    const service = new ReaderModeService();
    const content = service.extract(document);
    expect(content.title).toBeTruthy();
    expect(content.paragraphs.length).toBeGreaterThan(0);
    expect(content.html).toContain('Accessible paragraph');
  });
});
