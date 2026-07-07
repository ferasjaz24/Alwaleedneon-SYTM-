const fs = require('fs');
let code = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

code = code.replace(/sum item\./g, 'sum + item.');
code = code.replace(/item\.housingAllowance/g, 'item.housingAllowance +');
code = code.replace(/item\.housingAllowance \+\s+item\.transportAllowance/g, 'item.housingAllowance + item.transportAllowance');
code = code.replace(/item\.transportAllowance/g, 'item.transportAllowance +');
code = code.replace(/item\.transportAllowance \+\s+item\.foodAllowance/g, 'item.transportAllowance + item.foodAllowance');
code = code.replace(/item\.overtimeAmount/g, 'item.overtimeAmount +');
code = code.replace(/item\.overtimeAmount \+\s+item\.otherAllowances/g, 'item.overtimeAmount + item.otherAllowances');
code = code.replace(/item\.loansDeduction/g, 'item.loansDeduction +');
code = code.replace(/item\.loansDeduction \+\s+item\.gosiDeduction/g, 'item.loansDeduction + item.gosiDeduction');
code = code.replace(/item\.gosiDeduction/g, 'item.gosiDeduction +');
code = code.replace(/item\.gosiDeduction \+\s+item\.absenceDeduction/g, 'item.gosiDeduction + item.absenceDeduction');
code = code.replace(/item\.absenceDeduction/g, 'item.absenceDeduction +');
code = code.replace(/item\.absenceDeduction \+\s+item\.lateDeduction/g, 'item.absenceDeduction + item.lateDeduction');
code = code.replace(/item\.lateDeduction/g, 'item.lateDeduction +');
code = code.replace(/item\.lateDeduction \+\s+item\.penaltyDeduction/g, 'item.lateDeduction + item.penaltyDeduction');
code = code.replace(/item\.penaltyDeduction/g, 'item.penaltyDeduction +');
code = code.replace(/item\.penaltyDeduction \+\s+item\.otherDeductions/g, 'item.penaltyDeduction + item.otherDeductions');

// Also remove trailing pluses in commas: 'item.otherAllowances +,' -> 'item.otherAllowances,'
code = code.replace(/\+ \+/g, '+');
code = code.replace(/\+ ,/g, ',');
code = code.replace(/\+,/g, ',');

// Fix (emp.housingAllowance || 0) + ... in string concat?
code = code.replace(/\(emp\.housingAllowance \|\| 0\)\s+\(emp\.transportAllowance \|\| 0\)/g, '(emp.housingAllowance || 0) + (emp.transportAllowance || 0)');
code = code.replace(/\(emp\.transportAllowance \|\| 0\)\s+\(emp\.foodAllowance \|\| 0\)/g, '(emp.transportAllowance || 0) + (emp.foodAllowance || 0)');
code = code.replace(/\(emp\.foodAllowance \|\| 0\)\s+\(emp\.otherAllowances \|\| 0\)/g, '(emp.foodAllowance || 0) + (emp.otherAllowances || 0)');

code = code.replace(/\(item\.foodAllowance \|\| 0\)\s+\(item\.otherAllowances \|\| 0\)/g, '(item.foodAllowance || 0) + (item.otherAllowances || 0)');

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', code);
