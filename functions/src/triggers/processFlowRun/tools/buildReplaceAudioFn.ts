import { uploadMP3 } from "@/functions/src/helpers/fileHelpers";
import { RunnableFunction } from "openai/lib/RunnableFunction.mjs";
import {
  ReplaceAudioArgs,
  replaceAudioAtTimestamp,
} from "../../audio/replaceAudio";
import {
  ProcessStepParams,
  StepProcessingToolBuilder,
} from "../processStepRun";
import { getAudioPath } from "./getAudioPath";
import { replaceAudioFnBaseSpec } from "./replaceAudioFnBaseSpec";

export const getReplaceAudioFnSpec = (
  params: ProcessStepParams
): RunnableFunction<ReplaceAudioArgs> => {
  return {
    function: buildReplaceAudioFn(params),
    parse: JSON.parse,
    ...replaceAudioFnBaseSpec,
  };
};

export const buildReplaceAudioFn: StepProcessingToolBuilder<
  ReplaceAudioArgs
> = (params) => {
  return async (replaceAudioParams) => {
    console.log("replacing audio", replaceAudioParams);
    const buffer = await replaceAudioAtTimestamp(replaceAudioParams);
    console.log("replacement complete");
    const filePath = getAudioPath(params, "replaced-audio");
    const url = await uploadMP3(filePath, buffer);
    return url;
  };
};
