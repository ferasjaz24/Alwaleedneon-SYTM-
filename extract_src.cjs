const fs = require('fs');
const sm = JSON.parse(fs.readFileSync('sourcemap.json', 'utf8'));
fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', sm.sourcesContent[0]);
console.log('Restored to src/components/finance/MonthlyPayrollRuns.tsx');
