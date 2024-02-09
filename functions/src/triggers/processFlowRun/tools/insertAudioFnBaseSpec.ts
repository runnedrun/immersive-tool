import { ReplaceAudioArgs } from "../../audio/insertAudioAtTimestamp";
import { buildBaseSpec } from "./ToolTypes";

export const insertAudioFnBaseSpec = buildBaseSpec<ReplaceAudioArgs>()({
  name: "insertAudio",
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
      audioToInsertLink: {
        type: "string",
        description:
          "The link to the mp3 file which should be replaced between the given timestamps.",
      },
      insertAtSeconds: {
        type: "number",
        description:
          "The timestamp at which to start replacing audio within 'originalFileLink''.",
      },
    },
    required: ["originalFileLink", "audioToInsertLink", "insertAtSeconds"],
  },
} as const);
