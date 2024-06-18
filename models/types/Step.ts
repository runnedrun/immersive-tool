import { Timestamp } from "firebase-admin/firestore"
import { ModelBase } from "../AllModels"
import { availableToolSpecsByName } from "@/functions/src/triggers/processFlowRun/tools/availableTools"

export enum StepType {
  Prompt,
}

export type StepTypeData = {
  type: StepType.Prompt
}

export type VariableData = {
  createdAt: Timestamp
  description: string
}

type FunctionInformation = {
  name: keyof typeof availableToolSpecsByName | null
  args: Record<string, any>
  responseVariableName: string | null
}

export type Step = {
  index: number
  flowKey: string
  title: string
  template: string | null
  preExecutionMessage?: string
  variableDescriptions: Record<string, VariableData> | null
  variableCollectionInstructions: string | null
  responseDescription?: string | null
  outputVariableDescriptions?: Record<string, VariableData> | null
  isDirectFunctionCall?: boolean | null
  functionInformation?: FunctionInformation | null
  runInParallelWithNextStep?: boolean | null
} & ModelBase
