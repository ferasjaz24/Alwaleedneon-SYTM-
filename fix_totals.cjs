const fs = require('fs');
let content = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

content = content.replace(
    /item\.foodAllowance \+\n\s*item\.overtimeAmount \+\n\s*item\.otherAllowances \+\n\s*\(item\.livingAllowance \|\| 0\),/g,
    'item.foodAllowance +\n        item.overtimeAmount +\n        item.otherAllowances +\n        (item.livingAllowance || 0) +\n        (item.muddahAmount || 0),'
);

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', content);
