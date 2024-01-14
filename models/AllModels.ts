import { ValuesType } from "utility-types";
import { Flow } from "./types/Flow";
import { Step } from "./types/Step";
import { FlowMessage } from "./types/FlowMessage";
import { FlowRun } from "./types/FlowRun";
import { StepRun } from "./types/StepRun";

export type ModelBase = {
  uid: string;
  archived: boolean;
};

export type CollectionNameToModelType = {
  flow: Flow;
  step: Step;
  flowMessage: FlowMessage;
  flowRun: FlowRun;
  stepRun: StepRun;
};

export type AllModels = ValuesType<CollectionNameToModelType>;

export const collectionNames: (keyof CollectionNameToModelType)[] = [
  "flow",
  "step",
  "flowMessage",
  "flowRun",
  "stepRun",
] as const;
