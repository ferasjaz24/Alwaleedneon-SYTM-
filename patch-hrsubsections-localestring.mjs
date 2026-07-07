import fs from 'fs';
const patchFile = (file, patches) => {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf-8');
  patches.forEach(([str, replace]) => { c = c.split(str).join(replace); });
  fs.writeFileSync(file, c);
  console.log('Patched ' + file);
};

patchFile('src/components/HrSubSections.tsx', [
  ['h.toLocaleString', '(h || 0).toLocaleString'],
  ['t.toLocaleString', '(t || 0).toLocaleString'],
  ['extra.toLocaleString', '(extra || 0).toLocaleString'],
  ['b.toLocaleString', '(b || 0).toLocaleString'],
  ['ded.toLocaleString', '(ded || 0).toLocaleString'],
  ['loan.toLocaleString', '(loan || 0).toLocaleString'],
  ['net.toLocaleString', '(net || 0).toLocaleString'],
  ['totalBasics.toLocaleString', '(totalBasics || 0).toLocaleString'],
  ['totalAllowances.toLocaleString', '(totalAllowances || 0).toLocaleString'],
  ['grandTotalSalaries.toLocaleString', '(grandTotalSalaries || 0).toLocaleString'],
  ['netVal.toLocaleString', '(netVal || 0).toLocaleString'],
  ['loans.toLocaleString', '(loans || 0).toLocaleString'],
  ['(extra + b).toLocaleString', '((extra || 0) + (b || 0)).toLocaleString'],
  ['(ded + loan).toLocaleString', '((ded || 0) + (loan || 0)).toLocaleString']
]);

