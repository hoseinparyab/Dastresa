import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = path.join(__dirname, '../fixtures/pages/article.html');

test.describe('fixture page smoke', () => {
  test('fixture article is readable', async ({ page }) => {
    await page.goto(`file://${fixture}`);
    await expect(page.getByRole('heading', { name: 'Dastresa Sample Article' })).toBeVisible();
    await expect(page.getByText('This is a long enough paragraph')).toBeVisible();
  });
});
