import type {
  RealtimeMcpCallItem,
  RealtimeToolCallItem,
} from "@openai/agents/realtime";
import ClockIcon from "@/components/icons/clock-icon";
import FunctionsIcon from "@/components/icons/functions-icon";
import McpIcon from "../icons/mcp-icon";

type FunctionCallMessageProps = {
  message: RealtimeToolCallItem | RealtimeMcpCallItem;
};

export function FunctionCallMessage({ message }: FunctionCallMessageProps) {
  let output = message?.output;
  try {
    if (message.output) {
      output = JSON.stringify(JSON.parse(message.output), null, 2);
    }
  } catch {
    output = message.output;
  }
  let input = message.arguments;
  try {
    if (message.arguments) {
      input = JSON.stringify(JSON.parse(message.arguments), null, 2);
    }
  } catch {
    input = message.arguments;
  }
  return (
    <div className="relative mb-[8px] flex w-[70%] flex-col">
      <div>
        <div className="flex flex-col rounded-[16px] text-sm">
          <div className="flex gap-2 rounded-b-none p-3 pl-0 font-semibold text-gray-700">
            <div className="ml-[-8px] flex items-center gap-2 fill-blue-500 text-blue-500">
              {message.type === "mcp_call" ||
              message.type === "mcp_tool_call" ? (
                <McpIcon height={16} width={16} />
              ) : (
                <FunctionsIcon height={16} width={16} />
              )}
              <div className="font-medium text-sm">
                {message.status === "completed"
                  ? `Called ${message.name}`
                  : `Calling ${message.name}...`}
              </div>
            </div>
          </div>

          <div className="mt-2 ml-4 rounded-xl bg-[#fafafa] py-2">
            <div className="mx-6 max-h-96 overflow-y-scroll border-b p-2 text-xs">
              <pre>{input}</pre>
            </div>
            <div className="mx-6 max-h-80 overflow-y-scroll p-2 text-xs">
              {output ? (
                <pre>{output}</pre>
              ) : (
                <div className="flex items-center gap-2 py-2 text-zinc-500">
                  <ClockIcon height={16} width={16} /> Waiting for result...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
