const fs = require('fs');
const path = require('path');

let serverPath = path.join(__dirname, 'server.ts');
let serverContent = fs.readFileSync(serverPath, 'utf8');

const parseRoute = `
  app.post("/api/gemini/parse-client", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "No Gemini Key Configured" });
      }
      
      const { GoogleGenAI } = require('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = \`Extract client information from this image in following JSON format exactly, with no markdown or extra text:
      {
        "clientName": "",
        "companyName": "",
        "mobile": "",
        "email": "",
        "city": "",
        "crNumber": "",
        "taxNumber": ""
      }\`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { text: prompt },
          { inlineData: { data: imageBase64.split(',')[1], mimeType: imageBase64.split(';')[0].split(':')[1] } }
        ]
      });

      let cleanText = response.text.replace(/\\r\\n/g, "\\n");
      cleanText = cleanText.substring(cleanText.indexOf('{'), cleanText.lastIndexOf('}') + 1);
      
      res.json(JSON.parse(cleanText));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "AI Parsing Failed" });
    }
  });
`;

if(!serverContent.includes('/api/gemini/parse-client')) {
    serverContent = serverContent.replace(
        'app.post("/api/gemini/recruit"',
        parseRoute + '\n  app.post("/api/gemini/recruit"'
    );
    fs.writeFileSync(serverPath, serverContent, 'utf8');
    console.log('Added AI Client parse route');
}
