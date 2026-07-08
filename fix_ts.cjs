const fs = require('fs');

// Fix MonthlyPayrollRuns.tsx
let mr = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');
mr = mr.replace(/          otherAllowances: otherAllowances,\n          overtimeHours: 0,\n          overtimeAmount: 0,\n          otherAllowances: otherAllowances,/, `          otherAllowances: otherAllowances,\n          overtimeHours: 0,\n          overtimeAmount: 0,`);

mr = mr.replace(/          Number\(otherAllowances \|\| 0\) \+ Number\(food \|\| 0\);/g, `          Number(emp.otherAllowances || 0) + Number(emp.foodAllowance || 0);`);
mr = mr.replace(/           let otherAllowances = \(freshEmp\.allowances && freshEmp\.allowances\.otherAllowances !== undefined\) \? Number\(freshEmp\.allowances\.otherAllowances\) : \(emp\.otherAllowances \|\| 0\);/, '');

// Actually wait, let me just fix the sync logic cleanly:
mr = mr.replace(/const entitlements = Number\(basicSalary \|\| 0\) \+\n\s*Number\(housing \|\| 0\) \+\n\s*Number\(transport \|\| 0\) \+\n\s*Number\(emp\.overtimeAmount \|\| 0\) \+\n\s*Number\(emp\.otherAllowances \|\| 0\) \+ Number\(emp\.foodAllowance \|\| 0\);/,
`        const otherAllowances = (freshEmp && freshEmp.allowances && freshEmp.allowances.otherAllowances !== undefined) ? Number(freshEmp.allowances.otherAllowances) : (emp.otherAllowances || 0);
        const entitlements = Number(basicSalary || 0) +
          Number(housing || 0) +
          Number(transport || 0) +
          Number(emp.overtimeAmount || 0) +
          Number(food || 0) +
          Number(otherAllowances || 0);`);

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', mr);

// Fix HrEmployeeDirectoryTab.tsx
let hr = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');
hr = hr.replace(/setSalaryContractForm\({\n      basicSalary: emp\.basicSalary \|\| 0,\n      housing: emp\.allowances\?\.housing \|\| 0,\n      transport: emp\.allowances\?\.transport \|\| 0,\n      food: emp\.allowances\?\.food \|\| 0,\n      otherAllowances: emp\.allowances\?\.otherAllowances \|\| 0,\n      muddah: emp\.allowances\?\.muddah \|\| 0,\n      loans: emp\.allowances\?\.loans \|\| 0,\n      deductions: emp\.allowances\?\.deductions \|\| 0,\n      status: emp\.allowances\?\.status \|\| "Active",\n      contractQiwaNumber: emp\.contractQiwaNumber \|\| "",\n      contractUrl: emp\.contractUrl \|\| "",\n      contractExpiry: emp\.contractExpiry \|\| "",\n    }\);/g, 
`setSalaryContractForm({
      basicSalary: selectedEmp.basicSalary || 0,
      housing: selectedEmp.allowances?.housing || 0,
      transport: selectedEmp.allowances?.transport || 0,
      food: selectedEmp.allowances?.food || 0,
      otherAllowances: selectedEmp.allowances?.otherAllowances || 0,
      muddah: selectedEmp.allowances?.muddah || 0,
      loans: selectedEmp.allowances?.loans || 0,
      deductions: selectedEmp.allowances?.deductions || 0,
      status: selectedEmp.allowances?.status || "Active",
      contractQiwaNumber: selectedEmp.contractQiwaNumber || "",
      contractUrl: selectedEmp.contractUrl || "",
      contractExpiry: selectedEmp.contractExpiry || "",
    });`);
fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', hr);
