const fs = require('fs');
let code = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');
console.log(code.includes('handleSaveEmployeeQuick'));
