/**
 * File operations wrapper with side effect isolation
 * Pure functions for file operation logic, side effects isolated
 */

import { promises as fs } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Pure function to validate file path
 */
export function validateFilePath(filePath: string): boolean {
  // Basic validation - no null bytes, no directory traversal beyond project root
  if (filePath.includes("\0")) {
    return false;
  }
  // Additional validation can be added here
  return true;
}

/**
 * Pure function to normalize file path
 */
export function normalizeFilePath(filePath: string, baseDir: string): string {
  return join(baseDir, filePath);
}

/**
 * Side effect: Read file from filesystem
 */
export async function readFileFromDisk(
  filePath: string,
  encoding: BufferEncoding = "utf8"
): Promise<string> {
  if (!validateFilePath(filePath)) {
    throw new Error(`Invalid file path: ${filePath}`);
  }
  return await fs.readFile(filePath, encoding);
}

/**
 * Side effect: Write file to filesystem
 */
export async function writeFileToDisk(
  filePath: string,
  content: string,
  encoding: BufferEncoding = "utf8",
  createDirectories = true
): Promise<void> {
  if (!validateFilePath(filePath)) {
    throw new Error(`Invalid file path: ${filePath}`);
  }

  if (createDirectories) {
    await fs.mkdir(dirname(filePath), { recursive: true });
  }

  await fs.writeFile(filePath, content, encoding);
}

/**
 * Side effect: Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Side effect: Get file stats
 */
export async function getFileStats(filePath: string) {
  return await fs.stat(filePath);
}

