import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { runTools } from "./runTools";
import { getReplaceAudioFnSpec } from "./tools/buildReplaceAudioFn";
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

export const runPromptStep: StepRunProcessor = async (params) => {
  const tools = [getReplaceAudioFnSpec(params), getTextToSpeechFnSpec(params)];
  const newMessage = getChatMessageForCompletedStepRun(params);

  await fbCreate(
    "flowMessage",
    getFlowMessageWithDefaults({
      flowKey: params.currentStep.flowKey,
      flowRunKey: params.currentStepRun.flowRunKey,
      senderType: SenderType.System,
      text: newMessage.content as string,
    })
  );

  params.messages = [...params.messages, newMessage];
  const hideMessages = true;
  await runTools(tools, params, undefined, hideMessages);
  return true;
};
