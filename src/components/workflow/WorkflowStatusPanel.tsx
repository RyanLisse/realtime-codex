"use client";

import { AgentType, type Workflow } from "@/features/workflow/types/workflow.types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface WorkflowStatusPanelProps {
  workflow: Workflow;
}

export function WorkflowStatusPanel({ workflow }: WorkflowStatusPanelProps) {
  const totalTasks = workflow.taskQueue.length + workflow.completedTasks.length;
  const completedTasks = workflow.completedTasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in_progress":
        return "bg-blue-500";
      case "paused":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getAgentBadgeColor = (agentType: AgentType) => {
    switch (agentType) {
      case AgentType.PROJECT_MANAGER:
        return "bg-purple-500";
      case AgentType.DESIGNER:
        return "bg-pink-500";
      case AgentType.FRONTEND:
        return "bg-blue-500";
      case AgentType.BACKEND:
        return "bg-green-500";
      case AgentType.TESTER:
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const currentAgent = workflow.currentAgent;
  const routingDecisions = workflow.history
    .filter((record) => record.success)
    .map((record) => ({
      from: record.fromAgent,
      to: record.toAgent,
      timestamp: record.timestamp,
    }));

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Workflow Status</h3>
        <Badge className={getStatusColor(workflow.status)}>
          {workflow.status}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="text-xs text-gray-500">
          {completedTasks} of {totalTasks} tasks completed
        </div>
      </div>

      {currentAgent && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Current Agent</div>
          <Badge className={getAgentBadgeColor(currentAgent)}>
            {currentAgent}
          </Badge>
        </div>
      )}

      {routingDecisions.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Routing Decisions</div>
          <div className="space-y-1">
            {routingDecisions.slice(-5).map((decision, index) => (
              <div
                key={index}
                className="text-xs text-gray-600 flex items-center gap-2"
              >
                <span className="font-mono">
                  {decision.from} → {decision.to}
                </span>
                <span className="text-gray-400">
                  {decision.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {workflow.completedTasks.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Completed Agents</div>
          <div className="flex flex-wrap gap-2">
            {Array.from(
              new Set(workflow.completedTasks.map((t) => t.assignedAgent))
            ).map((agent) => (
              <Badge
                key={agent}
                variant="outline"
                className={getAgentBadgeColor(agent)}
              >
                {agent}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {workflow.taskQueue.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Pending Agents</div>
          <div className="flex flex-wrap gap-2">
            {Array.from(
              new Set(workflow.taskQueue.map((t) => t.assignedAgent))
            ).map((agent) => (
              <Badge key={agent} variant="outline">
                {agent}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

