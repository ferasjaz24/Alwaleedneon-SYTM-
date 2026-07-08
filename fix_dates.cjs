const fs = require('fs');
const files = [
  'src/components/hr/HrDashboardTab.tsx',
  'src/components/hr/HrPayrollTab.tsx',
  'src/components/SalesLetters.tsx'
];

files.forEach(f => {
  let code = fs.readFileSync(f, 'utf8');
  code = code.replace(/'ar-EG'/g, "'en-US'");
  fs.writeFileSync(f, code);
});
