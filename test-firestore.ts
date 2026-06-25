import { db } from "./src/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

async function run() {
  console.log("DB instance:", !!db);
  const snap = await getDocs(collection(db, "users"));
  console.log("Users size:", snap.size);
}
run().catch(console.error);
