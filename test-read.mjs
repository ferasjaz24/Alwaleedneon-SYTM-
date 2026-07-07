import fetch from "node-fetch";
const res = await fetch("http://localhost:3000/api/finance/migrate-old-journals", { method: "POST" });
const text = await res.text();
console.log(text);
