import fs from 'fs';
const patchFile = (file, patches) => {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf-8');
  patches.forEach(([str, replace]) => { c = c.split(str).join(replace); });
  fs.writeFileSync(file, c);
  console.log('Patched ' + file);
};

patchFile('src/components/finance/cashbank/AddReconciliationModal.tsx', [
  ['formData.difference.toLocaleString()', '(formData.difference || 0).toLocaleString()']
]);

patchFile('src/components/finance/cashbank/TransactionsList.tsx', [
  ['t.amount.toLocaleString()', '(t.amount || 0).toLocaleString()']
]);

patchFile('src/components/finance/cashbank/TransfersList.tsx', [
  ['t.amount.toLocaleString()', '(t.amount || 0).toLocaleString()']
]);

patchFile('src/components/finance/cashbank/ReconciliationList.tsx', [
  ['r.statement_balance.toLocaleString()', '(r.statement_balance || 0).toLocaleString()'],
  ['r.system_balance.toLocaleString()', '(r.system_balance || 0).toLocaleString()'],
  ['r.difference.toLocaleString()', '(r.difference || 0).toLocaleString()']
]);

patchFile('src/components/finance/cashbank/CashBankDashboard.tsx', [
  ['totalCash.toLocaleString()', '(totalCash || 0).toLocaleString()'],
  ['totalBank.toLocaleString()', '(totalBank || 0).toLocaleString()'],
  ['totalDeposits.toLocaleString()', '(totalDeposits || 0).toLocaleString()'],
  ['totalWithdrawals.toLocaleString()', '(totalWithdrawals || 0).toLocaleString()']
]);

patchFile('src/components/finance/cashbank/BankAccountsList.tsx', [
  ['acc.opening_balance.toLocaleString()', '(acc.opening_balance || 0).toLocaleString()'],
  ['acc.current_balance.toLocaleString()', '(acc.current_balance || 0).toLocaleString()']
]);

patchFile('src/components/finance/cashbank/CashBoxesList.tsx', [
  ['box.opening_balance.toLocaleString()', '(box.opening_balance || 0).toLocaleString()'],
  ['box.current_balance.toLocaleString()', '(box.current_balance || 0).toLocaleString()']
]);

