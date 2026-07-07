import fs from 'fs';
let f = 'src/components/finance/cashbank/TransactionsList.tsx';
let c = fs.readFileSync(f, 'utf-8');
c = c.replace(/t\.description\.toLowerCase/g, "(t.description || '').toLowerCase");
c = c.replace(/t\.reference_number\.toLowerCase/g, "(t.reference_number || t.transactionNumber || '').toLowerCase");
fs.writeFileSync(f, c);
console.log('TransactionsList patched 2');
