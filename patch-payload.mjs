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
    `debitSubId: debitLine ? (debitLine.accountName === "الصندوق" ? debitLine.cashBoxId : debitLine.bankAccountId) : "",`,
    `debitSubId: debitLine ? (debitLine.accountType === "Cash" ? debitLine.cashBoxId : debitLine.bankAccountId) : "",`
  ],
  [
    `creditSubId: creditLine ? (creditLine.accountName === "الصندوق" ? creditLine.cashBoxId : creditLine.bankAccountId) : "",`,
    `creditSubId: creditLine ? (creditLine.accountType === "Cash" ? creditLine.cashBoxId : creditLine.bankAccountId) : "",`
  ],
  [
    `            const isCash = validLines.some(l => l.accountName === "الصندوق");
            const subBox = validLines.find(l => l.accountName === "الصندوق");
            const subBank = validLines.find(l => l.accountName === "البنك");`,
    `            const isCash = validLines.some(l => l.accountType === "Cash");
            const subBox = validLines.find(l => l.accountType === "Cash");
            const subBank = validLines.find(l => l.accountType === "Bank");`
  ]
]);

