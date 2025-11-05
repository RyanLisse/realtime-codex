#!/usr/bin/env bun

/**
 * CLI Entrypoint for Orchestrator
 * Main entry point for orchestrator command-line interface
 */

import { AgentOrchestrator } from "@repo/orchestrator";
import { parseEnv } from "@repo/shared";
import { handleCommand } from "./commands/index.js";

/**
 * Main CLI function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.error("Usage: orchestrator <command> [options]");
    process.exit(1);
  }

  // Validate environment variables
  try {
    parseEnv(process.env);
  } catch (error) {
    console.error("Error: Missing required environment variables");
    console.error(error instanceof Error ? error.message : "Unknown error");
    process.exit(1);
  }

  // Initialize orchestrator
  const orchestrator = new AgentOrchestrator({
    apiKey: process.env.OPENAI_API_KEY!,
    model: "gpt-5",
  });

  await orchestrator.initialize();

  // Handle command
  try {
    await handleCommand(command, args.slice(1), orchestrator);
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    process.exit(1);
  }
}

// Run main function
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
