const fs = require('fs');
let code = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

code = code.replace(/setNewEmpForm\(\{ \.\.\.newEmpForm, basicSalary: Number\(e\.target\.value\) \|\| 0 \}\)/g, 
"setNewEmpForm({ ...newEmpForm, basicSalary: e.target.value === '' ? 0 : Number(e.target.value) })");

code = code.replace(/allowances: \{ \.\.\.newEmpForm\.allowances, housing: Number\(e\.target\.value\) \|\| 0 \}/g,
"allowances: { ...newEmpForm.allowances, housing: e.target.value === '' ? 0 : Number(e.target.value) }");

code = code.replace(/allowances: \{ \.\.\.newEmpForm\.allowances, transport: Number\(e\.target\.value\) \|\| 0 \}/g,
"allowances: { ...newEmpForm.allowances, transport: e.target.value === '' ? 0 : Number(e.target.value) }");

fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', code);
