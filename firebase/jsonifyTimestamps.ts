import { deepMapObj } from "@/lib/helpers/deepMapObj";
import { Timestamp } from "@firebase/firestore";

export const jsonifyTimestamps = (obj: any) => {
  return deepMapObj(obj, (nestedValue) => {
    if (
      typeof nestedValue?.nanoseconds !== "undefined" &&
      typeof nestedValue?.seconds !== "undefined"
    ) {
      return {
        value: new Timestamp(
          nestedValue.seconds,
          nestedValue.nanoseconds
        ).toMillis(),
        __convertToDate: true,
      };
    } else if (typeof nestedValue?._key !== "undefined") {
      return nestedValue.path;
    }
  });
};
