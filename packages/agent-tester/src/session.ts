/**
 * Session management for Tester agent
 */

import type { AgentSession } from "@repo/shared";
import { nanoid } from "nanoid";

/**
 * Create a new tester agent session
 */
export function createTesterSession(name?: string): AgentSession {
  const now = new Date();
  return {
    id: nanoid(),
    type: "tester",
    status: "idle",
    messages: [],
    metadata: {
      name: name ?? "Tester Agent",
      capabilities: ["generateUnitTest", "generateIntegrationTest", "generateE2ETest"],
    },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update tester session
 */
export function updateTesterSession(
  session: AgentSession,
  updates: Partial<Pick<AgentSession, "status" | "messages" | "metadata">>
): AgentSession {
  return {
    ...session,
    ...updates,
    updatedAt: new Date(),
  };
}

