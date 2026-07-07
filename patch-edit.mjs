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
    `  const handleEdit = (entry: any) => {
    setEditingEntryId(entry.id);`,
    `  const handleEdit = (entry: any) => {
    if (entry.status === 'معتمد' || entry.status === 'Approved') {
      if (entry.cashBankApplied) {
        if (!hasAdvancedPermission(user, 'finance', 'journal', 'edit_applied_cash_bank_journal') && !isAdmin(user)) {
          alert("لا يمكن تعديل قيد تم تطبيق أثره على البنك أو الصندوق. أنشئ قيد عكسي أو قيد تسوية.");
          return;
        }
      } else {
        if (!hasAdvancedPermission(user, 'finance', 'journal', 'edit_approved') && !isAdmin(user)) {
          alert("لا تملك صلاحية تعديل قيد معتمد.");
          return;
        }
      }
    }
    setEditingEntryId(entry.id);`
  ]
]);

