const fs = require('fs');
let code = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

const actionRegex = /\{isEditing \? \([\s\S]*?\) : \([\s\S]*?\{canModifyRow && isAccountant && \([\s\S]*?تعديل يدوياً[\s\S]*?<\/button>\s*\)\}\s*(<button[\s\S]*?كشف راتب\s*<\/button>)\s*(\{canModifyRow && \([\s\S]*?حذف\s*<\/button>\s*\)\})\s*<\/>\s*\)\}/;

const newAction = `
                                    <>
                                      $1
                                      $2
                                    </>
`;

code = code.replace(actionRegex, newAction);

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', code);
