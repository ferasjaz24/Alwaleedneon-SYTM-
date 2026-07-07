const fs = require('fs');

let content = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

// Replace handleRefreshHrDeductions to sync all info
content = content.replace(/const handleRefreshHrDeductions = \(\) => \{[\s\S]*?showToast\(\n\s*"✓ تم تحديث ومزامنة استقطاعات الموارد البشرية بنجاح!",\n\s*"✓ HR deductions refreshed and synchronized successfully!",\n\s*"success"\n\s*\);\n\s*\} else \{\n\s*throw new Error\("Failed to save refreshed payroll run to server"\);\n\s*\}\n\s*\} catch \(err\) \{[\s\S]*?\}\n\s*\};/, 
`const handleRefreshHrDeductions = () => {
    if (!selectedRun) return;

    try {
      const updatedEmployees = selectedRun.employees.map((emp) => {
        const hrEmp = mockHrEmployees.find((e) => e.id === emp.employeeId);
        if (!hrEmp) return emp;

        // Sync bank info
        const bankInfo = {
          bankName: hrEmp.bankName || "Cash/Unspecified",
          iban: hrEmp.iban || "",
          accountNumber: hrEmp.accountNumber || "",
          swiftCode: hrEmp.swiftCode || "",
          transferMethod: hrEmp.transferMethod || "Bank Transfer",
          accountHolderName: hrEmp.accountHolderName || hrEmp.arabicName,
        };

        // Sync deductions from HR
        let currentList = emp.deductionsList ? [...emp.deductionsList] : [];
        const hrDeds = mockHrDeductions.filter(
          (d) =>
            d.employeeId === hrEmp.id &&
            d.date.startsWith(\`\${selectedRun.year}-\${selectedRun.month.toString().padStart(2, "0")}\`)
        );

        hrDeds.forEach((d) => {
          const existingIdx = currentList.findIndex((ex) => ex.sourceDeductionId === d.id);
          if (existingIdx !== -1) {
            currentList[existingIdx] = {
              ...currentList[existingIdx],
              amount: Number(d.amount),
              reason: d.reason || "خصم مستورد من الموارد البشرية",
            };
          } else {
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

        let absD = 0; let lateD = 0; let loanD = 0; let penD = 0; let otherD = 0;
        currentList.forEach((item) => {
          if (item.type === "Absence Deduction") absD += item.amount;
          else if (item.type === "Late Deduction") lateD += item.amount;
          else if (item.type === "Loan Deduction") loanD += item.amount;
          else if (item.type === "Penalty Deduction") penD += item.amount;
          else otherD += item.amount;
        });

        // Sync all core salaries & allowances
        const basic = Number(hrEmp.basicSalary || 0);
        const housing = Number(hrEmp.allowances?.housing || 0);
        const transport = Number(hrEmp.allowances?.transport || 0);
        const phone = Number(hrEmp.allowances?.phone || 0);
        const food = Number((hrEmp.allowances as any)?.food || 0);
        const muddah = Number((hrEmp.allowances as any)?.muddah || 0);
        
        const otAmount = Number(emp.overtimeAmount || 0);
        const otherAllow = Number(emp.otherAllowances || 0);

        const entitlements = basic + housing + transport + phone + food + otAmount + otherAllow;
        const totalDeductions = absD + lateD + loanD + penD + otherD;
        const netSalary = entitlements - totalDeductions;

        return {
          ...emp,
          basicSalary: basic,
          housingAllowance: housing,
          transportAllowance: transport,
          phoneAllowance: phone,
          foodAllowance: food,
          muddahAmount: muddah,
          absenceDeduction: absD,
          lateDeduction: lateD,
          loansDeduction: loanD,
          penaltyDeduction: penD,
          otherDeductions: otherD,
          totalEntitlements: entitlements,
          totalDeductions: totalDeductions,
          netSalary: netSalary,
          deductionsList: currentList,
          bankName: bankInfo.bankName,
          iban: bankInfo.iban,
          accountNumber: bankInfo.accountNumber,
          swiftCode: bankInfo.swiftCode,
          transferMethod: bankInfo.transferMethod,
          accountHolderName: bankInfo.accountHolderName,
          bankInfo: bankInfo,
        };
      });

      const totalNet = updatedEmployees.reduce((sum, e) => sum + e.netSalary, 0);

      const updatedRun = {
        ...selectedRun,
        employees: updatedEmployees,
        totalNetSalary: totalNet,
        updatedAt: new Date().toISOString(),
      };

      setSelectedRun(updatedRun);
      setPayrollRuns(payrollRuns.map((r) => (r.id === selectedRun.id ? updatedRun : r)));
      
      logActionToAudit({
        action: "مزامنة بيانات الموارد البشرية",
        payrollRunId: selectedRun.id,
        notes: \`تم مزامنة بيانات الموظفين الأساسية والخصومات من الموارد البشرية لشهر \${selectedRun.month}-\${selectedRun.year}\`,
      });

      showToast(
        "✓ تم تحديث ومزامنة كافة بيانات الموارد البشرية بنجاح!",
        "✓ HR data refreshed and synchronized successfully!",
        "success"
      );
    } catch (err) {
      showToast("❌ حدث خطأ أثناء المزامنة", "Failed to sync", "error");
    }
  };`);
fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', content);

