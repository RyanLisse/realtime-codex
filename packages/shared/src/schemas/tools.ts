import { z } from "zod";

/**
 * Tool parameter validation schema
 */
export const ToolParamsSchema = z
  .object({
    // Common tool parameters
    agentId: z.string().optional(),
    sessionId: z.string().optional(),
  })
  .passthrough(); // Allow additional fields

/**
 * Tool response validation schema
 */
export const ToolResponseSchema = z
  .object({
    success: z.boolean(),
    data: z.unknown().optional(),
    error: z.string().optional(),
  })
  .passthrough(); // Allow additional fields

/**
 * Tool input type
 */
export type ToolParams = z.infer<typeof ToolParamsSchema>;

/**
 * Tool response type
 */
export type ToolResponse = z.infer<typeof ToolResponseSchema>;
