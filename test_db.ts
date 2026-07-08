import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc } from "firebase/firestore";
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const snap = await getDocs(collection(db, "employees"));
  let waleedCount = 0;
  for (const d of snap.docs) {
    const data = d.data();
    console.log(d.id, "=> company:", data.company);
    if (data.company && data.company.includes('الوليد')) {
      waleedCount++;
      if (waleedCount === 2) {
         console.log("Renaming this to SignX!");
         data.company = "SignX";
         await setDoc(doc(db, "employees", d.id), data, { merge: true });
      }
    }
  }
  process.exit(0);
}
run();
