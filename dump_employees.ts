import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  const snap = await getDocs(collection(db, "employees"));
  const emps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  fs.writeFileSync("employees_dump.json", JSON.stringify(emps, null, 2));
  console.log(`Dumped ${emps.length} employees`);
}
run().catch(console.error);
