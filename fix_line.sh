sed -i 's/{isDeductionModalOpen.*/{isDeductionModalOpen \&\& selectedDeductionEmployee \&\& (() => {/g' src/components/finance/MonthlyPayrollRuns.tsx
