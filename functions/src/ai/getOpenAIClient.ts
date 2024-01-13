import { defineString } from "firebase-functions/params";
import OpenAI from "openai";

const apiKey = defineString("OPEN_AI_API_KEY");

export const getOpenAIClient = () => {
  return new OpenAI({
    apiKey: apiKey.value() || process.env.OPEN_AI_API_KEY,
  });
};
