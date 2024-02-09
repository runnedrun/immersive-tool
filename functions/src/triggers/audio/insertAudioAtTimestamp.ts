import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import os from "os";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";
import { isProdFn } from "../../helpers/isLocal";
import Ffmpeg from "fluent-ffmpeg";

export interface ReplaceAudioArgs {
  originalFileLink: string;
  audioToInsertLink: string;
  insertAtSeconds: number;
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

export const insertAudioAtTimestamp = async ({
  originalFileLink,
  audioToInsertLink,
  insertAtSeconds,
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

  fs.mkdirSync(tempFolderForThisRun, { recursive: true });

  await Promise.all([
    downloadFile(originalFileLink, originalFilePath),
    downloadFile(audioToInsertLink, replacementAudioPath),
  ]);

  console.log("existing", fs.existsSync(tempFolderForThisRun));

  // const metadataForFileToInsert = await new Promise<Ffmpeg.FfprobeData>(
  //   (resolve) => {
  //     ffmpeg.ffprobe(replacementAudioPath, function (err, metadata) {
  //       if (err) {
  //         console.error("Error: ", err);
  //       } else {
  //         resolve(metadata);
  //         console.log("Duration: ", metadata.format.duration, "seconds");
  //       }
  //     });
  //   }
  // );

  const audioFileProcessingComplete = new Promise<string>(
    async (resolve, reject) => {
      // Create a temporary file for the insert audio buffer

      ffmpeg()
        .on("start", (commandLine) => {
          console.log("Spawned Ffmpeg with command: " + commandLine);
        })
        .input(originalFilePath) // Original audio/video file
        .input(replacementAudioPath) // Replacement audio file
        .complexFilter([
          // Split the original audio into two parts, before and after the insert point
          {
            filter: "atrim",
            options: { start: 0, end: insertAtSeconds },
            outputs: "before",
          },
          {
            filter: "asetpts",
            options: "PTS-STARTPTS",
            inputs: "before",
            outputs: "before_pts",
          },
          // Process the replacement audio to ensure PTS starts at 0
          {
            filter: "asetpts",
            options: "PTS-STARTPTS",
            inputs: "1:a",
            outputs: "replacement_pts",
          },
          {
            filter: "atrim",
            options: { start: insertAtSeconds },
            inputs: "0:a",
            outputs: "after",
          },
          {
            filter: "asetpts",
            options: "PTS-STARTPTS",
            inputs: "after",
            outputs: "after_pts",
          },
          // Concatenate the three audio streams: before, replacement, and after
          {
            filter: "concat",
            options: { n: 3, v: 0, a: 1 },
            inputs: ["before_pts", "replacement_pts", "after_pts"],
            outputs: "out",
          },
        ]) // Specify the output label of the complex filter as the audio source
        .outputOptions("-map [out]")
        // .map("[out]") // Map the concatenated output to the output file
        .output(outputFilePath)

        .on("end", () => {
          console.log("ENDED audio processing");
          resolve(outputFilePath);
        })
        .on("error", (err) => {
          console.log("An error occurred: " + err.message, err);
          reject(err);

          // Attempt to clean up the temporary file even if an error occurs
        })
        .run();
    }
  );
  await audioFileProcessingComplete;
  console.log("Audio insert completed. Uploading file");
  const outputFile = fs.readFileSync(outputFilePath);

  // fs.rmSync(tempFolderForThisRun, { recursive: true, force: true });

  return outputFile;
};
