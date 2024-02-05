import { getOpenAIClient } from "../../ai/getOpenAIClient";

export enum Gender {
  Male,
  Female,
}
export const synthesizeSpeechWithOpenAi = async (
  text: string,
  gender: Gender,
  speed: number = 1
) => {
  const openai = getOpenAIClient();
  const res = await openai.audio.speech.create({
    input: text,
    model: "tts-1",
    voice: gender === Gender.Female ? "echo" : "alloy",
    speed: speed,
  });
  return Buffer.from(await res.arrayBuffer());
};
