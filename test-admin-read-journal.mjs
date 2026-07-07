import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
try {
  initializeApp({
    credential: applicationDefault(),
    projectId: config.projectId
  });
  const db = getFirestore();
  const snap = await db.collection('journal_entries').get();
  console.log("Journal entries size:", snap.size);
} catch (e) {
  console.error("Admin read failed:", e.message);
}
