const fs = require('fs');
let code = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

const loansStr = '{/* LOANS DEDUCTION */}';
const otherStr = '{/* OTHER DEDUCTIONS */}';

code = code.replace(loansStr, '{showDetailedDeductions && (<>\n                              ' + loansStr);
code = code.replace(otherStr, '</>)}\n                              ' + otherStr);

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', code);
