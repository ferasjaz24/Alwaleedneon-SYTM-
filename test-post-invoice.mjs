(async () => {
  const res = await fetch("http://localhost:3000/api/customer-invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      partyName: "Test Auto",
      status: "معتمدة وصادرة",
      totalAmount: 500,
      taxAmount: 0,
      paymentMethod: "آجل"
    })
  });
  const data = await res.json();
  console.log(data);
})();
