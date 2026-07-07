import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, doc, getDocs, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { Search, CheckCircle, AlertCircle, Calendar, DollarSign, ArrowLeft, Eye, X } from "lucide-react";

interface ExpenseRecord {
  id: string;
  expenseNo: string;
  supplierInvoiceId: string;
  invoiceNo: string;
  supplierId: string;
  supplierName: string;
  poId: string;
  projectName: string;
  expenseDate: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  paymentStatus: "Pending Payment" | "Paid" | "Partially Paid";
  paidFromType?: "Bank" | "Cash";
  paidFromId?: string;
  paidFromName?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  currentBalance: number;
}

interface CashBox {
  id: string;
  cashBoxName: string;
  currentBalance: number;
}

export default function ExpensesTab({ lang, user }: { lang: "ar" | "en"; user: any }) {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [boxes, setBoxes] = useState<CashBox[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchNo, setSearchNo] = useState("");
  const [searchSupplier, setSearchSupplier] = useState("");
  const [filterPayment, setFilterPayment] = useState("all");

  // Selected Expense for payment modal
  const [selectedExpenseForPayment, setSelectedExpenseForPayment] = useState<ExpenseRecord | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Selected for Details View
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Payment Form state
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: "Bank" as "Bank" | "Cash",
    bankAccountId: "",
    cashBoxId: "",
  });

  // Custom Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Toast notifications state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch Expenses
      const expSnap = await getDocs(collection(db, "expenses"));
      const expList = expSnap.docs
        .map((d) => ({ id: d.id, ...d.data() } as ExpenseRecord))
        .sort((a, b) => {
          const dateA = a.expenseDate || "";
          const dateB = b.expenseDate || "";
          if (dateA !== dateB) return dateB.localeCompare(dateA);
          return (b.expenseNo || "").localeCompare(a.expenseNo || "");
        });
      setExpenses(expList);

      // Fetch Banks & Cashboxes
      const [banksSnap, boxesSnap] = await Promise.all([
        getDocs(collection(db, "bank_accounts")),
        getDocs(collection(db, "cash_boxes")),
      ]);

      const bankList = banksSnap.docs.map((d) => {
        const data = d.data();
        const currentBalance = Number(data.currentBalance ?? data.current_balance ?? 0);
        return {
          id: d.id,
          bankName: data.bankName || "",
          accountName: data.accountName || "",
          currentBalance,
        };
      });

      const boxList = boxesSnap.docs.map((d) => {
        const data = d.data();
        const currentBalance = Number(data.currentBalance ?? data.current_balance ?? 0);
        return {
          id: d.id,
          cashBoxName: data.cashBoxName || "",
          currentBalance,
        };
      });

      setBanks(bankList);
      setBoxes(boxList);

      // Set default payment selections
      if (bankList.length > 0) {
        setPaymentForm((prev) => ({ ...prev, bankAccountId: bankList[0].id }));
      }
      if (boxList.length > 0) {
        setPaymentForm((prev) => ({ ...prev, cashBoxId: boxList[0].id }));
      }
    } catch (e) {
      console.error(e);
      showToast(lang === "ar" ? "خطأ في تحميل البيانات" : "Error loading data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Initiate Payment Approval Modal
  const initiatePayment = (exp: ExpenseRecord) => {
    setSelectedExpenseForPayment(exp);
    setShowPaymentModal(true);
  };

  // Process Expense Payment & Generate Draft Journal Entry
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpenseForPayment) return;

    let targetAccountName = "";
    let targetAccountId = "";
    const isBank = paymentForm.paymentMethod === "Bank";

    if (isBank) {
      const selectedBank = banks.find((b) => b.id === paymentForm.bankAccountId);
      if (!selectedBank) {
        showToast(lang === "ar" ? "الرجاء اختيار البنك" : "Please select bank account", "error");
        return;
      }
      targetAccountName = `${selectedBank.bankName} - ${selectedBank.accountName}`;
      targetAccountId = selectedBank.id;
    } else {
      const selectedBox = boxes.find((b) => b.id === paymentForm.cashBoxId);
      if (!selectedBox) {
        showToast(lang === "ar" ? "الرجاء اختيار الصندوق" : "Please select cash box", "error");
        return;
      }
      targetAccountName = selectedBox.cashBoxName;
      targetAccountId = selectedBox.id;
    }

    setConfirmDialog({
      isOpen: true,
      title: lang === "ar" ? "تأكيد عملية الصرف ماليًا" : "Confirm Payment Release",
      message:
        lang === "ar"
          ? `هل أنت متأكد من صرف مبلغ ${(Number(selectedExpenseForPayment.totalAmount) || 0).toLocaleString("en-US")} SAR للمورد ${selectedExpenseForPayment.supplierName} من الحساب (${targetAccountName})؟ سيتم توليد قيد يومي مسودة وبانتظار اعتمادك من شاشة القيود اليومية قبل الخصم من الرصيد.`
          : `Are you sure you want to release ${(Number(selectedExpenseForPayment.totalAmount) || 0).toLocaleString("en-US")} SAR to ${selectedExpenseForPayment.supplierName} from ${targetAccountName}? A draft journal entry will be generated.`,
      onConfirm: async () => {
        try {
          const nowStr = new Date().toISOString();
          const expenseId = selectedExpenseForPayment.id;

          // 1. Update the Expense Record to Paid
          await updateDoc(doc(db, "expenses", expenseId), {
            paymentStatus: "Paid",
            paidFromType: paymentForm.paymentMethod,
            paidFromId: targetAccountId,
            paidFromName: targetAccountName,
            paidAt: nowStr,
          });

          // 2. Generate Draft Journal Entry
          const jvId = `JV_EXP_${Date.now()}`;
          const journalEntryNo = `JV-EXP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

          const journalPayload = {
            id: jvId,
            journalEntryNo,
            date: new Date().toISOString().split("T")[0],
            sourceModule: "Adjustment",
            sourceId: expenseId,
            description: `صرف مصروفات فاتورة المورد ${selectedExpenseForPayment.supplierName} - فاتورة رقم ${selectedExpenseForPayment.invoiceNo}`,
            status: "Draft", // Stays Draft as required so user can approve in Journal Entries
            totalDebit: selectedExpenseForPayment.totalAmount,
            totalCredit: selectedExpenseForPayment.totalAmount,
            isBalanced: true,
            cashBankApplied: false,
            createdAt: nowStr,
            createdBy: user?.id || "unknown",
            createdByName: user?.username || "System",
            lines: [
              {
                id: `L1_${Date.now()}`,
                lineNo: 1,
                accountType: "Expense",
                accountCode: "4101",
                accountName: `مشتريات ومصروفات الموردين (${selectedExpenseForPayment.supplierName})`,
                debit: selectedExpenseForPayment.totalAmount,
                credit: 0,
                supplierId: selectedExpenseForPayment.supplierId,
                description: `إثبات مصروف فاتورة المورد ${selectedExpenseForPayment.supplierName}`,
              },
              {
                id: `L2_${Date.now()}`,
                lineNo: 2,
                accountType: isBank ? "Bank" : "Cash",
                accountCode: isBank ? "1102" : "1101",
                accountName: targetAccountName,
                debit: 0,
                credit: selectedExpenseForPayment.totalAmount,
                bankAccountId: isBank ? targetAccountId : "",
                cashBoxId: isBank ? "" : targetAccountId,
                description: `سداد للمورد ${selectedExpenseForPayment.supplierName} من ${targetAccountName}`,
              },
            ],
          };

          await setDoc(doc(db, "journal_entries", jvId), journalPayload);

          showToast(
            lang === "ar"
              ? "تمت عملية الصرف بنجاح وإنشاء قيد يومية مسودة (Draft) بانتظار الاعتماد"
              : "Payment released. Draft journal entry created successfully.",
            "success"
          );

          setShowPaymentModal(false);
          loadData();
        } catch (e) {
          console.error(e);
          showToast(lang === "ar" ? "حدث خطأ أثناء الصرف" : "Error processing payment", "error");
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Filter lists
  const filteredExpenses = expenses.filter((exp) => {
    const matchNo = (exp.expenseNo || "").toLowerCase().includes((searchNo || "").toLowerCase()) || (exp.invoiceNo || "").toLowerCase().includes((searchNo || "").toLowerCase());
    const matchSup = (exp.supplierName || "").toLowerCase().includes((searchSupplier || "").toLowerCase());
    const matchPay = filterPayment === "all" ? true : exp.paymentStatus === filterPayment;
    return matchNo && matchSup && matchPay;
  });

  return (
    <div id="expenses-tab-container" className="space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div
          id="expenses-toast"
          className={`fixed top-4 left-4 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-xs font-black transition-all transform animate-bounce duration-300 ${
            toast.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-250">
            <h3 className="text-sm font-black text-slate-800 mb-3">{confirmDialog.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-5 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-opacity-95 rounded-xl shadow-md transition"
              >
                {lang === "ar" ? "تأكيد وصرف" : "Confirm Release"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            💰 {lang === "ar" ? "المصروفات والمستحقات للموردين" : "Expenses & Supplier Liabilities"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {lang === "ar"
              ? "متابعة مستحقات الموردين وتأكيد سداد المصروفات وتوليد القيود المحاسبية للخصم من البنك أو الصندوق."
              : "Track supplier liabilities, release expenses payments and generate bank journal entries."}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Expenses */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block">
              {lang === "ar" ? "إجمالي المصروفات" : "Total Expenses"}
            </span>
            <span className="text-base font-black text-slate-800 font-mono">
              {expenses.reduce((sum, e) => sum + (Number(e.totalAmount) || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-[9px] text-slate-500 font-sans">SAR</span>
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: Total Unpaid Liabilities */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block">
              {lang === "ar" ? "إجمالي الذمم الدائنة غير المدفوعة" : "Total Unpaid Liabilities"}
            </span>
            <span className="text-base font-black text-rose-600 font-mono">
              {expenses.filter(e => e.paymentStatus === "Pending Payment").reduce((sum, e) => sum + (Number(e.totalAmount) || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-[9px] text-rose-500 font-sans">SAR</span>
            </span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3: Pending Partial Expenses */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block">
              {lang === "ar" ? "مصروفات جزئية معلقة" : "Pending Partial Expenses"}
            </span>
            <span className="text-base font-black text-amber-600 font-mono">
              {expenses.filter(e => e.paymentStatus === "Partially Paid").reduce((sum, e) => sum + (Number(e.totalAmount) || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-[9px] text-amber-500 font-sans">SAR</span>
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Calendar className="w-4 h-4" />
          </div>
        </div>

        {/* Card 4: Actually Paid Expenses */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block">
              {lang === "ar" ? "إجمالي المصروفات المدفوعة فعلياً" : "Actually Paid Expenses"}
            </span>
            <span className="text-base font-black text-emerald-600 font-mono">
              {expenses.filter(e => e.paymentStatus === "Paid").reduce((sum, e) => sum + (Number(e.totalAmount) || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-[9px] text-emerald-500 font-sans">SAR</span>
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
            {lang === "ar" ? "البحث برقم المصروف أو الفاتورة" : "Search by Expense or Invoice No"}
          </label>
          <div className="relative">
            <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchNo}
              onChange={(e) => setSearchNo(e.target.value)}
              placeholder={lang === "ar" ? "أدخل رقم المصروف أو الفاتورة..." : "Search number..."}
              className="w-full pl-4 pr-10 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#0072BC]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
            {lang === "ar" ? "المورد" : "Supplier"}
          </label>
          <div className="relative">
            <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchSupplier}
              onChange={(e) => setSearchSupplier(e.target.value)}
              placeholder={lang === "ar" ? "البحث باسم المورد..." : "Search supplier..."}
              className="w-full pl-4 pr-10 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#0072BC]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
            {lang === "ar" ? "حالة الصرف" : "Payment Status"}
          </label>
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#0072BC] font-semibold"
          >
            <option value="all">{lang === "ar" ? "جميع الحالات" : "All"}</option>
            <option value="Pending Payment">{lang === "ar" ? "في انتظار الصرف" : "Pending Payment"}</option>
            <option value="Partially Paid">{lang === "ar" ? "صرف جزئي معلق" : "Partially Paid"}</option>
            <option value="Paid">{lang === "ar" ? "تم الصرف والدفع" : "Paid"}</option>
          </select>
        </div>
      </div>

      {/* List Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-slate-500">
            {lang === "ar" ? "جاري تحميل المصروفات..." : "Loading Expenses..."}
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-xs font-bold text-slate-400">
            {lang === "ar" ? "لا يوجد مصروفات مطابقة للبحث" : "No expenses found"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-100 font-bold">
                  <th className="p-4">{lang === "ar" ? "رقم المصروف" : "Expense No"}</th>
                  <th className="p-4">{lang === "ar" ? "المورد" : "Supplier"}</th>
                  <th className="p-4">{lang === "ar" ? "رقم فاتورة المورد" : "Supplier Invoice"}</th>
                  <th className="p-4">{lang === "ar" ? "المشروع" : "Project"}</th>
                  <th className="p-4">{lang === "ar" ? "تاريخ الاستحقاق" : "Date"}</th>
                  <th className="p-4 text-left">{lang === "ar" ? "المبلغ المطلوب" : "Amount"}</th>
                  <th className="p-4 text-center">{lang === "ar" ? "حالة الدفع" : "Payment Status"}</th>
                  <th className="p-4">{lang === "ar" ? "صرف من" : "Paid From"}</th>
                  <th className="p-4 text-center">{lang === "ar" ? "الإجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition duration-150">
                    <td className="p-4 font-mono font-bold text-rose-600">{exp.expenseNo}</td>
                    <td className="p-4 font-bold text-slate-800">{exp.supplierName}</td>
                    <td className="p-4 font-mono font-semibold text-slate-500">{exp.invoiceNo}</td>
                    <td className="p-4 font-semibold text-slate-600">{exp.projectName || "---"}</td>
                    <td className="p-4 font-semibold text-slate-500">{exp.expenseDate}</td>
                    <td className="p-4 text-left font-mono font-black text-rose-700">
                      {(Number(exp.totalAmount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[10px] font-black ${
                          exp.paymentStatus === "Paid"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : exp.paymentStatus === "Partially Paid"
                            ? "bg-amber-50 text-amber-600 border border-amber-100 animate-pulse"
                            : "bg-rose-50 text-rose-600 border border-rose-100 animate-pulse"
                        }`}
                      >
                        {exp.paymentStatus === "Paid"
                          ? lang === "ar"
                            ? "تم الصرف"
                            : "Paid"
                          : exp.paymentStatus === "Partially Paid"
                          ? lang === "ar"
                            ? "صرف جزئي معلق"
                            : "Partially Paid"
                          : lang === "ar"
                          ? "انتظار الصرف"
                          : "Pending"}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-600">
                      {exp.paymentStatus === "Paid" ? (
                        <div className="flex flex-col">
                          <span>{exp.paidFromName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{exp.paidAt ? new Date(exp.paidAt).toLocaleDateString() : ""}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">---</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedExpense(exp);
                            setShowDetailModal(true);
                          }}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                          title={lang === "ar" ? "عرض التفاصيل" : "View Details"}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {(exp.paymentStatus === "Pending Payment" || exp.paymentStatus === "Partially Paid") && (
                          <button
                            onClick={() => initiatePayment(exp)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1.5 transition shadow-sm"
                            title={lang === "ar" ? "تأكيد عملية الصرف مالياً" : "Confirm Payment Release"}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>{lang === "ar" ? "تأكيد عملية الصرف مالياً" : "Confirm Payment Release"}</span>
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

      {/* release payment Modal */}
      {showPaymentModal && selectedExpenseForPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200 text-right">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="text-sm font-black text-slate-800">
                💰 {lang === "ar" ? "تأكيد عملية الصرف مالياً" : "Confirm Payment Release"}
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              {/* Payment Info Box */}
              <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 space-y-2 text-xs font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === "ar" ? "المورد المستحق:" : "Supplier:"}</span>
                  <span className="text-slate-800 font-bold">{selectedExpenseForPayment.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === "ar" ? "قيمة الفاتورة المطلوبة:" : "Invoice Amount:"}</span>
                  <span className="text-rose-700 font-mono font-black">
                    {(Number(selectedExpenseForPayment.totalAmount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === "ar" ? "رقم الفاتورة:" : "Invoice No:"}</span>
                  <span className="text-slate-700 font-mono">{selectedExpenseForPayment.invoiceNo}</span>
                </div>
              </div>

              {/* Payment Method / Account Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {lang === "ar" ? "طريقة الصرف والخصم *" : "Deduction Method *"}
                </label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => setPaymentForm({ ...paymentForm, paymentMethod: "Bank" })}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1.5 ${
                      paymentForm.paymentMethod === "Bank"
                        ? "border-[#0072BC] bg-[#0072BC]/5 text-[#0072BC]"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    🏦 {lang === "ar" ? "حساب بنكي" : "Bank Account"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentForm({ ...paymentForm, paymentMethod: "Cash" })}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1.5 ${
                      paymentForm.paymentMethod === "Cash"
                        ? "border-[#0072BC] bg-[#0072BC]/5 text-[#0072BC]"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    💵 {lang === "ar" ? "صندوق / خزينة كاش" : "Cash Box"}
                  </button>
                </div>

                {paymentForm.paymentMethod === "Bank" ? (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                      {lang === "ar" ? "اختر الحساب البنكي الخصيم *" : "Select Bank Account *"}
                    </label>
                    <select
                      value={paymentForm.bankAccountId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, bankAccountId: e.target.value })}
                      className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#0072BC] font-semibold"
                      required
                    >
                      {banks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} - {b.accountName} (رصيد: {(Number(b.currentBalance) || 0).toLocaleString("en-US")} SAR)
                        </option>
                      ))}
                      {banks.length === 0 && (
                        <option value="">{lang === "ar" ? "-- لا يوجد حسابات بنكية معرفة --" : "-- No bank accounts --"}</option>
                      )}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                      {lang === "ar" ? "اختر الخزينة / الصندوق الخصيم *" : "Select Cash Box *"}
                    </label>
                    <select
                      value={paymentForm.cashBoxId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, cashBoxId: e.target.value })}
                      className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#0072BC] font-semibold"
                      required
                    >
                      {boxes.map((bx) => (
                        <option key={bx.id} value={bx.id}>
                          {bx.cashBoxName} (رصيد: {(Number(bx.currentBalance) || 0).toLocaleString("en-US")} SAR)
                        </option>
                      ))}
                      {boxes.length === 0 && (
                        <option value="">{lang === "ar" ? "-- لا يوجد صناديق كاش معرفة --" : "-- No cash boxes --"}</option>
                      )}
                    </select>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition"
                >
                  {lang === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-opacity-95 rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{lang === "ar" ? "تأكيد وإصدار القيد" : "Confirm Payment"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailModal && selectedExpense && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200 text-right">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="text-sm font-black text-slate-800">
                📄 {lang === "ar" ? `تفاصيل مستند الصرف: ${selectedExpense.expenseNo}` : `Expense Details: ${selectedExpense.expenseNo}`}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-slate-500 block">{lang === "ar" ? "المورد:" : "Supplier:"}</span>
                  <span className="text-slate-800 font-bold text-sm block mt-0.5">{selectedExpense.supplierName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{lang === "ar" ? "رقم الفاتورة:" : "Invoice No:"}</span>
                  <span className="text-slate-800 font-mono text-sm block mt-0.5">{selectedExpense.invoiceNo}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-slate-500 block">{lang === "ar" ? "المشروع المرتبط:" : "Project:"}</span>
                  <span className="text-slate-700 block mt-0.5">{selectedExpense.projectName || "بدون مشروع"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{lang === "ar" ? "أمر الشراء (PO):" : "PO ID:"}</span>
                  <span className="text-indigo-600 font-mono block mt-0.5">{selectedExpense.poId || "غير مرتبط"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-slate-500 block">{lang === "ar" ? "تاريخ الاستحقاق:" : "Due Date:"}</span>
                  <span className="text-slate-700 block mt-0.5">{selectedExpense.expenseDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{lang === "ar" ? "حالة الصرف:" : "Payment Status:"}</span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black mt-1 ${
                      selectedExpense.paymentStatus === "Paid"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : selectedExpense.paymentStatus === "Partially Paid"
                        ? "bg-amber-50 text-amber-600 border border-amber-100"
                        : "bg-rose-50 text-rose-600 border border-rose-100"
                    }`}
                  >
                    {selectedExpense.paymentStatus === "Paid"
                      ? lang === "ar"
                        ? "تم الصرف"
                        : "Paid"
                      : selectedExpense.paymentStatus === "Partially Paid"
                      ? lang === "ar"
                        ? "صرف جزئي معلق"
                        : "Partially Paid"
                      : lang === "ar"
                      ? "انتظار الصرف"
                      : "Pending"}
                  </span>
                </div>
              </div>

              {selectedExpense.paymentStatus === "Paid" && (
                <div className="bg-slate-50 p-3 rounded-2xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{lang === "ar" ? "وسيلة الدفع والخصم:" : "Method:"}</span>
                    <span className="text-slate-800 font-bold">{selectedExpense.paidFromName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{lang === "ar" ? "تاريخ ووقت الصرف المالي:" : "Paid At:"}</span>
                    <span className="text-slate-600 font-mono">
                      {selectedExpense.paidAt ? new Date(selectedExpense.paidAt).toLocaleString("en-US") : ""}
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-slate-50/50 p-4 rounded-2xl space-y-2 border border-slate-100 font-semibold text-right">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>{lang === "ar" ? "المبلغ قبل الضريبة:" : "Subtotal:"}</span>
                  <span className="font-mono">{(Number(selectedExpense.subtotal) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>{lang === "ar" ? "ضريبة القيمة المضافة:" : "VAT amount:"}</span>
                  <span className="font-mono">{(Number(selectedExpense.vatAmount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</span>
                </div>
                <hr className="border-slate-200" />
                <div className="flex justify-between text-sm font-black text-rose-600">
                  <span>{lang === "ar" ? "الإجمالي المستحق للصرف:" : "Total release:"}</span>
                  <span className="font-mono">{(Number(selectedExpense.totalAmount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">{lang === "ar" ? "ملاحظات إضافية:" : "Notes:"}</span>
                <p className="bg-slate-50 p-2.5 rounded-xl text-slate-600">{selectedExpense.notes || "لا يوجد"}</p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t mt-5">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition"
              >
                {lang === "ar" ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
