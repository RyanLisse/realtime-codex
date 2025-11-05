/**
 * AgentManager - Manages agent lifecycle and state
 * Combines functional core with imperative shell
 */

import type { AgentSession, AgentType } from "@repo/shared";
import {
  type AgentState,
  createAgentSession,
  createInitialState,
  getAgent,
  listAgents,
  removeAgent,
  updateAgentStatus,
} from "./core/agentState.js";
import { loadSessions, saveSessions } from "./shell/sideEffects.js";

/**
 * AgentManager class
 * Manages agent lifecycle and state persistence
 */
export class AgentManager {
  private state: AgentState;

  constructor() {
    this.state = createInitialState();
  }

  /**
   * Initialize agent manager from persisted sessions
   */
  async initialize(): Promise<void> {
    const sessions = await loadSessions();
    const agents = new Map<string, AgentSession>();
    const sessionsMap = new Map<string, AgentSession>();

    for (const session of sessions) {
      agents.set(session.id, session);
      sessionsMap.set(session.id, session);
    }

    this.state = {
      agents,
      sessions: sessionsMap,
    };
  }

  /**
   * Create a new agent session
   */
  async createAgent(
    type: AgentType,
    name: string,
    metadata?: Record<string, unknown>
  ): Promise<AgentSession> {
    // Pure function call (functional core)
    this.state = createAgentSession(this.state, type, name, metadata);

    const agent = getAgent(
      this.state,
      Array.from(this.state.agents.keys())[this.state.agents.size - 1]
    );
    if (!agent) {
      throw new Error("Failed to create agent");
    }

    // Side effect: persist to file
    await this.persistSessions();

    return agent;
  }

  /**
   * Get agent by ID
   */
  getAgentById(agentId: string): AgentSession | undefined {
    return getAgent(this.state, agentId);
  }

  /**
   * List all agents with optional filters
   */
  listAgents(filters?: {
    status?: AgentSession["status"];
    type?: AgentType;
  }): AgentSession[] {
    return listAgents(this.state, filters);
  }

  /**
   * Update agent status
   */
  async updateStatus(
    agentId: string,
    status: AgentSession["status"]
  ): Promise<void> {
    this.state = updateAgentStatus(this.state, agentId, status);
    await this.persistSessions();
  }

  /**
   * Remove agent
   */
  async removeAgent(agentId: string): Promise<void> {
    this.state = removeAgent(this.state, agentId);
    await this.persistSessions();
  }

  /**
   * Persist sessions to file (side effect)
   */
  private async persistSessions(): Promise<void> {
    const sessions = Array.from(this.state.sessions.values());
    await saveSessions(sessions);
  }
}
