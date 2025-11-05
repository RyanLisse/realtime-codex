/**
 * Tool interface contract
 * Matches migration-contract.md specification
 *
 * Interface Tool {
 *   name: string;
 *   description: string;
 *   handler: (params: ToolParams) => Promise<ToolResult>;
 *   inputSchema: ZodSchema;
 *   outputSchema: ZodSchema;
 * }
 */
/**
 * Re-export for convenience
 */
export type { Tool, ToolParams, ToolResult } from "../types/index.js";
