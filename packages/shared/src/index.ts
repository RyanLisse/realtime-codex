/**
 * Shared package barrel export
 *
 * @packageDocumentation
 *
 * This package provides shared types, schemas, and tool interfaces
 * used across all monorepo packages.
 */

// Config
export { getEnv, validateEnv } from "./config.js";

// Schemas
export {
  type Env,
  EnvSchema,
  parseEnv,
} from "./schemas/env.js";
export {
  type AgentSession as AgentSessionFromSchema,
  AgentSessionSchema,
  PartialAgentSessionSchema,
  type SessionRegistry,
  SessionRegistrySchema,
} from "./schemas/session.js";
export {
  type ToolParams,
  ToolParamsSchema,
  type ToolResponse,
  ToolResponseSchema,
} from "./schemas/tools.js";

// Tools
export type { Tool as ToolInterface } from "./tools/index.js";
// Types
export type {
  AgentSession,
  AgentStatus,
  AgentType,
  Tool,
  ToolParams,
  ToolResult,
} from "./types/index.js";
