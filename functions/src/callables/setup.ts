import { onCall } from "firebase-functions/v2/https";
import { fbCreate, fbSet } from "../helpers/fbWriters";
import { Timestamp } from "firebase-admin/firestore";

export const setup = onCall(async () => {
  console.log("setup");

  const ref = await fbCreate(
    "flow",
    {
      description: "This is a flow to create audio stories from a users input",
      introductionMessage:
        "Welcome to the show. We're going to collect a bit of information first. ",
      title: "The Show",
      aiName: "AI Host",
    },
    { id: "1" }
  );

  await fbCreate(
    "step",
    {
      variableCollectionInstructions: null,
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
  await fbCreate(
    "step",
    {
      variableCollectionInstructions: null,
      title: "Turn the story from the previous step into an audio file",
      index: 1,
      flowKey: ref.id,
      template: `Take the below story turn it into an audio mp3 file:
        {{terrifyingExperienceStory}}`,
      responseDescription: null,
      variableDescriptions: null,
      outputVariableDescriptions: {
        audioMp3Link: {
          description: "The link you generated to the audio file",
          createdAt: Timestamp.fromMillis(4000),
        },
      },
    },
    {
      id: "step2",
    }
  );

  await fbCreate(
    "step",
    {
      variableCollectionInstructions: null,
      title:
        "Insert the audio file into a different audio file at the given timestamp",
      index: 2,
      flowKey: ref.id,
      template: `Take the given link to an audio mp3 to insert and insert it into the given original file, at the given ms timestamp:
        file to insert: {{audioMp3Link}}
        oriigal file: www.example.com/original.mp3
        timestamp: 1012420`,
      outputVariableDescriptions: {
        "link to processed audio file": {
          description: "The link to the processed audio file you just produced",
          createdAt: Timestamp.fromMillis(4000),
        },
      },
      responseDescription:
        "Respond to the user with the link to the processed audio file: {{link to processed audio file}}",
      variableDescriptions: null,
    },
    {
      id: "step3",
    }
  );
});
