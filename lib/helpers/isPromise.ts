import { isUndefined } from "lodash";

export const isPromise = (input: any): input is Promise<any> => {
  return !isUndefined((input as Promise<any>)?.then);
};
