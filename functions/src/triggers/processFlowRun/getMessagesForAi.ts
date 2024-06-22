import { FlowMessage, SenderType } from "@/models/types/FlowMessage"
import { Step } from "@/models/types/Step"
import { ChatCompletionMessageParam } from "openai/resources/index.mjs"
import { aiRoleMap } from "../aiRoleMap"

export const getMessagesForAi = (
  messages: FlowMessage[],
  currentStep: Step
) => {
  const aiMessages = messages.flatMap((message) => {
    const messagesToReturn = [] as ChatCompletionMessageParam[]
    if (message.senderType === SenderType.StepIntroducion) {
      const stepKey = message.processedForStep!
      if (stepKey !== currentStep.uid) {
        messagesToReturn.push({
          role: "system",
          content: `This step completed, contents hidden.`,
        } as ChatCompletionMessageParam)
      }
    }
    if (message.processedForStep === currentStep.uid) {
      messagesToReturn.push({
        role: aiRoleMap[message.senderType],
        content: message.text,
        tool_calls: message.toolCallsJSON
          ? JSON.parse(message.toolCallsJSON)
          : undefined,
        tool_call_id: message.toolCallId ?? undefined,
      } as ChatCompletionMessageParam)
    }
    return messagesToReturn
  })

  return aiMessages
}
