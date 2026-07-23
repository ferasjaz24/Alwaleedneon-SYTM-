import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log("Fetching users without long polling...");
getDocs(collection(db, "users")).then(snap => {
  console.log("Success! " + snap.docs.length + " users found.");
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
