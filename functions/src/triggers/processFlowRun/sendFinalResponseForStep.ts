import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { runCompletionWithoutTools } from "./runTools";
import { replaceTemplate } from "./replaceTemplate";
import { ProcessStepParams, StepRunProcessor } from "./processStepRun";
import { fbCreate } from "../../helpers/fbWriters";
import {
  SenderType,
  getFlowMessageWithDefaults,
} from "@/models/types/FlowMessage";

const getFinalResponseForStep = (params: ProcessStepParams) => {
  const promptForResponse = params.currentStep.responseDescription!;
  const allVariables = {
    ...params.allVariablesFromPreviousSteps,
    ...params.currentStepRun.variableValues,
  };

  return replaceTemplate(promptForResponse, allVariables);
};
export const sendFinalResponseForStep: StepRunProcessor = async (params) => {
  if (params.currentStep.responseDescription) {
    const newMessage = getFinalResponseForStep(params);
    await fbCreate(
      "flowMessage",
      getFlowMessageWithDefaults({
        flowKey: params.currentStepRun.flowKey,
        flowRunKey: params.currentStepRun.flowRunKey,
        senderType: SenderType.Bot,
        text: newMessage as string,
        processedForStep: params.currentStep.uid,
        processedForStepRunKey: params.currentStepRun.uid,
      })
    );
  }

  return true;
};
