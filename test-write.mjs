import fetch from "node-fetch";
const res = await fetch("http://localhost:3000/api/customer-invoices", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify({ status: "test", amount: 100 })
});
console.log(await res.text());
