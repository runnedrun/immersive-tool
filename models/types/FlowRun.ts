import { Timestamp } from "firebase/firestore"
import { ModelBase } from "../AllModels"
import { v4 as uuidv4 } from "uuid"

export const getFlowRunId = (flowKey: string) => {
  return `${flowKey}__${uuidv4()}`
}

export const getFlowIdFromFlowRunId = (flowRunId: string) => {
  return flowRunId.split("__")[0]
}

export type FlowRun = {
  triggeredAt?: Timestamp
  triggerCancelled?: Timestamp
  flowKey: string
  completedAt: null | Timestamp
  allowInput: boolean
  queryParams: Record<string, string>
  introMessageSent?: boolean
  isDebug: boolean
} & ModelBase
