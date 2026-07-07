const fs = require('fs');

let content = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

// Change button text
content = content.replace(/<span>مزامنة خصومات الموارد البشرية 🔄<\/span>/, '<span>مزامنة بيانات الموارد البشرية 🔄</span>');
content = content.replace(/title="تحديث ومزامنة الخصومات المسجلة للموظفين من نظام الموارد البشرية مباشرة لهذا الشهر"/, 'title="تحديث ومزامنة البيانات والخصومات المسجلة للموظفين من نظام الموارد البشرية مباشرة لهذا الشهر"');

// Apply bank filter and search filter to runEmployees
// Wait, runEmployees is derived from selectedRun.employees
content = content.replace(/const runEmployees = selectedRun\?\.employees \|\| \[\];/, 
`const runEmployees = (selectedRun?.employees || []).filter(e => {
    if (bankFilter !== "All" && e.bankName !== bankFilter) return false;
    if (searchQuery && !e.employeeName.includes(searchQuery) && !e.employeeId.includes(searchQuery)) return false;
    return true;
  });`);

content = content.replace(/const runEmployees = selectedRun\.employees \|\| \[\];/, 
`const runEmployees = (selectedRun.employees || []).filter(e => {
    if (bankFilter !== "All" && e.bankName !== bankFilter) return false;
    if (searchQuery && !e.employeeName.includes(searchQuery) && !e.employeeId.includes(searchQuery)) return false;
    return true;
  });`);

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', content);

