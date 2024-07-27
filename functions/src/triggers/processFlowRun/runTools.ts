import { SenderType } from "@/models/types/FlowMessage"
import { takeWhile } from "lodash"
import { ChatCompletionRunner } from "openai/lib/ChatCompletionRunner.mjs"
import {
  RunnableFunction,
  RunnableToolFunction,
} from "openai/lib/RunnableFunction.mjs"
import { ChatCompletionMessageParam } from "openai/resources/index.mjs"
import { getOpenAIClient } from "../../ai/getOpenAIClient"
import { fbCreate } from "../../helpers/fbWriters"
import { ProcessStepParams } from "./processStepRun"

const tokenLimit = 1000
const truncateMessages = (messages: ChatCompletionMessageParam[]) => {
  return messages
  const reversed = [...messages].reverse()
  return takeWhile(reversed, (message, i, messagesSoFar) => {
    const slice = reversed.slice(0, i)
    const content = slice.map((m) => m.content).join("")
    const tokenCount = content.length / 4
    return tokenCount < tokenLimit
  }).reverse()
}

const createMessageForChatCompletion = (
  message: ChatCompletionMessageParam,
  hideReturnMessages: boolean,
  params: ProcessStepParams
) => {
  const contentToSave = hideReturnMessages
    ? `__This Message is hidden from the user__\n${message.content}`
    : message.content

  return fbCreate("flowMessage", {
    flowRunKey: params.currentStepRun.flowRunKey,
    text: contentToSave as string,
    senderType: hideReturnMessages
      ? SenderType.ExecutionResponse
      : SenderType.Bot,
    flowKey: params.currentStepRun.flowKey,
    processedForStepRunKey: params.currentStepRun.uid,
    processedForStep: params.currentStep.uid,
    toolCallsJSON: null,
  })
}

const bindRunnerToMessageCreation = async (
  runner: ChatCompletionRunner,
  params: ProcessStepParams,
  hideReturnMessages: boolean
) => {
  const messages = params.messages
  const flowRunKey = params.currentStepRun.flowRunKey
  const flowKey = params.currentStepRun.flowKey

  let seenNMEssages = 0
  let promisesToWaitFor = [] as Promise<any>[]
  runner.on("message", (message) => {
    seenNMEssages++
    if (seenNMEssages > messages.length) {
      if (message.role === "assistant") {
        if (message.tool_calls) {
          promisesToWaitFor.push(
            fbCreate("flowMessage", {
              flowRunKey: flowRunKey,
              text: "",
              toolCallsJSON: JSON.stringify(message.tool_calls),
              senderType: SenderType.ToolCall,
              flowKey: flowKey,
              processedForStepRunKey: params.currentStepRun.uid,
              processedForStep: params.currentStep.uid,
            })
          )
        } else if (message.content) {
          promisesToWaitFor.push(
            createMessageForChatCompletion(message, hideReturnMessages, params)
          )
        }
      } else if (message.role === "tool") {
        promisesToWaitFor.push(
          fbCreate("flowMessage", {
            flowRunKey: flowRunKey,
            text: message.content,
            toolCallId: message.tool_call_id,
            senderType: SenderType.ToolResponse,
            flowKey: flowKey,
            processedForStepRunKey: params.currentStepRun.uid,
            processedForStep: params.currentStep.uid,
          })
        )
      }
    }
  })

  await runner.done().catch((e) => {
    if (!runner.aborted) {
      throw e
    }
  })
  console.log("runner done")
  await Promise.all(promisesToWaitFor)

  return !runner.aborted
}

export const runTools = async (
  fns: RunnableFunction<any>[],
  params: ProcessStepParams,
  requiredTool?: string,
  hideReturnMessages = false
) => {
  const { messages } = params

  const tools = fns.map((fn) => {
    return {
      function: fn,
      type: "function",
    } as RunnableToolFunction<any>
  })

  console.log(
    "messages",
    JSON.stringify(messages, null, 2),
    tools.map((t) => t.function.name)
  )

  const client = getOpenAIClient()

  const runner = client.beta.chat.completions.runTools({
    model: "gpt-4-turbo",
    messages: truncateMessages(messages),
    tools,
    tool_choice: requiredTool
      ? { function: { name: requiredTool }, type: "function" }
      : undefined,
  })

  return bindRunnerToMessageCreation(runner, params, hideReturnMessages)
}

export const runCompletionWithoutTools = async (
  params: ProcessStepParams,
  hideReturnMessages: boolean = false
) => {
  console.log(
    "messages for non tool run",
    JSON.stringify(params.messages, null, 2)
  )
  const client = getOpenAIClient()
  const completion = await client.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: truncateMessages(params.messages),
  })
  const message = completion.choices[0].message

  await createMessageForChatCompletion(message, hideReturnMessages, params)

  return true
}
