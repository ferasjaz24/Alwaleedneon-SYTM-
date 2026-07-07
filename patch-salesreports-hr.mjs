import fs from 'fs';
const patchFile = (file, patches) => {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf-8');
  patches.forEach(([str, replace]) => { c = c.split(str).join(replace); });
  fs.writeFileSync(file, c);
  console.log('Patched ' + file);
};

patchFile('src/components/SalesReports.tsx', [
  ['plan.totalAmount.toLocaleString', '(plan.totalAmount || 0).toLocaleString'],
  ['plan.totalCollected.toLocaleString', '(plan.totalCollected || 0).toLocaleString'],
  ['plan.remaining.toLocaleString', '(plan.remaining || 0).toLocaleString'],
  ['p.amount.toLocaleString', '(p.amount || 0).toLocaleString']
]);

patchFile('src/components/HrSubSections.tsx', [
  ['emp.basicSalary.toLocaleString', '(emp.basicSalary || 0).toLocaleString']
]);

