export const fixZombies = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/dynamic/sales_production_requests');
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    console.log("Total requests:", data.length);
    let deleted = 0;
    for (let req of data) {
      if (!req.requestNumber && !req.clientName && !req.quotationNumber) {
        console.log("Deleting zombie:", req.id);
        await fetch(`http://localhost:3000/api/dynamic/sales_production_requests/${req.id}`, { method: 'DELETE' });
        deleted++;
      }
    }
    console.log("Deleted", deleted, "zombies.");
  } catch(e) {
    console.log(e);
  }
};
fixZombies();
