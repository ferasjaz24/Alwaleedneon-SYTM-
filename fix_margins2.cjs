const fs = require('fs');

function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');
  for (const [search, replace] of replacements) {
    code = code.split(search).join(replace);
  }
  fs.writeFileSync(filePath, code);
}

replaceInFile('src/components/sales/DeliveryNoteBuilder.tsx', [
  ['@page { size: A4 portrait; margin: 20mm; }', '@page { size: A4 portrait; margin: 10mm; }'],
  ['p-[20mm]', 'p-[10mm]']
]);

// Also adjust DocumentHeader margins so it's not wasting space.
replaceInFile('src/utils/PrintSharedComponents.tsx', [
  ['marginBottom: \'32px\'', 'marginBottom: \'16px\''],
  ['minHeight: \'80px\'', 'minHeight: \'60px\'']
]);

