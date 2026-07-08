const fs = require('fs');
let code = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

code = code.replace(/                        \}\)\}\n                      <\/tbody>/, `                        }); })()}\n                      </tbody>`);
fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', code);
