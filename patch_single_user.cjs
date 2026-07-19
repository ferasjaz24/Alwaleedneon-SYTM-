const fs = require('fs');
let code = fs.readFileSync('src/components/AdvancedPermissionsPortal.tsx', 'utf8');

const regexSingleUser = /\{\/\* Context-aware pending request for the selected user \*\/\}[\s\S]*?\{\/\* Pending Approvals \*\/\}/m;

code = code.replace(regexSingleUser, `{/* Pending Approvals */}`);

fs.writeFileSync('src/components/AdvancedPermissionsPortal.tsx', code);
console.log("Patched single user");
