const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const seedSnippet = `
  // Force Seed emails for all users
  app.get("/api/force-seed-emails", async (req, res) => {
    try {
      const usersRef = collection(db, "users");
      const snap = await getDocs(usersRef);
      let count = 0;
      for (const d of snap.docs) {
        const data = d.data();
        if (data.username) {
          const newEmail = \`\${data.username.toLowerCase()}@alwaleed-factory.com\`;
          await setDoc(doc(db, "users", d.id), { email: newEmail }, { merge: true });
          count++;
        }
      }
      return res.json({ success: true, count });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });
`;

code = code.replace(/\/\/ Secure Server-Side Login Gateway/, seedSnippet + "\n  // Secure Server-Side Login Gateway");
fs.writeFileSync('server.ts', code);
console.log("Added /api/force-seed-emails");
