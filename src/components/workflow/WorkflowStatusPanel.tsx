"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AgentType,
  type Workflow,
} from "@/features/workflow/types/workflow.types";

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
    <Card className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Workflow Status</h3>
        <Badge className={getStatusColor(workflow.status)}>
          {workflow.status}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress className="h-2" value={progress} />
        <div className="text-gray-500 text-xs">
          {completedTasks} of {totalTasks} tasks completed
        </div>
      </div>

      {currentAgent && (
        <div className="space-y-2">
          <div className="font-medium text-sm">Current Agent</div>
          <Badge className={getAgentBadgeColor(currentAgent)}>
            {currentAgent}
          </Badge>
        </div>
      )}

      {routingDecisions.length > 0 && (
        <div className="space-y-2">
          <div className="font-medium text-sm">Routing Decisions</div>
          <div className="space-y-1">
            {routingDecisions.slice(-5).map((decision, index) => (
              <div
                className="flex items-center gap-2 text-gray-600 text-xs"
                key={index}
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
          <div className="font-medium text-sm">Completed Agents</div>
          <div className="flex flex-wrap gap-2">
            {Array.from(
              new Set(workflow.completedTasks.map((t) => t.assignedAgent))
            ).map((agent) => (
              <Badge
                className={getAgentBadgeColor(agent)}
                key={agent}
                variant="outline"
              >
                {agent}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {workflow.taskQueue.length > 0 && (
        <div className="space-y-2">
          <div className="font-medium text-sm">Pending Agents</div>
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
