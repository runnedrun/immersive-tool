import { ValuesType } from "utility-types";
import { Flow } from "./types/Flow";
import { Step } from "./types/Step";
import { FlowMessage } from "./types/FlowMessage";
import { FlowRun } from "./types/FlowRun";
import { StepRun } from "./types/StepRun";
import { ProcessingJob } from "./types/ProcessingJob";
import { Timestamp } from "firebase/firestore";
import { TestFunctionJob } from "./types/TestFunctionJob";

export type ModelBase = {
  uid: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  archived: boolean;
};

export type CollectionNameToModelType = {
  flow: Flow;
  step: Step;
  flowMessage: FlowMessage;
  flowRun: FlowRun;
  stepRun: StepRun;
  processingJob: ProcessingJob;
  testFunctionJob: TestFunctionJob;
};

export type AllModels = ValuesType<CollectionNameToModelType>;

export const collectionNames: (keyof CollectionNameToModelType)[] = [
  "flow",
  "step",
  "flowMessage",
  "flowRun",
  "stepRun",
  "processingJob",
  "testFunctionJob",
] as const;
