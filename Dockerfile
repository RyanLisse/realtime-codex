# Dockerfile for Claude Code cloud environment
# This container image can be used with external container deployments
# Based on: https://docs.claude.com/en/docs/claude-code/claude-code-on-the-web#cloud-environment

FROM ubuntu:22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PATH="/root/.bun/bin:$PATH"
ENV NODE_ENV=development

# Install system dependencies
RUN apt-get update -qq && \
    apt-get install -y -qq \
    build-essential \
    curl \
    git \
    python3 \
    python3-pip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash

# Verify Bun installation
RUN bun --version

# Set working directory
WORKDIR /workspace

# Copy setup script
COPY scripts/setup_container.sh /usr/local/bin/setup_container.sh
RUN chmod +x /usr/local/bin/setup_container.sh

# Default command runs setup
CMD ["/usr/local/bin/setup_container.sh"]

