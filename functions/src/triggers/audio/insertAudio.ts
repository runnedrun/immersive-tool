import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import os from "os";
import { v4 as uuidv4 } from "uuid";

const insertAudioAtTimestamp = (
  originalFile: string,
  insertBuffer: Buffer,
  outputFile: string,
  timestamp: string
) => {
  // Create a temporary file for the insert audio buffer
  const tempDir = os.tmpdir();
  const insertFileName = `${uuidv4()}.mp3`; // Assuming the buffer is in mp3 format
  const tempFilePath = `${tempDir}/${insertFileName}`;

  // Write the buffer to the temporary file
  fs.writeFileSync(tempFilePath, insertBuffer);

  // Proceed with ffmpeg using the temporary file as the insert source
  ffmpeg()
    .input(originalFile)
    .input(tempFilePath)
    .complexFilter(
      [
        `[0:a]atrim=0:${timestamp}[a0]; [1:a]adelay=delays=${timestampInMilliseconds(
          timestamp
        )}:all=1[a1]; [a0][a1]amix=inputs=2[aout]`,
      ],
      "aout"
    )
    .output(outputFile)
    .on("end", () => {
      console.log("Audio insert completed.");
      // Clean up the temporary file
      fs.unlinkSync(tempFilePath);
    })
    .on("error", (err) => {
      console.log("An error occurred: " + err.message);
      // Attempt to clean up the temporary file even if an error occurs
      fs.unlinkSync(tempFilePath);
    })
    .run();
};

// Helper function to convert a timestamp to milliseconds
const timestampInMilliseconds = (timestamp: string): string => {
  const [hours, minutes, seconds] = timestamp.split(":").map(Number);
  return ((hours * 3600 + minutes * 60 + seconds) * 1000).toFixed(0);
};
