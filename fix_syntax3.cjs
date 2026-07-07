const fs = require('fs');

let content = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

// Find the start of the block and wrap in fragment
content = content.replace(/\{selectedRun\.status === "Approved" && isPayer && \(\s*<button/, 
    `{selectedRun.status === "Approved" && isPayer && (\n                        <>\n                        <button`);

// Close the fragment at the end of the block
content = content.replace(/تسجيل وتوثيق تحويل الرواتب للمصرف 💸\s*<\/button>\s*\)\}/,
    `تسجيل وتوثيق تحويل الرواتب للمصرف 💸\n                        </button>\n                        </>\n                      )}`);

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', content);

