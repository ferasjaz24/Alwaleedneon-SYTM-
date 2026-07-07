import fetch from "node-fetch";
const res = await fetch("http://localhost:3000/api/revenues");
console.log(await res.text());
