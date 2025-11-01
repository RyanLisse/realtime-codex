import type { AgentType, TaskList } from "../../shared/types/workflow.types";
import type { TaskDecomposition } from "../types";

export async function taskDecompositionTool(
  taskList: TaskList
): Promise<TaskDecomposition> {
  const subtasks = taskList.tasks.map((task) => {
    // Assign agent based on task description keywords
    const assignedAgent = assignAgentToTask(task.description);

    return {
      id: task.id,
      description: task.description,
      assignedAgent,
      priority: task.priority || "medium",
      estimatedDuration: task.estimatedDuration,
      dependencies: task.dependencies,
    };
  });

  // Build dependency graph
  const dependencies = buildDependencies(taskList.tasks);

  // Identify parallel execution groups
  const canRunInParallel = identifyParallelGroups(subtasks);

  return {
    originalTask: taskList.title,
    subtasks,
    dependencies,
    canRunInParallel,
  };
}

function assignAgentToTask(description: string): AgentType {
  const lowerDesc = description.toLowerCase();

  // Keyword-based agent assignment
  if (
    lowerDesc.includes("design") ||
    lowerDesc.includes("ui/ux") ||
    lowerDesc.includes("mockup") ||
    lowerDesc.includes("visual") ||
    lowerDesc.includes("layout")
  ) {
    return "Designer";
  }

  if (
    lowerDesc.includes("react") ||
    lowerDesc.includes("component") ||
    lowerDesc.includes("frontend") ||
    lowerDesc.includes("ui") ||
    lowerDesc.includes("button") ||
    lowerDesc.includes("form")
  ) {
    return "FrontendDeveloper";
  }

  if (
    lowerDesc.includes("api") ||
    lowerDesc.includes("backend") ||
    lowerDesc.includes("endpoint") ||
    lowerDesc.includes("database") ||
    lowerDesc.includes("server")
  ) {
    return "BackendDeveloper";
  }

  if (
    lowerDesc.includes("test") ||
    lowerDesc.includes("validate") ||
    lowerDesc.includes("quality") ||
    lowerDesc.includes("coverage")
  ) {
    return "Tester";
  }

  // Default to Project Manager for unclear tasks
  return "ProjectManager";
}

function buildDependencies(tasks: TaskList["tasks"]): Array<{
  from: string;
  to: string;
  type: "blocking" | "informational";
}> {
  const deps: Array<{
    from: string;
    to: string;
    type: "blocking" | "informational";
  }> = [];

  tasks.forEach((task) => {
    task.dependencies.forEach((depId) => {
      deps.push({
        from: depId,
        to: task.id,
        type: "blocking", // All explicit dependencies are blocking
      });
    });
  });

  return deps;
}

function identifyParallelGroups(
  subtasks: Array<{
    id: string;
    dependencies: string[];
    assignedAgent: AgentType;
  }>
): AgentType[][] {
  // Find groups of tasks that can run in parallel
  // Tasks can run in parallel if:
  // 1. They have no dependencies on each other
  // 2. They are assigned to different agents

  const groups: AgentType[][] = [];
  const agentGroups = new Map<AgentType, Set<string>>();

  // Group by agent
  subtasks.forEach((subtask) => {
    if (!agentGroups.has(subtask.assignedAgent)) {
      agentGroups.set(subtask.assignedAgent, new Set());
    }
    agentGroups.get(subtask.assignedAgent)?.add(subtask.id);
  });

  // Find independent agent groups
  const independentAgents: AgentType[] = [];

  agentGroups.forEach((taskIds, agent) => {
    // Check if tasks in this agent group have dependencies on other agent groups
    const hasExternalDeps = Array.from(taskIds).some((taskId) => {
      const subtask = subtasks.find((t) => t.id === taskId);
      if (!subtask) {
        return false;
      }

      return subtask.dependencies.some((depId) => {
        const depSubtask = subtasks.find((t) => t.id === depId);
        return depSubtask && depSubtask.assignedAgent !== agent;
      });
    });

    if (!hasExternalDeps) {
      independentAgents.push(agent);
    }
  });

  // Create parallel groups of independent agents
  if (independentAgents.length > 1) {
    groups.push(independentAgents);
  }

  // Also check for specific combinations that commonly work in parallel
  // Frontend + Backend can often work in parallel on different features
  const hasFrontend = independentAgents.includes("FrontendDeveloper");
  const hasBackend = independentAgents.includes("BackendDeveloper");

  if (hasFrontend && hasBackend) {
    const frontendBackendGroup = [
      "FrontendDeveloper",
      "BackendDeveloper",
    ] as AgentType[];
    if (
      !groups.some(
        (g) =>
          g.length === frontendBackendGroup.length &&
          g.every((agent, i) => agent === frontendBackendGroup[i])
      )
    ) {
      groups.push(frontendBackendGroup);
    }
  }

  return groups;
}
