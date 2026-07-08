import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  const collections = ["users", "employees", "clients", "salaries", "vacations"];
  const dump: any = {};
  for (const col of collections) {
    dump[col] = [];
    try {
      const snap = await getDocs(collection(db, col));
      for (const d of snap.docs) {
        dump[col].push({
          docId: d.id,
          data: d.data()
        });
      }
    } catch (e: any) {
      dump[col] = { error: e.message };
    }
  }
  fs.writeFileSync("users_emps_dump.json", JSON.stringify(dump, null, 2), "utf-8");
  console.log("Dump complete!");
}

run().catch(console.error);
