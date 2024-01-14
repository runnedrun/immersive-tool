import { FlowMessage, SenderType } from "@/models/types/FlowMessage";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { getOpenAIClient } from "../ai/getOpenAIClient";
import { queryDocs, readDoc } from "../helpers/fbReaders";
import { fbCreate } from "../helpers/fbWriters";
import { Step } from "@/models/types/Step";
import { FlowRun } from "@/models/types/FlowRun";

const sendEmail = async (params: {
  to: string;
  subject: string;
  body: string;
}) => {
  console.log("sendemail", params);
};

const saveVariable = async (params: { variable: string; value: string }) => {
  console.log("saveVariable", params);
};

const getResponse = async (
  step: Step,
  flowRun: FlowRun,
  messages: FlowMessage[]
) => {
  const messagesForOpenAi = messages
    .filter(({ senderType }) => senderType !== SenderType.Introduction)
    .map((message) => {
      return {
        role: message.senderType === SenderType.Bot ? "assistant" : "user",
        content: message.text,
      } as ChatCompletionMessageParam;
    });
  const requiredInfoMsg = Object.entries(step.variableDescriptions)
    .map(([variable, desc]) => `${variable}: ${desc}`)
    .join("\n");
  messagesForOpenAi.push({
    content: `You are a helpful assistant gathering information for a form. The information you need to gather is the following:
${requiredInfoMsg}.\nStart off by prompting the user for the first piece of information.`,
    role: "system",
  } as ChatCompletionMessageParam);
  const reversedMessages = [...messagesForOpenAi].reverse();

  const client = getOpenAIClient();
  const runner = client.beta.chat.completions
    .runTools({
      model: "gpt-4",
      messages: reversedMessages,
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
                variable: { type: "string", description: "The variable name" },
                value: { type: "string", description: "The variable value" },
              },
            },
          },
        },
      ],
    })
    .on("message", (message) => console.log("onmesaege", message));

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
    if (messageData.senderType === SenderType.Bot) {
      return;
    }

    const allMessages = await queryDocs("flowMessage", (q) => {
      return q
        .where("flowRunKey", "==", messageData.flowRunKey)
        .orderBy("createdAt", "desc");
    });
    const steps = await queryDocs("step", (q) => {
      return q.where("flowKey", "==", messageData.flowKey);
    });
    const flowRun = await readDoc("flowRun", messageData.flowRunKey);
    const curStep = steps[flowRun.currentStepIndex];

    if (!curStep) {
      return;
    }

    console.log("onFlowMessageCreate", messageData, allMessages.length);

    const resp = await getResponse(curStep, flowRun, allMessages);

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
