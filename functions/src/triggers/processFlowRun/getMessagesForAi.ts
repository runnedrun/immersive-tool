import { FlowMessage, SenderType } from "@/models/types/FlowMessage";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { aiRoleMap } from "../aiRoleMap";
import { Step } from "@/models/types/Step";
import { Send } from "@mui/icons-material";

export const getMessagesForAi = (
  messages: FlowMessage[],
  currentStep: Step
) => {
  let stepIdToIgnore = "";
  const aiMessages = messages.flatMap((message) => {
    const messagesToReturn = [] as ChatCompletionMessageParam[];
    if (message.senderType === SenderType.StepIntroducion) {
      const stepKey = message.processedForStep!;
      if (stepKey !== currentStep.uid) {
        stepIdToIgnore = stepKey;
        messagesToReturn.push({
          role: "system",
          content: `This step completed, contents hidden.`,
        } as ChatCompletionMessageParam);
      }
    }
    if (message.processedForStep !== stepIdToIgnore) {
      messagesToReturn.push({
        role: aiRoleMap[message.senderType],
        content: message.text,
        tool_calls: message.toolCallsJSON
          ? JSON.parse(message.toolCallsJSON)
          : undefined,
        tool_call_id: message.toolCallId ?? undefined,
      } as ChatCompletionMessageParam);
    }
    return messagesToReturn;
  });

  return aiMessages;
};
