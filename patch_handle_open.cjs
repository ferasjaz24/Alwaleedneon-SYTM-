const fs = require('fs');
let code = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

code = code.replace(/setSalaryContractForm\(\{[\s\S]*?\}\);/g, (match) => {
  if (match.includes("basicSalary: selectedEmp.basicSalary")) {
    return `setSalaryContractForm({
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
    });`;
  }
  return match;
});

fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', code);
