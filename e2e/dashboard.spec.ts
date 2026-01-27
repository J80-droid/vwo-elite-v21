import { expect, test } from "@playwright/test";

/**
 * Dashboard E2E Tests
 * Tests for the main dashboard and navigation
 */

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should load dashboard successfully", async ({ page }) => {
    // Check header is visible
    await expect(page.locator("header")).toBeVisible();

    // Check logo/brand
    await expect(page.getByText("VWOElite")).toBeVisible();

    // Check dashboard title
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("should display navigation sidebar on desktop", async ({ page }) => {
    // Check sidebar exists on desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Sidebar should be visible
    await expect(page.locator('[class*="sidebar"]')).toBeVisible();
  });

  test("should show mobile menu button on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Mobile menu button should be visible
    await expect(
      page.locator("button").filter({ has: page.locator("svg") }),
    ).toBeVisible();
  });

  test("should navigate to settings", async ({ page }) => {
    // Click settings button
    await page.click('button[class*="rounded-full"]');

    // Should navigate to settings view
    await expect(page.url()).toContain("view=SETTINGS");
  });

  test("should change language", async ({ page }) => {
    // Find language selector
    const languageSelect = page.locator("select");

    // Change to English
    await languageSelect.selectOption("en");

    // Verify UI updates (check for English text)
    await page.waitForTimeout(500);

    // The welcome message should be in English
    await expect(page.getByText(/ready|let's/i)).toBeVisible();
  });
});

test.describe("Timer", () => {
  test("should toggle timer on click", async ({ page }) => {
    await page.goto("/");

    // Find timer button (contains timer display)
    const timerButton = page
      .locator("button")
      .filter({ hasText: /\d{2}:\d{2}/ });

    // Click to start timer
    await timerButton.click();

    // Reset button should appear
    await expect(page.getByText("Reset")).toBeVisible();
  });
});
