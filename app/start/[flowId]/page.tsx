import {
  triggerProcessForJobNameAndId,
  triggerProcessOnWrite,
} from "@/data/helpers/triggerProcessOnWrite";
import { readDoc } from "@/firebase/readerFe";
import { fbCreate, fbSet } from "@/firebase/settersFe";
import { SenderType } from "@/models/types/FlowMessage";
import { getFlowRunId } from "@/models/types/FlowRun";
import { redirect } from "next/navigation";

const StartFlow = async ({
  params: { flowId },
  searchParams,
}: {
  params: { flowId: string };
  searchParams: Record<string, string>;
}) => {
  console.log("flowId", flowId);
  const runId = getFlowRunId(flowId);
  const ref = await triggerProcessOnWrite(
    fbCreate(
      "flowRun",
      {
        flowKey: flowId,
        completedAt: null,
        allowInput: false,
        queryParams: searchParams,
        isDebug: !!searchParams.debug,
      },
      { id: runId }
    )
  );

  const url = searchParams.debug
    ? `/run/${ref.id}?debug=true`
    : `/run/${ref.id}`;
  redirect(url);
};

export default StartFlow;
