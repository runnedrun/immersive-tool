import { ModelBase } from "../AllModels";
import { FlowRun } from "./FlowRun";

export const getStepRunKey = (flowRunKey: string, stepKey: string) =>
  `${flowRunKey}_${stepKey}`;

export type StepRun = {
  flowKey: string;
  flowRunKey: string;
  stepKey: string;
  variableValues: Record<string, string>;
} & ModelBase;
