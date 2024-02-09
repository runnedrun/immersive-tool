import { getInsertAudioFnSpec } from "./buildInsertAudioFn";
import { getTextToSpeechFnSpec } from "./buildTextToSpeechFn";
import { RunnableFunctionWithParse } from "openai/lib/RunnableFunction.mjs";
import { ProcessStepParams } from "../processStepRun";
import { PossibleFnNames } from "./availableTools";

export const availableToolGetters: Record<
  PossibleFnNames,
  (params: ProcessStepParams) => RunnableFunctionWithParse<any>
> = {
  insertAudio: getInsertAudioFnSpec,
  textToSpeech: getTextToSpeechFnSpec,
};
