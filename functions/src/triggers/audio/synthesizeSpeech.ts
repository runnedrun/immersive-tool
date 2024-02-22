import { SpeechCreateParams } from "openai/resources/audio/speech.mjs";
import { getOpenAIClient } from "../../ai/getOpenAIClient";

export const synthesizeSpeechWithOpenAi = async (
  text: string,
  voice: SpeechCreateParams["voice"],
  speed: number = 1
) => {
  const openai = getOpenAIClient();
  const res = await openai.audio.speech.create({
    input: text,
    model: "tts-1-hd",
    voice: voice,
    speed: speed,    
  });
  return Buffer.from(await res.arrayBuffer());
};
