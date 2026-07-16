sed -i '/const \[isSyncing, setIsSyncing\] = useState(false);/a\
  const [toasts, setToasts] = useState<{messageAr: string, messageEn: string, type: "success" | "error", id: number}[]>([]);' src/components/finance/MonthlyPayrollRuns.tsx

sed -i 's/    alert(lang === "ar" ? messageAr : messageEn);/    const id = Date.now() + Math.random();\n    setToasts(prev => [...prev, { messageAr, messageEn, type, id }]);\n    setTimeout(() => {\n      setToasts(prev => prev.filter(t => t.id !== id));\n    }, 5000);/g' src/components/finance/MonthlyPayrollRuns.tsx

