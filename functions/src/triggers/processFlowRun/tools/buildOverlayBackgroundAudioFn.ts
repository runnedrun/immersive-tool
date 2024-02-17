import { uploadMP3 } from "@/functions/src/helpers/fileHelpers";
import { RunnableFunction } from "openai/lib/RunnableFunction.mjs";
import { insertAudioAtTimestamp } from "../../audio/insertAudioAtTimestamp";
import {
  OverlayBackgroundAudioArgs,
  overlayBackgroundAudio,
} from "../../audio/overlayBackgroundAudio";
import {
  ProcessStepParams,
  StepProcessingToolBuilder,
} from "../processStepRun";
import { getAudioPath } from "./getAudioPath";
import { overlayBackgroundAudioBaseSpec } from "./overlayBackgroundAudioBaseSpec.ts";

export const getOverlayBackgroundAudioSpec = (
  params: ProcessStepParams
): RunnableFunction<OverlayBackgroundAudioArgs> => {
  return {
    function: buildOverlayBackgroundAudioFn(params),
    parse: JSON.parse,
    ...overlayBackgroundAudioBaseSpec,
  };
};

export const buildOverlayBackgroundAudioFn: StepProcessingToolBuilder<
  OverlayBackgroundAudioArgs
> = (params) => {
  return async (overlayBackgroundAudioParams) => {
    console.log("overlaying audio", overlayBackgroundAudioParams);
    const buffer = await overlayBackgroundAudio(overlayBackgroundAudioParams);
    console.log("overlay complete");
    const filePath = getAudioPath(params, "overlayed-audio");
    const url = await uploadMP3(filePath, buffer);
    return url;
  };
};
