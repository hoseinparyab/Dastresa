import { describe, expect, it } from 'vitest';
import { collectArticleParagraphs } from '@/features/text-to-speech/page-text';

describe('collectArticleParagraphs', () => {
  it('reads only the main article and skips sidebar copy', () => {
    document.body.innerHTML = `
      <aside>
        <p>جهت بهره‌مندی و دسترسی به امکانات ویژه عضو ویژه شوید و این جمله طولانی است</p>
      </aside>
      <article>
        <h1>عنوان مقاله اصلی برای تست خواندن</h1>
        <p>این بند اول مقاله است و باید خوانده شود چون داخل تگ article قرار دارد</p>
        <p>این بند دوم مقاله هم باید در لیست خواندن باشد و به اندازه کافی بلند است</p>
      </article>
      <div class="sidebar">
        <p>قمار یک تریلیون دلاری آنتروپیک که در سایدبار آمده نباید خوانده شود اینجا</p>
      </div>
    `;

    const parts = collectArticleParagraphs(document);
    expect(parts.some((p) => p.includes('بند اول مقاله'))).toBe(true);
    expect(parts.some((p) => p.includes('عضو ویژه'))).toBe(false);
    expect(parts.some((p) => p.includes('آنتروپیک'))).toBe(false);
  });

  it('returns empty when no article exists', () => {
    document.body.innerHTML = `<main><p>متنی بدون تگ مقاله که نباید به‌صورت پیش‌فرض خوانده شود</p></main>`;
    expect(collectArticleParagraphs(document)).toEqual([]);
  });
});
