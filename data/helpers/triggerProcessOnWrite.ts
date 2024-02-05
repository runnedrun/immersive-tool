import { DocumentReference, Timestamp } from "firebase/firestore";
import { CollectionNameToModelType } from "@/models/AllModels";
import { fbSet } from "@/firebase/settersFe";
import { JobTypes } from "@/models/types/ProcessingJob";

export const triggerProcessOnWrite = async (
  refPromise: Promise<DocumentReference<any>>
) => {
  const ref = await refPromise;
  return fbSet("processingJob", ref.id, {
    triggeredAt: Timestamp.now(),
    jobType: ref.parent.path as keyof CollectionNameToModelType,
    retriggerCount: 0,
  });
};

export const triggerProcessForJobNameAndId = (
  jobType: JobTypes,
  id: string
) => {
  return fbSet("processingJob", id, {
    triggeredAt: Timestamp.now(),
    jobType: jobType,
    retriggerCount: 0,
  });
};
