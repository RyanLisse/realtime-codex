/**
 * Imperative shell for side effects
 * Isolates API calls, file I/O, and other side effects
 */

import { promises as fs } from "node:fs";
import { join } from "node:path";
import type { AgentSession } from "@repo/shared/types";

/**
 * Session registry file path
 */
const SESSION_REGISTRY_PATH = join(process.cwd(), "data", "sessions.json");

/**
 * Ensure data directory exists
 */
async function ensureDataDirectory(): Promise<void> {
  const dataDir = join(process.cwd(), "data");
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

/**
 * Load sessions from file (side effect: file I/O)
 */
export async function loadSessions(): Promise<AgentSession[]> {
  try {
    await ensureDataDirectory();
    const content = await fs.readFile(SESSION_REGISTRY_PATH, "utf-8");
    const sessions = JSON.parse(content) as AgentSession[];
    // Convert date strings back to Date objects
    return sessions.map((session) => ({
      ...session,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
      messages: session.messages.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
    }));
  } catch (error) {
    // File doesn't exist or is invalid, return empty array
    if ((error as { code?: string }).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

/**
 * Save sessions to file (side effect: file I/O)
 */
export async function saveSessions(sessions: AgentSession[]): Promise<void> {
  await ensureDataDirectory();
  await fs.writeFile(
    SESSION_REGISTRY_PATH,
    JSON.stringify(sessions, null, 2),
    "utf-8"
  );
}

/**
 * Initialize OpenAI client (side effect: API client creation)
 */
export async function initializeOpenAIClient(apiKey: string): Promise<unknown> {
  // This will use the actual OpenAI client
  // For now, return placeholder
  return {
    apiKey,
    initialized: true,
  };
}

/**
 * Initialize Anthropic client (side effect: API client creation)
 */
export async function initializeAnthropicClient(
  apiKey: string
): Promise<unknown> {
  // This will use the actual Anthropic client
  // For now, return placeholder
  return {
    apiKey,
    initialized: true,
  };
}

/**
 * Make API call to LLM (side effect: network I/O)
 */
export async function callLLM(
  client: unknown,
  model: string,
  messages: Array<{ role: string; content: string }>,
  options?: Record<string, unknown>
): Promise<unknown> {
  // This will use the actual LLM SDK
  // For now, return placeholder
  return {
    content: "Placeholder response",
    model,
    usage: { prompt_tokens: 0, completion_tokens: 0 },
  };
}
