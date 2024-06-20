import { deepMapObj } from "@/lib/helpers/deepMapObj"
import { Timestamp } from "@firebase/firestore"

export const hydrateTimestamps = (obj: any) => {
  return deepMapObj(obj || {}, (value) => {
    if (value?.__convertToDate) {
      const TimestampType = Timestamp
      return TimestampType.fromMillis(value.value)
    }
  })
}
