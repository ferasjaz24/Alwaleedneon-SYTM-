const fs = require('fs');

let content = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

// Remove the inline const declaration
content = content.replace(/const filteredRunEmployees = runEmployees\.filter\([\s\S]*?return true;\n\s*}\);\n\s*(<div className="bg-slate-900 text-white p-4 font-black flex justify-between items-center text-xs rounded-t-2xl font-arabic">)/, '$1');

// Replace filteredRunEmployees.map with the filter
content = content.replace(/filteredRunEmployees\.map\(\(emp\) => \{/g, 
    `runEmployees.filter(e => bankFilter === "All" || (e.bankName || "Cash") === bankFilter).map((emp) => {`);

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', content);

