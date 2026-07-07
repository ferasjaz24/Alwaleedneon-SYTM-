import React, { useState, useEffect } from "react";
import { User } from "../../../types";
import { CashBankTransfer } from "./types";
import { db } from "../../../firebase";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, serverTimestamp, addDoc, runTransaction, updateDoc } from "firebase/firestore";
import { Search, Plus, Edit, Trash2, CheckCircle } from "lucide-react";
import AddTransferModal from "./AddTransferModal";

interface Props {
  lang: "ar" | "en";
  user: User;
}

export default function TransfersList({ lang, user }: Props) {
  const [transfers, setTransfers] = useState<CashBankTransfer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<CashBankTransfer | null>(null);

  const fetchTransfers = async () => {
    try {
      const res = await fetch("/api/dynamic/cash_bank_transfers");
      if (res.ok) {
        const data = await res.json();
        data.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        setTransfers(data);
      }
    } catch (error) {
      console.error("Error fetching cash_bank_transfers:", error);
    }
  };

  useEffect(() => {
    fetchTransfers();
    const interval = setInterval(fetchTransfers, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (t: CashBankTransfer) => {
    if (t.status === "Approved") {
      alert(lang === "ar" ? "لا يمكن حذف تحويل معتمد" : "Cannot delete an approved transfer");
      return;
    }
    if (window.confirm(lang === "ar" ? "هل أنت متأكد من الحذف؟" : "Are you sure you want to delete?")) {
      try {
        const res = await fetch(`/api/dynamic/cash_bank_transfers/${t.id}`, {
          method: "DELETE"
        });
        if (res.ok) {
          fetchTransfers();
        } else {
          throw new Error("Failed to delete transfer");
        }
      } catch (error) {
        console.error("Error deleting document: ", error);
      }
    }
  };

  const handleApprove = async (t: CashBankTransfer) => {
    if (window.confirm(lang === "ar" ? "هل أنت متأكد من اعتماد هذا التحويل؟ سيتم إنشاء قيد يومي معتمد وتحديث الأرصدة تلقائياً." : "Are you sure you want to approve? This will generate an approved journal entry and update balances automatically.")) {
      try {
        const debitAccount = t.to_type === "Cash_Box" ? "الصندوق" : "البنك";
        const debitSubId = t.to_id;
        
        const creditAccount = t.from_type === "Cash_Box" ? "الصندوق" : "البنك";
        const creditSubId = t.from_id;

        // Post approved Journal Entry
        const jvRes = await fetch("/api/journal-entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: t.date || new Date().toISOString().split("T")[0],
            type: "تسوية عهد وتحويلات",
            status: "معتمد",
            debitAccount,
            creditAccount,
            debitSubId,
            creditSubId,
            amount: t.amount,
            reference: t.reference_number,
            description: t.description || `اعتماد تحويل ${t.reference_number}`,
            notes: `تحويل تلقائي من ${creditAccount} إلى ${debitAccount}`,
            createdBy: user.username || "System"
          })
        });

        if (!jvRes.ok) {
          throw new Error("Failed to create matching journal entry for transfer");
        }

        const jvData = await jvRes.json();
        const jvId = jvData.entry.id;

        // Update transfer status to Approved and link the JV ID
        const updateRes = await fetch(`/api/dynamic/cash_bank_transfers/${t.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "Approved",
            approved_by: user.username || "System",
            journalEntryId: jvId
          })
        });

        if (!updateRes.ok) {
          throw new Error("Failed to update transfer status");
        }

        // Add Audit Log
        await fetch("/api/dynamic/audit_logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "Approve Transfer",
            module: "Cash & Bank",
            record_id: t.id,
            user_id: user.uid || "System",
            user_name: user.username || "System",
            timestamp: new Date().toISOString(),
            details: `Approved transfer ${t.reference_number} and created matching journal entry ${jvId}`
          })
        });

        alert(lang === "ar" ? "تم الاعتماد وإنشاء القيد اليومي بنجاح" : "Successfully approved and journal entry created");
        fetchTransfers();
      } catch (error: any) {
        console.error("Approval error: ", error);
        alert(lang === "ar" ? `حدث خطأ أثناء الاعتماد: ${error.message}` : `Error during approval: ${error.message}`);
      }
    }
  };

  const filtered = transfers.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.reference_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute right-3 top-2.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={lang === "ar" ? "بحث عن التحويلات..." : "Search transfers..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
            dir={lang === "ar" ? "rtl" : "ltr"}
          />
        </div>
        <button
          onClick={() => {
            setSelectedTransfer(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 bg-[#0072BC] text-white px-4 py-2 rounded-lg hover:bg-[#005a96] transition-colors whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          {lang === "ar" ? "إضافة تحويل" : "Add Transfer"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-right">{lang === "ar" ? "رقم المرجع" : "Ref Number"}</th>
              <th className="px-4 py-3 text-right">{lang === "ar" ? "التاريخ" : "Date"}</th>
              <th className="px-4 py-3 text-right">{lang === "ar" ? "المبلغ" : "Amount"}</th>
              <th className="px-4 py-3 text-right">{lang === "ar" ? "البيان" : "Description"}</th>
              <th className="px-4 py-3 text-center">{lang === "ar" ? "الحالة" : "Status"}</th>
              <th className="px-4 py-3 text-center">{lang === "ar" ? "إجراءات" : "Actions"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-right font-medium">{t.reference_number}</td>
                <td className="px-4 py-3 text-right">{t.date}</td>
                <td className="px-4 py-3 text-right font-bold text-blue-600" dir="ltr">
                  {t.amount.toLocaleString()} {t.currency}
                </td>
                <td className="px-4 py-3 text-right truncate max-w-xs">{t.description}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    t.status === "Approved" ? "bg-green-100 text-green-700" :
                    t.status === "Draft" ? "bg-slate-100 text-slate-700" :
                    t.status === "Pending_Approval" ? "bg-orange-100 text-orange-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center flex justify-center gap-2">
                  {t.status === "Pending_Approval" && (
                    <button
                      onClick={() => handleApprove(t)}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title={lang === "ar" ? "اعتماد" : "Approve"}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {t.status !== "Approved" && (
                    <button
                      onClick={() => {
                        setSelectedTransfer(t);
                        setIsAddModalOpen(true);
                      }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(t)}
                    disabled={t.status === "Approved"}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  {lang === "ar" ? "لا توجد تحويلات مالية" : "No transfers found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAddModalOpen && (
        <AddTransferModal
          lang={lang}
          user={user}
          transfer={selectedTransfer}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
}
