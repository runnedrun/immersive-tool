import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import os from "os";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { isProdFn } from "../../helpers/isLocal";
import Ffmpeg from "fluent-ffmpeg";
import { downloadFile } from "./downloadFile";

export interface OverlayBackgroundAudioArgs {
  originalFileLink: string;
  linkToFileToOverlay: string;
}
const paddingTimeMs = 3000;

export const overlayBackgroundAudio = async ({
  originalFileLink,
  linkToFileToOverlay,
}: OverlayBackgroundAudioArgs): Promise<Buffer> => {
  // Proceed with ffmpeg using the temporary file as the insert source}
  const tempDir = isProdFn()
    ? path.join("/tmp/audio")
    : path.join(os.tmpdir(), "/audio");

  const tempFolderForThisRun = path.join(tempDir, uuidv4());
  const outputFilePath = path.join(tempFolderForThisRun, "output.mp3");
  const originalFilePath = path.join(tempFolderForThisRun, "original.mp3");

  const overlayAudioPath = path.join(tempFolderForThisRun, "overlay.mp3");

  fs.mkdirSync(tempFolderForThisRun, { recursive: true });

  await Promise.all([
    downloadFile(originalFileLink, originalFilePath),
    downloadFile(linkToFileToOverlay, overlayAudioPath),
  ]);

  const metadataForOriginalFile = await new Promise<Ffmpeg.FfprobeData>(
    (resolve) => {
      ffmpeg.ffprobe(originalFilePath, function (err, metadata) {
        if (err) {
          console.error("Error: ", err);
        } else {
          resolve(metadata);
        }
      });
    }
  );

  const audioFileProcessingComplete = new Promise<string>(
    async (resolve, reject) => {
      // Create a temporary file for the insert audio buffer

      ffmpeg()
        .on("start", (commandLine) => {
          console.log("Spawned Ffmpeg with command: " + commandLine);
        })
        .input(originalFilePath)
        .input(overlayAudioPath)
        .complexFilter([
          {
            filter: "adelay",
            options: { delays: paddingTimeMs },
            inputs: "0:a",
            outputs: "short_delayed",
          },

          // Extend the delayed short audio by adding 3 seconds of silence at the end
          {
            filter: "apad",
            options: { pad_dur: paddingTimeMs / 1000 },
            inputs: "short_delayed",
            outputs: "short_padded",
          },

          // Adjust the volume of the long audio (if needed)
          {
            filter: "volume",
            options: "0.5",
            inputs: "1:a",
            outputs: "long_adjusted",
          },

          // Mix the extended and delayed short audio with the adjusted long audio
          {
            inputs: ["short_padded", "long_adjusted"],
            filter: "amix",
            options: { inputs: 2, duration: "first" },
            outputs: "mixed",
          },
          {
            filter: "afade",
            options: {
              type: "in",
              start_time: 0,
              duration: paddingTimeMs / 1000,
            },
            inputs: "mixed",
            outputs: "faded_in",
          },
          {
            filter: "afade",
            options: {
              type: "out",
              start_time:
                metadataForOriginalFile.format.duration! + paddingTimeMs / 1000,
              duration: paddingTimeMs / 1000,
            },
            inputs: "faded_in",
          },
        ])
        .output(outputFilePath)
        .on("end", () => {
          resolve(outputFilePath);
        })
        .on("error", (err) => {
          console.log(
            "An error occurred in audio overlay: " + err.message,
            err
          );
          reject(err);
        })
        .run();
    }
  );
  await audioFileProcessingComplete;
  console.log("Audio overlay completed. Uploading file");
  const outputFile = fs.readFileSync(outputFilePath);

  // fs.rmSync(tempFolderForThisRun, { recursive: true, force: true });

  return outputFile;
};
