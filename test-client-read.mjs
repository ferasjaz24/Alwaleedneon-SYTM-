import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);
try {
  const snap = await getDocs(collection(db, 'journal_entries'));
  console.log("Journal entries size:", snap.size);
} catch (e) {
  console.error("Client read failed:", e.message);
}
