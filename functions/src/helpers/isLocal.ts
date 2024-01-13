import { defineString } from "firebase-functions/params";

const env = defineString("PROJECT_ENV");
export const isProdFn = () => {
  return env.equals("production").value();
};

export const isLocal = () => {
  return process.env.NODE_ENV === "development";
};
