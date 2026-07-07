import React, { useState, useEffect } from "react";
import { User } from "../../../types";
import { db } from "../../../firebase";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { Search, FileText } from "lucide-react";

interface Props {
  lang: "ar" | "en";
  user: User;
}

export default function AuditLogList({ lang, user }: Props) {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/dynamic/audit_logs");
      if (res.ok) {
        const data = await res.json();
        const cashBankLogs = data.filter((item: any) => item.module === "Cash & Bank");
        
        const getTime = (ts: any) => {
          if (!ts) return 0;
          if (typeof ts === "string") return new Date(ts).getTime();
          if (ts.seconds) return ts.seconds * 1000;
          return new Date(ts).getTime();
        };

        cashBankLogs.sort((a: any, b: any) => getTime(b.timestamp) - getTime(a.timestamp));
        setLogs(cashBankLogs);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (ts: any) => {
    if (!ts) return "";
    if (typeof ts === "string") {
      return new Date(ts).toLocaleString();
    }
    if (ts.seconds) {
      return new Date(ts.seconds * 1000).toLocaleString();
    }
    return new Date(ts).toLocaleString();
  };

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.user_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute right-3 top-2.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={lang === "ar" ? "بحث في سجل الحركات..." : "Search audit logs..."}
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
              <th className="px-4 py-3 text-right">{lang === "ar" ? "التاريخ والوقت" : "Date & Time"}</th>
              <th className="px-4 py-3 text-right">{lang === "ar" ? "المستخدم" : "User"}</th>
              <th className="px-4 py-3 text-right">{lang === "ar" ? "الإجراء" : "Action"}</th>
              <th className="px-4 py-3 text-right">{lang === "ar" ? "التفاصيل" : "Details"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredLogs.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-right font-medium" dir="ltr">
                  {formatTimestamp(l.timestamp)}
                </td>
                <td className="px-4 py-3 text-right">{l.user_name}</td>
                <td className="px-4 py-3 text-right">
                  <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs">
                    {l.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-slate-600">{l.details}</td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  {lang === "ar" ? "لا توجد سجلات" : "No logs found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
