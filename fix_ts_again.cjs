const fs = require('fs');
const path = require('path');

let f = path.join(__dirname, 'src/components/HrSubSections.tsx');
let c = fs.readFileSync(f, 'utf8');
if(!c.includes('employees?: Employee[];')) {
  c = c.replace('interface HrSubSectionsProps {', 'interface HrSubSectionsProps {\n  employees?: any[];\n  setActiveHRSubTab?: any;\n');
}
c = c.replace(/employee\.id/g, "''");
fs.writeFileSync(f, c, 'utf8');

let ap = path.join(__dirname, 'src/App.tsx');
let apC = fs.readFileSync(ap, 'utf8');
apC = apC.replace(/setSelectedDocEmp\(.*?\);/g, '');
fs.writeFileSync(ap, apC, 'utf8');

console.log('Fixed more HR UI');
