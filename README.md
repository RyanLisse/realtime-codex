# Realtime Codex - TypeScript Monorepo

A unified TypeScript monorepo combining multi-agent orchestration with code generation capabilities, powered by Bun workspaces and GPT-5 Codex models.

**Status**: ✅ Migration Complete (98% - 91/93 tasks)

## Monorepo Structure

```
packages/
├── shared/              # Common types, schemas, and tool interfaces
├── orchestrator/        # Main agent orchestrator (AgentOrchestrator, VoiceOrchestrator)
├── agent-codex/         # Code generation agent (GPT-5 Codex)
├── agent-claude-code/   # Claude code agent
├── agent-gemini-browser/# Gemini browser automation agent
├── agent-backend-dev/   # Backend API generation agent (GPT-5 Codex)
├── agent-frontend-dev/  # Frontend component generation agent (GPT-5 Codex)
├── agent-tester/        # Test code generation agent (GPT-5 Codex)
└── orchestrator-cli/    # CLI entrypoint for orchestrator
```

## Quick Start

### Prerequisites

- Bun 1.3+ installed
- OpenAI API key (for GPT-5 Codex models)
- Optional: Anthropic API key (for Claude agent)
- Optional: Google API key (for Gemini agent)

### Installation

```bash
# Install all workspace dependencies
bun install

# Verify workspace setup
bun run build-check
```

### Environment Setup

Create `.env` file:

```bash
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key  # Optional
GEMINI_API_KEY=your-gemini-key        # Optional
```

### Usage

#### Run Orchestrator CLI

```bash
# From packages/orchestrator-cli
bun run src/index.ts

# Or use the binary (after linking)
orchestrator --help
```

#### Use Individual Agents

```typescript
import { CodexAgent } from "@repo/agent-codex";

const agent = new CodexAgent({
  apiKey: process.env.OPENAI_API_KEY!,
});

const result = await agent.processRequest("Generate a React component");
```

#### Use Orchestrator

```typescript
import { AgentOrchestrator } from "@repo/orchestrator";
import { AgentManager } from "@repo/orchestrator";

const manager = new AgentManager();
const orchestrator = new AgentOrchestrator({
  apiKey: process.env.OPENAI_API_KEY!,
  agentManager: manager,
});
```

## Package Overview

### `@repo/shared`
Common types, Zod schemas, and tool interfaces used across all packages.

### `@repo/orchestrator`
Main orchestrator coordinating multiple agents. Includes:
- `AgentOrchestrator`: AI SDK-based coordination with GPT-5
- `VoiceOrchestrator`: Voice interaction with GPT-5 Realtime
- `AgentManager`: Agent lifecycle management

### `@repo/agent-codex`
Code generation agent using GPT-5 Codex for file operations and code generation.

### `@repo/agent-claude-code`
Claude code agent using Anthropic models.

### `@repo/agent-gemini-browser`
Browser automation agent using Gemini for planning and Playwright for execution.

### `@repo/agent-backend-dev`
Backend API generation agent using GPT-5 Codex for API endpoints and database schemas.

### `@repo/agent-frontend-dev`
Frontend component generation agent using GPT-5 Codex for React/Vue/Svelte components.

### `@repo/agent-tester`
Test code generation agent using GPT-5 Codex for unit, integration, and E2E tests.

### `@repo/orchestrator-cli`
CLI entrypoint for orchestrator with command handlers.

## Model Assignments

- **GPT-5 Codex** (`gpt-5-codex`): All code generation agents (Codex, Backend, Frontend, Tester)
- **GPT-5**: Orchestrator and coordination agents
- **GPT-5 Realtime**: Voice orchestrator
- **Claude**: Claude code agent
- **Gemini**: Browser automation agent

## Development

### Running Tests

```bash
# Unit tests
bun test

# Coverage
bun test:coverage

# E2E tests
bun test:e2e
```

### Building

```bash
# Type check all packages
bun run build-check

# Build individual package
cd packages/orchestrator && bun run build
```

## Architecture

- **Functional Programming**: Pure functions with isolated side effects
- **Type Safety**: Strict TypeScript + Zod validation
- **Monorepo**: Bun workspaces with `workspace:*` dependencies
- **Runtime**: Bun (primary), runtime-agnostic patterns

## Documentation

- [Migration Guide](./docs/MIGRATION_GUIDE.md) - Python to TypeScript patterns and architecture
- [Component Inventory](./docs/COMPONENT_INVENTORY.md) - Complete list of migrated components
- [Migration Checklist](./docs/MIGRATION_CHECKLIST.md) - Validation status and completion tracking

## Package Details

Each package includes comprehensive documentation:

- `packages/shared/README.md` - Shared types and schemas
- `packages/orchestrator/README.md` - Orchestrator usage and architecture
- `packages/agent-*/README.md` - Agent-specific documentation

## Testing

All packages include unit tests and integration tests:

- Unit tests: `packages/*/src/__tests__/`
- Integration tests: `packages/orchestrator/src/__tests__/integration.test.ts`
- Contract tests: `packages/__tests__/contracts/migration-contract.test.ts`

Run all tests:
```bash
bun test
```

## License

MIT

