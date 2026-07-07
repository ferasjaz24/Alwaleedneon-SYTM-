const tx = { amount: 100 };
try {
  console.log(tx.type.replace("_", " "));
} catch(e) { console.error(e.message); }
