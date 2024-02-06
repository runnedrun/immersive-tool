"use client";
import { FlowMessage, SenderType } from "@/models/types/FlowMessage";

export const isVisibleMessage = (message: FlowMessage) => {
  return (
    message.senderType === SenderType.User ||
    message.senderType === SenderType.Bot ||
    message.senderType ||
    SenderType.Introduction
  );
};
