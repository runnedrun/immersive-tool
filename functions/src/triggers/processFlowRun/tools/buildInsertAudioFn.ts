import { uploadMP3 } from "@/functions/src/helpers/fileHelpers";
import { RunnableFunction } from "openai/lib/RunnableFunction.mjs";
import {
  ReplaceAudioArgs,
  insertAudioAtTimestamp,
} from "../../audio/insertAudioAtTimestamp";
import {
  ProcessStepParams,
  StepProcessingToolBuilder,
} from "../processStepRun";
import { getAudioPath } from "./getAudioPath";
import { insertAudioFnBaseSpec } from "./insertAudioFnBaseSpec";

export const getInsertAudioFnSpec = (
  params: ProcessStepParams
): RunnableFunction<ReplaceAudioArgs> => {
  return {
    function: buildInsertAudioFn(params),
    parse: JSON.parse,
    ...insertAudioFnBaseSpec,
  };
};

export const buildInsertAudioFn: StepProcessingToolBuilder<ReplaceAudioArgs> = (
  params
) => {
  return async (replaceAudioParams) => {
    console.log("replacing audio", replaceAudioParams);
    const buffer = await insertAudioAtTimestamp(replaceAudioParams);
    console.log("replacement complete");
    const filePath = getAudioPath(params, "replaced-audio");
    const url = await uploadMP3(filePath, buffer);
    return url;
  };
};
