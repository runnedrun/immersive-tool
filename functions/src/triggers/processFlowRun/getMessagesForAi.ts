import { FlowMessage, SenderType } from "@/models/types/FlowMessage"
import { Step } from "@/models/types/Step"
import {
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from "openai/resources/index.mjs"
import { aiRoleMap } from "../aiRoleMap"
import {
  FunctionToolCall,
  ToolCall,
} from "openai/resources/beta/threads/runs/steps.mjs"
import { FunctionTool } from "openai/resources/beta/assistants.mjs"

export const getMessagesForAi = (
  messages: FlowMessage[],
  currentStep: Step
) => {
  const completedToolIds = messages
    .map((message) => {
      return message.senderType === SenderType.ToolResponse
        ? message.toolCallId
        : undefined
    })
    .filter(Boolean)

  const messagesWithCompletedToolCalls = messages.flatMap((message) => {
    if (message.senderType === SenderType.ToolCall) {
      const toolCalls = JSON.parse(
        message.toolCallsJSON || "[]"
      ) as FunctionToolCall[]
      const toolCallsThatAreComplete = toolCalls.filter((toolCall) =>
        completedToolIds.includes(toolCall.id)
      )
      if (toolCallsThatAreComplete.length === 0) {
        return []
      }
      return [
        {
          ...message,
          toolCallsJSON: JSON.stringify(toolCallsThatAreComplete),
        } as FlowMessage,
      ]
    }
    return [message]
  })

  const aiMessages = messagesWithCompletedToolCalls.flatMap((message) => {
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
