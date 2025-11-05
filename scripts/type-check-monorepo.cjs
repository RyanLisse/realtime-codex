#!/usr/bin/env node
"use strict";
/**
 * Type-check monorepo packages individually to avoid memory issues
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const packages = [
  "shared",
  "orchestrator",
  "agent-codex",
  "agent-claude-code",
  "agent-gemini-browser",
  "agent-backend-dev",
  "agent-frontend-dev",
  "agent-tester",
  "orchestrator-cli",
];

console.log("Type-checking monorepo packages individually...\n");

let hasErrors = false;

for (const pkg of packages) {
  const pkgPath = path.join(__dirname, "..", "packages", pkg);
  if (!fs.existsSync(pkgPath)) {
    console.log(`⚠️  Skipping ${pkg} (directory not found)`);
    continue;
  }

  const tsconfigPath = path.join(pkgPath, "tsconfig.json");
  if (!fs.existsSync(tsconfigPath)) {
    console.log(`⚠️  Skipping ${pkg} (tsconfig.json not found)`);
    continue;
  }

  try {
    console.log(`✓ Checking ${pkg}...`);
    execSync(`bunx tsc --noEmit --project ${tsconfigPath}`, {
      stdio: "inherit",
      cwd: pkgPath,
    });
    console.log(`  ✓ ${pkg} passed\n`);
  } catch (error) {
    console.error(`  ✗ ${pkg} failed\n`);
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error("❌ Some packages failed type checking");
  process.exit(1);
} else {
  console.log("✅ All packages passed type checking");
  process.exit(0);
}
