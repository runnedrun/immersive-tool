import { docObs } from "@/firebase/getters";

// add reqId here with memoize to make sure we can navigate back and forth preoprely

export const flowDataFn = ({ params }: { params: { flowId: string } }) => {
  return {
    flow: docObs("flow", params.flowId),
  };
};
