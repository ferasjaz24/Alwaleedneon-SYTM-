import fs from 'fs';
const patchFile = (file, patches) => {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf-8');
  patches.forEach(([str, replace]) => { c = c.split(str).join(replace); });
  fs.writeFileSync(file, c);
  console.log('Patched ' + file);
};

patchFile('src/components/finance/JournalEntries.tsx', [
  [
    `    try {
      const revLines = (entry.lines || []).map((l: any) => ({
        ...l,
        debit: l.credit || 0,
        credit: l.debit || 0
      }));`,
    `    try {
      let lines = entry.lines || [];
      if (!lines || lines.length === 0) {
        // Fallback for old format
        if (entry.debitAccount) {
          lines.push({
            accountName: entry.debitAccount,
            accountType: entry.debitAccount === "الصندوق" ? "Cash" : entry.debitAccount === "البنك" ? "Bank" : "",
            debit: Number(entry.amount) || 0,
            credit: 0,
            cashBoxId: entry.debitAccount === "الصندوق" ? entry.debitSubId : "",
            bankAccountId: entry.debitAccount === "البنك" ? entry.debitSubId : "",
            description: entry.description || ""
          });
        }
        if (entry.creditAccount) {
          lines.push({
            accountName: entry.creditAccount,
            accountType: entry.creditAccount === "الصندوق" ? "Cash" : entry.creditAccount === "البنك" ? "Bank" : "",
            debit: 0,
            credit: Number(entry.amount) || 0,
            cashBoxId: entry.creditAccount === "الصندوق" ? entry.creditSubId : "",
            bankAccountId: entry.creditAccount === "البنك" ? entry.creditSubId : "",
            description: entry.description || ""
          });
        }
      }
      const revLines = lines.map((l: any) => ({
        ...l,
        debit: l.credit || 0,
        credit: l.debit || 0
      }));`
  ]
]);

