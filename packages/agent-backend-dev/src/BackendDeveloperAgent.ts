/**
 * BackendDeveloperAgent - Backend API and server code generation
 * Uses GPT-5 Codex model for backend code generation
 */

import { openai } from "@ai-sdk/openai";
import type { AgentSession } from "@repo/shared";
import { Experimental_Agent as Agent } from "ai";
import { createBackendSession, updateBackendSession } from "./session.js";
import { generateApiTool } from "./tools/generateApi.js";
import { generateSchemaTool } from "./tools/generateSchema.js";

/**
 * BackendDeveloperAgent configuration
 */
export interface BackendDeveloperAgentConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxSteps?: number;
}

/**
 * BackendDeveloperAgent class
 * Uses AI SDK Agent with GPT-5 Codex for backend code generation
 */
export class BackendDeveloperAgent {
  private agent: Agent;
  private session: AgentSession;
  private config: BackendDeveloperAgentConfig;

  constructor(config: BackendDeveloperAgentConfig) {
    this.config = {
      model: "gpt-5-codex", // GPT-5 Codex for code generation
      temperature: 0.7,
      maxSteps: 20,
      ...config,
    };

    this.session = createBackendSession();

    // Initialize AI SDK Agent with GPT-5 Codex
    this.agent = new Agent({
      model: openai(this.config.model!),
      tools: {
        generateApi: generateApiTool,
        generateSchema: generateSchemaTool,
      },
      maxSteps: this.config.maxSteps,
    });
  }

  /**
   * Process a backend code generation request
   */
  async processRequest(prompt: string): Promise<string> {
    this.session = updateBackendSession(this.session, {
      status: "processing",
    });

    this.session = updateBackendSession(this.session, {
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

    this.session = updateBackendSession(this.session, {
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
    this.session = updateBackendSession(this.session, { status });
  }
}
