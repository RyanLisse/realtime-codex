import { tool } from "ai";
import { z } from "zod";

/**
 * Generate unit test tool parameters schema
 */
const GenerateUnitTestParamsSchema = z.object({
  functionName: z.string().min(1, "Function name is required"),
  testFramework: z.enum(["vitest", "jest", "mocha"]).default("vitest"),
  description: z.string().optional(),
});

export type GenerateUnitTestParams = z.infer<
  typeof GenerateUnitTestParamsSchema
>;

/**
 * Generate unit test tool response schema
 */
const GenerateUnitTestResponseSchema = z.object({
  success: z.boolean(),
  code: z.string().optional(),
  functionName: z.string(),
  error: z.string().optional(),
});

export type GenerateUnitTestResponse = z.infer<
  typeof GenerateUnitTestResponseSchema
>;

/**
 * Generate unit test tool
 * Generates unit test code
 */
export const generateUnitTestTool = tool({
  description: "Generate unit test code (Vitest, Jest, Mocha)",
  parameters: GenerateUnitTestParamsSchema,
  execute: async (params) => {
    try {
      // This would integrate with actual code generation logic
      const code = `// Generated unit test for: ${params.functionName}
import { describe, it, expect } from "${params.testFramework}";

describe("${params.functionName}", () => {
  it("should work correctly", () => {
    // Generated test code
  });
});`;

      return {
        success: true,
        code,
        functionName: params.functionName,
      } satisfies GenerateUnitTestResponse;
    } catch (error) {
      return {
        success: false,
        functionName: params.functionName,
        error: error instanceof Error ? error.message : "Unknown error",
      } satisfies GenerateUnitTestResponse;
    }
  },
});
