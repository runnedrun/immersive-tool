import { CollectionNameToModelType, collectionNames } from "@/models/AllModels";
import {
  CollectionReference,
  Query,
  QuerySnapshot,
  collection,
  getDocs,
  getFirestore,
} from "firebase/firestore";
import { memoize } from "lodash";
import { unstable_cache } from "next/cache";
import { Observable, from, map } from "rxjs";
import { fromFbRef, getObsForDoc, readDoc } from "./readerFe";
import { initFb } from "./initFb";
import { isServerside } from "@/lib/isServerSide";
import { ValuesType } from "utility-types";

export const buildGetServer = <Name extends keyof CollectionNameToModelType>(
  collectionName: Name
) =>
  unstable_cache(
    async (id: string) => {
      return readDoc(collectionName, id);
    },
    [collectionName],
    {
      revalidate: 1,
    }
  );

const serverGetters = collectionNames.reduce((acc, collectionName) => {
  return {
    ...acc,
    [collectionName]: buildGetServer(collectionName),
  };
}, {} as { [key in keyof CollectionNameToModelType]: (id: string) => Promise<CollectionNameToModelType[key]> });

const mapQuerySnapshotToModel =
  <ModelType extends ValuesType<CollectionNameToModelType>>() =>
  (_: QuerySnapshot) => {
    return _.docs.map((doc) => {
      return { uid: doc.id, ...doc.data() } as ModelType;
    });
  };

export const queryObs = <Name extends keyof CollectionNameToModelType>(
  collectionName: Name,
  queryBuilder: (ref: CollectionReference) => Query
): Observable<CollectionNameToModelType[Name][]> => {
  const { db } = initFb();
  const collectionRef = collection(db, collectionName);
  const queryRef = queryBuilder(collectionRef);
  const baseObs = isServerside()
    ? from(getDocs(queryRef))
    : fromFbRef(queryRef);
  return baseObs.pipe(
    map(mapQuerySnapshotToModel<CollectionNameToModelType[Name]>())
  );
};

export const docObs = <Name extends keyof CollectionNameToModelType>(
  collectionName: Name,
  id: string
) => {
  if (isServerside()) {
    return from(serverGetters[collectionName](id));
  } else {
    return getObsForDoc(collectionName, id);
  }
};
