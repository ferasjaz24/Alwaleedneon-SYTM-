import React, { useState, useEffect } from "react";
import { User } from "../../../types";
import { CashBox } from "./types";
import { db } from "../../../firebase";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { X, Save } from "lucide-react";

interface Props {
  lang: "ar" | "en";
  user: User;
  cashBox: CashBox | null;
  onClose: () => void;
}

export default function AddCashBoxModal({ lang, user, cashBox, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    code: "",
    currency: "SAR",
    opening_balance: 0,
    branch: "Main",
    status: "Active" as "Active" | "Closed",
  });

  useEffect(() => {
    if (cashBox) {
      setFormData({
        name_ar: cashBox.name_ar,
        name_en: cashBox.name_en,
        code: cashBox.code,
        currency: cashBox.currency,
        opening_balance: cashBox.opening_balance,
        branch: cashBox.branch,
        status: cashBox.status,
      });
    } else {
      // Auto-generate a simple code for new cash box
      setFormData((prev) => ({
        ...prev,
        code: `CB-${Math.floor(1000 + Math.random() * 9000)}`,
      }));
    }
  }, [cashBox]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (cashBox) {
        const updateRes = await fetch(`/api/dynamic/cash_boxes/${cashBox.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!updateRes.ok) throw new Error("Failed to update cash box");
        
        // Log audit
        await fetch("/api/dynamic/audit_logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "Update Cash Box",
            module: "Cash & Bank",
            record_id: cashBox.id,
            user_id: user.uid,
            user_name: user.username,
            timestamp: new Date().toISOString(),
            details: `Updated cash box ${formData.code}`,
          })
        });
      } else {
        const payload = {
          ...formData,
          current_balance: formData.opening_balance, // Initial current balance
          created_at: new Date().toISOString(),
          created_by: user.username,
        };
        const createRes = await fetch("/api/dynamic/cash_boxes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!createRes.ok) throw new Error("Failed to create cash box");
        const createData = await createRes.json();
        const docId = createData.data?.id || `REC-${Date.now()}`;

        // Log audit
        await fetch("/api/dynamic/audit_logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "Create Cash Box",
            module: "Cash & Bank",
            record_id: docId,
            user_id: user.uid,
            user_name: user.username,
            timestamp: new Date().toISOString(),
            details: `Created new cash box ${formData.code}`,
          })
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving cash box: ", error);
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
            {cashBox
              ? lang === "ar"
                ? "تعديل بيانات الصندوق"
                : "Edit Cash Box"
              : lang === "ar"
              ? "إضافة صندوق جديد"
              : "Add New Cash Box"}
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
                {lang === "ar" ? "رمز الصندوق" : "Cash Box Code"}
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
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
                <option value="Branch 2">{lang === "ar" ? "فرع 2" : "Branch 2"}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {lang === "ar" ? "اسم الصندوق (عربي)" : "Name (Arabic)"}
              </label>
              <input
                type="text"
                required
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {lang === "ar" ? "اسم الصندوق (إنجليزي)" : "Name (English)"}
              </label>
              <input
                type="text"
                required
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
                dir="ltr"
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
                disabled={!!cashBox} // Cannot edit opening balance after creation
                value={formData.opening_balance}
                onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC] disabled:bg-slate-100 disabled:text-slate-500"
              />
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
                ? "حفظ الصندوق"
                : "Save Cash Box"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
