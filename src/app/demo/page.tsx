"use client";

import { Canvas } from "@/components/ai-elements/canvas";
import { Edge } from "@/components/ai-elements/edge";
import {
  Node,
  NodeContent,
  NodeDescription,
  NodeFooter,
  NodeHeader,
  NodeTitle,
} from "@/components/ai-elements/node";

// Fixed IDs to prevent hydration mismatch
const nodeIds = {
  projectManager: "project-manager-id",
  designer: "designer-id",
  frontend: "frontend-id",
  backend: "backend-id",
  tester: "tester-id",
};

const nodes = [
  {
    id: nodeIds.projectManager,
    type: "agent",
    position: { x: 250, y: 200 },
    data: {
      label: "Project Manager",
      description: "Coordinates work and creates requirements",
      handles: { target: false, source: true },
      content: "Breaking down tasks...",
      footer: "Status: Active",
      agentType: "ProjectManager",
    },
  },
  {
    id: nodeIds.designer,
    type: "agent",
    position: { x: 600, y: 0 },
    data: {
      label: "UI/UX Designer",
      description: "Produces design specifications",
      handles: { target: true, source: true },
      content: "Creating UI mockups...",
      footer: "Status: Pending",
      agentType: "Designer",
    },
  },
  {
    id: nodeIds.frontend,
    type: "agent",
    position: { x: 600, y: 150 },
    data: {
      label: "Frontend Developer",
      description: "Implements UI components",
      handles: { target: true, source: true },
      content: "Waiting for design specs...",
      footer: "Status: Pending",
      agentType: "FrontendDeveloper",
    },
  },
  {
    id: nodeIds.backend,
    type: "agent",
    position: { x: 600, y: 300 },
    data: {
      label: "Backend Developer",
      description: "Implements APIs and logic",
      handles: { target: true, source: true },
      content: "Waiting for requirements...",
      footer: "Status: Pending",
      agentType: "BackendDeveloper",
    },
  },
  {
    id: nodeIds.tester,
    type: "agent",
    position: { x: 600, y: 450 },
    data: {
      label: "Tester",
      description: "Validates outputs",
      handles: { target: true, source: false },
      content: "Waiting for implementations...",
      footer: "Status: Pending",
      agentType: "Tester",
    },
  },
];

const edges = [
  {
    id: "edge-pm-designer",
    source: nodeIds.projectManager,
    target: nodeIds.designer,
    type: "animated",
    animated: true,
  },
  {
    id: "edge-pm-frontend",
    source: nodeIds.projectManager,
    target: nodeIds.frontend,
    type: "animated",
    animated: true,
  },
  {
    id: "edge-pm-backend",
    source: nodeIds.projectManager,
    target: nodeIds.backend,
    type: "temporary",
    animated: false,
  },
  {
    id: "edge-designer-frontend",
    source: nodeIds.designer,
    target: nodeIds.frontend,
    type: "temporary",
    animated: false,
  },
  {
    id: "edge-frontend-tester",
    source: nodeIds.frontend,
    target: nodeIds.tester,
    type: "temporary",
    animated: false,
  },
  {
    id: "edge-backend-tester",
    source: nodeIds.backend,
    target: nodeIds.tester,
    type: "temporary",
    animated: false,
  },
];

const nodeTypes = {
  agent: ({
    data,
  }: {
    data: {
      label: string;
      description: string;
      handles: { target: boolean; source: boolean };
      content: string;
      footer: string;
      agentType: string;
    };
  }) => (
    <Node handles={data.handles}>
      <NodeHeader>
        <NodeTitle>{data.label}</NodeTitle>
        <NodeDescription>{data.description}</NodeDescription>
      </NodeHeader>
      <NodeContent>
        <p className="text-muted-foreground text-sm">{data.content}</p>
      </NodeContent>
      <NodeFooter>
        <p className="font-semibold text-xs">{data.footer}</p>
      </NodeFooter>
    </Node>
  ),
};

const edgeTypes = {
  animated: Edge.Animated,
  temporary: Edge.Temporary,
};

export default function DemoPage() {
  return (
    <div className="h-screen w-screen">
      <div className="border-b bg-card p-4">
        <h1 className="font-bold text-2xl">Multi-Agent Workflow System Demo</h1>
        <p className="text-muted-foreground text-sm">
          Visualizing agent coordination with AI Elements Canvas
        </p>
      </div>
      <Canvas
        edges={edges}
        edgeTypes={edgeTypes}
        fitView
        nodes={nodes}
        nodeTypes={nodeTypes}
      />
    </div>
  );
}
