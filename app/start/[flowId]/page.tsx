import { fbCreate, fbSet } from "@/firebase/settersFe";
import { redirect } from "next/navigation";

const StartFlow = async ({
  params: { flowId },
}: {
  params: { flowId: string };
}) => {
  console.log("flowId", flowId);
  const ref = await fbCreate("flowRun", { flowKey: flowId });
  const flowRunId = ref.id;
  const url = `/run/${flowRunId}`;
  redirect(url);
};

export default StartFlow;
