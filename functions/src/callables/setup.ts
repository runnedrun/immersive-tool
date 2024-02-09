import { onCall } from "firebase-functions/v2/https";
import { fbCreate, fbSet } from "../helpers/fbWriters";
import { Timestamp } from "firebase-admin/firestore";

const createBigFlow = async () => {
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
};

const createSmallFlow = async () => {
  const ref = await fbCreate(
    "flow",
    {
      description: "This is a short test flow",
      introductionMessage: "Welcome to the test flow",
      title: "Test Flow",
      aiName: "Test host",
    },
    { id: "2" }
  );

  await fbCreate(
    "step",
    {
      variableCollectionInstructions: null,
      title: "Get the users name",
      index: 0,
      flowKey: ref.id,
      template: "Give me a similar name to: {{name}}",
      responseDescription: "Respond to the user with 'Ok great processing...'",
      variableDescriptions: {
        name: {
          description: "the users name",
          createdAt: Timestamp.fromMillis(1000),
        },
      },
      outputVariableDescriptions: {
        similarName: {
          description: "the similar name you generated",
          createdAt: Timestamp.fromMillis(4000),
        },
      },
    },
    {
      id: "2-step1",
    }
  );
  await fbCreate(
    "step",
    {
      variableCollectionInstructions: null,
      title: "Make a rhyme with the name",
      index: 1,
      flowKey: ref.id,
      template: "Give me a rhyme for {{similarName}}",
      responseDescription: "Send back the rhyme you generated",
      variableDescriptions: null,
      outputVariableDescriptions: null,
    },
    {
      id: "2-step1",
    }
  );
};

const createAudioFlow = async () => {
  const ref = await fbCreate(
    "flow",
    {
      description: "This is a short audio test flow",
      introductionMessage: "Welcome to the audio test flow",
      title: "Test Flow",
      aiName: "Test host",
    },
    { id: "3" }
  );

  await fbCreate(
    "step",
    {
      variableCollectionInstructions: null,
      title: "Create a 3 sentence story about the user",
      index: 0,
      flowKey: ref.id,
      preExecutionMessage: "Processing...may take a few minutes",
      template:
        "Create a 3 sentence story about a character named {{name}}, then convert it to an audio file and send back the link.",
      responseDescription:
        "Here is the link to the audio file: {{textToSpeechLink}}",
      variableDescriptions: {
        name: {
          description: "the users name",
          createdAt: Timestamp.fromMillis(1000),
        },
      },
      outputVariableDescriptions: {
        textToSpeechLink: {
          description: "the link to the mp3 file that you just created",
          createdAt: Timestamp.fromMillis(4000),
        },
      },
    },
    {
      id: "3-step1",
    }
  );
  await fbCreate(
    "step",
    {
      variableCollectionInstructions: null,
      title:
        "Inser the audio file into a different audio file at the given timestamp",
      index: 1,
      flowKey: ref.id,
      preExecutionMessage: "Creating audio file...",
      template: `Insert {{textToSpeechLink}} into this file:
      https://storage.googleapis.com/immersive-b573e.appspot.com/static_files/TWR%20-%20Track%203%20-%20Fable%20-%20test%20audio%20(1).mp3
      from timestamp 1655 seconds to timestamp 1785 seconds,
      `,
      responseDescription: "Here is the url: {{finalAudioLink}}",
      variableDescriptions: null,
      outputVariableDescriptions: {
        finalAudioLink: {
          description: "The link to the final audio file",
          createdAt: Timestamp.fromMillis(4000),
        },
      },
    },
    {
      id: "3-step2",
    }
  );
};

export const setup = onCall(async () => {
  console.log("setup");
  createBigFlow();
  createSmallFlow();
  createAudioFlow();
});
