const fs = require('fs');

let content = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

// 2. Change layout to full width
content = content.replace('className="flex flex-col lg:flex-row flex-1 overflow-hidden h-[calc(100vh-140px)] w-full"', 
    'className="flex flex-col flex-1 overflow-y-auto w-full p-6 h-[calc(100vh-140px)]"');
    
// Remove `flex-1 overflow-auto bg-white p-6 border-l border-slate-200 flex flex-col justify-between` for Right Column
content = content.replace('className="flex-1 overflow-auto bg-white p-6 border-l border-slate-200 flex flex-col justify-between"',
    'className="flex-none bg-white p-6 border border-slate-200 flex flex-col justify-between rounded-2xl shadow-sm mb-6"');

// And the side dashboard "Left Column":
content = content.replace('className="w-full lg:w-96 overflow-y-auto bg-slate-50 p-6 border-r border-slate-200 space-y-6 flex flex-col justify-between"',
    'className="w-full bg-slate-50 p-6 border border-slate-200 space-y-6 grid grid-cols-1 md:grid-cols-2 gap-6 rounded-2xl shadow-sm"');
    
// Also the inner `space-y-6` inside the left column grid needs to be adjusted, but it's fine.
content = content.replace('className="space-y-6"', 'className="space-y-6 md:col-span-1"');

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', content);

