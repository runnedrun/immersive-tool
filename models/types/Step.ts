import { Timestamp } from "firebase-admin/firestore";
import { ModelBase } from "../AllModels";

export enum StepType {
  Prompt,
}

export type StepTypeData = {
  type: StepType.Prompt;
};

export type VariableData = {
  createdAt: Timestamp;
  description: string;
};

export type Step = {
  index: number;
  flowKey: string;
  title: string;
  template: string;
  variableDescriptions: Record<string, VariableData> | null;
  aiIntro: string | null;
  responseDescription: string | null;
  outputVariableDescriptions: Record<string, VariableData> | null;
} & ModelBase;
