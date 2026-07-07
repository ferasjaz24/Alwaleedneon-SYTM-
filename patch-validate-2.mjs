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
    `    const validLines = entryForm.lines.filter(l => l.accountType && (Number(l.debit) > 0 || Number(l.credit) > 0));
    if (validLines.length < 2) {`,
    `    const validLines = entryForm.lines.filter(l => l.accountType);
    if (validLines.length < 2) {`
  ],
  [
    `      if (dbVal > 0 && crVal > 0) {
        return "لا يمكن وضع قيم في خانتي المدين والدائن معاً لنفس السطر المحاسبي.";
      }
      if (dbVal < 0 || crVal < 0) {
        return "المبالغ المحاسبية يجب أن تكون أرقاماً موجبة.";
      }`,
    `      if (dbVal > 0 && crVal > 0) {
        return "لا يمكن وضع قيم في خانتي المدين والدائن معاً لنفس السطر المحاسبي.";
      }
      if (dbVal === 0 && crVal === 0) {
        return "لا يمكن ترك سطر حسابي بدون قيمة مدين أو دائن.";
      }
      if (dbVal < 0 || crVal < 0) {
        return "المبالغ المحاسبية يجب أن تكون أرقاماً موجبة.";
      }`
  ]
]);

