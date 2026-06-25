const fs = require('fs');
const path = require('path');

let f = path.join(__dirname, 'src/components/SalesHub.tsx');
let c = fs.readFileSync(f, 'utf8');

// Fix the single remaining escaped backtick syntax
c = c.replace(/className=\{\`px-3 py-1\.5 border rounded-lg transition text-xs \\\$\\{editingClient\?\.classification === c \? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' \: 'bg-white hover:bg-slate-50 text-slate-600'\\}\\`\}/g,
"className={`px-3 py-1.5 border rounded-lg transition text-xs ${editingClient?.classification === c ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-600'}`}");

fs.writeFileSync(f, c, 'utf8');
