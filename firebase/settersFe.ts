import { CollectionNameToModelType, ModelBase } from "@/models/AllModels";
import {
  DocumentData,
  DocumentReference,
  PartialWithFieldValue,
  Timestamp,
  collection,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { initFb } from "./initFb";
import { omit } from "lodash";

export type CreateOptions = {
  id?: string;
  createdAt?: Timestamp;
};

export const genExtraData = (): Omit<ModelBase, "uid"> => {
  return {
    createdAt: Timestamp.now() as any,
    updatedAt: Timestamp.now() as any,
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

export type ExtendedRef<T> = DocumentReference & {
  data: T;
};

export const fbCreate = async <Key extends keyof CollectionNameToModelType>(
  collectionName: Key,
  data: Omit<CollectionNameToModelType[Key], keyof ModelBase>,
  opts?: CreateOptions
): Promise<ExtendedRef<CollectionNameToModelType[Key]>> => {
  const { db } = initFb();

  const ref: DocumentReference = opts?.id
    ? doc(db, collectionName, opts.id)
    : doc(collection(db, collectionName));

  const createdAtObj = opts?.createdAt ? { createdAt: opts.createdAt } : {};

  const dataToSave = omit(
    {
      ...genExtraData(),
      ...createdAtObj,
      ...data,
    },
    "uid"
  ) as CollectionNameToModelType[Key];

  await setDoc(ref, dataToSave, { merge: true });
  const newRef = ref as ExtendedRef<CollectionNameToModelType[Key]>;
  newRef.data = { ...dataToSave, uid: ref.id };
  return newRef;
};
