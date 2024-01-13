import { onCall } from "firebase-functions/v2/https";
import { fbCreate } from "../helpers/fbWriters";

export const setup = onCall(async () => {
  console.log("setup");
  const rep = await fbCreate(
    "flow",
    {
      title: "The best flow ever",
      description: "This is the best flow ever",
      introductionMessage:
        "This is a handcrafted experience not made by AI, it's real. By people, for people. Like you.",
    },
    {
      id: "flow1",
    }
  );
  await fbCreate(
    "step",
    {
      title: "Step 1",
      flowKey: rep.id,
      template:
        "Using {{name}}'s most terrifying experience, wich is {{terrifyingExperience}}, write a story about {{name}} overcoming this fear, and email it to them at {{email}}.",
      variableDescriptions: {
        name: "David Gaynor",
        terrifyingExperience: "being beaten by Vita at Swing Dancing",
        email: "runnedrun@gmail.com",
      },
    },
    {
      id: "step1",
    }
  );
});
