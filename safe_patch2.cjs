const fs = require('fs');
let content = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

const targetFuncStart = '  const handleRefreshHrDeductions = async () => {';
const targetFuncEnd = '  const submitRunApproval = async () => {';

const startIndex = content.indexOf(targetFuncStart);
const endIndex = content.indexOf(targetFuncEnd);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find function bounds!');
    process.exit(1);
}

const originalBody = content.substring(startIndex, endIndex);

let newBody = originalBody.replace(
    'const freshDeductions = await resDeductions.json();\n      setHrDeductions(freshDeductions);',
    'const freshDeductions = await resDeductions.json();\n      setHrDeductions(freshDeductions);\n\n      // Fetch latest employee data to sync bank and allowances\n      const resEmps = await fetch("/api/employees");\n      const freshEmps = resEmps.ok ? await resEmps.json() : [];'
);

newBody = newBody.replace(
    '// Filter latest matching active HR deductions',
    '// Find fresh HR data for this employee\n        const freshEmp = freshEmps.find((e) => e.employeeId === emp.employeeId || e.id === emp.employeeId);\n\n        // Filter latest matching active HR deductions'
);

newBody = newBody.replace(
    /const entitlements = Number\(emp\.basicSalary \|\| 0\) \+[\s\S]*?const net = entitlements - totalDeductionsSum;/m,
    '// Sync fresh salary/allowance values if available\n' +
    '        let basicSalary = emp.basicSalary;\n' +
    '        let housing = emp.housingAllowance;\n' +
    '        let transport = emp.transportAllowance;\n' +
    '        let food = emp.foodAllowance;\n' +
    '        let muddah = emp.muddahAmount;\n' +
    '        let phone = emp.phoneAllowance;\n' +
    '        \n' +
    '        let bankName = emp.bankName;\n' +
    '        let iban = emp.iban;\n' +
    '        let accountNumber = emp.accountNumber;\n' +
    '        let swiftCode = emp.swiftCode;\n' +
    '        let transferMethod = emp.transferMethod;\n' +
    '        let accountHolderName = emp.accountHolderName;\n\n' +
    '        if (freshEmp) {\n' +
    '           basicSalary = Number(freshEmp.basicSalary || basicSalary);\n' +
    '           housing = Number(freshEmp.allowances?.housing || housing);\n' +
    '           transport = Number(freshEmp.allowances?.transport || transport);\n' +
    '           food = Number(freshEmp.allowances?.food || food);\n' +
    '           muddah = Number(freshEmp.allowances?.muddah || muddah);\n' +
    '           phone = Number(freshEmp.allowances?.phone || phone);\n' +
    '           \n' +
    '           bankName = freshEmp.bankName || bankName;\n' +
    '           iban = freshEmp.iban || iban;\n' +
    '           accountNumber = freshEmp.accountNumber || accountNumber;\n' +
    '           swiftCode = freshEmp.swiftCode || swiftCode;\n' +
    '           transferMethod = freshEmp.transferMethod || transferMethod;\n' +
    '           accountHolderName = freshEmp.accountHolderName || accountHolderName;\n' +
    '        }\n\n' +
    '        const entitlements = Number(basicSalary || 0) +\n' +
    '          Number(housing || 0) +\n' +
    '          Number(transport || 0) +\n' +
    '          Number(phone || 0) +\n' +
    '          Number(food || 0) +\n' +
    '          Number(muddah || 0) +\n' +
    '          Number(emp.overtimeAmount || 0) +\n' +
    '          Number(emp.otherAllowances || 0);\n\n' +
    '        const totalDeductionsSum = absD + lateD + loanD + penD + otherD;\n' +
    '        const net = entitlements - totalDeductionsSum;'
);

newBody = newBody.replace(
    /return \{\n\s*\.\.\.emp,\n\s*absenceDeduction: absD,/m,
    'return {\n' +
    '          ...emp,\n' +
    '          basicSalary,\n' +
    '          housingAllowance: housing,\n' +
    '          transportAllowance: transport,\n' +
    '          foodAllowance: food,\n' +
    '          muddahAmount: muddah,\n' +
    '          phoneAllowance: phone,\n' +
    '          bankName,\n' +
    '          iban,\n' +
    '          accountNumber,\n' +
    '          swiftCode,\n' +
    '          transferMethod,\n' +
    '          accountHolderName,\n' +
    '          absenceDeduction: absD,'
);

content = content.substring(0, startIndex) + newBody + content.substring(endIndex);

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', content);
console.log('Successfully patched safely');
