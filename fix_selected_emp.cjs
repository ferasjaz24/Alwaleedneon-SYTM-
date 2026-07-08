const fs = require('fs');
let code = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

code = code.replace(/onClick=\{\(\) => \{\n\s*setIsEditingSalaryContract\(true\);\n\s*setSalaryContractForm\({\n\s*basicSalary: emp\.basicSalary/g, 
`onClick={() => {
                          setIsEditingSalaryContract(true);
                          setSalaryContractForm({
      basicSalary: selectedEmp.basicSalary`);

code = code.replace(/      housing: emp\.allowances\?\.housing \|\| 0,\n      transport: emp\.allowances\?\.transport \|\| 0,\n      food: emp\.allowances\?\.food \|\| 0,\n      otherAllowances: emp\.allowances\?\.otherAllowances \|\| 0,\n      muddah: emp\.allowances\?\.muddah \|\| 0,\n      loans: emp\.allowances\?\.loans \|\| 0,\n      deductions: emp\.allowances\?\.deductions \|\| 0,\n      status: emp\.allowances\?\.status \|\| "Active",\n      contractQiwaNumber: emp\.contractQiwaNumber \|\| "",\n      contractUrl: emp\.contractUrl \|\| "",\n      contractExpiry: emp\.contractExpiry \|\| "",/g, 
(match, offset, string) => {
   // Wait, simpler way: Let's do a regex that specifically targets the onClick one
   return match;
});

fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', code);
