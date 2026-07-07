import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, doc, getDocs, setDoc, query, where } from "firebase/firestore";

interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban: string;
  swiftCode: string;
  openingBalance: number;
  opening_balance?: number;
  currentBalance: number;
  current_balance?: number;
  status: "Active" | "Inactive";
  notes?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

interface CashBox {
  id: string;
  cashBoxName: string;
  responsiblePerson: string;
  openingBalance: number;
  opening_balance?: number;
  currentBalance: number;
  current_balance?: number;
  status: "Active" | "Inactive";
  notes?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

interface CashBankTransaction {
  id: string;
  transactionNo: string;
  journalEntryId: string;
  journalEntryNo: string;
  journalLineId?: string;
  accountType: "Bank" | "Cash";
  bankAccountId?: string;
  bankName?: string;
  cashBoxId?: string;
  cashBoxName?: string;
  direction: "In" | "Out";
  amount: number;
  previousBalance: number;
  newBalance: number;
  description: string;
  sourceModule: string;
  sourceId: string;
  createdAt: string;
  createdBy: string;
  isReversal?: boolean;
}

export default function CashAndBankTab({ lang, user }: { lang: "ar" | "en"; user: any }) {
  // DB Lists
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [boxes, setBoxes] = useState<CashBox[]>([]);
  const [transactions, setTransactions] = useState<CashBankTransaction[]>([]);
  
  // Loading & Modals states
  const [loading, setLoading] = useState(true);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showBoxModal, setShowBoxModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  
  // Form edit states
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [editingBox, setEditingBox] = useState<CashBox | null>(null);

  // Bank Form fields
  const [bankForm, setBankForm] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
    iban: "",
    swiftCode: "",
    openingBalance: 0,
    currentBalance: 0,
    status: "Active" as "Active" | "Inactive",
    notes: "",
    overrideBalance: false
  });

  // Box Form fields
  const [boxForm, setBoxForm] = useState({
    cashBoxName: "",
    responsiblePerson: "",
    openingBalance: 0,
    currentBalance: 0,
    status: "Active" as "Active" | "Inactive",
    notes: "",
    overrideBalance: false
  });

  // General state
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    actionLoading?: boolean;
    type?: "danger" | "warning" | "info" | "success";
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
    type: "success" | "error" | "info" | "warning";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (msg: string, type: "success" | "error" | "info" | "warning" = "success") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const bankSnap = await getDocs(collection(db, "bank_accounts"));
      const bankList = bankSnap.docs
        .map(d => {
          const data = d.data();
          const currentBalance = Number(data.currentBalance ?? data.current_balance ?? 0);
          const openingBalance = Number(data.openingBalance ?? data.opening_balance ?? 0);
          return {
            id: d.id,
            ...data,
            currentBalance,
            current_balance: currentBalance,
            openingBalance,
            opening_balance: openingBalance,
          } as BankAccount;
        })
        .filter(b => !b.isDeleted);
      setBanks(bankList);

      const boxSnap = await getDocs(collection(db, "cash_boxes"));
      const boxList = boxSnap.docs
        .map(d => {
          const data = d.data();
          const currentBalance = Number(data.currentBalance ?? data.current_balance ?? 0);
          const openingBalance = Number(data.openingBalance ?? data.opening_balance ?? 0);
          return {
            id: d.id,
            ...data,
            currentBalance,
            current_balance: currentBalance,
            openingBalance,
            opening_balance: openingBalance,
          } as CashBox;
        })
        .filter(b => !b.isDeleted);
      setBoxes(boxList);

      const txSnap = await getDocs(collection(db, "cash_bank_transactions"));
      const txList = txSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as CashBankTransaction))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTransactions(txList);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(lang === "ar" ? "خطأ في تحميل بيانات النقدية والبنوك" : "Error loading cash/bank data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [lang]);

  // Save/Update Bank Account
  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const id = editingBank ? editingBank.id : `BANK_${Date.now()}`;
      const nowStr = new Date().toISOString();
      const userStr = user?.username || "System";

      const finalCurrentBal = editingBank
        ? (bankForm.overrideBalance ? Number(bankForm.currentBalance) : editingBank.currentBalance)
        : Number(bankForm.openingBalance);

      const bankPayload: BankAccount = {
        id,
        bankName: bankForm.bankName || "",
        accountName: bankForm.accountName || "",
        accountNumber: bankForm.accountNumber || "",
        iban: bankForm.iban || "",
        swiftCode: bankForm.swiftCode || "",
        openingBalance: Number(bankForm.openingBalance || 0),
        opening_balance: Number(bankForm.openingBalance || 0),
        currentBalance: Number(finalCurrentBal || 0),
        current_balance: Number(finalCurrentBal || 0),
        status: bankForm.status || "Active",
        notes: bankForm.notes || "",
        createdAt: editingBank ? (editingBank.createdAt || nowStr) : nowStr,
        createdBy: editingBank ? (editingBank.createdBy || userStr) : userStr,
        updatedAt: nowStr,
        updatedBy: userStr,
        isDeleted: false,
      };

      await setDoc(doc(db, "bank_accounts", id), bankPayload);

      // Audit Log for Direct Balance Override
      if (editingBank && bankForm.overrideBalance && Number(bankForm.currentBalance) !== editingBank.currentBalance) {
        const logId = `LOG_${Date.now()}`;
        await setDoc(doc(db, "audit_logs", logId), {
          userId: user?.id || "unknown",
          userName: user?.username || "System",
          userRole: user?.role || "Admin",
          action: "تعديل رصيد البنك مباشرة من الواجهة",
          module: "Cash & Bank",
          recordId: id,
          oldValue: `Balance: ${editingBank.currentBalance}`,
          newValue: `Balance: ${bankForm.currentBalance}`,
          notes: "تعديل رصيد بنكي تجاوزي بواسطة الإدارة العليا",
          createdAt: nowStr
        });
      }

      // Default Audit Log
      const genLogId = `LOG_GEN_${Date.now()}`;
      await setDoc(doc(db, "audit_logs", genLogId), {
        userId: user?.id || "unknown",
        userName: user?.username || "System",
        userRole: user?.role || "Admin",
        action: editingBank ? "تعديل حساب بنكي" : "إضافة حساب بنكي جديد",
        module: "Cash & Bank",
        recordId: id,
        createdAt: nowStr
      });

      setSuccessMsg(lang === "ar" ? "تم حفظ الحساب البنكي بنجاح" : "Bank account saved successfully");
      setShowBankModal(false);
      setEditingBank(null);
      loadData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(lang === "ar" ? "فشل حفظ الحساب البنكي" : "Failed to save bank account");
    }
  };

  // Save/Update Cash Box
  const handleSaveBox = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const id = editingBox ? editingBox.id : `BOX_${Date.now()}`;
      const nowStr = new Date().toISOString();
      const userStr = user?.username || "System";

      const finalCurrentBal = editingBox
        ? (boxForm.overrideBalance ? Number(boxForm.currentBalance) : editingBox.currentBalance)
        : Number(boxForm.openingBalance);

      const boxPayload: CashBox = {
        id,
        cashBoxName: boxForm.cashBoxName || "",
        responsiblePerson: boxForm.responsiblePerson || "",
        openingBalance: Number(boxForm.openingBalance || 0),
        opening_balance: Number(boxForm.openingBalance || 0),
        currentBalance: Number(finalCurrentBal || 0),
        current_balance: Number(finalCurrentBal || 0),
        status: boxForm.status || "Active",
        notes: boxForm.notes || "",
        createdAt: editingBox ? (editingBox.createdAt || nowStr) : nowStr,
        createdBy: editingBox ? (editingBox.createdBy || userStr) : userStr,
        updatedAt: nowStr,
        updatedBy: userStr,
        isDeleted: false,
      };

      await setDoc(doc(db, "cash_boxes", id), boxPayload);

      // Audit Log for Direct Balance Override
      if (editingBox && boxForm.overrideBalance && Number(boxForm.currentBalance) !== editingBox.currentBalance) {
        const logId = `LOG_${Date.now()}`;
        await setDoc(doc(db, "audit_logs", logId), {
          userId: user?.id || "unknown",
          userName: user?.username || "System",
          userRole: user?.role || "Admin",
          action: "تعديل رصيد الصندوق مباشرة من الواجهة",
          module: "Cash & Bank",
          recordId: id,
          oldValue: `Balance: ${editingBox.currentBalance}`,
          newValue: `Balance: ${boxForm.currentBalance}`,
          notes: "تعديل رصيد صندوق نقدية تجاوزي بواسطة الإدارة العليا",
          createdAt: nowStr
        });
      }

      // Default Audit Log
      const genLogId = `LOG_GEN_${Date.now()}`;
      await setDoc(doc(db, "audit_logs", genLogId), {
        userId: user?.id || "unknown",
        userName: user?.username || "System",
        userRole: user?.role || "Admin",
        action: editingBox ? "تعديل صندوق نقدي" : "إضافة صندوق نقدي جديد",
        module: "Cash & Bank",
        recordId: id,
        createdAt: nowStr
      });

      setSuccessMsg(lang === "ar" ? "تم حفظ صندوق النقدية بنجاح" : "Cash box saved successfully");
      setShowBoxModal(false);
      setEditingBox(null);
      loadData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(lang === "ar" ? "فشل حفظ صندوق النقدية" : "Failed to save cash box");
    }
  };

  // Soft delete bank
  const handleDeleteBank = (bank: BankAccount) => {
    // Check if there are active transactions associated with this bank account
    const hasTxs = transactions.some(t => t.bankAccountId === bank.id);
    const isAdmin = user?.role === "Super Admin" || user?.role === "Admin" || user?.role?.toLowerCase().includes("مدير");

    if (hasTxs && !isAdmin) {
      alert(lang === "ar" ? "يوجد عمليات مالية مسجلة على هذا الحساب. الحذف متاح فقط بصلاحية إدارية عليا." : "This account has transactions. Deletion is restricted to high level admins.");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: lang === "ar" ? "حذف حساب بنكي" : "Delete Bank Account",
      message: lang === "ar" ? `هل أنت متأكد من حذف الحساب البنكي ${bank.bankName}؟` : `Are you sure you want to delete bank account ${bank.bankName}?`,
      type: "danger",
      onConfirm: async () => {
        const nowStr = new Date().toISOString();
        const userStr = user?.username || "System";
        await setDoc(doc(db, "bank_accounts", bank.id), {
          ...bank,
          bankName: bank.bankName || "",
          accountName: bank.accountName || "",
          accountNumber: bank.accountNumber || "",
          iban: bank.iban || "",
          swiftCode: bank.swiftCode || "",
          status: bank.status || "Active",
          notes: bank.notes || "",
          isDeleted: true,
          deletedAt: nowStr,
          deletedBy: userStr
        });

        const logId = `LOG_DEL_${Date.now()}`;
        await setDoc(doc(db, "audit_logs", logId), {
          userId: user?.id || "unknown",
          userName: user?.username || "System",
          userRole: user?.role || "Admin",
          action: "حذف حساب بنكي (Soft Delete)",
          module: "Cash & Bank",
          recordId: bank.id,
          createdAt: nowStr
        });

        showToast(lang === "ar" ? "تم حذف الحساب البنكي بنجاح" : "Bank account deleted successfully", "success");
        setSuccessMsg(lang === "ar" ? "تم حذف الحساب البنكي" : "Bank account deleted");
        loadData();
      }
    });
  };

  // Soft delete box
  const handleDeleteBox = (box: CashBox) => {
    const hasTxs = transactions.some(t => t.cashBoxId === box.id);
    const isAdmin = user?.role === "Super Admin" || user?.role === "Admin" || user?.role?.toLowerCase().includes("مدير");

    if (hasTxs && !isAdmin) {
      alert(lang === "ar" ? "يوجد عمليات مالية مسجلة على هذا الصندوق. الحذف متاح فقط بصلاحية إدارية عليا." : "This box has transactions. Deletion is restricted to high level admins.");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: lang === "ar" ? "حذف صندوق نقدي" : "Delete Cash Box",
      message: lang === "ar" ? `هل أنت متأكد من حذف صندوق النقدية ${box.cashBoxName}؟` : `Are you sure you want to delete cash box ${box.cashBoxName}?`,
      type: "danger",
      onConfirm: async () => {
        const nowStr = new Date().toISOString();
        const userStr = user?.username || "System";
        await setDoc(doc(db, "cash_boxes", box.id), {
          ...box,
          cashBoxName: box.cashBoxName || "",
          responsiblePerson: box.responsiblePerson || "",
          status: box.status || "Active",
          notes: box.notes || "",
          isDeleted: true,
          deletedAt: nowStr,
          deletedBy: userStr
        });

        const logId = `LOG_DEL_${Date.now()}`;
        await setDoc(doc(db, "audit_logs", logId), {
          userId: user?.id || "unknown",
          userName: user?.username || "System",
          userRole: user?.role || "Admin",
          action: "حذف صندوق نقدي (Soft Delete)",
          module: "Cash & Bank",
          recordId: box.id,
          createdAt: nowStr
        });

        showToast(lang === "ar" ? "تم حذف صندوق النقدية بنجاح" : "Cash box deleted successfully", "success");
        setSuccessMsg(lang === "ar" ? "تم حذف الصندوق بنجاح" : "Cash box deleted");
        loadData();
      }
    });
  };

  const openBankForm = (bank: BankAccount | null) => {
    if (bank) {
      setEditingBank(bank);
      setBankForm({
        bankName: bank.bankName || "",
        accountName: bank.accountName || "",
        accountNumber: bank.accountNumber || "",
        iban: bank.iban || "",
        swiftCode: bank.swiftCode || "",
        openingBalance: bank.openingBalance || 0,
        currentBalance: bank.currentBalance || 0,
        status: bank.status || "Active",
        notes: bank.notes || "",
        overrideBalance: false
      });
    } else {
      setEditingBank(null);
      setBankForm({
        bankName: "",
        accountName: "",
        accountNumber: "",
        iban: "",
        swiftCode: "",
        openingBalance: 0,
        currentBalance: 0,
        status: "Active",
        notes: "",
        overrideBalance: false
      });
    }
    setShowBankModal(true);
  };

  const openBoxForm = (box: CashBox | null) => {
    if (box) {
      setEditingBox(box);
      setBoxForm({
        cashBoxName: box.cashBoxName || "",
        responsiblePerson: box.responsiblePerson || "",
        openingBalance: box.openingBalance || 0,
        currentBalance: box.currentBalance || 0,
        status: box.status || "Active",
        notes: box.notes || "",
        overrideBalance: false
      });
    } else {
      setEditingBox(null);
      setBoxForm({
        cashBoxName: "",
        responsiblePerson: "",
        openingBalance: 0,
        currentBalance: 0,
        status: "Active",
        notes: "",
        overrideBalance: false
      });
    }
    setShowBoxModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0072BC]"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8 space-y-8" dir="rtl">
      {/* Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 font-semibold text-sm">
          <span>✅</span>
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 font-semibold text-sm">
          <span>❌</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#005185] tracking-tight">
            🏦 الصندوق والبنك (Cash & Bank Control Hub)
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            إدارة مصادر النقد للشركة وتتبع الأرصدة البنكية والخزن النقدية وسجلات الحركات المالية التفصيلية.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => openBankForm(null)}
            className="bg-[#0072BC] hover:bg-[#005185] text-white py-2.5 px-5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2"
          >
            <span>➕</span> حساب بنكي جديد
          </button>
          <button
            onClick={() => openBoxForm(null)}
            className="bg-slate-700 hover:bg-slate-800 text-white py-2.5 px-5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2"
          >
            <span>➕</span> صندوق نقدي جديد
          </button>
          <button
            onClick={() => setShowTxModal(true)}
            className="bg-white hover:bg-slate-100 text-[#005185] border border-slate-200 py-2.5 px-5 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2"
          >
            <span>📊</span> عرض حركات الخزينة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bank Accounts Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <span>🏦</span> الحسابات البنكية المعتمدة
            </h2>
            <span className="text-xs bg-sky-50 text-sky-800 py-1 px-2.5 rounded-full font-bold">
              {banks.length} حسابات نشطة
            </span>
          </div>

          {banks.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              لا توجد حسابات بنكية مسجلة حالياً. اضغط "حساب بنكي جديد" للبدء.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {banks.map((bank) => (
                <div
                  key={bank.id}
                  className="p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100/50 transition-all space-y-4 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base">{bank.bankName}</h3>
                      <p className="text-xs text-slate-500 font-medium">{bank.accountName}</p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        bank.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {bank.status === "Active" ? "نشط" : "غير نشط"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                    <div>
                      <p className="text-slate-400">رقم الحساب:</p>
                      <p className="font-mono mt-0.5">{bank.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">IBAN:</p>
                      <p className="font-mono mt-0.5">{bank.iban || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-end pt-3 border-t border-slate-200/50">
                    <div>
                      <span className="text-xs text-slate-400">الرصيد الحالي المعتمد:</span>
                      <p className="text-xl font-extrabold text-[#0072BC] tracking-tight mt-0.5">
                        {(bank.currentBalance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-xs text-slate-500 font-bold">SAR</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openBankForm(bank)}
                        className="p-2 text-slate-500 hover:text-[#0072BC] bg-white hover:bg-white border border-slate-200 rounded-xl text-xs font-bold transition-all"
                        title="تعديل الحساب"
                      >
                        📝 تعديل
                      </button>
                      <button
                        onClick={() => handleDeleteBank(bank)}
                        className="p-2 text-rose-500 hover:text-white hover:bg-rose-600 bg-white border border-rose-100 rounded-xl text-xs font-bold transition-all"
                        title="حذف الحساب"
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cash Boxes Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <span>💰</span> الصناديق والخزن النقدية
            </h2>
            <span className="text-xs bg-slate-100 text-slate-700 py-1 px-2.5 rounded-full font-bold">
              {boxes.length} خزن معتمدة
            </span>
          </div>

          {boxes.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              لا توجد خزن أو صناديق نقدية مسجلة حالياً. اضغط "صندوق نقدي جديد" للبدء.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {boxes.map((box) => (
                <div
                  key={box.id}
                  className="p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100/50 transition-all space-y-4 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base">{box.cashBoxName}</h3>
                      <p className="text-xs text-slate-500 font-medium">أمين الصندوق المسؤول: {box.responsiblePerson || "N/A"}</p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        box.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {box.status === "Active" ? "نشط" : "غير نشط"}
                    </span>
                  </div>

                  {box.notes && (
                    <p className="text-xs text-slate-400 line-clamp-1 italic font-medium">
                      ملاحظات: {box.notes}
                    </p>
                  )}

                  <div className="flex justify-between items-end pt-3 border-t border-slate-200/50">
                    <div>
                      <span className="text-xs text-slate-400">الرصيد النقدي المتوفر:</span>
                      <p className="text-xl font-extrabold text-slate-700 tracking-tight mt-0.5">
                        {(box.currentBalance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-xs text-slate-500 font-bold">SAR</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openBoxForm(box)}
                        className="p-2 text-slate-500 hover:text-[#0072BC] bg-white hover:bg-white border border-slate-200 rounded-xl text-xs font-bold transition-all"
                        title="تعديل الصندوق"
                      >
                        📝 تعديل
                      </button>
                      <button
                        onClick={() => handleDeleteBox(box)}
                        className="p-2 text-rose-500 hover:text-white hover:bg-rose-600 bg-white border border-rose-100 rounded-xl text-xs font-bold transition-all"
                        title="حذف الصندوق"
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bank Account Modal */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#005185] to-[#0072BC] p-5 text-white flex justify-between items-center">
              <h3 className="text-lg font-extrabold">
                {editingBank ? `📝 تعديل الحساب البنكي: ${editingBank.bankName}` : "🏦 إضافة حساب بنكي جديد"}
              </h3>
              <button
                onClick={() => setShowBankModal(false)}
                className="text-white/80 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">اسم البنك *</label>
                  <input
                    type="text"
                    required
                    value={bankForm.bankName || ""}
                    onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                    placeholder="مثال: مصرف الراجحي"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">اسم الحساب *</label>
                  <input
                    type="text"
                    required
                    value={bankForm.accountName || ""}
                    onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                    placeholder="مثال: الحساب التجاري الرئيسي"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">رقم الحساب *</label>
                  <input
                    type="text"
                    required
                    value={bankForm.accountNumber || ""}
                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono"
                    placeholder="20460801000..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">رقم الآيبان IBAN</label>
                  <input
                    type="text"
                    value={bankForm.iban || ""}
                    onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono"
                    placeholder="SA8080000..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Swift Code</label>
                  <input
                    type="text"
                    value={bankForm.swiftCode || ""}
                    onChange={(e) => setBankForm({ ...bankForm, swiftCode: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono"
                    placeholder="ALRJSA22..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">حالة الحساب</label>
                  <select
                    value={bankForm.status || "Active"}
                    onChange={(e) => setBankForm({ ...bankForm, status: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                  >
                    <option value="Active">نشط</option>
                    <option value="Inactive">غير نشط</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">الرصيد الافتتاحي (SAR) *</label>
                  <input
                    type="number"
                    required
                    disabled={!!editingBank}
                    value={bankForm.openingBalance ?? 0}
                    onChange={(e) => setBankForm({ ...bankForm, openingBalance: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono disabled:bg-slate-100"
                  />
                </div>
                {editingBank && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">الرصيد الحالي للبنك (تعديل مباشر) *</label>
                    <input
                      type="number"
                      disabled={!bankForm.overrideBalance}
                      value={bankForm.overrideBalance ? (bankForm.currentBalance ?? 0) : (editingBank.currentBalance ?? 0)}
                      onChange={(e) => setBankForm({ ...bankForm, currentBalance: Number(e.target.value) })}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono disabled:bg-slate-100"
                    />
                  </div>
                )}
              </div>

              {editingBank && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[10px] text-amber-800 space-y-1 font-semibold">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-950">
                    <input
                      type="checkbox"
                      checked={bankForm.overrideBalance}
                      onChange={(e) => setBankForm({ ...bankForm, overrideBalance: e.target.checked })}
                      className="w-4 h-4 text-[#0072BC]"
                    />
                    <span>⚠️ أرغب بتجاوز النظام وتغيير الرصيد يدوياً (سيسجل في سجل الـ Audit Log)</span>
                  </label>
                  <p>• تعديل رصيد الحساب مباشرة دون قيد مالي مخالف للقواعد المحاسبية السليمة، يرجى تفعيل الخيار فقط في حالات تسوية الأخطاء الجسيمة.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">ملاحظات إضافية</label>
                <textarea
                  rows={2}
                  value={bankForm.notes}
                  onChange={(e) => setBankForm({ ...bankForm, notes: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-5 rounded-lg text-xs transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-[#0072BC] hover:bg-[#005185] text-white font-bold py-2 px-6 rounded-lg text-xs transition-all"
                >
                  حفظ الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cash Box Modal */}
      {showBoxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-700 p-5 text-white flex justify-between items-center">
              <h3 className="text-lg font-extrabold">
                {editingBox ? `📝 تعديل الصندوق النقدي: ${editingBox.cashBoxName}` : "💰 إضافة صندوق نقدي جديد"}
              </h3>
              <button
                onClick={() => setShowBoxModal(false)}
                className="text-white/80 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBox} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">اسم الصندوق/الخزينة *</label>
                  <input
                    type="text"
                    required
                    value={boxForm.cashBoxName || ""}
                    onChange={(e) => setBoxForm({ ...boxForm, cashBoxName: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                    placeholder="مثال: خزينة المبيعات النقدية"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">أمين الخزينة المسؤول *</label>
                  <input
                    type="text"
                    required
                    value={boxForm.responsiblePerson || ""}
                    onChange={(e) => setBoxForm({ ...boxForm, responsiblePerson: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                    placeholder="مثال: أحمد عبد الله"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">حالة الصندوق</label>
                  <select
                    value={boxForm.status || "Active"}
                    onChange={(e) => setBoxForm({ ...boxForm, status: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                  >
                    <option value="Active">نشط</option>
                    <option value="Inactive">غير نشط</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">الرصيد الافتتاحي (SAR) *</label>
                  <input
                    type="number"
                    required
                    disabled={!!editingBox}
                    value={boxForm.openingBalance ?? 0}
                    onChange={(e) => setBoxForm({ ...boxForm, openingBalance: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono disabled:bg-slate-100"
                  />
                </div>
                {editingBox && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">الرصيد الحالي التجاوزي *</label>
                    <input
                      type="number"
                      disabled={!boxForm.overrideBalance}
                      value={boxForm.overrideBalance ? (boxForm.currentBalance ?? 0) : (editingBox.currentBalance ?? 0)}
                      onChange={(e) => setBoxForm({ ...boxForm, currentBalance: Number(e.target.value) })}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono disabled:bg-slate-100"
                    />
                  </div>
                )}
              </div>

              {editingBox && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[10px] text-amber-800 space-y-1 font-semibold">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-950">
                    <input
                      type="checkbox"
                      checked={boxForm.overrideBalance}
                      onChange={(e) => setBoxForm({ ...boxForm, overrideBalance: e.target.checked })}
                      className="w-4 h-4 text-[#0072BC]"
                    />
                    <span>⚠️ أرغب بتعديل رصيد الخزينة يدوياً (سيُقيد في Audit Log)</span>
                  </label>
                  <p>• تجنب تعديل الأرصدة مباشرة دون قيد تسوية معتمد محاسبياً.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">ملاحظات إضافية</label>
                <textarea
                  rows={2}
                  value={boxForm.notes}
                  onChange={(e) => setBoxForm({ ...boxForm, notes: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowBoxModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-5 rounded-lg text-xs transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-[#0072BC] hover:bg-[#005185] text-white font-bold py-2 px-6 rounded-lg text-xs transition-all"
                >
                  حفظ الصندوق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transactions list Modal */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="bg-[#005185] p-5 text-white flex justify-between items-center">
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <span>📋</span> سجل العمليات والحركات المالية بالتفصيل
              </h3>
              <button
                onClick={() => setShowTxModal(false)}
                className="text-white/80 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {transactions.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-sm">
                  لا توجد حركات مالية مسجلة حالياً على البنوك أو الصناديق.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase border-b">
                      <tr>
                        <th className="px-4 py-3.5">الرقم المرجعي</th>
                        <th className="px-4 py-3.5">تاريخ الحركة</th>
                        <th className="px-4 py-3.5">الحساب المالي</th>
                        <th className="px-4 py-3.5">الاتجاه</th>
                        <th className="px-4 py-3.5">القيمة (SAR)</th>
                        <th className="px-4 py-3.5">الرصيد السابق</th>
                        <th className="px-4 py-3.5">الرصيد الجديد</th>
                        <th className="px-4 py-3.5">البيان والتفاصيل</th>
                        <th className="px-4 py-3.5">رقم قيد اليومية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-medium text-slate-600">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-[10px] text-[#0072BC] font-bold">
                            {tx.transactionNo}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {new Date(tx.createdAt).toLocaleString("ar-SA", { hour12: true })}
                          </td>
                          <td className="px-4 py-3">
                            {tx.accountType === "Bank" ? (
                              <span className="flex items-center gap-1.5 font-bold text-[#005185]">
                                <span>🏦</span> {tx.bankName}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 font-bold text-amber-700">
                                <span>💵</span> {tx.cashBoxName}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                                tx.direction === "In" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {tx.direction === "In" ? "وارد (+)" : "صادر (-)"}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-800">
                            {(tx.amount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-400">
                            {(tx.previousBalance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-800 font-extrabold">
                            {(tx.newBalance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 max-w-[180px] truncate" title={tx.description}>
                            {tx.description}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-500 font-bold">
                            {tx.journalEntryNo || tx.journalEntryId || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 border-t flex justify-end">
              <button
                onClick={() => setShowTxModal(false)}
                className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-6 rounded-xl text-xs transition-all"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Beautiful Custom Confirm Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col p-6 space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
                confirmDialog.type === "danger" ? "bg-rose-100 text-rose-600" :
                confirmDialog.type === "warning" ? "bg-amber-100 text-amber-600" :
                "bg-blue-100 text-blue-600"
              }`}>
                {confirmDialog.type === "danger" ? "⚠️" : "ℹ️"}
              </span>
              <h3 className="text-base font-bold text-slate-800">{confirmDialog.title}</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                disabled={confirmDialog.actionLoading}
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs transition duration-150"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                disabled={confirmDialog.actionLoading}
                onClick={async () => {
                  setConfirmDialog(prev => ({ ...prev, actionLoading: true }));
                  try {
                    await confirmDialog.onConfirm();
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setConfirmDialog(prev => ({ ...prev, isOpen: false, actionLoading: false }));
                  }
                }}
                className={`text-white font-bold py-2 px-5 rounded-xl text-xs transition duration-150 flex items-center gap-1.5 shadow ${
                  confirmDialog.type === "danger" ? "bg-rose-600 hover:bg-rose-700" :
                  confirmDialog.type === "warning" ? "bg-amber-600 hover:bg-amber-700" :
                  "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {confirmDialog.actionLoading && (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                )}
                {lang === "ar" ? "تأكيد العملية" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Beautiful custom Toast feedback */}
      {toast.show && (
        <div className="fixed bottom-5 right-5 z-[200] max-w-sm bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 border border-slate-800 animate-slide-in">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
            toast.type === "success" ? "bg-emerald-500 text-white" :
            toast.type === "error" ? "bg-rose-500 text-white" :
            toast.type === "warning" ? "bg-amber-500 text-white" :
            "bg-blue-500 text-white"
          }`}>
            {toast.type === "success" ? "✓" : "!"}
          </span>
          <p className="text-xs font-bold text-slate-100 leading-snug">{toast.message}</p>
        </div>
      )}
    </div>
  );
}
