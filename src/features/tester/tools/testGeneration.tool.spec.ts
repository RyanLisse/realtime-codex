import { describe, expect, it } from "vitest";
import type { TestTask } from "../types";
import { testGenerationTool } from "./testGeneration.tool";

describe("testGenerationTool", () => {
  it("should generate test cases from test task", async () => {
    const task: TestTask = {
      id: "test-task-1",
      workflowId: "workflow-1",
      componentToTest: "Button",
      requirements:
        "Create unit tests for Button component with primary and secondary variants",
      acceptanceCriteria: [
        "Button renders correctly with variant prop",
        "Button applies correct styles for primary variant",
        "Button handles click events",
      ],
      priority: "high",
      status: "pending",
      assignedTo: ["Tester"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await testGenerationTool(task);

    expect(result).toBeDefined();
    expect(result.testCases).toBeDefined();
    expect(result.testCases.length).toBeGreaterThan(0);
  });

  it("should create test cases for each acceptance criteria", async () => {
    const task: TestTask = {
      id: "test-task-2",
      workflowId: "workflow-1",
      requirements: "Test login functionality",
      acceptanceCriteria: [
        "User can login with valid credentials",
        "Login fails with invalid credentials",
        "Error message displayed on failure",
      ],
      priority: "high",
      status: "pending",
      assignedTo: ["Tester"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await testGenerationTool(task);

    expect(result.testCases.length).toBeGreaterThanOrEqual(
      task.acceptanceCriteria.length
    );

    task.acceptanceCriteria.forEach((criteria) => {
      const hasTestForCriteria = result.testCases.some((testCase) =>
        testCase.description
          .toLowerCase()
          .includes(criteria.toLowerCase().substring(0, 20))
      );
      expect(hasTestForCriteria).toBe(true);
    });
  });

  it("should generate appropriate test types based on requirement", async () => {
    const task: TestTask = {
      id: "test-task-3",
      workflowId: "workflow-1",
      componentToTest: "Button",
      requirements: "Create unit tests for Button component",
      acceptanceCriteria: [],
      priority: "high",
      status: "pending",
      assignedTo: ["Tester"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await testGenerationTool(task);

    const hasUnitTest = result.testCases.some(
      (testCase) => testCase.testType === "unit"
    );
    expect(hasUnitTest).toBe(true);
  });

  it("should generate integration tests for API endpoints", async () => {
    const task: TestTask = {
      id: "test-task-4",
      workflowId: "workflow-1",
      apiToTest: "POST /auth/login",
      requirements: "Test login API endpoint integration with database",
      acceptanceCriteria: [],
      priority: "high",
      status: "pending",
      assignedTo: ["Tester"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await testGenerationTool(task);

    const hasIntegrationTest = result.testCases.some(
      (testCase) => testCase.testType === "integration"
    );
    expect(hasIntegrationTest).toBe(true);
  });

  it("should include expected results in test cases", async () => {
    const task: TestTask = {
      id: "test-task-5",
      workflowId: "workflow-1",
      requirements: "Test Button component renders correctly",
      acceptanceCriteria: [
        "Button displays provided text",
        "Button is clickable",
      ],
      priority: "high",
      status: "pending",
      assignedTo: ["Tester"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await testGenerationTool(task);

    result.testCases.forEach((testCase) => {
      expect(testCase.expectedResult).toBeDefined();
      expect(testCase.expectedResult.length).toBeGreaterThan(0);
    });
  });

  it("should handle empty acceptance criteria gracefully", async () => {
    const task: TestTask = {
      id: "test-task-6",
      workflowId: "workflow-1",
      requirements: "Create tests for component",
      acceptanceCriteria: [],
      priority: "low",
      status: "pending",
      assignedTo: ["Tester"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await testGenerationTool(task);

    expect(result).toBeDefined();
    expect(result.testCases).toBeDefined();
  });

  it("should set appropriate test level", async () => {
    const task: TestTask = {
      id: "test-task-7",
      workflowId: "workflow-1",
      componentToTest: "Button",
      requirements: "Create unit tests",
      acceptanceCriteria: [],
      priority: "high",
      status: "pending",
      assignedTo: ["Tester"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await testGenerationTool(task);

    expect(result.testLevel).toBeDefined();
    expect(["unit", "integration", "e2e", "system"]).toContain(
      result.testLevel
    );
  });
});
