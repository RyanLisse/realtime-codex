import type { ReactNode } from "react";
import { vi } from "vitest";
import type { AgentStatus } from "@/features/shared/types/workflow.types";
import { renderWithProviders, screen } from "@/test-utils/test-utils";
import { ProjectManagerCard } from "./ProjectManagerCard";

vi.mock("@xyflow/react", () => ({
  Handle: ({ children }: { children?: ReactNode }) => (
    <div data-testid="handle">{children}</div>
  ),
  Position: { Left: "left", Right: "right" },
}));

describe("ProjectManagerCard", () => {
  const baseStatus: AgentStatus = {
    agentType: "ProjectManager",
    state: "pending",
    progress: 0,
    completedTasks: 0,
    totalTasks: 0,
  };

  it("renders the pending state", () => {
    renderWithProviders(
      <ProjectManagerCard status={{ ...baseStatus, state: "pending" }} />
    );

    expect(screen.getByText("Project Manager")).toBeInTheDocument();
    expect(screen.getByText(/Status: Pending/i)).toBeInTheDocument();
    expect(screen.getByText(/No active task/i)).toBeInTheDocument();
  });

  it("shows progress and task counts", () => {
    renderWithProviders(
      <ProjectManagerCard
        status={{
          ...baseStatus,
          state: "active",
          progress: 40,
          completedTasks: 2,
          totalTasks: 5,
          currentTask: "Coordinating frontend and backend",
        }}
      />
    );

    expect(
      screen.getByText(/Coordinating frontend and backend/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Progress: 40%")).toBeInTheDocument();
    expect(screen.getByText("Completed 2 of 5 tasks")).toBeInTheDocument();
  });

  it("displays handoff indicators when provided", () => {
    renderWithProviders(
      <ProjectManagerCard
        handoffTargets={["Designer", "Tester"]}
        status={{ ...baseStatus, state: "active" }}
      />
    );

    expect(screen.getByText("Handoffs")).toBeInTheDocument();
    expect(screen.getByText("Designer")).toBeInTheDocument();
    expect(screen.getByText("Tester")).toBeInTheDocument();
  });

  it("shows a fallback message when no handoffs are pending", () => {
    renderWithProviders(
      <ProjectManagerCard status={{ ...baseStatus, state: "completed" }} />
    );

    expect(screen.getByText("Handoffs")).toBeInTheDocument();
    expect(screen.getByText(/No pending handoffs/i)).toBeInTheDocument();
  });
});
