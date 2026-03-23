import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("should load without errors", async ({ page }) => {
    await page.goto("/");
    await expect(page).not.toHaveURL(/error/);
    // The page should render some content
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("should have a document title", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});
