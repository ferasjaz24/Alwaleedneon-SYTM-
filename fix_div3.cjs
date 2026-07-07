const fs = require('fs');
let code = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

const target = ')}\n                {/* SECTION: Bank & Transfer Information */}';
const replacement = ')}\n              </div>\n                {/* SECTION: Bank & Transfer Information */}';

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', code);
    console.log('Fixed missing div third time');
} else {
    console.log('Target not found');
}
