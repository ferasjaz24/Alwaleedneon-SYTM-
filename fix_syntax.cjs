const fs = require('fs');
let content = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

content = content.replace(/sum \+ \(\), 0\)/g, `sum + (e.muddahAmount || 0), 0)`);

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', content);

