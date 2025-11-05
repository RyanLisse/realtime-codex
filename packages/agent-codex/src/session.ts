/**
 * Session management for Codex agent
 * Handles agent session state and persistence
 */

import type { AgentSession } from "@repo/shared";
import { nanoid } from "nanoid";

/**
 * Create a new codex agent session
 */
export function createCodexSession(name?: string): AgentSession {
  const now = new Date();
  return {
    id: nanoid(),
    type: "codex",
    status: "idle",
    messages: [],
    metadata: {
      name: name ?? "Codex Agent",
      capabilities: ["readFile", "writeFile"],
    },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update codex session status
 */
export function updateCodexSession(
  session: AgentSession,
  updates: Partial<Pick<AgentSession, "status" | "messages" | "metadata">>
): AgentSession {
  return {
    ...session,
    ...updates,
    updatedAt: new Date(),
  };
}

/**
 * Add message to codex session
 */
export function addMessageToSession(
  session: AgentSession,
  role: "user" | "assistant" | "system",
  content: string
): AgentSession {
  return {
    ...session,
    messages: [
      ...session.messages,
      {
        role,
        content,
        timestamp: new Date(),
      },
    ],
    updatedAt: new Date(),
  };
}
