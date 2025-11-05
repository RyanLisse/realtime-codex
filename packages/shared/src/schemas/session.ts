import { z } from "zod";
import type { AgentStatus, AgentType } from "../types/index.js";

/**
 * Agent session validation schema
 */
export const AgentSessionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([
    "claude-code",
    "gemini-browser",
    "codex",
    "backend-dev",
    "frontend-dev",
    "tester",
    "orchestrator",
  ]) as z.ZodType<AgentType>,
  status: z.enum([
    "idle",
    "active",
    "processing",
    "error",
    "completed",
  ]) as z.ZodType<AgentStatus>,
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
      timestamp: z.coerce.date(),
    })
  ),
  metadata: z.record(z.unknown()),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Agent session type from schema
 */
export type AgentSession = z.infer<typeof AgentSessionSchema>;

/**
 * Partial session schema for updates
 */
export const PartialAgentSessionSchema = AgentSessionSchema.partial().required({
  id: true,
});

/**
 * Session registry format (array of sessions)
 */
export const SessionRegistrySchema = z.array(AgentSessionSchema);

/**
 * Session registry type
 */
export type SessionRegistry = z.infer<typeof SessionRegistrySchema>;
