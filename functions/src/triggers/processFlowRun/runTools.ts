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
      fbCreate("flowMessage", {
        flowRunKey: flowRunKey,
        text: "",
        toolCallJSON: JSON.stringify(message),
        senderType: SenderType.ToolCall,
        flowKey: flowKey,
        processedForStepRunKey: params.currentStepRun.uid,
        processedForStep: params.currentStep.uid,
      });
    })
    .on("functionCallResult", (message) => {
      fbCreate("flowMessage", {
        flowRunKey: flowRunKey,
        text: message,
        senderType: SenderType.ToolResponse,
        flowKey: flowKey,
        processedForStepRunKey: params.currentStepRun.uid,
        processedForStep: params.currentStep.uid,
      });
    });

  const respForUser = await runner.finalContent();

  if (respForUser) {
    console.log("got resp for user", respForUser);
    await fbCreate("flowMessage", {
      flowRunKey: flowRunKey,
      text: respForUser || "no response",
      senderType: SenderType.Bot,
      flowKey: flowKey,
      processedForStepRunKey: params.currentStepRun.uid,
      processedForStep: params.currentStep.uid,
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
