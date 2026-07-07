(async () => {
  const res = await fetch("http://localhost:3000/api/journal-entries/test-create", { method: "POST" });
  const data = await res.json();
  console.log(data);
})();
