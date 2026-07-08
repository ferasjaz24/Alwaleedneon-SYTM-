const fs = require('fs');
let code = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

code = code.replace(/allowances: {\s*housing: Number\(salaryContractForm\.housing\) \|\| 0,\s*transport: Number\(salaryContractForm\.transport\) \|\| 0,\s*loans: Number\(salaryContractForm\.loans\) \|\| 0,\s*deductions: Number\(salaryContractForm\.deductions\) \|\| 0,\s*status: salaryContractForm\.status \|\| "Active",\s*},/,
`allowances: {
          housing: Number(salaryContractForm.housing) || 0,
          transport: Number(salaryContractForm.transport) || 0,
          food: Number(salaryContractForm.food) || 0,
          otherAllowances: Number(salaryContractForm.otherAllowances) || 0,
          muddah: Number(salaryContractForm.muddah) || 0,
          loans: Number(salaryContractForm.loans) || 0,
          deductions: Number(salaryContractForm.deductions) || 0,
          status: salaryContractForm.status || "Active",
        },`);

fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', code);
