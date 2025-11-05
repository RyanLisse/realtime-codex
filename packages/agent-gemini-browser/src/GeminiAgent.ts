/**
 * GeminiAgent - Browser automation agent using Gemini
 * Uses Google Gemini for planning and Playwright for execution
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AgentSession } from "@repo/shared";
import { nanoid } from "nanoid";
import { createPlan, validatePlan } from "./core/planning.js";
import {
  cleanupBrowser,
  createExecutionContext,
  type ExecutionContext,
  executeBrowserAction,
  initializeBrowser,
} from "./execution.js";

/**
 * GeminiAgent configuration
 */
export interface GeminiAgentConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
}

/**
 * GeminiAgent class
 * Uses Gemini for planning and Playwright for browser execution
 */
export class GeminiAgent {
  private genAI: GoogleGenerativeAI;
  private executionContext: ExecutionContext;
  private session: AgentSession;
  private config: GeminiAgentConfig;

  constructor(config: GeminiAgentConfig) {
    this.config = {
      model: "gemini-pro",
      temperature: 0.7,
      ...config,
    };

    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.executionContext = createExecutionContext();

    this.session = {
      id: nanoid(),
      type: "gemini-browser",
      status: "idle",
      messages: [],
      metadata: {
        model: this.config.model,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Initialize browser
   */
  async initialize(): Promise<void> {
    this.executionContext = await initializeBrowser(this.executionContext);
    this.session = {
      ...this.session,
      status: "active",
      updatedAt: new Date(),
    };
  }

  /**
   * Process a browser automation request
   */
  async processRequest(task: string): Promise<string> {
    this.session = {
      ...this.session,
      status: "processing",
      updatedAt: new Date(),
    };

    // Pure function: Create plan
    const plan = createPlan(task);

    if (!validatePlan(plan)) {
      throw new Error("Invalid plan generated");
    }

    // Side effects isolated: Execute plan steps
    const results = [];
    for (const step of plan) {
      const action =
        step.action === "navigate"
          ? { type: "navigate" as const, url: step.target }
          : { type: "click" as const, selector: step.target };

      const result = await executeBrowserAction(action, this.executionContext);
      results.push(result);
    }

    this.session = {
      ...this.session,
      status: "active",
      messages: [
        ...this.session.messages,
        {
          role: "user",
          content: task,
          timestamp: new Date(),
        },
        {
          role: "assistant",
          content: `Executed ${results.length} steps`,
          timestamp: new Date(),
        },
      ],
      updatedAt: new Date(),
    };

    return `Executed plan with ${results.length} steps`;
  }

  /**
   * Get current session
   */
  getSession(): AgentSession {
    return this.session;
  }

  /**
   * Close browser
   */
  async close(): Promise<void> {
    await cleanupBrowser(this.executionContext);
    this.session = {
      ...this.session,
      status: "completed",
      updatedAt: new Date(),
    };
  }
}
