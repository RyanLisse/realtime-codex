#!/bin/bash

# Setup script for Claude Code cloud environment with external containers
# This script prepares the container environment for Claude Code execution
# Based on: https://docs.claude.com/en/docs/claude-code/claude-code-on-the-web#cloud-environment

set -e

echo "🚀 Setting up container environment for Claude Code..."

# Detect if running in remote environment
if [ "$CLAUDE_CODE_REMOTE" = "true" ]; then
  echo "✓ Running in Claude Code cloud environment"
else
  echo "⚠ Running in local environment (container setup may differ)"
fi

# Check for Bun
if ! command -v bun &> /dev/null; then
  echo "Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi

# Verify Bun installation
if ! command -v bun &> /dev/null; then
  echo "✗ Error: Failed to install Bun"
  exit 1
fi

echo "✓ Bun installed: $(bun --version)"

# Install Node.js (if not already available via Bun)
if ! command -v node &> /dev/null; then
  echo "Installing Node.js..."
  # Bun includes Node.js, but ensure it's available
  if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs || true
  fi
fi

# Install system dependencies for build tools
if command -v apt-get &> /dev/null; then
  echo "Installing system dependencies..."
  apt-get update -qq || true
  apt-get install -y -qq \
    build-essential \
    curl \
    git \
    python3 \
    python3-pip \
    ca-certificates \
    || true
fi

# Install workspace dependencies
echo "Installing project dependencies..."
cd "$CLAUDE_PROJECT_DIR" || cd /workspace || pwd
bun install

# Verify installation
if [ $? -eq 0 ]; then
  echo "✓ Dependencies installed successfully"
else
  echo "✗ Failed to install dependencies"
  exit 1
fi

# Persist environment variables if needed
if [ -n "$CLAUDE_ENV_FILE" ]; then
  echo "Persisting environment variables to $CLAUDE_ENV_FILE"
  {
    echo "export PATH=\"\$HOME/.bun/bin:\$PATH\""
    echo "export NODE_ENV=${NODE_ENV:-development}"
  } >> "$CLAUDE_ENV_FILE"
fi

# Display environment info
echo ""
echo "📦 Environment Setup Complete"
echo "├─ Bun: $(bun --version)"
echo "├─ Node: $(node --version 2>/dev/null || echo 'N/A')"
echo "├─ Project: $(pwd)"
echo "└─ Remote: ${CLAUDE_CODE_REMOTE:-false}"
echo ""

exit 0

