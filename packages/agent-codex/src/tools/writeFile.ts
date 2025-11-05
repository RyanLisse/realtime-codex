import { promises as fs } from "node:fs";
import { dirname } from "node:path";
import { tool } from "ai";
import { z } from "zod";

/**
 * Write file tool parameters schema
 */
const WriteFileParamsSchema = z.object({
  filePath: z.string().min(1, "File path is required"),
  content: z.string(),
  encoding: z.enum(["utf8", "utf-8", "ascii", "base64"]).default("utf8"),
  createDirectories: z.boolean().default(true),
});

export type WriteFileParams = z.infer<typeof WriteFileParamsSchema>;

/**
 * Write file tool response schema
 */
const WriteFileResponseSchema = z.object({
  success: z.boolean(),
  filePath: z.string(),
  bytesWritten: z.number().optional(),
  error: z.string().optional(),
});

export type WriteFileResponse = z.infer<typeof WriteFileResponseSchema>;

/**
 * Write file tool
 * Writes content to a file on the filesystem
 */
export const writeFileTool = tool({
  description:
    "Write content to a file on the filesystem. Creates directories if needed.",
  parameters: WriteFileParamsSchema,
  execute: async (params) => {
    try {
      // Create directories if needed
      if (params.createDirectories) {
        await fs.mkdir(dirname(params.filePath), { recursive: true });
      }

      await fs.writeFile(params.filePath, params.content, params.encoding);
      const stats = await fs.stat(params.filePath);

      return {
        success: true,
        filePath: params.filePath,
        bytesWritten: stats.size,
      } satisfies WriteFileResponse;
    } catch (error) {
      return {
        success: false,
        filePath: params.filePath,
        error: error instanceof Error ? error.message : "Unknown error",
      } satisfies WriteFileResponse;
    }
  },
});
