const fs = require('fs');
let code = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

const fieldsToFix = ['basicSalary', 'housing', 'transport', 'food', 'otherAllowances', 'muddah', 'loans', 'deductions'];

fieldsToFix.forEach(field => {
  const regex = new RegExp(`value=\\{salaryContractForm\.${field} \\|\\| ""\\}`, "g");
  code = code.replace(regex, `value={salaryContractForm.${field} === 0 ? 0 : (salaryContractForm.${field} || "")}`);
});

code = code.replace(/onChange=\{\(e\) => setSalaryContractForm\(\{ \.\.\.salaryContractForm, ([a-zA-Z]+): Number\(e\.target\.value\) \|\| 0 \}\)\}/g,
"onChange={(e) => setSalaryContractForm({ ...salaryContractForm, $1: e.target.value === '' ? 0 : Number(e.target.value) })}");

fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', code);
