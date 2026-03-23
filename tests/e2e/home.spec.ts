import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('loads successfully and shows app content', async ({ page }) => {
    await page.goto('/');
    // The app should load without a 404 or blank page
    await expect(page).not.toHaveTitle('404');
    // Check the page renders some content
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('has expected meta charset', async ({ page }) => {
    await page.goto('/');
    const charset = await page.evaluate(() =>
      document.querySelector('meta[charset]')?.getAttribute('charset')
    );
    expect(charset).toBe('UTF-8');
  });
});
