/**
 * E2E test scaffold — Home page
 * Demonstrates how to write Playwright E2E tests for critical user flows.
 * Run with: npm run e2e
 */

import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("should load without errors", async ({ page }) => {
    await page.goto("/");
    // The page title should contain the app name
    await expect(page).toHaveTitle(/Beauty Style Pro|Style/i);
  });

  test("should display the main navigation", async ({ page }) => {
    await page.goto("/");
    // The bottom nav or top navigation should be visible
    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible();
  });

  test("should have no console errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Filter out known third-party errors
    const appErrors = errors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("ERR_BLOCKED") &&
        !e.includes("supabase") &&
        !e.includes("Failed to fetch")
    );

    expect(appErrors).toHaveLength(0);
  });

  test("should be responsive on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Authentication", () => {
  test("should show auth page when not logged in", async ({ page }) => {
    await page.goto("/profile");
    // Either redirected to auth or auth elements are visible
    const url = page.url();
    const hasAuthContent =
      url.includes("/auth") || (await page.locator("text=/Accedi|Login|Sign in/i").count()) > 0;
    expect(hasAuthContent).toBe(true);
  });
});
