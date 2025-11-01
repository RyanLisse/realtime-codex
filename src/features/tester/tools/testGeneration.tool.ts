import type { TestPlanArtifact, TestTask } from "../types";

export async function testGenerationTool(
  task: TestTask
): Promise<TestPlanArtifact> {
  const requirements = task.requirements.toLowerCase();

  // Determine test level based on what's being tested
  const testLevel = determineTestLevel(requirements);

  // Generate test cases from acceptance criteria
  const testCases = generateTestCases(
    task.acceptanceCriteria,
    task.requirements,
    testLevel
  );

  // If no acceptance criteria provided, generate basic tests
  if (testCases.length === 0) {
    testCases.push(...generateBasicTests(task, requirements, testLevel));
  }

  return {
    id: generateArtifactId(task.id),
    workflowTaskId: task.id,
    title: `Test Plan: ${task.componentToTest || task.apiToTest || "Component"}`,
    description: task.requirements,
    testLevel,
    testCases,
    testStrategy: generateTestStrategy(testLevel),
    coverage: calculateCoverage(testCases),
    metadata: {
      workflowId: task.workflowId,
      agentType: "Tester",
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

function determineTestLevel(
  requirements: string
): "unit" | "integration" | "e2e" | "system" {
  const lowerReq = requirements.toLowerCase();

  if (
    lowerReq.includes("e2e") ||
    lowerReq.includes("end-to-end") ||
    lowerReq.includes("user flow")
  ) {
    return "e2e";
  }

  if (
    lowerReq.includes("integration") ||
    lowerReq.includes("api") ||
    lowerReq.includes("database")
  ) {
    return "integration";
  }

  if (
    lowerReq.includes("system") ||
    lowerReq.includes("performance") ||
    lowerReq.includes("load")
  ) {
    return "system";
  }

  // Default to unit tests
  return "unit";
}

function generateTestCases(
  acceptanceCriteria: string[],
  requirements: string,
  testLevel: string
): TestPlanArtifact["testCases"] {
  const testCases: TestPlanArtifact["testCases"] = [];

  acceptanceCriteria.forEach((criteria, idx) => {
    const testType = getTestType(requirements, criteria);

    testCases.push({
      id: `test-case-${idx + 1}`,
      name: `Test: ${criteria.substring(0, 50)}`,
      description: criteria,
      testType: testType as any,
      steps: generateTestSteps(criteria),
      expectedResult: generateExpectedResult(criteria, testType),
      status: "pending",
      priority: determinePriority(criteria),
      tags: extractTags(requirements),
    });
  });

  return testCases;
}

function getTestType(requirements: string, criteria: string): string {
  const combined = (requirements + " " + criteria).toLowerCase();

  if (
    combined.includes("api") ||
    combined.includes("endpoint") ||
    combined.includes("database")
  ) {
    return "integration";
  }
  if (
    combined.includes("user") ||
    combined.includes("flow") ||
    combined.includes("scenario")
  ) {
    return "e2e";
  }
  if (
    combined.includes("performance") ||
    combined.includes("load") ||
    combined.includes("stress")
  ) {
    return "performance";
  }

  return "unit";
}

function generateTestSteps(
  criteria: string
): Array<{ step: string; expectedResult: string }> {
  // Generate basic test steps from criteria
  const steps: Array<{ step: string; expectedResult: string }> = [];

  steps.push({
    step: "Setup test environment",
    expectedResult: "Test environment is ready",
  });

  steps.push({
    step: `Execute: ${criteria}`,
    expectedResult: "Action completes successfully",
  });

  steps.push({
    step: "Verify result",
    expectedResult: "Expected outcome matches criteria",
  });

  return steps;
}

function generateExpectedResult(criteria: string, testType: string): string {
  const lowerCriteria = criteria.toLowerCase();

  if (lowerCriteria.includes("render")) {
    return "Component renders without errors";
  }
  if (lowerCriteria.includes("click")) {
    return "Click event is triggered correctly";
  }
  if (lowerCriteria.includes("display")) {
    return "Expected content is displayed";
  }
  if (lowerCriteria.includes("error")) {
    return "Error is handled gracefully";
  }
  if (lowerCriteria.includes("valid") || lowerCriteria.includes("success")) {
    return "Validation passes or operation succeeds";
  }
  if (lowerCriteria.includes("invalid") || lowerCriteria.includes("fail")) {
    return "Validation fails or operation is rejected";
  }

  return "Expected behavior matches acceptance criteria";
}

function determinePriority(
  criteria: string
): "low" | "medium" | "high" | "critical" {
  const lowerCriteria = criteria.toLowerCase();

  if (
    lowerCriteria.includes("critical") ||
    lowerCriteria.includes("security") ||
    lowerCriteria.includes("data loss")
  ) {
    return "critical";
  }

  if (
    lowerCriteria.includes("must") ||
    lowerCriteria.includes("required") ||
    lowerCriteria.includes("blocking")
  ) {
    return "high";
  }

  if (lowerCriteria.includes("should") || lowerCriteria.includes("important")) {
    return "medium";
  }

  return "low";
}

function extractTags(requirements: string): string[] {
  const tags: string[] = [];
  const lowerReq = requirements.toLowerCase();

  if (lowerReq.includes("component")) tags.push("component");
  if (lowerReq.includes("api")) tags.push("api");
  if (lowerReq.includes("form")) tags.push("form");
  if (lowerReq.includes("button")) tags.push("button");
  if (lowerReq.includes("input")) tags.push("input");
  if (lowerReq.includes("authentication") || lowerReq.includes("auth"))
    tags.push("authentication");
  if (lowerReq.includes("user")) tags.push("user");

  return tags;
}

function generateBasicTests(
  task: TestTask,
  requirements: string,
  testLevel: string
): TestPlanArtifact["testCases"] {
  const testCases: TestPlanArtifact["testCases"] = [];

  // Generate default test cases
  if (task.componentToTest) {
    testCases.push({
      id: "test-case-basic-1",
      name: "Component renders correctly",
      description: "Verify that the component renders without errors",
      testType: "unit" as any,
      steps: [
        {
          step: "Mount component",
          expectedResult: "Component mounts successfully",
        },
        { step: "Check for errors", expectedResult: "No errors in console" },
      ],
      expectedResult: "Component renders without errors",
      status: "pending",
      priority: "high",
      tags: ["rendering"],
    });

    testCases.push({
      id: "test-case-basic-2",
      name: "Component accepts props",
      description: "Verify that the component accepts and uses props correctly",
      testType: "unit" as any,
      steps: [
        {
          step: "Pass props to component",
          expectedResult: "Props are accepted",
        },
        {
          step: "Verify prop usage",
          expectedResult: "Component uses props correctly",
        },
      ],
      expectedResult: "Component correctly uses provided props",
      status: "pending",
      priority: "high",
      tags: ["props"],
    });
  }

  if (task.apiToTest) {
    testCases.push({
      id: "test-case-api-1",
      name: "API endpoint responds correctly",
      description: "Verify that the API endpoint responds with correct status",
      testType: "integration" as any,
      steps: [
        { step: "Send request to API", expectedResult: "Request is sent" },
        { step: "Receive response", expectedResult: "Response is received" },
      ],
      expectedResult: "API responds with expected status code",
      status: "pending",
      priority: "high",
      tags: ["api"],
    });
  }

  return testCases;
}

function generateTestStrategy(testLevel: string): string {
  const strategies: Record<string, string> = {
    unit: "Unit tests focus on testing individual components or functions in isolation, mocking dependencies to ensure each piece works correctly on its own.",
    integration:
      "Integration tests verify that multiple components work together correctly, testing API endpoints with database interactions and external services.",
    e2e: "End-to-end tests validate complete user workflows from start to finish, ensuring the entire application works as expected from a user perspective.",
    system:
      "System tests evaluate the entire system performance, scalability, and reliability under various load conditions.",
  };

  return strategies[testLevel] || strategies.unit;
}

function calculateCoverage(
  testCases: TestPlanArtifact["testCases"]
): TestPlanArtifact["coverage"] {
  const total = testCases.length;
  const covered = testCases.filter(
    (tc) => tc.status === "pass" || tc.status === "completed"
  ).length;

  return {
    total,
    covered,
    percentage: total > 0 ? Math.round((covered / total) * 100) : 0,
  };
}

function generateArtifactId(taskId: string): string {
  return `test-plan-${taskId}`;
}
