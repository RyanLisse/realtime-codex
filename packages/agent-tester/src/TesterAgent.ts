/**
 * TesterAgent - Test code generation (unit, integration, E2E)
 * Uses GPT-5 Codex model for test code generation
 */

import { openai } from "@ai-sdk/openai";
import type { AgentSession } from "@repo/shared";
import { Experimental_Agent as Agent } from "ai";
import { createTesterSession, updateTesterSession } from "./session.js";
import { generateE2ETestTool } from "./tools/generateE2ETest.js";
import { generateIntegrationTestTool } from "./tools/generateIntegrationTest.js";
import { generateUnitTestTool } from "./tools/generateUnitTest.js";

/**
 * TesterAgent configuration
 */
export interface TesterAgentConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxSteps?: number;
}

/**
 * TesterAgent class
 * Uses AI SDK Agent with GPT-5 Codex for test code generation
 */
export class TesterAgent {
  private agent: Agent;
  private session: AgentSession;
  private config: TesterAgentConfig;

  constructor(config: TesterAgentConfig) {
    this.config = {
      model: "gpt-5-codex", // GPT-5 Codex for code generation
      temperature: 0.7,
      maxSteps: 20,
      ...config,
    };

    this.session = createTesterSession();

    // Initialize AI SDK Agent with GPT-5 Codex
    this.agent = new Agent({
      model: openai(this.config.model!),
      tools: {
        generateUnitTest: generateUnitTestTool,
        generateIntegrationTest: generateIntegrationTestTool,
        generateE2ETest: generateE2ETestTool,
      },
      maxSteps: this.config.maxSteps,
    });
  }

  /**
   * Process a test code generation request
   */
  async processRequest(prompt: string): Promise<string> {
    this.session = updateTesterSession(this.session, {
      status: "processing",
    });

    this.session = updateTesterSession(this.session, {
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

    this.session = updateTesterSession(this.session, {
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
    this.session = updateTesterSession(this.session, { status });
  }
}
