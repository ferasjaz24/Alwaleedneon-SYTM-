const fs = require('fs');
let code = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

code = code.replace(/allowances: \{\s*housing: Number\(empData\.housing\) \|\| 0,\s*transport: Number\(empData\.transport\) \|\| 0,\s*status: "Active",\s*\}/g,
`allowances: {
              housing: Number(empData.housing) || 0,
              transport: Number(empData.transport) || 0,
              food: Number(empData.food) || 0,
              otherAllowances: Number(empData.otherAllowances) || 0,
              muddah: Number(empData.muddah) || 0,
              loans: Number(empData.loans) || 0,
              deductions: Number(empData.deductions) || 0,
              status: "Active",
            }`);

fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', code);
