const fs = require('fs');
const path = require('path');

let f = path.join(__dirname, 'server.ts');
let c = fs.readFileSync(f, 'utf8');

const sqApi = `
  // API: Sales Quotations
  app.get("/api/sales_quotations", async (req, res) => { res.json(await getCollectionDocs("sales_quotations")); });
  app.post("/api/sales_quotations", async (req, res) => {
    try {
      const q = req.body;
      q.id = q.id || \`SQ-\${Date.now()}\`;
      await setDoc(doc(db, "sales_quotations", q.id), q);
      res.json({ success: true, item: q });
    } catch(e) {
      console.error(e);
      res.status(500).json({ error: "Failed to save quotation" });
    }
  });
  app.put("/api/sales_quotations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      await updateDoc(doc(db, "sales_quotations", id), updateData);
      res.json({ success: true, item: updateData });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to update quotation" });
    }
  });
  app.delete("/api/sales_quotations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await deleteDoc(doc(db, "sales_quotations", id));
      res.json({ success: true, message: "Quotation deleted." });
    } catch(e) {
      console.error(e);
      res.status(500).json({ error: "Failed to delete" });
    }
  });
`;

if (!c.includes('/api/sales_quotations')) {
  c = c.replace('// API: Warehouse Items', sqApi + '\n  // API: Warehouse Items');
  fs.writeFileSync(f, c, 'utf8');
}
