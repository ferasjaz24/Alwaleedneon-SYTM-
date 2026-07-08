const fs = require('fs');
const path = 'src/components/finance/MonthlyPayrollRuns.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `    if (merged.otherAllowances > 0 && !merged.otherAllowancesReason?.trim()) merged.otherAllowancesReason = "تعديل مباشر";`;
const replacement = `    if (merged.otherAllowances > 0 && !merged.otherAllowancesReason?.trim()) merged.otherAllowancesReason = "تعديل مباشر";

    // Auto-calculate overtime amount when overtime hours change
    if (field === 'overtimeHours' || field === 'basicSalary' || field === 'housingAllowance' || field === 'transportAllowance' || field === 'foodAllowance' || field === 'otherAllowances') {
      const baseSalaryForOvertime = Number(merged.basicSalary || 0) + Number(merged.housingAllowance || 0) + Number(merged.transportAllowance || 0) + Number(merged.foodAllowance || 0) + Number(merged.otherAllowances || 0);
      const hourlyRate = baseSalaryForOvertime / 240;
      merged.overtimeAmount = Math.round((Number(merged.overtimeHours) || 0) * 1.5 * hourlyRate);
    }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content);
  console.log("Patched successfully");
} else {
  console.log("Target not found");
}
