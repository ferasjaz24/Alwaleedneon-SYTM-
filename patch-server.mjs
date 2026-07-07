import fs from 'fs';
let c = fs.readFileSync('server.ts', 'utf-8');
c = c.replace(/transactionDirection: isDebit \? "In" : "Out",/g, 'type: isDebit ? "Deposit" : "Withdrawal",\n          transactionDirection: isDebit ? "In" : "Out",');
fs.writeFileSync('server.ts', c);
console.log('server patched');
