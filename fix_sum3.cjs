const fs = require('fs');
let code = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

code = code.replace(/sum\s+e\.housingAllowance/g, 'sum + \n                            e.housingAllowance');
code = code.replace(/e\.housingAllowance\s+e\.transportAllowance/g, 'e.housingAllowance + \n                            e.transportAllowance');
code = code.replace(/e\.transportAllowance\s+\(e\.foodAllowance \|\| 0\)/g, 'e.transportAllowance + \n                            (e.foodAllowance || 0)');
code = code.replace(/\(e\.foodAllowance \|\| 0\)\s+e\.overtimeAmount/g, '(e.foodAllowance || 0) + \n                            e.overtimeAmount');
code = code.replace(/e\.overtimeAmount\s+\(e\.otherAllowances \|\| 0\)/g, 'e.overtimeAmount + \n                            (e.otherAllowances || 0)');

code = code.replace(/sum\s+e\.loansDeduction/g, 'sum + \n                            e.loansDeduction');
code = code.replace(/e\.loansDeduction\s+e\.gosiDeduction/g, 'e.loansDeduction + \n                            e.gosiDeduction');
code = code.replace(/e\.gosiDeduction\s+e\.absenceDeduction/g, 'e.gosiDeduction + \n                            e.absenceDeduction');
code = code.replace(/e\.absenceDeduction\s+e\.lateDeduction/g, 'e.absenceDeduction + \n                            e.lateDeduction');
code = code.replace(/e\.lateDeduction\s+e\.penaltyDeduction/g, 'e.lateDeduction + \n                            e.penaltyDeduction');
code = code.replace(/e\.penaltyDeduction\s+e\.otherDeductions/g, 'e.penaltyDeduction + \n                            e.otherDeductions');

// and there's one more at 3600ish probably.
// let's replace e.housingAllowance + e.transportAllowance + (e.foodAllowance || 0) + (e.overtimeAmount || 0) + (e.otherAllowances || 0)
code = code.replace(/e\.housingAllowance e\.transportAllowance \(e\.foodAllowance \|\| 0\) \(e\.overtimeAmount \|\| 0\) \(e\.otherAllowances \|\| 0\)/g, 'e.housingAllowance + e.transportAllowance + (e.foodAllowance || 0) + (e.overtimeAmount || 0) + (e.otherAllowances || 0)');

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', code);
