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
  success: z.boolean(),
  agents: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        status: z.string(),
        name: z.string().optional(),
        createdAt: z.coerce.date(),
      })
    )
    .optional(),
  count: z.number().optional(),
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
      success: true,
      agents: [],
      count: 0,
    } satisfies ListAgentsResponse;
  },
});
