/**
 * Session management for Frontend Developer agent
 */

import type { AgentSession } from "@repo/shared";
import { nanoid } from "nanoid";

/**
 * Create a new frontend developer agent session
 */
export function createFrontendSession(name?: string): AgentSession {
  const now = new Date();
  return {
    id: nanoid(),
    type: "frontend-developer",
    status: "idle",
    messages: [],
    metadata: {
      name: name ?? "Frontend Developer Agent",
      capabilities: ["generateComponent"],
    },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update frontend session
 */
export function updateFrontendSession(
  session: AgentSession,
  updates: Partial<Pick<AgentSession, "status" | "messages" | "metadata">>
): AgentSession {
  return {
    ...session,
    ...updates,
    updatedAt: new Date(),
  };
}
