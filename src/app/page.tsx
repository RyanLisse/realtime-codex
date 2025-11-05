"use client";

import { hostedMcpTool } from "@openai/agents";
import {
  type OutputGuardrailTripwireTriggered,
  RealtimeAgent,
  type RealtimeItem,
  type RealtimeOutputGuardrail,
  RealtimeSession,
  type TransportEvent,
} from "@openai/agents/realtime";
import type {
  GuardrailFunctionOutput,
  OutputGuardrailMetadata,
} from "@openai/agents-core";
import { useEffect, useRef, useState } from "react";
import { getToken } from "@/app/server/token.action";
import { App } from "@/components/app";
import { CameraCapture } from "@/components/camera-capture";

const agent = new RealtimeAgent({
  name: "Greeter",
  instructions: "You are a greeter",
  tools: [
    hostedMcpTool({
      serverLabel: "deepwiki",
    }),
  ],
});

const guardrails: RealtimeOutputGuardrail[] = [
  {
    name: "No mention of Dom",
    execute: ({ agentOutput }) => {
      const text = extractAgentOutputText(agentOutput);
      const domInOutput = text.includes("Dom");

      const result: GuardrailFunctionOutput = {
        tripwireTriggered: domInOutput,
        outputInfo: {
          domInOutput,
        },
      };

      return Promise.resolve(result);
    },
  },
];

function extractAgentOutputText(agentOutput: unknown): string {
  if (typeof agentOutput === "string") {
    return agentOutput;
  }

  if (agentOutput && typeof agentOutput === "object") {
    if (
      "output" in agentOutput &&
      typeof (agentOutput as { output?: unknown }).output === "string"
    ) {
      return (agentOutput as { output: string }).output;
    }

    if (
      "content" in agentOutput &&
      typeof (agentOutput as { content?: unknown }).content === "string"
    ) {
      return (agentOutput as { content: string }).content;
    }

    if (
      "text" in agentOutput &&
      typeof (agentOutput as { text?: unknown }).text === "string"
    ) {
      return (agentOutput as { text: string }).text;
    }
  }

  return "";
}

export default function Home() {
  const session = useRef<RealtimeSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [outputGuardrailResult, setOutputGuardrailResult] =
    useState<OutputGuardrailTripwireTriggered<OutputGuardrailMetadata> | null>(
      null
    );

  const [events, setEvents] = useState<TransportEvent[]>([]);
  const [history, setHistory] = useState<RealtimeItem[]>([]);
  const [mcpTools, setMcpTools] = useState<string[]>([]);

  useEffect(() => {
    session.current = new RealtimeSession(agent, {
      model: "gpt-realtime",
      outputGuardrails: guardrails,
      outputGuardrailSettings: {
        debounceTextLength: 200,
      },
      config: {
        audio: {
          output: {
            voice: "cedar",
          },
        },
      },
    });
    session.current.on("transport_event", (event) => {
      setEvents((prevEvents) => [...prevEvents, event]);
    });
    session.current.on("mcp_tools_changed", (tools) => {
      setMcpTools(tools.map((t) => t.name));
    });
    session.current.on(
      "guardrail_tripped",
      (_context, _agent, guardrailError) => {
        setOutputGuardrailResult(guardrailError);
      }
    );
    session.current.on("history_updated", (updatedHistory) => {
      setHistory(updatedHistory);
    });
    session.current.on(
      "tool_approval_requested",
      (_context, _agent, approvalRequest) => {
        // You'll be prompted when making the tool call that requires approval in web browser.
        const approved = confirm(
          `Approve tool call to ${approvalRequest.approvalItem.rawItem.name} with parameters:\n ${JSON.stringify(approvalRequest.approvalItem.rawItem.arguments, null, 2)}?`
        );
        if (approved) {
          session.current?.approve(approvalRequest.approvalItem);
        } else {
          session.current?.reject(approvalRequest.approvalItem);
        }
      }
    );
  }, []);

  async function connect() {
    if (isConnected) {
      await session.current?.close();
      setIsConnected(false);
    } else {
      const token = await getToken();
      try {
        await session.current?.connect({
          apiKey: token,
        });
        setIsConnected(true);
      } catch (_error) {
        // Connection error - user can retry
      }
    }
  }

  async function toggleMute() {
    if (isMuted) {
      await session.current?.mute(false);
      setIsMuted(false);
    } else {
      await session.current?.mute(true);
      setIsMuted(true);
    }
  }

  return (
    <div className="relative">
      <App
        connect={connect}
        events={events}
        history={history}
        isConnected={isConnected}
        isMuted={isMuted}
        mcpTools={mcpTools}
        outputGuardrailResult={outputGuardrailResult}
        toggleMute={toggleMute}
      />
      <div className="fixed right-4 bottom-4 z-50">
        <CameraCapture
          disabled={!isConnected}
          onCapture={(dataUrl) => {
            if (!session.current) {
              return;
            }
            session.current.addImage(dataUrl, { triggerResponse: false });
          }}
        />
      </div>
    </div>
  );
}
