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
    `const validLines = entryForm.lines.filter(l => l.accountName && (Number(l.debit) > 0 || Number(l.credit) > 0));`,
    `const validLines = entryForm.lines.filter(l => l.accountType && (Number(l.debit) > 0 || Number(l.credit) > 0));`
  ],
  [
    `      if (l.accountName === "الصندوق" && !l.cashBoxId) {
        return "يرجى تحديد الصندوق المرتبط بسطر حساب الصندوق.";
      }`,
    `      if (l.accountType === "Cash" && !l.cashBoxId) {
        return "يرجى تحديد الصندوق المرتبط بسطر حساب الصندوق.";
      }`
  ],
  [
    `      if (l.accountName === "البنك" && !l.bankAccountId) {
        return "يرجى تحديد الحساب البنكي المرتبط بسطر حساب البنك.";
      }`,
    `      if (l.accountType === "Bank" && !l.bankAccountId) {
        return "يرجى تحديد الحساب البنكي المرتبط بسطر حساب البنك.";
      }`
  ],
  [
    `return \`القيد غير متزن محاسبياً. إجمالي المدين (\${totalDebit.toFixed(2)}) ر.س يجب أن يساوي إجمالي الدائن (\${totalCredit.toFixed(2)}) ر.س. الفرق: \${Math.abs(totalDebit - totalCredit).toFixed(2)} ر.س\`;`,
    `return "القيد غير متوازن. يجب أن يساوي إجمالي المدين إجمالي الدائن.";`
  ]
]);

