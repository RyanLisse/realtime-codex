/**
 * Session management for Backend Developer agent
 */

import type { AgentSession } from "@repo/shared";
import { nanoid } from "nanoid";

/**
 * Create a new backend developer agent session
 */
export function createBackendSession(name?: string): AgentSession {
  const now = new Date();
  return {
    id: nanoid(),
    type: "backend-developer",
    status: "idle",
    messages: [],
    metadata: {
      name: name ?? "Backend Developer Agent",
      capabilities: ["generateApi", "generateSchema"],
    },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update backend session
 */
export function updateBackendSession(
  session: AgentSession,
  updates: Partial<Pick<AgentSession, "status" | "messages" | "metadata">>
): AgentSession {
  return {
    ...session,
    ...updates,
    updatedAt: new Date(),
  };
}
