/**
 * Session management for Claude agent
 */

import type { AgentSession } from "@repo/shared";
import { nanoid } from "nanoid";

/**
 * Create a new claude agent session
 */
export function createClaudeSession(name?: string): AgentSession {
  const now = new Date();
  return {
    id: nanoid(),
    type: "claude-code",
    status: "idle",
    messages: [],
    metadata: {
      name: name ?? "Claude Code Agent",
    },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update claude session
 */
export function updateClaudeSession(
  session: AgentSession,
  updates: Partial<Pick<AgentSession, "status" | "messages" | "metadata">>
): AgentSession {
  return {
    ...session,
    ...updates,
    updatedAt: new Date(),
  };
}
