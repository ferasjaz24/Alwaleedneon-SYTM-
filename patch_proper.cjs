const fs = require('fs');
let code = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

// The onClick handler starts around line 2414
const regex = /onClick=\{\(\) => \{\s*setIsEditingSalaryContract\(true\);\s*setSalaryContractForm\(\{\s*basicSalary: selectedEmp\.basicSalary \|\| 0,\s*housing: emp\.allowances\?\.housing \|\| 0,\s*transport: emp\.allowances\?\.transport \|\| 0,\s*food: emp\.allowances\?\.food \|\| 0,\s*otherAllowances: emp\.allowances\?\.otherAllowances \|\| 0,\s*muddah: emp\.allowances\?\.muddah \|\| 0,\s*loans: emp\.allowances\?\.loans \|\| 0,\s*deductions: emp\.allowances\?\.deductions \|\| 0,\s*status: emp\.allowances\?\.status \|\| "Active",\s*contractQiwaNumber: emp\.contractQiwaNumber \|\| "",\s*contractUrl: emp\.contractUrl \|\| "",\s*contractExpiry: emp\.contractExpiry \|\| "",\s*\}\);/g;

code = code.replace(regex, `onClick={() => {
                          setIsEditingSalaryContract(true);
                          setSalaryContractForm({
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

fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', code);
