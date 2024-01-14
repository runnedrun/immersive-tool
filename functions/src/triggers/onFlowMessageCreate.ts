import { Flow } from "@/models/types/Flow";
import { FlowMessage, SenderType } from "@/models/types/FlowMessage";
import { Step } from "@/models/types/Step";
import { StepRun, getStepRunKey } from "@/models/types/StepRun";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import {
  ChatCompletionMessageParam,
  ChatCompletionRole,
} from "openai/resources/index.mjs";
import { getOpenAIClient } from "../ai/getOpenAIClient";
import { queryDocs, readDoc } from "../helpers/fbReaders";
import { fbCreate, fbSet } from "../helpers/fbWriters";

const getVariableNamesSorted = (step: Step) => {
  const variarblesToCollect = Object.keys(step.variableDescriptions);
  variarblesToCollect.sort();
  return variarblesToCollect;
};

const getRunner = ({
  messages,
  currentStep,
  currentStepRun,
}: {
  messages: ChatCompletionMessageParam[];
  currentStep: Step;
  currentStepRun: StepRun;
}) => {
  const sendEmail = async (params: {
    to: string;
    subject: string;
    body: string;
  }) => {
    console.log("sendemail", params);
  };

  const saveVariable = async (params: {
    variableName: string;
    value: string;
  }) => {
    await fbSet("stepRun", currentStepRun.uid, {
      variableValues: {
        [params.variableName]: params.value,
      },
    });

    const allVariables = {
      ...currentStepRun.variableValues,
      [params.variableName]: params.value,
    };

    const allSavedVariableNames = Object.keys(allVariables);

    const allPossibleVariableNames = getVariableNamesSorted(currentStep);

    const allIncompleteVariables = allPossibleVariableNames.filter(
      (_) => !allSavedVariableNames.includes(_)
    );
    console.log(
      "alls a",
      allSavedVariableNames,
      allPossibleVariableNames,
      allIncompleteVariables
    );

    const nextVariableToCollect = allIncompleteVariables[0];

    if (nextVariableToCollect) {
      const returnMessage = `Successfully saved ${params.variableName} to ${params.value}. Your next variable to collect is: 
    name: ${nextVariableToCollect}
    description: ${currentStep.variableDescriptions[nextVariableToCollect]}`;
      return returnMessage;
    } else {
      const startingTemplate = currentStep.template;

      const replacedTemplate = allSavedVariableNames.reduce(
        (acc, variableName) => {
          return acc.replace(
            new RegExp(`{{${variableName}}}`, "g"),
            allVariables[variableName]
          );
        },
        startingTemplate
      );

      return `Variable collection complete! Now please execute the following prompt:
      ${replacedTemplate}
      `;
    }
  };

  const client = getOpenAIClient();
  const runner = client.beta.chat.completions
    .runTools({
      model: "gpt-4",
      messages: messages,
      tools: [
        {
          type: "function",
          function: {
            function: sendEmail,
            description: "test123",
            parse: JSON.parse, // or use a validation library like zod for typesafe parsing.
            parameters: {
              type: "object",
              properties: {
                to: { type: "string" },
                subject: { type: "string" },
                body: { type: "string" },
              },
            },
          },
        },
        {
          type: "function",
          function: {
            function: saveVariable,
            description:
              "Save a variable to the database after retrieving it from the user",
            parse: JSON.parse, // or use a validation library like zod for typesafe parsing.
            parameters: {
              type: "object",
              properties: {
                variableName: {
                  type: "string",
                  description: "The variable name",
                },
                value: { type: "string", description: "The variable value" },
              },
            },
          },
        },
      ],
    })
    .on("functionCall", (message) => {
      const newMessage = {
        flowRunKey: currentStepRun.flowRunKey || null,
        text: "",
        toolCallJSON: JSON.stringify(message),
        senderType: SenderType.ToolCall,
        flowKey: currentStepRun.flowKey || null,
      } as FlowMessage;
      console.log("setting new function call message", newMessage);

      fbCreate("flowMessage", newMessage);
    })
    .on("functionCallResult", (message) => {
      const newMessage = {
        flowRunKey: currentStepRun.flowRunKey || null,
        text: message,
        senderType: SenderType.ToolResponse,
        flowKey: currentStepRun.flowKey || null,
      } as FlowMessage;

      console.log("setting new function call RESP", newMessage);

      fbCreate("flowMessage", newMessage);
    });

  return runner;
};

const aiRoleMap: Record<SenderType, ChatCompletionRole> = {
  [SenderType.Bot]: "assistant",
  [SenderType.User]: "user",
  [SenderType.Introduction]: "assistant",
  [SenderType.ToolCall]: "assistant",
  [SenderType.ToolResponse]: "tool",
};

const getMessagesForAi = ({
  step,
  flow,
  messages,
}: {
  step: Step;
  flow: Flow;
  messages: FlowMessage[];
}) => {
  const variarblesToCollect = getVariableNamesSorted(step);
  const aiIntroString = step.aiIntro
    ? `Here are some additional details on how to collect the information:
  ${step.aiIntro}`
    : "";

  const messagesForOpenAi = messages
    .filter(({ senderType }) => senderType !== SenderType.Introduction)
    .map((message) => {
      return {
        role: aiRoleMap[message.senderType],
        content: message.text,
        tool_calls: message.toolCallJSON
          ? JSON.parse(message.toolCallJSON)
          : undefined,
      } as ChatCompletionMessageParam;
    });

  const requiredInfoMsg = Object.entries(step.variableDescriptions)
    .map(([variable, desc]) => `${variable}: ${desc}`)
    .join("\n");
  messagesForOpenAi.push({
    content: `You are a helpful assistant gathering information from a user, in order to faciliate the following task:
title: ${flow.title}
description: ${flow.description}

The information you need to gather is the following:
${requiredInfoMsg}.

${aiIntroString}

Start off by prompting the user for the first piece of information: 
${variarblesToCollect[0]}
`,
    role: "system",
  } as ChatCompletionMessageParam);
  const reversedMessages = [...messagesForOpenAi].reverse();

  return reversedMessages;
};

const getResponse = async ({
  step,
  flow,
  currentStepRun,
  messages,
}: {
  step: Step;
  flow: Flow;
  currentStepRun: StepRun;
  messages: FlowMessage[];
}) => {
  const reversedMessages = getMessagesForAi({
    step,
    flow,
    messages,
  });
  const runner = getRunner({
    messages: reversedMessages,
    currentStep: step,
    currentStepRun,
  });
  const finalContent = await runner.finalContent();
  return finalContent;
};

export const onFlowMessageCreate = onDocumentCreated(
  {
    document: "flowMessage/{docId}",
    maxInstances: 80,
    minInstances: 0,
    memory: "4GiB",
    timeoutSeconds: 540,
    cpu: 1,
  },
  async (change) => {
    if (!change.data) {
      return;
    }
    const messageData = {
      uid: change.data.id,
      ...change.data.data(),
    } as FlowMessage;

    if (
      messageData.senderType !== SenderType.User &&
      messageData.senderType !== SenderType.Introduction
    ) {
      return;
    }

    const allMessages = await queryDocs("flowMessage", (q) => {
      return q
        .where("flowRunKey", "==", messageData.flowRunKey)
        .where("archived", "==", false)
        .orderBy("createdAt", "desc");
    });
    const steps = await queryDocs("step", (q) => {
      return q
        .where("flowKey", "==", messageData.flowKey)
        .where("archived", "==", false)
        .orderBy("index", "asc");
    });
    const flowRun = await readDoc("flowRun", messageData.flowRunKey);
    const flow = await readDoc("flow", messageData.flowKey);
    const curStep = steps[flowRun.currentStepIndex];
    const currentStepRun = await readDoc(
      "stepRun",
      getStepRunKey(flowRun.uid, curStep.uid)
    );

    if (!curStep) {
      return;
    }

    const resp = await getResponse({
      step: curStep,
      flow,
      currentStepRun,
      messages: allMessages,
    });

    console.log("resp", resp);

    // run ai here to get response
    // send response to user

    await fbCreate("flowMessage", {
      flowRunKey: messageData.flowRunKey,
      text: resp || "no response",
      senderType: SenderType.Bot,
      flowKey: messageData.flowKey,
    });
  }
);
