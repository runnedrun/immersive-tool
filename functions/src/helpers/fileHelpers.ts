import admin from "firebase-admin";
import { getBeStorage } from "./getBeFirestore";
import { isLocal } from "./isLocal";

export const getTextFile = async (filename: string) => {
  const bucket = getBeStorage().bucket();
  const file = bucket.file(filename);
  const resp = await file.download();

  return resp[0].toString();
};

export const uploadTextFile = async (
  filename: string,
  fileContents: string
) => {
  const bucket = getBeStorage().bucket();
  const metadata = {
    contentType: "txt",
    cacheControl: "public, max-age=31536000",
  };

  const file = bucket.file(filename);
  await file.save(fileContents, {
    resumable: false,
    metadata: metadata,
    validation: false,
  });

  return filename;
};

export const uploadMP3 = async (filePath: string, fileContents: Buffer) => {
  const bucket = getBeStorage().bucket();
  const metadata = {
    contentType: "audio/mpeg",
    cacheControl: "public, max-age=31536000",
  };

  const file = bucket.file(`pronunciationAudio/${filePath}`);
  await file.save(fileContents, {
    resumable: false,
    metadata: metadata,
    validation: false,
  });
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: "03-09-2500",
  });

  return isLocal()
    ? url.replace("https://storage.googleapis.com", "http://localhost:9189")
    : url;
};
