import { Timestamp } from "firebase/firestore";
import { ModelBase } from "../AllModels";

export type Flow = {
  title: string;
  description: string;
} & ModelBase;
