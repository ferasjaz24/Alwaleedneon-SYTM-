import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const snap2 = await getDocs(collection(db, "cash_boxes"));
  console.log(snap2.docs.map(d => ({id: d.id, ...d.data()})));
  process.exit(0);
}
run();
