"use client";
import type {
  OutputGuardrailTripwireTriggered,
  RealtimeItem,
  TransportEvent,
} from "@openai/agents/realtime";
import { useEffect, useState } from "react";
import { History } from "@/components/History";
import { Button } from "@/components/ui/Button";

export type AppProps = {
  title?: string;
  isConnected: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  connect: () => void;
  history?: RealtimeItem[];
  outputGuardrailResult?: OutputGuardrailTripwireTriggered<any> | null;
  events: TransportEvent[];
  mcpTools?: string[];
};

export function App({
  title = "Realtime Agent Demo",
  isConnected,
  isMuted,
  toggleMute,
  connect,
  history,
  outputGuardrailResult,
  events,
  mcpTools = [],
}: AppProps) {
  // Avoid hydration mismatches when layout changes between server and client
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div className="flex justify-center">
      <div className="flex h-screen w-full max-w-6xl flex-col overflow-hidden p-4 md:max-h-screen">
        <header className="flex w-full max-w-6xl flex-none items-center justify-between pb-4">
          <h1 className="font-bold text-2xl">{title}</h1>
          <div className="flex gap-2">
            {isConnected && (
              <Button
                onClick={toggleMute}
                variant={isMuted ? "primary" : "outline"}
              >
                {isMuted ? "Unmute" : "Mute"}
              </Button>
            )}
            <Button
              onClick={connect}
              variant={isConnected ? "stop" : "primary"}
            >
              {isConnected ? "Disconnect" : "Connect"}
            </Button>
          </div>
        </header>
        <div className="flex h-full max-h-full flex-col gap-10 overflow-y-hidden md:flex-row">
          <div className="flex-2/3 flex-grow overflow-y-scroll pb-24">
            {history ? (
              <History history={history} />
            ) : (
              <div className="flex h-full items-center justify-center text-center text-gray-500">
                No history available
              </div>
            )}
          </div>
          <div className="flex flex-1/3 flex-grow flex-col gap-4">
            {outputGuardrailResult && (
              <div className="w-full flex-0 self-end rounded-md border border-blue-300 bg-blue-50 p-2 text-blue-900 text-xs shadow-sm">
                <span className="font-semibold">Guardrail:</span>{" "}
                {outputGuardrailResult?.message ||
                  JSON.stringify(outputGuardrailResult)}
              </div>
            )}
            {mounted && (
              <div className="w-full flex-0 rounded-md border border-zinc-200 bg-white/60 p-3 text-xs dark:border-zinc-700 dark:bg-zinc-900/60">
                <h3 className="mb-2 font-semibold text-sm">
                  Available MCP Tools
                </h3>
                {mcpTools.length === 0 ? (
                  <p className="text-xs text-zinc-500">None</p>
                ) : (
                  <ul className="list-disc space-y-1 pl-4">
                    {mcpTools.map((name) => (
                      <li className="text-xs" key={name}>
                        {name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div
              className="max-h-64 w-96 flex-1 overflow-scroll rounded-lg border border-gray-300 p-4 text-xs md:h-full md:max-h-none [&>details]:border-gray-200 [&>details]:border-b [&>details]:py-2 [&_pre]:bg-gray-100 [&_pre]:p-4 [&_summary]:mb-2"
              id="eventLog"
            >
              {events.map((event, index) => (
                <details key={index}>
                  <summary>{event.type}</summary>
                  <pre>{JSON.stringify(event, null, 2)}</pre>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
