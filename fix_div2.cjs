const fs = require('fs');
let code = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

// I will just locate {lang === "ar" ? "تاريخ انتهاء العقد" : "Contract Expiry"}
// and see where Bank & Transfer Information is, then insert a </div> to close the whole SECTION block if it is missing.

code = code.replace(/(\n\)\s*\n\s*\{\/\* SECTION: Bank & Transfer Information \*\/})/g, '\n</div>$1');
fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', code);
console.log('Fixed missing div again');
