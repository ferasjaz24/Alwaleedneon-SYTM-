(async () => {
  const res = await fetch("http://localhost:3000/api/revenues");
  const data = await res.json();
  console.log(data);
})();
