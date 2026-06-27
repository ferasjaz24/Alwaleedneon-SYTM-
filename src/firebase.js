import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDocs, setDoc, addDoc, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import firebaseConfigLocal from "../firebase-applet-config.json";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigLocal.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigLocal.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigLocal.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigLocal.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigLocal.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigLocal.appId
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const dbServer = {
  getAll: async (coll) => {
    const snap = await getDocs(collection(db, coll));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  create: async (coll, data) => {
    if (data.id) {
      const id = data.id; const clean = { ...data }; delete clean.id;
      await setDoc(doc(db, coll, id), clean, { merge: true });
      return { id, ...clean };
    }
    const docRef = await addDoc(collection(db, coll), data);
    return { id: docRef.id, ...data };
  },
  update: async (coll, id, data) => {
    const clean = { ...data }; delete clean.id;
    await setDoc(doc(db, coll, id), clean, { merge: true });
    return { id, ...clean };
  },
  delete: async (coll, id) => {
    await deleteDoc(doc(db, coll, id));
    return { id, success: true };
  }
};
