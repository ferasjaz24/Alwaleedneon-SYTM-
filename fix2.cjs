const fs = require('fs');
const path = require('path');

let f = path.join(__dirname, 'src/components/SalesHub.tsx');
let c = fs.readFileSync(f, 'utf8');

c = c.replace(/className=\{\\\`px-2/g, "className={`px-2");
c = c.replace(/statColor\\\}\\\`\}/g, "statColor}`}");
c = c.replace(/className=\{\\\`px-3/g, "className={`px-3");
c = c.replace(/border-indigo-600 shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-600'\\\}\\\`\}/g, "border-indigo-600 shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-600'}`}");

fs.writeFileSync(f, c, 'utf8');
