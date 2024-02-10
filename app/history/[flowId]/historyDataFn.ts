import { DataFnType } from "@/data/component";
import { queryObs } from "@/firebase/getters";
import { getObsForDoc } from "@/firebase/readerFe";
import { Flow } from "@/models/types/Flow";
import { FlowRun } from "@/models/types/FlowRun";
import { where } from "@firebase/firestore";
import { limit, orderBy, query } from "firebase/firestore";
import { Observable } from "rxjs";

export const historyDataFn: DataFnType<
  {
    flowRunHistory: Observable<FlowRun[]>;
    flow: Observable<Flow>;
  },
  {
    flowId: string;
  },
  {}
> = ({ params: { flowId } }) => {
  return {
    flowRunHistory: queryObs("flowRun", (collection) => {
      return query(
        collection,
        where("flowKey", "==", flowId),
        where("archived", "==", false),
        orderBy("createdAt", "desc"),
        limit(100)
      );
    }),
    flow: getObsForDoc("flow", flowId),
  };
};
