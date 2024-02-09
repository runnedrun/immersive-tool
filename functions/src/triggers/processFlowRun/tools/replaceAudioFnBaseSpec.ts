import { ReplaceAudioArgs } from "../../audio/replaceAudio";
import { buildBaseSpec } from "./ToolTypes";

export const replaceAudioFnBaseSpec = buildBaseSpec<ReplaceAudioArgs>()({
  name: "replaceAudio",
  description:
    "Get a link to a new file which is the result of inserting 'linkToAudioToInsert' into 'linkToOriginalAudio' at 'insertAtTimesstampMs' ms.",
  parameters: {
    type: "object",
    properties: {
      originalFileLink: {
        type: "string",
        description:
          "The link to the original mp3 file which should be modified.",
      },
      replacementAudioLink: {
        type: "string",
        description:
          "The link to the mp3 file which should be replaced between the given timestamps.",
      },
      replacementStartTimeSeconds: {
        type: "number",
        description:
          "The timestamp at which to start replacing audio within 'originalFileLink''.",
      },
      replacementEndTimeSeconds: {
        type: "number",
        description:
          "The timestamp at which to end replacing audio within 'originalFileLink''.",
      },
    },
    required: [
      "originalFileLink",
      "replacementAudioLink",
      "replacementStartTimeSeconds",
      "replacementEndTimeSeconds",
    ],
  },
} as const);
