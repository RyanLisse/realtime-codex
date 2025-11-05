import { tool } from "ai";
import { z } from "zod";

/**
 * Navigate tool parameters schema
 */
const NavigateParamsSchema = z.object({
  url: z.string().url("URL must be a valid URL"),
  waitUntil: z
    .enum(["load", "domcontentloaded", "networkidle"])
    .default("load"),
  timeout: z.number().positive().optional(),
});

export type NavigateParams = z.infer<typeof NavigateParamsSchema>;

/**
 * Navigate tool response schema
 */
const NavigateResponseSchema = z.object({
  success: z.boolean(),
  url: z.string(),
  title: z.string().optional(),
  error: z.string().optional(),
});

export type NavigateResponse = z.infer<typeof NavigateResponseSchema>;

/**
 * Navigate tool
 * Navigates browser to a URL
 * Note: Actual implementation will be in browser.ts with side effects isolated
 */
export const navigateTool = tool({
  description: "Navigate the browser to a specific URL",
  parameters: NavigateParamsSchema,
  execute: async (params) => {
    // This will be implemented by browser execution layer
    return {
      success: true,
      url: params.url,
      title: "Page Title",
    } satisfies NavigateResponse;
  },
});
