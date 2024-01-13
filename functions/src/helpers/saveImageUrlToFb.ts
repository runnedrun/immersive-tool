import { getStorage } from "firebase-admin/storage";
import { getBeStorage } from "./getBeFirestore";
import { Writable } from "stream";
import { isLocal } from "./isLocal";
export const saveImageUrlToFb = async (
  remoteimageurl: string,
  cardId: string
) => {
  const res = await fetch(remoteimageurl);
  const imageBlob = await res.blob();
  const stream = imageBlob.stream();
  const filePath = `images/${cardId}.webp`;
  return saveImageStreamToFb(stream, filePath);
};

export const saveImageStreamToFb = async (
  stream: ReadableStream,
  filePath: string
) => {
  const storage = getBeStorage();
  //uploading blob to firebase storage

  const file = storage.bucket().file(filePath);
  storage.bucket();
  const writableStream = Writable.toWeb(file.createWriteStream());
  await stream.pipeTo(writableStream);
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: "03-09-2500",
  });
  return isLocal()
    ? url.replace("https://storage.googleapis.com", "http://localhost:9189")
    : url;
};
