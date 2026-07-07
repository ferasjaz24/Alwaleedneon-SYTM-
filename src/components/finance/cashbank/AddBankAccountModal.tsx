import React, { useState, useEffect } from "react";
import { User } from "../../../types";
import { BankAccount } from "./types";
import { db } from "../../../firebase";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { X, Save, CheckCircle } from "lucide-react";
import { detectBankFromIban } from "../../../utils/ibanHelper";

interface Props {
  lang: "ar" | "en";
  user: User;
  bankAccount: BankAccount | null;
  onClose: () => void;
}

export default function AddBankAccountModal({ lang, user, bankAccount, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bank_name_ar: "",
    bank_name_en: "",
    account_name: "",
    account_number: "",
    iban: "",
    currency: "SAR",
    opening_balance: 0,
    branch: "Main",
    status: "Active" as "Active" | "Closed",
  });

  useEffect(() => {
    if (bankAccount) {
      setFormData({
        bank_name_ar: bankAccount.bank_name_ar,
        bank_name_en: bankAccount.bank_name_en,
        account_name: bankAccount.account_name,
        account_number: bankAccount.account_number,
        iban: bankAccount.iban,
        currency: bankAccount.currency,
        opening_balance: bankAccount.opening_balance,
        branch: bankAccount.branch,
        status: bankAccount.status,
      });
    }
  }, [bankAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.iban.startsWith("SA") && formData.currency === "SAR") {
      alert(lang === "ar" ? "رقم الآيبان يجب أن يبدأ بـ SA" : "IBAN must start with SA");
      return;
    }

    setLoading(true);
    try {
      if (bankAccount) {
        const updateRes = await fetch(`/api/dynamic/bank_accounts/${bankAccount.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!updateRes.ok) throw new Error("Failed to update bank account");
        
        await fetch("/api/dynamic/audit_logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "Update Bank Account",
            module: "Cash & Bank",
            record_id: bankAccount.id,
            user_id: user.uid,
            user_name: user.username,
            timestamp: new Date().toISOString(),
            details: `Updated bank account ${formData.account_number}`,
          })
        });
      } else {
        const payload = {
          ...formData,
          current_balance: formData.opening_balance,
          created_at: new Date().toISOString(),
          created_by: user.username,
        };
        const createRes = await fetch("/api/dynamic/bank_accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!createRes.ok) throw new Error("Failed to create bank account");
        const createData = await createRes.json();
        const docId = createData.data?.id || `REC-${Date.now()}`;

        await fetch("/api/dynamic/audit_logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "Create Bank Account",
            module: "Cash & Bank",
            record_id: docId,
            user_id: user.uid,
            user_name: user.username,
            timestamp: new Date().toISOString(),
            details: `Created new bank account ${formData.account_number}`,
          })
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving bank account: ", error);
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
            {bankAccount
              ? lang === "ar"
                ? "تعديل بيانات الحساب"
                : "Edit Bank Account"
              : lang === "ar"
              ? "إضافة حساب بنكي جديد"
              : "Add New Bank Account"}
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
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {lang === "ar" ? "اسم البنك (عربي)" : "Bank Name (Arabic)"}
              </label>
              <input
                type="text"
                required
                value={formData.bank_name_ar}
                onChange={(e) => setFormData({ ...formData, bank_name_ar: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {lang === "ar" ? "اسم البنك (إنجليزي)" : "Bank Name (English)"}
              </label>
              <input
                type="text"
                required
                value={formData.bank_name_en}
                onChange={(e) => setFormData({ ...formData, bank_name_en: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {lang === "ar" ? "اسم الحساب" : "Account Name"}
              </label>
              <input
                type="text"
                required
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {lang === "ar" ? "رقم الحساب" : "Account Number"}
              </label>
              <input
                type="text"
                required
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
                dir="ltr"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-slate-700">
                  IBAN
                </label>
                {formData.iban && (() => {
                  const det = detectBankFromIban(formData.iban, lang);
                  return det.matched ? (
                    <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5 mr-1 ml-1" />
                      {lang === "ar" ? `تم التعرف: ${det.ar}` : `Detected: ${det.en}`}
                    </span>
                  ) : null;
                })()}
              </div>
              <input
                type="text"
                required
                value={formData.iban}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().replace(/\s+/g, "");
                  const det = detectBankFromIban(val, lang);
                  setFormData({
                    ...formData,
                    iban: val,
                    bank_name_ar: det.matched ? det.ar : formData.bank_name_ar,
                    bank_name_en: det.matched ? det.en : formData.bank_name_en,
                  });
                }}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
                dir="ltr"
                placeholder="SA..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {lang === "ar" ? "العملة" : "Currency"}
              </label>
              <select
                required
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
              >
                <option value="SAR">SAR - Saudi Riyal</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {lang === "ar" ? "الرصيد الافتتاحي" : "Opening Balance"}
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                disabled={!!bankAccount}
                value={formData.opening_balance}
                onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC] disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {lang === "ar" ? "الفرع" : "Branch"}
              </label>
              <select
                required
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
              >
                <option value="Main">{lang === "ar" ? "الرئيسي" : "Main"}</option>
                <option value="Branch 1">{lang === "ar" ? "فرع 1" : "Branch 1"}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {lang === "ar" ? "الحالة" : "Status"}
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as "Active" | "Closed" })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
              >
                <option value="Active">{lang === "ar" ? "نشط" : "Active"}</option>
                <option value="Closed">{lang === "ar" ? "مغلق" : "Closed"}</option>
              </select>
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
                ? "حفظ الحساب"
                : "Save Bank Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
