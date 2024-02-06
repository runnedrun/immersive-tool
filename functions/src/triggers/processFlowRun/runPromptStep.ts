import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { runTools } from "./runTools";
import { getInsertAudioFnSpec } from "./tools/buildInsertAudioFn";
import { getTextToSpeechFnSpec } from "./tools/buildTextToSpeechFn";
import { ProcessStepParams, StepRunProcessor } from "./processStepRun";
import {
  SenderType,
  getFlowMessageWithDefaults,
} from "@/models/types/FlowMessage";
import { fbCreate, fbSet } from "@/firebase/settersFe";
import { replaceTemplate } from "./replaceTemplate";

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
  const tools = [getInsertAudioFnSpec(params), getTextToSpeechFnSpec(params)];
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
  await runTools(tools, params);
  return true;
};
