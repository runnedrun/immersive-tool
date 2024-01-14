import { CollectionNameToModelType } from "@/models/AllModels";
import {
  PartialWithFieldValue,
  Timestamp,
  collection,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { initFb } from "./initFb";

export type CreateOptions = {
  id?: string;
};

export const genExtraData = () => {
  return {
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    archived: false,
  };
};

export const fbSet = async <
  CollectionName extends keyof CollectionNameToModelType
>(
  collectionName: CollectionName,
  docId: string,
  data: PartialWithFieldValue<CollectionNameToModelType[CollectionName]>,
  { merge = true }: { merge?: boolean } = {}
) => {
  const { db } = initFb();
  const ref = doc(db, collectionName, docId);

  await setDoc(
    ref,
    {
      updatedAt: Timestamp.now(),
      ...data,
    },
    { merge }
  );

  return ref;
};

export const fbDelete = async <
  CollectionName extends keyof CollectionNameToModelType
>(
  collectionName: CollectionName,
  docId: string
) => {
  const { db } = initFb();
  const ref = doc(db, collectionName, docId);

  await deleteDoc(ref);
};

export const fbUpdate = async <
  CollectionName extends keyof CollectionNameToModelType
>(
  collectionName: CollectionName,
  docId: string,
  data: Partial<CollectionNameToModelType[CollectionName]>
) => {
  const { db } = initFb();
  const ref = doc(db, collectionName, docId);

  await updateDoc(ref, {
    updatedAt: Timestamp.now(),
    ...data,
  });

  return ref;
};

export const fbCreate = async <Key extends keyof CollectionNameToModelType>(
  collectionName: Key,
  data: Partial<CollectionNameToModelType[Key]>,
  opts?: CreateOptions
) => {
  const { db } = initFb();

  const ref = opts?.id
    ? doc(db, collectionName, opts.id)
    : doc(collection(db, collectionName));

  await setDoc(
    ref,
    {
      ...genExtraData(),
      ...data,
    },
    { merge: true }
  );
  return ref;
};
