(async () => {
  const res = await fetch("http://localhost:3000/api/dynamic/customer_invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: "TEST-INV-1",
      amount: 1000
    })
  });
  const data = await res.json();
  console.log(data);
})();
