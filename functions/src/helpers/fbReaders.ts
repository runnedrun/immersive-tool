import {
  CollectionReference,
  DocumentSnapshot,
  Query,
  Timestamp,
} from "firebase-admin/firestore";
import { Observable, map } from "rxjs";
import { getBeFirestore } from "./getBeFirestore";
import { CollectionNameToModelType, ModelBase } from "@/models/AllModels";

export type ServerModelBase = {
  createdAt: Timestamp;
  updatedAt: Timestamp;
} & ModelBase;

export function fromServerFbRef(ref: any): Observable<any> {
  return new Observable((subscriber) => {
    const unsubscribe = ref.onSnapshot(
      subscriber.next.bind(subscriber),
      subscriber.error.bind(subscriber)
    );
    return { unsubscribe };
  });
}

export const readDoc = async <
  CollectionName extends keyof CollectionNameToModelType
>(
  collectionName: CollectionName,
  id: string
): Promise<CollectionNameToModelType[CollectionName] & ServerModelBase> => {
  const firestore = getBeFirestore();
  const snap = await firestore.collection(collectionName).doc(id).get();
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
  const firestore = getBeFirestore();
  return fromServerFbRef(firestore.collection(collectionName).doc(id)).pipe(
    map((snap: DocumentSnapshot) => {
      return snap.data() as CollectionNameToModelType[CollectionName] &
        ServerModelBase;
    })
  );
};

export const transactionForDoc = async <
  CollectionName extends keyof CollectionNameToModelType
>(
  collectionName: CollectionName,
  id: string,
  transactionFn: (
    doc: CollectionNameToModelType[CollectionName] & ServerModelBase
  ) => Promise<
    Partial<CollectionNameToModelType[CollectionName] & ServerModelBase>
  >
): Promise<Partial<CollectionNameToModelType[CollectionName]>> => {
  const firestore = getBeFirestore();
  return firestore.runTransaction(async (transaction) => {
    const docRef = firestore.collection(collectionName).doc(id);
    const docSnap = await transaction.get(docRef);
    const doc = docSnap.data() as CollectionNameToModelType[CollectionName] &
      ServerModelBase;
    const docUpdate = await transactionFn(doc);
    if (docUpdate) {
      transaction.set(docRef, docUpdate, { merge: true });
    }
    return docUpdate;
  });
};

export const queryDocs = async <
  CollectionName extends keyof CollectionNameToModelType
>(
  collectionName: CollectionName,
  buildQuery: (ref: CollectionReference) => Query
): Promise<(CollectionNameToModelType[CollectionName] & ServerModelBase)[]> => {
  const firestore = getBeFirestore();
  const ref = firestore.collection(collectionName);
  const query = buildQuery(ref);
  const snap = await query.get();

  const docs = snap.docs;
  return docs.map((doc) => {
    return {
      ...doc.data(),
      uid: doc.id,
    } as CollectionNameToModelType[CollectionName] & ServerModelBase;
  });
};
