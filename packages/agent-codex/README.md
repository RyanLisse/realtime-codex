# @repo/agent-codex

Codex agent for code generation and file operations using GPT-5 Codex.

## Features

- File reading and writing operations
- Code generation with GPT-5 Codex
- Session management

## Usage

```typescript
import { CodexAgent } from "@repo/agent-codex";

const agent = new CodexAgent({
  apiKey: process.env.OPENAI_API_KEY!,
  model: "gpt-5-codex",
});

const result = await agent.processRequest("Generate a React component");
```

## Tools

- `readFile` - Read file from filesystem
- `writeFile` - Write file to filesystem

