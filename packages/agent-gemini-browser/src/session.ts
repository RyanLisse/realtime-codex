/**
 * Session management for Gemini Browser agent
 */

import type { AgentSession } from "@repo/shared";
import { nanoid } from "nanoid";

/**
 * Create a new gemini browser agent session
 */
export function createGeminiSession(name?: string): AgentSession {
  const now = new Date();
  return {
    id: nanoid(),
    type: "gemini-browser",
    status: "idle",
    messages: [],
    metadata: {
      name: name ?? "Gemini Browser Agent",
      capabilities: ["navigate", "click", "type", "screenshot"],
    },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update gemini session
 */
export function updateGeminiSession(
  session: AgentSession,
  updates: Partial<Pick<AgentSession, "status" | "messages" | "metadata">>
): AgentSession {
  return {
    ...session,
    ...updates,
    updatedAt: new Date(),
  };
}
