const fs = require('fs');

async function run() {
  let code = fs.readFileSync('server.ts', 'utf-8');

  // Add firestore imports
  code = code.replace(
    'import { Employee, User, Quotation, ClearanceProfile } from "./src/types";',
    'import { Employee, User, Quotation, ClearanceProfile } from "./src/types";\nimport { db } from "./src/lib/firebase";\nimport { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, getDoc } from "firebase/firestore";'
  );

  // Define helper functions to replace local arrays
  const helpers = `
// Firestore Helpers
const getCollectionDocs = async (colName) => {
  const snap = await getDocs(collection(db, colName));
  return snap.docs.map(d => d.data());
};
`;

  code = code.replace('// Removed Supabase client', helpers + '\n// Removed Supabase client');

  // Replace endpoints

  // /api/users
  code = code.replace(
    /app\.get\("\/api\/users", \(req, res\) => \{[\s\S]*?\}\);/,
    `app.get("/api/users", async (req, res) => { res.json(await getCollectionDocs("users")); });`
  );
  code = code.replace(
    /app\.post\("\/api\/users", \(req, res\) => \{[\s\S]*?res\.json\(\{ success: true, user: newUser \}\);\s*\}\);/,
    `app.post("/api/users", async (req, res) => {
    const newUser = req.body;
    if (!newUser.username) {
      res.status(400).json({ error: "Username is required." });
      return;
    }
    await setDoc(doc(db, "users", newUser.username), newUser);
    res.json({ success: true, user: newUser });
  });`
  );
  code = code.replace(
    /app\.put\("\/api\/users\/:username", \(req, res\) => \{[\s\S]*?\}\);/,
    `app.put("/api/users/:username", async (req, res) => {
    const { username } = req.params;
    await setDoc(doc(db, "users", username), req.body, { merge: true });
    res.json({ success: true });
  });`
  );
  code = code.replace(
    /app\.delete\("\/api\/users\/:username", \(req, res\) => \{[\s\S]*?\}\);/,
    `app.delete("/api/users/:username", async (req, res) => {
    const { username } = req.params;
    await deleteDoc(doc(db, "users", username));
    res.json({ success: true });
  });`
  );

  // /api/deductions
  code = code.replace(
    /app\.delete\("\/api\/deductions", async \(req, res\) => \{[\s\S]*?res\.json\(\{ success: true \}\);\s*\}\);/,
    `app.delete("/api/deductions", async (req, res) => {
    const id = (req.query.id as string) || (req.body && req.body.id);
    if (!id) return;
    await deleteDoc(doc(db, "deductions", id));
    res.json({ success: true });
  });`
  );
  code = code.replace(
    /app\.delete\("\/api\/deductions\/:id", async \(req, res\) => \{[\s\S]*?\}\);/,
    `app.delete("/api/deductions/:id", async (req, res) => {
    const { id } = req.params;
    await deleteDoc(doc(db, "deductions", id));
    res.json({ success: true });
  });`
  );

  // /api/monthly_payrolls (salaries)
  code = code.replace(
    /app\.get\("\/api\/monthly_payrolls", async \(req, res\) => \{[\s\S]*?\}\);/,
    `app.get("/api/monthly_payrolls", async (req, res) => { res.json(await getCollectionDocs("salaries")); });`
  );
  code = code.replace(
    /app\.post\("\/api\/monthly_payrolls\/bulk", async \(req, res\) => \{[\s\S]*?\}\);/,
    `app.post("/api/monthly_payrolls/bulk", async (req, res) => {
    const { month, records } = req.body;
    if (!month || !records) {
      res.status(400).json({ error: "Month and records are required." });
      return;
    }
    for (const record of records) {
      const finalRecord = { id: record.id || \`MP-\${month}-\${record.employeeId}-\${Date.now()}\`, ...record };
      await setDoc(doc(db, "salaries", finalRecord.id), finalRecord);
    }
    res.json({ success: true });
  });`
  );
  code = code.replace(
    /app\.post\("\/api\/monthly_payrolls", async \(req, res\) => \{[\s\S]*?\}\);/,
    `app.post("/api/monthly_payrolls", async (req, res) => {
    const record = req.body;
    const finalRecord = { id: record.id || \`MP-\${record.month}-\${record.employeeId}-\${Date.now()}\`, ...record };
    await setDoc(doc(db, "salaries", finalRecord.id), finalRecord);
    res.json({ success: true, record: finalRecord });
  });`
  );

  // /api/employees
  code = code.replace(
    /app\.get\("\/api\/employees", async \(req, res\) => \{[\s\S]*?\}\);/,
    `app.get("/api/employees", async (req, res) => { res.json(await getCollectionDocs("employees")); });`
  );
  code = code.replace(
    /app\.post\("\/api\/employees", async \(req, res\) => \{[\s\S]*?res\.json\(\{ success: true, employee:.*?\}\);\s*\}\);/,
    `app.post("/api/employees", async (req, res) => {
    const newEmp = req.body;
    if (!newEmp.arabicName || !newEmp.englishName) {
       res.status(400).json({ error: "Required fields missing." });
       return;
    }
    newEmp.id = newEmp.id || \`EMP-\${Date.now()}\`;
    await setDoc(doc(db, "employees", newEmp.id), newEmp);
    res.json({ success: true, employee: newEmp });
  });`
  );
  code = code.replace(
    /app\.delete\("\/api\/employees\/:id", async \(req, res\) => \{[\s\S]*?\}\);/,
    `app.delete("/api/employees/:id", async (req, res) => {
    const { id } = req.params;
    await deleteDoc(doc(db, "employees", id));
    res.json({ success: true, message: "Employee profile deleted successfully." });
  });`
  );
  code = code.replace(
    /app\.put\("\/api\/employees\/:id", async \(req, res\) => \{[\s\S]*?\}\);/,
    `app.put("/api/employees/:id", async (req, res) => {
    const { id } = req.params;
    const ref = doc(db, "employees", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
       res.status(404).json({ error: "Employee profile not found." });
       return;
    }
    await setDoc(ref, req.body, { merge: true });
    res.json({ success: true, employee: { ...snap.data(), ...req.body } });
  });`
  );

  // /api/quotations -> projects
  code = code.replace(
    /app\.get\("\/api\/quotations", async \(req, res\) => \{[\s\S]*?\}\);/,
    `app.get("/api/quotations", async (req, res) => { res.json(await getCollectionDocs("projects")); });`
  );
  code = code.replace(
    /app\.post\("\/api\/quotations", async \(req, res\) => \{[\s\S]*?\}\);/,
    `app.post("/api/quotations", async (req, res) => {
    const rQuo = req.body;
    if (!rQuo.id) rQuo.id = \`QT-2026-\${Math.floor(100 + Math.random() * 900)}\`;
    if (!rQuo.dateCreated) rQuo.dateCreated = new Date().toISOString().split("T")[0];
    await setDoc(doc(db, "projects", rQuo.id), rQuo);
    res.json({ success: true, quotation: rQuo, action: "upsert_memory" });
  });`
  );
  code = code.replace(
    /app\.delete\("\/api\/quotations\/:id", async \(req, res\) => \{[\s\S]*?\}\);/,
    `app.delete("/api/quotations/:id", async (req, res) => {
    await deleteDoc(doc(db, "projects", req.params.id));
    res.json({ success: true });
  });`
  );

  // customers
  code = code.replace(
    /app\.get\("\/api\/customers", async \(req, res\) => \{[\s\S]*?\}\);/,
    `app.get("/api/customers", async (req, res) => { res.json(await getCollectionDocs("customers")); });`
  );
  code = code.replace(
    /app\.post\("\/api\/customers", async \(req, res\) => \{[\s\S]*?\}\);/,
    `app.post("/api/customers", async (req, res) => {
    const c = req.body;
    if (!c.id) c.id = \`C-\${Math.floor(300 + Math.random() * 700)}\`;
    await setDoc(doc(db, "customers", c.id), c);
    res.json({ success: true, customer: c });
  });`
  );
  code = code.replace(
    /app\.delete\("\/api\/customers\/:id", async \(req, res\) => \{[\s\S]*?\}\);/,
    `app.delete("/api/customers/:id", async (req, res) => {
    await deleteDoc(doc(db, "customers", req.params.id));
    res.json({ success: true, message: "Customer deleted successfully." });
  });`
  );

  // attendance -> attendance? User said: employees, customers, projects, inventory, vacations, salaries, deductions, users, activity_logs
  // Note: let's map attendance to activity_logs or just keep attendance if not mentioned strictly. Let's use activity_logs
  code = code.replace(
    /app\.get\("\/api\/attendance", async \(req, res\) => \{[\s\S]*?\}\);/,
    `app.get("/api/attendance", async (req, res) => { res.json(await getCollectionDocs("activity_logs")); });`
  );
  code = code.replace(
    /app\.post\("\/api\/attendance", async \(req, res\) => \{[\s\S]*?\}\);/,
    `app.post("/api/attendance", async (req, res) => {
    const att = req.body;
    if (!att.id) att.id = \`ATT-\${Math.floor(200 + Math.random() * 800)}\`;
    await setDoc(doc(db, "activity_logs", att.id), att);
    res.json({ success: true, log: att });
  });`
  );
  code = code.replace(
    /app\.delete\("\/api\/attendance\/:id", async \(req, res\) => \{[\s\S]*?\}\);/,
    `app.delete("/api/attendance/:id", async (req, res) => {
    await deleteDoc(doc(db, "activity_logs", req.params.id));
    res.json({ success: true });
  });`
  );

  // production_orders
  code = code.replace(
    /app\.get\("\/api\/production_orders", async \(req, res\) => \{[\s\S]*?\}\);/,
    `app.get("/api/production_orders", async (req, res) => { res.json(await getCollectionDocs("production_orders")); });`
  );
  code = code.replace(
    /app\.post\("\/api\/production_orders", async \(req, res\) => \{[\s\S]*?\}\);/,
    `app.post("/api/production_orders", async (req, res) => {
    const body = req.body;
    await setDoc(doc(db, "production_orders", body.id), body);
    res.json({ success: true, order: body });
  });`
  );

  // inventory
  code = code.replace(
    /app\.get\("\/api\/inventory", async \(req, res\) => \{[\s\S]*?\}\);/,
    `app.get("/api/inventory", async (req, res) => { res.json(await getCollectionDocs("inventory")); });`
  );
  code = code.replace(
    /app\.post\("\/api\/inventory", async \(req, res\) => \{[\s\S]*?\}\);/,
    `app.post("/api/inventory", async (req, res) => {
    const body = req.body;
    await setDoc(doc(db, "inventory", body.id), body);
    res.json({ success: true, item: body });
  });`
  );

  // tasks
  code = code.replace(
    /app\.get\("\/api\/tasks", async \(req, res\) => \{[\s\S]*?\}\);/,
    `app.get("/api/tasks", async (req, res) => { res.json(await getCollectionDocs("tasks")); });`
  );
  code = code.replace(
    /app\.post\("\/api\/tasks", async \(req, res\) => \{[\s\S]*?\}\);/,
    `app.post("/api/tasks", async (req, res) => {
    const body = req.body;
    await setDoc(doc(db, "tasks", body.id), body);
    res.json({ success: true, task: body });
  });`
  );

  // payments
  code = code.replace(
    /app\.get\("\/api\/payments", async \(req, res\) => \{[\s\S]*?\}\);/,
    `app.get("/api/payments", async (req, res) => { res.json(await getCollectionDocs("payments")); });`
  );
  code = code.replace(
    /app\.post\("\/api\/payments", async \(req, res\) => \{[\s\S]*?\}\);/,
    `app.post("/api/payments", async (req, res) => {
    const body = req.body;
    await setDoc(doc(db, "payments", body.id), body);
    res.json({ success: true, payment: body });
  });`
  );

  // Audit Trails
  code = code.replace(
    /app\.get\("\/api\/v1\/hr\/employee\/audit-trails", \(req, res\) => \{[\s\S]*?\}\);/,
    `app.get("/api/v1/hr/employee/audit-trails", async (req, res) => { res.json(await getCollectionDocs("activity_logs")); });`
  );

  // employee/update
  code = code.replace(
    /app\.put\("\/api\/v1\/hr\/employee\/update", \(req, res\) => \{[\s\S]*?res\.status\(404\)\.json\(\{ error: "Employee profile not found\." \}\);\s*\}\s*\}\);/,
    `app.put("/api/v1/hr/employee/update", async (req, res) => {
    const operatorRole = req.headers["x-user-role"] || req.body.operatorRole || "HR Manager";
    if (operatorRole !== "Super Admin" && operatorRole !== "HR Manager") {
      res.status(403).json({ error: "Access Denied" });
      return;
    }
    const ref = doc(db, "employees", req.body.id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await setDoc(ref, req.body, { merge: true });
      res.json({ success: true, employee: { ...snap.data(), ...req.body } });
    } else {
      res.status(404).json({ error: "Employee profile not found." });
    }
  });`
  );

  // Leaves & Clearances (mapping leaves to vacations internally if possible, but keep API as is if not heavily used)
  // Let's do `getCollectionDocs("vacations")` for clearances as well? Wait, user didn't mention clearances. I'll just map clearances to "clearances".

  code = code.replace(
    /app\.get\("\/api\/v1\/hr\/clearances", \(req, res\) => \{[\s\S]*?\}\);/,
    `app.get("/api/v1/hr/clearances", async (req, res) => { res.json(await getCollectionDocs("clearances")); });`
  );

  code = code.replace(
    /app\.post\("\/api\/v1\/hr\/clearance\/initialize", \(req, res\) => \{[\s\S]*?res\.json\(\{ success: true, clearance \}\);\s*\}\);/,
    `app.post("/api/v1/hr/clearance/initialize", async (req, res) => {
    const { employeeId, commenceDate, reasonCategory, detailedJustification, signatories } = req.body;
    if (!employeeId || !commenceDate || !reasonCategory) {
       res.status(400).json({ error: "Missing parameters" });
       return;
    }
    const clearance = {
      clearanceId: \`CLR-\${Date.now()}\`,
      employeeId, commenceDate, reasonCategory, detailedJustification,
      signatories: signatories || {}, status: "Initiated", dateCreated: new Date().toISOString().split("T")[0]
    };
    await setDoc(doc(db, "clearances", clearance.clearanceId), clearance);
    res.json({ success: true, clearance });
  });`
  );

  code = code.replace(
    /app\.post\("\/api\/v1\/hr\/clearance\/:clearanceId\/resolve-blocker", \(req, res\) => \{[\s\S]*?\}\);/,
    `app.post("/api/v1/hr/clearance/:clearanceId/resolve-blocker", async (req, res) => {
    const { clearanceId } = req.params;
    const { blockerType } = req.body;
    const ref = doc(db, "clearances", clearanceId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
       res.status(404).json({ error: "Not found" });
       return;
    }
    const clearance = snap.data();
    if (clearance.signatories && clearance.signatories[blockerType]) {
      clearance.signatories[blockerType].status = "Cleared";
      clearance.signatories[blockerType].dateCleared = new Date().toISOString().split("T")[0];
    }
    await setDoc(ref, clearance);
    res.json({ success: true, clearance });
  });`
  );

  // Fix dashboard metrics reading from employeesList
  code = code.replace(
    /app\.get\("\/api\/v1\/hr\/dashboard\/metrics", \(req, res\) => \{/g,
    `app.get("/api/v1/hr/dashboard/metrics", async (req, res) => {
    const employeesList = await getCollectionDocs("employees");
    const clearancesList = await getCollectionDocs("clearances");
`
  );

  // Remove variables causing typescript errors and undefined errors
  code = code.replace(/initStore\(\);/g, '');

  fs.writeFileSync('server.ts', code, 'utf-8');
}
run();
