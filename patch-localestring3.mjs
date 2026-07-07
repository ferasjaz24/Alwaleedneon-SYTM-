import fs from 'fs';
const patchFile = (file, patches) => {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf-8');
  patches.forEach(([str, replace]) => { c = c.split(str).join(replace); });
  fs.writeFileSync(file, c);
  console.log('Patched ' + file);
};

patchFile('src/components/SalesReports.tsx', [
  ["salesRepsStats[selectedRep].totalQuotesValue.toLocaleString", "(salesRepsStats[selectedRep]?.totalQuotesValue || 0).toLocaleString"],
  ["salesRepsStats[selectedRep].totalApprovedValue.toLocaleString", "(salesRepsStats[selectedRep]?.totalApprovedValue || 0).toLocaleString"],
  ["salesRepsStats[selectedRep].totalCollectionLinked.toLocaleString", "(salesRepsStats[selectedRep]?.totalCollectionLinked || 0).toLocaleString"]
]);

patchFile('src/components/HrSubSections.tsx', [
  ['calculateSaudiEos().toLocaleString', '(calculateSaudiEos() || 0).toLocaleString']
]);

