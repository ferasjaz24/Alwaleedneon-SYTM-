sed -i 's/  const handleRevertToDraft = () => {/  const handleRevertToDraft = () => {\n    confirmAction(\n      "إرجاع إلى مسودة",\n      "هل أنت متأكد من إرجاع مسير الرواتب إلى مسودة؟ ستتمكن من تعديل البيانات مرة أخرى، وسيتم إغلاق بيئة العمل حالياً.",\n      () => {\n/g' src/components/finance/MonthlyPayrollRuns.tsx

sed -i 's/      `تم إرجاع مسير الرواتب رقم ${selectedRun?.payrollNumber} إلى حالة المسودة بواسطة ${user?.username}.`\n    );\n  };/      `تم إرجاع مسير الرواتب رقم ${selectedRun?.payrollNumber} إلى حالة المسودة بواسطة ${user?.username}.`\n    );\n    setIsViewModalOpen(false);\n    setSelectedRun(null);\n  });\n  };/g' src/components/finance/MonthlyPayrollRuns.tsx

sed -i 's/  const handleSubmitForReview = () => {/  const handleSubmitForReview = () => {\n    confirmAction(\n      "إرسال للمراجعة",\n      "هل أنت متأكد من تقديم مسير الرواتب للمراجعة؟ سيتم إغلاق بيئة العمل والانتقال إلى القائمة.",\n      () => {\n/g' src/components/finance/MonthlyPayrollRuns.tsx

sed -i 's/      `تم إرسال مسير الرواتب رقم ${selectedRun?.payrollNumber} للمراجعة والتدقيق بواسطة المحاسب.`\n    );\n  };/      `تم إرسال مسير الرواتب رقم ${selectedRun?.payrollNumber} للمراجعة والتدقيق بواسطة المحاسب.`\n    );\n    setIsViewModalOpen(false);\n    setSelectedRun(null);\n  });\n  };/g' src/components/finance/MonthlyPayrollRuns.tsx
