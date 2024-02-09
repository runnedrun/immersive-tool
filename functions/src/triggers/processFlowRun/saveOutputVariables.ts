import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { runTools } from "./runTools";
import { getSaveOutputVariablesFnSpec } from "./tools/buildSaveOutputVariablesFn";
import { StepRunProcessor } from "./processStepRun";
import {
  SenderType,
  getFlowMessageWithDefaults,
} from "@/models/types/FlowMessage";
import { fbCreate } from "../../helpers/fbWriters";

export const saveOutputVariables: StepRunProcessor = async (params) => {
  const tools = [getSaveOutputVariablesFnSpec(params)];
  const saveOutputVariablesMessage = {
    content:
      "Now, based on the previous response, save the necesssary variables using the provided tool",
    role: "system",
  } as ChatCompletionMessageParam;

  await fbCreate(
    "flowMessage",
    getFlowMessageWithDefaults({
      flowKey: params.currentStep.flowKey,
      flowRunKey: params.currentStepRun.flowRunKey,
      processedForStepRunKey: params.currentStepRun.uid,
      processedForStep: params.currentStep.uid,
      senderType: SenderType.System,
      text: saveOutputVariablesMessage.content as string,
    })
  );

  params.messages.push(saveOutputVariablesMessage);

  await runTools(tools, params, tools[0].name);
  return true;
};
