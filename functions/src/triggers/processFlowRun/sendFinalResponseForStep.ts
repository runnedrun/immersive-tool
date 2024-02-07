import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { runCompletionWithoutTools } from "./runTools";
import { replaceTemplate } from "./replaceTemplate";
import { ProcessStepParams, StepRunProcessor } from "./processStepRun";
import { fbCreate } from "../../helpers/fbWriters";
import {
  SenderType,
  getFlowMessageWithDefaults,
} from "@/models/types/FlowMessage";

const getFinalResponseForStepPrompt = (params: ProcessStepParams) => {
  const promptForResponse = params.currentStep.responseDescription!;
  const allVariables = {
    ...params.allVariablesFromPreviousSteps,
    ...params.currentStepRun.variableValues,
  };

  const replacedTemplate = replaceTemplate(promptForResponse, allVariables);
  return {
    content: `You've executed the prompt for this step. Now please send a response to the user based on these instructions:
  
${replacedTemplate}`,
    role: "system",
  } as ChatCompletionMessageParam;
};
export const sendFinalResponseForStep: StepRunProcessor = async (params) => {
  if (params.currentStep.responseDescription) {
    console.log("response description", params.currentStep.responseDescription);
    const newMessage = getFinalResponseForStepPrompt(params);
    await fbCreate(
      "flowMessage",
      getFlowMessageWithDefaults({
        flowKey: params.currentStepRun.flowKey,
        flowRunKey: params.currentStepRun.flowRunKey,
        senderType: SenderType.System,
        text: newMessage.content as string,
        processedForStep: params.currentStep.uid,
        processedForStepRunKey: params.currentStepRun.uid,
      })
    );
    params.messages = [...params.messages, newMessage];
    await runCompletionWithoutTools(params);
  }

  return true;
};
