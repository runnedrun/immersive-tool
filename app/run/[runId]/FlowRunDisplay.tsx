"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { withData } from "@/data/withData";
import { fbCreate } from "@/firebase/settersFe";
import { useState } from "react";
import { flowRunDataFn } from "./flowRunDataFn";
import { SenderType } from "@/models/types/FlowMessage";
import {
  triggerProcessForJobNameAndId,
  triggerProcessOnWrite,
} from "@/data/helpers/triggerProcessOnWrite";

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
      onSubmit={async (e) => {
        await fbCreate("flowMessage", {
          flowRunKey,
          text: messageText,
          senderType: SenderType.User,
          flowKey,
          processedForStepRunKey: null,
          processedByStepRun: null,
          processedForStep: null,
          toolCallJSON: null,
        });
        triggerProcessForJobNameAndId("flowRun", flowRunKey);
        setMessageText("");
        e.preventDefault();

        return false;
      }}
    >
      <div className="flex mr-2">
        <Input
          onChange={(e) => {
            setMessageText(e.target.value);
          }}
          value={messageText}
        ></Input>
        <Button type="submit">Send</Button>
      </div>
    </form>
  );
};

export const FlowRunDisplay = withData(
  flowRunDataFn,
  ({ data: { messages, flowRun }, params: { runId } }) => {
    const reversedMessaages = [...messages].reverse();

    return (
      <div>
        <div>
          {reversedMessaages.map((message) => {
            return <div key={message.uid}>{message.text}</div>;
          })}
        </div>
        <div>
          <NewFlowMessageTextBox
            flowRunKey={runId}
            flowKey={flowRun.flowKey}
          ></NewFlowMessageTextBox>
        </div>
      </div>
    );
  }
);
