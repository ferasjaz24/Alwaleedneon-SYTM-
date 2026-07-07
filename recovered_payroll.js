import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=48f92b8e"; const Fragment = __vite__cjsImport0_react_jsxDevRuntime["Fragment"]; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
import __vite__cjsImport1_react from "/node_modules/.vite/deps/react.js?v=48f92b8e"; const useState = __vite__cjsImport1_react["useState"]; const useEffect = __vite__cjsImport1_react["useEffect"];
import __vite__cjsImport2_html2pdf_js from "/node_modules/.vite/deps/html2pdf__js.js?v=48f92b8e"; const html2pdf = __vite__cjsImport2_html2pdf_js.__esModule ? __vite__cjsImport2_html2pdf_js.default : __vite__cjsImport2_html2pdf_js;
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
  RefreshCw,
  Building,
  MinusCircle
} from "/node_modules/.vite/deps/lucide-react.js?v=48f92b8e";
function toEnglishDigits(str) {
  if (!str) return "";
  return String(str).replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776));
}
function mapHrDeductionType(type) {
  const t = String(type).trim();
  if (t === "غياب") return "Absence Deduction";
  if (t === "تأخير") return "Late Deduction";
  if (t === "سلفة") return "Loan Deduction";
  if (t === "عقوبة") return "Penalty Deduction";
  return "Other Deduction";
}
export default function MonthlyPayrollRuns({
  lang,
  user,
  employees
}) {
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [hrDeductions, setHrDeductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterYear, setFilterYear] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRunForm, setNewRunForm] = useState({
    payrollNumber: "",
    month: (/* @__PURE__ */ new Date()).getMonth() + 1,
    year: (/* @__PURE__ */ new Date()).getFullYear(),
    salaryPeriod: "كامل الشهر - Full Month",
    department: "جميع الأقسام",
    setupMethod: "auto",
    // auto: HR profiles, manual: empty rows
    notes: ""
  });
  const [selectedRun, setSelectedRun] = useState(null);
  const [runEmployees, setRunEmployees] = useState([]);
  const [runAuditLogs, setRunAuditLogs] = useState([]);
  const [runModificationRequests, setRunModificationRequests] = useState([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState(false);
  const [selectedEditEmployee, setSelectedEditEmployee] = useState(null);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [editEmployeeForm, setEditEmployeeForm] = useState({});
  const [selectedPayslipEmployee, setSelectedPayslipEmployee] = useState(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [selectedBankEmployee, setSelectedBankEmployee] = useState(null);
  const [isDeductionModalOpen, setIsDeductionModalOpen] = useState(false);
  const [selectedDeductionEmployee, setSelectedDeductionEmployee] = useState(null);
  const [clickedDeductionType, setClickedDeductionType] = useState("");
  const [localDeductions, setLocalDeductions] = useState([]);
  const [isDeleteReasonModalOpen, setIsDeleteReasonModalOpen] = useState(false);
  const [runToDeleteId, setRunToDeleteId] = useState(null);
  const [deleteReasonText, setDeleteReasonText] = useState("");
  const [runToDeleteStatus, setRunToDeleteStatus] = useState("");
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [bankFilter, setBankFilter] = useState("All");
  const [transferForm, setTransferForm] = useState({
    bankName: "البنك الأهلي السعودي (SNB)",
    referenceNumber: "",
    transferDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    notes: ""
  });
  const [isModRequestModalOpen, setIsModRequestModalOpen] = useState(false);
  const [reviewerRequestTitle, setReviewerRequestTitle] = useState("");
  const [modRequestNotes, setModRequestNotes] = useState("");
  const [reviewerRequestPriority, setReviewerRequestPriority] = useState("Normal");
  const [selectedModEmployees, setSelectedModEmployees] = useState({});
  const [selectedRequestForResponse, setSelectedRequestForResponse] = useState(null);
  const [isModResponseModalOpen, setIsModResponseModalOpen] = useState(false);
  const [modResponseNotes, setModResponseNotes] = useState("");
  const [modResponseStatus, setModResponseStatus] = useState("Closed");
  const toEnglishDigits2 = (str) => {
    if (str === null || str === void 0) return "";
    const numStr = String(str);
    const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return numStr.replace(/[٠-٩]/g, (w) => String(arabicDigits.indexOf(w))).replace(/[۰-۹]/g, (w) => String(persianDigits.indexOf(w)));
  };
  const formatMoney = (val) => {
    if (val === null || val === void 0) return "0.00";
    const cleaned = toEnglishDigits2(val);
    const parsed = parseFloat(cleaned) || 0;
    return parsed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const logActionToAudit = async (params) => {
    try {
      const payload = {
        userId: toEnglishDigits2(user.id || user.uid || "unknown"),
        userName: user.username || "Unknown User",
        userRole: user.role || "unknown",
        action: params.action,
        module: "monthly_payroll",
        payrollRunId: params.payrollRunId,
        employeeId: params.employeeId || "",
        fieldName: params.fieldName || "",
        oldValue: toEnglishDigits2(params.oldValue !== void 0 ? String(params.oldValue) : ""),
        newValue: toEnglishDigits2(params.newValue !== void 0 ? String(params.newValue) : ""),
        notes: params.notes || ""
      };
      await fetch("/api/audit_logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("Failed to write to system audit log:", err);
    }
  };
  const loadPayrollRuns = async () => {
    try {
      setLoading(true);
      const [resRuns, resDeductions] = await Promise.all([
        fetch("/api/payroll_runs"),
        fetch("/api/deductions")
      ]);
      if (resRuns.ok) {
        const data = await resRuns.json();
        setPayrollRuns(data);
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
  useEffect(() => {
    if (isCreateModalOpen) {
      const yearStr = newRunForm.year.toString();
      const monthStr = newRunForm.month.toString().padStart(2, "0");
      const randomId = Math.floor(100 + Math.random() * 900);
      setNewRunForm((prev) => ({
        ...prev,
        payrollNumber: `PR-${yearStr}${monthStr}-${randomId}`
      }));
    }
  }, [isCreateModalOpen, newRunForm.month, newRunForm.year]);
  const showToast = (messageAr, messageEn, type = "success") => {
    alert(lang === "ar" ? messageAr : messageEn);
  };
  const isSuperAdmin = user.username?.toLowerCase() === "feras" || user.role?.toLowerCase() === "super admin" || user.role === "الادارة العليا" || user.role === "الإدارة العليا" || user.role?.toLowerCase() === "manager" || user.role?.toLowerCase() === "admin" || user.role === "مدير" || user.role === "مشرف" || user.jobTitle?.includes("مشرف") || user.jobTitle?.includes("مدير");
  const isAccountant = isSuperAdmin || user.jobTitle?.toLowerCase().includes("accountant") || user.jobTitle?.toLowerCase().includes("accounting") || user.jobTitle?.toLowerCase().includes("محاسب") || user.role?.toLowerCase() === "accountant" || user.role === "المحاسبة المالیة" || user.role === "المحاسبة";
  const isReviewer = isSuperAdmin || user.jobTitle?.toLowerCase().includes("manager") || user.jobTitle?.toLowerCase().includes("director") || user.jobTitle?.toLowerCase().includes("مدير") || user.role?.toLowerCase() === "reviewer" || user.role?.toLowerCase() === "admin";
  const isPayer = isSuperAdmin || user.jobTitle?.toLowerCase().includes("treasurer") || user.jobTitle?.toLowerCase().includes("payer") || user.jobTitle?.toLowerCase().includes("financial controller") || user.jobTitle?.toLowerCase().includes("مدير مالي");
  const appendAuditLog = (runId, action, details) => {
    return {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      payrollRunId: runId,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      operatorName: user.username || "Unknown",
      action,
      details
    };
  };
  const getInitialDeductions = (emp) => {
    if (emp.deductionsList && emp.deductionsList.length > 0) {
      return emp.deductionsList.map((item) => ({
        ...item,
        amount: Number(item.amount || 0)
      }));
    }
    const legacy = [];
    const baseDate = selectedRun?.createdAt || (/* @__PURE__ */ new Date()).toISOString();
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
        updatedAt: baseDate
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
        updatedAt: baseDate
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
        updatedAt: baseDate
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
        updatedAt: baseDate
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
        updatedAt: baseDate
      });
    }
    return legacy;
  };
  const handleOpenDeductionsModal = (emp) => {
    setSelectedDeductionEmployee(emp);
    setLocalDeductions(getInitialDeductions(emp));
    setIsDeductionModalOpen(true);
  };
  const handleSaveDeductionsModal = async () => {
    if (!selectedRun || !selectedDeductionEmployee) return;
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
    const baseDate = (/* @__PURE__ */ new Date()).toISOString();
    const validatedDeductions = localDeductions.map((item) => ({
      ...item,
      amount: Number(item.amount),
      updatedBy: baseBy,
      updatedAt: baseDate
    }));
    const loansSum = validatedDeductions.filter((i) => i.type === "Loan Deduction").reduce((sum, i) => sum + i.amount, 0);
    const absenceSum = validatedDeductions.filter((i) => i.type === "Absence Deduction").reduce((sum, i) => sum + i.amount, 0);
    const lateSum = validatedDeductions.filter((i) => i.type === "Late Deduction").reduce((sum, i) => sum + i.amount, 0);
    const penaltySum = validatedDeductions.filter((i) => i.type === "Penalty Deduction").reduce((sum, i) => sum + i.amount, 0);
    const otherSum = validatedDeductions.filter((i) => i.type === "Other Deduction").reduce((sum, i) => sum + i.amount, 0);
    const totalDeductSum = validatedDeductions.reduce((sum, i) => sum + i.amount, 0);
    const loansReasons = validatedDeductions.filter((i) => i.type === "Loan Deduction").map((i) => i.reason).join(" + ") || "خصم سلفة";
    const absenceReasons = validatedDeductions.filter((i) => i.type === "Absence Deduction").map((i) => i.reason).join(" + ") || "خصم غياب";
    const lateReasons = validatedDeductions.filter((i) => i.type === "Late Deduction").map((i) => i.reason).join(" + ") || "خصم تأخير";
    const penaltyReasons = validatedDeductions.filter((i) => i.type === "Penalty Deduction").map((i) => i.reason).join(" + ") || "خصم جزاء إداري";
    const otherReasons = validatedDeductions.filter((i) => i.type === "Other Deduction").map((i) => i.reason).join(" + ") || "خصومات أخرى";
    const calculated = calculateEmployeeNet({
      ...selectedDeductionEmployee,
      loansDeduction: loansSum,
      absenceDeduction: absenceSum,
      lateDeduction: lateSum,
      penaltyDeduction: penaltySum,
      otherDeductions: otherSum
    });
    const updatedEmployee = {
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
      netSalary: calculated.netSalary
    };
    const newEmployeesList = runEmployees.map((e) => e.id === selectedDeductionEmployee.id ? updatedEmployee : e);
    const totalBasicSalary = newEmployeesList.reduce((sum, item) => sum + item.basicSalary, 0);
    const totalAllowances = newEmployeesList.reduce(
      (sum, item) => sum + item.housingAllowance + item.transportAllowance + item.phoneAllowance + item.foodAllowance + item.overtimeAmount + item.otherAllowances + (item.livingAllowance || 0),
      0
    );
    const totalDeductions = newEmployeesList.reduce((sum, item) => sum + item.totalDeductions, 0);
    const totalNetSalary = newEmployeesList.reduce((sum, item) => sum + item.netSalary, 0);
    const totalOvertimeHours = newEmployeesList.reduce((sum, item) => sum + (item.overtimeHours || 0), 0);
    const totalOvertimeAmount = newEmployeesList.reduce((sum, item) => sum + (item.overtimeAmount || 0), 0);
    const oldDeductions = getInitialDeductions(selectedDeductionEmployee);
    const generatedAuditLogs = [];
    validatedDeductions.forEach((item) => {
      const matchingOld = oldDeductions.find((old) => old.id === item.id);
      if (!matchingOld) {
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
    oldDeductions.forEach((oldItem) => {
      const stillExists = validatedDeductions.some((item) => item.id === oldItem.id);
      if (!stillExists) {
        const details = `المستخدم: [ID: ${user.uid || user.id || "N/A"}, الاسم: ${user.username}, البريد الإلكتروني: ${user.username}@alwaleedneon.com, الدور: ${user.role}, IP: 127.0.0.1]
الإجراء الحركي: حذف بند خصم تفصيلي نهائياً
نوع الخصم: ${oldItem.type}
الموظف المستهدف: ${selectedDeductionEmployee.arabicName} (كود: ${selectedDeductionEmployee.employeeId})
مقارنة القيم: [القيمة المحذوفة: ${oldItem.amount} ر.س]
السبب الموثق المحذوف: ${oldItem.reason}`;
        generatedAuditLogs.push(appendAuditLog(selectedRun.id, `حذف خصم تفصيلي - ${oldItem.type}`, details));
      }
    });
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
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedBy: user.username
    };
    try {
      const res = await fetch(`/api/payroll_runs/${selectedRun.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRun)
      });
      if (res.ok) {
        setRunEmployees(newEmployeesList);
        setRunAuditLogs(updatedRun.auditLogs);
        setSelectedRun(updatedRun);
        setPayrollRuns(payrollRuns.map((r) => r.id === selectedRun.id ? updatedRun : r));
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
    const rowsHtml = selectedRun.employees.map((emp) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #cbd5e1;">${emp.iqamaId}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1;">${emp.arabicName}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1;">${emp.jobTitle}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${(emp.basicSalary || 0).toLocaleString("en-US")}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${((emp.housingAllowance || 0) + (emp.transportAllowance || 0) + (emp.foodAllowance || 0) + (emp.otherAllowances || 0) + (emp.phoneAllowance || 0)).toLocaleString("en-US")}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${(emp.overtimeAmount || 0).toLocaleString("en-US")}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${emp.totalEntitlements.toLocaleString("en-US")}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${emp.totalDeductions.toLocaleString("en-US")}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #059669; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${emp.netSalary.toLocaleString("en-US")}</td>
      </tr>
    `).join("");
    element.innerHTML = `
      <style>
    @import url('https://fonts.cdnfonts.com/css/ge-ss-two');
    @import url('https://fonts.cdnfonts.com/css/gotham-pro');
  </style>
  <div style="font-family: 'GE SS', 'GE SS Two', 'GE SS Two', 'Gotham Pro', sans-serif; direction: rtl; padding: 20px; color: #0f172a; width: 100%; background: white;">
        <div style="display: flex; justify-content: space-between; border-bottom: 3px solid #0072BC; padding-bottom: 20px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 15px;">
    <img src="https://pbs.twimg.com/media/HE46IrybcAAMq7L?format=png&name=small" referrerpolicy="no-referrer" alt="Fonoun Alwaleed Logo" style="width: 80px; height: 80px; object-fit: contain;" />
    <div>
      <h1 style="color: #0072BC; margin: 0; font-size: 24px; font-weight: 900;">شركة فنون الوليد للصناعة</h1>
            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">مسير رواتب موظفي وعمال المصنع المعتمد</p>
    </div>
  </div>
          <div style="text-align: left;">
            <h2 style="margin: 0; font-size: 18px; color: #0f172a;">كشف مسير الرواتب المالي</h2>
            <div style="font-size: 14px; color: #64748b; margin-top:4px;">عن شهر ${selectedRun.month} - ${selectedRun.year}</div>
            <div style="font-size: 11px; color: #64748b; margin-top:4px;">كود المسير: ${selectedRun.payrollNumber}</div>
            <div style="font-size: 11px; color: #64748b; margin-top:4px;">تاريخ الطباعة: ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-US")}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px;">
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="color: #64748b; font-size: 12px; font-weight: bold;">إجمالي الرواتب الأساسية</div>
            <div style="font-size: 18px; font-weight: bold; font-family: 'Gotham Pro', sans-serif; font-weight: 900; color: #0f172a; margin-top: 5px;">${selectedRun.totalBasicSalary.toLocaleString("en-US")} ر.س</div>
          </div>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="color: #64748b; font-size: 12px; font-weight: bold;">إجمالي البدلات والمكتسبات</div>
            <div style="font-size: 18px; font-weight: bold; font-family: 'Gotham Pro', sans-serif; font-weight: 900; color: #4f46e5; margin-top: 5px;">+${selectedRun.totalAllowances.toLocaleString("en-US")} ر.س</div>
          </div>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="color: #64748b; font-size: 12px; font-weight: bold;">إجمالي الخصومات</div>
            <div style="font-size: 18px; font-weight: bold; font-family: 'Gotham Pro', sans-serif; font-weight: 900; color: #e11d48; margin-top: 5px;">-${selectedRun.totalDeductions.toLocaleString("en-US")} ر.س</div>
          </div>
          <div style="background: #0f172a; padding: 15px; border-radius: 8px; border: 1px solid #0f172a;">
            <div style="color: #94a3b8; font-size: 12px; font-weight: bold;">صافي الميزانية المصرفية للتحويل</div>
            <div style="font-size: 18px; font-weight: bold; font-family: 'Gotham Pro', sans-serif; font-weight: 900; color: #34d399; margin-top: 5px;">${selectedRun.totalNetSalary.toLocaleString("en-US")} ر.س</div>
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
      margin: 10,
      filename: `Payroll_${selectedRun.payrollNumber}_${selectedRun.month}_${selectedRun.year}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };
    html2pdf().from(element).set(opt).output("bloburl").then(function(pdfBlobUrl) {
      window.open(pdfBlobUrl, "_blank");
      showToast("✓ تم تصدير مسير الرواتب بصيغة PDF وفتحه في نافذة جديدة", "✓ Payroll PDF generated and opened", "success");
      logActionToAudit({
        action: "تصدير مسير PDF",
        payrollRunId: selectedRun.id,
        notes: `تم تصدير مسير رواتب شهر ${selectedRun.month}-${selectedRun.year} بالرقم ${selectedRun.payrollNumber} بصيغة PDF`
      });
    });
  };
  const calculateEmployeeNet = (emp) => {
    const basic = Number(emp.basicSalary || 0);
    const housing = Number(emp.housingAllowance || 0);
    const transport = Number(emp.transportAllowance || 0);
    const phone = Number(emp.phoneAllowance || 0);
    const food = Number(emp.foodAllowance || 0);
    const muddah = Number(emp.muddahAmount || 0);
    const otAmount = Number(emp.overtimeAmount || 0);
    const otherAllow = Number(emp.otherAllowances || 0);
    const living = Number(emp.livingAllowance || 0);
    const entitlements = basic + housing + transport + phone + food + muddah + otAmount + otherAllow + living;
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
      netSalary: Math.max(0, net)
    };
  };
  const handleCreateRun = async (e) => {
    e.preventDefault();
    if (!newRunForm.payrollNumber) return;
    try {
      const duplicateNumber = payrollRuns.find(
        (r) => r.payrollNumber.trim() === newRunForm.payrollNumber.trim() && !r.isDeleted
      );
      if (duplicateNumber) {
        showToast(
          "⚠️ رقم مسير الرواتب هذا موجود مسبقاً! يرجى كتابة أو توليد رقم مسير مختلف لتجنب التكرار.",
          "⚠️ This payroll number already exists! Please enter or generate a different payroll number to avoid duplication.",
          "error"
        );
        return;
      }
      const deptFiltered = employees.filter((emp) => {
        if (newRunForm.department === "جميع الأقسام") return true;
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
      const runEmps = deptFiltered.map((emp) => {
        const basic = Number(emp.basicSalary || 0);
        const housing = Number(emp.allowances?.housing || 0);
        const transport = Number(emp.allowances?.transport || 0);
        const phone = Number(emp.allowances?.phone || 0);
        const food = Number(emp.allowances?.food || 0);
        const runMonthStr = newRunForm.month.toString().padStart(2, "0");
        const runYearMonth = `${newRunForm.year}-${runMonthStr}`;
        const matchingHrDeductions = hrDeductions.filter((d) => {
          return d.employeeId === emp.id && d.date && d.date.startsWith(runYearMonth) && (d.status === "confirmed" || d.status === "notified") && Number(d.amount) > 0;
        });
        const fetchedDeductionsList = matchingHrDeductions.map((d) => ({
          id: d.id || `DED-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          type: mapHrDeductionType(d.type),
          amount: Number(d.amount),
          reason: d.reason || "خصم مستورد من الموارد البشرية",
          source: "HR",
          sourceDeductionId: d.id,
          createdBy: d.createdBy || "HR System",
          createdAt: d.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
          updatedBy: "HR System",
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }));
        let absD = 0;
        let lateD = 0;
        let loanD = 0;
        let penD = 0;
        let otherD = 0;
        fetchedDeductionsList.forEach((item) => {
          if (item.type === "Absence Deduction") absD += item.amount;
          else if (item.type === "Late Deduction") lateD += item.amount;
          else if (item.type === "Loan Deduction") loanD += item.amount;
          else if (item.type === "Penalty Deduction") penD += item.amount;
          else otherD += item.amount;
        });
        const entitlements = basic + housing + transport + phone + food;
        const totalDeductionsSum = absD + lateD + loanD + penD + otherD;
        const net = entitlements - totalDeductionsSum;
        const bName = emp.bankName || "البنك الأهلي السعودي (SNB)";
        const bIban = toEnglishDigits2(emp.iban || "");
        const bAccNum = toEnglishDigits2(emp.accountNumber || "");
        const bSwift = toEnglishDigits2(emp.swiftCode || "");
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
          iqamaId: emp.iqamaId || "",
          basicSalary: basic,
          housingAllowance: housing,
          transportAllowance: transport,
          phoneAllowance: phone,
          foodAllowance: food,
          muddahAmount: 0,
          overtimeHours: 0,
          overtimeAmount: 0,
          otherAllowances: 0,
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
            accountHolderName: bHolder
          },
          totalEntitlements: entitlements,
          totalDeductions: totalDeductionsSum,
          netSalary: net,
          deductionsList: fetchedDeductionsList
        };
      });
      const totalBasicSalary = runEmps.reduce((sum, item) => sum + item.basicSalary, 0);
      const totalAllowances = runEmps.reduce(
        (sum, item) => sum + item.housingAllowance + item.transportAllowance + item.phoneAllowance + item.foodAllowance + item.overtimeAmount + item.otherAllowances + item.muddahAmount,
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
      const newRun = {
        id: runId,
        payrollNumber: newRunForm.payrollNumber,
        month: Number(newRunForm.month),
        year: Number(newRunForm.year),
        salaryPeriod: newRunForm.salaryPeriod,
        department: newRunForm.department,
        status: "Draft",
        notes: newRunForm.notes,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        createdBy: user.username || "System",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        employeesCount: runEmps.length,
        totalBasicSalary,
        totalAllowances,
        totalDeductions,
        totalNetSalary,
        totalOvertimeHours,
        totalOvertimeAmount,
        employees: runEmps,
        auditLogs: [firstLog],
        modificationRequests: []
      };
      const res = await fetch("/api/payroll_runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRun)
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
        throw new Error("API rejection");
      }
    } catch (err) {
      showToast("❌ حدث خطأ أثناء الاتصال بالخادم وحفظ البيانات.", "❌ Connection error saving data to server.", "error");
    }
  };
  const handleOpenViewRun = (run) => {
    setSelectedRun(run);
    setRunEmployees(run.employees || []);
    setRunAuditLogs(run.auditLogs || []);
    setRunModificationRequests(run.modificationRequests || []);
    setIsViewModalOpen(true);
  };
  const handleDeleteRun = async (run) => {
    const terminalStatuses = ["Approved", "Transferred", "Paid", "Partially Paid", "Pending Final Approval"];
    if (terminalStatuses.includes(run.status)) {
      showToast(
        "❌ لا يمكن حذف هذا البند لأنه معتمد أو محول أو مدفوع بالفعل!",
        "This item cannot be deleted because it is already approved, transferred, or paid.",
        "error"
      );
      logActionToAudit({
        action: "Failed Delete Attempt",
        payrollRunId: run.id,
        notes: `User tried to delete payroll run ${run.payrollNumber} in terminal status: ${run.status}`
      });
      return;
    }
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
        notes: `User tried to delete payroll run ${run.payrollNumber} (Needs Modification) without authorization.`
      });
      return;
    }
    if (run.status !== "Draft" && run.status !== "Needs Modification") {
      showToast(
        "❌ لا يمكن حذف كشوف الرواتب غير المسودة.",
        "❌ Only draft or needs modification payroll runs can be deleted.",
        "error"
      );
      logActionToAudit({
        action: "Failed Delete Attempt",
        payrollRunId: run.id,
        notes: `User tried to delete payroll run ${run.payrollNumber} in status: ${run.status}`
      });
      return;
    }
    if (run.status === "Draft") {
      if (true) {
        try {
          const deleteLog = appendAuditLog(
            run.id,
            "حذف مسير (حذف مؤقت)",
            `تم حذف مسير الرواتب بالرقم ${run.payrollNumber} مؤقتاً بواسطة المستخدم.`
          );
          const updatedRun = {
            ...run,
            isDeleted: true,
            deletedAt: (/* @__PURE__ */ new Date()).toISOString(),
            deletedBy: user.username || user.id || "System",
            deleteReason: "حذف مباشر من المسودة",
            auditLogs: run.auditLogs ? [...run.auditLogs, deleteLog] : [deleteLog]
          };
          const res = await fetch(`/api/payroll_runs/${run.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedRun)
          });
          if (!res.ok) throw new Error("Failed to soft delete the run on server.");
          setPayrollRuns(payrollRuns.map((r) => r.id === run.id ? updatedRun : r));
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
    if (!deleteReasonText.trim()) {
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
        deletedAt: (/* @__PURE__ */ new Date()).toISOString(),
        deletedBy: user.username || user.id || "System",
        deleteReason: deleteReasonText,
        auditLogs: targetRun.auditLogs ? [...targetRun.auditLogs, deleteLog] : [deleteLog]
      };
      const res = await fetch(`/api/payroll_runs/${runToDeleteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRun)
      });
      if (res.ok) {
        showToast(
          "✓ تم حذف مسير الرواتب بنجاح ونقله لسجل المحذوفات المؤقت.",
          "✓ Payroll run soft-deleted successfully.",
          "success"
        );
        await logActionToAudit({
          action: "Delete Payroll Run",
          payrollRunId: runToDeleteId,
          notes: `Soft deleted payroll run ${targetRun.payrollNumber}. Reason: ${deleteReasonText}`
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
  const handleSaveEmployeeRow = async (empId) => {
    if (!selectedRun) return;
    const targetEmp = runEmployees.find((e) => e.id === empId);
    if (!targetEmp) return;
    const basic = Number(editEmployeeForm.basicSalary ?? targetEmp.basicSalary ?? 0);
    const housing = Number(editEmployeeForm.housingAllowance ?? targetEmp.housingAllowance ?? 0);
    const transport = Number(editEmployeeForm.transportAllowance ?? targetEmp.transportAllowance ?? 0);
    const phone = Number(editEmployeeForm.phoneAllowance ?? targetEmp.phoneAllowance ?? 0);
    const food = Number(editEmployeeForm.foodAllowance ?? targetEmp.foodAllowance ?? 0);
    const muddah = Number(editEmployeeForm.muddahAmount ?? targetEmp.muddahAmount ?? 0);
    const otHours = Number(editEmployeeForm.overtimeHours ?? targetEmp.overtimeHours ?? 0);
    const otAmount = Number(editEmployeeForm.overtimeAmount ?? targetEmp.overtimeAmount ?? 0);
    const otherAllow = Number(editEmployeeForm.otherAllowances ?? targetEmp.otherAllowances ?? 0);
    const otherAllowReason = editEmployeeForm.otherAllowancesReason ?? targetEmp.otherAllowancesReason ?? "";
    const living = Number(editEmployeeForm.livingAllowance ?? targetEmp.livingAllowance ?? 0);
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
    if (loans > 0 && !loansReason.trim()) {
      showToast("⚠️ سبب الخصم مطلوب لكافة الاستقطاعات المفروضة! (السلفة)", "Deduction reason is required for loans.", "error");
      return;
    }
    if (absence > 0 && !absenceReason.trim()) {
      showToast("⚠️ سبب الخصم مطلوب لكافة الاستقطاعات المفروضة! (الغياب)", "Deduction reason is required for absence.", "error");
      return;
    }
    if (late > 0 && !lateReason.trim()) {
      showToast("⚠️ سبب الخصم مطلوب لكافة الاستقطاعات المفروضة! (التأخير)", "Deduction reason is required for late deduction.", "error");
      return;
    }
    if (penalty > 0 && !penaltyReason.trim()) {
      showToast("⚠️ سبب الخصم مطلوب لكافة الاستقطاعات المفروضة! (الجزاءات)", "Deduction reason is required for penalties.", "error");
      return;
    }
    if (otherDeduct > 0 && !otherDeductReason.trim()) {
      showToast("⚠️ سبب الخصم مطلوب لكافة الاستقطاعات المفروضة! (أخرى)", "Deduction reason is required for other deductions.", "error");
      return;
    }
    const calculated = calculateEmployeeNet({
      basicSalary: basic,
      housingAllowance: housing,
      transportAllowance: transport,
      phoneAllowance: phone,
      foodAllowance: food,
      muddahAmount: muddah,
      overtimeAmount: otAmount,
      otherAllowances: otherAllow,
      livingAllowance: living,
      loansDeduction: loans,
      gosiDeduction: gosi,
      absenceDeduction: absence,
      lateDeduction: late,
      penaltyDeduction: penalty,
      otherDeductions: otherDeduct
    });
    const updatedEmployee = {
      ...targetEmp,
      basicSalary: basic,
      housingAllowance: housing,
      transportAllowance: transport,
      phoneAllowance: phone,
      foodAllowance: food,
      muddahAmount: muddah,
      overtimeHours: otHours,
      overtimeAmount: otAmount,
      otherAllowances: otherAllow,
      otherAllowancesReason: otherAllowReason,
      livingAllowance: living,
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
      netSalary: calculated.netSalary
    };
    const newEmployeesList = runEmployees.map((e) => e.id === empId ? updatedEmployee : e);
    const totalBasicSalary = newEmployeesList.reduce((sum, item) => sum + item.basicSalary, 0);
    const totalAllowances = newEmployeesList.reduce(
      (sum, item) => sum + item.housingAllowance + item.transportAllowance + item.phoneAllowance + item.foodAllowance + item.overtimeAmount + item.otherAllowances + (item.livingAllowance || 0),
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
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedBy: user.username
    };
    try {
      const res = await fetch(`/api/payroll_runs/${selectedRun.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRun)
      });
      if (res.ok) {
        setSelectedRun(updatedRun);
        setRunEmployees(newEmployeesList);
        setRunAuditLogs(updatedRun.auditLogs);
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
  const transitionStatus = async (newStatus, logAction, logDetails, extraFields = {}) => {
    if (!selectedRun) return;
    const newLog = appendAuditLog(selectedRun.id, logAction, logDetails);
    const updatedRun = {
      ...selectedRun,
      ...extraFields,
      status: newStatus,
      auditLogs: [...runAuditLogs, newLog],
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedBy: user.username
    };
    try {
      const res = await fetch(`/api/payroll_runs/${selectedRun.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRun)
      });
      if (res.ok) {
        setSelectedRun(updatedRun);
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
  const handleRefreshHrDeductions = async () => {
    if (!selectedRun) return;
    try {
      setLoading(true);
      const resDeductions = await fetch("/api/deductions");
      if (!resDeductions.ok) {
        throw new Error("Failed to fetch fresh deductions list from HR");
      }
      const freshDeductions = await resDeductions.json();
      setHrDeductions(freshDeductions);
      const runMonthStr = selectedRun.month.toString().padStart(2, "0");
      const runYearMonth = `${selectedRun.year}-${runMonthStr}`;
      const updatedEmployees = selectedRun.employees.map((emp) => {
        const matchingHr = freshDeductions.filter((d) => {
          return d.employeeId === emp.employeeId && d.date && d.date.startsWith(runYearMonth) && (d.status === "confirmed" || d.status === "notified") && Number(d.amount) > 0;
        });
        let currentList = emp.deductionsList ? [...emp.deductionsList] : [];
        currentList = currentList.filter((item) => {
          if (item.source !== "HR") return true;
          return matchingHr.some((d) => d.id === item.sourceDeductionId);
        });
        matchingHr.forEach((d) => {
          const existingIdx = currentList.findIndex((item) => item.sourceDeductionId === d.id);
          if (existingIdx > -1) {
            currentList[existingIdx] = {
              ...currentList[existingIdx],
              amount: Number(d.amount),
              reason: d.reason || "خصم مستورد من الموارد البشرية"
            };
          } else {
            currentList.push({
              id: d.id || `DED-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              type: mapHrDeductionType(d.type),
              amount: Number(d.amount),
              reason: d.reason || "خصم مستورد من الموارد البشرية",
              source: "HR",
              sourceDeductionId: d.id,
              createdBy: d.createdBy || "HR System",
              createdAt: d.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
              updatedBy: "HR System",
              updatedAt: (/* @__PURE__ */ new Date()).toISOString()
            });
          }
        });
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
        const entitlements = Number(emp.basicSalary || 0) + Number(emp.housingAllowance || 0) + Number(emp.transportAllowance || 0) + Number(emp.phoneAllowance || 0) + Number(emp.foodAllowance || 0) + Number(emp.overtimeAmount || 0) + Number(emp.otherAllowances || 0);
        const totalDeductionsSum = absD + lateD + loanD + penD + otherD;
        const net = entitlements - totalDeductionsSum;
        return {
          ...emp,
          absenceDeduction: absD,
          lateDeduction: lateD,
          loansDeduction: loanD,
          penaltyDeduction: penD,
          otherDeductions: otherD,
          totalDeductions: totalDeductionsSum,
          netSalary: net,
          deductionsList: currentList
        };
      });
      const totalBasicSalary = updatedEmployees.reduce((sum, item) => sum + (item.basicSalary || 0), 0);
      const totalAllowances = updatedEmployees.reduce(
        (sum, item) => sum + (item.housingAllowance || 0) + (item.transportAllowance || 0) + (item.phoneAllowance || 0) + (item.foodAllowance || 0) + (item.overtimeAmount || 0) + (item.otherAllowances || 0) + (item.muddahAmount || 0),
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
        totalNetSalary
      };
      const saveRes = await fetch(`/api/payroll_runs/${selectedRun.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRun)
      });
      if (saveRes.ok) {
        setSelectedRun(updatedRun);
        setPayrollRuns(payrollRuns.map((r) => r.id === selectedRun.id ? updatedRun : r));
        logActionToAudit({
          action: "تحديث استقطاعات الموارد البشرية",
          payrollRunId: selectedRun.id,
          notes: `إعادة تحديث ومزامنة خصومات الموظفين مع الموارد البشرية لشهر ${selectedRun.month}-${selectedRun.year}`
        });
        showToast(
          "✓ تم تحديث ومزامنة استقطاعات الموارد البشرية بنجاح!",
          "✓ HR deductions refreshed and synchronized successfully!",
          "success"
        );
      } else {
        throw new Error("Failed to save refreshed payroll run to server");
      }
    } catch (e) {
      console.error(e);
      showToast(
        "❌ فشل تحديث الاستقطاعات من الموارد البشرية.",
        "❌ " + e.message,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };
  const handleRemoveEmployeeRow = async (employeeId) => {
    if (!selectedRun) return;
    if (selectedRun.status !== "Draft" && selectedRun.status !== "Needs Modification" && selectedRun.status !== "Under Modification") {
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
      (sum, item) => sum + (item.housingAllowance || 0) + (item.transportAllowance || 0) + (item.phoneAllowance || 0) + (item.foodAllowance || 0) + (item.overtimeAmount || 0) + (item.otherAllowances || 0) + (item.muddahAmount || 0),
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
      totalNetSalary
    };
    try {
      setLoading(true);
      const res = await fetch(`/api/payroll_runs/${selectedRun.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRun)
      });
      if (res.ok) {
        setSelectedRun(updatedRun);
        setPayrollRuns(payrollRuns.map((r) => r.id === selectedRun.id ? updatedRun : r));
        logActionToAudit({
          action: "حذف موظف من المسير",
          payrollRunId: selectedRun.id,
          notes: `تم إزالة الموظف ${employeeId} من مسير الراتب`
        });
        showToast(
          "✓ تم حذف الموظف من المسير بنجاح",
          "✓ Employee removed from payroll run successfully",
          "success"
        );
      } else {
        throw new Error("Failed to remove employee on backend");
      }
    } catch (e) {
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
  const handleRequestModificationsSubmit = () => {
    if (!modRequestNotes.trim()) return;
    const newRequest = {
      id: `REQ-${Date.now()}`,
      payrollRunId: selectedRun.id,
      requestedBy: user.username || "Reviewer",
      requestedAt: (/* @__PURE__ */ new Date()).toISOString(),
      notes: modRequestNotes,
      status: "Open"
    };
    const newRequestsList = [...runModificationRequests, newRequest];
    setRunModificationRequests(newRequestsList);
    transitionStatus(
      "Needs Modification",
      "طلب تعديلات على المسير",
      `طلب مراجعة/تعديل من المدقق: "${modRequestNotes}"`,
      {
        modificationRequests: newRequestsList
      }
    );
    setIsModRequestModalOpen(false);
    setModRequestNotes("");
  };
  const handleRespondToModRequestSubmit = () => {
    if (!selectedRequestForResponse || !modResponseNotes.trim()) return;
    const updatedRequests = runModificationRequests.map((req) => {
      if (req.id === selectedRequestForResponse.id) {
        return {
          ...req,
          status: modResponseStatus,
          responseNotes: modResponseNotes,
          respondedBy: user.username,
          respondedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      return req;
    });
    setRunModificationRequests(updatedRequests);
    const hasAnyOpen = updatedRequests.some((r) => r.status === "Open");
    const nextRunStatus = hasAnyOpen ? "Under Modification" : "Reviewed";
    transitionStatus(
      nextRunStatus,
      "الرد على طلب التعديل",
      `تم تسجيل رد المحاسب على طلب التعديل: "${modResponseNotes}" بقفل الحالة كـ (${modResponseStatus})`,
      {
        modificationRequests: updatedRequests
      }
    );
    setIsModResponseModalOpen(false);
    setSelectedRequestForResponse(null);
    setModResponseNotes("");
  };
  const handleConfirmReview = () => {
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
  const handleFinalApproval = () => {
    transitionStatus(
      "Approved",
      "الاعتماد النهائي للمسير",
      `تم الاعتماد المالي النهائي والقطعي لمسير الرواتب بواسطة الإدارة العليا وصاحب الصلاحية.`,
      {
        approvedAt: (/* @__PURE__ */ new Date()).toISOString(),
        approvedBy: user.username
      }
    );
  };
  const handleRegisterTransferSubmit = (e) => {
    e.preventDefault();
    if (!transferForm.referenceNumber.trim()) {
      showToast("⚠️ يرجى إدخال رقم المرجع المصرفي لتوثيق الحوالة!", "⚠️ Bank reference number is required!", "error");
      return;
    }
    transitionStatus(
      "Transferred",
      "تسجيل تحويل الرواتب",
      `تم توثيق تحويل الرواتب للمصرف بمرجع حوالة رقم (${transferForm.referenceNumber}) على البنك (${transferForm.bankName}) بتاريخ ${transferForm.transferDate}.`,
      {
        transferredAt: (/* @__PURE__ */ new Date()).toISOString(),
        transferredBy: user.username,
        transferDetails: {
          bankName: transferForm.bankName,
          referenceNumber: transferForm.referenceNumber,
          transferDate: transferForm.transferDate,
          notes: transferForm.notes
        }
      }
    );
    setIsTransferModalOpen(false);
  };
  const filteredRuns = payrollRuns.filter((run) => {
    if (run.isDeleted) return false;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = run.payrollNumber.toLowerCase().includes(query) || run.notes && run.notes.toLowerCase().includes(query) || run.department.toLowerCase().includes(query);
    const matchesYear = filterYear === "all" || run.year.toString() === filterYear;
    const matchesMonth = filterMonth === "all" || run.month.toString() === filterMonth;
    const matchesDept = filterDept === "all" || run.department === filterDept;
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
      matchesTab = true;
    }
    return matchesSearch && matchesYear && matchesMonth && matchesDept && matchesTab;
  });
  const departments = Array.from(new Set(employees.map((e) => e.department))).filter(Boolean);
  const getMonthName = (m) => {
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
      "ديسمبر (12)"
    ];
    return monthsAr[m - 1] || m.toString();
  };
  const getStatusBadge = (status) => {
    switch (status) {
      case "Draft":
        return /* @__PURE__ */ jsxDEV("span", { className: "bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[11px] font-black border w-full block whitespace-nowrap text-center border-slate-300", children: "مسودة 📂" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 1778,
          columnNumber: 16
        }, this);
      case "Pending Review":
        return /* @__PURE__ */ jsxDEV("span", { className: "bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[11px] font-black border w-full block whitespace-nowrap text-center border-amber-350 animate-pulse", children: "قيد المراجعة 🔍" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 1780,
          columnNumber: 16
        }, this);
      case "Needs Modification":
        return /* @__PURE__ */ jsxDEV("span", { className: "bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full text-[11px] font-black border w-full block whitespace-nowrap text-center border-rose-300 animate-bounce", children: "طلب تعديل ⚠️" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 1782,
          columnNumber: 16
        }, this);
      case "Under Modification":
        return /* @__PURE__ */ jsxDEV("span", { className: "bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full text-[11px] font-black border w-full block whitespace-nowrap text-center border-orange-300", children: "جاري التعديل 🛠️" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 1784,
          columnNumber: 16
        }, this);
      case "Reviewed":
        return /* @__PURE__ */ jsxDEV("span", { className: "bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[11px] font-black border w-full block whitespace-nowrap text-center border-blue-300", children: "تمت المراجعة ✓" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 1786,
          columnNumber: 16
        }, this);
      case "Pending Final Approval":
        return /* @__PURE__ */ jsxDEV("span", { className: "bg-cyan-50 text-cyan-700 px-2.5 py-1 rounded-full text-[11px] font-black border w-full block whitespace-nowrap text-center border-cyan-300 animate-pulse", children: "بانتظار الاعتماد ⏳" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 1788,
          columnNumber: 16
        }, this);
      case "Approved":
        return /* @__PURE__ */ jsxDEV("span", { className: "bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-black border w-full block whitespace-nowrap text-center border-emerald-300", children: "معتمد نهائياً 👑" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 1790,
          columnNumber: 16
        }, this);
      case "Transferred":
        return /* @__PURE__ */ jsxDEV("span", { className: "bg-purple-100 text-purple-850 px-2.5 py-1 rounded-full text-[11px] font-black border w-full block whitespace-nowrap text-center border-purple-300", children: "تم التحويل بنجاح 💸" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 1792,
          columnNumber: 16
        }, this);
      default:
        return /* @__PURE__ */ jsxDEV("span", { className: "bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[11px] font-bold", children: status }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 1794,
          columnNumber: 16
        }, this);
    }
  };
  const updateHourlyOtAmount = (hours, baseSalary) => {
    const hourlyRate = baseSalary / 30 / 8;
    const otPay = hourlyRate * hours * 1.5;
    return Math.round(otPay * 100) / 100;
  };
  const handleExportPayslipPDF = () => {
    if (!selectedPayslipEmployee || !selectedRun) return;
    const element = document.createElement("div");
    element.innerHTML = `
      <style>
    @import url('https://fonts.cdnfonts.com/css/ge-ss-two');
    @import url('https://fonts.cdnfonts.com/css/gotham-pro');
  </style>
  <div style="font-family: 'GE SS', 'GE SS Two', 'GE SS Two', 'Gotham Pro', sans-serif; direction: rtl; padding: 20px; color: #0f172a; max-width: 800px; margin: 0 auto; background: white;">
        <div style="display: flex; justify-content: space-between; border-bottom: 3px solid #0072BC; padding-bottom: 20px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 15px;">
    <img src="https://pbs.twimg.com/media/HE46IrybcAAMq7L?format=png&name=small" referrerpolicy="no-referrer" alt="Fonoun Alwaleed Logo" style="width: 80px; height: 80px; object-fit: contain;" />
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
            <div><strong>اسم البنك والفرع:</strong> ${selectedPayslipEmployee.bankName || selectedPayslipEmployee.bankInfo && selectedPayslipEmployee.bankInfo.bankName || ""}</div>
            <div><strong>الحساب الدولي (IBAN):</strong> <span style="font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${selectedPayslipEmployee.iban || selectedPayslipEmployee.bankInfo && selectedPayslipEmployee.bankInfo.iban || ""}</span></div>
            <div><strong>رقم الحساب:</strong> <span style="font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${selectedPayslipEmployee.accountNumber || selectedPayslipEmployee.bankInfo && selectedPayslipEmployee.bankInfo.accountNumber || ""}</span></div>
            <div><strong>رمز السويفت (SWIFT):</strong> <span style="font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${selectedPayslipEmployee.swiftCode || selectedPayslipEmployee.bankInfo && selectedPayslipEmployee.bankInfo.swiftCode || ""}</span></div>
            <div><strong>طريقة التحويل المالي:</strong> ${selectedPayslipEmployee.transferMethod || selectedPayslipEmployee.bankInfo && selectedPayslipEmployee.bankInfo.transferMethod || ""}</div>
            <div><strong>اسم صاحب الحساب:</strong> ${selectedPayslipEmployee.accountHolderName || selectedPayslipEmployee.bankInfo && selectedPayslipEmployee.bankInfo.accountHolderName || selectedPayslipEmployee.arabicName || ""}</div>
            <div><strong>تاريخ الطباعة:</strong> ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-US")}</div>
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
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${selectedPayslipEmployee.basicSalary.toLocaleString("en-US")}</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1;">استقطاع السلف المالية والعهود</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${selectedPayslipEmployee.loansDeduction.toLocaleString("en-US")}</td>
            </tr>
            <tr>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1;">بدل السكن المتفق عليه</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${selectedPayslipEmployee.housingAllowance.toLocaleString("en-US")}</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1;">استقطاع التأمينات الاجتماعية (GOSI)</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${selectedPayslipEmployee.gosiDeduction.toLocaleString("en-US")}</td>
            </tr>
            <tr>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1;">بدل الانتقال / المواصلات</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${selectedPayslipEmployee.transportAllowance.toLocaleString("en-US")}</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1;">خصومات الغياب بدون عذر</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${(selectedPayslipEmployee.absenceDeduction || 0).toLocaleString("en-US")}</td>
            </tr>
            <tr>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1;">بدل الإعاشة / الطعام</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${((selectedPayslipEmployee.foodAllowance || 0) + (selectedPayslipEmployee.livingAllowance || 0)).toLocaleString("en-US")}</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1;">خصومات التأخير</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${(selectedPayslipEmployee.lateDeduction || 0).toLocaleString("en-US")}</td>
            </tr>
            <tr>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1;">مكافآت العمل الإضافي (Overtime)</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${(selectedPayslipEmployee.overtimeAmount || 0).toLocaleString("en-US")}</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1;">الجزاءات والعقوبات (Penalties)</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${(selectedPayslipEmployee.penaltyDeduction || 0).toLocaleString("en-US")}</td>
            </tr>
            <tr>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1;">بدل الجوال + بدلات أخرى / مُدد</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${((selectedPayslipEmployee.otherAllowances || 0) + (selectedPayslipEmployee.phoneAllowance || 0)).toLocaleString("en-US")}</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1;">استقطاعات أخرى</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', sans-serif; font-weight: 900;">${(selectedPayslipEmployee.otherDeductions || 0).toLocaleString("en-US")}</td>
            </tr>
            <tr>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; background-color: #f8fafc; font-weight: bold; font-size: 14px; text-align: left;">إجمالي الاستحقاقات:</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; background-color: #f8fafc; font-weight: bold; font-family: 'Gotham Pro', sans-serif; font-weight: 900; font-size: 14px; color: #0072BC;">${selectedPayslipEmployee.totalEntitlements.toLocaleString("en-US")} ر.س</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; background-color: #fff1f2; font-weight: bold; font-size: 14px; text-align: left;">إجمالي الاستقطاعات:</td>
              <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; border: 1px solid #cbd5e1; background-color: #fff1f2; font-weight: bold; font-family: 'Gotham Pro', sans-serif; font-weight: 900; font-size: 14px; color: #be123c;">${selectedPayslipEmployee.totalDeductions.toLocaleString("en-US")} ر.س</td>
            </tr>
          </tbody>
        </table>

        <div style="background-color: #020617; color: white; padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
          <div>
            <h3 style="margin: 0; font-size: 16px; color: #94a3b8;">صافي الراتب المستحق للتحويل البنكي</h3>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">(Net Salary Payable)</p>
          </div>
          <div style="font-size: 28px; font-weight: 900; font-family: 'Gotham Pro', sans-serif; font-weight: 900; color: #34d399;">
            ${selectedPayslipEmployee.netSalary.toLocaleString("en-US")} ر.س
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
      margin: 10,
      filename: `Payslip_${selectedPayslipEmployee.employeeId}_${selectedRun.month}_${selectedRun.year}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };
    html2pdf().from(element).set(opt).output("bloburl").then(function(pdfBlobUrl) {
      window.open(pdfBlobUrl, "_blank");
      showToast("✓ تم استخراج ملف PDF وفتحه للمعاينة", "✓ PDF preview opened successfully", "success");
      logActionToAudit({
        action: "تصدير مسير",
        payrollRunId: selectedRun.id,
        notes: `تم تصدير مسير الموظف ${selectedPayslipEmployee.arabicName} بصيغة PDF`
      });
    });
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "space-y-6 md:col-span-1", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 text-[#00AEEF]", children: [
            /* @__PURE__ */ jsxDEV(Building, { className: "w-5 h-5" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 1960,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-bold uppercase tracking-wider font-mono", children: "FINANCIAL ACCOUNTING DIVISION" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 1961,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 1959,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("h1", { className: "text-2xl font-black tracking-tight flex items-center gap-2", children: [
            "مسيرات الرواتب الشهرية والتحويلات ",
            /* @__PURE__ */ jsxDEV("span", { className: "text-[#00AEEF]", children: "💳" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 1964,
              columnNumber: 49
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 1963,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-slate-400", children: "إعداد، مراجعة، تدقيق واعتماد كشوفات رواتب الموظفين والعمال في المصنع وتوثيق التحويلات البنكية المباشرة." }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 1966,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 1958,
          columnNumber: 11
        }, this),
        isAccountant && /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setIsCreateModalOpen(true),
            className: "px-6 py-3.5 bg-gradient-to-r from-[#00AEEF] to-[#0072BC] hover:from-[#0072BC] hover:to-[#00AEEF] text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 group transform hover:scale-[1.02]",
            children: [
              /* @__PURE__ */ jsxDEV(Plus, { className: "w-5 h-5 transition-transform group-hover:rotate-90" }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 1976,
                columnNumber: 15
              }, this),
              "إنشاء مسير رواتب شهري جديد ✨"
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 1972,
            columnNumber: 13
          },
          this
        )
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 1957,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 flex flex-col justify-between", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-slate-400 font-bold uppercase", children: "الرواتب المعلقة للمراجعة 🔍" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 1985,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-baseline justify-between mt-2", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-xl font-black text-amber-500 font-mono", children: payrollRuns.filter((r) => ["Pending Review", "Reviewed", "Pending Final Approval"].includes(r.status) && !r.isDeleted).length }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 1987,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] bg-amber-500/10 text-amber-500 font-bold px-1.5 py-0.5 rounded", children: "معلّق" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 1990,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 1986,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 1984,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 flex flex-col justify-between", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-slate-400 font-bold uppercase", children: "المسيرات المعتمدة نهائياً 👑" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 1995,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-baseline justify-between mt-2", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-xl font-black text-emerald-500 font-mono", children: payrollRuns.filter((r) => r.status === "Approved" && !r.isDeleted).length }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 1997,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] bg-emerald-500/10 text-emerald-500 font-bold px-1.5 py-0.5 rounded", children: "معتمد" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2e3,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 1996,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 1994,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 flex flex-col justify-between", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-slate-400 font-bold uppercase", children: "أقسام المصنع الفعالة 🏭" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 2005,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-baseline justify-between mt-2", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-xl font-black text-[#00AEEF] font-mono font-bold", children: departments.length }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2007,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] bg-cyan-500/10 text-[#00AEEF] font-bold px-1.5 py-0.5 rounded", children: "ورشة" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2010,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 2006,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2004,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 flex flex-col justify-between", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-slate-400 font-bold uppercase", children: "إجمالي الحوالات الموثقة 💸" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 2015,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-baseline justify-between mt-2", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-xl font-black text-indigo-400 font-mono", children: payrollRuns.filter((r) => ["Transferred", "Partially Paid"].includes(r.status) && !r.isDeleted).length }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2017,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-1.5 py-0.5 rounded", children: "محول" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2020,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 2016,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2014,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 1983,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
      lineNumber: 1956,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "bg-white rounded-3xl p-6 shadow-md border border-slate-100 space-y-4", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "relative flex-1 w-full", children: [
          /* @__PURE__ */ jsxDEV(Search, { className: "absolute right-4 top-3.5 text-slate-400 w-5 h-5" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 2030,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "text",
              placeholder: "البحث برقم المسير، الملاحظات، أو قسم الموظفين...",
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: "w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0072BC] focus:bg-white transition-all text-xs text-slate-700"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2031,
              columnNumber: 13
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2029,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 w-full md:w-auto", children: [
          /* @__PURE__ */ jsxDEV(
            "select",
            {
              value: filterYear,
              onChange: (e) => setFilterYear(e.target.value),
              className: "bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-mono font-bold",
              children: [
                /* @__PURE__ */ jsxDEV("option", { value: "all", children: "جميع السنوات (All Years)" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2047,
                  columnNumber: 15
                }, this),
                /* @__PURE__ */ jsxDEV("option", { value: "2026", children: "2026" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2048,
                  columnNumber: 15
                }, this),
                /* @__PURE__ */ jsxDEV("option", { value: "2025", children: "2025" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2049,
                  columnNumber: 15
                }, this)
              ]
            },
            void 0,
            true,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2042,
              columnNumber: 13
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "select",
            {
              value: filterMonth,
              onChange: (e) => setFilterMonth(e.target.value),
              className: "bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700",
              children: [
                /* @__PURE__ */ jsxDEV("option", { value: "all", children: "جميع الأشهر (All Months)" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2058,
                  columnNumber: 15
                }, this),
                Array.from({ length: 12 }, (_, i) => /* @__PURE__ */ jsxDEV("option", { value: i + 1, children: getMonthName(i + 1) }, i + 1, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2060,
                  columnNumber: 17
                }, this))
              ]
            },
            void 0,
            true,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2053,
              columnNumber: 13
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "select",
            {
              value: filterDept,
              onChange: (e) => setFilterDept(e.target.value),
              className: "bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 max-w-[200px]",
              children: [
                /* @__PURE__ */ jsxDEV("option", { value: "all", children: "جميع ورش وأقسام المصنع" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2072,
                  columnNumber: 15
                }, this),
                departments.map((dept) => /* @__PURE__ */ jsxDEV("option", { value: dept, children: dept }, dept, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2074,
                  columnNumber: 17
                }, this))
              ]
            },
            void 0,
            true,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2067,
              columnNumber: 13
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: loadPayrollRuns,
              className: "p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors",
              title: "تحديث البيانات",
              children: /* @__PURE__ */ jsxDEV(RefreshCw, { className: "w-4.5 h-4.5 text-slate-600" }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 2086,
                columnNumber: 15
              }, this)
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2081,
              columnNumber: 13
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2040,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 2028,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex border-b border-slate-200 gap-1 overflow-x-auto pt-2", children: [
        { id: "all", label: "جميع المسيرات 🏛️", count: payrollRuns.filter((r) => !r.isDeleted).length },
        { id: "pending", label: "بانتظار المراجعة 🔍", count: payrollRuns.filter((r) => ["Pending Review", "Reviewed"].includes(r.status) && !r.isDeleted).length },
        { id: "approved", label: "معتمدة وجاهزة للتحويل 👑", count: payrollRuns.filter((r) => ["Approved", "Pending Final Approval"].includes(r.status) && !r.isDeleted).length },
        { id: "paid", label: "مسيرات مكتملة ومحولة 💸", count: payrollRuns.filter((r) => ["Transferred", "Paid", "Partially Paid"].includes(r.status) && !r.isDeleted).length },
        { id: "drafts", label: "مسودات قيد الإعداد 📝", count: payrollRuns.filter((r) => ["Draft", "Needs Modification", "Under Modification"].includes(r.status) && !r.isDeleted).length }
      ].map((tab) => /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => setActiveTab(tab.id),
          className: `pb-3 px-4 text-sm font-black transition-all whitespace-nowrap border-b-2 ${activeTab === tab.id ? "border-[#0072BC] text-[#0072BC] font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"}`,
          children: [
            tab.label,
            /* @__PURE__ */ jsxDEV("span", { className: "mr-1.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-mono font-bold", children: tab.count }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2110,
              columnNumber: 15
            }, this)
          ]
        },
        tab.id,
        true,
        {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2100,
          columnNumber: 13
        },
        this
      )) }, void 0, false, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 2092,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
      lineNumber: 2027,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden", children: loading ? /* @__PURE__ */ jsxDEV("div", { className: "py-24 text-center", children: [
      /* @__PURE__ */ jsxDEV("span", { className: "w-10 h-10 border-4 border-[#0072BC] border-t-transparent rounded-full animate-spin inline-block mb-3" }, void 0, false, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 2122,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: "text-base text-slate-400 font-bold", children: "جاري تحميل مسيرات الرواتب والعمليات البنكية للمصنع..." }, void 0, false, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 2123,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
      lineNumber: 2121,
      columnNumber: 11
    }, this) : filteredRuns.length === 0 ? /* @__PURE__ */ jsxDEV("div", { className: "py-20 text-center text-slate-400 space-y-3", children: [
      /* @__PURE__ */ jsxDEV("span", { className: "text-4xl", children: "📂" }, void 0, false, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 2127,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("h3", { className: "text-sm font-black text-slate-700", children: "لا توجد مسيرات رواتب في هذا التبويب" }, void 0, false, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 2128,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: "text-xs max-w-md mx-auto", children: "لم نجد أي كشوف رواتب تطابق معايير التصفية والبحث الحالية في أرشيف المعاملات المالية للشركة." }, void 0, false, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 2129,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
      lineNumber: 2126,
      columnNumber: 11
    }, this) : /* @__PURE__ */ jsxDEV("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxDEV("table", { className: "w-full text-[15px] text-right font-sans", children: [
      /* @__PURE__ */ jsxDEV("thead", { children: /* @__PURE__ */ jsxDEV("tr", { className: "bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-[12px] tracking-wider font-bold", children: [
        /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-6 text-right", children: "رقم المسير البرمجي" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2138,
          columnNumber: 19
        }, this),
        /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-4 text-right", children: "فترة الاستحقاق" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2139,
          columnNumber: 19
        }, this),
        /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-4 text-right", children: "التغطية الإدارية" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2140,
          columnNumber: 19
        }, this),
        /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-4 text-right", children: "عدد الموظفين" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2141,
          columnNumber: 19
        }, this),
        /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-4 text-right", children: "إجمالي الرواتب الأساسية" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2142,
          columnNumber: 19
        }, this),
        /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-4 text-right", children: "البدلات والمستحقات" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2143,
          columnNumber: 19
        }, this),
        /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-4 text-right", children: "إجمالي الاستقطاعات" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2144,
          columnNumber: 19
        }, this),
        /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-4 text-right text-emerald-600 font-bold", children: "صافي المستحق النهائي" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2145,
          columnNumber: 19
        }, this),
        /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-4 text-center", children: "حالة التدقيق" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2146,
          columnNumber: 19
        }, this),
        /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-6 text-left", children: "التحكم والإجراءات" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2147,
          columnNumber: 19
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 2137,
        columnNumber: 17
      }, this) }, void 0, false, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 2136,
        columnNumber: 15
      }, this),
      /* @__PURE__ */ jsxDEV("tbody", { className: "divide-y divide-slate-100", children: filteredRuns.map((run) => /* @__PURE__ */ jsxDEV("tr", { className: "hover:bg-slate-50/80 transition-colors", children: [
        /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-6 font-mono font-bold text-slate-900 text-[16px]", children: run.payrollNumber }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2153,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-4", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "font-bold text-[15px]", children: getMonthName(run.month) }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 2157,
            columnNumber: 23
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "text-[11px] text-slate-400", children: [
            "سنة ",
            run.year
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 2158,
            columnNumber: 23
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2156,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-4", children: /* @__PURE__ */ jsxDEV("span", { className: "px-2.5 py-1 bg-cyan-50 text-cyan-800 rounded-lg font-bold border border-cyan-150 text-[13px]", children: run.department }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2161,
          columnNumber: 23
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2160,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-4 font-bold text-slate-700", children: [
          run.employeesCount,
          " موظف"
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2165,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-4 font-mono font-bold text-slate-700", children: [
          formatMoney(run.totalBasicSalary),
          " ر.س"
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2168,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-4 font-mono text-indigo-600 font-bold", children: [
          "+",
          formatMoney(run.totalAllowances),
          " ر.س"
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2171,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-4 font-mono text-rose-600 font-bold", children: [
          "-",
          formatMoney(run.totalDeductions),
          " ر.س"
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2174,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-4 font-mono text-emerald-600 font-black text-[16px]", children: [
          formatMoney(run.totalNetSalary),
          " ر.س"
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2177,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-4 text-center", children: getStatusBadge(run.status) }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2180,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-6 text-left", children: /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-end gap-2.5", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => handleOpenViewRun(run),
              className: "px-4 py-2 bg-[#0072BC] hover:bg-[#00AEEF] text-white rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-sm text-sm",
              children: [
                /* @__PURE__ */ jsxDEV(Eye, { className: "w-4 h-4" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2189,
                  columnNumber: 27
                }, this),
                /* @__PURE__ */ jsxDEV("span", { children: "عرض وتعديل التفاصيل" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2190,
                  columnNumber: 27
                }, this)
              ]
            },
            void 0,
            true,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2185,
              columnNumber: 25
            },
            this
          ),
          (run.status === "Draft" || run.status === "Needs Modification" || run.status === "Under Modification") && isAccountant && /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => handleDeleteRun(run),
              className: "p-2 text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-100 rounded-xl transition-all shadow-sm",
              title: "حذف المسير",
              children: /* @__PURE__ */ jsxDEV(Trash2, { className: "w-4.5 h-4.5" }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 2199,
                columnNumber: 29
              }, this)
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2194,
              columnNumber: 27
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2184,
          columnNumber: 23
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2183,
          columnNumber: 21
        }, this)
      ] }, run.id, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 2152,
        columnNumber: 19
      }, this)) }, void 0, false, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 2150,
        columnNumber: 15
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
      lineNumber: 2135,
      columnNumber: 13
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
      lineNumber: 2134,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
      lineNumber: 2119,
      columnNumber: 7
    }, this),
    isCreateModalOpen && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs", children: /* @__PURE__ */ jsxDEV("div", { className: "w-full max-w-xl bg-white rounded-3xl p-8 relative shadow-2xl border border-slate-100 animate-scale-up", children: [
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => setIsCreateModalOpen(false),
          className: "absolute left-6 top-6 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600",
          children: /* @__PURE__ */ jsxDEV(X, { className: "w-5 h-5" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 2220,
            columnNumber: 15
          }, this)
        },
        void 0,
        false,
        {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2216,
          columnNumber: 13
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3 mb-6", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "p-3 bg-blue-50 text-[#0072BC] rounded-2xl", children: /* @__PURE__ */ jsxDEV(FileText, { className: "w-6 h-6" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2225,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2224,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("h3", { className: "text-lg font-black text-slate-800", children: "إعداد مسير رواتب شهري جديد" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 2228,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-slate-400", children: "يقوم النظام بجلب بيانات وعقود الموظفين من الموارد البشرية وتوليد المسير فورياً." }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 2229,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2227,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 2223,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("form", { onSubmit: handleCreateRun, className: "space-y-4 text-xs", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("label", { className: "block mb-1 font-bold text-slate-500", children: "سنة المسير المستهدفة *" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2236,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV(
              "select",
              {
                value: newRunForm.year,
                onChange: (e) => setNewRunForm({ ...newRunForm, year: Number(e.target.value) }),
                className: "w-full px-3.5 py-3 border border-slate-250 rounded-xl font-mono font-bold",
                children: [
                  /* @__PURE__ */ jsxDEV("option", { value: "2026", children: "2026" }, void 0, false, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2242,
                    columnNumber: 21
                  }, this),
                  /* @__PURE__ */ jsxDEV("option", { value: "2025", children: "2025" }, void 0, false, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2243,
                    columnNumber: 21
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 2237,
                columnNumber: 19
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 2235,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("label", { className: "block mb-1 font-bold text-slate-500", children: "شهر الاستحقاق المالي *" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2248,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV(
              "select",
              {
                value: newRunForm.month,
                onChange: (e) => setNewRunForm({ ...newRunForm, month: Number(e.target.value) }),
                className: "w-full px-3.5 py-3 border border-slate-250 rounded-xl",
                children: Array.from({ length: 12 }, (_, i) => /* @__PURE__ */ jsxDEV("option", { value: i + 1, children: getMonthName(i + 1) }, i + 1, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2255,
                  columnNumber: 23
                }, this))
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 2249,
                columnNumber: 19
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 2247,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2234,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { className: "block mb-1 font-bold text-slate-500", children: "رقم المسير المقترح (توليد تلقائي)" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 2264,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "text",
              required: true,
              value: newRunForm.payrollNumber,
              onChange: (e) => setNewRunForm({ ...newRunForm, payrollNumber: e.target.value }),
              className: "w-full px-3.5 py-3 border border-slate-250 rounded-xl font-mono text-slate-700 font-bold bg-slate-50"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2265,
              columnNumber: 17
            },
            this
          ),
          /* @__PURE__ */ jsxDEV("p", { className: "text-[10.5px] text-[#0072BC] mt-1 font-bold", children: 'ℹ️ يُسمح نظاماً بإنشاء أكثر من مسير رواتب لنفس الشهر طالما أن "رقم المسير" مختلف وفريد.' }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 2272,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2263,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("label", { className: "block mb-1 font-bold text-slate-500", children: "القسم المشمول بالمسير" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2279,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV(
              "select",
              {
                value: newRunForm.department,
                onChange: (e) => setNewRunForm({ ...newRunForm, department: e.target.value }),
                className: "w-full px-3.5 py-3 border border-slate-250 rounded-xl bg-white text-slate-800",
                children: [
                  /* @__PURE__ */ jsxDEV("option", { value: "جميع الأقسام", children: "جميع الأقسام والورش (All Staff)" }, void 0, false, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2285,
                    columnNumber: 21
                  }, this),
                  departments.map((dept) => /* @__PURE__ */ jsxDEV("option", { value: dept, children: dept }, dept, false, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2287,
                    columnNumber: 23
                  }, this))
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 2280,
                columnNumber: 19
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 2278,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("label", { className: "block mb-1 font-bold text-slate-500", children: "دورة وفترة صرف الراتب" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2295,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "text",
                required: true,
                value: newRunForm.salaryPeriod,
                onChange: (e) => setNewRunForm({ ...newRunForm, salaryPeriod: e.target.value }),
                className: "w-full px-3.5 py-3 border border-slate-250 rounded-xl bg-slate-50"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 2296,
                columnNumber: 19
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 2294,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2277,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { className: "block mb-1 font-bold text-slate-500", children: "ملاحظات توضيحية إضافية" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 2307,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV(
            "textarea",
            {
              value: newRunForm.notes,
              onChange: (e) => setNewRunForm({ ...newRunForm, notes: e.target.value }),
              placeholder: "أدخل أي ملاحظات خاصة بتعميد مسير هذا الشهر مثل الموظفين تحت المراجعة أو استبعاد الاستقالات...",
              rows: 3,
              className: "w-full px-3.5 py-3 border border-slate-250 rounded-xl focus:outline-none focus:border-[#0072BC]"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2308,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2306,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start gap-2.5", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-base text-blue-600", children: "💡" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 2318,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-blue-800 font-medium leading-relaxed", children: [
            /* @__PURE__ */ jsxDEV("strong", { children: "تنويه الربط التلقائي:" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2320,
              columnNumber: 19
            }, this),
            " بمجرد الضغط على إنشاء المسير المالي، سيقوم النظام بالربط المباشر بجدول بيانات الكوادر للحصول على الرواتب الأساسية والبدلات، بالإضافة للتحقق من أرقام الحسابات البنكية (IBAN) وطرق الدفع المفضلة لتجهيز ملف التحويل المصرفي."
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 2319,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2317,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex gap-3 justify-end pt-4", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              onClick: () => setIsCreateModalOpen(false),
              className: "px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors font-bold",
              children: "إلغاء التراجع"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2325,
              columnNumber: 17
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "submit",
              className: "px-7 py-2.5 bg-gradient-to-r from-[#0072BC] to-[#00AEEF] text-white font-extrabold rounded-xl shadow-md transform active:scale-95 transition-all",
              children: "ابدأ توليد وإعداد المسير 🚀"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2332,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2324,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 2233,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
      lineNumber: 2215,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
      lineNumber: 2214,
      columnNumber: 9
    }, this),
    isViewModalOpen && selectedRun && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 bg-slate-900/60 z-40 flex flex-col w-screen h-screen backdrop-blur-xs overflow-hidden select-none", children: /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col w-full h-full bg-slate-50 relative overflow-hidden", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center bg-white px-6 py-4 border-b border-slate-200 shadow-sm z-10", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "space-y-0.5", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2.5", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "font-mono text-sm font-black text-[#0072BC]", children: selectedRun.payrollNumber }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2352,
              columnNumber: 19
            }, this),
            getStatusBadge(selectedRun.status)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 2351,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("h3", { className: "text-base font-black text-slate-800 font-arabic", children: [
            "تفاصيل كشف الرواتب لشهر ",
            getMonthName(selectedRun.month),
            " - ",
            selectedRun.year
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 2355,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-[11px] text-slate-400 font-arabic", children: [
            "التغطية: ",
            /* @__PURE__ */ jsxDEV("strong", { className: "text-slate-600", children: selectedRun.department }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2359,
              columnNumber: 28
            }, this),
            " | المنشئ: ",
            /* @__PURE__ */ jsxDEV("strong", { className: "text-slate-600", children: selectedRun.createdBy }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2359,
              columnNumber: 107
            }, this),
            " | تاريخ البدء: ",
            new Date(selectedRun.createdAt).toLocaleDateString()
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 2358,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2350,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: handleExportPayrollPDF,
              className: "p-2.5 bg-rose-50 hover:bg-rose-100 rounded-xl text-rose-700 transition-colors flex items-center justify-center gap-1.5 text-xs font-bold font-arabic",
              title: "معاينة وطباعة PDF",
              children: /* @__PURE__ */ jsxDEV(Printer, { className: "w-5 h-5" }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 2369,
                columnNumber: 19
              }, this)
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2364,
              columnNumber: 17
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => {
                setIsViewModalOpen(false);
                setSelectedRun(null);
                logActionToAudit({
                  action: "إغلاق بيئة العمل",
                  payrollRunId: selectedRun.id,
                  notes: "قام المستخدم بإغلاق بيئة عمل مسير الرواتب"
                });
              },
              className: "p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors",
              title: "إغلاق بيئة العمل",
              children: /* @__PURE__ */ jsxDEV(X, { className: "w-6 h-6" }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 2385,
                columnNumber: 19
              }, this)
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2372,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2363,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 2349,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col flex-1 overflow-y-auto w-full p-6 h-[calc(100vh-140px)]", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex-none bg-white p-6 border border-slate-200 flex flex-col justify-between rounded-2xl shadow-sm mb-6", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("div", { className: "bg-slate-50 p-4 rounded-2xl border border-slate-150 mb-4 flex flex-wrap justify-between items-center gap-4", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 text-xs font-bold text-slate-700", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "font-arabic", children: "الميزانية الإجمالية التقديرية للمسير:" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2398,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "font-mono text-emerald-600 font-extrabold text-sm", children: [
                  selectedRun.totalNetSalary.toLocaleString("en-US"),
                  " ر.س"
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2399,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 2397,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
                selectedRun.status !== "Draft" && selectedRun.status !== "Transferred" && selectedRun.status !== "Partially Paid" && isAccountant && /* @__PURE__ */ jsxDEV(
                  "button",
                  {
                    onClick: () => {
                      if (true) {
                        transitionStatus(
                          "Draft",
                          "إعادة المسير لمسودة",
                          "قام المحاسب بإعادة فتح المسير وإعادته إلى حالة (مسودة) ليتمكن من التعديل عليه مجدداً."
                        );
                      }
                    },
                    className: "px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-extrabold rounded-xl text-xs transition-all flex items-center gap-1.5 font-arabic",
                    children: [
                      /* @__PURE__ */ jsxDEV(RefreshCw, { className: "w-4 h-4 text-slate-500" }, void 0, false, {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 2416,
                        columnNumber: 27
                      }, this),
                      /* @__PURE__ */ jsxDEV("span", { children: "إعادة فتح كـ مسودة للتعديل 📂" }, void 0, false, {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 2417,
                        columnNumber: 27
                      }, this)
                    ]
                  },
                  void 0,
                  true,
                  {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2404,
                    columnNumber: 25
                  },
                  this
                ),
                selectedRun.status === "Draft" && isAccountant && /* @__PURE__ */ jsxDEV(Fragment, { children: [
                  /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      onClick: handleRefreshHrDeductions,
                      className: "px-4 py-2 bg-[#0072BC] hover:bg-[#00AEEF] text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 font-arabic",
                      title: "تحديث ومزامنة البيانات والخصومات المسجلة للموظفين من نظام الموارد البشرية مباشرة لهذا الشهر",
                      children: [
                        /* @__PURE__ */ jsxDEV(RefreshCw, { className: "w-4 h-4" }, void 0, false, {
                          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                          lineNumber: 2428,
                          columnNumber: 29
                        }, this),
                        /* @__PURE__ */ jsxDEV("span", { children: "مزامنة بيانات الموارد البشرية 🔄" }, void 0, false, {
                          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                          lineNumber: 2429,
                          columnNumber: 29
                        }, this)
                      ]
                    },
                    void 0,
                    true,
                    {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 2423,
                      columnNumber: 27
                    },
                    this
                  ),
                  /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      onClick: handleSubmitForReview,
                      className: "px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 font-arabic",
                      children: [
                        /* @__PURE__ */ jsxDEV(CheckCircle2, { className: "w-4 h-4" }, void 0, false, {
                          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                          lineNumber: 2436,
                          columnNumber: 29
                        }, this),
                        "تقديم مسير الرواتب للمراجعة والتدقيق 🚀"
                      ]
                    },
                    void 0,
                    true,
                    {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 2432,
                      columnNumber: 27
                    },
                    this
                  )
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2422,
                  columnNumber: 25
                }, this),
                selectedRun.status === "Pending Review" && isReviewer && /* @__PURE__ */ jsxDEV(Fragment, { children: [
                  /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      onClick: () => setIsModRequestModalOpen(true),
                      className: "px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-extrabold rounded-xl text-xs transition-all flex items-center gap-1.5 font-arabic",
                      children: [
                        /* @__PURE__ */ jsxDEV(AlertCircle, { className: "w-4 h-4" }, void 0, false, {
                          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                          lineNumber: 2448,
                          columnNumber: 29
                        }, this),
                        "طلب تعديلات على المسير ⚠️"
                      ]
                    },
                    void 0,
                    true,
                    {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 2444,
                      columnNumber: 27
                    },
                    this
                  ),
                  /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      onClick: handleConfirmReview,
                      className: "px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 font-arabic",
                      children: [
                        /* @__PURE__ */ jsxDEV(UserCheck, { className: "w-4 h-4" }, void 0, false, {
                          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                          lineNumber: 2456,
                          columnNumber: 29
                        }, this),
                        "مصادقة التدقيق وتأكيد الجاهزية ✓"
                      ]
                    },
                    void 0,
                    true,
                    {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 2452,
                      columnNumber: 27
                    },
                    this
                  )
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2443,
                  columnNumber: 25
                }, this),
                (selectedRun.status === "Needs Modification" || selectedRun.status === "Under Modification") && isAccountant && /* @__PURE__ */ jsxDEV(
                  "button",
                  {
                    onClick: () => {
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
                    },
                    className: "px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 font-arabic",
                    children: [
                      /* @__PURE__ */ jsxDEV(CheckCircle2, { className: "w-4 h-4" }, void 0, false, {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 2478,
                        columnNumber: 27
                      }, this),
                      "إرسال لتأكيد المراجعة بعد التعديل 🚀"
                    ]
                  },
                  void 0,
                  true,
                  {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2463,
                    columnNumber: 25
                  },
                  this
                ),
                selectedRun.status === "Pending Final Approval" && isReviewer && /* @__PURE__ */ jsxDEV(
                  "button",
                  {
                    onClick: handleFinalApproval,
                    className: "px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 font-arabic",
                    children: [
                      /* @__PURE__ */ jsxDEV(UserCheck, { className: "w-4 h-4" }, void 0, false, {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 2488,
                        columnNumber: 27
                      }, this),
                      "الاعتماد النهائي والقطعي للمسير 👑"
                    ]
                  },
                  void 0,
                  true,
                  {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2484,
                    columnNumber: 25
                  },
                  this
                ),
                selectedRun.status === "Approved" && isPayer && /* @__PURE__ */ jsxDEV(Fragment, { children: [
                  /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      onClick: () => {
                        const updatedRun = {
                          ...selectedRun,
                          employees: runEmployees,
                          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
                        };
                        setSelectedRun(updatedRun);
                        setPayrollRuns(payrollRuns.map((r) => r.id === selectedRun.id ? updatedRun : r));
                        showToast("تم حفظ حالة التحويل للموظفين بنجاح!", "Transfer statuses saved successfully!", "success");
                      },
                      className: "px-5 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-extrabold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5 font-arabic",
                      children: /* @__PURE__ */ jsxDEV("span", { children: "حفظ حالة التحويل (يدوي) 💾" }, void 0, false, {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 2510,
                        columnNumber: 27
                      }, this)
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 2495,
                      columnNumber: 25
                    },
                    this
                  ),
                  /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      onClick: () => {
                        const allChecked = runEmployees.every((e) => e.isTransferred);
                        if (!allChecked) {
                          showToast("يجب وضع علامة (تم التحويل) لجميع الموظفين قبل الاعتماد النهائي وإغلاق المسير", "Must mark all employees as transferred first", "error");
                          return;
                        }
                        setIsTransferModalOpen(true);
                      },
                      className: "px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 font-arabic",
                      children: [
                        /* @__PURE__ */ jsxDEV(CreditCard, { className: "w-4 h-4" }, void 0, false, {
                          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                          lineNumber: 2523,
                          columnNumber: 27
                        }, this),
                        "تسجيل وتوثيق تحويل الرواتب للمصرف 💸"
                      ]
                    },
                    void 0,
                    true,
                    {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 2512,
                      columnNumber: 25
                    },
                    this
                  )
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2494,
                  columnNumber: 25
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 2402,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2396,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "bg-slate-900 text-white p-4 font-black flex justify-between items-center text-xs rounded-t-2xl font-arabic", children: [
              /* @__PURE__ */ jsxDEV("span", { children: "جدول بيانات وعقود الموظفين المستحقين الرواتب هذا الشهر" }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 2533,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "bg-slate-800 px-3 py-1 rounded-full text-[#00AEEF] font-mono font-bold", children: [
                runEmployees.length,
                " موظف"
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 2534,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-slate-700", children: "تصفية البنك:" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2537,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "select",
                  {
                    value: bankFilter,
                    onChange: (e) => setBankFilter(e.target.value),
                    className: "p-2 border border-slate-200 rounded-lg text-xs",
                    children: [
                      /* @__PURE__ */ jsxDEV("option", { value: "All", children: "الجميع" }, void 0, false, {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 2543,
                        columnNumber: 25
                      }, this),
                      Array.from(new Set(runEmployees.map((e) => e.bankName || "Cash"))).map((b) => /* @__PURE__ */ jsxDEV("option", { value: b, children: b }, b, false, {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 2545,
                        columnNumber: 27
                      }, this))
                    ]
                  },
                  void 0,
                  true,
                  {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2538,
                    columnNumber: 23
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 2536,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2532,
              columnNumber: 7
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "overflow-x-auto border-x border-b border-slate-200 rounded-b-2xl", children: /* @__PURE__ */ jsxDEV("table", { className: "w-full min-w-[2200px] text-xs sm:text-[13px] text-right font-sans border-collapse relative", children: [
              /* @__PURE__ */ jsxDEV("thead", { className: "sticky top-0 bg-slate-100 shadow-xs z-10 border-b border-slate-200", children: /* @__PURE__ */ jsxDEV("tr", { className: "text-slate-700 font-extrabold text-xs uppercase bg-slate-100", children: [
                /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-4 text-right sticky right-0 bg-slate-100 z-10 border-l border-slate-200", children: "الموظف وبياناته" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2555,
                  columnNumber: 27
                }, this),
                /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-4 text-right text-sky-800", children: "الحساب البنكي 🏦" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2556,
                  columnNumber: 27
                }, this),
                /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-3 text-right", children: "الأساسي" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2557,
                  columnNumber: 27
                }, this),
                /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-3 text-right", children: "بدل سكن" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2558,
                  columnNumber: 27
                }, this),
                /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-3 text-right", children: "بدل نقل" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2559,
                  columnNumber: 27
                }, this),
                /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-3 text-right", children: "بدل إعاشة" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2560,
                  columnNumber: 27
                }, this),
                /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-3 text-right text-indigo-600", children: "بدل مدة / ساعات" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2561,
                  columnNumber: 27
                }, this),
                /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-3 text-right text-indigo-600", children: "أوفرتايم (س)" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2562,
                  columnNumber: 27
                }, this),
                /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-3 text-right text-indigo-600", children: "أوفرتايم (مبلغ)" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2563,
                  columnNumber: 27
                }, this),
                /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-3 text-right text-[#0072BC]", children: "بدلات أخرى" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2564,
                  columnNumber: 27
                }, this),
                /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-3 text-right text-rose-600", children: "خصم السلف" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2565,
                  columnNumber: 27
                }, this),
                /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-3 text-right text-rose-600", children: "خصم الغياب" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2566,
                  columnNumber: 27
                }, this),
                /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-3 text-right text-rose-600", children: "خصم التأخير" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2567,
                  columnNumber: 27
                }, this),
                /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-3 text-right text-rose-600", children: "خصم الجزاءات" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2568,
                  columnNumber: 27
                }, this),
                /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-3 text-right text-rose-600", children: "تأمينات GOSI" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2569,
                  columnNumber: 27
                }, this),
                /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-3 text-right text-rose-600", children: "خصومات أخرى" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2570,
                  columnNumber: 27
                }, this),
                /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-3 text-right text-amber-600 font-black", children: "مُدد" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2571,
                  columnNumber: 27
                }, this),
                /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-3 text-right text-emerald-600 font-black", children: "باقي الراتب" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2572,
                  columnNumber: 27
                }, this),
                /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-3 text-center", children: "تم التحويل؟" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2573,
                  columnNumber: 27
                }, this),
                /* @__PURE__ */ jsxDEV("th", { className: "py-4 px-4 text-left", children: "إجراءات" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2574,
                  columnNumber: 27
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 2554,
                columnNumber: 25
              }, this) }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 2553,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("tbody", { className: "divide-y divide-slate-200", children: runEmployees.filter((e) => bankFilter === "All" || (e.bankName || "Cash") === bankFilter).map((emp) => {
                const isEditing = editingEmployeeId === emp.id;
                const canModifyRow = selectedRun.status === "Draft" || selectedRun.status === "Needs Modification" || selectedRun.status === "Under Modification";
                return /* @__PURE__ */ jsxDEV("tr", { className: "hover:bg-slate-50/80 transition-colors", children: [
                  /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-4 sticky right-0 bg-white z-5 border-l border-slate-200 shadow-xs", children: [
                    /* @__PURE__ */ jsxDEV("div", { className: "font-extrabold text-slate-900 text-xs sm:text-[13.5px]", children: emp.arabicName }, void 0, false, {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 2588,
                      columnNumber: 33
                    }, this),
                    /* @__PURE__ */ jsxDEV("div", { className: "text-[10.5px] text-slate-500 font-mono font-bold mt-0.5", children: [
                      "ID: ",
                      emp.employeeId,
                      " | ",
                      emp.jobTitle
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 2589,
                      columnNumber: 33
                    }, this)
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2587,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-4 bg-sky-50/20", children: isEditing ? /* @__PURE__ */ jsxDEV("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxDEV(
                      "input",
                      {
                        type: "text",
                        value: editEmployeeForm.bankName ?? emp.bankName ?? "",
                        placeholder: "اسم البنك",
                        onChange: (e) => setEditEmployeeForm({
                          ...editEmployeeForm,
                          bankName: e.target.value
                        }),
                        className: "w-28 px-2 py-1.5 border-2 border-sky-200 focus:border-sky-500 rounded-lg text-[10.5px] font-bold shadow-sm"
                      },
                      void 0,
                      false,
                      {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 2598,
                        columnNumber: 37
                      },
                      this
                    ),
                    /* @__PURE__ */ jsxDEV(
                      "input",
                      {
                        type: "text",
                        value: editEmployeeForm.iban ?? emp.iban ?? "",
                        placeholder: "IBAN",
                        onChange: (e) => setEditEmployeeForm({
                          ...editEmployeeForm,
                          iban: e.target.value
                        }),
                        className: "w-44 px-2 py-1.5 border-2 border-sky-200 focus:border-sky-500 rounded-lg text-[10.5px] font-mono shadow-sm"
                      },
                      void 0,
                      false,
                      {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 2610,
                        columnNumber: 37
                      },
                      this
                    )
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2597,
                    columnNumber: 35
                  }, this) : /* @__PURE__ */ jsxDEV(
                    "div",
                    {
                      onClick: () => {
                        setSelectedBankEmployee(emp);
                        setIsBankModalOpen(true);
                        logActionToAudit({
                          action: "عرض تفاصيل البنك",
                          payrollRunId: selectedRun.id,
                          employeeId: emp.id,
                          notes: `عرض بيانات الحساب البنكي للموظف ${emp.arabicName}`
                        });
                      },
                      className: "cursor-pointer group flex flex-col items-start hover:bg-sky-50 p-1.5 rounded-lg transition-all",
                      children: [
                        /* @__PURE__ */ jsxDEV("span", { className: "bg-sky-100 text-sky-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full mb-1 group-hover:bg-[#0072BC] group-hover:text-white transition-all font-arabic", children: [
                          emp.bankName || "—",
                          " 🏦"
                        ] }, void 0, true, {
                          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                          lineNumber: 2637,
                          columnNumber: 37
                        }, this),
                        /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-mono text-slate-500 tracking-wider font-semibold select-all", children: emp.iban || "—" }, void 0, false, {
                          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                          lineNumber: 2640,
                          columnNumber: 37
                        }, this)
                      ]
                    },
                    void 0,
                    true,
                    {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 2624,
                      columnNumber: 35
                    },
                    this
                  ) }, void 0, false, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2595,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-3 font-mono font-bold text-slate-700", children: isEditing ? /* @__PURE__ */ jsxDEV(
                    "input",
                    {
                      type: "number",
                      value: editEmployeeForm.basicSalary ?? emp.basicSalary,
                      onChange: (e) => setEditEmployeeForm({
                        ...editEmployeeForm,
                        basicSalary: Number(e.target.value)
                      }),
                      className: "w-24 px-2 py-1.5 border-2 border-slate-300 focus:border-indigo-500 rounded-lg text-xs font-mono font-bold text-slate-900 text-center shadow-sm"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 2650,
                      columnNumber: 35
                    },
                    this
                  ) : emp.basicSalary.toLocaleString("en-US") }, void 0, false, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2648,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-3 font-mono font-bold text-slate-700", children: isEditing ? /* @__PURE__ */ jsxDEV(
                    "input",
                    {
                      type: "number",
                      value: editEmployeeForm.housingAllowance ?? emp.housingAllowance,
                      onChange: (e) => setEditEmployeeForm({
                        ...editEmployeeForm,
                        housingAllowance: Number(e.target.value)
                      }),
                      className: "w-24 px-2 py-1.5 border-2 border-slate-300 focus:border-indigo-500 rounded-lg text-xs font-mono font-bold text-slate-900 text-center shadow-sm"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 2669,
                      columnNumber: 35
                    },
                    this
                  ) : emp.housingAllowance.toLocaleString("en-US") }, void 0, false, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2667,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-3 font-mono font-bold text-slate-700", children: isEditing ? /* @__PURE__ */ jsxDEV(
                    "input",
                    {
                      type: "number",
                      value: editEmployeeForm.transportAllowance ?? emp.transportAllowance,
                      onChange: (e) => setEditEmployeeForm({
                        ...editEmployeeForm,
                        transportAllowance: Number(e.target.value)
                      }),
                      className: "w-24 px-2 py-1.5 border-2 border-slate-300 focus:border-indigo-500 rounded-lg text-xs font-mono font-bold text-slate-900 text-center shadow-sm"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 2688,
                      columnNumber: 35
                    },
                    this
                  ) : emp.transportAllowance.toLocaleString("en-US") }, void 0, false, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2686,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-3 font-mono font-bold text-slate-700", children: isEditing ? /* @__PURE__ */ jsxDEV(
                    "input",
                    {
                      type: "number",
                      value: editEmployeeForm.livingAllowance ?? emp.livingAllowance ?? emp.foodAllowance ?? 0,
                      onChange: (e) => setEditEmployeeForm({
                        ...editEmployeeForm,
                        livingAllowance: Number(e.target.value)
                      }),
                      className: "w-24 px-2 py-1.5 border-2 border-slate-300 focus:border-indigo-500 rounded-lg text-xs font-mono font-bold text-slate-900 text-center shadow-sm"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 2707,
                      columnNumber: 35
                    },
                    this
                  ) : (emp.livingAllowance ?? emp.foodAllowance ?? 0).toLocaleString("en-US") }, void 0, false, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2705,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-3 font-mono text-indigo-600 font-bold", children: isEditing ? /* @__PURE__ */ jsxDEV(
                    "input",
                    {
                      type: "number",
                      value: editEmployeeForm.muddahAmount ?? emp.muddahAmount,
                      onChange: (e) => setEditEmployeeForm({
                        ...editEmployeeForm,
                        muddahAmount: Number(e.target.value)
                      }),
                      className: "w-24 px-2 py-1.5 border-2 border-indigo-300 focus:border-indigo-500 rounded-lg text-xs font-mono font-bold text-indigo-900 text-center bg-indigo-50 shadow-sm"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 2726,
                      columnNumber: 35
                    },
                    this
                  ) : (emp.muddahAmount || 0).toLocaleString("en-US") }, void 0, false, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2724,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-3 font-mono font-bold text-indigo-600", children: isEditing ? /* @__PURE__ */ jsxDEV(
                    "input",
                    {
                      type: "number",
                      value: editEmployeeForm.overtimeHours ?? emp.overtimeHours,
                      onChange: (e) => {
                        const hrs = Number(e.target.value);
                        const base = editEmployeeForm.basicSalary ?? emp.basicSalary;
                        const pay = updateHourlyOtAmount(hrs, base);
                        setEditEmployeeForm({
                          ...editEmployeeForm,
                          overtimeHours: hrs,
                          overtimeAmount: pay
                        });
                      },
                      className: "w-20 px-2 py-1.5 border-2 border-slate-300 focus:border-indigo-500 rounded-lg text-xs font-mono font-bold text-slate-900 text-center shadow-sm"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 2745,
                      columnNumber: 35
                    },
                    this
                  ) : emp.overtimeHours }, void 0, false, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2743,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-3 font-mono text-indigo-600 font-bold", children: isEditing ? /* @__PURE__ */ jsxDEV(
                    "input",
                    {
                      type: "number",
                      value: editEmployeeForm.overtimeAmount ?? emp.overtimeAmount,
                      onChange: (e) => setEditEmployeeForm({
                        ...editEmployeeForm,
                        overtimeAmount: Number(e.target.value)
                      }),
                      className: "w-24 px-2 py-1.5 border-2 border-slate-300 focus:border-indigo-500 rounded-lg text-xs font-mono font-bold text-slate-900 text-center shadow-sm"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 2768,
                      columnNumber: 35
                    },
                    this
                  ) : emp.overtimeAmount.toLocaleString("en-US") }, void 0, false, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2766,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-3 font-mono font-bold text-[#0072BC]", children: isEditing ? /* @__PURE__ */ jsxDEV(
                    "input",
                    {
                      type: "number",
                      value: editEmployeeForm.otherAllowances ?? emp.otherAllowances ?? 0,
                      onChange: (e) => setEditEmployeeForm({
                        ...editEmployeeForm,
                        otherAllowances: Number(e.target.value)
                      }),
                      className: "w-24 px-2 py-1.5 border-2 border-slate-300 focus:border-indigo-500 rounded-lg text-xs font-mono font-bold text-slate-900 text-center shadow-sm"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 2787,
                      columnNumber: 35
                    },
                    this
                  ) : (emp.otherAllowances || 0).toLocaleString("en-US") }, void 0, false, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2785,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-3 font-mono font-bold text-rose-600", children: isEditing ? /* @__PURE__ */ jsxDEV("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxDEV(
                      "input",
                      {
                        type: "number",
                        value: editEmployeeForm.loansDeduction ?? emp.loansDeduction,
                        onChange: (e) => setEditEmployeeForm({
                          ...editEmployeeForm,
                          loansDeduction: Number(e.target.value)
                        }),
                        className: "w-24 px-2 py-1.5 border-2 border-slate-300 focus:border-indigo-500 rounded-lg text-xs font-mono font-bold text-slate-900 text-center shadow-sm"
                      },
                      void 0,
                      false,
                      {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 2807,
                        columnNumber: 37
                      },
                      this
                    ),
                    /* @__PURE__ */ jsxDEV(
                      "input",
                      {
                        type: "text",
                        value: editEmployeeForm.loanDeductionReason ?? emp.loanDeductionReason ?? "",
                        placeholder: "السبب *",
                        onChange: (e) => setEditEmployeeForm({
                          ...editEmployeeForm,
                          loanDeductionReason: e.target.value
                        }),
                        className: "w-24 px-1.5 py-1 border border-slate-300 rounded text-[10px]"
                      },
                      void 0,
                      false,
                      {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 2818,
                        columnNumber: 37
                      },
                      this
                    )
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2806,
                    columnNumber: 35
                  }, this) : /* @__PURE__ */ jsxDEV(
                    "div",
                    {
                      onClick: () => {
                        if (emp.loansDeduction > 0) {
                          setSelectedDeductionEmployee(emp);
                          setClickedDeductionType("Loan");
                          setIsDeductionModalOpen(true);
                        }
                      },
                      className: `${emp.loansDeduction > 0 ? "cursor-pointer hover:underline font-bold" : "text-slate-300"}`,
                      children: emp.loansDeduction.toLocaleString("en-US")
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 2832,
                      columnNumber: 35
                    },
                    this
                  ) }, void 0, false, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2804,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-3 font-mono font-bold text-rose-600", children: isEditing ? /* @__PURE__ */ jsxDEV("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxDEV(
                      "input",
                      {
                        type: "number",
                        value: editEmployeeForm.absenceDeduction ?? emp.absenceDeduction ?? 0,
                        onChange: (e) => setEditEmployeeForm({
                          ...editEmployeeForm,
                          absenceDeduction: Number(e.target.value)
                        }),
                        className: "w-24 px-2 py-1.5 border-2 border-slate-300 focus:border-indigo-500 rounded-lg text-xs font-mono font-bold text-slate-900 text-center shadow-sm"
                      },
                      void 0,
                      false,
                      {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 2851,
                        columnNumber: 37
                      },
                      this
                    ),
                    /* @__PURE__ */ jsxDEV(
                      "input",
                      {
                        type: "text",
                        value: editEmployeeForm.absenceDeductionReason ?? emp.absenceDeductionReason ?? "",
                        placeholder: "السبب *",
                        onChange: (e) => setEditEmployeeForm({
                          ...editEmployeeForm,
                          absenceDeductionReason: e.target.value
                        }),
                        className: "w-24 px-1.5 py-1 border border-slate-300 rounded text-[10px]"
                      },
                      void 0,
                      false,
                      {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 2862,
                        columnNumber: 37
                      },
                      this
                    )
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2850,
                    columnNumber: 35
                  }, this) : /* @__PURE__ */ jsxDEV(
                    "div",
                    {
                      onClick: () => {
                        if ((emp.absenceDeduction || 0) > 0) {
                          setSelectedDeductionEmployee(emp);
                          setClickedDeductionType("Absence");
                          setIsDeductionModalOpen(true);
                        }
                      },
                      className: `${(emp.absenceDeduction || 0) > 0 ? "cursor-pointer hover:underline font-bold" : "text-slate-300"}`,
                      children: (emp.absenceDeduction || 0).toLocaleString("en-US")
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 2876,
                      columnNumber: 35
                    },
                    this
                  ) }, void 0, false, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2848,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-3 font-mono font-bold text-rose-600", children: isEditing ? /* @__PURE__ */ jsxDEV("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxDEV(
                      "input",
                      {
                        type: "number",
                        value: editEmployeeForm.lateDeduction ?? emp.lateDeduction ?? 0,
                        onChange: (e) => setEditEmployeeForm({
                          ...editEmployeeForm,
                          lateDeduction: Number(e.target.value)
                        }),
                        className: "w-24 px-2 py-1.5 border-2 border-slate-300 focus:border-indigo-500 rounded-lg text-xs font-mono font-bold text-slate-900 text-center shadow-sm"
                      },
                      void 0,
                      false,
                      {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 2895,
                        columnNumber: 37
                      },
                      this
                    ),
                    /* @__PURE__ */ jsxDEV(
                      "input",
                      {
                        type: "text",
                        value: editEmployeeForm.lateDeductionReason ?? emp.lateDeductionReason ?? "",
                        placeholder: "السبب *",
                        onChange: (e) => setEditEmployeeForm({
                          ...editEmployeeForm,
                          lateDeductionReason: e.target.value
                        }),
                        className: "w-24 px-1.5 py-1 border border-slate-300 rounded text-[10px]"
                      },
                      void 0,
                      false,
                      {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 2906,
                        columnNumber: 37
                      },
                      this
                    )
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2894,
                    columnNumber: 35
                  }, this) : /* @__PURE__ */ jsxDEV(
                    "div",
                    {
                      onClick: () => {
                        if ((emp.lateDeduction || 0) > 0) {
                          setSelectedDeductionEmployee(emp);
                          setClickedDeductionType("Late");
                          setIsDeductionModalOpen(true);
                        }
                      },
                      className: `${(emp.lateDeduction || 0) > 0 ? "cursor-pointer hover:underline font-bold" : "text-slate-300"}`,
                      children: (emp.lateDeduction || 0).toLocaleString("en-US")
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 2920,
                      columnNumber: 35
                    },
                    this
                  ) }, void 0, false, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2892,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-3 font-mono font-bold text-rose-600", children: isEditing ? /* @__PURE__ */ jsxDEV("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxDEV(
                      "input",
                      {
                        type: "number",
                        value: editEmployeeForm.penaltyDeduction ?? emp.penaltyDeduction ?? 0,
                        onChange: (e) => setEditEmployeeForm({
                          ...editEmployeeForm,
                          penaltyDeduction: Number(e.target.value)
                        }),
                        className: "w-24 px-2 py-1.5 border-2 border-slate-300 focus:border-indigo-500 rounded-lg text-xs font-mono font-bold text-slate-900 text-center shadow-sm"
                      },
                      void 0,
                      false,
                      {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 2939,
                        columnNumber: 37
                      },
                      this
                    ),
                    /* @__PURE__ */ jsxDEV(
                      "input",
                      {
                        type: "text",
                        value: editEmployeeForm.penaltyDeductionReason ?? emp.penaltyDeductionReason ?? "",
                        placeholder: "السبب *",
                        onChange: (e) => setEditEmployeeForm({
                          ...editEmployeeForm,
                          penaltyDeductionReason: e.target.value
                        }),
                        className: "w-24 px-1.5 py-1 border border-slate-300 rounded text-[10px]"
                      },
                      void 0,
                      false,
                      {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 2950,
                        columnNumber: 37
                      },
                      this
                    )
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2938,
                    columnNumber: 35
                  }, this) : /* @__PURE__ */ jsxDEV(
                    "div",
                    {
                      onClick: () => {
                        if ((emp.penaltyDeduction || 0) > 0) {
                          setSelectedDeductionEmployee(emp);
                          setClickedDeductionType("Penalty");
                          setIsDeductionModalOpen(true);
                        }
                      },
                      className: `${(emp.penaltyDeduction || 0) > 0 ? "cursor-pointer hover:underline font-bold" : "text-slate-300"}`,
                      children: (emp.penaltyDeduction || 0).toLocaleString("en-US")
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 2964,
                      columnNumber: 35
                    },
                    this
                  ) }, void 0, false, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2936,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-3 font-mono font-bold text-rose-600", children: isEditing ? /* @__PURE__ */ jsxDEV(
                    "input",
                    {
                      type: "number",
                      value: editEmployeeForm.gosiDeduction ?? emp.gosiDeduction,
                      onChange: (e) => setEditEmployeeForm({
                        ...editEmployeeForm,
                        gosiDeduction: Number(e.target.value)
                      }),
                      className: "w-24 px-2 py-1.5 border-2 border-slate-300 focus:border-indigo-500 rounded-lg text-xs font-mono font-bold text-slate-900 text-center shadow-sm"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 2982,
                      columnNumber: 35
                    },
                    this
                  ) : emp.gosiDeduction.toLocaleString("en-US") }, void 0, false, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2980,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-3 font-mono text-rose-600 font-bold text-center", children: isEditing ? emp.otherDeductions > 0 ? /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      onClick: () => {
                        setSelectedDeductionEmployee(emp);
                        setClickedDeductionType("Other");
                        setIsDeductionModalOpen(true);
                      },
                      className: "px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded border border-rose-200 text-sm font-bold transition-colors",
                      title: "إدارة الاستقطاعات التفصيلية",
                      children: emp.otherDeductions.toLocaleString("en-US")
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 3002,
                      columnNumber: 37
                    },
                    this
                  ) : /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      onClick: () => {
                        setSelectedDeductionEmployee(emp);
                        setClickedDeductionType("Other");
                        setIsDeductionModalOpen(true);
                      },
                      className: "px-2 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded text-[11px] font-bold whitespace-nowrap transition-colors",
                      children: "إضافة خصم +"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 3014,
                      columnNumber: 37
                    },
                    this
                  ) : /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      className: "px-2 py-1 bg-transparent hover:bg-rose-50 text-rose-600 rounded text-sm font-bold transition-colors",
                      onClick: () => {
                        setSelectedDeductionEmployee(emp);
                        setClickedDeductionType("Other");
                        setIsDeductionModalOpen(true);
                      },
                      title: "إدارة الاستقطاعات التفصيلية",
                      children: emp.otherDeductions > 0 ? emp.otherDeductions.toLocaleString("en-US") : "0"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 3026,
                      columnNumber: 35
                    },
                    this
                  ) }, void 0, false, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 2999,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("td", { className: "py-4 px-3 font-mono text-emerald-600 font-extrabold text-[13.5px]", children: [
                    emp.netSalary.toLocaleString("en-US"),
                    " ر.س"
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 3041,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("td", { className: "py-3 px-4 text-left", children: /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1.5 justify-end", children: isEditing ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
                    /* @__PURE__ */ jsxDEV(
                      "button",
                      {
                        onClick: () => handleSaveEmployeeRow(emp.id),
                        className: "p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 font-bold text-xs",
                        title: "حفظ التعديلات",
                        children: "✓"
                      },
                      void 0,
                      false,
                      {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 3050,
                        columnNumber: 39
                      },
                      this
                    ),
                    /* @__PURE__ */ jsxDEV(
                      "button",
                      {
                        onClick: () => {
                          setEditingEmployeeId(null);
                          setEditEmployeeForm({});
                        },
                        className: "p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 font-bold text-xs",
                        title: "إلغاء التعديل",
                        children: "✕"
                      },
                      void 0,
                      false,
                      {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 3057,
                        columnNumber: 39
                      },
                      this
                    )
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 3049,
                    columnNumber: 37
                  }, this) : /* @__PURE__ */ jsxDEV(Fragment, { children: [
                    canModifyRow && isAccountant && /* @__PURE__ */ jsxDEV(
                      "button",
                      {
                        onClick: () => {
                          setEditingEmployeeId(emp.id);
                          setEditEmployeeForm(emp);
                        },
                        className: "p-1 text-[#0072BC] hover:bg-blue-50 rounded",
                        title: "تعديل يدوياً",
                        children: /* @__PURE__ */ jsxDEV(Edit3, { className: "w-3.5 h-3.5" }, void 0, false, {
                          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                          lineNumber: 3079,
                          columnNumber: 43
                        }, this)
                      },
                      void 0,
                      false,
                      {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 3071,
                        columnNumber: 41
                      },
                      this
                    ),
                    /* @__PURE__ */ jsxDEV(
                      "button",
                      {
                        onClick: () => {
                          setSelectedPayslipEmployee(emp);
                          setIsPayslipModalOpen(true);
                        },
                        className: "px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold flex items-center gap-0.5",
                        title: "عرض كشف الراتب الفردي",
                        children: [
                          /* @__PURE__ */ jsxDEV(FileText, { className: "w-3 h-3" }, void 0, false, {
                            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                            lineNumber: 3091,
                            columnNumber: 41
                          }, this),
                          "كشف راتب"
                        ]
                      },
                      void 0,
                      true,
                      {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 3083,
                        columnNumber: 39
                      },
                      this
                    ),
                    canModifyRow && /* @__PURE__ */ jsxDEV(
                      "button",
                      {
                        onClick: () => {
                          if (true) {
                            handleRemoveEmployeeRow(emp.id);
                          }
                        },
                        className: "px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-[10px] font-bold flex items-center gap-0.5",
                        title: "حذف الموظف من المسير",
                        children: [
                          /* @__PURE__ */ jsxDEV(Trash2, { className: "w-3 h-3" }, void 0, false, {
                            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                            lineNumber: 3104,
                            columnNumber: 43
                          }, this),
                          "حذف"
                        ]
                      },
                      void 0,
                      true,
                      {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 3095,
                        columnNumber: 41
                      },
                      this
                    )
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 3069,
                    columnNumber: 37
                  }, this) }, void 0, false, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 3047,
                    columnNumber: 33
                  }, this) }, void 0, false, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 3046,
                    columnNumber: 31
                  }, this)
                ] }, emp.id, true, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 2586,
                  columnNumber: 29
                }, this);
              }) }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 2577,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2552,
              columnNumber: 21
            }, this) }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 2551,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 2395,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "bg-slate-50 p-4 border border-slate-200 rounded-2xl grid grid-cols-2 md:grid-cols-6 gap-4 text-xs mt-4", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "p-3 bg-white rounded-xl border border-slate-150", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-slate-400 font-bold font-arabic", children: "إجمالي الأساسي المستحق:" }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3123,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "font-mono font-bold text-sm text-slate-800 mt-1", children: [
                runEmployees.reduce((sum, e) => sum + e.basicSalary, 0).toLocaleString("en-US"),
                " ر.س"
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3124,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3122,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "p-3 bg-white rounded-xl border border-slate-150", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-slate-400 font-bold font-arabic", children: "إجمالي البدلات والمكتسبات:" }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3130,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "font-mono font-bold text-sm text-indigo-600 mt-1", children: [
                "+",
                runEmployees.reduce(
                  (sum, e) => sum + e.housingAllowance + e.transportAllowance + (e.livingAllowance ?? e.foodAllowance ?? 0) + e.overtimeAmount + (e.otherAllowances || 0) + e.muddahAmount,
                  0
                ).toLocaleString("en-US"),
                " ",
                "ر.س"
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3131,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3129,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "p-3 bg-white rounded-xl border border-slate-150", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-slate-400 font-bold font-arabic", children: "إجمالي الاستقطاعات والجزاءات:" }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3151,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "font-mono font-bold text-sm text-rose-600 mt-1", children: [
                "-",
                runEmployees.reduce((sum, e) => sum + e.totalDeductions, 0).toLocaleString("en-US"),
                " ",
                "ر.س"
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3152,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3150,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "p-3 bg-white rounded-xl border border-slate-150", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-slate-400 font-bold font-arabic", children: "إجمالي مُدد:" }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3162,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "font-mono font-bold text-sm text-amber-600 mt-1", children: [
                runEmployees.reduce((sum, e) => sum + (e.muddahAmount || 0), 0).toLocaleString("en-US"),
                " ر.س"
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3163,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3161,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "p-3 bg-white rounded-xl border border-slate-150", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-slate-400 font-bold block mb-1 font-arabic", children: "Total Overtime | إجمالي الأوفر تايم:" }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3168,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "font-mono font-bold text-sm text-indigo-700", children: [
                runEmployees.reduce((sum, e) => sum + (e.overtimeAmount || 0), 0).toLocaleString("en-US"),
                " ر.س"
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3169,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "text-[10px] text-slate-500 font-mono font-bold mt-1", children: [
                "Total OT Hours: ",
                runEmployees.reduce((sum, e) => sum + (e.overtimeHours || 0), 0).toLocaleString("en-US")
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3172,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "text-[10px] text-slate-500 font-mono font-bold", children: [
                "Total OT Amount: ",
                runEmployees.reduce((sum, e) => sum + (e.overtimeAmount || 0), 0).toLocaleString("en-US"),
                " ر.s"
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3175,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3167,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "p-3 bg-slate-900 text-white rounded-xl", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-slate-400 font-bold font-arabic", children: "صافي الميزانية المصرفية للتحويل:" }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3181,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "font-mono font-black text-sm text-emerald-400 mt-1", children: [
                runEmployees.reduce((sum, e) => sum + e.netSalary, 0).toLocaleString("en-US"),
                " ر.س"
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3182,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3180,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3121,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 2394,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "w-full bg-slate-50 p-6 border border-slate-200 space-y-6 grid grid-cols-1 md:grid-cols-2 gap-6 rounded-2xl shadow-sm", children: /* @__PURE__ */ jsxDEV("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-xs", children: [
            /* @__PURE__ */ jsxDEV("h4", { className: "font-black text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-100 pb-2 font-arabic", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-emerald-500 font-mono", children: "📊" }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3195,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("span", { children: "ملخص الميزانية والمسير" }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3196,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3194,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 gap-3 text-[11px]", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "bg-slate-50 p-2.5 rounded-xl border border-slate-100", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-slate-400 font-bold block mb-1 font-arabic", children: "إجمالي الأساسي:" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3200,
                  columnNumber: 25
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "font-mono text-xs font-black text-slate-700", children: [
                  runEmployees.reduce((sum, e) => sum + e.basicSalary, 0).toLocaleString("en-US"),
                  " ر.س"
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3201,
                  columnNumber: 25
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3199,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "bg-slate-50 p-2.5 rounded-xl border border-slate-100", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-slate-400 font-bold block mb-1 font-arabic", children: "إجمالي البدلات:" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3206,
                  columnNumber: 25
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "font-mono text-xs font-black text-indigo-600", children: [
                  "+",
                  runEmployees.reduce((sum, e) => sum + e.housingAllowance + e.transportAllowance + (e.livingAllowance ?? e.foodAllowance ?? 0) + (e.overtimeAmount || 0) + (e.otherAllowances || 0), 0).toLocaleString("en-US"),
                  " ر.س"
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3207,
                  columnNumber: 25
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3205,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "bg-slate-50 p-2.5 rounded-xl border border-slate-100", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-slate-400 font-bold block mb-1 font-arabic", children: "إجمالي الخصومات:" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3212,
                  columnNumber: 25
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "font-mono text-xs font-black text-rose-600", children: [
                  "-",
                  runEmployees.reduce((sum, e) => sum + e.totalDeductions, 0).toLocaleString("en-US"),
                  " ر.س"
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3213,
                  columnNumber: 25
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3211,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "bg-slate-900 text-white p-2.5 rounded-xl", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-slate-400 font-bold block mb-0.5 text-[9px] font-arabic", children: "الصافي الكلي:" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3218,
                  columnNumber: 25
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "font-mono text-xs font-black text-emerald-400", children: [
                  runEmployees.reduce((sum, e) => sum + e.netSalary, 0).toLocaleString("en-US"),
                  " ر.س"
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3219,
                  columnNumber: 25
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3217,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3198,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3193,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "bg-white p-5 rounded-2xl border border-slate-200 shadow-xs", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center mb-3 pb-2 border-b border-slate-100", children: /* @__PURE__ */ jsxDEV("h4", { className: "font-black text-slate-800 text-xs flex items-center gap-1.5 font-arabic", children: [
              /* @__PURE__ */ jsxDEV(AlertCircle, { className: "w-4 h-4 text-rose-500" }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3230,
                columnNumber: 25
              }, this),
              /* @__PURE__ */ jsxDEV("span", { children: "سجل ملاحظات المراجعة وتعديلات المدققين" }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3231,
                columnNumber: 25
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3229,
              columnNumber: 23
            }, this) }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3228,
              columnNumber: 21
            }, this),
            runModificationRequests.length === 0 ? /* @__PURE__ */ jsxDEV("div", { className: "py-6 text-center text-slate-400 italic text-[10px] font-arabic", children: "لا يوجد أي طلبات تعديل أو ملاحظات مسجلة حالياً." }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3236,
              columnNumber: 23
            }, this) : /* @__PURE__ */ jsxDEV("div", { className: "space-y-2.5 max-h-48 overflow-y-auto", children: runModificationRequests.map((req) => /* @__PURE__ */ jsxDEV("div", { className: "bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-1 text-[11px]", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "font-black text-[#0072BC] font-mono", children: req.id }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3244,
                  columnNumber: 31
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: `px-1.5 py-0.5 text-[9px] rounded font-bold font-arabic ${req.status === "Open" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`, children: req.status === "Open" ? "مفتوح" : "مكتمل ومغلق" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3245,
                  columnNumber: 31
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3243,
                columnNumber: 29
              }, this),
              /* @__PURE__ */ jsxDEV("p", { className: "text-slate-700 leading-relaxed font-bold font-arabic", children: [
                '"',
                req.notes,
                '"'
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3249,
                columnNumber: 29
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "text-[9px] text-slate-400 font-mono font-bold", children: [
                "المدقق: ",
                req.requestedBy,
                " | بتاريخ: ",
                new Date(req.requestedAt).toLocaleDateString()
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3250,
                columnNumber: 29
              }, this),
              req.responseNotes ? /* @__PURE__ */ jsxDEV("div", { className: "bg-white p-2 rounded border border-slate-150 mt-1.5", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-[9px] font-black text-emerald-600 block font-arabic", children: "رد المحاسب:" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3255,
                  columnNumber: 33
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-slate-600 italic mt-0.5 font-arabic font-bold", children: [
                  '"',
                  req.responseNotes,
                  '"'
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3256,
                  columnNumber: 33
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3254,
                columnNumber: 31
              }, this) : isAccountant && req.status === "Open" && /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: () => {
                    setSelectedRequestForResponse(req);
                    setIsModResponseModalOpen(true);
                  },
                  className: "w-full mt-1.5 text-center py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[9px] font-bold font-arabic",
                  children: "الرد وإغلاق الطلب 💬"
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3260,
                  columnNumber: 33
                },
                this
              )
            ] }, req.id, true, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3242,
              columnNumber: 27
            }, this)) }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3240,
              columnNumber: 23
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3227,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "bg-white p-5 rounded-2xl border border-slate-200 shadow-xs", children: [
            /* @__PURE__ */ jsxDEV("h4", { className: "font-black text-slate-800 text-xs flex items-center gap-1.5 mb-3 pb-2 border-b border-slate-100 font-arabic", children: [
              /* @__PURE__ */ jsxDEV(History, { className: "w-4 h-4 text-indigo-500" }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3280,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("span", { children: "سجل العمليات التدقيقي (Audit Log)" }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3281,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3279,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "space-y-2 max-h-48 overflow-y-auto font-sans", children: runAuditLogs.slice().reverse().map((log) => /* @__PURE__ */ jsxDEV("div", { className: "bg-slate-50 p-2.5 rounded-xl border border-slate-150 text-[10.5px]", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center text-[9px] text-slate-400 font-mono font-bold mb-1", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "font-extrabold text-slate-700 font-arabic", children: log.action }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3290,
                  columnNumber: 31
                }, this),
                /* @__PURE__ */ jsxDEV("span", { children: new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3291,
                  columnNumber: 31
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3289,
                columnNumber: 29
              }, this),
              /* @__PURE__ */ jsxDEV("p", { className: "text-slate-600 font-arabic font-bold", children: log.details }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3293,
                columnNumber: 29
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "text-[8.5px] text-slate-400 mt-1 font-arabic", children: [
                "بواسطة: ",
                log.operatorName,
                " | ",
                new Date(log.timestamp).toLocaleDateString()
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3294,
                columnNumber: 29
              }, this)
            ] }, log.id, true, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3288,
              columnNumber: 27
            }, this)) }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3283,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3278,
            columnNumber: 19
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3191,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3190,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 2391,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center bg-white px-6 py-4 border-t border-slate-200 shadow-md z-10", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-slate-500 font-arabic", children: "بيئة عمل مسير الرواتب الإلكتروني الموحد لشركة فنون الوليد للصناعة" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3307,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { children: /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => {
              setIsViewModalOpen(false);
              setSelectedRun(null);
              logActionToAudit({
                action: "إغلاق بيئة العمل",
                payrollRunId: selectedRun.id,
                notes: "قام المستخدم بإغلاق بيئة عمل مسير الرواتب بالضغط على زر إغلاق بيئة العمل"
              });
            },
            className: "px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs transition-colors shadow-md hover:shadow-lg font-arabic",
            children: "إغلاق بيئة العمل / Close Workspace ✕"
          },
          void 0,
          false,
          {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3311,
            columnNumber: 17
          },
          this
        ) }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3310,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 3306,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
      lineNumber: 2347,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
      lineNumber: 2346,
      columnNumber: 9
    }, this),
    isPayslipModalOpen && selectedPayslipEmployee && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 bg-slate-100 z-50 overflow-y-auto p-0 sm:p-6 md:p-10 flex flex-col", children: /* @__PURE__ */ jsxDEV("div", { className: "w-full max-w-4xl mx-auto bg-white min-h-screen sm:min-h-0 sm:rounded-3xl p-6 sm:p-10 relative shadow-2xl border border-slate-200 flex flex-col justify-between", children: [
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => {
            setIsPayslipModalOpen(false);
            setSelectedPayslipEmployee(null);
          },
          className: "absolute left-6 top-6 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-all hover:scale-105",
          title: "إغلاق والرجوع إلى قائمة الرواتب",
          children: /* @__PURE__ */ jsxDEV(X, { className: "w-6 h-6" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3344,
            columnNumber: 15
          }, this)
        },
        void 0,
        false,
        {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3336,
          columnNumber: 13
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "border-b-2 border-slate-200 pb-6 mb-8", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col sm:flex-row justify-between items-start gap-4", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("h2", { className: "text-xl sm:text-2xl font-black text-slate-900", children: "شركة فنون الوليد للصناعة" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3351,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-xs sm:text-sm text-slate-500 font-mono mt-1", children: "FONOUN ALWALEED INDUSTRIAL CO." }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3352,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3350,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "text-right sm:text-left", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "px-3.5 py-1.5 bg-sky-50 text-[#0072BC] text-xs font-black rounded-full border border-sky-100", children: "كشف راتب موظف معتمد رسمي" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3355,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-slate-500 mt-2.5 font-mono font-bold", children: [
              "كود المسير: ",
              selectedRun?.payrollNumber
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3358,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3354,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3349,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("h1", { className: "text-base sm:text-lg font-extrabold text-slate-800 mt-6 flex items-center gap-2 border-r-4 border-[#0072BC] pr-3", children: "كشف راتب تفصيلي للشهر الحالي | Employee Detailed Payslip" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3361,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 3348,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-150 text-xs sm:text-sm", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between border-b border-slate-200 pb-2", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-slate-500 font-bold", children: "اسم الموظف:" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3370,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("strong", { className: "text-slate-950 font-black", children: selectedPayslipEmployee.arabicName }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3371,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3369,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between border-b border-slate-200 pb-2", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-slate-500 font-bold", children: "المسمى الوظيفي:" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3374,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("strong", { className: "text-slate-800", children: selectedPayslipEmployee.jobTitle }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3375,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3373,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between border-b border-slate-200 pb-2", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-slate-500 font-bold", children: "رقم الإقامة / الهوية:" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3378,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("strong", { className: "font-mono text-slate-800", children: selectedPayslipEmployee.iqamaId }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3379,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3377,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-slate-500 font-bold", children: "القسم / الورشة:" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3382,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("strong", { className: "text-slate-800", children: selectedPayslipEmployee.department || "المصنع العام" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3383,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3381,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3368,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between border-b border-slate-200 pb-2", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-slate-500 font-bold", children: "اسم البنك المعتمد:" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3388,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("strong", { className: "text-slate-800", children: selectedPayslipEmployee.bankName || "—" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3389,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3387,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between border-b border-slate-200 pb-2", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-slate-500 font-bold", children: "رقم الحساب (IBAN):" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3392,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("strong", { className: "font-mono text-slate-800 select-all tracking-wider font-bold", children: selectedPayslipEmployee.iban || "—" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3393,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3391,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between border-b border-slate-200 pb-2", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-slate-500 font-bold", children: "طريقة التحويل المالي:" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3396,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("strong", { className: "text-slate-800", children: selectedPayslipEmployee.transferMethod || "تحويل بنكي مباشر (SARIE)" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3397,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3395,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-slate-500 font-bold", children: "تاريخ الطباعة / العرض:" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3400,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("strong", { className: "text-slate-800 font-mono font-bold", children: (/* @__PURE__ */ new Date()).toLocaleDateString("en-US") }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3401,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3399,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3386,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 3367,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 mt-8", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "bg-emerald-50/20 p-5 rounded-2xl border border-emerald-100/70 flex flex-col justify-between", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("h3", { className: "text-xs sm:text-sm font-black text-emerald-800 mb-4 border-b border-emerald-100 pb-2 flex items-center gap-2", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "w-2.5 h-2.5 rounded-full bg-emerald-500" }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3412,
                columnNumber: 21
              }, this),
              "البنود المالية المستحقة (المكتسبات)"
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3411,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "space-y-3 text-xs sm:text-sm", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center py-1 border-b border-emerald-50/50", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-slate-600 font-medium", children: "الراتب الأساسي المستحق" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3417,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "font-mono font-bold text-slate-900", children: [
                  selectedPayslipEmployee.basicSalary.toLocaleString("en-US"),
                  " ر.س"
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3418,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3416,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center py-1 border-b border-emerald-50/50", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-slate-600 font-medium", children: "بدل السكن المؤمن" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3421,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "font-mono font-bold text-slate-900", children: [
                  selectedPayslipEmployee.housingAllowance.toLocaleString("en-US"),
                  " ر.س"
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3422,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3420,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center py-1 border-b border-emerald-50/50", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-slate-600 font-medium", children: "بدل النقل وتوصيل الورشة" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3425,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "font-mono font-bold text-slate-900", children: [
                  selectedPayslipEmployee.transportAllowance.toLocaleString("en-US"),
                  " ر.س"
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3426,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3424,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center py-1 border-b border-emerald-50/50", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-slate-600 font-medium", children: "بدل جوال اتصال وتنسيق" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3429,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "font-mono font-bold text-slate-900", children: [
                  selectedPayslipEmployee.phoneAllowance.toLocaleString("en-US"),
                  " ر.س"
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3430,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3428,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center py-1 border-b border-emerald-50/50", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-slate-600 font-medium", children: "بدل إعاشة وتغذية" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3433,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "font-mono font-bold text-slate-900", children: [
                  selectedPayslipEmployee.foodAllowance.toLocaleString("en-US"),
                  " ر.س"
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3434,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3432,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center py-1 border-b border-emerald-50/50", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-slate-600 font-medium", children: "بدل مدة / ساعات إضافية" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3437,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "font-mono font-bold text-slate-900", children: [
                  (selectedPayslipEmployee.muddahAmount || 0).toLocaleString("en-US"),
                  " ر.س"
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3438,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3436,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center py-1 border-b border-emerald-50/50", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-slate-600 font-medium", children: [
                  "أوفر تايم (إضافي: ",
                  selectedPayslipEmployee.overtimeHours,
                  " س)"
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3441,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "font-mono font-bold text-slate-900", children: [
                  selectedPayslipEmployee.overtimeAmount.toLocaleString("en-US"),
                  " ر.س"
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3442,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3440,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center py-1", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-slate-600 font-medium", children: [
                  "مكافآت وبدلات إدارية أخرى",
                  selectedPayslipEmployee.otherAllowancesReason && /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] bg-sky-100 text-[#0072BC] px-2 py-0.5 rounded-md mr-1.5 font-bold", children: selectedPayslipEmployee.otherAllowancesReason }, void 0, false, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 3448,
                    columnNumber: 27
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3445,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "font-mono font-bold text-slate-900", children: [
                  (selectedPayslipEmployee.otherAllowances || 0).toLocaleString("en-US"),
                  " ر.س"
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3453,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3444,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3415,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3410,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 mt-6", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "font-black text-emerald-900 text-xs sm:text-sm", children: "إجمالي مستحقات الموظف:" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3458,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "font-mono font-black text-emerald-700 text-sm sm:text-base", children: [
              selectedPayslipEmployee.totalEntitlements.toLocaleString("en-US"),
              " ر.س"
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3459,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3457,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3409,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "bg-rose-50/20 p-5 rounded-2xl border border-rose-100/70 flex flex-col justify-between", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("h3", { className: "text-xs sm:text-sm font-black text-rose-800 mb-4 border-b border-rose-100 pb-2 flex items-center gap-2", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "w-2.5 h-2.5 rounded-full bg-rose-500" }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3467,
                columnNumber: 21
              }, this),
              "البنود المالية المخصومة (الاستقطاعات)"
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3466,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "space-y-3 text-xs sm:text-sm", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center py-1 border-b border-rose-50/50", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-slate-600 font-medium", children: "استقطاع السلف المالية والعهود" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3472,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "font-mono font-bold text-slate-900", children: [
                  selectedPayslipEmployee.loansDeduction.toLocaleString("en-US"),
                  " ر.س"
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3473,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3471,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center py-1 border-b border-rose-50/50", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-slate-600 font-medium", children: "التأمينات الاجتماعية (GOSI)" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3476,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "font-mono font-bold text-slate-900", children: [
                  selectedPayslipEmployee.gosiDeduction.toLocaleString("en-US"),
                  " ر.س"
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3477,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3475,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center py-1", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-slate-600 font-medium", children: [
                  "الخصومات والجزاءات الإدارية",
                  selectedPayslipEmployee.deductionsReason && /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md mr-1.5 font-bold", children: selectedPayslipEmployee.deductionsReason }, void 0, false, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 3483,
                    columnNumber: 27
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3480,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "button",
                  {
                    onClick: () => {
                      setSelectedDeductionEmployee(selectedPayslipEmployee);
                      setClickedDeductionType("Other");
                      setIsDeductionModalOpen(true);
                    },
                    className: "font-mono font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition-colors",
                    title: "عرض تفاصيل الخصومات",
                    children: [
                      selectedPayslipEmployee.otherDeductions.toLocaleString("en-US"),
                      " ر.س"
                    ]
                  },
                  void 0,
                  true,
                  {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 3488,
                    columnNumber: 23
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3479,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3470,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3465,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 mt-6", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "font-black text-rose-900 text-xs sm:text-sm", children: "إجمالي الخصومات الرسمية:" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3503,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "font-mono font-black text-rose-700 text-sm sm:text-base", children: [
              selectedPayslipEmployee.totalDeductions.toLocaleString("en-US"),
              " ر.س"
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3504,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3502,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3464,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 3407,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "mt-8 p-6 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "space-y-1 text-center sm:text-right", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-bold text-[#00AEEF] uppercase tracking-wider font-mono", children: "NET CONVERTED SALARY" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3512,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("h4", { className: "text-sm font-black text-slate-100", children: "صافي الراتب المستحق والمحول للبنك:" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3513,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-[10.5px] text-slate-400", children: "طُبقت جميع الجزاءات والخصومات والمستحقات حسب الاتفاقية ولائحة الموارد البشرية." }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3514,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3511,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "text-center sm:text-left", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "font-mono text-emerald-400 font-black text-2xl tracking-wider", children: [
            selectedPayslipEmployee.netSalary.toLocaleString("en-US"),
            " ر.س"
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3517,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-slate-400 mt-1", children: "شامل البدلات المعتمدة" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3520,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3516,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 3510,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "mt-8 bg-slate-50 p-4 rounded-xl border border-slate-200 text-[10.5px] text-slate-600 leading-relaxed", children: [
        /* @__PURE__ */ jsxDEV("strong", { children: "تنويه نظامي معتمد:" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3526,
          columnNumber: 15
        }, this),
        " يعتبر كشف الراتب الصادر من منصة الإدارة لشركة فنون الوليد وثيقة رسمية معتمدة تثبت تحويل وقيد المستحقات المالية للموظف بالمرجع البنكي المعتمد إلكترونياً، وتطابق أحكام عقود العمل المصادق عليها عبر منصة قوى بوزارة الموارد البشرية."
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 3525,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 gap-6 mt-8 border-t border-slate-150 pt-6 text-center text-xs text-slate-500", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "pt-3", children: [
          /* @__PURE__ */ jsxDEV("p", { className: "font-bold text-slate-700", children: "توقيع المحاسب المالي للشركة" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3532,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "h-12" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3533,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-slate-400", children: "_________________" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3534,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3531,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "pt-3", children: [
          /* @__PURE__ */ jsxDEV("p", { className: "font-bold text-slate-700", children: "اعتماد المدير العام وصاحب العمل" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3537,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "h-12" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3538,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-slate-400", children: "_________________" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3539,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3536,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 3530,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col sm:flex-row gap-3 justify-end mt-10 border-t border-slate-150 pt-6", children: [
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => {
              setIsPayslipModalOpen(false);
              setSelectedPayslipEmployee(null);
            },
            className: "px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs transition-colors",
            children: "الرجوع إلى القائمة الرئيسية"
          },
          void 0,
          false,
          {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3545,
            columnNumber: 15
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: handleExportPayslipPDF,
            className: "px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl",
            children: [
              /* @__PURE__ */ jsxDEV(Printer, { className: "w-4 h-4" }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3558,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("span", { children: "طباعة ومعاينة 📄" }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3559,
                columnNumber: 17
              }, this)
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3554,
            columnNumber: 15
          },
          this
        )
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 3544,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
      lineNumber: 3334,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
      lineNumber: 3333,
      columnNumber: 9
    }, this),
    isModRequestModalOpen && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxDEV("div", { className: "w-full max-w-lg bg-white rounded-3xl p-6 relative", children: [
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => setIsModRequestModalOpen(false),
          className: "absolute left-6 top-6 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600",
          children: /* @__PURE__ */ jsxDEV(X, { className: "w-5 h-5" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3574,
            columnNumber: 15
          }, this)
        },
        void 0,
        false,
        {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3570,
          columnNumber: 13
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("h3", { className: "text-base font-black text-slate-800 mb-2", children: "تسجيل طلب تعديل ومراجعة جديد" }, void 0, false, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 3577,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-slate-400 mb-4", children: "أدخل الملاحظات والتعديلات المطلوبة من المحاسب وسيتغير حالة المسير تلقائياً إلى (بانتظار التعديل)." }, void 0, false, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 3578,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxDEV(
          "textarea",
          {
            value: modRequestNotes,
            onChange: (e) => setModRequestNotes(e.target.value),
            placeholder: "مثال: يرجى التحقق من الأوفرتايم الخاص بعامل التشكيل رامي، وتطبيق خصم الغياب المعتمد بورقة الإدارة...",
            rows: 4,
            className: "w-full p-3 border rounded-xl text-xs focus:outline-none focus:border-rose-500"
          },
          void 0,
          false,
          {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3583,
            columnNumber: 15
          },
          this
        ),
        /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2 justify-end", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => setIsModRequestModalOpen(false),
              className: "px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold",
              children: "إلغاء التراجع"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3592,
              columnNumber: 17
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: handleRequestModificationsSubmit,
              disabled: !modRequestNotes.trim(),
              className: "px-6 py-2 bg-rose-600 text-white hover:bg-rose-700 rounded-xl text-xs font-bold shadow-md",
              children: "تقديم طلب التعديل ⚠️"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3598,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3591,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 3582,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
      lineNumber: 3569,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
      lineNumber: 3568,
      columnNumber: 9
    }, this),
    isModResponseModalOpen && selectedRequestForResponse && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxDEV("div", { className: "w-full max-w-lg bg-white rounded-3xl p-6 relative", children: [
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => {
            setIsModResponseModalOpen(false);
            setSelectedRequestForResponse(null);
          },
          className: "absolute left-6 top-6 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400",
          children: /* @__PURE__ */ jsxDEV(X, { className: "w-5 h-5" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3622,
            columnNumber: 15
          }, this)
        },
        void 0,
        false,
        {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3615,
          columnNumber: 13
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("h3", { className: "text-base font-black text-slate-800 mb-2", children: "تسجيل رد المحاسب على طلب التعديل" }, void 0, false, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 3625,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-slate-400 mb-4", children: "توثيق الإجراء الذي قمت باتخاذه في مسير الرواتب رداً على طلب المدقق." }, void 0, false, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 3626,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "space-y-4 text-xs", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "p-3 bg-slate-55 rounded-xl border border-slate-150", children: [
          /* @__PURE__ */ jsxDEV("p", { className: "font-bold text-slate-500", children: "ملاحظة المدقق المستهدفة:" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3632,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-slate-800 mt-1 font-semibold", children: [
            '"',
            selectedRequestForResponse.notes,
            '"'
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3633,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3631,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { className: "block mb-1 font-bold text-slate-500", children: "حالة الطلب بعد الرد *" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3637,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV(
            "select",
            {
              value: modResponseStatus,
              onChange: (e) => setModResponseStatus(e.target.value),
              className: "w-full p-2.5 border rounded-xl",
              children: [
                /* @__PURE__ */ jsxDEV("option", { value: "Closed", children: "مغلق - تم التعديل والتصحيح بنجاح (Closed)" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3643,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDEV("option", { value: "Open", children: "مفتوح - جاري النقاش أو التوضيح (Open)" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3644,
                  columnNumber: 19
                }, this)
              ]
            },
            void 0,
            true,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3638,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3636,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { className: "block mb-1 font-bold text-slate-500", children: "شرح وتوضيح إجراء المحاسب *" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3649,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV(
            "textarea",
            {
              value: modResponseNotes,
              onChange: (e) => setModResponseNotes(e.target.value),
              placeholder: "مثال: تم تعديل الخصومات لتصبح 150 ر.س بدلاً من 250 وتحديث الصافي المصرفي للموظف...",
              rows: 3,
              className: "w-full p-3 border rounded-xl text-xs focus:outline-none focus:border-blue-500"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3650,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3648,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2 justify-end pt-2", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => {
                setIsModResponseModalOpen(false);
                setSelectedRequestForResponse(null);
              },
              className: "px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold",
              children: "إلغاء"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3660,
              columnNumber: 17
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: handleRespondToModRequestSubmit,
              disabled: !modResponseNotes.trim(),
              className: "px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-bold shadow-md",
              children: "حفظ وتسجيل الرد 💬"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3669,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3659,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 3630,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
      lineNumber: 3614,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
      lineNumber: 3613,
      columnNumber: 9
    }, this),
    isBankModalOpen && selectedBankEmployee && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs", children: /* @__PURE__ */ jsxDEV("div", { className: "w-full max-w-lg bg-white rounded-3xl p-6 relative shadow-2xl border border-slate-200", children: [
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => {
            setIsBankModalOpen(false);
            setSelectedBankEmployee(null);
          },
          className: "absolute left-6 top-6 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors",
          children: /* @__PURE__ */ jsxDEV(X, { className: "w-5 h-5" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3694,
            columnNumber: 15
          }, this)
        },
        void 0,
        false,
        {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3687,
          columnNumber: 13
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3 border-b border-slate-100 pb-4 mb-5", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "p-3 bg-sky-50 text-sky-600 rounded-2xl", children: /* @__PURE__ */ jsxDEV(Building, { className: "w-6 h-6" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3700,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3699,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("h3", { className: "text-base font-black text-slate-800 font-arabic", children: "تفاصيل الحساب البنكي والتحويل المالي" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3703,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-slate-400 font-arabic mt-0.5", children: [
            "بيانات بنك الموظف: ",
            /* @__PURE__ */ jsxDEV("span", { className: "text-sky-600 font-bold", children: selectedBankEmployee.arabicName }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3707,
              columnNumber: 38
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3706,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3702,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 3698,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "space-y-3 text-xs font-arabic", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-150", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-slate-500 font-bold", children: "اسم المصرف (Bank Name):" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3715,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("strong", { className: "text-slate-800 font-sans", children: selectedBankEmployee.bankName || "—" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3716,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3714,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-150", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-slate-500 font-bold", children: "رقم الحساب الدولي (IBAN):" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3720,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("strong", { className: "text-slate-800 font-mono tracking-wider select-all", children: selectedBankEmployee.iban || "—" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3721,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3719,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-150", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-slate-500 font-bold", children: "رقم الحساب الجاري (Account Number):" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3725,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("strong", { className: "text-slate-800 font-mono tracking-wider select-all", children: selectedBankEmployee.accountNumber || "—" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3726,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3724,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-150", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-slate-500 font-bold", children: "رمز السويفت (SWIFT Code):" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3730,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("strong", { className: "text-slate-800 font-mono select-all", children: selectedBankEmployee.swiftCode || "—" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3731,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3729,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-150", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-slate-500 font-bold", children: "طريقة التحويل المالي (Transfer Method):" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3735,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("strong", { className: "text-slate-800", children: selectedBankEmployee.transferMethod || "SARIE" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3736,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3734,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-150", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-slate-500 font-bold", children: "اسم صاحب الحساب (Account Holder):" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3740,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("strong", { className: "text-slate-800", children: selectedBankEmployee.accountHolderName || "—" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3741,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3739,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 3713,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "mt-6 pt-4 border-t border-slate-100 flex justify-end", children: /* @__PURE__ */ jsxDEV(
        "button",
        {
          type: "button",
          onClick: () => {
            setIsBankModalOpen(false);
            setSelectedBankEmployee(null);
          },
          className: "px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors",
          children: "إغلاق النافذة"
        },
        void 0,
        false,
        {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3747,
          columnNumber: 15
        },
        this
      ) }, void 0, false, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 3746,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
      lineNumber: 3685,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
      lineNumber: 3684,
      columnNumber: 9
    }, this),
    isDeductionModalOpen && selectedDeductionEmployee && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto", children: /* @__PURE__ */ jsxDEV("div", { className: "w-full max-w-4xl bg-white rounded-3xl p-6 sm:p-8 relative shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]", children: [
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => {
            setIsDeductionModalOpen(false);
            setSelectedDeductionEmployee(null);
          },
          className: "absolute left-6 top-6 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors",
          children: /* @__PURE__ */ jsxDEV(X, { className: "w-5 h-5" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3774,
            columnNumber: 15
          }, this)
        },
        void 0,
        false,
        {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3767,
          columnNumber: 13
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3.5 border-b border-slate-100 pb-4 mb-5", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "p-3 bg-rose-50 text-rose-600 rounded-2xl", children: /* @__PURE__ */ jsxDEV(MinusCircle, { className: "w-6 h-6" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3780,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3779,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("h3", { className: "text-base font-black text-slate-800 font-arabic flex items-center gap-2", children: [
            /* @__PURE__ */ jsxDEV("span", { children: "إدارة الاستقطاعات التفصيلية للموظف:" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3784,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-rose-600", children: selectedDeductionEmployee.arabicName }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3785,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-slate-400 font-mono font-bold text-xs", children: [
              "(",
              selectedDeductionEmployee.employeeId,
              ")"
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3786,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3783,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-[11px] text-slate-400 font-arabic mt-0.5", children: "أدخل بنود الخصم التفصيلية والجزاءات. يجب تحديد قيمة أكبر من الصفر وسبب إلزامي لكل بند خصم مدرج." }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3788,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3782,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 3778,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex-1 overflow-y-auto pr-1 pl-1 space-y-4 mb-6", children: localDeductions.length === 0 ? /* @__PURE__ */ jsxDEV("div", { className: "text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200", children: [
        /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-slate-500 font-bold font-arabic mb-3", children: "لا يوجد أي بنود خصم تفصيلية مسجلة حالياً لهذا الموظف" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3798,
          columnNumber: 19
        }, this),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            type: "button",
            onClick: () => {
              const newId = `DED-NEW-${Date.now()}-${Math.floor(Math.random() * 1e3)}`;
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
                  createdAt: (/* @__PURE__ */ new Date()).toISOString(),
                  updatedBy: user.username || "System",
                  updatedAt: (/* @__PURE__ */ new Date()).toISOString()
                }
              ]);
            },
            className: "px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold font-arabic transition-colors",
            children: "+ إضافة أول بند خصم الآن"
          },
          void 0,
          false,
          {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3801,
            columnNumber: 19
          },
          this
        )
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 3797,
        columnNumber: 17
      }, this) : /* @__PURE__ */ jsxDEV("div", { className: "space-y-3", children: [
        localDeductions.map((item, idx) => /* @__PURE__ */ jsxDEV(
          "div",
          {
            className: "p-4 bg-slate-50 rounded-2xl border border-slate-200/80 hover:border-rose-200 transition-all grid grid-cols-1 md:grid-cols-12 gap-3.5 relative items-end",
            children: [
              /* @__PURE__ */ jsxDEV("div", { className: "md:col-span-3", children: [
                /* @__PURE__ */ jsxDEV("label", { className: "block mb-1 text-[10.5px] font-bold text-slate-500 font-arabic", children: "نوع الاستقطاع:" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3835,
                  columnNumber: 25
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "select",
                  {
                    value: item.type,
                    onChange: (e) => {
                      const val = e.target.value;
                      setLocalDeductions(
                        localDeductions.map(
                          (d) => d.id === item.id ? { ...d, type: val } : d
                        )
                      );
                    },
                    className: "w-full p-2.5 border border-slate-200 rounded-xl bg-white text-xs font-bold font-arabic text-slate-700 focus:outline-none focus:border-rose-500",
                    children: [
                      /* @__PURE__ */ jsxDEV("option", { value: "Loan Deduction", children: "خصم سلفة (Loan Deduction)" }, void 0, false, {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 3848,
                        columnNumber: 27
                      }, this),
                      /* @__PURE__ */ jsxDEV("option", { value: "Absence Deduction", children: "خصم غياب (Absence Deduction)" }, void 0, false, {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 3849,
                        columnNumber: 27
                      }, this),
                      /* @__PURE__ */ jsxDEV("option", { value: "Late Deduction", children: "خصم تأخير (Late Deduction)" }, void 0, false, {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 3850,
                        columnNumber: 27
                      }, this),
                      /* @__PURE__ */ jsxDEV("option", { value: "Penalty Deduction", children: "خصم جزاء إداري (Penalty Deduction)" }, void 0, false, {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 3851,
                        columnNumber: 27
                      }, this),
                      /* @__PURE__ */ jsxDEV("option", { value: "Other Deduction", children: "خصم آخر (Other Deduction)" }, void 0, false, {
                        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                        lineNumber: 3852,
                        columnNumber: 27
                      }, this)
                    ]
                  },
                  void 0,
                  true,
                  {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 3836,
                    columnNumber: 25
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3834,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "md:col-span-2", children: [
                /* @__PURE__ */ jsxDEV("label", { className: "block mb-1 text-[10.5px] font-bold text-slate-500 font-arabic", children: "القيمة المخصومة (ر.س) *:" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3858,
                  columnNumber: 25
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    type: "number",
                    value: item.amount === 0 ? "" : item.amount,
                    onChange: (e) => {
                      const val = Number(e.target.value);
                      setLocalDeductions(
                        localDeductions.map(
                          (d) => d.id === item.id ? { ...d, amount: val } : d
                        )
                      );
                    },
                    placeholder: "مثال: 150",
                    className: "w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono font-bold text-rose-600 focus:outline-none focus:border-rose-500 text-center"
                  },
                  void 0,
                  false,
                  {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 3859,
                    columnNumber: 25
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3857,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "md:col-span-3", children: [
                /* @__PURE__ */ jsxDEV("label", { className: "block mb-1 text-[10.5px] font-bold text-slate-500 font-arabic", children: "السبب الموثق والمانع *:" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3877,
                  columnNumber: 25
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    type: "text",
                    value: item.reason,
                    onChange: (e) => {
                      setLocalDeductions(
                        localDeductions.map(
                          (d) => d.id === item.id ? { ...d, reason: e.target.value } : d
                        )
                      );
                    },
                    placeholder: "مثال: غياب يوم 15 أكتوبر دون عذر",
                    className: "w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500"
                  },
                  void 0,
                  false,
                  {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 3878,
                    columnNumber: 25
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3876,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "md:col-span-3 grid grid-cols-2 gap-2", children: [
                /* @__PURE__ */ jsxDEV("div", { children: [
                  /* @__PURE__ */ jsxDEV("label", { className: "block mb-1 text-[10px] font-bold text-slate-400 font-arabic", children: "ملاحظات داخلية:" }, void 0, false, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 3896,
                    columnNumber: 27
                  }, this),
                  /* @__PURE__ */ jsxDEV(
                    "input",
                    {
                      type: "text",
                      value: item.notes || "",
                      onChange: (e) => {
                        setLocalDeductions(
                          localDeductions.map(
                            (d) => d.id === item.id ? { ...d, notes: e.target.value } : d
                          )
                        );
                      },
                      placeholder: "اختياري",
                      className: "w-full p-2.5 border border-slate-200 rounded-xl text-[11px] text-slate-600 focus:outline-none focus:border-rose-500"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 3897,
                      columnNumber: 27
                    },
                    this
                  )
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3895,
                  columnNumber: 25
                }, this),
                /* @__PURE__ */ jsxDEV("div", { children: [
                  /* @__PURE__ */ jsxDEV("label", { className: "block mb-1 text-[10px] font-bold text-slate-400 font-arabic", children: "رابط المرفق/الإثبات:" }, void 0, false, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 3912,
                    columnNumber: 27
                  }, this),
                  /* @__PURE__ */ jsxDEV(
                    "input",
                    {
                      type: "text",
                      value: item.attachmentUrl || "",
                      onChange: (e) => {
                        setLocalDeductions(
                          localDeductions.map(
                            (d) => d.id === item.id ? { ...d, attachmentUrl: e.target.value } : d
                          )
                        );
                      },
                      placeholder: "رابط pdf/img",
                      className: "w-full p-2.5 border border-slate-200 rounded-xl text-[10px] font-mono font-bold text-slate-500 focus:outline-none focus:border-rose-500"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                      lineNumber: 3913,
                      columnNumber: 27
                    },
                    this
                  )
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3911,
                  columnNumber: 25
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3894,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "md:col-span-1 text-center", children: /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    setLocalDeductions(localDeductions.filter((d) => d.id !== item.id));
                  },
                  className: "p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors inline-flex items-center justify-center",
                  title: "حذف هذا البند",
                  children: /* @__PURE__ */ jsxDEV(Trash2, { className: "w-4 h-4" }, void 0, false, {
                    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                    lineNumber: 3939,
                    columnNumber: 27
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 3931,
                  columnNumber: 25
                },
                this
              ) }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 3930,
                columnNumber: 23
              }, this)
            ]
          },
          item.id,
          true,
          {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3829,
            columnNumber: 21
          },
          this
        )),
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-end pt-1", children: /* @__PURE__ */ jsxDEV(
          "button",
          {
            type: "button",
            onClick: () => {
              const newId = `DED-NEW-${Date.now()}-${Math.floor(Math.random() * 1e3)}`;
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
                  createdAt: (/* @__PURE__ */ new Date()).toISOString(),
                  updatedBy: user.username || "System",
                  updatedAt: (/* @__PURE__ */ new Date()).toISOString()
                }
              ]);
            },
            className: "px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold font-arabic transition-all flex items-center gap-1.5",
            children: /* @__PURE__ */ jsxDEV("span", { children: "+ إضافة بند استقطاع إضافي" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3969,
              columnNumber: 23
            }, this)
          },
          void 0,
          false,
          {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3947,
            columnNumber: 21
          },
          this
        ) }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3946,
          columnNumber: 19
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 3827,
        columnNumber: 17
      }, this) }, void 0, false, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 3795,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "border-t border-slate-100 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-bold text-slate-500 font-arabic", children: "إجمالي الخصومات الجارية:" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3979,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("span", { className: "font-mono text-base font-extrabold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-150", children: [
            localDeductions.reduce((sum, d) => sum + Number(d.amount || 0), 0).toLocaleString("en-US"),
            " ر.س"
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 3980,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3978,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2 w-full sm:w-auto justify-end", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              onClick: () => {
                setIsDeductionModalOpen(false);
                setSelectedDeductionEmployee(null);
              },
              className: "px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold font-arabic transition-colors text-slate-600",
              children: "إلغاء وتراجع"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3986,
              columnNumber: 17
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              onClick: handleSaveDeductionsModal,
              className: "px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold font-arabic transition-colors shadow-md hover:shadow-lg flex items-center gap-1.5",
              children: /* @__PURE__ */ jsxDEV("span", { children: "✓ حفظ واعتماد البنود وإعادة الاحتساب" }, void 0, false, {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 4001,
                columnNumber: 19
              }, this)
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 3996,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 3985,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 3977,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
      lineNumber: 3765,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
      lineNumber: 3764,
      columnNumber: 9
    }, this),
    isTransferModalOpen && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxDEV("div", { className: "w-full max-w-lg bg-white rounded-3xl p-8 relative", children: [
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => setIsTransferModalOpen(false),
          className: "absolute left-6 top-6 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400",
          children: /* @__PURE__ */ jsxDEV(X, { className: "w-5 h-5" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 4017,
            columnNumber: 15
          }, this)
        },
        void 0,
        false,
        {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 4013,
          columnNumber: 13
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3 mb-6", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "p-3 bg-purple-50 text-purple-600 rounded-2xl", children: /* @__PURE__ */ jsxDEV(CreditCard, { className: "w-6 h-6" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 4022,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 4021,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("h3", { className: "text-lg font-black text-slate-800", children: "تسجيل وتوثيق حوالة الرواتب البنكية" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 4025,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-slate-400", children: "توثيق مرجع التحويل وتغيير حالة مسير الرواتب إلى (تم التحويل)." }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 4026,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 4024,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 4020,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("form", { onSubmit: handleRegisterTransferSubmit, className: "space-y-4 text-xs font-sans", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { className: "block mb-1 font-bold text-slate-500", children: "الحساب المصرفي الصادر للمصنع *" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 4032,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV(
            "select",
            {
              value: transferForm.bankName,
              onChange: (e) => setTransferForm({ ...transferForm, bankName: e.target.value }),
              className: "w-full p-3 border rounded-xl bg-white text-slate-800",
              children: [
                /* @__PURE__ */ jsxDEV("option", { value: "البنك الأهلي السعودي (SNB)", children: "البنك الأهلي السعودي (SNB)" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 4038,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDEV("option", { value: "مصرف الراجحي (Al Rajhi Bank)", children: "مصرف الراجحي (Al Rajhi Bank)" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 4039,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDEV("option", { value: "بنك الرياض (Riyad Bank)", children: "بنك الرياض (Riyad Bank)" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 4040,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDEV("option", { value: "البنك السعودي الأول (SAB)", children: "البنك السعودي الأول (SAB)" }, void 0, false, {
                  fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                  lineNumber: 4041,
                  columnNumber: 19
                }, this)
              ]
            },
            void 0,
            true,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 4033,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 4031,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("label", { className: "block mb-1 font-bold text-slate-500", children: "رقم مرجع الحوالة البنكية (SARIE) *" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 4047,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "text",
                required: true,
                value: transferForm.referenceNumber,
                onChange: (e) => setTransferForm({ ...transferForm, referenceNumber: e.target.value }),
                placeholder: "مثال: Ref-982421482",
                className: "w-full p-3 border rounded-xl font-mono text-slate-800 font-bold"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 4048,
                columnNumber: 19
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 4046,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("label", { className: "block mb-1 font-bold text-slate-500", children: "تاريخ إجراء الحوالة *" }, void 0, false, {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 4059,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "date",
                required: true,
                value: transferForm.transferDate,
                onChange: (e) => setTransferForm({ ...transferForm, transferDate: e.target.value }),
                className: "w-full p-3 border rounded-xl font-mono font-bold"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
                lineNumber: 4060,
                columnNumber: 19
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 4058,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 4045,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { className: "block mb-1 font-bold text-slate-500", children: "ملاحظات تسوية الحوالة" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 4071,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV(
            "textarea",
            {
              value: transferForm.notes,
              onChange: (e) => setTransferForm({ ...transferForm, notes: e.target.value }),
              placeholder: "مثال: تم إرسال ملف التحويل التلقائي SARIE للبنك الأهلي، وقبول الحوالات وإرسال الإشعارات لهواتف العمال...",
              rows: 2,
              className: "w-full p-3 border rounded-xl text-xs focus:outline-none"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 4072,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 4070,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-start gap-2.5", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-base text-purple-600", children: "💸" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 4082,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-purple-800 leading-relaxed font-semibold", children: "ملاحظة الأرشفة: بمجرد الحفظ والتوثيق، سيتم أرشفة هذا المسير مع تفاصيل كشف رواتب الموظفين لمنع أي تعديل مستقبلي، وقيد المعاملة في الحسابات العامة للشركة تلقائياً." }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 4083,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 4081,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2 justify-end pt-3", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              onClick: () => setIsTransferModalOpen(false),
              className: "px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold",
              children: "إلغاء التراجع"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 4089,
              columnNumber: 17
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "submit",
              className: "px-6 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-xl text-xs font-bold shadow-md",
              children: "توثيق واعتماد الحوالة 🚀"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 4096,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 4088,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 4030,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
      lineNumber: 4012,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
      lineNumber: 4011,
      columnNumber: 9
    }, this),
    isDeleteReasonModalOpen && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxDEV("div", { className: "w-full max-w-md bg-white rounded-3xl p-8 relative shadow-2xl border border-slate-100", children: [
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => {
            setIsDeleteReasonModalOpen(false);
            setRunToDeleteId(null);
            setDeleteReasonText("");
          },
          className: "absolute left-6 top-6 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-colors",
          children: /* @__PURE__ */ jsxDEV(X, { className: "w-5 h-5" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 4120,
            columnNumber: 15
          }, this)
        },
        void 0,
        false,
        {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 4112,
          columnNumber: 13
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3 mb-6", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "p-3 bg-rose-50 text-rose-600 rounded-2xl", children: /* @__PURE__ */ jsxDEV(Trash2, { className: "w-6 h-6" }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 4125,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 4124,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("h3", { className: "text-base font-black text-slate-800 font-arabic", children: "تأكيد حذف مسير الرواتب مؤقتاً" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 4128,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-slate-400 font-arabic", children: "يتطلب توثيق سبب الحذف للأرشفة والتدقيق المالي." }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 4129,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 4127,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 4123,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { className: "block mb-2 font-bold text-slate-600 font-arabic text-xs", children: "يرجى كتابة سبب الحذف للمسير المالي *" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 4135,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV(
            "textarea",
            {
              value: deleteReasonText,
              onChange: (e) => setDeleteReasonText(e.target.value),
              placeholder: "مثال: تم إلغاء المسير لإعادة إدراجه بعد تسوية ساعات العمل الإضافية للموظفين...",
              rows: 4,
              required: true,
              className: "w-full p-3 border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl text-xs focus:outline-none transition-all font-arabic"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 4136,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 4134,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "bg-rose-50/50 p-4 rounded-xl border border-rose-100/50 flex items-start gap-2.5", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-base text-rose-600", children: "⚠️" }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 4147,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-rose-800 leading-relaxed font-semibold font-arabic", children: "ملاحظة أمان: سيتم وسم هذا المسير بـ (محذوف) وأرشفة التفاصيل مع توثيق اسم المستخدم وتوقيت العملية في نظام سجل التدقيق المالي ولا يمكن تعديله لاحقاً." }, void 0, false, {
            fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
            lineNumber: 4148,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 4146,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2 justify-end pt-2", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              onClick: () => {
                setIsDeleteReasonModalOpen(false);
                setRunToDeleteId(null);
                setDeleteReasonText("");
              },
              className: "px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors font-arabic",
              children: "إلغاء التراجع"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 4154,
              columnNumber: 17
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              onClick: handleConfirmSoftDelete,
              className: "px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all font-arabic",
              children: "تأكيد حذف وأرشفة المسير 🗑️"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
              lineNumber: 4165,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
          lineNumber: 4153,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
        lineNumber: 4133,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
      lineNumber: 4111,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
      lineNumber: 4110,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "/app/applet/src/components/finance/MonthlyPayrollRuns.tsx",
    lineNumber: 1954,
    columnNumber: 5
  }, this);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk1vbnRobHlQYXlyb2xsUnVucy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCBodG1sMnBkZiBmcm9tIFwiaHRtbDJwZGYuanNcIjtcbmltcG9ydCB7XG4gIFBsdXMsXG4gIEZpbGVUZXh0LFxuICBDaGVja0NpcmNsZTIsXG4gIEFsZXJ0Q2lyY2xlLFxuICBFZGl0MyxcbiAgVHJhc2gyLFxuICBIaXN0b3J5LFxuICBVc2VyQ2hlY2ssXG4gIENyZWRpdENhcmQsXG4gIFgsXG4gIFNlYXJjaCxcbiAgUHJpbnRlcixcbiAgRXllLFxuICBTYXZlLFxuICBVbmRvMixcbiAgUmVmcmVzaEN3LFxuICBUcmVuZGluZ1VwLFxuICBGaWxlU3ByZWFkc2hlZXQsXG4gIEJ1aWxkaW5nLFxuICBVc2VyLFxuICBTaGllbGRBbGVydCxcbiAgSGVscENpcmNsZSxcbiAgTG9jayxcbiAgTWludXNDaXJjbGUsXG59IGZyb20gXCJsdWNpZGUtcmVhY3RcIjtcbmltcG9ydCB7XG4gIEVtcGxveWVlLFxuICBVc2VyIGFzIFN5c3RlbVVzZXIsXG4gIFBheXJvbGxSdW4sXG4gIFBheXJvbGxSdW5FbXBsb3llZSxcbiAgUGF5cm9sbFJ1blN0YXR1cyxcbiAgUGF5cm9sbEF1ZGl0TG9nLFxuICBQYXlyb2xsTW9kaWZpY2F0aW9uUmVxdWVzdCxcbiAgRGVkdWN0aW9uSXRlbSxcbn0gZnJvbSBcIi4uLy4uL3R5cGVzXCI7XG5cbmZ1bmN0aW9uIHRvRW5nbGlzaERpZ2l0cyhzdHI6IHN0cmluZyB8IHVuZGVmaW5lZCB8IG51bGwpOiBzdHJpbmcge1xuICBpZiAoIXN0cikgcmV0dXJuIFwiXCI7XG4gIHJldHVybiBTdHJpbmcoc3RyKVxuICAgIC5yZXBsYWNlKC9b2aAt2aldL2csIChkKSA9PiBTdHJpbmcuZnJvbUNoYXJDb2RlKGQuY2hhckNvZGVBdCgwKSAtIDE2MzIpKVxuICAgIC5yZXBsYWNlKC9b27At27ldL2csIChkKSA9PiBTdHJpbmcuZnJvbUNoYXJDb2RlKGQuY2hhckNvZGVBdCgwKSAtIDE3NzYpKTtcbn1cblxuZnVuY3Rpb24gbWFwSHJEZWR1Y3Rpb25UeXBlKHR5cGU6IHN0cmluZyk6IFwiQWJzZW5jZSBEZWR1Y3Rpb25cIiB8IFwiTGF0ZSBEZWR1Y3Rpb25cIiB8IFwiTG9hbiBEZWR1Y3Rpb25cIiB8IFwiUGVuYWx0eSBEZWR1Y3Rpb25cIiB8IFwiT3RoZXIgRGVkdWN0aW9uXCIge1xuICBjb25zdCB0ID0gU3RyaW5nKHR5cGUpLnRyaW0oKTtcbiAgaWYgKHQgPT09IFwi2LrZitin2KhcIikgcmV0dXJuIFwiQWJzZW5jZSBEZWR1Y3Rpb25cIjtcbiAgaWYgKHQgPT09IFwi2KrYo9iu2YrYsVwiKSByZXR1cm4gXCJMYXRlIERlZHVjdGlvblwiO1xuICBpZiAodCA9PT0gXCLYs9mE2YHYqVwiKSByZXR1cm4gXCJMb2FuIERlZHVjdGlvblwiO1xuICBpZiAodCA9PT0gXCLYudmC2YjYqNipXCIpIHJldHVybiBcIlBlbmFsdHkgRGVkdWN0aW9uXCI7XG4gIHJldHVybiBcIk90aGVyIERlZHVjdGlvblwiO1xufVxuXG5pbnRlcmZhY2UgTW9udGhseVBheXJvbGxSdW5zUHJvcHMge1xuICBsYW5nOiBcImFyXCIgfCBcImVuXCI7XG4gIHVzZXI6IFN5c3RlbVVzZXI7XG4gIGVtcGxveWVlczogRW1wbG95ZWVbXTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gTW9udGhseVBheXJvbGxSdW5zKHtcbiAgbGFuZyxcbiAgdXNlcixcbiAgZW1wbG95ZWVzLFxufTogTW9udGhseVBheXJvbGxSdW5zUHJvcHMpIHtcbiAgLy8gREIgU3RhdGVzXG4gIGNvbnN0IFtwYXlyb2xsUnVucywgc2V0UGF5cm9sbFJ1bnNdID0gdXNlU3RhdGU8UGF5cm9sbFJ1bltdPihbXSk7XG4gIGNvbnN0IFtockRlZHVjdGlvbnMsIHNldEhyRGVkdWN0aW9uc10gPSB1c2VTdGF0ZTxhbnlbXT4oW10pO1xuICBjb25zdCBbbG9hZGluZywgc2V0TG9hZGluZ10gPSB1c2VTdGF0ZSh0cnVlKTtcblxuICAvLyBBY3RpdmUgTWFpbiBUYWJcbiAgY29uc3QgW2FjdGl2ZVRhYiwgc2V0QWN0aXZlVGFiXSA9IHVzZVN0YXRlPFwiZHJhZnRzXCIgfCBcInBlbmRpbmdcIiB8IFwiYXBwcm92ZWRcIiB8IFwicGFpZFwiIHwgXCJhbGxcIj4oXCJhbGxcIik7XG5cbiAgLy8gU2VhcmNoICYgRmlsdGVyc1xuICBjb25zdCBbc2VhcmNoUXVlcnksIHNldFNlYXJjaFF1ZXJ5XSA9IHVzZVN0YXRlKFwiXCIpO1xuICBjb25zdCBbZmlsdGVyWWVhciwgc2V0RmlsdGVyWWVhcl0gPSB1c2VTdGF0ZTxzdHJpbmc+KFwiYWxsXCIpO1xuICBjb25zdCBbZmlsdGVyTW9udGgsIHNldEZpbHRlck1vbnRoXSA9IHVzZVN0YXRlPHN0cmluZz4oXCJhbGxcIik7XG4gIGNvbnN0IFtmaWx0ZXJEZXB0LCBzZXRGaWx0ZXJEZXB0XSA9IHVzZVN0YXRlPHN0cmluZz4oXCJhbGxcIik7XG5cbiAgLy8gQ3JlYXRlIE5ldyBNb2RhbCBTdGF0ZVxuICBjb25zdCBbaXNDcmVhdGVNb2RhbE9wZW4sIHNldElzQ3JlYXRlTW9kYWxPcGVuXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW25ld1J1bkZvcm0sIHNldE5ld1J1bkZvcm1dID0gdXNlU3RhdGUoe1xuICAgIHBheXJvbGxOdW1iZXI6IFwiXCIsXG4gICAgbW9udGg6IG5ldyBEYXRlKCkuZ2V0TW9udGgoKSArIDEsXG4gICAgeWVhcjogbmV3IERhdGUoKS5nZXRGdWxsWWVhcigpLFxuICAgIHNhbGFyeVBlcmlvZDogXCLZg9in2YXZhCDYp9mE2LTZh9ixIC0gRnVsbCBNb250aFwiLFxuICAgIGRlcGFydG1lbnQ6IFwi2KzZhdmK2Lkg2KfZhNij2YLYs9in2YVcIixcbiAgICBzZXR1cE1ldGhvZDogXCJhdXRvXCIsIC8vIGF1dG86IEhSIHByb2ZpbGVzLCBtYW51YWw6IGVtcHR5IHJvd3NcbiAgICBub3RlczogXCJcIixcbiAgfSk7XG5cbiAgLy8gRGV0YWlsZWQgUGF5cm9sbCBSdW4gVmlldyBNb2RhbFxuICBjb25zdCBbc2VsZWN0ZWRSdW4sIHNldFNlbGVjdGVkUnVuXSA9IHVzZVN0YXRlPFBheXJvbGxSdW4gfCBudWxsPihudWxsKTtcbiAgY29uc3QgW3J1bkVtcGxveWVlcywgc2V0UnVuRW1wbG95ZWVzXSA9IHVzZVN0YXRlPFBheXJvbGxSdW5FbXBsb3llZVtdPihbXSk7XG4gIGNvbnN0IFtydW5BdWRpdExvZ3MsIHNldFJ1bkF1ZGl0TG9nc10gPSB1c2VTdGF0ZTxQYXlyb2xsQXVkaXRMb2dbXT4oW10pO1xuICBjb25zdCBbcnVuTW9kaWZpY2F0aW9uUmVxdWVzdHMsIHNldFJ1bk1vZGlmaWNhdGlvblJlcXVlc3RzXSA9IHVzZVN0YXRlPFBheXJvbGxNb2RpZmljYXRpb25SZXF1ZXN0W10+KFtdKTtcbiAgY29uc3QgW2lzVmlld01vZGFsT3Blbiwgc2V0SXNWaWV3TW9kYWxPcGVuXSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICAvLyBMYXJnZSBNb2RhbCBmb3IgRWRpdGluZyBFbXBsb3llZSBQYXlyb2xsXG4gIGNvbnN0IFtpc0VkaXRFbXBsb3llZU1vZGFsT3Blbiwgc2V0SXNFZGl0RW1wbG95ZWVNb2RhbE9wZW5dID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2VsZWN0ZWRFZGl0RW1wbG95ZWUsIHNldFNlbGVjdGVkRWRpdEVtcGxveWVlXSA9IHVzZVN0YXRlPFBheXJvbGxSdW5FbXBsb3llZSB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbZWRpdGluZ0VtcGxveWVlSWQsIHNldEVkaXRpbmdFbXBsb3llZUlkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbZWRpdEVtcGxveWVlRm9ybSwgc2V0RWRpdEVtcGxveWVlRm9ybV0gPSB1c2VTdGF0ZTxQYXJ0aWFsPFBheXJvbGxSdW5FbXBsb3llZT4+KHt9KTtcblxuICAvLyBTaW5nbGUgUGF5c2xpcCBNb2RhbFxuICBjb25zdCBbc2VsZWN0ZWRQYXlzbGlwRW1wbG95ZWUsIHNldFNlbGVjdGVkUGF5c2xpcEVtcGxveWVlXSA9IHVzZVN0YXRlPFBheXJvbGxSdW5FbXBsb3llZSB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbaXNQYXlzbGlwTW9kYWxPcGVuLCBzZXRJc1BheXNsaXBNb2RhbE9wZW5dID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIC8vIEJhbmsgSW5mbyBNb2RhbFxuICBjb25zdCBbaXNCYW5rTW9kYWxPcGVuLCBzZXRJc0JhbmtNb2RhbE9wZW5dID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2VsZWN0ZWRCYW5rRW1wbG95ZWUsIHNldFNlbGVjdGVkQmFua0VtcGxveWVlXSA9IHVzZVN0YXRlPFBheXJvbGxSdW5FbXBsb3llZSB8IG51bGw+KG51bGwpO1xuXG4gIC8vIERlZHVjdGlvbiBEZXRhaWxzIE1vZGFsXG4gIGNvbnN0IFtpc0RlZHVjdGlvbk1vZGFsT3Blbiwgc2V0SXNEZWR1Y3Rpb25Nb2RhbE9wZW5dID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2VsZWN0ZWREZWR1Y3Rpb25FbXBsb3llZSwgc2V0U2VsZWN0ZWREZWR1Y3Rpb25FbXBsb3llZV0gPSB1c2VTdGF0ZTxQYXlyb2xsUnVuRW1wbG95ZWUgfCBudWxsPihudWxsKTtcbiAgY29uc3QgW2NsaWNrZWREZWR1Y3Rpb25UeXBlLCBzZXRDbGlja2VkRGVkdWN0aW9uVHlwZV0gPSB1c2VTdGF0ZTxzdHJpbmc+KFwiXCIpO1xuICBjb25zdCBbbG9jYWxEZWR1Y3Rpb25zLCBzZXRMb2NhbERlZHVjdGlvbnNdID0gdXNlU3RhdGU8RGVkdWN0aW9uSXRlbVtdPihbXSk7XG5cbiAgLy8gU29mdCBEZWxldGUgUmVhc29uIE1vZGFsXG4gIGNvbnN0IFtpc0RlbGV0ZVJlYXNvbk1vZGFsT3Blbiwgc2V0SXNEZWxldGVSZWFzb25Nb2RhbE9wZW5dID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbcnVuVG9EZWxldGVJZCwgc2V0UnVuVG9EZWxldGVJZF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcbiAgY29uc3QgW2RlbGV0ZVJlYXNvblRleHQsIHNldERlbGV0ZVJlYXNvblRleHRdID0gdXNlU3RhdGUoXCJcIik7XG4gIGNvbnN0IFtydW5Ub0RlbGV0ZVN0YXR1cywgc2V0UnVuVG9EZWxldGVTdGF0dXNdID0gdXNlU3RhdGU8c3RyaW5nPihcIlwiKTtcblxuICAvLyBSZWdpc3RlciBUcmFuc2ZlciBNb2RhbFxuICBjb25zdCBbaXNUcmFuc2Zlck1vZGFsT3Blbiwgc2V0SXNUcmFuc2Zlck1vZGFsT3Blbl0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtiYW5rRmlsdGVyLCBzZXRCYW5rRmlsdGVyXSA9IHVzZVN0YXRlKFwiQWxsXCIpO1xuICBjb25zdCBbdHJhbnNmZXJGb3JtLCBzZXRUcmFuc2ZlckZvcm1dID0gdXNlU3RhdGUoe1xuICAgIGJhbmtOYW1lOiBcItin2YTYqNmG2YMg2KfZhNij2YfZhNmKINin2YTYs9i52YjYr9mKIChTTkIpXCIsXG4gICAgcmVmZXJlbmNlTnVtYmVyOiBcIlwiLFxuICAgIHRyYW5zZmVyRGF0ZTogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXSxcbiAgICBub3RlczogXCJcIixcbiAgfSk7XG5cbiAgLy8gQWR2YW5jZWQgTW9kaWZpY2F0aW9uIFJlcXVlc3QgTW9kYWxcbiAgY29uc3QgW2lzTW9kUmVxdWVzdE1vZGFsT3Blbiwgc2V0SXNNb2RSZXF1ZXN0TW9kYWxPcGVuXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3Jldmlld2VyUmVxdWVzdFRpdGxlLCBzZXRSZXZpZXdlclJlcXVlc3RUaXRsZV0gPSB1c2VTdGF0ZShcIlwiKTtcbiAgY29uc3QgW21vZFJlcXVlc3ROb3Rlcywgc2V0TW9kUmVxdWVzdE5vdGVzXSA9IHVzZVN0YXRlKFwiXCIpO1xuICBjb25zdCBbcmV2aWV3ZXJSZXF1ZXN0UHJpb3JpdHksIHNldFJldmlld2VyUmVxdWVzdFByaW9yaXR5XSA9IHVzZVN0YXRlPFwiVXJnZW50XCIgfCBcIk1lZGl1bVwiIHwgXCJOb3JtYWxcIj4oXCJOb3JtYWxcIik7XG4gIGNvbnN0IFtzZWxlY3RlZE1vZEVtcGxveWVlcywgc2V0U2VsZWN0ZWRNb2RFbXBsb3llZXNdID0gdXNlU3RhdGU8e1xuICAgIFtlbXBJZDogc3RyaW5nXToge1xuICAgICAgc2VsZWN0ZWQ6IGJvb2xlYW47XG4gICAgICBmaWVsZFRvTW9kaWZ5OiBzdHJpbmc7XG4gICAgICBwcm9wb3NlZEFtb3VudDogbnVtYmVyO1xuICAgICAgbm90ZTogc3RyaW5nO1xuICAgIH1cbiAgfT4oe30pO1xuXG4gIC8vIE1vZGlmaWNhdGlvbiBSZXNwb25kIE1vZGFsXG4gIGNvbnN0IFtzZWxlY3RlZFJlcXVlc3RGb3JSZXNwb25zZSwgc2V0U2VsZWN0ZWRSZXF1ZXN0Rm9yUmVzcG9uc2VdID0gdXNlU3RhdGU8UGF5cm9sbE1vZGlmaWNhdGlvblJlcXVlc3QgfCBudWxsPihudWxsKTtcbiAgY29uc3QgW2lzTW9kUmVzcG9uc2VNb2RhbE9wZW4sIHNldElzTW9kUmVzcG9uc2VNb2RhbE9wZW5dID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbbW9kUmVzcG9uc2VOb3Rlcywgc2V0TW9kUmVzcG9uc2VOb3Rlc10gPSB1c2VTdGF0ZShcIlwiKTtcbiAgY29uc3QgW21vZFJlc3BvbnNlU3RhdHVzLCBzZXRNb2RSZXNwb25zZVN0YXR1c10gPSB1c2VTdGF0ZTxcIkNsb3NlZFwiIHwgXCJPcGVuXCI+KFwiQ2xvc2VkXCIpO1xuXG4gIC8vIEhlbHBlciB0byBjb252ZXJ0IGFueSBBcmFiaWMgZGlnaXRzIHRvIEVuZ2xpc2ggZGlnaXRzIGdsb2JhbGx5XG4gIGNvbnN0IHRvRW5nbGlzaERpZ2l0cyA9IChzdHI6IHN0cmluZyB8IG51bWJlciB8IG51bGwgfCB1bmRlZmluZWQpOiBzdHJpbmcgPT4ge1xuICAgIGlmIChzdHIgPT09IG51bGwgfHwgc3RyID09PSB1bmRlZmluZWQpIHJldHVybiBcIlwiO1xuICAgIGNvbnN0IG51bVN0ciA9IFN0cmluZyhzdHIpO1xuICAgIGNvbnN0IGFyYWJpY0RpZ2l0cyA9IFtcItmgXCIsIFwi2aFcIiwgXCLZolwiLCBcItmjXCIsIFwi2aRcIiwgXCLZpVwiLCBcItmmXCIsIFwi2adcIiwgXCLZqFwiLCBcItmpXCJdO1xuICAgIGNvbnN0IHBlcnNpYW5EaWdpdHMgPSBbXCLbsFwiLCBcItuxXCIsIFwi27JcIiwgXCLbs1wiLCBcItu0XCIsIFwi27VcIiwgXCLbtlwiLCBcItu3XCIsIFwi27hcIiwgXCLbuVwiXTtcbiAgICByZXR1cm4gbnVtU3RyXG4gICAgICAucmVwbGFjZSgvW9mgLdmpXS9nLCAodykgPT4gU3RyaW5nKGFyYWJpY0RpZ2l0cy5pbmRleE9mKHcpKSlcbiAgICAgIC5yZXBsYWNlKC9b27At27ldL2csICh3KSA9PiBTdHJpbmcocGVyc2lhbkRpZ2l0cy5pbmRleE9mKHcpKSk7XG4gIH07XG5cbiAgLy8gSGVscGVyIHRvIGZvcm1hdCBtb25leSBzZWN1cmVseSB3aXRoIEVuZ2xpc2ggZGlnaXRzIG9ubHlcbiAgY29uc3QgZm9ybWF0TW9uZXkgPSAodmFsOiBudW1iZXIgfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkKTogc3RyaW5nID0+IHtcbiAgICBpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gXCIwLjAwXCI7XG4gICAgY29uc3QgY2xlYW5lZCA9IHRvRW5nbGlzaERpZ2l0cyh2YWwpO1xuICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlRmxvYXQoY2xlYW5lZCkgfHwgMDtcbiAgICByZXR1cm4gcGFyc2VkLnRvTG9jYWxlU3RyaW5nKFwiZW4tVVNcIiwgeyBtaW5pbXVtRnJhY3Rpb25EaWdpdHM6IDIsIG1heGltdW1GcmFjdGlvbkRpZ2l0czogMiB9KTtcbiAgfTtcblxuICAvLyBIZWxwZXIgdG8gd3JpdGUgYXVkaXQgbG9ncyB0byBGaXJlc3RvcmVcbiAgY29uc3QgbG9nQWN0aW9uVG9BdWRpdCA9IGFzeW5jIChwYXJhbXM6IHtcbiAgICBhY3Rpb246IHN0cmluZztcbiAgICBwYXlyb2xsUnVuSWQ6IHN0cmluZztcbiAgICBlbXBsb3llZUlkPzogc3RyaW5nO1xuICAgIGZpZWxkTmFtZT86IHN0cmluZztcbiAgICBvbGRWYWx1ZT86IHN0cmluZyB8IG51bWJlcjtcbiAgICBuZXdWYWx1ZT86IHN0cmluZyB8IG51bWJlcjtcbiAgICBub3Rlcz86IHN0cmluZztcbiAgfSkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYXlsb2FkID0ge1xuICAgICAgICB1c2VySWQ6IHRvRW5nbGlzaERpZ2l0cyh1c2VyLmlkIHx8IHVzZXIudWlkIHx8IFwidW5rbm93blwiKSxcbiAgICAgICAgdXNlck5hbWU6IHVzZXIudXNlcm5hbWUgfHwgXCJVbmtub3duIFVzZXJcIixcbiAgICAgICAgdXNlclJvbGU6IHVzZXIucm9sZSB8fCBcInVua25vd25cIixcbiAgICAgICAgYWN0aW9uOiBwYXJhbXMuYWN0aW9uLFxuICAgICAgICBtb2R1bGU6IFwibW9udGhseV9wYXlyb2xsXCIsXG4gICAgICAgIHBheXJvbGxSdW5JZDogcGFyYW1zLnBheXJvbGxSdW5JZCxcbiAgICAgICAgZW1wbG95ZWVJZDogcGFyYW1zLmVtcGxveWVlSWQgfHwgXCJcIixcbiAgICAgICAgZmllbGROYW1lOiBwYXJhbXMuZmllbGROYW1lIHx8IFwiXCIsXG4gICAgICAgIG9sZFZhbHVlOiB0b0VuZ2xpc2hEaWdpdHMocGFyYW1zLm9sZFZhbHVlICE9PSB1bmRlZmluZWQgPyBTdHJpbmcocGFyYW1zLm9sZFZhbHVlKSA6IFwiXCIpLFxuICAgICAgICBuZXdWYWx1ZTogdG9FbmdsaXNoRGlnaXRzKHBhcmFtcy5uZXdWYWx1ZSAhPT0gdW5kZWZpbmVkID8gU3RyaW5nKHBhcmFtcy5uZXdWYWx1ZSkgOiBcIlwiKSxcbiAgICAgICAgbm90ZXM6IHBhcmFtcy5ub3RlcyB8fCBcIlwiLFxuICAgICAgfTtcbiAgICAgIGF3YWl0IGZldGNoKFwiL2FwaS9hdWRpdF9sb2dzXCIsIHtcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShwYXlsb2FkKSxcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byB3cml0ZSB0byBzeXN0ZW0gYXVkaXQgbG9nOlwiLCBlcnIpO1xuICAgIH1cbiAgfTtcblxuICAvLyBGZXRjaCBQYXlyb2xsIFJ1bnMgYW5kIEhSIERlZHVjdGlvbnMgb24gbG9hZFxuICBjb25zdCBsb2FkUGF5cm9sbFJ1bnMgPSBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIHNldExvYWRpbmcodHJ1ZSk7XG4gICAgICBjb25zdCBbcmVzUnVucywgcmVzRGVkdWN0aW9uc10gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgIGZldGNoKFwiL2FwaS9wYXlyb2xsX3J1bnNcIiksXG4gICAgICAgIGZldGNoKFwiL2FwaS9kZWR1Y3Rpb25zXCIpLFxuICAgICAgXSk7XG4gICAgICBpZiAocmVzUnVucy5vaykge1xuICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzUnVucy5qc29uKCk7XG4gICAgICAgIHNldFBheXJvbGxSdW5zKGRhdGEpO1xuICAgICAgfVxuICAgICAgaWYgKHJlc0RlZHVjdGlvbnMub2spIHtcbiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc0RlZHVjdGlvbnMuanNvbigpO1xuICAgICAgICBzZXRIckRlZHVjdGlvbnMoZGF0YSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBsb2FkIHBheXJvbGwgcnVucyBvciBIUiBkZWR1Y3Rpb25zOlwiLCBlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgbG9hZFBheXJvbGxSdW5zKCk7XG4gIH0sIFtdKTtcblxuICAvLyBHZW5lcmF0ZSBVbmlxdWUgUGF5cm9sbCBOdW1iZXJcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoaXNDcmVhdGVNb2RhbE9wZW4pIHtcbiAgICAgIGNvbnN0IHllYXJTdHIgPSBuZXdSdW5Gb3JtLnllYXIudG9TdHJpbmcoKTtcbiAgICAgIGNvbnN0IG1vbnRoU3RyID0gbmV3UnVuRm9ybS5tb250aC50b1N0cmluZygpLnBhZFN0YXJ0KDIsIFwiMFwiKTtcbiAgICAgIGNvbnN0IHJhbmRvbUlkID0gTWF0aC5mbG9vcigxMDAgKyBNYXRoLnJhbmRvbSgpICogOTAwKTtcbiAgICAgIHNldE5ld1J1bkZvcm0oKHByZXYpID0+ICh7XG4gICAgICAgIC4uLnByZXYsXG4gICAgICAgIHBheXJvbGxOdW1iZXI6IGBQUi0ke3llYXJTdHJ9JHttb250aFN0cn0tJHtyYW5kb21JZH1gLFxuICAgICAgfSkpO1xuICAgIH1cbiAgfSwgW2lzQ3JlYXRlTW9kYWxPcGVuLCBuZXdSdW5Gb3JtLm1vbnRoLCBuZXdSdW5Gb3JtLnllYXJdKTtcblxuICAvLyBUb2FzdCBoZWxwZXJcbiAgY29uc3Qgc2hvd1RvYXN0ID0gKG1lc3NhZ2VBcjogc3RyaW5nLCBtZXNzYWdlRW46IHN0cmluZywgdHlwZTogXCJzdWNjZXNzXCIgfCBcImVycm9yXCIgPSBcInN1Y2Nlc3NcIikgPT4ge1xuICAgIGFsZXJ0KGxhbmcgPT09IFwiYXJcIiA/IG1lc3NhZ2VBciA6IG1lc3NhZ2VFbik7XG4gIH07XG5cbiAgLy8gSGVscGVyIHJvbGVzXG4gIGNvbnN0IGlzU3VwZXJBZG1pbiA9XG4gICAgdXNlci51c2VybmFtZT8udG9Mb3dlckNhc2UoKSA9PT0gXCJmZXJhc1wiIHx8XG4gICAgdXNlci5yb2xlPy50b0xvd2VyQ2FzZSgpID09PSBcInN1cGVyIGFkbWluXCIgfHxcbiAgICB1c2VyLnJvbGUgPT09IFwi2KfZhNin2K/Yp9ix2Kkg2KfZhNi52YTZitinXCIgfHxcbiAgICB1c2VyLnJvbGUgPT09IFwi2KfZhNil2K/Yp9ix2Kkg2KfZhNi52YTZitinXCIgfHxcbiAgICB1c2VyLnJvbGU/LnRvTG93ZXJDYXNlKCkgPT09IFwibWFuYWdlclwiIHx8XG4gICAgdXNlci5yb2xlPy50b0xvd2VyQ2FzZSgpID09PSBcImFkbWluXCIgfHxcbiAgICB1c2VyLnJvbGUgPT09IFwi2YXYr9mK2LFcIiB8fFxuICAgIHVzZXIucm9sZSA9PT0gXCLZhdi02LHZgVwiIHx8XG4gICAgdXNlci5qb2JUaXRsZT8uaW5jbHVkZXMoXCLZhdi02LHZgVwiKSB8fFxuICAgIHVzZXIuam9iVGl0bGU/LmluY2x1ZGVzKFwi2YXYr9mK2LFcIik7XG5cbiAgY29uc3QgaXNBY2NvdW50YW50ID1cbiAgICBpc1N1cGVyQWRtaW4gfHxcbiAgICB1c2VyLmpvYlRpdGxlPy50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKFwiYWNjb3VudGFudFwiKSB8fFxuICAgIHVzZXIuam9iVGl0bGU/LnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoXCJhY2NvdW50aW5nXCIpIHx8XG4gICAgdXNlci5qb2JUaXRsZT8udG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhcItmF2K3Yp9iz2KhcIikgfHxcbiAgICB1c2VyLnJvbGU/LnRvTG93ZXJDYXNlKCkgPT09IFwiYWNjb3VudGFudFwiIHx8XG4gICAgdXNlci5yb2xlID09PSBcItin2YTZhdit2KfYs9io2Kkg2KfZhNmF2KfZhNuM2KlcIiB8fFxuICAgIHVzZXIucm9sZSA9PT0gXCLYp9mE2YXYrdin2LPYqNipXCI7XG5cbiAgY29uc3QgaXNSZXZpZXdlciA9XG4gICAgaXNTdXBlckFkbWluIHx8XG4gICAgdXNlci5qb2JUaXRsZT8udG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhcIm1hbmFnZXJcIikgfHxcbiAgICB1c2VyLmpvYlRpdGxlPy50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKFwiZGlyZWN0b3JcIikgfHxcbiAgICB1c2VyLmpvYlRpdGxlPy50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKFwi2YXYr9mK2LFcIikgfHxcbiAgICB1c2VyLnJvbGU/LnRvTG93ZXJDYXNlKCkgPT09IFwicmV2aWV3ZXJcIiB8fFxuICAgIHVzZXIucm9sZT8udG9Mb3dlckNhc2UoKSA9PT0gXCJhZG1pblwiO1xuXG4gIGNvbnN0IGlzUGF5ZXIgPVxuICAgIGlzU3VwZXJBZG1pbiB8fFxuICAgIHVzZXIuam9iVGl0bGU/LnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoXCJ0cmVhc3VyZXJcIikgfHxcbiAgICB1c2VyLmpvYlRpdGxlPy50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKFwicGF5ZXJcIikgfHxcbiAgICB1c2VyLmpvYlRpdGxlPy50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKFwiZmluYW5jaWFsIGNvbnRyb2xsZXJcIikgfHxcbiAgICB1c2VyLmpvYlRpdGxlPy50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKFwi2YXYr9mK2LEg2YXYp9mE2YpcIik7XG5cbiAgLy8gTG9nIGF1ZGl0aW5nIG9wZXJhdGlvbnMgaGVscGVyXG4gIGNvbnN0IGFwcGVuZEF1ZGl0TG9nID0gKHJ1bklkOiBzdHJpbmcsIGFjdGlvbjogc3RyaW5nLCBkZXRhaWxzOiBzdHJpbmcpOiBQYXlyb2xsQXVkaXRMb2cgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBpZDogYExPRy0ke0RhdGUubm93KCl9LSR7TWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTAwMCl9YCxcbiAgICAgIHBheXJvbGxSdW5JZDogcnVuSWQsXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIG9wZXJhdG9yTmFtZTogdXNlci51c2VybmFtZSB8fCBcIlVua25vd25cIixcbiAgICAgIGFjdGlvbixcbiAgICAgIGRldGFpbHMsXG4gICAgfTtcbiAgfTtcblxuICBjb25zdCBnZXRJbml0aWFsRGVkdWN0aW9ucyA9IChlbXA6IFBheXJvbGxSdW5FbXBsb3llZSk6IERlZHVjdGlvbkl0ZW1bXSA9PiB7XG4gICAgaWYgKGVtcC5kZWR1Y3Rpb25zTGlzdCAmJiBlbXAuZGVkdWN0aW9uc0xpc3QubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIGVtcC5kZWR1Y3Rpb25zTGlzdC5tYXAoaXRlbSA9PiAoe1xuICAgICAgICAuLi5pdGVtLFxuICAgICAgICBhbW91bnQ6IE51bWJlcihpdGVtLmFtb3VudCB8fCAwKVxuICAgICAgfSkpO1xuICAgIH1cbiAgICBjb25zdCBsZWdhY3k6IERlZHVjdGlvbkl0ZW1bXSA9IFtdO1xuICAgIGNvbnN0IGJhc2VEYXRlID0gc2VsZWN0ZWRSdW4/LmNyZWF0ZWRBdCB8fCBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgY29uc3QgYmFzZUJ5ID0gc2VsZWN0ZWRSdW4/LmNyZWF0ZWRCeSB8fCBcIlN5c3RlbVwiO1xuICAgIFxuICAgIGlmIChOdW1iZXIoZW1wLmxvYW5zRGVkdWN0aW9uIHx8IDApID4gMCkge1xuICAgICAgbGVnYWN5LnB1c2goe1xuICAgICAgICBpZDogYERFRC1MT0FOLSR7RGF0ZS5ub3coKX0tMWAsXG4gICAgICAgIHR5cGU6IFwiTG9hbiBEZWR1Y3Rpb25cIixcbiAgICAgICAgYW1vdW50OiBOdW1iZXIoZW1wLmxvYW5zRGVkdWN0aW9uKSxcbiAgICAgICAgcmVhc29uOiBlbXAubG9hbkRlZHVjdGlvblJlYXNvbiB8fCBcItiu2LXZhSDYs9mE2YHYqVwiLFxuICAgICAgICBjcmVhdGVkQnk6IGJhc2VCeSxcbiAgICAgICAgY3JlYXRlZEF0OiBiYXNlRGF0ZSxcbiAgICAgICAgdXBkYXRlZEJ5OiBiYXNlQnksXG4gICAgICAgIHVwZGF0ZWRBdDogYmFzZURhdGUsXG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKE51bWJlcihlbXAuYWJzZW5jZURlZHVjdGlvbiB8fCAwKSA+IDApIHtcbiAgICAgIGxlZ2FjeS5wdXNoKHtcbiAgICAgICAgaWQ6IGBERUQtQUItJHtEYXRlLm5vdygpfS0yYCxcbiAgICAgICAgdHlwZTogXCJBYnNlbmNlIERlZHVjdGlvblwiLFxuICAgICAgICBhbW91bnQ6IE51bWJlcihlbXAuYWJzZW5jZURlZHVjdGlvbiksXG4gICAgICAgIHJlYXNvbjogZW1wLmFic2VuY2VEZWR1Y3Rpb25SZWFzb24gfHwgXCLYrti12YUg2LrZitin2KhcIixcbiAgICAgICAgY3JlYXRlZEJ5OiBiYXNlQnksXG4gICAgICAgIGNyZWF0ZWRBdDogYmFzZURhdGUsXG4gICAgICAgIHVwZGF0ZWRCeTogYmFzZUJ5LFxuICAgICAgICB1cGRhdGVkQXQ6IGJhc2VEYXRlLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChOdW1iZXIoZW1wLmxhdGVEZWR1Y3Rpb24gfHwgMCkgPiAwKSB7XG4gICAgICBsZWdhY3kucHVzaCh7XG4gICAgICAgIGlkOiBgREVELUxULSR7RGF0ZS5ub3coKX0tM2AsXG4gICAgICAgIHR5cGU6IFwiTGF0ZSBEZWR1Y3Rpb25cIixcbiAgICAgICAgYW1vdW50OiBOdW1iZXIoZW1wLmxhdGVEZWR1Y3Rpb24pLFxuICAgICAgICByZWFzb246IGVtcC5sYXRlRGVkdWN0aW9uUmVhc29uIHx8IFwi2K7YtdmFINiq2KPYrtmK2LFcIixcbiAgICAgICAgY3JlYXRlZEJ5OiBiYXNlQnksXG4gICAgICAgIGNyZWF0ZWRBdDogYmFzZURhdGUsXG4gICAgICAgIHVwZGF0ZWRCeTogYmFzZUJ5LFxuICAgICAgICB1cGRhdGVkQXQ6IGJhc2VEYXRlLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChOdW1iZXIoZW1wLnBlbmFsdHlEZWR1Y3Rpb24gfHwgMCkgPiAwKSB7XG4gICAgICBsZWdhY3kucHVzaCh7XG4gICAgICAgIGlkOiBgREVELVBOLSR7RGF0ZS5ub3coKX0tNGAsXG4gICAgICAgIHR5cGU6IFwiUGVuYWx0eSBEZWR1Y3Rpb25cIixcbiAgICAgICAgYW1vdW50OiBOdW1iZXIoZW1wLnBlbmFsdHlEZWR1Y3Rpb24pLFxuICAgICAgICByZWFzb246IGVtcC5wZW5hbHR5RGVkdWN0aW9uUmVhc29uIHx8IFwi2K7YtdmFINis2LLYp9ihINil2K/Yp9ix2YpcIixcbiAgICAgICAgY3JlYXRlZEJ5OiBiYXNlQnksXG4gICAgICAgIGNyZWF0ZWRBdDogYmFzZURhdGUsXG4gICAgICAgIHVwZGF0ZWRCeTogYmFzZUJ5LFxuICAgICAgICB1cGRhdGVkQXQ6IGJhc2VEYXRlLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChOdW1iZXIoZW1wLm90aGVyRGVkdWN0aW9ucyB8fCAwKSA+IDApIHtcbiAgICAgIGxlZ2FjeS5wdXNoKHtcbiAgICAgICAgaWQ6IGBERUQtT1QtJHtEYXRlLm5vdygpfS01YCxcbiAgICAgICAgdHlwZTogXCJPdGhlciBEZWR1Y3Rpb25cIixcbiAgICAgICAgYW1vdW50OiBOdW1iZXIoZW1wLm90aGVyRGVkdWN0aW9ucyksXG4gICAgICAgIHJlYXNvbjogZW1wLmRlZHVjdGlvbnNSZWFzb24gfHwgXCLYrti12YUg2KLYrtixXCIsXG4gICAgICAgIGNyZWF0ZWRCeTogYmFzZUJ5LFxuICAgICAgICBjcmVhdGVkQXQ6IGJhc2VEYXRlLFxuICAgICAgICB1cGRhdGVkQnk6IGJhc2VCeSxcbiAgICAgICAgdXBkYXRlZEF0OiBiYXNlRGF0ZSxcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gbGVnYWN5O1xuICB9O1xuXG4gIGNvbnN0IGhhbmRsZU9wZW5EZWR1Y3Rpb25zTW9kYWwgPSAoZW1wOiBQYXlyb2xsUnVuRW1wbG95ZWUpID0+IHtcbiAgICBzZXRTZWxlY3RlZERlZHVjdGlvbkVtcGxveWVlKGVtcCk7XG4gICAgc2V0TG9jYWxEZWR1Y3Rpb25zKGdldEluaXRpYWxEZWR1Y3Rpb25zKGVtcCkpO1xuICAgIHNldElzRGVkdWN0aW9uTW9kYWxPcGVuKHRydWUpO1xuICB9O1xuXG4gIGNvbnN0IGhhbmRsZVNhdmVEZWR1Y3Rpb25zTW9kYWwgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFzZWxlY3RlZFJ1biB8fCAhc2VsZWN0ZWREZWR1Y3Rpb25FbXBsb3llZSkgcmV0dXJuO1xuXG4gICAgLy8gVkFMSURBVElPTiBSVUxFUzpcbiAgICAvLyAtIEVhY2ggZGVkdWN0aW9uIG11c3QgaGF2ZSBhbiBhbW91bnQgPiAwLlxuICAgIC8vIC0gTm8gbmVnYXRpdmUgYW1vdW50IGFsbG93ZWQuXG4gICAgLy8gLSBFYWNoIGRlZHVjdGlvbiBtdXN0IGhhdmUgYSByZWFzb24uXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbERlZHVjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGl0ZW0gPSBsb2NhbERlZHVjdGlvbnNbaV07XG4gICAgICBjb25zdCBhbW91bnQgPSBOdW1iZXIoaXRlbS5hbW91bnQpO1xuICAgICAgaWYgKGlzTmFOKGFtb3VudCkgfHwgYW1vdW50IDw9IDApIHtcbiAgICAgICAgc2hvd1RvYXN0KFxuICAgICAgICAgIFwi4p2MINmK2KzYqCDYo9mGINmK2YPZiNmGINmF2KjZhNi6INin2YTYrti12YUg2KPZg9io2LEg2YXZhiDYp9mE2LXZgdixINmI2YTYpyDZitiz2YXYrSDYqNin2YTZgtmK2YUg2KfZhNiz2KfZhNio2KkhXCIsXG4gICAgICAgICAgXCLinYwgRGVkdWN0aW9uIGFtb3VudCBtdXN0IGJlIGdyZWF0ZXIgdGhhbiAwIGFuZCBjYW5ub3QgYmUgbmVnYXRpdmUhXCIsXG4gICAgICAgICAgXCJlcnJvclwiXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICghaXRlbS5yZWFzb24gfHwgIWl0ZW0ucmVhc29uLnRyaW0oKSkge1xuICAgICAgICBzaG93VG9hc3QoXG4gICAgICAgICAgXCLinYwg2YrYrNioINiq2K3Yr9mK2K8g2LPYqNioINin2YTYrti12YUg2YTYrNmF2YrYuSDYp9mE2KjZhtmI2K8g2KfZhNmF2K/Ysdis2KkhXCIsXG4gICAgICAgICAgXCLinYwgQSBkZWR1Y3Rpb24gcmVhc29uIGlzIHJlcXVpcmVkIGZvciBhbGwgZW50ZXJlZCBpdGVtcyFcIixcbiAgICAgICAgICBcImVycm9yXCJcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGJhc2VCeSA9IHVzZXIudXNlcm5hbWUgfHwgXCJTeXN0ZW1cIjtcbiAgICBjb25zdCBiYXNlRGF0ZSA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcblxuICAgIC8vIE1hcCBhbmQgY2FsY3VsYXRlIGFnZ3JlZ2F0ZWQgdG90YWxzIGZvciBjYXRlZ29yaWVzXG4gICAgY29uc3QgdmFsaWRhdGVkRGVkdWN0aW9ucyA9IGxvY2FsRGVkdWN0aW9ucy5tYXAoaXRlbSA9PiAoe1xuICAgICAgLi4uaXRlbSxcbiAgICAgIGFtb3VudDogTnVtYmVyKGl0ZW0uYW1vdW50KSxcbiAgICAgIHVwZGF0ZWRCeTogYmFzZUJ5LFxuICAgICAgdXBkYXRlZEF0OiBiYXNlRGF0ZSxcbiAgICB9KSk7XG5cbiAgICBjb25zdCBsb2Fuc1N1bSA9IHZhbGlkYXRlZERlZHVjdGlvbnMuZmlsdGVyKGkgPT4gaS50eXBlID09PSBcIkxvYW4gRGVkdWN0aW9uXCIpLnJlZHVjZSgoc3VtLCBpKSA9PiBzdW0gKyBpLmFtb3VudCwgMCk7XG4gICAgY29uc3QgYWJzZW5jZVN1bSA9IHZhbGlkYXRlZERlZHVjdGlvbnMuZmlsdGVyKGkgPT4gaS50eXBlID09PSBcIkFic2VuY2UgRGVkdWN0aW9uXCIpLnJlZHVjZSgoc3VtLCBpKSA9PiBzdW0gKyBpLmFtb3VudCwgMCk7XG4gICAgY29uc3QgbGF0ZVN1bSA9IHZhbGlkYXRlZERlZHVjdGlvbnMuZmlsdGVyKGkgPT4gaS50eXBlID09PSBcIkxhdGUgRGVkdWN0aW9uXCIpLnJlZHVjZSgoc3VtLCBpKSA9PiBzdW0gKyBpLmFtb3VudCwgMCk7XG4gICAgY29uc3QgcGVuYWx0eVN1bSA9IHZhbGlkYXRlZERlZHVjdGlvbnMuZmlsdGVyKGkgPT4gaS50eXBlID09PSBcIlBlbmFsdHkgRGVkdWN0aW9uXCIpLnJlZHVjZSgoc3VtLCBpKSA9PiBzdW0gKyBpLmFtb3VudCwgMCk7XG4gICAgY29uc3Qgb3RoZXJTdW0gPSB2YWxpZGF0ZWREZWR1Y3Rpb25zLmZpbHRlcihpID0+IGkudHlwZSA9PT0gXCJPdGhlciBEZWR1Y3Rpb25cIikucmVkdWNlKChzdW0sIGkpID0+IHN1bSArIGkuYW1vdW50LCAwKTtcbiAgICBjb25zdCB0b3RhbERlZHVjdFN1bSA9IHZhbGlkYXRlZERlZHVjdGlvbnMucmVkdWNlKChzdW0sIGkpID0+IHN1bSArIGkuYW1vdW50LCAwKTtcblxuICAgIGNvbnN0IGxvYW5zUmVhc29ucyA9IHZhbGlkYXRlZERlZHVjdGlvbnMuZmlsdGVyKGkgPT4gaS50eXBlID09PSBcIkxvYW4gRGVkdWN0aW9uXCIpLm1hcChpID0+IGkucmVhc29uKS5qb2luKFwiICsgXCIpIHx8IFwi2K7YtdmFINiz2YTZgdipXCI7XG4gICAgY29uc3QgYWJzZW5jZVJlYXNvbnMgPSB2YWxpZGF0ZWREZWR1Y3Rpb25zLmZpbHRlcihpID0+IGkudHlwZSA9PT0gXCJBYnNlbmNlIERlZHVjdGlvblwiKS5tYXAoaSA9PiBpLnJlYXNvbikuam9pbihcIiArIFwiKSB8fCBcItiu2LXZhSDYutmK2KfYqFwiO1xuICAgIGNvbnN0IGxhdGVSZWFzb25zID0gdmFsaWRhdGVkRGVkdWN0aW9ucy5maWx0ZXIoaSA9PiBpLnR5cGUgPT09IFwiTGF0ZSBEZWR1Y3Rpb25cIikubWFwKGkgPT4gaS5yZWFzb24pLmpvaW4oXCIgKyBcIikgfHwgXCLYrti12YUg2KrYo9iu2YrYsVwiO1xuICAgIGNvbnN0IHBlbmFsdHlSZWFzb25zID0gdmFsaWRhdGVkRGVkdWN0aW9ucy5maWx0ZXIoaSA9PiBpLnR5cGUgPT09IFwiUGVuYWx0eSBEZWR1Y3Rpb25cIikubWFwKGkgPT4gaS5yZWFzb24pLmpvaW4oXCIgKyBcIikgfHwgXCLYrti12YUg2KzYstin2KEg2KXYr9in2LHZilwiO1xuICAgIGNvbnN0IG90aGVyUmVhc29ucyA9IHZhbGlkYXRlZERlZHVjdGlvbnMuZmlsdGVyKGkgPT4gaS50eXBlID09PSBcIk90aGVyIERlZHVjdGlvblwiKS5tYXAoaSA9PiBpLnJlYXNvbikuam9pbihcIiArIFwiKSB8fCBcItiu2LXZiNmF2KfYqiDYo9iu2LHZiVwiO1xuXG4gICAgLy8gUmVjYWxjdWxhdGUgZW1wbG95ZWUgbmV0XG4gICAgY29uc3QgY2FsY3VsYXRlZCA9IGNhbGN1bGF0ZUVtcGxveWVlTmV0KHtcbiAgICAgIC4uLnNlbGVjdGVkRGVkdWN0aW9uRW1wbG95ZWUsXG4gICAgICBsb2Fuc0RlZHVjdGlvbjogbG9hbnNTdW0sXG4gICAgICBhYnNlbmNlRGVkdWN0aW9uOiBhYnNlbmNlU3VtLFxuICAgICAgbGF0ZURlZHVjdGlvbjogbGF0ZVN1bSxcbiAgICAgIHBlbmFsdHlEZWR1Y3Rpb246IHBlbmFsdHlTdW0sXG4gICAgICBvdGhlckRlZHVjdGlvbnM6IG90aGVyU3VtLFxuICAgIH0pO1xuXG4gICAgY29uc3QgdXBkYXRlZEVtcGxveWVlOiBQYXlyb2xsUnVuRW1wbG95ZWUgPSB7XG4gICAgICAuLi5zZWxlY3RlZERlZHVjdGlvbkVtcGxveWVlLFxuICAgICAgbG9hbnNEZWR1Y3Rpb246IGxvYW5zU3VtLFxuICAgICAgbG9hbkRlZHVjdGlvblJlYXNvbjogbG9hbnNSZWFzb25zLFxuICAgICAgYWJzZW5jZURlZHVjdGlvbjogYWJzZW5jZVN1bSxcbiAgICAgIGFic2VuY2VEZWR1Y3Rpb25SZWFzb246IGFic2VuY2VSZWFzb25zLFxuICAgICAgbGF0ZURlZHVjdGlvbjogbGF0ZVN1bSxcbiAgICAgIGxhdGVEZWR1Y3Rpb25SZWFzb246IGxhdGVSZWFzb25zLFxuICAgICAgcGVuYWx0eURlZHVjdGlvbjogcGVuYWx0eVN1bSxcbiAgICAgIHBlbmFsdHlEZWR1Y3Rpb25SZWFzb246IHBlbmFsdHlSZWFzb25zLFxuICAgICAgb3RoZXJEZWR1Y3Rpb25zOiBvdGhlclN1bSxcbiAgICAgIGRlZHVjdGlvbnNSZWFzb246IG90aGVyUmVhc29ucyxcbiAgICAgIGRlZHVjdGlvbnNMaXN0OiB2YWxpZGF0ZWREZWR1Y3Rpb25zLFxuICAgICAgdG90YWxEZWR1Y3Rpb25zOiB0b3RhbERlZHVjdFN1bSxcbiAgICAgIG5ldFNhbGFyeTogY2FsY3VsYXRlZC5uZXRTYWxhcnksXG4gICAgfTtcblxuICAgIGNvbnN0IG5ld0VtcGxveWVlc0xpc3QgPSBydW5FbXBsb3llZXMubWFwKChlKSA9PiAoZS5pZCA9PT0gc2VsZWN0ZWREZWR1Y3Rpb25FbXBsb3llZS5pZCA/IHVwZGF0ZWRFbXBsb3llZSA6IGUpKTtcblxuICAgIC8vIFJlY29tcHV0ZSB0b3RhbCBydW4gZmlndXJlc1xuICAgIGNvbnN0IHRvdGFsQmFzaWNTYWxhcnkgPSBuZXdFbXBsb3llZXNMaXN0LnJlZHVjZSgoc3VtLCBpdGVtKSA9PiBzdW0gKyBpdGVtLmJhc2ljU2FsYXJ5LCAwKTtcbiAgICBjb25zdCB0b3RhbEFsbG93YW5jZXMgPSBuZXdFbXBsb3llZXNMaXN0LnJlZHVjZShcbiAgICAgIChzdW0sIGl0ZW0pID0+XG4gICAgICAgIHN1bSArXG4gICAgICAgIGl0ZW0uaG91c2luZ0FsbG93YW5jZSArXG4gICAgICAgIGl0ZW0udHJhbnNwb3J0QWxsb3dhbmNlICtcbiAgICAgICAgaXRlbS5waG9uZUFsbG93YW5jZSArXG4gICAgICAgIGl0ZW0uZm9vZEFsbG93YW5jZSArXG4gICAgICAgIGl0ZW0ub3ZlcnRpbWVBbW91bnQgK1xuICAgICAgICBpdGVtLm90aGVyQWxsb3dhbmNlcyArXG4gICAgICAgIChpdGVtLmxpdmluZ0FsbG93YW5jZSB8fCAwKSxcbiAgICAgIDBcbiAgICApO1xuICAgIGNvbnN0IHRvdGFsRGVkdWN0aW9ucyA9IG5ld0VtcGxveWVlc0xpc3QucmVkdWNlKChzdW0sIGl0ZW0pID0+IHN1bSArIGl0ZW0udG90YWxEZWR1Y3Rpb25zLCAwKTtcbiAgICBjb25zdCB0b3RhbE5ldFNhbGFyeSA9IG5ld0VtcGxveWVlc0xpc3QucmVkdWNlKChzdW0sIGl0ZW0pID0+IHN1bSArIGl0ZW0ubmV0U2FsYXJ5LCAwKTtcbiAgICBcbiAgICAvLyBUb3RhbCBPdmVydGltZSBzdW1tYXJ5XG4gICAgY29uc3QgdG90YWxPdmVydGltZUhvdXJzID0gbmV3RW1wbG95ZWVzTGlzdC5yZWR1Y2UoKHN1bSwgaXRlbSkgPT4gc3VtICsgKGl0ZW0ub3ZlcnRpbWVIb3VycyB8fCAwKSwgMCk7XG4gICAgY29uc3QgdG90YWxPdmVydGltZUFtb3VudCA9IG5ld0VtcGxveWVlc0xpc3QucmVkdWNlKChzdW0sIGl0ZW0pID0+IHN1bSArIChpdGVtLm92ZXJ0aW1lQW1vdW50IHx8IDApLCAwKTtcblxuICAgIC8vIENPTVBBUkUgT0xEIFZTIE5FVyBERURVQ1RJT05TIFRPIFdSSVRFIEFVRElUIExPR1MgRk9SIENIQU5HRVNcbiAgICBjb25zdCBvbGREZWR1Y3Rpb25zID0gZ2V0SW5pdGlhbERlZHVjdGlvbnMoc2VsZWN0ZWREZWR1Y3Rpb25FbXBsb3llZSk7XG4gICAgY29uc3QgZ2VuZXJhdGVkQXVkaXRMb2dzOiBQYXlyb2xsQXVkaXRMb2dbXSA9IFtdO1xuXG4gICAgLy8gVHJhY2sgYWRkZWQgb3IgdXBkYXRlZFxuICAgIHZhbGlkYXRlZERlZHVjdGlvbnMuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgIGNvbnN0IG1hdGNoaW5nT2xkID0gb2xkRGVkdWN0aW9ucy5maW5kKG9sZCA9PiBvbGQuaWQgPT09IGl0ZW0uaWQpO1xuICAgICAgaWYgKCFtYXRjaGluZ09sZCkge1xuICAgICAgICAvLyBBRERcbiAgICAgICAgY29uc3QgZGV0YWlscyA9IGDYp9mE2YXYs9iq2K7Yr9mFOiBbSUQ6ICR7dXNlci51aWQgfHwgdXNlci5pZCB8fCBcIk4vQVwifSwg2KfZhNin2LPZhTogJHt1c2VyLnVzZXJuYW1lfSwg2KfZhNio2LHZitivINin2YTYpdmE2YPYqtix2YjZhtmKOiAke3VzZXIudXNlcm5hbWV9QGFsd2FsZWVkbmVvbi5jb20sINin2YTYr9mI2LE6ICR7dXNlci5yb2xlfSwgSVA6IDEyNy4wLjAuMV1cbtin2YTYpdis2LHYp9ihINin2YTYrdix2YPZijog2KXYttin2YHYqSDYqNmG2K8g2K7YtdmFINiq2YHYtdmK2YTZiiDYrNiv2YrYr1xu2YbZiNi5INin2YTYrti12YU6ICR7aXRlbS50eXBlfVxu2KfZhNmF2YjYuNmBINin2YTZhdiz2KrZh9iv2YE6ICR7c2VsZWN0ZWREZWR1Y3Rpb25FbXBsb3llZS5hcmFiaWNOYW1lfSAo2YPZiNivOiAke3NlbGVjdGVkRGVkdWN0aW9uRW1wbG95ZWUuZW1wbG95ZWVJZH0pXG7ZhdmC2KfYsdmG2Kkg2KfZhNmC2YrZhTogW9in2YTZgtmK2YXYqSDYp9mE2LPYp9io2YLYqTogMCDYsS7YsyAtPiDYp9mE2YLZitmF2Kkg2KfZhNis2K/Zitiv2Kk6ICR7aXRlbS5hbW91bnR9INixLtizXVxu2KfZhNiz2KjYqCDYp9mE2YXZiNir2YI6ICR7aXRlbS5yZWFzb259XG7Yp9mE2YXZhNin2K3YuNin2Kog2KfZhNmF2YTYrdmC2Kk6ICR7aXRlbS5ub3RlcyB8fCBcItmE2Kcg2KrZiNis2K9cIn1cbtin2YTZhdix2YHZgiDYp9mE2KXYq9io2KfYqtmKOiAke2l0ZW0uYXR0YWNobWVudFVybCB8fCBcItmE2Kcg2YrZiNis2K9cIn1gO1xuICAgICAgICBnZW5lcmF0ZWRBdWRpdExvZ3MucHVzaChhcHBlbmRBdWRpdExvZyhzZWxlY3RlZFJ1bi5pZCwgYNil2LbYp9mB2Kkg2K7YtdmFINiq2YHYtdmK2YTZiiAtICR7aXRlbS50eXBlfWAsIGRldGFpbHMpKTtcbiAgICAgIH0gZWxzZSBpZiAobWF0Y2hpbmdPbGQuYW1vdW50ICE9PSBpdGVtLmFtb3VudCB8fCBtYXRjaGluZ09sZC5yZWFzb24gIT09IGl0ZW0ucmVhc29uIHx8IG1hdGNoaW5nT2xkLm5vdGVzICE9PSBpdGVtLm5vdGVzIHx8IG1hdGNoaW5nT2xkLmF0dGFjaG1lbnRVcmwgIT09IGl0ZW0uYXR0YWNobWVudFVybCkge1xuICAgICAgICAvLyBFRElUXG4gICAgICAgIGNvbnN0IGRldGFpbHMgPSBg2KfZhNmF2LPYqtiu2K/ZhTogW0lEOiAke3VzZXIudWlkIHx8IHVzZXIuaWQgfHwgXCJOL0FcIn0sINin2YTYp9iz2YU6ICR7dXNlci51c2VybmFtZX0sINin2YTYqNix2YrYryDYp9mE2KXZhNmD2KrYsdmI2YbZijogJHt1c2VyLnVzZXJuYW1lfUBhbHdhbGVlZG5lb24uY29tLCDYp9mE2K/ZiNixOiAke3VzZXIucm9sZX0sIElQOiAxMjcuMC4wLjFdXG7Yp9mE2KXYrNix2KfYoSDYp9mE2K3YsdmD2Yo6INiq2LnYr9mK2YQg2KrZgdin2LXZitmEINio2YbYryDYrti12YUg2YXZiNis2YjYr1xu2YbZiNi5INin2YTYrti12YU6ICR7aXRlbS50eXBlfVxu2KfZhNmF2YjYuNmBINin2YTZhdiz2KrZh9iv2YE6ICR7c2VsZWN0ZWREZWR1Y3Rpb25FbXBsb3llZS5hcmFiaWNOYW1lfSAo2YPZiNivOiAke3NlbGVjdGVkRGVkdWN0aW9uRW1wbG95ZWUuZW1wbG95ZWVJZH0pXG7ZhdmC2KfYsdmG2Kkg2KfZhNmC2YrZhTogW9in2YTZgtmK2YXYqSDYp9mE2LPYp9io2YLYqTogJHttYXRjaGluZ09sZC5hbW91bnR9INixLtizIC0+INin2YTZgtmK2YXYqSDYp9mE2KzYr9mK2K/YqTogJHtpdGVtLmFtb3VudH0g2LEu2LNdXG7ZhdmC2KfYsdmG2Kkg2KfZhNij2LPYqNin2Kg6IFvYp9mE2LPYqNioINin2YTYs9in2KjZgjogJHttYXRjaGluZ09sZC5yZWFzb259IC0+INin2YTYs9io2Kgg2KfZhNis2K/ZitivOiAke2l0ZW0ucmVhc29ufV1cbtin2YTZhdmE2KfYrdi42KfYqiDYp9mE2YXZhNit2YLYqTogJHtpdGVtLm5vdGVzIHx8IFwi2YTYpyDYqtmI2KzYr1wifVxu2KfZhNmF2LHZgdmCINin2YTYpdir2KjYp9iq2Yo6ICR7aXRlbS5hdHRhY2htZW50VXJsIHx8IFwi2YTYpyDZitmI2KzYr1wifWA7XG4gICAgICAgIGdlbmVyYXRlZEF1ZGl0TG9ncy5wdXNoKGFwcGVuZEF1ZGl0TG9nKHNlbGVjdGVkUnVuLmlkLCBg2KrYudiv2YrZhCDYrti12YUg2KrZgdi12YrZhNmKIC0gJHtpdGVtLnR5cGV9YCwgZGV0YWlscykpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gVHJhY2sgcmVtb3ZlZFxuICAgIG9sZERlZHVjdGlvbnMuZm9yRWFjaChvbGRJdGVtID0+IHtcbiAgICAgIGNvbnN0IHN0aWxsRXhpc3RzID0gdmFsaWRhdGVkRGVkdWN0aW9ucy5zb21lKGl0ZW0gPT4gaXRlbS5pZCA9PT0gb2xkSXRlbS5pZCk7XG4gICAgICBpZiAoIXN0aWxsRXhpc3RzKSB7XG4gICAgICAgIC8vIFJFTU9WRVxuICAgICAgICBjb25zdCBkZXRhaWxzID0gYNin2YTZhdiz2KrYrtiv2YU6IFtJRDogJHt1c2VyLnVpZCB8fCB1c2VyLmlkIHx8IFwiTi9BXCJ9LCDYp9mE2KfYs9mFOiAke3VzZXIudXNlcm5hbWV9LCDYp9mE2KjYsdmK2K8g2KfZhNil2YTZg9iq2LHZiNmG2Yo6ICR7dXNlci51c2VybmFtZX1AYWx3YWxlZWRuZW9uLmNvbSwg2KfZhNiv2YjYsTogJHt1c2VyLnJvbGV9LCBJUDogMTI3LjAuMC4xXVxu2KfZhNil2KzYsdin2KEg2KfZhNit2LHZg9mKOiDYrdiw2YEg2KjZhtivINiu2LXZhSDYqtmB2LXZitmE2Yog2YbZh9in2KbZitin2YtcbtmG2YjYuSDYp9mE2K7YtdmFOiAke29sZEl0ZW0udHlwZX1cbtin2YTZhdmI2LjZgSDYp9mE2YXYs9iq2YfYr9mBOiAke3NlbGVjdGVkRGVkdWN0aW9uRW1wbG95ZWUuYXJhYmljTmFtZX0gKNmD2YjYrzogJHtzZWxlY3RlZERlZHVjdGlvbkVtcGxveWVlLmVtcGxveWVlSWR9KVxu2YXZgtin2LHZhtipINin2YTZgtmK2YU6IFvYp9mE2YLZitmF2Kkg2KfZhNmF2K3YsNmI2YHYqTogJHtvbGRJdGVtLmFtb3VudH0g2LEu2LNdXG7Yp9mE2LPYqNioINin2YTZhdmI2KvZgiDYp9mE2YXYrdiw2YjZgTogJHtvbGRJdGVtLnJlYXNvbn1gO1xuICAgICAgICBnZW5lcmF0ZWRBdWRpdExvZ3MucHVzaChhcHBlbmRBdWRpdExvZyhzZWxlY3RlZFJ1bi5pZCwgYNit2LDZgSDYrti12YUg2KrZgdi12YrZhNmKIC0gJHtvbGRJdGVtLnR5cGV9YCwgZGV0YWlscykpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gRmFsbGJhY2sgZ2VuZXJhbCBsb2cgaWYgbm90aGluZyBzcGVjaWZpYyBjaGFuZ2VkIGJ1dCBzYXZlZFxuICAgIGlmIChnZW5lcmF0ZWRBdWRpdExvZ3MubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb25zdCBkZXRhaWxzID0gYNmC2KfZhSDYp9mE2YXYs9iq2K7Yr9mFINio2KXYudin2K/YqSDYrdmB2Lgg2KfZhNiu2LXZiNmF2KfYqiDZhNmE2YXZiNi42YEgKCR7c2VsZWN0ZWREZWR1Y3Rpb25FbXBsb3llZS5hcmFiaWNOYW1lfSkg2K/ZiNmGINil2K3Yr9in2Ksg2KPZiiDYqti62YrZitixINmB2LnZhNmKINmB2Yog2KfZhNio2YbZiNivLmA7XG4gICAgICBnZW5lcmF0ZWRBdWRpdExvZ3MucHVzaChhcHBlbmRBdWRpdExvZyhzZWxlY3RlZFJ1bi5pZCwgXCLYqtit2K/ZitirINin2LPYqtmC2LfYp9i52KfYqiDYp9mE2YXZiNi42YFcIiwgZGV0YWlscykpO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZWRSdW4gPSB7XG4gICAgICAuLi5zZWxlY3RlZFJ1bixcbiAgICAgIHRvdGFsQmFzaWNTYWxhcnksXG4gICAgICB0b3RhbEFsbG93YW5jZXMsXG4gICAgICB0b3RhbERlZHVjdGlvbnMsXG4gICAgICB0b3RhbE5ldFNhbGFyeSxcbiAgICAgIHRvdGFsT3ZlcnRpbWVIb3VycyxcbiAgICAgIHRvdGFsT3ZlcnRpbWVBbW91bnQsXG4gICAgICBlbXBsb3llZXM6IG5ld0VtcGxveWVlc0xpc3QsXG4gICAgICBhdWRpdExvZ3M6IFsuLi5ydW5BdWRpdExvZ3MsIC4uLmdlbmVyYXRlZEF1ZGl0TG9nc10sXG4gICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIHVwZGF0ZWRCeTogdXNlci51c2VybmFtZSxcbiAgICB9O1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3BheXJvbGxfcnVucy8ke3NlbGVjdGVkUnVuLmlkfWAsIHtcbiAgICAgICAgbWV0aG9kOiBcIlBVVFwiLFxuICAgICAgICBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHVwZGF0ZWRSdW4pLFxuICAgICAgfSk7XG5cbiAgICAgIGlmIChyZXMub2spIHtcbiAgICAgICAgc2V0UnVuRW1wbG95ZWVzKG5ld0VtcGxveWVlc0xpc3QpO1xuICAgICAgICBzZXRSdW5BdWRpdExvZ3ModXBkYXRlZFJ1bi5hdWRpdExvZ3MpO1xuICAgICAgICBzZXRTZWxlY3RlZFJ1bih1cGRhdGVkUnVuKTtcbiAgICAgICAgc2V0UGF5cm9sbFJ1bnMocGF5cm9sbFJ1bnMubWFwKHIgPT4gci5pZCA9PT0gc2VsZWN0ZWRSdW4uaWQgPyB1cGRhdGVkUnVuIDogcikpO1xuXG4gICAgICAgIHNob3dUb2FzdChcbiAgICAgICAgICBcIuKchSDYqtmFINit2YHYuCDZiNiq2K/ZgtmK2YIg2KjZhtmI2K8g2KfZhNiu2LXZhSDYp9mE2KrZgdi12YrZhNmK2Kkg2YTZhNmF2YjYuNmBINmI2KXYudin2K/YqSDYp9it2KrYs9in2Kgg2KfZhNmF2LPZitixINio2YbYrNin2K0hXCIsXG4gICAgICAgICAgXCLinIUgRW1wbG95ZWUgZGV0YWlsZWQgZGVkdWN0aW9uIGl0ZW1zIHNhdmVkIGFuZCBwYXlyb2xsIHRvdGFscyByZWNhbGN1bGF0ZWQgc3VjY2Vzc2Z1bGx5IVwiLFxuICAgICAgICAgIFwic3VjY2Vzc1wiXG4gICAgICAgICk7XG4gICAgICAgIHNldElzRGVkdWN0aW9uTW9kYWxPcGVuKGZhbHNlKTtcbiAgICAgICAgc2V0U2VsZWN0ZWREZWR1Y3Rpb25FbXBsb3llZShudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNob3dUb2FzdChcIuKdjCDZgdi02YQg2KrYrdiv2YrYqyDZhdiz2YrYsSDYp9mE2LHZiNin2KrYqCDZgdmKINin2YTYrtin2K/ZhS5cIiwgXCLinYwgRmFpbGVkIHRvIHNhdmUgcGF5cm9sbCBydW4gY2hhbmdlcyBpbiBzZXJ2ZXIuXCIsIFwiZXJyb3JcIik7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiU2F2ZSBkZWR1Y3Rpb25zIGVycm9yOlwiLCBlcnIpO1xuICAgICAgc2hvd1RvYXN0KFwi4p2MINiu2LfYoyDYo9ir2YbYp9ihINin2YTYp9iq2LXYp9mEINio2KfZhNiu2KfYr9mFINmE2K3Zgdi4INin2YTYqti62YrZitix2KfYqi5cIiwgXCLinYwgRXJyb3IgY29ubmVjdGluZyB0byBzZXJ2ZXIgdG8gc2F2ZSBjaGFuZ2VzLlwiLCBcImVycm9yXCIpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBoYW5kbGVFeHBvcnRQYXlyb2xsUERGID0gKCkgPT4ge1xuICAgIGlmICghc2VsZWN0ZWRSdW4pIHJldHVybjtcblxuICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIFxuICAgIC8vIENvbnN0cnVjdCByb3dzXG4gICAgY29uc3Qgcm93c0h0bWwgPSBzZWxlY3RlZFJ1bi5lbXBsb3llZXMubWFwKGVtcCA9PiBgXG4gICAgICA8dHI+XG4gICAgICAgIDx0ZCBzdHlsZT1cInBhZGRpbmc6IDhweDsgYm9yZGVyOiAxcHggc29saWQgI2NiZDVlMTtcIj4ke2VtcC5pcWFtYUlkfTwvdGQ+XG4gICAgICAgIDx0ZCBzdHlsZT1cInBhZGRpbmc6IDhweDsgYm9yZGVyOiAxcHggc29saWQgI2NiZDVlMTtcIj4ke2VtcC5hcmFiaWNOYW1lfTwvdGQ+XG4gICAgICAgIDx0ZCBzdHlsZT1cInBhZGRpbmc6IDhweDsgYm9yZGVyOiAxcHggc29saWQgI2NiZDVlMTtcIj4ke2VtcC5qb2JUaXRsZX08L3RkPlxuICAgICAgICA8dGQgc3R5bGU9XCJwYWRkaW5nOiA4cHg7IGJvcmRlcjogMXB4IHNvbGlkICNjYmQ1ZTE7IGZvbnQtZmFtaWx5OiAnR290aGFtIFBybycsIHNhbnMtc2VyaWY7IGZvbnQtd2VpZ2h0OiA5MDA7XCI+JHsoZW1wLmJhc2ljU2FsYXJ5IHx8IDApLnRvTG9jYWxlU3RyaW5nKCdlbi1VUycpfTwvdGQ+XG4gICAgICAgIDx0ZCBzdHlsZT1cInBhZGRpbmc6IDhweDsgYm9yZGVyOiAxcHggc29saWQgI2NiZDVlMTsgZm9udC1mYW1pbHk6ICdHb3RoYW0gUHJvJywgc2Fucy1zZXJpZjsgZm9udC13ZWlnaHQ6IDkwMDtcIj4keygoZW1wLmhvdXNpbmdBbGxvd2FuY2UgfHwgMCkgKyAoZW1wLnRyYW5zcG9ydEFsbG93YW5jZSB8fCAwKSArIChlbXAuZm9vZEFsbG93YW5jZSB8fCAwKSArIChlbXAub3RoZXJBbGxvd2FuY2VzIHx8IDApICsgKGVtcC5waG9uZUFsbG93YW5jZSB8fCAwKSkudG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJyl9PC90ZD5cbiAgICAgICAgPHRkIHN0eWxlPVwicGFkZGluZzogOHB4OyBib3JkZXI6IDFweCBzb2xpZCAjY2JkNWUxOyBmb250LWZhbWlseTogJ0dvdGhhbSBQcm8nLCBzYW5zLXNlcmlmOyBmb250LXdlaWdodDogOTAwO1wiPiR7KGVtcC5vdmVydGltZUFtb3VudCB8fCAwKS50b0xvY2FsZVN0cmluZygnZW4tVVMnKX08L3RkPlxuICAgICAgICA8dGQgc3R5bGU9XCJwYWRkaW5nOiA4cHg7IGJvcmRlcjogMXB4IHNvbGlkICNjYmQ1ZTE7IGZvbnQtZmFtaWx5OiAnR290aGFtIFBybycsIHNhbnMtc2VyaWY7IGZvbnQtd2VpZ2h0OiA5MDA7XCI+JHtlbXAudG90YWxFbnRpdGxlbWVudHMudG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJyl9PC90ZD5cbiAgICAgICAgPHRkIHN0eWxlPVwicGFkZGluZzogOHB4OyBib3JkZXI6IDFweCBzb2xpZCAjY2JkNWUxOyBmb250LWZhbWlseTogJ0dvdGhhbSBQcm8nLCBzYW5zLXNlcmlmOyBmb250LXdlaWdodDogOTAwO1wiPiR7ZW1wLnRvdGFsRGVkdWN0aW9ucy50b0xvY2FsZVN0cmluZygnZW4tVVMnKX08L3RkPlxuICAgICAgICA8dGQgc3R5bGU9XCJwYWRkaW5nOiA4cHg7IGJvcmRlcjogMXB4IHNvbGlkICNjYmQ1ZTE7IGZvbnQtd2VpZ2h0OiBib2xkOyBjb2xvcjogIzA1OTY2OTsgZm9udC1mYW1pbHk6ICdHb3RoYW0gUHJvJywgc2Fucy1zZXJpZjsgZm9udC13ZWlnaHQ6IDkwMDtcIj4ke2VtcC5uZXRTYWxhcnkudG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJyl9PC90ZD5cbiAgICAgIDwvdHI+XG4gICAgYCkuam9pbignJyk7XG5cbiAgICBlbGVtZW50LmlubmVySFRNTCA9IGBcbiAgICAgIDxzdHlsZT5cbiAgICBAaW1wb3J0IHVybCgnaHR0cHM6Ly9mb250cy5jZG5mb250cy5jb20vY3NzL2dlLXNzLXR3bycpO1xuICAgIEBpbXBvcnQgdXJsKCdodHRwczovL2ZvbnRzLmNkbmZvbnRzLmNvbS9jc3MvZ290aGFtLXBybycpO1xuICA8L3N0eWxlPlxuICA8ZGl2IHN0eWxlPVwiZm9udC1mYW1pbHk6ICdHRSBTUycsICdHRSBTUyBUd28nLCAnR0UgU1MgVHdvJywgJ0dvdGhhbSBQcm8nLCBzYW5zLXNlcmlmOyBkaXJlY3Rpb246IHJ0bDsgcGFkZGluZzogMjBweDsgY29sb3I6ICMwZjE3MmE7IHdpZHRoOiAxMDAlOyBiYWNrZ3JvdW5kOiB3aGl0ZTtcIj5cbiAgICAgICAgPGRpdiBzdHlsZT1cImRpc3BsYXk6IGZsZXg7IGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjsgYm9yZGVyLWJvdHRvbTogM3B4IHNvbGlkICMwMDcyQkM7IHBhZGRpbmctYm90dG9tOiAyMHB4OyBtYXJnaW4tYm90dG9tOiAyMHB4O1wiPlxuICAgICAgICAgIDxkaXYgc3R5bGU9XCJkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBnYXA6IDE1cHg7XCI+XG4gICAgPGltZyBzcmM9XCJodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvSEU0NklyeWJjQUFNcTdMP2Zvcm1hdD1wbmcmbmFtZT1zbWFsbFwiIHJlZmVycmVycG9saWN5PVwibm8tcmVmZXJyZXJcIiBhbHQ9XCJGb25vdW4gQWx3YWxlZWQgTG9nb1wiIHN0eWxlPVwid2lkdGg6IDgwcHg7IGhlaWdodDogODBweDsgb2JqZWN0LWZpdDogY29udGFpbjtcIiAvPlxuICAgIDxkaXY+XG4gICAgICA8aDEgc3R5bGU9XCJjb2xvcjogIzAwNzJCQzsgbWFyZ2luOiAwOyBmb250LXNpemU6IDI0cHg7IGZvbnQtd2VpZ2h0OiA5MDA7XCI+2LTYsdmD2Kkg2YHZhtmI2YYg2KfZhNmI2YTZitivINmE2YTYtdmG2KfYudipPC9oMT5cbiAgICAgICAgICAgIDxwIHN0eWxlPVwibWFyZ2luOiA1cHggMCAwIDA7IGNvbG9yOiAjNjQ3NDhiOyBmb250LXNpemU6IDE0cHg7XCI+2YXYs9mK2LEg2LHZiNin2KrYqCDZhdmI2LjZgdmKINmI2LnZhdin2YQg2KfZhNmF2LXZhti5INin2YTZhdi52KrZhdivPC9wPlxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IHN0eWxlPVwidGV4dC1hbGlnbjogbGVmdDtcIj5cbiAgICAgICAgICAgIDxoMiBzdHlsZT1cIm1hcmdpbjogMDsgZm9udC1zaXplOiAxOHB4OyBjb2xvcjogIzBmMTcyYTtcIj7Zg9i02YEg2YXYs9mK2LEg2KfZhNix2YjYp9iq2Kgg2KfZhNmF2KfZhNmKPC9oMj5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJmb250LXNpemU6IDE0cHg7IGNvbG9yOiAjNjQ3NDhiOyBtYXJnaW4tdG9wOjRweDtcIj7YudmGINi02YfYsSAke3NlbGVjdGVkUnVuLm1vbnRofSAtICR7c2VsZWN0ZWRSdW4ueWVhcn08L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJmb250LXNpemU6IDExcHg7IGNvbG9yOiAjNjQ3NDhiOyBtYXJnaW4tdG9wOjRweDtcIj7Zg9mI2K8g2KfZhNmF2LPZitixOiAke3NlbGVjdGVkUnVuLnBheXJvbGxOdW1iZXJ9PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IHN0eWxlPVwiZm9udC1zaXplOiAxMXB4OyBjb2xvcjogIzY0NzQ4YjsgbWFyZ2luLXRvcDo0cHg7XCI+2KrYp9ix2YrYriDYp9mE2LfYqNin2LnYqTogJHtuZXcgRGF0ZSgpLnRvTG9jYWxlRGF0ZVN0cmluZygnZW4tVVMnKX08L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBzdHlsZT1cImRpc3BsYXk6IGdyaWQ7IGdyaWQtdGVtcGxhdGUtY29sdW1uczogcmVwZWF0KDQsIDFmcik7IGdhcDogMTVweDsgbWFyZ2luLWJvdHRvbTogMjBweDtcIj5cbiAgICAgICAgICA8ZGl2IHN0eWxlPVwiYmFja2dyb3VuZDogI2Y4ZmFmYzsgcGFkZGluZzogMTVweDsgYm9yZGVyLXJhZGl1czogOHB4OyBib3JkZXI6IDFweCBzb2xpZCAjZTJlOGYwO1wiPlxuICAgICAgICAgICAgPGRpdiBzdHlsZT1cImNvbG9yOiAjNjQ3NDhiOyBmb250LXNpemU6IDEycHg7IGZvbnQtd2VpZ2h0OiBib2xkO1wiPtil2KzZhdin2YTZiiDYp9mE2LHZiNin2KrYqCDYp9mE2KPYs9in2LPZitipPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IHN0eWxlPVwiZm9udC1zaXplOiAxOHB4OyBmb250LXdlaWdodDogYm9sZDsgZm9udC1mYW1pbHk6ICdHb3RoYW0gUHJvJywgc2Fucy1zZXJpZjsgZm9udC13ZWlnaHQ6IDkwMDsgY29sb3I6ICMwZjE3MmE7IG1hcmdpbi10b3A6IDVweDtcIj4ke3NlbGVjdGVkUnVuLnRvdGFsQmFzaWNTYWxhcnkudG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJyl9INixLtizPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBzdHlsZT1cImJhY2tncm91bmQ6ICNmOGZhZmM7IHBhZGRpbmc6IDE1cHg7IGJvcmRlci1yYWRpdXM6IDhweDsgYm9yZGVyOiAxcHggc29saWQgI2UyZThmMDtcIj5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJjb2xvcjogIzY0NzQ4YjsgZm9udC1zaXplOiAxMnB4OyBmb250LXdlaWdodDogYm9sZDtcIj7Ypdis2YXYp9mE2Yog2KfZhNio2K/ZhNin2Kog2YjYp9mE2YXZg9iq2LPYqNin2Ko8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJmb250LXNpemU6IDE4cHg7IGZvbnQtd2VpZ2h0OiBib2xkOyBmb250LWZhbWlseTogJ0dvdGhhbSBQcm8nLCBzYW5zLXNlcmlmOyBmb250LXdlaWdodDogOTAwOyBjb2xvcjogIzRmNDZlNTsgbWFyZ2luLXRvcDogNXB4O1wiPiske3NlbGVjdGVkUnVuLnRvdGFsQWxsb3dhbmNlcy50b0xvY2FsZVN0cmluZygnZW4tVVMnKX0g2LEu2LM8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IHN0eWxlPVwiYmFja2dyb3VuZDogI2Y4ZmFmYzsgcGFkZGluZzogMTVweDsgYm9yZGVyLXJhZGl1czogOHB4OyBib3JkZXI6IDFweCBzb2xpZCAjZTJlOGYwO1wiPlxuICAgICAgICAgICAgPGRpdiBzdHlsZT1cImNvbG9yOiAjNjQ3NDhiOyBmb250LXNpemU6IDEycHg7IGZvbnQtd2VpZ2h0OiBib2xkO1wiPtil2KzZhdin2YTZiiDYp9mE2K7YtdmI2YXYp9iqPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IHN0eWxlPVwiZm9udC1zaXplOiAxOHB4OyBmb250LXdlaWdodDogYm9sZDsgZm9udC1mYW1pbHk6ICdHb3RoYW0gUHJvJywgc2Fucy1zZXJpZjsgZm9udC13ZWlnaHQ6IDkwMDsgY29sb3I6ICNlMTFkNDg7IG1hcmdpbi10b3A6IDVweDtcIj4tJHtzZWxlY3RlZFJ1bi50b3RhbERlZHVjdGlvbnMudG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJyl9INixLtizPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBzdHlsZT1cImJhY2tncm91bmQ6ICMwZjE3MmE7IHBhZGRpbmc6IDE1cHg7IGJvcmRlci1yYWRpdXM6IDhweDsgYm9yZGVyOiAxcHggc29saWQgIzBmMTcyYTtcIj5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJjb2xvcjogIzk0YTNiODsgZm9udC1zaXplOiAxMnB4OyBmb250LXdlaWdodDogYm9sZDtcIj7Ytdin2YHZiiDYp9mE2YXZitiy2KfZhtmK2Kkg2KfZhNmF2LXYsdmB2YrYqSDZhNmE2KrYrdmI2YrZhDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBzdHlsZT1cImZvbnQtc2l6ZTogMThweDsgZm9udC13ZWlnaHQ6IGJvbGQ7IGZvbnQtZmFtaWx5OiAnR290aGFtIFBybycsIHNhbnMtc2VyaWY7IGZvbnQtd2VpZ2h0OiA5MDA7IGNvbG9yOiAjMzRkMzk5OyBtYXJnaW4tdG9wOiA1cHg7XCI+JHtzZWxlY3RlZFJ1bi50b3RhbE5ldFNhbGFyeS50b0xvY2FsZVN0cmluZygnZW4tVVMnKX0g2LEu2LM8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPHRhYmxlIHN0eWxlPVwid2lkdGg6IDEwMCU7IGJvcmRlci1jb2xsYXBzZTogY29sbGFwc2U7IGZvbnQtc2l6ZTogMTFweDsgbWFyZ2luLWJvdHRvbTogMzBweDtcIj5cbiAgICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgIDx0aCBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6ICMwMDcyQkM7IGNvbG9yOiB3aGl0ZTsgcGFkZGluZzogOHB4OyBib3JkZXI6IDFweCBzb2xpZCAjY2JkNWUxOyB0ZXh0LWFsaWduOiByaWdodDtcIj7YsdmC2YUg2KfZhNil2YLYp9mF2Kkv2KfZhNmH2YjZitipPC90aD5cbiAgICAgICAgICAgICAgPHRoIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjogIzAwNzJCQzsgY29sb3I6IHdoaXRlOyBwYWRkaW5nOiA4cHg7IGJvcmRlcjogMXB4IHNvbGlkICNjYmQ1ZTE7IHRleHQtYWxpZ246IHJpZ2h0O1wiPtin2LPZhSDYp9mE2YXZiNi42YE8L3RoPlxuICAgICAgICAgICAgICA8dGggc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOiAjMDA3MkJDOyBjb2xvcjogd2hpdGU7IHBhZGRpbmc6IDhweDsgYm9yZGVyOiAxcHggc29saWQgI2NiZDVlMTsgdGV4dC1hbGlnbjogcmlnaHQ7XCI+2KfZhNmF2LPZhdmJINin2YTZiNi42YrZgdmKPC90aD5cbiAgICAgICAgICAgICAgPHRoIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjogIzAwNzJCQzsgY29sb3I6IHdoaXRlOyBwYWRkaW5nOiA4cHg7IGJvcmRlcjogMXB4IHNvbGlkICNjYmQ1ZTE7IHRleHQtYWxpZ246IHJpZ2h0O1wiPtin2YTYo9iz2KfYs9mKPC90aD5cbiAgICAgICAgICAgICAgPHRoIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjogIzAwNzJCQzsgY29sb3I6IHdoaXRlOyBwYWRkaW5nOiA4cHg7IGJvcmRlcjogMXB4IHNvbGlkICNjYmQ1ZTE7IHRleHQtYWxpZ246IHJpZ2h0O1wiPtin2YTYqNiv2YTYp9iqPC90aD5cbiAgICAgICAgICAgICAgPHRoIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjogIzAwNzJCQzsgY29sb3I6IHdoaXRlOyBwYWRkaW5nOiA4cHg7IGJvcmRlcjogMXB4IHNvbGlkICNjYmQ1ZTE7IHRleHQtYWxpZ246IHJpZ2h0O1wiPtil2LbYp9mB2Yo8L3RoPlxuICAgICAgICAgICAgICA8dGggc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOiAjMDA3MkJDOyBjb2xvcjogd2hpdGU7IHBhZGRpbmc6IDhweDsgYm9yZGVyOiAxcHggc29saWQgI2NiZDVlMTsgdGV4dC1hbGlnbjogcmlnaHQ7XCI+2KXYrNmF2KfZhNmKINin2YTYp9iz2KrYrdmC2KfZgjwvdGg+XG4gICAgICAgICAgICAgIDx0aCBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6ICNiZTEyM2M7IGNvbG9yOiB3aGl0ZTsgcGFkZGluZzogOHB4OyBib3JkZXI6IDFweCBzb2xpZCAjY2JkNWUxOyB0ZXh0LWFsaWduOiByaWdodDtcIj7Ypdis2YXYp9mE2Yog2KfZhNiu2LXZhTwvdGg+XG4gICAgICAgICAgICAgIDx0aCBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6ICMwNjRlM2I7IGNvbG9yOiB3aGl0ZTsgcGFkZGluZzogOHB4OyBib3JkZXI6IDFweCBzb2xpZCAjY2JkNWUxOyB0ZXh0LWFsaWduOiByaWdodDtcIj7Yp9mE2LXYp9mB2YogKNixLtizKTwvdGg+XG4gICAgICAgICAgICA8L3RyPlxuICAgICAgICAgIDwvdGhlYWQ+XG4gICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgJHtyb3dzSHRtbH1cbiAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICA8L3RhYmxlPlxuXG4gICAgICAgIDxkaXYgc3R5bGU9XCJkaXNwbGF5OiBmbGV4OyBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47IG1hcmdpbi10b3A6IDQwcHg7IHBhZGRpbmctdG9wOiAyMHB4O1wiPlxuICAgICAgICAgIDxkaXYgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IGJvcmRlcjogMXB4IGRhc2hlZCAjY2JkNWUxOyBwYWRkaW5nOiAyMHB4OyBib3JkZXItcmFkaXVzOiA4cHg7IHdpZHRoOiAzMCU7XCI+XG4gICAgICAgICAgICDYqtmI2YLZiti5INin2YTZhdit2KfYs9ioINin2YTZhdin2YTZijxici8+PGJyLz48YnIvPlxuICAgICAgICAgICAgX19fX19fX19fX19fX19fX19cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyOyBib3JkZXI6IDFweCBkYXNoZWQgI2NiZDVlMTsgcGFkZGluZzogMjBweDsgYm9yZGVyLXJhZGl1czogOHB4OyB3aWR0aDogMzAlO1wiPlxuICAgICAgICAgICAg2YXYsdin2KzYudipINmI2KrYr9mC2YrZgiDYp9mE2YXYr9mK2LEg2KfZhNmF2KfZhNmKPGJyLz48YnIvPjxici8+XG4gICAgICAgICAgICBfX19fX19fX19fX19fX19fX1xuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IGJvcmRlcjogMXB4IGRhc2hlZCAjY2JkNWUxOyBwYWRkaW5nOiAyMHB4OyBib3JkZXItcmFkaXVzOiA4cHg7IHdpZHRoOiAzMCU7XCI+XG4gICAgICAgICAgICDYp9i52KrZhdin2K8g2KfZhNmF2K/ZitixINin2YTYudin2YUg2YjYtdin2K3YqCDYp9mE2LnZhdmEPGJyLz48YnIvPjxici8+XG4gICAgICAgICAgICBfX19fX19fX19fX19fX19fX1xuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIGA7XG5cbiAgICBjb25zdCBvcHQgPSB7XG4gICAgICBtYXJnaW46ICAgICAgIDEwLFxuICAgICAgZmlsZW5hbWU6ICAgICBgUGF5cm9sbF8ke3NlbGVjdGVkUnVuLnBheXJvbGxOdW1iZXJ9XyR7c2VsZWN0ZWRSdW4ubW9udGh9XyR7c2VsZWN0ZWRSdW4ueWVhcn0ucGRmYCxcbiAgICAgIGltYWdlOiAgICAgICAgeyB0eXBlOiAnanBlZycsIHF1YWxpdHk6IDAuOTggfSxcbiAgICAgIGh0bWwyY2FudmFzOiAgeyBzY2FsZTogMiB9LFxuICAgICAganNQREY6ICAgICAgICB7IHVuaXQ6ICdtbScsIGZvcm1hdDogJ2E0Jywgb3JpZW50YXRpb246ICdwb3J0cmFpdCcgfVxuICAgIH07XG5cbiAgICBodG1sMnBkZigpLmZyb20oZWxlbWVudCkuc2V0KG9wdCkub3V0cHV0KCdibG9idXJsJykudGhlbihmdW5jdGlvbihwZGZCbG9iVXJsOiBzdHJpbmcpIHtcbiAgICAgIHdpbmRvdy5vcGVuKHBkZkJsb2JVcmwsICdfYmxhbmsnKTtcbiAgICAgIFxuICAgICAgc2hvd1RvYXN0KFwi4pyTINiq2YUg2KrYtdiv2YrYsSDZhdiz2YrYsSDYp9mE2LHZiNin2KrYqCDYqNi12YrYutipIFBERiDZiNmB2KrYrdmHINmB2Yog2YbYp9mB2LDYqSDYrNiv2YrYr9ipXCIsIFwi4pyTIFBheXJvbGwgUERGIGdlbmVyYXRlZCBhbmQgb3BlbmVkXCIsIFwic3VjY2Vzc1wiKTtcbiAgICAgIGxvZ0FjdGlvblRvQXVkaXQoe1xuICAgICAgICBhY3Rpb246IFwi2KrYtdiv2YrYsSDZhdiz2YrYsSBQREZcIixcbiAgICAgICAgcGF5cm9sbFJ1bklkOiBzZWxlY3RlZFJ1bi5pZCxcbiAgICAgICAgbm90ZXM6IGDYqtmFINiq2LXYr9mK2LEg2YXYs9mK2LEg2LHZiNin2KrYqCDYtNmH2LEgJHtzZWxlY3RlZFJ1bi5tb250aH0tJHtzZWxlY3RlZFJ1bi55ZWFyfSDYqNin2YTYsdmC2YUgJHtzZWxlY3RlZFJ1bi5wYXlyb2xsTnVtYmVyfSDYqNi12YrYutipIFBERmAsXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuXG4gIC8vIENhbGN1bGF0ZSBOZXQgc2FsYXJ5IGR5bmFtaWNhbGx5XG4gIGNvbnN0IGNhbGN1bGF0ZUVtcGxveWVlTmV0ID0gKGVtcDogUGFydGlhbDxQYXlyb2xsUnVuRW1wbG95ZWU+KSA9PiB7XG4gICAgY29uc3QgYmFzaWMgPSBOdW1iZXIoZW1wLmJhc2ljU2FsYXJ5IHx8IDApO1xuICAgIGNvbnN0IGhvdXNpbmcgPSBOdW1iZXIoZW1wLmhvdXNpbmdBbGxvd2FuY2UgfHwgMCk7XG4gICAgY29uc3QgdHJhbnNwb3J0ID0gTnVtYmVyKGVtcC50cmFuc3BvcnRBbGxvd2FuY2UgfHwgMCk7XG4gICAgY29uc3QgcGhvbmUgPSBOdW1iZXIoZW1wLnBob25lQWxsb3dhbmNlIHx8IDApO1xuICAgIGNvbnN0IGZvb2QgPSBOdW1iZXIoZW1wLmZvb2RBbGxvd2FuY2UgfHwgMCk7XG4gICAgY29uc3QgbXVkZGFoID0gTnVtYmVyKGVtcC5tdWRkYWhBbW91bnQgfHwgMCk7XG4gICAgY29uc3Qgb3RBbW91bnQgPSBOdW1iZXIoZW1wLm92ZXJ0aW1lQW1vdW50IHx8IDApO1xuICAgIGNvbnN0IG90aGVyQWxsb3cgPSBOdW1iZXIoZW1wLm90aGVyQWxsb3dhbmNlcyB8fCAwKTtcbiAgICBjb25zdCBsaXZpbmcgPSBOdW1iZXIoZW1wLmxpdmluZ0FsbG93YW5jZSB8fCAwKTtcblxuICAgIGNvbnN0IGVudGl0bGVtZW50cyA9IGJhc2ljICsgaG91c2luZyArIHRyYW5zcG9ydCArIHBob25lICsgZm9vZCArIG11ZGRhaCArIG90QW1vdW50ICsgb3RoZXJBbGxvdyArIGxpdmluZztcblxuICAgIGNvbnN0IGxvYW5zID0gTnVtYmVyKGVtcC5sb2Fuc0RlZHVjdGlvbiB8fCAwKTtcbiAgICBjb25zdCBnb3NpID0gTnVtYmVyKGVtcC5nb3NpRGVkdWN0aW9uIHx8IDApO1xuICAgIGNvbnN0IGFic2VuY2UgPSBOdW1iZXIoZW1wLmFic2VuY2VEZWR1Y3Rpb24gfHwgMCk7XG4gICAgY29uc3QgbGF0ZSA9IE51bWJlcihlbXAubGF0ZURlZHVjdGlvbiB8fCAwKTtcbiAgICBjb25zdCBwZW5hbHR5ID0gTnVtYmVyKGVtcC5wZW5hbHR5RGVkdWN0aW9uIHx8IDApO1xuICAgIGNvbnN0IG90aGVyRGVkdWN0ID0gTnVtYmVyKGVtcC5vdGhlckRlZHVjdGlvbnMgfHwgMCk7XG5cbiAgICBjb25zdCBkZWR1Y3Rpb25zID0gbG9hbnMgKyBnb3NpICsgYWJzZW5jZSArIGxhdGUgKyBwZW5hbHR5ICsgb3RoZXJEZWR1Y3Q7XG4gICAgY29uc3QgbmV0ID0gZW50aXRsZW1lbnRzIC0gZGVkdWN0aW9ucztcblxuICAgIHJldHVybiB7XG4gICAgICB0b3RhbEVudGl0bGVtZW50czogZW50aXRsZW1lbnRzLFxuICAgICAgdG90YWxEZWR1Y3Rpb25zOiBkZWR1Y3Rpb25zLFxuICAgICAgbmV0U2FsYXJ5OiBNYXRoLm1heCgwLCBuZXQpLFxuICAgIH07XG4gIH07XG5cbiAgLy8gQ3JlYXRlIFBheXJvbGwgUnVuXG4gIGNvbnN0IGhhbmRsZUNyZWF0ZVJ1biA9IGFzeW5jIChlOiBSZWFjdC5Gb3JtRXZlbnQpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgaWYgKCFuZXdSdW5Gb3JtLnBheXJvbGxOdW1iZXIpIHJldHVybjtcblxuICAgIHRyeSB7XG4gICAgICAvLyBDaGVjayBpZiB0aGUgcGF5cm9sbCBudW1iZXIgYWxyZWFkeSBleGlzdHMgKGV4Y2x1ZGluZyBkZWxldGVkIHJ1bnMpXG4gICAgICBjb25zdCBkdXBsaWNhdGVOdW1iZXIgPSBwYXlyb2xsUnVucy5maW5kKFxuICAgICAgICAocikgPT4gci5wYXlyb2xsTnVtYmVyLnRyaW0oKSA9PT0gbmV3UnVuRm9ybS5wYXlyb2xsTnVtYmVyLnRyaW0oKSAmJiAhci5pc0RlbGV0ZWRcbiAgICAgICk7XG4gICAgICBpZiAoZHVwbGljYXRlTnVtYmVyKSB7XG4gICAgICAgIHNob3dUb2FzdChcbiAgICAgICAgICBcIuKaoO+4jyDYsdmC2YUg2YXYs9mK2LEg2KfZhNix2YjYp9iq2Kgg2YfYsNinINmF2YjYrNmI2K8g2YXYs9io2YLYp9mLISDZitix2KzZiSDZg9iq2KfYqNipINij2Ygg2KrZiNmE2YrYryDYsdmC2YUg2YXYs9mK2LEg2YXYrtiq2YTZgSDZhNiq2KzZhtioINin2YTYqtmD2LHYp9ixLlwiLFxuICAgICAgICAgIFwi4pqg77iPIFRoaXMgcGF5cm9sbCBudW1iZXIgYWxyZWFkeSBleGlzdHMhIFBsZWFzZSBlbnRlciBvciBnZW5lcmF0ZSBhIGRpZmZlcmVudCBwYXlyb2xsIG51bWJlciB0byBhdm9pZCBkdXBsaWNhdGlvbi5cIixcbiAgICAgICAgICBcImVycm9yXCJcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyAxLiBGaWx0ZXIgZW1wbG95ZWVzIG1hdGNoaW5nIGRlcGFydG1lbnRcbiAgICAgIGNvbnN0IGRlcHRGaWx0ZXJlZCA9IGVtcGxveWVlcy5maWx0ZXIoKGVtcCkgPT4ge1xuICAgICAgICBpZiAobmV3UnVuRm9ybS5kZXBhcnRtZW50ID09PSBcItis2YXZiti5INin2YTYo9mC2LPYp9mFXCIpIHJldHVybiB0cnVlO1xuICAgICAgICByZXR1cm4gZW1wLmRlcGFydG1lbnQgPT09IG5ld1J1bkZvcm0uZGVwYXJ0bWVudDtcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoZGVwdEZpbHRlcmVkLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBzaG93VG9hc3QoXG4gICAgICAgICAgXCLimqDvuI8g2YTYpyDZitmI2KzYryDZhdmI2LjZgdmK2YYg2YXYs9is2YTZitmGINmB2Yog2YfYsNinINin2YTZgtiz2YUg2YTYpdiv2LHYp9is2YfZhSDZgdmKINmF2LPZitixINin2YTYsdmI2KfYqtioIVwiLFxuICAgICAgICAgIFwi4pqg77iPIE5vIGVtcGxveWVlcyByZWdpc3RlcmVkIHVuZGVyIHRoaXMgZGVwYXJ0bWVudCB0byBwdWxsIGludG8gcGF5cm9sbCFcIixcbiAgICAgICAgICBcImVycm9yXCJcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBydW5JZCA9IGBSVU4tJHtEYXRlLm5vdygpfWA7XG5cbiAgICAgIC8vIDIuIE1hcCBhY3R1YWwgZW1wbG95ZWVzIHRvIHRoZSBydW5cbiAgICAgIGNvbnN0IHJ1bkVtcHM6IFBheXJvbGxSdW5FbXBsb3llZVtdID0gZGVwdEZpbHRlcmVkLm1hcCgoZW1wKSA9PiB7XG4gICAgICAgIGNvbnN0IGJhc2ljID0gTnVtYmVyKGVtcC5iYXNpY1NhbGFyeSB8fCAwKTtcbiAgICAgICAgY29uc3QgaG91c2luZyA9IE51bWJlcihlbXAuYWxsb3dhbmNlcz8uaG91c2luZyB8fCAwKTtcbiAgICAgICAgY29uc3QgdHJhbnNwb3J0ID0gTnVtYmVyKGVtcC5hbGxvd2FuY2VzPy50cmFuc3BvcnQgfHwgMCk7XG4gICAgICAgIGNvbnN0IHBob25lID0gTnVtYmVyKGVtcC5hbGxvd2FuY2VzPy5waG9uZSB8fCAwKTtcbiAgICAgICAgY29uc3QgZm9vZCA9IE51bWJlcihlbXAuYWxsb3dhbmNlcz8uZm9vZCB8fCAwKTtcblxuICAgICAgICAvLyBGZXRjaCBtYXRjaGluZyBIUiBkZWR1Y3Rpb25zIGZvciB0aGlzIGVtcGxveWVlIGZvciB0aGUgY2hvc2VuIG1vbnRoIGFuZCB5ZWFyXG4gICAgICAgIGNvbnN0IHJ1bk1vbnRoU3RyID0gbmV3UnVuRm9ybS5tb250aC50b1N0cmluZygpLnBhZFN0YXJ0KDIsIFwiMFwiKTtcbiAgICAgICAgY29uc3QgcnVuWWVhck1vbnRoID0gYCR7bmV3UnVuRm9ybS55ZWFyfS0ke3J1bk1vbnRoU3RyfWA7XG5cbiAgICAgICAgY29uc3QgbWF0Y2hpbmdIckRlZHVjdGlvbnMgPSBockRlZHVjdGlvbnMuZmlsdGVyKChkKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIGQuZW1wbG95ZWVJZCA9PT0gZW1wLmlkICYmXG4gICAgICAgICAgICBkLmRhdGUgJiZcbiAgICAgICAgICAgIGQuZGF0ZS5zdGFydHNXaXRoKHJ1blllYXJNb250aCkgJiZcbiAgICAgICAgICAgIChkLnN0YXR1cyA9PT0gXCJjb25maXJtZWRcIiB8fCBkLnN0YXR1cyA9PT0gXCJub3RpZmllZFwiKSAmJlxuICAgICAgICAgICAgTnVtYmVyKGQuYW1vdW50KSA+IDBcbiAgICAgICAgICApO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBJbml0aWFsaXplIGRlZHVjdGlvbnMgbGlzdCBmcm9tIEhSXG4gICAgICAgIGNvbnN0IGZldGNoZWREZWR1Y3Rpb25zTGlzdDogRGVkdWN0aW9uSXRlbVtdID0gbWF0Y2hpbmdIckRlZHVjdGlvbnMubWFwKChkKSA9PiAoe1xuICAgICAgICAgIGlkOiBkLmlkIHx8IGBERUQtJHtEYXRlLm5vdygpfS0ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cigyLCA1KX1gLFxuICAgICAgICAgIHR5cGU6IG1hcEhyRGVkdWN0aW9uVHlwZShkLnR5cGUpLFxuICAgICAgICAgIGFtb3VudDogTnVtYmVyKGQuYW1vdW50KSxcbiAgICAgICAgICByZWFzb246IGQucmVhc29uIHx8IFwi2K7YtdmFINmF2LPYqtmI2LHYryDZhdmGINin2YTZhdmI2KfYsdivINin2YTYqNi02LHZitipXCIsXG4gICAgICAgICAgc291cmNlOiBcIkhSXCIsXG4gICAgICAgICAgc291cmNlRGVkdWN0aW9uSWQ6IGQuaWQsXG4gICAgICAgICAgY3JlYXRlZEJ5OiBkLmNyZWF0ZWRCeSB8fCBcIkhSIFN5c3RlbVwiLFxuICAgICAgICAgIGNyZWF0ZWRBdDogZC5jcmVhdGVkQXQgfHwgbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgIHVwZGF0ZWRCeTogXCJIUiBTeXN0ZW1cIixcbiAgICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIGxldCBhYnNEID0gMDtcbiAgICAgICAgbGV0IGxhdGVEID0gMDtcbiAgICAgICAgbGV0IGxvYW5EID0gMDtcbiAgICAgICAgbGV0IHBlbkQgPSAwO1xuICAgICAgICBsZXQgb3RoZXJEID0gMDtcblxuICAgICAgICBmZXRjaGVkRGVkdWN0aW9uc0xpc3QuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgIGlmIChpdGVtLnR5cGUgPT09IFwiQWJzZW5jZSBEZWR1Y3Rpb25cIikgYWJzRCArPSBpdGVtLmFtb3VudDtcbiAgICAgICAgICBlbHNlIGlmIChpdGVtLnR5cGUgPT09IFwiTGF0ZSBEZWR1Y3Rpb25cIikgbGF0ZUQgKz0gaXRlbS5hbW91bnQ7XG4gICAgICAgICAgZWxzZSBpZiAoaXRlbS50eXBlID09PSBcIkxvYW4gRGVkdWN0aW9uXCIpIGxvYW5EICs9IGl0ZW0uYW1vdW50O1xuICAgICAgICAgIGVsc2UgaWYgKGl0ZW0udHlwZSA9PT0gXCJQZW5hbHR5IERlZHVjdGlvblwiKSBwZW5EICs9IGl0ZW0uYW1vdW50O1xuICAgICAgICAgIGVsc2Ugb3RoZXJEICs9IGl0ZW0uYW1vdW50O1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDYWxjdWxhdGUgaW5pdGlhbCBuZXRcbiAgICAgICAgY29uc3QgZW50aXRsZW1lbnRzID0gYmFzaWMgKyBob3VzaW5nICsgdHJhbnNwb3J0ICsgcGhvbmUgKyBmb29kO1xuICAgICAgICBjb25zdCB0b3RhbERlZHVjdGlvbnNTdW0gPSBhYnNEICsgbGF0ZUQgKyBsb2FuRCArIHBlbkQgKyBvdGhlckQ7XG4gICAgICAgIGNvbnN0IG5ldCA9IGVudGl0bGVtZW50cyAtIHRvdGFsRGVkdWN0aW9uc1N1bTtcblxuICAgICAgICBjb25zdCBiTmFtZSA9IGVtcC5iYW5rTmFtZSB8fCBcItin2YTYqNmG2YMg2KfZhNij2YfZhNmKINin2YTYs9i52YjYr9mKIChTTkIpXCI7XG4gICAgICAgIGNvbnN0IGJJYmFuID0gdG9FbmdsaXNoRGlnaXRzKGVtcC5pYmFuIHx8IFwiXCIpO1xuICAgICAgICBjb25zdCBiQWNjTnVtID0gdG9FbmdsaXNoRGlnaXRzKGVtcC5hY2NvdW50TnVtYmVyIHx8IFwiXCIpO1xuICAgICAgICBjb25zdCBiU3dpZnQgPSB0b0VuZ2xpc2hEaWdpdHMoZW1wLnN3aWZ0Q29kZSB8fCBcIlwiKTtcbiAgICAgICAgY29uc3QgYk1ldGhvZCA9IGVtcC50cmFuc2Zlck1ldGhvZCB8fCBcIlNBUklFXCI7XG4gICAgICAgIGNvbnN0IGJIb2xkZXIgPSBlbXAuYWNjb3VudEhvbGRlck5hbWUgfHwgZW1wLmFyYWJpY05hbWUgfHwgXCJcIjtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGlkOiBgUFJFLSR7RGF0ZS5ub3coKX0tJHtlbXAuaWR9YCxcbiAgICAgICAgICBwYXlyb2xsUnVuSWQ6IHJ1bklkLFxuICAgICAgICAgIGVtcGxveWVlSWQ6IGVtcC5pZCxcbiAgICAgICAgICBhcmFiaWNOYW1lOiBlbXAuYXJhYmljTmFtZSB8fCBcIlwiLFxuICAgICAgICAgIGVuZ2xpc2hOYW1lOiBlbXAuZW5nbGlzaE5hbWUgfHwgXCJcIixcbiAgICAgICAgICBqb2JUaXRsZTogZW1wLmpvYlRpdGxlIHx8IFwiXCIsXG4gICAgICAgICAgZGVwYXJ0bWVudDogZW1wLmRlcGFydG1lbnQgfHwgXCJcIixcbiAgICAgICAgICBpcWFtYUlkOiBlbXAuaXFhbWFJZCB8fCBcIlwiLFxuICAgICAgICAgIGJhc2ljU2FsYXJ5OiBiYXNpYyxcbiAgICAgICAgICBob3VzaW5nQWxsb3dhbmNlOiBob3VzaW5nLFxuICAgICAgICAgIHRyYW5zcG9ydEFsbG93YW5jZTogdHJhbnNwb3J0LFxuICAgICAgICAgIHBob25lQWxsb3dhbmNlOiBwaG9uZSxcbiAgICAgICAgICBmb29kQWxsb3dhbmNlOiBmb29kLFxuICAgICAgICAgIG11ZGRhaEFtb3VudDogMCxcbiAgICAgICAgICBvdmVydGltZUhvdXJzOiAwLFxuICAgICAgICAgIG92ZXJ0aW1lQW1vdW50OiAwLFxuICAgICAgICAgIG90aGVyQWxsb3dhbmNlczogMCxcbiAgICAgICAgICBhYnNlbmNlRGVkdWN0aW9uOiBhYnNELFxuICAgICAgICAgIGxhdGVEZWR1Y3Rpb246IGxhdGVELFxuICAgICAgICAgIGxvYW5zRGVkdWN0aW9uOiBsb2FuRCxcbiAgICAgICAgICBwZW5hbHR5RGVkdWN0aW9uOiBwZW5ELFxuICAgICAgICAgIG90aGVyRGVkdWN0aW9uczogb3RoZXJELFxuICAgICAgICAgIGdvc2lEZWR1Y3Rpb246IDAsXG4gICAgICAgICAgYmFua05hbWU6IGJOYW1lLFxuICAgICAgICAgIGliYW46IGJJYmFuLFxuICAgICAgICAgIGFjY291bnROdW1iZXI6IGJBY2NOdW0sXG4gICAgICAgICAgc3dpZnRDb2RlOiBiU3dpZnQsXG4gICAgICAgICAgdHJhbnNmZXJNZXRob2Q6IGJNZXRob2QsXG4gICAgICAgICAgYWNjb3VudEhvbGRlck5hbWU6IGJIb2xkZXIsXG4gICAgICAgICAgYmFua0luZm86IHtcbiAgICAgICAgICAgIGJhbmtOYW1lOiBiTmFtZSxcbiAgICAgICAgICAgIGliYW46IGJJYmFuLFxuICAgICAgICAgICAgYWNjb3VudE51bWJlcjogYkFjY051bSxcbiAgICAgICAgICAgIHN3aWZ0Q29kZTogYlN3aWZ0LFxuICAgICAgICAgICAgdHJhbnNmZXJNZXRob2Q6IGJNZXRob2QsXG4gICAgICAgICAgICBhY2NvdW50SG9sZGVyTmFtZTogYkhvbGRlcixcbiAgICAgICAgICB9LFxuICAgICAgICAgIHRvdGFsRW50aXRsZW1lbnRzOiBlbnRpdGxlbWVudHMsXG4gICAgICAgICAgdG90YWxEZWR1Y3Rpb25zOiB0b3RhbERlZHVjdGlvbnNTdW0sXG4gICAgICAgICAgbmV0U2FsYXJ5OiBuZXQsXG4gICAgICAgICAgZGVkdWN0aW9uc0xpc3Q6IGZldGNoZWREZWR1Y3Rpb25zTGlzdCxcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyAzLiBDb21wdXRlIHRvdGFsc1xuICAgICAgY29uc3QgdG90YWxCYXNpY1NhbGFyeSA9IHJ1bkVtcHMucmVkdWNlKChzdW0sIGl0ZW0pID0+IHN1bSArIGl0ZW0uYmFzaWNTYWxhcnksIDApO1xuICAgICAgY29uc3QgdG90YWxBbGxvd2FuY2VzID0gcnVuRW1wcy5yZWR1Y2UoXG4gICAgICAgIChzdW0sIGl0ZW0pID0+XG4gICAgICAgICAgc3VtICtcbiAgICAgICAgICBpdGVtLmhvdXNpbmdBbGxvd2FuY2UgK1xuICAgICAgICAgIGl0ZW0udHJhbnNwb3J0QWxsb3dhbmNlICtcbiAgICAgICAgICBpdGVtLnBob25lQWxsb3dhbmNlICtcbiAgICAgICAgICBpdGVtLmZvb2RBbGxvd2FuY2UgK1xuICAgICAgICAgIGl0ZW0ub3ZlcnRpbWVBbW91bnQgK1xuICAgICAgICAgIGl0ZW0ub3RoZXJBbGxvd2FuY2VzICtcbiAgICAgICAgICBpdGVtLm11ZGRhaEFtb3VudCxcbiAgICAgICAgMFxuICAgICAgKTtcbiAgICAgIGNvbnN0IHRvdGFsRGVkdWN0aW9ucyA9IHJ1bkVtcHMucmVkdWNlKChzdW0sIGl0ZW0pID0+IHN1bSArIGl0ZW0udG90YWxEZWR1Y3Rpb25zLCAwKTtcbiAgICAgIGNvbnN0IHRvdGFsTmV0U2FsYXJ5ID0gcnVuRW1wcy5yZWR1Y2UoKHN1bSwgaXRlbSkgPT4gc3VtICsgaXRlbS5uZXRTYWxhcnksIDApO1xuXG4gICAgICBjb25zdCB0b3RhbE92ZXJ0aW1lSG91cnMgPSBydW5FbXBzLnJlZHVjZSgoc3VtLCBpdGVtKSA9PiBzdW0gKyAoaXRlbS5vdmVydGltZUhvdXJzIHx8IDApLCAwKTtcbiAgICAgIGNvbnN0IHRvdGFsT3ZlcnRpbWVBbW91bnQgPSBydW5FbXBzLnJlZHVjZSgoc3VtLCBpdGVtKSA9PiBzdW0gKyAoaXRlbS5vdmVydGltZUFtb3VudCB8fCAwKSwgMCk7XG5cbiAgICAgIGNvbnN0IGZpcnN0TG9nID0gYXBwZW5kQXVkaXRMb2coXG4gICAgICAgIHJ1bklkLFxuICAgICAgICBcItin2YbYtNin2KEg2YXYs9mK2LEg2LHZiNin2KrYqFwiLFxuICAgICAgICBg2KrZhSDYpdmG2LTYp9ihINmF2LPZitixINix2YjYp9iq2Kgg2KzYr9mK2K8g2KjYp9mE2LHZgtmFICR7bmV3UnVuRm9ybS5wYXlyb2xsTnVtYmVyfSDZhNi02YfYsSAke25ld1J1bkZvcm0ubW9udGh9LyR7bmV3UnVuRm9ybS55ZWFyfS5gXG4gICAgICApO1xuXG4gICAgICBjb25zdCBuZXdSdW46IFBheXJvbGxSdW4gJiB7XG4gICAgICAgIGVtcGxveWVlczogUGF5cm9sbFJ1bkVtcGxveWVlW107XG4gICAgICAgIGF1ZGl0TG9nczogUGF5cm9sbEF1ZGl0TG9nW107XG4gICAgICAgIG1vZGlmaWNhdGlvblJlcXVlc3RzOiBQYXlyb2xsTW9kaWZpY2F0aW9uUmVxdWVzdFtdO1xuICAgICAgfSA9IHtcbiAgICAgICAgaWQ6IHJ1bklkLFxuICAgICAgICBwYXlyb2xsTnVtYmVyOiBuZXdSdW5Gb3JtLnBheXJvbGxOdW1iZXIsXG4gICAgICAgIG1vbnRoOiBOdW1iZXIobmV3UnVuRm9ybS5tb250aCksXG4gICAgICAgIHllYXI6IE51bWJlcihuZXdSdW5Gb3JtLnllYXIpLFxuICAgICAgICBzYWxhcnlQZXJpb2Q6IG5ld1J1bkZvcm0uc2FsYXJ5UGVyaW9kLFxuICAgICAgICBkZXBhcnRtZW50OiBuZXdSdW5Gb3JtLmRlcGFydG1lbnQsXG4gICAgICAgIHN0YXR1czogXCJEcmFmdFwiLFxuICAgICAgICBub3RlczogbmV3UnVuRm9ybS5ub3RlcyxcbiAgICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIGNyZWF0ZWRCeTogdXNlci51c2VybmFtZSB8fCBcIlN5c3RlbVwiLFxuICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgZW1wbG95ZWVzQ291bnQ6IHJ1bkVtcHMubGVuZ3RoLFxuICAgICAgICB0b3RhbEJhc2ljU2FsYXJ5LFxuICAgICAgICB0b3RhbEFsbG93YW5jZXMsXG4gICAgICAgIHRvdGFsRGVkdWN0aW9ucyxcbiAgICAgICAgdG90YWxOZXRTYWxhcnksXG4gICAgICAgIHRvdGFsT3ZlcnRpbWVIb3VycyxcbiAgICAgICAgdG90YWxPdmVydGltZUFtb3VudCxcbiAgICAgICAgZW1wbG95ZWVzOiBydW5FbXBzLFxuICAgICAgICBhdWRpdExvZ3M6IFtmaXJzdExvZ10sXG4gICAgICAgIG1vZGlmaWNhdGlvblJlcXVlc3RzOiBbXSxcbiAgICAgIH07XG5cbiAgICAgIC8vIFNhdmUgdG8gRmlyZWJhc2UgdmlhIGJhY2tlbmRcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKFwiL2FwaS9wYXlyb2xsX3J1bnNcIiwge1xuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KG5ld1J1biksXG4gICAgICB9KTtcblxuICAgICAgaWYgKHJlcy5vaykge1xuICAgICAgICBzaG93VG9hc3QoXG4gICAgICAgICAgYOKchSDYqtmFINil2YbYtNin2KEg2YXYs9mK2LEg2KfZhNix2YjYp9iq2Kgg2KfZhNmF2KfZhNmKINio2YbYrNin2K0g2YjZitit2KrZiNmKINi52YTZiSAke3J1bkVtcHMubGVuZ3RofSDZhdmI2LjZgSFgLFxuICAgICAgICAgIGDinIUgUGF5cm9sbCBydW4gY3JlYXRlZCBzdWNjZXNzZnVsbHkgY29udGFpbmluZyAke3J1bkVtcHMubGVuZ3RofSBlbXBsb3llZXMhYCxcbiAgICAgICAgICBcInN1Y2Nlc3NcIlxuICAgICAgICApO1xuICAgICAgICBzZXRJc0NyZWF0ZU1vZGFsT3BlbihmYWxzZSk7XG4gICAgICAgIGF3YWl0IGxvYWRQYXlyb2xsUnVucygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQVBJIHJlamVjdGlvblwiKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHNob3dUb2FzdChcIuKdjCDYrdiv2Ksg2K7Yt9ijINij2KvZhtin2KEg2KfZhNin2KrYtdin2YQg2KjYp9mE2K7Yp9iv2YUg2YjYrdmB2Lgg2KfZhNio2YrYp9mG2KfYqi5cIiwgXCLinYwgQ29ubmVjdGlvbiBlcnJvciBzYXZpbmcgZGF0YSB0byBzZXJ2ZXIuXCIsIFwiZXJyb3JcIik7XG4gICAgfVxuICB9O1xuXG4gIC8vIE9wZW4gUGF5cm9sbCBSdW4gZGV0YWlsIG1vZGFsXG4gIGNvbnN0IGhhbmRsZU9wZW5WaWV3UnVuID0gKHJ1bjogUGF5cm9sbFJ1biAmIGFueSkgPT4ge1xuICAgIHNldFNlbGVjdGVkUnVuKHJ1bik7XG4gICAgc2V0UnVuRW1wbG95ZWVzKHJ1bi5lbXBsb3llZXMgfHwgW10pO1xuICAgIHNldFJ1bkF1ZGl0TG9ncyhydW4uYXVkaXRMb2dzIHx8IFtdKTtcbiAgICBzZXRSdW5Nb2RpZmljYXRpb25SZXF1ZXN0cyhydW4ubW9kaWZpY2F0aW9uUmVxdWVzdHMgfHwgW10pO1xuICAgIHNldElzVmlld01vZGFsT3Blbih0cnVlKTtcbiAgfTtcblxuICAvLyBEZWxldGUgUnVuIChTb2Z0IERlbGV0ZSB3aXRoIHN0YXR1cyBydWxlcyBhbmQgcmVhc29uKVxuICBjb25zdCBoYW5kbGVEZWxldGVSdW4gPSBhc3luYyAocnVuOiBQYXlyb2xsUnVuKSA9PiB7XG4gICAgLy8gQXBwcm92ZWQsIFRyYW5zZmVycmVkLCBQYWlkIG9yIFBhcnRpYWxseSBQYWlkIHBheXJvbGwgY2Fubm90IGJlIGRlbGV0ZWRcbiAgICBjb25zdCB0ZXJtaW5hbFN0YXR1c2VzID0gW1wiQXBwcm92ZWRcIiwgXCJUcmFuc2ZlcnJlZFwiLCBcIlBhaWRcIiwgXCJQYXJ0aWFsbHkgUGFpZFwiLCBcIlBlbmRpbmcgRmluYWwgQXBwcm92YWxcIl07XG4gICAgaWYgKHRlcm1pbmFsU3RhdHVzZXMuaW5jbHVkZXMocnVuLnN0YXR1cykpIHtcbiAgICAgIHNob3dUb2FzdChcbiAgICAgICAgXCLinYwg2YTYpyDZitmF2YPZhiDYrdiw2YEg2YfYsNinINin2YTYqNmG2K8g2YTYo9mG2Ycg2YXYudiq2YXYryDYo9mIINmF2K3ZiNmEINij2Ygg2YXYr9mB2YjYuSDYqNin2YTZgdi52YQhXCIsXG4gICAgICAgIFwiVGhpcyBpdGVtIGNhbm5vdCBiZSBkZWxldGVkIGJlY2F1c2UgaXQgaXMgYWxyZWFkeSBhcHByb3ZlZCwgdHJhbnNmZXJyZWQsIG9yIHBhaWQuXCIsXG4gICAgICAgIFwiZXJyb3JcIlxuICAgICAgKTtcbiAgICAgIC8vIExvZyBmYWlsZWQgZGVsZXRlIGF0dGVtcHQgaW4gYXVkaXQgbG9nXG4gICAgICBsb2dBY3Rpb25Ub0F1ZGl0KHtcbiAgICAgICAgYWN0aW9uOiBcIkZhaWxlZCBEZWxldGUgQXR0ZW1wdFwiLFxuICAgICAgICBwYXlyb2xsUnVuSWQ6IHJ1bi5pZCxcbiAgICAgICAgbm90ZXM6IGBVc2VyIHRyaWVkIHRvIGRlbGV0ZSBwYXlyb2xsIHJ1biAke3J1bi5wYXlyb2xsTnVtYmVyfSBpbiB0ZXJtaW5hbCBzdGF0dXM6ICR7cnVuLnN0YXR1c31gLFxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUGF5cm9sbCBydW4gY2FuIGJlIGRlbGV0ZWQgb25seSBpZiBzdGF0dXMgaXMgRHJhZnQsIG9yIGlmIHN0YXR1cyBpcyBOZWVkcyBNb2RpZmljYXRpb24gb25seSBieSBhdXRob3JpemVkIHVzZXJzXG4gICAgY29uc3QgaXNBdXRob3JpemVkID0gaXNTdXBlckFkbWluIHx8IGlzUmV2aWV3ZXIgfHwgaXNBY2NvdW50YW50O1xuICAgIGlmIChydW4uc3RhdHVzID09PSBcIk5lZWRzIE1vZGlmaWNhdGlvblwiICYmICFpc0F1dGhvcml6ZWQpIHtcbiAgICAgIHNob3dUb2FzdChcbiAgICAgICAgXCLinYwg2LrZitixINmF2LXYsditINmE2YMg2KjYrdiw2YEg2YfYsNinINin2YTZhdiz2YrYsSDZgdmKINit2KfZhNipINi32YTYqCDYqti52K/ZitmELlwiLFxuICAgICAgICBcIuKdjCBZb3UgYXJlIG5vdCBhdXRob3JpemVkIHRvIGRlbGV0ZSB0aGlzIHBheXJvbGwgd2hlbiBtb2RpZmljYXRpb25zIGFyZSByZXF1ZXN0ZWQuXCIsXG4gICAgICAgIFwiZXJyb3JcIlxuICAgICAgKTtcbiAgICAgIGxvZ0FjdGlvblRvQXVkaXQoe1xuICAgICAgICBhY3Rpb246IFwiRmFpbGVkIERlbGV0ZSBBdHRlbXB0XCIsXG4gICAgICAgIHBheXJvbGxSdW5JZDogcnVuLmlkLFxuICAgICAgICBub3RlczogYFVzZXIgdHJpZWQgdG8gZGVsZXRlIHBheXJvbGwgcnVuICR7cnVuLnBheXJvbGxOdW1iZXJ9IChOZWVkcyBNb2RpZmljYXRpb24pIHdpdGhvdXQgYXV0aG9yaXphdGlvbi5gLFxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHJ1bi5zdGF0dXMgIT09IFwiRHJhZnRcIiAmJiBydW4uc3RhdHVzICE9PSBcIk5lZWRzIE1vZGlmaWNhdGlvblwiKSB7XG4gICAgICBzaG93VG9hc3QoXG4gICAgICAgIFwi4p2MINmE2Kcg2YrZhdmD2YYg2K3YsNmBINmD2LTZiNmBINin2YTYsdmI2KfYqtioINi62YrYsSDYp9mE2YXYs9mI2K/YqS5cIixcbiAgICAgICAgXCLinYwgT25seSBkcmFmdCBvciBuZWVkcyBtb2RpZmljYXRpb24gcGF5cm9sbCBydW5zIGNhbiBiZSBkZWxldGVkLlwiLFxuICAgICAgICBcImVycm9yXCJcbiAgICAgICk7XG4gICAgICBsb2dBY3Rpb25Ub0F1ZGl0KHtcbiAgICAgICAgYWN0aW9uOiBcIkZhaWxlZCBEZWxldGUgQXR0ZW1wdFwiLFxuICAgICAgICBwYXlyb2xsUnVuSWQ6IHJ1bi5pZCxcbiAgICAgICAgbm90ZXM6IGBVc2VyIHRyaWVkIHRvIGRlbGV0ZSBwYXlyb2xsIHJ1biAke3J1bi5wYXlyb2xsTnVtYmVyfSBpbiBzdGF0dXM6ICR7cnVuLnN0YXR1c31gLFxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHJ1bi5zdGF0dXMgPT09IFwiRHJhZnRcIikge1xuICAgICAgaWYgKHRydWUpIHsgLy8gQnlwYXNzIGNvbmZpcm0gaW4gaWZyYW1lXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgZGVsZXRlTG9nID0gYXBwZW5kQXVkaXRMb2coXG4gICAgICAgICAgICBydW4uaWQsXG4gICAgICAgICAgICBcItit2LDZgSDZhdiz2YrYsSAo2K3YsNmBINmF2KTZgtiqKVwiLFxuICAgICAgICAgICAgYNiq2YUg2K3YsNmBINmF2LPZitixINin2YTYsdmI2KfYqtioINio2KfZhNix2YLZhSAke3J1bi5wYXlyb2xsTnVtYmVyfSDZhdik2YLYqtin2Ysg2KjZiNin2LPYt9ipINin2YTZhdiz2KrYrtiv2YUuYFxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBjb25zdCB1cGRhdGVkUnVuID0ge1xuICAgICAgICAgICAgLi4ucnVuLFxuICAgICAgICAgICAgaXNEZWxldGVkOiB0cnVlLFxuICAgICAgICAgICAgZGVsZXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBkZWxldGVkQnk6IHVzZXIudXNlcm5hbWUgfHwgdXNlci5pZCB8fCBcIlN5c3RlbVwiLFxuICAgICAgICAgICAgZGVsZXRlUmVhc29uOiBcItit2LDZgSDZhdio2KfYtNixINmF2YYg2KfZhNmF2LPZiNiv2KlcIixcbiAgICAgICAgICAgIGF1ZGl0TG9nczogcnVuLmF1ZGl0TG9ncyA/IFsuLi5ydW4uYXVkaXRMb2dzLCBkZWxldGVMb2ddIDogW2RlbGV0ZUxvZ10sXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3BheXJvbGxfcnVucy8ke3J1bi5pZH1gLCB7XG4gICAgICAgICAgICBtZXRob2Q6IFwiUFVUXCIsXG4gICAgICAgICAgICBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh1cGRhdGVkUnVuKSxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgdG8gc29mdCBkZWxldGUgdGhlIHJ1biBvbiBzZXJ2ZXIuXCIpO1xuICAgICAgICAgIFxuICAgICAgICAgIHNldFBheXJvbGxSdW5zKHBheXJvbGxSdW5zLm1hcChyID0+IHIuaWQgPT09IHJ1bi5pZCA/IHVwZGF0ZWRSdW4gOiByKSk7XG4gICAgICAgICAgXG4gICAgICAgICAgc2hvd1RvYXN0KFxuICAgICAgICAgICAgXCLwn5eR77iPINiq2YUg2K3YsNmBINin2YTZhdiz2YrYsSDYqNmG2KzYp9itXCIsXG4gICAgICAgICAgICBcIvCfl5HvuI8gUGF5cm9sbCBSdW4gZGVsZXRlZCBzdWNjZXNzZnVsbHlcIixcbiAgICAgICAgICAgIFwic3VjY2Vzc1wiXG4gICAgICAgICAgKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBkZWxldGluZyBwYXlyb2xsIHJ1bjpcIiwgZSk7XG4gICAgICAgICAgc2hvd1RvYXN0KFwi4p2MINit2K/YqyDYrti32KMg2KPYq9mG2KfYoSDYrdiw2YEg2KfZhNmF2LPZitixXCIsIFwi4p2MIEVycm9yIGRlbGV0aW5nIHBheXJvbGwgcnVuXCIsIFwiZXJyb3JcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZXRSdW5Ub0RlbGV0ZUlkKHJ1bi5pZCk7XG4gICAgc2V0UnVuVG9EZWxldGVTdGF0dXMocnVuLnN0YXR1cyk7XG4gICAgc2V0RGVsZXRlUmVhc29uVGV4dChcIlwiKTtcbiAgICBzZXRJc0RlbGV0ZVJlYXNvbk1vZGFsT3Blbih0cnVlKTtcbiAgfTtcblxuICBjb25zdCBoYW5kbGVDb25maXJtU29mdERlbGV0ZSA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoIXJ1blRvRGVsZXRlSWQpIHJldHVybjtcbiAgICBpZiAoIWRlbGV0ZVJlYXNvblRleHQudHJpbSgpKSB7XG4gICAgICBzaG93VG9hc3QoXG4gICAgICAgIFwi4pqg77iPINiz2KjYqCDYp9mE2K3YsNmBINmF2LfZhNmI2Kgg2YTZhdiq2KfYqNi52Kkg2KfZhNi52YXZhNmK2KkhXCIsXG4gICAgICAgIFwi4pqg77iPIERlbGV0aW9uIHJlYXNvbiBpcyByZXF1aXJlZC5cIixcbiAgICAgICAgXCJlcnJvclwiXG4gICAgICApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCB0YXJnZXRSdW4gPSBwYXlyb2xsUnVucy5maW5kKChyKSA9PiByLmlkID09PSBydW5Ub0RlbGV0ZUlkKTtcbiAgICAgIGlmICghdGFyZ2V0UnVuKSByZXR1cm47XG5cbiAgICAgIGNvbnN0IGRlbGV0ZUxvZyA9IGFwcGVuZEF1ZGl0TG9nKFxuICAgICAgICBydW5Ub0RlbGV0ZUlkLFxuICAgICAgICBcItit2LDZgSDZhdiz2YrYsSAo2K3YsNmBINmF2KTZgtiqKVwiLFxuICAgICAgICBg2KrZhSDYrdiw2YEg2YXYs9mK2LEg2KfZhNix2YjYp9iq2Kgg2KjYp9mE2LHZgtmFICR7dGFyZ2V0UnVuLnBheXJvbGxOdW1iZXJ9INmF2KTZgtiq2KfZiy4g2LPYqNioINin2YTYrdiw2YE6IFwiJHtkZWxldGVSZWFzb25UZXh0fVwiYFxuICAgICAgKTtcblxuICAgICAgY29uc3QgdXBkYXRlZFJ1biA9IHtcbiAgICAgICAgLi4udGFyZ2V0UnVuLFxuICAgICAgICBpc0RlbGV0ZWQ6IHRydWUsXG4gICAgICAgIGRlbGV0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICBkZWxldGVkQnk6IHVzZXIudXNlcm5hbWUgfHwgdXNlci5pZCB8fCBcIlN5c3RlbVwiLFxuICAgICAgICBkZWxldGVSZWFzb246IGRlbGV0ZVJlYXNvblRleHQsXG4gICAgICAgIGF1ZGl0TG9nczogdGFyZ2V0UnVuLmF1ZGl0TG9ncyA/IFsuLi50YXJnZXRSdW4uYXVkaXRMb2dzLCBkZWxldGVMb2ddIDogW2RlbGV0ZUxvZ10sXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9wYXlyb2xsX3J1bnMvJHtydW5Ub0RlbGV0ZUlkfWAsIHtcbiAgICAgICAgbWV0aG9kOiBcIlBVVFwiLFxuICAgICAgICBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHVwZGF0ZWRSdW4pLFxuICAgICAgfSk7XG5cbiAgICAgIGlmIChyZXMub2spIHtcbiAgICAgICAgc2hvd1RvYXN0KFxuICAgICAgICAgIFwi4pyTINiq2YUg2K3YsNmBINmF2LPZitixINin2YTYsdmI2KfYqtioINio2YbYrNin2K0g2YjZhtmC2YTZhyDZhNiz2KzZhCDYp9mE2YXYrdiw2YjZgdin2Kog2KfZhNmF2KTZgtiqLlwiLFxuICAgICAgICAgIFwi4pyTIFBheXJvbGwgcnVuIHNvZnQtZGVsZXRlZCBzdWNjZXNzZnVsbHkuXCIsXG4gICAgICAgICAgXCJzdWNjZXNzXCJcbiAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgIC8vIExvZyBhY3Rpb24gaW4gYXVkaXQgbG9nXG4gICAgICAgIGF3YWl0IGxvZ0FjdGlvblRvQXVkaXQoe1xuICAgICAgICAgIGFjdGlvbjogXCJEZWxldGUgUGF5cm9sbCBSdW5cIixcbiAgICAgICAgICBwYXlyb2xsUnVuSWQ6IHJ1blRvRGVsZXRlSWQsXG4gICAgICAgICAgbm90ZXM6IGBTb2Z0IGRlbGV0ZWQgcGF5cm9sbCBydW4gJHt0YXJnZXRSdW4ucGF5cm9sbE51bWJlcn0uIFJlYXNvbjogJHtkZWxldGVSZWFzb25UZXh0fWAsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHNldElzRGVsZXRlUmVhc29uTW9kYWxPcGVuKGZhbHNlKTtcbiAgICAgICAgc2V0UnVuVG9EZWxldGVJZChudWxsKTtcbiAgICAgICAgc2V0RGVsZXRlUmVhc29uVGV4dChcIlwiKTtcbiAgICAgICAgYXdhaXQgbG9hZFBheXJvbGxSdW5zKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgdG8gc29mdCBkZWxldGUgb24gYmFja2VuZFwiKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgc2hvd1RvYXN0KFwi4p2MINit2K/YqyDYrti32KMg2KPYq9mG2KfYoSDYp9mE2KfYqti12KfZhCDYqNin2YTYrtin2K/ZhSDZiNit2YHYuCDYp9mE2KrYudiv2YrZhNin2KouXCIsIFwi4p2MIENvbm5lY3Rpb24gZXJyb3IgZHVyaW5nIHNvZnQgZGVsZXRpb24uXCIsIFwiZXJyb3JcIik7XG4gICAgfVxuICB9O1xuXG4gIC8vIFNhdmUgY2hhbmdlcyB0byBlbXBsb3llZSB2YWx1ZXNcbiAgY29uc3QgaGFuZGxlU2F2ZUVtcGxveWVlUm93ID0gYXN5bmMgKGVtcElkOiBzdHJpbmcpID0+IHtcbiAgICBpZiAoIXNlbGVjdGVkUnVuKSByZXR1cm47XG5cbiAgICBjb25zdCB0YXJnZXRFbXAgPSBydW5FbXBsb3llZXMuZmluZCgoZSkgPT4gZS5pZCA9PT0gZW1wSWQpO1xuICAgIGlmICghdGFyZ2V0RW1wKSByZXR1cm47XG5cbiAgICAvLyBVc2UgZWRpdCB2YWx1ZXNcbiAgICBjb25zdCBiYXNpYyA9IE51bWJlcihlZGl0RW1wbG95ZWVGb3JtLmJhc2ljU2FsYXJ5ID8/IHRhcmdldEVtcC5iYXNpY1NhbGFyeSA/PyAwKTtcbiAgICBjb25zdCBob3VzaW5nID0gTnVtYmVyKGVkaXRFbXBsb3llZUZvcm0uaG91c2luZ0FsbG93YW5jZSA/PyB0YXJnZXRFbXAuaG91c2luZ0FsbG93YW5jZSA/PyAwKTtcbiAgICBjb25zdCB0cmFuc3BvcnQgPSBOdW1iZXIoZWRpdEVtcGxveWVlRm9ybS50cmFuc3BvcnRBbGxvd2FuY2UgPz8gdGFyZ2V0RW1wLnRyYW5zcG9ydEFsbG93YW5jZSA/PyAwKTtcbiAgICBjb25zdCBwaG9uZSA9IE51bWJlcihlZGl0RW1wbG95ZWVGb3JtLnBob25lQWxsb3dhbmNlID8/IHRhcmdldEVtcC5waG9uZUFsbG93YW5jZSA/PyAwKTtcbiAgICBjb25zdCBmb29kID0gTnVtYmVyKGVkaXRFbXBsb3llZUZvcm0uZm9vZEFsbG93YW5jZSA/PyB0YXJnZXRFbXAuZm9vZEFsbG93YW5jZSA/PyAwKTtcbiAgICBjb25zdCBtdWRkYWggPSBOdW1iZXIoZWRpdEVtcGxveWVlRm9ybS5tdWRkYWhBbW91bnQgPz8gdGFyZ2V0RW1wLm11ZGRhaEFtb3VudCA/PyAwKTtcbiAgICBjb25zdCBvdEhvdXJzID0gTnVtYmVyKGVkaXRFbXBsb3llZUZvcm0ub3ZlcnRpbWVIb3VycyA/PyB0YXJnZXRFbXAub3ZlcnRpbWVIb3VycyA/PyAwKTtcbiAgICBjb25zdCBvdEFtb3VudCA9IE51bWJlcihlZGl0RW1wbG95ZWVGb3JtLm92ZXJ0aW1lQW1vdW50ID8/IHRhcmdldEVtcC5vdmVydGltZUFtb3VudCA/PyAwKTtcbiAgICBjb25zdCBvdGhlckFsbG93ID0gTnVtYmVyKGVkaXRFbXBsb3llZUZvcm0ub3RoZXJBbGxvd2FuY2VzID8/IHRhcmdldEVtcC5vdGhlckFsbG93YW5jZXMgPz8gMCk7XG4gICAgY29uc3Qgb3RoZXJBbGxvd1JlYXNvbiA9IGVkaXRFbXBsb3llZUZvcm0ub3RoZXJBbGxvd2FuY2VzUmVhc29uID8/IHRhcmdldEVtcC5vdGhlckFsbG93YW5jZXNSZWFzb24gPz8gXCJcIjtcbiAgICBjb25zdCBsaXZpbmcgPSBOdW1iZXIoZWRpdEVtcGxveWVlRm9ybS5saXZpbmdBbGxvd2FuY2UgPz8gdGFyZ2V0RW1wLmxpdmluZ0FsbG93YW5jZSA/PyAwKTtcblxuICAgIGNvbnN0IGxvYW5zID0gTnVtYmVyKGVkaXRFbXBsb3llZUZvcm0ubG9hbnNEZWR1Y3Rpb24gPz8gdGFyZ2V0RW1wLmxvYW5zRGVkdWN0aW9uID8/IDApO1xuICAgIGNvbnN0IGxvYW5zUmVhc29uID0gZWRpdEVtcGxveWVlRm9ybS5sb2FuRGVkdWN0aW9uUmVhc29uID8/IHRhcmdldEVtcC5sb2FuRGVkdWN0aW9uUmVhc29uID8/IFwiXCI7XG4gICAgXG4gICAgY29uc3QgYWJzZW5jZSA9IE51bWJlcihlZGl0RW1wbG95ZWVGb3JtLmFic2VuY2VEZWR1Y3Rpb24gPz8gdGFyZ2V0RW1wLmFic2VuY2VEZWR1Y3Rpb24gPz8gMCk7XG4gICAgY29uc3QgYWJzZW5jZVJlYXNvbiA9IGVkaXRFbXBsb3llZUZvcm0uYWJzZW5jZURlZHVjdGlvblJlYXNvbiA/PyB0YXJnZXRFbXAuYWJzZW5jZURlZHVjdGlvblJlYXNvbiA/PyBcIlwiO1xuXG4gICAgY29uc3QgbGF0ZSA9IE51bWJlcihlZGl0RW1wbG95ZWVGb3JtLmxhdGVEZWR1Y3Rpb24gPz8gdGFyZ2V0RW1wLmxhdGVEZWR1Y3Rpb24gPz8gMCk7XG4gICAgY29uc3QgbGF0ZVJlYXNvbiA9IGVkaXRFbXBsb3llZUZvcm0ubGF0ZURlZHVjdGlvblJlYXNvbiA/PyB0YXJnZXRFbXAubGF0ZURlZHVjdGlvblJlYXNvbiA/PyBcIlwiO1xuXG4gICAgY29uc3QgcGVuYWx0eSA9IE51bWJlcihlZGl0RW1wbG95ZWVGb3JtLnBlbmFsdHlEZWR1Y3Rpb24gPz8gdGFyZ2V0RW1wLnBlbmFsdHlEZWR1Y3Rpb24gPz8gMCk7XG4gICAgY29uc3QgcGVuYWx0eVJlYXNvbiA9IGVkaXRFbXBsb3llZUZvcm0ucGVuYWx0eURlZHVjdGlvblJlYXNvbiA/PyB0YXJnZXRFbXAucGVuYWx0eURlZHVjdGlvblJlYXNvbiA/PyBcIlwiO1xuXG4gICAgY29uc3QgZ29zaSA9IE51bWJlcihlZGl0RW1wbG95ZWVGb3JtLmdvc2lEZWR1Y3Rpb24gPz8gdGFyZ2V0RW1wLmdvc2lEZWR1Y3Rpb24gPz8gMCk7XG4gICAgXG4gICAgY29uc3Qgb3RoZXJEZWR1Y3QgPSBOdW1iZXIoZWRpdEVtcGxveWVlRm9ybS5vdGhlckRlZHVjdGlvbnMgPz8gdGFyZ2V0RW1wLm90aGVyRGVkdWN0aW9ucyA/PyAwKTtcbiAgICBjb25zdCBvdGhlckRlZHVjdFJlYXNvbiA9IGVkaXRFbXBsb3llZUZvcm0uZGVkdWN0aW9uc1JlYXNvbiA/PyB0YXJnZXRFbXAuZGVkdWN0aW9uc1JlYXNvbiA/PyBcIlwiO1xuXG4gICAgLy8gVkFMSURBVEUgUkVBU09OUzogSWYgYW55IGlzID4gMCBhbmQgcmVhc29uIGlzIGVtcHR5LCBibG9jayBzYXZpbmdcbiAgICBpZiAobG9hbnMgPiAwICYmICFsb2Fuc1JlYXNvbi50cmltKCkpIHtcbiAgICAgIHNob3dUb2FzdChcIuKaoO+4jyDYs9io2Kgg2KfZhNiu2LXZhSDZhdi32YTZiNioINmE2YPYp9mB2Kkg2KfZhNin2LPYqtmC2LfYp9i52KfYqiDYp9mE2YXZgdix2YjYttipISAo2KfZhNiz2YTZgdipKVwiLCBcIkRlZHVjdGlvbiByZWFzb24gaXMgcmVxdWlyZWQgZm9yIGxvYW5zLlwiLCBcImVycm9yXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoYWJzZW5jZSA+IDAgJiYgIWFic2VuY2VSZWFzb24udHJpbSgpKSB7XG4gICAgICBzaG93VG9hc3QoXCLimqDvuI8g2LPYqNioINin2YTYrti12YUg2YXYt9mE2YjYqCDZhNmD2KfZgdipINin2YTYp9iz2KrZgti32KfYudin2Kog2KfZhNmF2YHYsdmI2LbYqSEgKNin2YTYutmK2KfYqClcIiwgXCJEZWR1Y3Rpb24gcmVhc29uIGlzIHJlcXVpcmVkIGZvciBhYnNlbmNlLlwiLCBcImVycm9yXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAobGF0ZSA+IDAgJiYgIWxhdGVSZWFzb24udHJpbSgpKSB7XG4gICAgICBzaG93VG9hc3QoXCLimqDvuI8g2LPYqNioINin2YTYrti12YUg2YXYt9mE2YjYqCDZhNmD2KfZgdipINin2YTYp9iz2KrZgti32KfYudin2Kog2KfZhNmF2YHYsdmI2LbYqSEgKNin2YTYqtij2K7ZitixKVwiLCBcIkRlZHVjdGlvbiByZWFzb24gaXMgcmVxdWlyZWQgZm9yIGxhdGUgZGVkdWN0aW9uLlwiLCBcImVycm9yXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAocGVuYWx0eSA+IDAgJiYgIXBlbmFsdHlSZWFzb24udHJpbSgpKSB7XG4gICAgICBzaG93VG9hc3QoXCLimqDvuI8g2LPYqNioINin2YTYrti12YUg2YXYt9mE2YjYqCDZhNmD2KfZgdipINin2YTYp9iz2KrZgti32KfYudin2Kog2KfZhNmF2YHYsdmI2LbYqSEgKNin2YTYrNiy2KfYodin2KopXCIsIFwiRGVkdWN0aW9uIHJlYXNvbiBpcyByZXF1aXJlZCBmb3IgcGVuYWx0aWVzLlwiLCBcImVycm9yXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAob3RoZXJEZWR1Y3QgPiAwICYmICFvdGhlckRlZHVjdFJlYXNvbi50cmltKCkpIHtcbiAgICAgIHNob3dUb2FzdChcIuKaoO+4jyDYs9io2Kgg2KfZhNiu2LXZhSDZhdi32YTZiNioINmE2YPYp9mB2Kkg2KfZhNin2LPYqtmC2LfYp9i52KfYqiDYp9mE2YXZgdix2YjYttipISAo2KPYrtix2YkpXCIsIFwiRGVkdWN0aW9uIHJlYXNvbiBpcyByZXF1aXJlZCBmb3Igb3RoZXIgZGVkdWN0aW9ucy5cIiwgXCJlcnJvclwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjYWxjdWxhdGVkID0gY2FsY3VsYXRlRW1wbG95ZWVOZXQoe1xuICAgICAgYmFzaWNTYWxhcnk6IGJhc2ljLFxuICAgICAgaG91c2luZ0FsbG93YW5jZTogaG91c2luZyxcbiAgICAgIHRyYW5zcG9ydEFsbG93YW5jZTogdHJhbnNwb3J0LFxuICAgICAgcGhvbmVBbGxvd2FuY2U6IHBob25lLFxuICAgICAgZm9vZEFsbG93YW5jZTogZm9vZCxcbiAgICAgIG11ZGRhaEFtb3VudDogbXVkZGFoLFxuICAgICAgb3ZlcnRpbWVBbW91bnQ6IG90QW1vdW50LFxuICAgICAgb3RoZXJBbGxvd2FuY2VzOiBvdGhlckFsbG93LFxuICAgICAgbGl2aW5nQWxsb3dhbmNlOiBsaXZpbmcsXG4gICAgICBsb2Fuc0RlZHVjdGlvbjogbG9hbnMsXG4gICAgICBnb3NpRGVkdWN0aW9uOiBnb3NpLFxuICAgICAgYWJzZW5jZURlZHVjdGlvbjogYWJzZW5jZSxcbiAgICAgIGxhdGVEZWR1Y3Rpb246IGxhdGUsXG4gICAgICBwZW5hbHR5RGVkdWN0aW9uOiBwZW5hbHR5LFxuICAgICAgb3RoZXJEZWR1Y3Rpb25zOiBvdGhlckRlZHVjdCxcbiAgICB9KTtcblxuICAgIGNvbnN0IHVwZGF0ZWRFbXBsb3llZTogUGF5cm9sbFJ1bkVtcGxveWVlID0ge1xuICAgICAgLi4udGFyZ2V0RW1wLFxuICAgICAgYmFzaWNTYWxhcnk6IGJhc2ljLFxuICAgICAgaG91c2luZ0FsbG93YW5jZTogaG91c2luZyxcbiAgICAgIHRyYW5zcG9ydEFsbG93YW5jZTogdHJhbnNwb3J0LFxuICAgICAgcGhvbmVBbGxvd2FuY2U6IHBob25lLFxuICAgICAgZm9vZEFsbG93YW5jZTogZm9vZCxcbiAgICAgIG11ZGRhaEFtb3VudDogbXVkZGFoLFxuICAgICAgb3ZlcnRpbWVIb3Vyczogb3RIb3VycyxcbiAgICAgIG92ZXJ0aW1lQW1vdW50OiBvdEFtb3VudCxcbiAgICAgIG90aGVyQWxsb3dhbmNlczogb3RoZXJBbGxvdyxcbiAgICAgIG90aGVyQWxsb3dhbmNlc1JlYXNvbjogb3RoZXJBbGxvd1JlYXNvbixcbiAgICAgIGxpdmluZ0FsbG93YW5jZTogbGl2aW5nLFxuICAgICAgbG9hbnNEZWR1Y3Rpb246IGxvYW5zLFxuICAgICAgbG9hbkRlZHVjdGlvblJlYXNvbjogbG9hbnNSZWFzb24sXG4gICAgICBhYnNlbmNlRGVkdWN0aW9uOiBhYnNlbmNlLFxuICAgICAgYWJzZW5jZURlZHVjdGlvblJlYXNvbjogYWJzZW5jZVJlYXNvbixcbiAgICAgIGxhdGVEZWR1Y3Rpb246IGxhdGUsXG4gICAgICBsYXRlRGVkdWN0aW9uUmVhc29uOiBsYXRlUmVhc29uLFxuICAgICAgcGVuYWx0eURlZHVjdGlvbjogcGVuYWx0eSxcbiAgICAgIHBlbmFsdHlEZWR1Y3Rpb25SZWFzb246IHBlbmFsdHlSZWFzb24sXG4gICAgICBnb3NpRGVkdWN0aW9uOiBnb3NpLFxuICAgICAgb3RoZXJEZWR1Y3Rpb25zOiBvdGhlckRlZHVjdCxcbiAgICAgIGRlZHVjdGlvbnNSZWFzb246IG90aGVyRGVkdWN0UmVhc29uLFxuICAgICAgdG90YWxFbnRpdGxlbWVudHM6IGNhbGN1bGF0ZWQudG90YWxFbnRpdGxlbWVudHMsXG4gICAgICB0b3RhbERlZHVjdGlvbnM6IGNhbGN1bGF0ZWQudG90YWxEZWR1Y3Rpb25zLFxuICAgICAgbmV0U2FsYXJ5OiBjYWxjdWxhdGVkLm5ldFNhbGFyeSxcbiAgICB9O1xuXG4gICAgY29uc3QgbmV3RW1wbG95ZWVzTGlzdCA9IHJ1bkVtcGxveWVlcy5tYXAoKGUpID0+IChlLmlkID09PSBlbXBJZCA/IHVwZGF0ZWRFbXBsb3llZSA6IGUpKTtcblxuICAgIC8vIFJlY29tcHV0ZSB0b3RhbCBydW4gZmlndXJlc1xuICAgIGNvbnN0IHRvdGFsQmFzaWNTYWxhcnkgPSBuZXdFbXBsb3llZXNMaXN0LnJlZHVjZSgoc3VtLCBpdGVtKSA9PiBzdW0gKyBpdGVtLmJhc2ljU2FsYXJ5LCAwKTtcbiAgICBjb25zdCB0b3RhbEFsbG93YW5jZXMgPSBuZXdFbXBsb3llZXNMaXN0LnJlZHVjZShcbiAgICAgIChzdW0sIGl0ZW0pID0+XG4gICAgICAgIHN1bSArXG4gICAgICAgIGl0ZW0uaG91c2luZ0FsbG93YW5jZSArXG4gICAgICAgIGl0ZW0udHJhbnNwb3J0QWxsb3dhbmNlICtcbiAgICAgICAgaXRlbS5waG9uZUFsbG93YW5jZSArXG4gICAgICAgIGl0ZW0uZm9vZEFsbG93YW5jZSArXG4gICAgICAgIGl0ZW0ub3ZlcnRpbWVBbW91bnQgK1xuICAgICAgICBpdGVtLm90aGVyQWxsb3dhbmNlcyArXG4gICAgICAgIChpdGVtLmxpdmluZ0FsbG93YW5jZSB8fCAwKSxcbiAgICAgIDBcbiAgICApO1xuICAgIGNvbnN0IHRvdGFsRGVkdWN0aW9ucyA9IG5ld0VtcGxveWVlc0xpc3QucmVkdWNlKChzdW0sIGl0ZW0pID0+IHN1bSArIGl0ZW0udG90YWxEZWR1Y3Rpb25zLCAwKTtcbiAgICBjb25zdCB0b3RhbE5ldFNhbGFyeSA9IG5ld0VtcGxveWVlc0xpc3QucmVkdWNlKChzdW0sIGl0ZW0pID0+IHN1bSArIGl0ZW0ubmV0U2FsYXJ5LCAwKTtcblxuICAgIGNvbnN0IHRvdGFsT3ZlcnRpbWVIb3VycyA9IG5ld0VtcGxveWVlc0xpc3QucmVkdWNlKChzdW0sIGl0ZW0pID0+IHN1bSArIChpdGVtLm92ZXJ0aW1lSG91cnMgfHwgMCksIDApO1xuICAgIGNvbnN0IHRvdGFsT3ZlcnRpbWVBbW91bnQgPSBuZXdFbXBsb3llZXNMaXN0LnJlZHVjZSgoc3VtLCBpdGVtKSA9PiBzdW0gKyAoaXRlbS5vdmVydGltZUFtb3VudCB8fCAwKSwgMCk7XG5cbiAgICBjb25zdCBsb2dEZXRhaWxzID0gYNiq2YUg2KrYudiv2YrZhCDYsdin2KrYqCDYp9mE2YXZiNi42YEgKCR7dGFyZ2V0RW1wLmFyYWJpY05hbWV9KS4g2KfZhNix2KfYqtioINin2YTYo9iz2KfYs9mKOiAke2Jhc2ljfdiMINil2LbYp9mB2Yo6ICR7b3RBbW91bnR92Iwg2K7YtdmI2YXYp9iqOiAke2NhbGN1bGF0ZWQudG90YWxEZWR1Y3Rpb25zfdiMINin2YTYtdin2YHZijogJHtjYWxjdWxhdGVkLm5ldFNhbGFyeX0uYDtcbiAgICBjb25zdCBuZXdMb2cgPSBhcHBlbmRBdWRpdExvZyhzZWxlY3RlZFJ1bi5pZCwgXCLYqti52K/ZitmEINiz2LfYsSDZhdmI2LjZgVwiLCBsb2dEZXRhaWxzKTtcblxuICAgIGNvbnN0IHVwZGF0ZWRSdW4gPSB7XG4gICAgICAuLi5zZWxlY3RlZFJ1bixcbiAgICAgIHRvdGFsQmFzaWNTYWxhcnksXG4gICAgICB0b3RhbEFsbG93YW5jZXMsXG4gICAgICB0b3RhbERlZHVjdGlvbnMsXG4gICAgICB0b3RhbE5ldFNhbGFyeSxcbiAgICAgIHRvdGFsT3ZlcnRpbWVIb3VycyxcbiAgICAgIHRvdGFsT3ZlcnRpbWVBbW91bnQsXG4gICAgICBlbXBsb3llZXM6IG5ld0VtcGxveWVlc0xpc3QsXG4gICAgICBhdWRpdExvZ3M6IFsuLi5ydW5BdWRpdExvZ3MsIG5ld0xvZ10sXG4gICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIHVwZGF0ZWRCeTogdXNlci51c2VybmFtZSxcbiAgICB9O1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3BheXJvbGxfcnVucy8ke3NlbGVjdGVkUnVuLmlkfWAsIHtcbiAgICAgICAgbWV0aG9kOiBcIlBVVFwiLFxuICAgICAgICBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHVwZGF0ZWRSdW4pLFxuICAgICAgfSk7XG5cbiAgICAgIGlmIChyZXMub2spIHtcbiAgICAgICAgc2V0U2VsZWN0ZWRSdW4odXBkYXRlZFJ1biBhcyBhbnkpO1xuICAgICAgICBzZXRSdW5FbXBsb3llZXMobmV3RW1wbG95ZWVzTGlzdCk7XG4gICAgICAgIHNldFJ1bkF1ZGl0TG9ncyh1cGRhdGVkUnVuLmF1ZGl0TG9ncyk7XG4gICAgICAgIFxuICAgICAgICAvLyBHcmFudWxhciBsb2dnaW5nXG4gICAgICAgIGlmIChiYXNpYyAhPT0gdGFyZ2V0RW1wLmJhc2ljU2FsYXJ5KSB7XG4gICAgICAgICAgbG9nQWN0aW9uVG9BdWRpdCh7IGFjdGlvbjogXCJFZGl0IEVtcGxveWVlIFNhbGFyeVwiLCBwYXlyb2xsUnVuSWQ6IHNlbGVjdGVkUnVuLmlkLCBlbXBsb3llZUlkOiBlbXBJZCwgZmllbGROYW1lOiBcImJhc2ljU2FsYXJ5XCIsIG9sZFZhbHVlOiB0YXJnZXRFbXAuYmFzaWNTYWxhcnksIG5ld1ZhbHVlOiBiYXNpYywgbm90ZXM6IGBCYXNpYyBzYWxhcnkgb2YgJHt0YXJnZXRFbXAuYXJhYmljTmFtZX0gdXBkYXRlZGAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG90SG91cnMgIT09IHRhcmdldEVtcC5vdmVydGltZUhvdXJzKSB7XG4gICAgICAgICAgbG9nQWN0aW9uVG9BdWRpdCh7IGFjdGlvbjogXCJDaGFuZ2UgT3ZlcnRpbWUgSG91cnNcIiwgcGF5cm9sbFJ1bklkOiBzZWxlY3RlZFJ1bi5pZCwgZW1wbG95ZWVJZDogZW1wSWQsIGZpZWxkTmFtZTogXCJvdmVydGltZUhvdXJzXCIsIG9sZFZhbHVlOiB0YXJnZXRFbXAub3ZlcnRpbWVIb3VycywgbmV3VmFsdWU6IG90SG91cnMsIG5vdGVzOiBgT3ZlcnRpbWUgaG91cnMgb2YgJHt0YXJnZXRFbXAuYXJhYmljTmFtZX0gdXBkYXRlZGAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxvYW5zICE9PSB0YXJnZXRFbXAubG9hbnNEZWR1Y3Rpb24pIHtcbiAgICAgICAgICBsb2dBY3Rpb25Ub0F1ZGl0KHsgYWN0aW9uOiBcIkNoYW5nZSBEZWR1Y3Rpb25cIiwgcGF5cm9sbFJ1bklkOiBzZWxlY3RlZFJ1bi5pZCwgZW1wbG95ZWVJZDogZW1wSWQsIGZpZWxkTmFtZTogXCJsb2Fuc0RlZHVjdGlvblwiLCBvbGRWYWx1ZTogdGFyZ2V0RW1wLmxvYW5zRGVkdWN0aW9uLCBuZXdWYWx1ZTogbG9hbnMsIG5vdGVzOiBgTG9hbnMgZGVkdWN0aW9uIG9mICR7dGFyZ2V0RW1wLmFyYWJpY05hbWV9IHVwZGF0ZWQuIFJlYXNvbjogJHtsb2Fuc1JlYXNvbn1gIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhYnNlbmNlICE9PSB0YXJnZXRFbXAuYWJzZW5jZURlZHVjdGlvbikge1xuICAgICAgICAgIGxvZ0FjdGlvblRvQXVkaXQoeyBhY3Rpb246IFwiQ2hhbmdlIERlZHVjdGlvblwiLCBwYXlyb2xsUnVuSWQ6IHNlbGVjdGVkUnVuLmlkLCBlbXBsb3llZUlkOiBlbXBJZCwgZmllbGROYW1lOiBcImFic2VuY2VEZWR1Y3Rpb25cIiwgb2xkVmFsdWU6IHRhcmdldEVtcC5hYnNlbmNlRGVkdWN0aW9uLCBuZXdWYWx1ZTogYWJzZW5jZSwgbm90ZXM6IGBBYnNlbmNlIGRlZHVjdGlvbiBvZiAke3RhcmdldEVtcC5hcmFiaWNOYW1lfSB1cGRhdGVkLiBSZWFzb246ICR7YWJzZW5jZVJlYXNvbn1gIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsYXRlICE9PSB0YXJnZXRFbXAubGF0ZURlZHVjdGlvbikge1xuICAgICAgICAgIGxvZ0FjdGlvblRvQXVkaXQoeyBhY3Rpb246IFwiQ2hhbmdlIERlZHVjdGlvblwiLCBwYXlyb2xsUnVuSWQ6IHNlbGVjdGVkUnVuLmlkLCBlbXBsb3llZUlkOiBlbXBJZCwgZmllbGROYW1lOiBcImxhdGVEZWR1Y3Rpb25cIiwgb2xkVmFsdWU6IHRhcmdldEVtcC5sYXRlRGVkdWN0aW9uLCBuZXdWYWx1ZTogbGF0ZSwgbm90ZXM6IGBMYXRlIGRlZHVjdGlvbiBvZiAke3RhcmdldEVtcC5hcmFiaWNOYW1lfSB1cGRhdGVkLiBSZWFzb246ICR7bGF0ZVJlYXNvbn1gIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwZW5hbHR5ICE9PSB0YXJnZXRFbXAucGVuYWx0eURlZHVjdGlvbikge1xuICAgICAgICAgIGxvZ0FjdGlvblRvQXVkaXQoeyBhY3Rpb246IFwiQ2hhbmdlIERlZHVjdGlvblwiLCBwYXlyb2xsUnVuSWQ6IHNlbGVjdGVkUnVuLmlkLCBlbXBsb3llZUlkOiBlbXBJZCwgZmllbGROYW1lOiBcInBlbmFsdHlEZWR1Y3Rpb25cIiwgb2xkVmFsdWU6IHRhcmdldEVtcC5wZW5hbHR5RGVkdWN0aW9uLCBuZXdWYWx1ZTogcGVuYWx0eSwgbm90ZXM6IGBQZW5hbHR5IGRlZHVjdGlvbiBvZiAke3RhcmdldEVtcC5hcmFiaWNOYW1lfSB1cGRhdGVkLiBSZWFzb246ICR7cGVuYWx0eVJlYXNvbn1gIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvdGhlckRlZHVjdCAhPT0gdGFyZ2V0RW1wLm90aGVyRGVkdWN0aW9ucykge1xuICAgICAgICAgIGxvZ0FjdGlvblRvQXVkaXQoeyBhY3Rpb246IFwiQ2hhbmdlIERlZHVjdGlvblwiLCBwYXlyb2xsUnVuSWQ6IHNlbGVjdGVkUnVuLmlkLCBlbXBsb3llZUlkOiBlbXBJZCwgZmllbGROYW1lOiBcIm90aGVyRGVkdWN0aW9uc1wiLCBvbGRWYWx1ZTogdGFyZ2V0RW1wLm90aGVyRGVkdWN0aW9ucywgbmV3VmFsdWU6IG90aGVyRGVkdWN0LCBub3RlczogYE90aGVyIGRlZHVjdGlvbiBvZiAke3RhcmdldEVtcC5hcmFiaWNOYW1lfSB1cGRhdGVkLiBSZWFzb246ICR7b3RoZXJEZWR1Y3RSZWFzb259YCB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNldEVkaXRpbmdFbXBsb3llZUlkKG51bGwpO1xuICAgICAgICBzZXRFZGl0RW1wbG95ZWVGb3JtKHt9KTtcbiAgICAgICAgYXdhaXQgbG9hZFBheXJvbGxSdW5zKCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgfVxuICB9O1xuXG4gIC8vIFN0YXRlIFRyYW5zaXRpb24gQWN0aW9uc1xuICBjb25zdCB0cmFuc2l0aW9uU3RhdHVzID0gYXN5bmMgKG5ld1N0YXR1czogUGF5cm9sbFJ1blN0YXR1cywgbG9nQWN0aW9uOiBzdHJpbmcsIGxvZ0RldGFpbHM6IHN0cmluZywgZXh0cmFGaWVsZHM6IGFueSA9IHt9KSA9PiB7XG4gICAgaWYgKCFzZWxlY3RlZFJ1bikgcmV0dXJuO1xuXG4gICAgY29uc3QgbmV3TG9nID0gYXBwZW5kQXVkaXRMb2coc2VsZWN0ZWRSdW4uaWQsIGxvZ0FjdGlvbiwgbG9nRGV0YWlscyk7XG4gICAgY29uc3QgdXBkYXRlZFJ1biA9IHtcbiAgICAgIC4uLnNlbGVjdGVkUnVuLFxuICAgICAgLi4uZXh0cmFGaWVsZHMsXG4gICAgICBzdGF0dXM6IG5ld1N0YXR1cyxcbiAgICAgIGF1ZGl0TG9nczogWy4uLnJ1bkF1ZGl0TG9ncywgbmV3TG9nXSxcbiAgICAgIHVwZGF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgdXBkYXRlZEJ5OiB1c2VyLnVzZXJuYW1lLFxuICAgIH07XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYC9hcGkvcGF5cm9sbF9ydW5zLyR7c2VsZWN0ZWRSdW4uaWR9YCwge1xuICAgICAgICBtZXRob2Q6IFwiUFVUXCIsXG4gICAgICAgIGhlYWRlcnM6IHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkodXBkYXRlZFJ1biksXG4gICAgICB9KTtcblxuICAgICAgaWYgKHJlcy5vaykge1xuICAgICAgICBzZXRTZWxlY3RlZFJ1bih1cGRhdGVkUnVuIGFzIGFueSk7XG4gICAgICAgIHNldFJ1bkF1ZGl0TG9ncyh1cGRhdGVkUnVuLmF1ZGl0TG9ncyk7XG4gICAgICAgIGF3YWl0IGxvYWRQYXlyb2xsUnVucygpO1xuICAgICAgICBzaG93VG9hc3QoXG4gICAgICAgICAgYOKckyDYqtmFINiq2K3Yr9mK2Ksg2K3Yp9mE2Kkg2YXYs9mK2LEg2KfZhNix2YjYp9iq2Kgg2KjZhtis2KfYrSDYpdmE2YkgKCR7bmV3U3RhdHVzfSlgLFxuICAgICAgICAgIGDinJMgUGF5cm9sbCBydW4gc3RhdHVzIHN1Y2Nlc3NmdWxseSB1cGRhdGVkIHRvICgke25ld1N0YXR1c30pYCxcbiAgICAgICAgICBcInN1Y2Nlc3NcIlxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIH1cbiAgfTtcblxuICAvLyBSZS1pbXBvcnQgYW5kIFN5bmMgbGF0ZXN0IEhSIERlZHVjdGlvbnMgJiBMb2Fuc1xuICBjb25zdCBoYW5kbGVSZWZyZXNoSHJEZWR1Y3Rpb25zID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmICghc2VsZWN0ZWRSdW4pIHJldHVybjtcbiAgICB0cnkge1xuICAgICAgc2V0TG9hZGluZyh0cnVlKTtcbiAgICAgIC8vIEZldGNoIGxhdGVzdCBkZWR1Y3Rpb25zXG4gICAgICBjb25zdCByZXNEZWR1Y3Rpb25zID0gYXdhaXQgZmV0Y2goXCIvYXBpL2RlZHVjdGlvbnNcIik7XG4gICAgICBpZiAoIXJlc0RlZHVjdGlvbnMub2spIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIGZldGNoIGZyZXNoIGRlZHVjdGlvbnMgbGlzdCBmcm9tIEhSXCIpO1xuICAgICAgfVxuICAgICAgY29uc3QgZnJlc2hEZWR1Y3Rpb25zID0gYXdhaXQgcmVzRGVkdWN0aW9ucy5qc29uKCk7XG4gICAgICBzZXRIckRlZHVjdGlvbnMoZnJlc2hEZWR1Y3Rpb25zKTtcblxuICAgICAgY29uc3QgcnVuTW9udGhTdHIgPSBzZWxlY3RlZFJ1bi5tb250aC50b1N0cmluZygpLnBhZFN0YXJ0KDIsIFwiMFwiKTtcbiAgICAgIGNvbnN0IHJ1blllYXJNb250aCA9IGAke3NlbGVjdGVkUnVuLnllYXJ9LSR7cnVuTW9udGhTdHJ9YDtcblxuICAgICAgLy8gVXBkYXRlIGVtcGxveWVlcyBpbiBzZWxlY3RlZFJ1blxuICAgICAgY29uc3QgdXBkYXRlZEVtcGxveWVlcyA9IHNlbGVjdGVkUnVuLmVtcGxveWVlcy5tYXAoKGVtcCkgPT4ge1xuICAgICAgICAvLyBGaWx0ZXIgbGF0ZXN0IG1hdGNoaW5nIGFjdGl2ZSBIUiBkZWR1Y3Rpb25zXG4gICAgICAgIGNvbnN0IG1hdGNoaW5nSHIgPSBmcmVzaERlZHVjdGlvbnMuZmlsdGVyKChkOiBhbnkpID0+IHtcbiAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgZC5lbXBsb3llZUlkID09PSBlbXAuZW1wbG95ZWVJZCAmJlxuICAgICAgICAgICAgZC5kYXRlICYmXG4gICAgICAgICAgICBkLmRhdGUuc3RhcnRzV2l0aChydW5ZZWFyTW9udGgpICYmXG4gICAgICAgICAgICAoZC5zdGF0dXMgPT09IFwiY29uZmlybWVkXCIgfHwgZC5zdGF0dXMgPT09IFwibm90aWZpZWRcIikgJiZcbiAgICAgICAgICAgIE51bWJlcihkLmFtb3VudCkgPiAwXG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQ3VycmVudCBkZWR1Y3Rpb25zIGxpc3RcbiAgICAgICAgbGV0IGN1cnJlbnRMaXN0ID0gZW1wLmRlZHVjdGlvbnNMaXN0ID8gWy4uLmVtcC5kZWR1Y3Rpb25zTGlzdF0gOiBbXTtcblxuICAgICAgICAvLyAxLiBSZW1vdmUgSFIgZGVkdWN0aW9ucyB0aGF0IGFyZSBubyBsb25nZXIgYWN0aXZlL21hdGNoaW5nIGluIEhSXG4gICAgICAgIGN1cnJlbnRMaXN0ID0gY3VycmVudExpc3QuZmlsdGVyKChpdGVtKSA9PiB7XG4gICAgICAgICAgaWYgKGl0ZW0uc291cmNlICE9PSBcIkhSXCIpIHJldHVybiB0cnVlOyAvLyBLZWVwIG1hbnVhbCBvbmVzXG4gICAgICAgICAgcmV0dXJuIG1hdGNoaW5nSHIuc29tZSgoZDogYW55KSA9PiBkLmlkID09PSBpdGVtLnNvdXJjZURlZHVjdGlvbklkKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gMi4gVXBkYXRlIGV4aXN0aW5nIEhSIGRlZHVjdGlvbnMgb3IgYWRkIG5ldyBvbmVzXG4gICAgICAgIG1hdGNoaW5nSHIuZm9yRWFjaCgoZDogYW55KSA9PiB7XG4gICAgICAgICAgY29uc3QgZXhpc3RpbmdJZHggPSBjdXJyZW50TGlzdC5maW5kSW5kZXgoKGl0ZW0pID0+IGl0ZW0uc291cmNlRGVkdWN0aW9uSWQgPT09IGQuaWQpO1xuICAgICAgICAgIGlmIChleGlzdGluZ0lkeCA+IC0xKSB7XG4gICAgICAgICAgICAvLyBVcGRhdGVcbiAgICAgICAgICAgIGN1cnJlbnRMaXN0W2V4aXN0aW5nSWR4XSA9IHtcbiAgICAgICAgICAgICAgLi4uY3VycmVudExpc3RbZXhpc3RpbmdJZHhdLFxuICAgICAgICAgICAgICBhbW91bnQ6IE51bWJlcihkLmFtb3VudCksXG4gICAgICAgICAgICAgIHJlYXNvbjogZC5yZWFzb24gfHwgXCLYrti12YUg2YXYs9iq2YjYsdivINmF2YYg2KfZhNmF2YjYp9ix2K8g2KfZhNio2LTYsdmK2KlcIixcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEFkZFxuICAgICAgICAgICAgY3VycmVudExpc3QucHVzaCh7XG4gICAgICAgICAgICAgIGlkOiBkLmlkIHx8IGBERUQtJHtEYXRlLm5vdygpfS0ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cigyLCA1KX1gLFxuICAgICAgICAgICAgICB0eXBlOiBtYXBIckRlZHVjdGlvblR5cGUoZC50eXBlKSxcbiAgICAgICAgICAgICAgYW1vdW50OiBOdW1iZXIoZC5hbW91bnQpLFxuICAgICAgICAgICAgICByZWFzb246IGQucmVhc29uIHx8IFwi2K7YtdmFINmF2LPYqtmI2LHYryDZhdmGINin2YTZhdmI2KfYsdivINin2YTYqNi02LHZitipXCIsXG4gICAgICAgICAgICAgIHNvdXJjZTogXCJIUlwiLFxuICAgICAgICAgICAgICBzb3VyY2VEZWR1Y3Rpb25JZDogZC5pZCxcbiAgICAgICAgICAgICAgY3JlYXRlZEJ5OiBkLmNyZWF0ZWRCeSB8fCBcIkhSIFN5c3RlbVwiLFxuICAgICAgICAgICAgICBjcmVhdGVkQXQ6IGQuY3JlYXRlZEF0IHx8IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgICAgdXBkYXRlZEJ5OiBcIkhSIFN5c3RlbVwiLFxuICAgICAgICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gUmVjYWxjdWxhdGUgY2F0ZWdvcmllc1xuICAgICAgICBsZXQgYWJzRCA9IDA7XG4gICAgICAgIGxldCBsYXRlRCA9IDA7XG4gICAgICAgIGxldCBsb2FuRCA9IDA7XG4gICAgICAgIGxldCBwZW5EID0gMDtcbiAgICAgICAgbGV0IG90aGVyRCA9IDA7XG5cbiAgICAgICAgY3VycmVudExpc3QuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgIGlmIChpdGVtLnR5cGUgPT09IFwiQWJzZW5jZSBEZWR1Y3Rpb25cIikgYWJzRCArPSBpdGVtLmFtb3VudDtcbiAgICAgICAgICBlbHNlIGlmIChpdGVtLnR5cGUgPT09IFwiTGF0ZSBEZWR1Y3Rpb25cIikgbGF0ZUQgKz0gaXRlbS5hbW91bnQ7XG4gICAgICAgICAgZWxzZSBpZiAoaXRlbS50eXBlID09PSBcIkxvYW4gRGVkdWN0aW9uXCIpIGxvYW5EICs9IGl0ZW0uYW1vdW50O1xuICAgICAgICAgIGVsc2UgaWYgKGl0ZW0udHlwZSA9PT0gXCJQZW5hbHR5IERlZHVjdGlvblwiKSBwZW5EICs9IGl0ZW0uYW1vdW50O1xuICAgICAgICAgIGVsc2Ugb3RoZXJEICs9IGl0ZW0uYW1vdW50O1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBlbnRpdGxlbWVudHMgPSBOdW1iZXIoZW1wLmJhc2ljU2FsYXJ5IHx8IDApICtcbiAgICAgICAgICBOdW1iZXIoZW1wLmhvdXNpbmdBbGxvd2FuY2UgfHwgMCkgK1xuICAgICAgICAgIE51bWJlcihlbXAudHJhbnNwb3J0QWxsb3dhbmNlIHx8IDApICtcbiAgICAgICAgICBOdW1iZXIoZW1wLnBob25lQWxsb3dhbmNlIHx8IDApICtcbiAgICAgICAgICBOdW1iZXIoZW1wLmZvb2RBbGxvd2FuY2UgfHwgMCkgK1xuICAgICAgICAgIE51bWJlcihlbXAub3ZlcnRpbWVBbW91bnQgfHwgMCkgK1xuICAgICAgICAgIE51bWJlcihlbXAub3RoZXJBbGxvd2FuY2VzIHx8IDApO1xuXG4gICAgICAgIGNvbnN0IHRvdGFsRGVkdWN0aW9uc1N1bSA9IGFic0QgKyBsYXRlRCArIGxvYW5EICsgcGVuRCArIG90aGVyRDtcbiAgICAgICAgY29uc3QgbmV0ID0gZW50aXRsZW1lbnRzIC0gdG90YWxEZWR1Y3Rpb25zU3VtO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgLi4uZW1wLFxuICAgICAgICAgIGFic2VuY2VEZWR1Y3Rpb246IGFic0QsXG4gICAgICAgICAgbGF0ZURlZHVjdGlvbjogbGF0ZUQsXG4gICAgICAgICAgbG9hbnNEZWR1Y3Rpb246IGxvYW5ELFxuICAgICAgICAgIHBlbmFsdHlEZWR1Y3Rpb246IHBlbkQsXG4gICAgICAgICAgb3RoZXJEZWR1Y3Rpb25zOiBvdGhlckQsXG4gICAgICAgICAgdG90YWxEZWR1Y3Rpb25zOiB0b3RhbERlZHVjdGlvbnNTdW0sXG4gICAgICAgICAgbmV0U2FsYXJ5OiBuZXQsXG4gICAgICAgICAgZGVkdWN0aW9uc0xpc3Q6IGN1cnJlbnRMaXN0LFxuICAgICAgICB9O1xuICAgICAgfSk7XG5cbiAgICAgIC8vIFJlY2FsY3VsYXRlIG92ZXJhbGwgdG90YWxzXG4gICAgICBjb25zdCB0b3RhbEJhc2ljU2FsYXJ5ID0gdXBkYXRlZEVtcGxveWVlcy5yZWR1Y2UoKHN1bSwgaXRlbSkgPT4gc3VtICsgKGl0ZW0uYmFzaWNTYWxhcnkgfHwgMCksIDApO1xuICAgICAgY29uc3QgdG90YWxBbGxvd2FuY2VzID0gdXBkYXRlZEVtcGxveWVlcy5yZWR1Y2UoXG4gICAgICAgIChzdW0sIGl0ZW0pID0+XG4gICAgICAgICAgc3VtICtcbiAgICAgICAgICAoaXRlbS5ob3VzaW5nQWxsb3dhbmNlIHx8IDApICtcbiAgICAgICAgICAoaXRlbS50cmFuc3BvcnRBbGxvd2FuY2UgfHwgMCkgK1xuICAgICAgICAgIChpdGVtLnBob25lQWxsb3dhbmNlIHx8IDApICtcbiAgICAgICAgICAoaXRlbS5mb29kQWxsb3dhbmNlIHx8IDApICtcbiAgICAgICAgICAoaXRlbS5vdmVydGltZUFtb3VudCB8fCAwKSArXG4gICAgICAgICAgKGl0ZW0ub3RoZXJBbGxvd2FuY2VzIHx8IDApICtcbiAgICAgICAgICAoaXRlbS5tdWRkYWhBbW91bnQgfHwgMCksXG4gICAgICAgIDBcbiAgICAgICk7XG4gICAgICBjb25zdCB0b3RhbERlZHVjdGlvbnMgPSB1cGRhdGVkRW1wbG95ZWVzLnJlZHVjZSgoc3VtLCBpdGVtKSA9PiBzdW0gKyAoaXRlbS50b3RhbERlZHVjdGlvbnMgfHwgMCksIDApO1xuICAgICAgY29uc3QgdG90YWxOZXRTYWxhcnkgPSB1cGRhdGVkRW1wbG95ZWVzLnJlZHVjZSgoc3VtLCBpdGVtKSA9PiBzdW0gKyAoaXRlbS5uZXRTYWxhcnkgfHwgMCksIDApO1xuXG4gICAgICBjb25zdCB1cGRhdGVkUnVuOiBQYXlyb2xsUnVuID0ge1xuICAgICAgICAuLi5zZWxlY3RlZFJ1bixcbiAgICAgICAgZW1wbG95ZWVzOiB1cGRhdGVkRW1wbG95ZWVzLFxuICAgICAgICB0b3RhbEJhc2ljU2FsYXJ5LFxuICAgICAgICB0b3RhbEFsbG93YW5jZXMsXG4gICAgICAgIHRvdGFsRGVkdWN0aW9ucyxcbiAgICAgICAgdG90YWxOZXRTYWxhcnksXG4gICAgICB9O1xuXG4gICAgICAvLyBTYXZlIHRvIHNlcnZlclxuICAgICAgY29uc3Qgc2F2ZVJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3BheXJvbGxfcnVucy8ke3NlbGVjdGVkUnVuLmlkfWAsIHtcbiAgICAgICAgbWV0aG9kOiBcIlBVVFwiLFxuICAgICAgICBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHVwZGF0ZWRSdW4pLFxuICAgICAgfSk7XG5cbiAgICAgIGlmIChzYXZlUmVzLm9rKSB7XG4gICAgICAgIHNldFNlbGVjdGVkUnVuKHVwZGF0ZWRSdW4pO1xuICAgICAgICBzZXRQYXlyb2xsUnVucyhwYXlyb2xsUnVucy5tYXAoKHIpID0+IChyLmlkID09PSBzZWxlY3RlZFJ1bi5pZCA/IHVwZGF0ZWRSdW4gOiByKSkpO1xuICAgICAgICBcbiAgICAgICAgbG9nQWN0aW9uVG9BdWRpdCh7XG4gICAgICAgICAgYWN0aW9uOiBcItiq2K3Yr9mK2Ksg2KfYs9iq2YLYt9in2LnYp9iqINin2YTZhdmI2KfYsdivINin2YTYqNi02LHZitipXCIsXG4gICAgICAgICAgcGF5cm9sbFJ1bklkOiBzZWxlY3RlZFJ1bi5pZCxcbiAgICAgICAgICBub3RlczogYNil2LnYp9iv2Kkg2KrYrdiv2YrYqyDZiNmF2LLYp9mF2YbYqSDYrti12YjZhdin2Kog2KfZhNmF2YjYuNmB2YrZhiDZhdi5INin2YTZhdmI2KfYsdivINin2YTYqNi02LHZitipINmE2LTZh9ixICR7c2VsZWN0ZWRSdW4ubW9udGh9LSR7c2VsZWN0ZWRSdW4ueWVhcn1gLFxuICAgICAgICB9KTtcblxuICAgICAgICBzaG93VG9hc3QoXG4gICAgICAgICAgXCLinJMg2KrZhSDYqtit2K/ZitirINmI2YXYstin2YXZhtipINin2LPYqtmC2LfYp9i52KfYqiDYp9mE2YXZiNin2LHYryDYp9mE2KjYtNix2YrYqSDYqNmG2KzYp9itIVwiLFxuICAgICAgICAgIFwi4pyTIEhSIGRlZHVjdGlvbnMgcmVmcmVzaGVkIGFuZCBzeW5jaHJvbml6ZWQgc3VjY2Vzc2Z1bGx5IVwiLFxuICAgICAgICAgIFwic3VjY2Vzc1wiXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgdG8gc2F2ZSByZWZyZXNoZWQgcGF5cm9sbCBydW4gdG8gc2VydmVyXCIpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgIHNob3dUb2FzdChcbiAgICAgICAgXCLinYwg2YHYtNmEINiq2K3Yr9mK2Ksg2KfZhNin2LPYqtmC2LfYp9i52KfYqiDZhdmGINin2YTZhdmI2KfYsdivINin2YTYqNi02LHZitipLlwiLFxuICAgICAgICBcIuKdjCBcIiArIGUubWVzc2FnZSxcbiAgICAgICAgXCJlcnJvclwiXG4gICAgICApO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRMb2FkaW5nKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gUmVtb3ZlIGVtcGxveWVlIHJvdyBmcm9tIGRyYWZ0XG4gIGNvbnN0IGhhbmRsZVJlbW92ZUVtcGxveWVlUm93ID0gYXN5bmMgKGVtcGxveWVlSWQ6IHN0cmluZykgPT4ge1xuICAgIGlmICghc2VsZWN0ZWRSdW4pIHJldHVybjtcblxuICAgIGlmIChcbiAgICAgIHNlbGVjdGVkUnVuLnN0YXR1cyAhPT0gXCJEcmFmdFwiICYmXG4gICAgICBzZWxlY3RlZFJ1bi5zdGF0dXMgIT09IFwiTmVlZHMgTW9kaWZpY2F0aW9uXCIgJiZcbiAgICAgIHNlbGVjdGVkUnVuLnN0YXR1cyAhPT0gXCJVbmRlciBNb2RpZmljYXRpb25cIlxuICAgICkge1xuICAgICAgc2hvd1RvYXN0KFxuICAgICAgICBcIuKdjCDZhNinINmK2YXZg9mGINit2LDZgSDYp9mE2YXZiNi42YEg2KXZhNinINil2LDYpyDZg9in2YYg2KfZhNmF2LPZitixINmB2Yog2K3Yp9mE2Kkg2YXYs9mI2K/YqS5cIixcbiAgICAgICAgXCLinYwgQ2Fubm90IGRlbGV0ZSBlbXBsb3llZSB1bmxlc3MgcnVuIGlzIGluIGRyYWZ0IHN0YXRlLlwiLFxuICAgICAgICBcImVycm9yXCJcbiAgICAgICk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZEVtcGxveWVlcyA9IHNlbGVjdGVkUnVuLmVtcGxveWVlcz8uZmlsdGVyKChlKSA9PiBlLmlkICE9PSBlbXBsb3llZUlkKSB8fCBbXTtcblxuICAgIGNvbnN0IHRvdGFsQmFzaWNTYWxhcnkgPSB1cGRhdGVkRW1wbG95ZWVzLnJlZHVjZSgoc3VtLCBpdGVtKSA9PiBzdW0gKyAoaXRlbS5iYXNpY1NhbGFyeSB8fCAwKSwgMCk7XG4gICAgY29uc3QgdG90YWxBbGxvd2FuY2VzID0gdXBkYXRlZEVtcGxveWVlcy5yZWR1Y2UoXG4gICAgICAoc3VtLCBpdGVtKSA9PlxuICAgICAgICBzdW0gK1xuICAgICAgICAoaXRlbS5ob3VzaW5nQWxsb3dhbmNlIHx8IDApICtcbiAgICAgICAgKGl0ZW0udHJhbnNwb3J0QWxsb3dhbmNlIHx8IDApICtcbiAgICAgICAgKGl0ZW0ucGhvbmVBbGxvd2FuY2UgfHwgMCkgK1xuICAgICAgICAoaXRlbS5mb29kQWxsb3dhbmNlIHx8IDApICtcbiAgICAgICAgKGl0ZW0ub3ZlcnRpbWVBbW91bnQgfHwgMCkgK1xuICAgICAgICAoaXRlbS5vdGhlckFsbG93YW5jZXMgfHwgMCkgK1xuICAgICAgICAoaXRlbS5tdWRkYWhBbW91bnQgfHwgMCksXG4gICAgICAwXG4gICAgKTtcbiAgICBjb25zdCB0b3RhbERlZHVjdGlvbnMgPSB1cGRhdGVkRW1wbG95ZWVzLnJlZHVjZSgoc3VtLCBpdGVtKSA9PiBzdW0gKyAoaXRlbS50b3RhbERlZHVjdGlvbnMgfHwgMCksIDApO1xuICAgIGNvbnN0IHRvdGFsTmV0U2FsYXJ5ID0gdXBkYXRlZEVtcGxveWVlcy5yZWR1Y2UoKHN1bSwgaXRlbSkgPT4gc3VtICsgKGl0ZW0ubmV0U2FsYXJ5IHx8IDApLCAwKTtcblxuICAgIGNvbnN0IHVwZGF0ZWRSdW46IFBheXJvbGxSdW4gPSB7XG4gICAgICAuLi5zZWxlY3RlZFJ1bixcbiAgICAgIGVtcGxveWVlczogdXBkYXRlZEVtcGxveWVlcyxcbiAgICAgIHRvdGFsQmFzaWNTYWxhcnksXG4gICAgICB0b3RhbEFsbG93YW5jZXMsXG4gICAgICB0b3RhbERlZHVjdGlvbnMsXG4gICAgICB0b3RhbE5ldFNhbGFyeSxcbiAgICB9O1xuXG4gICAgdHJ5IHtcbiAgICAgIHNldExvYWRpbmcodHJ1ZSk7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgL2FwaS9wYXlyb2xsX3J1bnMvJHtzZWxlY3RlZFJ1bi5pZH1gLCB7XG4gICAgICAgIG1ldGhvZDogXCJQVVRcIixcbiAgICAgICAgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh1cGRhdGVkUnVuKSxcbiAgICAgIH0pO1xuXG4gICAgICBpZiAocmVzLm9rKSB7XG4gICAgICAgIHNldFNlbGVjdGVkUnVuKHVwZGF0ZWRSdW4pO1xuICAgICAgICBzZXRQYXlyb2xsUnVucyhwYXlyb2xsUnVucy5tYXAoKHIpID0+IChyLmlkID09PSBzZWxlY3RlZFJ1bi5pZCA/IHVwZGF0ZWRSdW4gOiByKSkpO1xuICAgICAgICBcbiAgICAgICAgbG9nQWN0aW9uVG9BdWRpdCh7XG4gICAgICAgICAgYWN0aW9uOiBcItit2LDZgSDZhdmI2LjZgSDZhdmGINin2YTZhdiz2YrYsVwiLFxuICAgICAgICAgIHBheXJvbGxSdW5JZDogc2VsZWN0ZWRSdW4uaWQsXG4gICAgICAgICAgbm90ZXM6IGDYqtmFINil2LLYp9mE2Kkg2KfZhNmF2YjYuNmBICR7ZW1wbG95ZWVJZH0g2YXZhiDZhdiz2YrYsSDYp9mE2LHYp9iq2KhgLFxuICAgICAgICB9KTtcblxuICAgICAgICBzaG93VG9hc3QoXG4gICAgICAgICAgXCLinJMg2KrZhSDYrdiw2YEg2KfZhNmF2YjYuNmBINmF2YYg2KfZhNmF2LPZitixINio2YbYrNin2K1cIixcbiAgICAgICAgICBcIuKckyBFbXBsb3llZSByZW1vdmVkIGZyb20gcGF5cm9sbCBydW4gc3VjY2Vzc2Z1bGx5XCIsXG4gICAgICAgICAgXCJzdWNjZXNzXCJcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byByZW1vdmUgZW1wbG95ZWUgb24gYmFja2VuZFwiKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICBzaG93VG9hc3QoXCLinYwg2YHYtNmEINi52YXZhNmK2Kkg2KfZhNit2LDZgVwiLCBcIuKdjCBcIiArIGUubWVzc2FnZSwgXCJlcnJvclwiKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuICBjb25zdCBoYW5kbGVTdWJtaXRGb3JSZXZpZXcgPSAoKSA9PiB7XG4gICAgdHJhbnNpdGlvblN0YXR1cyhcbiAgICAgIFwiUGVuZGluZyBSZXZpZXdcIixcbiAgICAgIFwi2KXYsdiz2KfZhCDZhNmE2YXYsdin2KzYudipXCIsXG4gICAgICBg2KrZhSDYpdix2LPYp9mEINmF2LPZitixINin2YTYsdmI2KfYqtioINix2YLZhSAke3NlbGVjdGVkUnVuPy5wYXlyb2xsTnVtYmVyfSDZhNmE2YXYsdin2KzYudipINmI2KfZhNiq2K/ZgtmK2YIg2KjZiNin2LPYt9ipINin2YTZhdit2KfYs9ioLmBcbiAgICApO1xuICB9O1xuXG4gIC8vIFN1Ym1pdCBNb2RpZmljYXRpb24gUmVxdWVzdHMgKFJldmlld2VyKVxuICBjb25zdCBoYW5kbGVSZXF1ZXN0TW9kaWZpY2F0aW9uc1N1Ym1pdCA9ICgpID0+IHtcbiAgICBpZiAoIW1vZFJlcXVlc3ROb3Rlcy50cmltKCkpIHJldHVybjtcblxuICAgIGNvbnN0IG5ld1JlcXVlc3Q6IFBheXJvbGxNb2RpZmljYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgaWQ6IGBSRVEtJHtEYXRlLm5vdygpfWAsXG4gICAgICBwYXlyb2xsUnVuSWQ6IHNlbGVjdGVkUnVuIS5pZCxcbiAgICAgIHJlcXVlc3RlZEJ5OiB1c2VyLnVzZXJuYW1lIHx8IFwiUmV2aWV3ZXJcIixcbiAgICAgIHJlcXVlc3RlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICBub3RlczogbW9kUmVxdWVzdE5vdGVzLFxuICAgICAgc3RhdHVzOiBcIk9wZW5cIixcbiAgICB9O1xuXG4gICAgY29uc3QgbmV3UmVxdWVzdHNMaXN0ID0gWy4uLnJ1bk1vZGlmaWNhdGlvblJlcXVlc3RzLCBuZXdSZXF1ZXN0XTtcbiAgICBzZXRSdW5Nb2RpZmljYXRpb25SZXF1ZXN0cyhuZXdSZXF1ZXN0c0xpc3QpO1xuXG4gICAgdHJhbnNpdGlvblN0YXR1cyhcbiAgICAgIFwiTmVlZHMgTW9kaWZpY2F0aW9uXCIsXG4gICAgICBcIti32YTYqCDYqti52K/ZitmE2KfYqiDYudmE2Ykg2KfZhNmF2LPZitixXCIsXG4gICAgICBg2LfZhNioINmF2LHYp9is2LnYqS/Yqti52K/ZitmEINmF2YYg2KfZhNmF2K/ZgtmCOiBcIiR7bW9kUmVxdWVzdE5vdGVzfVwiYCxcbiAgICAgIHtcbiAgICAgICAgbW9kaWZpY2F0aW9uUmVxdWVzdHM6IG5ld1JlcXVlc3RzTGlzdCxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgc2V0SXNNb2RSZXF1ZXN0TW9kYWxPcGVuKGZhbHNlKTtcbiAgICBzZXRNb2RSZXF1ZXN0Tm90ZXMoXCJcIik7XG4gIH07XG5cbiAgLy8gQ2xvc2Ugb3IgUmVzcG9uZCB0byBNb2RpZmljYXRpb24gUmVxdWVzdHNcbiAgY29uc3QgaGFuZGxlUmVzcG9uZFRvTW9kUmVxdWVzdFN1Ym1pdCA9ICgpID0+IHtcbiAgICBpZiAoIXNlbGVjdGVkUmVxdWVzdEZvclJlc3BvbnNlIHx8ICFtb2RSZXNwb25zZU5vdGVzLnRyaW0oKSkgcmV0dXJuO1xuXG4gICAgY29uc3QgdXBkYXRlZFJlcXVlc3RzID0gcnVuTW9kaWZpY2F0aW9uUmVxdWVzdHMubWFwKChyZXEpID0+IHtcbiAgICAgIGlmIChyZXEuaWQgPT09IHNlbGVjdGVkUmVxdWVzdEZvclJlc3BvbnNlLmlkKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgLi4ucmVxLFxuICAgICAgICAgIHN0YXR1czogbW9kUmVzcG9uc2VTdGF0dXMsXG4gICAgICAgICAgcmVzcG9uc2VOb3RlczogbW9kUmVzcG9uc2VOb3RlcyxcbiAgICAgICAgICByZXNwb25kZWRCeTogdXNlci51c2VybmFtZSxcbiAgICAgICAgICByZXNwb25kZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlcTtcbiAgICB9KTtcblxuICAgIHNldFJ1bk1vZGlmaWNhdGlvblJlcXVlc3RzKHVwZGF0ZWRSZXF1ZXN0cyk7XG5cbiAgICAvLyBEZXRlcm1pbmUgc3RhdHVzIG9mIGVudGlyZSBydW5cbiAgICBjb25zdCBoYXNBbnlPcGVuID0gdXBkYXRlZFJlcXVlc3RzLnNvbWUoKHIpID0+IHIuc3RhdHVzID09PSBcIk9wZW5cIik7XG4gICAgY29uc3QgbmV4dFJ1blN0YXR1czogUGF5cm9sbFJ1blN0YXR1cyA9IGhhc0FueU9wZW4gPyBcIlVuZGVyIE1vZGlmaWNhdGlvblwiIDogXCJSZXZpZXdlZFwiO1xuXG4gICAgdHJhbnNpdGlvblN0YXR1cyhcbiAgICAgIG5leHRSdW5TdGF0dXMsXG4gICAgICBcItin2YTYsdivINi52YTZiSDYt9mE2Kgg2KfZhNiq2LnYr9mK2YRcIixcbiAgICAgIGDYqtmFINiq2LPYrNmK2YQg2LHYryDYp9mE2YXYrdin2LPYqCDYudmE2Ykg2LfZhNioINin2YTYqti52K/ZitmEOiBcIiR7bW9kUmVzcG9uc2VOb3Rlc31cIiDYqNmC2YHZhCDYp9mE2K3Yp9mE2Kkg2YPZgCAoJHttb2RSZXNwb25zZVN0YXR1c30pYCxcbiAgICAgIHtcbiAgICAgICAgbW9kaWZpY2F0aW9uUmVxdWVzdHM6IHVwZGF0ZWRSZXF1ZXN0cyxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgc2V0SXNNb2RSZXNwb25zZU1vZGFsT3BlbihmYWxzZSk7XG4gICAgc2V0U2VsZWN0ZWRSZXF1ZXN0Rm9yUmVzcG9uc2UobnVsbCk7XG4gICAgc2V0TW9kUmVzcG9uc2VOb3RlcyhcIlwiKTtcbiAgfTtcblxuICAvLyBDb25maXJtIFJldmlldyAoUmV2aWV3ZXIgbG9ja3MgcmV2aWV3KVxuICBjb25zdCBoYW5kbGVDb25maXJtUmV2aWV3ID0gKCkgPT4ge1xuICAgIC8vIE1ha2Ugc3VyZSBhbGwgbW9kIHJlcXVlc3RzIGFyZSBjbG9zZWRcbiAgICBjb25zdCBvcGVuUmVxdWVzdHMgPSBydW5Nb2RpZmljYXRpb25SZXF1ZXN0cy5maWx0ZXIoKHIpID0+IHIuc3RhdHVzID09PSBcIk9wZW5cIik7XG4gICAgaWYgKG9wZW5SZXF1ZXN0cy5sZW5ndGggPiAwKSB7XG4gICAgICBzaG93VG9hc3QoXG4gICAgICAgIFwi4pqg77iPINmE2Kcg2YrZhdmD2YYg2KXYqtmF2KfZhSDYp9mE2YXYsdin2KzYudipINmI2KfZhNiq2K/ZgtmK2YIg2YTZiNis2YjYryDYt9mE2KjYp9iqINiq2LnYr9mK2YQg2YXYudmE2ZHZgtipINmI2YXZgdiq2YjYrdipIVwiLFxuICAgICAgICBcIuKaoO+4jyBDYW5ub3QgY29uZmlybSByZXZpZXcgYmVjYXVzZSB0aGVyZSBhcmUgb3BlbiBwZW5kaW5nIG1vZGlmaWNhdGlvbiByZXF1ZXN0cyFcIixcbiAgICAgICAgXCJlcnJvclwiXG4gICAgICApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyYW5zaXRpb25TdGF0dXMoXG4gICAgICBcIlBlbmRpbmcgRmluYWwgQXBwcm92YWxcIixcbiAgICAgIFwi2KrYo9mD2YrYryDZhdix2KfYrNi52Kkg2KfZhNmF2LPZitixXCIsXG4gICAgICBg2YLYp9mFINin2YTZhdix2KfYrNi5L9in2YTZhdiv2YLZgiDYqNiq2KPZg9mK2K8g2YjYp9i62YTYp9mCINmF2LHYp9is2LnYqSDZhdiz2YrYsSDYp9mE2LHZiNin2KrYqCDYqNin2YTZg9in2YXZhCDZiNis2KfZh9iy2YrYqtmHINmE2YTYp9i52KrZhdin2K8g2KfZhNmG2YfYp9im2YouYFxuICAgICk7XG4gIH07XG5cbiAgLy8gRmluYWwgQXBwcm92YWwgKEdlbmVyYWwgTWFuYWdlciAvIEF1dGhvcml6ZWQgQWRtaW4gbG9ja3MgdGhlIGVudGlyZSBydW4pXG4gIGNvbnN0IGhhbmRsZUZpbmFsQXBwcm92YWwgPSAoKSA9PiB7XG4gICAgdHJhbnNpdGlvblN0YXR1cyhcbiAgICAgIFwiQXBwcm92ZWRcIixcbiAgICAgIFwi2KfZhNin2LnYqtmF2KfYryDYp9mE2YbZh9in2KbZiiDZhNmE2YXYs9mK2LFcIixcbiAgICAgIGDYqtmFINin2YTYp9i52KrZhdin2K8g2KfZhNmF2KfZhNmKINin2YTZhtmH2KfYptmKINmI2KfZhNmC2LfYudmKINmE2YXYs9mK2LEg2KfZhNix2YjYp9iq2Kgg2KjZiNin2LPYt9ipINin2YTYpdiv2KfYsdipINin2YTYudmE2YrYpyDZiNi12KfYrdioINin2YTYtdmE2KfYrdmK2KkuYCxcbiAgICAgIHtcbiAgICAgICAgYXBwcm92ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICBhcHByb3ZlZEJ5OiB1c2VyLnVzZXJuYW1lLFxuICAgICAgfVxuICAgICk7XG4gIH07XG5cbiAgLy8gUmVnaXN0ZXIgVHJhbnNmZXIgRGV0YWlsc1xuICBjb25zdCBoYW5kbGVSZWdpc3RlclRyYW5zZmVyU3VibWl0ID0gKGU6IFJlYWN0LkZvcm1FdmVudCkgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBpZiAoIXRyYW5zZmVyRm9ybS5yZWZlcmVuY2VOdW1iZXIudHJpbSgpKSB7XG4gICAgICBzaG93VG9hc3QoXCLimqDvuI8g2YrYsdis2Ykg2KXYr9iu2KfZhCDYsdmC2YUg2KfZhNmF2LHYrNi5INin2YTZhdi12LHZgdmKINmE2KrZiNir2YrZgiDYp9mE2K3ZiNin2YTYqSFcIiwgXCLimqDvuI8gQmFuayByZWZlcmVuY2UgbnVtYmVyIGlzIHJlcXVpcmVkIVwiLCBcImVycm9yXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyYW5zaXRpb25TdGF0dXMoXG4gICAgICBcIlRyYW5zZmVycmVkXCIsXG4gICAgICBcItiq2LPYrNmK2YQg2KrYrdmI2YrZhCDYp9mE2LHZiNin2KrYqFwiLFxuICAgICAgYNiq2YUg2KrZiNir2YrZgiDYqtit2YjZitmEINin2YTYsdmI2KfYqtioINmE2YTZhdi12LHZgSDYqNmF2LHYrNi5INit2YjYp9mE2Kkg2LHZgtmFICgke3RyYW5zZmVyRm9ybS5yZWZlcmVuY2VOdW1iZXJ9KSDYudmE2Ykg2KfZhNio2YbZgyAoJHt0cmFuc2ZlckZvcm0uYmFua05hbWV9KSDYqNiq2KfYsdmK2K4gJHt0cmFuc2ZlckZvcm0udHJhbnNmZXJEYXRlfS5gLFxuICAgICAge1xuICAgICAgICB0cmFuc2ZlcnJlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIHRyYW5zZmVycmVkQnk6IHVzZXIudXNlcm5hbWUsXG4gICAgICAgIHRyYW5zZmVyRGV0YWlsczoge1xuICAgICAgICAgIGJhbmtOYW1lOiB0cmFuc2ZlckZvcm0uYmFua05hbWUsXG4gICAgICAgICAgcmVmZXJlbmNlTnVtYmVyOiB0cmFuc2ZlckZvcm0ucmVmZXJlbmNlTnVtYmVyLFxuICAgICAgICAgIHRyYW5zZmVyRGF0ZTogdHJhbnNmZXJGb3JtLnRyYW5zZmVyRGF0ZSxcbiAgICAgICAgICBub3RlczogdHJhbnNmZXJGb3JtLm5vdGVzLFxuICAgICAgICB9LFxuICAgICAgfVxuICAgICk7XG5cbiAgICBzZXRJc1RyYW5zZmVyTW9kYWxPcGVuKGZhbHNlKTtcbiAgfTtcblxuICAvLyBGaWx0ZXJzIGFwcGxpY2F0aW9uXG4gIGNvbnN0IGZpbHRlcmVkUnVucyA9IHBheXJvbGxSdW5zLmZpbHRlcigocnVuKSA9PiB7XG4gICAgLy8gMS4gU3RyaWN0IFNvZnQgRGVsZXRlIEZpbHRlclxuICAgIGlmIChydW4uaXNEZWxldGVkKSByZXR1cm4gZmFsc2U7XG5cbiAgICBjb25zdCBxdWVyeSA9IHNlYXJjaFF1ZXJ5LnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICAgIGNvbnN0IG1hdGNoZXNTZWFyY2ggPVxuICAgICAgcnVuLnBheXJvbGxOdW1iZXIudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxdWVyeSkgfHxcbiAgICAgIChydW4ubm90ZXMgJiYgcnVuLm5vdGVzLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocXVlcnkpKSB8fFxuICAgICAgcnVuLmRlcGFydG1lbnQudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxdWVyeSk7XG5cbiAgICBjb25zdCBtYXRjaGVzWWVhciA9IGZpbHRlclllYXIgPT09IFwiYWxsXCIgfHwgcnVuLnllYXIudG9TdHJpbmcoKSA9PT0gZmlsdGVyWWVhcjtcbiAgICBjb25zdCBtYXRjaGVzTW9udGggPSBmaWx0ZXJNb250aCA9PT0gXCJhbGxcIiB8fCBydW4ubW9udGgudG9TdHJpbmcoKSA9PT0gZmlsdGVyTW9udGg7XG4gICAgY29uc3QgbWF0Y2hlc0RlcHQgPSBmaWx0ZXJEZXB0ID09PSBcImFsbFwiIHx8IHJ1bi5kZXBhcnRtZW50ID09PSBmaWx0ZXJEZXB0O1xuXG4gICAgLy8gMi4gU3RyaWN0IFRhYiBXb3JrZmxvd3NcbiAgICBsZXQgbWF0Y2hlc1RhYiA9IHRydWU7XG4gICAgaWYgKGFjdGl2ZVRhYiA9PT0gXCJkcmFmdHNcIikge1xuICAgICAgbWF0Y2hlc1RhYiA9IFtcIkRyYWZ0XCIsIFwiTmVlZHMgTW9kaWZpY2F0aW9uXCIsIFwiVW5kZXIgTW9kaWZpY2F0aW9uXCJdLmluY2x1ZGVzKHJ1bi5zdGF0dXMpO1xuICAgIH0gZWxzZSBpZiAoYWN0aXZlVGFiID09PSBcInBlbmRpbmdcIikge1xuICAgICAgbWF0Y2hlc1RhYiA9IFtcIlBlbmRpbmcgUmV2aWV3XCIsIFwiUmV2aWV3ZWRcIl0uaW5jbHVkZXMocnVuLnN0YXR1cyk7XG4gICAgfSBlbHNlIGlmIChhY3RpdmVUYWIgPT09IFwiYXBwcm92ZWRcIikge1xuICAgICAgbWF0Y2hlc1RhYiA9IFtcIkFwcHJvdmVkXCIsIFwiUGVuZGluZyBGaW5hbCBBcHByb3ZhbFwiXS5pbmNsdWRlcyhydW4uc3RhdHVzKTtcbiAgICB9IGVsc2UgaWYgKGFjdGl2ZVRhYiA9PT0gXCJwYWlkXCIpIHtcbiAgICAgIG1hdGNoZXNUYWIgPSBbXCJUcmFuc2ZlcnJlZFwiLCBcIlBhaWRcIiwgXCJQYXJ0aWFsbHkgUGFpZFwiXS5pbmNsdWRlcyhydW4uc3RhdHVzKTtcbiAgICB9IGVsc2UgaWYgKGFjdGl2ZVRhYiA9PT0gXCJhbGxcIikge1xuICAgICAgbWF0Y2hlc1RhYiA9IHRydWU7IC8vIEFsbCBhY3RpdmUvYXJjaGl2ZWQgcnVuc1xuICAgIH1cblxuICAgIHJldHVybiBtYXRjaGVzU2VhcmNoICYmIG1hdGNoZXNZZWFyICYmIG1hdGNoZXNNb250aCAmJiBtYXRjaGVzRGVwdCAmJiBtYXRjaGVzVGFiO1xuICB9KTtcblxuICAvLyBEZXBhcnRtZW50cyBsaXN0IGZvciBmaWx0ZXJcbiAgY29uc3QgZGVwYXJ0bWVudHMgPSBBcnJheS5mcm9tKG5ldyBTZXQoZW1wbG95ZWVzLm1hcCgoZSkgPT4gZS5kZXBhcnRtZW50KSkpLmZpbHRlcihCb29sZWFuKTtcblxuICAvLyBNb250aCBUcmFuc2xhdGlvblxuICBjb25zdCBnZXRNb250aE5hbWUgPSAobTogbnVtYmVyKSA9PiB7XG4gICAgY29uc3QgbW9udGhzQXIgPSBbXG4gICAgICBcItmK2YbYp9mK2LEgKDAxKVwiLFxuICAgICAgXCLZgdio2LHYp9mK2LEgKDAyKVwiLFxuICAgICAgXCLZhdin2LHYsyAoMDMpXCIsXG4gICAgICBcItij2KjYsdmK2YQgKDA0KVwiLFxuICAgICAgXCLZhdin2YrZiCAoMDUpXCIsXG4gICAgICBcItmK2YjZhtmK2YggKDA2KVwiLFxuICAgICAgXCLZitmI2YTZitmIICgwNylcIixcbiAgICAgIFwi2KPYutiz2LfYsyAoMDgpXCIsXG4gICAgICBcItiz2KjYqtmF2KjYsSAoMDkpXCIsXG4gICAgICBcItij2YPYqtmI2KjYsSAoMTApXCIsXG4gICAgICBcItmG2YjZgdmF2KjYsSAoMTEpXCIsXG4gICAgICBcItiv2YrYs9mF2KjYsSAoMTIpXCIsXG4gICAgXTtcbiAgICByZXR1cm4gbW9udGhzQXJbbSAtIDFdIHx8IG0udG9TdHJpbmcoKTtcbiAgfTtcblxuICBjb25zdCBnZXRTdGF0dXNCYWRnZSA9IChzdGF0dXM6IFBheXJvbGxSdW5TdGF0dXMpID0+IHtcbiAgICBzd2l0Y2ggKHN0YXR1cykge1xuICAgICAgY2FzZSBcIkRyYWZ0XCI6XG4gICAgICAgIHJldHVybiA8c3BhbiBjbGFzc05hbWU9XCJiZy1zbGF0ZS0xMDAgdGV4dC1zbGF0ZS03MDAgcHgtMi41IHB5LTEgcm91bmRlZC1mdWxsIHRleHQtWzExcHhdIGZvbnQtYmxhY2sgYm9yZGVyIHctZnVsbCBibG9jayB3aGl0ZXNwYWNlLW5vd3JhcCB0ZXh0LWNlbnRlciBib3JkZXItc2xhdGUtMzAwXCI+2YXYs9mI2K/YqSDwn5OCPC9zcGFuPjtcbiAgICAgIGNhc2UgXCJQZW5kaW5nIFJldmlld1wiOlxuICAgICAgICByZXR1cm4gPHNwYW4gY2xhc3NOYW1lPVwiYmctYW1iZXItNTAgdGV4dC1hbWJlci03MDAgcHgtMi41IHB5LTEgcm91bmRlZC1mdWxsIHRleHQtWzExcHhdIGZvbnQtYmxhY2sgYm9yZGVyIHctZnVsbCBibG9jayB3aGl0ZXNwYWNlLW5vd3JhcCB0ZXh0LWNlbnRlciBib3JkZXItYW1iZXItMzUwIGFuaW1hdGUtcHVsc2VcIj7ZgtmK2K8g2KfZhNmF2LHYp9is2LnYqSDwn5SNPC9zcGFuPjtcbiAgICAgIGNhc2UgXCJOZWVkcyBNb2RpZmljYXRpb25cIjpcbiAgICAgICAgcmV0dXJuIDxzcGFuIGNsYXNzTmFtZT1cImJnLXJvc2UtNTAgdGV4dC1yb3NlLTcwMCBweC0yLjUgcHktMSByb3VuZGVkLWZ1bGwgdGV4dC1bMTFweF0gZm9udC1ibGFjayBib3JkZXIgdy1mdWxsIGJsb2NrIHdoaXRlc3BhY2Utbm93cmFwIHRleHQtY2VudGVyIGJvcmRlci1yb3NlLTMwMCBhbmltYXRlLWJvdW5jZVwiPti32YTYqCDYqti52K/ZitmEIOKaoO+4jzwvc3Bhbj47XG4gICAgICBjYXNlIFwiVW5kZXIgTW9kaWZpY2F0aW9uXCI6XG4gICAgICAgIHJldHVybiA8c3BhbiBjbGFzc05hbWU9XCJiZy1vcmFuZ2UtNTAgdGV4dC1vcmFuZ2UtNzAwIHB4LTIuNSBweS0xIHJvdW5kZWQtZnVsbCB0ZXh0LVsxMXB4XSBmb250LWJsYWNrIGJvcmRlciB3LWZ1bGwgYmxvY2sgd2hpdGVzcGFjZS1ub3dyYXAgdGV4dC1jZW50ZXIgYm9yZGVyLW9yYW5nZS0zMDBcIj7YrNin2LHZiiDYp9mE2KrYudiv2YrZhCDwn5ug77iPPC9zcGFuPjtcbiAgICAgIGNhc2UgXCJSZXZpZXdlZFwiOlxuICAgICAgICByZXR1cm4gPHNwYW4gY2xhc3NOYW1lPVwiYmctYmx1ZS01MCB0ZXh0LWJsdWUtNzAwIHB4LTIuNSBweS0xIHJvdW5kZWQtZnVsbCB0ZXh0LVsxMXB4XSBmb250LWJsYWNrIGJvcmRlciB3LWZ1bGwgYmxvY2sgd2hpdGVzcGFjZS1ub3dyYXAgdGV4dC1jZW50ZXIgYm9yZGVyLWJsdWUtMzAwXCI+2KrZhdiqINin2YTZhdix2KfYrNi52Kkg4pyTPC9zcGFuPjtcbiAgICAgIGNhc2UgXCJQZW5kaW5nIEZpbmFsIEFwcHJvdmFsXCI6XG4gICAgICAgIHJldHVybiA8c3BhbiBjbGFzc05hbWU9XCJiZy1jeWFuLTUwIHRleHQtY3lhbi03MDAgcHgtMi41IHB5LTEgcm91bmRlZC1mdWxsIHRleHQtWzExcHhdIGZvbnQtYmxhY2sgYm9yZGVyIHctZnVsbCBibG9jayB3aGl0ZXNwYWNlLW5vd3JhcCB0ZXh0LWNlbnRlciBib3JkZXItY3lhbi0zMDAgYW5pbWF0ZS1wdWxzZVwiPtio2KfZhtiq2LjYp9ixINin2YTYp9i52KrZhdin2K8g4o+zPC9zcGFuPjtcbiAgICAgIGNhc2UgXCJBcHByb3ZlZFwiOlxuICAgICAgICByZXR1cm4gPHNwYW4gY2xhc3NOYW1lPVwiYmctZW1lcmFsZC01MCB0ZXh0LWVtZXJhbGQtNzAwIHB4LTIuNSBweS0xIHJvdW5kZWQtZnVsbCB0ZXh0LVsxMXB4XSBmb250LWJsYWNrIGJvcmRlciB3LWZ1bGwgYmxvY2sgd2hpdGVzcGFjZS1ub3dyYXAgdGV4dC1jZW50ZXIgYm9yZGVyLWVtZXJhbGQtMzAwXCI+2YXYudiq2YXYryDZhtmH2KfYptmK2KfZiyDwn5GRPC9zcGFuPjtcbiAgICAgIGNhc2UgXCJUcmFuc2ZlcnJlZFwiOlxuICAgICAgICByZXR1cm4gPHNwYW4gY2xhc3NOYW1lPVwiYmctcHVycGxlLTEwMCB0ZXh0LXB1cnBsZS04NTAgcHgtMi41IHB5LTEgcm91bmRlZC1mdWxsIHRleHQtWzExcHhdIGZvbnQtYmxhY2sgYm9yZGVyIHctZnVsbCBibG9jayB3aGl0ZXNwYWNlLW5vd3JhcCB0ZXh0LWNlbnRlciBib3JkZXItcHVycGxlLTMwMFwiPtiq2YUg2KfZhNiq2K3ZiNmK2YQg2KjZhtis2KfYrSDwn5K4PC9zcGFuPjtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiA8c3BhbiBjbGFzc05hbWU9XCJiZy1zbGF0ZS0xMDAgdGV4dC1zbGF0ZS02MDAgcHgtMi41IHB5LTEgcm91bmRlZC1mdWxsIHRleHQtWzExcHhdIGZvbnQtYm9sZFwiPntzdGF0dXN9PC9zcGFuPjtcbiAgICB9XG4gIH07XG5cbiAgLy8gT3BlbiBPdmVydGltZSBob3VycyBlbnRyeVxuICBjb25zdCB1cGRhdGVIb3VybHlPdEFtb3VudCA9IChob3VyczogbnVtYmVyLCBiYXNlU2FsYXJ5OiBudW1iZXIpID0+IHtcbiAgICAvLyBTYXVkaSBMYWJvciBMYXcgb3ZlcnRpbWUgZm9ybXVsYTogSG91cmx5IHJhdGUgPSAoQmFzaWMgU2FsYXJ5IC8gMzApIC8gOC5cbiAgICAvLyBPdmVydGltZSBjb21wZW5zYXRpb24gPSBIb3VybHkgcmF0ZSAqIGhvdXJzICogMS41LlxuICAgIGNvbnN0IGhvdXJseVJhdGUgPSAoYmFzZVNhbGFyeSAvIDMwKSAvIDg7XG4gICAgY29uc3Qgb3RQYXkgPSBob3VybHlSYXRlICogaG91cnMgKiAxLjU7XG4gICAgcmV0dXJuIE1hdGgucm91bmQob3RQYXkgKiAxMDApIC8gMTAwO1xuICB9O1xuXG5cbiAgY29uc3QgaGFuZGxlRXhwb3J0UGF5c2xpcFBERiA9ICgpID0+IHtcbiAgICBpZiAoIXNlbGVjdGVkUGF5c2xpcEVtcGxveWVlIHx8ICFzZWxlY3RlZFJ1bikgcmV0dXJuO1xuXG4gICAgLy8gVXNlIHRoZSBzYW1lIGh0bWxDb250ZW50IGJ1dCBwYXNzIGl0IHRvIGh0bWwycGRmXG4gICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgLy8gV2UgZHVwbGljYXRlIHRoZSBIVE1MIHdpdGhvdXQgaHRtbC9ib2R5IHRhZ3MgdG8gcmVuZGVyIGl0XG4gICAgZWxlbWVudC5pbm5lckhUTUwgPSBgXG4gICAgICA8c3R5bGU+XG4gICAgQGltcG9ydCB1cmwoJ2h0dHBzOi8vZm9udHMuY2RuZm9udHMuY29tL2Nzcy9nZS1zcy10d28nKTtcbiAgICBAaW1wb3J0IHVybCgnaHR0cHM6Ly9mb250cy5jZG5mb250cy5jb20vY3NzL2dvdGhhbS1wcm8nKTtcbiAgPC9zdHlsZT5cbiAgPGRpdiBzdHlsZT1cImZvbnQtZmFtaWx5OiAnR0UgU1MnLCAnR0UgU1MgVHdvJywgJ0dFIFNTIFR3bycsICdHb3RoYW0gUHJvJywgc2Fucy1zZXJpZjsgZGlyZWN0aW9uOiBydGw7IHBhZGRpbmc6IDIwcHg7IGNvbG9yOiAjMGYxNzJhOyBtYXgtd2lkdGg6IDgwMHB4OyBtYXJnaW46IDAgYXV0bzsgYmFja2dyb3VuZDogd2hpdGU7XCI+XG4gICAgICAgIDxkaXYgc3R5bGU9XCJkaXNwbGF5OiBmbGV4OyBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47IGJvcmRlci1ib3R0b206IDNweCBzb2xpZCAjMDA3MkJDOyBwYWRkaW5nLWJvdHRvbTogMjBweDsgbWFyZ2luLWJvdHRvbTogMjBweDtcIj5cbiAgICAgICAgICA8ZGl2IHN0eWxlPVwiZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsgZ2FwOiAxNXB4O1wiPlxuICAgIDxpbWcgc3JjPVwiaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0hFNDZJcnliY0FBTXE3TD9mb3JtYXQ9cG5nJm5hbWU9c21hbGxcIiByZWZlcnJlcnBvbGljeT1cIm5vLXJlZmVycmVyXCIgYWx0PVwiRm9ub3VuIEFsd2FsZWVkIExvZ29cIiBzdHlsZT1cIndpZHRoOiA4MHB4OyBoZWlnaHQ6IDgwcHg7IG9iamVjdC1maXQ6IGNvbnRhaW47XCIgLz5cbiAgICA8ZGl2PlxuICAgICAgPGgxIHN0eWxlPVwiY29sb3I6ICMwMDcyQkM7IG1hcmdpbjogMDsgZm9udC1zaXplOiAyNHB4OyBmb250LXdlaWdodDogOTAwO1wiPti02LHZg9ipINmB2YbZiNmGINin2YTZiNmE2YrYryDZhNmE2LXZhtin2LnYqTwvaDE+XG4gICAgICAgICAgICA8cCBzdHlsZT1cIm1hcmdpbjogNXB4IDAgMCAwOyBjb2xvcjogIzY0NzQ4YjsgZm9udC1zaXplOiAxNHB4O1wiPtmF2LPZitixINix2YjYp9iq2Kgg2YXZiNi42YHZiiDZiNi52YXYp9mEINin2YTZhdi12YbYuTwvcD5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBzdHlsZT1cInRleHQtYWxpZ246IGxlZnQ7XCI+XG4gICAgICAgICAgICA8aDIgc3R5bGU9XCJtYXJnaW46IDA7IGZvbnQtc2l6ZTogMjBweDsgY29sb3I6ICMwZjE3MmE7XCI+2YPYtNmBINix2KfYqtioINmF2YjYuNmBIChQYXlzbGlwKTwvaDI+XG4gICAgICAgICAgICA8ZGl2IHN0eWxlPVwiZm9udC1zaXplOiAxNHB4OyBjb2xvcjogIzY0NzQ4YjsgbWFyZ2luLXRvcDo0cHg7XCI+2LTZh9ixICR7c2VsZWN0ZWRSdW4ubW9udGh9IC0gJHtzZWxlY3RlZFJ1bi55ZWFyfTwvZGl2PlxuICAgICAgICAgICAgPGRpdiBzdHlsZT1cImZvbnQtc2l6ZTogMTFweDsgY29sb3I6ICM2NDc0OGI7IG1hcmdpbi10b3A6NHB4O1wiPtmD2YjYryDYp9mE2YXYs9mK2LE6ICR7c2VsZWN0ZWRSdW4/LnBheXJvbGxOdW1iZXJ9PC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgc3R5bGU9XCJkaXNwbGF5OiBncmlkOyBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IDFmciAxZnI7IGdhcDogMjBweDsgbWFyZ2luLWJvdHRvbTogMzBweDsgZm9udC1zaXplOiAxM3B4OyBsaW5lLWhlaWdodDogMS44O1wiPlxuICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICA8ZGl2PjxzdHJvbmc+2KfYs9mFINin2YTZhdmI2LjZgTo8L3N0cm9uZz4gPHNwYW4gc3R5bGU9XCJjb2xvcjogIzBmMTcyYTsgZm9udC13ZWlnaHQ6IDkwMDtcIj4ke3NlbGVjdGVkUGF5c2xpcEVtcGxveWVlLmFyYWJpY05hbWV9PC9zcGFuPjwvZGl2PlxuICAgICAgICAgICAgPGRpdj48c3Ryb25nPtin2YTZhdiz2YXZiSDYp9mE2YjYuNmK2YHZijo8L3N0cm9uZz4gJHtzZWxlY3RlZFBheXNsaXBFbXBsb3llZS5qb2JUaXRsZX08L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+PHN0cm9uZz7YsdmC2YUg2KfZhNmH2YjZitipIC8g2KfZhNil2YLYp9mF2Kk6PC9zdHJvbmc+ICR7c2VsZWN0ZWRQYXlzbGlwRW1wbG95ZWUuaXFhbWFJZH08L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+PHN0cm9uZz7Yp9mE2YLYs9mFIC8g2KfZhNmI2LHYtNipOjwvc3Ryb25nPiAke3NlbGVjdGVkUGF5c2xpcEVtcGxveWVlLmRlcGFydG1lbnR9PC9kaXY+XG4gICAgICAgICAgICA8ZGl2PjxzdHJvbmc+2KfYs9mFINin2YTYqNmG2YMg2YjYp9mE2YHYsdi5Ojwvc3Ryb25nPiAke3NlbGVjdGVkUGF5c2xpcEVtcGxveWVlLmJhbmtOYW1lIHx8IChzZWxlY3RlZFBheXNsaXBFbXBsb3llZS5iYW5rSW5mbyAmJiBzZWxlY3RlZFBheXNsaXBFbXBsb3llZS5iYW5rSW5mby5iYW5rTmFtZSkgfHwgXCJcIn08L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+PHN0cm9uZz7Yp9mE2K3Ys9in2Kgg2KfZhNiv2YjZhNmKIChJQkFOKTo8L3N0cm9uZz4gPHNwYW4gc3R5bGU9XCJmb250LWZhbWlseTogJ0dvdGhhbSBQcm8nLCBzYW5zLXNlcmlmOyBmb250LXdlaWdodDogOTAwO1wiPiR7c2VsZWN0ZWRQYXlzbGlwRW1wbG95ZWUuaWJhbiB8fCAoc2VsZWN0ZWRQYXlzbGlwRW1wbG95ZWUuYmFua0luZm8gJiYgc2VsZWN0ZWRQYXlzbGlwRW1wbG95ZWUuYmFua0luZm8uaWJhbikgfHwgXCJcIn08L3NwYW4+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2PjxzdHJvbmc+2LHZgtmFINin2YTYrdiz2KfYqDo8L3N0cm9uZz4gPHNwYW4gc3R5bGU9XCJmb250LWZhbWlseTogJ0dvdGhhbSBQcm8nLCBzYW5zLXNlcmlmOyBmb250LXdlaWdodDogOTAwO1wiPiR7c2VsZWN0ZWRQYXlzbGlwRW1wbG95ZWUuYWNjb3VudE51bWJlciB8fCAoc2VsZWN0ZWRQYXlzbGlwRW1wbG95ZWUuYmFua0luZm8gJiYgc2VsZWN0ZWRQYXlzbGlwRW1wbG95ZWUuYmFua0luZm8uYWNjb3VudE51bWJlcikgfHwgXCJcIn08L3NwYW4+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2PjxzdHJvbmc+2LHZhdiyINin2YTYs9mI2YrZgdiqIChTV0lGVCk6PC9zdHJvbmc+IDxzcGFuIHN0eWxlPVwiZm9udC1mYW1pbHk6ICdHb3RoYW0gUHJvJywgc2Fucy1zZXJpZjsgZm9udC13ZWlnaHQ6IDkwMDtcIj4ke3NlbGVjdGVkUGF5c2xpcEVtcGxveWVlLnN3aWZ0Q29kZSB8fCAoc2VsZWN0ZWRQYXlzbGlwRW1wbG95ZWUuYmFua0luZm8gJiYgc2VsZWN0ZWRQYXlzbGlwRW1wbG95ZWUuYmFua0luZm8uc3dpZnRDb2RlKSB8fCBcIlwifTwvc3Bhbj48L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+PHN0cm9uZz7Yt9ix2YrZgtipINin2YTYqtit2YjZitmEINin2YTZhdin2YTZijo8L3N0cm9uZz4gJHtzZWxlY3RlZFBheXNsaXBFbXBsb3llZS50cmFuc2Zlck1ldGhvZCB8fCAoc2VsZWN0ZWRQYXlzbGlwRW1wbG95ZWUuYmFua0luZm8gJiYgc2VsZWN0ZWRQYXlzbGlwRW1wbG95ZWUuYmFua0luZm8udHJhbnNmZXJNZXRob2QpIHx8IFwiXCJ9PC9kaXY+XG4gICAgICAgICAgICA8ZGl2PjxzdHJvbmc+2KfYs9mFINi12KfYrdioINin2YTYrdiz2KfYqDo8L3N0cm9uZz4gJHtzZWxlY3RlZFBheXNsaXBFbXBsb3llZS5hY2NvdW50SG9sZGVyTmFtZSB8fCAoc2VsZWN0ZWRQYXlzbGlwRW1wbG95ZWUuYmFua0luZm8gJiYgc2VsZWN0ZWRQYXlzbGlwRW1wbG95ZWUuYmFua0luZm8uYWNjb3VudEhvbGRlck5hbWUpIHx8IHNlbGVjdGVkUGF5c2xpcEVtcGxveWVlLmFyYWJpY05hbWUgfHwgXCJcIn08L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+PHN0cm9uZz7Yqtin2LHZitiuINin2YTYt9io2KfYudipOjwvc3Ryb25nPiAke25ldyBEYXRlKCkudG9Mb2NhbGVEYXRlU3RyaW5nKCdlbi1VUycpfTwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8dGFibGUgc3R5bGU9XCJ3aWR0aDogMTAwJTsgYm9yZGVyLWNvbGxhcHNlOiBjb2xsYXBzZTsgbWFyZ2luLWJvdHRvbTogNDBweDsgZm9udC1zaXplOiAxM3B4O1wiPlxuICAgICAgICAgIDx0aGVhZD5cbiAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgPHRoIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjogIzAwNzJCQzsgY29sb3I6IHdoaXRlOyBwYWRkaW5nOiAxMnB4OyBib3JkZXI6IDFweCBzb2xpZCAjY2JkNWUxOyB0ZXh0LWFsaWduOiByaWdodDtcIj7Yp9mE2KfYs9iq2K3Zgtin2YLYp9iqIChFYXJuaW5ncyk8L3RoPlxuICAgICAgICAgICAgICA8dGggc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOiAjMDA3MkJDOyBjb2xvcjogd2hpdGU7IHBhZGRpbmc6IDEycHg7IGJvcmRlcjogMXB4IHNvbGlkICNjYmQ1ZTE7IHRleHQtYWxpZ246IHJpZ2h0O1wiPtin2YTZhdio2YTYuiAo2LEu2LMpPC90aD5cbiAgICAgICAgICAgICAgPHRoIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjogI2JlMTIzYzsgY29sb3I6IHdoaXRlOyBwYWRkaW5nOiAxMnB4OyBib3JkZXI6IDFweCBzb2xpZCAjY2JkNWUxOyB0ZXh0LWFsaWduOiByaWdodDtcIj7Yp9mE2KfYs9iq2YLYt9in2LnYp9iqIChEZWR1Y3Rpb25zKTwvdGg+XG4gICAgICAgICAgICAgIDx0aCBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6ICNiZTEyM2M7IGNvbG9yOiB3aGl0ZTsgcGFkZGluZzogMTJweDsgYm9yZGVyOiAxcHggc29saWQgI2NiZDVlMTsgdGV4dC1hbGlnbjogcmlnaHQ7XCI+2KfZhNmF2KjZhNi6ICjYsS7Ysyk8L3RoPlxuICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICA8L3RoZWFkPlxuICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgPHRkIHN0eWxlPVwiYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNlMmU4ZjA7IHBhZGRpbmc6IDEycHg7IGJvcmRlcjogMXB4IHNvbGlkICNjYmQ1ZTE7XCI+2KfZhNix2KfYqtioINin2YTYo9iz2KfYs9mKINin2YTZhdiz2KrYrdmCPC90ZD5cbiAgICAgICAgICAgICAgPHRkIHN0eWxlPVwiYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNlMmU4ZjA7IHBhZGRpbmc6IDEycHg7IGJvcmRlcjogMXB4IHNvbGlkICNjYmQ1ZTE7IGZvbnQtZmFtaWx5OiAnR290aGFtIFBybycsIHNhbnMtc2VyaWY7IGZvbnQtd2VpZ2h0OiA5MDA7XCI+JHtzZWxlY3RlZFBheXNsaXBFbXBsb3llZS5iYXNpY1NhbGFyeS50b0xvY2FsZVN0cmluZygnZW4tVVMnKX08L3RkPlxuICAgICAgICAgICAgICA8dGQgc3R5bGU9XCJib3JkZXItYm90dG9tOiAxcHggc29saWQgI2UyZThmMDsgcGFkZGluZzogMTJweDsgYm9yZGVyOiAxcHggc29saWQgI2NiZDVlMTtcIj7Yp9iz2KrZgti32KfYuSDYp9mE2LPZhNmBINin2YTZhdin2YTZitipINmI2KfZhNi52YfZiNivPC90ZD5cbiAgICAgICAgICAgICAgPHRkIHN0eWxlPVwiYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNlMmU4ZjA7IHBhZGRpbmc6IDEycHg7IGJvcmRlcjogMXB4IHNvbGlkICNjYmQ1ZTE7IGZvbnQtZmFtaWx5OiAnR290aGFtIFBybycsIHNhbnMtc2VyaWY7IGZvbnQtd2VpZ2h0OiA5MDA7XCI+JHtzZWxlY3RlZFBheXNsaXBFbXBsb3llZS5sb2Fuc0RlZHVjdGlvbi50b0xvY2FsZVN0cmluZygnZW4tVVMnKX08L3RkPlxuICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgPHRkIHN0eWxlPVwiYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNlMmU4ZjA7IHBhZGRpbmc6IDEycHg7IGJvcmRlcjogMXB4IHNvbGlkICNjYmQ1ZTE7XCI+2KjYr9mEINin2YTYs9mD2YYg2KfZhNmF2KrZgdmCINi52YTZitmHPC90ZD5cbiAgICAgICAgICAgICAgPHRkIHN0eWxlPVwiYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNlMmU4ZjA7IHBhZGRpbmc6IDEycHg7IGJvcmRlcjogMXB4IHNvbGlkICNjYmQ1ZTE7IGZvbnQtZmFtaWx5OiAnR290aGFtIFBybycsIHNhbnMtc2VyaWY7IGZvbnQtd2VpZ2h0OiA5MDA7XCI+JHtzZWxlY3RlZFBheXNsaXBFbXBsb3llZS5ob3VzaW5nQWxsb3dhbmNlLnRvTG9jYWxlU3RyaW5nKCdlbi1VUycpfTwvdGQ+XG4gICAgICAgICAgICAgIDx0ZCBzdHlsZT1cImJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjZTJlOGYwOyBwYWRkaW5nOiAxMnB4OyBib3JkZXI6IDFweCBzb2xpZCAjY2JkNWUxO1wiPtin2LPYqtmC2LfYp9i5INin2YTYqtij2YXZitmG2KfYqiDYp9mE2KfYrNiq2YXYp9i52YrYqSAoR09TSSk8L3RkPlxuICAgICAgICAgICAgICA8dGQgc3R5bGU9XCJib3JkZXItYm90dG9tOiAxcHggc29saWQgI2UyZThmMDsgcGFkZGluZzogMTJweDsgYm9yZGVyOiAxcHggc29saWQgI2NiZDVlMTsgZm9udC1mYW1pbHk6ICdHb3RoYW0gUHJvJywgc2Fucy1zZXJpZjsgZm9udC13ZWlnaHQ6IDkwMDtcIj4ke3NlbGVjdGVkUGF5c2xpcEVtcGxveWVlLmdvc2lEZWR1Y3Rpb24udG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJyl9PC90ZD5cbiAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgIDx0ZCBzdHlsZT1cImJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjZTJlOGYwOyBwYWRkaW5nOiAxMnB4OyBib3JkZXI6IDFweCBzb2xpZCAjY2JkNWUxO1wiPtio2K/ZhCDYp9mE2KfZhtiq2YLYp9mEIC8g2KfZhNmF2YjYp9i12YTYp9iqPC90ZD5cbiAgICAgICAgICAgICAgPHRkIHN0eWxlPVwiYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNlMmU4ZjA7IHBhZGRpbmc6IDEycHg7IGJvcmRlcjogMXB4IHNvbGlkICNjYmQ1ZTE7IGZvbnQtZmFtaWx5OiAnR290aGFtIFBybycsIHNhbnMtc2VyaWY7IGZvbnQtd2VpZ2h0OiA5MDA7XCI+JHtzZWxlY3RlZFBheXNsaXBFbXBsb3llZS50cmFuc3BvcnRBbGxvd2FuY2UudG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJyl9PC90ZD5cbiAgICAgICAgICAgICAgPHRkIHN0eWxlPVwiYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNlMmU4ZjA7IHBhZGRpbmc6IDEycHg7IGJvcmRlcjogMXB4IHNvbGlkICNjYmQ1ZTE7XCI+2K7YtdmI2YXYp9iqINin2YTYutmK2KfYqCDYqNiv2YjZhiDYudiw2LE8L3RkPlxuICAgICAgICAgICAgICA8dGQgc3R5bGU9XCJib3JkZXItYm90dG9tOiAxcHggc29saWQgI2UyZThmMDsgcGFkZGluZzogMTJweDsgYm9yZGVyOiAxcHggc29saWQgI2NiZDVlMTsgZm9udC1mYW1pbHk6ICdHb3RoYW0gUHJvJywgc2Fucy1zZXJpZjsgZm9udC13ZWlnaHQ6IDkwMDtcIj4keyhzZWxlY3RlZFBheXNsaXBFbXBsb3llZS5hYnNlbmNlRGVkdWN0aW9uIHx8IDApLnRvTG9jYWxlU3RyaW5nKCdlbi1VUycpfTwvdGQ+XG4gICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICA8dGQgc3R5bGU9XCJib3JkZXItYm90dG9tOiAxcHggc29saWQgI2UyZThmMDsgcGFkZGluZzogMTJweDsgYm9yZGVyOiAxcHggc29saWQgI2NiZDVlMTtcIj7YqNiv2YQg2KfZhNil2LnYp9i02KkgLyDYp9mE2LfYudin2YU8L3RkPlxuICAgICAgICAgICAgICA8dGQgc3R5bGU9XCJib3JkZXItYm90dG9tOiAxcHggc29saWQgI2UyZThmMDsgcGFkZGluZzogMTJweDsgYm9yZGVyOiAxcHggc29saWQgI2NiZDVlMTsgZm9udC1mYW1pbHk6ICdHb3RoYW0gUHJvJywgc2Fucy1zZXJpZjsgZm9udC13ZWlnaHQ6IDkwMDtcIj4keygoc2VsZWN0ZWRQYXlzbGlwRW1wbG95ZWUuZm9vZEFsbG93YW5jZSB8fCAwKSArIChzZWxlY3RlZFBheXNsaXBFbXBsb3llZS5saXZpbmdBbGxvd2FuY2UgfHwgMCkpLnRvTG9jYWxlU3RyaW5nKCdlbi1VUycpfTwvdGQ+XG4gICAgICAgICAgICAgIDx0ZCBzdHlsZT1cImJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjZTJlOGYwOyBwYWRkaW5nOiAxMnB4OyBib3JkZXI6IDFweCBzb2xpZCAjY2JkNWUxO1wiPtiu2LXZiNmF2KfYqiDYp9mE2KrYo9iu2YrYsTwvdGQ+XG4gICAgICAgICAgICAgIDx0ZCBzdHlsZT1cImJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjZTJlOGYwOyBwYWRkaW5nOiAxMnB4OyBib3JkZXI6IDFweCBzb2xpZCAjY2JkNWUxOyBmb250LWZhbWlseTogJ0dvdGhhbSBQcm8nLCBzYW5zLXNlcmlmOyBmb250LXdlaWdodDogOTAwO1wiPiR7KHNlbGVjdGVkUGF5c2xpcEVtcGxveWVlLmxhdGVEZWR1Y3Rpb24gfHwgMCkudG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJyl9PC90ZD5cbiAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgIDx0ZCBzdHlsZT1cImJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjZTJlOGYwOyBwYWRkaW5nOiAxMnB4OyBib3JkZXI6IDFweCBzb2xpZCAjY2JkNWUxO1wiPtmF2YPYp9mB2KLYqiDYp9mE2LnZhdmEINin2YTYpdi22KfZgdmKIChPdmVydGltZSk8L3RkPlxuICAgICAgICAgICAgICA8dGQgc3R5bGU9XCJib3JkZXItYm90dG9tOiAxcHggc29saWQgI2UyZThmMDsgcGFkZGluZzogMTJweDsgYm9yZGVyOiAxcHggc29saWQgI2NiZDVlMTsgZm9udC1mYW1pbHk6ICdHb3RoYW0gUHJvJywgc2Fucy1zZXJpZjsgZm9udC13ZWlnaHQ6IDkwMDtcIj4keyhzZWxlY3RlZFBheXNsaXBFbXBsb3llZS5vdmVydGltZUFtb3VudCB8fCAwKS50b0xvY2FsZVN0cmluZygnZW4tVVMnKX08L3RkPlxuICAgICAgICAgICAgICA8dGQgc3R5bGU9XCJib3JkZXItYm90dG9tOiAxcHggc29saWQgI2UyZThmMDsgcGFkZGluZzogMTJweDsgYm9yZGVyOiAxcHggc29saWQgI2NiZDVlMTtcIj7Yp9mE2KzYstin2KHYp9iqINmI2KfZhNi52YLZiNio2KfYqiAoUGVuYWx0aWVzKTwvdGQ+XG4gICAgICAgICAgICAgIDx0ZCBzdHlsZT1cImJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjZTJlOGYwOyBwYWRkaW5nOiAxMnB4OyBib3JkZXI6IDFweCBzb2xpZCAjY2JkNWUxOyBmb250LWZhbWlseTogJ0dvdGhhbSBQcm8nLCBzYW5zLXNlcmlmOyBmb250LXdlaWdodDogOTAwO1wiPiR7KHNlbGVjdGVkUGF5c2xpcEVtcGxveWVlLnBlbmFsdHlEZWR1Y3Rpb24gfHwgMCkudG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJyl9PC90ZD5cbiAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgIDx0ZCBzdHlsZT1cImJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjZTJlOGYwOyBwYWRkaW5nOiAxMnB4OyBib3JkZXI6IDFweCBzb2xpZCAjY2JkNWUxO1wiPtio2K/ZhCDYp9mE2KzZiNin2YQgKyDYqNiv2YTYp9iqINij2K7YsdmJIC8g2YXZj9iv2K88L3RkPlxuICAgICAgICAgICAgICA8dGQgc3R5bGU9XCJib3JkZXItYm90dG9tOiAxcHggc29saWQgI2UyZThmMDsgcGFkZGluZzogMTJweDsgYm9yZGVyOiAxcHggc29saWQgI2NiZDVlMTsgZm9udC1mYW1pbHk6ICdHb3RoYW0gUHJvJywgc2Fucy1zZXJpZjsgZm9udC13ZWlnaHQ6IDkwMDtcIj4keygoc2VsZWN0ZWRQYXlzbGlwRW1wbG95ZWUub3RoZXJBbGxvd2FuY2VzIHx8IDApICsgKHNlbGVjdGVkUGF5c2xpcEVtcGxveWVlLnBob25lQWxsb3dhbmNlIHx8IDApICkudG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJyl9PC90ZD5cbiAgICAgICAgICAgICAgPHRkIHN0eWxlPVwiYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNlMmU4ZjA7IHBhZGRpbmc6IDEycHg7IGJvcmRlcjogMXB4IHNvbGlkICNjYmQ1ZTE7XCI+2KfYs9iq2YLYt9in2LnYp9iqINij2K7YsdmJPC90ZD5cbiAgICAgICAgICAgICAgPHRkIHN0eWxlPVwiYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNlMmU4ZjA7IHBhZGRpbmc6IDEycHg7IGJvcmRlcjogMXB4IHNvbGlkICNjYmQ1ZTE7IGZvbnQtZmFtaWx5OiAnR290aGFtIFBybycsIHNhbnMtc2VyaWY7IGZvbnQtd2VpZ2h0OiA5MDA7XCI+JHsoc2VsZWN0ZWRQYXlzbGlwRW1wbG95ZWUub3RoZXJEZWR1Y3Rpb25zIHx8IDApLnRvTG9jYWxlU3RyaW5nKCdlbi1VUycpfTwvdGQ+XG4gICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICA8dGQgc3R5bGU9XCJib3JkZXItYm90dG9tOiAxcHggc29saWQgI2UyZThmMDsgcGFkZGluZzogMTJweDsgYm9yZGVyOiAxcHggc29saWQgI2NiZDVlMTsgYmFja2dyb3VuZC1jb2xvcjogI2Y4ZmFmYzsgZm9udC13ZWlnaHQ6IGJvbGQ7IGZvbnQtc2l6ZTogMTRweDsgdGV4dC1hbGlnbjogbGVmdDtcIj7Ypdis2YXYp9mE2Yog2KfZhNin2LPYqtit2YLYp9mC2KfYqjo8L3RkPlxuICAgICAgICAgICAgICA8dGQgc3R5bGU9XCJib3JkZXItYm90dG9tOiAxcHggc29saWQgI2UyZThmMDsgcGFkZGluZzogMTJweDsgYm9yZGVyOiAxcHggc29saWQgI2NiZDVlMTsgYmFja2dyb3VuZC1jb2xvcjogI2Y4ZmFmYzsgZm9udC13ZWlnaHQ6IGJvbGQ7IGZvbnQtZmFtaWx5OiAnR290aGFtIFBybycsIHNhbnMtc2VyaWY7IGZvbnQtd2VpZ2h0OiA5MDA7IGZvbnQtc2l6ZTogMTRweDsgY29sb3I6ICMwMDcyQkM7XCI+JHtzZWxlY3RlZFBheXNsaXBFbXBsb3llZS50b3RhbEVudGl0bGVtZW50cy50b0xvY2FsZVN0cmluZygnZW4tVVMnKX0g2LEu2LM8L3RkPlxuICAgICAgICAgICAgICA8dGQgc3R5bGU9XCJib3JkZXItYm90dG9tOiAxcHggc29saWQgI2UyZThmMDsgcGFkZGluZzogMTJweDsgYm9yZGVyOiAxcHggc29saWQgI2NiZDVlMTsgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjFmMjsgZm9udC13ZWlnaHQ6IGJvbGQ7IGZvbnQtc2l6ZTogMTRweDsgdGV4dC1hbGlnbjogbGVmdDtcIj7Ypdis2YXYp9mE2Yog2KfZhNin2LPYqtmC2LfYp9i52KfYqjo8L3RkPlxuICAgICAgICAgICAgICA8dGQgc3R5bGU9XCJib3JkZXItYm90dG9tOiAxcHggc29saWQgI2UyZThmMDsgcGFkZGluZzogMTJweDsgYm9yZGVyOiAxcHggc29saWQgI2NiZDVlMTsgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjFmMjsgZm9udC13ZWlnaHQ6IGJvbGQ7IGZvbnQtZmFtaWx5OiAnR290aGFtIFBybycsIHNhbnMtc2VyaWY7IGZvbnQtd2VpZ2h0OiA5MDA7IGZvbnQtc2l6ZTogMTRweDsgY29sb3I6ICNiZTEyM2M7XCI+JHtzZWxlY3RlZFBheXNsaXBFbXBsb3llZS50b3RhbERlZHVjdGlvbnMudG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJyl9INixLtizPC90ZD5cbiAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgPC90YWJsZT5cblxuICAgICAgICA8ZGl2IHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjogIzAyMDYxNzsgY29sb3I6IHdoaXRlOyBwYWRkaW5nOiAyMHB4OyBib3JkZXItcmFkaXVzOiAxMnB4OyBkaXNwbGF5OiBmbGV4OyBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47IGFsaWduLWl0ZW1zOiBjZW50ZXI7IG1hcmdpbi1ib3R0b206IDMwcHg7XCI+XG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDxoMyBzdHlsZT1cIm1hcmdpbjogMDsgZm9udC1zaXplOiAxNnB4OyBjb2xvcjogIzk0YTNiODtcIj7Ytdin2YHZiiDYp9mE2LHYp9iq2Kgg2KfZhNmF2LPYqtit2YIg2YTZhNiq2K3ZiNmK2YQg2KfZhNio2YbZg9mKPC9oMz5cbiAgICAgICAgICAgIDxwIHN0eWxlPVwibWFyZ2luOiA0cHggMCAwIDA7IGZvbnQtc2l6ZTogMTJweDsgY29sb3I6ICM2NDc0OGI7XCI+KE5ldCBTYWxhcnkgUGF5YWJsZSk8L3A+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBzdHlsZT1cImZvbnQtc2l6ZTogMjhweDsgZm9udC13ZWlnaHQ6IDkwMDsgZm9udC1mYW1pbHk6ICdHb3RoYW0gUHJvJywgc2Fucy1zZXJpZjsgZm9udC13ZWlnaHQ6IDkwMDsgY29sb3I6ICMzNGQzOTk7XCI+XG4gICAgICAgICAgICAke3NlbGVjdGVkUGF5c2xpcEVtcGxveWVlLm5ldFNhbGFyeS50b0xvY2FsZVN0cmluZygnZW4tVVMnKX0g2LEu2LNcbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6ICNmMWY1Zjk7IHBhZGRpbmc6IDE1cHg7IGJvcmRlci1yYWRpdXM6IDhweDsgZm9udC1zaXplOjExcHg7IGNvbG9yOiM0NzU1Njk7IG1hcmdpbi1ib3R0b206IDMwcHg7XCI+XG4gICAgICAgICAgPHN0cm9uZz7YqtmG2YjZitmHINmG2LjYp9mF2Yo6PC9zdHJvbmc+INmK2LnYqtio2LEg2YPYtNmBINin2YTYsdin2KrYqCDYp9mE2LXYp9iv2LEg2YXZhiDZhdmG2LXYqSDYp9mE2KXYr9in2LHYqSDZhNi02LHZg9ipINmB2YbZiNmGINin2YTZiNmE2YrYryDZiNir2YrZgtipINix2LPZhdmK2Kkg2YXYudiq2YXYr9ipINiq2KvYqNiqINiq2K3ZiNmK2YQg2YjZgtmK2K8g2KfZhNmF2LPYqtit2YLYp9iqINin2YTZhdin2YTZitipINmE2YTZhdmI2LjZgSDYqNin2YTZhdix2KzYuSDYp9mE2KjZhtmD2Yog2KfZhNmF2LnYqtmF2K8g2KXZhNmD2KrYsdmI2YbZitin2YvYjCDZiNiq2LfYp9io2YIg2KPYrdmD2KfZhSDYudmC2YjYryDYp9mE2LnZhdmEINin2YTZhdi12KfYr9mCINi52YTZitmH2Kcg2LnYqNixINmF2YbYtdipINmC2YjZiSDYqNmI2LLYp9ix2Kkg2KfZhNmF2YjYp9ix2K8g2KfZhNio2LTYsdmK2KkuXG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgc3R5bGU9XCJkaXNwbGF5OiBmbGV4OyBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47IG1hcmdpbi10b3A6IDQwcHg7IHBhZGRpbmctdG9wOiAyMHB4O1wiPlxuICAgICAgICAgIDxkaXYgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IGJvcmRlcjogMXB4IGRhc2hlZCAjY2JkNWUxOyBwYWRkaW5nOiAyMHB4OyBib3JkZXItcmFkaXVzOiA4cHg7IHdpZHRoOiA0NSU7XCI+XG4gICAgICAgICAgICDYqtmI2YLZiti5INin2YTZhdit2KfYs9ioINin2YTZhdin2YTZiiDZhNmE2LTYsdmD2Kk8YnIvPjxici8+PGJyLz5cbiAgICAgICAgICAgIF9fX19fX19fX19fX19fX19fXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjsgYm9yZGVyOiAxcHggZGFzaGVkICNjYmQ1ZTE7IHBhZGRpbmc6IDIwcHg7IGJvcmRlci1yYWRpdXM6IDhweDsgd2lkdGg6IDQ1JTtcIj5cbiAgICAgICAgICAgINin2LnYqtmF2KfYryDYp9mE2YXYr9mK2LEg2KfZhNi52KfZhSDZiNi12KfYrdioINin2YTYudmF2YQ8YnIvPjxici8+PGJyLz5cbiAgICAgICAgICAgIF9fX19fX19fX19fX19fX19fXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgYDtcblxuICAgIGNvbnN0IG9wdCA9IHtcbiAgICAgIG1hcmdpbjogICAgICAgMTAsXG4gICAgICBmaWxlbmFtZTogICAgIGBQYXlzbGlwXyR7c2VsZWN0ZWRQYXlzbGlwRW1wbG95ZWUuZW1wbG95ZWVJZH1fJHtzZWxlY3RlZFJ1bi5tb250aH1fJHtzZWxlY3RlZFJ1bi55ZWFyfS5wZGZgLFxuICAgICAgaW1hZ2U6ICAgICAgICB7IHR5cGU6ICdqcGVnJywgcXVhbGl0eTogMC45OCB9LFxuICAgICAgaHRtbDJjYW52YXM6ICB7IHNjYWxlOiAyIH0sXG4gICAgICBqc1BERjogICAgICAgIHsgdW5pdDogJ21tJywgZm9ybWF0OiAnYTQnLCBvcmllbnRhdGlvbjogJ3BvcnRyYWl0JyB9XG4gICAgfTtcblxuICAgIGh0bWwycGRmKCkuZnJvbShlbGVtZW50KS5zZXQob3B0KS5vdXRwdXQoJ2Jsb2J1cmwnKS50aGVuKGZ1bmN0aW9uKHBkZkJsb2JVcmw6IHN0cmluZykge1xuICAgICAgd2luZG93Lm9wZW4ocGRmQmxvYlVybCwgJ19ibGFuaycpO1xuICAgICAgXG4gICAgICBzaG93VG9hc3QoXCLinJMg2KrZhSDYp9iz2KrYrtix2KfYrCDZhdmE2YEgUERGINmI2YHYqtit2Ycg2YTZhNmF2LnYp9mK2YbYqVwiLCBcIuKckyBQREYgcHJldmlldyBvcGVuZWQgc3VjY2Vzc2Z1bGx5XCIsIFwic3VjY2Vzc1wiKTtcbiAgICAgIGxvZ0FjdGlvblRvQXVkaXQoe1xuICAgICAgICBhY3Rpb246IFwi2KrYtdiv2YrYsSDZhdiz2YrYsVwiLFxuICAgICAgICBwYXlyb2xsUnVuSWQ6IHNlbGVjdGVkUnVuLmlkLFxuICAgICAgICBub3RlczogYNiq2YUg2KrYtdiv2YrYsSDZhdiz2YrYsSDYp9mE2YXZiNi42YEgJHtzZWxlY3RlZFBheXNsaXBFbXBsb3llZS5hcmFiaWNOYW1lfSDYqNi12YrYutipIFBERmAsXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS02IG1kOmNvbC1zcGFuLTFcIj5cbiAgICAgIHsvKiBIRUFERVIgU0VDVElPTiBXSVRIIFNUQVRTIEJBUiAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctc2xhdGUtOTAwIHRleHQtd2hpdGUgcm91bmRlZC0zeGwgcC02IHNoYWRvdy14bCBib3JkZXIgYm9yZGVyLXNsYXRlLTgwMFwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgbWQ6ZmxleC1yb3cganVzdGlmeS1iZXR3ZWVuIGl0ZW1zLXN0YXJ0IG1kOml0ZW1zLWNlbnRlciBnYXAtNFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRleHQtWyMwMEFFRUZdXCI+XG4gICAgICAgICAgICAgIDxCdWlsZGluZyBjbGFzc05hbWU9XCJ3LTUgaC01XCIgLz5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIGZvbnQtbW9ub1wiPkZJTkFOQ0lBTCBBQ0NPVU5USU5HIERJVklTSU9OPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8aDEgY2xhc3NOYW1lPVwidGV4dC0yeGwgZm9udC1ibGFjayB0cmFja2luZy10aWdodCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICDZhdiz2YrYsdin2Kog2KfZhNix2YjYp9iq2Kgg2KfZhNi02YfYsdmK2Kkg2YjYp9mE2KrYrdmI2YrZhNin2KogPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bIzAwQUVFRl1cIj7wn5KzPC9zcGFuPlxuICAgICAgICAgICAgPC9oMT5cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS00MDBcIj5cbiAgICAgICAgICAgICAg2KXYudiv2KfYr9iMINmF2LHYp9is2LnYqdiMINiq2K/ZgtmK2YIg2YjYp9i52KrZhdin2K8g2YPYtNmI2YHYp9iqINix2YjYp9iq2Kgg2KfZhNmF2YjYuNmB2YrZhiDZiNin2YTYudmF2KfZhCDZgdmKINin2YTZhdi12YbYuSDZiNiq2YjYq9mK2YIg2KfZhNiq2K3ZiNmK2YTYp9iqINin2YTYqNmG2YPZitipINin2YTZhdio2KfYtNix2KkuXG4gICAgICAgICAgICA8L3A+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICB7aXNBY2NvdW50YW50ICYmIChcbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0SXNDcmVhdGVNb2RhbE9wZW4odHJ1ZSl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTYgcHktMy41IGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzAwQUVFRl0gdG8tWyMwMDcyQkNdIGhvdmVyOmZyb20tWyMwMDcyQkNdIGhvdmVyOnRvLVsjMDBBRUVGXSB0ZXh0LXdoaXRlIGZvbnQtZXh0cmFib2xkIHJvdW5kZWQtMnhsIHRleHQteHMgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIHRyYW5zaXRpb24tYWxsIHNoYWRvdy1sZyBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBncm91cCB0cmFuc2Zvcm0gaG92ZXI6c2NhbGUtWzEuMDJdXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPFBsdXMgY2xhc3NOYW1lPVwidy01IGgtNSB0cmFuc2l0aW9uLXRyYW5zZm9ybSBncm91cC1ob3Zlcjpyb3RhdGUtOTBcIiAvPlxuICAgICAgICAgICAgICDYpdmG2LTYp9ihINmF2LPZitixINix2YjYp9iq2Kgg2LTZh9ix2Yog2KzYr9mK2K8g4pyoXG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICApfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7LyogTUVUUklDIEJBREdFUyBDQVJEIEdST1VQICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTIgbWQ6Z3JpZC1jb2xzLTQgZ2FwLTQgbXQtNiBwdC02IGJvcmRlci10IGJvcmRlci1zbGF0ZS04MDBcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXNsYXRlLTk1MC81MCBwLTQgcm91bmRlZC0yeGwgYm9yZGVyIGJvcmRlci1zbGF0ZS04MDAvODAgZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWJldHdlZW5cIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNDAwIGZvbnQtYm9sZCB1cHBlcmNhc2VcIj7Yp9mE2LHZiNin2KrYqCDYp9mE2YXYudmE2YLYqSDZhNmE2YXYsdin2KzYudipIPCflI08L3NwYW4+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtYmFzZWxpbmUganVzdGlmeS1iZXR3ZWVuIG10LTJcIj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14bCBmb250LWJsYWNrIHRleHQtYW1iZXItNTAwIGZvbnQtbW9ub1wiPlxuICAgICAgICAgICAgICAgIHtwYXlyb2xsUnVucy5maWx0ZXIoKHIpID0+IFtcIlBlbmRpbmcgUmV2aWV3XCIsIFwiUmV2aWV3ZWRcIiwgXCJQZW5kaW5nIEZpbmFsIEFwcHJvdmFsXCJdLmluY2x1ZGVzKHIuc3RhdHVzKSAmJiAhci5pc0RlbGV0ZWQpLmxlbmd0aH1cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBiZy1hbWJlci01MDAvMTAgdGV4dC1hbWJlci01MDAgZm9udC1ib2xkIHB4LTEuNSBweS0wLjUgcm91bmRlZFwiPtmF2LnZhNmR2YI8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctc2xhdGUtOTUwLzUwIHAtNCByb3VuZGVkLTJ4bCBib3JkZXIgYm9yZGVyLXNsYXRlLTgwMC84MCBmbGV4IGZsZXgtY29sIGp1c3RpZnktYmV0d2VlblwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS00MDAgZm9udC1ib2xkIHVwcGVyY2FzZVwiPtin2YTZhdiz2YrYsdin2Kog2KfZhNmF2LnYqtmF2K/YqSDZhtmH2KfYptmK2KfZiyDwn5GRPC9zcGFuPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWJhc2VsaW5lIGp1c3RpZnktYmV0d2VlbiBtdC0yXCI+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteGwgZm9udC1ibGFjayB0ZXh0LWVtZXJhbGQtNTAwIGZvbnQtbW9ub1wiPlxuICAgICAgICAgICAgICAgIHtwYXlyb2xsUnVucy5maWx0ZXIoKHIpID0+IHIuc3RhdHVzID09PSBcIkFwcHJvdmVkXCIgJiYgIXIuaXNEZWxldGVkKS5sZW5ndGh9XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gYmctZW1lcmFsZC01MDAvMTAgdGV4dC1lbWVyYWxkLTUwMCBmb250LWJvbGQgcHgtMS41IHB5LTAuNSByb3VuZGVkXCI+2YXYudiq2YXYrzwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1zbGF0ZS05NTAvNTAgcC00IHJvdW5kZWQtMnhsIGJvcmRlciBib3JkZXItc2xhdGUtODAwLzgwIGZsZXggZmxleC1jb2wganVzdGlmeS1iZXR3ZWVuXCI+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMCBmb250LWJvbGQgdXBwZXJjYXNlXCI+2KPZgtiz2KfZhSDYp9mE2YXYtdmG2Lkg2KfZhNmB2LnYp9mE2Kkg8J+PrTwvc3Bhbj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1iYXNlbGluZSBqdXN0aWZ5LWJldHdlZW4gbXQtMlwiPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhsIGZvbnQtYmxhY2sgdGV4dC1bIzAwQUVFRl0gZm9udC1tb25vIGZvbnQtYm9sZFwiPlxuICAgICAgICAgICAgICAgIHtkZXBhcnRtZW50cy5sZW5ndGh9XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gYmctY3lhbi01MDAvMTAgdGV4dC1bIzAwQUVFRl0gZm9udC1ib2xkIHB4LTEuNSBweS0wLjUgcm91bmRlZFwiPtmI2LHYtNipPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXNsYXRlLTk1MC81MCBwLTQgcm91bmRlZC0yeGwgYm9yZGVyIGJvcmRlci1zbGF0ZS04MDAvODAgZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWJldHdlZW5cIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNDAwIGZvbnQtYm9sZCB1cHBlcmNhc2VcIj7Ypdis2YXYp9mE2Yog2KfZhNit2YjYp9mE2KfYqiDYp9mE2YXZiNir2YLYqSDwn5K4PC9zcGFuPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWJhc2VsaW5lIGp1c3RpZnktYmV0d2VlbiBtdC0yXCI+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteGwgZm9udC1ibGFjayB0ZXh0LWluZGlnby00MDAgZm9udC1tb25vXCI+XG4gICAgICAgICAgICAgICAge3BheXJvbGxSdW5zLmZpbHRlcigocikgPT4gW1wiVHJhbnNmZXJyZWRcIiwgXCJQYXJ0aWFsbHkgUGFpZFwiXS5pbmNsdWRlcyhyLnN0YXR1cykgJiYgIXIuaXNEZWxldGVkKS5sZW5ndGh9XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gYmctaW5kaWdvLTUwMC8xMCB0ZXh0LWluZGlnby00MDAgZm9udC1ib2xkIHB4LTEuNSBweS0wLjUgcm91bmRlZFwiPtmF2K3ZiNmEPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBGSUxURVIgJiBXT1JLRkxPVyBDT05UUk9MUyBCT0FSRCAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctd2hpdGUgcm91bmRlZC0zeGwgcC02IHNoYWRvdy1tZCBib3JkZXIgYm9yZGVyLXNsYXRlLTEwMCBzcGFjZS15LTRcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIG1kOmZsZXgtcm93IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1zdGFydCBtZDppdGVtcy1jZW50ZXIgZ2FwLTRcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlIGZsZXgtMSB3LWZ1bGxcIj5cbiAgICAgICAgICAgIDxTZWFyY2ggY2xhc3NOYW1lPVwiYWJzb2x1dGUgcmlnaHQtNCB0b3AtMy41IHRleHQtc2xhdGUtNDAwIHctNSBoLTVcIiAvPlxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCLYp9mE2KjYrdirINio2LHZgtmFINin2YTZhdiz2YrYsdiMINin2YTZhdmE2KfYrdi42KfYqtiMINij2Ygg2YLYs9mFINin2YTZhdmI2LjZgdmK2YYuLi5cIlxuICAgICAgICAgICAgICB2YWx1ZT17c2VhcmNoUXVlcnl9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0U2VhcmNoUXVlcnkoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgcGwtNCBwci0xMiBweS0zIGJnLXNsYXRlLTUwIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIHJvdW5kZWQtMnhsIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpyaW5nLTIgZm9jdXM6cmluZy1bIzAwNzJCQ10gZm9jdXM6Ymctd2hpdGUgdHJhbnNpdGlvbi1hbGwgdGV4dC14cyB0ZXh0LXNsYXRlLTcwMFwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiB3LWZ1bGwgbWQ6dy1hdXRvXCI+XG4gICAgICAgICAgICB7LyogWWVhciBGaWx0ZXIgKi99XG4gICAgICAgICAgICA8c2VsZWN0XG4gICAgICAgICAgICAgIHZhbHVlPXtmaWx0ZXJZZWFyfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEZpbHRlclllYXIoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCByb3VuZGVkLXhsIHB4LTMgcHktMi41IHRleHQteHMgdGV4dC1zbGF0ZS03MDAgZm9udC1tb25vIGZvbnQtYm9sZFwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJhbGxcIj7YrNmF2YrYuSDYp9mE2LPZhtmI2KfYqiAoQWxsIFllYXJzKTwvb3B0aW9uPlxuICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiMjAyNlwiPjIwMjY8L29wdGlvbj5cbiAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIjIwMjVcIj4yMDI1PC9vcHRpb24+XG4gICAgICAgICAgICA8L3NlbGVjdD5cblxuICAgICAgICAgICAgey8qIE1vbnRoIEZpbHRlciAqL31cbiAgICAgICAgICAgIDxzZWxlY3RcbiAgICAgICAgICAgICAgdmFsdWU9e2ZpbHRlck1vbnRofVxuICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEZpbHRlck1vbnRoKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYmctc2xhdGUtNTAgYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgcm91bmRlZC14bCBweC0zIHB5LTIuNSB0ZXh0LXhzIHRleHQtc2xhdGUtNzAwXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImFsbFwiPtis2YXZiti5INin2YTYo9i02YfYsSAoQWxsIE1vbnRocyk8L29wdGlvbj5cbiAgICAgICAgICAgICAge0FycmF5LmZyb20oeyBsZW5ndGg6IDEyIH0sIChfLCBpKSA9PiAoXG4gICAgICAgICAgICAgICAgPG9wdGlvbiBrZXk9e2kgKyAxfSB2YWx1ZT17aSArIDF9PlxuICAgICAgICAgICAgICAgICAge2dldE1vbnRoTmFtZShpICsgMSl9XG4gICAgICAgICAgICAgICAgPC9vcHRpb24+XG4gICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgPC9zZWxlY3Q+XG5cbiAgICAgICAgICAgIHsvKiBEZXBhcnRtZW50IEZpbHRlciAqL31cbiAgICAgICAgICAgIDxzZWxlY3RcbiAgICAgICAgICAgICAgdmFsdWU9e2ZpbHRlckRlcHR9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0RmlsdGVyRGVwdChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJnLXNsYXRlLTUwIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIHJvdW5kZWQteGwgcHgtMyBweS0yLjUgdGV4dC14cyB0ZXh0LXNsYXRlLTcwMCBtYXgtdy1bMjAwcHhdXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImFsbFwiPtis2YXZiti5INmI2LHYtCDZiNij2YLYs9in2YUg2KfZhNmF2LXZhti5PC9vcHRpb24+XG4gICAgICAgICAgICAgIHtkZXBhcnRtZW50cy5tYXAoKGRlcHQpID0+IChcbiAgICAgICAgICAgICAgICA8b3B0aW9uIGtleT17ZGVwdH0gdmFsdWU9e2RlcHR9PlxuICAgICAgICAgICAgICAgICAge2RlcHR9XG4gICAgICAgICAgICAgICAgPC9vcHRpb24+XG4gICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgPC9zZWxlY3Q+XG5cbiAgICAgICAgICAgIHsvKiBSZWZyZXNoIGJ1dHRvbiAqL31cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgb25DbGljaz17bG9hZFBheXJvbGxSdW5zfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJwLTIuNSBiZy1zbGF0ZS0xMDAgaG92ZXI6Ymctc2xhdGUtMjAwIHJvdW5kZWQteGwgdHJhbnNpdGlvbi1jb2xvcnNcIlxuICAgICAgICAgICAgICB0aXRsZT1cItiq2K3Yr9mK2Ksg2KfZhNio2YrYp9mG2KfYqlwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDxSZWZyZXNoQ3cgY2xhc3NOYW1lPVwidy00LjUgaC00LjUgdGV4dC1zbGF0ZS02MDBcIiAvPlxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIHsvKiBXT1JLRkxPVyBQSEFTRSBUQUJTICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTIwMCBnYXAtMSBvdmVyZmxvdy14LWF1dG8gcHQtMlwiPlxuICAgICAgICAgIHtbXG4gICAgICAgICAgICB7IGlkOiBcImFsbFwiLCBsYWJlbDogXCLYrNmF2YrYuSDYp9mE2YXYs9mK2LHYp9iqIPCfj5vvuI9cIiwgY291bnQ6IHBheXJvbGxSdW5zLmZpbHRlcigocikgPT4gIXIuaXNEZWxldGVkKS5sZW5ndGggfSxcbiAgICAgICAgICAgIHsgaWQ6IFwicGVuZGluZ1wiLCBsYWJlbDogXCLYqNin2YbYqti42KfYsSDYp9mE2YXYsdin2KzYudipIPCflI1cIiwgY291bnQ6IHBheXJvbGxSdW5zLmZpbHRlcigocikgPT4gW1wiUGVuZGluZyBSZXZpZXdcIiwgXCJSZXZpZXdlZFwiXS5pbmNsdWRlcyhyLnN0YXR1cykgJiYgIXIuaXNEZWxldGVkKS5sZW5ndGggfSxcbiAgICAgICAgICAgIHsgaWQ6IFwiYXBwcm92ZWRcIiwgbGFiZWw6IFwi2YXYudiq2YXYr9ipINmI2KzYp9mH2LLYqSDZhNmE2KrYrdmI2YrZhCDwn5GRXCIsIGNvdW50OiBwYXlyb2xsUnVucy5maWx0ZXIoKHIpID0+IFtcIkFwcHJvdmVkXCIsIFwiUGVuZGluZyBGaW5hbCBBcHByb3ZhbFwiXS5pbmNsdWRlcyhyLnN0YXR1cykgJiYgIXIuaXNEZWxldGVkKS5sZW5ndGggfSxcbiAgICAgICAgICAgIHsgaWQ6IFwicGFpZFwiLCBsYWJlbDogXCLZhdiz2YrYsdin2Kog2YXZg9iq2YXZhNipINmI2YXYrdmI2YTYqSDwn5K4XCIsIGNvdW50OiBwYXlyb2xsUnVucy5maWx0ZXIoKHIpID0+IFtcIlRyYW5zZmVycmVkXCIsIFwiUGFpZFwiLCBcIlBhcnRpYWxseSBQYWlkXCJdLmluY2x1ZGVzKHIuc3RhdHVzKSAmJiAhci5pc0RlbGV0ZWQpLmxlbmd0aCB9LFxuICAgICAgICAgICAgeyBpZDogXCJkcmFmdHNcIiwgbGFiZWw6IFwi2YXYs9mI2K/Yp9iqINmC2YrYryDYp9mE2KXYudiv2KfYryDwn5OdXCIsIGNvdW50OiBwYXlyb2xsUnVucy5maWx0ZXIoKHIpID0+IFtcIkRyYWZ0XCIsIFwiTmVlZHMgTW9kaWZpY2F0aW9uXCIsIFwiVW5kZXIgTW9kaWZpY2F0aW9uXCJdLmluY2x1ZGVzKHIuc3RhdHVzKSAmJiAhci5pc0RlbGV0ZWQpLmxlbmd0aCB9LFxuICAgICAgICAgIF0ubWFwKCh0YWIpID0+IChcbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAga2V5PXt0YWIuaWR9XG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEFjdGl2ZVRhYih0YWIuaWQgYXMgYW55KX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcGItMyBweC00IHRleHQtc20gZm9udC1ibGFjayB0cmFuc2l0aW9uLWFsbCB3aGl0ZXNwYWNlLW5vd3JhcCBib3JkZXItYi0yICR7XG4gICAgICAgICAgICAgICAgYWN0aXZlVGFiID09PSB0YWIuaWRcbiAgICAgICAgICAgICAgICAgID8gXCJib3JkZXItWyMwMDcyQkNdIHRleHQtWyMwMDcyQkNdIGZvbnQtZXh0cmFib2xkXCJcbiAgICAgICAgICAgICAgICAgIDogXCJib3JkZXItdHJhbnNwYXJlbnQgdGV4dC1zbGF0ZS01MDAgaG92ZXI6dGV4dC1zbGF0ZS04MDBcIlxuICAgICAgICAgICAgICB9YH1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAge3RhYi5sYWJlbH1cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibXItMS41IHB4LTIgcHktMC41IGJnLXNsYXRlLTEwMCB0ZXh0LXNsYXRlLTYwMCByb3VuZGVkLWZ1bGwgdGV4dC14cyBmb250LW1vbm8gZm9udC1ib2xkXCI+XG4gICAgICAgICAgICAgICAge3RhYi5jb3VudH1cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgKSl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBQQVlST0xMIFJVTlMgTUFJTiBEQVRBIExJU1QgKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXdoaXRlIHJvdW5kZWQtM3hsIHNoYWRvdy1tZCBib3JkZXIgYm9yZGVyLXNsYXRlLTEwMCBvdmVyZmxvdy1oaWRkZW5cIj5cbiAgICAgICAge2xvYWRpbmcgPyAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJweS0yNCB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidy0xMCBoLTEwIGJvcmRlci00IGJvcmRlci1bIzAwNzJCQ10gYm9yZGVyLXQtdHJhbnNwYXJlbnQgcm91bmRlZC1mdWxsIGFuaW1hdGUtc3BpbiBpbmxpbmUtYmxvY2sgbWItM1wiPjwvc3Bhbj5cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtYmFzZSB0ZXh0LXNsYXRlLTQwMCBmb250LWJvbGRcIj7YrNin2LHZiiDYqtit2YXZitmEINmF2LPZitix2KfYqiDYp9mE2LHZiNin2KrYqCDZiNin2YTYudmF2YTZitin2Kog2KfZhNio2YbZg9mK2Kkg2YTZhNmF2LXZhti5Li4uPC9wPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogZmlsdGVyZWRSdW5zLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB5LTIwIHRleHQtY2VudGVyIHRleHQtc2xhdGUtNDAwIHNwYWNlLXktM1wiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC00eGxcIj7wn5OCPC9zcGFuPlxuICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1ibGFjayB0ZXh0LXNsYXRlLTcwMFwiPtmE2Kcg2KrZiNis2K8g2YXYs9mK2LHYp9iqINix2YjYp9iq2Kgg2YHZiiDZh9iw2Kcg2KfZhNiq2KjZiNmK2Kg8L2gzPlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyBtYXgtdy1tZCBteC1hdXRvXCI+XG4gICAgICAgICAgICAgINmE2YUg2YbYrNivINij2Yog2YPYtNmI2YEg2LHZiNin2KrYqCDYqti32KfYqNmCINmF2LnYp9mK2YrYsSDYp9mE2KrYtdmB2YrYqSDZiNin2YTYqNit2Ksg2KfZhNit2KfZhNmK2Kkg2YHZiiDYo9ix2LTZitmBINin2YTZhdi52KfZhdmE2KfYqiDYp9mE2YXYp9mE2YrYqSDZhNmE2LTYsdmD2KkuXG4gICAgICAgICAgICA8L3A+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvdmVyZmxvdy14LWF1dG9cIj5cbiAgICAgICAgICAgIDx0YWJsZSBjbGFzc05hbWU9XCJ3LWZ1bGwgdGV4dC1bMTVweF0gdGV4dC1yaWdodCBmb250LXNhbnNcIj5cbiAgICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJiZy1zbGF0ZS01MCBib3JkZXItYiBib3JkZXItc2xhdGUtMTAwIHRleHQtc2xhdGUtNTAwIHVwcGVyY2FzZSB0ZXh0LVsxMnB4XSB0cmFja2luZy13aWRlciBmb250LWJvbGRcIj5cbiAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweS00IHB4LTYgdGV4dC1yaWdodFwiPtix2YLZhSDYp9mE2YXYs9mK2LEg2KfZhNio2LHZhdis2Yo8L3RoPlxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB5LTQgcHgtNCB0ZXh0LXJpZ2h0XCI+2YHYqtix2Kkg2KfZhNin2LPYqtit2YLYp9mCPC90aD5cbiAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweS00IHB4LTQgdGV4dC1yaWdodFwiPtin2YTYqti62LfZitipINin2YTYpdiv2KfYsdmK2Kk8L3RoPlxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB5LTQgcHgtNCB0ZXh0LXJpZ2h0XCI+2LnYr9ivINin2YTZhdmI2LjZgdmK2YY8L3RoPlxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB5LTQgcHgtNCB0ZXh0LXJpZ2h0XCI+2KXYrNmF2KfZhNmKINin2YTYsdmI2KfYqtioINin2YTYo9iz2KfYs9mK2Kk8L3RoPlxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB5LTQgcHgtNCB0ZXh0LXJpZ2h0XCI+2KfZhNio2K/ZhNin2Kog2YjYp9mE2YXYs9iq2K3Zgtin2Ko8L3RoPlxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB5LTQgcHgtNCB0ZXh0LXJpZ2h0XCI+2KXYrNmF2KfZhNmKINin2YTYp9iz2KrZgti32KfYudin2Ko8L3RoPlxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB5LTQgcHgtNCB0ZXh0LXJpZ2h0IHRleHQtZW1lcmFsZC02MDAgZm9udC1ib2xkXCI+2LXYp9mB2Yog2KfZhNmF2LPYqtit2YIg2KfZhNmG2YfYp9im2Yo8L3RoPlxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB5LTQgcHgtNCB0ZXh0LWNlbnRlclwiPtit2KfZhNipINin2YTYqtiv2YLZitmCPC90aD5cbiAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweS00IHB4LTYgdGV4dC1sZWZ0XCI+2KfZhNiq2K3Zg9mFINmI2KfZhNil2KzYsdin2KHYp9iqPC90aD5cbiAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICA8L3RoZWFkPlxuICAgICAgICAgICAgICA8dGJvZHkgY2xhc3NOYW1lPVwiZGl2aWRlLXkgZGl2aWRlLXNsYXRlLTEwMFwiPlxuICAgICAgICAgICAgICAgIHtmaWx0ZXJlZFJ1bnMubWFwKChydW4pID0+IChcbiAgICAgICAgICAgICAgICAgIDx0ciBrZXk9e3J1bi5pZH0gY2xhc3NOYW1lPVwiaG92ZXI6Ymctc2xhdGUtNTAvODAgdHJhbnNpdGlvbi1jb2xvcnNcIj5cbiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB5LTQgcHgtNiBmb250LW1vbm8gZm9udC1ib2xkIHRleHQtc2xhdGUtOTAwIHRleHQtWzE2cHhdXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3J1bi5wYXlyb2xsTnVtYmVyfVxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicHktNCBweC00XCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmb250LWJvbGQgdGV4dC1bMTVweF1cIj57Z2V0TW9udGhOYW1lKHJ1bi5tb250aCl9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMFwiPtiz2YbYqSB7cnVuLnllYXJ9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweS00IHB4LTRcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0yLjUgcHktMSBiZy1jeWFuLTUwIHRleHQtY3lhbi04MDAgcm91bmRlZC1sZyBmb250LWJvbGQgYm9yZGVyIGJvcmRlci1jeWFuLTE1MCB0ZXh0LVsxM3B4XVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3J1bi5kZXBhcnRtZW50fVxuICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB5LTQgcHgtNCBmb250LWJvbGQgdGV4dC1zbGF0ZS03MDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7cnVuLmVtcGxveWVlc0NvdW50fSDZhdmI2LjZgVxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicHktNCBweC00IGZvbnQtbW9ubyBmb250LWJvbGQgdGV4dC1zbGF0ZS03MDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7Zm9ybWF0TW9uZXkocnVuLnRvdGFsQmFzaWNTYWxhcnkpfSDYsS7Ys1xuICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicHktNCBweC00IGZvbnQtbW9ubyB0ZXh0LWluZGlnby02MDAgZm9udC1ib2xkXCI+XG4gICAgICAgICAgICAgICAgICAgICAgK3tmb3JtYXRNb25leShydW4udG90YWxBbGxvd2FuY2VzKX0g2LEu2LNcbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB5LTQgcHgtNCBmb250LW1vbm8gdGV4dC1yb3NlLTYwMCBmb250LWJvbGRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAte2Zvcm1hdE1vbmV5KHJ1bi50b3RhbERlZHVjdGlvbnMpfSDYsS7Ys1xuICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicHktNCBweC00IGZvbnQtbW9ubyB0ZXh0LWVtZXJhbGQtNjAwIGZvbnQtYmxhY2sgdGV4dC1bMTZweF1cIj5cbiAgICAgICAgICAgICAgICAgICAgICB7Zm9ybWF0TW9uZXkocnVuLnRvdGFsTmV0U2FsYXJ5KX0g2LEu2LNcbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB5LTQgcHgtNCB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgIHtnZXRTdGF0dXNCYWRnZShydW4uc3RhdHVzKX1cbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB5LTQgcHgtNiB0ZXh0LWxlZnRcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktZW5kIGdhcC0yLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlT3BlblZpZXdSdW4ocnVuKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0yIGJnLVsjMDA3MkJDXSBob3ZlcjpiZy1bIzAwQUVFRl0gdGV4dC13aGl0ZSByb3VuZGVkLXhsIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IHNoYWRvdy1zbSB0ZXh0LXNtXCJcbiAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPEV5ZSBjbGFzc05hbWU9XCJ3LTQgaC00XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+2LnYsdi2INmI2KrYudiv2YrZhCDYp9mE2KrZgdin2LXZitmEPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsocnVuLnN0YXR1cyA9PT0gXCJEcmFmdFwiIHx8IHJ1bi5zdGF0dXMgPT09IFwiTmVlZHMgTW9kaWZpY2F0aW9uXCIgfHwgcnVuLnN0YXR1cyA9PT0gXCJVbmRlciBNb2RpZmljYXRpb25cIikgJiYgaXNBY2NvdW50YW50ICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmRsZURlbGV0ZVJ1bihydW4pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInAtMiB0ZXh0LXJvc2UtNjAwIGhvdmVyOnRleHQtd2hpdGUgaG92ZXI6Ymctcm9zZS02MDAgYmctcm9zZS01MCBib3JkZXIgYm9yZGVyLXJvc2UtMTAwIHJvdW5kZWQteGwgdHJhbnNpdGlvbi1hbGwgc2hhZG93LXNtXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cItit2LDZgSDYp9mE2YXYs9mK2LFcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRyYXNoMiBjbGFzc05hbWU9XCJ3LTQuNSBoLTQuNVwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBDUkVBVEUgTkVXIFJVTiBESUFMT0cgTU9EQUwgKi99XG4gICAgICB7aXNDcmVhdGVNb2RhbE9wZW4gJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZpeGVkIGluc2V0LTAgYmctc2xhdGUtOTAwLzYwIHotNTAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC00IGJhY2tkcm9wLWJsdXIteHNcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctZnVsbCBtYXgtdy14bCBiZy13aGl0ZSByb3VuZGVkLTN4bCBwLTggcmVsYXRpdmUgc2hhZG93LTJ4bCBib3JkZXIgYm9yZGVyLXNsYXRlLTEwMCBhbmltYXRlLXNjYWxlLXVwXCI+XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldElzQ3JlYXRlTW9kYWxPcGVuKGZhbHNlKX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYWJzb2x1dGUgbGVmdC02IHRvcC02IHAtMS41IGJnLXNsYXRlLTUwIGhvdmVyOmJnLXNsYXRlLTEwMCByb3VuZGVkLWZ1bGwgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC1zbGF0ZS02MDBcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8WCBjbGFzc05hbWU9XCJ3LTUgaC01XCIgLz5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zIG1iLTZcIj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicC0zIGJnLWJsdWUtNTAgdGV4dC1bIzAwNzJCQ10gcm91bmRlZC0yeGxcIj5cbiAgICAgICAgICAgICAgICA8RmlsZVRleHQgY2xhc3NOYW1lPVwidy02IGgtNlwiIC8+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LWJsYWNrIHRleHQtc2xhdGUtODAwXCI+2KXYudiv2KfYryDZhdiz2YrYsSDYsdmI2KfYqtioINi02YfYsdmKINis2K/ZitivPC9oMz5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtNDAwXCI+2YrZgtmI2YUg2KfZhNmG2LjYp9mFINio2KzZhNioINio2YrYp9mG2KfYqiDZiNi52YLZiNivINin2YTZhdmI2LjZgdmK2YYg2YXZhiDYp9mE2YXZiNin2LHYryDYp9mE2KjYtNix2YrYqSDZiNiq2YjZhNmK2K8g2KfZhNmF2LPZitixINmB2YjYsdmK2KfZiy48L3A+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxmb3JtIG9uU3VibWl0PXtoYW5kbGVDcmVhdGVSdW59IGNsYXNzTmFtZT1cInNwYWNlLXktNCB0ZXh0LXhzXCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMiBnYXAtNFwiPlxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYmxvY2sgbWItMSBmb250LWJvbGQgdGV4dC1zbGF0ZS01MDBcIj7Ys9mG2Kkg2KfZhNmF2LPZitixINin2YTZhdiz2KrZh9iv2YHYqSAqPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgIDxzZWxlY3RcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU9e25ld1J1bkZvcm0ueWVhcn1cbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXROZXdSdW5Gb3JtKHsgLi4ubmV3UnVuRm9ybSwgeWVhcjogTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSB9KX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB4LTMuNSBweS0zIGJvcmRlciBib3JkZXItc2xhdGUtMjUwIHJvdW5kZWQteGwgZm9udC1tb25vIGZvbnQtYm9sZFwiXG4gICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCIyMDI2XCI+MjAyNjwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiMjAyNVwiPjIwMjU8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9jayBtYi0xIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTUwMFwiPti02YfYsSDYp9mE2KfYs9iq2K3Zgtin2YIg2KfZhNmF2KfZhNmKICo8L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgPHNlbGVjdFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZT17bmV3UnVuRm9ybS5tb250aH1cbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXROZXdSdW5Gb3JtKHsgLi4ubmV3UnVuRm9ybSwgbW9udGg6IE51bWJlcihlLnRhcmdldC52YWx1ZSkgfSl9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBweC0zLjUgcHktMyBib3JkZXIgYm9yZGVyLXNsYXRlLTI1MCByb3VuZGVkLXhsXCJcbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAge0FycmF5LmZyb20oeyBsZW5ndGg6IDEyIH0sIChfLCBpKSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiBrZXk9e2kgKyAxfSB2YWx1ZT17aSArIDF9PlxuICAgICAgICAgICAgICAgICAgICAgICAge2dldE1vbnRoTmFtZShpICsgMSl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIG1iLTEgZm9udC1ib2xkIHRleHQtc2xhdGUtNTAwXCI+2LHZgtmFINin2YTZhdiz2YrYsSDYp9mE2YXZgtiq2LHYrSAo2KrZiNmE2YrYryDYqtmE2YLYp9im2YopPC9sYWJlbD5cbiAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgIHJlcXVpcmVkXG4gICAgICAgICAgICAgICAgICB2YWx1ZT17bmV3UnVuRm9ybS5wYXlyb2xsTnVtYmVyfVxuICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXROZXdSdW5Gb3JtKHsgLi4ubmV3UnVuRm9ybSwgcGF5cm9sbE51bWJlcjogZS50YXJnZXQudmFsdWUgfSl9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgcHgtMy41IHB5LTMgYm9yZGVyIGJvcmRlci1zbGF0ZS0yNTAgcm91bmRlZC14bCBmb250LW1vbm8gdGV4dC1zbGF0ZS03MDAgZm9udC1ib2xkIGJnLXNsYXRlLTUwXCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwLjVweF0gdGV4dC1bIzAwNzJCQ10gbXQtMSBmb250LWJvbGRcIj5cbiAgICAgICAgICAgICAgICAgIOKEue+4jyDZitmP2LPZhditINmG2LjYp9mF2KfZiyDYqNil2YbYtNin2KEg2KPZg9ir2LEg2YXZhiDZhdiz2YrYsSDYsdmI2KfYqtioINmE2YbZgdizINin2YTYtNmH2LEg2LfYp9mE2YXYpyDYo9mGIFwi2LHZgtmFINin2YTZhdiz2YrYsVwiINmF2K7YqtmE2YEg2YjZgdix2YrYry5cbiAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMiBnYXAtNFwiPlxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYmxvY2sgbWItMSBmb250LWJvbGQgdGV4dC1zbGF0ZS01MDBcIj7Yp9mE2YLYs9mFINin2YTZhdi02YXZiNmEINio2KfZhNmF2LPZitixPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgIDxzZWxlY3RcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU9e25ld1J1bkZvcm0uZGVwYXJ0bWVudH1cbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXROZXdSdW5Gb3JtKHsgLi4ubmV3UnVuRm9ybSwgZGVwYXJ0bWVudDogZS50YXJnZXQudmFsdWUgfSl9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBweC0zLjUgcHktMyBib3JkZXIgYm9yZGVyLXNsYXRlLTI1MCByb3VuZGVkLXhsIGJnLXdoaXRlIHRleHQtc2xhdGUtODAwXCJcbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cItis2YXZiti5INin2YTYo9mC2LPYp9mFXCI+2KzZhdmK2Lkg2KfZhNij2YLYs9in2YUg2YjYp9mE2YjYsdi0IChBbGwgU3RhZmYpPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgIHtkZXBhcnRtZW50cy5tYXAoKGRlcHQpID0+IChcbiAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIGtleT17ZGVwdH0gdmFsdWU9e2RlcHR9PlxuICAgICAgICAgICAgICAgICAgICAgICAge2RlcHR9XG4gICAgICAgICAgICAgICAgICAgICAgPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIG1iLTEgZm9udC1ib2xkIHRleHQtc2xhdGUtNTAwXCI+2K/ZiNix2Kkg2YjZgdiq2LHYqSDYtdix2YEg2KfZhNix2KfYqtioPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXtuZXdSdW5Gb3JtLnNhbGFyeVBlcmlvZH1cbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXROZXdSdW5Gb3JtKHsgLi4ubmV3UnVuRm9ybSwgc2FsYXJ5UGVyaW9kOiBlLnRhcmdldC52YWx1ZSB9KX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB4LTMuNSBweS0zIGJvcmRlciBib3JkZXItc2xhdGUtMjUwIHJvdW5kZWQteGwgYmctc2xhdGUtNTBcIlxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYmxvY2sgbWItMSBmb250LWJvbGQgdGV4dC1zbGF0ZS01MDBcIj7ZhdmE2KfYrdi42KfYqiDYqtmI2LbZitit2YrYqSDYpdi22KfZgdmK2Kk8L2xhYmVsPlxuICAgICAgICAgICAgICAgIDx0ZXh0YXJlYVxuICAgICAgICAgICAgICAgICAgdmFsdWU9e25ld1J1bkZvcm0ubm90ZXN9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldE5ld1J1bkZvcm0oeyAuLi5uZXdSdW5Gb3JtLCBub3RlczogZS50YXJnZXQudmFsdWUgfSl9XG4gICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cItij2K/YrtmEINij2Yog2YXZhNin2K3YuNin2Kog2K7Yp9i12Kkg2KjYqti52YXZitivINmF2LPZitixINmH2LDYpyDYp9mE2LTZh9ixINmF2KvZhCDYp9mE2YXZiNi42YHZitmGINiq2K3YqiDYp9mE2YXYsdin2KzYudipINij2Ygg2KfYs9iq2KjYudin2K8g2KfZhNin2LPYqtmC2KfZhNin2KouLi5cIlxuICAgICAgICAgICAgICAgICAgcm93cz17M31cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBweC0zLjUgcHktMyBib3JkZXIgYm9yZGVyLXNsYXRlLTI1MCByb3VuZGVkLXhsIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItWyMwMDcyQkNdXCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLWJsdWUtNTAvNTAgcC00IHJvdW5kZWQtMnhsIGJvcmRlciBib3JkZXItYmx1ZS0xMDAgZmxleCBpdGVtcy1zdGFydCBnYXAtMi41XCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1iYXNlIHRleHQtYmx1ZS02MDBcIj7wn5KhPC9zcGFuPlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtYmx1ZS04MDAgZm9udC1tZWRpdW0gbGVhZGluZy1yZWxheGVkXCI+XG4gICAgICAgICAgICAgICAgICA8c3Ryb25nPtiq2YbZiNmK2Ycg2KfZhNix2KjYtyDYp9mE2KrZhNmC2KfYptmKOjwvc3Ryb25nPiDYqNmF2KzYsdivINin2YTYtti62Lcg2LnZhNmJINil2YbYtNin2KEg2KfZhNmF2LPZitixINin2YTZhdin2YTZitiMINiz2YrZgtmI2YUg2KfZhNmG2LjYp9mFINio2KfZhNix2KjYtyDYp9mE2YXYqNin2LTYsSDYqNis2K/ZiNmEINio2YrYp9mG2KfYqiDYp9mE2YPZiNin2K/YsSDZhNmE2K3YtdmI2YQg2LnZhNmJINin2YTYsdmI2KfYqtioINin2YTYo9iz2KfYs9mK2Kkg2YjYp9mE2KjYr9mE2KfYqtiMINio2KfZhNil2LbYp9mB2Kkg2YTZhNiq2K3ZgtmCINmF2YYg2KPYsdmC2KfZhSDYp9mE2K3Ys9in2KjYp9iqINin2YTYqNmG2YPZitipIChJQkFOKSDZiNi32LHZgiDYp9mE2K/Zgdi5INin2YTZhdmB2LbZhNipINmE2KrYrNmH2YrYsiDZhdmE2YEg2KfZhNiq2K3ZiNmK2YQg2KfZhNmF2LXYsdmB2YouXG4gICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZ2FwLTMganVzdGlmeS1lbmQgcHQtNFwiPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0SXNDcmVhdGVNb2RhbE9wZW4oZmFsc2UpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNSBweS0yLjUgYmctc2xhdGUtMTAwIGhvdmVyOmJnLXNsYXRlLTIwMCByb3VuZGVkLXhsIHRyYW5zaXRpb24tY29sb3JzIGZvbnQtYm9sZFwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAg2KXZhNi62KfYoSDYp9mE2KrYsdin2KzYuVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNyBweS0yLjUgYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjMDA3MkJDXSB0by1bIzAwQUVFRl0gdGV4dC13aGl0ZSBmb250LWV4dHJhYm9sZCByb3VuZGVkLXhsIHNoYWRvdy1tZCB0cmFuc2Zvcm0gYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsXCJcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICDYp9io2K/YoyDYqtmI2YTZitivINmI2KXYudiv2KfYryDYp9mE2YXYs9mK2LEg8J+agFxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7LyogREVUQUlMRUQgUEFZUk9MTCBSVU4gVklFVyBNT0RBTCAqL31cbiAgICAgIHtpc1ZpZXdNb2RhbE9wZW4gJiYgc2VsZWN0ZWRSdW4gJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZpeGVkIGluc2V0LTAgYmctc2xhdGUtOTAwLzYwIHotNDAgZmxleCBmbGV4LWNvbCB3LXNjcmVlbiBoLXNjcmVlbiBiYWNrZHJvcC1ibHVyLXhzIG92ZXJmbG93LWhpZGRlbiBzZWxlY3Qtbm9uZVwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCB3LWZ1bGwgaC1mdWxsIGJnLXNsYXRlLTUwIHJlbGF0aXZlIG92ZXJmbG93LWhpZGRlblwiPlxuICAgICAgICAgICAgey8qIFN0aWNreSBXb3Jrc3BhY2UgSGVhZGVyICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1jZW50ZXIgYmctd2hpdGUgcHgtNiBweS00IGJvcmRlci1iIGJvcmRlci1zbGF0ZS0yMDAgc2hhZG93LXNtIHotMTBcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTAuNVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIuNVwiPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1tb25vIHRleHQtc20gZm9udC1ibGFjayB0ZXh0LVsjMDA3MkJDXVwiPntzZWxlY3RlZFJ1bi5wYXlyb2xsTnVtYmVyfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIHtnZXRTdGF0dXNCYWRnZShzZWxlY3RlZFJ1bi5zdGF0dXMpfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LWJhc2UgZm9udC1ibGFjayB0ZXh0LXNsYXRlLTgwMCBmb250LWFyYWJpY1wiPlxuICAgICAgICAgICAgICAgICAg2KrZgdin2LXZitmEINmD2LTZgSDYp9mE2LHZiNin2KrYqCDZhNi02YfYsSB7Z2V0TW9udGhOYW1lKHNlbGVjdGVkUnVuLm1vbnRoKX0gLSB7c2VsZWN0ZWRSdW4ueWVhcn1cbiAgICAgICAgICAgICAgICA8L2gzPlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwIGZvbnQtYXJhYmljXCI+XG4gICAgICAgICAgICAgICAgICDYp9mE2KrYuti32YrYqTogPHN0cm9uZyBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTYwMFwiPntzZWxlY3RlZFJ1bi5kZXBhcnRtZW50fTwvc3Ryb25nPiB8INin2YTZhdmG2LTYpjogPHN0cm9uZyBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTYwMFwiPntzZWxlY3RlZFJ1bi5jcmVhdGVkQnl9PC9zdHJvbmc+IHwg2KrYp9ix2YrYriDYp9mE2KjYr9ihOiB7bmV3IERhdGUoc2VsZWN0ZWRSdW4uY3JlYXRlZEF0KS50b0xvY2FsZURhdGVTdHJpbmcoKX1cbiAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTNcIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVFeHBvcnRQYXlyb2xsUERGfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicC0yLjUgYmctcm9zZS01MCBob3ZlcjpiZy1yb3NlLTEwMCByb3VuZGVkLXhsIHRleHQtcm9zZS03MDAgdHJhbnNpdGlvbi1jb2xvcnMgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTEuNSB0ZXh0LXhzIGZvbnQtYm9sZCBmb250LWFyYWJpY1wiXG4gICAgICAgICAgICAgICAgICB0aXRsZT1cItmF2LnYp9mK2YbYqSDZiNi32KjYp9i52KkgUERGXCJcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICA8UHJpbnRlciBjbGFzc05hbWU9XCJ3LTUgaC01XCIgLz5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc2V0SXNWaWV3TW9kYWxPcGVuKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0U2VsZWN0ZWRSdW4obnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIGxvZ0FjdGlvblRvQXVkaXQoe1xuICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogXCLYpdi62YTYp9mCINio2YrYptipINin2YTYudmF2YRcIixcbiAgICAgICAgICAgICAgICAgICAgICBwYXlyb2xsUnVuSWQ6IHNlbGVjdGVkUnVuLmlkLFxuICAgICAgICAgICAgICAgICAgICAgIG5vdGVzOiBcItmC2KfZhSDYp9mE2YXYs9iq2K7Yr9mFINio2KXYutmE2KfZgiDYqNmK2KbYqSDYudmF2YQg2YXYs9mK2LEg2KfZhNix2YjYp9iq2KhcIlxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJwLTIuNSBiZy1zbGF0ZS0xMDAgaG92ZXI6Ymctc2xhdGUtMjAwIHJvdW5kZWQtZnVsbCB0ZXh0LXNsYXRlLTUwMCBob3Zlcjp0ZXh0LXNsYXRlLTgwMCB0cmFuc2l0aW9uLWNvbG9yc1wiXG4gICAgICAgICAgICAgICAgICB0aXRsZT1cItil2LrZhNin2YIg2KjZitim2Kkg2KfZhNi52YXZhFwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgPFggY2xhc3NOYW1lPVwidy02IGgtNlwiIC8+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBXb3Jrc3BhY2UgQ29udGVudCBBcmVhIC0gU3BsaXQgTGF5b3V0ICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGZsZXgtMSBvdmVyZmxvdy15LWF1dG8gdy1mdWxsIHAtNiBoLVtjYWxjKDEwMHZoLTE0MHB4KV1cIj5cbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIHsvKiBSaWdodCBDb2x1bW46IER5bmFtaWMgRW1wbG95ZWUgVGFibGUgKFNjcm9sbGFibGUsIEluZGVwZW5kZW50KSAqL31cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LW5vbmUgYmctd2hpdGUgcC02IGJvcmRlciBib3JkZXItc2xhdGUtMjAwIGZsZXggZmxleC1jb2wganVzdGlmeS1iZXR3ZWVuIHJvdW5kZWQtMnhsIHNoYWRvdy1zbSBtYi02XCI+XG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctc2xhdGUtNTAgcC00IHJvdW5kZWQtMnhsIGJvcmRlciBib3JkZXItc2xhdGUtMTUwIG1iLTQgZmxleCBmbGV4LXdyYXAganVzdGlmeS1iZXR3ZWVuIGl0ZW1zLWNlbnRlciBnYXAtNFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRleHQteHMgZm9udC1ib2xkIHRleHQtc2xhdGUtNzAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1hcmFiaWNcIj7Yp9mE2YXZitiy2KfZhtmK2Kkg2KfZhNil2KzZhdin2YTZitipINin2YTYqtmC2K/Zitix2YrYqSDZhNmE2YXYs9mK2LE6PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtbW9ubyB0ZXh0LWVtZXJhbGQtNjAwIGZvbnQtZXh0cmFib2xkIHRleHQtc21cIj57c2VsZWN0ZWRSdW4udG90YWxOZXRTYWxhcnkudG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJyl9INixLtizPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3NlbGVjdGVkUnVuLnN0YXR1cyAhPT0gXCJEcmFmdFwiICYmIHNlbGVjdGVkUnVuLnN0YXR1cyAhPT0gXCJUcmFuc2ZlcnJlZFwiICYmIHNlbGVjdGVkUnVuLnN0YXR1cyAhPT0gXCJQYXJ0aWFsbHkgUGFpZFwiICYmIGlzQWNjb3VudGFudCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHJ1ZSkgeyAvLyBCeXBhc3MgY29uZmlybSBpbiBpZnJhbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb25TdGF0dXMoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiRHJhZnRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCLYpdi52KfYr9ipINin2YTZhdiz2YrYsSDZhNmF2LPZiNiv2KlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCLZgtin2YUg2KfZhNmF2K3Yp9iz2Kgg2KjYpdi52KfYr9ipINmB2KrYrSDYp9mE2YXYs9mK2LEg2YjYpdi52KfYr9iq2Ycg2KXZhNmJINit2KfZhNipICjZhdiz2YjYr9ipKSDZhNmK2KrZhdmD2YYg2YXZhiDYp9mE2KrYudiv2YrZhCDYudmE2YrZhyDZhdis2K/Yr9in2YsuXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTIgYmctc2xhdGUtMTAwIGhvdmVyOmJnLXNsYXRlLTIwMCB0ZXh0LXNsYXRlLTcwMCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCBmb250LWV4dHJhYm9sZCByb3VuZGVkLXhsIHRleHQteHMgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBmb250LWFyYWJpY1wiXG4gICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxSZWZyZXNoQ3cgY2xhc3NOYW1lPVwidy00IGgtNCB0ZXh0LXNsYXRlLTUwMFwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPtil2LnYp9iv2Kkg2YHYqtitINmD2YAg2YXYs9mI2K/YqSDZhNmE2KrYudiv2YrZhCDwn5OCPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICAgICAgICAgIHtzZWxlY3RlZFJ1bi5zdGF0dXMgPT09IFwiRHJhZnRcIiAmJiBpc0FjY291bnRhbnQgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZVJlZnJlc2hIckRlZHVjdGlvbnN9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0yIGJnLVsjMDA3MkJDXSBob3ZlcjpiZy1bIzAwQUVFRl0gdGV4dC13aGl0ZSBmb250LWV4dHJhYm9sZCByb3VuZGVkLXhsIHRleHQteHMgc2hhZG93LW1kIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgZm9udC1hcmFiaWNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwi2KrYrdiv2YrYqyDZiNmF2LLYp9mF2YbYqSDYp9mE2KjZitin2YbYp9iqINmI2KfZhNiu2LXZiNmF2KfYqiDYp9mE2YXYs9is2YTYqSDZhNmE2YXZiNi42YHZitmGINmF2YYg2YbYuNin2YUg2KfZhNmF2YjYp9ix2K8g2KfZhNio2LTYsdmK2Kkg2YXYqNin2LTYsdipINmE2YfYsNinINin2YTYtNmH2LFcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFJlZnJlc2hDdyBjbGFzc05hbWU9XCJ3LTQgaC00XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj7Zhdiy2KfZhdmG2Kkg2KjZitin2YbYp9iqINin2YTZhdmI2KfYsdivINin2YTYqNi02LHZitipIPCflIQ8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVTdWJtaXRGb3JSZXZpZXd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNSBweS0yIGJnLWluZGlnby02MDAgaG92ZXI6YmctaW5kaWdvLTcwMCB0ZXh0LXdoaXRlIGZvbnQtZXh0cmFib2xkIHJvdW5kZWQteGwgdGV4dC14cyBzaGFkb3ctbWQgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBmb250LWFyYWJpY1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Q2hlY2tDaXJjbGUyIGNsYXNzTmFtZT1cInctNCBoLTRcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgINiq2YLYr9mK2YUg2YXYs9mK2LEg2KfZhNix2YjYp9iq2Kgg2YTZhNmF2LHYp9is2LnYqSDZiNin2YTYqtiv2YLZitmCIPCfmoBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgICAgICAgICAge3NlbGVjdGVkUnVuLnN0YXR1cyA9PT0gXCJQZW5kaW5nIFJldmlld1wiICYmIGlzUmV2aWV3ZXIgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldElzTW9kUmVxdWVzdE1vZGFsT3Blbih0cnVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTIgYmctcm9zZS01MCBob3ZlcjpiZy1yb3NlLTEwMCB0ZXh0LXJvc2UtNzAwIGJvcmRlciBib3JkZXItcm9zZS0zMDAgZm9udC1leHRyYWJvbGQgcm91bmRlZC14bCB0ZXh0LXhzIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgZm9udC1hcmFiaWNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPEFsZXJ0Q2lyY2xlIGNsYXNzTmFtZT1cInctNCBoLTRcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgINi32YTYqCDYqti52K/ZitmE2KfYqiDYudmE2Ykg2KfZhNmF2LPZitixIOKaoO+4j1xuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17aGFuZGxlQ29uZmlybVJldmlld31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC01IHB5LTIgYmctYmx1ZS02MDAgaG92ZXI6YmctYmx1ZS03MDAgdGV4dC13aGl0ZSBmb250LWV4dHJhYm9sZCByb3VuZGVkLXhsIHRleHQteHMgc2hhZG93LW1kIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgZm9udC1hcmFiaWNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFVzZXJDaGVjayBjbGFzc05hbWU9XCJ3LTQgaC00XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICDZhdi12KfYr9mC2Kkg2KfZhNiq2K/ZgtmK2YIg2YjYqtij2YPZitivINin2YTYrNin2YfYstmK2Kkg4pyTXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICAgICAgICAgIHsoc2VsZWN0ZWRSdW4uc3RhdHVzID09PSBcIk5lZWRzIE1vZGlmaWNhdGlvblwiIHx8IHNlbGVjdGVkUnVuLnN0YXR1cyA9PT0gXCJVbmRlciBNb2RpZmljYXRpb25cIikgJiYgaXNBY2NvdW50YW50ICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG9wZW5SZXFzID0gcnVuTW9kaWZpY2F0aW9uUmVxdWVzdHMuZmlsdGVyKChyKSA9PiByLnN0YXR1cyA9PT0gXCJPcGVuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcGVuUmVxcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93VG9hc3QoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwi4pqg77iPINmK2LHYrNmJINit2YQg2YPYp9mB2Kkg2LfZhNio2KfYqiDYp9mE2KrYudiv2YrZhCDZiNin2YTYsdivINi52YTZitmH2Kcg2KPZiNmE2KfZiyDZgtio2YQg2KXYsdiz2KfZhCDZg9i02YEg2KfZhNix2YjYp9iq2Kgg2YXYsdipINij2K7YsdmJINmE2YTZhdix2KfYrNi52KkhXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwi4pqg77iPIFBsZWFzZSBhZGRyZXNzIGFuZCByZXNwb25kIHRvIGFsbCBtb2RpZmljYXRpb24gcmVxdWVzdHMgYmVmb3JlIHJlLXN1Ym1pdHRpbmchXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZXJyb3JcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlU3VibWl0Rm9yUmV2aWV3KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTUgcHktMiBiZy1hbWJlci01MDAgaG92ZXI6YmctYW1iZXItNjAwIHRleHQtd2hpdGUgZm9udC1leHRyYWJvbGQgcm91bmRlZC14bCB0ZXh0LXhzIHNoYWRvdy1tZCB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGZvbnQtYXJhYmljXCJcbiAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPENoZWNrQ2lyY2xlMiBjbGFzc05hbWU9XCJ3LTQgaC00XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAg2KXYsdiz2KfZhCDZhNiq2KPZg9mK2K8g2KfZhNmF2LHYp9is2LnYqSDYqNi52K8g2KfZhNiq2LnYr9mK2YQg8J+agFxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICAgICAgICAgIHtzZWxlY3RlZFJ1bi5zdGF0dXMgPT09IFwiUGVuZGluZyBGaW5hbCBBcHByb3ZhbFwiICYmIGlzUmV2aWV3ZXIgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVGaW5hbEFwcHJvdmFsfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC01IHB5LTIgYmctZW1lcmFsZC02MDAgaG92ZXI6YmctZW1lcmFsZC03MDAgdGV4dC13aGl0ZSBmb250LWV4dHJhYm9sZCByb3VuZGVkLXhsIHRleHQteHMgc2hhZG93LW1kIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgZm9udC1hcmFiaWNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8VXNlckNoZWNrIGNsYXNzTmFtZT1cInctNCBoLTRcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICDYp9mE2KfYudiq2YXYp9ivINin2YTZhtmH2KfYptmKINmI2KfZhNmC2LfYudmKINmE2YTZhdiz2YrYsSDwn5GRXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgICAgICAgICAge3NlbGVjdGVkUnVuLnN0YXR1cyA9PT0gXCJBcHByb3ZlZFwiICYmIGlzUGF5ZXIgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNhdmUgaXNUcmFuc2ZlcnJlZCB0byBzZXJ2ZXIvc2VsZWN0ZWRSdW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB1cGRhdGVkUnVuID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uc2VsZWN0ZWRSdW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbXBsb3llZXM6IHJ1bkVtcGxveWVlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0U2VsZWN0ZWRSdW4odXBkYXRlZFJ1bik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0UGF5cm9sbFJ1bnMocGF5cm9sbFJ1bnMubWFwKHIgPT4gci5pZCA9PT0gc2VsZWN0ZWRSdW4uaWQgPyB1cGRhdGVkUnVuIDogcikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3dUb2FzdChcItiq2YUg2K3Zgdi4INit2KfZhNipINin2YTYqtit2YjZitmEINmE2YTZhdmI2LjZgdmK2YYg2KjZhtis2KfYrSFcIiwgXCJUcmFuc2ZlciBzdGF0dXNlcyBzYXZlZCBzdWNjZXNzZnVsbHkhXCIsIFwic3VjY2Vzc1wiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNSBweS0yIGJnLWVtZXJhbGQtMTAwIGhvdmVyOmJnLWVtZXJhbGQtMjAwIHRleHQtZW1lcmFsZC04MDAgZm9udC1leHRyYWJvbGQgcm91bmRlZC14bCB0ZXh0LXhzIHNoYWRvdy1zbSB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGZvbnQtYXJhYmljXCJcbiAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+2K3Zgdi4INit2KfZhNipINin2YTYqtit2YjZitmEICjZitiv2YjZiikg8J+Svjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgIGNvbnN0IGFsbENoZWNrZWQgPSBydW5FbXBsb3llZXMuZXZlcnkoZSA9PiBlLmlzVHJhbnNmZXJyZWQpO1xuICAgICAgICBpZiAoIWFsbENoZWNrZWQpIHtcbiAgICAgICAgICAgIHNob3dUb2FzdChcItmK2KzYqCDZiNi22Lkg2LnZhNin2YXYqSAo2KrZhSDYp9mE2KrYrdmI2YrZhCkg2YTYrNmF2YrYuSDYp9mE2YXZiNi42YHZitmGINmC2KjZhCDYp9mE2KfYudiq2YXYp9ivINin2YTZhtmH2KfYptmKINmI2KXYutmE2KfZgiDYp9mE2YXYs9mK2LFcIiwgXCJNdXN0IG1hcmsgYWxsIGVtcGxveWVlcyBhcyB0cmFuc2ZlcnJlZCBmaXJzdFwiLCBcImVycm9yXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHNldElzVHJhbnNmZXJNb2RhbE9wZW4odHJ1ZSk7XG4gICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNSBweS0yIGJnLXB1cnBsZS02MDAgaG92ZXI6YmctcHVycGxlLTcwMCB0ZXh0LXdoaXRlIGZvbnQtZXh0cmFib2xkIHJvdW5kZWQteGwgdGV4dC14cyBzaGFkb3ctbWQgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBmb250LWFyYWJpY1wiXG4gICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxDcmVkaXRDYXJkIGNsYXNzTmFtZT1cInctNCBoLTRcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICDYqtiz2KzZitmEINmI2KrZiNir2YrZgiDYqtit2YjZitmEINin2YTYsdmI2KfYqtioINmE2YTZhdi12LHZgSDwn5K4XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgIFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1zbGF0ZS05MDAgdGV4dC13aGl0ZSBwLTQgZm9udC1ibGFjayBmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1jZW50ZXIgdGV4dC14cyByb3VuZGVkLXQtMnhsIGZvbnQtYXJhYmljXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPtis2K/ZiNmEINio2YrYp9mG2KfYqiDZiNi52YLZiNivINin2YTZhdmI2LjZgdmK2YYg2KfZhNmF2LPYqtit2YLZitmGINin2YTYsdmI2KfYqtioINmH2LDYpyDYp9mE2LTZh9ixPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJiZy1zbGF0ZS04MDAgcHgtMyBweS0xIHJvdW5kZWQtZnVsbCB0ZXh0LVsjMDBBRUVGXSBmb250LW1vbm8gZm9udC1ib2xkXCI+e3J1bkVtcGxveWVlcy5sZW5ndGh9INmF2YjYuNmBPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTcwMFwiPtiq2LXZgdmK2Kkg2KfZhNio2YbZgzo8L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgIDxzZWxlY3RcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtiYW5rRmlsdGVyfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRCYW5rRmlsdGVyKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInAtMiBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCByb3VuZGVkLWxnIHRleHQteHNcIlxuICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJBbGxcIj7Yp9mE2KzZhdmK2Lk8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtBcnJheS5mcm9tKG5ldyBTZXQocnVuRW1wbG95ZWVzLm1hcChlID0+IGUuYmFua05hbWUgfHwgXCJDYXNoXCIpKSkubWFwKGIgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIGtleT17Yn0gdmFsdWU9e2J9PntifTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3ZlcmZsb3cteC1hdXRvIGJvcmRlci14IGJvcmRlci1iIGJvcmRlci1zbGF0ZS0yMDAgcm91bmRlZC1iLTJ4bFwiPlxuICAgICAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3NOYW1lPVwidy1mdWxsIG1pbi13LVsyMjAwcHhdIHRleHQteHMgc206dGV4dC1bMTNweF0gdGV4dC1yaWdodCBmb250LXNhbnMgYm9yZGVyLWNvbGxhcHNlIHJlbGF0aXZlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHRoZWFkIGNsYXNzTmFtZT1cInN0aWNreSB0b3AtMCBiZy1zbGF0ZS0xMDAgc2hhZG93LXhzIHotMTAgYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTIwMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNzAwIGZvbnQtZXh0cmFib2xkIHRleHQteHMgdXBwZXJjYXNlIGJnLXNsYXRlLTEwMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHktNCBweC00IHRleHQtcmlnaHQgc3RpY2t5IHJpZ2h0LTAgYmctc2xhdGUtMTAwIHotMTAgYm9yZGVyLWwgYm9yZGVyLXNsYXRlLTIwMFwiPtin2YTZhdmI2LjZgSDZiNio2YrYp9mG2KfYqtmHPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB5LTQgcHgtNCB0ZXh0LXJpZ2h0IHRleHQtc2t5LTgwMFwiPtin2YTYrdiz2KfYqCDYp9mE2KjZhtmD2Yog8J+PpjwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweS00IHB4LTMgdGV4dC1yaWdodFwiPtin2YTYo9iz2KfYs9mKPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB5LTQgcHgtMyB0ZXh0LXJpZ2h0XCI+2KjYr9mEINiz2YPZhjwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweS00IHB4LTMgdGV4dC1yaWdodFwiPtio2K/ZhCDZhtmC2YQ8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHktNCBweC0zIHRleHQtcmlnaHRcIj7YqNiv2YQg2KXYudin2LTYqTwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweS00IHB4LTMgdGV4dC1yaWdodCB0ZXh0LWluZGlnby02MDBcIj7YqNiv2YQg2YXYr9ipIC8g2LPYp9i52KfYqjwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweS00IHB4LTMgdGV4dC1yaWdodCB0ZXh0LWluZGlnby02MDBcIj7Yo9mI2YHYsdiq2KfZitmFICjYsyk8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHktNCBweC0zIHRleHQtcmlnaHQgdGV4dC1pbmRpZ28tNjAwXCI+2KPZiNmB2LHYqtin2YrZhSAo2YXYqNmE2LopPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB5LTQgcHgtMyB0ZXh0LXJpZ2h0IHRleHQtWyMwMDcyQkNdXCI+2KjYr9mE2KfYqiDYo9iu2LHZiTwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweS00IHB4LTMgdGV4dC1yaWdodCB0ZXh0LXJvc2UtNjAwXCI+2K7YtdmFINin2YTYs9mE2YE8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHktNCBweC0zIHRleHQtcmlnaHQgdGV4dC1yb3NlLTYwMFwiPtiu2LXZhSDYp9mE2LrZitin2Kg8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHktNCBweC0zIHRleHQtcmlnaHQgdGV4dC1yb3NlLTYwMFwiPtiu2LXZhSDYp9mE2KrYo9iu2YrYsTwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweS00IHB4LTMgdGV4dC1yaWdodCB0ZXh0LXJvc2UtNjAwXCI+2K7YtdmFINin2YTYrNiy2KfYodin2Ko8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHktNCBweC0zIHRleHQtcmlnaHQgdGV4dC1yb3NlLTYwMFwiPtiq2KPZhdmK2YbYp9iqIEdPU0k8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHktNCBweC0zIHRleHQtcmlnaHQgdGV4dC1yb3NlLTYwMFwiPtiu2LXZiNmF2KfYqiDYo9iu2LHZiTwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweS00IHB4LTMgdGV4dC1yaWdodCB0ZXh0LWFtYmVyLTYwMCBmb250LWJsYWNrXCI+2YXZj9iv2K88L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHktNCBweC0zIHRleHQtcmlnaHQgdGV4dC1lbWVyYWxkLTYwMCBmb250LWJsYWNrXCI+2KjYp9mC2Yog2KfZhNix2KfYqtioPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB5LTQgcHgtMyB0ZXh0LWNlbnRlclwiPtiq2YUg2KfZhNiq2K3ZiNmK2YTYnzwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweS00IHB4LTQgdGV4dC1sZWZ0XCI+2KXYrNix2KfYodin2Ko8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICA8L3RoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keSBjbGFzc05hbWU9XCJkaXZpZGUteSBkaXZpZGUtc2xhdGUtMjAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7cnVuRW1wbG95ZWVzLmZpbHRlcihlID0+IGJhbmtGaWx0ZXIgPT09IFwiQWxsXCIgfHwgKGUuYmFua05hbWUgfHwgXCJDYXNoXCIpID09PSBiYW5rRmlsdGVyKS5tYXAoKGVtcCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpc0VkaXRpbmcgPSBlZGl0aW5nRW1wbG95ZWVJZCA9PT0gZW1wLmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjYW5Nb2RpZnlSb3cgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkUnVuLnN0YXR1cyA9PT0gXCJEcmFmdFwiIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRSdW4uc3RhdHVzID09PSBcIk5lZWRzIE1vZGlmaWNhdGlvblwiIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRSdW4uc3RhdHVzID09PSBcIlVuZGVyIE1vZGlmaWNhdGlvblwiO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGtleT17ZW1wLmlkfSBjbGFzc05hbWU9XCJob3ZlcjpiZy1zbGF0ZS01MC84MCB0cmFuc2l0aW9uLWNvbG9yc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB5LTQgcHgtNCBzdGlja3kgcmlnaHQtMCBiZy13aGl0ZSB6LTUgYm9yZGVyLWwgYm9yZGVyLXNsYXRlLTIwMCBzaGFkb3cteHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmb250LWV4dHJhYm9sZCB0ZXh0LXNsYXRlLTkwMCB0ZXh0LXhzIHNtOnRleHQtWzEzLjVweF1cIj57ZW1wLmFyYWJpY05hbWV9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1bMTAuNXB4XSB0ZXh0LXNsYXRlLTUwMCBmb250LW1vbm8gZm9udC1ib2xkIG10LTAuNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIElEOiB7ZW1wLmVtcGxveWVlSWR9IHwge2VtcC5qb2JUaXRsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogQkFOSyBJTkZPICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB5LTQgcHgtNCBiZy1za3ktNTAvMjBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2lzRWRpdGluZyA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2VkaXRFbXBsb3llZUZvcm0uYmFua05hbWUgPz8gZW1wLmJhbmtOYW1lID8/IFwiXCJ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwi2KfYs9mFINin2YTYqNmG2YNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdEVtcGxveWVlRm9ybSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5lZGl0RW1wbG95ZWVGb3JtLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFua05hbWU6IGUudGFyZ2V0LnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy0yOCBweC0yIHB5LTEuNSBib3JkZXItMiBib3JkZXItc2t5LTIwMCBmb2N1czpib3JkZXItc2t5LTUwMCByb3VuZGVkLWxnIHRleHQtWzEwLjVweF0gZm9udC1ib2xkIHNoYWRvdy1zbVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2VkaXRFbXBsb3llZUZvcm0uaWJhbiA/PyBlbXAuaWJhbiA/PyBcIlwifVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIklCQU5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdEVtcGxveWVlRm9ybSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5lZGl0RW1wbG95ZWVGb3JtLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWJhbjogZS50YXJnZXQudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTQ0IHB4LTIgcHktMS41IGJvcmRlci0yIGJvcmRlci1za3ktMjAwIGZvY3VzOmJvcmRlci1za3ktNTAwIHJvdW5kZWQtbGcgdGV4dC1bMTAuNXB4XSBmb250LW1vbm8gc2hhZG93LXNtXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRTZWxlY3RlZEJhbmtFbXBsb3llZShlbXApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRJc0JhbmtNb2RhbE9wZW4odHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ0FjdGlvblRvQXVkaXQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogXCLYudix2LYg2KrZgdin2LXZitmEINin2YTYqNmG2YNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXlyb2xsUnVuSWQ6IHNlbGVjdGVkUnVuLmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVtcGxveWVlSWQ6IGVtcC5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3RlczogYNi52LHYtiDYqNmK2KfZhtin2Kog2KfZhNit2LPYp9ioINin2YTYqNmG2YPZiiDZhNmE2YXZiNi42YEgJHtlbXAuYXJhYmljTmFtZX1gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImN1cnNvci1wb2ludGVyIGdyb3VwIGZsZXggZmxleC1jb2wgaXRlbXMtc3RhcnQgaG92ZXI6Ymctc2t5LTUwIHAtMS41IHJvdW5kZWQtbGcgdHJhbnNpdGlvbi1hbGxcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImJnLXNreS0xMDAgdGV4dC1za3ktODAwIHRleHQtWzEwcHhdIGZvbnQtZXh0cmFib2xkIHB4LTIgcHktMC41IHJvdW5kZWQtZnVsbCBtYi0xIGdyb3VwLWhvdmVyOmJnLVsjMDA3MkJDXSBncm91cC1ob3Zlcjp0ZXh0LXdoaXRlIHRyYW5zaXRpb24tYWxsIGZvbnQtYXJhYmljXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtlbXAuYmFua05hbWUgfHwgXCLigJRcIn0g8J+PplxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1tb25vIHRleHQtc2xhdGUtNTAwIHRyYWNraW5nLXdpZGVyIGZvbnQtc2VtaWJvbGQgc2VsZWN0LWFsbFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZW1wLmliYW4gfHwgXCLigJRcIn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsvKiBCQVNJQyAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweS00IHB4LTMgZm9udC1tb25vIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTcwMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aXNFZGl0aW5nID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cIm51bWJlclwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17ZWRpdEVtcGxveWVlRm9ybS5iYXNpY1NhbGFyeSA/PyBlbXAuYmFzaWNTYWxhcnl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRFbXBsb3llZUZvcm0oe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLmVkaXRFbXBsb3llZUZvcm0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFzaWNTYWxhcnk6IE51bWJlcihlLnRhcmdldC52YWx1ZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTI0IHB4LTIgcHktMS41IGJvcmRlci0yIGJvcmRlci1zbGF0ZS0zMDAgZm9jdXM6Ym9yZGVyLWluZGlnby01MDAgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtbW9ubyBmb250LWJvbGQgdGV4dC1zbGF0ZS05MDAgdGV4dC1jZW50ZXIgc2hhZG93LXNtXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVtcC5iYXNpY1NhbGFyeS50b0xvY2FsZVN0cmluZygnZW4tVVMnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIEhPVVNJTkcgKi99XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicHktNCBweC0zIGZvbnQtbW9ubyBmb250LWJvbGQgdGV4dC1zbGF0ZS03MDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2lzRWRpdGluZyA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJudW1iZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2VkaXRFbXBsb3llZUZvcm0uaG91c2luZ0FsbG93YW5jZSA/PyBlbXAuaG91c2luZ0FsbG93YW5jZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdEVtcGxveWVlRm9ybSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uZWRpdEVtcGxveWVlRm9ybSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3VzaW5nQWxsb3dhbmNlOiBOdW1iZXIoZS50YXJnZXQudmFsdWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy0yNCBweC0yIHB5LTEuNSBib3JkZXItMiBib3JkZXItc2xhdGUtMzAwIGZvY3VzOmJvcmRlci1pbmRpZ28tNTAwIHJvdW5kZWQtbGcgdGV4dC14cyBmb250LW1vbm8gZm9udC1ib2xkIHRleHQtc2xhdGUtOTAwIHRleHQtY2VudGVyIHNoYWRvdy1zbVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbXAuaG91c2luZ0FsbG93YW5jZS50b0xvY2FsZVN0cmluZygnZW4tVVMnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIFRSQU5TUE9SVCAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweS00IHB4LTMgZm9udC1tb25vIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTcwMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aXNFZGl0aW5nID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cIm51bWJlclwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17ZWRpdEVtcGxveWVlRm9ybS50cmFuc3BvcnRBbGxvd2FuY2UgPz8gZW1wLnRyYW5zcG9ydEFsbG93YW5jZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdEVtcGxveWVlRm9ybSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uZWRpdEVtcGxveWVlRm9ybSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc3BvcnRBbGxvd2FuY2U6IE51bWJlcihlLnRhcmdldC52YWx1ZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTI0IHB4LTIgcHktMS41IGJvcmRlci0yIGJvcmRlci1zbGF0ZS0zMDAgZm9jdXM6Ym9yZGVyLWluZGlnby01MDAgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtbW9ubyBmb250LWJvbGQgdGV4dC1zbGF0ZS05MDAgdGV4dC1jZW50ZXIgc2hhZG93LXNtXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVtcC50cmFuc3BvcnRBbGxvd2FuY2UudG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsvKiBMSVZJTkcgQUxMT1dBTkNFICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB5LTQgcHgtMyBmb250LW1vbm8gZm9udC1ib2xkIHRleHQtc2xhdGUtNzAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtpc0VkaXRpbmcgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwibnVtYmVyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtlZGl0RW1wbG95ZWVGb3JtLmxpdmluZ0FsbG93YW5jZSA/PyBlbXAubGl2aW5nQWxsb3dhbmNlID8/IGVtcC5mb29kQWxsb3dhbmNlID8/IDB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRFbXBsb3llZUZvcm0oe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLmVkaXRFbXBsb3llZUZvcm0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGl2aW5nQWxsb3dhbmNlOiBOdW1iZXIoZS50YXJnZXQudmFsdWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy0yNCBweC0yIHB5LTEuNSBib3JkZXItMiBib3JkZXItc2xhdGUtMzAwIGZvY3VzOmJvcmRlci1pbmRpZ28tNTAwIHJvdW5kZWQtbGcgdGV4dC14cyBmb250LW1vbm8gZm9udC1ib2xkIHRleHQtc2xhdGUtOTAwIHRleHQtY2VudGVyIHNoYWRvdy1zbVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZW1wLmxpdmluZ0FsbG93YW5jZSA/PyBlbXAuZm9vZEFsbG93YW5jZSA/PyAwKS50b0xvY2FsZVN0cmluZygnZW4tVVMnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIE1VRERBSCBBTU9VTlQgKi99XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicHktNCBweC0zIGZvbnQtbW9ubyB0ZXh0LWluZGlnby02MDAgZm9udC1ib2xkXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtpc0VkaXRpbmcgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwibnVtYmVyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtlZGl0RW1wbG95ZWVGb3JtLm11ZGRhaEFtb3VudCA/PyBlbXAubXVkZGFoQW1vdW50fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0RW1wbG95ZWVGb3JtKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5lZGl0RW1wbG95ZWVGb3JtLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG11ZGRhaEFtb3VudDogTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctMjQgcHgtMiBweS0xLjUgYm9yZGVyLTIgYm9yZGVyLWluZGlnby0zMDAgZm9jdXM6Ym9yZGVyLWluZGlnby01MDAgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtbW9ubyBmb250LWJvbGQgdGV4dC1pbmRpZ28tOTAwIHRleHQtY2VudGVyIGJnLWluZGlnby01MCBzaGFkb3ctc21cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGVtcC5tdWRkYWhBbW91bnQgfHwgMCkudG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsvKiBPVkVSVElNRSBIT1VSUyAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweS00IHB4LTMgZm9udC1tb25vIGZvbnQtYm9sZCB0ZXh0LWluZGlnby02MDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2lzRWRpdGluZyA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJudW1iZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2VkaXRFbXBsb3llZUZvcm0ub3ZlcnRpbWVIb3VycyA/PyBlbXAub3ZlcnRpbWVIb3Vyc31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBocnMgPSBOdW1iZXIoZS50YXJnZXQudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBiYXNlID0gZWRpdEVtcGxveWVlRm9ybS5iYXNpY1NhbGFyeSA/PyBlbXAuYmFzaWNTYWxhcnk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBheSA9IHVwZGF0ZUhvdXJseU90QW1vdW50KGhycywgYmFzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRFbXBsb3llZUZvcm0oe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLmVkaXRFbXBsb3llZUZvcm0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcnRpbWVIb3VyczogaHJzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG92ZXJ0aW1lQW1vdW50OiBwYXksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctMjAgcHgtMiBweS0xLjUgYm9yZGVyLTIgYm9yZGVyLXNsYXRlLTMwMCBmb2N1czpib3JkZXItaW5kaWdvLTUwMCByb3VuZGVkLWxnIHRleHQteHMgZm9udC1tb25vIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTkwMCB0ZXh0LWNlbnRlciBzaGFkb3ctc21cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW1wLm92ZXJ0aW1lSG91cnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsvKiBPVkVSVElNRSBBTU9VTlQgKi99XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicHktNCBweC0zIGZvbnQtbW9ubyB0ZXh0LWluZGlnby02MDAgZm9udC1ib2xkXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtpc0VkaXRpbmcgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwibnVtYmVyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtlZGl0RW1wbG95ZWVGb3JtLm92ZXJ0aW1lQW1vdW50ID8/IGVtcC5vdmVydGltZUFtb3VudH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdEVtcGxveWVlRm9ybSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uZWRpdEVtcGxveWVlRm9ybSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdmVydGltZUFtb3VudDogTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctMjQgcHgtMiBweS0xLjUgYm9yZGVyLTIgYm9yZGVyLXNsYXRlLTMwMCBmb2N1czpib3JkZXItaW5kaWdvLTUwMCByb3VuZGVkLWxnIHRleHQteHMgZm9udC1tb25vIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTkwMCB0ZXh0LWNlbnRlciBzaGFkb3ctc21cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW1wLm92ZXJ0aW1lQW1vdW50LnRvTG9jYWxlU3RyaW5nKCdlbi1VUycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogT1RIRVIgQUxMT1dBTkNFUyAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweS00IHB4LTMgZm9udC1tb25vIGZvbnQtYm9sZCB0ZXh0LVsjMDA3MkJDXVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aXNFZGl0aW5nID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cIm51bWJlclwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17ZWRpdEVtcGxveWVlRm9ybS5vdGhlckFsbG93YW5jZXMgPz8gZW1wLm90aGVyQWxsb3dhbmNlcyA/PyAwfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0RW1wbG95ZWVGb3JtKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5lZGl0RW1wbG95ZWVGb3JtLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG90aGVyQWxsb3dhbmNlczogTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctMjQgcHgtMiBweS0xLjUgYm9yZGVyLTIgYm9yZGVyLXNsYXRlLTMwMCBmb2N1czpib3JkZXItaW5kaWdvLTUwMCByb3VuZGVkLWxnIHRleHQteHMgZm9udC1tb25vIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTkwMCB0ZXh0LWNlbnRlciBzaGFkb3ctc21cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGVtcC5vdGhlckFsbG93YW5jZXMgfHwgMCkudG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsvKiBMT0FOUyBERURVQ1RJT04gKi99XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicHktNCBweC0zIGZvbnQtbW9ubyBmb250LWJvbGQgdGV4dC1yb3NlLTYwMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aXNFZGl0aW5nID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cIm51bWJlclwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtlZGl0RW1wbG95ZWVGb3JtLmxvYW5zRGVkdWN0aW9uID8/IGVtcC5sb2Fuc0RlZHVjdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRFbXBsb3llZUZvcm0oe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uZWRpdEVtcGxveWVlRm9ybSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvYW5zRGVkdWN0aW9uOiBOdW1iZXIoZS50YXJnZXQudmFsdWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy0yNCBweC0yIHB5LTEuNSBib3JkZXItMiBib3JkZXItc2xhdGUtMzAwIGZvY3VzOmJvcmRlci1pbmRpZ28tNTAwIHJvdW5kZWQtbGcgdGV4dC14cyBmb250LW1vbm8gZm9udC1ib2xkIHRleHQtc2xhdGUtOTAwIHRleHQtY2VudGVyIHNoYWRvdy1zbVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2VkaXRFbXBsb3llZUZvcm0ubG9hbkRlZHVjdGlvblJlYXNvbiA/PyBlbXAubG9hbkRlZHVjdGlvblJlYXNvbiA/PyBcIlwifVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cItin2YTYs9io2KggKlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0RW1wbG95ZWVGb3JtKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLmVkaXRFbXBsb3llZUZvcm0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FuRGVkdWN0aW9uUmVhc29uOiBlLnRhcmdldC52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctMjQgcHgtMS41IHB5LTEgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcm91bmRlZCB0ZXh0LVsxMHB4XVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVtcC5sb2Fuc0RlZHVjdGlvbiA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRTZWxlY3RlZERlZHVjdGlvbkVtcGxveWVlKGVtcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Q2xpY2tlZERlZHVjdGlvblR5cGUoXCJMb2FuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldElzRGVkdWN0aW9uTW9kYWxPcGVuKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgJHtlbXAubG9hbnNEZWR1Y3Rpb24gPiAwID8gXCJjdXJzb3ItcG9pbnRlciBob3Zlcjp1bmRlcmxpbmUgZm9udC1ib2xkXCIgOiBcInRleHQtc2xhdGUtMzAwXCJ9YH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZW1wLmxvYW5zRGVkdWN0aW9uLnRvTG9jYWxlU3RyaW5nKCdlbi1VUycpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIEFCU0VOQ0UgREVEVUNUSU9OICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB5LTQgcHgtMyBmb250LW1vbm8gZm9udC1ib2xkIHRleHQtcm9zZS02MDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2lzRWRpdGluZyA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJudW1iZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17ZWRpdEVtcGxveWVlRm9ybS5hYnNlbmNlRGVkdWN0aW9uID8/IGVtcC5hYnNlbmNlRGVkdWN0aW9uID8/IDB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0RW1wbG95ZWVGb3JtKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLmVkaXRFbXBsb3llZUZvcm0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhYnNlbmNlRGVkdWN0aW9uOiBOdW1iZXIoZS50YXJnZXQudmFsdWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy0yNCBweC0yIHB5LTEuNSBib3JkZXItMiBib3JkZXItc2xhdGUtMzAwIGZvY3VzOmJvcmRlci1pbmRpZ28tNTAwIHJvdW5kZWQtbGcgdGV4dC14cyBmb250LW1vbm8gZm9udC1ib2xkIHRleHQtc2xhdGUtOTAwIHRleHQtY2VudGVyIHNoYWRvdy1zbVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2VkaXRFbXBsb3llZUZvcm0uYWJzZW5jZURlZHVjdGlvblJlYXNvbiA/PyBlbXAuYWJzZW5jZURlZHVjdGlvblJlYXNvbiA/PyBcIlwifVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cItin2YTYs9io2KggKlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0RW1wbG95ZWVGb3JtKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLmVkaXRFbXBsb3llZUZvcm0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhYnNlbmNlRGVkdWN0aW9uUmVhc29uOiBlLnRhcmdldC52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctMjQgcHgtMS41IHB5LTEgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcm91bmRlZCB0ZXh0LVsxMHB4XVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChlbXAuYWJzZW5jZURlZHVjdGlvbiB8fCAwKSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRTZWxlY3RlZERlZHVjdGlvbkVtcGxveWVlKGVtcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Q2xpY2tlZERlZHVjdGlvblR5cGUoXCJBYnNlbmNlXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldElzRGVkdWN0aW9uTW9kYWxPcGVuKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgJHsoZW1wLmFic2VuY2VEZWR1Y3Rpb24gfHwgMCkgPiAwID8gXCJjdXJzb3ItcG9pbnRlciBob3Zlcjp1bmRlcmxpbmUgZm9udC1ib2xkXCIgOiBcInRleHQtc2xhdGUtMzAwXCJ9YH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7KGVtcC5hYnNlbmNlRGVkdWN0aW9uIHx8IDApLnRvTG9jYWxlU3RyaW5nKCdlbi1VUycpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIExBVEUgREVEVUNUSU9OICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB5LTQgcHgtMyBmb250LW1vbm8gZm9udC1ib2xkIHRleHQtcm9zZS02MDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2lzRWRpdGluZyA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJudW1iZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17ZWRpdEVtcGxveWVlRm9ybS5sYXRlRGVkdWN0aW9uID8/IGVtcC5sYXRlRGVkdWN0aW9uID8/IDB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0RW1wbG95ZWVGb3JtKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLmVkaXRFbXBsb3llZUZvcm0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXRlRGVkdWN0aW9uOiBOdW1iZXIoZS50YXJnZXQudmFsdWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy0yNCBweC0yIHB5LTEuNSBib3JkZXItMiBib3JkZXItc2xhdGUtMzAwIGZvY3VzOmJvcmRlci1pbmRpZ28tNTAwIHJvdW5kZWQtbGcgdGV4dC14cyBmb250LW1vbm8gZm9udC1ib2xkIHRleHQtc2xhdGUtOTAwIHRleHQtY2VudGVyIHNoYWRvdy1zbVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2VkaXRFbXBsb3llZUZvcm0ubGF0ZURlZHVjdGlvblJlYXNvbiA/PyBlbXAubGF0ZURlZHVjdGlvblJlYXNvbiA/PyBcIlwifVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cItin2YTYs9io2KggKlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0RW1wbG95ZWVGb3JtKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLmVkaXRFbXBsb3llZUZvcm0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXRlRGVkdWN0aW9uUmVhc29uOiBlLnRhcmdldC52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctMjQgcHgtMS41IHB5LTEgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcm91bmRlZCB0ZXh0LVsxMHB4XVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChlbXAubGF0ZURlZHVjdGlvbiB8fCAwKSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRTZWxlY3RlZERlZHVjdGlvbkVtcGxveWVlKGVtcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Q2xpY2tlZERlZHVjdGlvblR5cGUoXCJMYXRlXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldElzRGVkdWN0aW9uTW9kYWxPcGVuKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgJHsoZW1wLmxhdGVEZWR1Y3Rpb24gfHwgMCkgPiAwID8gXCJjdXJzb3ItcG9pbnRlciBob3Zlcjp1bmRlcmxpbmUgZm9udC1ib2xkXCIgOiBcInRleHQtc2xhdGUtMzAwXCJ9YH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7KGVtcC5sYXRlRGVkdWN0aW9uIHx8IDApLnRvTG9jYWxlU3RyaW5nKCdlbi1VUycpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIFBFTkFMVFkgREVEVUNUSU9OICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB5LTQgcHgtMyBmb250LW1vbm8gZm9udC1ib2xkIHRleHQtcm9zZS02MDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2lzRWRpdGluZyA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJudW1iZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17ZWRpdEVtcGxveWVlRm9ybS5wZW5hbHR5RGVkdWN0aW9uID8/IGVtcC5wZW5hbHR5RGVkdWN0aW9uID8/IDB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0RW1wbG95ZWVGb3JtKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLmVkaXRFbXBsb3llZUZvcm0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZW5hbHR5RGVkdWN0aW9uOiBOdW1iZXIoZS50YXJnZXQudmFsdWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy0yNCBweC0yIHB5LTEuNSBib3JkZXItMiBib3JkZXItc2xhdGUtMzAwIGZvY3VzOmJvcmRlci1pbmRpZ28tNTAwIHJvdW5kZWQtbGcgdGV4dC14cyBmb250LW1vbm8gZm9udC1ib2xkIHRleHQtc2xhdGUtOTAwIHRleHQtY2VudGVyIHNoYWRvdy1zbVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2VkaXRFbXBsb3llZUZvcm0ucGVuYWx0eURlZHVjdGlvblJlYXNvbiA/PyBlbXAucGVuYWx0eURlZHVjdGlvblJlYXNvbiA/PyBcIlwifVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cItin2YTYs9io2KggKlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0RW1wbG95ZWVGb3JtKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLmVkaXRFbXBsb3llZUZvcm0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZW5hbHR5RGVkdWN0aW9uUmVhc29uOiBlLnRhcmdldC52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctMjQgcHgtMS41IHB5LTEgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcm91bmRlZCB0ZXh0LVsxMHB4XVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChlbXAucGVuYWx0eURlZHVjdGlvbiB8fCAwKSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRTZWxlY3RlZERlZHVjdGlvbkVtcGxveWVlKGVtcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Q2xpY2tlZERlZHVjdGlvblR5cGUoXCJQZW5hbHR5XCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldElzRGVkdWN0aW9uTW9kYWxPcGVuKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgJHsoZW1wLnBlbmFsdHlEZWR1Y3Rpb24gfHwgMCkgPiAwID8gXCJjdXJzb3ItcG9pbnRlciBob3Zlcjp1bmRlcmxpbmUgZm9udC1ib2xkXCIgOiBcInRleHQtc2xhdGUtMzAwXCJ9YH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7KGVtcC5wZW5hbHR5RGVkdWN0aW9uIHx8IDApLnRvTG9jYWxlU3RyaW5nKCdlbi1VUycpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIEdPU0kgKi99XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicHktNCBweC0zIGZvbnQtbW9ubyBmb250LWJvbGQgdGV4dC1yb3NlLTYwMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aXNFZGl0aW5nID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cIm51bWJlclwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17ZWRpdEVtcGxveWVlRm9ybS5nb3NpRGVkdWN0aW9uID8/IGVtcC5nb3NpRGVkdWN0aW9ufVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0RW1wbG95ZWVGb3JtKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5lZGl0RW1wbG95ZWVGb3JtLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvc2lEZWR1Y3Rpb246IE51bWJlcihlLnRhcmdldC52YWx1ZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTI0IHB4LTIgcHktMS41IGJvcmRlci0yIGJvcmRlci1zbGF0ZS0zMDAgZm9jdXM6Ym9yZGVyLWluZGlnby01MDAgcm91bmRlZC1sZyB0ZXh0LXhzIGZvbnQtbW9ubyBmb250LWJvbGQgdGV4dC1zbGF0ZS05MDAgdGV4dC1jZW50ZXIgc2hhZG93LXNtXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVtcC5nb3NpRGVkdWN0aW9uLnRvTG9jYWxlU3RyaW5nKCdlbi1VUycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogT1RIRVIgREVEVUNUSU9OUyAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweS00IHB4LTMgZm9udC1tb25vIHRleHQtcm9zZS02MDAgZm9udC1ib2xkIHRleHQtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtpc0VkaXRpbmcgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW1wLm90aGVyRGVkdWN0aW9ucyA+IDAgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRTZWxlY3RlZERlZHVjdGlvbkVtcGxveWVlKGVtcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Q2xpY2tlZERlZHVjdGlvblR5cGUoXCJPdGhlclwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRJc0RlZHVjdGlvbk1vZGFsT3Blbih0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMiBweS0xIGJnLXJvc2UtNTAgaG92ZXI6Ymctcm9zZS0xMDAgdGV4dC1yb3NlLTcwMCByb3VuZGVkIGJvcmRlciBib3JkZXItcm9zZS0yMDAgdGV4dC1zbSBmb250LWJvbGQgdHJhbnNpdGlvbi1jb2xvcnNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cItil2K/Yp9ix2Kkg2KfZhNin2LPYqtmC2LfYp9i52KfYqiDYp9mE2KrZgdi12YrZhNmK2KlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZW1wLm90aGVyRGVkdWN0aW9ucy50b0xvY2FsZVN0cmluZygnZW4tVVMnKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRTZWxlY3RlZERlZHVjdGlvbkVtcGxveWVlKGVtcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Q2xpY2tlZERlZHVjdGlvblR5cGUoXCJPdGhlclwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRJc0RlZHVjdGlvbk1vZGFsT3Blbih0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMiBweS0xLjUgYmctcm9zZS0xMDAgdGV4dC1yb3NlLTcwMCBob3ZlcjpiZy1yb3NlLTIwMCByb3VuZGVkIHRleHQtWzExcHhdIGZvbnQtYm9sZCB3aGl0ZXNwYWNlLW5vd3JhcCB0cmFuc2l0aW9uLWNvbG9yc1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgINil2LbYp9mB2Kkg2K7YtdmFICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yIHB5LTEgYmctdHJhbnNwYXJlbnQgaG92ZXI6Ymctcm9zZS01MCB0ZXh0LXJvc2UtNjAwIHJvdW5kZWQgdGV4dC1zbSBmb250LWJvbGQgdHJhbnNpdGlvbi1jb2xvcnNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRTZWxlY3RlZERlZHVjdGlvbkVtcGxveWVlKGVtcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldENsaWNrZWREZWR1Y3Rpb25UeXBlKFwiT3RoZXJcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldElzRGVkdWN0aW9uTW9kYWxPcGVuKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwi2KXYr9in2LHYqSDYp9mE2KfYs9iq2YLYt9in2LnYp9iqINin2YTYqtmB2LXZitmE2YrYqVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2VtcC5vdGhlckRlZHVjdGlvbnMgPiAwID8gZW1wLm90aGVyRGVkdWN0aW9ucy50b0xvY2FsZVN0cmluZygnZW4tVVMnKSA6IFwiMFwifVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIE5FVCBTQUxBUlkgKi99XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicHktNCBweC0zIGZvbnQtbW9ubyB0ZXh0LWVtZXJhbGQtNjAwIGZvbnQtZXh0cmFib2xkIHRleHQtWzEzLjVweF1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2VtcC5uZXRTYWxhcnkudG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJyl9INixLtizXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogQUNUSU9OUyAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweS0zIHB4LTQgdGV4dC1sZWZ0XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBqdXN0aWZ5LWVuZFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtpc0VkaXRpbmcgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlU2F2ZUVtcGxveWVlUm93KGVtcC5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicC0xIGJnLWVtZXJhbGQtNTAwIHRleHQtd2hpdGUgcm91bmRlZCBob3ZlcjpiZy1lbWVyYWxkLTYwMCBmb250LWJvbGQgdGV4dC14c1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCLYrdmB2Lgg2KfZhNiq2LnYr9mK2YTYp9iqXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOKck1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRpbmdFbXBsb3llZUlkKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdEVtcGxveWVlRm9ybSh7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJwLTEgYmctc2xhdGUtMjAwIHRleHQtc2xhdGUtNzAwIHJvdW5kZWQgaG92ZXI6Ymctc2xhdGUtMzAwIGZvbnQtYm9sZCB0ZXh0LXhzXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cItil2YTYutin2KEg2KfZhNiq2LnYr9mK2YRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg4pyVXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtjYW5Nb2RpZnlSb3cgJiYgaXNBY2NvdW50YW50ICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRpbmdFbXBsb3llZUlkKGVtcC5pZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRFbXBsb3llZUZvcm0oZW1wKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJwLTEgdGV4dC1bIzAwNzJCQ10gaG92ZXI6YmctYmx1ZS01MCByb3VuZGVkXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwi2KrYudiv2YrZhCDZitiv2YjZitin2YtcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxFZGl0MyBjbGFzc05hbWU9XCJ3LTMuNSBoLTMuNVwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFNlbGVjdGVkUGF5c2xpcEVtcGxveWVlKGVtcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRJc1BheXNsaXBNb2RhbE9wZW4odHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yIHB5LTEgYmctc2xhdGUtMTAwIGhvdmVyOmJnLXNsYXRlLTIwMCB0ZXh0LXNsYXRlLTcwMCByb3VuZGVkIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMC41XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIti52LHYtiDZg9i02YEg2KfZhNix2KfYqtioINin2YTZgdix2K/ZilwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8RmlsZVRleHQgY2xhc3NOYW1lPVwidy0zIGgtM1wiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg2YPYtNmBINix2KfYqtioXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Y2FuTW9kaWZ5Um93ICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0cnVlKSB7IC8vIEJ5cGFzcyBjb25maXJtIGluIGlmcmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZVJlbW92ZUVtcGxveWVlUm93KGVtcC5pZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yIHB5LTEgYmctcm9zZS01MCBob3ZlcjpiZy1yb3NlLTEwMCB0ZXh0LXJvc2UtNjAwIHJvdW5kZWQgdGV4dC1bMTBweF0gZm9udC1ib2xkIGZsZXggaXRlbXMtY2VudGVyIGdhcC0wLjVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCLYrdiw2YEg2KfZhNmF2YjYuNmBINmF2YYg2KfZhNmF2LPZitixXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VHJhc2gyIGNsYXNzTmFtZT1cInctMyBoLTNcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg2K3YsNmBXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIHsvKiBCb3R0b20gc3VtbWFyaWVzIG9mIHRoZSB0YWJsZSAqL31cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXNsYXRlLTUwIHAtNCBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCByb3VuZGVkLTJ4bCBncmlkIGdyaWQtY29scy0yIG1kOmdyaWQtY29scy02IGdhcC00IHRleHQteHMgbXQtNFwiPlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTMgYmctd2hpdGUgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXNsYXRlLTE1MFwiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTQwMCBmb250LWJvbGQgZm9udC1hcmFiaWNcIj7Ypdis2YXYp9mE2Yog2KfZhNij2LPYp9iz2Yog2KfZhNmF2LPYqtit2YI6PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvbnQtbW9ubyBmb250LWJvbGQgdGV4dC1zbSB0ZXh0LXNsYXRlLTgwMCBtdC0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3J1bkVtcGxveWVlcy5yZWR1Y2UoKHN1bSwgZSkgPT4gc3VtICsgZS5iYXNpY1NhbGFyeSwgMCkudG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJyl9INixLtizXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC0zIGJnLXdoaXRlIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0xNTBcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS00MDAgZm9udC1ib2xkIGZvbnQtYXJhYmljXCI+2KXYrNmF2KfZhNmKINin2YTYqNiv2YTYp9iqINmI2KfZhNmF2YPYqtiz2KjYp9iqOjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmb250LW1vbm8gZm9udC1ib2xkIHRleHQtc20gdGV4dC1pbmRpZ28tNjAwIG10LTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICArXG4gICAgICAgICAgICAgICAgICAgICAge3J1bkVtcGxveWVlc1xuICAgICAgICAgICAgICAgICAgICAgICAgLnJlZHVjZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKHN1bSwgZSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdW0gK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuaG91c2luZ0FsbG93YW5jZSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS50cmFuc3BvcnRBbGxvd2FuY2UgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChlLmxpdmluZ0FsbG93YW5jZSA/PyBlLmZvb2RBbGxvd2FuY2UgPz8gMCkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUub3ZlcnRpbWVBbW91bnQgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChlLm90aGVyQWxsb3dhbmNlcyB8fCAwKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5tdWRkYWhBbW91bnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgIC50b0xvY2FsZVN0cmluZygnZW4tVVMnKX17XCIgXCJ9XG4gICAgICAgICAgICAgICAgICAgICAg2LEu2LNcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTMgYmctd2hpdGUgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXNsYXRlLTE1MFwiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTQwMCBmb250LWJvbGQgZm9udC1hcmFiaWNcIj7Ypdis2YXYp9mE2Yog2KfZhNin2LPYqtmC2LfYp9i52KfYqiDZiNin2YTYrNiy2KfYodin2Ko6PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvbnQtbW9ubyBmb250LWJvbGQgdGV4dC1zbSB0ZXh0LXJvc2UtNjAwIG10LTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAtXG4gICAgICAgICAgICAgICAgICAgICAge3J1bkVtcGxveWVlc1xuICAgICAgICAgICAgICAgICAgICAgICAgLnJlZHVjZSgoc3VtLCBlKSA9PiBzdW0gKyBlLnRvdGFsRGVkdWN0aW9ucywgMClcbiAgICAgICAgICAgICAgICAgICAgICAgIC50b0xvY2FsZVN0cmluZygnZW4tVVMnKX17XCIgXCJ9XG4gICAgICAgICAgICAgICAgICAgICAg2LEu2LNcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTMgYmctd2hpdGUgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXNsYXRlLTE1MFwiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTQwMCBmb250LWJvbGQgZm9udC1hcmFiaWNcIj7Ypdis2YXYp9mE2Yog2YXZj9iv2K86PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvbnQtbW9ubyBmb250LWJvbGQgdGV4dC1zbSB0ZXh0LWFtYmVyLTYwMCBtdC0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3J1bkVtcGxveWVlcy5yZWR1Y2UoKHN1bSwgZSkgPT4gc3VtICsgKGUubXVkZGFoQW1vdW50IHx8IDApLCAwKS50b0xvY2FsZVN0cmluZygnZW4tVVMnKX0g2LEu2LNcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC0zIGJnLXdoaXRlIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0xNTBcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS00MDAgZm9udC1ib2xkIGJsb2NrIG1iLTEgZm9udC1hcmFiaWNcIj5Ub3RhbCBPdmVydGltZSB8INil2KzZhdin2YTZiiDYp9mE2KPZiNmB2LEg2KrYp9mK2YU6PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvbnQtbW9ubyBmb250LWJvbGQgdGV4dC1zbSB0ZXh0LWluZGlnby03MDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7cnVuRW1wbG95ZWVzLnJlZHVjZSgoc3VtLCBlKSA9PiBzdW0gKyAoZS5vdmVydGltZUFtb3VudCB8fCAwKSwgMCkudG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJyl9INixLtizXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNTAwIGZvbnQtbW9ubyBmb250LWJvbGQgbXQtMVwiPlxuICAgICAgICAgICAgICAgICAgICAgIFRvdGFsIE9UIEhvdXJzOiB7cnVuRW1wbG95ZWVzLnJlZHVjZSgoc3VtLCBlKSA9PiBzdW0gKyAoZS5vdmVydGltZUhvdXJzIHx8IDApLCAwKS50b0xvY2FsZVN0cmluZygnZW4tVVMnKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS01MDAgZm9udC1tb25vIGZvbnQtYm9sZFwiPlxuICAgICAgICAgICAgICAgICAgICAgIFRvdGFsIE9UIEFtb3VudDoge3J1bkVtcGxveWVlcy5yZWR1Y2UoKHN1bSwgZSkgPT4gc3VtICsgKGUub3ZlcnRpbWVBbW91bnQgfHwgMCksIDApLnRvTG9jYWxlU3RyaW5nKCdlbi1VUycpfSDYsS5zXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC0zIGJnLXNsYXRlLTkwMCB0ZXh0LXdoaXRlIHJvdW5kZWQteGxcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS00MDAgZm9udC1ib2xkIGZvbnQtYXJhYmljXCI+2LXYp9mB2Yog2KfZhNmF2YrYstin2YbZitipINin2YTZhdi12LHZgdmK2Kkg2YTZhNiq2K3ZiNmK2YQ6PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvbnQtbW9ubyBmb250LWJsYWNrIHRleHQtc20gdGV4dC1lbWVyYWxkLTQwMCBtdC0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAge3J1bkVtcGxveWVlcy5yZWR1Y2UoKHN1bSwgZSkgPT4gc3VtICsgZS5uZXRTYWxhcnksIDApLnRvTG9jYWxlU3RyaW5nKCdlbi1VUycpfSDYsS7Ys1xuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICB7LyogTGVmdCBDb2x1bW46IFNpZGUgRGFzaGJvYXJkIChCZW50byBHcmlkIG9mIFN0YXRzLCBNb2RpZmljYXRpb24gUmVxdWVzdHMsIGFuZCBBdWRpdCBUcmFpbHMpICovfVxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctZnVsbCBiZy1zbGF0ZS01MCBwLTYgYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgc3BhY2UteS02IGdyaWQgZ3JpZC1jb2xzLTEgbWQ6Z3JpZC1jb2xzLTIgZ2FwLTYgcm91bmRlZC0yeGwgc2hhZG93LXNtXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTZcIj5cbiAgICAgICAgICAgICAgICAgIHsvKiBCZW50byBjYXJkIDE6IFN1bW1hcnkgRmluYW5jaWFsIFN0YXRzICovfVxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy13aGl0ZSBwLTUgcm91bmRlZC0yeGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgc3BhY2UteS0zIHNoYWRvdy14c1wiPlxuICAgICAgICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwiZm9udC1ibGFjayB0ZXh0LXNsYXRlLTgwMCB0ZXh0LXhzIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTEwMCBwYi0yIGZvbnQtYXJhYmljXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1lbWVyYWxkLTUwMCBmb250LW1vbm9cIj7wn5OKPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPtmF2YTYrti1INin2YTZhdmK2LLYp9mG2YrYqSDZiNin2YTZhdiz2YrYsTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9oND5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0yIGdhcC0zIHRleHQtWzExcHhdXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1zbGF0ZS01MCBwLTIuNSByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItc2xhdGUtMTAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTQwMCBmb250LWJvbGQgYmxvY2sgbWItMSBmb250LWFyYWJpY1wiPtil2KzZhdin2YTZiiDYp9mE2KPYs9in2LPZijo8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb250LW1vbm8gdGV4dC14cyBmb250LWJsYWNrIHRleHQtc2xhdGUtNzAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHtydW5FbXBsb3llZXMucmVkdWNlKChzdW0sIGUpID0+IHN1bSArIGUuYmFzaWNTYWxhcnksIDApLnRvTG9jYWxlU3RyaW5nKCdlbi1VUycpfSDYsS7Ys1xuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctc2xhdGUtNTAgcC0yLjUgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXNsYXRlLTEwMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS00MDAgZm9udC1ib2xkIGJsb2NrIG1iLTEgZm9udC1hcmFiaWNcIj7Ypdis2YXYp9mE2Yog2KfZhNio2K/ZhNin2Ko6PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1tb25vIHRleHQteHMgZm9udC1ibGFjayB0ZXh0LWluZGlnby02MDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgK3tydW5FbXBsb3llZXMucmVkdWNlKChzdW0sIGUpID0+IHN1bSArIGUuaG91c2luZ0FsbG93YW5jZSArIGUudHJhbnNwb3J0QWxsb3dhbmNlICsgKGUubGl2aW5nQWxsb3dhbmNlID8/IGUuZm9vZEFsbG93YW5jZSA/PyAwKSArIChlLm92ZXJ0aW1lQW1vdW50IHx8IDApICsgKGUub3RoZXJBbGxvd2FuY2VzIHx8IDApLCAwKS50b0xvY2FsZVN0cmluZygnZW4tVVMnKX0g2LEu2LNcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXNsYXRlLTUwIHAtMi41IHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0xMDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNDAwIGZvbnQtYm9sZCBibG9jayBtYi0xIGZvbnQtYXJhYmljXCI+2KXYrNmF2KfZhNmKINin2YTYrti12YjZhdin2Ko6PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1tb25vIHRleHQteHMgZm9udC1ibGFjayB0ZXh0LXJvc2UtNjAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIC17cnVuRW1wbG95ZWVzLnJlZHVjZSgoc3VtLCBlKSA9PiBzdW0gKyBlLnRvdGFsRGVkdWN0aW9ucywgMCkudG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJyl9INixLtizXG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1zbGF0ZS05MDAgdGV4dC13aGl0ZSBwLTIuNSByb3VuZGVkLXhsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTQwMCBmb250LWJvbGQgYmxvY2sgbWItMC41IHRleHQtWzlweF0gZm9udC1hcmFiaWNcIj7Yp9mE2LXYp9mB2Yog2KfZhNmD2YTZijo8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb250LW1vbm8gdGV4dC14cyBmb250LWJsYWNrIHRleHQtZW1lcmFsZC00MDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge3J1bkVtcGxveWVlcy5yZWR1Y2UoKHN1bSwgZSkgPT4gc3VtICsgZS5uZXRTYWxhcnksIDApLnRvTG9jYWxlU3RyaW5nKCdlbi1VUycpfSDYsS7Ys1xuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICB7LyogQmVudG8gY2FyZCAyOiBNb2RpZmljYXRpb24gUmVxdWVzdHMgUGFuZWwgKi99XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXdoaXRlIHAtNSByb3VuZGVkLTJ4bCBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCBzaGFkb3cteHNcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1jZW50ZXIgbWItMyBwYi0yIGJvcmRlci1iIGJvcmRlci1zbGF0ZS0xMDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwiZm9udC1ibGFjayB0ZXh0LXNsYXRlLTgwMCB0ZXh0LXhzIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgZm9udC1hcmFiaWNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxBbGVydENpcmNsZSBjbGFzc05hbWU9XCJ3LTQgaC00IHRleHQtcm9zZS01MDBcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+2LPYrNmEINmF2YTYp9it2LjYp9iqINin2YTZhdix2KfYrNi52Kkg2YjYqti52K/ZitmE2KfYqiDYp9mE2YXYr9mC2YLZitmGPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDwvaDQ+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgIHtydW5Nb2RpZmljYXRpb25SZXF1ZXN0cy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJweS02IHRleHQtY2VudGVyIHRleHQtc2xhdGUtNDAwIGl0YWxpYyB0ZXh0LVsxMHB4XSBmb250LWFyYWJpY1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAg2YTYpyDZitmI2KzYryDYo9mKINi32YTYqNin2Kog2KrYudiv2YrZhCDYo9mIINmF2YTYp9it2LjYp9iqINmF2LPYrNmE2Kkg2K3Yp9mE2YrYp9mLLlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yLjUgbWF4LWgtNDggb3ZlcmZsb3cteS1hdXRvXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7cnVuTW9kaWZpY2F0aW9uUmVxdWVzdHMubWFwKChyZXEpID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e3JlcS5pZH0gY2xhc3NOYW1lPVwiYmctc2xhdGUtNTAgcC0zIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0xNTAgc3BhY2UteS0xIHRleHQtWzExcHhdXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtYmxhY2sgdGV4dC1bIzAwNzJCQ10gZm9udC1tb25vXCI+e3JlcS5pZH08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2BweC0xLjUgcHktMC41IHRleHQtWzlweF0gcm91bmRlZCBmb250LWJvbGQgZm9udC1hcmFiaWMgJHtyZXEuc3RhdHVzID09PSBcIk9wZW5cIiA/IFwiYmctcm9zZS0xMDAgdGV4dC1yb3NlLTgwMFwiIDogXCJiZy1lbWVyYWxkLTEwMCB0ZXh0LWVtZXJhbGQtODAwXCJ9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtyZXEuc3RhdHVzID09PSBcIk9wZW5cIiA/IFwi2YXZgdiq2YjYrVwiIDogXCLZhdmD2KrZhdmEINmI2YXYutmE2YJcIn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTcwMCBsZWFkaW5nLXJlbGF4ZWQgZm9udC1ib2xkIGZvbnQtYXJhYmljXCI+XCJ7cmVxLm5vdGVzfVwiPC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LXNsYXRlLTQwMCBmb250LW1vbm8gZm9udC1ib2xkXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICDYp9mE2YXYr9mC2YI6IHtyZXEucmVxdWVzdGVkQnl9IHwg2KjYqtin2LHZitiuOiB7bmV3IERhdGUocmVxLnJlcXVlc3RlZEF0KS50b0xvY2FsZURhdGVTdHJpbmcoKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cmVxLnJlc3BvbnNlTm90ZXMgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXdoaXRlIHAtMiByb3VuZGVkIGJvcmRlciBib3JkZXItc2xhdGUtMTUwIG10LTEuNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIGZvbnQtYmxhY2sgdGV4dC1lbWVyYWxkLTYwMCBibG9jayBmb250LWFyYWJpY1wiPtix2K8g2KfZhNmF2K3Yp9iz2Kg6PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTYwMCBpdGFsaWMgbXQtMC41IGZvbnQtYXJhYmljIGZvbnQtYm9sZFwiPlwie3JlcS5yZXNwb25zZU5vdGVzfVwiPC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzQWNjb3VudGFudCAmJiByZXEuc3RhdHVzID09PSBcIk9wZW5cIiAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRTZWxlY3RlZFJlcXVlc3RGb3JSZXNwb25zZShyZXEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0SXNNb2RSZXNwb25zZU1vZGFsT3Blbih0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBtdC0xLjUgdGV4dC1jZW50ZXIgcHktMSBiZy1ibHVlLTUwIGhvdmVyOmJnLWJsdWUtMTAwIHRleHQtYmx1ZS03MDAgcm91bmRlZCB0ZXh0LVs5cHhdIGZvbnQtYm9sZCBmb250LWFyYWJpY1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDYp9mE2LHYryDZiNil2LrZhNin2YIg2KfZhNi32YTYqCDwn5KsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgey8qIEJlbnRvIGNhcmQgMzogU3RydWN0dXJlZCBBdWRpdCBMb2cgKi99XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXdoaXRlIHAtNSByb3VuZGVkLTJ4bCBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCBzaGFkb3cteHNcIj5cbiAgICAgICAgICAgICAgICAgICAgPGg0IGNsYXNzTmFtZT1cImZvbnQtYmxhY2sgdGV4dC1zbGF0ZS04MDAgdGV4dC14cyBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IG1iLTMgcGItMiBib3JkZXItYiBib3JkZXItc2xhdGUtMTAwIGZvbnQtYXJhYmljXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPEhpc3RvcnkgY2xhc3NOYW1lPVwidy00IGgtNCB0ZXh0LWluZGlnby01MDBcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPtiz2KzZhCDYp9mE2LnZhdmE2YrYp9iqINin2YTYqtiv2YLZitmC2YogKEF1ZGl0IExvZyk8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvaDQ+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yIG1heC1oLTQ4IG92ZXJmbG93LXktYXV0byBmb250LXNhbnNcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7cnVuQXVkaXRMb2dzXG4gICAgICAgICAgICAgICAgICAgICAgICAuc2xpY2UoKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnJldmVyc2UoKVxuICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgobG9nKSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtsb2cuaWR9IGNsYXNzTmFtZT1cImJnLXNsYXRlLTUwIHAtMi41IHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0xNTAgdGV4dC1bMTAuNXB4XVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWJldHdlZW4gaXRlbXMtY2VudGVyIHRleHQtWzlweF0gdGV4dC1zbGF0ZS00MDAgZm9udC1tb25vIGZvbnQtYm9sZCBtYi0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb250LWV4dHJhYm9sZCB0ZXh0LXNsYXRlLTcwMCBmb250LWFyYWJpY1wiPntsb2cuYWN0aW9ufTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPntuZXcgRGF0ZShsb2cudGltZXN0YW1wKS50b0xvY2FsZVRpbWVTdHJpbmcoW10sIHsgaG91cjogXCIyLWRpZ2l0XCIsIG1pbnV0ZTogXCIyLWRpZ2l0XCIgfSl9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNjAwIGZvbnQtYXJhYmljIGZvbnQtYm9sZFwiPntsb2cuZGV0YWlsc308L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LVs4LjVweF0gdGV4dC1zbGF0ZS00MDAgbXQtMSBmb250LWFyYWJpY1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg2KjZiNin2LPYt9ipOiB7bG9nLm9wZXJhdG9yTmFtZX0gfCB7bmV3IERhdGUobG9nLnRpbWVzdGFtcCkudG9Mb2NhbGVEYXRlU3RyaW5nKCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBTdGlja3kgV29ya3NwYWNlIEZvb3RlciAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWJldHdlZW4gaXRlbXMtY2VudGVyIGJnLXdoaXRlIHB4LTYgcHktNCBib3JkZXItdCBib3JkZXItc2xhdGUtMjAwIHNoYWRvdy1tZCB6LTEwXCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTUwMCBmb250LWFyYWJpY1wiPlxuICAgICAgICAgICAgICAgINio2YrYptipINi52YXZhCDZhdiz2YrYsSDYp9mE2LHZiNin2KrYqCDYp9mE2KXZhNmD2KrYsdmI2YbZiiDYp9mE2YXZiNit2K8g2YTYtNix2YPYqSDZgdmG2YjZhiDYp9mE2YjZhNmK2K8g2YTZhNi12YbYp9i52KlcbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzZXRJc1ZpZXdNb2RhbE9wZW4oZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICBzZXRTZWxlY3RlZFJ1bihudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgbG9nQWN0aW9uVG9BdWRpdCh7XG4gICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBcItil2LrZhNin2YIg2KjZitim2Kkg2KfZhNi52YXZhFwiLFxuICAgICAgICAgICAgICAgICAgICAgIHBheXJvbGxSdW5JZDogc2VsZWN0ZWRSdW4uaWQsXG4gICAgICAgICAgICAgICAgICAgICAgbm90ZXM6IFwi2YLYp9mFINin2YTZhdiz2KrYrtiv2YUg2KjYpdi62YTYp9mCINio2YrYptipINi52YXZhCDZhdiz2YrYsSDYp9mE2LHZiNin2KrYqCDYqNin2YTYtti62Lcg2LnZhNmJINiy2LEg2KXYutmE2KfZgiDYqNmK2KbYqSDYp9mE2LnZhdmEXCJcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNiBweS0yLjUgYmctc2xhdGUtOTAwIGhvdmVyOmJnLXNsYXRlLTgwMCB0ZXh0LXdoaXRlIGZvbnQtYmxhY2sgcm91bmRlZC14bCB0ZXh0LXhzIHRyYW5zaXRpb24tY29sb3JzIHNoYWRvdy1tZCBob3ZlcjpzaGFkb3ctbGcgZm9udC1hcmFiaWNcIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgINil2LrZhNin2YIg2KjZitim2Kkg2KfZhNi52YXZhCAvIENsb3NlIFdvcmtzcGFjZSDinJVcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7LyogU0lOR0xFIFBBWVNMSVAgVklFVyBESUFMT0cgTU9EQUwgKEZVTEwgU0NSRUVOIE9WRVJMQVkpICovfVxuICAgICAge2lzUGF5c2xpcE1vZGFsT3BlbiAmJiBzZWxlY3RlZFBheXNsaXBFbXBsb3llZSAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZml4ZWQgaW5zZXQtMCBiZy1zbGF0ZS0xMDAgei01MCBvdmVyZmxvdy15LWF1dG8gcC0wIHNtOnAtNiBtZDpwLTEwIGZsZXggZmxleC1jb2xcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctZnVsbCBtYXgtdy00eGwgbXgtYXV0byBiZy13aGl0ZSBtaW4taC1zY3JlZW4gc206bWluLWgtMCBzbTpyb3VuZGVkLTN4bCBwLTYgc206cC0xMCByZWxhdGl2ZSBzaGFkb3ctMnhsIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIGZsZXggZmxleC1jb2wganVzdGlmeS1iZXR3ZWVuXCI+XG4gICAgICAgICAgICB7LyogQ0xPU0UgQlVUVE9OICovfVxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgc2V0SXNQYXlzbGlwTW9kYWxPcGVuKGZhbHNlKTtcbiAgICAgICAgICAgICAgICBzZXRTZWxlY3RlZFBheXNsaXBFbXBsb3llZShudWxsKTtcbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYWJzb2x1dGUgbGVmdC02IHRvcC02IHAtMi41IGJnLXNsYXRlLTEwMCBob3ZlcjpiZy1zbGF0ZS0yMDAgdGV4dC1zbGF0ZS03MDAgcm91bmRlZC1mdWxsIHRyYW5zaXRpb24tYWxsIGhvdmVyOnNjYWxlLTEwNVwiXG4gICAgICAgICAgICAgIHRpdGxlPVwi2KXYutmE2KfZgiDZiNin2YTYsdis2YjYuSDYpdmE2Ykg2YLYp9im2YXYqSDYp9mE2LHZiNin2KrYqFwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDxYIGNsYXNzTmFtZT1cInctNiBoLTZcIiAvPlxuICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgIHsvKiBIRUFERVIgKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJvcmRlci1iLTIgYm9yZGVyLXNsYXRlLTIwMCBwYi02IG1iLThcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIHNtOmZsZXgtcm93IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1zdGFydCBnYXAtNFwiPlxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICA8aDIgY2xhc3NOYW1lPVwidGV4dC14bCBzbTp0ZXh0LTJ4bCBmb250LWJsYWNrIHRleHQtc2xhdGUtOTAwXCI+2LTYsdmD2Kkg2YHZhtmI2YYg2KfZhNmI2YTZitivINmE2YTYtdmG2KfYudipPC9oMj5cbiAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgc206dGV4dC1zbSB0ZXh0LXNsYXRlLTUwMCBmb250LW1vbm8gbXQtMVwiPkZPTk9VTiBBTFdBTEVFRCBJTkRVU1RSSUFMIENPLjwvcD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtcmlnaHQgc206dGV4dC1sZWZ0XCI+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJweC0zLjUgcHktMS41IGJnLXNreS01MCB0ZXh0LVsjMDA3MkJDXSB0ZXh0LXhzIGZvbnQtYmxhY2sgcm91bmRlZC1mdWxsIGJvcmRlciBib3JkZXItc2t5LTEwMFwiPlxuICAgICAgICAgICAgICAgICAgICDZg9i02YEg2LHYp9iq2Kgg2YXZiNi42YEg2YXYudiq2YXYryDYsdiz2YXZilxuICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTUwMCBtdC0yLjUgZm9udC1tb25vIGZvbnQtYm9sZFwiPtmD2YjYryDYp9mE2YXYs9mK2LE6IHtzZWxlY3RlZFJ1bj8ucGF5cm9sbE51bWJlcn08L3A+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8aDEgY2xhc3NOYW1lPVwidGV4dC1iYXNlIHNtOnRleHQtbGcgZm9udC1leHRyYWJvbGQgdGV4dC1zbGF0ZS04MDAgbXQtNiBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBib3JkZXItci00IGJvcmRlci1bIzAwNzJCQ10gcHItM1wiPlxuICAgICAgICAgICAgICAgINmD2LTZgSDYsdin2KrYqCDYqtmB2LXZitmE2Yog2YTZhNi02YfYsSDYp9mE2K3Yp9mE2YogfCBFbXBsb3llZSBEZXRhaWxlZCBQYXlzbGlwXG4gICAgICAgICAgICAgIDwvaDE+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIEVNUExPWUVFIElORk8gQ0FSRCAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMSBtZDpncmlkLWNvbHMtMiBnYXAtNCBiZy1zbGF0ZS01MCBwLTYgcm91bmRlZC0yeGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0xNTAgdGV4dC14cyBzbTp0ZXh0LXNtXCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0zXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiBib3JkZXItYiBib3JkZXItc2xhdGUtMjAwIHBiLTJcIj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNTAwIGZvbnQtYm9sZFwiPtin2LPZhSDYp9mE2YXZiNi42YE6PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHN0cm9uZyBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTk1MCBmb250LWJsYWNrXCI+e3NlbGVjdGVkUGF5c2xpcEVtcGxveWVlLmFyYWJpY05hbWV9PC9zdHJvbmc+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiBib3JkZXItYiBib3JkZXItc2xhdGUtMjAwIHBiLTJcIj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNTAwIGZvbnQtYm9sZFwiPtin2YTZhdiz2YXZiSDYp9mE2YjYuNmK2YHZijo8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3Ryb25nIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtODAwXCI+e3NlbGVjdGVkUGF5c2xpcEVtcGxveWVlLmpvYlRpdGxlfTwvc3Ryb25nPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWJldHdlZW4gYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTIwMCBwYi0yXCI+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTUwMCBmb250LWJvbGRcIj7YsdmC2YUg2KfZhNil2YLYp9mF2KkgLyDYp9mE2YfZiNmK2Kk6PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHN0cm9uZyBjbGFzc05hbWU9XCJmb250LW1vbm8gdGV4dC1zbGF0ZS04MDBcIj57c2VsZWN0ZWRQYXlzbGlwRW1wbG95ZWUuaXFhbWFJZH08L3N0cm9uZz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1iZXR3ZWVuXCI+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTUwMCBmb250LWJvbGRcIj7Yp9mE2YLYs9mFIC8g2KfZhNmI2LHYtNipOjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzdHJvbmcgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS04MDBcIj57c2VsZWN0ZWRQYXlzbGlwRW1wbG95ZWUuZGVwYXJ0bWVudCB8fCBcItin2YTZhdi12YbYuSDYp9mE2LnYp9mFXCJ9PC9zdHJvbmc+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktM1wiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWJldHdlZW4gYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTIwMCBwYi0yXCI+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTUwMCBmb250LWJvbGRcIj7Yp9iz2YUg2KfZhNio2YbZgyDYp9mE2YXYudiq2YXYrzo8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3Ryb25nIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtODAwXCI+e3NlbGVjdGVkUGF5c2xpcEVtcGxveWVlLmJhbmtOYW1lIHx8IFwi4oCUXCJ9PC9zdHJvbmc+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiBib3JkZXItYiBib3JkZXItc2xhdGUtMjAwIHBiLTJcIj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNTAwIGZvbnQtYm9sZFwiPtix2YLZhSDYp9mE2K3Ys9in2KggKElCQU4pOjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzdHJvbmcgY2xhc3NOYW1lPVwiZm9udC1tb25vIHRleHQtc2xhdGUtODAwIHNlbGVjdC1hbGwgdHJhY2tpbmctd2lkZXIgZm9udC1ib2xkXCI+e3NlbGVjdGVkUGF5c2xpcEVtcGxveWVlLmliYW4gfHwgXCLigJRcIn08L3N0cm9uZz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1iZXR3ZWVuIGJvcmRlci1iIGJvcmRlci1zbGF0ZS0yMDAgcGItMlwiPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS01MDAgZm9udC1ib2xkXCI+2LfYsdmK2YLYqSDYp9mE2KrYrdmI2YrZhCDYp9mE2YXYp9mE2Yo6PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHN0cm9uZyBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTgwMFwiPntzZWxlY3RlZFBheXNsaXBFbXBsb3llZS50cmFuc2Zlck1ldGhvZCB8fCBcItiq2K3ZiNmK2YQg2KjZhtmD2Yog2YXYqNin2LTYsSAoU0FSSUUpXCJ9PC9zdHJvbmc+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlblwiPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS01MDAgZm9udC1ib2xkXCI+2KrYp9ix2YrYriDYp9mE2LfYqNin2LnYqSAvINin2YTYudix2LY6PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHN0cm9uZyBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTgwMCBmb250LW1vbm8gZm9udC1ib2xkXCI+e25ldyBEYXRlKCkudG9Mb2NhbGVEYXRlU3RyaW5nKCdlbi1VUycpfTwvc3Ryb25nPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogRklOQU5DSUFMIERFVEFJTFMgR1JJRCAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMSBtZDpncmlkLWNvbHMtMiBnYXAtNiBtdC04XCI+XG4gICAgICAgICAgICAgIHsvKiBFTlRJVExFTUVOVFMgKNin2YTZhdmD2KrYs9io2KfYqikgKi99XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctZW1lcmFsZC01MC8yMCBwLTUgcm91bmRlZC0yeGwgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTEwMC83MCBmbGV4IGZsZXgtY29sIGp1c3RpZnktYmV0d2VlblwiPlxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC14cyBzbTp0ZXh0LXNtIGZvbnQtYmxhY2sgdGV4dC1lbWVyYWxkLTgwMCBtYi00IGJvcmRlci1iIGJvcmRlci1lbWVyYWxkLTEwMCBwYi0yIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInctMi41IGgtMi41IHJvdW5kZWQtZnVsbCBiZy1lbWVyYWxkLTUwMFwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAg2KfZhNio2YbZiNivINin2YTZhdin2YTZitipINin2YTZhdiz2KrYrdmC2KkgKNin2YTZhdmD2KrYs9io2KfYqilcbiAgICAgICAgICAgICAgICAgIDwvaDM+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMyB0ZXh0LXhzIHNtOnRleHQtc21cIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1jZW50ZXIgcHktMSBib3JkZXItYiBib3JkZXItZW1lcmFsZC01MC81MFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNjAwIGZvbnQtbWVkaXVtXCI+2KfZhNix2KfYqtioINin2YTYo9iz2KfYs9mKINin2YTZhdiz2KrYrdmCPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtbW9ubyBmb250LWJvbGQgdGV4dC1zbGF0ZS05MDBcIj57c2VsZWN0ZWRQYXlzbGlwRW1wbG95ZWUuYmFzaWNTYWxhcnkudG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJyl9INixLtizPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1jZW50ZXIgcHktMSBib3JkZXItYiBib3JkZXItZW1lcmFsZC01MC81MFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNjAwIGZvbnQtbWVkaXVtXCI+2KjYr9mEINin2YTYs9mD2YYg2KfZhNmF2KTZhdmGPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtbW9ubyBmb250LWJvbGQgdGV4dC1zbGF0ZS05MDBcIj57c2VsZWN0ZWRQYXlzbGlwRW1wbG95ZWUuaG91c2luZ0FsbG93YW5jZS50b0xvY2FsZVN0cmluZygnZW4tVVMnKX0g2LEu2LM8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1iZXR3ZWVuIGl0ZW1zLWNlbnRlciBweS0xIGJvcmRlci1iIGJvcmRlci1lbWVyYWxkLTUwLzUwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS02MDAgZm9udC1tZWRpdW1cIj7YqNiv2YQg2KfZhNmG2YLZhCDZiNiq2YjYtdmK2YQg2KfZhNmI2LHYtNipPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtbW9ubyBmb250LWJvbGQgdGV4dC1zbGF0ZS05MDBcIj57c2VsZWN0ZWRQYXlzbGlwRW1wbG95ZWUudHJhbnNwb3J0QWxsb3dhbmNlLnRvTG9jYWxlU3RyaW5nKCdlbi1VUycpfSDYsS7Yszwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWJldHdlZW4gaXRlbXMtY2VudGVyIHB5LTEgYm9yZGVyLWIgYm9yZGVyLWVtZXJhbGQtNTAvNTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTYwMCBmb250LW1lZGl1bVwiPtio2K/ZhCDYrNmI2KfZhCDYp9iq2LXYp9mEINmI2KrZhtiz2YrZgjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb250LW1vbm8gZm9udC1ib2xkIHRleHQtc2xhdGUtOTAwXCI+e3NlbGVjdGVkUGF5c2xpcEVtcGxveWVlLnBob25lQWxsb3dhbmNlLnRvTG9jYWxlU3RyaW5nKCdlbi1VUycpfSDYsS7Yszwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWJldHdlZW4gaXRlbXMtY2VudGVyIHB5LTEgYm9yZGVyLWIgYm9yZGVyLWVtZXJhbGQtNTAvNTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTYwMCBmb250LW1lZGl1bVwiPtio2K/ZhCDYpdi52KfYtNipINmI2KrYutiw2YrYqTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb250LW1vbm8gZm9udC1ib2xkIHRleHQtc2xhdGUtOTAwXCI+e3NlbGVjdGVkUGF5c2xpcEVtcGxveWVlLmZvb2RBbGxvd2FuY2UudG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJyl9INixLtizPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1jZW50ZXIgcHktMSBib3JkZXItYiBib3JkZXItZW1lcmFsZC01MC81MFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNjAwIGZvbnQtbWVkaXVtXCI+2KjYr9mEINmF2K/YqSAvINiz2KfYudin2Kog2KXYttin2YHZitipPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtbW9ubyBmb250LWJvbGQgdGV4dC1zbGF0ZS05MDBcIj57KHNlbGVjdGVkUGF5c2xpcEVtcGxveWVlLm11ZGRhaEFtb3VudCB8fCAwKS50b0xvY2FsZVN0cmluZygnZW4tVVMnKX0g2LEu2LM8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1iZXR3ZWVuIGl0ZW1zLWNlbnRlciBweS0xIGJvcmRlci1iIGJvcmRlci1lbWVyYWxkLTUwLzUwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS02MDAgZm9udC1tZWRpdW1cIj7Yo9mI2YHYsSDYqtin2YrZhSAo2KXYttin2YHZijoge3NlbGVjdGVkUGF5c2xpcEVtcGxveWVlLm92ZXJ0aW1lSG91cnN9INizKTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb250LW1vbm8gZm9udC1ib2xkIHRleHQtc2xhdGUtOTAwXCI+e3NlbGVjdGVkUGF5c2xpcEVtcGxveWVlLm92ZXJ0aW1lQW1vdW50LnRvTG9jYWxlU3RyaW5nKCdlbi1VUycpfSDYsS7Yszwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWJldHdlZW4gaXRlbXMtY2VudGVyIHB5LTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTYwMCBmb250LW1lZGl1bVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAg2YXZg9in2YHYotiqINmI2KjYr9mE2KfYqiDYpdiv2KfYsdmK2Kkg2KPYrtix2YlcbiAgICAgICAgICAgICAgICAgICAgICAgIHtzZWxlY3RlZFBheXNsaXBFbXBsb3llZS5vdGhlckFsbG93YW5jZXNSZWFzb24gJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBiZy1za3ktMTAwIHRleHQtWyMwMDcyQkNdIHB4LTIgcHktMC41IHJvdW5kZWQtbWQgbXItMS41IGZvbnQtYm9sZFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtzZWxlY3RlZFBheXNsaXBFbXBsb3llZS5vdGhlckFsbG93YW5jZXNSZWFzb259XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtbW9ubyBmb250LWJvbGQgdGV4dC1zbGF0ZS05MDBcIj57KHNlbGVjdGVkUGF5c2xpcEVtcGxveWVlLm90aGVyQWxsb3dhbmNlcyB8fCAwKS50b0xvY2FsZVN0cmluZygnZW4tVVMnKX0g2LEu2LM8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1jZW50ZXIgcC0zIGJnLWVtZXJhbGQtNTAwLzEwIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTUwMC8yMCBtdC02XCI+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb250LWJsYWNrIHRleHQtZW1lcmFsZC05MDAgdGV4dC14cyBzbTp0ZXh0LXNtXCI+2KXYrNmF2KfZhNmKINmF2LPYqtit2YLYp9iqINin2YTZhdmI2LjZgTo8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb250LW1vbm8gZm9udC1ibGFjayB0ZXh0LWVtZXJhbGQtNzAwIHRleHQtc20gc206dGV4dC1iYXNlXCI+e3NlbGVjdGVkUGF5c2xpcEVtcGxveWVlLnRvdGFsRW50aXRsZW1lbnRzLnRvTG9jYWxlU3RyaW5nKCdlbi1VUycpfSDYsS7Yszwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgey8qIERFRFVDVElPTlMgKNin2YTYp9iz2KrZgti32KfYudin2KopICovfVxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXJvc2UtNTAvMjAgcC01IHJvdW5kZWQtMnhsIGJvcmRlciBib3JkZXItcm9zZS0xMDAvNzAgZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWJldHdlZW5cIj5cbiAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQteHMgc206dGV4dC1zbSBmb250LWJsYWNrIHRleHQtcm9zZS04MDAgbWItNCBib3JkZXItYiBib3JkZXItcm9zZS0xMDAgcGItMiBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ3LTIuNSBoLTIuNSByb3VuZGVkLWZ1bGwgYmctcm9zZS01MDBcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgINin2YTYqNmG2YjYryDYp9mE2YXYp9mE2YrYqSDYp9mE2YXYrti12YjZhdipICjYp9mE2KfYs9iq2YLYt9in2LnYp9iqKVxuICAgICAgICAgICAgICAgICAgPC9oMz5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0zIHRleHQteHMgc206dGV4dC1zbVwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1iZXR3ZWVuIGl0ZW1zLWNlbnRlciBweS0xIGJvcmRlci1iIGJvcmRlci1yb3NlLTUwLzUwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS02MDAgZm9udC1tZWRpdW1cIj7Yp9iz2KrZgti32KfYuSDYp9mE2LPZhNmBINin2YTZhdin2YTZitipINmI2KfZhNi52YfZiNivPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtbW9ubyBmb250LWJvbGQgdGV4dC1zbGF0ZS05MDBcIj57c2VsZWN0ZWRQYXlzbGlwRW1wbG95ZWUubG9hbnNEZWR1Y3Rpb24udG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJyl9INixLtizPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1jZW50ZXIgcHktMSBib3JkZXItYiBib3JkZXItcm9zZS01MC81MFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNjAwIGZvbnQtbWVkaXVtXCI+2KfZhNiq2KPZhdmK2YbYp9iqINin2YTYp9is2KrZhdin2LnZitipIChHT1NJKTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb250LW1vbm8gZm9udC1ib2xkIHRleHQtc2xhdGUtOTAwXCI+e3NlbGVjdGVkUGF5c2xpcEVtcGxveWVlLmdvc2lEZWR1Y3Rpb24udG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJyl9INixLtizPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1jZW50ZXIgcHktMVwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNjAwIGZvbnQtbWVkaXVtXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICDYp9mE2K7YtdmI2YXYp9iqINmI2KfZhNis2LLYp9ih2KfYqiDYp9mE2KXYr9in2LHZitipXG4gICAgICAgICAgICAgICAgICAgICAgICB7c2VsZWN0ZWRQYXlzbGlwRW1wbG95ZWUuZGVkdWN0aW9uc1JlYXNvbiAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGJnLXJvc2UtMTAwIHRleHQtcm9zZS04MDAgcHgtMiBweS0wLjUgcm91bmRlZC1tZCBtci0xLjUgZm9udC1ib2xkXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3NlbGVjdGVkUGF5c2xpcEVtcGxveWVlLmRlZHVjdGlvbnNSZWFzb259XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0U2VsZWN0ZWREZWR1Y3Rpb25FbXBsb3llZShzZWxlY3RlZFBheXNsaXBFbXBsb3llZSBhcyBQYXlyb2xsUnVuRW1wbG95ZWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRDbGlja2VkRGVkdWN0aW9uVHlwZShcIk90aGVyXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRJc0RlZHVjdGlvbk1vZGFsT3Blbih0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmb250LW1vbm8gZm9udC1ib2xkIHRleHQtcm9zZS02MDAgYmctcm9zZS01MCBob3ZlcjpiZy1yb3NlLTEwMCBweC0yIHB5LTEgcm91bmRlZCB0cmFuc2l0aW9uLWNvbG9yc1wiXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIti52LHYtiDYqtmB2KfYtdmK2YQg2KfZhNiu2LXZiNmF2KfYqlwiXG4gICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAge3NlbGVjdGVkUGF5c2xpcEVtcGxveWVlLm90aGVyRGVkdWN0aW9ucy50b0xvY2FsZVN0cmluZygnZW4tVVMnKX0g2LEu2LNcbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1iZXR3ZWVuIGl0ZW1zLWNlbnRlciBwLTMgYmctcm9zZS01MDAvMTAgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXJvc2UtNTAwLzIwIG10LTZcIj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtYmxhY2sgdGV4dC1yb3NlLTkwMCB0ZXh0LXhzIHNtOnRleHQtc21cIj7Ypdis2YXYp9mE2Yog2KfZhNiu2LXZiNmF2KfYqiDYp9mE2LHYs9mF2YrYqTo8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb250LW1vbm8gZm9udC1ibGFjayB0ZXh0LXJvc2UtNzAwIHRleHQtc20gc206dGV4dC1iYXNlXCI+e3NlbGVjdGVkUGF5c2xpcEVtcGxveWVlLnRvdGFsRGVkdWN0aW9ucy50b0xvY2FsZVN0cmluZygnZW4tVVMnKX0g2LEu2LM8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBORVQgU0FMQVJZIENBUkQgKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm10LTggcC02IGJnLXNsYXRlLTkwMCB0ZXh0LXdoaXRlIHJvdW5kZWQtMnhsIGZsZXggZmxleC1jb2wgc206ZmxleC1yb3cganVzdGlmeS1iZXR3ZWVuIGl0ZW1zLWNlbnRlciBnYXAtNFwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMSB0ZXh0LWNlbnRlciBzbTp0ZXh0LXJpZ2h0XCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC1bIzAwQUVFRl0gdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIGZvbnQtbW9ub1wiPk5FVCBDT05WRVJURUQgU0FMQVJZPC9zcGFuPlxuICAgICAgICAgICAgICAgIDxoNCBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtYmxhY2sgdGV4dC1zbGF0ZS0xMDBcIj7Ytdin2YHZiiDYp9mE2LHYp9iq2Kgg2KfZhNmF2LPYqtit2YIg2YjYp9mE2YXYrdmI2YQg2YTZhNio2YbZgzo8L2g0PlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwLjVweF0gdGV4dC1zbGF0ZS00MDBcIj7Yt9mP2KjZgtiqINis2YXZiti5INin2YTYrNiy2KfYodin2Kog2YjYp9mE2K7YtdmI2YXYp9iqINmI2KfZhNmF2LPYqtit2YLYp9iqINit2LPYqCDYp9mE2KfYqtmB2KfZgtmK2Kkg2YjZhNin2KbYrdipINin2YTZhdmI2KfYsdivINin2YTYqNi02LHZitipLjwvcD5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1jZW50ZXIgc206dGV4dC1sZWZ0XCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1tb25vIHRleHQtZW1lcmFsZC00MDAgZm9udC1ibGFjayB0ZXh0LTJ4bCB0cmFja2luZy13aWRlclwiPlxuICAgICAgICAgICAgICAgICAge3NlbGVjdGVkUGF5c2xpcEVtcGxveWVlLm5ldFNhbGFyeS50b0xvY2FsZVN0cmluZygnZW4tVVMnKX0g2LEu2LNcbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS00MDAgbXQtMVwiPti02KfZhdmEINin2YTYqNiv2YTYp9iqINin2YTZhdi52KrZhdiv2Kk8L3A+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBMRUdBTCBESVNDTEFJTUVSICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtdC04IGJnLXNsYXRlLTUwIHAtNCByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIHRleHQtWzEwLjVweF0gdGV4dC1zbGF0ZS02MDAgbGVhZGluZy1yZWxheGVkXCI+XG4gICAgICAgICAgICAgIDxzdHJvbmc+2KrZhtmI2YrZhyDZhti42KfZhdmKINmF2LnYqtmF2K86PC9zdHJvbmc+INmK2LnYqtio2LEg2YPYtNmBINin2YTYsdin2KrYqCDYp9mE2LXYp9iv2LEg2YXZhiDZhdmG2LXYqSDYp9mE2KXYr9in2LHYqSDZhNi02LHZg9ipINmB2YbZiNmGINin2YTZiNmE2YrYryDZiNir2YrZgtipINix2LPZhdmK2Kkg2YXYudiq2YXYr9ipINiq2KvYqNiqINiq2K3ZiNmK2YQg2YjZgtmK2K8g2KfZhNmF2LPYqtit2YLYp9iqINin2YTZhdin2YTZitipINmE2YTZhdmI2LjZgSDYqNin2YTZhdix2KzYuSDYp9mE2KjZhtmD2Yog2KfZhNmF2LnYqtmF2K8g2KXZhNmD2KrYsdmI2YbZitin2YvYjCDZiNiq2LfYp9io2YIg2KPYrdmD2KfZhSDYudmC2YjYryDYp9mE2LnZhdmEINin2YTZhdi12KfYr9mCINi52YTZitmH2Kcg2LnYqNixINmF2YbYtdipINmC2YjZiSDYqNmI2LLYp9ix2Kkg2KfZhNmF2YjYp9ix2K8g2KfZhNio2LTYsdmK2KkuXG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIFNJR05BVFVSRSBTRUNUSU9OICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0yIGdhcC02IG10LTggYm9yZGVyLXQgYm9yZGVyLXNsYXRlLTE1MCBwdC02IHRleHQtY2VudGVyIHRleHQteHMgdGV4dC1zbGF0ZS01MDBcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwdC0zXCI+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtc2xhdGUtNzAwXCI+2KrZiNmC2YrYuSDYp9mE2YXYrdin2LPYqCDYp9mE2YXYp9mE2Yog2YTZhNi02LHZg9ipPC9wPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaC0xMlwiPjwvZGl2PlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNDAwXCI+X19fX19fX19fX19fX19fX188L3NwYW4+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB0LTNcIj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJmb250LWJvbGQgdGV4dC1zbGF0ZS03MDBcIj7Yp9i52KrZhdin2K8g2KfZhNmF2K/ZitixINin2YTYudin2YUg2YjYtdin2K3YqCDYp9mE2LnZhdmEPC9wPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaC0xMlwiPjwvZGl2PlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNDAwXCI+X19fX19fX19fX19fX19fX188L3NwYW4+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBESUFMT0cgQUNUSU9OUyAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBzbTpmbGV4LXJvdyBnYXAtMyBqdXN0aWZ5LWVuZCBtdC0xMCBib3JkZXItdCBib3JkZXItc2xhdGUtMTUwIHB0LTZcIj5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgIHNldElzUGF5c2xpcE1vZGFsT3BlbihmYWxzZSk7XG4gICAgICAgICAgICAgICAgICBzZXRTZWxlY3RlZFBheXNsaXBFbXBsb3llZShudWxsKTtcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTYgcHktMyBiZy1zbGF0ZS0xMDAgaG92ZXI6Ymctc2xhdGUtMjAwIHRleHQtc2xhdGUtNzAwIGZvbnQtZXh0cmFib2xkIHJvdW5kZWQteGwgdGV4dC14cyB0cmFuc2l0aW9uLWNvbG9yc1wiXG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICDYp9mE2LHYrNmI2Lkg2KXZhNmJINin2YTZgtin2KbZhdipINin2YTYsdim2YrYs9mK2KlcbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVFeHBvcnRQYXlzbGlwUERGfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTYgcHktMyBiZy1yb3NlLTYwMCBob3ZlcjpiZy1yb3NlLTcwMCB0ZXh0LXdoaXRlIGZvbnQtZXh0cmFib2xkIHJvdW5kZWQteGwgdGV4dC14cyB0cmFuc2l0aW9uLWNvbG9ycyBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMiBzaGFkb3ctbGcgaG92ZXI6c2hhZG93LXhsXCJcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxQcmludGVyIGNsYXNzTmFtZT1cInctNCBoLTRcIiAvPlxuICAgICAgICAgICAgICAgIDxzcGFuPti32KjYp9i52Kkg2YjZhdi52KfZitmG2Kkg8J+ThDwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7LyogUkVRVUVTVCBNT0RJRklDQVRJT05TIE1PREFMIE9WRVJMQVkgKi99XG4gICAgICB7aXNNb2RSZXF1ZXN0TW9kYWxPcGVuICYmIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmaXhlZCBpbnNldC0wIGJnLXNsYXRlLTkwMC82MCB6LTUwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHAtNFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy1mdWxsIG1heC13LWxnIGJnLXdoaXRlIHJvdW5kZWQtM3hsIHAtNiByZWxhdGl2ZVwiPlxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRJc01vZFJlcXVlc3RNb2RhbE9wZW4oZmFsc2UpfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJhYnNvbHV0ZSBsZWZ0LTYgdG9wLTYgcC0xLjUgYmctc2xhdGUtNTAgaG92ZXI6Ymctc2xhdGUtMTAwIHJvdW5kZWQtZnVsbCB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXNsYXRlLTYwMFwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDxYIGNsYXNzTmFtZT1cInctNSBoLTVcIiAvPlxuICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LWJhc2UgZm9udC1ibGFjayB0ZXh0LXNsYXRlLTgwMCBtYi0yXCI+2KrYs9is2YrZhCDYt9mE2Kgg2KrYudiv2YrZhCDZiNmF2LHYp9is2LnYqSDYrNiv2YrYrzwvaDM+XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIG1iLTRcIj5cbiAgICAgICAgICAgICAg2KPYr9iu2YQg2KfZhNmF2YTYp9it2LjYp9iqINmI2KfZhNiq2LnYr9mK2YTYp9iqINin2YTZhdi32YTZiNio2Kkg2YXZhiDYp9mE2YXYrdin2LPYqCDZiNiz2YrYqti62YrYsSDYrdin2YTYqSDYp9mE2YXYs9mK2LEg2KrZhNmC2KfYptmK2KfZiyDYpdmE2YkgKNio2KfZhtiq2LjYp9ixINin2YTYqti52K/ZitmEKS5cbiAgICAgICAgICAgIDwvcD5cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cbiAgICAgICAgICAgICAgPHRleHRhcmVhXG4gICAgICAgICAgICAgICAgdmFsdWU9e21vZFJlcXVlc3ROb3Rlc31cbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldE1vZFJlcXVlc3ROb3RlcyhlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCLZhdir2KfZhDog2YrYsdis2Ykg2KfZhNiq2K3ZgtmCINmF2YYg2KfZhNij2YjZgdix2KrYp9mK2YUg2KfZhNiu2KfYtSDYqNi52KfZhdmEINin2YTYqti02YPZitmEINix2KfZhdmK2Iwg2YjYqti32KjZitmCINiu2LXZhSDYp9mE2LrZitin2Kgg2KfZhNmF2LnYqtmF2K8g2KjZiNix2YLYqSDYp9mE2KXYr9in2LHYqS4uLlwiXG4gICAgICAgICAgICAgICAgcm93cz17NH1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgcC0zIGJvcmRlciByb3VuZGVkLXhsIHRleHQteHMgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1yb3NlLTUwMFwiXG4gICAgICAgICAgICAgIC8+XG5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGdhcC0yIGp1c3RpZnktZW5kXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0SXNNb2RSZXF1ZXN0TW9kYWxPcGVuKGZhbHNlKX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMiBiZy1zbGF0ZS0xMDAgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYm9sZFwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAg2KXZhNi62KfYoSDYp9mE2KrYsdin2KzYuVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZVJlcXVlc3RNb2RpZmljYXRpb25zU3VibWl0fVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFtb2RSZXF1ZXN0Tm90ZXMudHJpbSgpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNiBweS0yIGJnLXJvc2UtNjAwIHRleHQtd2hpdGUgaG92ZXI6Ymctcm9zZS03MDAgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYm9sZCBzaGFkb3ctbWRcIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgINiq2YLYr9mK2YUg2LfZhNioINin2YTYqti52K/ZitmEIOKaoO+4j1xuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBSRVNQT05EIFRPIE1PRElGSUNBVElPTiBSRVFVRVNUIE1PREFMICovfVxuICAgICAge2lzTW9kUmVzcG9uc2VNb2RhbE9wZW4gJiYgc2VsZWN0ZWRSZXF1ZXN0Rm9yUmVzcG9uc2UgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZpeGVkIGluc2V0LTAgYmctc2xhdGUtOTAwLzYwIHotNTAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC00XCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LWZ1bGwgbWF4LXctbGcgYmctd2hpdGUgcm91bmRlZC0zeGwgcC02IHJlbGF0aXZlXCI+XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICBzZXRJc01vZFJlc3BvbnNlTW9kYWxPcGVuKGZhbHNlKTtcbiAgICAgICAgICAgICAgICBzZXRTZWxlY3RlZFJlcXVlc3RGb3JSZXNwb25zZShudWxsKTtcbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYWJzb2x1dGUgbGVmdC02IHRvcC02IHAtMS41IGJnLXNsYXRlLTUwIGhvdmVyOmJnLXNsYXRlLTEwMCByb3VuZGVkLWZ1bGwgdGV4dC1zbGF0ZS00MDBcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8WCBjbGFzc05hbWU9XCJ3LTUgaC01XCIgLz5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC1iYXNlIGZvbnQtYmxhY2sgdGV4dC1zbGF0ZS04MDAgbWItMlwiPtiq2LPYrNmK2YQg2LHYryDYp9mE2YXYrdin2LPYqCDYudmE2Ykg2LfZhNioINin2YTYqti52K/ZitmEPC9oMz5cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS00MDAgbWItNFwiPlxuICAgICAgICAgICAgICDYqtmI2KvZitmCINin2YTYpdis2LHYp9ihINin2YTYsNmKINmC2YXYqiDYqNin2KrYrtin2LDZhyDZgdmKINmF2LPZitixINin2YTYsdmI2KfYqtioINix2K/Yp9mLINi52YTZiSDYt9mE2Kgg2KfZhNmF2K/ZgtmCLlxuICAgICAgICAgICAgPC9wPlxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktNCB0ZXh0LXhzXCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC0zIGJnLXNsYXRlLTU1IHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0xNTBcIj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJmb250LWJvbGQgdGV4dC1zbGF0ZS01MDBcIj7ZhdmE2KfYrdi42Kkg2KfZhNmF2K/ZgtmCINin2YTZhdiz2KrZh9iv2YHYqTo8L3A+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS04MDAgbXQtMSBmb250LXNlbWlib2xkXCI+XCJ7c2VsZWN0ZWRSZXF1ZXN0Rm9yUmVzcG9uc2Uubm90ZXN9XCI8L3A+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIG1iLTEgZm9udC1ib2xkIHRleHQtc2xhdGUtNTAwXCI+2K3Yp9mE2Kkg2KfZhNi32YTYqCDYqNi52K8g2KfZhNix2K8gKjwvbGFiZWw+XG4gICAgICAgICAgICAgICAgPHNlbGVjdFxuICAgICAgICAgICAgICAgICAgdmFsdWU9e21vZFJlc3BvbnNlU3RhdHVzfVxuICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRNb2RSZXNwb25zZVN0YXR1cyhlLnRhcmdldC52YWx1ZSBhcyBhbnkpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHAtMi41IGJvcmRlciByb3VuZGVkLXhsXCJcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiQ2xvc2VkXCI+2YXYutmE2YIgLSDYqtmFINin2YTYqti52K/ZitmEINmI2KfZhNiq2LXYrdmK2K0g2KjZhtis2KfYrSAoQ2xvc2VkKTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIk9wZW5cIj7ZhdmB2KrZiNitIC0g2KzYp9ix2Yog2KfZhNmG2YLYp9i0INij2Ygg2KfZhNiq2YjYttmK2K0gKE9wZW4pPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIG1iLTEgZm9udC1ib2xkIHRleHQtc2xhdGUtNTAwXCI+2LTYsditINmI2KrZiNi22YrYrSDYpdis2LHYp9ihINin2YTZhdit2KfYs9ioICo8L2xhYmVsPlxuICAgICAgICAgICAgICAgIDx0ZXh0YXJlYVxuICAgICAgICAgICAgICAgICAgdmFsdWU9e21vZFJlc3BvbnNlTm90ZXN9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldE1vZFJlc3BvbnNlTm90ZXMoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCLZhdir2KfZhDog2KrZhSDYqti52K/ZitmEINin2YTYrti12YjZhdin2Kog2YTYqti12KjYrSAxNTAg2LEu2LMg2KjYr9mE2KfZiyDZhdmGIDI1MCDZiNiq2K3Yr9mK2Ksg2KfZhNi12KfZgdmKINin2YTZhdi12LHZgdmKINmE2YTZhdmI2LjZgS4uLlwiXG4gICAgICAgICAgICAgICAgICByb3dzPXszfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHAtMyBib3JkZXIgcm91bmRlZC14bCB0ZXh0LXhzIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItYmx1ZS01MDBcIlxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBnYXAtMiBqdXN0aWZ5LWVuZCBwdC0yXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzZXRJc01vZFJlc3BvbnNlTW9kYWxPcGVuKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0U2VsZWN0ZWRSZXF1ZXN0Rm9yUmVzcG9uc2UobnVsbCk7XG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0yIGJnLXNsYXRlLTEwMCByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkXCJcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICDYpdmE2LrYp9ihXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgb25DbGljaz17aGFuZGxlUmVzcG9uZFRvTW9kUmVxdWVzdFN1Ym1pdH1cbiAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshbW9kUmVzcG9uc2VOb3Rlcy50cmltKCl9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC02IHB5LTIgYmctYmx1ZS02MDAgdGV4dC13aGl0ZSBob3ZlcjpiZy1ibHVlLTcwMCByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIHNoYWRvdy1tZFwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAg2K3Zgdi4INmI2KrYs9is2YrZhCDYp9mE2LHYryDwn5KsXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAgey8qIEVNUExPWUVFIEJBTksgREVUQUlMUyBNT0RBTCAqL31cbiAgICAgIHtpc0JhbmtNb2RhbE9wZW4gJiYgc2VsZWN0ZWRCYW5rRW1wbG95ZWUgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZpeGVkIGluc2V0LTAgYmctc2xhdGUtOTAwLzYwIHotNTAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC00IGJhY2tkcm9wLWJsdXIteHNcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctZnVsbCBtYXgtdy1sZyBiZy13aGl0ZSByb3VuZGVkLTN4bCBwLTYgcmVsYXRpdmUgc2hhZG93LTJ4bCBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMFwiPlxuICAgICAgICAgICAgey8qIENsb3NlIGJ1dHRvbiAqL31cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgIHNldElzQmFua01vZGFsT3BlbihmYWxzZSk7XG4gICAgICAgICAgICAgICAgc2V0U2VsZWN0ZWRCYW5rRW1wbG95ZWUobnVsbCk7XG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cImFic29sdXRlIGxlZnQtNiB0b3AtNiBwLTEuNSBiZy1zbGF0ZS01MCBob3ZlcjpiZy1zbGF0ZS0xMDAgcm91bmRlZC1mdWxsIHRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtc2xhdGUtNjAwIHRyYW5zaXRpb24tY29sb3JzXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPFggY2xhc3NOYW1lPVwidy01IGgtNVwiIC8+XG4gICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAgey8qIEhlYWRlciAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMgYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTEwMCBwYi00IG1iLTVcIj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicC0zIGJnLXNreS01MCB0ZXh0LXNreS02MDAgcm91bmRlZC0yeGxcIj5cbiAgICAgICAgICAgICAgICA8QnVpbGRpbmcgY2xhc3NOYW1lPVwidy02IGgtNlwiIC8+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC1iYXNlIGZvbnQtYmxhY2sgdGV4dC1zbGF0ZS04MDAgZm9udC1hcmFiaWNcIj5cbiAgICAgICAgICAgICAgICAgINiq2YHYp9i12YrZhCDYp9mE2K3Ys9in2Kgg2KfZhNio2YbZg9mKINmI2KfZhNiq2K3ZiNmK2YQg2KfZhNmF2KfZhNmKXG4gICAgICAgICAgICAgICAgPC9oMz5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIGZvbnQtYXJhYmljIG10LTAuNVwiPlxuICAgICAgICAgICAgICAgICAg2KjZitin2YbYp9iqINio2YbZgyDYp9mE2YXZiNi42YE6IDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc2t5LTYwMCBmb250LWJvbGRcIj57c2VsZWN0ZWRCYW5rRW1wbG95ZWUuYXJhYmljTmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogQmFuayBEZXRhaWxzIFRhYmxlL0dyaWQgKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMyB0ZXh0LXhzIGZvbnQtYXJhYmljXCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWJldHdlZW4gaXRlbXMtY2VudGVyIHAtMyBiZy1zbGF0ZS01MCByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItc2xhdGUtMTUwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS01MDAgZm9udC1ib2xkXCI+2KfYs9mFINin2YTZhdi12LHZgSAoQmFuayBOYW1lKTo8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHN0cm9uZyBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTgwMCBmb250LXNhbnNcIj57c2VsZWN0ZWRCYW5rRW1wbG95ZWUuYmFua05hbWUgfHwgXCLigJRcIn08L3N0cm9uZz5cbiAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1jZW50ZXIgcC0zIGJnLXNsYXRlLTUwIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0xNTBcIj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTUwMCBmb250LWJvbGRcIj7YsdmC2YUg2KfZhNit2LPYp9ioINin2YTYr9mI2YTZiiAoSUJBTik6PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzdHJvbmcgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS04MDAgZm9udC1tb25vIHRyYWNraW5nLXdpZGVyIHNlbGVjdC1hbGxcIj57c2VsZWN0ZWRCYW5rRW1wbG95ZWUuaWJhbiB8fCBcIuKAlFwifTwvc3Ryb25nPlxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1iZXR3ZWVuIGl0ZW1zLWNlbnRlciBwLTMgYmctc2xhdGUtNTAgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXNsYXRlLTE1MFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNTAwIGZvbnQtYm9sZFwiPtix2YLZhSDYp9mE2K3Ys9in2Kgg2KfZhNis2KfYsdmKIChBY2NvdW50IE51bWJlcik6PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzdHJvbmcgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS04MDAgZm9udC1tb25vIHRyYWNraW5nLXdpZGVyIHNlbGVjdC1hbGxcIj57c2VsZWN0ZWRCYW5rRW1wbG95ZWUuYWNjb3VudE51bWJlciB8fCBcIuKAlFwifTwvc3Ryb25nPlxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1iZXR3ZWVuIGl0ZW1zLWNlbnRlciBwLTMgYmctc2xhdGUtNTAgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXNsYXRlLTE1MFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNTAwIGZvbnQtYm9sZFwiPtix2YXYsiDYp9mE2LPZiNmK2YHYqiAoU1dJRlQgQ29kZSk6PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzdHJvbmcgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS04MDAgZm9udC1tb25vIHNlbGVjdC1hbGxcIj57c2VsZWN0ZWRCYW5rRW1wbG95ZWUuc3dpZnRDb2RlIHx8IFwi4oCUXCJ9PC9zdHJvbmc+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWJldHdlZW4gaXRlbXMtY2VudGVyIHAtMyBiZy1zbGF0ZS01MCByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItc2xhdGUtMTUwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS01MDAgZm9udC1ib2xkXCI+2LfYsdmK2YLYqSDYp9mE2KrYrdmI2YrZhCDYp9mE2YXYp9mE2YogKFRyYW5zZmVyIE1ldGhvZCk6PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzdHJvbmcgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS04MDBcIj57c2VsZWN0ZWRCYW5rRW1wbG95ZWUudHJhbnNmZXJNZXRob2QgfHwgXCJTQVJJRVwifTwvc3Ryb25nPlxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1iZXR3ZWVuIGl0ZW1zLWNlbnRlciBwLTMgYmctc2xhdGUtNTAgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXNsYXRlLTE1MFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNTAwIGZvbnQtYm9sZFwiPtin2LPZhSDYtdin2K3YqCDYp9mE2K3Ys9in2KggKEFjY291bnQgSG9sZGVyKTo8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHN0cm9uZyBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTgwMFwiPntzZWxlY3RlZEJhbmtFbXBsb3llZS5hY2NvdW50SG9sZGVyTmFtZSB8fCBcIuKAlFwifTwvc3Ryb25nPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogRm9vdGVyICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtdC02IHB0LTQgYm9yZGVyLXQgYm9yZGVyLXNsYXRlLTEwMCBmbGV4IGp1c3RpZnktZW5kXCI+XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICBzZXRJc0JhbmtNb2RhbE9wZW4oZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgc2V0U2VsZWN0ZWRCYW5rRW1wbG95ZWUobnVsbCk7XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC02IHB5LTIgYmctc2xhdGUtMTAwIGhvdmVyOmJnLXNsYXRlLTIwMCB0ZXh0LXNsYXRlLTcwMCByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIHRyYW5zaXRpb24tY29sb3JzXCJcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgINil2LrZhNin2YIg2KfZhNmG2KfZgdiw2KlcbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7LyogREVUQUlMRUQgTVVMVEktREVEVUNUSU9OUyBNQU5BR0VNRU5UIE1PREFMICovfVxuICAgICAge2lzRGVkdWN0aW9uTW9kYWxPcGVuICYmIHNlbGVjdGVkRGVkdWN0aW9uRW1wbG95ZWUgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZpeGVkIGluc2V0LTAgYmctc2xhdGUtOTAwLzYwIHotNTAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC00IGJhY2tkcm9wLWJsdXIteHMgb3ZlcmZsb3cteS1hdXRvXCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LWZ1bGwgbWF4LXctNHhsIGJnLXdoaXRlIHJvdW5kZWQtM3hsIHAtNiBzbTpwLTggcmVsYXRpdmUgc2hhZG93LTJ4bCBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCBmbGV4IGZsZXgtY29sIG1heC1oLVs5MHZoXVwiPlxuICAgICAgICAgICAgey8qIENsb3NlIGJ1dHRvbiAqL31cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgIHNldElzRGVkdWN0aW9uTW9kYWxPcGVuKGZhbHNlKTtcbiAgICAgICAgICAgICAgICBzZXRTZWxlY3RlZERlZHVjdGlvbkVtcGxveWVlKG51bGwpO1xuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJhYnNvbHV0ZSBsZWZ0LTYgdG9wLTYgcC0xLjUgYmctc2xhdGUtNTAgaG92ZXI6Ymctc2xhdGUtMTAwIHJvdW5kZWQtZnVsbCB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXNsYXRlLTYwMCB0cmFuc2l0aW9uLWNvbG9yc1wiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDxYIGNsYXNzTmFtZT1cInctNSBoLTVcIiAvPlxuICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgIHsvKiBIZWFkZXIgKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zLjUgYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTEwMCBwYi00IG1iLTVcIj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicC0zIGJnLXJvc2UtNTAgdGV4dC1yb3NlLTYwMCByb3VuZGVkLTJ4bFwiPlxuICAgICAgICAgICAgICAgIDxNaW51c0NpcmNsZSBjbGFzc05hbWU9XCJ3LTYgaC02XCIgLz5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LWJhc2UgZm9udC1ibGFjayB0ZXh0LXNsYXRlLTgwMCBmb250LWFyYWJpYyBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICAgICAgPHNwYW4+2KXYr9in2LHYqSDYp9mE2KfYs9iq2YLYt9in2LnYp9iqINin2YTYqtmB2LXZitmE2YrYqSDZhNmE2YXZiNi42YE6PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1yb3NlLTYwMFwiPntzZWxlY3RlZERlZHVjdGlvbkVtcGxveWVlLmFyYWJpY05hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS00MDAgZm9udC1tb25vIGZvbnQtYm9sZCB0ZXh0LXhzXCI+KHtzZWxlY3RlZERlZHVjdGlvbkVtcGxveWVlLmVtcGxveWVlSWR9KTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2gzPlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwIGZvbnQtYXJhYmljIG10LTAuNVwiPlxuICAgICAgICAgICAgICAgICAg2KPYr9iu2YQg2KjZhtmI2K8g2KfZhNiu2LXZhSDYp9mE2KrZgdi12YrZhNmK2Kkg2YjYp9mE2KzYstin2KHYp9iqLiDZitis2Kgg2KrYrdiv2YrYryDZgtmK2YXYqSDYo9mD2KjYsSDZhdmGINin2YTYtdmB2LEg2YjYs9io2Kgg2KXZhNiy2KfZhdmKINmE2YPZhCDYqNmG2K8g2K7YtdmFINmF2K/YsdisLlxuICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIENvbnRlbnQgKFNjcm9sbGFibGUgbGlzdCBvZiByb3dzKSAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG92ZXJmbG93LXktYXV0byBwci0xIHBsLTEgc3BhY2UteS00IG1iLTZcIj5cbiAgICAgICAgICAgICAge2xvY2FsRGVkdWN0aW9ucy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlciBweS0xMCBiZy1zbGF0ZS01MCByb3VuZGVkLTJ4bCBib3JkZXItMiBib3JkZXItZGFzaGVkIGJvcmRlci1zbGF0ZS0yMDBcIj5cbiAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS01MDAgZm9udC1ib2xkIGZvbnQtYXJhYmljIG1iLTNcIj5cbiAgICAgICAgICAgICAgICAgICAg2YTYpyDZitmI2KzYryDYo9mKINio2YbZiNivINiu2LXZhSDYqtmB2LXZitmE2YrYqSDZhdiz2KzZhNipINit2KfZhNmK2KfZiyDZhNmH2LDYpyDYp9mE2YXZiNi42YFcbiAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdJZCA9IGBERUQtTkVXLSR7RGF0ZS5ub3coKX0tJHtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMDAwKX1gO1xuICAgICAgICAgICAgICAgICAgICAgIHNldExvY2FsRGVkdWN0aW9ucyhbXG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5sb2NhbERlZHVjdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBuZXdJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJPdGhlciBEZWR1Y3Rpb25cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYW1vdW50OiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICByZWFzb246IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGVzOiBcIlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRhY2htZW50VXJsOiBcIlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVkQnk6IHVzZXIudXNlcm5hbWUgfHwgXCJTeXN0ZW1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZWRCeTogdXNlci51c2VybmFtZSB8fCBcIlN5c3RlbVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0yIGJnLXJvc2UtNTAgdGV4dC1yb3NlLTYwMCBob3ZlcjpiZy1yb3NlLTEwMCByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIGZvbnQtYXJhYmljIHRyYW5zaXRpb24tY29sb3JzXCJcbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgKyDYpdi22KfZgdipINij2YjZhCDYqNmG2K8g2K7YtdmFINin2YTYotmGXG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktM1wiPlxuICAgICAgICAgICAgICAgICAge2xvY2FsRGVkdWN0aW9ucy5tYXAoKGl0ZW0sIGlkeCkgPT4gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAga2V5PXtpdGVtLmlkfVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInAtNCBiZy1zbGF0ZS01MCByb3VuZGVkLTJ4bCBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMC84MCBob3Zlcjpib3JkZXItcm9zZS0yMDAgdHJhbnNpdGlvbi1hbGwgZ3JpZCBncmlkLWNvbHMtMSBtZDpncmlkLWNvbHMtMTIgZ2FwLTMuNSByZWxhdGl2ZSBpdGVtcy1lbmRcIlxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgey8qIFR5cGUgZHJvcGRvd24gKi99XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtZDpjb2wtc3Bhbi0zXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYmxvY2sgbWItMSB0ZXh0LVsxMC41cHhdIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTUwMCBmb250LWFyYWJpY1wiPtmG2YjYuSDYp9mE2KfYs9iq2YLYt9in2Lk6PC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzZWxlY3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2l0ZW0udHlwZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsID0gZS50YXJnZXQudmFsdWUgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldExvY2FsRGVkdWN0aW9ucyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsRGVkdWN0aW9ucy5tYXAoKGQpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGQuaWQgPT09IGl0ZW0uaWQgPyB7IC4uLmQsIHR5cGU6IHZhbCB9IDogZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBwLTIuNSBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCByb3VuZGVkLXhsIGJnLXdoaXRlIHRleHQteHMgZm9udC1ib2xkIGZvbnQtYXJhYmljIHRleHQtc2xhdGUtNzAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItcm9zZS01MDBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiTG9hbiBEZWR1Y3Rpb25cIj7Yrti12YUg2LPZhNmB2KkgKExvYW4gRGVkdWN0aW9uKTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiQWJzZW5jZSBEZWR1Y3Rpb25cIj7Yrti12YUg2LrZitin2KggKEFic2VuY2UgRGVkdWN0aW9uKTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiTGF0ZSBEZWR1Y3Rpb25cIj7Yrti12YUg2KrYo9iu2YrYsSAoTGF0ZSBEZWR1Y3Rpb24pPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJQZW5hbHR5IERlZHVjdGlvblwiPtiu2LXZhSDYrNiy2KfYoSDYpdiv2KfYsdmKIChQZW5hbHR5IERlZHVjdGlvbik8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIk90aGVyIERlZHVjdGlvblwiPtiu2LXZhSDYotiu2LEgKE90aGVyIERlZHVjdGlvbik8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgey8qIEFtb3VudCAqL31cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1kOmNvbC1zcGFuLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9jayBtYi0xIHRleHQtWzEwLjVweF0gZm9udC1ib2xkIHRleHQtc2xhdGUtNTAwIGZvbnQtYXJhYmljXCI+2KfZhNmC2YrZhdipINin2YTZhdiu2LXZiNmF2KkgKNixLtizKSAqOjwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cIm51bWJlclwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtpdGVtLmFtb3VudCA9PT0gMCA/IFwiXCIgOiBpdGVtLmFtb3VudH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsID0gTnVtYmVyKGUudGFyZ2V0LnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRMb2NhbERlZHVjdGlvbnMoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhbERlZHVjdGlvbnMubWFwKChkKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkLmlkID09PSBpdGVtLmlkID8geyAuLi5kLCBhbW91bnQ6IHZhbCB9IDogZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwi2YXYq9in2YQ6IDE1MFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBwLTIuNSBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCByb3VuZGVkLXhsIHRleHQteHMgZm9udC1tb25vIGZvbnQtYm9sZCB0ZXh0LXJvc2UtNjAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItcm9zZS01MDAgdGV4dC1jZW50ZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgIHsvKiBSZWFzb24gKi99XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtZDpjb2wtc3Bhbi0zXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYmxvY2sgbWItMSB0ZXh0LVsxMC41cHhdIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTUwMCBmb250LWFyYWJpY1wiPtin2YTYs9io2Kgg2KfZhNmF2YjYq9mCINmI2KfZhNmF2KfZhti5ICo6PC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtpdGVtLnJlYXNvbn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0TG9jYWxEZWR1Y3Rpb25zKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxEZWR1Y3Rpb25zLm1hcCgoZCkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZC5pZCA9PT0gaXRlbS5pZCA/IHsgLi4uZCwgcmVhc29uOiBlLnRhcmdldC52YWx1ZSB9IDogZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwi2YXYq9in2YQ6INi62YrYp9ioINmK2YjZhSAxNSDYo9mD2KrZiNio2LEg2K/ZiNmGINi52LDYsVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBwLTIuNSBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIHRleHQtc2xhdGUtODAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItcm9zZS01MDBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgIHsvKiBPcHRpb25hbCBOb3RlcyAmIEF0dGFjaG1lbnQgbGluayAqL31cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1kOmNvbC1zcGFuLTMgZ3JpZCBncmlkLWNvbHMtMiBnYXAtMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIG1iLTEgdGV4dC1bMTBweF0gZm9udC1ib2xkIHRleHQtc2xhdGUtNDAwIGZvbnQtYXJhYmljXCI+2YXZhNin2K3YuNin2Kog2K/Yp9iu2YTZitipOjwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17aXRlbS5ub3RlcyB8fCBcIlwifVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0TG9jYWxEZWR1Y3Rpb25zKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhbERlZHVjdGlvbnMubWFwKChkKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGQuaWQgPT09IGl0ZW0uaWQgPyB7IC4uLmQsIG5vdGVzOiBlLnRhcmdldC52YWx1ZSB9IDogZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCLYp9iu2KrZitin2LHZilwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHAtMi41IGJvcmRlciBib3JkZXItc2xhdGUtMjAwIHJvdW5kZWQteGwgdGV4dC1bMTFweF0gdGV4dC1zbGF0ZS02MDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1yb3NlLTUwMFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9jayBtYi0xIHRleHQtWzEwcHhdIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTQwMCBmb250LWFyYWJpY1wiPtix2KfYqNi3INin2YTZhdix2YHZgi/Yp9mE2KXYq9io2KfYqjo8L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2l0ZW0uYXR0YWNobWVudFVybCB8fCBcIlwifVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0TG9jYWxEZWR1Y3Rpb25zKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhbERlZHVjdGlvbnMubWFwKChkKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGQuaWQgPT09IGl0ZW0uaWQgPyB7IC4uLmQsIGF0dGFjaG1lbnRVcmw6IGUudGFyZ2V0LnZhbHVlIH0gOiBkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cItix2KfYqNi3IHBkZi9pbWdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBwLTIuNSBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCByb3VuZGVkLXhsIHRleHQtWzEwcHhdIGZvbnQtbW9ubyBmb250LWJvbGQgdGV4dC1zbGF0ZS01MDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1yb3NlLTUwMFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgIHsvKiBSZW1vdmUgYnV0dG9uICovfVxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWQ6Y29sLXNwYW4tMSB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldExvY2FsRGVkdWN0aW9ucyhsb2NhbERlZHVjdGlvbnMuZmlsdGVyKChkKSA9PiBkLmlkICE9PSBpdGVtLmlkKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInAtMi41IGJnLXJvc2UtNTAgaG92ZXI6Ymctcm9zZS0xMDAgdGV4dC1yb3NlLTYwMCByb3VuZGVkLXhsIHRyYW5zaXRpb24tY29sb3JzIGlubGluZS1mbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlclwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwi2K3YsNmBINmH2LDYpyDYp9mE2KjZhtivXCJcbiAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPFRyYXNoMiBjbGFzc05hbWU9XCJ3LTQgaC00XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICkpfVxuXG4gICAgICAgICAgICAgICAgICB7LyogQWRkIFJvdyBCdXR0b24gKi99XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1lbmQgcHQtMVwiPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV3SWQgPSBgREVELU5FVy0ke0RhdGUubm93KCl9LSR7TWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTAwMCl9YDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldExvY2FsRGVkdWN0aW9ucyhbXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC4uLmxvY2FsRGVkdWN0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBuZXdJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIk90aGVyIERlZHVjdGlvblwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFtb3VudDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWFzb246IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90ZXM6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0YWNobWVudFVybDogXCJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVkQnk6IHVzZXIudXNlcm5hbWUgfHwgXCJTeXN0ZW1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVkQnk6IHVzZXIudXNlcm5hbWUgfHwgXCJTeXN0ZW1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTIgYmctaW5kaWdvLTUwIGhvdmVyOmJnLWluZGlnby0xMDAgdGV4dC1pbmRpZ28tNjAwIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJvbGQgZm9udC1hcmFiaWMgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiXG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj4rINil2LbYp9mB2Kkg2KjZhtivINin2LPYqtmC2LfYp9i5INil2LbYp9mB2Yo8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIEJvdHRvbSBGb290ZXIgJiBSdW5uaW5nIFN1bXMgKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJvcmRlci10IGJvcmRlci1zbGF0ZS0xMDAgcHQtNSBmbGV4IGZsZXgtY29sIHNtOmZsZXgtcm93IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtM1wiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtc2xhdGUtNTAwIGZvbnQtYXJhYmljXCI+2KXYrNmF2KfZhNmKINin2YTYrti12YjZhdin2Kog2KfZhNis2KfYsdmK2Kk6PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtbW9ubyB0ZXh0LWJhc2UgZm9udC1leHRyYWJvbGQgdGV4dC1yb3NlLTYwMCBiZy1yb3NlLTUwIHB4LTMgcHktMS41IHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1yb3NlLTE1MFwiPlxuICAgICAgICAgICAgICAgICAge2xvY2FsRGVkdWN0aW9ucy5yZWR1Y2UoKHN1bSwgZCkgPT4gc3VtICsgTnVtYmVyKGQuYW1vdW50IHx8IDApLCAwKS50b0xvY2FsZVN0cmluZygnZW4tVVMnKX0g2LEu2LNcbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBnYXAtMiB3LWZ1bGwgc206dy1hdXRvIGp1c3RpZnktZW5kXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHNldElzRGVkdWN0aW9uTW9kYWxPcGVuKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0U2VsZWN0ZWREZWR1Y3Rpb25FbXBsb3llZShudWxsKTtcbiAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC01IHB5LTIuNSBiZy1zbGF0ZS0xMDAgaG92ZXI6Ymctc2xhdGUtMjAwIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJvbGQgZm9udC1hcmFiaWMgdHJhbnNpdGlvbi1jb2xvcnMgdGV4dC1zbGF0ZS02MDBcIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgINil2YTYutin2KEg2YjYqtix2KfYrNi5XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVTYXZlRGVkdWN0aW9uc01vZGFsfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNiBweS0yLjUgYmctcm9zZS02MDAgaG92ZXI6Ymctcm9zZS03MDAgdGV4dC13aGl0ZSByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIGZvbnQtYXJhYmljIHRyYW5zaXRpb24tY29sb3JzIHNoYWRvdy1tZCBob3ZlcjpzaGFkb3ctbGcgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgPHNwYW4+4pyTINit2YHYuCDZiNin2LnYqtmF2KfYryDYp9mE2KjZhtmI2K8g2YjYpdi52KfYr9ipINin2YTYp9it2KrYs9in2Kg8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAgey8qIFJFR0lTVEVSIFRSQU5TRkVSIE1PREFMICovfVxuICAgICAge2lzVHJhbnNmZXJNb2RhbE9wZW4gJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZpeGVkIGluc2V0LTAgYmctc2xhdGUtOTAwLzYwIHotNTAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC00XCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LWZ1bGwgbWF4LXctbGcgYmctd2hpdGUgcm91bmRlZC0zeGwgcC04IHJlbGF0aXZlXCI+XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldElzVHJhbnNmZXJNb2RhbE9wZW4oZmFsc2UpfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJhYnNvbHV0ZSBsZWZ0LTYgdG9wLTYgcC0xLjUgYmctc2xhdGUtNTAgaG92ZXI6Ymctc2xhdGUtMTAwIHJvdW5kZWQtZnVsbCB0ZXh0LXNsYXRlLTQwMFwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDxYIGNsYXNzTmFtZT1cInctNSBoLTVcIiAvPlxuICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMgbWItNlwiPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJwLTMgYmctcHVycGxlLTUwIHRleHQtcHVycGxlLTYwMCByb3VuZGVkLTJ4bFwiPlxuICAgICAgICAgICAgICAgIDxDcmVkaXRDYXJkIGNsYXNzTmFtZT1cInctNiBoLTZcIiAvPlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtbGcgZm9udC1ibGFjayB0ZXh0LXNsYXRlLTgwMFwiPtiq2LPYrNmK2YQg2YjYqtmI2KvZitmCINit2YjYp9mE2Kkg2KfZhNix2YjYp9iq2Kgg2KfZhNio2YbZg9mK2Kk8L2gzPlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS00MDBcIj7YqtmI2KvZitmCINmF2LHYrNi5INin2YTYqtit2YjZitmEINmI2KrYutmK2YrYsSDYrdin2YTYqSDZhdiz2YrYsSDYp9mE2LHZiNin2KrYqCDYpdmE2YkgKNiq2YUg2KfZhNiq2K3ZiNmK2YQpLjwvcD5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGZvcm0gb25TdWJtaXQ9e2hhbmRsZVJlZ2lzdGVyVHJhbnNmZXJTdWJtaXR9IGNsYXNzTmFtZT1cInNwYWNlLXktNCB0ZXh0LXhzIGZvbnQtc2Fuc1wiPlxuICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9jayBtYi0xIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTUwMFwiPtin2YTYrdiz2KfYqCDYp9mE2YXYtdix2YHZiiDYp9mE2LXYp9iv2LEg2YTZhNmF2LXZhti5ICo8L2xhYmVsPlxuICAgICAgICAgICAgICAgIDxzZWxlY3RcbiAgICAgICAgICAgICAgICAgIHZhbHVlPXt0cmFuc2ZlckZvcm0uYmFua05hbWV9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldFRyYW5zZmVyRm9ybSh7IC4uLnRyYW5zZmVyRm9ybSwgYmFua05hbWU6IGUudGFyZ2V0LnZhbHVlIH0pfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHAtMyBib3JkZXIgcm91bmRlZC14bCBiZy13aGl0ZSB0ZXh0LXNsYXRlLTgwMFwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cItin2YTYqNmG2YMg2KfZhNij2YfZhNmKINin2YTYs9i52YjYr9mKIChTTkIpXCI+2KfZhNio2YbZgyDYp9mE2KPZh9mE2Yog2KfZhNiz2LnZiNiv2YogKFNOQik8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCLZhdi12LHZgSDYp9mE2LHYp9is2K3ZiiAoQWwgUmFqaGkgQmFuaylcIj7Zhdi12LHZgSDYp9mE2LHYp9is2K3ZiiAoQWwgUmFqaGkgQmFuayk8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCLYqNmG2YMg2KfZhNix2YrYp9i2IChSaXlhZCBCYW5rKVwiPtio2YbZgyDYp9mE2LHZitin2LYgKFJpeWFkIEJhbmspPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwi2KfZhNio2YbZgyDYp9mE2LPYudmI2K/ZiiDYp9mE2KPZiNmEIChTQUIpXCI+2KfZhNio2YbZgyDYp9mE2LPYudmI2K/ZiiDYp9mE2KPZiNmEIChTQUIpPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMiBnYXAtNFwiPlxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYmxvY2sgbWItMSBmb250LWJvbGQgdGV4dC1zbGF0ZS01MDBcIj7YsdmC2YUg2YXYsdis2Lkg2KfZhNit2YjYp9mE2Kkg2KfZhNio2YbZg9mK2KkgKFNBUklFKSAqPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXt0cmFuc2ZlckZvcm0ucmVmZXJlbmNlTnVtYmVyfVxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldFRyYW5zZmVyRm9ybSh7IC4uLnRyYW5zZmVyRm9ybSwgcmVmZXJlbmNlTnVtYmVyOiBlLnRhcmdldC52YWx1ZSB9KX1cbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCLZhdir2KfZhDogUmVmLTk4MjQyMTQ4MlwiXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBwLTMgYm9yZGVyIHJvdW5kZWQteGwgZm9udC1tb25vIHRleHQtc2xhdGUtODAwIGZvbnQtYm9sZFwiXG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9jayBtYi0xIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTUwMFwiPtiq2KfYsdmK2K4g2KXYrNix2KfYoSDYp9mE2K3ZiNin2YTYqSAqPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwiZGF0ZVwiXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXt0cmFuc2ZlckZvcm0udHJhbnNmZXJEYXRlfVxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldFRyYW5zZmVyRm9ybSh7IC4uLnRyYW5zZmVyRm9ybSwgdHJhbnNmZXJEYXRlOiBlLnRhcmdldC52YWx1ZSB9KX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHAtMyBib3JkZXIgcm91bmRlZC14bCBmb250LW1vbm8gZm9udC1ib2xkXCJcbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIG1iLTEgZm9udC1ib2xkIHRleHQtc2xhdGUtNTAwXCI+2YXZhNin2K3YuNin2Kog2KrYs9mI2YrYqSDYp9mE2K3ZiNin2YTYqTwvbGFiZWw+XG4gICAgICAgICAgICAgICAgPHRleHRhcmVhXG4gICAgICAgICAgICAgICAgICB2YWx1ZT17dHJhbnNmZXJGb3JtLm5vdGVzfVxuICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRUcmFuc2ZlckZvcm0oeyAuLi50cmFuc2ZlckZvcm0sIG5vdGVzOiBlLnRhcmdldC52YWx1ZSB9KX1cbiAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwi2YXYq9in2YQ6INiq2YUg2KXYsdiz2KfZhCDZhdmE2YEg2KfZhNiq2K3ZiNmK2YQg2KfZhNiq2YTZgtin2KbZiiBTQVJJRSDZhNmE2KjZhtmDINin2YTYo9mH2YTZitiMINmI2YLYqNmI2YQg2KfZhNit2YjYp9mE2KfYqiDZiNil2LHYs9in2YQg2KfZhNil2LTYudin2LHYp9iqINmE2YfZiNin2KrZgSDYp9mE2LnZhdin2YQuLi5cIlxuICAgICAgICAgICAgICAgICAgcm93cz17Mn1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBwLTMgYm9yZGVyIHJvdW5kZWQteGwgdGV4dC14cyBmb2N1czpvdXRsaW5lLW5vbmVcIlxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctcHVycGxlLTUwIHAtNCByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItcHVycGxlLTEwMCBmbGV4IGl0ZW1zLXN0YXJ0IGdhcC0yLjVcIj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWJhc2UgdGV4dC1wdXJwbGUtNjAwXCI+8J+SuDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXB1cnBsZS04MDAgbGVhZGluZy1yZWxheGVkIGZvbnQtc2VtaWJvbGRcIj5cbiAgICAgICAgICAgICAgICAgINmF2YTYp9it2LjYqSDYp9mE2KPYsdi02YHYqTog2KjZhdis2LHYryDYp9mE2K3Zgdi4INmI2KfZhNiq2YjYq9mK2YLYjCDYs9mK2KrZhSDYo9ix2LTZgdipINmH2LDYpyDYp9mE2YXYs9mK2LEg2YXYuSDYqtmB2KfYtdmK2YQg2YPYtNmBINix2YjYp9iq2Kgg2KfZhNmF2YjYuNmB2YrZhiDZhNmF2YbYuSDYo9mKINiq2LnYr9mK2YQg2YXYs9iq2YLYqNmE2YrYjCDZiNmC2YrYryDYp9mE2YXYudin2YXZhNipINmB2Yog2KfZhNit2LPYp9io2KfYqiDYp9mE2LnYp9mF2Kkg2YTZhNi02LHZg9ipINiq2YTZgtin2KbZitin2YsuXG4gICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZ2FwLTIganVzdGlmeS1lbmQgcHQtM1wiPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0SXNUcmFuc2Zlck1vZGFsT3BlbihmYWxzZSl9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTIgYmctc2xhdGUtMTAwIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJvbGRcIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgINil2YTYutin2KEg2KfZhNiq2LHYp9is2LlcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTYgcHktMiBiZy1wdXJwbGUtNjAwIHRleHQtd2hpdGUgaG92ZXI6YmctcHVycGxlLTcwMCByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIHNoYWRvdy1tZFwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAg2KrZiNir2YrZgiDZiNin2LnYqtmF2KfYryDYp9mE2K3ZiNin2YTYqSDwn5qAXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9mb3JtPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBTT0ZUIERFTEVURSBSRUFTT04gTU9EQUwgKi99XG4gICAgICB7aXNEZWxldGVSZWFzb25Nb2RhbE9wZW4gJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZpeGVkIGluc2V0LTAgYmctc2xhdGUtOTAwLzYwIHotNTAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC00XCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LWZ1bGwgbWF4LXctbWQgYmctd2hpdGUgcm91bmRlZC0zeGwgcC04IHJlbGF0aXZlIHNoYWRvdy0yeGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0xMDBcIj5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgIHNldElzRGVsZXRlUmVhc29uTW9kYWxPcGVuKGZhbHNlKTtcbiAgICAgICAgICAgICAgICBzZXRSdW5Ub0RlbGV0ZUlkKG51bGwpO1xuICAgICAgICAgICAgICAgIHNldERlbGV0ZVJlYXNvblRleHQoXCJcIik7XG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cImFic29sdXRlIGxlZnQtNiB0b3AtNiBwLTEuNSBiZy1zbGF0ZS01MCBob3ZlcjpiZy1zbGF0ZS0xMDAgcm91bmRlZC1mdWxsIHRleHQtc2xhdGUtNDAwIHRyYW5zaXRpb24tY29sb3JzXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPFggY2xhc3NOYW1lPVwidy01IGgtNVwiIC8+XG4gICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMyBtYi02XCI+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInAtMyBiZy1yb3NlLTUwIHRleHQtcm9zZS02MDAgcm91bmRlZC0yeGxcIj5cbiAgICAgICAgICAgICAgICA8VHJhc2gyIGNsYXNzTmFtZT1cInctNiBoLTZcIiAvPlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtYmFzZSBmb250LWJsYWNrIHRleHQtc2xhdGUtODAwIGZvbnQtYXJhYmljXCI+2KrYo9mD2YrYryDYrdiw2YEg2YXYs9mK2LEg2KfZhNix2YjYp9iq2Kgg2YXYpNmC2KrYp9mLPC9oMz5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIGZvbnQtYXJhYmljXCI+2YrYqti32YTYqCDYqtmI2KvZitmCINiz2KjYqCDYp9mE2K3YsNmBINmE2YTYo9ix2LTZgdipINmI2KfZhNiq2K/ZgtmK2YIg2KfZhNmF2KfZhNmKLjwvcD5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYmxvY2sgbWItMiBmb250LWJvbGQgdGV4dC1zbGF0ZS02MDAgZm9udC1hcmFiaWMgdGV4dC14c1wiPtmK2LHYrNmJINmD2KrYp9io2Kkg2LPYqNioINin2YTYrdiw2YEg2YTZhNmF2LPZitixINin2YTZhdin2YTZiiAqPC9sYWJlbD5cbiAgICAgICAgICAgICAgICA8dGV4dGFyZWFcbiAgICAgICAgICAgICAgICAgIHZhbHVlPXtkZWxldGVSZWFzb25UZXh0fVxuICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXREZWxldGVSZWFzb25UZXh0KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwi2YXYq9in2YQ6INiq2YUg2KXZhNi62KfYoSDYp9mE2YXYs9mK2LEg2YTYpdi52KfYr9ipINil2K/Ysdin2KzZhyDYqNi52K8g2KrYs9mI2YrYqSDYs9in2LnYp9iqINin2YTYudmF2YQg2KfZhNil2LbYp9mB2YrYqSDZhNmE2YXZiNi42YHZitmGLi4uXCJcbiAgICAgICAgICAgICAgICAgIHJvd3M9ezR9XG4gICAgICAgICAgICAgICAgICByZXF1aXJlZFxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHAtMyBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCBmb2N1czpib3JkZXItcm9zZS01MDAgZm9jdXM6cmluZy0xIGZvY3VzOnJpbmctcm9zZS01MDAgcm91bmRlZC14bCB0ZXh0LXhzIGZvY3VzOm91dGxpbmUtbm9uZSB0cmFuc2l0aW9uLWFsbCBmb250LWFyYWJpY1wiXG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1yb3NlLTUwLzUwIHAtNCByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItcm9zZS0xMDAvNTAgZmxleCBpdGVtcy1zdGFydCBnYXAtMi41XCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1iYXNlIHRleHQtcm9zZS02MDBcIj7imqDvuI88L3NwYW4+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1yb3NlLTgwMCBsZWFkaW5nLXJlbGF4ZWQgZm9udC1zZW1pYm9sZCBmb250LWFyYWJpY1wiPlxuICAgICAgICAgICAgICAgICAg2YXZhNin2K3YuNipINij2YXYp9mGOiDYs9mK2KrZhSDZiNiz2YUg2YfYsNinINin2YTZhdiz2YrYsSDYqNmAICjZhdit2LDZiNmBKSDZiNij2LHYtNmB2Kkg2KfZhNiq2YHYp9i12YrZhCDZhdi5INiq2YjYq9mK2YIg2KfYs9mFINin2YTZhdiz2KrYrtiv2YUg2YjYqtmI2YLZitiqINin2YTYudmF2YTZitipINmB2Yog2YbYuNin2YUg2LPYrNmEINin2YTYqtiv2YLZitmCINin2YTZhdin2YTZiiDZiNmE2Kcg2YrZhdmD2YYg2KrYudiv2YrZhNmHINmE2KfYrdmC2KfZiy5cbiAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBnYXAtMiBqdXN0aWZ5LWVuZCBwdC0yXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHNldElzRGVsZXRlUmVhc29uTW9kYWxPcGVuKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0UnVuVG9EZWxldGVJZChudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0RGVsZXRlUmVhc29uVGV4dChcIlwiKTtcbiAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTIgYmctc2xhdGUtMTAwIGhvdmVyOmJnLXNsYXRlLTIwMCB0ZXh0LXNsYXRlLTYwMCByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIHRyYW5zaXRpb24tY29sb3JzIGZvbnQtYXJhYmljXCJcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICDYpdmE2LrYp9ihINin2YTYqtix2KfYrNi5XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVDb25maXJtU29mdERlbGV0ZX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTYgcHktMiBiZy1yb3NlLTYwMCBob3ZlcjpiZy1yb3NlLTcwMCB0ZXh0LXdoaXRlIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJvbGQgc2hhZG93LW1kIGhvdmVyOnNoYWRvdy1sZyB0cmFuc2l0aW9uLWFsbCBmb250LWFyYWJpY1wiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAg2KrYo9mD2YrYryDYrdiw2YEg2YjYo9ix2LTZgdipINin2YTZhdiz2YrYsSDwn5eR77iPXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cbiAgICA8L2Rpdj5cbiAgKTtcbn1cbiJdLCJtYXBwaW5ncyI6IkFBaXZEZSxTQW9vQlMsVUFwb0JUO0FBanZEZixTQUFnQixVQUFVLGlCQUFpQjtBQUMzQyxPQUFPLGNBQWM7QUFDckI7QUFBQSxFQUNFO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FB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QSxXQVBGO0FBQUE7QUFBQTtBQUFBO0FBQUEsYUFRQTtBQUFBLE1BRUEsdUJBQUMsU0FBSSxXQUFVLGFBQ2I7QUFBQSwrQkFBQyxTQUNDO0FBQUEsaUNBQUMsV0FBTSxXQUFVLDJEQUEwRCxvREFBM0U7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFBK0c7QUFBQSxVQUMvRztBQUFBLFlBQUM7QUFBQTtBQUFBLGNBQ0MsT0FBTztBQUFBLGNBQ1AsVUFBVSxDQUFDLE1BQU0sb0JBQW9CLEVBQUUsT0FBTyxLQUFLO0FBQUEsY0FDbkQsYUFBWTtBQUFBLGNBQ1osTUFBTTtBQUFBLGNBQ04sVUFBUTtBQUFBLGNBQ1IsV0FBVTtBQUFBO0FBQUEsWUFOWjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsVUFPQTtBQUFBLGFBVEY7QUFBQTtBQUFBO0FBQUE7QUFBQSxlQVVBO0FBQUEsUUFFQSx1QkFBQyxTQUFJLFdBQVUsbUZBQ2I7QUFBQSxpQ0FBQyxVQUFLLFdBQVUsMkJBQTBCLGtCQUExQztBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQUE0QztBQUFBLFVBQzVDLHVCQUFDLE9BQUUsV0FBVSx1RUFBc0UsbUtBQW5GO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBRUE7QUFBQSxhQUpGO0FBQUE7QUFBQTtBQUFBO0FBQUEsZUFLQTtBQUFBLFFBRUEsdUJBQUMsU0FBSSxXQUFVLCtCQUNiO0FBQUE7QUFBQSxZQUFDO0FBQUE7QUFBQSxjQUNDLE1BQUs7QUFBQSxjQUNMLFNBQVMsTUFBTTtBQUNiLDJDQUEyQixLQUFLO0FBQ2hDLGlDQUFpQixJQUFJO0FBQ3JCLG9DQUFvQixFQUFFO0FBQUEsY0FDeEI7QUFBQSxjQUNBLFdBQVU7QUFBQSxjQUNYO0FBQUE7QUFBQSxZQVJEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxVQVVBO0FBQUEsVUFDQTtBQUFBLFlBQUM7QUFBQTtBQUFBLGNBQ0MsTUFBSztBQUFBLGNBQ0wsU0FBUztBQUFBLGNBQ1QsV0FBVTtBQUFBLGNBQ1g7QUFBQTtBQUFBLFlBSkQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFVBTUE7QUFBQSxhQWxCRjtBQUFBO0FBQUE7QUFBQTtBQUFBLGVBbUJBO0FBQUEsV0F2Q0Y7QUFBQTtBQUFBO0FBQUE7QUFBQSxhQXdDQTtBQUFBLFNBOURGO0FBQUE7QUFBQTtBQUFBO0FBQUEsV0ErREEsS0FoRUY7QUFBQTtBQUFBO0FBQUE7QUFBQSxXQWlFQTtBQUFBLE9BN3FFSjtBQUFBO0FBQUE7QUFBQTtBQUFBLFNBK3FFQTtBQUVKOyIsIm5hbWVzIjpbInRvRW5nbGlzaERpZ2l0cyJdfQ==