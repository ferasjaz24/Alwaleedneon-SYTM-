try {
  const fetchRes = await fetch("http://localhost:3000/api/revenues", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: "REV-TEST-9991",
      clientName: "شركة البناء الحديثة",
      amount: 50000,
      vatAmount: 7500,
      subtotal: 42500,
      date: "2026-07-10",
      description: "دفعة مقدمة لمشروع الواجهة",
      bankAccountId: "BANK-ALRAJHI-123",
      paymentMethod: "bank_transfer",
      status: "معتمد"
    })
  });
  console.log(await fetchRes.json());
} catch (e) {
  console.error("Test failed:", e.message);
}
