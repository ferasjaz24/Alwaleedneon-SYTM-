import admin from "firebase-admin";

function getPrivateKey() {
  const key = process.env.FIREBASE_PRIVATE_KEY;

  if (!key) {
    throw new Error("Missing FIREBASE_PRIVATE_KEY environment variable");
  }

  return key.replace(/\\n/g, "\n");
}

if (!admin.apps.length) {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("Missing FIREBASE project ID environment variable (VITE_FIREBASE_PROJECT_ID or FIREBASE_PROJECT_ID)");
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: projectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: getPrivateKey(),
    }),
  });
}

export const db = admin.firestore();
export default admin;