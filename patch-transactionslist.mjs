import fs from 'fs';
const patchFile = (file, patches) => {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf-8');
  patches.forEach(([str, replace]) => { c = c.split(str).join(replace); });
  fs.writeFileSync(file, c);
  console.log('Patched ' + file);
};

patchFile('src/components/finance/cashbank/TransactionsList.tsx', [
  ['(t.reference_number || t.transactionNumber || \'\')', '(t.reference_number || \'\')'],
  ['(t.type || t.transactionDirection || \'Unknown\')', '(t.type || \'Unknown\')']
]);

