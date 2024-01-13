import { ValuesType } from "utility-types";
import { Flow } from "./types/Flow";
import { Step } from "./types/Step";
import { FlowMessage } from "./types/FlowMessage";
import { FlowRun } from "./types/FlowRun";

export type ModelBase = {
  uid: string;
  archived: boolean;
};

export type CollectionNameToModelType = {
  flow: Flow;
  step: Step;
  flowMessage: FlowMessage;
  flowRun: FlowRun;
};

export type AllModels = ValuesType<CollectionNameToModelType>;

export const collectionNames: (keyof CollectionNameToModelType)[] = [
  "flow",
  "step",
  "flowMessage",
  "flowRun",
] as const;
