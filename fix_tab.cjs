const fs = require('fs');
let code = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

const startIdx = code.indexOf('{isEditingSalaryContract ? (');
const endStr = '{/* 5. ADD NEW EMPLOYEE DIALOG MODAL (إضافة موظف) */}';
const endIdx = code.indexOf(endStr);

const originalText = code.substring(startIdx, endIdx);
console.log(originalText.length);
