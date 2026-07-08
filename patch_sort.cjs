const fs = require('fs');
let code = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

code = code.replace(/const \[sortFilter, setSortFilter\] = useState\("default"\);/g, 
'const [sortFilter, setSortFilter] = useState("role");');

code = code.replace(/<option value="default">الافتراضي<\/option>/g, '');

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', code);
