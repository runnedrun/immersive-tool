import { Timestamp } from "firebase/firestore";
import { ModelBase } from "../AllModels";

export enum SenderType {
  User,
  Bot,
  Introduction,
}

export type FlowMessage = {
  flowKey: string;
  flowRunKey: string;
  text: string;
  createdAt: Timestamp;
  senderType: SenderType;
} & ModelBase;
