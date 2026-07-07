import fetch from "node-fetch";
const res = await fetch("http://localhost:3000/api/customer-invoices");
console.log(await res.text());
