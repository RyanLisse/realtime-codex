#!/usr/bin/env node
"use strict";

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const memoryFlag = "--max-old-space-size=8192";
const args = process.argv.slice(2);

const env = { ...process.env };

// Ensure the child process always has an explicit max old space size.
if (!env.NODE_OPTIONS?.includes("max-old-space-size")) {
  env.NODE_OPTIONS = env.NODE_OPTIONS
    ? `${env.NODE_OPTIONS} ${memoryFlag}`
    : memoryFlag;
}

const command = spawnSync(
  process.execPath,
  [
    memoryFlag,
    path.resolve(require.resolve("next/dist/bin/next")),
    "build",
    "--webpack",
    ...args,
  ],
  {
    stdio: "inherit",
    env,
  }
);

if (command.error) {
  console.error(command.error);
}

process.exit(command.status ?? 1);
