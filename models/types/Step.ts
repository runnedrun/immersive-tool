import { ModelBase } from "../AllModels";

export enum StepType {
  Prompt,
}

export type StepTypeData = {
  type: StepType.Prompt;
};

export type Step = {
  index: number;
  flowKey: string;
  title: string;
  template: string;
  variableDescriptions: Record<string, string>;
  aiIntro: string;
} & ModelBase;
