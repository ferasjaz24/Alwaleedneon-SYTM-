const fs = require('fs');
let code = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

// Fix new Date().getMonth() 1 -> new Date().getMonth() + 1
code = code.replace(/new Date\(\)\.getMonth\(\) 1/g, 'new Date().getMonth() + 1');

// Fix Math.floor(100 Math.random() * 900)
code = code.replace(/100 Math\.random\(\)/g, '100 + Math.random()');

// Fix reduce sum i.amount
code = code.replace(/sum i\.amount/g, 'sum + i.amount');
code = code.replace(/sum e\.basicSalary/g, 'sum + e.basicSalary');
code = code.replace(/sum e\.housingAllowance/g, 'sum + e.housingAllowance');
code = code.replace(/sum e\.transportAllowance/g, 'sum + e.transportAllowance');
code = code.replace(/sum e\.foodAllowance/g, 'sum + e.foodAllowance');
code = code.replace(/sum e\.muddahAmount/g, 'sum + e.muddahAmount');
code = code.replace(/sum e\.overtimeAmount/g, 'sum + e.overtimeAmount');
code = code.replace(/sum e\.otherAllowances/g, 'sum + e.otherAllowances');
code = code.replace(/sum e\.loansDeduction/g, 'sum + e.loansDeduction');
code = code.replace(/sum e\.gosiDeduction/g, 'sum + e.gosiDeduction');
code = code.replace(/sum e\.absenceDeduction/g, 'sum + e.absenceDeduction');
code = code.replace(/sum e\.lateDeduction/g, 'sum + e.lateDeduction');
code = code.replace(/sum e\.penaltyDeduction/g, 'sum + e.penaltyDeduction');
code = code.replace(/sum e\.otherDeductions/g, 'sum + e.otherDeductions');

// Also sum e.netSalary
code = code.replace(/sum e\.netSalary/g, 'sum + e.netSalary');

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', code);
