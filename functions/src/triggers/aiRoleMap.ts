import { SenderType } from "@/models/types/FlowMessage";
import { ChatCompletionRole } from "openai/resources/index.mjs";

export const aiRoleMap: Record<SenderType, ChatCompletionRole> = {
  [SenderType.Bot]: "assistant",
  [SenderType.User]: "user",
  [SenderType.Introduction]: "assistant",
  [SenderType.ToolCall]: "assistant",
  [SenderType.ToolResponse]: "tool",
  [SenderType.System]: "system",
};
