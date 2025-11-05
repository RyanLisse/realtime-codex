import type { AgentType } from "@repo/shared";
import { tool } from "ai";
import { z } from "zod";

/**
 * Create agent tool parameters schema
 */
const CreateAgentParamsSchema = z.object({
  type: z.enum([
    "claude-code",
    "gemini-browser",
    "codex",
    "backend-dev",
    "frontend-dev",
    "tester",
    "orchestrator",
  ]) as z.ZodType<AgentType>,
  name: z.string().min(1, "Agent name is required"),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateAgentParams = z.infer<typeof CreateAgentParamsSchema>;

/**
 * Create agent tool response schema
 */
const CreateAgentResponseSchema = z.object({
  id: z.string(),
  type: z.string(),
  status: z.string(),
  name: z.string(),
  createdAt: z.coerce.date(),
});

export type CreateAgentResponse = z.infer<typeof CreateAgentResponseSchema>;

/**
 * Create agent tool
 * Creates a new agent instance of the specified type
 */
export const createAgentTool = tool({
  description:
    "Create a new agent instance of the specified type (codex, claude-code, gemini-browser, etc.)",
  parameters: CreateAgentParamsSchema,
  execute: async (params) => {
    // This will be implemented by AgentManager
    // For now, return placeholder response
    return {
      id: `agent-${Date.now()}`,
      type: params.type,
      status: "idle",
      name: params.name,
      createdAt: new Date(),
    } satisfies CreateAgentResponse;
  },
});
