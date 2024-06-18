import { buildBaseSpec } from "../ToolTypes";
import { HitApiEndpointProps } from "./hitApiEndPoint";

export const hitApiEndpointBaseSpec = buildBaseSpec<HitApiEndpointProps>()({
  name: "hitApiEndpoint",
  description:
    "Get a link to a new file which is the result of inserting 'linkToAudioToInsert' into 'linkToOriginalAudio' at 'insertAtTimesstampMs' ms.",
  parameters: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description:
          "The url for the endpoint to send the request to.",
      },
      method: {
        type: "string",
        enum: ["GET", "POST", "PUT", "DELETE"],
        description:
          "The method to use for the http request",
      },
      body: {
        type: "string",
        description:
          "The body of the request, as a JSON ecnoded string.",
      },
    },
    required: ["url", "method", "body"],
  },
} as const);
