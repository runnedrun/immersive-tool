import { ValuesType } from "utility-types";
import { Flow } from "./types/Flow";
import { Step } from "./types/Step";

export type ModelBase = {
  uid: string;
  archived: boolean;
};

export type CollectionNameToModelType = {
  flow: Flow;
  step: Step;
};

export type AllModels = ValuesType<CollectionNameToModelType>;

export const collectionNames: (keyof CollectionNameToModelType)[] = [
  "flow",
  "step",
] as const;
