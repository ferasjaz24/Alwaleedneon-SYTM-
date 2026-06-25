const fs = require('fs');
let c = fs.readFileSync('server.ts', 'utf-8');

const universalEndpoints = `
  // Universal Endpoints for any dynamic section or info added by the user
  app.get("/api/dynamic/:collection", async (req, res) => {
    try {
      res.json(await getCollectionDocs(req.params.collection));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/dynamic/:collection", async (req, res) => {
    try {
      const col = req.params.collection;
      const body = req.body;
      if (!body.id) body.id = \`REC-\${Date.now()}-\${Math.floor(Math.random()*1000)}\`;
      await setDoc(doc(db, col, String(body.id)), body);
      res.json({ success: true, data: body });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/dynamic/:collection/:id", async (req, res) => {
    try {
      await setDoc(doc(db, req.params.collection, String(req.params.id)), req.body, { merge: true });
      res.json({ success: true, data: req.body });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/dynamic/:collection/:id", async (req, res) => {
    try {
      await deleteDoc(doc(db, req.params.collection, String(req.params.id)));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
`;

if (!c.includes('/api/dynamic/:collection')) {
  c = c.replace(/app\.listen\(PORT, "0\.0\.0\.0", \(\) => \{/, universalEndpoints + '\n  app.listen(PORT, "0.0.0.0", () => {');
  fs.writeFileSync('server.ts', c, 'utf-8');
}
