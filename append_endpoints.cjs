const fs = require('fs');
let c = fs.readFileSync('server.ts', 'utf-8');

const missingEndpoints = `
  app.get("/api/leaves", async (req, res) => { res.json(await getCollectionDocs("vacations")); });
  app.post("/api/leaves", async (req, res) => {
    const l = req.body;
    if (!l.id) l.id = \`LV-\${Date.now()}\`;
    await setDoc(doc(db, "vacations", l.id), l);
    res.json({ success: true, leave: l });
  });
  app.put("/api/leaves/:id", async (req, res) => {
    const { id } = req.params;
    await setDoc(doc(db, "vacations", id), req.body, { merge: true });
    res.json({ success: true });
  });

  app.get("/api/inquiries", async (req, res) => { res.json(await getCollectionDocs("activity_logs")); });
  app.post("/api/inquiries", async (req, res) => {
    const inq = req.body;
    if (!inq.id) inq.id = \`INQ-\${Date.now()}\`;
    await setDoc(doc(db, "activity_logs", inq.id), inq);
    res.json({ success: true, inquiry: inq });
  });
  app.put("/api/inquiries/:id", async (req, res) => {
    const { id } = req.params;
    await setDoc(doc(db, "activity_logs", id), req.body, { merge: true });
    res.json({ success: true });
  });
  
  app.get("/api/deductions", async (req, res) => { res.json(await getCollectionDocs("deductions")); });
  app.post("/api/deductions", async (req, res) => {
    const d = req.body;
    if (!d.id) d.id = \`DED-\${Date.now()}\`;
    await setDoc(doc(db, "deductions", d.id), d);
    res.json({ success: true, deduction: d });
  });
`;

c = c.replace(/app\.listen\(PORT, "0\.0\.0\.0", \(\) => \{/, missingEndpoints + '\n  app.listen(PORT, "0.0.0.0", () => {');
fs.writeFileSync('server.ts', c, 'utf-8');
