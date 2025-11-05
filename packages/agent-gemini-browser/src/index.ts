/**
 * Gemini Browser Agent package exports
 */

export {
  type BrowserAction,
  type BrowserState,
  clickElement,
  closeBrowser,
  createContext,
  createPage,
  getPageState,
  launchBrowser,
  navigateToUrl,
  takeScreenshot,
  typeText,
  validateSelector,
  validateUrl,
  waitForSelector,
} from "./browser.js";
export { planBrowserAction } from "./core/planning.js";
export {
  cleanupBrowser,
  createExecutionContext,
  type ExecutionContext,
  type ExecutionResult,
  executeBrowserAction,
  initializeBrowser,
} from "./execution.js";
export { GeminiAgent, type GeminiAgentConfig } from "./GeminiAgent.js";
export { createGeminiSession, updateGeminiSession } from "./session.js";
export {
  type ClickParams,
  type ClickResponse,
  clickTool,
} from "./tools/click.js";
export {
  type NavigateParams,
  type NavigateResponse,
  navigateTool,
} from "./tools/navigate.js";
