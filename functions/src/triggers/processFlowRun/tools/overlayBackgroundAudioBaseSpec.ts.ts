import { ReplaceAudioArgs } from "../../audio/insertAudioAtTimestamp";
import { OverlayBackgroundAudioArgs } from "../../audio/overlayBackgroundAudio";
import { buildBaseSpec } from "./ToolTypes";

export const overlayBackgroundAudioBaseSpec =
  buildBaseSpec<OverlayBackgroundAudioArgs>()({
    name: "overlayBackgroundAudio",
    description:
      "Get a link to a new file which is the result of overlaying 'linkToFileToOverlay' over 'linkToOriginalAudio'",
    parameters: {
      type: "object",
      properties: {
        originalFileLink: {
          type: "string",
          description:
            "The link to the original mp3 file which should be modified.",
        },
        linkToFileToOverlay: {
          type: "string",
          description: "The link to the mp3 file which should be overlayed.",
        },
      },
      required: ["originalFileLink", "linkToFileToOverlay"],
    },
  } as const);
