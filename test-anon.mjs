import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth();
const db = getFirestore(app);

(async () => {
  try {
    await signInAnonymously(auth);
    console.log("Signed in anonymously");
    const snap = await getDocs(collection(db, "cash_boxes"));
    console.log("Success! Docs:", snap.docs.length);
  } catch (err) {
    console.error("Error:", err.message);
  }
})();
