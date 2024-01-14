import { ModelBase } from "../AllModels";

export type Flow = {
  title: string;
  description: string;
  introductionMessage: string;
} & ModelBase;
