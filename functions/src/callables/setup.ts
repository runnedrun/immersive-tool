import { onCall } from "firebase-functions/v2/https";
import { fbCreate } from "../helpers/fbWriters";
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
      runIdentifier: `{{name}}-{{email}}`,
    },
    { id: "1", merge: false }
  );

  await fbCreate(
    "step",
    {
      variableCollectionInstructions: null,
      title: "Get the users biggest fear, memory, name and email",
      index: 0,
      flowKey: ref.id,
      template: `Using {{name}}'s most terrifying experience, which is:
       {{terrifyingExperience}}
      
       Write a story about {{name}} overcoming this fear.

       Then, write a story about {{name}}'s most vivid memory, which is {{vividMemory}}.
       
       Return both stories like this:
       
       terrifying experience story:       
       vivid memory story:`,
      preExecutionMessage: "Creating stories...",
      responseDescription: null,
      variableDescriptions: {
        name: {
          description: "the user's first and last name",
          createdAt: Timestamp.fromMillis(1000),
        },
        vividMemory: {
          description: "a vivid memory from the users life",
          createdAt: Timestamp.fromMillis(1500),
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
        vividMemoryStory: {
          description: "The story you wrote about their memory",
          createdAt: Timestamp.fromMillis(5000),
        },
      },
    },
    {
      id: "step1",
      merge: false,
    }
  );
  await fbCreate(
    "step",
    {
      variableCollectionInstructions: null,
      title: "Turn the stories from the previous steps into audio files",
      index: 1,
      flowKey: ref.id,
      preExecutionMessage: "Creating audio",
      template: `Take the the two stories below and turn them into audio mp3 files, using the fable voice:
        terrifying experience story: {{terrifyingExperienceStory}}
        vivid memory story: {{vividMemoryStory}}
        
        Return the links to the audio files like this:
        terrifyingExperienceLink: 
        vividMemoryLink: `,
      responseDescription: null,
      variableDescriptions: null,
      outputVariableDescriptions: {
        terrifyingExperienceAudioLink: {
          description:
            "The link you generated for the terrifying experience audio file",
          createdAt: Timestamp.fromMillis(4000),
        },
        vividMemoryAudioLink: {
          description: "The link you generated for the vivid memory audio file",
          createdAt: Timestamp.fromMillis(5000),
        },
      },
    },
    {
      id: "step2",
      merge: false,
    }
  );

  await fbCreate(
    "step",
    {
      variableCollectionInstructions: null,
      title: "Overlay the background audio onto both audio files",
      index: 2,
      flowKey: ref.id,
      preExecutionMessage: "Processing audio part 1...",
      template: `Take these two audio files:
      terrifyingStory: {{terrifyingExperienceAudioLink}}
      vividMemoryStory: {{vividMemoryAudioLink}}
      And overlay the following background audio onto both of them:
      https://storage.googleapis.com/immersive-b573e.appspot.com/static_files/TWR%20-%20Audio%20BG%20-%20Fear.mp3      
      `,
      outputVariableDescriptions: {
        linkToTerrifyingStoryWithBg: {
          description:
            "The link to the audio file you produced with the background audio, for the terrifying story",
          createdAt: Timestamp.fromMillis(4000),
        },
        linkToVividMemoryStoryWithBg: {
          description:
            "The link to the audio file you produced with the background audio, for the vivid memory story",
          createdAt: Timestamp.fromMillis(5000),
        },
      },
      responseDescription: null,
      variableDescriptions: null,
    },
    {
      id: "step3",
      merge: false,
    }
  );

  await fbCreate(
    "step",
    {
      variableCollectionInstructions: null,
      title:
        "Insert the terrifying experience audio into a different audio file at the given timestamp",
      index: 3,
      flowKey: ref.id,
      preExecutionMessage: "Processing audio part 2...",
      template: `Take the given link to the given audio file to insert and insert it into the given original file, at the given timestamp:
        file to insert: {{linkToVividMemoryStoryWithBg}}
        original file:  https://storage.googleapis.com/immersive-b573e.appspot.com/static_files/TWR%20-%20Track%203%20-%20Fable%20-%20test%20audio%20(1).mp3
        insertAt: 2110`,
      outputVariableDescriptions: {
        linkToProcessedTerrifyingAudio: {
          description: "The link to the processed audio file you just produced",
          createdAt: Timestamp.fromMillis(4000),
        },
      },
      responseDescription: null,
      variableDescriptions: null,
    },
    {
      id: "step4",
      merge: false,
    }
  );
  await fbCreate(
    "step",
    {
      variableCollectionInstructions: null,
      title:
        "Insert the vivid experience audio into a different audio file at the given timestamp",
      index: 4,
      flowKey: ref.id,
      preExecutionMessage: "Processing audio part 3...",
      template: `Take the given link to the give audio file to insert and insert it into given original file, at the given timestamp:
        file to insert: {{linkToTerrifyingStoryWithBg}}
        original file: {{linkToProcessedTerrifyingAudio}}
        insertAt: 1655`,

      outputVariableDescriptions: {
        linkToFullyProcessedAudio: {
          description: "The link to the processed audio file you just produced",
          createdAt: Timestamp.fromMillis(4000),
        },
      },
      responseDescription:
        "Your [audio experience]({{linkToFullyProcessedAudio}}) is ready",
      variableDescriptions: null,
    },
    {
      id: "step5",
      merge: false,
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
      runIdentifier: `{{name}} hi`,
    },
    { id: "2", merge: false }
  );

  await fbCreate(
    "step",
    {
      variableCollectionInstructions: null,
      title: "Get the users name",
      index: 0,
      flowKey: ref.id,
      template: "Give me a similar name to: {{name}}",
      responseDescription: "Hi this is you [{{name}}](https://www.google.com)",
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
      merge: false,
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
      responseDescription: "The rhyme is: {{rhyme}}",
      variableDescriptions: null,
      outputVariableDescriptions: {
        rhyme: {
          createdAt: Timestamp.fromMillis(4000),
          description: "The rhyme you generated",
        },
      },
    },
    {
      id: "2-step2",
      merge: false,
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
      merge: false,
    }
  );
  await fbCreate(
    "step",
    {
      variableCollectionInstructions: null,
      title:
        "Insert the audio file into a different audio file at the given timestamp",
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
      merge: false,
    }
  );
};

export const setup = onCall(async () => {
  console.log("setup");
  createBigFlow();
  createSmallFlow();
  createAudioFlow();
});
