const fs = require('fs');

let content = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

content = content.replace(/food: Number\(salaryContractForm\.food\) \|\| 0,/, 
    `food: Number(salaryContractForm.food) || 0,\n                            muddah: Number(salaryContractForm.muddah) || 0,`);

// Also need to check if we missed `muddah` anywhere else, like when creating new employee
content = content.replace(/food: Number\(financialForm\.food\),/,
    `food: Number(financialForm.food),\n            muddah: Number(financialForm.muddah) || 0,`);

fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', content);

