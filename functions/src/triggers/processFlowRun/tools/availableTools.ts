import { ValuesType } from "utility-types"
import { textToSpeechFnBaseSpec } from "./TextToSpeechToolParams"
import { FnSpecBaseWithoutParams } from "./ToolTypes"
import { insertAudioFnBaseSpec } from "./insertAudioFnBaseSpec"
import { overlayBackgroundAudioBaseSpec } from "./overlayBackgroundAudioBaseSpec.ts"

const getAvailableToolSpecs = <T extends FnSpecBaseWithoutParams[]>(
  toolSpecs: T
) => {
  return toolSpecs
}

export const availableToolSpecs = getAvailableToolSpecs([
  insertAudioFnBaseSpec,
  textToSpeechFnBaseSpec,
  overlayBackgroundAudioBaseSpec,
])

export const availableToolSpecsByName = availableToolSpecs.reduce(
  (acc, spec) => {
    return {
      ...acc,
      [spec.name]: spec,
    }
  },
  {} as Record<PossibleFnNames, FnSpecBaseWithoutParams>
)

export type PossibleFnNames = ValuesType<typeof availableToolSpecs>["name"]
