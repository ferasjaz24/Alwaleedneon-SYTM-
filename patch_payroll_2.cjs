const fs = require('fs');

let content = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

// 1. Add state for bankFilter
if (!content.includes('const [bankFilter, setBankFilter]')) {
    content = content.replace(/const \[isModRequestModalOpen, setIsModRequestModalOpen\] = useState\(false\);/, 
        `const [isModRequestModalOpen, setIsModRequestModalOpen] = useState(false);\n  const [bankFilter, setBankFilter] = useState("All");`);
}

// 2. Change layout to full width
content = content.replace(/className="flex flex-col lg:flex-row flex-1 overflow-hidden h-\[calc\(100vh-140px\)\] w-full"/, 
    `className="flex flex-col flex-1 overflow-y-auto w-full"`);

// 3. Move Left Column (Side Dashboard) below the table
// We need to extract the "Left Column" div and put it below the "Right Column" div.
// Wait, regex might be tricky for nested divs. I'll use a precise replacement.
// Instead, I'll just change the container class to standard flow and adjust width.
content = content.replace(/className="w-full lg:w-96 overflow-y-auto bg-slate-50 p-6 border-r border-slate-200 space-y-6 flex flex-col justify-between"/, 
    `className="w-full bg-slate-50 p-6 border-t lg:border-t-0 lg:border-r border-slate-200 space-y-6 flex flex-col justify-between mt-6 lg:mt-0"`);

// Let's actually keep the Side Dashboard below the table for all screens:
content = content.replace(/className="w-full lg:w-96 overflow-y-auto bg-slate-50 p-6 border-r border-slate-200 space-y-6 flex flex-col justify-between"/, 
    `className="w-full bg-slate-50 p-6 border-t border-slate-200 space-y-6 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 rounded-2xl"`);
// Note: This regex might fail if I already replaced it. I'll check.

// 4. Change "مزامنة خصومات الموارد البشرية 🔄" to "مزامنة بيانات الموارد البشرية 🔄"
// and update its functionality in handleRefreshHrDeductions to also sync basicSalary, allowances, muddah, etc.
