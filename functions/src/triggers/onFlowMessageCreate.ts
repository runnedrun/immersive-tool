import { FlowMessage, SenderType } from "@/models/types/FlowMessage";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { ChatCompletionMessage } from "openai/resources/index.mjs";
import { getOpenAIClient } from "../ai/getOpenAIClient";
import { queryDocs } from "../helpers/fbReaders";
import { fbCreate } from "../helpers/fbWriters";

const sendEmail = async (params: {
  to: string;
  subject: string;
  body: string;
}) => {
  console.log("sendemail", params);
};

const getResponse = async (messages: FlowMessage[]) => {
  const messagesForOpenAi = messages.map((message) => {
    return {
      role: message.senderType === SenderType.Bot ? "assistant" : "user",
      content: message.text,
    } as ChatCompletionMessage;
  });
  messagesForOpenAi.push({
    content: "You are a helpful assistant gathering information for a form.",
    role: "assistant",
  } as ChatCompletionMessage);
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
    console.log("cHANGE", change);
    if (!change.data) {
      return;
    }
    const messageData = {
      uid: change.data.id,
      ...change.data.data(),
    } as FlowMessage;
    console.log("data", messageData);
    if (messageData.senderType !== SenderType.User) {
      return;
    }

    const allMessages = await queryDocs("flowMessage", (q) => {
      return q
        .where("flowRunKey", "==", messageData.flowRunKey)
        .orderBy("createdAt", "desc");
    });

    console.log("onFlowMessageCreate", messageData, allMessages.length);

    const resp = await getResponse(allMessages);

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
