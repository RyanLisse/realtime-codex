import { type Env, parseEnv } from "./schemas/env.js";

/**
 * Validated environment configuration
 * Fails fast at startup if required keys are missing
 */
let validatedEnv: Env | null = null;

/**
 * Get validated environment variables
 * Validates on first call, then caches result
 */
export function getEnv(): Env {
  if (validatedEnv === null) {
    // Use process.env for Node.js/Bun compatibility
    const env = typeof process !== "undefined" ? process.env : {};
    validatedEnv = parseEnv(env as Record<string, string | undefined>);
  }
  return validatedEnv;
}

/**
 * Validate environment variables at startup
 * Call this early in application initialization
 */
export function validateEnv(): void {
  getEnv(); // Triggers validation and caching
}
