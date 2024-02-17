"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { withData } from "@/data/withData";
import { fbCreate } from "@/firebase/settersFe";
import { useEffect, useRef, useState } from "react";
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
import { BeatLoader } from "react-spinners";
import { FlowRun } from "@/models/types/FlowRun";

const NewFlowMessageTextBox = ({
  flowRunKey,
  flowKey,
  disabled,
}: {
  flowRunKey: string;
  flowKey: string;
  disabled?: boolean;
}) => {
  const [messageText, setMessageText] = useState("");
  const sendMessage = async () => {
    fbCreate("flowMessage", {
      flowRunKey,
      text: messageText,
      senderType: SenderType.User,
      flowKey,
      processedForStepRunKey: null,
      processedForStep: null,
      toolCallsJSON: null,
    });
    triggerProcessForJobNameAndId("flowRun", flowRunKey);
    setMessageText("");
  };
  return (
    <div className="flex mr-2 items-end gap-2 flex-col w-full">
      <TextareaAutosize
        disabled={disabled}
        className="w-full p-2 border-2 border-gray-300 rounded-md"
        onChange={(e) => {
          setMessageText(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            sendMessage();
            e.preventDefault();

            return false;
          }
        }}
        value={messageText}
        minRows={2}
      ></TextareaAutosize>
      <Button
        className={"grow-0"}
        type="submit"
        onClick={() => {
          sendMessage();
        }}
      >
        Send
      </Button>
    </div>
  );
};

const MessagesDisplay = ({
  messages,
  flow,
  flowRun,
}: {
  messages: FlowMessage[];
  flowRun: FlowRun;
  flow: Flow;
}) => {
  const messagesToDisplay = messages.filter((message) => {
    return isVisibleMessage(message);
  });
  const messageListRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messageListRef.current) {
      const firstChild = messageListRef.current.firstElementChild;
      if (firstChild) {
        firstChild.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }
  }, [messagesToDisplay.length]);

  return (
    <div
      className="flex flex-col-reverse overflow-auto justify-start grow min-h-0"
      ref={messageListRef}
    >
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
    const firstMessage = messages[0];
    const isLoading =
      firstMessage?.senderType !== SenderType.Bot && !flowRun.completedAt;

    return (
      <div className="w-full flex justify-center h-screen pb-5 flow-run-display">
        <div className="md:w-[32rem] w-full p-4 flex flex-col gap-4 h-full justify-end">
          {flowRun.isDebug && (
            <div className="text-lg text-red-400 text-center min-h-0">
              This is a DEBUG run
            </div>
          )}
          <div className="min-h-0 grow flex flex-col gap-2">
            {debugMode ? (
              <DebugMessagesDisplay
                flowRun={flowRun}
                messages={messages}
              ></DebugMessagesDisplay>
            ) : (
              <MessagesDisplay
                flowRun={flowRun}
                flow={flow}
                messages={messages}
              ></MessagesDisplay>
            )}

            {isLoading && (
              <div className="my-2">
                <BeatLoader></BeatLoader>
              </div>
            )}

            <NewFlowMessageTextBox
              disabled={!flowRun.allowInput || isLoading}
              flowRunKey={runId}
              flowKey={flowRun.flowKey}
            ></NewFlowMessageTextBox>
          </div>
        </div>
      </div>
    );
  }
);
