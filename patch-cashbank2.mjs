import fs from 'fs';
const patchFile = (file, patches) => {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf-8');
  patches.forEach(([str, replace]) => { c = c.split(str).join(replace); });
  fs.writeFileSync(file, c);
  console.log('Patched ' + file);
};

patchFile('src/components/finance/cashbank/TransfersList.tsx', [
  ['t.description.toLowerCase()', "(t.description || '').toLowerCase()"],
  ['t.reference_number.toLowerCase()', "(t.reference_number || '').toLowerCase()"]
]);

patchFile('src/components/finance/cashbank/ReconciliationList.tsx', [
  ['r.statement_reference.toLowerCase()', "(r.statement_reference || '').toLowerCase()"],
  ['r.reference_number.toLowerCase()', "(r.reference_number || '').toLowerCase()"]
]);

patchFile('src/components/finance/cashbank/BankAccountsList.tsx', [
  ['acc.bank_name_ar.toLowerCase()', "(acc.bank_name_ar || '').toLowerCase()"],
  ['acc.bank_name_en.toLowerCase()', "(acc.bank_name_en || '').toLowerCase()"],
  ['acc.account_number.toLowerCase()', "(acc.account_number || '').toLowerCase()"],
  ['acc.iban.toLowerCase()', "(acc.iban || '').toLowerCase()"]
]);

patchFile('src/components/finance/cashbank/CashBoxesList.tsx', [
  ['box.name_ar.toLowerCase()', "(box.name_ar || '').toLowerCase()"],
  ['box.name_en.toLowerCase()', "(box.name_en || '').toLowerCase()"],
  ['box.code.toLowerCase()', "(box.code || '').toLowerCase()"]
]);

patchFile('src/components/finance/cashbank/AuditLogList.tsx', [
  ['l.action.toLowerCase()', "(l.action || '').toLowerCase()"],
  ['l.details.toLowerCase()', "(l.details || '').toLowerCase()"],
  ['l.user_name.toLowerCase()', "(l.user_name || '').toLowerCase()"]
]);

