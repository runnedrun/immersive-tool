import { Flow } from "@/models/types/Flow";
import { FlowMessage, SenderType } from "@/models/types/FlowMessage";
import { Step } from "@/models/types/Step";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { getVariableNamesSorted } from "./getVariableNamesSorted";
import { aiRoleMap } from "../aiRoleMap";
import { ProcessStepParams } from "./processStepRun";
import { StepRun, getStepRunId } from "@/models/types/StepRun";
import { flow, groupBy } from "lodash";
import { replaceTemplate } from "./replaceTemplate";
import { Timestamp } from "firebase-admin/firestore";
import { fbCreate } from "../../helpers/fbWriters";
import { FlowRun } from "@/models/types/FlowRun";

export const createIntroFlowMessage = async (
  flow: Flow,
  flowRun: FlowRun,
  timestamp: Timestamp
) => {
  const res = await fbCreate(
    "flowMessage",
    {
      text: `You are a helpful assistant gathering information from a user, in order to faciliate the following task:
title: ${flow.title}
description: ${flow.description}
  
I will prompt to you complete this tasks as a series of steps. In each step you will execute a prompt, possibly using information gathered from the user.`,
      senderType: SenderType.FlowIntroduction,
      flowKey: flow.uid,
      processedForStep: null,
      processedForStepRunKey: null,
      flowRunKey: flowRun.uid,
    },
    { createdAt: timestamp }
  );
  return res;
};

export const getSystemMessageForStep = async ({
  step,
  flowRun,
  completedSteps,
  allSteps,
  variableValuessFromPreviousSteps,
}: {
  step: Step;
  flowRun: FlowRun;
  completedSteps: Step[];
  allSteps: Step[];
  variableValuessFromPreviousSteps: Record<string, string>;
}): Promise<FlowMessage> => {
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

  const res = await fbCreate("flowMessage", {
    text: `
  You have completed ${completedSteps.length} out of ${
      allSteps.length
    }. The next step is step #${completedSteps.length + 1}.${stepTitleMessage}

  ${variablesToCollectMessage}
  
  ${aiIntroString}  

  ${startPrompt}
  `,
    senderType: SenderType.StepIntroduction,
    flowKey: step.flowKey,
    processedForStep: step.uid,
    processedForStepRunKey: getStepRunId(flowRun.uid, step.uid),
    flowRunKey: flowRun.uid,
  });

  return res.data;
};

export const getMessagesForAi = async ({
  completedSteps,
  allSteps,
  flowRun,
  flow,
  messages,
  variableValuessFromPreviousSteps,
}: {
  completedSteps: Step[];
  allSteps: Step[];
  flowRun: FlowRun;
  flow: Flow;
  messages: FlowMessage[];
  variableValuessFromPreviousSteps: Record<string, string>;
}) => {
  const messagesWithoutFlowIntro = messages.filter(
    (_) => _.senderType !== SenderType.FlowIntroduction
  );

  const messagesByStepKey = groupBy(
    messagesWithoutFlowIntro,
    (_) => _.processedForStep
  );

  const firstMessageIsAlreadyIntro =
    messages[0].senderType === SenderType.FlowIntroduction;

  const firstMessage = firstMessageIsAlreadyIntro
    ? null
    : await createIntroFlowMessage(
        flow,
        flowRun,
        Timestamp.fromMillis(messages[0].createdAt.toMillis() - 100)
      );

  const allMessagesWithoutFirst = allSteps.flatMap((step) => {
    const systemMessage = getSystemMessageForStep({
      step,
      completedSteps,
      allSteps,
      variableValuessFromPreviousSteps,
      flowRun,
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
