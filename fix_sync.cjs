const fs = require('fs');

let content = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

const targetFunction = `  const handleRefreshHrDeductions = async () => {
    if (!selectedRun) return;
    try {
      setLoading(true);
      // Fetch latest deductions
      const resDeductions = await fetch("/api/deductions");
      if (!resDeductions.ok) {
        throw new Error("Failed to fetch fresh deductions list from HR");
      }
      const freshDeductions = await resDeductions.json();

      // Fetch latest employee data to sync allowances/muddah
      const resEmps = await fetch("/api/employees");
      const freshEmps = resEmps.ok ? await resEmps.json() : [];

      const runMonthStr = selectedRun.month.toString().padStart(2, "0");
      const runYearMonth = \`\${selectedRun.year}-\${runMonthStr}\`;

      // Update employees in selectedRun
      const updatedEmployees = selectedRun.employees.map((emp) => {
        // Find fresh HR data for this employee
        const freshEmp = freshEmps.find((e) => e.id === emp.employeeId);

        // Filter latest matching active HR deductions
        const matchingHr = freshDeductions.filter((d: any) => {
          return (
            d.employeeId === emp.employeeId &&
            d.date &&
            d.date.startsWith(runYearMonth) &&
            (d.status === "confirmed" || d.status === "notified") &&
            Number(d.amount) > 0
          );
        });

        // Current deductions list
        let currentList = emp.deductionsList ? [...emp.deductionsList] : [];

        // 1. Remove HR deductions that are no longer active/matching in HR
        currentList = currentList.filter((item) => {
          if (item.source !== "HR") return true; // Keep manual ones
          return matchingHr.some((d: any) => d.id === item.sourceDeductionId);
        });

        // 2. Update existing HR deductions or add new ones
        matchingHr.forEach((d: any) => {
          const existingIdx = currentList.findIndex((item) => item.sourceDeductionId === d.id);
          if (existingIdx > -1) {
            // Update
            currentList[existingIdx] = {
              ...currentList[existingIdx],
              amount: Number(d.amount),
              reason: d.reason || "خصم مستورد من الموارد البشرية",
            };
          } else {
            // Add
            currentList.push({
              id: d.id || \`DED-\${Date.now()}-\${Math.random().toString(36).substr(2, 5)}\`,
              type: mapHrDeductionType(d.type),
              amount: Number(d.amount),
              reason: d.reason || "خصم مستورد من الموارد البشرية",
              source: "HR",
              sourceDeductionId: d.id,
              createdBy: d.createdBy || "HR System",
              createdAt: d.createdAt || new Date().toISOString(),
              updatedBy: "HR System",
              updatedAt: new Date().toISOString(),
            });
          }
        });

        // Recalculate categories
        let absD = 0;
        let lateD = 0;
        let loanD = 0;
        let penD = 0;
        let otherD = 0;

        currentList.forEach((item) => {
          if (item.type === "Absence Deduction") absD += item.amount;
          else if (item.type === "Late Deduction") lateD += item.amount;
          else if (item.type === "Loan Deduction") loanD += item.amount;
          else if (item.type === "Penalty Deduction") penD += item.amount;
          else otherD += item.amount;
        });

        // Sync fresh salary/allowance values if available
        let basicSalary = emp.basicSalary;
        let housing = emp.housingAllowance;
        let transport = emp.transportAllowance;
        let food = emp.foodAllowance;
        let muddah = emp.muddahAmount;
        let phone = emp.phoneAllowance;

        if (freshEmp) {
           basicSalary = Number(freshEmp.basicSalary || 0);
           housing = Number(freshEmp.allowances?.housing || 0);
           transport = Number(freshEmp.allowances?.transport || 0);
           food = Number(freshEmp.allowances?.food || 0);
           muddah = Number(freshEmp.allowances?.muddah || 0);
           phone = Number(freshEmp.allowances?.phone || 0);
        }

        const entitlements = Number(basicSalary || 0) +
          Number(housing || 0) +
          Number(transport || 0) +
          Number(phone || 0) +
          Number(food || 0) +
          Number(muddah || 0) +
          Number(emp.overtimeAmount || 0) +
          Number(emp.otherAllowances || 0);

        const totalDeductionsSum = absD + lateD + loanD + penD + otherD;
        const net = entitlements - totalDeductionsSum;

        return {
          ...emp,
          basicSalary,
          housingAllowance: housing,
          transportAllowance: transport,
          foodAllowance: food,
          muddahAmount: muddah,
          phoneAllowance: phone,
          absenceDeduction: absD,
          lateDeduction: lateD,
          loansDeduction: loanD,
          penaltyDeduction: penD,
          otherDeductions: otherD,
          totalDeductions: totalDeductionsSum,
          netSalary: net,
          deductionsList: currentList,
        };
      });

      // Recalculate overall totals
      const totalBasicSalary = updatedEmployees.reduce((sum, item) => sum + (item.basicSalary || 0), 0);
      const totalAllowances = updatedEmployees.reduce(
        (sum, item) =>
          sum +
          (item.housingAllowance || 0) +
          (item.transportAllowance || 0) +
          (item.phoneAllowance || 0) +
          (item.foodAllowance || 0) +
          (item.muddahAmount || 0) +
          (item.overtimeAmount || 0) +
          (item.otherAllowances || 0),
        0
      );
      const totalDeductions = updatedEmployees.reduce((sum, item) => sum + (item.totalDeductions || 0), 0);
      const totalNetSalary = updatedEmployees.reduce((sum, item) => sum + (item.netSalary || 0), 0);

      const updatedRun = {
        ...selectedRun,
        employees: updatedEmployees,
        totalBasicSalary,
        totalAllowances,
        totalDeductions,
        totalNetSalary,
        updatedAt: new Date().toISOString(),
      };`;

// Use simple replacement by extracting the body of handleRefreshHrDeductions
content = content.replace(/  const handleRefreshHrDeductions = async \(\) => {[\s\S]*?updatedAt: new Date\(\)\.toISOString\(\),\n      };/, targetFunction);

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', content);

