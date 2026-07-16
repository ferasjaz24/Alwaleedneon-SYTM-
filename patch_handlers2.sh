sed -i 's/  const handleConfirmReview = () => {/  const handleConfirmReview = () => {\n    confirmAction(\n      "تأكيد مراجعة المسير",\n      "هل أنت متأكد من تأكيد مراجعة المسير ورفعه للاعتماد النهائي؟ سيتم إغلاق بيئة العمل والانتقال إلى القائمة.",\n      () => {\n/g' src/components/finance/MonthlyPayrollRuns.tsx

sed -i 's/      `قام المراجع\/المدقق بتأكيد واغلاق مراجعة مسير الرواتب بالكامل وجاهزيته للاعتماد النهائي.`\n    );\n  };/      `قام المراجع\/المدقق بتأكيد واغلاق مراجعة مسير الرواتب بالكامل وجاهزيته للاعتماد النهائي.`\n    );\n    setIsViewModalOpen(false);\n    setSelectedRun(null);\n  });\n  };/g' src/components/finance/MonthlyPayrollRuns.tsx

sed -i 's/  const handleFinalApproval = () => {/  const handleFinalApproval = () => {\n    confirmAction(\n      "الاعتماد النهائي للمسير",\n      "هل أنت متأكد من الاعتماد النهائي للمسير؟ لا يمكن التراجع عن هذا الإجراء إلا بصلاحيات خاصة. سيتم إغلاق بيئة العمل والانتقال إلى القائمة.",\n      () => {\n/g' src/components/finance/MonthlyPayrollRuns.tsx

sed -i 's/        approvedBy: user.username,\n      }\n    );\n  };/        approvedBy: user.username,\n      }\n    );\n    setIsViewModalOpen(false);\n    setSelectedRun(null);\n  });\n  };/g' src/components/finance/MonthlyPayrollRuns.tsx

