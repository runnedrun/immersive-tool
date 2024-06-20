import { Timestamp } from "@firebase/firestore"
import { ModelBase } from "../AllModels"
import { VariableData } from "./Step"

export enum GlobalVariableType {
  File,
  QueryParam,
}

export type DocumentFile = {
  name?: string
  url?: string
  internalPath?: string
  content?: string
  createdAt?: Timestamp
}

export type GlobalVariableData = VariableData & {
  type: GlobalVariableType | null
  file?: DocumentFile
  defaultValue?: string
}

export type Flow = {
  title: string
  aiName?: string
  description?: string
  introductionMessage: string
  runIdentifier?: string
  globalVariables?: Record<string, GlobalVariableData>
} & ModelBase
