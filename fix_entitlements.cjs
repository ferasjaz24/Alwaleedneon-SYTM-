const fs = require('fs');
let content = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

// Line 1425-1430:
content = content.replace(/Number\(emp\.foodAllowance \|\| 0\) \+\n\s*Number\(emp\.muddahAmount \|\| 0\) \+/, 
    `Number(emp.foodAllowance || 0) +`);

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', content);

