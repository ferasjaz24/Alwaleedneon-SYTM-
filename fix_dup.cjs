const fs = require('fs');

let content = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

const target = `<div className="p-3 bg-white rounded-xl border border-slate-150">
                    <span className="text-slate-400 font-bold font-arabic">إجمالي مُدد:</span>
                    <div className="font-mono font-bold text-sm text-amber-600 mt-1">
                      {runEmployees.reduce((sum, e) => sum + (e.muddahAmount || 0), 0).toLocaleString('en-US')} ر.س
                    </div>
                  </div>`;
                  
content = content.replace(new RegExp(target.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\s*' + target.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')), target);

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', content);

