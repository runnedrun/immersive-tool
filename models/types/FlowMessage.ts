import { Timestamp } from "firebase/firestore";
import { ModelBase } from "../AllModels";

export enum SenderType {
  User,
  Bot,
  Introduction,
  ToolCall,
  ToolResponse,
}

export type FlowMessage = {
  flowKey: string;
  flowRunKey: string;
  text: string;
  toolCallJSON?: null | string;
  createdAt: Timestamp;
  senderType: SenderType;
} & ModelBase;
