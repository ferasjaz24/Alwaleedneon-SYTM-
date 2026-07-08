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

async function findGasem() {
  console.log("=== START FIND GASEM ===");
  for (const colName of COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, colName));
      for (const d of snap.docs) {
        const data = d.data();
        const dataStr = JSON.stringify(data);
        if (d.id.toUpperCase().includes("GASEM") || dataStr.toUpperCase().includes("GASEM")) {
          console.log(`FOUND IN COLLECTION: ${colName}`);
          console.log(`Doc ID: ${d.id}`);
          console.log(`Data:`, data);
        }
      }
    } catch (err: any) {
      console.log(`Error reading ${colName}:`, err.message);
    }
  }
  console.log("=== END FIND GASEM ===");
}

findGasem().catch(console.error);
