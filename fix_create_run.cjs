const fs = require('fs');
let content = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

content = content.replace(
    'const food = Number(emp.allowances?.food || 0);',
    'const food = Number(emp.allowances?.food || 0);\n        const muddah = Number(emp.allowances?.muddah || 0);'
);

content = content.replace(
    'muddahAmount: 0,',
    'muddahAmount: muddah,'
);

content = content.replace(
    'const entitlements = basic + housing + transport + phone + food;',
    'const entitlements = basic + housing + transport + phone + food + muddah;'
);

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', content);
