const fs = require('fs');
const content = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');
console.log(content.match(/phone/g) ? "Has phone" : "No phone");
