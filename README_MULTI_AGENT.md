# Multi-Agent Workflow Orchestration System

A production-ready multi-agent system built with **Vertical Slice Architecture** and **Test-Driven Development**, featuring OpenAI Agents SDK integration and AI Elements visualization.

## Architecture

### Vertical Slice Architecture
Each feature (agent) is organized as a complete vertical slice with:
- **Types**: Type definitions with Zod validation
- **Tools**: Business logic tools with unit tests
- **Agent**: OpenAI Agents SDK configuration
- **Tests**: Comprehensive test coverage

### Agent Roles

#### 1. Project Manager
- **Responsibility**: Break down tasks, create requirements, coordinate work
- **Tools**: Task decomposition, requirement generation, agent task generation
- **Output**: Task breakdown, requirements, coordination plans

#### 2. UI/UX Designer
- **Responsibility**: Produce design specifications
- **Tools**: Design specification generation, component specs, wireframes
- **Output**: Design specs, color palettes, typography, component designs

#### 3. Frontend Developer
- **Responsibility**: Implement UI components
- **Tools**: React component generation, TypeScript code generation
- **Output**: React components, TypeScript files, styled components

#### 4. Backend Developer
- **Responsibility**: Implement APIs and business logic
- **Tools**: API generation, database schema design
- **Output**: REST APIs, database schemas, endpoint definitions

#### 5. Tester
- **Responsibility**: Validate outputs against acceptance criteria
- **Tools**: Test case generation, validation, coverage analysis
- **Output**: Test plans, test cases, coverage reports

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd realtime-codex

# Install dependencies
bun install

# Install Playwright browsers
bunx playwright install
```

### Configuration

Set your OpenAI API key:

```bash
export OPENAI_API_KEY="your-api-key-here"
```

### Running the Application

```bash
# Start development server
bun run dev

# Open browser to demo
open http://localhost:3000/demo
```

## Testing

### Run Tests

```bash
# Run all unit tests
bun test

# Run tests with UI
bun test:ui

# Run tests with coverage
bun test:coverage

# Run E2E tests
bun test:e2e

# Run E2E tests with UI
bun test:e2e:ui
```

### Test Coverage

- **Unit Tests**: Vitest for tools, services, and utilities
- **Component Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright for complete workflows
- **Coverage Target**: 80%+ for all production code

## Usage

### Basic Workflow

1. **Submit Task List**: Provide your task list via the UI
2. **Project Manager Decomposes**: Tasks broken down into agent-specific subtasks
3. **Agents Coordinate**: Work is distributed to appropriate agents
4. **Parallel Execution**: Independent tasks run simultaneously
5. **Validation**: Tester validates all outputs
6. **Artifacts Generated**: REQUIREMENTS.md, AGENT_TASKS.md, TEST_PLAN.md

### Example Task List

```markdown
# User Authentication System

## Tasks
1. Design login UI with modern styling
2. Implement login form component
3. Create authentication API endpoints
4. Write tests for login flow
```

## Project Structure

```
src/
├── features/
│   ├── shared/
│   │   ├── types/              # Shared types
│   │   └── services/           # Shared services
│   ├── project-manager/        # Project Manager slice
│   ├── designer/               # Designer slice
│   ├── frontend-developer/     # Frontend Developer slice
│   ├── backend-developer/      # Backend Developer slice
│   └── tester/                 # Tester slice
├── app/
│   └── demo/                   # Demo visualization
└── components/
    └── ai-elements/            # AI Elements components
```

## API Reference

### Creating Agents

```typescript
import { createProjectManagerAgent } from '@/features/project-manager/projectManager.agent';
import { createDesignerAgent } from '@/features/designer/designer.agent';
import { createFrontendDeveloperAgent } from '@/features/frontend-developer/frontendDeveloper.agent';
import { createBackendDeveloperAgent } from '@/features/backend-developer/backendDeveloper.agent';
import { createTesterAgent } from '@/features/tester/tester.agent';

const projectManager = createProjectManagerAgent();
const designer = createDesignerAgent();
const frontend = createFrontendDeveloperAgent();
const backend = createBackendDeveloperAgent();
const tester = createTesterAgent();
```

### Using Tools

```typescript
import { taskDecompositionTool } from '@/features/project-manager/tools/taskDecomposition.tool';
import { designSpecificationTool } from '@/features/designer/tools/designSpecification.tool';
import { componentGenerationTool } from '@/features/frontend-developer/tools/componentGeneration.tool';
import { apiGenerationTool } from '@/features/backend-developer/tools/apiGeneration.tool';
import { testGenerationTool } from '@/features/tester/tools/testGeneration.tool';

// Each tool is async and returns structured data
const decomposition = await taskDecompositionTool(taskList);
const design = await designSpecificationTool(designTask);
const components = await componentGenerationTool(frontendTask);
const apis = await apiGenerationTool(backendTask);
const tests = await testGenerationTool(testTask);
```

### Artifact Management

```typescript
import { ArtifactManager } from '@/features/shared/services/artifactManager';

const manager = new ArtifactManager('./artifacts');

// Create artifact
await manager.create(requirement);

// Get artifact
const artifact = await manager.get('req-1');

// List artifacts
const artifacts = await manager.list({ type: 'requirement' });

// Export artifact
const markdown = await manager.export('req-1', 'markdown');
```

## Testing Strategy

### Unit Tests
All tools, services, and utilities have comprehensive unit tests:
- Task decomposition logic
- Design spec generation
- Component code generation
- API endpoint generation
- Test case generation

### Integration Tests
Agent coordination and handoff logic tested with:
- Mock agent interactions
- Workflow state transitions
- Parallel execution scenarios

### E2E Tests
Complete workflows tested with Playwright:
- Task submission flow
- Agent coordination
- Artifact generation
- UI interactions

## Contributing

1. Follow TDD: Write tests first
2. Use vertical slice architecture
3. Maintain 80%+ test coverage
4. Follow existing code patterns
5. Update documentation

## License

MIT

