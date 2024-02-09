import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { runCompletionWithoutTools, runTools } from "./runTools";
import { getInsertAudioFnSpec } from "./tools/buildInsertAudioFn";
import { getTextToSpeechFnSpec } from "./tools/buildTextToSpeechFn";
import { ProcessStepParams, StepRunProcessor } from "./processStepRun";
import {
  SenderType,
  getFlowMessageWithDefaults,
} from "@/models/types/FlowMessage";
import { replaceTemplate } from "./replaceTemplate";
import { fbCreate } from "../../helpers/fbWriters";

const getChatMessageForCompletedStepRun = ({
  currentStep,
  currentStepRun,
  allVariablesFromPreviousSteps,
}: ProcessStepParams): ChatCompletionMessageParam => {
  const startingTemplate = currentStep.template;

  const allVariablesAvailable = {
    ...allVariablesFromPreviousSteps,
    ...currentStepRun.variableValues,
  };

  const replacedTemplate = replaceTemplate(
    startingTemplate,
    allVariablesAvailable
  );

  return {
    content: `Variable collection complete for this step! Now please execute the following prompt:
      ${replacedTemplate}
      `,
    role: "system",
  };
};

const getChatMessageForPreExecution = ({
  currentStep,
  currentStepRun,
  allVariablesFromPreviousSteps,
}: ProcessStepParams): string => {
  const startingTemplate = currentStep.preExecutionMessage!;

  const allVariablesAvailable = {
    ...allVariablesFromPreviousSteps,
    ...currentStepRun.variableValues,
  };

  return replaceTemplate(startingTemplate, allVariablesAvailable);
};

export const runPromptStep: StepRunProcessor = async (params) => {
  if (params.currentStep.preExecutionMessage) {
    const preExecutionMessage = getChatMessageForPreExecution(params);
    await fbCreate(
      "flowMessage",
      getFlowMessageWithDefaults({
        flowKey: params.currentStep.flowKey,
        flowRunKey: params.currentStepRun.flowRunKey,
        processedForStepRunKey: params.currentStepRun.uid,
        processedForStep: params.currentStep.uid,
        senderType: SenderType.Bot,
        text: preExecutionMessage,
      })
    );
  }

  if (!params.currentStep.template) {
    return true;
  }

  const tools = [getInsertAudioFnSpec(params), getTextToSpeechFnSpec(params)];
  const newMessage = getChatMessageForCompletedStepRun(params);

  await fbCreate(
    "flowMessage",
    getFlowMessageWithDefaults({
      flowKey: params.currentStep.flowKey,
      flowRunKey: params.currentStepRun.flowRunKey,
      processedForStepRunKey: params.currentStepRun.uid,
      processedForStep: params.currentStep.uid,
      senderType: SenderType.System,
      text: newMessage.content as string,
    })
  );

  params.messages = [...params.messages, newMessage];
  const hideMessages = true;
  await runTools(tools, params, undefined, hideMessages);
  return true;
};
