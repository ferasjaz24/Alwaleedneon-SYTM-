import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, doc, getDocs, setDoc, getDoc, updateDoc } from "firebase/firestore";

interface RevenueRecord {
  id: string;
  revenueId: string;
  invoiceId: string;
  invoiceNo: string;
  customerId: string;
  customerName: string;
  quotationId?: string;
  quotationNo?: string;
  revenueDate: string;
  taxableAmount: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  revenueStatus: "Unpaid" | "Partially Paid" | "Paid" | "Cancelled";
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

export default function RevenuesTab({ lang, user }: { lang: "ar" | "en"; user: any }) {
  const [revenues, setRevenues] = useState<RevenueRecord[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [boxes, setBoxes] = useState<CashBox[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter tab: "all", "unpaid", "partially_paid", "paid", "overdue"
  const [activeSubFilter, setActiveSubFilter] = useState("all");

  // Selected for payment
  const [selectedRevenue, setSelectedRevenue] = useState<RevenueRecord | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Selected for print receipt
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [showReceiptPrint, setShowReceiptPrint] = useState(false);

  // Edit Revenue state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<RevenueRecord | null>(null);
  const [editForm, setEditForm] = useState({
    customerName: "",
    revenueDate: "",
    totalAmount: 0,
    notes: "",
  });

  const openEditModal = (rev: RevenueRecord) => {
    setEditingRevenue(rev);
    setEditForm({
      customerName: rev.customerName || "",
      revenueDate: rev.revenueDate || "",
      totalAmount: Number(rev.totalAmount || 0),
      notes: (rev as any).notes || "",
    });
    setShowEditModal(true);
  };

  const handleSaveEditRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRevenue) return;
    try {
      const nowStr = new Date().toISOString();
      const nextRemaining = Number(editForm.totalAmount) - Number(editingRevenue.paidAmount || 0);
      let nextStatus = editingRevenue.revenueStatus;
      if (nextRemaining <= 0) {
        nextStatus = "Paid";
      } else if (editingRevenue.paidAmount > 0) {
        nextStatus = "Partially Paid";
      } else {
        nextStatus = "Unpaid";
      }

      await updateDoc(doc(db, "revenues", editingRevenue.id), {
        customerName: editForm.customerName,
        revenueDate: editForm.revenueDate,
        totalAmount: Number(editForm.totalAmount),
        remainingAmount: nextRemaining,
        revenueStatus: nextStatus,
        notes: editForm.notes,
      });

      alert(lang === "ar" ? "تم تعديل بيانات الإيراد المالي بنجاح" : "Revenue updated successfully");
      setShowEditModal(false);
      setEditingRevenue(null);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Error updating revenue");
    }
  };

  // Payment Form fields
  const [paymentForm, setPaymentForm] = useState({
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Bank Transfer" as "Bank Transfer" | "Cash" | "Mada" | "Cheque",
    amount: 0,
    bankAccountId: "",
    cashBoxId: "",
    referenceNo: "",
    notes: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const revSnap = await getDocs(collection(db, "revenues"));
      const revList = revSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as RevenueRecord))
        .sort((a, b) => {
          const dateA = a.revenueDate || "";
          const dateB = b.revenueDate || "";
          if (dateA !== dateB) return dateB.localeCompare(dateA);
          return (b.revenueId || "").localeCompare(a.revenueId || "");
        });
      setRevenues(revList);

      const bankSnap = await getDocs(collection(db, "bank_accounts"));
      const bankList = bankSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as BankAccount))
        .filter((b: any) => !b.isDeleted && b.status === "Active");
      setBanks(bankList);

      const boxSnap = await getDocs(collection(db, "cash_boxes"));
      const boxList = boxSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as CashBox))
        .filter((b: any) => !b.isDeleted && b.status === "Active");
      setBoxes(boxList);

      // Set default selected bank/box in form if available
      if (bankList.length > 0) {
        setPaymentForm(prev => ({ ...prev, bankAccountId: bankList[0].id }));
      }
      if (boxList.length > 0) {
        setPaymentForm(prev => ({ ...prev, cashBoxId: boxList[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openPaymentModal = (rev: RevenueRecord) => {
    setSelectedRevenue(rev);
    setPaymentForm({
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "Bank Transfer",
      amount: rev.remainingAmount,
      bankAccountId: banks[0]?.id || "",
      cashBoxId: boxes[0]?.id || "",
      referenceNo: "",
      notes: "",
    });
    setShowPaymentModal(true);
  };

  // Submit Payment
  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRevenue) return;

    const amountToPay = Number(paymentForm.amount);
    if (amountToPay <= 0) {
      alert(lang === "ar" ? "يجب أن تكون قيمة الدفعة أكبر من صفر" : "Payment amount must be greater than zero");
      return;
    }
    if (amountToPay > selectedRevenue.remainingAmount) {
      alert(lang === "ar" ? "قيمة الدفعة تتجاوز المبلغ المتبقي المستحق" : "Payment amount exceeds remaining amount");
      return;
    }

    try {
      const nowStr = new Date().toISOString();
      const userStr = user?.username || "System";
      const receiptId = `RCPT_${Date.now()}`;
      const receiptNo = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Create Receipt Record
      const receiptPayload = {
        id: receiptId,
        receiptNo,
        invoiceId: selectedRevenue.invoiceId,
        invoiceNo: selectedRevenue.invoiceNo,
        customerId: selectedRevenue.customerId,
        customerName: selectedRevenue.customerName,
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        amount: amountToPay,
        bankAccountId: paymentForm.paymentMethod === "Cash" ? "" : paymentForm.bankAccountId,
        cashBoxId: paymentForm.paymentMethod === "Cash" ? paymentForm.cashBoxId : "",
        referenceNo: paymentForm.referenceNo,
        notes: paymentForm.notes,
        createdAt: nowStr,
        createdBy: userStr,
      };

      await setDoc(doc(db, "receipts", receiptId), receiptPayload);

      // 2. Generate Payment Journal Entry (قيد استلام الدفعة)
      // Debit Cash/Bank [Amount]
      // Credit Accounts Receivable [Amount]
      const jvId = `JV_PMT_${receiptNo}_${Date.now()}`;
      const journalEntryNo = `JV-PMT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Determine Debit Line account
      const isCash = paymentForm.paymentMethod === "Cash";
      const debitAccountType = isCash ? "Cash" : "Bank";
      const debitAccountCode = isCash ? "1101" : "1102";
      
      const targetBank = banks.find(b => b.id === paymentForm.bankAccountId);
      const targetBox = boxes.find(b => b.id === paymentForm.cashBoxId);
      
      const debitAccountName = isCash
        ? `صندوق النقدية - ${targetBox?.cashBoxName || "الرئيسي"}`
        : `حساب بنكي - ${targetBank?.bankName || "البنك"}`;

      const lines = [
        {
          id: `JV_L_PMT_1_${Date.now()}`,
          lineNo: 1,
          accountType: debitAccountType,
          accountCode: debitAccountCode,
          accountName: debitAccountName,
          debit: amountToPay,
          credit: 0,
          bankAccountId: isCash ? "" : paymentForm.bankAccountId,
          cashBoxId: isCash ? paymentForm.cashBoxId : "",
          description: `دفعة واردة من العميل ${selectedRevenue.customerName} للفاتورة رقم ${selectedRevenue.invoiceNo}`,
          createdAt: nowStr,
        },
        {
          id: `JV_L_PMT_2_${Date.now()}`,
          lineNo: 2,
          accountType: "Accounts Receivable",
          accountCode: "1201",
          accountName: `حسابات مدراء عملاء - ${selectedRevenue.customerName}`,
          debit: 0,
          credit: amountToPay,
          customerId: selectedRevenue.customerId,
          invoiceId: selectedRevenue.invoiceId,
          description: `سداد جزء/كامل الفاتورة رقم ${selectedRevenue.invoiceNo} بسند قبض رقم ${receiptNo}`,
          createdAt: nowStr,
        },
      ];

      const journalPayload = {
        id: jvId,
        journalEntryNo,
        date: paymentForm.paymentDate,
        sourceModule: "Revenue Receipt",
        sourceId: receiptId,
        description: `قيد سداد دفعة العميل ${selectedRevenue.customerName} للفاتورة رقم ${selectedRevenue.invoiceNo}`,
        status: "Draft", // Created as Draft so cash/bank accounts are only affected upon approval
        totalDebit: amountToPay,
        totalCredit: amountToPay,
        isBalanced: true,
        cashBankApplied: false,
        createdAt: nowStr,
        createdBy: userStr,
        createdByName: user?.username || "ERP User",
        lines,
      };

      await setDoc(doc(db, "journal_entries", jvId), journalPayload);

      // 4. Update Customer Invoice financial values (الربط المتكامل للفاتورة)
      const invRef = doc(db, "customer_invoices", selectedRevenue.invoiceId);
      const invSnap = await getDoc(invRef);
      if (invSnap.exists()) {
        const invData = invSnap.data();
        const nextPaid = Number(invData.amountPaid || 0) + amountToPay;
        const nextRem = Number(invData.grandTotal) - nextPaid;
        let nextStatus = "Partially Paid";
        if (nextRem <= 0) nextStatus = "Paid";

        await updateDoc(invRef, {
          amountPaid: nextPaid,
          remainingAmount: nextRem,
          status: nextStatus,
        });
      }

      // 5. Update Revenue Record status
      const nextPaidRev = selectedRevenue.paidAmount + amountToPay;
      const nextRemRev = selectedRevenue.totalAmount - nextPaidRev;
      let nextStatusRev: "Unpaid" | "Partially Paid" | "Paid" = "Partially Paid";
      if (nextRemRev <= 0) nextStatusRev = "Paid";

      await updateDoc(doc(db, "revenues", selectedRevenue.id), {
        paidAmount: nextPaidRev,
        remainingAmount: nextRemRev,
        revenueStatus: nextStatusRev,
      });

      // 6. Save Audit Logs
      const auditLogId = `LOG_PMT_${Date.now()}`;
      await setDoc(doc(db, "audit_logs", auditLogId), {
        userId: user?.id || "unknown",
        userName: user?.username || "System",
        userRole: user?.role || "Admin",
        action: "تسجيل دفعة واردة وإصدار سند قبض",
        module: "Revenues",
        recordId: receiptId,
        notes: `تم سداد ${amountToPay} SAR من العميل ${selectedRevenue.customerName} للفاتورة ${selectedRevenue.invoiceNo}`,
        createdAt: nowStr,
      });

      alert(lang === "ar" ? "تم تسجيل الدفعة بنجاح وتوليد قيد يومية مسودة (بانتظار الاعتماد لتحديث الأرصدة البنكية والمالية)" : "Payment registered successfully and draft journal entry generated");
      setShowPaymentModal(false);
      setSelectedRevenue(null);
      loadData();

      // Show receipt print preview
      setSelectedReceipt(receiptPayload);
      setShowReceiptPrint(true);
    } catch (err) {
      console.error(err);
      alert("Error processing payment");
    }
  };

  // Filter list
  const filteredRevenues = revenues.filter((rev) => {
    if (activeSubFilter === "all") return rev.revenueStatus !== "Cancelled";
    if (activeSubFilter === "unpaid") return rev.revenueStatus === "Unpaid";
    if (activeSubFilter === "partially_paid") return rev.revenueStatus === "Partially Paid";
    if (activeSubFilter === "paid") return rev.revenueStatus === "Paid";
    if (activeSubFilter === "overdue") {
      // Overdue is unpaid/partially paid with an old date (say older than 15 days, or let's simplify)
      const diffDays = (Date.now() - new Date(rev.revenueDate).getTime()) / (1000 * 3600 * 24);
      return (rev.revenueStatus === "Unpaid" || rev.revenueStatus === "Partially Paid") && diffDays > 15;
    }
    return true;
  });

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8 space-y-6" dir="rtl">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#005185] tracking-tight">
          💰 قسم الإيرادات والمستحقات المالية
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          تتبع الإيرادات المتولدة من فواتير المبيعات الصادرة، وإدارة سندات المقبوضات وتثبيت الدفعات المتتالية للعملاء.
        </p>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <button
          onClick={() => setActiveSubFilter("all")}
          className={`p-5 rounded-3xl border transition-all text-right shadow-sm ${
            activeSubFilter === "all" ? "bg-[#0072BC] text-white border-[#005185]" : "bg-white border-slate-100"
          }`}
        >
          <span className="text-xs font-bold opacity-80">إجمالي الإيرادات التعاقدية</span>
          <p className="text-xl font-extrabold mt-1">
            {revenues
              .filter((x) => x.revenueStatus !== "Cancelled")
              .reduce((sum, x) => sum + Number(x.totalAmount || 0), 0)
              .toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
            SAR
          </p>
        </button>
        <button
          onClick={() => setActiveSubFilter("unpaid")}
          className={`p-5 rounded-3xl border transition-all text-right shadow-sm ${
            activeSubFilter === "unpaid" ? "bg-rose-600 text-white border-rose-700" : "bg-white border-slate-100"
          }`}
        >
          <span className="text-xs font-bold opacity-80">إجمالي الذمم المدينة غير المدفوعة</span>
          <p className="text-xl font-extrabold mt-1">
            {revenues
              .filter((x) => x.revenueStatus === "Unpaid")
              .reduce((sum, x) => sum + Number(x.remainingAmount || 0), 0)
              .toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
            SAR
          </p>
        </button>
        <button
          onClick={() => setActiveSubFilter("partially_paid")}
          className={`p-5 rounded-3xl border transition-all text-right shadow-sm ${
            activeSubFilter === "partially_paid" ? "bg-amber-500 text-white border-amber-600" : "bg-white border-slate-100"
          }`}
        >
          <span className="text-xs font-bold opacity-80">مقبوضات جزئية معلقة</span>
          <p className="text-xl font-extrabold mt-1">
            {revenues
              .filter((x) => x.revenueStatus === "Partially Paid")
              .reduce((sum, x) => sum + Number(x.remainingAmount || 0), 0)
              .toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
            SAR
          </p>
        </button>
        <button
          onClick={() => setActiveSubFilter("paid")}
          className={`p-5 rounded-3xl border transition-all text-right shadow-sm ${
            activeSubFilter === "paid" ? "bg-emerald-600 text-white border-emerald-700" : "bg-white border-slate-100"
          }`}
        >
          <span className="text-xs font-bold opacity-80">إجمالي الإيرادات المحصلة فعلياً</span>
          <p className="text-xl font-extrabold mt-1">
            {revenues
              .filter((x) => x.revenueStatus !== "Cancelled")
              .reduce((sum, x) => sum + Number(x.paidAmount || 0), 0)
              .toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
            SAR
          </p>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-0.5 text-xs font-bold shrink-0 overflow-x-auto">
        <button
          onClick={() => setActiveSubFilter("all")}
          className={`py-2.5 px-4 border-b-2 transition-all ${
            activeSubFilter === "all" ? "border-[#0072BC] text-[#0072BC]" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          كل الإيرادات ({revenues.filter((x) => x.revenueStatus !== "Cancelled").length})
        </button>
        <button
          onClick={() => setActiveSubFilter("unpaid")}
          className={`py-2.5 px-4 border-b-2 transition-all ${
            activeSubFilter === "unpaid" ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          مستحقات غير مدفوعة ({revenues.filter((x) => x.revenueStatus === "Unpaid").length})
        </button>
        <button
          onClick={() => setActiveSubFilter("partially_paid")}
          className={`py-2.5 px-4 border-b-2 transition-all ${
            activeSubFilter === "partially_paid" ? "border-amber-500 text-amber-500" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          مدفوعة جزئياً ({revenues.filter((x) => x.revenueStatus === "Partially Paid").length})
        </button>
        <button
          onClick={() => setActiveSubFilter("paid")}
          className={`py-2.5 px-4 border-b-2 transition-all ${
            activeSubFilter === "paid" ? "border-emerald-600 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          محصلة بالكامل ({revenues.filter((x) => x.revenueStatus === "Paid").length})
        </button>
        <button
          onClick={() => setActiveSubFilter("overdue")}
          className={`py-2.5 px-4 border-b-2 transition-all ${
            activeSubFilter === "overdue" ? "border-red-600 text-red-600 animate-pulse" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          فواتير متأخرة السداد (&gt;15 يوم)
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        {filteredRevenues.length === 0 ? (
          <div className="text-center py-20 text-slate-400 font-semibold">
            لا توجد إيرادات مسجلة مطابقة للفرز الحالي.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">رقم الفاتورة</th>
                  <th className="px-6 py-4">العميل</th>
                  <th className="px-6 py-4">تاريخ الاستحقاق</th>
                  <th className="px-6 py-4 text-left">قيمة العقد شاملة الضريبة (SAR)</th>
                  <th className="px-6 py-4 text-left">المبلغ المحصل فعلياً</th>
                  <th className="px-6 py-4 text-left">المبلغ المتبقي الذمة</th>
                  <th className="px-6 py-4 text-center">حالة تحصيل الإيراد</th>
                  <th className="px-6 py-4 text-center">الإجراءات والعمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold text-slate-600">
                {filteredRevenues.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[#0072BC]">
                      {rev.invoiceNo}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-extrabold text-slate-800">{rev.customerName}</p>
                      {rev.quotationNo && <span className="text-[10px] text-slate-400">مرجع عرض سعر: {rev.quotationNo}</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{rev.revenueDate}</td>
                    <td className="px-6 py-4 text-left font-mono font-bold text-slate-800">
                      {Number(rev.totalAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-left font-mono text-emerald-600 font-bold">
                      {Number(rev.paidAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-left font-mono text-rose-600 font-bold">
                      {Number(rev.remainingAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold ${
                          rev.revenueStatus === "Unpaid"
                            ? "bg-rose-50 text-rose-700 border border-rose-100"
                            : rev.revenueStatus === "Partially Paid"
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-emerald-50 text-emerald-800 border border-emerald-100"
                        }`}
                      >
                        {rev.revenueStatus === "Unpaid"
                          ? "مستحق بالكامل"
                          : rev.revenueStatus === "Partially Paid"
                          ? "محصل جزئياً"
                          : "محصل بالكامل"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {rev.remainingAmount > 0 ? (
                          <button
                            onClick={() => openPaymentModal(rev)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-3 rounded-lg text-[10px] font-extrabold transition-all shadow-sm"
                          >
                            💵 تسجيل دفعة قبض
                          </button>
                        ) : (
                          <span className="text-emerald-700 text-xs">✔️ مستوفى</span>
                        )}
                        <button
                          onClick={() => openEditModal(rev)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-3 rounded-lg text-[10px] font-extrabold transition-all border border-slate-200"
                        >
                          ✏️ تعديل الإيراد
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REGISTER PAYMENT MODAL */}
      {showPaymentModal && selectedRevenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex justify-between items-center">
              <h3 className="text-lg font-extrabold flex items-center gap-1.5">
                <span>💰</span> تسجيل دفعة مقبوضات واردة
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-white hover:text-red-200 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterPayment} className="p-6 space-y-5 text-slate-700 text-xs font-bold">
              <div className="bg-slate-50 p-4 rounded-xl space-y-1.5">
                <p>العميل المستفيد: <span className="text-[#005185]">{selectedRevenue.customerName}</span></p>
                <p>الفاتورة المرتبطة: <span className="text-[#0072BC]">{selectedRevenue.invoiceNo}</span></p>
                <p>الذمة المتبقية المستحقة: <span className="text-rose-600 font-mono text-sm">{Number(selectedRevenue.remainingAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</span></p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 mb-1">تاريخ التحصيل والدفع *</label>
                  <input
                    type="date"
                    required
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">طريقة القبض والدفع *</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                  >
                    <option value="Bank Transfer">تحويل بنكي مباشر (Direct Transfer)</option>
                    <option value="Cash">نقداً / كاش للصندوق (Cash Box)</option>
                    <option value="Mada">شبكة مدى (Mada POS)</option>
                    <option value="Cheque">شيك مصرفي (Cheque)</option>
                  </select>
                </div>

                {paymentForm.paymentMethod === "Cash" ? (
                  <div className="col-span-2">
                    <label className="block text-slate-600 mb-1">تحديد صندوق نقدية الاستقبال *</label>
                    <select
                      value={paymentForm.cashBoxId}
                      required
                      onChange={(e) => setPaymentForm({ ...paymentForm, cashBoxId: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                    >
                      <option value="">-- اختر الصندوق النقدي --</option>
                      {boxes.map((box) => (
                        <option key={box.id} value={box.id}>
                          {box.cashBoxName} (الرصيد الحالي: {Number(box.currentBalance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="col-span-2">
                    <label className="block text-slate-600 mb-1">تحديد الحساب البنكي المستقبل للدفعة *</label>
                    <select
                      value={paymentForm.bankAccountId}
                      required
                      onChange={(e) => setPaymentForm({ ...paymentForm, bankAccountId: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                    >
                      <option value="">-- اختر الحساب البنكي --</option>
                      {banks.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.bankName} - {bank.accountName} (رصيد: {Number(bank.currentBalance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-slate-600 mb-1">مبلغ القبض المسدد (SAR) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={selectedRevenue.remainingAmount}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-lg p-2 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">رقم الحوالة/المرجع</label>
                  <input
                    type="text"
                    value={paymentForm.referenceNo}
                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceNo: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2"
                    placeholder="رقم العملية / مرجع البنك"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">شرح وبيان الدفعة</label>
                <textarea
                  rows={2}
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2"
                  placeholder="ملاحظات تفصيلية..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-5 rounded-lg text-xs transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg text-xs transition-all shadow-md"
                >
                  حفظ الدفعة وتوليد قيد مسودة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT PRINT MODAL */}
      {showReceiptPrint && selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border overflow-hidden">
            <div className="bg-[#005185] p-5 text-white flex justify-between items-center">
              <h2 className="text-sm font-bold">📄 سند قبض مبيعات مالي</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-white text-[#005185] py-1 px-3 rounded-lg font-bold text-xs"
                >
                  🖨️ طباعة السند
                </button>
                <button
                  onClick={() => setShowReceiptPrint(false)}
                  className="text-white hover:text-red-200 text-lg font-bold px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Receipt area */}
            <div className="p-8 space-y-6 text-slate-800 text-xs text-right select-text leading-relaxed font-semibold" id="receipt-print-area">
              <div className="text-center space-y-1 pb-4 border-b border-slate-200">
                <h1 className="text-lg font-extrabold text-[#005185]">شركة فنون الوليد للدعاية والإعلان</h1>
                <p className="text-[10px] text-slate-400 font-bold">AL WALEED ARTS ADVERTISING CO.</p>
                <span className="inline-block border border-slate-400 px-3 py-0.5 rounded text-xs font-extrabold bg-slate-50">
                  سند قبض مالي مبيعات / RECEIPT VOUCHER
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>رقم السند: <span className="font-mono text-[#0072BC] font-extrabold">{selectedReceipt.receiptNo}</span></div>
                <div>تاريخ التحصيل: <span className="font-mono">{selectedReceipt.paymentDate}</span></div>
                <div>الفاتورة المرتبطة: <span className="font-mono text-slate-700 font-bold">{selectedReceipt.invoiceNo}</span></div>
                <div>طريقة الدفع: <span>{selectedReceipt.paymentMethod}</span></div>
              </div>

              <hr />

              <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p>استلمنا من السيد/السادة: <span className="text-[#005185] text-sm font-bold">{selectedReceipt.customerName}</span></p>
                <p>مبلغ وقدره: <span className="text-emerald-700 text-sm font-extrabold">{Number(selectedReceipt.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</span></p>
                {selectedReceipt.referenceNo && <p>بموجب المرجع/الحوالة: <span className="font-mono text-slate-600">{selectedReceipt.referenceNo}</span></p>}
                {selectedReceipt.notes && <p>وذلك عن: {selectedReceipt.notes}</p>}
              </div>

              <div className="grid grid-cols-2 gap-8 pt-6 text-center font-bold">
                <div>
                  <p className="border-b pb-1 text-slate-400">توقيع المستلم والمسلم</p>
                </div>
                <div>
                  <p className="border-b pb-1 text-[#005185]">ختم وتوقيع الإدارة المالية</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t flex justify-end">
              <button
                onClick={() => setShowReceiptPrint(false)}
                className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-6 rounded-xl text-xs transition-all"
              >
                إغلاق السند
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT REVENUE MODAL */}
      {showEditModal && editingRevenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-right">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-white flex justify-between items-center">
              <h3 className="text-xs font-extrabold flex items-center gap-1.5">
                <span>✏️</span> تعديل بيانات الإيراد المستحق
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingRevenue(null);
                }}
                className="text-white hover:text-red-200 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditRevenue} className="p-6 space-y-4 text-slate-700 text-xs font-bold">
              <div>
                <label className="block text-slate-600 mb-1">اسم العميل (Customer Name) *</label>
                <input
                  type="text"
                  required
                  value={editForm.customerName}
                  onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">تاريخ استحقاق الإيراد *</label>
                <input
                  type="date"
                  required
                  value={editForm.revenueDate}
                  onChange={(e) => setEditForm({ ...editForm, revenueDate: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">قيمة العقد الإجمالية شاملة الضريبة (SAR) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={editForm.totalAmount}
                  onChange={(e) => setEditForm({ ...editForm, totalAmount: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-mono"
                />
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  المبلغ الحالي المسدد منه: {Number(editingRevenue.paidAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR
                </p>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">ملاحظات وشرح الإيراد</label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2"
                  placeholder="مثال: إيراد الدفعة الأولى لمشروع لوحات طريق مكة..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRevenue(null);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-5 rounded-lg text-xs transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-6 rounded-lg text-xs transition-all shadow-md"
                >
                  حفظ تعديلات الإيراد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
