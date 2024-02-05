import { RunnableFunction } from "openai/lib/RunnableFunction.mjs";
import {
  ProcessStepParams,
  StepProcessingToolBuilder,
} from "../processStepRun";

type InsertAudioParams = {
  linkToOriginalAudio: string;
  linkToAudioToInsert: string;
  insertAtTimesstampMs: number;
};

export const getInsertAudioFnSpec = (
  params: ProcessStepParams
): RunnableFunction<InsertAudioParams> => {
  return {
    function: buildTextToSpeechFn(params),
    description:
      "Get a link to a new file which is the result of inserting 'linkToAudioToInsert' into 'linkToOriginalAudio' at 'insertAtTimesstampMs' ms.",
    parse: JSON.parse,
    parameters: {
      type: "object",
      properties: {
        linkToOriginalAudio: {
          type: "string",
          description:
            "The link to the original mp3 file which should be modified.",
        },
        linkToAudioToInsert: {
          type: "string",
          description:
            "The link to the mp3 file which should be inserted at the given timestamp.",
        },
        insertAtTimesstampMs: {
          type: "number",
          description:
            "The timestamp at which to insert audio from 'linkToAudioToInsert'.",
        },
      },
      required: [
        "linkToOriginalAudio",
        "linkToAudioToInsert",
        "insertAtTimesstampMs",
      ],
    },
  };
};

export const buildTextToSpeechFn: StepProcessingToolBuilder<
  InsertAudioParams
> = (params) => {
  return async (textToSpeechParams) => {
    console.log("inserting audio", textToSpeechParams);
    return "https://www.example.com/audio_inserted.mp3";
  };
};
