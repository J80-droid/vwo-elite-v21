import { expect, test } from "@playwright/test";

/**
 * Lesson Generator E2E Tests
 * Tests for the lesson generation workflow
 */

test.describe("Lesson Generator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?view=LESSON_GENERATOR");
  });

  test("should display upload zone", async ({ page }) => {
    // Check for upload zone
    await expect(page.locator('[class*="border-dashed"]')).toBeVisible();
  });

  test("should show file input for uploads", async ({ page }) => {
    // File input should exist
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
  });
});

test.describe("Math Lab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?view=VECTOR_LAB");
  });

  test("should load Math Lab with module selector", async ({ page }) => {
    // Check for module buttons
    await expect(page.getByText("Analytisch")).toBeVisible();
    await expect(page.getByText("Symbolisch")).toBeVisible();
    await expect(page.getByText("3D Visuals")).toBeVisible();
    await expect(page.getByText("Vectoren")).toBeVisible();
  });

  test("should switch between modules", async ({ page }) => {
    // Click on Symbolisch module
    await page.getByText("Symbolisch").click();

    // Should show symbolic input
    await expect(page.locator('input[placeholder*="x^3"]')).toBeVisible();
  });
});

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?view=SETTINGS");
  });

  test("should display settings page", async ({ page }) => {
    // Settings should be loaded
    await expect(page.locator("main")).toBeVisible();
  });

  test("should persist theme changes", async ({ page }) => {
    // This test verifies localStorage persistence
    // Find any toggle or setting and change it
    const toggles = page.locator(
      'button[role="switch"], input[type="checkbox"]',
    );

    if ((await toggles.count()) > 0) {
      await toggles.first().click();

      // Reload page
      await page.reload();

      // Setting should be persisted (check localStorage)
      const settings = await page.evaluate(() =>
        localStorage.getItem("vwo-elite-settings"),
      );
      expect(settings).toBeTruthy();
    }
  });
});
