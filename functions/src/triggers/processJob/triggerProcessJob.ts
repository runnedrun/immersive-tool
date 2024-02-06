import { JobTypes, ProcessingJob } from "@/models/types/ProcessingJob";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { error } from "firebase-functions/logger";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { isUndefined } from "lodash";
import { toTimestamp } from "../../helpers/toTimestamp";
import { fbSet } from "../../helpers/fbWriters";
import { processFlowRun } from "../processFlowRun/processFlowRun";

const jobTypeMap: Partial<
  Record<JobTypes, (docId: string, trigger: number) => Promise<boolean>>
> = {
  flowRun: processFlowRun,
};

const timeoutSeconds = 540;
export const triggerProcessJob = onDocumentWritten(
  {
    document: "processingJob/{docId}",
    maxInstances: 80,
    minInstances: 1,
    memory: "4GiB",
    timeoutSeconds: timeoutSeconds,
    cpu: 2,
  },
  async (change) => {
    const after = (change?.data?.after?.data?.() || {}) as ProcessingJob;
    const before = (change?.data?.before?.data?.() || {}) as ProcessingJob;
    const oldTrigger = toTimestamp(before?.triggeredAt);
    const newTrigger = toTimestamp(after.triggeredAt);

    if (isUndefined(change?.data?.after?.id)) {
      return;
    }

    if (Number(after.retriggerCount) > 200) {
      error("retrigger count exceeeded", change?.data?.after?.id);
      return;
    }

    if (oldTrigger.toMillis() !== newTrigger.toMillis()) {
      if (Number(after.retriggerCount) > 0) {
        console.log(
          "running retrigger",
          change?.data?.after?.id,
          after.retriggerCount
        );
      }
      console.log(
        "running process job for",
        change?.data?.after?.id,
        after.jobType
      );
      const jobfn = jobTypeMap[after.jobType];
      if (!jobfn) {
        error("No job type found: ", after.jobType);
        return;
      }
      const shouldRetrigger = await jobfn(
        change.data.after.id,
        newTrigger.toMillis()
      );
      if (shouldRetrigger) {
        console.log("retriggering", change.data.after.id, after.retriggerCount);
        fbSet("processingJob", change.data.after.id, {
          triggeredAt: Timestamp.now(),
          retriggerCount: FieldValue.increment(1),
        });
      }
      return;
    }
  }
);
