import { ModelBase } from "../AllModels";

export type FlowRun = {
  flowKey: string;
  currentStepIndex: number;
} & ModelBase;
