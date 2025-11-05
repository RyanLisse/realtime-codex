/**
 * Shared TypeScript interfaces for the monorepo
 */

/**
 * Agent type enumeration
 */
export type AgentType =
  | "claude-code"
  | "gemini-browser"
  | "codex"
  | "backend-dev"
  | "frontend-dev"
  | "tester"
  | "orchestrator";

/**
 * Agent session status
 */
export type AgentStatus =
  | "idle"
  | "active"
  | "processing"
  | "error"
  | "completed";

/**
 * Agent session interface
 */
export interface AgentSession {
  id: string;
  type: AgentType;
  status: AgentStatus;
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date;
  }>;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tool interface contract
 * Matches migration-contract.md specification
 */
export interface Tool<TParams = unknown, TResult = unknown> {
  name: string;
  description: string;
  handler: (params: TParams) => Promise<TResult>;
  inputSchema: unknown; // Zod schema (will be properly typed with zod)
  outputSchema: unknown; // Zod schema (will be properly typed with zod)
}

/**
 * Tool parameters type helper
 */
export type ToolParams<T extends Tool> = T extends Tool<infer P> ? P : never;

/**
 * Tool result type helper
 */
export type ToolResult<T extends Tool> = T extends Tool<unknown, infer R>
  ? R
  : never;
