import { onCall } from "firebase-functions/v2/https";

export const setup = onCall(async () => {
  console.log("setup");
});
