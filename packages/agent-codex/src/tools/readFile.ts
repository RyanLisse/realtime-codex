import { promises as fs } from "node:fs";
import { tool } from "ai";
import { z } from "zod";

/**
 * Read file tool parameters schema
 */
const ReadFileParamsSchema = z.object({
  filePath: z.string().min(1, "File path is required"),
  encoding: z.enum(["utf8", "utf-8", "ascii", "base64"]).default("utf8"),
});

export type ReadFileParams = z.infer<typeof ReadFileParamsSchema>;

/**
 * Read file tool response schema
 */
const ReadFileResponseSchema = z.object({
  success: z.boolean(),
  content: z.string().optional(),
  filePath: z.string(),
  error: z.string().optional(),
});

export type ReadFileResponse = z.infer<typeof ReadFileResponseSchema>;

/**
 * Read file tool
 * Reads a file from the filesystem
 */
export const readFileTool = tool({
  description: "Read a file from the filesystem and return its contents",
  parameters: ReadFileParamsSchema,
  execute: async (params) => {
    try {
      const content = await fs.readFile(params.filePath, params.encoding);
      return {
        success: true,
        content,
        filePath: params.filePath,
      } satisfies ReadFileResponse;
    } catch (error) {
      return {
        success: false,
        filePath: params.filePath,
        error: error instanceof Error ? error.message : "Unknown error",
      } satisfies ReadFileResponse;
    }
  },
});
