import { App, initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { initializeFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { defineString } from "firebase-functions/params";

let app = null as unknown as App;
const projectName = defineString("PROJECT_NAME");

const getBeApp = () => {
  app =
    app ||
    initializeApp({
      storageBucket: `${projectName.value()}.appspot.com`,
      databaseURL: `https://${projectName.value()}-default-rtdb.firebaseio.com`,
      projectId: projectName.value(),
    });

  return app;
};
export const getBeFirestore = () => {
  const app = getBeApp();
  return initializeFirestore(app, {
    preferRest: true,
  });
};

export const getBeStorage = () => {
  const app = getBeApp();
  return getStorage(app);
};

export const getBeRealtimeDb = () => {
  const app = getBeApp();
  return getDatabase(app);
};
