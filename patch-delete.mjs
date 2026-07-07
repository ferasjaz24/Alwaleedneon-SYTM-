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
    `    if (deleteConfirmItem.status === "معتمد" || deleteConfirmItem.status === "Approved") {
      alert("لا يمكن حذف قيد معتمد. يجب إنشاء قيد عكسي.");
      setDeleteConfirmItem(null);
      return;
    }`,
    `    if (deleteConfirmItem.status === "معتمد" || deleteConfirmItem.status === "Approved" || deleteConfirmItem.cashBankApplied) {
      alert("لا يمكن حذف قيد معتمد أو تم تطبيق أثره على البنك والصندوق. استخدم قيد عكسي.");
      setDeleteConfirmItem(null);
      return;
    }`
  ],
  [
    `    if (!window.confirm("هل أنت متأكد أنك تريد إنشاء واعتماد قيد عكسي لهذا القيد؟")) return;`,
    `    if (entry.cashBankApplied) {
      if (!window.confirm("هذا القيد تم تطبيق أثره على البنك والصندوق. هل أنت متأكد أنك تريد إنشاء قيد عكسي؟")) return;
    } else {
      if (!window.confirm("هل أنت متأكد أنك تريد إنشاء واعتماد قيد عكسي لهذا القيد؟")) return;
    }`
  ]
]);

