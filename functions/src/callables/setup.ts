import { onCall } from "firebase-functions/v2/https";
import { fbCreate, fbSet } from "../helpers/fbWriters";
import { Timestamp } from "firebase-admin/firestore";

export const setup = onCall(async () => {
  console.log("setup");

  const ref = await fbSet("flow", "1", {
    description: "This is a flow to create audio stories from a users input",
    introductionMessage:
      "Welcome to the show. We're going to collect a bit of information first. ",
    title: "The Show",
  });

  await fbCreate(
    "step",
    {
      aiIntro: null,
      title: "Get the users email, biggest fear, and name and email",
      index: 0,
      flowKey: ref.id,
      template:
        "Using {{name}}'s most terrifying experience, wich is {{terrifyingExperience}}, write a story about {{name}} overcoming this fear.",
      responseDescription: "Respond to the user with 'Ok great processing...'",
      variableDescriptions: {
        name: {
          description: "the user's first and last name",
          createdAt: Timestamp.fromMillis(1000),
        },
        terrifyingExperience: {
          description:
            "a two sentence description of the user's fear, could be an object, a scary situation from their past, etc.",
          createdAt: Timestamp.fromMillis(2000),
        },
        email: {
          description: "the user's email address, properly formatted",
          createdAt: Timestamp.fromMillis(3000),
        },
      },
      outputVariableDescriptions: {
        terrifyingExperienceStory: {
          description: "The story you wrote about them overcoming their fear",
          createdAt: Timestamp.fromMillis(4000),
        },
      },
    },
    {
      id: "step1",
    }
  );
});
