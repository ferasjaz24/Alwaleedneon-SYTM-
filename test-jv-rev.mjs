import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

const payload = {
  id: "REV-TEST-999",
  sourceModule: "revenues",
  sourceRecordId: "REV-TEST-999",
  clientName: "شركة البناء الحديثة",
  amount: 50000,
  vatAmount: 7500,
  subtotal: 42500,
  date: "2026-07-10",
  description: "دفعة مقدمة لمشروع الواجهة",
  bankAccountId: "BANK-ALRAJHI-123",
  paymentMethod: "bank_transfer"
};

try {
  const fetchRes = await fetch("http://localhost:3000/api/journal-entries/test-create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ module: "revenues", record: payload })
  });
  console.log(await fetchRes.json());
} catch (e) {
  console.error("Test failed:", e.message);
}
