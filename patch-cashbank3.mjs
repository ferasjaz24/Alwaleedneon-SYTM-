import fs from 'fs';
const patchFile = (file, patches) => {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf-8');
  patches.forEach(([str, replace]) => { c = c.split(str).join(replace); });
  fs.writeFileSync(file, c);
  console.log('Patched ' + file);
};

patchFile('src/components/finance/cashbank/BankAccountsList.tsx', [
  ['(lang === "ar" ? acc.bank_name_ar : acc.bank_name_en).toLowerCase()', "((lang === 'ar' ? acc.bank_name_ar : acc.bank_name_en) || '').toLowerCase()"]
]);

patchFile('src/components/finance/cashbank/CashBoxesList.tsx', [
  ['(lang === "ar" ? box.name_ar : box.name_en).toLowerCase()', "((lang === 'ar' ? box.name_ar : box.name_en) || '').toLowerCase()"]
]);

