import { tool } from "ai";
import { z } from "zod";

/**
 * Click tool parameters schema
 */
const ClickParamsSchema = z.object({
  selector: z.string().min(1, "Selector is required"),
  button: z.enum(["left", "right", "middle"]).default("left"),
  clickCount: z.number().int().positive().default(1),
  timeout: z.number().positive().optional(),
});

export type ClickParams = z.infer<typeof ClickParamsSchema>;

/**
 * Click tool response schema
 */
const ClickResponseSchema = z.object({
  success: z.boolean(),
  selector: z.string(),
  clicked: z.boolean(),
  error: z.string().optional(),
});

export type ClickResponse = z.infer<typeof ClickResponseSchema>;

/**
 * Click tool
 * Clicks an element on the page
 * Note: Actual implementation will be in browser.ts with side effects isolated
 */
export const clickTool = tool({
  description: "Click an element on the page using a CSS selector",
  parameters: ClickParamsSchema,
  execute: async (params) => {
    // This will be implemented by browser execution layer
    return {
      success: true,
      selector: params.selector,
      clicked: true,
    } satisfies ClickResponse;
  },
});
