import fs from 'fs';
let f = 'src/components/finance/cashbank/TransactionsList.tsx';
let c = fs.readFileSync(f, 'utf-8');
c = c.replace(/t\.type\.replace/g, "(t.type || t.transactionDirection || 'Unknown').replace");
fs.writeFileSync(f, c);
console.log('TransactionsList patched');
