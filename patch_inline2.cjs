const fs = require('fs');
let code = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

const handleInlineSaveStr = `
  const handleInlineSave = async (empId: string, field: string, value: any) => {
    if (!selectedRun) return;
    const targetEmp = runEmployees.find((e) => e.id === empId);
    if (!targetEmp) return;

    const merged = { ...targetEmp, [field]: value };

    // Auto-fill reasons for deductions if not present
    if (merged.loansDeduction > 0 && !merged.loanDeductionReason?.trim()) merged.loanDeductionReason = "تعديل مباشر";
    if (merged.absenceDeduction > 0 && !merged.absenceDeductionReason?.trim()) merged.absenceDeductionReason = "تعديل مباشر";
    if (merged.lateDeduction > 0 && !merged.lateDeductionReason?.trim()) merged.lateDeductionReason = "تعديل مباشر";
    if (merged.penaltyDeduction > 0 && !merged.penaltyDeductionReason?.trim()) merged.penaltyDeductionReason = "تعديل مباشر";
    if (merged.otherDeductions > 0 && !merged.deductionsReason?.trim()) merged.deductionsReason = "تعديل مباشر";
    if (merged.otherAllowances > 0 && !merged.otherAllowancesReason?.trim()) merged.otherAllowancesReason = "تعديل مباشر";

    const calculated = calculateEmployeeNet({
      basicSalary: merged.basicSalary || 0,
      housingAllowance: merged.housingAllowance || 0,
      transportAllowance: merged.transportAllowance || 0,
      foodAllowance: merged.foodAllowance || 0,
      muddahAmount: merged.muddahAmount || 0,
      overtimeAmount: merged.overtimeAmount || 0,
      otherAllowances: merged.otherAllowances || 0,
      loansDeduction: merged.loansDeduction || 0,
      gosiDeduction: merged.gosiDeduction || 0,
      absenceDeduction: merged.absenceDeduction || 0,
      lateDeduction: merged.lateDeduction || 0,
      penaltyDeduction: merged.penaltyDeduction || 0,
      otherDeductions: merged.otherDeductions || 0,
    });

    const updatedEmployee = {
      ...merged,
      totalEntitlements: calculated.totalEntitlements,
      totalDeductions: calculated.totalDeductions,
      netSalary: calculated.netSalary,
    };

    setRunEmployees(prev => prev.map(e => e.id === empId ? updatedEmployee : e));

    try {
      await fetch(\`/api/payroll_runs/\${selectedRun.id}/employees/\${empId}\`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedEmployee),
      });
      // Background load to sync aggregates
      loadPayrollRuns();
    } catch (err) {
      console.error(err);
    }
  };
`;

code = code.replace("const handleSaveEmployeeRow = async (empId: string) => {", handleInlineSaveStr + "\n  const handleSaveEmployeeRow = async (empId: string) => {");

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', code);
