import fs from 'fs';
const patchFile = (file, patches) => {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf-8');
  patches.forEach(([re, replace]) => { c = c.replace(re, replace); });
  fs.writeFileSync(file, c);
  console.log('Patched ' + file);
};

patchFile('src/components/finance/cashbank/TransfersList.tsx', [
  [/t\.description\.toLowerCase/g, "(t.description || '').toLowerCase"],
  [/t\.reference_number\.toLowerCase/g, "(t.reference_number || '').toLowerCase"]
]);

patchFile('src/components/finance/cashbank/ReconciliationList.tsx', [
  [/r\.statement_reference\.toLowerCase/g, "(r.statement_reference || '').toLowerCase"],
  [/r\.reference_number\.toLowerCase/g, "(r.reference_number || '').toLowerCase"]
]);

patchFile('src/components/finance/cashbank/BankAccountsList.tsx', [
  [/acc\.bank_name_ar\.toLowerCase/g, "(acc.bank_name_ar || '').toLowerCase"],
  [/acc\.bank_name_en\.toLowerCase/g, "(acc.bank_name_en || '').toLowerCase"],
  [/acc\.account_number\.toLowerCase/g, "(acc.account_number || '').toLowerCase"],
  [/acc\.iban\.toLowerCase/g, "(acc.iban || '').toLowerCase"]
]);

patchFile('src/components/finance/cashbank/CashBoxesList.tsx', [
  [/box\.name_ar\.toLowerCase/g, "(box.name_ar || '').toLowerCase"],
  [/box\.name_en\.toLowerCase/g, "(box.name_en || '').toLowerCase"],
  [/box\.code\.toLowerCase/g, "(box.code || '').toLowerCase"]
]);

patchFile('src/components/finance/cashbank/AuditLogList.tsx', [
  [/l\.action\.toLowerCase/g, "(l.action || '').toLowerCase"],
  [/l\.details\.toLowerCase/g, "(l.details || '').toLowerCase"],
  [/l\.user_name\.toLowerCase/g, "(l.user_name || '').toLowerCase"]
]);

