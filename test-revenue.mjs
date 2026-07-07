(async () => {
  const res = await fetch("http://localhost:3000/api/revenues", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: 1000,
      paymentMethod: "كاش",
      status: "معتمد"
    })
  });
  const data = await res.json();
  console.log(data);
})();
