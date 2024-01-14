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
    currentStepIndex: 0,
  });
  const flowRunId = ref.id;
  await fbCreate("flowMessage", {
    flowRunKey: flowRunId,
    flowKey: flowId,
    senderType: SenderType.Introduction,
    text: flow.introductionMessage,
  });
  const url = `/run/${flowRunId}`;
  redirect(url);
};

export default StartFlow;
