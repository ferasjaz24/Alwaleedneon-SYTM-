const fs = require('fs');
let code = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

code = code.replace(/const totalAllowances = selectedEmp.allowances\s*\?\s*\(Number\(selectedEmp.allowances.housing \|\| 0\) \+\s*Number\(selectedEmp.allowances.transport \|\| 0\) \+\s*Number\(\(selectedEmp.allowances as any\).food \|\| 0\)\)\s*:\s*0;/, `const totalAllowances = selectedEmp.allowances
        ? (Number(selectedEmp.allowances.housing || 0) +
           Number(selectedEmp.allowances.transport || 0) +
           Number(selectedEmp.allowances.food || 0) +
           Number(selectedEmp.allowances.otherAllowances || 0))
        : 0;`);

fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', code);
