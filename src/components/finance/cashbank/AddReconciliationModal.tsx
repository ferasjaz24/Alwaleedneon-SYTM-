import React, { useState, useEffect } from "react";
import { User } from "../../../types";
import { BankAccount } from "./types";
import { db } from "../../../firebase";
import { collection, addDoc, doc, serverTimestamp, getDocs, getDoc } from "firebase/firestore";
import { X, Save } from "lucide-react";

interface Props {
  lang: "ar" | "en";
  user: User;
  onClose: () => void;
}

export default function AddReconciliationModal({ lang, user, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  
  const [formData, setFormData] = useState({
    bank_account_id: "",
    bank_account_name: "",
    period_start: "",
    period_end: "",
    statement_balance: 0,
    system_balance: 0,
    difference: 0,
    reference_number: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/dynamic/bank_accounts");
        if (res.ok) {
          const data = await res.json();
          setBankAccounts(data.filter((b: any) => b.status === "Active"));
        }
      } catch (error) {
        console.error("Error fetching bank accounts:", error);
      }
    };
    fetchData();
  }, []);

  const handleAccountChange = async (id: string) => {
    const account = bankAccounts.find(b => b.id === id);
    if (account) {
      setFormData(prev => ({
        ...prev,
        bank_account_id: id,
        bank_account_name: lang === "ar" ? account.bank_name_ar : account.bank_name_en,
        system_balance: account.current_balance,
        difference: account.current_balance - prev.statement_balance
      }));
    } else {
      setFormData(prev => ({ ...prev, bank_account_id: "", bank_account_name: "", system_balance: 0, difference: 0 - prev.statement_balance }));
    }
  };

  const handleStatementBalanceChange = (val: number) => {
    setFormData(prev => ({
      ...prev,
      statement_balance: val,
      difference: prev.system_balance - val
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bank_account_id) {
      alert(lang === "ar" ? "يرجى اختيار الحساب البنكي" : "Please select a bank account");
      return;
    }

    setLoading(true);
    try {
      const status = formData.difference === 0 ? "Matched" : "Unmatched";
      
      const payload = {
        ...formData,
        status,
        created_at: new Date().toISOString(),
        created_by: user.username,
      };

      const createRes = await fetch("/api/dynamic/bank_reconciliations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!createRes.ok) throw new Error("Failed to save bank reconciliation");
      const createData = await createRes.json();
      const docId = createData.data?.id || `REC-${Date.now()}`;

      await fetch("/api/dynamic/audit_logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "Create Reconciliation",
          module: "Cash & Bank",
          record_id: docId,
          user_id: user.uid,
          user_name: user.username,
          timestamp: new Date().toISOString(),
          details: `Created bank reconciliation ${formData.reference_number} (${status})`,
        })
      });
      
      onClose();
    } catch (error) {
      console.error("Error saving reconciliation: ", error);
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
            {lang === "ar" ? "إضافة مطابقة بنكية" : "Add Bank Reconciliation"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {lang === "ar" ? "الحساب البنكي" : "Bank Account"}
              </label>
              <select
                required
                value={formData.bank_account_id}
                onChange={(e) => handleAccountChange(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
              >
                <option value="">{lang === "ar" ? "اختر الحساب البنكي..." : "Select bank account..."}</option>
                {bankAccounts.map(b => (
                  <option key={b.id} value={b.id}>{lang === "ar" ? b.bank_name_ar : b.bank_name_en} - {b.account_number}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {lang === "ar" ? "بداية الفترة" : "Period Start"}
              </label>
              <input
                type="date"
                required
                value={formData.period_start}
                onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {lang === "ar" ? "نهاية الفترة" : "Period End"}
              </label>
              <input
                type="date"
                required
                value={formData.period_end}
                onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {lang === "ar" ? "رصيد النظام (تلقائي)" : "System Balance (Auto)"}
              </label>
              <input
                type="number"
                disabled
                value={formData.system_balance}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {lang === "ar" ? "رصيد كشف الحساب البنكي" : "Bank Statement Balance"}
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.statement_balance}
                onChange={(e) => handleStatementBalanceChange(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
              />
            </div>

            <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
              <span className="font-semibold text-slate-700">
                {lang === "ar" ? "الفرق (يجب أن يكون صفر للمطابقة):" : "Difference (Must be 0 to match):"}
              </span>
              <span className={`text-xl font-bold ${formData.difference === 0 ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                {formData.difference.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors"
            >
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#0072BC] text-white rounded-xl font-semibold hover:bg-[#005a96] transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading
                ? lang === "ar"
                  ? "جاري الحفظ..."
                  : "Saving..."
                : lang === "ar"
                ? "حفظ المطابقة"
                : "Save Reconciliation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
