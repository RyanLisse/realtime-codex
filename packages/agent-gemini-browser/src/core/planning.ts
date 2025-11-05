/**
 * Pure functions for Gemini planning logic
 * No side effects - just planning logic
 */

// Regex patterns defined at top level for performance
const URL_PATTERN = /https?:\/\/[^\s]+/;
const SELECTOR_PATTERN = /selector[:\s]+([^\s]+)/i;

/**
 * Plan step type
 */
export type PlanStep = {
  action: string;
  target: string;
  description: string;
  expectedResult?: string;
};

/**
 * Create a plan from task description (pure function)
 */
export function createPlan(taskDescription: string): PlanStep[] {
  // Simple planning logic - can be enhanced with LLM
  const steps: PlanStep[] = [];

  // Parse task and create steps
  if (taskDescription.toLowerCase().includes("navigate")) {
    const urlMatch = taskDescription.match(URL_PATTERN);
    if (urlMatch?.[0]) {
      steps.push({
        action: "navigate",
        target: urlMatch[0],
        description: `Navigate to ${urlMatch[0]}`,
      });
    }
  }

  if (taskDescription.toLowerCase().includes("click")) {
    const selectorMatch = taskDescription.match(SELECTOR_PATTERN);
    if (selectorMatch?.[1]) {
      steps.push({
        action: "click",
        target: selectorMatch[1],
        description: `Click element with selector ${selectorMatch[1]}`,
      });
    }
  }

  return steps;
}

/**
 * Validate plan steps (pure function)
 */
export function validatePlan(steps: PlanStep[]): boolean {
  return steps.length > 0 && steps.every((step) => step.action && step.target);
}

/**
 * Combine multiple plans (pure function)
 */
export function combinePlans(plans: PlanStep[][]): PlanStep[] {
  return plans.flat();
}

/**
 * Plan browser action from task description
 * Pure function for Gemini planning
 */
export function planBrowserAction(taskDescription: string): PlanStep[] {
  return createPlan(taskDescription);
}
