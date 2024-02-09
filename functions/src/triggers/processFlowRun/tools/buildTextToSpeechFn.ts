import { uploadMP3 } from "@/functions/src/helpers/fileHelpers";
import { RunnableFunction } from "openai/lib/RunnableFunction.mjs";
import { SpeechCreateParams } from "openai/resources/audio/speech.mjs";
import { synthesizeSpeechWithOpenAi } from "../../audio/synthesizeSpeech";
import {
  ProcessStepParams,
  StepProcessingToolBuilder,
} from "../processStepRun";

import {
  TextToSpeechToolParams,
  textToSpeechFnBaseSpec,
} from "./TextToSpeechToolParams";
import { getAudioPath } from "./getAudioPath";

export const getTextToSpeechFnSpec = (
  params: ProcessStepParams
): RunnableFunction<TextToSpeechToolParams> => {
  return {
    function: buildTextToSpeechFn(params),
    parse: JSON.parse, // or use a validation library like zod for typesafe parsing.
    ...textToSpeechFnBaseSpec,
  };
};

export const buildTextToSpeechFn: StepProcessingToolBuilder<
  TextToSpeechToolParams
> = (params) => {
  return async (textToSpeechParams) => {
    console.log("text to speech ", textToSpeechParams);
    const buffer = await synthesizeSpeechWithOpenAi(
      textToSpeechParams.text,
      textToSpeechParams.voice as SpeechCreateParams["voice"]
    );

    const url = await uploadMP3(getAudioPath(params, "text-to-speech"), buffer);
    return url;
  };
};
