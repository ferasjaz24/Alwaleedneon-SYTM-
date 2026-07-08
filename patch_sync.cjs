const fs = require('fs');
let code = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

code = code.replace(/           muddah = \(freshEmp\.allowances && freshEmp\.allowances\.muddah !== undefined\) \? Number\(freshEmp\.allowances\.muddah\) : muddah;/, `           muddah = (freshEmp.allowances && freshEmp.allowances.muddah !== undefined) ? Number(freshEmp.allowances.muddah) : muddah;
           let otherAllowances = (freshEmp.allowances && freshEmp.allowances.otherAllowances !== undefined) ? Number(freshEmp.allowances.otherAllowances) : (emp.otherAllowances || 0);`);

code = code.replace(/          Number\(emp\.overtimeAmount \|\| 0\) \+\n\s*Number\(emp\.otherAllowances \|\| 0\);/, `          Number(emp.overtimeAmount || 0) +
          Number(otherAllowances || 0) + Number(food || 0);`);

code = code.replace(/          muddahAmount: muddah,/, `          muddahAmount: muddah,
          otherAllowances: otherAllowances,`);

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', code);
