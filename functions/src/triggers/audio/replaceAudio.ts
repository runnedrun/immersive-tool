import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import os from "os";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";
import { isProdFn } from "../../helpers/isLocal";

export interface ReplaceAudioArgs {
  originalFileLink: string;
  replacementAudioLink: string;
  replacementStartTimeSeconds: number;
  replacementEndTimeSeconds: number;
}

async function downloadFile(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  const fileStream = fs.createWriteStream(outputPath);
  await new Promise((resolve, reject) => {
    if (!response.body) {
      reject(new Error(`Could not find file: ${url}`));
      return;
    }
    response.body.pipe(fileStream);
    response.body.on("error", reject);
    fileStream.on("finish", resolve);
  });
}

export const replaceAudioAtTimestamp = async ({
  originalFileLink,
  replacementAudioLink,
  replacementStartTimeSeconds,
  replacementEndTimeSeconds,
}: ReplaceAudioArgs): Promise<Buffer> => {
  // Proceed with ffmpeg using the temporary file as the insert source}
  const tempDir = isProdFn()
    ? path.join("/tmp/audio")
    : path.join(os.tmpdir(), "/audio");

  const tempFolderForThisRun = path.join(tempDir, uuidv4());
  const outputFilePath = path.join(tempFolderForThisRun, "output.mp3");
  const originalFilePath = path.join(tempFolderForThisRun, "original.mp3");

  const replacementAudioPath = path.join(
    tempFolderForThisRun,
    "replacement.mp3"
  );

  const audioFileProcessingComplete = new Promise<string>(
    async (resolve, reject) => {
      // Create a temporary file for the insert audio buffer

      fs.mkdirSync(tempFolderForThisRun, { recursive: true });

      await Promise.all([
        downloadFile(originalFileLink, originalFilePath),
        downloadFile(replacementAudioLink, replacementAudioPath),
      ]);

      const duration = replacementEndTimeSeconds - replacementStartTimeSeconds;

      console.log("existing", fs.existsSync(tempFolderForThisRun));

      ffmpeg()
        .on("start", (commandLine) => {
          console.log("Spawned Ffmpeg with command: " + commandLine);
        })
        .input(originalFilePath) // Original audio/video file
        .input(replacementAudioPath) // Replacement audio file
        .complexFilter([
          // Extract the audio before the replacement segment
          `[0:a]atrim=0:${replacementStartTimeSeconds},asetpts=PTS-STARTPTS[before];` +
            // Prepare the replacement audio, ensuring it fits the duration
            `[1:a]atrim=0:${duration},asetpts=PTS-STARTPTS[during];` +
            // Extract the audio after the replacement segment
            `[0:a]atrim=start=${
              replacementStartTimeSeconds + duration
            },asetpts=PTS-STARTPTS[after];` +
            // Concatenate the three audio parts: before, during, and after
            `[before][during][after]concat=n=3:v=0:a=1[out]`,
        ])
        .map("[out]") // Map the concatenated output to the output file
        .on("end", () => {
          console.log("ENDED audio processing");
          resolve(outputFilePath);
        })
        .on("error", (err) => {
          console.log("An error occurred: " + err.message, err);
          reject(err);

          // Attempt to clean up the temporary file even if an error occurs
        })
        .save(outputFilePath);
    }
  );
  await audioFileProcessingComplete;
  console.log("Audio insert completed. Uploading file");
  const outputFile = fs.readFileSync(outputFilePath);
  fs.unlinkSync(tempFolderForThisRun);

  return outputFile;
};
