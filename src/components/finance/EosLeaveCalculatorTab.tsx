import React, { useState, useEffect, useMemo, useRef } from "react";
import { db, auth } from "../../firebase";
import { collection, doc, setDoc, getDocs, deleteDoc } from "firebase/firestore";
import { 
  FileText, Search, Printer, Trash2, Plus, X, Calendar, User, 
  TrendingUp, TrendingDown, Percent, DollarSign, Calculator, HelpCircle, Pencil
} from "lucide-react";
import { Employee, User as AppUser } from "../../types";
import { sharedPrintHeader, sharedPrintFooter, sharedPrintStyles } from "../../utils/PrintShared";
import { generatePrintTemplate } from "../../utils/printTemplates";

// Firestore Error Handling matching integration guidelines
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error("Firestore Error in EosLeaveCalculatorTab: ", JSON.stringify(errInfo));
}

interface EosLeaveCalculatorTabProps {
  lang: "ar" | "en";
  user: AppUser;
  employees: Employee[];
}

interface SavedCalculation {
  id: string;
  serialNo?: string;
  employeeId: string;
  employeeName: string;
  calculationType: "eos" | "leave";
  calculationDate: string;
  calculationMonth: string;
  lastWorkingDay?: string;
  leaveStartDate?: string;
  leaveEndDate?: string;
  lastVacationEndDate?: string;
  serviceDurationText?: string;
  results: {
    basicSalary: number;
    activeAllowancesSum: number;
    vacationDays: number;
    vacationPay: number;
    eosAward: number;
    overtimeHours: number;
    overtimeRate: number;
    overtimeTotal: number;
    customAllowances: { name: string; amount: number }[];
    customDeductions: { name: string; amount: number }[];
    netSalary: number;
    totalDue: number;
    specialSettlementDeductions?: { reason: string; amount: number }[];
  };
  createdAt: string;
  createdBy: string;
  userId: string;
}

const getCalculationSerial = (calc: SavedCalculation) => {
  if (calc.serialNo) return calc.serialNo;

  const prefix = calc.calculationType === "eos" ? "ES" : "LV";
  let year = new Date(calc.createdAt || Date.now()).getFullYear().toString();
  let monthName = "GEN";

  if (calc.calculationMonth && calc.calculationMonth.includes("-")) {
    const parts = calc.calculationMonth.split("-");
    year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const monthNamesEn = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    monthName = monthNamesEn[monthNum - 1] || "GEN";
  }

  let numPart = "000";
  if (calc.id) {
    const cleanId = calc.id.replace(/\D/g, "");
    if (cleanId.length >= 3) {
      numPart = cleanId.slice(-3);
    } else {
      numPart = "101";
    }
  }

  return `${prefix}${year}${monthName}-${numPart}`;
};

export default function EosLeaveCalculatorTab({ lang, user, employees }: EosLeaveCalculatorTabProps) {
  // --- CORE UI STATE ---
  const [editingCalcId, setEditingCalcId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const isSettingEditData = useRef(false);

  const [calcType, setCalcType] = useState<"eos" | "leave">("eos");
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [lastWorkingDay, setLastWorkingDay] = useState<string>("");
  const [printLang, setPrintLang] = useState<"ar" | "en">("ar");
  
  // Leave-specific dates
  const [leaveStartDate, setLeaveStartDate] = useState<string>("");
  const [leaveEndDate, setLeaveEndDate] = useState<string>("");
  const [lastVacationEndDate, setLastVacationEndDate] = useState<string>("");

  // Manual payroll month selection (Default to current YYYY-MM)
  const [payrollMonth, setPayrollMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  // Payroll database state for lookup
  const [payrollRuns, setPayrollRuns] = useState<any[]>([]);

  // Manual Adjustments List & States
  const [overtimeHours, setOvertimeHours] = useState<number>(0);
  const [overtimeRate, setOvertimeRate] = useState<number>(0);
  const [customAllowances, setCustomAllowances] = useState<{ name: string; amount: number }[]>([]);
  const [customDeductions, setCustomDeductions] = useState<{ name: string; amount: number }[]>([]);
  const [specialSettlementDeductions, setSpecialSettlementDeductions] = useState<{ reason: string; amount: number }[]>([]);

  // Add inputs modal states
  const [showAddAllowance, setShowAddAllowance] = useState(false);
  const [newAllowanceName, setNewAllowanceName] = useState("");
  const [newAllowanceAmount, setNewAllowanceAmount] = useState("");

  const [showAddDeduction, setShowAddDeduction] = useState(false);
  const [newDeductionName, setNewDeductionName] = useState("");
  const [newDeductionAmount, setNewDeductionAmount] = useState("");

  const [showAddSpecialDeduction, setShowAddSpecialDeduction] = useState(false);
  const [newSpecialDeductionReason, setNewSpecialDeductionReason] = useState("");
  const [newSpecialDeductionAmount, setNewSpecialDeductionAmount] = useState("");

  // --- DATABASE PERSISTENCE STATE ---
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>([]);
  const [searchEmployee, setSearchEmployee] = useState("");
  const [searchMonth, setSearchMonth] = useState("");
  const [dbLoading, setDbLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // --- DERIVE ACTIVE EMPLOYEE AND CONTRACT TERMS ---
  const selectedEmp = useMemo(() => {
    return employees.find(e => e.id === selectedEmpId);
  }, [selectedEmpId, employees]);

  // Load resources & saved calculations on mount
  useEffect(() => {
    loadPayrollRuns();
    loadSavedCalculations();
  }, []);

  const loadPayrollRuns = async () => {
    try {
      const res = await fetch("/api/payroll_runs");
      if (res.ok) {
        const data = await res.json();
        setPayrollRuns(data || []);
      }
    } catch (err) {
      console.error("Error loading payroll runs:", err);
    }
  };

  const loadSavedCalculations = async () => {
    setDbLoading(true);
    try {
      const snap = await getDocs(collection(db, "eos_leave_calculations"));
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedCalculation));
      setSavedCalculations(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "eos_leave_calculations");
    } finally {
      setDbLoading(false);
    }
  };

  // Sync joining dates and base terms when employee changes
  useEffect(() => {
    if (editingCalcId) {
      // If we are actively editing a saved calculation, do NOT override its saved dates and inputs with default profile states!
      return;
    }
    if (isSettingEditData.current) {
      isSettingEditData.current = false;
      return;
    }
    if (selectedEmp) {
      // Find standard joining date
      const joining = selectedEmp.dateOfJoining || selectedEmp.birthDate || "";
      
      // Last vacation end date autocompleted if available
      setLastVacationEndDate(joining);
      setLastWorkingDay(new Date().toISOString().split("T")[0]);
      setLeaveStartDate(new Date().toISOString().split("T")[0]);
      
      const defaultLeaveEnd = new Date();
      defaultLeaveEnd.setDate(defaultLeaveEnd.getDate() + 7);
      setLeaveEndDate(defaultLeaveEnd.toISOString().split("T")[0]);

      // Set default hourly overtime rate
      const basic = Number(selectedEmp.basicSalary || 0);
      const hourlyRate = basic > 0 ? Number((basic / 30 / 8 * 1.5).toFixed(2)) : 1.5;
      setOvertimeRate(hourlyRate);
      
      // Clear manual fields
      setOvertimeHours(0);
      setCustomAllowances([]);
      setCustomDeductions([]);
      setSpecialSettlementDeductions([]);
    } else {
      setLastWorkingDay("");
      setLeaveStartDate("");
      setLeaveEndDate("");
      setLastVacationEndDate("");
      setOvertimeHours(0);
      setOvertimeRate(0);
      setCustomAllowances([]);
      setCustomDeductions([]);
      setSpecialSettlementDeductions([]);
    }
  }, [selectedEmpId, selectedEmp]);

  // --- DYNAMIC ALLOWANCES FILTER (Only show those filled in employee profile) ---
  const activeContractAllowances = useMemo(() => {
    return [];
  }, []);

  const activeContractAllowancesSum = useMemo(() => {
    return 0;
  }, []);

  // --- ACTIVE PAYROLL LOOKUP & SETTLEMENT ENGINE ---
  const { netSalary, resolvedFromPayroll } = useMemo(() => {
    if (!selectedEmp) return { netSalary: 0, resolvedFromPayroll: false };

    const basicSalary = Number(selectedEmp.basicSalary || 0);
    const contractAllowances = activeContractAllowancesSum;

    // Check if there is an approved payroll for selectedMonth
    const [selYear, selMonth] = payrollMonth.split("-").map(Number);
    const approvedPayrollRun = payrollRuns.find(p => p.year === selYear && p.month === selMonth && (p.status?.toLowerCase() === "approved" || p.status === "APPROVED"));
    
    let baseNet = 0;
    let resolved = false;

    if (approvedPayrollRun) {
      const match = approvedPayrollRun.employees?.find((e: any) => e.id === selectedEmp.id || e.employeeId === selectedEmp.id);
      if (match) {
        baseNet = Number(match.netSalary || 0);
        resolved = true;
      }
    }

    if (!resolved) {
      // Manual Calculation Formula:
      // Net Salary = (Basic + Contract Allowances) + Overtime + Custom Allowances - Custom Deductions - GOSI
      const totalSalaryBase = basicSalary + contractAllowances;
      const otAmount = overtimeHours * overtimeRate;
      
      // GOSI Deduction Percentage (9.75% for Saudis, based on Basic + Housing)
      const isSaudi = selectedEmp.nationality === "سعودي" || selectedEmp.nationality?.toLowerCase().includes("saudi");
      const housing = activeContractAllowances.find(a => a.name === "بدل سكن")?.amount || 0;
      const gosiDeductibleBase = basicSalary + housing;
      const gosiPercent = isSaudi ? 9.75 : 0;
      const gosiAmount = (gosiDeductibleBase * gosiPercent) / 100;

      const customAllowSum = customAllowances.reduce((s, a) => s + a.amount, 0);
      const customDeductSum = customDeductions.reduce((s, d) => s + d.amount, 0);

      baseNet = totalSalaryBase + otAmount + customAllowSum - (customDeductSum + gosiAmount);
    }

    const calculatedNet = baseNet;
    return { netSalary: Math.max(0, calculatedNet), resolvedFromPayroll: resolved };
  }, [
    selectedEmp, 
    activeContractAllowances, 
    activeContractAllowancesSum, 
    payrollMonth, 
    payrollRuns, 
    overtimeHours, 
    overtimeRate, 
    customAllowances, 
    customDeductions
  ]);

  // --- CORE ENGINE: CALCULATE SERVICE DURATION & EOS / LEAVE PAY ---
  const calcResults = useMemo(() => {
    if (!selectedEmp) return null;

    const editingCalc = editingCalcId ? savedCalculations.find(c => c.id === editingCalcId) : null;

    const basicSalary = editingCalc ? Number(editingCalc.results.basicSalary) : Number(selectedEmp.basicSalary || 0);
    const contractAllowances = editingCalc ? Number(editingCalc.results.activeAllowancesSum) : activeContractAllowancesSum;
    const salaryBase = basicSalary;

    const hiringDate = selectedEmp.dateOfJoining || selectedEmp.birthDate || "";

    let daysWorked = 0;
    let yearsOfService = 0;
    let remainingMonths = 0;
    let remainingDays = 0;
    let eosAward = 0;
    let leaveDays = 0;
    let vacationPay = 0;

    // Service duration calculations
    const endServiceDate = calcType === "eos" ? lastWorkingDay : leaveStartDate;
    if (hiringDate && endServiceDate) {
      const start = new Date(hiringDate);
      const end = new Date(endServiceDate);
      daysWorked = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      yearsOfService = Math.floor(daysWorked / 365);
      const remainingDaysTotal = daysWorked % 365;
      remainingMonths = Math.floor(remainingDaysTotal / 30.4375);
      remainingDays = Math.floor(remainingDaysTotal % 30.4375);
    }

    // A. EOS AWARD CALCULATION
    if (calcType === "eos" && daysWorked > 0) {
      const decimalYears = daysWorked / 365;
      let fullAward = 0;

      // Saudi Labor Law: Half salary per year for first 5 years, full salary per year thereafter
      if (decimalYears <= 5) {
        fullAward = (salaryBase / 2) * decimalYears;
      } else {
        fullAward = (salaryBase / 2) * 5 + salaryBase * (decimalYears - 5);
      }

      // Scaling factor depending on termination style.
      eosAward = fullAward; 
    }

    // Accrued Vacation calculation based on date of joining or last vacation end date
    let accruedVacationDays = 0;
    let accruedVacationPay = 0;
    const startPointForAccrual = lastVacationEndDate ? new Date(lastVacationEndDate) : (hiringDate ? new Date(hiringDate) : null);
    const endPointForAccrual = calcType === "eos" ? (lastWorkingDay ? new Date(lastWorkingDay) : null) : (leaveStartDate ? new Date(leaveStartDate) : null);
    
    let yearsOfServiceAtAccrual = 0;
    let annualRate = 21;
    let daysElapsedForAccrual = 0;

    if (hiringDate && endPointForAccrual) {
      const daysOfServiceAtEnd = Math.max(0, (endPointForAccrual.getTime() - new Date(hiringDate).getTime()) / (1000 * 60 * 60 * 24));
      yearsOfServiceAtAccrual = daysOfServiceAtEnd / 365;
      annualRate = yearsOfServiceAtAccrual <= 5 ? 21 : 30;
    }

    if (startPointForAccrual && endPointForAccrual) {
      daysElapsedForAccrual = Math.max(0, (endPointForAccrual.getTime() - startPointForAccrual.getTime()) / (1000 * 60 * 60 * 24));
      accruedVacationDays = (annualRate / 365) * daysElapsedForAccrual;
      accruedVacationPay = accruedVacationDays * (salaryBase / 30);
    }

    // B. LEAVE DURATION & VACATION PAY
    if (calcType === "leave") {
      if (leaveStartDate && leaveEndDate) {
        const start = new Date(leaveStartDate);
        const end = new Date(leaveEndDate);
        leaveDays = Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      }
      vacationPay = accruedVacationPay;
    } else {
      vacationPay = accruedVacationPay;
    }

    const overtimeTotal = overtimeHours * overtimeRate;

    // Deductions calculation
    const isSaudi = selectedEmp.nationality === "سعودي" || selectedEmp.nationality?.toLowerCase().includes("saudi");
    const housing = activeContractAllowances.find(a => a.name === "بدل سكن")?.amount || 0;
    const gosiDeductibleBase = basicSalary + housing;
    const gosiPercent = isSaudi ? 9.75 : 0;
    const gosiAmount = (gosiDeductibleBase * gosiPercent) / 100;
    const customDeductSum = customDeductions.reduce((s, d) => s + d.amount, 0);
    const totalDeductions = customDeductSum + gosiAmount;

    // Grand total including basic salary based EOS award and/or accrued vacation pay plus current month's net salary as requested.
    const baseTotalDue = (calcType === "eos" ? (eosAward + accruedVacationPay) : accruedVacationPay) + netSalary;
    const totalSpecialSettlementDeduction = specialSettlementDeductions.reduce((s, d) => s + d.amount, 0);
    const totalDue = Math.max(0, baseTotalDue - totalSpecialSettlementDeduction);

    return {
      daysWorked,
      yearsOfService,
      remainingMonths,
      remainingDays,
      eosAward,
      leaveDays,
      vacationPay,
      accruedVacationDays,
      accruedVacationPay,
      overtimeTotal,
      netSalary,
      totalDue,
      annualRate,
      daysElapsedForAccrual,
      totalDeductions,
    };
  }, [
    calcType, 
    selectedEmp, 
    activeContractAllowances,
    activeContractAllowancesSum, 
    lastWorkingDay, 
    leaveStartDate, 
    leaveEndDate, 
    lastVacationEndDate, 
    netSalary, 
    overtimeHours, 
    overtimeRate,
    customDeductions,
    editingCalcId,
    savedCalculations,
    specialSettlementDeductions
  ]);

  // Add Custom Allowance Item
  const handleAddAllowanceItem = () => {
    if (newAllowanceName && newAllowanceAmount) {
      const val = parseFloat(newAllowanceAmount);
      if (!isNaN(val)) {
        setCustomAllowances(prev => [...prev, { name: newAllowanceName, amount: val }]);
        setNewAllowanceName("");
        setNewAllowanceAmount("");
        setShowAddAllowance(false);
      }
    }
  };

  // Add Custom Deduction Item
  const handleAddDeductionItem = () => {
    if (newDeductionName && newDeductionAmount) {
      const val = parseFloat(newDeductionAmount);
      if (!isNaN(val)) {
        setCustomDeductions(prev => [...prev, { name: newDeductionName, amount: val }]);
        setNewDeductionName("");
        setNewDeductionAmount("");
        setShowAddDeduction(false);
      }
    }
  };

  // Remove allowance item
  const handleRemoveAllowanceItem = (idx: number) => {
    setCustomAllowances(prev => prev.filter((_, i) => i !== idx));
  };

  // Remove deduction item
  const handleRemoveDeductionItem = (idx: number) => {
    setCustomDeductions(prev => prev.filter((_, i) => i !== idx));
  };

  // Save calculation to Firestore
  const handleSaveCalculation = async () => {
    if (!selectedEmp || !calcResults) return;
    setSaveLoading(true);
    setNotification(null);

    const isEdit = !!editingCalcId;
    const calcId = editingCalcId || `CALC_${Date.now()}`;
    const existingCalc = editingCalcId ? savedCalculations.find(c => c.id === editingCalcId) : null;
    const nowStr = new Date().toISOString();
    const createdByStr = user?.username || user?.uid || "User";

    // Generate custom serial number
    const prefix = calcType === "eos" ? "ES" : "LV";
    let year = new Date().getFullYear().toString();
    let monthName = "GEN";
    if (payrollMonth && payrollMonth.includes("-")) {
      const parts = payrollMonth.split("-");
      year = parts[0];
      const monthNum = parseInt(parts[1], 10);
      const monthNamesEn = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      monthName = monthNamesEn[monthNum - 1] || "GEN";
    }
    const uniqueThreeDigits = calcId.replace(/\D/g, "").slice(-3) || String(Math.floor(100 + Math.random() * 900));
    const generatedSerialNo = existingCalc?.serialNo || `${prefix}${year}${monthName}-${uniqueThreeDigits}`;

    const payload: SavedCalculation = {
      id: calcId,
      serialNo: generatedSerialNo,
      employeeId: selectedEmp.id,
      employeeName: (lang === "ar" ? (selectedEmp.arabicName || selectedEmp.englishName) : (selectedEmp.englishName || selectedEmp.arabicName)) || "",
      calculationType: calcType,
      calculationDate: nowStr.split("T")[0],
      calculationMonth: payrollMonth,
      lastWorkingDay: calcType === "eos" ? lastWorkingDay : undefined,
      leaveStartDate: calcType === "leave" ? leaveStartDate : undefined,
      leaveEndDate: calcType === "leave" ? leaveEndDate : undefined,
      lastVacationEndDate: lastVacationEndDate || undefined,
      serviceDurationText: calcType === "eos" 
        ? `${calcResults.yearsOfService} سنة, ${calcResults.remainingMonths} شهر, ${calcResults.remainingDays} يوم`
        : undefined,
      results: {
        basicSalary: Number(selectedEmp.basicSalary || 0),
        activeAllowancesSum: activeContractAllowancesSum,
        vacationDays: calcType === "eos" ? calcResults.accruedVacationDays : calcResults.leaveDays,
        vacationPay: calcType === "eos" ? calcResults.accruedVacationPay : calcResults.vacationPay,
        eosAward: calcType === "eos" ? calcResults.eosAward : 0,
        overtimeHours,
        overtimeRate,
        overtimeTotal: calcResults.overtimeTotal,
        customAllowances,
        customDeductions,
        netSalary,
        totalDue: calcResults.totalDue,
        specialSettlementDeductions,
      },
      createdAt: existingCalc ? existingCalc.createdAt : nowStr,
      createdBy: existingCalc ? existingCalc.createdBy : createdByStr,
      userId: existingCalc ? existingCalc.userId : (auth.currentUser?.uid || "unknown"),
    };

    // Recursive function to remove undefined fields for Firestore safety
    const removeUndefined = (obj: any): any => {
      if (obj === null || obj === undefined) return null;
      if (Array.isArray(obj)) {
        return obj.map(removeUndefined);
      }
      if (typeof obj === "object") {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== undefined) {
            cleaned[key] = removeUndefined(value);
          }
        }
        return cleaned;
      }
      return obj;
    };

    const cleanedPayload = removeUndefined(payload);

    try {
      await setDoc(doc(db, "eos_leave_calculations", calcId), cleanedPayload);
      setNotification({
        type: "success",
        text: isEdit 
          ? (lang === "ar" ? "تم تحديث وحفظ التعديلات بنجاح" : "Calculation updated successfully.")
          : (lang === "ar" ? "تم حفظ العملية الحسابية وتوثيقها بنجاح" : "Calculation saved and authenticated successfully.")
      });
      setEditingCalcId(null);
      loadSavedCalculations();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "eos_leave_calculations");
      setNotification({
        type: "error",
        text: lang === "ar" ? "فشل حفظ السجل في قاعدة البيانات" : "Failed to save record to database."
      });
    } finally {
      setSaveLoading(false);
    }
  };

  // Edit saved calculation
  const handleEditCalculation = (calc: SavedCalculation) => {
    isSettingEditData.current = true;
    setEditingCalcId(calc.id);
    setCalcType(calc.calculationType);
    setSelectedEmpId(calc.employeeId);
    setPayrollMonth(calc.calculationMonth || "");

    if (calc.calculationType === "eos") {
      setLastWorkingDay(calc.lastWorkingDay || "");
    } else {
      setLeaveStartDate(calc.leaveStartDate || "");
      setLeaveEndDate(calc.leaveEndDate || "");
    }

    setLastVacationEndDate(calc.lastVacationEndDate || "");

    if (calc.results) {
      setOvertimeHours(calc.results.overtimeHours || 0);
      setOvertimeRate(calc.results.overtimeRate || 0);
      setCustomAllowances(calc.results.customAllowances || []);
      setCustomDeductions(calc.results.customDeductions || []);
      setSpecialSettlementDeductions(calc.results.specialSettlementDeductions || []);
    }

    // Smooth scroll to the form panel
    const formSection = document.getElementById("eos-header-card");
    if (formSection) {
      formSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Delete saved calculation
  const handleDeleteCalculation = async (id: string) => {
    try {
      // Optimistically filter the calculation out of local state
      setSavedCalculations(prev => prev.filter(calc => calc.id !== id));

      await deleteDoc(doc(db, "eos_leave_calculations", id));
      setNotification({
        type: "success",
        text: lang === "ar" ? "تم حذف العملية الحسابية بنجاح" : "Calculation deleted successfully."
      });
      setDeleteConfirmId(null);
      loadSavedCalculations();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, "eos_leave_calculations");
      setNotification({
        type: "error",
        text: lang === "ar" ? "فشل حذف الحسبة من قاعدة البيانات" : "Failed to delete calculation from database."
      });
      loadSavedCalculations();
    }
  };

  // --- PRINT WINDOW PREVIEW GENERATOR ---
  const handlePrint = () => {
    if (!selectedEmp || !calcResults) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert(lang === "ar" ? "الرجاء السماح بالنوافذ المنبثقة لفتح نموذج الطباعة والمعاينة" : "Please allow popups to open the print preview document");
      return;
    }

    const todayStr = printLang === "ar" 
      ? new Date().toLocaleDateString("ar-SA") 
      : new Date().toLocaleDateString("en-US");
    const docNo = `EOS-${Date.now().toString().slice(-6)}`;
    const empName = printLang === "ar" 
      ? (selectedEmp.arabicName || selectedEmp.englishName)
      : (selectedEmp.englishName || selectedEmp.arabicName);

    const printParams = {
      selectedEmp,
      calcResults,
      printLang,
      calcType,
      payrollMonth,
      overtimeHours,
      overtimeRate,
      lastVacationEndDate,
      leaveStartDate,
      customAllowances,
      customDeductions,
      todayStr,
      docNo,
      empName,
      specialSettlementDeductions,
    };

    const printHtml = generatePrintTemplate(printParams);
    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  // Saved calculations search filters
  const filteredCalculations = savedCalculations.filter(calc => {
    const matchesEmployee = searchEmployee === "" || calc.employeeName.toLowerCase().includes(searchEmployee.toLowerCase());
    const matchesMonth = searchMonth === "" || calc.calculationMonth === searchMonth;
    return matchesEmployee && matchesMonth;
  });

  return (
    <div className="space-y-6" id="eos-leave-calc-tab-root">
      {/* Top Heading Panel */}
      <div className="bg-white/80 backdrop-blur rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4" id="eos-header-card">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Calculator className="w-7 h-7 text-[#0072BC]" />
            {lang === "ar" ? "حاسبة مستحقات نهاية الخدمة والإجازات" : "End of Service & Leave Calculator"}
          </h2>
          <p className="text-xs text-slate-500 font-bold mt-1">
            {lang === "ar" 
              ? "التحضير المالي لتصفية الموظفين وتوزيع مستحقات نهاية الخدمة والإجازات السنوية بدقة"
              : "Financial calculation for employee off-boarding and leave entitlements according to regulations."}
          </p>
        </div>
        <div className="bg-sky-50 text-sky-800 font-bold px-3 py-1.5 rounded-xl text-xs border border-sky-100" id="compliance-badge">
          ⚖️ {lang === "ar" ? "متوافق بالكامل مع نظام العمل السعودي" : "Fully Compliant with Saudi Labor Law"}
        </div>
      </div>

      {/* Main Operations Block: Calculation Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="calc-operations-grid">
        {/* Input parameters card (Takes 2/3 space) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6" id="calculation-inputs-card">
            
            {/* Calculation Type & Employee Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  {lang === "ar" ? "طريقة الحساب" : "Calculation Type"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    id="btn-calc-type-eos"
                    onClick={() => setCalcType("eos")}
                    className={`p-2.5 rounded-xl font-bold text-xs border transition-all text-center ${calcType === "eos" ? "bg-[#0072BC] text-white border-[#0072BC]" : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"}`}
                  >
                    {lang === "ar" ? "نهاية الخدمة" : "End of Service"}
                  </button>
                  <button
                    type="button"
                    id="btn-calc-type-leave"
                    onClick={() => setCalcType("leave")}
                    className={`p-2.5 rounded-xl font-bold text-xs border transition-all text-center ${calcType === "leave" ? "bg-[#0072BC] text-white border-[#0072BC]" : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"}`}
                  >
                    {lang === "ar" ? "إجازة سنوية" : "Annual Leave"}
                  </button>
                </div>
              </div>

              {/* Employee Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5" htmlFor="select-employee-id">
                  {lang === "ar" ? "اختر الموظف *" : "Select Employee *"}
                </label>
                <select
                  id="select-employee-id"
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[#0072BC]"
                >
                  <option value="">{lang === "ar" ? "-- اختر موظف من القائمة --" : "-- Select Employee --"}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {lang === "ar" ? `${emp.arabicName || emp.englishName} (رقم: ${emp.id})` : `${emp.englishName || emp.arabicName} (ID: ${emp.id})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Service & Process Dates */}
            {selectedEmp && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4" id="dates-parameters-section">
                <h3 className="font-bold text-slate-700 text-xs flex items-center gap-1.5 border-b pb-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{lang === "ar" ? "البيانات الأساسية وتواريخ الخدمة" : "Basic Details & Service Dates"}</span>
                </h3>

                {calcType === "eos" ? (
                  // EOS DATES
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        {lang === "ar" ? "تاريخ التعيين (من بيانات الموظف)" : "Date of Joining (From Profile)"}
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={selectedEmp.dateOfJoining || selectedEmp.birthDate || ""}
                        className="w-full bg-slate-200 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-600 text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1" htmlFor="input-last-work-day">
                        {lang === "ar" ? "تاريخ آخر يوم عمل *" : "Last Day of Work *"}
                      </label>
                      <input
                        type="date"
                        id="input-last-work-day"
                        value={lastWorkingDay}
                        onChange={(e) => setLastWorkingDay(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[#0072BC] text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1" htmlFor="input-last-vacation-end">
                        {lang === "ar" ? "تاريخ نهاية آخر إجازة مستلمة" : "Last Vacation End Date"}
                      </label>
                      <input
                        type="date"
                        id="input-last-vacation-end"
                        value={lastVacationEndDate}
                        onChange={(e) => setLastVacationEndDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[#0072BC] text-center"
                      />
                    </div>
                  </div>
                ) : (
                  // ANNUAL LEAVE DATES
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        {lang === "ar" ? "تاريخ آخر إجازة" : "Last Vacation End Date"}
                      </label>
                      <input
                        type="date"
                        value={lastVacationEndDate}
                        onChange={(e) => setLastVacationEndDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[#0072BC] text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1" htmlFor="input-leave-start">
                        {lang === "ar" ? "تاريخ بداية الإجازة" : "Leave Start Date"}
                      </label>
                      <input
                        type="date"
                        id="input-leave-start"
                        value={leaveStartDate}
                        onChange={(e) => setLeaveStartDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[#0072BC] text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1" htmlFor="input-leave-end">
                        {lang === "ar" ? "تاريخ نهاية الإجازة" : "Leave End Date"}
                      </label>
                      <input
                        type="date"
                        id="input-leave-end"
                        value={leaveEndDate}
                        onChange={(e) => setLeaveEndDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[#0072BC] text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        {lang === "ar" ? "مدة الإجازة (بالأيام)" : "Leave Duration (Days)"}
                      </label>
                      <div className="w-full bg-sky-50 border border-sky-100 rounded-xl p-2.5 text-xs font-black text-sky-800 text-center">
                        {calcResults ? calcResults.leaveDays : 0} {lang === "ar" ? "أيام" : "Days"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Contractual Salary Grid */}
            {selectedEmp && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4" id="contractual-terms-section">
                <h3 className="font-bold text-slate-700 text-xs flex items-center gap-1.5 border-b pb-2">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span>{lang === "ar" ? "الراتب الأساسي المعتمد من ملف الموظف" : "Approved Basic Salary from Profile"}</span>
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  <div className="flex justify-between items-center text-xs p-3.5 bg-white rounded-xl border border-slate-150">
                    <span className="font-bold text-slate-600">{lang === "ar" ? "الراتب الأساسي المعتمد" : "Approved Basic Contract Salary"}</span>
                    <span className="font-mono font-black text-slate-800 text-sm">
                      {Number(selectedEmp.basicSalary || 0).toLocaleString()} SAR
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Active Month Payroll Settlement Adjustments */}
            {selectedEmp && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4" id="monthly-adjustments-section">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b pb-2">
                  <h3 className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                    <span>{lang === "ar" ? "تسوية راتب الشهر الجاري ومسير الأجور" : "Current Month Payroll Settlement & Adjustments"}</span>
                  </h3>
                  
                  {/* Select payroll month */}
                  <div className="flex items-center gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500">{lang === "ar" ? "شهر التسوية:" : "Month:"}</label>
                    <input
                      type="month"
                      value={payrollMonth}
                      onChange={(e) => setPayrollMonth(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700"
                    />
                  </div>
                </div>

                {resolvedFromPayroll ? (
                  <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl border border-emerald-100 text-xs flex items-center justify-between" id="payroll-linked-success">
                    <span>
                      ✓ {lang === "ar" 
                        ? `تم جلب الراتب الصافي تلقائياً من مسير الرواتب المعتمد لشهر ${payrollMonth} بقيمة:` 
                        : `Linked successfully! Retrieved net salary from the approved payrun of ${payrollMonth} as:`}
                    </span>
                    <span className="font-mono font-black text-sm bg-emerald-100 px-2 py-1 rounded-lg">
                      {netSalary.toLocaleString()} SAR
                    </span>
                  </div>
                ) : (
                  <div className="bg-amber-50 text-amber-900/80 p-3 rounded-xl border border-amber-100 text-[11px]">
                    ⚠️ {lang === "ar"
                      ? "لا يوجد مسير رواتب معتمد للشهر المختار. يمكنك إدخال التسوية اليدوية أدناه لتصفية الراتب الجاري:"
                      : "No approved payroll found for this month. Please configure active salary details manually below:"}
                  </div>
                )}

                {/* Always show adjustments input so that users can edit manually even if payroll exists */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Overtime Hours */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1" htmlFor="input-ot-hours">
                        {lang === "ar" ? "ساعات الإضافي (الأوفر تايم)" : "Overtime Hours"}
                      </label>
                      <input
                        type="number"
                        id="input-ot-hours"
                        min="0"
                        value={overtimeHours || ""}
                        onChange={(e) => setOvertimeHours(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-center"
                        placeholder="0"
                      />
                    </div>

                    {/* Overtime Rate */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1" htmlFor="input-ot-rate">
                        {lang === "ar" ? "سعر الساعة الإضافية" : "Overtime Hourly Rate"}
                      </label>
                      <input
                        type="number"
                        id="input-ot-rate"
                        min="0"
                        step="0.01"
                        value={overtimeRate || ""}
                        onChange={(e) => setOvertimeRate(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-center"
                        placeholder="1.5"
                      />
                    </div>

                    {/* Computed Overtime Total */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        {lang === "ar" ? "إجمالي ساعات العمل الإضافي" : "Total Overtime Amount"}
                      </label>
                      <div className="w-full bg-slate-200 border border-slate-300 rounded-xl p-2.5 text-xs font-black text-slate-700 text-center font-mono">
                        {calcResults ? calcResults.overtimeTotal.toLocaleString() : 0} SAR
                      </div>
                    </div>

                    {/* Display current month computed salary */}
                    <div>
                      <label className="block text-[10px] font-bold text-[#0072BC] mb-1">
                        {lang === "ar" ? "صافي راتب الشهر المحسوب" : "Calculated Net Salary"}
                      </label>
                      <div className="w-full bg-[#0072BC]/10 border border-[#0072BC]/20 rounded-xl p-2.5 text-xs font-black text-[#0072BC] text-center font-mono">
                        {netSalary.toLocaleString()} SAR
                      </div>
                    </div>
                  </div>

                  {/* Add and manage custom allowances / deductions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-slate-200/60">
                    
                    {/* A. Custom Allowances adding and list */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-extrabold text-slate-600">➕ {lang === "ar" ? "بدلات ومكافآت إضافية للتسوية" : "Custom Allowances / Bonuses"}</span>
                        <button
                          type="button"
                          id="btn-toggle-add-allowance"
                          onClick={() => setShowAddAllowance(!showAddAllowance)}
                          className="text-[10px] bg-[#0072BC] text-white px-2 py-1 rounded-lg font-bold hover:bg-[#005185]"
                        >
                          {showAddAllowance ? (lang === "ar" ? "إغلاق" : "Close") : (lang === "ar" ? "إضافة +" : "Add +")}
                        </button>
                      </div>

                      {showAddAllowance && (
                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 text-xs" id="add-allowance-form">
                          <input
                            type="text"
                            placeholder={lang === "ar" ? "اسم البند (مثال: مكافأة تميز)" : "Allowance Name"}
                            value={newAllowanceName}
                            onChange={(e) => setNewAllowanceName(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2"
                          />
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder={lang === "ar" ? "المبلغ (SAR)" : "Amount (SAR)"}
                              value={newAllowanceAmount}
                              onChange={(e) => setNewAllowanceAmount(e.target.value)}
                              className="w-2/3 border border-slate-200 rounded-lg p-2 font-mono"
                            />
                            <button
                              type="button"
                              onClick={handleAddAllowanceItem}
                              className="w-1/3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg p-2"
                            >
                              {lang === "ar" ? "تأكيد" : "Add"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Display added custom allowances */}
                      {customAllowances.length > 0 && (
                        <div className="bg-white rounded-xl border border-slate-100 p-2.5 space-y-1 text-xs">
                          {customAllowances.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-1.5 hover:bg-slate-50 rounded">
                              <span className="font-bold text-slate-700">{item.name}</span>
                              <div className="flex items-center gap-2 font-mono font-bold">
                                <span className="text-emerald-700">+{item.amount.toLocaleString()} SAR</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAllowanceItem(idx)}
                                  className="text-rose-500 hover:text-rose-700 text-[10px]"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* B. Custom Deductions adding and list */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-extrabold text-slate-600">➖ {lang === "ar" ? "خصومات وجزاءات إضافية للتسوية" : "Custom Deductions / Penalties"}</span>
                        <button
                          type="button"
                          id="btn-toggle-add-deduction"
                          onClick={() => setShowAddDeduction(!showAddDeduction)}
                          className="text-[10px] bg-slate-700 text-white px-2 py-1 rounded-lg font-bold hover:bg-slate-800"
                        >
                          {showAddDeduction ? (lang === "ar" ? "إغلاق" : "Close") : (lang === "ar" ? "إضافة +" : "Add +")}
                        </button>
                      </div>

                      {showAddDeduction && (
                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 text-xs" id="add-deduction-form">
                          <input
                            type="text"
                            placeholder={lang === "ar" ? "اسم البند (مثال: سداد عجز)" : "Deduction Name"}
                            value={newDeductionName}
                            onChange={(e) => setNewDeductionName(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2"
                          />
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder={lang === "ar" ? "المبلغ (SAR)" : "Amount (SAR)"}
                              value={newDeductionAmount}
                              onChange={(e) => setNewDeductionAmount(e.target.value)}
                              className="w-2/3 border border-slate-200 rounded-lg p-2 font-mono"
                            />
                            <button
                              type="button"
                              onClick={handleAddDeductionItem}
                              className="w-1/3 bg-[#0f172a] hover:bg-slate-800 text-white font-bold rounded-lg p-2"
                            >
                              {lang === "ar" ? "تأكيد" : "Add"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Display added custom deductions */}
                      {customDeductions.length > 0 && (
                        <div className="bg-white rounded-xl border border-slate-100 p-2.5 space-y-1 text-xs">
                          {customDeductions.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-1.5 hover:bg-slate-50 rounded">
                              <span className="font-bold text-slate-700">{item.name}</span>
                              <div className="flex items-center gap-2 font-mono font-bold">
                                <span className="text-rose-700">-{item.amount.toLocaleString()} SAR</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDeductionItem(idx)}
                                  className="text-rose-500 hover:text-rose-700 text-[10px]"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* Special Settlement Deductions section */}
            {selectedEmp && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4 mt-6" id="settlement-deductions-section">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-rose-500" />
                    <span>{lang === "ar" ? "خصومات التسوية الخاصة (من إجمالي المستحقات)" : "Special Settlement Deductions (From Grand Total)"}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddSpecialDeduction(!showAddSpecialDeduction)}
                    className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1"
                  >
                    {showAddSpecialDeduction ? (lang === "ar" ? "إغلاق" : "Close") : (lang === "ar" ? "إضافة خصم +" : "Add Deduction +")}
                  </button>
                </div>

                {/* List of Special Deductions */}
                {specialSettlementDeductions.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic text-center py-2">
                    {lang === "ar" ? "لا توجد خصومات تسوية خاصة مضافة حالياً." : "No special settlement deductions added yet."}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {specialSettlementDeductions.map((item, index) => (
                      <div key={index} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">{item.reason}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-rose-600">-{item.amount.toLocaleString()} SAR</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSpecialSettlementDeductions(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                            title={lang === "ar" ? "حذف" : "Delete"}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Special Deduction Inline Form */}
                {showAddSpecialDeduction && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3 mt-3 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          {lang === "ar" ? "سبب الخصم" : "Deduction Reason"}
                        </label>
                        <input
                          type="text"
                          value={newSpecialDeductionReason}
                          onChange={(e) => setNewSpecialDeductionReason(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                          placeholder={lang === "ar" ? "مثال: عهدة تالفة، سلفة مستحقة" : "e.g. Unreturned assets, unpaid advances"}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          {lang === "ar" ? "المبلغ" : "Amount (SAR)"}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            value={newSpecialDeductionAmount}
                            onChange={(e) => setNewSpecialDeductionAmount(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs pl-12 font-mono text-center font-bold"
                            placeholder="0.00"
                          />
                          <span className="absolute left-3 top-2.5 text-[10px] font-bold text-slate-400 font-mono">SAR</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setNewSpecialDeductionReason("");
                          setNewSpecialDeductionAmount("");
                          setShowAddSpecialDeduction(false);
                        }}
                        className="px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        {lang === "ar" ? "إلغاء" : "Cancel"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const amt = parseFloat(newSpecialDeductionAmount);
                          if (!newSpecialDeductionReason.trim()) return;
                          if (isNaN(amt) || amt <= 0) return;
                          setSpecialSettlementDeductions(prev => [...prev, { reason: newSpecialDeductionReason, amount: amt }]);
                          setNewSpecialDeductionReason("");
                          setNewSpecialDeductionAmount("");
                          setShowAddSpecialDeduction(false);
                        }}
                        className="px-3 py-1.5 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm"
                      >
                        {lang === "ar" ? "إضافة" : "Add"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Live Calculation Results Panel (Takes 1/3 space) */}
        <div className="space-y-6" id="calc-results-sidebar">
          {!selectedEmp || !calcResults ? (
            <div className="bg-white/80 backdrop-blur rounded-3xl p-8 border border-slate-100 border-dashed text-center flex flex-col justify-center items-center h-full min-h-[300px]" id="results-empty-card">
              <span className="text-4xl mb-3">📋</span>
              <h3 className="font-extrabold text-slate-700 text-sm">
                {lang === "ar" ? "بانتظار تحديد الموظف" : "Awaiting Employee Selection"}
              </h3>
              <p className="text-xs text-slate-400 mt-2 max-w-[220px] leading-relaxed">
                {lang === "ar" 
                  ? "الرجاء اختيار الموظف والتواريخ المناسبة لمعاينة حساب المستحقات النهائي وتوثيقه بالكامل."
                  : "Select an employee and set dates to generate live settlement figures."}
              </p>
            </div>
          ) : (
            <div className="bg-[#0f172a] text-white p-6 rounded-3xl shadow-xl flex flex-col h-full justify-between space-y-6" id="live-results-panel">
              
              <div>
                {/* Header of live results */}
                <div className="border-b border-white/10 pb-4 text-center">
                  <span className="text-emerald-400 text-[10px] font-black block uppercase tracking-wider mb-1">
                    ✨ {lang === "ar" ? "تقرير معاينة المستحقات الجاري" : "Live Settlement Preview"}
                  </span>
                  <h3 className="text-base font-black text-white">
                    {lang === "ar" ? selectedEmp.arabicName : selectedEmp.englishName}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-bold mt-1">
                    {lang === "ar" ? `المسمى: ${selectedEmp.jobTitle}` : `Job: ${selectedEmp.jobTitle}`}
                  </p>
                </div>

                {/* Calculation Details list */}
                <div className="py-4 space-y-4 text-xs">
                  {/* Service duration block for EOS */}
                  {calcType === "eos" && (
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5 space-y-1">
                      <span className="text-slate-400 text-[10px] block">{lang === "ar" ? "مدة الخدمة الإجمالية" : "Total Service Duration"}</span>
                      <p className="text-white font-extrabold text-xs">
                        {lang === "ar" 
                          ? `${calcResults.yearsOfService} سنة, و ${calcResults.remainingMonths} شهر, و ${calcResults.remainingDays} يوم`
                          : `${calcResults.yearsOfService} years, ${calcResults.remainingMonths} months, ${calcResults.remainingDays} days`}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {lang === "ar" ? `(مجموع الأيام: ${Math.floor(calcResults.daysWorked)} يوم)` : `(Total days: ${Math.floor(calcResults.daysWorked)} days)`}
                      </p>
                    </div>
                  )}

                  {/* Leave duration block for Leave */}
                  {calcType === "leave" && (
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5 space-y-1">
                      <span className="text-slate-400 text-[10px] block">{lang === "ar" ? "مدة الإجازة المطلوبة" : "Requested Leave Duration"}</span>
                      <p className="text-white font-extrabold text-xs">
                        {calcResults.leaveDays} {lang === "ar" ? "أيام" : "Days"}
                      </p>
                    </div>
                  )}

                  {/* Calculations breakdown */}
                  <div className="space-y-2.5 pt-3 border-t border-white/10">
                    {calcType === "eos" ? (
                      <>
                        <div className="flex justify-between items-center text-slate-300">
                          <span>{lang === "ar" ? "مكافأة نهاية الخدمة (EOS):" : "EOS Award:"}</span>
                          <span className="font-mono font-bold text-white">{calcResults.eosAward.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span>
                            {lang === "ar" ? `تصفية رصيد إجازة (${calcResults.accruedVacationDays.toFixed(1)} يوم):` : `Vacation Settle (${calcResults.accruedVacationDays.toFixed(1)} days):`}
                          </span>
                          <span className="font-mono font-bold text-white">{calcResults.accruedVacationPay.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center text-slate-300">
                          <span>{lang === "ar" ? "أيام الإجازة المستحقة:" : "Accrued Vacation Days:"}</span>
                          <span className="font-mono font-bold text-white">{calcResults.accruedVacationDays.toFixed(2)} {lang === "ar" ? "يوم" : "Days"}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span>{lang === "ar" ? "مستحقات أيام الإجازة:" : "Accrued Vacation Pay:"}</span>
                          <span className="font-mono font-bold text-white">{calcResults.accruedVacationPay.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                        </div>
                      </>
                    )}

                    {/* Active Month Net Salary included in grand total */}
                    <div className="flex justify-between items-center text-slate-300 pt-2 border-t border-dashed border-white/10">
                      <span>{lang === "ar" ? "صافي راتب الشهر الجاري:" : "Current Month Net Salary:"}</span>
                      <span className="font-mono font-bold text-emerald-400">+{calcResults.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                    </div>

                    {/* Special Settlement Deductions list */}
                    {specialSettlementDeductions.length > 0 && (
                      <div className="pt-2 border-t border-dashed border-white/10 space-y-1">
                        <span className="text-rose-300 text-[10px] block font-bold">{lang === "ar" ? "خصومات التسوية الخاصة:" : "Special Settlement Deductions:"}</span>
                        {specialSettlementDeductions.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-rose-300 text-[11px] pl-2 pr-2">
                            <span className="truncate max-w-[150px]">• {item.reason}</span>
                            <span className="font-mono font-bold">-{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Total Dues and actions */}
              <div className="border-t border-white/10 pt-4 text-center space-y-4">
                <div>
                  <span className="text-slate-400 text-[10px] block font-black uppercase tracking-widest">{lang === "ar" ? "صافي إجمالي المستحقات" : "Final Net Grand Total"}</span>
                  <p className="text-3xl font-mono font-black text-emerald-400">
                    {calcResults.totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <span className="text-slate-400 text-[10px] font-bold block">ريال سعودي (SAR)</span>
                </div>

                {/* Print Language Toggle */}
                <div className="bg-white/5 p-2 rounded-2xl border border-white/10 flex items-center justify-between text-xs my-2">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase">
                    {lang === "ar" ? "لغة طباعة المستند:" : "Print Document Language:"}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPrintLang("ar")}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${printLang === "ar" ? "bg-[#0072BC] text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
                    >
                      عربي
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintLang("en")}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${printLang === "en" ? "bg-[#0072BC] text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
                    >
                      English
                    </button>
                  </div>
                </div>

                {/* Print and Save buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      id="btn-print-calc"
                      onClick={handlePrint}
                      className="flex items-center justify-center gap-1.5 p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer border border-slate-750"
                    >
                      <Printer className="w-4 h-4 text-blue-400" />
                      <span>{lang === "ar" ? "طباعة" : "Print"}</span>
                    </button>

                    <button
                      type="button"
                      id="btn-save-calc"
                      disabled={saveLoading}
                      onClick={handleSaveCalculation}
                      className={`flex items-center justify-center gap-1.5 p-2.5 text-white rounded-xl text-xs font-black transition-all cursor-pointer ${editingCalcId ? "bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800" : "bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800"}`}
                    >
                      {saveLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <FileText className="w-4 h-4" />
                          <span>
                            {editingCalcId 
                              ? (lang === "ar" ? "حفظ التعديلات" : "Save Changes") 
                              : (lang === "ar" ? "حفظ الحسبة" : "Save Log")}
                          </span>
                        </>
                      )}
                    </button>
                  </div>

                  {editingCalcId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCalcId(null);
                        setSelectedEmpId("");
                      }}
                      className="w-full flex items-center justify-center gap-1.5 p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-600"
                    >
                      <span>{lang === "ar" ? "إلغاء وضع التعديل" : "Cancel Edit Mode"}</span>
                    </button>
                  )}
                </div>

                {/* Local Notification banner */}
                {notification && (
                  <div className={`text-[10px] p-2 rounded-lg font-bold text-center border mt-2 ${notification.type === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}>
                    {notification.text}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Dynamic Formulas & Calculations Details Section */}
      <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 space-y-6" id="formulas-details-panel">
        <div className="border-b border-slate-200 pb-4">
          <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            📊 <span>{lang === "ar" ? "تفاصيل المعادلات والاحتسابات التلقائية" : "Details of Formulas & Automatic Calculations"}</span>
          </h3>
          <p className="text-xs text-slate-500 font-bold mt-1">
            {lang === "ar" 
              ? "معاينة حية لخطوات الحساب الرياضية والقيم المطبقة بالتفصيل لنظام العمل السعودي"
              : "Live preview of mathematical calculation steps and Saudi Labor Law rates applied."}
          </p>
        </div>

        {!selectedEmp || !calcResults ? (
          <div className="text-center py-4 text-slate-400 italic text-xs font-bold">
            {lang === "ar" ? "الرجاء اختيار موظف لعرض تفاصيل ومعادلات الاحتساب التلقائي هنا" : "Please select an employee to view live mathematical calculation details."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-slate-700">
            {/* 1. Accrued vacation days */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-black text-[#0072BC] block text-sm">📅 {lang === "ar" ? "أيام الإجازة المستحقة سنوياً" : "Accrued Vacation Days"}</span>
              <p className="text-slate-500 leading-relaxed font-bold text-[11px]">
                {lang === "ar" 
                  ? "القانون: أول 5 سنوات يحسب 21 يوماً/سنة. ما بعد 5 سنوات يحسب 30 يوماً/سنة."
                  : "Law: First 5 years = 21 days/year. After 5 years = 30 days/year."}
              </p>
              <div className="bg-slate-50 p-2.5 rounded-xl font-mono text-[11px] space-y-1">
                <div>• {lang === "ar" ? `مدة الخدمة الإجمالية:` : `Total service duration:`} <strong className="text-slate-800">{(calcResults.daysWorked / 365).toFixed(2)} {lang === "ar" ? "سنة" : "years"}</strong></div>
                <div>• {lang === "ar" ? `معدل الاستحقاق المحدد:` : `Selected entitlement rate:`} <strong className="text-slate-800">{calcResults.annualRate} {lang === "ar" ? "يوم/سنة" : "days/year"}</strong></div>
                <div>• {lang === "ar" ? `أيام العمل المتراكمة للرصيد:` : `Accumulated working days:`} <strong className="text-slate-800">{Math.floor(calcResults.daysElapsedForAccrual)} {lang === "ar" ? "يوم" : "days"}</strong></div>
                <div className="pt-1.5 border-t border-slate-200 mt-1.5 text-blue-800 font-bold">
                  {lang === "ar" ? `الحسبة: (${calcResults.annualRate} / 365) × ${Math.floor(calcResults.daysElapsedForAccrual)} =` : `Math: (${calcResults.annualRate} / 365) × ${Math.floor(calcResults.daysElapsedForAccrual)} =`} <span className="text-base font-black">{calcResults.accruedVacationDays.toFixed(2)}</span> {lang === "ar" ? "يوم" : "days"}
                </div>
              </div>
            </div>

            {/* 2. Accrued vacation pay */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-black text-[#0072BC] block text-sm">💰 {lang === "ar" ? "مستحقات أيام الإجازة" : "Accrued Vacation Pay"}</span>
              <p className="text-slate-500 leading-relaxed font-bold text-[11px]">
                {lang === "ar" 
                  ? "القانون: يومية الموظف (الراتب الأساسي فقط / 30) ضرب عدد أيام الإجازة المستحقة."
                  : "Law: Employee daily rate (Basic Salary Only / 30) multiplied by accrued vacation days."}
              </p>
              <div className="bg-slate-50 p-2.5 rounded-xl font-mono text-[11px] space-y-1">
                <div>• {lang === "ar" ? `الراتب الأساسي المعتمد:` : `Approved Basic Salary:`} <strong className="text-slate-800">{Number(selectedEmp.basicSalary || 0).toLocaleString()} SAR</strong></div>
                <div>• {lang === "ar" ? `معدل الأجر اليومي (يومية الموظف):` : `Employee daily wage:`} <strong className="text-slate-800">{(Number(selectedEmp.basicSalary || 0) / 30).toFixed(2)} SAR</strong></div>
                <div>• {lang === "ar" ? `عدد أيام الإجازة المحسوبة:` : `Computed vacation days:`} <strong className="text-slate-800">{calcResults.accruedVacationDays.toFixed(2)} {lang === "ar" ? "يوم" : "days"}</strong></div>
                <div className="pt-1.5 border-t border-slate-200 mt-1.5 text-emerald-800 font-bold">
                  {lang === "ar" ? `الحسبة: ${(Number(selectedEmp.basicSalary || 0) / 30).toFixed(2)} × ${calcResults.accruedVacationDays.toFixed(2)} =` : `Math: ${(Number(selectedEmp.basicSalary || 0) / 30).toFixed(2)} × ${calcResults.accruedVacationDays.toFixed(2)} =`} <span className="text-base font-black">{calcResults.accruedVacationPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> SAR
                </div>
              </div>
            </div>

            {/* 3. Net salary of vacation month */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-black text-[#0072BC] block text-sm">💵 {lang === "ar" ? "صافي راتب شهر الإجازة" : "Net Salary of Vacation Month"}</span>
              <p className="text-slate-500 leading-relaxed font-bold text-[11px]">
                {lang === "ar" 
                  ? "المصدر: يسحب تلقائياً من تسوية راتب الشهر الجاري في مسير الأجور شامل الإضافي والبدلات بعد حسم الخصومات."
                  : "Source: Pulled from current month's payroll settlement including overtime/allowances minus deductions."}
              </p>
              <div className="bg-slate-50 p-2.5 rounded-xl font-mono text-[11px] space-y-1">
                <div>• {lang === "ar" ? `صافي راتب الشهر المعتمد:` : `Approved active month net:`} <strong className="text-slate-800">{calcResults.netSalary.toLocaleString()} SAR</strong></div>
                <div>• {lang === "ar" ? `الخصومات المطبقة في راتب الشهر:` : `Applied deductions in month:`} <strong className="text-rose-700">-{calcResults.totalDeductions.toLocaleString()} SAR</strong></div>
                <div className="pt-1.5 border-t border-slate-200 mt-1.5 text-slate-800 font-bold">
                  {lang === "ar" ? `صافي راتب شهر الإجازة الفعلي:` : `Actual net salary of leave month:`} <span className="text-base font-black text-slate-900">{calcResults.netSalary.toLocaleString()}</span> SAR
                </div>
              </div>
            </div>

            {/* 3. EOS award rule if EOS */}
            {calcType === "eos" && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-black text-amber-600 block text-sm">🎓 {lang === "ar" ? "قاعدة حساب مكافأة نهاية الخدمة (نظام العمل)" : "EOS Award Calculation Rule (Labor Law)"}</span>
                <p className="text-slate-500 leading-relaxed font-bold text-[11px]">
                  {lang === "ar" 
                    ? "القانون: نصف الراتب الأساسي عن كل سنة من السنوات الخمس الأولى، وراتب أساسي كامل عن كل سنة تالية بعد السنوات الخمس الأولى."
                    : "Law: Half month's basic wage for each of the first 5 years, and a full month's basic wage for each subsequent year."}
                </p>
                <div className="bg-slate-50 p-2.5 rounded-xl font-mono text-[11px] space-y-1">
                  <div>• {lang === "ar" ? `إجمالي مدة الخدمة بالسنوات:` : `Total service duration in years:`} <strong className="text-slate-800">{(calcResults.daysWorked / 365).toFixed(3)} {lang === "ar" ? "سنة" : "years"}</strong></div>
                  <div>• {lang === "ar" ? `الراتب الأساسي المعتمد:` : `Approved Basic Salary:`} <strong className="text-slate-800">{Number(selectedEmp.basicSalary || 0).toLocaleString()} SAR</strong></div>
                  <div className="pt-1.5 border-t border-slate-200 mt-1.5 text-amber-950 font-bold">
                    {lang === "ar" ? `المكافأة المحسوبة النهائية:` : `Final computed EOS award:`} <span className="text-base font-black">{calcResults.eosAward.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> SAR
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Audit Log / Saved Calculations Explorer */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6" id="saved-calculations-explorer">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">
              {lang === "ar" ? "سجل العمليات الحسابية والتصفيات المحفوظة" : "History of Saved Calculations & Settlements"}
            </h3>
            <p className="text-xs text-slate-500 font-bold mt-1">
              {lang === "ar" 
                ? "تصفح العمليات التاريخية المحفوظة والبحث حسب الموظف أو شهر المعاملة بالتفصيل واللوقات"
                : "Browse and review historic EOS and leave logs with system metadata."}
            </p>
          </div>

          {/* Search bar controls */}
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            {/* Search Employee name */}
            <div className="relative w-full md:w-56">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                placeholder={lang === "ar" ? "ابحث باسم الموظف..." : "Search Employee..."}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-3 pr-9 text-xs font-bold text-slate-700"
              />
            </div>

            {/* Filter by Month */}
            <input
              type="month"
              value={searchMonth}
              onChange={(e) => setSearchMonth(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
            />

            {/* Clear filters */}
            {(searchEmployee || searchMonth) && (
              <button
                type="button"
                onClick={() => { setSearchEmployee(""); setSearchMonth(""); }}
                className="text-xs text-slate-500 hover:text-slate-800 font-black"
              >
                {lang === "ar" ? "إعادة تعيين" : "Reset"}
              </button>
            )}
          </div>
        </div>

        {/* Database List / Table of calculations */}
        {dbLoading ? (
          <div className="flex justify-center items-center py-10" id="db-list-loading">
            <div className="w-8 h-8 border-3 border-[#0072BC] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredCalculations.length > 0 ? (
          <div className="overflow-x-auto" id="db-list-table-container">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                  <th className="p-3 text-center">{lang === "ar" ? "رقم العملية" : "Calculation No."}</th>
                  <th className="p-3 text-center">{lang === "ar" ? "الموظف" : "Employee"}</th>
                  <th className="p-3 text-center">{lang === "ar" ? "نوع التصفية" : "Type"}</th>
                  <th className="p-3 text-center">{lang === "ar" ? "شهر التسوية" : "Payroll Month"}</th>
                  <th className="p-3 text-left">{lang === "ar" ? "إجمالي المستحقات" : "Total Due"}</th>
                  <th className="p-3 text-center">{lang === "ar" ? "الموثق واللوق" : "Logged User"}</th>
                  <th className="p-3 text-center">{lang === "ar" ? "تاريخ الحفظ" : "Saved Date"}</th>
                  <th className="p-3 text-center">{lang === "ar" ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCalculations.map((calc) => (
                  <tr key={calc.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="p-3 text-center font-mono text-[11px] font-black text-slate-700">
                      <span className="bg-slate-100/80 px-2 py-1 rounded-md text-slate-800 border border-slate-200">
                        {getCalculationSerial(calc)}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-800 text-center">
                      {calc.employeeName}
                      <span className="text-[10px] text-slate-400 block font-normal">ID: {calc.employeeId}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${calc.calculationType === "eos" ? "bg-rose-50 text-rose-800" : "bg-sky-50 text-sky-800"}`}>
                        {calc.calculationType === "eos" ? (lang === "ar" ? "نهاية خدمة" : "End of Service") : (lang === "ar" ? "إجازة سنوية" : "Annual Leave")}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-slate-600">
                      {calc.calculationMonth}
                    </td>
                    <td className="p-3 text-left font-mono font-black text-emerald-700">
                      {Number(calc.results.totalDue).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </td>
                    <td className="p-3 text-center text-slate-500 font-medium">
                      <span className="bg-slate-100 py-0.5 px-2 rounded-md text-[10px] font-black">
                        👤 {calc.createdBy}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono text-[10px] text-slate-400">
                      {calc.createdAt ? new Date(calc.createdAt).toLocaleString("ar-SA") : ""}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            // Quick reprint from log
                            // We can construct a mock employee to invoke handlePrint
                            const dummyEmp: Employee = {
                              id: calc.employeeId,
                              arabicName: calc.employeeName,
                              englishName: calc.employeeName,
                              iqamaId: "",
                              passportDetails: "",
                              jobTitle: "",
                              grade: "",
                              basicSalary: calc.results.basicSalary,
                              allowances: { housing: 0, transport: 0 },
                              homeAddress: "",
                              custody: {},
                              birthDate: "",
                              dateOfJoining: "",
                              contractExpiry: "",
                              department: ""
                            };
                            
                            // Load saved allowances in active allowances array
                            // Call print window safely
                            const printWindow = window.open("", "_blank");
                            if (printWindow) {
                              const todayStr = new Date(calc.createdAt).toLocaleDateString("ar-SA");
                              const isEos = calc.calculationType === "eos";
                              
                              printWindow.document.write(`
                                <!DOCTYPE html>
                                <html dir="rtl" lang="ar">
                                <head>
                                  <meta charset="utf-8">
                                  <title>تصفية مستحقات - ${calc.employeeName}</title>
                                  <style>
                                    ${sharedPrintStyles}
                                    body {
                                      color: #1e293b;
                                      background-color: #ffffff;
                                      margin: 0;
                                      padding: 20px;
                                      font-size: 12px;
                                    }
                                    .container {
                                      max-width: 800px;
                                      margin: 0 auto;
                                      border: 1px solid #e2e8f0;
                                      border-radius: 12px;
                                      padding: 24px;
                                    }
                                    .info-grid {
                                      display: grid;
                                      grid-template-columns: repeat(2, 1fr);
                                      gap: 12px;
                                      background-color: #f8fafc;
                                      border: 1px solid #e2e8f0;
                                      border-radius: 10px;
                                      padding: 16px;
                                      margin-bottom: 20px;
                                    }
                                    .info-item { display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
                                    .section-title { font-size: 13px; font-weight: 800; color: #0284c7; border-right: 3px solid #0284c7; padding-right: 8px; margin: 16px 0 10px 0; }
                                    .calc-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                                    .calc-table th { background-color: #f1f5f9; text-align: right; padding: 10px; font-weight: 700; border-bottom: 2px solid #cbd5e1; }
                                    .calc-table td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
                                    .grand-total-panel { background-color: #0f172a; color: #ffffff; border-radius: 10px; padding: 16px; text-align: center; }
                                    .grand-total-value { font-size: 24px; font-weight: 800; color: #34d399; }
                                    .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
                                    .sig-box { display: flex; flex-direction: column; justify-content: space-between; height: 80px; }
                                    @media print {
                                      body { padding: 0; }
                                      .container { border: none; padding: 0; }
                                      @page { size: A4 portrait; margin: 12mm; }
                                    }
                                  </style>
                                </head>
                                <body>
                                  <div class="container">
                                    <!-- 1. Header -->
                                    ${sharedPrintHeader}
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: -15px; margin-bottom: 20px; font-size: 11px; color: #475569; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px;">
                                      <div><strong>رقم المستند:</strong> ${getCalculationSerial(calc)}</div>
                                      <div><strong>التاريخ:</strong> ${todayStr}</div>
                                      <div><strong>الصفحة:</strong> 1 من 1</div>
                                    </div>

                                    <div style="text-align: center; margin-bottom: 20px;">
                                      <h1 style="font-size: 18px; margin: 0; font-weight: 800;">نسخة مؤرشفة - مستند تصفية ومستحقات الموظف</h1>
                                      <span style="display: inline-block; background-color: #f0f9ff; color: #0369a1; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 11px; margin-top: 6px; border: 1px solid #bae6fd;">
                                        ${isEos ? "نهاية خدمة ومستحقات" : "إجازة سنوية"}
                                      </span>
                                    </div>

                                    <div class="info-grid">
                                      <div class="info-item"><span>اسم الموظف:</span><span style="font-weight:700;">${calc.employeeName}</span></div>
                                      <div class="info-item"><span>الرقم الوظيفي:</span><span>${calc.employeeId}</span></div>
                                      <div class="info-item"><span>نوع التصفية:</span><span>${isEos ? "تصفية نهاية خدمة" : "تصفية إجازة سنوية"}</span></div>
                                      <div class="info-item"><span>تاريخ التصفية وحفظ السجل:</span><span>${todayStr}</span></div>
                                    </div>

                                    <div class="section-title">الأجر والمستحقات المدونة بالسجل</div>
                                    <table class="calc-table">
                                      <thead>
                                        <tr>
                                          <th>البيان المالي</th>
                                          <th style="text-align: left;">القيمة المالية</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr>
                                          <td>الأجر الأساسي التعاقدي الشهري</td>
                                          <td style="text-align: left;">${Number(calc.results.basicSalary).toLocaleString()} ر.س</td>
                                        </tr>
                                        <tr>
                                          <td>صافي راتب الشهر النشط المعتمد للتسوية</td>
                                          <td style="text-align: left;">${Number(calc.results.netSalary).toLocaleString()} ر.س</td>
                                        </tr>
                                        ${isEos ? `
                                          <tr>
                                            <td>مكافأة نهاية الخدمة (EOS)</td>
                                            <td style="text-align: left; font-weight: bold; color: #0284c7;">${Number(calc.results.eosAward).toLocaleString()} ر.س</td>
                                          </tr>
                                          <tr>
                                            <td>مستحقات تصفية الإجازة (${Number(calc.results.vacationDays).toFixed(1)} يوم)</td>
                                            <td style="text-align: left; font-weight: bold; color: #0284c7;">${Number(calc.results.vacationPay).toLocaleString()} ر.س</td>
                                          </tr>
                                        ` : `
                                          <tr>
                                            <td>أجر الإجازة السنوية المستحق (${Number(calc.results.vacationDays)} يوم)</td>
                                            <td style="text-align: left; font-weight: bold; color: #0284c7;">${Number(calc.results.vacationPay).toLocaleString()} ر.s</td>
                                          </tr>
                                        `}
                                      </tbody>
                                    </table>

                                    <div class="grand-total-panel">
                                      <div style="font-size: 11px; color: #94a3b8; font-weight: bold;">إجمالي المستحقات المؤرشفة النهائية</div>
                                      <div class="grand-total-value">${Number(calc.results.totalDue).toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س</div>
                                      <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">تم الحفظ بواسطة 👤 ${calc.createdBy} بتاريخ ${todayStr}</div>
                                    </div>

                                    <div class="signatures">
                                      <div class="sig-box"><span style="font-weight:700;">إدارة شؤون الموظفين</span><span style="border-top:1px dashed #cbd5e1; margin-top:auto; padding-top:4px;">توقيع واعتماد</span></div>
                                      <div class="sig-box"><span style="font-weight:700;">المحاسب المالي</span><span style="border-top:1px dashed #cbd5e1; margin-top:auto; padding-top:4px;">توقيع واعتماد</span></div>
                                      <div class="sig-box"><span style="font-weight:700;">توقيع الموظف</span><span style="border-top:1px solid #0f172a; margin-top:auto; padding-top:4px;">${calc.employeeName}</span></div>
                                    </div>
                                  </div>
                                  <script>window.onload = function() { window.print(); };</script>
                                </body>
                                </html>
                              `);
                              printWindow.document.close();
                            }
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg hover:text-slate-900 transition-all cursor-pointer"
                          title={lang === "ar" ? "معاينة وطباعة" : "Reprint log"}
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditCalculation(calc)}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg hover:text-amber-800 transition-all cursor-pointer"
                          title={lang === "ar" ? "تعديل الحسبة" : "Edit calculation"}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {deleteConfirmId === calc.id ? (
                          <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                            <button
                              type="button"
                              onClick={() => handleDeleteCalculation(calc.id)}
                              className="px-2 py-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-extrabold text-[10px] cursor-pointer transition-all shadow-sm"
                              title={lang === "ar" ? "تأكيد الحذف نهائياً" : "Confirm delete permanently"}
                            >
                              {lang === "ar" ? "تأكيد" : "Confirm"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-extrabold text-[10px] cursor-pointer transition-all"
                              title={lang === "ar" ? "إلغاء" : "Cancel"}
                            >
                              {lang === "ar" ? "إلغاء" : "Cancel"}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(calc.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg hover:text-rose-800 transition-all cursor-pointer"
                            title={lang === "ar" ? "حذف السجل" : "Delete record"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 italic font-bold">
            {lang === "ar" ? "لا توجد حسابات وتصفيات تطابق الفلتر والبحث المختار" : "No saved calculations matching current filters."}
          </div>
        )}
      </div>

    </div>
  );
}
