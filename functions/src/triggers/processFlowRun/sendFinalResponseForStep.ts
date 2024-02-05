import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { runCompletionWithoutTools } from "./runTools";
import { replaceTemplate } from "./runPromptStep";
import { ProcessStepParams, StepRunProcessor } from "./processStepRun";

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
    const newMessage = getFinalResponseForStepPrompt(params);
    params.messages = [...params.messages, newMessage];
    await runCompletionWithoutTools(params);
  }

  return true;
};
