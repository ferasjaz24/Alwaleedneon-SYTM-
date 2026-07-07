const fs = require('fs');
let code = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

code = code.replace(/sum\s+\(item\.housingAllowance \+ \|\| 0\)\s+\(item\.transportAllowance \+ \|\| 0\)\s+\(item\.foodAllowance \|\| 0\)\s+\(item\.overtimeAmount \|\| 0\)\s+\(item\.otherAllowances \|\| 0\)/g, 'sum + (item.housingAllowance || 0) + (item.transportAllowance || 0) + (item.foodAllowance || 0) + (item.overtimeAmount || 0) + (item.otherAllowances || 0)');

code = code.replace(/sum\s+\(item\.loansDeduction \+ \|\| 0\)\s+\(item\.gosiDeduction \+ \|\| 0\)\s+\(item\.absenceDeduction \+ \|\| 0\)\s+\(item\.lateDeduction \+ \|\| 0\)\s+\(item\.penaltyDeduction \+ \|\| 0\)\s+\(item\.otherDeductions \|\| 0\)/g, 'sum + (item.loansDeduction || 0) + (item.gosiDeduction || 0) + (item.absenceDeduction || 0) + (item.lateDeduction || 0) + (item.penaltyDeduction || 0) + (item.otherDeductions || 0)');

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', code);
