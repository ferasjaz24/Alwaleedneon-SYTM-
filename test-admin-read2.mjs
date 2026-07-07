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
  const snap = await db.collection('customer_invoices').get();
  console.log("Customer invoices size:", snap.size);
} catch (e) {
  console.error("Admin read failed:", e.message);
}
