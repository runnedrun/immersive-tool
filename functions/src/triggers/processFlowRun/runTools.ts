import { FlowMessage, SenderType } from "@/models/types/FlowMessage";
import { getOpenAIClient } from "../../ai/getOpenAIClient";
import { fbCreate } from "../../helpers/fbWriters";
import {
  RunnableFunction,
  RunnableToolFunction,
} from "openai/lib/RunnableFunction.mjs";
import { ProcessStepParams } from "./processStepRun";

export const runTools = async (
  fns: RunnableFunction<any>[],
  params: ProcessStepParams,
  requiredTool?: string
) => {
  const { messages, currentStepRun } = params;
  const flowRunKey = currentStepRun.flowRunKey;
  const flowKey = currentStepRun.flowKey;

  const tools = fns.map((fn) => {
    return {
      function: fn,
      type: "function",
    } as RunnableToolFunction<any>;
  });

  const client = getOpenAIClient();
  const runner = client.beta.chat.completions
    .runTools({
      model: "gpt-4",
      messages: messages,
      tools,
      tool_choice: requiredTool
        ? { function: { name: requiredTool }, type: "function" }
        : undefined,
    })
    .on("functionCall", (message) => {
      const newMessage = {
        flowRunKey: flowRunKey || null,
        text: "",
        toolCallJSON: JSON.stringify(message),
        senderType: SenderType.ToolCall,
        flowKey: flowKey || null,
      } as FlowMessage;

      fbCreate("flowMessage", newMessage);
    })
    .on("functionCallResult", (message) => {
      const newMessage = {
        flowRunKey: flowRunKey || null,
        text: message,
        senderType: SenderType.ToolResponse,
        flowKey: flowKey || null,
      } as FlowMessage;

      fbCreate("flowMessage", newMessage);
    });

  const respForUser = await runner.finalContent();

  if (respForUser) {
    await fbCreate("flowMessage", {
      flowRunKey: flowRunKey,
      text: respForUser || "no response",
      senderType: SenderType.Bot,
      flowKey: flowKey,
      processedForStepRunKey: null,
      processedByStepRun: null,
      processedForStep: null,
      toolCallJSON: null,
    });
  }

  return !!respForUser;
};

export const runCompletionWithoutTools = async (params: ProcessStepParams) => {
  const client = getOpenAIClient();
  const runner = client.beta.chat.completions.stream({
    model: "gpt-4",
    messages: params.messages,
  });

  return await runner.finalContent();
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
