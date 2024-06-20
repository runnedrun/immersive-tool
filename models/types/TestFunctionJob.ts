import { Timestamp } from "@firebase/firestore"
import { AllModels, CollectionNameToModelType, ModelBase } from "../AllModels"
import { PossibleFnNames } from "@/functions/src/triggers/processFlowRun/tools/availableTools"

// type PossibleFunctionNames = ;

export const getTestFunctionJobId = (flowId: string, functionName: string) => {
  return `${flowId}__${functionName}`
}

export type TestFunctionJob = {
  functionName: PossibleFnNames
  args: Record<string, any>
  result?: string | null
  flowId: string
  startedAt: Timestamp
  completedAt: Timestamp
} & ModelBase
