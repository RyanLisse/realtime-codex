/**
 * CodexAgent - Code generation and file operations agent
 * Uses GPT-5 Codex model for code generation tasks
 */

import { openai } from "@ai-sdk/openai";
import type { AgentSession } from "@repo/shared";
import { Experimental_Agent as Agent } from "ai";
import { createCodexSession, updateCodexSession } from "./session.js";
import { readFileTool } from "./tools/readFile.js";
import { writeFileTool } from "./tools/writeFile.js";

/**
 * CodexAgent configuration
 */
export interface CodexAgentConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxSteps?: number;
}

/**
 * CodexAgent class
 * Uses AI SDK Agent with GPT-5 Codex for code generation
 */
export class CodexAgent {
  private agent: Agent;
  private session: AgentSession;
  private config: CodexAgentConfig;

  constructor(config: CodexAgentConfig) {
    this.config = {
      model: "gpt-5-codex", // GPT-5 Codex for code generation
      temperature: 0.7,
      maxSteps: 20,
      ...config,
    };

    this.session = createCodexSession();

    // Initialize AI SDK Agent with GPT-5 Codex
    this.agent = new Agent({
      model: openai(this.config.model!),
      tools: {
        readFile: readFileTool,
        writeFile: writeFileTool,
      },
      maxSteps: this.config.maxSteps,
    });
  }

  /**
   * Process a code generation request
   */
  async processRequest(prompt: string): Promise<string> {
    this.session = updateCodexSession(this.session, {
      status: "processing",
    });

    this.session = updateCodexSession(this.session, {
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

    this.session = updateCodexSession(this.session, {
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
    this.session = updateCodexSession(this.session, { status });
  }
}
