import { FlowMessage, SenderType } from "@/models/types/FlowMessage";
import { getOpenAIClient } from "../../ai/getOpenAIClient";
import { fbCreate } from "../../helpers/fbWriters";
import {
  RunnableFunction,
  RunnableToolFunction,
} from "openai/lib/RunnableFunction.mjs";
import { ProcessStepParams } from "./processStepRun";
import { ChatCompletionRunner } from "openai/lib/ChatCompletionRunner.mjs";
import {
  ChatCompletion,
  ChatCompletionMessageParam,
} from "openai/resources/index.mjs";

const createMessageForChatCompletion = (
  message: ChatCompletionMessageParam,
  hideReturnMessages: boolean,
  params: ProcessStepParams
) => {
  const contentToSave = hideReturnMessages
    ? `__This Message is hidden from the user__\n${message.content}`
    : message.content;

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
  });
};

const bindRunnerToMessageCreation = async (
  runner: ChatCompletionRunner,
  params: ProcessStepParams,
  hideReturnMessages: boolean
) => {
  const messages = params.messages;
  const flowRunKey = params.currentStepRun.flowRunKey;
  const flowKey = params.currentStepRun.flowKey;

  let seenNMEssages = 0;
  let promisesToWaitFor = [] as Promise<any>[];
  runner.on("message", (message) => {
    seenNMEssages++;
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
          );
        } else if (message.content) {
          promisesToWaitFor.push(
            createMessageForChatCompletion(message, hideReturnMessages, params)
          );
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
        );
      }
    }
  });

  await runner.done().catch((e) => {
    if (!runner.aborted) {
      throw e;
    }
  });
  await Promise.all(promisesToWaitFor);

  return !runner.aborted;
};

export const runTools = async (
  fns: RunnableFunction<any>[],
  params: ProcessStepParams,
  requiredTool?: string,
  hideReturnMessages = false
) => {
  const { messages, currentStepRun } = params;

  const tools = fns.map((fn) => {
    return {
      function: fn,
      type: "function",
    } as RunnableToolFunction<any>;
  });

  console.log("messages", JSON.stringify(messages, null, 2));

  const client = getOpenAIClient();

  const runner = client.beta.chat.completions.runTools({
    model: "gpt-4",
    messages: messages,
    tools,
    tool_choice: requiredTool
      ? { function: { name: requiredTool }, type: "function" }
      : undefined,
  });

  return bindRunnerToMessageCreation(runner, params, hideReturnMessages);
};

export const runCompletionWithoutTools = async (
  params: ProcessStepParams,
  hideReturnMessages: boolean = false
) => {
  const client = getOpenAIClient();
  const completion = await client.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: params.messages,
  });
  const message = completion.choices[0].message;

  await createMessageForChatCompletion(message, hideReturnMessages, params);

  return true;
};

export const runChatCompletion = async (
  params: ProcessStepParams,
  tools: RunnableFunction<any>[],
  requiredTool?: string
) => {
  if (tools.length === 0) {
    return await runCompletionWithoutTools(params);
  } else {
    return await runTools(tools, params, requiredTool);
  }
};
