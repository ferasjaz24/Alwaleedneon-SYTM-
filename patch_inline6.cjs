const fs = require('fs');
let code = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

code = code.replace(/const isEditing = editingEmployeeId === emp\.id;/g, "");
// also we don't need editingEmployeeId and editEmployeeForm, but they are hooks, removing them is fine.
code = code.replace(/const \[editingEmployeeId, setEditingEmployeeId\] = useState<string \| null>\(null\);/g, "");
code = code.replace(/const \[editEmployeeForm, setEditEmployeeForm\] = useState<Partial<PayrollRunEmployee>>\(\{\}\);/g, "");

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', code);
