sed -i '/const \[isPayslipModalOpen/i \
  const [confirmDialog, setConfirmDialog] = useState({\
    isOpen: false,\
    title: "",\
    message: "",\
    onConfirm: () => {}\
  });\
\
  const confirmAction = (title: string, message: string, action: () => void) => {\
    setConfirmDialog({\
      isOpen: true,\
      title,\
      message,\
      onConfirm: () => {\
        action();\
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));\
      }\
    });\
  };\
' src/components/finance/MonthlyPayrollRuns.tsx
