const fs = require('fs');

let content = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

content = content.replace(/className="bg-slate-50 p-4 border border-slate-200 rounded-2xl grid grid-cols-2 md:grid-cols-5 gap-4 text-xs mt-4"/,
    'className="bg-slate-50 p-4 border border-slate-200 rounded-2xl grid grid-cols-2 md:grid-cols-6 gap-4 text-xs mt-4"');

content = content.replace(/<div className="p-3 bg-white rounded-xl border border-slate-150">\s*<span className="text-slate-400 font-bold block mb-1 font-arabic">Total Overtime \| إجمالي الأوفر تايم:<\/span>/,
    `<div className="p-3 bg-white rounded-xl border border-slate-150">\n                    <span className="text-slate-400 font-bold font-arabic">إجمالي مُدد:</span>\n                    <div className="font-mono font-bold text-sm text-amber-600 mt-1">\n                      {runEmployees.reduce((sum, e) => sum + (e.muddahAmount || 0), 0).toLocaleString('en-US')} ر.س\n                    </div>\n                  </div>\n                  $&`);

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', content);

