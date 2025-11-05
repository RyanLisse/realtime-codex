#!/bin/bash

# Install dependencies for Claude Code on the web
# This script runs on session start to ensure all dependencies are installed

set -e

echo "Installing dependencies with Bun..."

# Check if bun is available
if ! command -v bun &> /dev/null; then
  echo "Error: bun is not installed or not in PATH"
  exit 1
fi

# Install all workspace dependencies
bun install

# Verify installation
if [ $? -eq 0 ]; then
  echo "✓ Dependencies installed successfully"
else
  echo "✗ Failed to install dependencies"
  exit 1
fi

exit 0

