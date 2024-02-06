import { triggerProcessOnWrite } from "@/data/helpers/triggerProcessOnWrite";
import { readDoc } from "@/firebase/readerFe";
import { fbCreate, fbSet } from "@/firebase/settersFe";
import { SenderType } from "@/models/types/FlowMessage";
import { getFlowRunId } from "@/models/types/FlowRun";
import { redirect } from "next/navigation";

const StartFlow = async ({
  params: { flowId },
  searchParams: { debug },
}: {
  params: { flowId: string };
  searchParams: { debug: string };
}) => {
  console.log("flowId", flowId);
  const flow = await readDoc("flow", flowId);
  const runId = getFlowRunId(flowId);
  const ref = await fbCreate(
    "flowRun",
    {
      flowKey: flowId,
      completedAt: null,
    },
    { id: runId }
  );
  const flowRunId = ref.id;
  await fbCreate("flowMessage", {
    flowRunKey: flowRunId,
    flowKey: flowId,
    senderType: SenderType.Introduction,
    text: flow.introductionMessage,
    processedForStepRunKey: null,
    processedForStep: null,
    toolCallJSON: null,
  });

  await triggerProcessOnWrite(Promise.resolve(ref));
  console.log("DEBUG", debug);

  const url = debug ? `/run/${flowRunId}?debug=true` : `/run/${flowRunId}`;
  redirect(url);
};

export default StartFlow;
