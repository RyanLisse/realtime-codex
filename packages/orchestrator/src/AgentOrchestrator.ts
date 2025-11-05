/**
 * AgentOrchestrator - Main orchestrator using AI SDK Agent with GPT-5
 * Coordinates agents using AI SDK's Agent class
 */

import { openai } from "@ai-sdk/openai";
import type { AgentSession } from "@repo/shared/types";
import { Experimental_Agent as Agent } from "ai";
import { AgentManager } from "./AgentManager.js";
import { commandAgentTool } from "./tools/commandAgent.js";
import { createAgentTool } from "./tools/createAgent.js";
import { listAgentsTool } from "./tools/listAgents.js";

/**
 * AgentOrchestrator configuration
 */
export interface OrchestratorConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxSteps?: number;
}

/**
 * AgentOrchestrator class
 * Uses AI SDK Agent with GPT-5 for agent coordination
 */
export class AgentOrchestrator {
  private agent: Agent;
  private agentManager: AgentManager;
  private config: OrchestratorConfig;

  constructor(config: OrchestratorConfig) {
    this.config = {
      model: "gpt-5", // GPT-5 for orchestrator (general coordination, not code generation)
      temperature: 0.7,
      maxSteps: 20,
      ...config,
    };

    this.agentManager = new AgentManager();

    // Initialize AI SDK Agent with GPT-5
    this.agent = new Agent({
      model: openai(this.config.model!),
      tools: {
        listAgents: listAgentsTool,
        createAgent: createAgentTool,
        commandAgent: commandAgentTool,
      },
      maxSteps: this.config.maxSteps,
      // Stop when agent decides to stop or max steps reached
    });
  }

  /**
   * Initialize orchestrator
   */
  async initialize(): Promise<void> {
    await this.agentManager.initialize();

    // Update tool handlers to use agent manager
    this.updateToolHandlers();
  }

  /**
   * Update tool handlers to use agent manager instance
   */
  private updateToolHandlers(): void {
    // Note: AI SDK tools are defined at creation time
    // In a real implementation, we'd need to pass agentManager to tool handlers
    // For now, tools use placeholder implementations
    // This will be enhanced when tools are properly wired to AgentManager
  }

  /**
   * Process a message and coordinate agents
   */
  async processMessage(message: string): Promise<string> {
    const result = await this.agent.step({
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    return result.text ?? "No response generated";
  }

  /**
   * Get agent manager instance
   */
  getAgentManager(): AgentManager {
    return this.agentManager;
  }

  /**
   * Get agent session by ID
   */
  getAgentSession(agentId: string): AgentSession | undefined {
    return this.agentManager.getAgentById(agentId);
  }
}
