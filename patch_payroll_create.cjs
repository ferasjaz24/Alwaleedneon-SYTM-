const fs = require('fs');
let code = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

code = code.replace(/const muddah = Number\(emp\.allowances\?\.muddah \|\| 0\);/, `const muddah = Number(emp.allowances?.muddah || 0);
        const otherAllowances = Number(emp.allowances?.otherAllowances || 0);`);

code = code.replace(/otherAllowances: 0,/, `otherAllowances: otherAllowances,`);

code = code.replace(/const entitlements = basic \+ housing \+ transport;/g, `const entitlements = basic + housing + transport + food + otherAllowances;`);

code = code.replace(/const entitlements = Number\(basicSalary \|\| 0\) \+\n\s*Number\(housing \|\| 0\) \+\n\s*Number\(transport \|\| 0\);/g, `const entitlements = Number(basicSalary || 0) +
          Number(housing || 0) +
          Number(transport || 0) + Number(food || 0) + Number(otherAllow || 0);`);

// Wait, I need to check where the sync logic is.
fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', code);
