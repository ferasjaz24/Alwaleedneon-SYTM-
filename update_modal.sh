sed -i 's/{isDeductionModalOpen && selectedDeductionEmployee && (/{isDeductionModalOpen && selectedDeductionEmployee && (() => {\
        const canEditDeductions = selectedRun \&\& (selectedRun.status === "Draft" || selectedRun.status === "Pending Review" || selectedRun.status === "Needs Modification" || selectedRun.status === "Under Modification") \&\& isAccountant;\
        return (/g' src/components/finance/MonthlyPayrollRuns.tsx

sed -i 's/<div className="absolute top-10 left-6 text-xs text-slate-500 font-arabic bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">/<div className="absolute top-10 left-6 text-xs text-slate-500 font-arabic bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-1">\
                {!canEditDeductions \&\& <span className="text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded text-[10px]">وضع العرض فقط</span>}/g' src/components/finance/MonthlyPayrollRuns.tsx

