import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { experimentalForceLongPolling: true });
console.log("Fetching users...");
getDocs(collection(db, "users")).then(snap => {
  console.log("Success! " + snap.docs.length + " users found.");
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
