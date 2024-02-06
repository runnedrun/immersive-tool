"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { withData } from "@/data/withData";
import { fbCreate } from "@/firebase/settersFe";
import { useEffect, useState } from "react";
import { flowRunDataFn } from "./flowRunDataFn";
import { FlowMessage, SenderType } from "@/models/types/FlowMessage";
import {
  triggerProcessForJobNameAndId,
  triggerProcessOnWrite,
} from "@/data/helpers/triggerProcessOnWrite";
import TextareaAutosize from "react-textarea-autosize";
import { isVisibleMessage } from "./isVisibleMessage";
import { MessageDisplay } from "./MessageDisplay";
import { Flow } from "@/models/types/Flow";
import { DebugMessageDisplay } from "./DebugMessageDisplay";
import { DebugMessagesDisplay } from "./DebugMessagesDisplay";

const NewFlowMessageTextBox = ({
  flowRunKey,
  flowKey,
}: {
  flowRunKey: string;
  flowKey: string;
}) => {
  const [messageText, setMessageText] = useState("");
  return (
    <form
      className="w-full"
      onSubmit={async (e) => {
        await fbCreate("flowMessage", {
          flowRunKey,
          text: messageText,
          senderType: SenderType.User,
          flowKey,
          processedForStepRunKey: null,
          processedForStep: null,
          toolCallJSON: null,
        });
        triggerProcessForJobNameAndId("flowRun", flowRunKey);
        setMessageText("");
        e.preventDefault();

        return false;
      }}
    >
      <div className="flex mr-2 w-full items-end gap-2 flex-col">
        <TextareaAutosize
          className="w-full p-2 border-2 border-gray-300 rounded-md"
          onChange={(e) => {
            setMessageText(e.target.value);
          }}
          value={messageText}
          minRows={2}
        ></TextareaAutosize>
        <Button className={"grow-0"} type="submit">
          Send
        </Button>
      </div>
    </form>
  );
};

const MessagesDisplay = ({
  messages,
  flow,
}: {
  messages: FlowMessage[];
  flow: Flow;
}) => {
  const messagesToDisplay = messages.filter((message) => {
    return isVisibleMessage(message);
  });
  return (
    <div className="flex flex-col-reverse overflow-auto">
      {messagesToDisplay.map((message) => {
        return (
          <MessageDisplay
            message={message}
            flow={flow}
            key={message.uid}
          ></MessageDisplay>
        );
      })}
    </div>
  );
};

export const FlowRunDisplay = withData(
  flowRunDataFn,
  ({ data: { messages, flowRun, flow, debugMode, runId } }) => {
    return (
      <div className="w-full flex justify-center h-screen pb-5">
        <div className="md:w-[32rem] w-full p-4 flex flex-col gap-4 h-full justify-end">
          {debugMode ? (
            <DebugMessagesDisplay
              flowRunId={flowRun.uid}
              messages={messages}
            ></DebugMessagesDisplay>
          ) : (
            <MessagesDisplay flow={flow} messages={messages}></MessagesDisplay>
          )}

          <NewFlowMessageTextBox
            flowRunKey={runId}
            flowKey={flowRun.flowKey}
          ></NewFlowMessageTextBox>
        </div>
      </div>
    );
  }
);
