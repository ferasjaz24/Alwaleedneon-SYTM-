const fetch = require('node-fetch');

(async () => {
  const res = await fetch("http://localhost:3000/api/customer-invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      partyName: "Test Customer",
      totalAmount: 1150,
      taxAmount: 150,
      status: "معتمدة وصادرة"
    })
  });
  const data = await res.json();
  console.log(data);
})();
