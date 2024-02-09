import { buildBaseSpec } from "./ToolTypes";

export type TextToSpeechToolParams = {
  text: string;
  voice: string;
};

export const textToSpeechFnBaseSpec = buildBaseSpec<TextToSpeechToolParams>()({
  parameters: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "The text to speak",
      },
      voice: {
        type: "string",
        description: "The voice to use",
        enum: ["fable", "alloy", "echo", "onyx", "nova", "shimmer"],
        default: "fable",
      },
    },
  },
  name: "textToSpeech",
  description:
    "Get a link to an MP3 file of the text spoken by the voice specified",
} as const);
