/**
 * FrontendDeveloperAgent - Frontend component and UI code generation
 * Uses GPT-5 Codex model for frontend code generation
 */

import { openai } from "@ai-sdk/openai";
import type { AgentSession } from "@repo/shared";
import { Experimental_Agent as Agent } from "ai";
import { createFrontendSession, updateFrontendSession } from "./session.js";
import { generateComponentTool } from "./tools/generateComponent.js";

/**
 * FrontendDeveloperAgent configuration
 */
export interface FrontendDeveloperAgentConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxSteps?: number;
}

/**
 * FrontendDeveloperAgent class
 * Uses AI SDK Agent with GPT-5 Codex for frontend code generation
 */
export class FrontendDeveloperAgent {
  private agent: Agent;
  private session: AgentSession;
  private config: FrontendDeveloperAgentConfig;

  constructor(config: FrontendDeveloperAgentConfig) {
    this.config = {
      model: "gpt-5-codex", // GPT-5 Codex for code generation
      temperature: 0.7,
      maxSteps: 20,
      ...config,
    };

    this.session = createFrontendSession();

    // Initialize AI SDK Agent with GPT-5 Codex
    this.agent = new Agent({
      model: openai(this.config.model!),
      tools: {
        generateComponent: generateComponentTool,
      },
      maxSteps: this.config.maxSteps,
    });
  }

  /**
   * Process a frontend code generation request
   */
  async processRequest(prompt: string): Promise<string> {
    this.session = updateFrontendSession(this.session, {
      status: "processing",
    });

    this.session = updateFrontendSession(this.session, {
      messages: [
        ...this.session.messages,
        {
          role: "user",
          content: prompt,
          timestamp: new Date(),
        },
      ],
    });

    const result = await this.agent.step({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const response = result.text ?? "No response generated";

    this.session = updateFrontendSession(this.session, {
      status: "active",
      messages: [
        ...this.session.messages,
        {
          role: "assistant",
          content: response,
          timestamp: new Date(),
        },
      ],
    });

    return response;
  }

  /**
   * Get current session
   */
  getSession(): AgentSession {
    return this.session;
  }

  /**
   * Update session status
   */
  updateStatus(status: AgentSession["status"]): void {
    this.session = updateFrontendSession(this.session, { status });
  }
}
