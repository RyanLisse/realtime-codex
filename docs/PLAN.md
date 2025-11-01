# Multi-Agent Workflow Orchestration System

## Progress Snapshot (May 2024)

- [x] Establish shared Codex MCP service with retry logic and unit coverage (`src/features/shared/services/codexMcp.service.ts`)
- [x] Implement Project Manager workflow server actions with validation and artifact persistence (`src/features/project-manager/projectManager.action.tsx`)
- [x] Create Project Manager status card component with comprehensive tests (`src/features/project-manager/components/ProjectManagerCard.tsx`)
- [ ] Deliver remaining shared artifact management infrastructure
- [ ] Complete Designer, Frontend Developer, Backend Developer, and Tester vertical slices
- [ ] Build workflow orchestration coordinator and AI Elements visualization experience

> **Note:** The sections below continue to outline the outstanding work required to finish the multi-agent orchestration system. Update this snapshot as additional milestones are delivered.

## Architecture Overview

Build a multi-agent orchestration system using **Vertical Slice Architecture** with **Test-Driven Development (TDD)**. Each agent feature is a self-contained vertical slice with its own types, tests, business logic, server actions, and UI components. Integrate AI Elements for workflow visualization and comprehensive testing with Vitest (unit tests) and Playwright (E2E tests).

## Architecture Principles

1. **Vertical Slice Architecture**: Each feature (agent) is organized as a complete vertical slice from UI to business logic
2. **Test-Driven Development**: Write tests first (red-green-refactor cycle) - unit tests with Vitest, E2E tests with Playwright
3. **AI Elements Integration**: Use Canvas, Node, Edge components for interactive workflow visualization
4. **MCP Integration**: All agents access Codex MCP server for file operations and code generation
5. **OpenAI Agents SDK**: Use handoff pattern for agent coordination

## Implementation Steps

### 1. Setup AI Elements and Comprehensive Testing Infrastructure

**Install AI Elements**

- Run: `npx ai-elements@latest` to install AI Elements components
- Verify Canvas, Node, Edge, Panel, Controls components are available

**Setup Vitest for Unit/Component Tests**

- Install: `bun add -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react`
- Create `vitest.config.ts` with React plugin and jsdom environment
- Configure test patterns: `**/*.spec.{ts,tsx}` for unit/component tests
- Setup coverage reporting with v8 provider

**Setup Playwright for E2E Tests**

- Install: `bun add -D @playwright/test`
- Initialize: `bunx playwright install` (installs browsers)
- Create `playwright.config.ts` with base URL `http://localhost:3000`
- Configure test patterns: `**/*.e2e.spec.{ts,tsx}`
- Setup browsers: chromium, firefox, webkit
- Configure retries (2), timeout (30s), and parallel execution

**File: `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-utils/setup.ts'],
    include: ['**/*.spec.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**File: `playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src',
  testMatch: '**/*.e2e.spec.{ts,tsx}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**File: `src/test-utils/setup.ts`**

- Import `@testing-library/jest-dom` for custom matchers
- Setup global test utilities

**File: `src/test-utils/test-utils.tsx`**

- Create custom `render` function wrapping Testing Library's render
- Export all Testing Library utilities: `screen`, `waitFor`, `userEvent`, etc.

**Update: `package.json`** (add test scripts)

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

### 2. Shared Infrastructure (Core Slice)

**File: `src/features/shared/types/workflow.types.ts`**

- Define core types: `WorkflowState`, `AgentStatus`, `TaskList`, `HandoffRequest`, `WorkflowId`
- Use Zod schemas for runtime validation

**File: `src/features/shared/types/artifact.types.ts`**

- Define artifact types: `Requirement`, `AgentTask`, `TestPlan`, `DesignSpec`
- Define artifact metadata, versioning, and export formats

**File: `src/features/shared/services/artifactManager.spec.ts`** (TDD - write first)

- Test artifact creation with valid/invalid data
- Test artifact updates and versioning
- Test artifact retrieval by ID and listing
- Test file system operations (save, load, delete)
- Test export functionality (markdown, JSON)

**File: `src/features/shared/services/artifactManager.ts`**

- Implement `ArtifactManager` class for CRUD operations
- Store in `/artifacts` directory with versioning
- Methods: `create()`, `update()`, `get()`, `list()`, `export()`, `delete()`
- Handle concurrent access with file locking

**File: `src/features/shared/services/codexMcp.service.spec.ts`** (TDD - write first)

- Test MCP server initialization and connection
- Test file operations: read, write, delete
- Test code generation calls with mocked responses
- Test error handling and retries

**File: `src/features/shared/services/codexMcp.service.ts`**

- Wrap Codex MCP server as a service
- Provide file operations, code generation, analysis
- Initialize MCP server connection with retry logic
- Implement connection pooling and timeout handling

### 3. Vertical Slice: Project Manager Agent

**File: `src/features/project-manager/types.ts`**

- Types: `ProjectManagerTask`, `TaskDecomposition`, `RequirementSpec`, `CoordinationPlan`
- Zod schemas for validation

**File: `src/features/project-manager/tools/taskDecomposition.tool.spec.ts`** (TDD - write first)

- Test task parsing from markdown and JSON
- Test task decomposition into agent-specific subtasks
- Test dependency detection and ordering
- Test parallel vs sequential task identification

**File: `src/features/project-manager/tools/taskDecomposition.tool.ts`**

- Implement tool to break down high-level tasks
- Parse task list and extract dependencies
- Return structured task list with agent assignments

**File: `src/features/project-manager/projectManager.agent.spec.ts`** (TDD - write first)

- Test task decomposition logic
- Test requirement generation from tasks
- Test handoff coordination to other agents
- Test parallel vs sequential task routing decisions

**File: `src/features/project-manager/projectManager.agent.ts`**

- Define Project Manager RealtimeAgent with OpenAI Agents SDK
- Instructions: "Break down tasks, create requirements, coordinate work between agents"
- Tools: `taskDecompositionTool`, `requirementGenerationTool`, `agentTaskGenerationTool`
- Handoffs: to Designer, Frontend, Backend, Tester agents

**File: `src/features/project-manager/projectManager.action.spec.ts`** (TDD - write first)

- Test workflow initialization with valid/invalid task lists
- Test status retrieval for active workflows
- Test error handling for failed workflows

**File: `src/features/project-manager/projectManager.action.tsx`**

- Server action: `initializeWorkflow(taskList: string): Promise<WorkflowId>`
- Server action: `getWorkflowStatus(workflowId: string): Promise<WorkflowState>`
- Integrate with ArtifactManager and WorkflowCoordinator

**File: `src/features/project-manager/components/ProjectManagerCard.spec.tsx`** (TDD - write first)

- Test component rendering with pending/active/completed states
- Test progress display and task count
- Test handoff indicator visibility

**File: `src/features/project-manager/components/ProjectManagerCard.tsx`**

- Display Project Manager status using Node component from AI Elements
- Show current task, progress bar, completed tasks count
- Use NodeHeader, NodeTitle, NodeDescription, NodeContent, NodeFooter
- Display handoff indicators with animated edges

### 4. Vertical Slice: Designer Agent

**File: `src/features/designer/types.ts`**

- Types: `DesignTask`, `UIComponentSpec`, `DesignArtifact`, `ColorPalette`, `Typography`

**File: `src/features/designer/tools/designSpecification.tool.spec.ts`** (TDD - write first)

- Test design spec generation from requirements
- Test component specification creation
- Test color palette and typography generation

**File: `src/features/designer/tools/designSpecification.tool.ts`**

- Implement tool to generate design specifications
- Use Codex MCP for design file operations
- Generate component specs with props and states

**File: `src/features/designer/designer.agent.spec.ts`** (TDD - write first)

- Test UI/UX specification generation
- Test design artifact creation (wireframes, mockups)
- Test handoff to Frontend Developer with complete specs

**File: `src/features/designer/designer.agent.ts`**

- Define Designer RealtimeAgent
- Instructions: "Produce UI/UX specifications with component details, color palettes, and typography"
- Tools: `designSpecificationTool`, `componentSpecTool`, `wireframeTool`
- Handoffs: back to Project Manager, to Frontend Developer

**File: `src/features/designer/designer.action.spec.ts`** (TDD - write first)

- Test design task execution
- Test spec retrieval and formatting

**File: `src/features/designer/designer.action.tsx`**

- Server action: `executeDesignTask(task: DesignTask): Promise<DesignArtifact>`
- Server action: `getDesignSpecs(workflowId: string): Promise<DesignArtifact[]>`

**File: `src/features/designer/components/DesignerCard.spec.tsx`** (TDD - write first)

- Test component rendering with design specs
- Test color palette display
- Test component spec list rendering

**File: `src/features/designer/components/DesignerCard.tsx`**

- Display Designer status using Node component
- Show generated design specs, color palettes, components
- Use AI Elements Node structure with visual design previews

### 5. Vertical Slice: Frontend Developer Agent

**File: `src/features/frontend-developer/types.ts`**

- Types: `FrontendTask`, `ComponentCode`, `FrontendArtifact`, `StyleSheet`

**File: `src/features/frontend-developer/tools/componentGeneration.tool.spec.ts`** (TDD - write first)

- Test React component generation from design specs
- Test code quality and structure validation
- Test TypeScript type generation

**File: `src/features/frontend-developer/tools/componentGeneration.tool.ts`**

- Implement tool to generate React components
- Use Codex MCP for code generation
- Generate TypeScript components with proper types

**File: `src/features/frontend-developer/frontendDeveloper.agent.spec.ts`** (TDD - write first)

- Test UI implementation logic
- Test component code generation quality
- Test integration with Designer specs
- Test handoff to Backend Developer with API requirements

**File: `src/features/frontend-developer/frontendDeveloper.agent.ts`**

- Define Frontend Developer RealtimeAgent
- Instructions: "Implement UI/UX using design specifications, generate React components with TypeScript"
- Tools: `componentGenerationTool`, `codeImplementationTool`, `styleGenerationTool`
- Handoffs: to Project Manager, Backend Developer

**File: `src/features/frontend-developer/frontendDeveloper.action.spec.ts`** (TDD - write first)

- Test frontend task execution
- Test code retrieval and formatting

**File: `src/features/frontend-developer/frontendDeveloper.action.tsx`**

- Server action: `executeFrontendTask(task: FrontendTask): Promise<FrontendArtifact>`
- Server action: `getGeneratedCode(workflowId: string): Promise<ComponentCode[]>`

**File: `src/features/frontend-developer/components/FrontendDeveloperCard.spec.tsx`** (TDD - write first)

- Test component rendering with generated code
- Test syntax highlighting display
- Test code copy functionality

**File: `src/features/frontend-developer/components/FrontendDeveloperCard.tsx`**

- Display Frontend Developer status
- Show generated components with syntax highlighting (shiki)
- Display component tree and dependencies

### 6. Vertical Slice: Backend Developer Agent

**File: `src/features/backend-developer/types.ts`**

- Types: `BackendTask`, `APISpec`, `EndpointDefinition`, `BackendArtifact`, `DatabaseSchema`

**File: `src/features/backend-developer/tools/apiGeneration.tool.spec.ts`** (TDD - write first)

- Test API endpoint generation from requirements
- Test endpoint structure and validation
- Test OpenAPI spec generation

**File: `src/features/backend-developer/tools/apiGeneration.tool.ts`**

- Implement tool to generate API endpoints
- Use Codex MCP for code generation
- Generate RESTful API with proper error handling

**File: `src/features/backend-developer/backendDeveloper.agent.spec.ts`** (TDD - write first)

- Test API generation logic
- Test database operation handling
- Test integration with Frontend requirements
- Test handoff coordination with data contracts

**File: `src/features/backend-developer/backendDeveloper.agent.ts`**

- Define Backend Developer RealtimeAgent
- Instructions: "Implement APIs and business logic, generate database schemas, handle data validation"
- Tools: `apiGenerationTool`, `databaseOperationTool`, `validationTool`
- Handoffs: to Project Manager, Frontend Developer

**File: `src/features/backend-developer/backendDeveloper.action.spec.ts`** (TDD - write first)

- Test backend task execution
- Test API spec retrieval

**File: `src/features/backend-developer/backendDeveloper.action.tsx`**

- Server action: `executeBackendTask(task: BackendTask): Promise<BackendArtifact>`
- Server action: `getAPISpecs(workflowId: string): Promise<APISpec[]>`

**File: `src/features/backend-developer/components/BackendDeveloperCard.spec.tsx`** (TDD - write first)

- Test component rendering with API specs
- Test endpoint list display
- Test database schema visualization

**File: `src/features/backend-developer/components/BackendDeveloperCard.tsx`**

- Display Backend Developer status
- Show generated APIs, endpoints, and database schemas
- Display API documentation with request/response examples

### 7. Vertical Slice: Tester Agent

**File: `src/features/tester/types.ts`**

- Types: `TestTask`, `TestCase`, `ValidationResult`, `TestPlanArtifact`, `CoverageReport`

**File: `src/features/tester/tools/testGeneration.tool.spec.ts`** (TDD - write first)

- Test test case generation from requirements
- Test validation logic for acceptance criteria
- Test coverage calculation

**File: `src/features/tester/tools/testGeneration.tool.ts`**

- Implement tool to generate test cases (unit, integration, E2E)
- Use Codex MCP for test code generation
- Generate tests with Vitest and Playwright

**File: `src/features/tester/tester.agent.spec.ts`** (TDD - write first)

- Test validation logic
- Test acceptance criteria checking
- Test test plan generation
- Test handoff to Project Manager with test results

**File: `src/features/tester/tester.agent.ts`**

- Define Tester RealtimeAgent
- Instructions: "Validate outputs against acceptance criteria, generate comprehensive tests (unit, integration, E2E)"
- Tools: `testGenerationTool`, `validationTool`, `testPlanTool`, `coverageTool`
- Handoffs: back to Project Manager

**File: `src/features/tester/tester.action.spec.ts`** (TDD - write first)

- Test test execution
- Test result aggregation and reporting

**File: `src/features/tester/tester.action.tsx`**

- Server action: `executeTestTask(task: TestTask): Promise<ValidationResult>`
- Server action: `getTestResults(workflowId: string): Promise<TestCase[]>`

**File: `src/features/tester/components/TesterCard.spec.tsx`** (TDD - write first)

- Test component rendering with test results
- Test pass/fail indicator display
- Test coverage report visualization

**File: `src/features/tester/components/TesterCard.tsx`**

- Display Tester status
- Show test results with pass/fail indicators
- Display coverage report with visual charts

### 8. Workflow Orchestration Coordinator

**File: `src/features/workflow/taskRouter.spec.ts`** (TDD - write first)

- Test routing decisions based on task types
- Test dependency resolution and ordering
- Test parallel execution identification

**File: `src/features/workflow/taskRouter.ts`**

- Implement intelligent task routing
- Determine parallel vs sequential execution
- Handle task dependencies with topological sort

**File: `src/features/workflow/workflowCoordinator.spec.ts`** (TDD - write first)

- Test workflow initialization with task list
- Test agent routing logic
- Test parallel execution (Frontend + Backend)
- Test handoff handling and state transitions
- Test workflow completion detection

**File: `src/features/workflow/workflowCoordinator.ts`**

- Implement `WorkflowCoordinator` class
- Manage agent handoffs and state machine
- Support parallel execution with Promise.all
- Track workflow progress with event emitters
- Methods: `startWorkflow()`, `routeToAgent()`, `handleHandoff()`, `getStatus()`, `cancelWorkflow()`

### 9. Workflow Visualization UI (AI Elements)

**File: `src/app/multi-agent/components/TaskInput.spec.tsx`** (TDD - write first)

- Test input handling with markdown and JSON
- Test file upload and parsing
- Test validation error display

**File: `src/app/multi-agent/components/TaskInput.tsx`**

- Task list input component with textarea
- Support markdown and JSON formats
- File upload with drag-and-drop
- Real-time validation and error display

**File: `src/app/multi-agent/components/WorkflowCanvas.spec.tsx`** (TDD - write first)

- Test canvas rendering with all agent nodes
- Test node updates on state changes
- Test edge animations (animated vs temporary)
- Test node selection and interaction

**File: `src/app/multi-agent/components/WorkflowCanvas.tsx`**

- Implement Canvas with nodes for each agent
- Use AI Elements: Canvas, Node, Edge, Controls, Panel
- Define nodeTypes: `projectManager`, `designer`, `frontend`, `backend`, `tester`
- Define edgeTypes: `animated` (active handoff), `temporary` (pending)
- Auto-layout with fitView and dagre algorithm
- Real-time updates via WebSocket or polling

**File: `src/app/multi-agent/components/ArtifactPanel.spec.tsx`** (TDD - write first)

- Test panel rendering with artifacts
- Test markdown rendering with syntax highlighting
- Test download and copy functionality
- Test artifact switching (REQUIREMENTS, TASKS, TEST_PLAN)

**File: `src/app/multi-agent/components/ArtifactPanel.tsx`**

- Panel component using AI Elements Panel
- Display REQUIREMENTS.md, AGENT_TASKS.md, TEST_PLAN.md
- Markdown rendering with shiki syntax highlighting
- Download (as .md) and copy to clipboard functionality
- Tab navigation between artifacts

**File: `src/app/multi-agent/page.spec.tsx`** (TDD - write first)

- Test page rendering with all components
- Test task submission flow
- Test real-time workflow updates
- Test artifact generation and display

**File: `src/app/multi-agent/page.tsx`**

- Main page for multi-agent workflow
- Layout: TaskInput (top), WorkflowCanvas (center), ArtifactPanel (right)
- Real-time workflow visualization
- Status indicators for each agent
- Error handling and retry mechanisms

**File: `src/app/multi-agent/page.e2e.spec.tsx`** (Playwright E2E test)

- Test complete workflow from task input to artifact generation
- Test task submission with example task list
- Test workflow progress visualization
- Test agent handoffs and parallel execution
- Test artifact download functionality
- Test error scenarios and recovery

### 10. Integration with Codex MCP Server

**Update: `src/app/server/codexMcpServer.ts`**

- Enhance `main()` function with WorkflowCoordinator integration
- Connect all agents to Codex MCP server
- Setup agent handoff network (bidirectional)
- Initialize workflow on task list input
- Handle MCP server lifecycle (start, stop, restart)

**File: `src/app/server/codexMcpServer.spec.ts`** (TDD - write first)

- Test MCP server initialization
- Test agent registration and connection
- Test workflow orchestration integration

### 11. Example Task Lists and Configuration

**File: `/artifacts/examples/EXAMPLE_TASKS.md`**

```markdown
# User Authentication System

## Tasks
1. Design login and registration UI with modern styling
2. Implement login form component with validation
3. Implement registration form component
4. Create authentication API endpoints (login, register, logout)
5. Implement JWT token management
6. Create user database schema
7. Write unit tests for authentication logic
8. Write E2E tests for login/registration flow
```

**File: `/artifacts/examples/SIMPLE_TASK.md`**

```markdown
# Button Component

## Tasks
1. Design button component with variants (primary, secondary, outline)
2. Implement Button component in React with TypeScript
3. Write unit tests for Button component
```

**File: `src/features/shared/config/agentConfig.spec.ts`** (TDD - write first)

- Test configuration loading and validation
- Test default values
- Test environment variable overrides

**File: `src/features/shared/config/agentConfig.ts`**

- Agent configurations: models (gpt-4, gpt-3.5-turbo), timeouts, retry logic
- Parallel execution rules (Frontend + Backend can run in parallel)
- Artifact storage paths (`/artifacts`)
- MCP server connection settings

### 12. Documentation

**File: `README_MULTI_AGENT.md`**

- Architecture overview (Vertical Slice + TDD + AI Elements)
- Setup instructions (install dependencies, run tests)
- Usage guide with example workflows
- Agent roles and responsibilities
- API reference for server actions
- Workflow visualization guide
- Testing strategy (Vitest for unit, Playwright for E2E)
- Troubleshooting common issues
- Contributing guidelines

---

## Phase 1: Code Quality - Refactor Duplicated Code (TDD)

### 1.1 Refactor Agent Tool Wrappers

**Problem**: 53 lines duplicated across 5 agent files (lines 5-17 in each)

**Solution**: Leverage existing `src/shared/agent.utils.ts` `createToolWrapper` helper

**Files to modify**:
- `src/features/project-manager/projectManager.agent.ts`
- `src/features/designer/designer.agent.ts`
- `src/features/frontend-developer/frontendDeveloper.agent.ts`
- `src/features/backend-developer/backendDeveloper.agent.ts`
- `src/features/tester/tester.agent.ts`

**Approach**:
1. Write tests first: Update each `*.agent.spec.ts` to verify tool wrapper behavior
2. Replace inline tool wrappers with `createToolWrapper` calls
3. Verify all 70 existing tests still pass

**Example refactor** (projectManager.agent.ts):
```typescript
// Before (lines 5-17):
const taskDecompositionToolWrapper = tool({
  name: "taskDecomposition",
  description: "Break down...",
  parameters: z.object({ taskList: z.unknown() }),
  strict: true,
  execute: async ({ taskList }) => {
    const result = await taskDecompositionTool(taskList as any);
    return JSON.stringify(result, null, 2);
  },
});

// After:
import { createToolWrapper } from "@/shared/agent.utils";
const taskDecompositionToolWrapper = createToolWrapper(
  taskDecompositionTool,
  "taskDecomposition",
  "Break down high-level task list into agent-specific subtasks with dependencies",
  z.object({ taskList: z.unknown() })
);
```

### 1.2 Reduce ArtifactManager Complexity (Cyclo 110)

**Problem**: `exportAsMarkdown` method (lines 192-273) has cyclo 25, `list` method has cyclo 60

**Solution**: Extract type-specific exporters and filter logic

**Files to create**:
- `src/features/shared/services/artifactManager.spec.ts` (update with new tests)
- `src/features/shared/services/exporters/markdownExporter.ts` (new)
- `src/features/shared/services/exporters/markdownExporter.spec.ts` (new)
- `src/features/shared/services/filters/artifactFilter.ts` (new)
- `src/features/shared/services/filters/artifactFilter.spec.ts` (new)

**Approach**:
1. Write tests for new `MarkdownExporter` class with methods:
   - `exportRequirement(artifact)`
   - `exportAgentTask(artifact)`
   - `exportTestPlan(artifact)`
   - `exportDesignSpec(artifact)`
2. Write tests for `ArtifactFilter` class with `matchesFilter(artifact, filter)` method
3. Refactor `ArtifactManager.exportAsMarkdown` to use `MarkdownExporter`
4. Refactor `ArtifactManager.list` to use `ArtifactFilter`
5. Verify complexity reduced to <15 per function

### 1.3 Fix testGeneration.tool.ts Multiple Returns (7 returns)

**Problem**: `generateExpectedResult` function (lines 153-176) has 7 return statements

**Solution**: Use lookup table pattern

**Files to modify**:
- `src/features/tester/tools/testGeneration.tool.ts`
- `src/features/tester/tools/testGeneration.tool.spec.ts` (add tests for new logic)

**Approach**:
1. Write tests for edge cases in `generateExpectedResult`
2. Refactor to use pattern matching with a lookup table:
```typescript
const EXPECTED_RESULT_PATTERNS = [
  { pattern: /render/i, result: "Component renders without errors" },
  { pattern: /click/i, result: "Click event is triggered correctly" },
  // ... etc
];

function generateExpectedResult(criteria: string, testType: string): string {
  for (const { pattern, result } of EXPECTED_RESULT_PATTERNS) {
    if (pattern.test(criteria)) return result;
  }
  return "Expected behavior matches acceptance criteria";
}
```
3. Verify all tests pass

### 1.4 Reduce useCamera.ts Complexity (Cyclo 20)

**Problem**: `start` callback (lines 16-43) has high complexity

**Solution**: Extract helper functions

**Files to modify**:
- `src/hooks/useCamera.ts`
- `src/hooks/useCamera.spec.ts` (create new test file)

**Approach**:
1. Write unit tests for camera initialization logic
2. Extract `initializeStream()` and `setupVideoElement()` helpers
3. Simplify `start` callback to orchestrate helpers
4. Verify complexity reduced to <10

## Phase 2: WorkflowCoordinator & TaskRouter (TDD)

### 2.1 Create WorkflowCoordinator Service

**New files**:
- `src/features/shared/services/workflowCoordinator.ts`
- `src/features/shared/services/workflowCoordinator.spec.ts`
- `src/features/shared/services/taskRouter.ts`
- `src/features/shared/services/taskRouter.spec.ts`
- `src/features/shared/types/coordinator.types.ts`

**WorkflowCoordinator responsibilities**:
- Manage workflow state machine (idle → in_progress → completed/failed)
- Track active agents and their tasks
- Handle parallel task execution
- Coordinate agent handoffs
- Persist workflow state

**TaskRouter responsibilities**:
- Analyze incoming tasks and route to appropriate agent
- Support hybrid routing: initial coordinator routing + agent-to-agent handoffs
- Maintain handoff history and context

**Test coverage**:
- State transitions (idle → in_progress → completed)
- Parallel task execution (Frontend + Backend simultaneously)
- Sequential dependencies (Designer → Frontend → Tester)
- Error handling and recovery
- Workflow persistence and resume

**Key types** (coordinator.types.ts):
```typescript
export type WorkflowStatus = 'idle' | 'in_progress' | 'paused' | 'completed' | 'failed';

export interface WorkflowContext {
  id: string;
  status: WorkflowStatus;
  currentAgent: AgentType | null;
  taskQueue: Task[];
  completedTasks: Task[];
  artifacts: string[]; // artifact IDs
  history: HandoffRecord[];
}

export interface HandoffRecord {
  from: AgentType;
  to: AgentType;
  context: string;
  artifacts: string[];
  timestamp: Date;
}
```

### 2.2 Integrate with Existing RealtimeAgent

**Files to modify**:
- `src/app/page.tsx` (main realtime agent)
- `src/app/server/codexMcpServer.ts`

**Approach**:
1. Create `WorkflowRealtimeAgent` that extends existing `RealtimeAgent` pattern
2. Add multi-agent tools to existing agent's tool array:
   - `startWorkflow(taskDescription)` - initiates multi-agent workflow
   - `checkWorkflowStatus(workflowId)` - queries workflow state
   - `getWorkflowArtifacts(workflowId)` - retrieves generated artifacts
3. Configure handoffs from main agent to specialist agents (ProjectManager, Designer, etc.)
4. Update `codexMcpServer.ts` to initialize WorkflowCoordinator and connect all agents

**Integration pattern** (page.tsx):
```typescript
import { createProjectManagerAgent } from "@/features/project-manager/projectManager.agent";
import { WorkflowCoordinator } from "@/features/shared/services/workflowCoordinator";

const workflowCoordinator = new WorkflowCoordinator();

const startWorkflowTool = tool({
  name: "startWorkflow",
  description: "Start a multi-agent workflow for complex tasks",
  parameters: z.object({
    taskDescription: z.string(),
    requirements: z.array(z.string()).optional(),
  }),
  execute: async ({ taskDescription, requirements }) => {
    const workflow = await workflowCoordinator.createWorkflow({
      description: taskDescription,
      requirements: requirements || [],
    });
    return backgroundResult(`Workflow ${workflow.id} started`);
  },
});

const agent = new RealtimeAgent({
  name: "Greeter",
  instructions: "You are a greeter. For complex multi-step tasks, use startWorkflow.",
  tools: [
    refundBackchannel,
    secretTool,
    weatherTool,
    startWorkflowTool, // NEW
  ],
  handoffs: [
    weatherExpert,
    createProjectManagerAgent(), // NEW
  ],
});
```

### 2.3 Setup Agent Handoff Network

**Files to modify**:
- All agent files to add handoff configurations

**Handoff network**:
```
RealtimeAgent (main)
  ↓ handoff
ProjectManager
  ↓ handoff (parallel possible)
  ├→ Designer → Frontend → Tester
  └→ Backend → Tester
```

**Implementation**:
- ProjectManager can hand off to Designer, Frontend, Backend
- Designer can hand off to Frontend
- Frontend and Backend can hand off to Tester
- All agents can hand back to ProjectManager for coordination

## Phase 3: Workflow Visualization UI (TDD)

### 3.1 Create Production Workflow UI Components

**New files**:
- `src/app/workflow/page.tsx` (main workflow page)
- `src/features/workflow/components/TaskInput.tsx`
- `src/features/workflow/components/TaskInput.spec.tsx`
- `src/features/workflow/components/WorkflowCanvas.tsx`
- `src/features/workflow/components/WorkflowCanvas.spec.tsx`
- `src/features/workflow/components/ArtifactPanel.tsx`
- `src/features/workflow/components/ArtifactPanel.spec.tsx`
- `src/features/workflow/components/AgentNode.tsx`
- `src/features/workflow/components/AgentNode.spec.tsx`
- `src/features/workflow/hooks/useWorkflowState.ts`
- `src/features/workflow/hooks/useWorkflowState.spec.ts`

**TaskInput Component**:
- Text area for task description
- Multi-line input for acceptance criteria
- Priority selector
- "Start Workflow" button
- Real-time validation

**WorkflowCanvas Component**:
- Uses AI Elements (Canvas, Node, Edge) from demo
- Dynamic node updates based on workflow state
- Animated edges showing active handoffs
- Click nodes to view agent details
- Real-time status updates (pending → in_progress → completed)

**ArtifactPanel Component**:
- Sidebar showing generated artifacts
- Filter by agent type and artifact type
- Preview artifact content (markdown rendering)
- Export buttons (JSON, Markdown, HTML)
- Download individual or all artifacts

**AgentNode Component**:
- Reusable node component for each agent
- Status indicator (idle, active, completed, error)
- Progress bar for current task
- Tooltip with agent details
- Click to expand and show task history

### 3.2 Implement Real-time Workflow State Management

**Files**:
- `src/features/workflow/hooks/useWorkflowState.ts`

**Features**:
- Subscribe to workflow state changes
- Update UI in real-time as agents complete tasks
- Handle WebSocket or polling for live updates
- Manage local state for UI responsiveness

**Hook interface**:
```typescript
export function useWorkflowState(workflowId: string) {
  const [workflow, setWorkflow] = useState<WorkflowContext | null>(null);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  
  // Subscribe to workflow updates
  useEffect(() => {
    const unsubscribe = workflowCoordinator.subscribe(workflowId, (update) => {
      setWorkflow(update.workflow);
      setAgents(update.agents);
      setArtifacts(update.artifacts);
    });
    return unsubscribe;
  }, [workflowId]);
  
  return { workflow, agents, artifacts };
}
```

### 3.3 Update Demo Page

**Files to modify**:
- `src/app/demo/page.tsx`

**Changes**:
- Keep existing static visualization as "Demo"
- Add link to `/workflow` for production UI
- Fix syntax error on line 79 (missing comma)

## Phase 4: Comprehensive E2E Tests (TDD)

### 4.1 E2E Test Suite

**New files**:
- `src/features/workflow/workflow.e2e.spec.ts`
- `src/features/workflow/workflow-parallel.e2e.spec.ts`
- `src/features/workflow/workflow-error-handling.e2e.spec.ts`

**Test scenarios** (workflow.e2e.spec.ts):
1. **Complete workflow**: Task input → ProjectManager decomposition → Designer spec → Frontend component → Backend API → Tester validation → Artifacts generated
2. **Artifact generation**: Verify all artifact types created (Requirement, DesignSpec, FrontendCode, BackendCode, TestPlan)
3. **UI updates**: Verify canvas nodes update in real-time
4. **Artifact panel**: Verify artifacts appear in panel, can be previewed and exported

**Parallel execution tests** (workflow-parallel.e2e.spec.ts):
1. Verify Frontend and Backend agents execute simultaneously
2. Verify both complete before Tester starts
3. Verify workflow completes faster than sequential execution

**Error handling tests** (workflow-error-handling.e2e.spec.ts):
1. Agent failure recovery
2. Invalid task input handling
3. Workflow cancellation
4. Resume paused workflow

**Test structure**:
```typescript
test.describe('Multi-Agent Workflow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/workflow');
  });

  test('should complete full workflow from task input to artifact generation', async ({ page }) => {
    // 1. Input task
    await page.fill('[data-testid="task-input"]', 'Build a user authentication system');
    await page.fill('[data-testid="criteria-input"]', 'User can login\nUser can register');
    await page.click('[data-testid="start-workflow"]');
    
    // 2. Verify ProjectManager node activates
    await expect(page.locator('[data-testid="agent-node-ProjectManager"]')).toHaveAttribute('data-status', 'active');
    
    // 3. Wait for Designer handoff
    await expect(page.locator('[data-testid="agent-node-Designer"]')).toHaveAttribute('data-status', 'active', { timeout: 30000 });
    
    // 4. Verify artifacts appear
    await expect(page.locator('[data-testid="artifact-list"]')).toContainText('Requirement');
    await expect(page.locator('[data-testid="artifact-list"]')).toContainText('Design Specification');
    
    // 5. Verify workflow completes
    await expect(page.locator('[data-testid="workflow-status"]')).toHaveText('Completed', { timeout: 120000 });
    
    // 6. Verify all artifacts generated
    const artifactCount = await page.locator('[data-testid="artifact-item"]').count();
    expect(artifactCount).toBeGreaterThanOrEqual(5);
  });
});
```

## Phase 5: Quality Checks & Validation

### 5.1 Run All Tests

```bash
# Unit tests
bun test

# E2E tests
bun test:e2e

# Coverage report
bun test:coverage
```

**Success criteria**:
- All existing 70 tests pass
- New tests: 50+ additional tests
- Total coverage: >80%
- No failing E2E tests

### 5.2 Code Quality Checks

**Run linting and type checking**:
```bash
bun run lint
bun run build-check
```

**Verify**:
- No TypeScript errors
- No ESLint errors
- No unused imports or variables

### 5.3 Complexity Analysis

**Manual verification**:
- `artifactManager.ts`: Cyclo <15 per function
- `testGeneration.tool.ts`: Single return path in `generateExpectedResult`
- `useCamera.ts`: Cyclo <10
- No duplicated tool wrapper code

### 5.4 Integration Verification

**Manual testing checklist**:
- [ ] Start workflow from main RealtimeAgent
- [ ] Verify ProjectManager receives task
- [ ] Verify handoffs to specialist agents
- [ ] Verify parallel execution (Frontend + Backend)
- [ ] Verify artifacts generated and stored
- [ ] Verify UI updates in real-time
- [ ] Export artifacts in all formats
- [ ] Test error scenarios

## Key Technical Decisions

1. **Vertical Slice Architecture**: Each agent is a complete feature slice (types → tests → logic → actions → UI)
2. **Test-Driven Development**: Write tests first with Vitest (unit/component) and Playwright (E2E)
3. **AI Elements Integration**: Canvas, Node, Edge for interactive workflow visualization (based on https://ai-sdk.dev/elements/examples/workflow)
4. **Agent Communication**: OpenAI Agents SDK handoff pattern with bidirectional handoffs (based on https://cookbook.openai.com/examples/building_w_rt_mini/building_w_rt_mini)
5. **Parallel Execution**: Frontend and Backend agents work simultaneously when tasks are independent
6. **Artifact Storage**: `/artifacts` directory with file system persistence and versioning
7. **Task Format**: Markdown or JSON task lists via UI input or file upload
8. **MCP Integration**: All agents access Codex MCP server via shared service (based on https://github.com/modelcontextprotocol/typescript-sdk)
9. **Real-time Updates**: Server Actions with React state for live workflow progress

## Testing Strategy

- **Unit Tests (Vitest)**: All tools, services, utilities, and pure functions
- **Component Tests (Vitest + Testing Library)**: React components with user interactions
- **Integration Tests (Vitest)**: Agent coordination, handoffs, and workflow orchestration
- **E2E Tests (Playwright)**: Full workflow from task input to artifact generation, including UI interactions
- **Coverage Target**: 80%+ for unit/component tests, 100% for critical paths in E2E tests

## Dependencies

Already installed:

- `@modelcontextprotocol/sdk` (^1.20.2)
- `@openai/agents` (^0.2.1)
- `zod` (validation)
- `@xyflow/react` (workflow visualization)
- `shiki` (syntax highlighting)
- `nanoid` (ID generation)

To install:

- AI Elements: `npx ai-elements@latest`
- Vitest: `bun add -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react`
- Playwright: `bun add -D @playwright/test` + `bunx playwright install`

## Success Criteria

### Initial Implementation (Steps 1-12)
- All tests pass (Vitest unit/component tests + Playwright E2E tests)
- 80%+ test coverage for unit/component tests
- Project Manager decomposes tasks correctly
- Agents perform handoffs dynamically based on task requirements
- Parallel execution works for independent tasks (Frontend + Backend)
- Artifacts generated correctly (REQUIREMENTS.md, AGENT_TASKS.md, TEST_PLAN.md)
- UI displays real-time workflow with AI Elements visualization
- System integrates seamlessly with Codex MCP server
- Clean vertical slice architecture with clear boundaries
- Comprehensive documentation with examples

### Refactoring & Enhancement (Phases 1-5)
- **Code Quality**: Zero duplication, all functions <15 cyclo complexity
- **Test Coverage**: 120+ tests passing, >80% coverage
- **E2E Tests**: Full workflow completes end-to-end in <2 minutes
- **Performance**: Parallel tasks execute simultaneously (not sequential)
- **UI**: Real-time updates with <500ms latency
- **Artifacts**: All 5 artifact types generated correctly
- **Integration**: Seamless handoffs between RealtimeAgent and multi-agent system

## Summary

This plan covers the complete multi-agent workflow system development in two main phases:

1. **Initial Implementation (Steps 1-12)**: Setting up infrastructure, building all 5 agent vertical slices, creating workflow orchestration, and building visualization UI
2. **Refactoring & Enhancement (Phases 1-5)**: Improving code quality, reducing complexity, integrating with existing RealtimeAgent system, comprehensive E2E testing, and quality validation

The system uses Vertical Slice Architecture with Test-Driven Development throughout, ensuring maintainability, scalability, and high test coverage.