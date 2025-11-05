import { tool } from "ai";
import { z } from "zod";

/**
 * List agents tool parameters schema
 */
const ListAgentsParamsSchema = z.object({
  status: z
    .enum(["idle", "active", "processing", "error", "completed"])
    .optional(),
  type: z
    .enum([
      "claude-code",
      "gemini-browser",
      "codex",
      "backend-dev",
      "frontend-dev",
      "tester",
      "orchestrator",
    ])
    .optional(),
});

export type ListAgentsParams = z.infer<typeof ListAgentsParamsSchema>;

/**
 * List agents tool response schema
 */
const ListAgentsResponseSchema = z.object({
  agents: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      status: z.string(),
      createdAt: z.coerce.date(),
    })
  ),
  count: z.number(),
});

export type ListAgentsResponse = z.infer<typeof ListAgentsResponseSchema>;

/**
 * List agents tool
 * Returns all active agents matching optional filters
 */
export const listAgentsTool = tool({
  description: "List all active agents, optionally filtered by status or type",
  parameters: ListAgentsParamsSchema,
  execute: async (params) => {
    // This will be implemented by AgentManager
    // For now, return empty list as placeholder
    return {
      agents: [],
      count: 0,
    } satisfies ListAgentsResponse;
  },
});
