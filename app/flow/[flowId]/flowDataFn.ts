import { docObs, queryObs } from "@/firebase/getters";
import { query, where, orderBy } from "firebase/firestore";

// add reqId here with memoize to make sure we can navigate back and forth preoprely

export const flowDataFn = ({ params }: { params: { flowId: string } }) => {
  return {
    flow: docObs("flow", params.flowId),
    steps: queryObs("step", (q) => {
      return query(
        q,
        where("flowKey", "==", params.flowId),
        where("archived", "==", false),
        orderBy("createdAt", "asc")
      );
    }),
  };
};
