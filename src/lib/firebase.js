import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import firebaseConfigLocal from '../../firebase-applet-config.json';

const getEnv = (key) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  return null;
};

const firebaseConfig = {
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || firebaseConfigLocal.projectId,
  appId: getEnv('VITE_FIREBASE_APP_ID') || firebaseConfigLocal.appId,
  apiKey: getEnv('VITE_FIREBASE_API_KEY') || firebaseConfigLocal.apiKey,
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || firebaseConfigLocal.authDomain,
  firestoreDatabaseId: firebaseConfigLocal.firestoreDatabaseId,
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || firebaseConfigLocal.storageBucket,
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || firebaseConfigLocal.messagingSenderId,
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID') || firebaseConfigLocal.measurementId,
};

const app = initializeApp(firebaseConfig);
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)" 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);
export const auth = getAuth(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
