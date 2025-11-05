# @repo/orchestrator

Core orchestrator package for coordinating AI agents using GPT-5.

## Features

- Agent lifecycle management
- Session persistence
- GPT-5 model integration via AI SDK
- Voice orchestrator support (GPT-5 Realtime)

## Usage

```typescript
import { AgentOrchestrator } from "@repo/orchestrator";

const orchestrator = new AgentOrchestrator({
  apiKey: process.env.OPENAI_API_KEY!,
  model: "gpt-5",
});

await orchestrator.initialize();

// Process messages
const result = await orchestrator.processMessage("List all agents");
```

## Tools

- `listAgents` - List all active agents
- `createAgent` - Create a new agent instance
- `commandAgent` - Send a command to an agent

## Architecture

- **Functional Core**: Pure functions for state management (`src/core/`)
- **Imperative Shell**: Side effects isolated (`src/shell/`)
- **AI SDK Integration**: Uses Vercel AI SDK Agent class with GPT-5

