(async () => {
  const res = await fetch("http://localhost:3000/api/customer-invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      partyName: "Test",
      status: "مسودة"
    })
  });
  const data = await res.json();
  console.log(data);
})();
