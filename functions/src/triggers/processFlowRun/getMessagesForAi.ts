import { Flow } from "@/models/types/Flow";
import { FlowMessage, SenderType } from "@/models/types/FlowMessage";
import { Step } from "@/models/types/Step";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { getVariableNamesSorted } from "./getVariableNamesSorted";
import { aiRoleMap } from "../aiRoleMap";
import { ProcessStepParams } from "./processStepRun";
import { StepRun } from "@/models/types/StepRun";
import { groupBy } from "lodash";
import { replaceTemplate } from "./replaceTemplate";

export const getIntroSystemMessageForFlow = (flow: Flow) => {
  return {
    content: `You are a helpful assistant gathering information from a user, in order to faciliate the following task:
title: ${flow.title}
description: ${flow.description}
  
I will prompt to you complete this tasks as a series of steps. In each step you will execute a prompt, possibly using information gathered from the user.`,
    role: "system",
  } as ChatCompletionMessageParam;
};

export const getSystemMessageForStep = ({
  step,
  completedSteps,
  allSteps,
  variableValuessFromPreviousSteps,
}: {
  step: Step;
  completedSteps: Step[];
  allSteps: Step[];
  variableValuessFromPreviousSteps: Record<string, string>;
}): ChatCompletionMessageParam => {
  const variarblesToCollect = getVariableNamesSorted(
    step.variableDescriptions || {}
  );
  const aiIntroString = step.variableCollectionInstructions
    ? `Here are some additional details on how to collect the information:
  ${replaceTemplate(
    step.variableCollectionInstructions,
    variableValuessFromPreviousSteps
  )}`
    : "";

  const requiredInfoMsg = Object.entries(step.variableDescriptions || {})
    .map(([variable, desc]) => `${variable}: ${desc}`)
    .join("\n");

  const variablesToCollectMessage = variarblesToCollect.length
    ? `The information you need to gather for this step is the following: 
${requiredInfoMsg}.`
    : "";

  const stepTitleMessage = step.title
    ? ` The title of this step is: ${step.title}`
    : "";

  const startPrompt = variarblesToCollect.length
    ? `Start off by prompting the user for the first piece of information: 
    ${variarblesToCollect[0]}`
    : ``;

  return {
    content: `
  You have completed ${completedSteps.length} out of ${
      allSteps.length
    }. The next step is step #${completedSteps.length + 1}.${stepTitleMessage}

  ${variablesToCollectMessage}
  
  ${aiIntroString}  

  ${startPrompt}
  `,
    role: "system",
  };
};

export const getMessagesForAi = ({
  completedSteps,
  allSteps,
  flow,
  messages,
  variableValuessFromPreviousSteps,
}: {
  completedSteps: Step[];
  allSteps: Step[];
  flow: Flow;
  messages: FlowMessage[];
  variableValuessFromPreviousSteps: Record<string, string>;
}) => {
  const messagesByStepKey = groupBy(messages, (_) => _.processedForStep);

  const firstMessage = getIntroSystemMessageForFlow(flow);

  const allMessagesWithoutFirst = allSteps.flatMap((step) => {
    const systemMessage = getSystemMessageForStep({
      step,
      completedSteps,
      allSteps,
      variableValuessFromPreviousSteps,
    });
    const messagesForThisStep = messagesByStepKey[step.uid] || [];

    const aiMessagesForThisStep = messagesForThisStep.map((message) => {
      return {
        role: aiRoleMap[message.senderType],
        content: message.text,
        tool_calls: message.toolCallJSON
          ? JSON.parse(message.toolCallJSON)
          : undefined,
      } as ChatCompletionMessageParam;
    });

    return [systemMessage, ...aiMessagesForThisStep];
  });

  return [firstMessage, ...allMessagesWithoutFirst];
};
