import React, { useState, useEffect } from "react";
import { User } from "../../../types";
import { CashBankTransaction, CashBox, BankAccount } from "./types";
import { db } from "../../../firebase";
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDocs } from "firebase/firestore";
import { X, Save, Send } from "lucide-react";

interface Props {
  lang: "ar" | "en";
  user: User;
  transaction: CashBankTransaction | null;
  onClose: () => void;
}

export default function AddTransactionModal({ lang, user, transaction, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [cashBoxes, setCashBoxes] = useState<CashBox[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  
  const [formData, setFormData] = useState({
    type: "Deposit" as CashBankTransaction["type"],
    source_type: "Cash_Box" as "Cash_Box" | "Bank_Account",
    source_id: "",
    amount: 0,
    currency: "SAR",
    date: new Date().toISOString().split('T')[0],
    description: "",
    reference_number: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cbRes = await fetch("/api/dynamic/cash_boxes");
        if (cbRes.ok) {
          const data = await cbRes.json();
          setCashBoxes(data.filter((c: any) => c.status === "Active"));
        }

        const baRes = await fetch("/api/dynamic/bank_accounts");
        if (baRes.ok) {
          const data = await baRes.json();
          setBankAccounts(data.filter((b: any) => b.status === "Active"));
        }
      } catch (error) {
        console.error("Error fetching accounts in modal:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        source_type: transaction.source_type,
        source_id: transaction.source_id,
        amount: transaction.amount,
        currency: transaction.currency,
        date: transaction.date,
        description: transaction.description,
        reference_number: transaction.reference_number,
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        reference_number: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
      }));
    }
  }, [transaction]);

  const handleSubmit = async (status: "Draft" | "Pending_Approval") => {
    if (!formData.source_id) {
      alert(lang === "ar" ? "يرجى اختيار الحساب/الصندوق" : "Please select an account/box");
      return;
    }
    if (formData.amount <= 0) {
      alert(lang === "ar" ? "المبلغ يجب أن يكون أكبر من صفر" : "Amount must be greater than zero");
      return;
    }

    setLoading(true);
    try {
      if (transaction) {
        const updateRes = await fetch(`/api/dynamic/cash_bank_transactions/${transaction.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            status,
          }),
        });
        if (!updateRes.ok) throw new Error("Failed to update transaction");
        
        await fetch("/api/dynamic/audit_logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "Update Transaction",
            module: "Cash & Bank",
            record_id: transaction.id,
            user_id: user.uid,
            user_name: user.username,
            timestamp: new Date().toISOString(),
            details: `Updated transaction ${formData.reference_number} to ${status}`,
          })
        });
      } else {
        const payload = {
          ...formData,
          status,
          created_at: new Date().toISOString(),
          created_by: user.username,
        };
        const createRes = await fetch("/api/dynamic/cash_bank_transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!createRes.ok) throw new Error("Failed to create transaction");
        const createData = await createRes.json();
        const docId = createData.data?.id || `REC-${Date.now()}`;

        await fetch("/api/dynamic/audit_logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "Create Transaction",
            module: "Cash & Bank",
            record_id: docId,
            user_id: user.uid,
            user_name: user.username,
            timestamp: new Date().toISOString(),
            details: `Created new transaction ${formData.reference_number} as ${status}`,
          })
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving transaction: ", error);
      alert(lang === "ar" ? "حدث خطأ أثناء الحفظ" : "Error saving record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            {transaction
              ? lang === "ar"
                ? "تعديل الحركة المالية"
                : "Edit Transaction"
              : lang === "ar"
              ? "إضافة حركة مالية جديدة"
              : "Add New Transaction"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {lang === "ar" ? "نوع الحركة" : "Transaction Type"}
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
              >
                <option value="Deposit">{lang === "ar" ? "إيداع" : "Deposit"}</option>
                <option value="Withdrawal">{lang === "ar" ? "سحب" : "Withdrawal"}</option>
                <option value="Customer_Payment">{lang === "ar" ? "دفعة عميل" : "Customer Payment"}</option>
                <option value="Supplier_Payment">{lang === "ar" ? "دفعة مورد" : "Supplier Payment"}</option>
                <option value="Expense">{lang === "ar" ? "مصروفات" : "Expense"}</option>
                <option value="Payroll">{lang === "ar" ? "رواتب" : "Payroll"}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {lang === "ar" ? "تاريخ الحركة" : "Date"}
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {lang === "ar" ? "رقم المرجع" : "Reference Number"}
              </label>
              <input
                type="text"
                required
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {lang === "ar" ? "المبلغ" : "Amount"}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
                />
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-24 px-2 border border-slate-200 rounded-xl bg-slate-50"
                >
                  <option value="SAR">SAR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {lang === "ar" ? "المصدر" : "Source"}
              </label>
              <select
                required
                value={formData.source_type}
                onChange={(e) => setFormData({ ...formData, source_type: e.target.value as any, source_id: "" })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
              >
                <option value="Cash_Box">{lang === "ar" ? "صندوق" : "Cash Box"}</option>
                <option value="Bank_Account">{lang === "ar" ? "حساب بنكي" : "Bank Account"}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {lang === "ar" ? "الحساب / الصندوق" : "Account / Box"}
              </label>
              <select
                required
                value={formData.source_id}
                onChange={(e) => setFormData({ ...formData, source_id: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
              >
                <option value="">{lang === "ar" ? "اختر..." : "Select..."}</option>
                {formData.source_type === "Cash_Box"
                  ? cashBoxes.map(b => (
                      <option key={b.id} value={b.id}>{lang === "ar" ? b.name_ar : b.name_en} - {b.currency}</option>
                    ))
                  : bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>{lang === "ar" ? b.bank_name_ar : b.bank_name_en} - {b.account_number}</option>
                    ))
                }
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {lang === "ar" ? "البيان / الوصف" : "Description"}
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors"
            >
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleSubmit("Draft")}
                disabled={loading}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {lang === "ar" ? "حفظ كمسودة" : "Save as Draft"}
              </button>
              <button
                type="button"
                onClick={() => handleSubmit("Pending_Approval")}
                disabled={loading}
                className="px-6 py-2 bg-[#0072BC] text-white rounded-xl font-semibold hover:bg-[#005a96] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {lang === "ar" ? "إرسال للاعتماد" : "Send for Approval"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
