import type { ComponentProps } from "react";
import {
  Node,
  NodeContent,
  NodeDescription,
  NodeFooter,
  NodeHeader,
  NodeTitle,
} from "@/components/ai-elements/node";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/components/ui/utils";
import type {
  AgentStatus,
  AgentType,
} from "@/features/shared/types/workflow.types";

const STATE_LABEL: Record<AgentStatus["state"], string> = {
  idle: "Idle",
  pending: "Pending",
  active: "Active",
  completed: "Completed",
  failed: "Failed",
};

type ProjectManagerCardProps = {
  status: AgentStatus;
  handoffTargets?: AgentType[];
} & ComponentProps<typeof Node>;

export function ProjectManagerCard({
  status,
  handoffTargets = [],
  className,
  ...nodeProps
}: ProjectManagerCardProps) {
  const statusLabel = STATE_LABEL[status.state];
  const currentTaskDescription =
    status.currentTask ?? "No active task at the moment";
  const progressValue = Math.max(0, Math.min(100, Math.round(status.progress)));

  return (
    <Node
      className={cn("bg-card", className)}
      handles={{ target: true, source: true }}
      {...nodeProps}
    >
      <NodeHeader>
        <NodeTitle>Project Manager</NodeTitle>
        <NodeDescription>Orchestrates the entire workflow</NodeDescription>
      </NodeHeader>
      <NodeContent className="space-y-3">
        <div className="space-y-1">
          <p className="font-medium text-sm">Status: {statusLabel}</p>
          <p className="text-muted-foreground text-sm">
            {currentTaskDescription}
          </p>
        </div>
        <div className="space-y-1">
          <Progress
            aria-label="Workflow progress"
            max={100}
            value={progressValue}
          />
          <p className="font-medium text-sm">Progress: {progressValue}%</p>
          <p className="text-muted-foreground text-xs">
            Completed {status.completedTasks} of {status.totalTasks} tasks
          </p>
        </div>
      </NodeContent>
      <NodeFooter className="flex flex-wrap gap-2">
        <div className="space-y-1">
          <p className="font-semibold text-sm">Handoffs</p>
          {handoffTargets.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {handoffTargets.map((agent) => (
                <Badge key={agent} variant="secondary">
                  {formatAgentLabel(agent)}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">No pending handoffs</p>
          )}
        </div>
      </NodeFooter>
    </Node>
  );
}

function formatAgentLabel(agent: AgentType): string {
  switch (agent) {
    case "FrontendDeveloper":
      return "Frontend";
    case "BackendDeveloper":
      return "Backend";
    default:
      return agent.replace(/([a-z])([A-Z])/g, "$1 $2");
  }
}
