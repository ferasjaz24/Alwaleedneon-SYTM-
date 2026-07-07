const fs = require('fs');
let code = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

// I just need to add </div> before {/* SECTION: Bank & Transfer Information */}
// Or rather, find `)}\n                {/* SECTION: Bank & Transfer Information */}` and change to `)}\n</div>\n                {/* SECTION: Bank & Transfer Information */}`.

code = code.replace(
  /}\)\n                \{\/\* SECTION: Bank & Transfer Information \*\/\}/g,
  ')}\n</div>\n                {/* SECTION: Bank & Transfer Information */}'
);

fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', code);
console.log('Fixed missing div');
