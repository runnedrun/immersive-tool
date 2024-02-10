import { ModelBase } from "../AllModels";

export type Flow = {
  title: string;
  aiName?: string;
  description?: string;
  introductionMessage: string;
  runIdentifier?: string;
} & ModelBase;
