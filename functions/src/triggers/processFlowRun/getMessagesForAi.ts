import { FlowMessage } from "@/models/types/FlowMessage";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { aiRoleMap } from "../aiRoleMap";

export const getMessagesForAi = (messages: FlowMessage[]) => {
  const aiMessages = messages.map((message) => {
    return {
      role: aiRoleMap[message.senderType],
      content: message.text,
      tool_calls: message.toolCallsJSON
        ? JSON.parse(message.toolCallsJSON)
        : undefined,
      tool_call_id: message.toolCallId ?? undefined,
    } as ChatCompletionMessageParam;
  });

  return aiMessages;
};
