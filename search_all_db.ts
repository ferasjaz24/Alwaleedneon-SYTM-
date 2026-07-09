import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app);

const COLLECTIONS = [
  "users", "employees", "quotations", "login_logs", "error_logs", "system_audit_logs",
  "salaries", "payroll_runs", "employee_docs", "vehicle_docs", "doc_activity_logs",
  "projects", "customers", "activity_logs", "pricing_studies", "production_orders",
  "inventory", "sales_quotations", "warehouse_items", "tasks", "payroll_audit_logs",
  "journal_entries", "clearances", "vacations", "clients", "deductions"
];

async function run() {
  console.log("Searching all collections...");
  for (const col of COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, col));
      console.log(`Collection ${col}: ${snap.size} documents`);
      for (const d of snap.docs) {
        const id = d.id;
        const data = d.data();
        const str = JSON.stringify({ id, ...data }).toLowerCase();
        if (str.includes("عمر") || str.includes("omar") || str.includes("umar")) {
          console.log(`MATCH FOUND in ${col}! Doc ID: ${id}`);
          console.log(JSON.stringify(data, null, 2));
        }
      }
    } catch (e: any) {
      console.log(`Failed to read ${col}: ${e.message}`);
    }
  }
  console.log("Search complete.");
}

run().catch(console.error);
