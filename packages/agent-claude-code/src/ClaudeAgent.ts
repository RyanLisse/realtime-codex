/**
 * ClaudeAgent - Claude code agent using Anthropic
 * Uses AI SDK with Anthropic provider
 */

import { anthropic } from "@ai-sdk/anthropic";
import type { AgentSession } from "@repo/shared";
import { Experimental_Agent as Agent } from "ai";
import { createClaudeSession, updateClaudeSession } from "./session.js";

/**
 * ClaudeAgent configuration
 */
export interface ClaudeAgentConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxSteps?: number;
}

/**
 * ClaudeAgent class
 * Uses AI SDK Agent with Anthropic provider
 */
export class ClaudeAgent {
  private agent: Agent;
  private session: AgentSession;
  private config: ClaudeAgentConfig;

  constructor(config: ClaudeAgentConfig) {
    this.config = {
      model: "claude-3-5-sonnet-20241022", // Anthropic model
      temperature: 0.7,
      maxSteps: 20,
      ...config,
    };

    this.session = createClaudeSession();

    // Initialize AI SDK Agent with Anthropic
    this.agent = new Agent({
      model: anthropic(this.config.model!),
      tools: {},
      maxSteps: this.config.maxSteps,
    });
  }

  /**
   * Process a request
   */
  async processRequest(prompt: string): Promise<string> {
    this.session = updateClaudeSession(this.session, {
      status: "processing",
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

    this.session = updateClaudeSession(this.session, {
      status: "active",
      messages: [
        ...this.session.messages,
        {
          role: "user",
          content: prompt,
          timestamp: new Date(),
        },
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
    this.session = updateClaudeSession(this.session, { status });
  }
}
