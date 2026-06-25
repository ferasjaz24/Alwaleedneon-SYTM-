const fs = require('fs');
const path = require('path');

let serverPath = path.join(__dirname, 'server.ts');
let serverContent = fs.readFileSync(serverPath, 'utf8');

const clientEndpoints = `
  // CLIENT ENDPOINTS
  app.get("/api/clients", async (req, res) => { res.json(await getCollectionDocs("clients")); });
  app.post("/api/clients", async (req, res) => {
    const c = req.body;
    if (!c.id) c.id = \`CL-\${Date.now()}\`;
    if (!c.dateCreated) c.dateCreated = new Date().toISOString();
    await setDoc(doc(db, "clients", c.id), c);
    res.json({ success: true, client: c });
  });
  app.put("/api/clients/:id", async (req, res) => {
    const { id } = req.params;
    await setDoc(doc(db, "clients", id), req.body, { merge: true });
    res.json({ success: true });
  });
  app.delete("/api/clients/:id", async (req, res) => {
    const { id } = req.params;
    await deleteDoc(doc(db, "clients", id));
    res.json({ success: true });
  });
`;

if(!serverContent.includes('// CLIENT ENDPOINTS')) {
    serverContent = serverContent.replace(
        'app.get("/api/inquiries"',
        clientEndpoints + '\n  app.get("/api/inquiries"'
    );
    fs.writeFileSync(serverPath, serverContent, 'utf8');
    console.log('Added Client endpoints to server.ts');
}
