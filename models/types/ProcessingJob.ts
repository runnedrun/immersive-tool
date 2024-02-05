import { Timestamp } from "firebase/firestore";
import { AllModels, CollectionNameToModelType, ModelBase } from "../AllModels";

type SubJobNames = "";
export type JobTypes = keyof CollectionNameToModelType | SubJobNames;

export type ProcessingJob = {
  expiresAt?: Timestamp;
  triggeredAt: Timestamp;
  jobType: JobTypes;
  retriggerCount?: number;
} & ModelBase;
