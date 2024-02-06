import { Timestamp } from "firebase-admin/firestore";
import { ModelBase } from "../AllModels";

export const getStepRunKey = (flowRunKey: string, stepKey: string) =>
  `${flowRunKey}_${stepKey}`;

export type StepRunState = {
  dataCollectionCompletedAt: Timestamp | null;
  promptCompletedAt: Timestamp | null;
  outputVariableSavingCompletedAt: Timestamp | null;
  finalResponseCompletedAt: Timestamp | null;
  stepCompletedAt: Timestamp | null;
};

export const stepRunStateOrder: (keyof StepRunState)[] = [
  "dataCollectionCompletedAt",
  "promptCompletedAt",
  "outputVariableSavingCompletedAt",
  "finalResponseCompletedAt",
  "stepCompletedAt",
];

export const getNextStepRunState = (state: StepRunState) => {
  for (const key of stepRunStateOrder) {
    if (!state[key]) {
      return key;
    }
  }
  return null;
};

export const getStepRunId = (flowRunKey: string, stepKey: string) => {
  return `${flowRunKey}_${stepKey}`;
};

export const getStepAndFlowRunKeysFromStepRunId = (stepRunId: string) => {
  const [flowRunKey, stepKey] = stepRunId.split("_");
  return { flowRunKey, stepKey };
};

export type StepRun = {
  flowKey: string;
  flowRunKey: string;
  stepKey: string;
  variableValues: Record<string, string>;
  state: StepRunState;
} & ModelBase;
