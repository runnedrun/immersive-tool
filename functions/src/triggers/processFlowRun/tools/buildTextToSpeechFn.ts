import {
  RunnableFunction,
  RunnableFunctionWithParse,
} from "openai/lib/RunnableFunction.mjs";
import {
  ProcessStepParams,
  StepProcessingToolBuilder,
  StepRunProcessor,
} from "../processStepRun";

type TextToSpeechToolParams = {
  text: string;
  voice: string;
};

export const getTextToSpeechFnSpec = (
  params: ProcessStepParams
): RunnableFunction<TextToSpeechToolParams> => {
  return {
    function: buildTextToSpeechFn(params),
    description:
      "Get a link to an MP3 file of the text spoken by the voice specified",
    parse: JSON.parse, // or use a validation library like zod for typesafe parsing.
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
          enum: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"],
          default: "alloy",
        },
      },
    },
    name: "textToSpeech",
  };
};

export const buildTextToSpeechFn: StepProcessingToolBuilder<
  TextToSpeechToolParams
> = (params) => {
  return async (textToSpeechParams) => {
    console.log("text to speech ", textToSpeechParams);
    return "https://www.example.com/text_to_speed.mp3";
  };
};
