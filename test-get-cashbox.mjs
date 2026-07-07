(async () => {
  const res = await fetch("http://localhost:3000/api/dynamic/cash_boxes");
  const data = await res.json();
  console.log(data);
})();
