(async () => {
  const res = await fetch("http://localhost:3000/api/customer-invoices");
  const data = await res.json();
  console.log(data);
})();
