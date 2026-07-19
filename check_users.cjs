const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const checkSnippet = `
  app.get("/api/check-users", async (req, res) => {
    try {
      const usersRef = collection(db, "users");
      const snap = await getDocs(usersRef);
      return res.json({ success: true, count: snap.size });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });
`;
code = code.replace(/\/\/ Secure Server-Side Login Gateway/, checkSnippet + "\n  // Secure Server-Side Login Gateway");
fs.writeFileSync('server.ts', code);
