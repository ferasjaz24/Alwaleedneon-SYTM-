import React, { useState, useEffect } from "react";
import { User } from "../../../types";
import { CashBankTransaction } from "./types";
import { db } from "../../../firebase";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, serverTimestamp, addDoc, getDoc, runTransaction } from "firebase/firestore";
import { Search, Plus, Edit, Trash2, Eye, FileText, CheckCircle, XCircle } from "lucide-react";
import AddTransactionModal from "./AddTransactionModal";

interface Props {
  lang: "ar" | "en";
  user: User;
}

export default function TransactionsList({ lang, user }: Props) {
  const [transactions, setTransactions] = useState<CashBankTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<CashBankTransaction | null>(null);

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/dynamic/cash_bank_transactions");
      if (res.ok) {
        const data = await res.json();
        data.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        setTransactions(data);
      }
    } catch (error) {
      console.error("Error fetching cash_bank_transactions:", error);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (t: CashBankTransaction) => {
    if (t.status === "Approved") {
      alert(lang === "ar" ? "لا يمكن حذف حركة معتمدة" : "Cannot delete an approved transaction");
      return;
    }
    if (window.confirm(lang === "ar" ? "هل أنت متأكد من الحذف؟" : "Are you sure you want to delete?")) {
      try {
        const res = await fetch(`/api/dynamic/cash_bank_transactions/${t.id}`, {
          method: "DELETE"
        });
        if (res.ok) {
          fetchTransactions();
        } else {
          throw new Error("Failed to delete transaction");
        }
      } catch (error) {
        console.error("Error deleting document: ", error);
      }
    }
  };

  const handleApprove = async (t: CashBankTransaction) => {
    if (window.confirm(lang === "ar" ? "هل أنت متأكد من اعتماد هذه الحركة؟ سيتم إنشاء قيد يومي معتمد وتحديث الأرصدة تلقائياً." : "Are you sure you want to approve? This will generate an approved journal entry and update balances automatically.")) {
      try {
        const isReceipt = t.type === "Deposit" || t.type === "Customer_Payment";
        const accountName = t.source_type === "Cash_Box" ? "الصندوق" : "البنك";
        
        const debitAccount = isReceipt ? accountName : "المصروفات";
        const debitSubId = isReceipt ? t.source_id : "";
        
        const creditAccount = isReceipt ? "الإيرادات" : accountName;
        const creditSubId = isReceipt ? "" : t.source_id;

        // Post approved Journal Entry
        const jvRes = await fetch("/api/journal-entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: t.date || new Date().toISOString().split("T")[0],
            type: "سند صرف وقبض",
            status: "معتمد",
            debitAccount,
            creditAccount,
            debitSubId,
            creditSubId,
            amount: t.amount,
            reference: t.reference_number,
            description: t.description || `اعتماد حركة ${t.reference_number}`,
            notes: `حركة تلقائية ناتجة عن اعتماد المعاملة ${t.reference_number}`,
            createdBy: user.username || "System"
          })
        });

        if (!jvRes.ok) {
          throw new Error("Failed to create matching journal entry");
        }

        const jvData = await jvRes.json();
        const jvId = jvData.entry.id;

        // Update transaction status to Approved and link the JV ID
        const updateRes = await fetch(`/api/dynamic/cash_bank_transactions/${t.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "Approved",
            approved_by: user.username || "System",
            journalEntryId: jvId
          })
        });

        if (!updateRes.ok) {
          throw new Error("Failed to update transaction status");
        }

        // Add Audit Log
        await fetch("/api/dynamic/audit_logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "Approve Transaction",
            module: "Cash & Bank",
            record_id: t.id,
            user_id: user.uid || "System",
            user_name: user.username || "System",
            timestamp: new Date().toISOString(),
            details: `Approved transaction ${t.reference_number} and created matching journal entry ${jvId}`
          })
        });

        alert(lang === "ar" ? "تم الاعتماد وإنشاء القيد اليومي بنجاح" : "Successfully approved and journal entry created");
        fetchTransactions();
      } catch (error: any) {
        console.error("Approval error: ", error);
        alert(lang === "ar" ? `حدث خطأ أثناء الاعتماد: ${error.message}` : `Error during approval: ${error.message}`);
      }
    }
  };

  const filtered = transactions.filter(t => 
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
            placeholder={lang === "ar" ? "بحث عن الحركات المالية..." : "Search transactions..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
            dir={lang === "ar" ? "rtl" : "ltr"}
          />
        </div>
        <button
          onClick={() => {
            setSelectedTransaction(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 bg-[#0072BC] text-white px-4 py-2 rounded-lg hover:bg-[#005a96] transition-colors whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          {lang === "ar" ? "إضافة حركة مالية" : "Add Transaction"}
        </button>
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
              <th className="px-4 py-3 text-center">{lang === "ar" ? "الحالة" : "Status"}</th>
              <th className="px-4 py-3 text-center">{lang === "ar" ? "إجراءات" : "Actions"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-right font-medium">{t.reference_number}</td>
                <td className="px-4 py-3 text-right">{t.date}</td>
                <td className="px-4 py-3 text-right">
                  {lang === "ar" ? t.type.replace("_", " ") : t.type.replace("_", " ")}
                </td>
                <td className="px-4 py-3 text-right font-bold" dir="ltr">
                  {(t.type === "Deposit" || t.type === "Customer_Payment") ? (
                    <span className="text-green-600">+{t.amount.toLocaleString()} {t.currency}</span>
                  ) : (
                    <span className="text-red-600">-{t.amount.toLocaleString()} {t.currency}</span>
                  )}
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
                        setSelectedTransaction(t);
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
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  {lang === "ar" ? "لا توجد حركات مالية" : "No transactions found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAddModalOpen && (
        <AddTransactionModal
          lang={lang}
          user={user}
          transaction={selectedTransaction}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
}
