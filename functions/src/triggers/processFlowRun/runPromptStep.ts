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
import { isEmpty } from "lodash";
import {
  buildSaveOutputVariableFn,
  getSaveOutputVariablesFnSpec,
  saveOutputVariablesSpecName,
} from "./tools/buildSaveOutputVariablesFn";
import { getOverlayBackgroundAudioSpec } from "./tools/buildOverlayBackgroundAudioFn";
import { availableToolGetters } from "./tools/availableToolGetters";

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

  const saveVariableDirection = !isEmpty(currentStep.outputVariableDescriptions)
    ? `\n\nDo NOT return a message. Instead after executing the prompt you MUST call the ${saveOutputVariablesSpecName} function to save the output variables`
    : ``;

  return {
    content: `Now please execute the following prompt from the user:

${replacedTemplate}${saveVariableDirection}`,
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

  const tools = [
    ...Object.values(availableToolGetters).map((getter) => getter(params)),
    getSaveOutputVariablesFnSpec(params),
  ];
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
