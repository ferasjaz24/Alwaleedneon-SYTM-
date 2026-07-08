const fs = require('fs');
let code = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

code = code.replace(/setSalaryContractForm\({\n      basicSalary: selectedEmp\.basicSalary \|\| 0,\n      housing: selectedEmp\.allowances\?\.housing \|\| 0,\n      transport: selectedEmp\.allowances\?\.transport \|\| 0,\n      food: selectedEmp\.allowances\?\.food \|\| 0,\n      otherAllowances: selectedEmp\.allowances\?\.otherAllowances \|\| 0,\n      muddah: selectedEmp\.allowances\?\.muddah \|\| 0,\n      loans: selectedEmp\.allowances\?\.loans \|\| 0,\n      deductions: selectedEmp\.allowances\?\.deductions \|\| 0,\n      status: selectedEmp\.allowances\?\.status \|\| "Active",\n      contractQiwaNumber: selectedEmp\.contractQiwaNumber \|\| "",\n      contractUrl: selectedEmp\.contractUrl \|\| "",\n      contractExpiry: selectedEmp\.contractExpiry \|\| "",\n    }\);/g, 
`setSalaryContractForm({
      basicSalary: emp.basicSalary || 0,
      housing: emp.allowances?.housing || 0,
      transport: emp.allowances?.transport || 0,
      food: emp.allowances?.food || 0,
      otherAllowances: emp.allowances?.otherAllowances || 0,
      muddah: emp.allowances?.muddah || 0,
      loans: emp.allowances?.loans || 0,
      deductions: emp.allowances?.deductions || 0,
      status: emp.allowances?.status || "Active",
      contractQiwaNumber: emp.contractQiwaNumber || "",
      contractUrl: emp.contractUrl || "",
      contractExpiry: emp.contractExpiry || "",
    });`);

fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', code);
