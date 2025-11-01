import type { DesignArtifact, DesignTask } from "../types";

export async function designSpecificationTool(
  task: DesignTask
): Promise<DesignArtifact> {
  // Parse requirements to extract design intent
  const designIntent = parseDesignIntent(task.requirements);

  // Generate component specifications
  const components = generateComponents(designIntent, task.requirements);

  // Generate design artifact
  const artifact: DesignArtifact = {
    id: generateDesignId(task.id),
    type: "specification",
    componentName: extractComponentName(task.requirements),
    description: task.requirements,
    components,
    colorPalette: generateColorPalette(task.requirements),
    typography: generateTypography(task.requirements),
    spacing: {
      unit: "8px",
      scale: [0, 0.25, 0.5, 1, 1.5, 2, 3, 4, 6, 8],
    },
    metadata: {
      workflowId: task.workflowId,
      agentType: "Designer",
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  return artifact;
}

function parseDesignIntent(requirements: string): {
  categories: string[];
  needsColor: boolean;
  needsTypography: boolean;
  needsComponents: boolean;
} {
  const lowerReq = requirements.toLowerCase();

  return {
    categories: extractCategories(lowerReq),
    needsColor:
      lowerReq.includes("color") ||
      lowerReq.includes("theme") ||
      lowerReq.includes("blue") ||
      lowerReq.includes("red"),
    needsTypography:
      lowerReq.includes("font") ||
      lowerReq.includes("typography") ||
      lowerReq.includes("text") ||
      lowerReq.includes("readable"),
    needsComponents:
      lowerReq.includes("component") ||
      lowerReq.includes("form") ||
      lowerReq.includes("button"),
  };
}

function extractCategories(text: string): string[] {
  const categories: string[] = [];

  if (
    text.includes("form") ||
    text.includes("input") ||
    text.includes("field")
  ) {
    categories.push("form");
  }
  if (
    text.includes("navigation") ||
    text.includes("menu") ||
    text.includes("sidebar")
  ) {
    categories.push("navigation");
  }
  if (
    text.includes("layout") ||
    text.includes("dashboard") ||
    text.includes("page")
  ) {
    categories.push("layout");
  }
  if (
    text.includes("display") ||
    text.includes("card") ||
    text.includes("list")
  ) {
    categories.push("display");
  }
  if (
    text.includes("button") ||
    text.includes("link") ||
    text.includes("action")
  ) {
    categories.push("feedback");
  }

  return categories.length > 0 ? categories : ["display"];
}

function extractComponentName(requirements: string): string {
  // Extract main component name from requirements
  const lowerReq = requirements.toLowerCase();

  if (lowerReq.includes("login form") || lowerReq.includes("login")) {
    return "LoginForm";
  }
  if (lowerReq.includes("dashboard")) {
    return "Dashboard";
  }
  if (lowerReq.includes("button")) {
    return "Button";
  }
  if (lowerReq.includes("card")) {
    return "Card";
  }
  if (lowerReq.includes("form")) {
    return "Form";
  }
  if (lowerReq.includes("navigation") || lowerReq.includes("nav")) {
    return "Navigation";
  }
  if (lowerReq.includes("sidebar")) {
    return "Sidebar";
  }

  return "Component";
}

function generateComponents(
  intent: ReturnType<typeof parseDesignIntent>,
  requirements: string
): DesignArtifact["components"] {
  const components: DesignArtifact["components"] = [];

  // Generate components based on categories
  if (intent.categories.includes("form")) {
    const needsResponsive =
      requirements.toLowerCase().includes("responsive") ||
      requirements.toLowerCase().includes("mobile") ||
      requirements.toLowerCase().includes("tablet") ||
      requirements.toLowerCase().includes("desktop");
    components.push({
      componentName: "Input",
      description: "Text input field for user data",
      category: "form",
      props: [
        {
          name: "label",
          type: "string",
          required: true,
          description: "Input label text",
        },
        {
          name: "type",
          type: "string",
          required: false,
          description: "Input type (text, email, password, etc.)",
          defaultValue: "text",
          options: ["text", "email", "password", "number", "tel"],
        },
        {
          name: "placeholder",
          type: "string",
          required: false,
          description: "Placeholder text",
        },
        {
          name: "required",
          type: "boolean",
          required: false,
          description: "Whether input is required",
          defaultValue: "false",
        },
      ],
      states: [
        { name: "default", description: "Initial state" },
        { name: "focused", description: "When input has focus" },
        { name: "filled", description: "When input has value" },
        { name: "error", description: "When validation fails" },
      ],
      accessibility: {
        keyboardNavigation: true,
        screenReaderSupport: true,
      },
      responsiveBreakpoints: needsResponsive
        ? {
            mobile: "max-width: 640px",
            tablet: "min-width: 641px and max-width: 1024px",
            desktop: "min-width: 1025px",
          }
        : undefined,
    });
  }

  if (
    intent.categories.includes("feedback") ||
    requirements.toLowerCase().includes("button")
  ) {
    components.push({
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
          options: ["primary", "secondary", "outline", "ghost"],
        },
        {
          name: "size",
          type: "string",
          required: false,
          description: "Button size",
          defaultValue: "medium",
          options: ["small", "medium", "large"],
        },
        {
          name: "disabled",
          type: "boolean",
          required: false,
          description: "Whether button is disabled",
          defaultValue: "false",
        },
      ],
      variants: [
        { name: "primary", description: "Primary action button" },
        { name: "secondary", description: "Secondary action button" },
        { name: "outline", description: "Outlined button style" },
      ],
      states: [
        { name: "default", description: "Default state" },
        { name: "hover", description: "Hover state" },
        { name: "active", description: "Pressed state" },
        { name: "disabled", description: "Disabled state" },
      ],
      accessibility: {
        keyboardNavigation: true,
        screenReaderSupport: true,
      },
    });
  }

  if (intent.categories.includes("layout")) {
    components.push({
      componentName: "Container",
      description: "Layout container component",
      category: "layout",
      props: [
        {
          name: "children",
          type: "ReactNode",
          required: true,
          description: "Content to display",
        },
        {
          name: "maxWidth",
          type: "string",
          required: false,
          description: "Maximum container width",
          defaultValue: "1200px",
        },
      ],
    });
  }

  // If no specific components were generated, create a generic one
  if (components.length === 0) {
    components.push({
      componentName: extractComponentName(requirements),
      description: requirements,
      category: "display",
      props: [],
      states: [],
      variants: [],
    });
  }

  return components;
}

function generateColorPalette(
  requirements: string
): DesignArtifact["colorPalette"] | undefined {
  const lowerReq = requirements.toLowerCase();

  // Check for color theme keywords
  if (
    lowerReq.includes("blue") ||
    lowerReq.includes("ocean") ||
    lowerReq.includes("sky")
  ) {
    return {
      primary: "#3b82f6",
      secondary: "#1e40af",
      accent: "#60a5fa",
      neutral: "#6b7280",
      background: "#ffffff",
      text: "#1f2937",
      error: "#ef4444",
      warning: "#f59e0b",
      success: "#10b981",
      info: "#3b82f6",
    };
  }

  if (lowerReq.includes("green") || lowerReq.includes("forest")) {
    return {
      primary: "#10b981",
      secondary: "#059669",
      accent: "#34d399",
      neutral: "#6b7280",
      background: "#ffffff",
      text: "#1f2937",
      error: "#ef4444",
      warning: "#f59e0b",
      success: "#10b981",
      info: "#3b82f6",
    };
  }

  if (lowerReq.includes("modern") || lowerReq.includes("clean")) {
    return {
      primary: "#000000",
      secondary: "#4b5563",
      accent: "#000000",
      neutral: "#9ca3af",
      background: "#ffffff",
      text: "#111827",
      error: "#dc2626",
      warning: "#d97706",
      success: "#16a34a",
      info: "#2563eb",
    };
  }

  // Default neutral palette
  return {
    primary: "#6366f1",
    secondary: "#8b5cf6",
    accent: "#06b6d4",
    neutral: "#6b7280",
    background: "#ffffff",
    text: "#1f2937",
  };
}

function generateTypography(
  requirements: string
): DesignArtifact["typography"] | undefined {
  const lowerReq = requirements.toLowerCase();

  if (lowerReq.includes("sans-serif") || lowerReq.includes("modern")) {
    return {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSizeScale: {
        xs: "0.75rem",
        sm: "0.875rem",
        base: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
      },
      fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
      lineHeight: "1.5",
    };
  }

  if (lowerReq.includes("serif") || lowerReq.includes("classic")) {
    return {
      fontFamily: "Georgia, serif",
      fontSizeScale: {
        xs: "0.75rem",
        sm: "0.875rem",
        base: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
      },
      fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
      lineHeight: "1.6",
    };
  }

  // Default typography
  return {
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSizeScale: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
    lineHeight: "1.5",
  };
}

function generateDesignId(taskId: string): string {
  return `design-${taskId}`;
}
