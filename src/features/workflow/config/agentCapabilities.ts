import { AgentType } from "../types/workflow.types";

interface CapabilityRule {
  keywords: string[];
}

const CAPABILITY_KEYWORDS: Record<AgentType, CapabilityRule> = {
  [AgentType.PROJECT_MANAGER]: {
    keywords: ["plan", "decompose", "roadmap", "spec"],
  },
  [AgentType.DESIGNER]: {
    keywords: ["design", "ui", "ux", "mockup", "wireframe", "visual", "layout"],
  },
  [AgentType.FRONTEND]: {
    keywords: [
      "frontend",
      "component",
      "react",
      "interface",
      "page",
      "screen",
      "css",
    ],
  },
  [AgentType.BACKEND]: {
    keywords: [
      "backend",
      "api",
      "endpoint",
      "service",
      "database",
      "auth",
      "server",
    ],
  },
  [AgentType.TESTER]: {
    keywords: ["test", "validate", "qa", "quality"],
  },
};

function textIncludesKeyword(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\b${escaped}\\b`, "i");
  return pattern.test(text);
}

export function inferRequiredAgents(
  description: string,
  requirements: string[] = []
): Set<AgentType> {
  const normalized = [description, ...requirements].join(" ").toLowerCase();
  const required = new Set<AgentType>([
    AgentType.PROJECT_MANAGER,
    AgentType.TESTER,
  ]);

  (
    Object.entries(CAPABILITY_KEYWORDS) as [AgentType, CapabilityRule][]
  ).forEach(([agent, rule]) => {
    if (agent === AgentType.PROJECT_MANAGER || agent === AgentType.TESTER) {
      return;
    }

    const matches = rule.keywords.some((keyword) =>
      textIncludesKeyword(normalized, keyword)
    );

    if (matches) {
      required.add(agent);
    }
  });

  // If no implementation agent detected, default to frontend for UI-centric tasks
  const hasImplementationAgent =
    required.has(AgentType.FRONTEND) || required.has(AgentType.BACKEND);
  if (!hasImplementationAgent) {
    required.add(AgentType.FRONTEND);
  }

  return required;
}

export function getCapabilityKeywords(): Record<AgentType, string[]> {
  return Object.fromEntries(
    (Object.entries(CAPABILITY_KEYWORDS) as [AgentType, CapabilityRule][]).map(
      ([agent, rule]) => [agent, [...rule.keywords]]
    )
  ) as Record<AgentType, string[]>;
}
