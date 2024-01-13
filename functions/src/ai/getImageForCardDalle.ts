import { Flow } from "@/models/types/Flow";
import { getOpenAIClient } from "./getOpenAIClient";
import OpenAI from "openai";
import { error } from "firebase-functions/logger";

const getPromptForGpt4 = (card: Flow) => {
  return {
    system: `You are helping me create a fun game for my wife. I will give her "playing cards", which she can use to get me to do things for her.`,
    user: `Please generate a prompt which can be given to DALL-E to produce an image that will go on the top of the playing card. 
    I want the image to be whimsical, fun and cartoonnish, and should feature a cute, 30 year old, asian girl.
    You must return ONLY the prompt, and nothing else.
    Here is the card info:
    Name: ${card.title}
    Description: ${card.description}`,
  };
};

export const getPromptForDalle = async (client: OpenAI, card: Flow) => {
  const promptForText = getPromptForGpt4(card);
  const resp = await client.chat.completions.create({
    messages: [
      { role: "system", content: promptForText.system },
      { role: "user", content: promptForText.user },
    ],
    model: "gpt-4-1106-preview",
    n: 1,
  });
  return resp.choices[0].message.content || "";
};

export const getImageForCardDalle = async (card: Flow) => {
  const client = getOpenAIClient();

  const promptForDalle = await getPromptForDalle(client, card);
  console.log("promptForDalle", promptForDalle);

  let imageUrl = null as string | null;
  try {
    const response = await client.images.generate({
      model: "dall-e-3",
      prompt: promptForDalle,
      n: 1,
      size: "1024x1024",
    });
    imageUrl = response.data[0].url || "";
  } catch (e) {
    error("rate limited");
  }

  console.log(imageUrl);
  return imageUrl;
};
