import fs from 'fs';
const patchFile = (file, patches) => {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf-8');
  patches.forEach(([str, replace]) => { c = c.split(str).join(replace); });
  fs.writeFileSync(file, c);
  console.log('Patched ' + file);
};

patchFile('src/components/hr/HrRecruitmentTab.tsx', [
  ['candidate.nationality.toLowerCase()', "(candidate.nationality || '').toLowerCase()"]
]);

patchFile('src/components/SuppliersPricing.tsx', [
  ['s.specialty.toLowerCase()', "(s.specialty || '').toLowerCase()"]
]);

