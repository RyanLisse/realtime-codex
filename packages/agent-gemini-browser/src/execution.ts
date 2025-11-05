/**
 * Browser execution layer with side effect isolation
 * Handles Playwright calls and browser automation
 */

import type {
  Browser,
  BrowserAction,
  BrowserContext,
  Page,
} from "./browser.js";
import {
  clickElement,
  closeBrowser,
  createContext,
  createPage,
  getPageState,
  launchBrowser,
  navigateToUrl,
  takeScreenshot,
  typeText,
  waitForSelector,
} from "./browser.js";

/**
 * Browser execution result
 */
export type ExecutionResult = {
  success: boolean;
  action: BrowserAction;
  result?: unknown;
  error?: string;
  state?: {
    url: string | null;
    title: string | null;
  };
};

/**
 * Browser execution context
 */
export type ExecutionContext = {
  browser: Browser | null;
  context: BrowserContext | null;
  page: Page | null;
};

/**
 * Create new execution context
 */
export function createExecutionContext(): ExecutionContext {
  return {
    browser: null,
    context: null,
    page: null,
  };
}

/**
 * Initialize browser for execution
 */
export async function initializeBrowser(
  ctx: ExecutionContext
): Promise<ExecutionContext> {
  const browser = await launchBrowser();
  const context = await createContext(browser);
  const page = await createPage(context);

  return {
    ...ctx,
    browser,
    context,
    page,
  };
}

/**
 * Execute browser action
 */
export async function executeBrowserAction(
  action: BrowserAction,
  ctx?: ExecutionContext
): Promise<ExecutionResult> {
  let executionContext = ctx ?? createExecutionContext();

  try {
    // Initialize browser if needed
    if (!executionContext.browser) {
      executionContext = await initializeBrowser(executionContext);
    }

    if (!executionContext.page) {
      throw new Error("Page not initialized");
    }

    const page = executionContext.page;
    let result: unknown;

    // Execute action based on type
    switch (action.type) {
      case "navigate":
        await navigateToUrl(page, action.url, action.waitUntil);
        result = { url: action.url };
        break;

      case "click":
        await clickElement(
          page,
          action.selector,
          action.button,
          action.clickCount
        );
        result = { clicked: true, selector: action.selector };
        break;

      case "type":
        await typeText(page, action.selector, action.text);
        result = { typed: true, selector: action.selector };
        break;

      case "wait":
        await waitForSelector(page, action.selector, action.timeout);
        result = { waited: true, selector: action.selector };
        break;

      case "screenshot":
        result = await takeScreenshot(page, action.path);
        break;

      default:
        throw new Error(
          `Unknown action type: ${(action as BrowserAction).type}`
        );
    }

    // Get current page state
    const state = await getPageState(page);

    return {
      success: true,
      action,
      result,
      state: {
        url: state.url,
        title: state.title,
      },
    };
  } catch (error) {
    return {
      success: false,
      action,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Cleanup browser resources
 */
export async function cleanupBrowser(ctx: ExecutionContext): Promise<void> {
  if (ctx.browser) {
    await closeBrowser(ctx.browser);
  }
}
