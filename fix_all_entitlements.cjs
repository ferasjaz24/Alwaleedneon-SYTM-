const fs = require('fs');
let content = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

// In createPayrollRun:
content = content.replace(/const entitlements = basic \+ housing \+ transport \+ phone \+ food \+  otAmount \+ otherAllow \+ living;/,
    `const entitlements = basic + housing + transport + phone + food + muddah + otAmount + otherAllow + living;`);

// In handleSaveEmployeeEdits:
content = content.replace(/const entitlements = basic \+ housing \+ transport \+ phone \+ food \+ otAmount \+ otherAllow \+ living;/,
    `const entitlements = basic + housing + transport + phone + food + muddah + otAmount + otherAllow + living;`);
    
// In Employee Edit Modal form (handleSaveEmployeeEdits calculation):
// It calculates entitlements somewhere else maybe? Let's check:
content = content.replace(/const entitlements = Number\(basicSalary \|\| 0\) \+\n\s*Number\(housing \|\| 0\) \+\n\s*Number\(transport \|\| 0\) \+\n\s*Number\(phone \|\| 0\) \+\n\s*Number\(food \|\| 0\) \+\n\s*Number\(emp\.overtimeAmount \|\| 0\) \+\n\s*Number\(emp\.otherAllowances \|\| 0\);/g,
`const entitlements = Number(basicSalary || 0) + Number(housing || 0) + Number(transport || 0) + Number(phone || 0) + Number(food || 0) + Number(muddah || 0) + Number(emp.overtimeAmount || 0) + Number(emp.otherAllowances || 0);`);

// And in save function inside handleSaveEmployeeEdits:
content = content.replace(/const entitlements = basic \+ housing \+ transport \+ phone \+ food \+ otAmount \+ otherAllow \+ living;/g,
`const entitlements = basic + housing + transport + phone + food + muddah + otAmount + otherAllow + living;`);

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', content);
