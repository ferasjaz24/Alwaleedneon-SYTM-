import fs from 'fs';
const patchFile = (file, patches) => {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf-8');
  patches.forEach(([str, replace]) => { c = c.split(str).join(replace); });
  fs.writeFileSync(file, c);
  console.log('Patched ' + file);
};

patchFile('src/App.tsx', [
  ['metrics.financialBurnAnnualProjection.currentMonthWPSPayrollTotal.toLocaleString', '(metrics.financialBurnAnnualProjection.currentMonthWPSPayrollTotal || 0).toLocaleString'],
  ['metrics.financialBurnAnnualProjection.pendingApprovedLoansActiveVal.toLocaleString', '(metrics.financialBurnAnnualProjection.pendingApprovedLoansActiveVal || 0).toLocaleString'],
  ['totalSalary.toLocaleString', '(totalSalary || 0).toLocaleString'],
  ['aiResult.salaryMin.toLocaleString', '(aiResult?.salaryMin || 0).toLocaleString'],
  ['aiResult.salaryMax.toLocaleString', '(aiResult?.salaryMax || 0).toLocaleString']
]);

