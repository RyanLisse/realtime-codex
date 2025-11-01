import type { RealtimeItem } from "@openai/agents/realtime";
import { FunctionCallMessage } from "./messages/FunctionCall";
import { TextMessage } from "./messages/TextMessage";

export type HistoryProps = {
  history: RealtimeItem[];
};

export function History({ history }: HistoryProps) {
  return (
    <div
      className="max-w-2xl flex-1 space-y-4 overflow-y-scroll rounded-lg bg-white pl-4"
      id="chatHistory"
    >
      {history.map((item) => {
        if (item.type === "function_call") {
          return <FunctionCallMessage key={item.itemId} message={item} />;
        }

        if (item.type === "mcp_call" || item.type === "mcp_tool_call") {
          return <FunctionCallMessage key={item.itemId} message={item} />;
        }

        if (item.type === "message") {
          return (
            <TextMessage
              isUser={item.role === "user"}
              key={item.itemId}
              text={
                item.content.length > 0
                  ? item.content
                      .map((content) => {
                        if (
                          content.type === "output_text" ||
                          content.type === "input_text"
                        ) {
                          return content.text;
                        }
                        if (
                          content.type === "input_audio" ||
                          content.type === "output_audio"
                        ) {
                          return content.transcript ?? "⚫︎⚫︎⚫︎";
                        }
                        return "";
                      })
                      .join("\n")
                  : "⚫︎⚫︎⚫︎"
              }
            />
          );
        }

        return null;
      })}
    </div>
  );
}
