import { Observable, map } from "rxjs";

import { CollectionNameToModelType, ModelBase } from "@/models/AllModels";
import { initFb } from "./initFb";
import {
  CollectionReference,
  DocumentSnapshot,
  Query,
  SnapshotListenOptions,
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";

export type ServerModelBase = {
  createdAt: Timestamp;
  updatedAt: Timestamp;
} & ModelBase;

const DEFAULT_OPTIONS = { includeMetadataChanges: false };

export function fromFbRef(
  ref: any,
  options: SnapshotListenOptions = DEFAULT_OPTIONS
): Observable<any> {
  return new Observable((subscriber) => {
    const unsubscribe = onSnapshot(ref, options, {
      next: subscriber.next.bind(subscriber),
      error: subscriber.error.bind(subscriber),
      complete: subscriber.complete.bind(subscriber),
    });
    return { unsubscribe };
  });
}

export const readDoc = async <
  CollectionName extends keyof CollectionNameToModelType
>(
  collectionName: CollectionName,
  id: string
): Promise<CollectionNameToModelType[CollectionName] & ServerModelBase> => {
  const { db } = initFb();
  const snap = await getDoc(doc(db, collectionName, id));
  return {
    ...snap.data(),
    uid: id,
  } as CollectionNameToModelType[CollectionName] & ServerModelBase;
};

export const getObsForDoc = <
  CollectionName extends keyof CollectionNameToModelType
>(
  collectionName: CollectionName,
  id: string
) => {
  const { db } = initFb();
  const docRef = doc(db, collectionName, id);
  return fromFbRef(docRef).pipe(
    map((snap: DocumentSnapshot) => {
      return {
        uid: snap.id,
        ...snap.data(),
      } as CollectionNameToModelType[CollectionName] & ServerModelBase;
    })
  );
};

export const queryDocs = async <
  CollectionName extends keyof CollectionNameToModelType
>(
  collectionName: CollectionName,
  buildQuery: (ref: CollectionReference) => Query
): Promise<(CollectionNameToModelType[CollectionName] & ServerModelBase)[]> => {
  const { db } = initFb();
  const ref = collection(db, collectionName);
  const query = buildQuery(ref);
  const snap = await getDocs(query);

  const docs = snap.docs;
  return docs.map((doc) => {
    return {
      ...doc.data(),
      uid: doc.id,
    } as CollectionNameToModelType[CollectionName] & ServerModelBase;
  });
};
