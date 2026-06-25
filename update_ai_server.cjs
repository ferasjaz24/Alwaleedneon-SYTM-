import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// Replace getGeminiClient
content = content.replace(
  /let aiClient: GoogleGenAI \| null = null;\nfunction getGeminiClient\(\): GoogleGenAI \{\n[\s\S]*?return aiClient;\n\}/m,
  `let cachedApiKey = process.env.GEMINI_API_KEY || "";
let aiClient: GoogleGenAI | null = null;
async function getGeminiClient(): Promise<GoogleGenAI> {
  const settingsDoc = await getDoc(doc(db, "system_settings", "gemini"));
  const currentKey = settingsDoc.exists() ? settingsDoc.data().apiKey : process.env.GEMINI_API_KEY;
  
  if (!currentKey) {
    throw new Error("GEMINI_API_KEY is missing. Please configure it in the System Settings -> AI Setup.");
  }

  // Reload client if key changed
  if (!aiClient || currentKey !== cachedApiKey) {
    cachedApiKey = currentKey;
    aiClient = new GoogleGenAI({
      apiKey: currentKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}`
);

// We need to change synchronous calls to asynchronous: `const ai = getGeminiClient();` to `const ai = await getGeminiClient();`
content = content.replace(/const ai = getGeminiClient\(\);/g, "const ai = await getGeminiClient();");
// There are some places that do `const client = getGeminiClient();`
content = content.replace(/const client = getGeminiClient\(\);/g, "const client = await getGeminiClient();");

// Replace the hardcoded process.env checks in the routes
content = content.replace(/if \(\!process\.env\.GEMINI_API_KEY\) \{\s*return res\.status\(500\)\.json\(\{ error: "No Gemini Key Configured" \}\);\s*\}/g, "");

// Add a route to update settings
if(!content.includes('/api/settings/gemini')) {
  content = content.replace(
      'app.get("/api/users"',
      `app.get("/api/settings/gemini", async (req, res) => {
    try {
      const dbKeySnapshot = await getDoc(doc(db, "system_settings", "gemini"));
      res.json({ apiKey: dbKeySnapshot.exists() ? dbKeySnapshot.data()?.apiKey : process.env.GEMINI_API_KEY || "" });
    } catch (err) {
      res.status(500).json({ error: "Failed to get settings" });
    }
  });

  app.post("/api/settings/gemini", async (req, res) => {
    try {
      const { apiKey } = req.body;
      await setDoc(doc(db, "system_settings", "gemini"), { apiKey });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to save settings" });
    }
  });

  app.get("/api/users"`
  );
}

// Write the file back
fs.writeFileSync('server.ts', content, 'utf8');
console.log('server.ts updated');
