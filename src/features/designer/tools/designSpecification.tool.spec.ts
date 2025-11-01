import { describe, expect, it } from "vitest";
import type { DesignTask } from "../types";
import { designSpecificationTool } from "./designSpecification.tool";

describe("designSpecificationTool", () => {
  it("should generate design specification from requirements", async () => {
    const task: DesignTask = {
      id: "design-task-1",
      workflowId: "workflow-1",
      requirements: "Create a modern login form with email and password fields",
      priority: "high",
      status: "pending",
      assignedTo: ["Designer"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await designSpecificationTool(task);

    expect(result).toBeDefined();
    expect(result.componentName).toBeDefined();
    expect(result.description).toBeDefined();
    expect(result.componentName.length).toBeGreaterThan(0);
  });

  it("should identify UI components from requirements", async () => {
    const task: DesignTask = {
      id: "design-task-2",
      workflowId: "workflow-1",
      requirements:
        "Design user dashboard with navigation sidebar and content area",
      priority: "high",
      status: "pending",
      assignedTo: ["Designer"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await designSpecificationTool(task);

    expect(result).toBeDefined();
    expect(result.type).toBe("specification");
    expect(result.components).toBeDefined();
    expect(Array.isArray(result.components)).toBe(true);
  });

  it("should generate color palette", async () => {
    const task: DesignTask = {
      id: "design-task-3",
      workflowId: "workflow-1",
      requirements: "Create a blue-themed modern UI with clean aesthetics",
      priority: "medium",
      status: "pending",
      assignedTo: ["Designer"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await designSpecificationTool(task);

    expect(result.colorPalette).toBeDefined();
    if (result.colorPalette) {
      expect(result.colorPalette.primary).toBeDefined();
      expect(result.colorPalette.secondary).toBeDefined();
      expect(result.colorPalette.accent).toBeDefined();
      expect(result.colorPalette.background).toBeDefined();
    }
  });

  it("should generate typography specifications", async () => {
    const task: DesignTask = {
      id: "design-task-4",
      workflowId: "workflow-1",
      requirements: "Design with readable sans-serif typography",
      priority: "medium",
      status: "pending",
      assignedTo: ["Designer"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await designSpecificationTool(task);

    expect(result.typography).toBeDefined();
    if (result.typography) {
      expect(result.typography.fontFamily).toBeDefined();
      expect(result.typography.fontSizeScale).toBeDefined();
      expect(result.typography.fontWeight).toBeDefined();
    }
  });

  it("should generate component props specifications", async () => {
    const task: DesignTask = {
      id: "design-task-5",
      workflowId: "workflow-1",
      requirements:
        "Create a button component with primary and secondary variants",
      priority: "high",
      status: "pending",
      assignedTo: ["Designer"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await designSpecificationTool(task);

    expect(result.components.length).toBeGreaterThan(0);
    const buttonComponent = result.components.find((c) =>
      c.componentName.toLowerCase().includes("button")
    );

    if (buttonComponent) {
      expect(buttonComponent.props).toBeDefined();
      expect(Array.isArray(buttonComponent.props)).toBe(true);
      expect(buttonComponent.variants.length).toBeGreaterThan(0);
    }
  });

  it("should handle empty requirements gracefully", async () => {
    const task: DesignTask = {
      id: "design-task-6",
      workflowId: "workflow-1",
      requirements: "",
      priority: "low",
      status: "pending",
      assignedTo: ["Designer"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await designSpecificationTool(task);

    expect(result).toBeDefined();
    expect(result.componentName).toBeDefined();
  });

  it("should include responsive breakpoints", async () => {
    const task: DesignTask = {
      id: "design-task-7",
      workflowId: "workflow-1",
      requirements:
        "Create responsive form that works on mobile, tablet, and desktop",
      priority: "high",
      status: "pending",
      assignedTo: ["Designer"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await designSpecificationTool(task);

    const hasResponsiveComponent = result.components.some(
      (c) => c.responsiveBreakpoints !== undefined
    );

    expect(hasResponsiveComponent).toBe(true);
  });

  it("should include accessibility specifications", async () => {
    const task: DesignTask = {
      id: "design-task-8",
      workflowId: "workflow-1",
      requirements: "Create accessible form inputs with ARIA labels",
      priority: "high",
      status: "pending",
      assignedTo: ["Designer"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await designSpecificationTool(task);

    const hasAccessibleComponent = result.components.some(
      (c) => c.accessibility !== undefined
    );

    expect(hasAccessibleComponent).toBe(true);
  });
});
