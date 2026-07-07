import React, { useState, useEffect } from "react";
import { User } from "../../../types";
import { db } from "../../../firebase";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { Search } from "lucide-react";

interface Props {
  lang: "ar" | "en";
  user: User;
}

export default function ArchiveList({ lang, user }: Props) {
  const [archived, setArchived] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchArchive = async () => {
    try {
      const res = await fetch("/api/dynamic/cash_bank_transactions");
      if (res.ok) {
        const data = await res.json();
        const cancelled = data.filter((item: any) => item.status === "Cancelled");
        cancelled.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        setArchived(cancelled);
      }
    } catch (error) {
      console.error("Error fetching archived transactions:", error);
    }
  };

  useEffect(() => {
    fetchArchive();
    const interval = setInterval(fetchArchive, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = archived.filter(a => 
    a.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute right-3 top-2.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={lang === "ar" ? "بحث في الأرشيف..." : "Search archive..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
            dir={lang === "ar" ? "rtl" : "ltr"}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-right">{lang === "ar" ? "رقم المرجع" : "Ref Number"}</th>
              <th className="px-4 py-3 text-right">{lang === "ar" ? "التاريخ" : "Date"}</th>
              <th className="px-4 py-3 text-right">{lang === "ar" ? "النوع" : "Type"}</th>
              <th className="px-4 py-3 text-right">{lang === "ar" ? "المبلغ" : "Amount"}</th>
              <th className="px-4 py-3 text-right">{lang === "ar" ? "البيان" : "Description"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50 transition-colors opacity-75">
                <td className="px-4 py-3 text-right font-medium">{a.reference_number}</td>
                <td className="px-4 py-3 text-right">{a.date}</td>
                <td className="px-4 py-3 text-right">{a.type}</td>
                <td className="px-4 py-3 text-right" dir="ltr">{a.amount?.toLocaleString()} {a.currency}</td>
                <td className="px-4 py-3 text-right">{a.description}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  {lang === "ar" ? "لا توجد عناصر في الأرشيف" : "No archived items found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
