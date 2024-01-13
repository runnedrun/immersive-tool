import { DataFnType } from "@/data/component";
import { docObs, queryObs } from "@/firebase/getters";
import { FlowMessage } from "@/models/types/FlowMessage";
import { FlowRun } from "@/models/types/FlowRun";
import { orderBy, query, where } from "firebase/firestore";
import { Observable } from "rxjs";

export const flowRunDataFn: DataFnType<
  { messages: Observable<FlowMessage[]>; flowRun: Observable<FlowRun> },
  { runId: string }
> = ({ params: { runId } }) => {
  return {
    messages: queryObs("flowMessage", (collection) => {
      return query(
        collection,
        where("flowRunKey", "==", runId),
        orderBy("createdAt", "desc")
      );
    }),
    flowRun: docObs("flowRun", runId),
  };
};
