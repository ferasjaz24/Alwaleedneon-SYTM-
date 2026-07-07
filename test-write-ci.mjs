import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);
try {
  await setDoc(doc(db, 'customer_invoices', 'test-doc'), {test: true});
  console.log("Write success!");
} catch (e) {
  console.error("Client write failed:", e.message);
}
