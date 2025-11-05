/**
 * Example E2E test for workflow submission
 * This file demonstrates end-to-end testing patterns with Playwright
 */

import { test, expect } from "@playwright/test";

test.describe("Workflow E2E Test", () => {
  test("should open workflow page and submit task", async ({ page }) => {
    // Navigate to workflow page
    await page.goto("/");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Verify page loaded correctly
    await expect(page).toHaveTitle(/Realtime Codex/i);

    // Example: Find and interact with workflow form
    // This is a template - adjust based on actual workflow page structure
    const workflowForm = page.locator('form[data-testid="workflow-form"]').or(
      page.locator('form')
    ).first();

    if (await workflowForm.isVisible()) {
      // Fill in task description
      const taskInput = workflowForm.locator('input[type="text"], textarea').first();
      if (await taskInput.isVisible()) {
        await taskInput.fill("Test workflow task");
      }

      // Submit form
      const submitButton = workflowForm.locator('button[type="submit"]').or(
        workflowForm.getByRole("button", { name: /submit|start|create/i })
      ).first();
      
      if (await submitButton.isVisible()) {
        await submitButton.click();
      }
    }

    // Wait for workflow to process (adjust timeout as needed)
    await page.waitForTimeout(1000);

    // Verify artifacts or workflow completion
    // This is a template - adjust based on actual workflow UI
    const successIndicator = page.locator('[data-testid="workflow-success"]').or(
      page.getByText(/completed|success|done/i)
    ).first();

    // Check if success indicator exists (optional assertion)
    if (await successIndicator.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(successIndicator).toBeVisible();
    }
  });

  test("should capture screenshot on failure", async ({ page }) => {
    // This test demonstrates failure capture
    await page.goto("/");

    // Intentionally fail to test screenshot capture
    // In real tests, remove this or adjust condition
    const shouldFail = false;
    if (shouldFail) {
      await expect(page.locator("non-existent-element")).toBeVisible();
    }
  });

  test("should handle network requests", async ({ page }) => {
    // Example: Intercept and mock network requests
    await page.route("**/api/**", async (route) => {
      const url = route.request().url();
      
      // Mock API responses
      if (url.includes("/workflow")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: "test-workflow-id", status: "completed" }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });
});


