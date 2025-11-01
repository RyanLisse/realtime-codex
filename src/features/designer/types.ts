import { z } from "zod";
import { AgentType } from "../shared/types/workflow.types";

// Design task
export const DesignTaskSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  requirements: z.string(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["pending", "in_progress", "review", "approved", "completed"]),
  assignedTo: z.array(AgentType),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
});

export type DesignTask = z.infer<typeof DesignTaskSchema>;

// UI component specification
export const UIComponentSpecSchema = z.object({
  componentName: z.string(),
  description: z.string(),
  category: z.enum([
    "layout",
    "form",
    "display",
    "navigation",
    "feedback",
    "overlay",
  ]),
  props: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        required: z.boolean(),
        description: z.string().optional(),
        defaultValue: z.string().optional(),
        options: z.array(z.string()).optional(),
      })
    )
    .default([]),
  states: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
      })
    )
    .default([]),
  variants: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        example: z.string().optional(),
      })
    )
    .default([]),
  accessibility: z
    .object({
      arialLabel: z.string().optional(),
      keyboardNavigation: z.boolean().default(true),
      screenReaderSupport: z.boolean().default(true),
    })
    .optional(),
  responsiveBreakpoints: z
    .object({
      mobile: z.string().optional(),
      tablet: z.string().optional(),
      desktop: z.string().optional(),
    })
    .optional(),
});

export type UIComponentSpec = z.infer<typeof UIComponentSpecSchema>;

// Design artifact (wireframe/mockup)
export const DesignArtifactSchema = z.object({
  id: z.string(),
  type: z.enum(["wireframe", "mockup", "prototype", "specification"]),
  componentName: z.string(),
  description: z.string(),
  designUrl: z.string().optional(), // URL to design file or mockup
  figmaUrl: z.string().optional(),
  colorPalette: z
    .object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string(),
      neutral: z.string(),
      background: z.string(),
      text: z.string(),
      error: z.string().optional(),
      warning: z.string().optional(),
      success: z.string().optional(),
      info: z.string().optional(),
    })
    .optional(),
  typography: z
    .object({
      fontFamily: z.string(),
      fontSizeScale: z.object({
        xs: z.string(),
        sm: z.string(),
        base: z.string(),
        lg: z.string(),
        xl: z.string(),
        "2xl": z.string().optional(),
        "3xl": z.string().optional(),
      }),
      fontWeight: z.object({
        normal: z.string(),
        medium: z.string(),
        semibold: z.string(),
        bold: z.string(),
      }),
      lineHeight: z.string(),
    })
    .optional(),
  spacing: z
    .object({
      unit: z.string().default("8px"),
      scale: z.array(z.number()).default([0, 0.25, 0.5, 1, 1.5, 2, 3, 4, 6, 8]),
    })
    .optional(),
  components: z.array(UIComponentSpecSchema).default([]),
  metadata: z.object({
    workflowId: z.string(),
    agentType: AgentType,
    version: z.number().default(1),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
});

export type DesignArtifact = z.infer<typeof DesignArtifactSchema>;
