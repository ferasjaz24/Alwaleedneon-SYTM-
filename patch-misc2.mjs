import fs from 'fs';
const patchFile = (file, patches) => {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf-8');
  patches.forEach(([str, replace]) => { c = c.split(str).join(replace); });
  fs.writeFileSync(file, c);
  console.log('Patched ' + file);
};

patchFile('src/components/hr/HrOrgStructureTab.tsx', [
  ['node.name_en.toLowerCase()', "(node.name_en || '').toLowerCase()"],
  ['node.name_ar.toLowerCase()', "(node.name_ar || '').toLowerCase()"]
]);

patchFile('src/components/MaterialsWarehouse.tsx', [
  ['i.itemNameEn.toLowerCase()', "(i.itemNameEn || '').toLowerCase()"],
  ['i.itemNameAr.toLowerCase()', "(i.itemNameAr || '').toLowerCase()"],
  ['i.itemCode.toLowerCase()', "(i.itemCode || '').toLowerCase()"]
]);

