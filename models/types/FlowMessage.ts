import { Timestamp } from "firebase/firestore";
import { ModelBase } from "../AllModels";
import { NullablePropertiesOptional } from "@/functions/src/helpers/NonNullable";
import { Optional } from "utility-types";

export enum SenderType {
  User,
  Bot,
  Introduction,
  System,
  FlowIntroduction,
  StepIntroduction,
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
    toolCallJSON: null,
    ...flowMessage,
  } as Omit<FlowMessage, keyof ModelBase>;
};

export type FlowMessage = {
  flowKey: string;
  flowRunKey: string;
  processedForStepRunKey: string | null;
  processedForStep?: string | null;
  text: string;
  toolCallJSON?: null | string;
  createdAt: Timestamp;
  senderType: SenderType;
} & ModelBase;
