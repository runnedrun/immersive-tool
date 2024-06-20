import { Timestamp } from "@firebase/firestore"

export const toTimestamp = (feTimestamp: Timestamp) => {
  return new Timestamp(feTimestamp?.seconds || 0, feTimestamp?.nanoseconds || 0)
}
