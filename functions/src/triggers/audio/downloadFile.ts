import fs from "fs";
import fetch from "node-fetch";

export async function downloadFile(
  url: string,
  outputPath: string
): Promise<void> {
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
