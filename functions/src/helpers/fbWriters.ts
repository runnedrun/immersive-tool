import batchPromises from "batch-promises";
import { PartialWithFieldValue, Timestamp } from "firebase-admin/firestore";
import { Timestamp as FeTimestamp } from "firebase/firestore";
import { chunk } from "lodash";
import { getBeFirestore } from "./getBeFirestore";
import { CollectionNameToModelType } from "@/models/AllModels";

export type CreateOptions = {
  id?: string;
};

export const genExtraData = () => {
  return {
    createdAt: Timestamp.now() as FeTimestamp,
    updatedAt: Timestamp.now() as FeTimestamp,
    archived: false,
  };
};

export const backendNow = () => Timestamp.now() as FeTimestamp; //Timestamp.now() as FeTimestamp

export const fbSet = async <
  CollectionName extends keyof CollectionNameToModelType
>(
  collectionName: CollectionName,
  docId: string,
  data: PartialWithFieldValue<CollectionNameToModelType[CollectionName]>
) => {
  const firestore = getBeFirestore();

  await firestore
    .collection(collectionName)
    .doc(docId)
    .set(
      {
        updatedAt: Timestamp.now(),
        ...data,
      },
      { merge: true }
    );

  return firestore.collection(collectionName).doc(docId);
};

export const fbDelete = async <
  CollectionName extends keyof CollectionNameToModelType
>(
  collectionName: CollectionName,
  docId: string
) => {
  const firestore = getBeFirestore();

  await firestore.collection(collectionName).doc(docId).delete();
};

export const fbUpdate = async <
  CollectionName extends keyof CollectionNameToModelType
>(
  collectionName: CollectionName,
  docId: string,
  data: Partial<CollectionNameToModelType[CollectionName]>
) => {
  const firestore = getBeFirestore();

  await firestore
    .collection(collectionName)
    .doc(docId)
    .update({
      updatedAt: Timestamp.now(),
      ...data,
    });

  return firestore.collection(collectionName).doc(docId);
};

export const fbCreate = async <Key extends keyof CollectionNameToModelType>(
  collectionName: Key,
  data: Partial<CollectionNameToModelType[Key]>,
  opts?: CreateOptions
) => {
  const firestore = getBeFirestore();
  const ref = opts?.id
    ? firestore.collection(collectionName).doc(opts.id)
    : firestore.collection(collectionName).doc();
  await ref.set(
    {
      ...genExtraData(),
      ...data,
    },
    { merge: true }
  );
  return ref;
};

export const fbBatchSet = async <
  CollectionName extends keyof CollectionNameToModelType
>(
  collectionName: CollectionName,
  records: CollectionNameToModelType[CollectionName][],
  getDocKey?: (
    record: CollectionNameToModelType[CollectionName],
    i: number
  ) => string,
  batchSize: number = 100
) => {
  const firestore = getBeFirestore();
  const chunked = chunk(records, batchSize);
  const entries = Array.from(chunked.entries());

  // console.log(`starting ${collectionName} save for ${records.length} documents`)

  return batchPromises(
    5,
    entries,
    async ([batchIndex, sentenceBatch]: [
      number,
      CollectionNameToModelType[CollectionName][]
    ]) => {
      const writer = firestore.batch();
      sentenceBatch.forEach((record, sentenceIndex) => {
        const recordToWrite = {
          ...record,
          ...genExtraData(),
        } as CollectionNameToModelType[CollectionName];

        const recordRef = getDocKey
          ? firestore
              .collection(collectionName)
              .doc(getDocKey(record, sentenceIndex + batchIndex * batchSize))
          : firestore.collection(collectionName).doc();

        writer.set(recordRef, recordToWrite, { merge: true });
      });
      // console.log(
      //   `commiting ${collectionName} batch ${batchIndex} out of ${
      //     chunked.length - 1
      //   }`
      // )
      return writer.commit();
    }
  );
};

export const fbBatchDelete = async <
  CollectionName extends keyof CollectionNameToModelType
>(
  collectionName: CollectionName,
  recordIds: string[],
  batchSize: number = 100
) => {
  const firestore = getBeFirestore();
  const chunked = chunk(recordIds, batchSize);
  const entries = Array.from(chunked.entries());

  return batchPromises(
    5,
    entries,
    async ([batchIndex, sentenceBatch]: [number, string[]]) => {
      const writer = firestore.batch();
      sentenceBatch.forEach((recordId, sentenceIndex) => {
        const recordRef = firestore.collection(collectionName).doc(recordId);

        writer.delete(recordRef);
      });

      return writer.commit();
    }
  );
};
