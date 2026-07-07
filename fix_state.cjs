const fs = require('fs');
let content = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');
content = content.replace(/const \[isTransferModalOpen, setIsTransferModalOpen\] = useState\(false\);/, 
    `const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);\n  const [bankFilter, setBankFilter] = useState("All");`);
fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', content);
