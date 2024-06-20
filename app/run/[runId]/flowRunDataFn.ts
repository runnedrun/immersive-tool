import { DataFnType } from "@/data/component"
import { docObs, queryObs } from "@/firebase/getters"
import { getObsForDoc } from "@/firebase/readerFe"
import { Flow } from "@/models/types/Flow"
import { FlowMessage } from "@/models/types/FlowMessage"
import { FlowRun, getFlowIdFromFlowRunId } from "@/models/types/FlowRun"
import { orderBy, query, where } from "@firebase/firestore"
import { Observable } from "rxjs"

export const flowRunDataFn: DataFnType<
  {
    messages: Observable<FlowMessage[]>
    flowRun: Observable<FlowRun>
    flow: Observable<Flow>
    debugMode: boolean
    runId: string
  },
  { runId: string; debug?: string }
> = ({ params: { runId, debug } }) => {
  const flowId = getFlowIdFromFlowRunId(runId)
  return {
    messages: queryObs("flowMessage", (collection) => {
      return query(
        collection,
        where("flowRunKey", "==", runId),
        orderBy("createdAt", "desc")
      )
    }),
    flowRun: docObs("flowRun", runId),
    debugMode: !!debug,
    flow: getObsForDoc("flow", flowId),
    runId,
  }
}
