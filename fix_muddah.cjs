const fs = require('fs');
let content = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

content = content.replace(/item\.otherAllowances \+\n\s*item\.muddahAmount \+/g, 
    `item.otherAllowances +`);
    
content = content.replace(/e\.muddahAmount \|\| 0\),/g, 
    `),`);

content = content.replace(/\+ e\.muddahAmount\b/g, '');

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', content);

