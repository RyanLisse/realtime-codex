import { describe, expect, it } from "vitest";
import type { BackendTask } from "../types";
import { apiGenerationTool } from "./apiGeneration.tool";

describe("apiGenerationTool", () => {
  it("should generate API endpoints from requirements", async () => {
    const task: BackendTask = {
      id: "backend-task-1",
      workflowId: "workflow-1",
      requirements:
        "Create REST API for user authentication with login and register endpoints",
      priority: "high",
      status: "pending",
      assignedTo: ["BackendDeveloper"],
      dependencies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await apiGenerationTool(task);

    expect(result).toBeDefined();
    expect(result.apis).toBeDefined();
    expect(result.apis.length).toBeGreaterThan(0);

    const loginApi = result.apis.find((api) =>
      api.endpoint.toLowerCase().includes("login")
    );

    expect(loginApi).toBeDefined();
    expect(loginApi?.method).toBeDefined();
  });

  it("should generate proper HTTP methods based on requirements", async () => {
    const task: BackendTask = {
      id: "backend-task-2",
      workflowId: "workflow-1",
      requirements:
        "Create GET endpoint to retrieve user profile and POST endpoint to update profile",
      priority: "high",
      status: "pending",
      assignedTo: ["BackendDeveloper"],
      dependencies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await apiGenerationTool(task);

    expect(result.apis.length).toBeGreaterThan(0);

    const getApi = result.apis.find((api) => api.method === "GET");
    const postApi = result.apis.find((api) => api.method === "POST");

    expect(getApi).toBeDefined();
    expect(postApi).toBeDefined();
  });

  it("should generate API parameters", async () => {
    const task: BackendTask = {
      id: "backend-task-3",
      workflowId: "workflow-1",
      requirements:
        "Create GET /users/:id endpoint with path parameter for user ID",
      priority: "high",
      status: "pending",
      assignedTo: ["BackendDeveloper"],
      dependencies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await apiGenerationTool(task);
    const getApi = result.apis.find(
      (api) => api.method === "GET" && api.endpoint.includes(":id")
    );

    expect(getApi).toBeDefined();
    expect(getApi?.parameters.length).toBeGreaterThan(0);
    expect(getApi?.parameters[0].location).toBe("path");
    expect(getApi?.parameters[0].name).toBe("id");
  });

  it("should generate request body schemas", async () => {
    const task: BackendTask = {
      id: "backend-task-4",
      workflowId: "workflow-1",
      requirements:
        "Create POST /users endpoint that accepts user registration data",
      priority: "high",
      status: "pending",
      assignedTo: ["BackendDeveloper"],
      dependencies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await apiGenerationTool(task);
    const postApi = result.apis.find(
      (api) => api.method === "POST" && api.endpoint.includes("/users")
    );

    expect(postApi).toBeDefined();
    expect(postApi?.requestBody).toBeDefined();
    expect(postApi?.requestBody?.type).toBeDefined();
  });

  it("should generate response schemas", async () => {
    const task: BackendTask = {
      id: "backend-task-5",
      workflowId: "workflow-1",
      requirements:
        "Create GET /users endpoint that returns 200 with user data or 404 if not found",
      priority: "high",
      status: "pending",
      assignedTo: ["BackendDeveloper"],
      dependencies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await apiGenerationTool(task);
    const getApi = result.apis.find((api) => api.method === "GET");

    expect(getApi).toBeDefined();
    expect(getApi?.responses.length).toBeGreaterThan(0);

    const has200 = getApi?.responses.some((r) => r.statusCode === 200);
    const has404 = getApi?.responses.some((r) => r.statusCode === 404);

    expect(has200).toBe(true);
    expect(has404).toBe(true);
  });

  it("should generate database schemas when needed", async () => {
    const task: BackendTask = {
      id: "backend-task-6",
      workflowId: "workflow-1",
      requirements:
        "Create user authentication system with users table storing email and password",
      priority: "high",
      status: "pending",
      assignedTo: ["BackendDeveloper"],
      dependencies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await apiGenerationTool(task);

    expect(result.databaseSchemas).toBeDefined();
    expect(result.databaseSchemas.length).toBeGreaterThan(0);

    const usersTable = result.databaseSchemas.find((schema) =>
      schema.tableName.toLowerCase().includes("user")
    );

    expect(usersTable).toBeDefined();
    expect(usersTable?.columns.length).toBeGreaterThan(0);
  });

  it("should handle empty requirements gracefully", async () => {
    const task: BackendTask = {
      id: "backend-task-7",
      workflowId: "workflow-1",
      requirements: "",
      priority: "low",
      status: "pending",
      assignedTo: ["BackendDeveloper"],
      dependencies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await apiGenerationTool(task);

    expect(result).toBeDefined();
    expect(result.apis).toBeDefined();
  });
});
