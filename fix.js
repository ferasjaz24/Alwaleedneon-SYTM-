const fs = require('fs');
let code = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

// fix entitlements
code = code.replace(/basic housing transport/g, 'basic + housing + transport');
code = code.replace(/basic housing transport otAmount otherAllow/g, 'basic + housing + transport + otAmount + otherAllow');
code = code.replace(/basic housing transport otAmount/g, 'basic + housing + transport + otAmount');

// fix deductions
code = code.replace(/absD lateD loanD penD otherD/g, 'absD + lateD + loanD + penD + otherD');
code = code.replace(/loans gosi absence late penalty otherDeduct/g, 'loans + gosi + absence + late + penalty + otherDeduct');

// fix live
code = code.replace(/liveBasic liveHousing liveTransport liveFood liveOtAmount liveOtherAllow/g, 'liveBasic + liveHousing + liveTransport + liveFood + liveOtAmount + liveOtherAllow');
code = code.replace(/liveBasic liveHousing liveTransport/g, 'liveBasic + liveHousing + liveTransport');

// fix multi-line Number
code = code.replace(/Number\(basicSalary \|\| 0\)\s+Number\(housing/g, 'Number(basicSalary || 0) +\n          Number(housing');
code = code.replace(/Number\(housing \|\| 0\)\s+Number\(transport/g, 'Number(housing || 0) +\n          Number(transport');
code = code.replace(/Number\(transport \|\| 0\)\s+Number\(emp.overtimeAmount/g, 'Number(transport || 0) +\n          Number(emp.overtimeAmount');
code = code.replace(/Number\(emp.overtimeAmount \|\| 0\)\s+Number\(emp.otherAllowances/g, 'Number(emp.overtimeAmount || 0) +\n          Number(emp.otherAllowances');

// fix item.foodAllowance
code = code.replace(/item\.foodAllowance\s+(?=\d|item)/g, 'item.foodAllowance + ');

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', code);
