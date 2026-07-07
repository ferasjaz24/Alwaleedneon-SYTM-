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

// Just replace the necessary parts inside originalBody!
let newBody = originalBody.replace(
    'const freshDeductions = await resDeductions.json();\\n      setHrDeductions(freshDeductions);',
    \`const freshDeductions = await resDeductions.json();
      setHrDeductions(freshDeductions);

      // Fetch latest employee data to sync bank and allowances
      const resEmps = await fetch("/api/employees");
      const freshEmps = resEmps.ok ? await resEmps.json() : [];\`
);

newBody = newBody.replace(
    '// Filter latest matching active HR deductions',
    \`// Find fresh HR data for this employee
        const freshEmp = freshEmps.find((e) => e.employeeId === emp.employeeId || e.id === emp.employeeId);

        // Filter latest matching active HR deductions\`
);

newBody = newBody.replace(
    /const entitlements = Number\(emp\.basicSalary \|\| 0\) \+[\s\S]*?const net = entitlements - totalDeductionsSum;/m,
    \`// Sync fresh salary/allowance values if available
        let basicSalary = emp.basicSalary;
        let housing = emp.housingAllowance;
        let transport = emp.transportAllowance;
        let food = emp.foodAllowance;
        let muddah = emp.muddahAmount;
        let phone = emp.phoneAllowance;
        
        let bankName = emp.bankName;
        let iban = emp.iban;
        let accountNumber = emp.accountNumber;
        let swiftCode = emp.swiftCode;
        let transferMethod = emp.transferMethod;
        let accountHolderName = emp.accountHolderName;

        if (freshEmp) {
           basicSalary = Number(freshEmp.basicSalary || basicSalary);
           housing = Number(freshEmp.allowances?.housing || housing);
           transport = Number(freshEmp.allowances?.transport || transport);
           food = Number(freshEmp.allowances?.food || food);
           muddah = Number(freshEmp.allowances?.muddah || muddah);
           phone = Number(freshEmp.allowances?.phone || phone);
           
           bankName = freshEmp.bankName || bankName;
           iban = freshEmp.iban || iban;
           accountNumber = freshEmp.accountNumber || accountNumber;
           swiftCode = freshEmp.swiftCode || swiftCode;
           transferMethod = freshEmp.transferMethod || transferMethod;
           accountHolderName = freshEmp.accountHolderName || accountHolderName;
        }

        const entitlements = Number(basicSalary || 0) +
          Number(housing || 0) +
          Number(transport || 0) +
          Number(phone || 0) +
          Number(food || 0) +
          Number(muddah || 0) +
          Number(emp.overtimeAmount || 0) +
          Number(emp.otherAllowances || 0);

        const totalDeductionsSum = absD + lateD + loanD + penD + otherD;
        const net = entitlements - totalDeductionsSum;\`
);

newBody = newBody.replace(
    /return \{\n\s*\.\.\.emp,\n\s*absenceDeduction: absD,/m,
    \`return {
          ...emp,
          basicSalary,
          housingAllowance: housing,
          transportAllowance: transport,
          foodAllowance: food,
          muddahAmount: muddah,
          phoneAllowance: phone,
          bankName,
          iban,
          accountNumber,
          swiftCode,
          transferMethod,
          accountHolderName,
          absenceDeduction: absD,\`
);

content = content.substring(0, startIndex) + newBody + content.substring(endIndex);

// Let's also check if `e.muddahAmount` duplicate block is still there from Vite cache.
// I think the Vite cache already had the `e.muddahAmount` summary block fixed, let's verify later.

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', content);
console.log('Successfully patched safely');
