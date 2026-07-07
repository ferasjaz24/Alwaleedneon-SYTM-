const args = {
  date: new Date().toISOString().split('T')[0],
  type: "قيد تصحيحي",
  status: "معتمد",
  description: "Test Deposit into Bank",
  lines: [
    { accountName: "البنك", accountType: "Bank", debit: 1500, credit: 0, bankAccountId: "1", cashBoxId: "", description: "Deposit" },
    { accountName: "إيرادات مبيعات", accountType: "", debit: 0, credit: 1500, bankAccountId: "", cashBoxId: "", description: "Revenue" }
  ],
  amount: 1500,
  createdBy: "feras"
};

fetch('http://127.0.0.1:3000/api/journal-entries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(args)
}).then(res => res.json()).then(console.log).catch(console.error);
