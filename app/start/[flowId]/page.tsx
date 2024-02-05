import { triggerProcessOnWrite } from "@/data/helpers/triggerProcessOnWrite";
import { readDoc } from "@/firebase/readerFe";
import { fbCreate, fbSet } from "@/firebase/settersFe";
import { SenderType } from "@/models/types/FlowMessage";
import { redirect } from "next/navigation";

const StartFlow = async ({
  params: { flowId },
}: {
  params: { flowId: string };
}) => {
  console.log("flowId", flowId);
  const flow = await readDoc("flow", flowId);
  const ref = await fbCreate("flowRun", {
    flowKey: flowId,
    completedAt: null,
  });
  const flowRunId = ref.id;
  await fbCreate("flowMessage", {
    flowRunKey: flowRunId,
    flowKey: flowId,
    senderType: SenderType.Introduction,
    text: flow.introductionMessage,
    processedForStepRunKey: null,
    processedByStepRun: null,
    processedForStep: null,
    toolCallJSON: null,
  });

  await triggerProcessOnWrite(Promise.resolve(ref));

  const url = `/run/${flowRunId}`;
  redirect(url);
};

export default StartFlow;
