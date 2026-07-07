import React, { useState, useEffect } from "react";
import { User } from "../../../types";
import { CashBox } from "./types";
import { db } from "../../../firebase";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { Search, Plus, Edit, Trash2, Eye } from "lucide-react";
import AddCashBoxModal from "./AddCashBoxModal";

interface Props {
  lang: "ar" | "en";
  user: User;
}

export default function CashBoxesList({ lang, user }: Props) {
  const [cashBoxes, setCashBoxes] = useState<CashBox[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCashBox, setSelectedCashBox] = useState<CashBox | null>(null);

  const fetchBoxes = async () => {
    try {
      const res = await fetch("/api/dynamic/cash_boxes");
      if (res.ok) {
        const data = await res.json();
        // Sort descending by created_at or id
        data.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        setCashBoxes(data);
      }
    } catch (error) {
      console.error("Error fetching cash_boxes:", error);
    }
  };

  useEffect(() => {
    fetchBoxes();
    const interval = setInterval(fetchBoxes, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm(lang === "ar" ? "هل أنت متأكد من حذف هذا الصندوق؟" : "Are you sure you want to delete this cash box?")) {
      try {
        const res = await fetch(`/api/dynamic/cash_boxes/${id}`, {
          method: "DELETE"
        });
        if (res.ok) {
          fetchBoxes();
        } else {
          throw new Error("Failed to delete");
        }
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert(lang === "ar" ? "حدث خطأ أثناء الحذف" : "Error deleting record");
      }
    }
  };

  const filteredBoxes = cashBoxes.filter((box) =>
    (lang === "ar" ? box.name_ar : box.name_en).toLowerCase().includes(searchTerm.toLowerCase()) ||
    box.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute right-3 top-2.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={lang === "ar" ? "بحث عن صندوق..." : "Search cash boxes..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
            dir={lang === "ar" ? "rtl" : "ltr"}
          />
        </div>
        <button
          onClick={() => {
            setSelectedCashBox(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 bg-[#0072BC] text-white px-4 py-2 rounded-lg hover:bg-[#005a96] transition-colors whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          {lang === "ar" ? "إضافة صندوق" : "Add Cash Box"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-right">{lang === "ar" ? "الكود" : "Code"}</th>
              <th className="px-4 py-3 text-right">{lang === "ar" ? "اسم الصندوق" : "Name"}</th>
              <th className="px-4 py-3 text-right">{lang === "ar" ? "الرصيد الافتتاحي" : "Opening Balance"}</th>
              <th className="px-4 py-3 text-right">{lang === "ar" ? "الرصيد الحالي" : "Current Balance"}</th>
              <th className="px-4 py-3 text-right">{lang === "ar" ? "العملة" : "Currency"}</th>
              <th className="px-4 py-3 text-center">{lang === "ar" ? "الحالة" : "Status"}</th>
              <th className="px-4 py-3 text-center">{lang === "ar" ? "إجراءات" : "Actions"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredBoxes.map((box) => (
              <tr key={box.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-right font-medium">{box.code}</td>
                <td className="px-4 py-3 text-right">{lang === "ar" ? box.name_ar : box.name_en}</td>
                <td className="px-4 py-3 text-right">{box.opening_balance.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-bold text-[#0072BC]">{box.current_balance.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">{box.currency}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    box.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {box.status === "Active" ? (lang === "ar" ? "نشط" : "Active") : (lang === "ar" ? "مغلق" : "Closed")}
                  </span>
                </td>
                <td className="px-4 py-3 text-center flex justify-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedCashBox(box);
                      setIsAddModalOpen(true);
                    }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(box.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredBoxes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  {lang === "ar" ? "لا توجد صناديق مضافة" : "No cash boxes found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAddModalOpen && (
        <AddCashBoxModal
          lang={lang}
          user={user}
          cashBox={selectedCashBox}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
}
