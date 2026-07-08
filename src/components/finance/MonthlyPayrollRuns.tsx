import React, { useState, useEffect } from "react";
import html2pdf from "html2pdf.js";
import {
  Plus,
  FileText,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  History,
  UserCheck,
  CreditCard,
  X,
  Search,
  Printer,
  Eye,
  Save,
  Undo2,
  RefreshCw,
  TrendingUp,
  FileSpreadsheet,
  Building,
  User,
  ShieldAlert,
  HelpCircle,
  Lock,
  MinusCircle,
} from "lucide-react";
import {
  Employee,
  User as SystemUser,
  PayrollRun,
  PayrollRunEmployee,
  PayrollRunStatus,
  PayrollAuditLog,
  PayrollModificationRequest,
  DeductionItem,
} from "../../types";

function toEnglishDigits(str: string | undefined | null): string {
  if (!str) return "";
  return String(str)
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776));
}

function mapHrDeductionType(type: string): "Absence Deduction" | "Late Deduction" | "Loan Deduction" | "Penalty Deduction" | "Other Deduction" {
  const t = String(type).trim();
  if (t === "غياب") return "Absence Deduction";
  if (t === "تأخير") return "Late Deduction";
  if (t === "سلفة") return "Loan Deduction";
  if (t === "عقوبة") return "Penalty Deduction";
  return "Other Deduction";
}

export function getBankStyle(name: string) {
  const n = name ? name.toLowerCase() : "";
  if (n.includes("الراجحي") || n.includes("rajhi")) {
    return {
      bg: "bg-blue-50 text-blue-700 border border-blue-200",
      dot: "bg-blue-500",
      accent: "text-blue-600",
      darkBg: "bg-blue-600 text-white hover:bg-blue-700"
    };
  }
  if (n.includes("الأهلي") || n.includes("الاهلي") || n.includes("snb") || n.includes("national")) {
    return {
      bg: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      dot: "bg-emerald-500",
      accent: "text-emerald-600",
      darkBg: "bg-emerald-600 text-white hover:bg-emerald-700"
    };
  }
  if (n.includes("الرياض") || n.includes("riyad")) {
    return {
      bg: "bg-purple-50 text-purple-700 border border-purple-200",
      dot: "bg-purple-500",
      accent: "text-purple-600",
      darkBg: "bg-purple-600 text-white hover:bg-purple-700"
    };
  }
  if (n.includes("الإنماء") || n.includes("الانماء") || n.includes("alinma")) {
    return {
      bg: "bg-amber-100 text-amber-900 border border-amber-300",
      dot: "bg-amber-700",
      accent: "text-amber-800",
      darkBg: "bg-amber-800 text-white hover:bg-amber-900"
    };
  }
  if (n.includes("الأول") || n.includes("sab") || n.includes("first")) {
    return {
      bg: "bg-red-50 text-red-700 border border-red-200",
      dot: "bg-red-500",
      accent: "text-red-600",
      darkBg: "bg-red-600 text-white hover:bg-red-700"
    };
  }
  if (n.includes("البلاد") || n.includes("albilad")) {
    return {
      bg: "bg-amber-50 text-amber-800 border border-amber-200",
      dot: "bg-amber-500",
      accent: "text-amber-600",
      darkBg: "bg-amber-600 text-white hover:bg-amber-700"
    };
  }
  if (n.includes("العربي") || n.includes("anb") || n.includes("arab")) {
    return {
      bg: "bg-teal-50 text-teal-700 border border-teal-200",
      dot: "bg-teal-500",
      accent: "text-teal-600",
      darkBg: "bg-teal-600 text-white hover:bg-teal-700"
    };
  }
  if (n.includes("الجزيرة") || n.includes("jazira")) {
    return {
      bg: "bg-cyan-50 text-cyan-700 border border-cyan-200",
      dot: "bg-cyan-500",
      accent: "text-cyan-600",
      darkBg: "bg-cyan-600 text-white hover:bg-cyan-700"
    };
  }
  if (n.includes("الاستثمار") || n.includes("investment")) {
    return {
      bg: "bg-indigo-50 text-indigo-700 border border-indigo-200",
      dot: "bg-indigo-500",
      accent: "text-indigo-600",
      darkBg: "bg-indigo-600 text-white hover:bg-indigo-700"
    };
  }
  return {
    bg: "bg-slate-50 text-slate-700 border border-slate-200",
    dot: "bg-slate-400",
    accent: "text-slate-500",
    darkBg: "bg-slate-600 text-white hover:bg-slate-700"
  };
}

interface MonthlyPayrollRunsProps {
  lang: "ar" | "en";
  user: SystemUser;
  employees: Employee[];
}

export default function MonthlyPayrollRuns({
  lang,
  user,
  employees,
}: MonthlyPayrollRunsProps) {
  // DB States
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [hrDeductions, setHrDeductions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<"drafts" | "pending" | "approved" | "paid" | "all">("drafts");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterDept, setFilterDept] = useState<string>("all");

  // Create New Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRunForm, setNewRunForm] = useState({
    payrollNumber: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    salaryPeriod: "كامل الشهر - Full Month",
    department: "كلا الشركتين",
    setupMethod: "auto", // auto: HR profiles, manual: empty rows
    notes: "",
  });

  // Detailed Payroll Run View Modal
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [runEmployees, setRunEmployees] = useState<PayrollRunEmployee[]>([]);

  const toggleEmployeeTransferred = (empId: string) => {
    setRunEmployees(prev => prev.map(e => e.id === empId ? { ...e, isTransferred: !e.isTransferred } : e));
  };
  const [runAuditLogs, setRunAuditLogs] = useState<PayrollAuditLog[]>([]);
  const [runModificationRequests, setRunModificationRequests] = useState<PayrollModificationRequest[]>([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Large Modal for Editing Employee Payroll
  const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState(false);
  const [selectedEditEmployee, setSelectedEditEmployee] = useState<PayrollRunEmployee | null>(null);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [editEmployeeForm, setEditEmployeeForm] = useState<Partial<PayrollRunEmployee>>({});

  // Single Payslip Modal
  const [selectedPayslipEmployee, setSelectedPayslipEmployee] = useState<PayrollRunEmployee | null>(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);

  // Bank Info Modal
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [selectedBankEmployee, setSelectedBankEmployee] = useState<PayrollRunEmployee | null>(null);

  // Deduction Details Modal
  const [isDeductionModalOpen, setIsDeductionModalOpen] = useState(false);
  const [selectedDeductionEmployee, setSelectedDeductionEmployee] = useState<PayrollRunEmployee | null>(null);
  const [clickedDeductionType, setClickedDeductionType] = useState<string>("");
  const [localDeductions, setLocalDeductions] = useState<DeductionItem[]>([]);

  // Soft Delete Reason Modal
  const [isDeleteReasonModalOpen, setIsDeleteReasonModalOpen] = useState(false);
  const [runToDeleteId, setRunToDeleteId] = useState<string | null>(null);
  const [deleteReasonText, setDeleteReasonText] = useState("");
  const [runToDeleteStatus, setRunToDeleteStatus] = useState<string>("");

  // Register Transfer Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [bankFilter, setBankFilter] = useState("All");
  const [sortFilter, setSortFilter] = useState("role");
  const [transferForm, setTransferForm] = useState({
    bankName: "البنك الأهلي السعودي (SNB)",
    referenceNumber: "",
    transferDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Advanced Modification Request Modal
  const [isModRequestModalOpen, setIsModRequestModalOpen] = useState(false);
  const [reviewerRequestTitle, setReviewerRequestTitle] = useState("");
  const [modRequestNotes, setModRequestNotes] = useState("");
  const [reviewerRequestPriority, setReviewerRequestPriority] = useState<"Urgent" | "Medium" | "Normal">("Normal");
  const [selectedModEmployees, setSelectedModEmployees] = useState<{
    [empId: string]: {
      selected: boolean;
      fieldToModify: string;
      proposedAmount: number;
      note: string;
    }
  }>({});

  // Modification Respond Modal
  const [selectedRequestForResponse, setSelectedRequestForResponse] = useState<PayrollModificationRequest | null>(null);
  const [isModResponseModalOpen, setIsModResponseModalOpen] = useState(false);
  const [modResponseNotes, setModResponseNotes] = useState("");
  const [modResponseStatus, setModResponseStatus] = useState<"Closed" | "Open">("Closed");

  // Helper to convert any Arabic digits to English digits globally
  const toEnglishDigits = (str: string | number | null | undefined): string => {
    if (str === null || str === undefined) return "";
    const numStr = String(str);
    const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return numStr
      .replace(/[٠-٩]/g, (w) => String(arabicDigits.indexOf(w)))
      .replace(/[۰-۹]/g, (w) => String(persianDigits.indexOf(w)));
  };

  // Helper to format money securely with English digits only
  const formatMoney = (val: number | string | null | undefined): string => {
    if (val === null || val === undefined) return "0.00";
    const cleaned = toEnglishDigits(val);
    const parsed = parseFloat(cleaned) || 0;
    return parsed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Helper to write audit logs to Firestore
  const logActionToAudit = async (params: {
    action: string;
    payrollRunId: string;
    employeeId?: string;
    fieldName?: string;
    oldValue?: string | number;
    newValue?: string | number;
    notes?: string;
  }) => {
    try {
      const payload = {
        userId: toEnglishDigits(user.id || user.uid || "unknown"),
        userName: user.username || "Unknown User",
        userRole: user.role || "unknown",
        action: params.action,
        module: "monthly_payroll",
        payrollRunId: params.payrollRunId,
        employeeId: params.employeeId || "",
        fieldName: params.fieldName || "",
        oldValue: toEnglishDigits(params.oldValue !== undefined ? String(params.oldValue) : ""),
        newValue: toEnglishDigits(params.newValue !== undefined ? String(params.newValue) : ""),
        notes: params.notes || "",
      };
      await fetch("/api/audit_logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Failed to write to system audit log:", err);
    }
  };

  // Fetch Payroll Runs and HR Deductions on load
  const loadPayrollRuns = async () => {
    try {
      setLoading(true);
      const [resRuns, resDeductions] = await Promise.all([
        fetch("/api/payroll_runs"),
        fetch("/api/deductions"),
      ]);
      if (resRuns.ok) {
        const data = await resRuns.json();
        // Sort payroll runs by createdAt descending so that the newest is always on top!
        const sortedData = (data || []).sort((a: any, b: any) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        setPayrollRuns(sortedData);
      }
      if (resDeductions.ok) {
        const data = await resDeductions.json();
        setHrDeductions(data);
      }
    } catch (e) {
      console.error("Failed to load payroll runs or HR deductions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayrollRuns();
  }, []);

  // Generate Unique Payroll Number
  useEffect(() => {
    if (isCreateModalOpen) {
      const yearStr = newRunForm.year.toString();
      const monthStr = newRunForm.month.toString().padStart(2, "0");
      const randomId = Math.floor(100 + Math.random() * 900);
      setNewRunForm((prev) => ({
        ...prev,
        payrollNumber: `PR-${yearStr}${monthStr}-${randomId}`,
      }));
    }
  }, [isCreateModalOpen, newRunForm.month, newRunForm.year]);

  // Toast helper
  const showToast = (messageAr: string, messageEn: string, type: "success" | "error" = "success") => {
    alert(lang === "ar" ? messageAr : messageEn);
  };

  // Helper roles
  const isSuperAdmin =
    user.username?.toLowerCase() === "feras" ||
    user.role?.toLowerCase() === "super admin" ||
    user.role === "الادارة العليا" ||
    user.role === "الإدارة العليا" ||
    user.role?.toLowerCase() === "manager" ||
    user.role?.toLowerCase() === "admin" ||
    user.role === "مدير" ||
    user.role === "مشرف" ||
    user.jobTitle?.includes("مشرف") ||
    user.jobTitle?.includes("مدير");

  const isAccountant =
    isSuperAdmin ||
    user.jobTitle?.toLowerCase().includes("accountant") ||
    user.jobTitle?.toLowerCase().includes("accounting") ||
    user.jobTitle?.toLowerCase().includes("محاسب") ||
    user.role?.toLowerCase() === "accountant" ||
    user.role === "المحاسبة المالیة" ||
    user.role === "المحاسبة";

  const isReviewer =
    isSuperAdmin ||
    user.jobTitle?.toLowerCase().includes("manager") ||
    user.jobTitle?.toLowerCase().includes("director") ||
    user.jobTitle?.toLowerCase().includes("مدير") ||
    user.role?.toLowerCase() === "reviewer" ||
    user.role?.toLowerCase() === "admin";

  const isPayer =
    isSuperAdmin ||
    user.jobTitle?.toLowerCase().includes("treasurer") ||
    user.jobTitle?.toLowerCase().includes("payer") ||
    user.jobTitle?.toLowerCase().includes("financial controller") ||
    user.jobTitle?.toLowerCase().includes("مدير مالي");

  // Log auditing operations helper
  const appendAuditLog = (runId: string, action: string, details: string): PayrollAuditLog => {
    return {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      payrollRunId: runId,
      timestamp: new Date().toISOString(),
      operatorName: user.username || "Unknown",
      action,
      details,
    };
  };

  const getInitialDeductions = (emp: PayrollRunEmployee): DeductionItem[] => {
    if (emp.deductionsList && emp.deductionsList.length > 0) {
      return emp.deductionsList.map(item => ({
        ...item,
        amount: Number(item.amount || 0)
      }));
    }
    const legacy: DeductionItem[] = [];
    const baseDate = selectedRun?.createdAt || new Date().toISOString();
    const baseBy = selectedRun?.createdBy || "System";
    
    if (Number(emp.loansDeduction || 0) > 0) {
      legacy.push({
        id: `DED-LOAN-${Date.now()}-1`,
        type: "Loan Deduction",
        amount: Number(emp.loansDeduction),
        reason: emp.loanDeductionReason || "خصم سلفة",
        createdBy: baseBy,
        createdAt: baseDate,
        updatedBy: baseBy,
        updatedAt: baseDate,
      });
    }
    if (Number(emp.absenceDeduction || 0) > 0) {
      legacy.push({
        id: `DED-AB-${Date.now()}-2`,
        type: "Absence Deduction",
        amount: Number(emp.absenceDeduction),
        reason: emp.absenceDeductionReason || "خصم غياب",
        createdBy: baseBy,
        createdAt: baseDate,
        updatedBy: baseBy,
        updatedAt: baseDate,
      });
    }
    if (Number(emp.lateDeduction || 0) > 0) {
      legacy.push({
        id: `DED-LT-${Date.now()}-3`,
        type: "Late Deduction",
        amount: Number(emp.lateDeduction),
        reason: emp.lateDeductionReason || "خصم تأخير",
        createdBy: baseBy,
        createdAt: baseDate,
        updatedBy: baseBy,
        updatedAt: baseDate,
      });
    }
    if (Number(emp.penaltyDeduction || 0) > 0) {
      legacy.push({
        id: `DED-PN-${Date.now()}-4`,
        type: "Penalty Deduction",
        amount: Number(emp.penaltyDeduction),
        reason: emp.penaltyDeductionReason || "خصم جزاء إداري",
        createdBy: baseBy,
        createdAt: baseDate,
        updatedBy: baseBy,
        updatedAt: baseDate,
      });
    }
    if (Number(emp.otherDeductions || 0) > 0) {
      legacy.push({
        id: `DED-OT-${Date.now()}-5`,
        type: "Other Deduction",
        amount: Number(emp.otherDeductions),
        reason: emp.deductionsReason || "خصم آخر",
        createdBy: baseBy,
        createdAt: baseDate,
        updatedBy: baseBy,
        updatedAt: baseDate,
      });
    }
    return legacy;
  };

  const handleOpenDeductionsModal = (emp: PayrollRunEmployee) => {
    setSelectedDeductionEmployee(emp);
    setLocalDeductions(getInitialDeductions(emp));
    setIsDeductionModalOpen(true);
  };

  const handleSaveDeductionsModal = async () => {
    if (!selectedRun || !selectedDeductionEmployee) return;

    // VALIDATION RULES:
    // - Each deduction must have an amount > 0.
    // - No negative amount allowed.
    // - Each deduction must have a reason.
    for (let i = 0; i < localDeductions.length; i++) {
      const item = localDeductions[i];
      const amount = Number(item.amount);
      if (isNaN(amount) || amount <= 0) {
        showToast(
          "❌ يجب أن يكون مبلغ الخصم أكبر من الصفر ولا يسمح بالقيم السالبة!",
          "❌ Deduction amount must be greater than 0 and cannot be negative!",
          "error"
        );
        return;
      }
      if (!item.reason || !item.reason.trim()) {
        showToast(
          "❌ يجب تحديد سبب الخصم لجميع البنود المدرجة!",
          "❌ A deduction reason is required for all entered items!",
          "error"
        );
        return;
      }
    }

    const baseBy = user.username || "System";
    const baseDate = new Date().toISOString();

    // Map and calculate aggregated totals for categories
    const validatedDeductions = localDeductions.map(item => ({
      ...item,
      amount: Number(item.amount),
      updatedBy: baseBy,
      updatedAt: baseDate,
    }));

    const loansSum = validatedDeductions.filter(i => i.type === "Loan Deduction").reduce((sum, i) => sum + i.amount, 0);
    const absenceSum = validatedDeductions.filter(i => i.type === "Absence Deduction").reduce((sum, i) => sum + i.amount, 0);
    const lateSum = validatedDeductions.filter(i => i.type === "Late Deduction").reduce((sum, i) => sum + i.amount, 0);
    const penaltySum = validatedDeductions.filter(i => i.type === "Penalty Deduction").reduce((sum, i) => sum + i.amount, 0);
    const otherSum = validatedDeductions.filter(i => i.type === "Other Deduction").reduce((sum, i) => sum + i.amount, 0);
    const totalDeductSum = validatedDeductions.reduce((sum, i) => sum + i.amount, 0);

    const loansReasons = validatedDeductions.filter(i => i.type === "Loan Deduction").map(i => i.reason).join(" ") || "خصم سلفة";
    const absenceReasons = validatedDeductions.filter(i => i.type === "Absence Deduction").map(i => i.reason).join(" ") || "خصم غياب";
    const lateReasons = validatedDeductions.filter(i => i.type === "Late Deduction").map(i => i.reason).join(" ") || "خصم تأخير";
    const penaltyReasons = validatedDeductions.filter(i => i.type === "Penalty Deduction").map(i => i.reason).join(" ") || "خصم جزاء إداري";
    const otherReasons = validatedDeductions.filter(i => i.type === "Other Deduction").map(i => i.reason).join(" ") || "خصومات أخرى";

    // Recalculate employee net
    const calculated = calculateEmployeeNet({
      ...selectedDeductionEmployee,
      loansDeduction: loansSum,
      absenceDeduction: absenceSum,
      lateDeduction: lateSum,
      penaltyDeduction: penaltySum,
      otherDeductions: otherSum,
    });

    const updatedEmployee: PayrollRunEmployee = {
      ...selectedDeductionEmployee,
      loansDeduction: loansSum,
      loanDeductionReason: loansReasons,
      absenceDeduction: absenceSum,
      absenceDeductionReason: absenceReasons,
      lateDeduction: lateSum,
      lateDeductionReason: lateReasons,
      penaltyDeduction: penaltySum,
      penaltyDeductionReason: penaltyReasons,
      otherDeductions: otherSum,
      deductionsReason: otherReasons,
      deductionsList: validatedDeductions,
      totalDeductions: totalDeductSum,
      netSalary: calculated.netSalary,
    };

    const newEmployeesList = runEmployees.map((e) => (e.id === selectedDeductionEmployee.id ? updatedEmployee : e));

    // Recompute total run figures
    const totalBasicSalary = newEmployeesList.reduce((sum, item) => sum + item.basicSalary, 0);
    const totalAllowances = newEmployeesList.reduce(
      (sum, item) =>
        sum + item.housingAllowance + item.transportAllowance + item.foodAllowance + item.overtimeAmount + item.otherAllowances,
      0
    );
    const totalDeductions = newEmployeesList.reduce((sum, item) => sum + item.totalDeductions, 0);
    const totalNetSalary = newEmployeesList.reduce((sum, item) => sum + item.netSalary, 0);
    
    // Total Overtime summary
    const totalOvertimeHours = newEmployeesList.reduce((sum, item) => sum + (item.overtimeHours || 0), 0);
    const totalOvertimeAmount = newEmployeesList.reduce((sum, item) => sum + (item.overtimeAmount || 0), 0);

    // COMPARE OLD VS NEW DEDUCTIONS TO WRITE AUDIT LOGS FOR CHANGES
    const oldDeductions = getInitialDeductions(selectedDeductionEmployee);
    const generatedAuditLogs: PayrollAuditLog[] = [];

    // Track added or updated
    validatedDeductions.forEach(item => {
      const matchingOld = oldDeductions.find(old => old.id === item.id);
      if (!matchingOld) {
        // ADD
        const details = `المستخدم: [ID: ${user.uid || user.id || "N/A"}, الاسم: ${user.username}, البريد الإلكتروني: ${user.username}@alwaleedneon.com, الدور: ${user.role}, IP: 127.0.0.1]
الإجراء الحركي: إضافة بند خصم تفصيلي جديد
نوع الخصم: ${item.type}
الموظف المستهدف: ${selectedDeductionEmployee.arabicName} (كود: ${selectedDeductionEmployee.employeeId})
مقارنة القيم: [القيمة السابقة: 0 ر.س -> القيمة الجديدة: ${item.amount} ر.س]
السبب الموثق: ${item.reason}
الملاحظات الملحقة: ${item.notes || "لا توجد"}
المرفق الإثباتي: ${item.attachmentUrl || "لا يوجد"}`;
        generatedAuditLogs.push(appendAuditLog(selectedRun.id, `إضافة خصم تفصيلي - ${item.type}`, details));
      } else if (matchingOld.amount !== item.amount || matchingOld.reason !== item.reason || matchingOld.notes !== item.notes || matchingOld.attachmentUrl !== item.attachmentUrl) {
        // EDIT
        const details = `المستخدم: [ID: ${user.uid || user.id || "N/A"}, الاسم: ${user.username}, البريد الإلكتروني: ${user.username}@alwaleedneon.com, الدور: ${user.role}, IP: 127.0.0.1]
الإجراء الحركي: تعديل تفاصيل بند خصم موجود
نوع الخصم: ${item.type}
الموظف المستهدف: ${selectedDeductionEmployee.arabicName} (كود: ${selectedDeductionEmployee.employeeId})
مقارنة القيم: [القيمة السابقة: ${matchingOld.amount} ر.س -> القيمة الجديدة: ${item.amount} ر.س]
مقارنة الأسباب: [السبب السابق: ${matchingOld.reason} -> السبب الجديد: ${item.reason}]
الملاحظات الملحقة: ${item.notes || "لا توجد"}
المرفق الإثباتي: ${item.attachmentUrl || "لا يوجد"}`;
        generatedAuditLogs.push(appendAuditLog(selectedRun.id, `تعديل خصم تفصيلي - ${item.type}`, details));
      }
    });

    // Track removed
    oldDeductions.forEach(oldItem => {
      const stillExists = validatedDeductions.some(item => item.id === oldItem.id);
      if (!stillExists) {
        // REMOVE
        const details = `المستخدم: [ID: ${user.uid || user.id || "N/A"}, الاسم: ${user.username}, البريد الإلكتروني: ${user.username}@alwaleedneon.com, الدور: ${user.role}, IP: 127.0.0.1]
الإجراء الحركي: حذف بند خصم تفصيلي نهائياً
نوع الخصم: ${oldItem.type}
الموظف المستهدف: ${selectedDeductionEmployee.arabicName} (كود: ${selectedDeductionEmployee.employeeId})
مقارنة القيم: [القيمة المحذوفة: ${oldItem.amount} ر.س]
السبب الموثق المحذوف: ${oldItem.reason}`;
        generatedAuditLogs.push(appendAuditLog(selectedRun.id, `حذف خصم تفصيلي - ${oldItem.type}`, details));
      }
    });

    // Fallback general log if nothing specific changed but saved
    if (generatedAuditLogs.length === 0) {
      const details = `قام المستخدم بإعادة حفظ الخصومات للموظف (${selectedDeductionEmployee.arabicName}) دون إحداث أي تغيير فعلي في البنود.`;
      generatedAuditLogs.push(appendAuditLog(selectedRun.id, "تحديث استقطاعات الموظف", details));
    }

    const updatedRun = {
      ...selectedRun,
      totalBasicSalary,
      totalAllowances,
      totalDeductions,
      totalNetSalary,
      totalOvertimeHours,
      totalOvertimeAmount,
      employees: newEmployeesList,
      auditLogs: [...runAuditLogs, ...generatedAuditLogs],
      updatedAt: new Date().toISOString(),
      updatedBy: user.username,
    };

    try {
      const res = await fetch(`/api/payroll_runs/${selectedRun.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRun),
      });

      if (res.ok) {
        setRunEmployees(newEmployeesList);
        setRunAuditLogs(updatedRun.auditLogs);
        setSelectedRun(updatedRun);
        setPayrollRuns(payrollRuns.map(r => r.id === selectedRun.id ? updatedRun : r));

        showToast(
          "✅ تم حفظ وتدقيق بنود الخصم التفصيلية للموظف وإعادة احتساب المسير بنجاح!",
          "✅ Employee detailed deduction items saved and payroll totals recalculated successfully!",
          "success"
        );
        setIsDeductionModalOpen(false);
        setSelectedDeductionEmployee(null);
      } else {
        showToast("❌ فشل تحديث مسير الرواتب في الخادم.", "❌ Failed to save payroll run changes in server.", "error");
      }
    } catch (err) {
      console.error("Save deductions error:", err);
      showToast("❌ خطأ أثناء الاتصال بالخادم لحفظ التغييرات.", "❌ Error connecting to server to save changes.", "error");
    }
  };

  const handleExportPayrollPDF = () => {
    if (!selectedRun) return;

    const element = document.createElement("div");
    
    // Construct rows
    const rowsHtml = selectedRun.employees.map(emp => `
      <tr>
        <td style="padding: 8px; border: 1px solid #cbd5e1;">${emp.iqamaId}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1;">${emp.arabicName}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1;">${emp.jobTitle}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${(emp.basicSalary || 0).toLocaleString('en-US')}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${((emp.housingAllowance || 0) + (emp.transportAllowance || 0) + (emp.foodAllowance || 0) + (emp.otherAllowances || 0)).toLocaleString('en-US')}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${(emp.overtimeAmount || 0).toLocaleString('en-US')}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${emp.totalEntitlements.toLocaleString('en-US')}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${emp.totalDeductions.toLocaleString('en-US')}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #059669; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${emp.netSalary.toLocaleString('en-US')}</td>
      </tr>
    `).join('');

    element.innerHTML = `
      <style>
    @import url('https://fonts.cdnfonts.com/css/ge-ss-two');
    @import url('https://fonts.cdnfonts.com/css/gotham-pro');
  </style>
  <div style="font-family: 'GE SS', 'GE SS Two', 'GE SS Two', 'Gotham Pro', sans-serif; direction: rtl; padding: 20px; color: #0f172a; width: 100%; background: white;">
        <div style="display: flex; justify-content: space-between; border-bottom: 3px solid #0072BC; padding-bottom: 20px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 15px;">
    <img src="https://i.postimg.cc/0jQj3XVc/Alwaleed-Logo-Vertical-Blue.png" referrerpolicy="no-referrer" alt="Fonoun Alwaleed Logo" style="width: 120px; height: 120px; object-fit: contain;" />
    <div>
      <h1 style="color: #0072BC; margin: 0; font-size: 24px; font-weight: 900;">شركة فنون الوليد للصناعة</h1>
            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">مسير رواتب موظفي وعمال المصنع المعتمد</p>
    </div>
  </div>
          <div style="text-align: left;">
            <h2 style="margin: 0; font-size: 18px; color: #0f172a;">كشف مسير الرواتب المالي</h2>
            <div style="font-size: 14px; color: #64748b; margin-top:4px;">عن شهر ${selectedRun.month} - ${selectedRun.year}</div>
            <div style="font-size: 11px; color: #64748b; margin-top:4px;">كود المسير: ${selectedRun.payrollNumber}</div>
            <div style="font-size: 11px; color: #64748b; margin-top:4px;">تاريخ الطباعة: ${new Date().toLocaleDateString('en-US')}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px;">
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="color: #64748b; font-size: 12px; font-weight: bold;">إجمالي الرواتب الأساسية</div>
            <div style="font-size: 18px; font-weight: bold; font-family: 'Gotham Pro', sans-serif; font-weight: 900; color: #0f172a; margin-top: 5px;">${selectedRun.totalBasicSalary.toLocaleString('en-US')} ر.س</div>
          </div>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="color: #64748b; font-size: 12px; font-weight: bold;">إجمالي البدلات والمكتسبات</div>
            <div style="font-size: 18px; font-weight: bold; font-family: 'Gotham Pro', sans-serif; font-weight: 900; color: #4f46e5; margin-top: 5px;">+${selectedRun.totalAllowances.toLocaleString('en-US')} ر.س</div>
          </div>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="color: #64748b; font-size: 12px; font-weight: bold;">إجمالي الخصومات</div>
            <div style="font-size: 18px; font-weight: bold; font-family: 'Gotham Pro', sans-serif; font-weight: 900; color: #e11d48; margin-top: 5px;">-${selectedRun.totalDeductions.toLocaleString('en-US')} ر.س</div>
          </div>
          <div style="background: #0f172a; padding: 15px; border-radius: 8px; border: 1px solid #0f172a;">
            <div style="color: #94a3b8; font-size: 12px; font-weight: bold;">صافي الميزانية المصرفية للتحويل</div>
            <div style="font-size: 18px; font-weight: bold; font-family: 'Gotham Pro', sans-serif; font-weight: 900; color: #34d399; margin-top: 5px;">${selectedRun.totalNetSalary.toLocaleString('en-US')} ر.س</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 30px;">
          <thead>
            <tr>
              <th style="background-color: #0072BC; color: white; padding: 8px; border: 1px solid #cbd5e1; text-align: right;">رقم الإقامة/الهوية</th>
              <th style="background-color: #0072BC; color: white; padding: 8px; border: 1px solid #cbd5e1; text-align: right;">اسم الموظف</th>
              <th style="background-color: #0072BC; color: white; padding: 8px; border: 1px solid #cbd5e1; text-align: right;">المسمى الوظيفي</th>
              <th style="background-color: #0072BC; color: white; padding: 8px; border: 1px solid #cbd5e1; text-align: right;">الأساسي</th>
              <th style="background-color: #0072BC; color: white; padding: 8px; border: 1px solid #cbd5e1; text-align: right;">البدلات</th>
              <th style="background-color: #0072BC; color: white; padding: 8px; border: 1px solid #cbd5e1; text-align: right;">إضافي</th>
              <th style="background-color: #0072BC; color: white; padding: 8px; border: 1px solid #cbd5e1; text-align: right;">إجمالي الاستحقاق</th>
              <th style="background-color: #be123c; color: white; padding: 8px; border: 1px solid #cbd5e1; text-align: right;">إجمالي الخصم</th>
              <th style="background-color: #064e3b; color: white; padding: 8px; border: 1px solid #cbd5e1; text-align: right;">الصافي (ر.س)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px;">
          <div style="text-align: center; border: 1px dashed #cbd5e1; padding: 20px; border-radius: 8px; width: 30%;">
            توقيع المحاسب المالي<br/><br/><br/>
            _________________
          </div>
          <div style="text-align: center; border: 1px dashed #cbd5e1; padding: 20px; border-radius: 8px; width: 30%;">
            مراجعة وتدقيق المدير المالي<br/><br/><br/>
            _________________
          </div>
          <div style="text-align: center; border: 1px dashed #cbd5e1; padding: 20px; border-radius: 8px; width: 30%;">
            اعتماد المدير العام وصاحب العمل<br/><br/><br/>
            _________________
          </div>
        </div>
      </div>
    `;

    const opt = {
      margin:       10,
      filename:     `Payroll_${selectedRun.payrollNumber}_${selectedRun.month}_${selectedRun.year}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    html2pdf().from(element).set(opt).output('bloburl').then(function(pdfBlobUrl: string) {
      window.open(pdfBlobUrl, '_blank');
      
      showToast("✓ تم تصدير مسير الرواتب بصيغة PDF وفتحه في نافذة جديدة", "✓ Payroll PDF generated and opened", "success");
      logActionToAudit({
        action: "تصدير مسير PDF",
        payrollRunId: selectedRun.id,
        notes: `تم تصدير مسير رواتب شهر ${selectedRun.month}-${selectedRun.year} بالرقم ${selectedRun.payrollNumber} بصيغة PDF`,
      });
    });
  };


  // Calculate Net salary dynamically
  const calculateEmployeeNet = (emp: Partial<PayrollRunEmployee>) => {
    const basic = Number(emp.basicSalary || 0);
    const housing = Number(emp.housingAllowance || 0);
    const transport = Number(emp.transportAllowance || 0);
    const food = Number(emp.foodAllowance || 0);
    const otAmount = Number(emp.overtimeAmount || 0);
    const otherAllow = Number(emp.otherAllowances || 0);

    const entitlements = basic + housing + transport + otAmount;

    const loans = Number(emp.loansDeduction || 0);
    const gosi = Number(emp.gosiDeduction || 0);
    const absence = Number(emp.absenceDeduction || 0);
    const late = Number(emp.lateDeduction || 0);
    const penalty = Number(emp.penaltyDeduction || 0);
    const otherDeduct = Number(emp.otherDeductions || 0);

    const deductions = loans + gosi + absence + late + penalty + otherDeduct;
    const net = entitlements - deductions;

    return {
      totalEntitlements: entitlements,
      totalDeductions: deductions,
      netSalary: Math.max(0, net),
    };
  };

  // Create Payroll Run
  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRunForm.payrollNumber) return;

    try {
      // Check if the payroll number already exists (excluding deleted runs)
      const duplicateNumber = payrollRuns.find(
        (r) => r.payrollNumber?.trim() === newRunForm.payrollNumber?.trim() && !r.isDeleted
      );
      if (duplicateNumber) {
        showToast(
          "⚠️ رقم مسير الرواتب هذا موجود مسبقاً! يرجى كتابة أو توليد رقم مسير مختلف لتجنب التكرار.",
          "⚠️ This payroll number already exists! Please enter or generate a different payroll number to avoid duplication.",
          "error"
        );
        return;
      }

      // 1. Filter employees matching department or company
      const deptFiltered = employees.filter((emp) => {
        if (newRunForm.department === "جميع الأقسام" || newRunForm.department === "كلا الشركتين") return true;
        if (newRunForm.department === "شركة فنون الوليد" || newRunForm.department === "شركة ساين اكس") {
          return emp.company === newRunForm.department;
        }
        return emp.department === newRunForm.department;
      });

      if (deptFiltered.length === 0) {
        showToast(
          "⚠️ لا يوجد موظفين مسجلين في هذا القسم لإدراجهم في مسير الرواتب!",
          "⚠️ No employees registered under this department to pull into payroll!",
          "error"
        );
        return;
      }

      const runId = `RUN-${Date.now()}`;

      // 2. Map actual employees to the run
      const runEmps: PayrollRunEmployee[] = deptFiltered.map((emp) => {
        const basic = Number(emp.basicSalary || 0);
        const housing = Number(emp.allowances?.housing || 0);
        const transport = Number(emp.allowances?.transport || 0);
        const food = Number(emp.allowances?.food || 0);
        const muddah = Number(emp.allowances?.muddah || 0);
        const otherAllowances = Number(emp.allowances?.otherAllowances || 0);

        // Fetch matching HR deductions for this employee for the chosen month and year
        const runMonthStr = newRunForm.month.toString().padStart(2, "0");
        const runYearMonth = `${newRunForm.year}-${runMonthStr}`;

        const matchingHrDeductions = hrDeductions.filter((d) => {
          return (
            d.employeeId === emp.id &&
            d.date &&
            d.date.startsWith(runYearMonth) &&
            (d.status === "confirmed" || d.status === "notified") &&
            Number(d.amount) > 0
          );
        });

        // Initialize deductions list from HR
        const fetchedDeductionsList: DeductionItem[] = matchingHrDeductions.map((d) => ({
          id: d.id || `DED-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          type: mapHrDeductionType(d.type),
          amount: Number(d.amount),
          reason: d.reason || "خصم مستورد من الموارد البشرية",
          source: "HR",
          sourceDeductionId: d.id,
          createdBy: d.createdBy || "HR System",
          createdAt: d.createdAt || new Date().toISOString(),
          updatedBy: "HR System",
          updatedAt: new Date().toISOString(),
        }));

        let absD = 0;
        let lateD = 0;
        let loanD = 0;
        let penD = 0;
        let otherD = 0;

        fetchedDeductionsList.forEach((item) => {
          if (item.type === "Absence Deduction") absD= item.amount;
          else if (item.type === "Late Deduction") lateD= item.amount;
          else if (item.type === "Loan Deduction") loanD= item.amount;
          else if (item.type === "Penalty Deduction") penD= item.amount;
          else otherD= item.amount;
        });

        // Calculate initial net
        const entitlements = basic + housing + transport + food + otherAllowances;
        const totalDeductionsSum = absD + lateD + loanD + penD + otherD;
        const net = entitlements - totalDeductionsSum;

        const bName = emp.bankName || "البنك الأهلي السعودي (SNB)";
        const bIban = toEnglishDigits(emp.iban || "");
        const bAccNum = toEnglishDigits(emp.accountNumber || "");
        const bSwift = toEnglishDigits(emp.swiftCode || "");
        const bMethod = emp.transferMethod || "SARIE";
        const bHolder = emp.accountHolderName || emp.arabicName || "";

        return {
          id: `PRE-${Date.now()}-${emp.id}`,
          payrollRunId: runId,
          employeeId: emp.id,
          arabicName: emp.arabicName || "",
          englishName: emp.englishName || "",
          jobTitle: emp.jobTitle || "",
          department: emp.department || "",
          company: emp.company || "",
          iqamaId: emp.iqamaId || "",
          basicSalary: basic,
          housingAllowance: housing,
          transportAllowance: transport,
          foodAllowance: food,
          muddahAmount: muddah,
          otherAllowances: otherAllowances,
          overtimeHours: 0,
          overtimeAmount: 0,
          absenceDeduction: absD,
          lateDeduction: lateD,
          loansDeduction: loanD,
          penaltyDeduction: penD,
          otherDeductions: otherD,
          gosiDeduction: 0,
          bankName: bName,
          iban: bIban,
          accountNumber: bAccNum,
          swiftCode: bSwift,
          transferMethod: bMethod,
          accountHolderName: bHolder,
          bankInfo: {
            bankName: bName,
            iban: bIban,
            accountNumber: bAccNum,
            swiftCode: bSwift,
            transferMethod: bMethod,
            accountHolderName: bHolder,
          },
          totalEntitlements: entitlements,
          totalDeductions: totalDeductionsSum,
          netSalary: net,
          deductionsList: fetchedDeductionsList,
        };
      });

      // 3. Compute totals
      const totalBasicSalary = runEmps.reduce((sum, item) => sum + item.basicSalary, 0);
      const totalAllowances = runEmps.reduce(
        (sum, item) =>
          sum + item.housingAllowance + item.transportAllowance + item.foodAllowance + item.overtimeAmount + item.otherAllowances,
        0
      );
      const totalDeductions = runEmps.reduce((sum, item) => sum + item.totalDeductions, 0);
      const totalNetSalary = runEmps.reduce((sum, item) => sum + item.netSalary, 0);

      const totalOvertimeHours = runEmps.reduce((sum, item) => sum + (item.overtimeHours || 0), 0);
      const totalOvertimeAmount = runEmps.reduce((sum, item) => sum + (item.overtimeAmount || 0), 0);

      const firstLog = appendAuditLog(
        runId,
        "انشاء مسير رواتب",
        `تم إنشاء مسير رواتب جديد بالرقم ${newRunForm.payrollNumber} لشهر ${newRunForm.month}/${newRunForm.year}.`
      );

      const newRun: PayrollRun & {
        employees: PayrollRunEmployee[];
        auditLogs: PayrollAuditLog[];
        modificationRequests: PayrollModificationRequest[];
      } = {
        id: runId,
        payrollNumber: newRunForm.payrollNumber,
        month: Number(newRunForm.month),
        year: Number(newRunForm.year),
        salaryPeriod: newRunForm.salaryPeriod,
        department: newRunForm.department,
        status: "Draft",
        notes: newRunForm.notes,
        createdAt: new Date().toISOString(),
        createdBy: user.username || "System",
        updatedAt: new Date().toISOString(),
        employeesCount: runEmps.length,
        totalBasicSalary,
        totalAllowances,
        totalDeductions,
        totalNetSalary,
        totalOvertimeHours,
        totalOvertimeAmount,
        employees: runEmps,
        auditLogs: [firstLog],
        modificationRequests: [],
      };

      // Save to Firebase via backend
      const res = await fetch("/api/payroll_runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRun),
      });

      if (res.ok) {
        showToast(
          `✅ تم إنشاء مسير الرواتب المالي بنجاح ويحتوي على ${runEmps.length} موظف!`,
          `✅ Payroll run created successfully containing ${runEmps.length} employees!`,
          "success"
        );
        setIsCreateModalOpen(false);
        await loadPayrollRuns();
      } else {
        const errBody = await res.text(); throw new Error("API rejection: " + (errBody.length > 100 ? errBody.substring(0, 100) + "..." : errBody));
      }
    } catch (err) {
      showToast("❌ حدث خطأ أثناء الاتصال بالخادم وحفظ البيانات: " + err.message, "❌ Connection error saving data to server.", "error");
    }
  };

  // Open Payroll Run detail modal
  const handleOpenViewRun = (run: PayrollRun & any) => {
    // Dynamically transfer/sync the latest, up-to-date bank details from the Employee profiles
    const syncedRunEmployees = (run.employees || []).map((emp: PayrollRunEmployee) => {
      const freshEmp = (employees || []).find((e: any) => e.employeeId === emp.employeeId || e.id === emp.employeeId);
      if (freshEmp) {
        return {
          ...emp,
          bankName: freshEmp.bankName || emp.bankName || "",
          iban: freshEmp.iban || emp.iban || "",
          accountNumber: freshEmp.accountNumber || emp.accountNumber || "",
          swiftCode: freshEmp.swiftCode || emp.swiftCode || "",
          transferMethod: freshEmp.transferMethod || emp.transferMethod || "SARIE",
          accountHolderName: freshEmp.accountHolderName || emp.accountHolderName || "",
          bankInfo: {
            bankName: freshEmp.bankName || emp.bankName || (emp.bankInfo?.bankName || ""),
            iban: freshEmp.iban || emp.iban || (emp.bankInfo?.iban || ""),
            accountNumber: freshEmp.accountNumber || emp.accountNumber || (emp.bankInfo?.accountNumber || ""),
            swiftCode: freshEmp.swiftCode || emp.swiftCode || (emp.bankInfo?.swiftCode || ""),
            transferMethod: freshEmp.transferMethod || emp.transferMethod || (emp.bankInfo?.transferMethod || "SARIE"),
            accountHolderName: freshEmp.accountHolderName || emp.accountHolderName || (emp.bankInfo?.accountHolderName || ""),
          }
        };
      }
      return emp;
    });

    const updatedRun = {
      ...run,
      employees: syncedRunEmployees,
    };

    setSelectedRun(updatedRun);
    setRunEmployees(syncedRunEmployees);
    setRunAuditLogs(run.auditLogs || []);
    setRunModificationRequests(run.modificationRequests || []);
    setIsViewModalOpen(true);
  };

  // Delete Run (Soft Delete with status rules and reason)
  const handleDeleteRun = async (run: PayrollRun) => {
    // Approved, Transferred, Paid or Partially Paid payroll cannot be deleted unless the user is Super Admin / Top Management
    const terminalStatuses = ["Approved", "Transferred", "Paid", "Partially Paid", "Pending Final Approval"];
    if (terminalStatuses.includes(run.status) && !isSuperAdmin) {
      showToast(
        "❌ لا يمكن حذف هذا البند لأنه معتمد أو محول أو مدفوع بالفعل (تتطلب صلاحيات الإدارة العليا)!",
        "This item cannot be deleted because it is already approved, transferred, or paid (requires Top Management permissions).",
        "error"
      );
      // Log failed delete attempt in audit log
      logActionToAudit({
        action: "Failed Delete Attempt",
        payrollRunId: run.id,
        notes: `User tried to delete payroll run ${run.payrollNumber} in terminal status: ${run.status}`,
      });
      return;
    }

    // Payroll run can be deleted only if status is Draft, or if status is Needs Modification only by authorized users
    const isAuthorized = isSuperAdmin || isReviewer || isAccountant;
    if (run.status === "Needs Modification" && !isAuthorized) {
      showToast(
        "❌ غير مصرح لك بحذف هذا المسير في حالة طلب تعديل.",
        "❌ You are not authorized to delete this payroll when modifications are requested.",
        "error"
      );
      logActionToAudit({
        action: "Failed Delete Attempt",
        payrollRunId: run.id,
        notes: `User tried to delete payroll run ${run.payrollNumber} (Needs Modification) without authorization.`,
      });
      return;
    }

    if (run.status !== "Draft" && run.status !== "Needs Modification" && !isSuperAdmin) {
      showToast(
        "❌ لا يمكن حذف كشوف الرواتب غير المسودة (تتطلب صلاحيات الإدارة العليا).",
        "❌ Only draft or needs modification payroll runs can be deleted (requires Top Management permissions).",
        "error"
      );
      logActionToAudit({
        action: "Failed Delete Attempt",
        payrollRunId: run.id,
        notes: `User tried to delete payroll run ${run.payrollNumber} in status: ${run.status}`,
      });
      return;
    }

    if (run.status === "Draft") {
      if (true) { // Bypass confirm in iframe
        try {
          const deleteLog = appendAuditLog(
            run.id,
            "حذف مسير (حذف مؤقت)",
            `تم حذف مسير الرواتب بالرقم ${run.payrollNumber} مؤقتاً بواسطة المستخدم.`
          );

          const updatedRun = {
            ...run,
            isDeleted: true,
            deletedAt: new Date().toISOString(),
            deletedBy: user.username || user.id || "System",
            deleteReason: "حذف مباشر من المسودة",
            auditLogs: run.auditLogs ? [...run.auditLogs, deleteLog] : [deleteLog],
          };

          const res = await fetch(`/api/payroll_runs/${run.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedRun),
          });

          if (!res.ok) throw new Error("Failed to soft delete the run on server.");
          
          setPayrollRuns(payrollRuns.map(r => r.id === run.id ? updatedRun : r));
          
          showToast(
            "🗑️ تم حذف المسير بنجاح",
            "🗑️ Payroll Run deleted successfully",
            "success"
          );
        } catch (e) {
          console.error("Error deleting payroll run:", e);
          showToast("❌ حدث خطأ أثناء حذف المسير", "❌ Error deleting payroll run", "error");
        }
      }
      return;
    }

    setRunToDeleteId(run.id);
    setRunToDeleteStatus(run.status);
    setDeleteReasonText("");
    setIsDeleteReasonModalOpen(true);
  };

  const handleConfirmSoftDelete = async () => {
    if (!runToDeleteId) return;
    if (!deleteReasonText?.trim()) {
      showToast(
        "⚠️ سبب الحذف مطلوب لمتابعة العملية!",
        "⚠️ Deletion reason is required.",
        "error"
      );
      return;
    }

    try {
      const targetRun = payrollRuns.find((r) => r.id === runToDeleteId);
      if (!targetRun) return;

      const deleteLog = appendAuditLog(
        runToDeleteId,
        "حذف مسير (حذف مؤقت)",
        `تم حذف مسير الرواتب بالرقم ${targetRun.payrollNumber} مؤقتاً. سبب الحذف: "${deleteReasonText}"`
      );

      const updatedRun = {
        ...targetRun,
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: user.username || user.id || "System",
        deleteReason: deleteReasonText,
        auditLogs: targetRun.auditLogs ? [...targetRun.auditLogs, deleteLog] : [deleteLog],
      };

      const res = await fetch(`/api/payroll_runs/${runToDeleteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRun),
      });

      if (res.ok) {
        showToast(
          "✓ تم حذف مسير الرواتب بنجاح ونقله لسجل المحذوفات المؤقت.",
          "✓ Payroll run soft-deleted successfully.",
          "success"
        );
        
        // Log action in audit log
        await logActionToAudit({
          action: "Delete Payroll Run",
          payrollRunId: runToDeleteId,
          notes: `Soft deleted payroll run ${targetRun.payrollNumber}. Reason: ${deleteReasonText}`,
        });

        setIsDeleteReasonModalOpen(false);
        setRunToDeleteId(null);
        setDeleteReasonText("");
        await loadPayrollRuns();
      } else {
        throw new Error("Failed to soft delete on backend");
      }
    } catch (e) {
      console.error(e);
      showToast("❌ حدث خطأ أثناء الاتصال بالخادم وحفظ التعديلات.", "❌ Connection error during soft deletion.", "error");
    }
  };

  // Quick update for Mudad Amount from Detailed Payslip Modal
  const handleQuickUpdateMuddah = async (empId: string, muddahVal: number) => {
    if (!selectedRun) return;

    const targetEmp = runEmployees.find((e) => e.id === empId);
    if (!targetEmp) return;

    const basic = Number(targetEmp.basicSalary || 0);
    const housing = Number(targetEmp.housingAllowance || 0);
    const transport = Number(targetEmp.transportAllowance || 0);
    const food = Number(targetEmp.foodAllowance || 0);
    const otAmount = Number(targetEmp.overtimeAmount || 0);
    const otherAllow = Number(targetEmp.otherAllowances || 0);

    const loans = Number(targetEmp.loansDeduction || 0);
    const gosi = Number(targetEmp.gosiDeduction || 0);
    const absence = Number(targetEmp.absenceDeduction || 0);
    const late = Number(targetEmp.lateDeduction || 0);
    const penalty = Number(targetEmp.penaltyDeduction || 0);
    const otherDeduct = Number(targetEmp.otherDeductions || 0);

    const calculated = calculateEmployeeNet({
      ...targetEmp,
      basicSalary: basic,
      housingAllowance: housing,
      transportAllowance: transport,
      foodAllowance: food,
      muddahAmount: muddahVal,
      overtimeAmount: otAmount,
      otherAllowances: otherAllow,
      loansDeduction: loans,
      gosiDeduction: gosi,
      absenceDeduction: absence,
      lateDeduction: late,
      penaltyDeduction: penalty,
      otherDeductions: otherDeduct,
    });

    const updatedEmployee: PayrollRunEmployee = {
      ...targetEmp,
      muddahAmount: muddahVal,
      totalEntitlements: calculated.totalEntitlements,
      totalDeductions: calculated.totalDeductions,
      netSalary: calculated.netSalary,
    };

    const newEmployeesList = runEmployees.map((e) => (e.id === empId ? updatedEmployee : e));

    // Recompute total run figures
    const totalBasicSalary = newEmployeesList.reduce((sum, item) => sum + item.basicSalary, 0);
    const totalAllowances = newEmployeesList.reduce(
      (sum, item) =>
        sum + item.housingAllowance + item.transportAllowance + item.foodAllowance + item.overtimeAmount + item.otherAllowances,
      0
    );
    const totalDeductions = newEmployeesList.reduce((sum, item) => sum + item.totalDeductions, 0);
    const totalNetSalary = newEmployeesList.reduce((sum, item) => sum + item.netSalary, 0);

    const totalOvertimeHours = newEmployeesList.reduce((sum, item) => sum + (item.overtimeHours || 0), 0);
    const totalOvertimeAmount = newEmployeesList.reduce((sum, item) => sum + (item.overtimeAmount || 0), 0);

    const logDetails = `تم تحديث مبلغ مدد للموظف (${targetEmp.arabicName}) إلى ${muddahVal} ر.س تلقائياً من كشف الحساب.`;
    const newLog = appendAuditLog(selectedRun.id, "تحديث مبلغ مدد", logDetails);

    const updatedRun = {
      ...selectedRun,
      totalBasicSalary,
      totalAllowances,
      totalDeductions,
      totalNetSalary,
      totalOvertimeHours,
      totalOvertimeAmount,
      employees: newEmployeesList,
      auditLogs: [...runAuditLogs, newLog],
      updatedAt: new Date().toISOString(),
      updatedBy: user.username,
    };

    try {
      const res = await fetch(`/api/payroll_runs/${selectedRun.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRun),
      });

      if (res.ok) {
        setSelectedRun(updatedRun as any);
        setRunEmployees(newEmployeesList);
        setRunAuditLogs(updatedRun.auditLogs);
        setSelectedPayslipEmployee(updatedEmployee);
      }
    } catch (err) {
      console.error("Error updating Muddah from payslip modal:", err);
    }
  };

  // Save changes to employee values
  const handleSaveEmployeeRow = async (empId: string) => {
    if (!selectedRun) return;

    const targetEmp = runEmployees.find((e) => e.id === empId);
    if (!targetEmp) return;

    // Use edit values
    const basic = Number(editEmployeeForm.basicSalary ?? targetEmp.basicSalary ?? 0);
    const housing = Number(editEmployeeForm.housingAllowance ?? targetEmp.housingAllowance ?? 0);
    const transport = Number(editEmployeeForm.transportAllowance ?? targetEmp.transportAllowance ?? 0);
    const food = Number(editEmployeeForm.foodAllowance ?? targetEmp.foodAllowance ?? 0);
    const muddah = Number(editEmployeeForm.muddahAmount ?? targetEmp.muddahAmount ?? 0);
    const otHours = Number(editEmployeeForm.overtimeHours ?? targetEmp.overtimeHours ?? 0);
    const otAmount = Number(editEmployeeForm.overtimeAmount ?? targetEmp.overtimeAmount ?? 0);
    const otherAllow = Number(editEmployeeForm.otherAllowances ?? targetEmp.otherAllowances ?? 0);
    const otherAllowReason = editEmployeeForm.otherAllowancesReason ?? targetEmp.otherAllowancesReason ?? "";

    const bName = editEmployeeForm.bankName !== undefined ? editEmployeeForm.bankName : targetEmp.bankName;
    const bIban = editEmployeeForm.iban !== undefined ? editEmployeeForm.iban : targetEmp.iban;
    const bAcc = editEmployeeForm.accountNumber !== undefined ? editEmployeeForm.accountNumber : targetEmp.accountNumber;
    const bSwift = editEmployeeForm.swiftCode !== undefined ? editEmployeeForm.swiftCode : targetEmp.swiftCode;
    const bMethod = editEmployeeForm.transferMethod !== undefined ? editEmployeeForm.transferMethod : targetEmp.transferMethod;
    const bHolder = editEmployeeForm.accountHolderName !== undefined ? editEmployeeForm.accountHolderName : targetEmp.accountHolderName;

    const loans = Number(editEmployeeForm.loansDeduction ?? targetEmp.loansDeduction ?? 0);
    const loansReason = editEmployeeForm.loanDeductionReason ?? targetEmp.loanDeductionReason ?? "";
    
    const absence = Number(editEmployeeForm.absenceDeduction ?? targetEmp.absenceDeduction ?? 0);
    const absenceReason = editEmployeeForm.absenceDeductionReason ?? targetEmp.absenceDeductionReason ?? "";

    const late = Number(editEmployeeForm.lateDeduction ?? targetEmp.lateDeduction ?? 0);
    const lateReason = editEmployeeForm.lateDeductionReason ?? targetEmp.lateDeductionReason ?? "";

    const penalty = Number(editEmployeeForm.penaltyDeduction ?? targetEmp.penaltyDeduction ?? 0);
    const penaltyReason = editEmployeeForm.penaltyDeductionReason ?? targetEmp.penaltyDeductionReason ?? "";

    const gosi = Number(editEmployeeForm.gosiDeduction ?? targetEmp.gosiDeduction ?? 0);
    
    const otherDeduct = Number(editEmployeeForm.otherDeductions ?? targetEmp.otherDeductions ?? 0);
    const otherDeductReason = editEmployeeForm.deductionsReason ?? targetEmp.deductionsReason ?? "";

    // VALIDATE REASONS: If any is > 0 and reason is empty, block saving
    if (loans > 0 && !loansReason?.trim()) {
      showToast("⚠️ سبب الخصم مطلوب لكافة الاستقطاعات المفروضة! (السلفة)", "Deduction reason is required for loans.", "error");
      return;
    }
    if (absence > 0 && !absenceReason?.trim()) {
      showToast("⚠️ سبب الخصم مطلوب لكافة الاستقطاعات المفروضة! (الغياب)", "Deduction reason is required for absence.", "error");
      return;
    }
    if (late > 0 && !lateReason?.trim()) {
      showToast("⚠️ سبب الخصم مطلوب لكافة الاستقطاعات المفروضة! (التأخير)", "Deduction reason is required for late deduction.", "error");
      return;
    }
    if (penalty > 0 && !penaltyReason?.trim()) {
      showToast("⚠️ سبب الخصم مطلوب لكافة الاستقطاعات المفروضة! (الجزاءات)", "Deduction reason is required for penalties.", "error");
      return;
    }
    if (otherDeduct > 0 && !otherDeductReason?.trim()) {
      showToast("⚠️ سبب الخصم مطلوب لكافة الاستقطاعات المفروضة! (أخرى)", "Deduction reason is required for other deductions.", "error");
      return;
    }

    const calculated = calculateEmployeeNet({
      basicSalary: basic,
      housingAllowance: housing,
      transportAllowance: transport,
      foodAllowance: food,
      muddahAmount: muddah,
      overtimeAmount: otAmount,
      otherAllowances: otherAllow,
      loansDeduction: loans,
      gosiDeduction: gosi,
      absenceDeduction: absence,
      lateDeduction: late,
      penaltyDeduction: penalty,
      otherDeductions: otherDeduct,
    });

    const updatedEmployee: PayrollRunEmployee = {
      ...targetEmp,
      bankName: bName || "",
      iban: bIban || "",
      accountNumber: bAcc || "",
      swiftCode: bSwift || "",
      transferMethod: bMethod || "SARIE",
      accountHolderName: bHolder || "",
      bankInfo: {
        bankName: bName || "",
        iban: bIban || "",
        accountNumber: bAcc || "",
        swiftCode: bSwift || "",
        transferMethod: bMethod || "SARIE",
        accountHolderName: bHolder || "",
      },
      basicSalary: basic,
      housingAllowance: housing,
      transportAllowance: transport,
      foodAllowance: food,
      muddahAmount: muddah,
      overtimeHours: otHours,
      overtimeAmount: otAmount,
      otherAllowances: otherAllow,
      otherAllowancesReason: otherAllowReason,
      loansDeduction: loans,
      loanDeductionReason: loansReason,
      absenceDeduction: absence,
      absenceDeductionReason: absenceReason,
      lateDeduction: late,
      lateDeductionReason: lateReason,
      penaltyDeduction: penalty,
      penaltyDeductionReason: penaltyReason,
      gosiDeduction: gosi,
      otherDeductions: otherDeduct,
      deductionsReason: otherDeductReason,
      totalEntitlements: calculated.totalEntitlements,
      totalDeductions: calculated.totalDeductions,
      netSalary: calculated.netSalary,
    };

    const newEmployeesList = runEmployees.map((e) => (e.id === empId ? updatedEmployee : e));

    // Recompute total run figures
    const totalBasicSalary = newEmployeesList.reduce((sum, item) => sum + item.basicSalary, 0);
    const totalAllowances = newEmployeesList.reduce(
      (sum, item) =>
        sum + item.housingAllowance + item.transportAllowance + item.foodAllowance + item.overtimeAmount + item.otherAllowances,
      0
    );
    const totalDeductions = newEmployeesList.reduce((sum, item) => sum + item.totalDeductions, 0);
    const totalNetSalary = newEmployeesList.reduce((sum, item) => sum + item.netSalary, 0);

    const totalOvertimeHours = newEmployeesList.reduce((sum, item) => sum + (item.overtimeHours || 0), 0);
    const totalOvertimeAmount = newEmployeesList.reduce((sum, item) => sum + (item.overtimeAmount || 0), 0);

    const logDetails = `تم تعديل راتب الموظف (${targetEmp.arabicName}). الراتب الأساسي: ${basic}، إضافي: ${otAmount}، خصومات: ${calculated.totalDeductions}، الصافي: ${calculated.netSalary}.`;
    const newLog = appendAuditLog(selectedRun.id, "تعديل سطر موظف", logDetails);

    const updatedRun = {
      ...selectedRun,
      totalBasicSalary,
      totalAllowances,
      totalDeductions,
      totalNetSalary,
      totalOvertimeHours,
      totalOvertimeAmount,
      employees: newEmployeesList,
      auditLogs: [...runAuditLogs, newLog],
      updatedAt: new Date().toISOString(),
      updatedBy: user.username,
    };

    try {
      const res = await fetch(`/api/payroll_runs/${selectedRun.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRun),
      });

      if (res.ok) {
        // PRO SAVE: Automatically save/sync the updated bank details back to the permanent employee profile in Firestore database!
        if (targetEmp.employeeId) {
          const empPutData = {
            bankName: bName || "",
            iban: bIban || "",
            accountNumber: bAcc || "",
            swiftCode: bSwift || "",
            transferMethod: bMethod || "SARIE",
            accountHolderName: bHolder || "",
            bankInfo: {
              bankName: bName || "",
              iban: bIban || "",
              accountNumber: bAcc || "",
              swiftCode: bSwift || "",
              transferMethod: bMethod || "SARIE",
              accountHolderName: bHolder || "",
            }
          };

          await fetch(`/api/employees/${targetEmp.employeeId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(empPutData),
          }).catch((err) => console.error("Failed to update permanent employee bank info", err));
        }

        setSelectedRun(updatedRun as any);
        setRunEmployees(newEmployeesList);
        setRunAuditLogs(updatedRun.auditLogs);
        
        // Granular logging
        if (basic !== targetEmp.basicSalary) {
          logActionToAudit({ action: "Edit Employee Salary", payrollRunId: selectedRun.id, employeeId: empId, fieldName: "basicSalary", oldValue: targetEmp.basicSalary, newValue: basic, notes: `Basic salary of ${targetEmp.arabicName} updated` });
        }
        if (otHours !== targetEmp.overtimeHours) {
          logActionToAudit({ action: "Change Overtime Hours", payrollRunId: selectedRun.id, employeeId: empId, fieldName: "overtimeHours", oldValue: targetEmp.overtimeHours, newValue: otHours, notes: `Overtime hours of ${targetEmp.arabicName} updated` });
        }
        if (loans !== targetEmp.loansDeduction) {
          logActionToAudit({ action: "Change Deduction", payrollRunId: selectedRun.id, employeeId: empId, fieldName: "loansDeduction", oldValue: targetEmp.loansDeduction, newValue: loans, notes: `Loans deduction of ${targetEmp.arabicName} updated. Reason: ${loansReason}` });
        }
        if (absence !== targetEmp.absenceDeduction) {
          logActionToAudit({ action: "Change Deduction", payrollRunId: selectedRun.id, employeeId: empId, fieldName: "absenceDeduction", oldValue: targetEmp.absenceDeduction, newValue: absence, notes: `Absence deduction of ${targetEmp.arabicName} updated. Reason: ${absenceReason}` });
        }
        if (late !== targetEmp.lateDeduction) {
          logActionToAudit({ action: "Change Deduction", payrollRunId: selectedRun.id, employeeId: empId, fieldName: "lateDeduction", oldValue: targetEmp.lateDeduction, newValue: late, notes: `Late deduction of ${targetEmp.arabicName} updated. Reason: ${lateReason}` });
        }
        if (penalty !== targetEmp.penaltyDeduction) {
          logActionToAudit({ action: "Change Deduction", payrollRunId: selectedRun.id, employeeId: empId, fieldName: "penaltyDeduction", oldValue: targetEmp.penaltyDeduction, newValue: penalty, notes: `Penalty deduction of ${targetEmp.arabicName} updated. Reason: ${penaltyReason}` });
        }
        if (otherDeduct !== targetEmp.otherDeductions) {
          logActionToAudit({ action: "Change Deduction", payrollRunId: selectedRun.id, employeeId: empId, fieldName: "otherDeductions", oldValue: targetEmp.otherDeductions, newValue: otherDeduct, notes: `Other deduction of ${targetEmp.arabicName} updated. Reason: ${otherDeductReason}` });
        }

        setEditingEmployeeId(null);
        setEditEmployeeForm({});
        await loadPayrollRuns();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // State Transition Actions
  const transitionStatus = async (newStatus: PayrollRunStatus, logAction: string, logDetails: string, extraFields: any = {}) => {
    if (!selectedRun) return;

    const newLog = appendAuditLog(selectedRun.id, logAction, logDetails);
    const updatedRun = {
      ...selectedRun,
      ...extraFields,
      status: newStatus,
      auditLogs: [...runAuditLogs, newLog],
      updatedAt: new Date().toISOString(),
      updatedBy: user.username,
    };

    try {
      const res = await fetch(`/api/payroll_runs/${selectedRun.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRun),
      });

      if (res.ok) {
        setSelectedRun(updatedRun as any);
        setRunAuditLogs(updatedRun.auditLogs);
        await loadPayrollRuns();
        showToast(
          `✓ تم تحديث حالة مسير الرواتب بنجاح إلى (${newStatus})`,
          `✓ Payroll run status successfully updated to (${newStatus})`,
          "success"
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Re-import and Sync latest HR Deductions & Loans
  const handleRefreshHrDeductions = async () => {
    if (!selectedRun) return;
    try {
      setLoading(true);
      setIsSyncing(true);
      // Fetch latest deductions
      const resDeductions = await fetch("/api/deductions");
      if (!resDeductions.ok) {
        throw new Error("Failed to fetch fresh deductions list from HR");
      }
      const freshDeductions = await resDeductions.json();
      setHrDeductions(freshDeductions);

      // Fetch latest employee data to sync bank and allowances
      const resEmps = await fetch("/api/employees");
      const freshEmps = resEmps.ok ? await resEmps.json() : [];

      const runMonthStr = selectedRun.month.toString().padStart(2, "0");
      const runYearMonth = `${selectedRun.year}-${runMonthStr}`;

      // Update employees in selectedRun
      const updatedEmployees = selectedRun.employees.map((emp) => {
        // Find fresh HR data for this employee
        const freshEmp = freshEmps.find((e) => e.employeeId === emp.employeeId || e.id === emp.employeeId);

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
              id: d.id || `DED-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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
          if (item.type === "Absence Deduction") absD= item.amount;
          else if (item.type === "Late Deduction") lateD= item.amount;
          else if (item.type === "Loan Deduction") loanD= item.amount;
          else if (item.type === "Penalty Deduction") penD= item.amount;
          else otherD= item.amount;
        });

        // Sync fresh salary/allowance values if available
        let basicSalary = emp.basicSalary;
        let housing = emp.housingAllowance;
        let transport = emp.transportAllowance;
        let food = emp.foodAllowance;
        let muddah = emp.muddahAmount;
        
        let bankName = emp.bankName;
        let iban = emp.iban;
        let accountNumber = emp.accountNumber;
        let swiftCode = emp.swiftCode;
        let transferMethod = emp.transferMethod;
        let accountHolderName = emp.accountHolderName;

        if (freshEmp) {
           basicSalary = freshEmp.basicSalary !== undefined ? Number(freshEmp.basicSalary) : basicSalary;
           housing = (freshEmp.allowances && freshEmp.allowances.housing !== undefined) ? Number(freshEmp.allowances.housing) : housing;
           transport = (freshEmp.allowances && freshEmp.allowances.transport !== undefined) ? Number(freshEmp.allowances.transport) : transport;
           food = (freshEmp.allowances && freshEmp.allowances.food !== undefined) ? Number(freshEmp.allowances.food) : food;
           muddah = (freshEmp.allowances && freshEmp.allowances.muddah !== undefined) ? Number(freshEmp.allowances.muddah) : muddah;

           
           bankName = freshEmp.bankName || bankName;
           iban = freshEmp.iban || iban;
           accountNumber = freshEmp.accountNumber || accountNumber;
           swiftCode = freshEmp.swiftCode || swiftCode;
           transferMethod = freshEmp.transferMethod || transferMethod;
           accountHolderName = freshEmp.accountHolderName || accountHolderName;
        }

                const otherAllowances = (freshEmp && freshEmp.allowances && freshEmp.allowances.otherAllowances !== undefined) ? Number(freshEmp.allowances.otherAllowances) : (emp.otherAllowances || 0);
        const entitlements = Number(basicSalary || 0) +
          Number(housing || 0) +
          Number(transport || 0) +
          Number(emp.overtimeAmount || 0) +
          Number(food || 0) +
          Number(otherAllowances || 0);

        const totalDeductionsSum = absD + lateD + loanD + penD + otherD;
        const net = entitlements - totalDeductionsSum;

        return {
          ...emp,
          basicSalary,
          housingAllowance: housing,
          transportAllowance: transport,
          foodAllowance: food,
          muddahAmount: muddah,
          bankName,
          iban,
          accountNumber,
          swiftCode,
          transferMethod,
          accountHolderName,
          bankInfo: {
            bankName: bankName || "",
            iban: iban || "",
            accountNumber: accountNumber || "",
            swiftCode: swiftCode || "",
            transferMethod: transferMethod || "SARIE",
            accountHolderName: accountHolderName || "",
          },
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
          sum + (item.housingAllowance || 0) + (item.transportAllowance || 0) + (item.foodAllowance || 0) + (item.overtimeAmount || 0) + (item.otherAllowances || 0),
        0
      );
      const totalDeductions = updatedEmployees.reduce((sum, item) => sum + (item.totalDeductions || 0), 0);
      const totalNetSalary = updatedEmployees.reduce((sum, item) => sum + (item.netSalary || 0), 0);

      const updatedRun: PayrollRun = {
        ...selectedRun,
        employees: updatedEmployees,
        totalBasicSalary,
        totalAllowances,
        totalDeductions,
        totalNetSalary,
      };

      // Save to server
      const saveRes = await fetch(`/api/payroll_runs/${selectedRun.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRun),
      });

      if (saveRes.ok) {
        setSelectedRun(updatedRun);
        setPayrollRuns(payrollRuns.map((r) => (r.id === selectedRun.id ? updatedRun : r)));
        
        logActionToAudit({
          action: "تحديث استقطاعات الموارد البشرية",
          payrollRunId: selectedRun.id,
          notes: `إعادة تحديث ومزامنة خصومات الموظفين مع الموارد البشرية لشهر ${selectedRun.month}-${selectedRun.year}`,
        });

        showToast(
          "✓ تم تحديث ومزامنة استقطاعات الموارد البشرية بنجاح!",
          "✓ HR deductions refreshed and synchronized successfully!",
          "success"
        );
      } else {
        throw new Error("Failed to save refreshed payroll run to server");
      }
    } catch (e: any) {
      console.error(e);
      showToast(
        "❌ فشل تحديث الاستقطاعات من الموارد البشرية.",
        "❌ " + e.message,
        "error"
      );
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  // Remove employee row from draft
  const handleRemoveEmployeeRow = async (employeeId: string) => {
    if (!selectedRun) return;

    if (
      selectedRun.status !== "Draft" &&
      selectedRun.status !== "Needs Modification" &&
      selectedRun.status !== "Under Modification"
    ) {
      showToast(
        "❌ لا يمكن حذف الموظف إلا إذا كان المسير في حالة مسودة.",
        "❌ Cannot delete employee unless run is in draft state.",
        "error"
      );
      return;
    }

    const updatedEmployees = selectedRun.employees?.filter((e) => e.id !== employeeId) || [];

    const totalBasicSalary = updatedEmployees.reduce((sum, item) => sum + (item.basicSalary || 0), 0);
    const totalAllowances = updatedEmployees.reduce(
      (sum, item) =>
        sum + (item.housingAllowance || 0) + (item.transportAllowance || 0) + (item.foodAllowance || 0) + (item.overtimeAmount || 0) + (item.otherAllowances || 0),
      0
    );
    const totalDeductions = updatedEmployees.reduce((sum, item) => sum + (item.totalDeductions || 0), 0);
    const totalNetSalary = updatedEmployees.reduce((sum, item) => sum + (item.netSalary || 0), 0);

    const updatedRun: PayrollRun = {
      ...selectedRun,
      employees: updatedEmployees,
      totalBasicSalary,
      totalAllowances,
      totalDeductions,
      totalNetSalary,
    };

    try {
      setLoading(true);
      const res = await fetch(`/api/payroll_runs/${selectedRun.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRun),
      });

      if (res.ok) {
        setSelectedRun(updatedRun);
        setPayrollRuns(payrollRuns.map((r) => (r.id === selectedRun.id ? updatedRun : r)));
        
        logActionToAudit({
          action: "حذف موظف من المسير",
          payrollRunId: selectedRun.id,
          notes: `تم إزالة الموظف ${employeeId} من مسير الراتب`,
        });

        showToast(
          "✓ تم حذف الموظف من المسير بنجاح",
          "✓ Employee removed from payroll run successfully",
          "success"
        );
      } else {
        throw new Error("Failed to remove employee on backend");
      }
    } catch (e: any) {
      console.error(e);
      showToast("❌ فشل عملية الحذف", "❌ " + e.message, "error");
    } finally {
      setLoading(false);
    }
  };
  const handleSubmitForReview = () => {
    transitionStatus(
      "Pending Review",
      "إرسال للمراجعة",
      `تم إرسال مسير الرواتب رقم ${selectedRun?.payrollNumber} للمراجعة والتدقيق بواسطة المحاسب.`
    );
  };

  // Submit Modification Requests (Reviewer)
  const handleRequestModificationsSubmit = () => {
    if (!modRequestNotes?.trim()) return;

    const newRequest: PayrollModificationRequest = {
      id: `REQ-${Date.now()}`,
      payrollRunId: selectedRun!.id,
      requestedBy: user.username || "Reviewer",
      requestedAt: new Date().toISOString(),
      notes: modRequestNotes,
      status: "Open",
    };

    const newRequestsList = [...runModificationRequests, newRequest];
    setRunModificationRequests(newRequestsList);

    transitionStatus(
      "Needs Modification",
      "طلب تعديلات على المسير",
      `طلب مراجعة/تعديل من المدقق: "${modRequestNotes}"`,
      {
        modificationRequests: newRequestsList,
      }
    );

    setIsModRequestModalOpen(false);
    setModRequestNotes("");
  };

  // Close or Respond to Modification Requests
  const handleRespondToModRequestSubmit = () => {
    if (!selectedRequestForResponse || !modResponseNotes?.trim()) return;

    const updatedRequests = runModificationRequests.map((req) => {
      if (req.id === selectedRequestForResponse.id) {
        return {
          ...req,
          status: modResponseStatus,
          responseNotes: modResponseNotes,
          respondedBy: user.username,
          respondedAt: new Date().toISOString(),
        };
      }
      return req;
    });

    setRunModificationRequests(updatedRequests);

    // Determine status of entire run
    const hasAnyOpen = updatedRequests.some((r) => r.status === "Open");
    const nextRunStatus: PayrollRunStatus = hasAnyOpen ? "Under Modification" : "Reviewed";

    transitionStatus(
      nextRunStatus,
      "الرد على طلب التعديل",
      `تم تسجيل رد المحاسب على طلب التعديل: "${modResponseNotes}" بقفل الحالة كـ (${modResponseStatus})`,
      {
        modificationRequests: updatedRequests,
      }
    );

    setIsModResponseModalOpen(false);
    setSelectedRequestForResponse(null);
    setModResponseNotes("");
  };

  // Confirm Review (Reviewer locks review)
  const handleConfirmReview = () => {
    // Make sure all mod requests are closed
    const openRequests = runModificationRequests.filter((r) => r.status === "Open");
    if (openRequests.length > 0) {
      showToast(
        "⚠️ لا يمكن إتمام المراجعة والتدقيق لوجود طلبات تعديل معلّقة ومفتوحة!",
        "⚠️ Cannot confirm review because there are open pending modification requests!",
        "error"
      );
      return;
    }

    transitionStatus(
      "Pending Final Approval",
      "تأكيد مراجعة المسير",
      `قام المراجع/المدقق بتأكيد واغلاق مراجعة مسير الرواتب بالكامل وجاهزيته للاعتماد النهائي.`
    );
  };

  // Final Approval (General Manager / Authorized Admin locks the entire run)
  const handleFinalApproval = () => {
    transitionStatus(
      "Approved",
      "الاعتماد النهائي للمسير",
      `تم الاعتماد المالي النهائي والقطعي لمسير الرواتب بواسطة الإدارة العليا وصاحب الصلاحية.`,
      {
        approvedAt: new Date().toISOString(),
        approvedBy: user.username,
      }
    );
  };

  // Register Transfer Details
  const handleRegisterTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.referenceNumber?.trim()) {
      showToast("⚠️ يرجى إدخال رقم المرجع المصرفي لتوثيق الحوالة!", "⚠️ Bank reference number is required!", "error");
      return;
    }

    transitionStatus(
      "Transferred",
      "تسجيل تحويل الرواتب",
      `تم توثيق تحويل الرواتب للمصرف بمرجع حوالة رقم (${transferForm.referenceNumber}) على البنك (${transferForm.bankName}) بتاريخ ${transferForm.transferDate}.`,
      {
        transferredAt: new Date().toISOString(),
        transferredBy: user.username,
        transferDetails: {
          bankName: transferForm.bankName,
          referenceNumber: transferForm.referenceNumber,
          transferDate: transferForm.transferDate,
          notes: transferForm.notes,
        },
      }
    );

    setIsTransferModalOpen(false);
  };

  // Filters application
  const filteredRuns = payrollRuns.filter((run) => {
    // 1. Strict Soft Delete Filter
    if (run.isDeleted) return false;

    const query = (searchQuery || '').trim().toLowerCase();
    const matchesSearch =
      (run.payrollNumber || '').toLowerCase().includes(query) ||
      (run.notes || '').toLowerCase().includes(query) ||
      (run.department || '').toLowerCase().includes(query);

    const matchesYear = filterYear === "all" || run.year.toString() === filterYear;
    const matchesMonth = filterMonth === "all" || run.month.toString() === filterMonth;
    const matchesDept = filterDept === "all" || run.department === filterDept;

    // 2. Strict Tab Workflows
    let matchesTab = true;
    if (activeTab === "drafts") {
      matchesTab = ["Draft", "Needs Modification", "Under Modification"].includes(run.status);
    } else if (activeTab === "pending") {
      matchesTab = ["Pending Review", "Reviewed"].includes(run.status);
    } else if (activeTab === "approved") {
      matchesTab = ["Approved", "Pending Final Approval"].includes(run.status);
    } else if (activeTab === "paid") {
      matchesTab = ["Transferred", "Paid", "Partially Paid"].includes(run.status);
    } else if (activeTab === "all") {
      matchesTab = true; // All active/archived runs
    }

    return matchesSearch && matchesYear && matchesMonth && matchesDept && matchesTab;
  });

  // Departments list for filter
  const departments = Array.from(new Set(employees.map((e) => e.department))).filter(Boolean);

  // Month Translation
  const getMonthName = (m: number) => {
    const monthsAr = [
      "يناير (01)",
      "فبراير (02)",
      "مارس (03)",
      "أبريل (04)",
      "مايو (05)",
      "يونيو (06)",
      "يوليو (07)",
      "أغسطس (08)",
      "سبتمبر (09)",
      "أكتوبر (10)",
      "نوفمبر (11)",
      "ديسمبر (12)",
    ];
    return monthsAr[m - 1] || m.toString();
  };

  const getStatusBadge = (status: PayrollRunStatus) => {
    switch (status) {
      case "Draft":
        return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[11px] font-black border w-full block whitespace-nowrap text-center border-slate-300">مسودة 📂</span>;
      case "Pending Review":
        return <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[11px] font-black border w-full block whitespace-nowrap text-center border-amber-350 animate-pulse">قيد المراجعة 🔍</span>;
      case "Needs Modification":
        return <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full text-[11px] font-black border w-full block whitespace-nowrap text-center border-rose-300 animate-bounce">طلب تعديل ⚠️</span>;
      case "Under Modification":
        return <span className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full text-[11px] font-black border w-full block whitespace-nowrap text-center border-orange-300">جاري التعديل 🛠️</span>;
      case "Reviewed":
        return <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[11px] font-black border w-full block whitespace-nowrap text-center border-blue-300">تمت المراجعة ✓</span>;
      case "Pending Final Approval":
        return <span className="bg-cyan-50 text-cyan-700 px-2.5 py-1 rounded-full text-[11px] font-black border w-full block whitespace-nowrap text-center border-cyan-300 animate-pulse">بانتظار الاعتماد ⏳</span>;
      case "Approved":
        return <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-black border w-full block whitespace-nowrap text-center border-emerald-300">معتمد نهائياً 👑</span>;
      case "Transferred":
        return <span className="bg-purple-100 text-purple-850 px-2.5 py-1 rounded-full text-[11px] font-black border w-full block whitespace-nowrap text-center border-purple-300">تم التحويل بنجاح 💸</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[11px] font-bold">{status}</span>;
    }
  };

  // Open Overtime hours entry
  const updateHourlyOtAmount = (hours: number, baseSalary: number) => {
    // Saudi Labor Law overtime formula: Hourly rate = (Basic Salary / 30) / 8.
    // Overtime compensation = Hourly rate * hours * 1.5.
    const hourlyRate = (baseSalary / 30) / 8;
    const otPay = hourlyRate * hours * 1.5;
    return Math.round(otPay * 100) / 100;
  };


  const handleExportPayslipPDF = () => {
    if (!selectedPayslipEmployee || !selectedRun) return;

    // Use the same htmlContent but pass it to html2pdf
    const element = document.createElement("div");
    // We duplicate the HTML without html/body tags to render it
    element.innerHTML = `
      <style>
    @import url('https://fonts.cdnfonts.com/css/ge-ss-two');
    @import url('https://fonts.cdnfonts.com/css/gotham-pro');
  </style>
  <div style="font-family: 'GE SS', 'GE SS Two', 'GE SS Two', 'Gotham Pro', sans-serif; direction: rtl; padding: 20px; color: #0f172a; max-width: 800px; margin: 0 auto; background: white;">
        <div style="display: flex; justify-content: space-between; border-bottom: 3px solid #0072BC; padding-bottom: 20px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 15px;">
    <img src="https://i.postimg.cc/0jQj3XVc/Alwaleed-Logo-Vertical-Blue.png" referrerpolicy="no-referrer" alt="Fonoun Alwaleed Logo" style="width: 120px; height: 120px; object-fit: contain;" />
    <div>
      <h1 style="color: #0072BC; margin: 0; font-size: 24px; font-weight: 900;">شركة فنون الوليد للصناعة</h1>
            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">مسير رواتب موظفي وعمال المصنع</p>
    </div>
  </div>
          <div style="text-align: left;">
            <h2 style="margin: 0; font-size: 20px; color: #0f172a;">كشف راتب موظف (Payslip)</h2>
            <div style="font-size: 14px; color: #64748b; margin-top:4px;">شهر ${selectedRun.month} - ${selectedRun.year}</div>
            <div style="font-size: 11px; color: #64748b; margin-top:4px;">كود المسير: ${selectedRun?.payrollNumber}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size: 13px; line-height: 1.8;">
          <div>
            <div><strong>اسم الموظف:</strong> <span style="color: #0f172a; font-weight: 900;">${selectedPayslipEmployee.arabicName}</span></div>
            <div><strong>المسمى الوظيفي:</strong> ${selectedPayslipEmployee.jobTitle}</div>
            <div><strong>رقم الهوية / الإقامة:</strong> ${selectedPayslipEmployee.iqamaId}</div>
            <div><strong>القسم / الورشة:</strong> ${selectedPayslipEmployee.department}</div>
            <div><strong>اسم البنك والفرع:</strong> ${selectedPayslipEmployee.bankName || (selectedPayslipEmployee.bankInfo && selectedPayslipEmployee.bankInfo.bankName) || ""}</div>
            <div><strong>الحساب الدولي (IBAN):</strong> <span style="font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${selectedPayslipEmployee.iban || (selectedPayslipEmployee.bankInfo && selectedPayslipEmployee.bankInfo.iban) || ""}</span></div>
            <div><strong>رقم الحساب:</strong> <span style="font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${selectedPayslipEmployee.accountNumber || (selectedPayslipEmployee.bankInfo && selectedPayslipEmployee.bankInfo.accountNumber) || ""}</span></div>
            <div><strong>رمز السويفت (SWIFT):</strong> <span style="font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${selectedPayslipEmployee.swiftCode || (selectedPayslipEmployee.bankInfo && selectedPayslipEmployee.bankInfo.swiftCode) || ""}</span></div>
            <div><strong>طريقة التحويل المالي:</strong> ${selectedPayslipEmployee.transferMethod || (selectedPayslipEmployee.bankInfo && selectedPayslipEmployee.bankInfo.transferMethod) || ""}</div>
            <div><strong>اسم صاحب الحساب:</strong> ${selectedPayslipEmployee.accountHolderName || (selectedPayslipEmployee.bankInfo && selectedPayslipEmployee.bankInfo.accountHolderName) || selectedPayslipEmployee.arabicName || ""}</div>
            <div><strong>تاريخ الطباعة:</strong> ${new Date().toLocaleDateString('en-US')}</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 13px;">
          <thead>
            <tr>
              <th style="background-color: #0072BC; color: white; padding: 12px; border: 1px solid #cbd5e1; text-align: right;">الاستحقاقات (Earnings)</th>
              <th style="background-color: #0072BC; color: white; padding: 12px; border: 1px solid #cbd5e1; text-align: right;">المبلغ (ر.س)</th>
              <th style="background-color: #be123c; color: white; padding: 12px; border: 1px solid #cbd5e1; text-align: right;">الاستقطاعات (Deductions)</th>
              <th style="background-color: #be123c; color: white; padding: 12px; border: 1px solid #cbd5e1; text-align: right;">المبلغ (ر.س)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1;">الراتب الأساسي المستحق</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${selectedPayslipEmployee.basicSalary.toLocaleString('en-US')}</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1;">استقطاع السلف المالية والعهود</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${selectedPayslipEmployee.loansDeduction.toLocaleString('en-US')}</td>
            </tr>
            <tr>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1;">بدل السكن المتفق عليه</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${selectedPayslipEmployee.housingAllowance.toLocaleString('en-US')}</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1;">استقطاع التأمينات الاجتماعية (GOSI)</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${selectedPayslipEmployee.gosiDeduction.toLocaleString('en-US')}</td>
            </tr>
            <tr>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1;">بدل الانتقال / المواصلات</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${selectedPayslipEmployee.transportAllowance.toLocaleString('en-US')}</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1;">خصومات الغياب بدون عذر</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${(selectedPayslipEmployee.absenceDeduction || 0).toLocaleString('en-US')}</td>
            </tr>
            <tr>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1;">بدل الإعاشة / الطعام</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${(selectedPayslipEmployee.foodAllowance || 0).toLocaleString('en-US')}</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1;">خصومات التأخير</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${(selectedPayslipEmployee.lateDeduction || 0).toLocaleString('en-US')}</td>
            </tr>
            <tr>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1;">مكافآت العمل الإضافي (Overtime)</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${(selectedPayslipEmployee.overtimeAmount || 0).toLocaleString('en-US')}</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1;">الجزاءات والعقوبات (Penalties)</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${(selectedPayslipEmployee.penaltyDeduction || 0).toLocaleString('en-US')}</td>
            </tr>
            <tr>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1;">بدل الجوال بدلات أخرى / مُدد</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${((selectedPayslipEmployee.otherAllowances || 0) ).toLocaleString('en-US')}</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1;">استقطاعات أخرى</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${(selectedPayslipEmployee.otherDeductions || 0).toLocaleString('en-US')}</td>
            </tr>
            <tr>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; background-color: #f8fafc; font-weight: bold; font-size: 14px; text-align: left;">إجمالي الاستحقاقات:</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; background-color: #f8fafc; font-weight: bold; font-family: 'Gotham Pro', sans-serif; font-weight: 900; font-size: 14px; color: #0072BC;">${selectedPayslipEmployee.totalEntitlements.toLocaleString('en-US')} ر.س</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; background-color: #fff1f2; font-weight: bold; font-size: 14px; text-align: left;">إجمالي الاستقطاعات:</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; background-color: #fff1f2; font-weight: bold; font-family: 'Gotham Pro', sans-serif; font-weight: 900; font-size: 14px; color: #be123c;">${selectedPayslipEmployee.totalDeductions.toLocaleString('en-US')} ر.س</td>
            </tr>
          </tbody>
        </table>

        <div style="background-color: #020617; color: white; padding: 20px; border-radius: 12px; display: flex; flex-direction: column; gap: 10px; margin-bottom: 30px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; border-bottom: 1px solid #1e293b; padding-bottom: 8px;">
            <span style="color: #94a3b8;">إجمالي الصافي (Total Net Salary before Muddah):</span>
            <span style="font-weight: 900; font-family: 'Gotham Pro', sans-serif;">${selectedPayslipEmployee.netSalary.toLocaleString('en-US')} ر.س</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; border-bottom: 1px solid #1e293b; padding-bottom: 8px;">
            <span style="color: #94a3b8;">مقتطع مدد المحول مسبقاً (Muddah Portion Paid):</span>
            <span style="font-weight: 900; font-family: 'Gotham Pro', sans-serif; color: #a5b4fc;">${(selectedPayslipEmployee.muddahAmount || 0).toLocaleString('en-US')} ر.س</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 5px;">
            <div>
              <h3 style="margin: 0; font-size: 16px; color: #38bdf8;">صافي الراتب المتبقي والمستحق للتحويل البنكي</h3>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">(Net Remaining Salary Payable)</p>
            </div>
            <div style="font-size: 26px; font-weight: 900; font-family: 'Gotham Pro', sans-serif; color: #34d399;">
              ${Math.max(0, selectedPayslipEmployee.netSalary - (selectedPayslipEmployee.muddahAmount || 0)).toLocaleString('en-US')} ر.س
            </div>
          </div>
        </div>

        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; font-size:11px; color:#475569; margin-bottom: 30px;">
          <strong>تنويه نظامي:</strong> يعتبر كشف الراتب الصادر من منصة الإدارة لشركة فنون الوليد وثيقة رسمية معتمدة تثبت تحويل وقيد المستحقات المالية للموظف بالمرجع البنكي المعتمد إلكترونياً، وتطابق أحكام عقود العمل المصادق عليها عبر منصة قوى بوزارة الموارد البشرية.
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px;">
          <div style="text-align: center; border: 1px dashed #cbd5e1; padding: 20px; border-radius: 8px; width: 45%;">
            توقيع المحاسب المالي للشركة<br/><br/><br/>
            _________________
          </div>
          <div style="text-align: center; border: 1px dashed #cbd5e1; padding: 20px; border-radius: 8px; width: 45%;">
            اعتماد المدير العام وصاحب العمل<br/><br/><br/>
            _________________
          </div>
        </div>
      </div>
    `;

    const opt = {
      margin:       10,
      filename:     `Payslip_${selectedPayslipEmployee.employeeId}_${selectedRun.month}_${selectedRun.year}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    html2pdf().from(element).set(opt).output('bloburl').then(function(pdfBlobUrl: string) {
      window.open(pdfBlobUrl, '_blank');
      
      showToast("✓ تم استخراج ملف PDF وفتحه للمعاينة", "✓ PDF preview opened successfully", "success");
      logActionToAudit({
        action: "تصدير مسير",
        payrollRunId: selectedRun.id,
        notes: `تم تصدير مسير الموظف ${selectedPayslipEmployee.arabicName} بصيغة PDF`,
      });
    });
  };

  return (
    <div className="space-y-6 md:col-span-1">
      {/* HEADER SECTION WITH STATS BAR */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#00AEEF]">
              <Building className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider font-mono">FINANCIAL ACCOUNTING DIVISION</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              مسيرات الرواتب الشهرية والتحويلات <span className="text-[#00AEEF]">💳</span>
            </h1>
            <p className="text-xs text-slate-400">
              إعداد، مراجعة، تدقيق واعتماد كشوفات رواتب الموظفين والعمال في المصنع وتوثيق التحويلات البنكية المباشرة.
            </p>
          </div>

          {isAccountant && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3.5 bg-gradient-to-r from-[#00AEEF] to-[#0072BC] hover:from-[#0072BC] hover:to-[#00AEEF] text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 group transform hover:scale-[1.02]"
            >
              <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
              إنشاء مسير رواتب شهري جديد ✨
            </button>
          )}
        </div>

        {/* METRIC BADGES CARD GROUP */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase">الرواتب المعلقة للمراجعة 🔍</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-black text-amber-500 font-mono">
                {payrollRuns.filter((r) => ["Pending Review", "Reviewed", "Pending Final Approval"].includes(r.status) && !r.isDeleted).length}
              </span>
              <span className="text-[10px] bg-amber-500/10 text-amber-500 font-bold px-1.5 py-0.5 rounded">معلّق</span>
            </div>
          </div>

          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase">المسيرات المعتمدة نهائياً 👑</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-black text-emerald-500 font-mono">
                {payrollRuns.filter((r) => r.status === "Approved" && !r.isDeleted).length}
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-bold px-1.5 py-0.5 rounded">معتمد</span>
            </div>
          </div>

          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase">أقسام المصنع الفعالة 🏭</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-black text-[#00AEEF] font-mono font-bold">
                {departments.length}
              </span>
              <span className="text-[10px] bg-cyan-500/10 text-[#00AEEF] font-bold px-1.5 py-0.5 rounded">ورشة</span>
            </div>
          </div>

          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase">إجمالي الحوالات الموثقة 💸</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-black text-indigo-400 font-mono">
                {payrollRuns.filter((r) => ["Transferred", "Partially Paid"].includes(r.status) && !r.isDeleted).length}
              </span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-1.5 py-0.5 rounded">محول</span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & WORKFLOW CONTROLS BOARD */}
      <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-4 top-3.5 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث برقم المسير، الملاحظات، أو قسم الموظفين..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0072BC] focus:bg-white transition-all text-xs text-slate-700"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Year Filter */}
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-mono font-bold"
            >
              <option value="all">جميع السنوات (All Years)</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>

            {/* Month Filter */}
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700"
            >
              <option value="all">جميع الأشهر (All Months)</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {getMonthName(i + 1)}
                </option>
              ))}
            </select>

            {/* Department Filter */}
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 max-w-[200px]"
            >
              <option value="all">جميع ورش وأقسام المصنع</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {/* Refresh button */}
            <button
              onClick={loadPayrollRuns}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-4.5 h-4.5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* WORKFLOW PHASE TABS */}
        <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pt-2">
          {[
            { id: "drafts", label: "مسودات قيد الإعداد 📝", count: payrollRuns.filter((r) => ["Draft", "Needs Modification", "Under Modification"].includes(r.status) && !r.isDeleted).length },
            { id: "pending", label: "بانتظار المراجعة 🔍", count: payrollRuns.filter((r) => ["Pending Review", "Reviewed"].includes(r.status) && !r.isDeleted).length },
            { id: "approved", label: "معتمدة وجاهزة للتحويل 👑", count: payrollRuns.filter((r) => ["Approved", "Pending Final Approval"].includes(r.status) && !r.isDeleted).length },
            { id: "paid", label: "مسيرات مكتملة ومحولة 💸", count: payrollRuns.filter((r) => ["Transferred", "Paid", "Partially Paid"].includes(r.status) && !r.isDeleted).length },
            { id: "all", label: "جميع المسيرات 🏛️", count: payrollRuns.filter((r) => !r.isDeleted).length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-4 text-sm font-black transition-all whitespace-nowrap border-b-2 ${
                activeTab === tab.id
                  ? "border-[#0072BC] text-[#0072BC] font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
              <span className="mr-1.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-mono font-bold">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* PAYROLL RUNS MAIN DATA LIST */}
      <div className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-24 text-center">
            <span className="w-10 h-10 border-4 border-[#0072BC] border-t-transparent rounded-full animate-spin inline-block mb-3"></span>
            <p className="text-base text-slate-400 font-bold">جاري تحميل مسيرات الرواتب والعمليات البنكية للمصنع...</p>
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="py-20 text-center text-slate-400 space-y-3">
            <span className="text-4xl">📂</span>
            <h3 className="text-sm font-black text-slate-700">لا توجد مسيرات رواتب في هذا التبويب</h3>
            <p className="text-xs max-w-md mx-auto">
              لم نجد أي كشوف رواتب تطابق معايير التصفية والبحث الحالية في أرشيف المعاملات المالية للشركة.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[15px] text-right font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-[12px] tracking-wider font-bold">
                  <th className="py-4 px-6 text-right">رقم المسير البرمجي</th>
                  <th className="py-4 px-4 text-right">فترة الاستحقاق</th>
                  <th className="py-4 px-4 text-right">التغطية الإدارية</th>
                  <th className="py-4 px-4 text-right">عدد الموظفين</th>
                  <th className="py-4 px-4 text-right">إجمالي الرواتب الأساسية</th>
                  <th className="py-4 px-4 text-right">البدلات والمستحقات</th>
                  <th className="py-4 px-4 text-right">إجمالي الاستقطاعات</th>
                  <th className="py-4 px-4 text-right text-emerald-600 font-bold">صافي المستحق النهائي</th>
                  <th className="py-4 px-4 text-center">حالة التدقيق</th>
                  <th className="py-4 px-6 text-left">التحكم والإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900 text-[16px]">
                      {run.payrollNumber}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-[15px]">{getMonthName(run.month)}</div>
                      <div className="text-[11px] text-slate-400">سنة {run.year}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 bg-cyan-50 text-cyan-800 rounded-lg font-bold border border-cyan-150 text-[13px]">
                        {run.department}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-700">
                      {run.employeesCount} موظف
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-slate-700">
                      {formatMoney(run.totalBasicSalary)} ر.س
                    </td>
                    <td className="py-4 px-4 font-mono text-indigo-600 font-bold">
                     {formatMoney(run.totalAllowances)} ر.س
                    </td>
                    <td className="py-4 px-4 font-mono text-rose-600 font-bold">
                      -{formatMoney(run.totalDeductions)} ر.س
                    </td>
                    <td className="py-4 px-4 font-mono text-emerald-600 font-black text-[16px]">
                      {formatMoney(run.totalNetSalary)} ر.س
                    </td>
                    <td className="py-4 px-4 text-center">
                      {getStatusBadge(run.status)}
                    </td>
                    <td className="py-4 px-6 text-left">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => handleOpenViewRun(run)}
                          className="px-4 py-2 bg-[#0072BC] hover:bg-[#00AEEF] text-white rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-sm text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          <span>عرض وتعديل التفاصيل</span>
                        </button>

                        {(((run.status === "Draft" || run.status === "Needs Modification" || run.status === "Under Modification") && isAccountant) || isSuperAdmin) && (
                          <button
                            onClick={() => handleDeleteRun(run)}
                            className="p-2 text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-100 rounded-xl transition-all shadow-sm"
                            title="حذف المسير"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE NEW RUN DIALOG MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-3xl p-8 relative shadow-2xl border border-slate-100 animate-scale-up">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute left-6 top-6 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <span className="p-3 bg-blue-50 text-[#0072BC] rounded-2xl">
                <FileText className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-lg font-black text-slate-800">إعداد مسير رواتب شهري جديد</h3>
                <p className="text-xs text-slate-400">يقوم النظام بجلب بيانات وعقود الموظفين من الموارد البشرية وتوليد المسير فورياً.</p>
              </div>
            </div>

            <form onSubmit={handleCreateRun} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-bold text-slate-500">سنة المسير المستهدفة *</label>
                  <select
                    value={newRunForm.year}
                    onChange={(e) => setNewRunForm({ ...newRunForm, year: Number(e.target.value) })}
                    className="w-full px-3.5 py-3 border border-slate-250 rounded-xl font-mono font-bold"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-500">شهر الاستحقاق المالي *</label>
                  <select
                    value={newRunForm.month}
                    onChange={(e) => setNewRunForm({ ...newRunForm, month: Number(e.target.value) })}
                    className="w-full px-3.5 py-3 border border-slate-250 rounded-xl"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {getMonthName(i + 1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-500">رقم المسير المقترح (توليد تلقائي)</label>
                <input
                  type="text"
                  required
                  value={newRunForm.payrollNumber}
                  onChange={(e) => setNewRunForm({ ...newRunForm, payrollNumber: e.target.value })}
                  className="w-full px-3.5 py-3 border border-slate-250 rounded-xl font-mono text-slate-700 font-bold bg-slate-50"
                />
                <p className="text-[10.5px] text-[#0072BC] mt-1 font-bold">
                  ℹ️ يُسمح نظاماً بإنشاء أكثر من مسير رواتب لنفس الشهر طالما أن "رقم المسير" مختلف وفريد.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-bold text-slate-500">القسم المشمول بالمسير</label>
                  <select
                    value={newRunForm.department}
                    onChange={(e) => setNewRunForm({ ...newRunForm, department: e.target.value })}
                    className="w-full px-3.5 py-3 border border-slate-250 rounded-xl bg-white text-slate-800 font-bold text-xs"
                  >
                    <option value="كلا الشركتين">كلا الشركتين (جميع الموظفين)</option>
                    <option value="شركة فنون الوليد">شركة فنون الوليد</option>
                    <option value="شركة ساين اكس">شركة ساين اكس</option>
                    <option value="جميع الأقسام">جميع الأقسام والورش (All Staff)</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-500">دورة وفترة صرف الراتب</label>
                  <input
                    type="text"
                    required
                    value={newRunForm.salaryPeriod}
                    onChange={(e) => setNewRunForm({ ...newRunForm, salaryPeriod: e.target.value })}
                    className="w-full px-3.5 py-3 border border-slate-250 rounded-xl bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-500">ملاحظات توضيحية إضافية</label>
                <textarea
                  value={newRunForm.notes}
                  onChange={(e) => setNewRunForm({ ...newRunForm, notes: e.target.value })}
                  placeholder="أدخل أي ملاحظات خاصة بتعميد مسير هذا الشهر مثل الموظفين تحت المراجعة أو استبعاد الاستقالات..."
                  rows={3}
                  className="w-full px-3.5 py-3 border border-slate-250 rounded-xl focus:outline-none focus:border-[#0072BC]"
                />
              </div>

              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start gap-2.5">
                <span className="text-base text-blue-600">💡</span>
                <p className="text-[10px] text-blue-800 font-medium leading-relaxed">
                  <strong>تنويه الربط التلقائي:</strong> بمجرد الضغط على إنشاء المسير المالي، سيقوم النظام بالربط المباشر بجدول بيانات الكوادر للحصول على الرواتب الأساسية والبدلات، بالإضافة للتحقق من أرقام الحسابات البنكية (IBAN) وطرق الدفع المفضلة لتجهيز ملف التحويل المصرفي.
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors font-bold"
                >
                  إلغاء التراجع
                </button>
                <button
                  type="submit"
                  className="px-7 py-2.5 bg-gradient-to-r from-[#0072BC] to-[#00AEEF] text-white font-extrabold rounded-xl shadow-md transform active:scale-95 transition-all"
                >
                  ابدأ توليد وإعداد المسير 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED PAYROLL RUN VIEW MODAL */}
      {isViewModalOpen && selectedRun && (
        <div className="fixed inset-0 bg-slate-900/60 z-40 flex flex-col w-screen h-screen backdrop-blur-xs overflow-hidden select-none">
          <div className="flex flex-col w-full h-full bg-slate-50 relative overflow-hidden">
            {/* Sticky Workspace Header */}
            <div className="flex justify-between items-center bg-white px-6 py-4 border-b border-slate-200 shadow-sm z-10">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-sm font-black text-[#0072BC]">{selectedRun.payrollNumber}</span>
                  {getStatusBadge(selectedRun.status)}
                </div>
                <h3 className="text-base font-black text-slate-800 font-arabic">
                  تفاصيل كشف الرواتب لشهر {getMonthName(selectedRun.month)} - {selectedRun.year}
                </h3>
                <p className="text-[11px] text-slate-400 font-arabic">
                  التغطية: <strong className="text-slate-600">{selectedRun.department}</strong> | المنشئ: <strong className="text-slate-600">{selectedRun.createdBy}</strong> | تاريخ البدء: {new Date(selectedRun.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportPayrollPDF}
                  className="p-2.5 bg-rose-50 hover:bg-rose-100 rounded-xl text-rose-700 transition-colors flex items-center justify-center gap-1.5 text-xs font-bold font-arabic"
                  title="معاينة وطباعة PDF"
                >
                  <Printer className="w-5 h-5" />
                </button>

                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedRun(null);
                    logActionToAudit({
                      action: "إغلاق بيئة العمل",
                      payrollRunId: selectedRun.id,
                      notes: "قام المستخدم بإغلاق بيئة عمل مسير الرواتب"
                    });
                  }}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors"
                  title="إغلاق بيئة العمل"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Workspace Content Area - Split Layout */}
            <div className="flex flex-col flex-1 overflow-y-auto w-full p-6 h-[calc(100vh-140px)]">
              
              {/* Right Column: Dynamic Employee Table (Scrollable, Independent) */}
              <div className="w-full bg-white p-6 border border-slate-200 flex flex-col justify-between rounded-2xl shadow-sm mb-6">
                <div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 mb-4 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <span className="font-arabic">الميزانية الإجمالية التقديرية للمسير:</span>
                      <span className="font-mono text-emerald-600 font-extrabold text-sm">{selectedRun.totalNetSalary.toLocaleString('en-US')} ر.س</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedRun.status !== "Draft" && selectedRun.status !== "Transferred" && selectedRun.status !== "Partially Paid" && isAccountant && (
                        <button
                          onClick={() => {
                            if (true) { // Bypass confirm in iframe
                              transitionStatus(
                                "Draft",
                                "إعادة المسير لمسودة",
                                "قام المحاسب بإعادة فتح المسير وإعادته إلى حالة (مسودة) ليتمكن من التعديل عليه مجدداً."
                              );
                            }
                          }}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-extrabold rounded-xl text-xs transition-all flex items-center gap-1.5 font-arabic"
                        >
                          <RefreshCw className="w-4 h-4 text-slate-500" />
                          <span>إعادة فتح كـ مسودة للتعديل 📂</span>
                        </button>
                      )}

                      {["Draft", "Needs Modification", "Under Modification"].includes(selectedRun.status) && isAccountant && (
                        <>
                          <button
                            onClick={handleRefreshHrDeductions}
                            disabled={isSyncing}
                            className={`px-4 py-2 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 font-arabic ${
                              isSyncing 
                                ? "bg-[#0072BC]/70 cursor-not-allowed opacity-80" 
                                : "bg-[#0072BC] hover:bg-[#00AEEF] active:scale-95"
                            }`}
                            title="تحديث ومزامنة البيانات والخصومات المسجلة للموظفين من نظام الموارد البشرية مباشرة لهذا الشهر"
                          >
                            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : "hover:rotate-180 transition-transform duration-500"}`} />
                            <span>{isSyncing ? "جاري مزامنة البيانات..." : "مزامنة بيانات الموارد البشرية 🔄"}</span>
                          </button>

                          {selectedRun.status === "Draft" && (
                            <button
                              onClick={handleSubmitForReview}
                              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 font-arabic"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              تقديم مسير الرواتب للمراجعة والتدقيق 🚀
                            </button>
                          )}
                        </>
                      )}

                      {selectedRun.status === "Pending Review" && isReviewer && (
                        <>
                          <button
                            onClick={() => setIsModRequestModalOpen(true)}
                            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-extrabold rounded-xl text-xs transition-all flex items-center gap-1.5 font-arabic"
                          >
                            <AlertCircle className="w-4 h-4" />
                            طلب تعديلات على المسير ⚠️
                          </button>

                          <button
                            onClick={handleConfirmReview}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 font-arabic"
                          >
                            <UserCheck className="w-4 h-4" />
                            مصادقة التدقيق وتأكيد الجاهزية ✓
                          </button>
                        </>
                      )}

                      {(selectedRun.status === "Needs Modification" || selectedRun.status === "Under Modification") && isAccountant && (
                        <button
                          onClick={() => {
                            const openReqs = runModificationRequests.filter((r) => r.status === "Open");
                            if (openReqs.length > 0) {
                              showToast(
                                "⚠️ يرجى حل كافة طلبات التعديل والرد عليها أولاً قبل إرسال كشف الرواتب مرة أخرى للمراجعة!",
                                "⚠️ Please address and respond to all modification requests before re-submitting!",
                                "error"
                              );
                              return;
                            }
                            handleSubmitForReview();
                          }}
                          className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 font-arabic"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          إرسال لتأكيد المراجعة بعد التعديل 🚀
                        </button>
                      )}

                      {selectedRun.status === "Pending Final Approval" && isReviewer && (
                        <button
                          onClick={handleFinalApproval}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 font-arabic"
                        >
                          <UserCheck className="w-4 h-4" />
                          الاعتماد النهائي والقطعي للمسير 👑
                        </button>
                      )}

                      {selectedRun.status === "Approved" && isPayer && (
                        <>
                        <button
                          onClick={() => {
                            // Save isTransferred to server/selectedRun
                            const updatedRun = {
                              ...selectedRun,
                              employees: runEmployees,
                              updatedAt: new Date().toISOString(),
                            };
                            fetch(`/api/payroll_runs/${selectedRun.id}`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(updatedRun),
                            }).then((res) => {
                              if (res.ok) {
                                setSelectedRun(updatedRun);
                                setPayrollRuns(payrollRuns.map(r => r.id === selectedRun.id ? updatedRun : r));
                                showToast("تم حفظ حالة التحويل للموظفين في قاعدة البيانات بنجاح! 💾", "Transfer statuses saved in database successfully!", "success");
                              } else {
                                showToast("❌ فشل حفظ التعديلات في السيرفر", "Failed to save to server", "error");
                              }
                            }).catch(() => {
                              showToast("❌ حدث خطأ في الشبكة", "Network error occurred", "error");
                            });
                          }}
                          className="px-5 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-extrabold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5 font-arabic"
                        >
                          <span>حفظ حالة التحويل (يدوي) 💾</span>
                        </button>
                        <button
                          onClick={() => {
        const allChecked = runEmployees.every(e => e.isTransferred);
        if (!allChecked) {
            showToast("يجب وضع علامة (تم التحويل) لجميع الموظفين قبل الاعتماد النهائي وإغلاق المسير", "Must mark all employees as transferred first", "error");
            return;
        }
        setIsTransferModalOpen(true);
    }}
                          className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 font-arabic"
                        >
                          <CreditCard className="w-4 h-4" />
                          تسجيل وتوثيق تحويل الرواتب للمصرف 💸
                        </button>
                        </>
                      )}
                    </div>
                  </div>

                  
      <div className="bg-slate-900 text-white p-4 font-black flex justify-between items-center text-xs rounded-t-2xl font-arabic">
                    <span>جدول بيانات وعقود الموظفين المستحقين الرواتب هذا الشهر</span>
                    <span className="bg-slate-800 px-3 py-1 rounded-full text-[#00AEEF] font-mono font-bold">{runEmployees.length} موظف</span>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-700">ترتيب:</label>
                        <select
                          value={sortFilter}
                          onChange={(e) => setSortFilter(e.target.value)}
                          className="p-2 border border-slate-200 rounded-lg text-xs text-black"
                        >
                          
                          <option value="highestSalary">أعلى راتب</option>
                          <option value="role">حسب الدور</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-700">تصفية البنك:</label>
                        <select
                          value={bankFilter}
                          onChange={(e) => setBankFilter(e.target.value)}
                          className="p-2 border border-slate-200 rounded-lg text-xs text-black"
                        >
                          <option value="All">الجميع</option>
                          {Array.from(new Set(runEmployees.map(e => e.bankName || "Cash"))).map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto border-x border-b border-slate-200 rounded-b-2xl">
                    <table className="w-full min-w-[2200px] text-xs sm:text-[13px] text-right font-sans border-collapse relative">
                      <thead className="sticky top-0 bg-slate-100 shadow-xs z-10 border-b border-slate-200">
                        <tr className="text-slate-700 font-extrabold text-xs uppercase bg-slate-100">
                          <th className="py-4 px-4 text-right sticky right-0 bg-slate-100 z-10 border-l border-slate-200">الموظف وبياناته</th>
                          <th className="py-4 px-4 text-right text-sky-800">الحساب البنكي 🏦</th>
                          <th className="py-4 px-3 text-right">الأساسي</th>
                          <th className="py-4 px-3 text-right">بدل سكن</th>
                          <th className="py-4 px-3 text-right">بدل نقل</th>
                          <th className="py-4 px-3 text-right">بدل إعاشة</th>
                          <th className="py-4 px-3 text-right text-indigo-600" style={{ display: 'none' }}>مبلغ مدد</th>
                          <th className="py-4 px-3 text-right text-indigo-600">أوفرتايم (س)</th>
                          <th className="py-4 px-3 text-right text-indigo-600">أوفرتايم (مبلغ)</th>
                          <th className="py-4 px-3 text-right text-[#0072BC]">بدلات أخرى</th>
                          <th className="py-4 px-3 text-right text-rose-600">خصم السلف</th>
                          <th className="py-4 px-3 text-right text-rose-600">خصم الغياب</th>
                          <th className="py-4 px-3 text-right text-rose-600">خصم التأخير</th>
                          <th className="py-4 px-3 text-right text-rose-600">خصم الجزاءات</th>
                          <th className="py-4 px-3 text-right text-rose-600">تأمينات GOSI</th>
                          <th className="py-4 px-3 text-right text-rose-600">خصومات أخرى</th>
                          <th className="py-4 px-3 text-right text-indigo-600 font-black">إجمالي الراتب</th>
                          <th className="py-4 px-3 text-right text-amber-600 font-black">مُدد</th>
                          <th className="py-4 px-3 text-right text-emerald-600 font-black">باقي الراتب</th>
                          <th className="py-4 px-3 text-center">تم التحويل؟</th>
                          <th className="py-4 px-4 text-left">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(() => {
                          let filtered = runEmployees.filter(e => bankFilter === "All" || (e.bankName || "Cash") === bankFilter);
                          
                          if (sortFilter === "highestSalary") {
                            filtered = filtered.sort((a, b) => (b.totalEntitlements || 0) - (a.totalEntitlements || 0));
                          } else if (sortFilter === "role") {
                            const roleOrder = {
                              "الإدارة العليا": 1,
                              "فراس": 2,
                              "إداري": 3,
                              "موظف": 4,
                              "عامل تصنيع": 5
                            };
                            filtered = filtered.sort((a, b) => {
                              const empA = employees.find(e => e.id === a.employeeId);
                              const empB = employees.find(e => e.id === b.employeeId);
                              const roleA = empA?.classification || "موظف";
                              const roleB = empB?.classification || "موظف";
                              const orderA = roleOrder[roleA as keyof typeof roleOrder] || 99;
                              const orderB = roleOrder[roleB as keyof typeof roleOrder] || 99;
                              return orderA - orderB;
                            });
                          }
                          
                          return filtered.map((emp) => {
                          const isEditing = editingEmployeeId === emp.id;
                          const canModifyRow =
                            selectedRun.status === "Draft" ||
                            selectedRun.status === "Needs Modification" ||
                            selectedRun.status === "Under Modification";

                          // Live values in edit mode
                          const liveBasic = Number(editEmployeeForm.basicSalary !== undefined ? editEmployeeForm.basicSalary : (emp.basicSalary || 0));
                          const liveHousing = Number(editEmployeeForm.housingAllowance !== undefined ? editEmployeeForm.housingAllowance : (emp.housingAllowance || 0));
                          const liveTransport = Number(editEmployeeForm.transportAllowance !== undefined ? editEmployeeForm.transportAllowance : (emp.transportAllowance || 0));
                          const liveFood = Number(editEmployeeForm.foodAllowance !== undefined ? editEmployeeForm.foodAllowance : (emp.foodAllowance || 0));
                          const liveMuddah = Number(editEmployeeForm.muddahAmount !== undefined ? editEmployeeForm.muddahAmount : (emp.muddahAmount || 0));
                          const liveOtAmount = Number(editEmployeeForm.overtimeAmount !== undefined ? editEmployeeForm.overtimeAmount : (emp.overtimeAmount || 0));
                          const liveOtherAllow = Number(editEmployeeForm.otherAllowances !== undefined ? editEmployeeForm.otherAllowances : (emp.otherAllowances || 0));

                          const liveEntitlements = liveBasic + liveHousing + liveTransport + liveOtAmount;

                          const liveLoans = Number(editEmployeeForm.loansDeduction !== undefined ? editEmployeeForm.loansDeduction : (emp.loansDeduction || 0));
                          const liveAbsence = Number(editEmployeeForm.absenceDeduction !== undefined ? editEmployeeForm.absenceDeduction : (emp.absenceDeduction || 0));
                          const liveLate = Number(editEmployeeForm.lateDeduction !== undefined ? editEmployeeForm.lateDeduction : (emp.lateDeduction || 0));
                          const livePenalty = Number(editEmployeeForm.penaltyDeduction !== undefined ? editEmployeeForm.penaltyDeduction : (emp.penaltyDeduction || 0));
                          const liveGosi = Number(editEmployeeForm.gosiDeduction !== undefined ? editEmployeeForm.gosiDeduction : (emp.gosiDeduction || 0));
                          const liveOtherDeduct = Number(editEmployeeForm.otherDeductions !== undefined ? editEmployeeForm.otherDeductions : (emp.otherDeductions || 0));

                          const liveDeductions = liveLoans + liveAbsence + liveLate + livePenalty + liveGosi + liveOtherDeduct;
                          const liveNet = Math.max(0, liveEntitlements - liveDeductions);

                          const displayTotalSalary = isEditing ? liveNet : emp.netSalary;
                          const displayMuddah = isEditing ? liveMuddah : (emp.muddahAmount || 0);
                          const displayRemaining = Math.max(0, displayTotalSalary - displayMuddah);

                          return (
                            <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-4 px-4 sticky right-0 bg-white z-5 border-l border-slate-200 shadow-xs">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-extrabold text-slate-900 text-xs sm:text-[13.5px]">{emp.arabicName}</span>
                                  {emp.company && (
                                    <span className={`px-1.5 py-0.5 text-[9px] font-black rounded-md border whitespace-nowrap ${
                                      emp.company.includes("ساين")
                                        ? "bg-purple-50 text-purple-700 border-purple-100"
                                        : "bg-blue-50 text-blue-700 border-blue-100"
                                    }`}>
                                      {emp.company}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10.5px] text-slate-500 font-mono font-bold mt-0.5">
                                  ID: {emp.employeeId} | {emp.jobTitle}
                                </div>
                              </td>

                              {/* BANK INFO */}
                              <td className="py-4 px-4 bg-sky-50/20">
                                {isEditing ? (
                                  <div className="space-y-1">
                                    <input
                                      type="text"
                                      value={editEmployeeForm.bankName ?? emp.bankName ?? ""}
                                      placeholder="اسم البنك"
                                      onChange={(e) =>
                                        setEditEmployeeForm({
                                          ...editEmployeeForm,
                                          bankName: e.target.value,
                                        })
                                      }
                                      className="w-28 px-2 py-1.5 border-2 border-sky-200 focus:border-sky-500 rounded-lg text-[10.5px] font-bold shadow-sm"
                                    />
                                    <input
                                      type="text"
                                      value={editEmployeeForm.iban ?? emp.iban ?? ""}
                                      placeholder="IBAN"
                                      onChange={(e) =>
                                        setEditEmployeeForm({
                                          ...editEmployeeForm,
                                          iban: e.target.value,
                                        })
                                      }
                                      className="w-44 px-2 py-1.5 border-2 border-sky-200 focus:border-sky-500 rounded-lg text-[10.5px] font-mono shadow-sm"
                                    />
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => {
                                      setSelectedBankEmployee(emp);
                                      setIsBankModalOpen(true);
                                      logActionToAudit({
                                        action: "عرض تفاصيل البنك",
                                        payrollRunId: selectedRun.id,
                                        employeeId: emp.id,
                                        notes: `عرض بيانات الحساب البنكي للموظف ${emp.arabicName}`
                                      });
                                    }}
                                    className="cursor-pointer group flex flex-col items-start hover:bg-sky-50 p-1.5 rounded-lg transition-all"
                                  >
                                    {(() => {
                                      const style = getBankStyle(emp.bankName || "");
                                      return (
                                        <span className={`${style.bg} text-[10px] font-extrabold px-2 py-0.5 rounded-full mb-1 border transition-all font-arabic flex items-center gap-1 shadow-xs`}>
                                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                          {emp.bankName || "—"}
                                        </span>
                                      );
                                    })()}
                                    <span className="text-[10px] font-mono text-slate-500 tracking-wider font-semibold select-all">
                                      {emp.iban || "—"}
                                    </span>
                                  </div>
                                )}
                              </td>

                              {/* BASIC */}
                              <td className="py-4 px-3 font-mono font-bold text-slate-700">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editEmployeeForm.basicSalary ?? emp.basicSalary}
                                    onChange={(e) =>
                                      setEditEmployeeForm({
                                        ...editEmployeeForm,
                                        basicSalary: Number(e.target.value),
                                      })
                                    }
                                    className="w-24 px-2 py-1.5 border-2 border-slate-300 focus:border-indigo-500 rounded-lg text-xs font-mono font-bold text-slate-900 text-center shadow-sm"
                                  />
                                ) : (
                                  emp.basicSalary.toLocaleString('en-US')
                                )}
                              </td>

                              {/* HOUSING */}
                              <td className="py-4 px-3 font-mono font-bold text-slate-700">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editEmployeeForm.housingAllowance ?? emp.housingAllowance}
                                    onChange={(e) =>
                                      setEditEmployeeForm({
                                        ...editEmployeeForm,
                                        housingAllowance: Number(e.target.value),
                                      })
                                    }
                                    className="w-24 px-2 py-1.5 border-2 border-slate-300 focus:border-indigo-500 rounded-lg text-xs font-mono font-bold text-slate-900 text-center shadow-sm"
                                  />
                                ) : (
                                  emp.housingAllowance.toLocaleString('en-US')
                                )}
                              </td>

                              {/* TRANSPORT */}
                              <td className="py-4 px-3 font-mono font-bold text-slate-700">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editEmployeeForm.transportAllowance ?? emp.transportAllowance}
                                    onChange={(e) =>
                                      setEditEmployeeForm({
                                        ...editEmployeeForm,
                                        transportAllowance: Number(e.target.value),
                                      })
                                    }
                                    className="w-24 px-2 py-1.5 border-2 border-slate-300 focus:border-indigo-500 rounded-lg text-xs font-mono font-bold text-slate-900 text-center shadow-sm"
                                  />
                                ) : (
                                  emp.transportAllowance.toLocaleString('en-US')
                                )}
                              </td>

                              {/* LIVING ALLOWANCE */}
                              <td className="py-4 px-3 font-mono font-bold text-slate-700">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editEmployeeForm.foodAllowance ?? emp.foodAllowance ?? 0}
                                    onChange={(e) =>
                                      setEditEmployeeForm({
                                        ...editEmployeeForm,
                                        foodAllowance: Number(e.target.value),
                                      })
                                    }
                                    className="w-24 px-2 py-1.5 border-2 border-slate-300 focus:border-indigo-500 rounded-lg text-xs font-mono font-bold text-slate-900 text-center shadow-sm"
                                  />
                                ) : (
                                  (emp.foodAllowance ?? 0).toLocaleString('en-US')
                                )}
                              </td>

                              {/* MUDDAH AMOUNT */}
                              <td className="py-4 px-3 font-mono text-indigo-600 font-bold" style={{ display: 'none' }}>
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editEmployeeForm.muddahAmount ?? emp.muddahAmount}
                                    onChange={(e) =>
                                      setEditEmployeeForm({
                                        ...editEmployeeForm,
                                        muddahAmount: Number(e.target.value),
                                      })
                                    }
                                    className="w-24 px-2 py-1.5 border-2 border-indigo-300 focus:border-indigo-500 rounded-lg text-xs font-mono font-bold text-indigo-900 text-center bg-indigo-50 shadow-sm"
                                  />
                                ) : (
                                  (emp.muddahAmount || 0).toLocaleString('en-US')
                                )}
                              </td>

                              {/* OVERTIME HOURS */}
                              <td className="py-4 px-3 font-mono font-bold text-indigo-600">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editEmployeeForm.overtimeHours ?? emp.overtimeHours}
                                    onChange={(e) => {
                                      const hrs = Number(e.target.value);
                                      const base = editEmployeeForm.basicSalary ?? emp.basicSalary;
                                      const pay = updateHourlyOtAmount(hrs, base);
                                      setEditEmployeeForm({
                                        ...editEmployeeForm,
                                        overtimeHours: hrs,
                                        overtimeAmount: pay,
                                      });
                                    }}
                                    className="w-20 px-2 py-1.5 border-2 border-slate-300 focus:border-indigo-500 rounded-lg text-xs font-mono font-bold text-slate-900 text-center shadow-sm"
                                  />
                                ) : (
                                  emp.overtimeHours
                                )}
                              </td>

                              {/* OVERTIME AMOUNT */}
                              <td className="py-4 px-3 font-mono text-indigo-600 font-bold">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editEmployeeForm.overtimeAmount ?? emp.overtimeAmount}
                                    onChange={(e) =>
                                      setEditEmployeeForm({
                                        ...editEmployeeForm,
                                        overtimeAmount: Number(e.target.value),
                                      })
                                    }
                                    className="w-24 px-2 py-1.5 border-2 border-slate-300 focus:border-indigo-500 rounded-lg text-xs font-mono font-bold text-slate-900 text-center shadow-sm"
                                  />
                                ) : (
                                  emp.overtimeAmount.toLocaleString('en-US')
                                )}
                              </td>

                              {/* OTHER ALLOWANCES */}
                              <td className="py-4 px-3 font-mono font-bold text-[#0072BC]">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editEmployeeForm.otherAllowances ?? emp.otherAllowances ?? 0}
                                    onChange={(e) =>
                                      setEditEmployeeForm({
                                        ...editEmployeeForm,
                                        otherAllowances: Number(e.target.value),
                                      })
                                    }
                                    className="w-24 px-2 py-1.5 border-2 border-slate-300 focus:border-indigo-500 rounded-lg text-xs font-mono font-bold text-slate-900 text-center shadow-sm"
                                  />
                                ) : (
                                  (emp.otherAllowances || 0).toLocaleString('en-US')
                                )}
                              </td>

                              {/* LOANS DEDUCTION */}
                              <td className="py-4 px-3 font-mono font-bold text-rose-600">
                                {isEditing ? (
                                  <div className="space-y-1">
                                    <input
                                      type="number"
                                      value={editEmployeeForm.loansDeduction ?? emp.loansDeduction}
                                      onChange={(e) =>
                                        setEditEmployeeForm({
                                          ...editEmployeeForm,
                                          loansDeduction: Number(e.target.value),
                                        })
                                      }
                                      className="w-24 px-2 py-1.5 border-2 border-slate-300 focus:border-indigo-500 rounded-lg text-xs font-mono font-bold text-slate-900 text-center shadow-sm"
                                    />
                                    <input
                                      type="text"
                                      value={editEmployeeForm.loanDeductionReason ?? emp.loanDeductionReason ?? ""}
                                      placeholder="السبب *"
                                      onChange={(e) =>
                                        setEditEmployeeForm({
                                          ...editEmployeeForm,
                                          loanDeductionReason: e.target.value,
                                        })
                                      }
                                      className="w-24 px-1.5 py-1 border border-slate-300 rounded text-[10px]"
                                    />
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => {
                                      if (emp.loansDeduction > 0) {
                                        setSelectedDeductionEmployee(emp);
                                        setClickedDeductionType("Loan");
                                        setIsDeductionModalOpen(true);
                                      }
                                    }}
                                    className={`${emp.loansDeduction > 0 ? "cursor-pointer hover:underline font-bold" : "text-slate-300"}`}
                                  >
                                    {emp.loansDeduction.toLocaleString('en-US')}
                                  </div>
                                )}
                              </td>

                              {/* ABSENCE DEDUCTION */}
                              <td className="py-4 px-3 font-mono font-bold text-rose-600">
                                {isEditing ? (
                                  <div className="space-y-1">
                                    <input
                                      type="number"
                                      value={editEmployeeForm.absenceDeduction ?? emp.absenceDeduction ?? 0}
                                      onChange={(e) =>
                                        setEditEmployeeForm({
                                          ...editEmployeeForm,
                                          absenceDeduction: Number(e.target.value),
                                        })
                                      }
                                      className="w-24 px-2 py-1.5 border-2 border-slate-300 focus:border-indigo-500 rounded-lg text-xs font-mono font-bold text-slate-900 text-center shadow-sm"
                                    />
                                    <input
                                      type="text"
                                      value={editEmployeeForm.absenceDeductionReason ?? emp.absenceDeductionReason ?? ""}
                                      placeholder="السبب *"
                                      onChange={(e) =>
                                        setEditEmployeeForm({
                                          ...editEmployeeForm,
                                          absenceDeductionReason: e.target.value,
                                        })
                                      }
                                      className="w-24 px-1.5 py-1 border border-slate-300 rounded text-[10px]"
                                    />
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => {
                                      if ((emp.absenceDeduction || 0) > 0) {
                                        setSelectedDeductionEmployee(emp);
                                        setClickedDeductionType("Absence");
                                        setIsDeductionModalOpen(true);
                                      }
                                    }}
                                    className={`${(emp.absenceDeduction || 0) > 0 ? "cursor-pointer hover:underline font-bold" : "text-slate-300"}`}
                                  >
                                    {(emp.absenceDeduction || 0).toLocaleString('en-US')}
                                  </div>
                                )}
                              </td>

                              {/* LATE DEDUCTION */}
                              <td className="py-4 px-3 font-mono font-bold text-rose-600">
                                {isEditing ? (
                                  <div className="space-y-1">
                                    <input
                                      type="number"
                                      value={editEmployeeForm.lateDeduction ?? emp.lateDeduction ?? 0}
                                      onChange={(e) =>
                                        setEditEmployeeForm({
                                          ...editEmployeeForm,
                                          lateDeduction: Number(e.target.value),
                                        })
                                      }
                                      className="w-24 px-2 py-1.5 border-2 border-slate-300 focus:border-indigo-500 rounded-lg text-xs font-mono font-bold text-slate-900 text-center shadow-sm"
                                    />
                                    <input
                                      type="text"
                                      value={editEmployeeForm.lateDeductionReason ?? emp.lateDeductionReason ?? ""}
                                      placeholder="السبب *"
                                      onChange={(e) =>
                                        setEditEmployeeForm({
                                          ...editEmployeeForm,
                                          lateDeductionReason: e.target.value,
                                        })
                                      }
                                      className="w-24 px-1.5 py-1 border border-slate-300 rounded text-[10px]"
                                    />
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => {
                                      if ((emp.lateDeduction || 0) > 0) {
                                        setSelectedDeductionEmployee(emp);
                                        setClickedDeductionType("Late");
                                        setIsDeductionModalOpen(true);
                                      }
                                    }}
                                    className={`${(emp.lateDeduction || 0) > 0 ? "cursor-pointer hover:underline font-bold" : "text-slate-300"}`}
                                  >
                                    {(emp.lateDeduction || 0).toLocaleString('en-US')}
                                  </div>
                                )}
                              </td>

                              {/* PENALTY DEDUCTION */}
                              <td className="py-4 px-3 font-mono font-bold text-rose-600">
                                {isEditing ? (
                                  <div className="space-y-1">
                                    <input
                                      type="number"
                                      value={editEmployeeForm.penaltyDeduction ?? emp.penaltyDeduction ?? 0}
                                      onChange={(e) =>
                                        setEditEmployeeForm({
                                          ...editEmployeeForm,
                                          penaltyDeduction: Number(e.target.value),
                                        })
                                      }
                                      className="w-24 px-2 py-1.5 border-2 border-slate-300 focus:border-indigo-500 rounded-lg text-xs font-mono font-bold text-slate-900 text-center shadow-sm"
                                    />
                                    <input
                                      type="text"
                                      value={editEmployeeForm.penaltyDeductionReason ?? emp.penaltyDeductionReason ?? ""}
                                      placeholder="السبب *"
                                      onChange={(e) =>
                                        setEditEmployeeForm({
                                          ...editEmployeeForm,
                                          penaltyDeductionReason: e.target.value,
                                        })
                                      }
                                      className="w-24 px-1.5 py-1 border border-slate-300 rounded text-[10px]"
                                    />
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => {
                                      if ((emp.penaltyDeduction || 0) > 0) {
                                        setSelectedDeductionEmployee(emp);
                                        setClickedDeductionType("Penalty");
                                        setIsDeductionModalOpen(true);
                                      }
                                    }}
                                    className={`${(emp.penaltyDeduction || 0) > 0 ? "cursor-pointer hover:underline font-bold" : "text-slate-300"}`}
                                  >
                                    {(emp.penaltyDeduction || 0).toLocaleString('en-US')}
                                  </div>
                                )}
                              </td>

                              {/* GOSI */}
                              <td className="py-4 px-3 font-mono font-bold text-rose-600">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editEmployeeForm.gosiDeduction ?? emp.gosiDeduction}
                                    onChange={(e) =>
                                      setEditEmployeeForm({
                                        ...editEmployeeForm,
                                        gosiDeduction: Number(e.target.value),
                                      })
                                    }
                                    className="w-24 px-2 py-1.5 border-2 border-slate-300 focus:border-indigo-500 rounded-lg text-xs font-mono font-bold text-slate-900 text-center shadow-sm"
                                  />
                                ) : (
                                  emp.gosiDeduction.toLocaleString('en-US')
                                )}
                              </td>

                              {/* OTHER DEDUCTIONS */}
                              <td className="py-4 px-3 font-mono text-rose-600 font-bold text-center">
                                {isEditing ? (
                                  emp.otherDeductions > 0 ? (
                                    <button
                                      onClick={() => {
                                        setSelectedDeductionEmployee(emp);
                                        setClickedDeductionType("Other");
                                        setIsDeductionModalOpen(true);
                                      }}
                                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded border border-rose-200 text-sm font-bold transition-colors"
                                      title="إدارة الاستقطاعات التفصيلية"
                                    >
                                      {emp.otherDeductions.toLocaleString('en-US')}
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setSelectedDeductionEmployee(emp);
                                        setClickedDeductionType("Other");
                                        setIsDeductionModalOpen(true);
                                      }}
                                      className="px-2 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded text-[11px] font-bold whitespace-nowrap transition-colors"
                                    >
                                      إضافة خصم
                                    </button>
                                  )
                                ) : (
                                  <button
                                    className="px-2 py-1 bg-transparent hover:bg-rose-50 text-rose-600 rounded text-sm font-bold transition-colors"
                                    onClick={() => {
                                      setSelectedDeductionEmployee(emp);
                                      setClickedDeductionType("Other");
                                      setIsDeductionModalOpen(true);
                                    }}
                                    title="إدارة الاستقطاعات التفصيلية"
                                  >
                                    {emp.otherDeductions > 0 ? emp.otherDeductions.toLocaleString('en-US') : "0"}
                                  </button>
                                )}
                              </td>

                              {/* TOTAL SALARY */}
                              <td className="py-4 px-3 font-mono text-indigo-600 font-extrabold text-[13.5px] text-center">
                                {displayTotalSalary.toLocaleString('en-US')} ر.س
                              </td>

                              {/* MUDDAH */}
                              <td className="py-4 px-3 font-mono text-amber-600 font-bold text-center">
                                {displayMuddah.toLocaleString('en-US')} ر.س
                              </td>

                              {/* REMAINING SALARY */}
                              <td className="py-4 px-3 font-mono text-emerald-600 font-extrabold text-[13.5px]">
                                {displayRemaining.toLocaleString('en-US')} ر.س
                              </td>

                              {/* TRANSFERRED CHECKBOX */}
                              <td className="py-4 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={!!emp.isTransferred}
                                  onChange={() => toggleEmployeeTransferred(emp.id)}
                                  className="w-5 h-5 text-emerald-600 border-2 border-slate-300 rounded-md focus:ring-emerald-500 cursor-pointer"
                                />
                              </td>

                              {/* ACTIONS */}
                              <td className="py-3 px-4 text-left">
                                <div className="flex items-center gap-1.5 justify-end">
                                  {isEditing ? (
                                    <>
                                      <button
                                        onClick={() => handleSaveEmployeeRow(emp.id)}
                                        className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 font-bold text-xs"
                                        title="حفظ التعديلات"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingEmployeeId(null);
                                          setEditEmployeeForm({});
                                        }}
                                        className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 font-bold text-xs"
                                        title="إلغاء التعديل"
                                      >
                                        ✕
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      {canModifyRow && isAccountant && (
                                        <button
                                          onClick={() => {
                                            setEditingEmployeeId(emp.id);
                                            setEditEmployeeForm(emp);
                                          }}
                                          className="p-1 text-[#0072BC] hover:bg-blue-50 rounded"
                                          title="تعديل يدوياً"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                      )}

                                      <button
                                        onClick={() => {
                                          setSelectedPayslipEmployee(emp);
                                          setIsPayslipModalOpen(true);
                                        }}
                                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold flex items-center gap-0.5"
                                        title="عرض كشف الراتب الفردي"
                                      >
                                        <FileText className="w-3 h-3" />
                                        كشف راتب
                                      </button>
                                      {canModifyRow && (
                                        <button
                                          onClick={() => {
                                            if (true) { // Bypass confirm in iframe
                                              handleRemoveEmployeeRow(emp.id);
                                            }
                                          }}
                                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-[10px] font-bold flex items-center gap-0.5"
                                          title="حذف الموظف من المسير"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          حذف
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        }); })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bottom summaries of the table */}
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl grid grid-cols-2 md:grid-cols-6 gap-4 text-xs mt-4">
                  <div className="p-3 bg-white rounded-xl border border-slate-150">
                    <span className="text-slate-400 font-bold font-arabic">إجمالي الأساسي المستحق:</span>
                    <div className="font-mono font-bold text-sm text-slate-800 mt-1">
                      {runEmployees.reduce((sum, e) => sum + e.basicSalary, 0).toLocaleString('en-US')} ر.س
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-150">
                    <span className="text-slate-400 font-bold font-arabic">إجمالي البدلات والمكتسبات:</span>
                    <div className="font-mono font-bold text-sm text-indigo-600 mt-1">
                     
                      {runEmployees
                        .reduce(
                          (sum, e) =>
                            sum + 
                            e.housingAllowance + 
                            e.transportAllowance + 
                            (e.foodAllowance || 0) + 
                            e.overtimeAmount + 
                            (e.otherAllowances || 0),
                          0
                        )
                        .toLocaleString('en-US')}{" "}
                      ر.س
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-150">
                    <span className="text-slate-400 font-bold font-arabic">إجمالي الاستقطاعات والجزاءات:</span>
                    <div className="font-mono font-bold text-sm text-rose-600 mt-1">
                      -
                      {runEmployees
                        .reduce((sum, e) => sum + e.totalDeductions, 0)
                        .toLocaleString('en-US')}{" "}
                      ر.س
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-150">
                    <span className="text-slate-400 font-bold font-arabic">إجمالي مُدد:</span>
                    <div className="font-mono font-bold text-sm text-amber-600 mt-1">
                      {runEmployees.reduce((sum, e) => sum + (e.muddahAmount || 0), 0).toLocaleString('en-US')} ر.س
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-150">
                    <span className="text-slate-400 font-bold block mb-1 font-arabic">Total Overtime | إجمالي الأوفر تايم:</span>
                    <div className="font-mono font-bold text-sm text-indigo-700">
                      {runEmployees.reduce((sum, e) => sum + (e.overtimeAmount || 0), 0).toLocaleString('en-US')} ر.س
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono font-bold mt-1">
                      Total OT Hours: {runEmployees.reduce((sum, e) => sum + (e.overtimeHours || 0), 0).toLocaleString('en-US')}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono font-bold">
                      Total OT Amount: {runEmployees.reduce((sum, e) => sum + (e.overtimeAmount || 0), 0).toLocaleString('en-US')} ر.s
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 text-white rounded-xl">
                    <span className="text-slate-400 font-bold font-arabic">صافي الميزانية المصرفية للتحويل (باقي الراتب):</span>
                    <div className="font-mono font-black text-sm text-emerald-400 mt-1">
                      {runEmployees.reduce((sum, e) => sum + Math.max(0, e.netSalary - (e.muddahAmount || 0)), 0).toLocaleString('en-US')} ر.س
                    </div>
                  </div>
                </div>
              </div>

              {/* Left Column: Side Dashboard (Bento Grid of Stats, Modification Requests, and Audit Trails) */}
              <div className="w-full bg-slate-50 p-6 border border-slate-200 space-y-6 grid grid-cols-1 md:grid-cols-2 gap-6 rounded-2xl shadow-sm">
                <div className="space-y-6">
                  {/* Bento card 1: Summary Financial Stats */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                    <h4 className="font-black text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-100 pb-2 font-arabic">
                      <span className="text-emerald-500 font-mono">📊</span>
                      <span>ملخص الميزانية والمسير</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-slate-400 font-bold block mb-1 font-arabic">إجمالي الأساسي:</span>
                        <span className="font-mono text-xs font-black text-slate-700">
                          {runEmployees.reduce((sum, e) => sum + e.basicSalary, 0).toLocaleString('en-US')} ر.س
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-slate-400 font-bold block mb-1 font-arabic">إجمالي البدلات:</span>
                        <span className="font-mono text-xs font-black text-indigo-600">
                         {runEmployees.reduce((sum, e) => sum + e.housingAllowance + 
                            e.transportAllowance + 
                            (e.foodAllowance || 0) + (e.overtimeAmount || 0) + (e.otherAllowances || 0), 0).toLocaleString('en-US')} ر.س
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-slate-400 font-bold block mb-1 font-arabic">إجمالي الخصومات:</span>
                        <span className="font-mono text-xs font-black text-rose-600">
                          -{runEmployees.reduce((sum, e) => sum + e.totalDeductions, 0).toLocaleString('en-US')} ر.س
                        </span>
                      </div>
                      <div className="bg-slate-900 text-white p-2.5 rounded-xl">
                        <span className="text-slate-400 font-bold block mb-0.5 text-[9px] font-arabic">الصافي الكلي (إجمالي الراتب):</span>
                        <span className="font-mono text-xs font-black text-emerald-400">
                          {runEmployees.reduce((sum, e) => sum + e.netSalary, 0).toLocaleString('en-US')} ر.س
                        </span>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded-xl flex flex-col justify-center font-bold">
                        <span className="font-arabic text-[9px] text-amber-800 block mb-0.5">إجمالي مُدد:</span>
                        <span className="font-mono text-xs font-black text-amber-600">
                          {runEmployees.reduce((sum, e) => sum + (e.muddahAmount || 0), 0).toLocaleString('en-US')} ر.س
                        </span>
                      </div>
                      <div className="bg-emerald-950 text-emerald-300 p-2.5 rounded-xl border border-emerald-800 col-span-2 flex justify-between items-center font-bold">
                        <span className="font-arabic text-[10px] text-emerald-400">باقي الراتب المحول للبنك:</span>
                        <span className="font-mono text-xs font-black text-emerald-400">
                          {runEmployees.reduce((sum, e) => sum + Math.max(0, e.netSalary - (e.muddahAmount || 0)), 0).toLocaleString('en-US')} ر.س
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bento card 2: Modification Requests Panel */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                      <h4 className="font-black text-slate-800 text-xs flex items-center gap-1.5 font-arabic">
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                        <span>سجل ملاحظات المراجعة وتعديلات المدققين</span>
                      </h4>
                    </div>

                    {runModificationRequests.length === 0 ? (
                      <div className="py-6 text-center text-slate-400 italic text-[10px] font-arabic">
                        لا يوجد أي طلبات تعديل أو ملاحظات مسجلة حالياً.
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-48 overflow-y-auto">
                        {runModificationRequests.map((req) => (
                          <div key={req.id} className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-1 text-[11px]">
                            <div className="flex justify-between items-center">
                              <span className="font-black text-[#0072BC] font-mono">{req.id}</span>
                              <span className={`px-1.5 py-0.5 text-[9px] rounded font-bold font-arabic ${req.status === "Open" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>
                                {req.status === "Open" ? "مفتوح" : "مكتمل ومغلق"}
                              </span>
                            </div>
                            <p className="text-slate-700 leading-relaxed font-bold font-arabic">"{req.notes}"</p>
                            <div className="text-[9px] text-slate-400 font-mono font-bold">
                              المدقق: {req.requestedBy} | بتاريخ: {new Date(req.requestedAt).toLocaleDateString()}
                            </div>
                            {req.responseNotes ? (
                              <div className="bg-white p-2 rounded border border-slate-150 mt-1.5">
                                <span className="text-[9px] font-black text-emerald-600 block font-arabic">رد المحاسب:</span>
                                <p className="text-[10px] text-slate-600 italic mt-0.5 font-arabic font-bold">"{req.responseNotes}"</p>
                              </div>
                            ) : (
                              isAccountant && req.status === "Open" && (
                                <button
                                  onClick={() => {
                                    setSelectedRequestForResponse(req);
                                    setIsModResponseModalOpen(true);
                                  }}
                                  className="w-full mt-1.5 text-center py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[9px] font-bold font-arabic"
                                >
                                  الرد وإغلاق الطلب 💬
                                </button>
                              )
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Bento card 3: Structured Audit Log */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <h4 className="font-black text-slate-800 text-xs flex items-center gap-1.5 mb-3 pb-2 border-b border-slate-100 font-arabic">
                      <History className="w-4 h-4 text-indigo-500" />
                      <span>سجل العمليات التدقيقي (Audit Log)</span>
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto font-sans">
                      {runAuditLogs
                        .slice()
                        .reverse()
                        .map((log) => (
                          <div key={log.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 text-[10.5px]">
                            <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono font-bold mb-1">
                              <span className="font-extrabold text-slate-700 font-arabic">{log.action}</span>
                              <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                            <p className="text-slate-600 font-arabic font-bold">{log.details}</p>
                            <div className="text-[8.5px] text-slate-400 mt-1 font-arabic">
                              بواسطة: {log.operatorName} | {new Date(log.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Workspace Footer */}
            <div className="flex justify-between items-center bg-white px-6 py-4 border-t border-slate-200 shadow-md z-10">
              <div className="text-xs text-slate-500 font-arabic">
                بيئة عمل مسير الرواتب الإلكتروني الموحد لشركة فنون الوليد للصناعة
              </div>
              <div>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedRun(null);
                    logActionToAudit({
                      action: "إغلاق بيئة العمل",
                      payrollRunId: selectedRun.id,
                      notes: "قام المستخدم بإغلاق بيئة عمل مسير الرواتب بالضغط على زر إغلاق بيئة العمل"
                    });
                  }}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs transition-colors shadow-md hover:shadow-lg font-arabic"
                >
                  إغلاق بيئة العمل / Close Workspace ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE PAYSLIP VIEW DIALOG MODAL (FULL SCREEN OVERLAY) */}
      {isPayslipModalOpen && selectedPayslipEmployee && (
        <div className="fixed inset-0 bg-slate-100 z-50 overflow-y-auto p-0 sm:p-6 md:p-10 flex flex-col">
          <div className="w-full max-w-4xl mx-auto bg-white min-h-screen sm:min-h-0 sm:rounded-3xl p-6 sm:p-10 relative shadow-2xl border border-slate-200 flex flex-col justify-between">
            {/* CLOSE BUTTON */}
            <button
              onClick={() => {
                setIsPayslipModalOpen(false);
                setSelectedPayslipEmployee(null);
              }}
              className="absolute left-6 top-6 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-all hover:scale-105"
              title="إغلاق والرجوع إلى قائمة الرواتب"
            >
              <X className="w-6 h-6" />
            </button>

            {/* HEADER */}
            <div className="border-b-2 border-slate-200 pb-6 mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">شركة فنون الوليد للصناعة</h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-mono mt-1">FONOUN ALWALEED INDUSTRIAL CO.</p>
                </div>
                <div className="text-right sm:text-left">
                  <span className="px-3.5 py-1.5 bg-sky-50 text-[#0072BC] text-xs font-black rounded-full border border-sky-100">
                    كشف راتب موظف معتمد رسمي
                  </span>
                  <p className="text-xs text-slate-500 mt-2.5 font-mono font-bold">كود المسير: {selectedRun?.payrollNumber}</p>
                </div>
              </div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-800 mt-6 flex items-center gap-2 border-r-4 border-[#0072BC] pr-3">
                كشف راتب تفصيلي للشهر الحالي | Employee Detailed Payslip
              </h1>
            </div>

            {/* EMPLOYEE INFO CARD */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-150 text-xs sm:text-sm">
              <div className="space-y-3">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-bold">اسم الموظف:</span>
                  <strong className="text-slate-950 font-black">{selectedPayslipEmployee.arabicName}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-bold">المسمى الوظيفي:</span>
                  <strong className="text-slate-800">{selectedPayslipEmployee.jobTitle}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-bold">رقم الإقامة / الهوية:</span>
                  <strong className="font-mono text-slate-800">{selectedPayslipEmployee.iqamaId}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">القسم / الورشة:</span>
                  <strong className="text-slate-800">{selectedPayslipEmployee.department || "المصنع العام"}</strong>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-slate-200 pb-2 items-center">
                  <span className="text-slate-500 font-bold">اسم البنك المعتمد:</span>
                  {(() => {
                    const style = getBankStyle(selectedPayslipEmployee.bankName || "");
                    return (
                      <span className={`${style.bg} text-[10px] font-black px-2.5 py-0.5 rounded-md border font-arabic flex items-center gap-1.5 shadow-xs`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {selectedPayslipEmployee.bankName || "—"}
                      </span>
                    );
                  })()}
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-bold">رقم الحساب (IBAN):</span>
                  <strong className="font-mono text-slate-800 select-all tracking-wider font-bold">{selectedPayslipEmployee.iban || "—"}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-bold">طريقة التحويل المالي:</span>
                  <strong className="text-slate-800">{selectedPayslipEmployee.transferMethod || "تحويل بنكي مباشر (SARIE)"}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">تاريخ الطباعة / العرض:</span>
                  <strong className="text-slate-800 font-mono font-bold">{new Date().toLocaleDateString('en-US')}</strong>
                </div>
              </div>
            </div>

            {/* FINANCIAL DETAILS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {/* ENTITLEMENTS (المكتسبات) */}
              <div className="bg-emerald-50/20 p-5 rounded-2xl border border-emerald-100/70 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-emerald-800 mb-4 border-b border-emerald-100 pb-2 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    البنود المالية المستحقة (المكتسبات)
                  </h3>
                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between items-center py-1 border-b border-emerald-50/50">
                      <span className="text-slate-600 font-medium">الراتب الأساسي المستحق</span>
                      <span className="font-mono font-bold text-slate-900">{selectedPayslipEmployee.basicSalary.toLocaleString('en-US')} ر.س</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-emerald-50/50">
                      <span className="text-slate-600 font-medium">بدل السكن المؤمن</span>
                      <span className="font-mono font-bold text-slate-900">{selectedPayslipEmployee.housingAllowance.toLocaleString('en-US')} ر.س</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-emerald-50/50">
                      <span className="text-slate-600 font-medium">بدل النقل وتوصيل الورشة</span>
                      <span className="font-mono font-bold text-slate-900">{selectedPayslipEmployee.transportAllowance.toLocaleString('en-US')} ر.س</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-emerald-50/50">
                      <span className="text-slate-600 font-medium">بدل جوال اتصال وتنسيق</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-emerald-50/50">
                      <span className="text-slate-600 font-medium">بدل إعاشة وتغذية</span>
                      <span className="font-mono font-bold text-slate-900">{selectedPayslipEmployee.foodAllowance.toLocaleString('en-US')} ر.س</span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center py-1.5 border-b border-emerald-50/50 gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-600 font-medium">مبلغ مدد</span>
                        <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-150 font-bold font-arabic">امتثال حماية الأجور</span>
                      </div>
                      {selectedRun && ["Draft", "Needs Modification", "Under Modification"].includes(selectedRun.status) && isAccountant ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={selectedPayslipEmployee.muddahAmount || 0}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              handleQuickUpdateMuddah(selectedPayslipEmployee.id, val);
                            }}
                            className="w-24 px-2 py-1 border-2 border-indigo-200 rounded-lg text-xs font-mono font-bold text-slate-900 text-center focus:border-indigo-500 focus:outline-none"
                            placeholder="0"
                          />
                          <button
                            onClick={() => {
                              // Auto calculate: Basic salary Housing allowance (الراتب الأساسي بدل السكن)
                              const autoVal = Number(selectedPayslipEmployee.basicSalary || 0) + Number(selectedPayslipEmployee.housingAllowance || 0);
                              handleQuickUpdateMuddah(selectedPayslipEmployee.id, autoVal);
                              showToast(
                                "✓ تم تطبيق آلية مدد التلقائية (الأساسي بدل السكن)!",
                                "✓ Applied automatic Mudad formula (Basic Housing)!",
                                "success"
                              );
                            }}
                            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg text-[10px] shadow-sm transition-all flex items-center gap-1 font-arabic whitespace-nowrap"
                            title="حساب تلقائي لمدد بناءً على الراتب الأساسي وبدل السكن"
                          >
                            <span>تلقائي 🔄</span>
                          </button>
                        </div>
                      ) : (
                        <span className="font-mono font-bold text-slate-900">{(selectedPayslipEmployee.muddahAmount || 0).toLocaleString('en-US')} ر.س</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-emerald-50/50">
                      <span className="text-slate-600 font-medium">أوفر تايم (إضافي: {selectedPayslipEmployee.overtimeHours} س)</span>
                      <span className="font-mono font-bold text-slate-900">{selectedPayslipEmployee.overtimeAmount.toLocaleString('en-US')} ر.س</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-600 font-medium">
                        مكافآت وبدلات إدارية أخرى
                        {selectedPayslipEmployee.otherAllowancesReason && (
                          <span className="text-[10px] bg-sky-100 text-[#0072BC] px-2 py-0.5 rounded-md mr-1.5 font-bold">
                            {selectedPayslipEmployee.otherAllowancesReason}
                          </span>
                        )}
                      </span>
                      <span className="font-mono font-bold text-slate-900">{(selectedPayslipEmployee.otherAllowances || 0).toLocaleString('en-US')} ر.س</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 mt-6">
                  <span className="font-black text-emerald-900 text-xs sm:text-sm">إجمالي مستحقات الموظف:</span>
                  <span className="font-mono font-black text-emerald-700 text-sm sm:text-base">{selectedPayslipEmployee.totalEntitlements.toLocaleString('en-US')} ر.س</span>
                </div>
              </div>

              {/* DEDUCTIONS (الاستقطاعات) */}
              <div className="bg-rose-50/20 p-5 rounded-2xl border border-rose-100/70 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-rose-800 mb-4 border-b border-rose-100 pb-2 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    البنود المالية المخصومة (الاستقطاعات)
                  </h3>
                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between items-center py-1 border-b border-rose-50/50">
                      <span className="text-slate-600 font-medium">استقطاع السلف المالية والعهود</span>
                      <span className="font-mono font-bold text-slate-900">{selectedPayslipEmployee.loansDeduction.toLocaleString('en-US')} ر.س</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-rose-50/50">
                      <span className="text-slate-600 font-medium">التأمينات الاجتماعية (GOSI)</span>
                      <span className="font-mono font-bold text-slate-900">{selectedPayslipEmployee.gosiDeduction.toLocaleString('en-US')} ر.س</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-600 font-medium">
                        الخصومات والجزاءات الإدارية
                        {selectedPayslipEmployee.deductionsReason && (
                          <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md mr-1.5 font-bold">
                            {selectedPayslipEmployee.deductionsReason}
                          </span>
                        )}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedDeductionEmployee(selectedPayslipEmployee as PayrollRunEmployee);
                          setClickedDeductionType("Other");
                          setIsDeductionModalOpen(true);
                        }}
                        className="font-mono font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition-colors"
                        title="عرض تفاصيل الخصومات"
                      >
                        {selectedPayslipEmployee.otherDeductions.toLocaleString('en-US')} ر.س
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 mt-6">
                  <span className="font-black text-rose-900 text-xs sm:text-sm">إجمالي الخصومات الرسمية:</span>
                  <span className="font-mono font-black text-rose-700 text-sm sm:text-base">{selectedPayslipEmployee.totalDeductions.toLocaleString('en-US')} ر.س</span>
                </div>
              </div>
            </div>

            {/* NET SALARY CARD */}
            <div className="mt-8 p-6 bg-slate-900 text-white rounded-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 text-xs font-bold font-arabic">
                <span className="text-slate-400">إجمالي الصافي (الراتب الكلي قبل مدد):</span>
                <span className="font-mono text-slate-200">{selectedPayslipEmployee.netSalary.toLocaleString('en-US')} ر.س</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 text-xs font-bold font-arabic">
                <span className="text-slate-400">مقتطع مدد (المحول مسبقاً):</span>
                <span className="font-mono text-indigo-400">{(selectedPayslipEmployee.muddahAmount || 0).toLocaleString('en-US')} ر.س</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-1">
                <div className="space-y-1 text-center sm:text-right">
                  <span className="text-xs font-bold text-[#00AEEF] uppercase tracking-wider font-mono">NET REMAINING SALARY</span>
                  <h4 className="text-sm font-black text-slate-100 font-arabic">صافي الراتب المتبقي والمحول للبنك (باقي الراتب):</h4>
                  <p className="text-[10.5px] text-slate-400 font-arabic">طُبقت جميع الجزاءات والخصومات ومستحقات مدد حسب اللائحة المعتمدة.</p>
                </div>
                <div className="text-center sm:text-left">
                  <span className="font-mono text-emerald-400 font-black text-2xl tracking-wider">
                    {Math.max(0, selectedPayslipEmployee.netSalary - (selectedPayslipEmployee.muddahAmount || 0)).toLocaleString('en-US')} ر.س
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1 font-arabic">المبلغ المتبقي للتحويل المباشر</p>
                </div>
              </div>
            </div>

            {/* LEGAL DISCLAIMER */}
            <div className="mt-8 bg-slate-50 p-4 rounded-xl border border-slate-200 text-[10.5px] text-slate-600 leading-relaxed">
              <strong>تنويه نظامي معتمد:</strong> يعتبر كشف الراتب الصادر من منصة الإدارة لشركة فنون الوليد وثيقة رسمية معتمدة تثبت تحويل وقيد المستحقات المالية للموظف بالمرجع البنكي المعتمد إلكترونياً، وتطابق أحكام عقود العمل المصادق عليها عبر منصة قوى بوزارة الموارد البشرية.
            </div>

            {/* SIGNATURE SECTION */}
            <div className="grid grid-cols-2 gap-6 mt-8 border-t border-slate-150 pt-6 text-center text-xs text-slate-500">
              <div className="pt-3">
                <p className="font-bold text-slate-700">توقيع المحاسب المالي للشركة</p>
                <div className="h-12"></div>
                <span className="text-[10px] text-slate-400">_________________</span>
              </div>
              <div className="pt-3">
                <p className="font-bold text-slate-700">اعتماد المدير العام وصاحب العمل</p>
                <div className="h-12"></div>
                <span className="text-[10px] text-slate-400">_________________</span>
              </div>
            </div>

            {/* DIALOG ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end mt-10 border-t border-slate-150 pt-6">
              <button
                onClick={() => {
                  setIsPayslipModalOpen(false);
                  setSelectedPayslipEmployee(null);
                }}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs transition-colors"
              >
                الرجوع إلى القائمة الرئيسية
              </button>
              <button
                onClick={handleExportPayslipPDF}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة ومعاينة 📄</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST MODIFICATIONS MODAL OVERLAY */}
      {isModRequestModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 relative">
            <button
              onClick={() => setIsModRequestModalOpen(false)}
              className="absolute left-6 top-6 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-800 mb-2">تسجيل طلب تعديل ومراجعة جديد</h3>
            <p className="text-xs text-slate-400 mb-4">
              أدخل الملاحظات والتعديلات المطلوبة من المحاسب وسيتغير حالة المسير تلقائياً إلى (بانتظار التعديل).
            </p>

            <div className="space-y-4">
              <textarea
                value={modRequestNotes}
                onChange={(e) => setModRequestNotes(e.target.value)}
                placeholder="مثال: يرجى التحقق من الأوفرتايم الخاص بعامل التشكيل رامي، وتطبيق خصم الغياب المعتمد بورقة الإدارة..."
                rows={4}
                className="w-full p-3 border rounded-xl text-xs focus:outline-none focus:border-rose-500"
              />

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsModRequestModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold"
                >
                  إلغاء التراجع
                </button>
                <button
                  onClick={handleRequestModificationsSubmit}
                  disabled={!modRequestNotes?.trim()}
                  className="px-6 py-2 bg-rose-600 text-white hover:bg-rose-700 rounded-xl text-xs font-bold shadow-md"
                >
                  تقديم طلب التعديل ⚠️
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESPOND TO MODIFICATION REQUEST MODAL */}
      {isModResponseModalOpen && selectedRequestForResponse && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 relative">
            <button
              onClick={() => {
                setIsModResponseModalOpen(false);
                setSelectedRequestForResponse(null);
              }}
              className="absolute left-6 top-6 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-800 mb-2">تسجيل رد المحاسب على طلب التعديل</h3>
            <p className="text-xs text-slate-400 mb-4">
              توثيق الإجراء الذي قمت باتخاذه في مسير الرواتب رداً على طلب المدقق.
            </p>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-55 rounded-xl border border-slate-150">
                <p className="font-bold text-slate-500">ملاحظة المدقق المستهدفة:</p>
                <p className="text-slate-800 mt-1 font-semibold">"{selectedRequestForResponse.notes}"</p>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-500">حالة الطلب بعد الرد *</label>
                <select
                  value={modResponseStatus}
                  onChange={(e) => setModResponseStatus(e.target.value as any)}
                  className="w-full p-2.5 border rounded-xl"
                >
                  <option value="Closed">مغلق - تم التعديل والتصحيح بنجاح (Closed)</option>
                  <option value="Open">مفتوح - جاري النقاش أو التوضيح (Open)</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-500">شرح وتوضيح إجراء المحاسب *</label>
                <textarea
                  value={modResponseNotes}
                  onChange={(e) => setModResponseNotes(e.target.value)}
                  placeholder="مثال: تم تعديل الخصومات لتصبح 150 ر.س بدلاً من 250 وتحديث الصافي المصرفي للموظف..."
                  rows={3}
                  className="w-full p-3 border rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => {
                    setIsModResponseModalOpen(false);
                    setSelectedRequestForResponse(null);
                  }}
                  className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleRespondToModRequestSubmit}
                  disabled={!modResponseNotes?.trim()}
                  className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-bold shadow-md"
                >
                  حفظ وتسجيل الرد 💬
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EMPLOYEE BANK DETAILS MODAL */}
      {isBankModalOpen && selectedBankEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 relative shadow-2xl border border-slate-200">
            {/* Close button */}
            <button
              onClick={() => {
                setIsBankModalOpen(false);
                setSelectedBankEmployee(null);
              }}
              className="absolute left-6 top-6 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
              {(() => {
                const style = getBankStyle(selectedBankEmployee.bankName || (selectedBankEmployee.bankInfo && selectedBankEmployee.bankInfo.bankName) || "");
                return (
                  <span className={`p-3 rounded-2xl border ${style.bg}`}>
                    <Building className="w-6 h-6" />
                  </span>
                );
              })()}
              <div>
                <h3 className="text-base font-black text-slate-800 font-arabic">
                  تفاصيل الحساب البنكي والتحويل المالي
                </h3>
                <p className="text-xs text-slate-400 font-arabic mt-0.5">
                  بيانات بنك الموظف: <span className="text-sky-600 font-bold">{selectedBankEmployee.arabicName}</span>
                </p>
              </div>
            </div>

            {/* Bank Details Table/Grid */}
            <div className="space-y-3 text-xs font-arabic">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-150">
                <span className="text-slate-500 font-bold">اسم المصرف (Bank Name):</span>
                {(() => {
                  const bName = selectedBankEmployee.bankName || (selectedBankEmployee.bankInfo && selectedBankEmployee.bankInfo.bankName) || "";
                  const style = getBankStyle(bName);
                  return (
                    <span className={`${style.bg} text-[11px] font-black px-3 py-1 rounded-lg border font-arabic flex items-center gap-1.5 shadow-xs`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      {bName || "—"}
                    </span>
                  );
                })()}
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-150">
                <span className="text-slate-500 font-bold">رقم الحساب الدولي (IBAN):</span>
                <strong className="text-slate-800 font-mono tracking-wider select-all">
                  {selectedBankEmployee.iban || (selectedBankEmployee.bankInfo && selectedBankEmployee.bankInfo.iban) || "—"}
                </strong>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-150">
                <span className="text-slate-500 font-bold">رقم الحساب الجاري (Account Number):</span>
                <strong className="text-slate-800 font-mono tracking-wider select-all">
                  {selectedBankEmployee.accountNumber || (selectedBankEmployee.bankInfo && selectedBankEmployee.bankInfo.accountNumber) || "—"}
                </strong>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-150">
                <span className="text-slate-500 font-bold">رمز السويفت (SWIFT Code):</span>
                <strong className="text-slate-800 font-mono select-all">
                  {selectedBankEmployee.swiftCode || (selectedBankEmployee.bankInfo && selectedBankEmployee.bankInfo.swiftCode) || "—"}
                </strong>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-150">
                <span className="text-slate-500 font-bold">طريقة التحويل المالي (Transfer Method):</span>
                <strong className="text-slate-800">
                  {selectedBankEmployee.transferMethod || (selectedBankEmployee.bankInfo && selectedBankEmployee.bankInfo.transferMethod) || "SARIE"}
                </strong>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-150">
                <span className="text-slate-500 font-bold">اسم صاحب الحساب (Account Holder):</span>
                <strong className="text-slate-800">
                  {selectedBankEmployee.accountHolderName || (selectedBankEmployee.bankInfo && selectedBankEmployee.bankInfo.accountHolderName) || "—"}
                </strong>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsBankModalOpen(false);
                  setSelectedBankEmployee(null);
                }}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED MULTI-DEDUCTIONS MANAGEMENT MODAL */}
      {isDeductionModalOpen && selectedDeductionEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-3xl p-6 sm:p-8 relative shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            {/* Close button */}
            <button
              onClick={() => {
                setIsDeductionModalOpen(false);
                setSelectedDeductionEmployee(null);
              }}
              className="absolute left-6 top-6 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4 mb-5">
              <span className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                <MinusCircle className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-800 font-arabic flex items-center gap-2">
                  <span>إدارة الاستقطاعات التفصيلية للموظف:</span>
                  <span className="text-rose-600">{selectedDeductionEmployee.arabicName}</span>
                  <span className="text-slate-400 font-mono font-bold text-xs">({selectedDeductionEmployee.employeeId})</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-arabic mt-0.5">
                  أدخل بنود الخصم التفصيلية والجزاءات. يجب تحديد قيمة أكبر من الصفر وسبب إلزامي لكل بند خصم مدرج.
                </p>
              </div>
            </div>

            {/* Content (Scrollable list of rows) */}
            <div className="flex-1 overflow-y-auto pr-1 pl-1 space-y-4 mb-6">
              {localDeductions.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-xs text-slate-500 font-bold font-arabic mb-3">
                    لا يوجد أي بنود خصم تفصيلية مسجلة حالياً لهذا الموظف
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const newId = `DED-NEW-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                      setLocalDeductions([
                        ...localDeductions,
                        {
                          id: newId,
                          type: "Other Deduction",
                          amount: 0,
                          reason: "",
                          notes: "",
                          attachmentUrl: "",
                          createdBy: user.username || "System",
                          createdAt: new Date().toISOString(),
                          updatedBy: user.username || "System",
                          updatedAt: new Date().toISOString(),
                        }
                      ]);
                    }}
                    className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold font-arabic transition-colors"
                  >
                    إضافة أول بند خصم الآن
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {localDeductions.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 hover:border-rose-200 transition-all grid grid-cols-1 md:grid-cols-12 gap-3.5 relative items-end"
                    >
                      {/* Type dropdown */}
                      <div className="md:col-span-3">
                        <label className="block mb-1 text-[10.5px] font-bold text-slate-500 font-arabic">نوع الاستقطاع:</label>
                        <select
                          value={item.type}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setLocalDeductions(
                              localDeductions.map((d) =>
                                d.id === item.id ? { ...d, type: val } : d
                              )
                            );
                          }}
                          className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-xs font-bold font-arabic text-slate-700 focus:outline-none focus:border-rose-500"
                        >
                          <option value="Loan Deduction">خصم سلفة (Loan Deduction)</option>
                          <option value="Absence Deduction">خصم غياب (Absence Deduction)</option>
                          <option value="Late Deduction">خصم تأخير (Late Deduction)</option>
                          <option value="Penalty Deduction">خصم جزاء إداري (Penalty Deduction)</option>
                          <option value="Other Deduction">خصم آخر (Other Deduction)</option>
                        </select>
                      </div>

                      {/* Amount */}
                      <div className="md:col-span-2">
                        <label className="block mb-1 text-[10.5px] font-bold text-slate-500 font-arabic">القيمة المخصومة (ر.س) *:</label>
                        <input
                          type="number"
                          value={item.amount === 0 ? "" : item.amount}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setLocalDeductions(
                              localDeductions.map((d) =>
                                d.id === item.id ? { ...d, amount: val } : d
                              )
                            );
                          }}
                          placeholder="مثال: 150"
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono font-bold text-rose-600 focus:outline-none focus:border-rose-500 text-center"
                        />
                      </div>

                      {/* Reason */}
                      <div className="md:col-span-3">
                        <label className="block mb-1 text-[10.5px] font-bold text-slate-500 font-arabic">السبب الموثق والمانع *:</label>
                        <input
                          type="text"
                          value={item.reason}
                          onChange={(e) => {
                            setLocalDeductions(
                              localDeductions.map((d) =>
                                d.id === item.id ? { ...d, reason: e.target.value } : d
                              )
                            );
                          }}
                          placeholder="مثال: غياب يوم 15 أكتوبر دون عذر"
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      {/* Optional Notes & Attachment link */}
                      <div className="md:col-span-3 grid grid-cols-2 gap-2">
                        <div>
                          <label className="block mb-1 text-[10px] font-bold text-slate-400 font-arabic">ملاحظات داخلية:</label>
                          <input
                            type="text"
                            value={item.notes || ""}
                            onChange={(e) => {
                              setLocalDeductions(
                                localDeductions.map((d) =>
                                  d.id === item.id ? { ...d, notes: e.target.value } : d
                                )
                              );
                            }}
                            placeholder="اختياري"
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-[11px] text-slate-600 focus:outline-none focus:border-rose-500"
                          />
                        </div>
                        <div>
                          <label className="block mb-1 text-[10px] font-bold text-slate-400 font-arabic">رابط المرفق/الإثبات:</label>
                          <input
                            type="text"
                            value={item.attachmentUrl || ""}
                            onChange={(e) => {
                              setLocalDeductions(
                                localDeductions.map((d) =>
                                  d.id === item.id ? { ...d, attachmentUrl: e.target.value } : d
                                )
                              );
                            }}
                            placeholder="رابط pdf/img"
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-[10px] font-mono font-bold text-slate-500 focus:outline-none focus:border-rose-500"
                          />
                        </div>
                      </div>

                      {/* Remove button */}
                      <div className="md:col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setLocalDeductions(localDeductions.filter((d) => d.id !== item.id));
                          }}
                          className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors inline-flex items-center justify-center"
                          title="حذف هذا البند"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Row Button */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const newId = `DED-NEW-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                        setLocalDeductions([
                          ...localDeductions,
                          {
                            id: newId,
                            type: "Other Deduction",
                            amount: 0,
                            reason: "",
                            notes: "",
                            attachmentUrl: "",
                            createdBy: user.username || "System",
                            createdAt: new Date().toISOString(),
                            updatedBy: user.username || "System",
                            updatedAt: new Date().toISOString(),
                          }
                        ]);
                      }}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold font-arabic transition-all flex items-center gap-1.5"
                    >
                      <span>+ إضافة بند استقطاع إضافي</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Footer & Running Sums */}
            <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 font-arabic">إجمالي الخصومات الجارية:</span>
                <span className="font-mono text-base font-extrabold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-150">
                  {localDeductions.reduce((sum, d) => sum + Number(d.amount || 0), 0).toLocaleString('en-US')} ر.س
                </span>
              </div>

              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeductionModalOpen(false);
                    setSelectedDeductionEmployee(null);
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold font-arabic transition-colors text-slate-600"
                >
                  إلغاء وتراجع
                </button>
                <button
                  type="button"
                  onClick={handleSaveDeductionsModal}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold font-arabic transition-colors shadow-md hover:shadow-lg flex items-center gap-1.5"
                >
                  <span>✓ حفظ واعتماد البنود وإعادة الاحتساب</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER TRANSFER MODAL */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-8 relative">
            <button
              onClick={() => setIsTransferModalOpen(false)}
              className="absolute left-6 top-6 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <span className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                <CreditCard className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-lg font-black text-slate-800">تسجيل وتوثيق حوالة الرواتب البنكية</h3>
                <p className="text-xs text-slate-400">توثيق مرجع التحويل وتغيير حالة مسير الرواتب إلى (تم التحويل).</p>
              </div>
            </div>

            <form onSubmit={handleRegisterTransferSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block mb-1 font-bold text-slate-500">الحساب المصرفي الصادر للمصنع *</label>
                <select
                  value={transferForm.bankName}
                  onChange={(e) => setTransferForm({ ...transferForm, bankName: e.target.value })}
                  className="w-full p-3 border rounded-xl bg-white text-slate-800"
                >
                  <option value="البنك الأهلي السعودي (SNB)">البنك الأهلي السعودي (SNB)</option>
                  <option value="مصرف الراجحي (Al Rajhi Bank)">مصرف الراجحي (Al Rajhi Bank)</option>
                  <option value="بنك الرياض (Riyad Bank)">بنك الرياض (Riyad Bank)</option>
                  <option value="البنك السعودي الأول (SAB)">البنك السعودي الأول (SAB)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-bold text-slate-500">رقم مرجع الحوالة البنكية (SARIE) *</label>
                  <input
                    type="text"
                    required
                    value={transferForm.referenceNumber}
                    onChange={(e) => setTransferForm({ ...transferForm, referenceNumber: e.target.value })}
                    placeholder="مثال: Ref-982421482"
                    className="w-full p-3 border rounded-xl font-mono text-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-500">تاريخ إجراء الحوالة *</label>
                  <input
                    type="date"
                    required
                    value={transferForm.transferDate}
                    onChange={(e) => setTransferForm({ ...transferForm, transferDate: e.target.value })}
                    className="w-full p-3 border rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-500">ملاحظات تسوية الحوالة</label>
                <textarea
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                  placeholder="مثال: تم إرسال ملف التحويل التلقائي SARIE للبنك الأهلي، وقبول الحوالات وإرسال الإشعارات لهواتف العمال..."
                  rows={2}
                  className="w-full p-3 border rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-start gap-2.5">
                <span className="text-base text-purple-600">💸</span>
                <p className="text-[10px] text-purple-800 leading-relaxed font-semibold">
                  ملاحظة الأرشفة: بمجرد الحفظ والتوثيق، سيتم أرشفة هذا المسير مع تفاصيل كشف رواتب الموظفين لمنع أي تعديل مستقبلي، وقيد المعاملة في الحسابات العامة للشركة تلقائياً.
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold"
                >
                  إلغاء التراجع
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-xl text-xs font-bold shadow-md"
                >
                  توثيق واعتماد الحوالة 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SOFT DELETE REASON MODAL */}
      {isDeleteReasonModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-8 relative shadow-2xl border border-slate-100">
            <button
              onClick={() => {
                setIsDeleteReasonModalOpen(false);
                setRunToDeleteId(null);
                setDeleteReasonText("");
              }}
              className="absolute left-6 top-6 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <span className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-800 font-arabic">تأكيد حذف مسير الرواتب مؤقتاً</h3>
                <p className="text-xs text-slate-400 font-arabic">يتطلب توثيق سبب الحذف للأرشفة والتدقيق المالي.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-bold text-slate-600 font-arabic text-xs">يرجى كتابة سبب الحذف للمسير المالي *</label>
                <textarea
                  value={deleteReasonText}
                  onChange={(e) => setDeleteReasonText(e.target.value)}
                  placeholder="مثال: تم إلغاء المسير لإعادة إدراجه بعد تسوية ساعات العمل الإضافية للموظفين..."
                  rows={4}
                  required
                  className="w-full p-3 border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl text-xs focus:outline-none transition-all font-arabic"
                />
              </div>

              <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100/50 flex items-start gap-2.5">
                <span className="text-base text-rose-600">⚠️</span>
                <p className="text-[10px] text-rose-800 leading-relaxed font-semibold font-arabic">
                  ملاحظة أمان: سيتم وسم هذا المسير بـ (محذوف) وأرشفة التفاصيل مع توثيق اسم المستخدم وتوقيت العملية في نظام سجل التدقيق المالي ولا يمكن تعديله لاحقاً.
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteReasonModalOpen(false);
                    setRunToDeleteId(null);
                    setDeleteReasonText("");
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors font-arabic"
                >
                  إلغاء التراجع
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSoftDelete}
                  className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all font-arabic"
                >
                  تأكيد حذف وأرشفة المسير 🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
