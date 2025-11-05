import { beforeEach, describe, expect, it } from "vitest";
import { AgentType, TaskStatus, type Task } from "../../types/workflow.types";
import { TaskRouter } from "../taskRouter";

describe("TaskRouter - Routing Heuristics", () => {
  let router: TaskRouter;

  beforeEach(() => {
    router = new TaskRouter();
  });

  it("routes simple bugfix directly to Frontend/Backend, skipping Designer", async () => {
    const workflowId = "test-workflow-1";
    const bugfixTask: Task = {
      id: "task-1",
      description: "Fix bug in existing login page",
      assignedAgent: AgentType.PROJECT_MANAGER,
      status: TaskStatus.PENDING,
      dependencies: [],
      createdAt: new Date(),
      timeoutMs: 300000,
    };

    const agent = await router.routeTask(workflowId, bugfixTask);
    expect(agent).toBe(AgentType.FRONTEND);
    expect(bugfixTask.assignedAgent).toBe(AgentType.FRONTEND);
  });

  it("routes complex task with design requirements to Designer", async () => {
    const workflowId = "test-workflow-2";
    const complexTask: Task = {
      id: "task-2",
      description: "Create new dashboard with charts and visualizations",
      assignedAgent: AgentType.PROJECT_MANAGER,
      status: TaskStatus.PENDING,
      dependencies: [],
      createdAt: new Date(),
      timeoutMs: 300000,
    };

    const agent = await router.routeTask(workflowId, complexTask);
    expect(agent).toBe(AgentType.DESIGNER);
    expect(complexTask.assignedAgent).toBe(AgentType.DESIGNER);
  });

  it("routes backend-only task to Backend agent, skipping Designer and Frontend", async () => {
    const workflowId = "test-workflow-3";
    const backendTask: Task = {
      id: "task-3",
      description: "Add new API endpoint for user authentication",
      assignedAgent: AgentType.PROJECT_MANAGER,
      status: TaskStatus.PENDING,
      dependencies: [],
      createdAt: new Date(),
      timeoutMs: 300000,
    };

    const agent = await router.routeTask(workflowId, backendTask);
    expect(agent).toBe(AgentType.BACKEND);
    expect(backendTask.assignedAgent).toBe(AgentType.BACKEND);
  });

  it("routes frontend-focused task to Frontend agent", async () => {
    const workflowId = "test-workflow-4";
    const frontendTask: Task = {
      id: "task-4",
      description: "Build React interface for user profile page",
      assignedAgent: AgentType.PROJECT_MANAGER,
      status: TaskStatus.PENDING,
      dependencies: [],
      createdAt: new Date(),
      timeoutMs: 300000,
    };

    const agent = await router.routeTask(workflowId, frontendTask);
    expect(agent).toBe(AgentType.FRONTEND);
    expect(frontendTask.assignedAgent).toBe(AgentType.FRONTEND);
  });

  it("routes task with design keywords to Designer", async () => {
    const workflowId = "test-workflow-5";
    const designTask: Task = {
      id: "task-5",
      description: "Design UI mockups and wireframes for mobile app",
      assignedAgent: AgentType.PROJECT_MANAGER,
      status: TaskStatus.PENDING,
      dependencies: [],
      createdAt: new Date(),
      timeoutMs: 300000,
    };

    const agent = await router.routeTask(workflowId, designTask);
    expect(agent).toBe(AgentType.DESIGNER);
  });

  it("routes task with multiple keyword matches to highest priority agent", async () => {
    const workflowId = "test-workflow-6";
    const multiKeywordTask: Task = {
      id: "task-6",
      description: "Design and implement frontend dashboard with API integration",
      assignedAgent: AgentType.PROJECT_MANAGER,
      status: TaskStatus.PENDING,
      dependencies: [],
      createdAt: new Date(),
      timeoutMs: 300000,
    };

    const agent = await router.routeTask(workflowId, multiKeywordTask);
    expect([AgentType.DESIGNER, AgentType.FRONTEND]).toContain(agent);
  });

  it("defaults to ProjectManager when no keywords match", async () => {
    const workflowId = "test-workflow-7";
    const ambiguousTask: Task = {
      id: "task-7",
      description: "Review and optimize existing system",
      assignedAgent: AgentType.PROJECT_MANAGER,
      status: TaskStatus.PENDING,
      dependencies: [],
      createdAt: new Date(),
      timeoutMs: 300000,
    };

    const agent = await router.routeTask(workflowId, ambiguousTask);
    expect(agent).toBe(AgentType.PROJECT_MANAGER);
  });

  it("preserves existing agent assignment when task already has matching agent", async () => {
    const workflowId = "test-workflow-8";
    const frontendTask: Task = {
      id: "task-8",
      description: "Update React component styling",
      assignedAgent: AgentType.FRONTEND,
      status: TaskStatus.PENDING,
      dependencies: [],
      createdAt: new Date(),
      timeoutMs: 300000,
    };

    const agent = await router.routeTask(workflowId, frontendTask);
    expect(agent).toBe(AgentType.FRONTEND);
  });

  it("routes test-related tasks to Tester agent", async () => {
    const workflowId = "test-workflow-9";
    const testTask: Task = {
      id: "task-9",
      description: "Write unit tests and validate functionality",
      assignedAgent: AgentType.PROJECT_MANAGER,
      status: TaskStatus.PENDING,
      dependencies: [],
      createdAt: new Date(),
      timeoutMs: 300000,
    };

    const agent = await router.routeTask(workflowId, testTask);
    expect(agent).toBe(AgentType.TESTER);
  });

  it("routes backend API tasks correctly", async () => {
    const workflowId = "test-workflow-10";
    const apiTask: Task = {
      id: "task-10",
      description: "Create REST API service for database operations",
      assignedAgent: AgentType.PROJECT_MANAGER,
      status: TaskStatus.PENDING,
      dependencies: [],
      createdAt: new Date(),
      timeoutMs: 300000,
    };

    const agent = await router.routeTask(workflowId, apiTask);
    expect(agent).toBe(AgentType.BACKEND);
  });

  it("handles case-insensitive keyword matching", async () => {
    const workflowId = "test-workflow-11";
    const upperCaseTask: Task = {
      id: "task-11",
      description: "DESIGN UI MOCKUPS FOR DASHBOARD",
      assignedAgent: AgentType.PROJECT_MANAGER,
      status: TaskStatus.PENDING,
      dependencies: [],
      createdAt: new Date(),
      timeoutMs: 300000,
    };

    const agent = await router.routeTask(workflowId, upperCaseTask);
    expect(agent).toBe(AgentType.DESIGNER);
  });

  it("routes tasks with mixed case keywords correctly", async () => {
    const workflowId = "test-workflow-12";
    const mixedCaseTask: Task = {
      id: "task-12",
      description: "Build React Component page with API Integration",
      assignedAgent: AgentType.PROJECT_MANAGER,
      status: TaskStatus.PENDING,
      dependencies: [],
      createdAt: new Date(),
      timeoutMs: 300000,
    };

    const agent = await router.routeTask(workflowId, mixedCaseTask);
    expect([AgentType.FRONTEND, AgentType.DESIGNER]).toContain(agent);
  });
});

