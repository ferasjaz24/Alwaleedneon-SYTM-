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
    `                        <th className="p-3">الحساب المالي</th>`,
    `                        <th className="p-3">نوع الحساب</th>
                        <th className="p-3">الحساب المالي</th>`
  ],
  [
    `                          <td className="p-3 text-slate-800 font-bold">{line.accountName}</td>
                          <td className="p-3 text-slate-600 font-medium">
                            {line.accountName === "الصندوق" && line.cashBoxId && (`,
    `                          <td className="p-3 text-slate-500 font-mono text-xs">{line.accountType || "-"}</td>
                          <td className="p-3 text-slate-800 font-bold">{line.accountName}</td>
                          <td className="p-3 text-slate-600 font-medium">
                            {line.accountType === "Cash" && line.cashBoxId && (`
  ],
  [
    `                            {line.accountName === "البنك" && line.bankAccountId && (`,
    `                            {line.accountType === "Bank" && line.bankAccountId && (`
  ],
  [
    `                            {line.accountName !== "الصندوق" && line.accountName !== "البنك" && (`,
    `                            {line.accountType !== "Cash" && line.accountType !== "Bank" && (`
  ],
  [
    `{ accountName: selectedEntry.debitAccount, cashBoxId: selectedEntry.debitAccount === "الصندوق" ? selectedEntry.debitSubId : "", bankAccountId: selectedEntry.debitAccount === "البنك" ? selectedEntry.debitSubId : "", debit: selectedEntry.amount, credit: 0, description: selectedEntry.description },
                        { accountName: selectedEntry.creditAccount, cashBoxId: selectedEntry.creditAccount === "الصندوق" ? selectedEntry.creditSubId : "", bankAccountId: selectedEntry.creditAccount === "البنك" ? selectedEntry.creditSubId : "", debit: 0, credit: selectedEntry.amount, description: selectedEntry.description }`,
    `{ accountType: selectedEntry.debitAccount === "الصندوق" ? "Cash" : selectedEntry.debitAccount === "البنك" ? "Bank" : "", accountName: selectedEntry.debitAccount, cashBoxId: selectedEntry.debitAccount === "الصندوق" ? selectedEntry.debitSubId : "", bankAccountId: selectedEntry.debitAccount === "البنك" ? selectedEntry.debitSubId : "", debit: selectedEntry.amount, credit: 0, description: selectedEntry.description },
                        { accountType: selectedEntry.creditAccount === "الصندوق" ? "Cash" : selectedEntry.creditAccount === "البنك" ? "Bank" : "", accountName: selectedEntry.creditAccount, cashBoxId: selectedEntry.creditAccount === "الصندوق" ? selectedEntry.creditSubId : "", bankAccountId: selectedEntry.creditAccount === "البنك" ? selectedEntry.creditSubId : "", debit: 0, credit: selectedEntry.amount, description: selectedEntry.description }`
  ]
]);

