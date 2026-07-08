const fs = require('fs');

function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');
  for (const [search, replace] of replacements) {
    code = code.split(search).join(replace);
  }
  fs.writeFileSync(filePath, code);
}

replaceInFile('src/components/finance/CustomerSupplierInvoices.tsx', [
  ['style="width: 70px; height: 70px; object-fit: contain;"', 'style="width: 120px; height: 120px; object-fit: contain;"']
]);

replaceInFile('src/components/finance/MonthlyPayrollRuns.tsx', [
  ['style="width: 80px; height: 80px; object-fit: contain;"', 'style="width: 120px; height: 120px; object-fit: contain;"']
]);

replaceInFile('src/components/hr/HrContractsTab.tsx', [
  ["style={{ width: '80px', height: '80px', objectFit: 'contain' }}", "style={{ width: '120px', height: '120px', objectFit: 'contain' }}"]
]);

replaceInFile('src/components/hr/HrEmployeeDirectoryTab.tsx', [
  ['style="height: 60px; object-fit: contain;"', 'style="height: 100px; object-fit: contain;"']
]);

replaceInFile('src/components/SalesQuotations.tsx', [
  ['style="width: 70px; height: 70px; object-fit: contain;"', 'style="width: 120px; height: 120px; object-fit: contain;"']
]);

replaceInFile('src/components/FinancialCollections.tsx', [
  ['style="width: 80px; height: 80px; object-fit: contain; margin-bottom: 10px;"', 'style="width: 120px; height: 120px; object-fit: contain; margin-bottom: 10px;"']
]);

replaceInFile('src/components/SalesLetters.tsx', [
  ['className="h-12 object-contain"', 'className="h-20 object-contain"']
]);

replaceInFile('src/utils/PrintShared.ts', [
  ['style="width: 80px; height: 80px; object-fit: contain;"', 'style="width: 120px; height: 120px; object-fit: contain;"']
]);

replaceInFile('src/utils/PrintSharedComponents.tsx', [
  ["style={{ width: '80px', height: '80px', objectFit: 'contain' }}", "style={{ width: '120px', height: '120px', objectFit: 'contain' }}"]
]);

replaceInFile('src/App.tsx', [
  ['className="h-12 w-auto object-contain"', 'className="h-16 w-auto object-contain"'],
  ['className="h-10 w-auto object-contain mx-auto"', 'className="h-16 w-auto object-contain mx-auto"']
]);

