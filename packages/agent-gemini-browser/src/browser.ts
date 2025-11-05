/**
 * Browser operations with Playwright integration
 * Side effects isolated - pure functions for logic, imperative shell for I/O
 */

import {
  type Browser,
  type BrowserContext,
  chromium,
  type Page,
} from "playwright";

// Re-export types for convenience
export type { Browser, BrowserContext, Page } from "playwright";

/**
 * Browser action types
 */
export type BrowserAction =
  | {
      type: "navigate";
      url: string;
      waitUntil?: "load" | "domcontentloaded" | "networkidle";
    }
  | {
      type: "click";
      selector: string;
      button?: "left" | "right" | "middle";
      clickCount?: number;
    }
  | { type: "type"; selector: string; text: string }
  | { type: "wait"; selector: string; timeout?: number }
  | { type: "screenshot"; path?: string };

/**
 * Browser state (immutable)
 */
export type BrowserState = {
  url: string | null;
  title: string | null;
  ready: boolean;
};

/**
 * Pure function to validate URL
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Pure function to validate selector
 */
export function validateSelector(selector: string): boolean {
  // Basic validation - non-empty, no dangerous patterns
  if (!selector || selector.trim().length === 0) {
    return false;
  }
  // Additional validation can be added here
  return true;
}

/**
 * Side effect: Launch browser
 */
export async function launchBrowser(): Promise<Browser> {
  return await chromium.launch({
    headless: true,
  });
}

/**
 * Side effect: Create browser context
 */
export async function createContext(browser: Browser): Promise<BrowserContext> {
  return await browser.newContext();
}

/**
 * Side effect: Create new page
 */
export async function createPage(context: BrowserContext): Promise<Page> {
  return await context.newPage();
}

/**
 * Side effect: Navigate to URL
 */
export async function navigateToUrl(
  page: Page,
  url: string,
  waitUntil: "load" | "domcontentloaded" | "networkidle" = "load"
): Promise<void> {
  if (!validateUrl(url)) {
    throw new Error(`Invalid URL: ${url}`);
  }
  await page.goto(url, { waitUntil });
}

/**
 * Side effect: Click element
 */
export async function clickElement(
  page: Page,
  selector: string,
  button: "left" | "right" | "middle" = "left",
  clickCount = 1
): Promise<void> {
  if (!validateSelector(selector)) {
    throw new Error(`Invalid selector: ${selector}`);
  }
  await page.click(selector, { button, clickCount });
}

/**
 * Side effect: Type text
 */
export async function typeText(
  page: Page,
  selector: string,
  text: string
): Promise<void> {
  if (!validateSelector(selector)) {
    throw new Error(`Invalid selector: ${selector}`);
  }
  await page.fill(selector, text);
}

/**
 * Side effect: Wait for selector
 */
export async function waitForSelector(
  page: Page,
  selector: string,
  timeout = 30_000
): Promise<void> {
  if (!validateSelector(selector)) {
    throw new Error(`Invalid selector: ${selector}`);
  }
  await page.waitForSelector(selector, { timeout });
}

/**
 * Side effect: Take screenshot
 */
export async function takeScreenshot(
  page: Page,
  path?: string
): Promise<Buffer> {
  return await page.screenshot({ path, fullPage: true });
}

/**
 * Side effect: Get page state
 */
export async function getPageState(page: Page): Promise<BrowserState> {
  return {
    url: page.url(),
    title: await page.title(),
    ready: true,
  };
}

/**
 * Side effect: Close browser
 */
export async function closeBrowser(browser: Browser): Promise<void> {
  await browser.close();
}
