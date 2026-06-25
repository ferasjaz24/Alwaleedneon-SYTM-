const fs = require('fs');
const path = require('path');

let f = path.join(__dirname, 'server.ts');
let c = fs.readFileSync(f, 'utf8');

const warehouseApiCode = `
  // API: Warehouse Items
  app.get("/api/warehouse_items", async (req, res) => { res.json(await getCollectionDocs("warehouse_items")); });

  app.post("/api/warehouse_items", async (req, res) => {
    try {
      const newItem = req.body;
      newItem.id = newItem.id || \`WHI-\${Date.now()}\`;
      await setDoc(doc(db, "warehouse_items", newItem.id), newItem);
      res.json({ success: true, item: newItem });
    } catch(e) {
      console.error(e);
      res.status(500).json({ error: "Failed to save item" });
    }
  });

  app.put("/api/warehouse_items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      await updateDoc(doc(db, "warehouse_items", id), updateData);
      res.json({ success: true, item: updateData });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  app.delete("/api/warehouse_items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await deleteDoc(doc(db, "warehouse_items", id));
      res.json({ success: true, message: "Warehouse item deleted." });
    } catch(e) {
      console.error(e);
      res.status(500).json({ error: "Failed to delete item" });
    }
  });
`;

if (!c.includes('/api/warehouse_items')) {
  c = c.replace('// API: Tasks', warehouseApiCode + '\n  // API: Tasks');
  fs.writeFileSync(f, c, 'utf8');
}
