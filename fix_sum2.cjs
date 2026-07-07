const fs = require('fs');
let code = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

code = code.replace(/sum\s+item\.housingAllowance/g, 'sum + \n        item.housingAllowance');
code = code.replace(/sum\s+item\.loansDeduction/g, 'sum + \n        item.loansDeduction');

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', code);
