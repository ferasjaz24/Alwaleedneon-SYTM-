import React, { useState, useEffect } from "react";
import { User } from "../../../types";
import { db } from "../../../firebase";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { Search, Plus, Trash2, CheckCircle, Clock } from "lucide-react";
import AddReconciliationModal from "./AddReconciliationModal";

interface Props {
  lang: "ar" | "en";
  user: User;
}

export default function ReconciliationList({ lang, user }: Props) {
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchReconciliations = async () => {
    try {
      const res = await fetch("/api/dynamic/bank_reconciliations");
      if (res.ok) {
        const data = await res.json();
        data.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        setReconciliations(data);
      }
    } catch (error) {
      console.error("Error fetching bank_reconciliations:", error);
    }
  };

  useEffect(() => {
    fetchReconciliations();
    const interval = setInterval(fetchReconciliations, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (r: any) => {
    if (r.status === "Matched") {
      alert(lang === "ar" ? "لا يمكن حذف مطابقة مكتملة" : "Cannot delete a matched reconciliation");
      return;
    }
    if (window.confirm(lang === "ar" ? "هل أنت متأكد من الحذف؟" : "Are you sure you want to delete?")) {
      try {
        const res = await fetch(`/api/dynamic/bank_reconciliations/${r.id}`, {
          method: "DELETE"
        });
        if (res.ok) {
          fetchReconciliations();
        } else {
          throw new Error("Failed to delete");
        }
      } catch (error) {
        console.error("Error deleting document: ", error);
      }
    }
  };

  const filtered = reconciliations.filter(r => 
    r.reference_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute right-3 top-2.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={lang === "ar" ? "بحث عن مطابقات..." : "Search reconciliations..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
            dir={lang === "ar" ? "rtl" : "ltr"}
          />
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-[#0072BC] text-white px-4 py-2 rounded-lg hover:bg-[#005a96] transition-colors whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          {lang === "ar" ? "إضافة مطابقة" : "Add Reconciliation"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-right">{lang === "ar" ? "رقم المرجع" : "Ref Number"}</th>
              <th className="px-4 py-3 text-right">{lang === "ar" ? "الحساب البنكي" : "Bank Account"}</th>
              <th className="px-4 py-3 text-right">{lang === "ar" ? "الفترة" : "Period"}</th>
              <th className="px-4 py-3 text-right">{lang === "ar" ? "رصيد الكشف" : "Statement Balance"}</th>
              <th className="px-4 py-3 text-right">{lang === "ar" ? "رصيد النظام" : "System Balance"}</th>
              <th className="px-4 py-3 text-right">{lang === "ar" ? "الفرق" : "Difference"}</th>
              <th className="px-4 py-3 text-center">{lang === "ar" ? "الحالة" : "Status"}</th>
              <th className="px-4 py-3 text-center">{lang === "ar" ? "إجراءات" : "Actions"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-right font-medium">{r.reference_number}</td>
                <td className="px-4 py-3 text-right">{r.bank_account_name}</td>
                <td className="px-4 py-3 text-right">{r.period_start} - {r.period_end}</td>
                <td className="px-4 py-3 text-right" dir="ltr">{r.statement_balance.toLocaleString()}</td>
                <td className="px-4 py-3 text-right" dir="ltr">{r.system_balance.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-bold" dir="ltr">
                  <span className={r.difference === 0 ? "text-green-600" : "text-red-600"}>
                    {r.difference.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center justify-center gap-1 w-fit mx-auto ${
                    r.status === "Matched" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                  }`}>
                    {r.status === "Matched" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {r.status === "Matched" ? (lang === "ar" ? "مطابق" : "Matched") : (lang === "ar" ? "غير مطابق" : "Unmatched")}
                  </span>
                </td>
                <td className="px-4 py-3 text-center flex justify-center gap-2">
                  <button
                    onClick={() => handleDelete(r)}
                    disabled={r.status === "Matched"}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  {lang === "ar" ? "لا توجد مطابقات مضافة" : "No reconciliations found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAddModalOpen && (
        <AddReconciliationModal
          lang={lang}
          user={user}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
}
