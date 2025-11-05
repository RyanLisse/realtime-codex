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
  success: z.boolean(),
  agentId: z.string().optional(),
  error: z.string().optional(),
  id: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  name: z.string().optional(),
  createdAt: z.coerce.date().optional(),
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
    // Validate agent type
    const validTypes = [
      "claude-code",
      "gemini-browser",
      "codex",
      "backend-dev",
      "frontend-dev",
      "tester",
      "orchestrator",
    ];

    if (!validTypes.includes(params.type)) {
      return {
        success: false,
        error: `Invalid agent type: ${params.type}`,
      } satisfies CreateAgentResponse;
    }

    // This will be implemented by AgentManager
    // For now, return placeholder response
    const agentId = `agent-${Date.now()}`;
    return {
      success: true,
      agentId,
      id: agentId,
      type: params.type,
      status: "idle",
      name: params.name,
      createdAt: new Date(),
    } satisfies CreateAgentResponse;
  },
});
