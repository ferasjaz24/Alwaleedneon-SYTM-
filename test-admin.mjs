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
  await db.collection('test_admin_write').doc('test').set({ hello: 'world' });
  console.log("Admin write success!");
} catch (e) {
  console.error("Admin write failed:", e.message);
}
