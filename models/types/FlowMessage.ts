import { Timestamp } from "firebase/firestore";
import { ModelBase } from "../AllModels";
import { NullablePropertiesOptional } from "@/functions/src/helpers/NonNullable";
import { Optional } from "utility-types";

export enum SenderType {
  User,
  Bot,
  ExecutionResponse,
  Introduction,
  System,
  ToolCall,
  ToolResponse,
}

export const getFlowMessageWithDefaults = (
  flowMessage: Optional<
    Omit<FlowMessage, keyof ModelBase>,
    "processedForStepRunKey"
  >
) => {
  return {
    processedForStepRunKey: null,
    processedByStepRun: null,
    processedForStep: null,
    toolCallsJSON: null,
    ...flowMessage,
  } as Omit<FlowMessage, keyof ModelBase>;
};

export type FlowMessage = {
  flowKey: string;
  flowRunKey: string;
  processedForStepRunKey: string | null;
  processedForStep?: string | null;
  text: string;
  toolCallsJSON?: null | string;
  toolCallId?: null | string;
  createdAt: Timestamp;
  senderType: SenderType;
  isFlowIntro?: boolean;
} & ModelBase;
