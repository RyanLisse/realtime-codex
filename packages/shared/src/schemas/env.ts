import { z } from "zod";

/**
 * Environment variable validation schema
 * All required keys must be present at startup
 */
export const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  ANTHROPIC_API_KEY: z
    .string()
    .min(1, "ANTHROPIC_API_KEY is required")
    .optional(),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required").optional(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

/**
 * Validated environment type
 */
export type Env = z.infer<typeof EnvSchema>;

/**
 * Parse and validate environment variables
 * Throws if validation fails
 */
export function parseEnv(env: Record<string, string | undefined>): Env {
  return EnvSchema.parse(env);
}
