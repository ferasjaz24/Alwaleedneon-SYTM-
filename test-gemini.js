const fetch = require('node-fetch');
async function run() {
  const res = await fetch("http://localhost:3000/api/gemini/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "reply with json { \"test\": 1 }", model: "gemini-3.5-flash", responseMimeType: "application/json" })
  });
  const data = await res.text();
  console.log(data);
}
run();
