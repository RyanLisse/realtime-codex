import { describe, expect, it } from "vitest";
import type { DesignArtifact } from "../../designer/types";
import type { FrontendTask } from "../types";
import { componentGenerationTool } from "./componentGeneration.tool";

describe("componentGenerationTool", () => {
  it("should generate React component code from design spec", async () => {
    const designSpec: DesignArtifact = {
      id: "design-1",
      type: "specification",
      componentName: "Button",
      description: "Primary action button",
      components: [
        {
          componentName: "Button",
          description: "Interactive button component",
          category: "feedback",
          props: [
            {
              name: "children",
              type: "ReactNode",
              required: true,
              description: "Button label",
            },
            {
              name: "variant",
              type: "string",
              required: false,
              description: "Button style variant",
              defaultValue: "primary",
              options: ["primary", "secondary"],
            },
          ],
          variants: [
            { name: "primary", description: "Primary action button" },
            { name: "secondary", description: "Secondary action button" },
          ],
          states: [],
        },
      ],
      metadata: {
        workflowId: "workflow-1",
        agentType: "Designer",
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    const task: FrontendTask = {
      id: "frontend-task-1",
      workflowId: "workflow-1",
      designSpec,
      requirements: "Implement Button component",
      priority: "high",
      status: "pending",
      assignedTo: ["FrontendDeveloper"],
      dependencies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await componentGenerationTool(task);

    expect(result).toBeDefined();
    expect(result.components).toBeDefined();
    expect(result.components.length).toBeGreaterThan(0);

    const buttonComponent = result.components.find(
      (c) => c.componentName === "Button"
    );

    expect(buttonComponent).toBeDefined();
    expect(buttonComponent?.code).toContain("export");
    expect(buttonComponent?.code).toContain("Button");
  });

  it("should generate TypeScript types for props", async () => {
    const designSpec: DesignArtifact = {
      id: "design-2",
      type: "specification",
      componentName: "Input",
      description: "Text input component",
      components: [
        {
          componentName: "Input",
          description: "Text input field",
          category: "form",
          props: [
            {
              name: "label",
              type: "string",
              required: true,
              description: "Input label",
            },
            {
              name: "value",
              type: "string",
              required: false,
              description: "Input value",
            },
          ],
          states: [],
        },
      ],
      metadata: {
        workflowId: "workflow-1",
        agentType: "Designer",
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    const task: FrontendTask = {
      id: "frontend-task-2",
      workflowId: "workflow-1",
      designSpec,
      requirements: "Implement Input component",
      priority: "high",
      status: "pending",
      assignedTo: ["FrontendDeveloper"],
      dependencies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await componentGenerationTool(task);
    const inputComponent = result.components.find(
      (c) => c.componentName === "Input"
    );

    expect(inputComponent).toBeDefined();
    expect(inputComponent?.code).toContain("interface");
    expect(inputComponent?.code).toContain("Props");
    expect(inputComponent?.code).toContain("label");
  });

  it("should generate component with proper imports", async () => {
    const designSpec: DesignArtifact = {
      id: "design-3",
      type: "specification",
      componentName: "Button",
      description: "Button component",
      components: [
        {
          componentName: "Button",
          description: "Button",
          category: "feedback",
          props: [],
          states: [],
        },
      ],
      metadata: {
        workflowId: "workflow-1",
        agentType: "Designer",
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    const task: FrontendTask = {
      id: "frontend-task-3",
      workflowId: "workflow-1",
      designSpec,
      requirements: "Implement Button",
      priority: "high",
      status: "pending",
      assignedTo: ["FrontendDeveloper"],
      dependencies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await componentGenerationTool(task);
    const component = result.components[0];

    expect(component.imports).toBeDefined();
    expect(component.imports.length).toBeGreaterThan(0);
    expect(component.imports.some((imp) => imp.module === "react")).toBe(true);
  });

  it("should generate styled components with color palette", async () => {
    const designSpec: DesignArtifact = {
      id: "design-4",
      type: "specification",
      componentName: "Button",
      description: "Styled button",
      components: [
        {
          componentName: "Button",
          description: "Styled button",
          category: "feedback",
          props: [],
          states: [],
        },
      ],
      colorPalette: {
        primary: "#3b82f6",
        secondary: "#1e40af",
        accent: "#60a5fa",
        neutral: "#6b7280",
        background: "#ffffff",
        text: "#1f2937",
      },
      metadata: {
        workflowId: "workflow-1",
        agentType: "Designer",
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    const task: FrontendTask = {
      id: "frontend-task-4",
      workflowId: "workflow-1",
      designSpec,
      requirements: "Implement styled Button",
      priority: "high",
      status: "pending",
      assignedTo: ["FrontendDeveloper"],
      dependencies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await componentGenerationTool(task);

    expect(result.stylesheets).toBeDefined();
    expect(Array.isArray(result.stylesheets)).toBe(true);
  });

  it("should handle empty design spec gracefully", async () => {
    const task: FrontendTask = {
      id: "frontend-task-5",
      workflowId: "workflow-1",
      requirements: "Implement component from requirements",
      priority: "medium",
      status: "pending",
      assignedTo: ["FrontendDeveloper"],
      dependencies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await componentGenerationTool(task);

    expect(result).toBeDefined();
    expect(result.components).toBeDefined();
    expect(Array.isArray(result.components)).toBe(true);
  });

  it("should generate component with states and variants", async () => {
    const designSpec: DesignArtifact = {
      id: "design-6",
      type: "specification",
      componentName: "Button",
      description: "Button with variants",
      components: [
        {
          componentName: "Button",
          description: "Button component",
          category: "feedback",
          props: [],
          states: [
            { name: "default", description: "Default state" },
            { name: "hover", description: "Hover state" },
            { name: "disabled", description: "Disabled state" },
          ],
          variants: [{ name: "primary", description: "Primary button" }],
        },
      ],
      metadata: {
        workflowId: "workflow-1",
        agentType: "Designer",
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    const task: FrontendTask = {
      id: "frontend-task-6",
      workflowId: "workflow-1",
      designSpec,
      requirements: "Implement Button with states",
      priority: "high",
      status: "pending",
      assignedTo: ["FrontendDeveloper"],
      dependencies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await componentGenerationTool(task);
    const component = result.components[0];

    expect(component).toBeDefined();
    // Verify component has proper structure
    expect(component.code).toContain("export");
    expect(component.code).toContain("Button");
    expect(component.code).toContain("React.FC");

    // Verify stylesheet was generated with hover state
    if (result.stylesheets.length > 0) {
      const stylesheet = result.stylesheets[0];
      expect(stylesheet.content).toContain("hover");
    }
  });
});
