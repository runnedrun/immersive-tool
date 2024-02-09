import { ValuesType } from "utility-types";
import { FnSpecBase, FnSpecBaseWithoutParams } from "./ToolTypes";
import { replaceAudioFnBaseSpec } from "./replaceAudioFnBaseSpec";
import { textToSpeechFnBaseSpec } from "./TextToSpeechToolParams";
import { RunnableFunctionWithoutParse } from "openai/lib/RunnableFunction.mjs";

const getAvailableToolSpecs = <T extends FnSpecBaseWithoutParams[]>(
  toolSpecs: T
) => {
  return toolSpecs;
};

export const availableToolSpecs = getAvailableToolSpecs([
  replaceAudioFnBaseSpec,
  textToSpeechFnBaseSpec,
]);

export const availableToolSpecsByName = availableToolSpecs.reduce(
  (acc, spec) => {
    return {
      ...acc,
      [spec.name]: spec,
    };
  },
  {} as Record<PossibleFnNames, FnSpecBaseWithoutParams>
);

export type PossibleFnNames = ValuesType<typeof availableToolSpecs>["name"];
