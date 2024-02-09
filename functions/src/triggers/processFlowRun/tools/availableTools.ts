import { ValuesType } from "utility-types";
import { FnSpecBase, FnSpecBaseWithoutParams } from "./ToolTypes";
import { insertAudioFnBaseSpec } from "./insertAudioFnBaseSpec";
import { textToSpeechFnBaseSpec } from "./TextToSpeechToolParams";
import { RunnableFunctionWithoutParse } from "openai/lib/RunnableFunction.mjs";

const getAvailableToolSpecs = <T extends FnSpecBaseWithoutParams[]>(
  toolSpecs: T
) => {
  return toolSpecs;
};

export const availableToolSpecs = getAvailableToolSpecs([
  insertAudioFnBaseSpec,
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
