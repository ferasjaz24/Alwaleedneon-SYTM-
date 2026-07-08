const fs = require('fs');
const path = 'src/components/finance/MonthlyPayrollRuns.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `      merged.overtimeAmount = Math.round((Number(merged.overtimeHours) || 0) * 1.5 * hourlyRate);`;
const replacement = `      merged.overtimeAmount = Math.round((Number(merged.overtimeHours) || 0) * 1.5 * hourlyRate * 100) / 100;`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content);
  console.log("Patched successfully");
} else {
  console.log("Target not found");
}
