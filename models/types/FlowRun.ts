import { Timestamp } from "firebase/firestore";
import { ModelBase } from "../AllModels";

export type FlowRun = {
  flowKey: string;
  completedAt: null | Timestamp;
} & ModelBase;
