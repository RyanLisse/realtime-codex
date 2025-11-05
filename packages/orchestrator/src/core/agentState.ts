/**
 * Functional core for agent state management
 * Pure functions only - no side effects
 */

import type { AgentSession, AgentStatus, AgentType } from "@repo/shared";
import { nanoid } from "nanoid";

/**
 * Agent state type
 */
export type AgentState = {
  agents: Map<string, AgentSession>;
  sessions: Map<string, AgentSession>;
};

/**
 * Create initial agent state (pure function)
 */
export function createInitialState(): AgentState {
  return {
    agents: new Map(),
    sessions: new Map(),
  };
}

/**
 * Create a new agent session (pure function)
 * Returns new state with agent added
 */
export function createAgentSession(
  state: AgentState,
  type: AgentType,
  name: string,
  metadata?: Record<string, unknown>
): AgentState {
  const id = nanoid();
  const now = new Date();

  const session: AgentSession = {
    id,
    type,
    status: "idle",
    messages: [],
    metadata: { ...(metadata ?? {}), name },
    createdAt: now,
    updatedAt: now,
  };

  const newAgents = new Map(state.agents);
  newAgents.set(id, session);

  const newSessions = new Map(state.sessions);
  newSessions.set(id, session);

  return {
    agents: newAgents,
    sessions: newSessions,
  };
}

/**
 * Update agent status (pure function)
 * Returns new state with updated agent
 */
export function updateAgentStatus(
  state: AgentState,
  agentId: string,
  status: AgentStatus
): AgentState {
  const agent = state.agents.get(agentId);
  if (!agent) {
    return state; // Agent not found, return state unchanged
  }

  const updatedAgent: AgentSession = {
    ...agent,
    status,
    updatedAt: new Date(),
  };

  const newAgents = new Map(state.agents);
  newAgents.set(agentId, updatedAgent);

  const newSessions = new Map(state.sessions);
  newSessions.set(agentId, updatedAgent);

  return {
    agents: newAgents,
    sessions: newSessions,
  };
}

/**
 * Get agent by ID (pure function)
 */
export function getAgent(
  state: AgentState,
  agentId: string
): AgentSession | undefined {
  return state.agents.get(agentId);
}

/**
 * List agents with optional filters (pure function)
 */
export function listAgents(
  state: AgentState,
  filters?: {
    status?: AgentStatus;
    type?: AgentType;
  }
): AgentSession[] {
  const agents = Array.from(state.agents.values());

  if (!filters) {
    return agents;
  }

  return agents.filter((agent) => {
    if (filters.status && agent.status !== filters.status) {
      return false;
    }
    if (filters.type && agent.type !== filters.type) {
      return false;
    }
    return true;
  });
}

/**
 * Remove agent (pure function)
 * Returns new state with agent removed
 */
export function removeAgent(state: AgentState, agentId: string): AgentState {
  const newAgents = new Map(state.agents);
  newAgents.delete(agentId);

  const newSessions = new Map(state.sessions);
  newSessions.delete(agentId);

  return {
    agents: newAgents,
    sessions: newSessions,
  };
}
