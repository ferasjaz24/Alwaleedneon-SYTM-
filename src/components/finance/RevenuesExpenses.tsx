import React, { useState, useEffect } from "react";
import { PlusCircle, Search, Filter, Eye, Edit, CheckCircle, XCircle, Printer, FileText, Trash2, X, Upload, DollarSign, Wallet, ArrowDownRight, ArrowUpRight, Ban, Clock, Save, FileCheck, RefreshCcw, Loader2 } from "lucide-react";
import { User } from "../../types";
import { sharedPrintHeader, sharedPrintFooter, sharedPrintStyles } from "../../utils/PrintShared";

const isAdmin = (u: User) => {
  const un = u.username?.toLowerCase() || '';
  const rn = u.role?.toLowerCase() || '';
  return un === 'feras' || un === 'admin' || rn === 'super admin' || rn === 'general admin director' || rn.includes('الادارة العليا') || rn === 'senior management';
};

interface RevenuesExpensesProps {
  user: User;
  lang: 'ar' | 'en';
}

export default function RevenuesExpenses({ user, lang }: RevenuesExpensesProps) {
  const [activeTab, setActiveTab] = useState<'revenues' | 'expenses'>('revenues');

  return (
    <div className="space-y-6" dir="rtl">
      {/* Title Header with clean premium alignment */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <span>💵</span>
            <span>بوابة الإيرادات والمصروفات</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            إدارة وتسجيل وتأكيد التدفقات المالية الداخلة والمصروفات التشغيلية.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('revenues')}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'revenues'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            بوابة الإيرادات
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'expenses'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            بوابة المصروفات
          </button>
        </div>
      </div>

      {activeTab === 'revenues' && <RevenuesTab user={user} lang={lang} isAdmin={isAdmin(user)} />}
      {activeTab === 'expenses' && <ExpensesTab user={user} lang={lang} isAdmin={isAdmin(user)} />}
    </div>
  );
}

// ============================================================================
// Revenues Tab
// ============================================================================

function RevenuesTab({ user, lang, isAdmin }: { user: User, lang: 'ar' | 'en', isAdmin: boolean }) {
  const [revenues, setRevenues] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [cashBoxes, setCashBoxes] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMonth, setFilterMonth] = useState("");
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showDetails, setShowDetails] = useState<any>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<any>(null);
  const [approveConfirmItem, setApproveConfirmItem] = useState<any>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    id: "",
    date: new Date().toISOString().split('T')[0],
    source: "دفعة عميل",
    client: "",
    quoteNumber: "",
    invoiceNumber: "",
    projectName: "",
    amount: "",
    paymentMethod: "تحويل بنكي",
    cashBoxId: "",
    bankAccountId: "",
    reference: "",
    attachmentData: "",
    status: "مسجل",
    notes: ""
  });

  const fetchData = async () => {
    try {
      const [revRes, cliRes, quoRes, cbRes, baRes] = await Promise.all([
        fetch("/api/revenues"),
        fetch("/api/clients"),
        fetch("/api/sales_quotations"),
        fetch("/api/dynamic/cash_boxes"),
        fetch("/api/dynamic/bank_accounts")
      ]);
      const [revData, cliData, quoData, cbData, baData] = await Promise.all([
        revRes.json(),
        cliRes.json(),
        quoRes.json(),
        cbRes.json(),
        baRes.json()
      ]);
      setRevenues(Array.isArray(revData) ? revData : []);
      setClients(Array.isArray(cliData) ? cliData : []);
      setQuotes(Array.isArray(quoData) ? quoData : []);
      setCashBoxes(Array.isArray(cbData) ? cbData : []);
      setBankAccounts(Array.isArray(baData) ? baData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateRevId = () => {
    const d = new Date();
    const year = d.getFullYear();
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const monthAbbr = monthNames[d.getMonth()];
    const prefix = `RV${year}${monthAbbr}`;
    const matched = revenues.filter(r => r.id?.startsWith(prefix));
    let max = 0;
    for (const r of matched) {
      const suffix = r.id.slice(prefix.length);
      const num = parseInt(suffix, 10);
      if (!isNaN(num) && num > max) max = num;
    }
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
  };

  const handleSave = async (newStatus: string) => {
    if (!formData.date || !formData.source || !formData.amount || !formData.paymentMethod) {
      alert("يرجى مراجعة الحقول المطلوبة قبل الحفظ.");
      return;
    }
    if (parseFloat(formData.amount) <= 0) {
      alert("يرجى إدخال مبلغ صحيح أكبر من صفر.");
      return;
    }
    if (formData.paymentMethod === "نقدي" && !formData.cashBoxId) {
      alert("يرجى اختيار الصندوق المستلم لقيمة الإيراد.");
      return;
    }
    if (formData.paymentMethod === "تحويل بنكي" && !formData.bankAccountId) {
      alert("يرجى اختيار الحساب البنكي المستلم لقيمة الإيراد.");
      return;
    }

    const payload: Record<string, any> = {
      ...formData,
      status: newStatus,
      createdBy: user.username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (newStatus === "معتمد") {
      if (!confirm("هل أنت متأكد من حفظ واعتماد هذا السجل للإيرادات؟")) return;
      payload.approvedBy = user.username;
      payload.approvedAt = new Date().toISOString();
    }

    try {
      if (editingItem) {
        await fetch(`/api/revenues/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...editingItem, ...payload })
        });
      } else {
        await fetch("/api/revenues", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }
      fetchData();
      setShowAddModal(false);
      setEditingItem(null);
      alert(`تم حفظ الإيراد بنجاح (${newStatus})`);
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الحفظ");
    }
  };

  const handleApprove = (item: any) => {
    setApproveConfirmItem(item);
  };

  const handleConfirmApprove = async () => {
    if (!approveConfirmItem) return;
    setProcessingId(approveConfirmItem.id);
    setProcessingAction("approve");
    try {
      await fetch(`/api/revenues/${approveConfirmItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...approveConfirmItem, status: "معتمد", approvedBy: user.username, approvedAt: new Date().toISOString() })
      });
      setApproveConfirmItem(null);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  const handleCancel = async (item: any) => {
    const reason = prompt("يرجى إدخال سبب الإلغاء:");
    if (reason === null) return;
    if (confirm("هل أنت متأكد من إلغاء هذا الإيراد؟")) {
      setProcessingId(item.id);
      setProcessingAction("cancel");
      try {
        await fetch(`/api/revenues/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...item, status: "ملغي", cancelReason: reason, canceledBy: user.username, canceledAt: new Date().toISOString() })
        });
        await fetchData();
      } catch (err) {
        console.error(err);
      } finally {
        setProcessingId(null);
        setProcessingAction(null);
      }
    }
  };

  const handleDelete = (item: any) => {
    if (item.status === "معتمد") {
      alert("لا يمكن حذف الإيرادات المعتمدة. يرجى إلغاؤها بدلاً من ذلك لعكس القيود المحاسبية.");
      return;
    }
    setDeleteConfirmItem(item);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    setProcessingId(deleteConfirmItem.id);
    setProcessingAction("delete");
    try {
      await fetch(`/api/revenues/${deleteConfirmItem.id}`, { method: "DELETE" });
      setDeleteConfirmItem(null);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, attachmentData: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const filtered = revenues.filter(r => {
    const matchesSearch = 
      r.id?.toLowerCase().includes(search.toLowerCase()) ||
      r.client?.toLowerCase().includes(search.toLowerCase()) ||
      r.projectName?.toLowerCase().includes(search.toLowerCase()) ||
      r.reference?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    const matchesMonth = filterMonth ? r.date?.startsWith(filterMonth) : true;
    return matchesSearch && matchesStatus && matchesMonth;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalRevenues = revenues.filter(r => r.status === 'معتمد').reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
  const pendingRevenues = revenues.filter(r => r.status === 'بانتظار اعتماد').reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Approved Revenues */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between cursor-pointer hover:shadow-md transition" onClick={() => setFilterStatus("معتمد")}>
          <div className="space-y-1.5 text-right">
            <div className="text-xs font-bold text-slate-500">الإيرادات المعتمدة</div>
            <div className="text-2xl font-black text-emerald-600">
              {totalRevenues.toLocaleString('en-US')} <span className="text-xs font-bold">ر.س</span>
            </div>
            <div className="text-[11px] text-emerald-500 font-semibold">المبالغ المقبولة والمرحلة للأرصدة</div>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Revenues */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between cursor-pointer hover:shadow-md transition" onClick={() => setFilterStatus("بانتظار اعتماد")}>
          <div className="space-y-1.5 text-right">
            <div className="text-xs font-bold text-slate-500">بانتظار الاعتماد</div>
            <div className="text-2xl font-black text-amber-500">
              {pendingRevenues.toLocaleString('en-US')} <span className="text-xs font-bold">ر.س</span>
            </div>
            <div className="text-[11px] text-amber-500 font-semibold">تتطلب مراجعة واعتماد المحاسب</div>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50 text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Registered Transactions */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between cursor-pointer hover:shadow-md transition" onClick={() => setFilterStatus("مسجل")}>
          <div className="space-y-1.5 text-right">
            <div className="text-xs font-bold text-slate-500">إيرادات مسجلة</div>
            <div className="text-2xl font-black text-slate-800">
              {revenues.filter(r => r.status === 'مسجل').length} <span className="text-xs font-bold">حركة</span>
            </div>
            <div className="text-[11px] text-slate-400">حركات مضافة ومحفوظة كمسودة</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-100 text-slate-600">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between cursor-pointer hover:shadow-md transition" onClick={() => setFilterStatus("all")}>
          <div className="space-y-1.5 text-right">
            <div className="text-xs font-bold text-slate-500">إجمالي حركات الإيراد</div>
            <div className="text-2xl font-black text-[#0072BC]">
              {revenues.length} <span className="text-xs font-bold">حركة</span>
            </div>
            <div className="text-[11px] text-slate-400">كافة العمليات والتدفقات المالية</div>
          </div>
          <div className="p-3.5 rounded-xl bg-indigo-50 text-indigo-600">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="بحث في الإيرادات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full md:w-48 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
          >
            <option value="all">كل الحالات</option>
            <option value="مسجل">مسجل</option>
            <option value="بانتظار اعتماد">بانتظار اعتماد</option>
            <option value="معتمد">معتمد</option>
            <option value="ملغي">ملغي</option>
          </select>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full md:w-48 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
          />
        </div>
        
        <button
          onClick={() => {
            setFormData({
              id: generateRevId(),
              date: new Date().toISOString().split('T')[0],
              source: "دفعة عميل",
              client: "",
              quoteNumber: "",
              invoiceNumber: "",
              projectName: "",
              amount: "",
              paymentMethod: "تحويل بنكي",
              cashBoxId: "",
              bankAccountId: "",
              reference: "",
              attachmentData: "",
              status: "مسجل",
              notes: ""
            });
            setEditingItem(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-6 py-2 bg-[#0072BC] text-white rounded-xl font-bold hover:bg-[#005a96] transition-all duration-150 active:scale-95 shadow-sm w-full md:w-auto justify-center"
        >
          <PlusCircle className="w-5 h-5" />
          إضافة إيراد
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold text-slate-600">رقم الإيراد</th>
                <th className="p-4 font-bold text-slate-600">التاريخ</th>
                <th className="p-4 font-bold text-slate-600">العميل</th>
                <th className="p-4 font-bold text-slate-600">المبلغ</th>
                <th className="p-4 font-bold text-slate-600">طريقة الدفع</th>
                <th className="p-4 font-bold text-slate-600">الحالة</th>
                <th className="p-4 font-bold text-slate-600">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">جاري التحميل...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">لا توجد إيرادات مطابقة</td></tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-sm">{item.id}</td>
                    <td className="p-4">{item.date}</td>
                    <td className="p-4">{item.client || '-'}</td>
                    <td className="p-4 font-bold text-emerald-600">{parseFloat(item.amount).toLocaleString('en-US')}</td>
                    <td className="p-4">{item.paymentMethod}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          item.status === 'معتمد' ? 'bg-emerald-100 text-emerald-700' :
                          item.status === 'بانتظار اعتماد' ? 'bg-amber-100 text-amber-700' :
                          item.status === 'ملغي' ? 'bg-rose-100 text-rose-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {item.status}
                        </span>
                        {item.journalStatus === 'failed' && (
                          <div className="flex flex-col gap-1 items-start bg-rose-50 text-rose-800 text-[10px] p-2 rounded-lg border border-rose-100 max-w-[200px]">
                            <span className="font-bold">فشل القيد التلقائي ❌</span>
                            <span className="break-words line-clamp-2">{item.journalError}</span>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm("هل تريد إعادة محاولة إنشاء القيد المحاسبي لهذا السجل؟")) {
                                  try {
                                    const res = await fetch(`/api/finance/retry/revenues/${item.id}`, { method: "POST" });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert("تم إنشاء القيد المحاسبي بنجاح ورقم القيد: " + data.journalEntryId);
                                      await fetchData();
                                    } else {
                                      alert("فشلت إعادة المحاولة: " + (data.error || "خطأ مجهول"));
                                    }
                                  } catch (err: any) {
                                    alert("خطأ: " + err.message);
                                  }
                                }
                              }}
                              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2 py-1 rounded text-[9px] mt-1 cursor-pointer transition active:scale-95"
                            >
                              إعادة المحاولة 🔄
                            </button>
                          </div>
                        )}
                        {item.approvedBy && (
                          <div className="text-[10px] text-slate-500 whitespace-nowrap">
                            بواسطة: {item.approvedBy}<br/>
                            {item.approvedAt && new Date(item.approvedAt).toLocaleDateString('en-US')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 flex gap-1">
                      <button onClick={() => setShowDetails(item)} className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg transition active:scale-90 duration-100" title="عرض التفاصيل"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => { setFormData({ cashBoxId: "", bankAccountId: "", ...item }); setEditingItem(item); setShowAddModal(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition active:scale-95 duration-100" title="تعديل"><Edit className="w-4 h-4" /></button>
                      {item.status !== 'معتمد' && (
                        <button 
                          disabled={processingId !== null} 
                          onClick={() => handleApprove(item)} 
                          className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition active:scale-95 duration-100 flex items-center justify-center min-w-[28px] min-h-[28px]" 
                          title="اعتماد"
                        >
                          {processingId === item.id && processingAction === "approve" ? (
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <button 
                        disabled={processingId !== null} 
                        onClick={() => handleDelete(item)} 
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition active:scale-95 duration-100 flex items-center justify-center min-w-[28px] min-h-[28px]" 
                        title="حذف"
                      >
                        {processingId === item.id && processingAction === "delete" ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Large Modal for Add/Edit Revenue */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-xl font-black text-slate-800">{editingItem ? "تعديل الإيراد" : "إضافة إيراد جديد +"}</h2>
                <p className="text-sm text-slate-500 mt-1">قم بتسجيل مبلغ داخل للشركة مع تحديد العميل والمشروع وطريقة الدفع وسند الدفع.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">رقم الإيراد</label>
                  <input type="text" value={formData.id || "تلقائي"} disabled className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">التاريخ <span className="text-rose-500">*</span></label>
                  <input type="date" lang="en" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0072BC] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">مصدر الإيراد <span className="text-rose-500">*</span></label>
                  <select value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0072BC] focus:outline-none">
                    <option>دفعة عميل</option>
                    <option>تحصيل فاتورة عميل</option>
                    <option>دفعة مرتبطة بعرض سعر</option>
                    <option>إيراد آخر</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">الحالة</label>
                  <input type="text" value={formData.status} disabled className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 font-bold" />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">العميل {formData.source !== 'إيراد آخر' && <span className="text-rose-500">*</span>}</label>
                  <input type="text" list="clients-list" placeholder="اسم العميل..." value={formData.client} onChange={e => setFormData({...formData, client: e.target.value, quoteNumber: "", projectName: ""})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0072BC] focus:outline-none" />
                  <datalist id="clients-list">
                    {clients.map(c => <option key={c.id} value={c.name || c.clientName} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">رقم عرض السعر</label>
                  <input type="text" list="quotes-list" placeholder="اختياري..." value={formData.quoteNumber} onChange={e => {
                    const qNum = e.target.value;
                    const quote = quotes.find(q => (q.quoteNumber === qNum || q.id === qNum));
                    setFormData({...formData, quoteNumber: qNum, projectName: quote ? (quote.projectName || quote.project) : formData.projectName});
                  }} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0072BC] focus:outline-none" />
                  <datalist id="quotes-list">
                    {quotes.filter(q => !formData.client || q.clientName === formData.client || q.client === formData.client).map(q => <option key={q.id} value={q.quoteNumber || q.id}>{q.projectName || q.project}</option>)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">رقم الفاتورة</label>
                  <input type="text" placeholder="اختياري..." value={formData.invoiceNumber} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0072BC] focus:outline-none" />
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">اسم المشروع</label>
                  <input type="text" placeholder="اختياري..." value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0072BC] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">المبلغ <span className="text-rose-500">*</span></label>
                  <input type="number" lang="en" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0072BC] focus:outline-none font-bold text-emerald-600 text-lg" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">طريقة الدفع <span className="text-rose-500">*</span></label>
                  <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0072BC] focus:outline-none">
                    <option>تحويل بنكي</option>
                    <option>نقدي</option>
                    <option>شيك</option>
                    <option>بطاقة</option>
                    <option>مدى</option>
                    <option>أخرى</option>
                  </select>
                </div>
              </div>

              {/* Conditional Bank/Cash Select */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.paymentMethod === "نقدي" ? (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">صندوق النقدية المستلم <span className="text-rose-500">*</span></label>
                    <select value={formData.cashBoxId || ""} onChange={e => setFormData({...formData, cashBoxId: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0072BC] focus:outline-none">
                      <option value="">-- اختر الصندوق --</option>
                      {cashBoxes.map(cb => <option key={cb.id} value={cb.id}>{cb.name || cb.id}</option>)}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">الحساب البنكي للشركة المستلم <span className="text-rose-500">*</span></label>
                    <select value={formData.bankAccountId || ""} onChange={e => setFormData({...formData, bankAccountId: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0072BC] focus:outline-none">
                      <option value="">-- اختر الحساب البنكي --</option>
                      {bankAccounts.map(ba => <option key={ba.id} value={ba.id}>{ba.bankName || ba.name || ba.id} - {ba.accountNumber}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">رقم المرجع أو الحوالة</label>
                  <input type="text" placeholder="رقم العملية أو المرجع..." value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0072BC] focus:outline-none" />
                  {['تحويل بنكي', 'شيك'].includes(formData.paymentMethod) && !formData.reference && (
                    <p className="text-xs text-amber-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/> يفضل إدخال رقم المرجع لتسهيل المراجعة</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">مرفق سند الدفع</label>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                      <label className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 rounded-xl hover:border-[#0072BC] hover:bg-slate-50 cursor-pointer transition">
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-slate-500 text-sm">{formData.attachmentData ? 'تغيير المرفق' : 'اختر ملف...'}</span>
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />
                      </label>
                      {formData.attachmentData && (
                        <button onClick={() => setFormData({...formData, attachmentData: ''})} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl border border-rose-100 transition" title="حذف المرفق">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    {formData.attachmentData && (
                      <div className="mt-2 p-2 border border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
                        {formData.attachmentData.startsWith('data:image') ? (
                          <img src={formData.attachmentData} alt="مرفق معاينة" className="max-w-full max-h-32 object-contain rounded-lg" />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-slate-500">
                            <FileText className="w-8 h-8 text-blue-500" />
                            <a href={formData.attachmentData} download={`attachment-${formData.id || 'new'}.pdf`} className="text-blue-500 underline text-sm hover:text-blue-600 transition">تحميل / معاينة الملف (PDF)</a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 5 */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">ملاحظات</label>
                <textarea rows={2} placeholder="أي تفاصيل إضافية..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0072BC] focus:outline-none resize-none" />
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-2 justify-end">
              <button onClick={() => setShowAddModal(false)} className="px-6 py-2.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 font-bold rounded-xl transition shadow-sm">
                إلغاء
              </button>
              <button onClick={() => handleSave("مسجل")} className="px-6 py-2.5 text-slate-700 bg-slate-200 hover:bg-slate-300 font-bold rounded-xl transition flex items-center gap-2 shadow-sm">
                <Save className="w-4 h-4" />
                حفظ كمسجل
              </button>
              <button onClick={() => handleSave("بانتظار اعتماد")} className="px-6 py-2.5 text-amber-700 bg-amber-100 hover:bg-amber-200 font-bold rounded-xl transition flex items-center gap-2 shadow-sm">
                <RefreshCcw className="w-4 h-4" />
                حفظ وإرسال للاعتماد
              </button>
              <button onClick={() => handleSave("معتمد")} className="px-6 py-2.5 text-white bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl transition flex items-center gap-2 shadow-sm">
                <FileCheck className="w-4 h-4" />
                حفظ واعتماد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Large Modal for Details */}
      {showDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowDetails(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-black text-slate-800">تفاصيل الإيراد - {showDetails.id}</h2>
              <button onClick={() => setShowDetails(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
                <div><span className="text-slate-500 block mb-1">التاريخ:</span> <strong className="text-slate-800">{showDetails.date}</strong></div>
                <div><span className="text-slate-500 block mb-1">الحالة:</span> <strong className="text-slate-800">{showDetails.status}</strong></div>
                <div><span className="text-slate-500 block mb-1">مصدر الإيراد:</span> <strong className="text-slate-800">{showDetails.source}</strong></div>
                <div><span className="text-slate-500 block mb-1">العميل:</span> <strong className="text-slate-800">{showDetails.client || '-'}</strong></div>
                <div><span className="text-slate-500 block mb-1">رقم عرض السعر:</span> <strong className="text-slate-800">{showDetails.quoteNumber || '-'}</strong></div>
                <div><span className="text-slate-500 block mb-1">رقم الفاتورة:</span> <strong className="text-slate-800">{showDetails.invoiceNumber || '-'}</strong></div>
                <div><span className="text-slate-500 block mb-1">اسم المشروع:</span> <strong className="text-slate-800">{showDetails.projectName || '-'}</strong></div>
                <div><span className="text-slate-500 block mb-1">المبلغ:</span> <strong className="text-emerald-600 text-lg">{parseFloat(showDetails.amount).toLocaleString('en-US')} ر.س</strong></div>
                <div><span className="text-slate-500 block mb-1">طريقة الدفع:</span> <strong className="text-slate-800">{showDetails.paymentMethod}</strong></div>
                <div><span className="text-slate-500 block mb-1">رقم المرجع:</span> <strong className="text-slate-800">{showDetails.reference || '-'}</strong></div>
              </div>
              <div className="border-b border-slate-100 pb-4">
                <span className="text-slate-500 block mb-1">ملاحظات:</span>
                <p className="text-slate-800">{showDetails.notes || '-'}</p>
              </div>
              <div className="border-b border-slate-100 pb-4">
                <span className="text-slate-500 block mb-1">تاريخ الإنشاء:</span>
                <p className="text-slate-800">{new Date(showDetails.createdAt).toLocaleString('en-US')} ({showDetails.createdBy})</p>
                {showDetails.approvedBy && (
                  <>
                    <span className="text-slate-500 block mt-2 mb-1">الاعتماد:</span>
                    <p className="text-slate-800">{new Date(showDetails.approvedAt).toLocaleString('en-US')} ({showDetails.approvedBy})</p>
                  </>
                )}
                {showDetails.canceledBy && (
                  <>
                    <span className="text-slate-500 block mt-2 mb-1">الإلغاء:</span>
                    <p className="text-slate-800">{new Date(showDetails.canceledAt).toLocaleString('en-US')} ({showDetails.canceledBy}) - السبب: {showDetails.cancelReason}</p>
                  </>
                )}
              </div>
              {showDetails.attachmentData && (
                <div>
                  <span className="text-slate-500 block mb-2">المرفق:</span>
                  {showDetails.attachmentData.startsWith('data:image') ? (
                    <img src={showDetails.attachmentData} alt="مرفق" className="max-w-full h-auto rounded-lg border border-slate-200" />
                  ) : showDetails.attachmentData.startsWith('data:application/pdf') ? (
                    <div className="flex flex-col gap-2">
                      <iframe src={showDetails.attachmentData} className="w-full h-96 rounded-lg border border-slate-200" title="PDF Preview"></iframe>
                      <a href={showDetails.attachmentData} download={`attachment-${showDetails.id}.pdf`} className="text-blue-500 underline flex items-center gap-1 self-start">
                        <FileText className="w-4 h-4"/> تحميل المرفق PDF
                      </a>
                    </div>
                  ) : (
                    <a href={showDetails.attachmentData} download={`attachment-${showDetails.id}`} className="text-blue-500 underline flex items-center gap-1">
                      <FileText className="w-4 h-4"/> تحميل المرفق
                    </a>
                  )}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write(`
                    <html dir="rtl" lang="ar">
                      <head>
          <style>
            @import url('https://fonts.cdnfonts.com/css/ge-ss-two');
            @import url('https://fonts.cdnfonts.com/css/gotham-pro');
            * { font-family: 'GE SS Two', 'Gotham Pro', sans-serif !important; }
          </style>
                        <title>طباعة سند إيراد - ${showDetails.id}</title>
                        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">
                        <style>
                          ${sharedPrintStyles}
                          body {
                            padding: 20px;
                            box-sizing: border-box;
                          }
                          .print-container {
                            max-width: 800px;
                            margin: 0 auto;
                            display: flex;
                            flex-direction: column;
                            min-height: 95vh;
                          }
                          .content-wrapper {
                            flex-grow: 1;
                            margin-bottom: 40px;
                          }
                          .doc-title {
                            text-align: center;
                            color: #0072BC;
                            font-size: 22px;
                            font-weight: 800;
                            margin-top: 10px;
                            margin-bottom: 25px;
                            border-bottom: 1px dashed #cbd5e1;
                            padding-bottom: 12px;
                          }
                          table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 15px;
                            margin-bottom: 30px;
                          }
                          th, td {
                            border: 1px solid #e2e8f0;
                            padding: 12px 14px;
                            text-align: right;
                            font-size: 14px;
                          }
                          th {
                            background-color: #f8fafc;
                            color: #334155;
                            font-weight: 700;
                            width: 25%;
                          }
                          td {
                            color: #0f172a;
                          }
                          .signatures {
                            display: flex;
                            justify-content: space-between;
                            margin-top: 50px;
                            padding-top: 20px;
                            border-top: 1px solid #f1f5f9;
                          }
                          .signature-block {
                            width: 45%;
                          }
                          .signature-block p {
                            margin: 4px 0;
                            font-size: 13px;
                            color: #475569;
                          }
                        </style>
                      </head>
                      <body>
                        <div class="print-container">
                          <div class="content-wrapper">
                            ${sharedPrintHeader}
                            
                            <div class="doc-title">سند إيراد (#${showDetails.id})</div>
                            
                            <table>
                              <tbody>
                                <tr><th>رقم الإيراد</th><td><strong>${showDetails.id}</strong></td></tr>
                                <tr><th>تاريخ القيد</th><td>${showDetails.date}</td></tr>
                                <tr><th>الحالة</th><td><span style="font-weight: bold; color: ${showDetails.status === 'معتمد' ? '#16a34a' : '#ea580c'}">${showDetails.status}</span></td></tr>
                                <tr><th>مصدر الإيراد</th><td>${showDetails.source}</td></tr>
                                <tr><th>العميل</th><td>${showDetails.client || '-'}</td></tr>
                                <tr><th>رقم عرض السعر</th><td>${showDetails.quoteNumber || '-'}</td></tr>
                                <tr><th>رقم الفاتورة</th><td>${showDetails.invoiceNumber || '-'}</td></tr>
                                <tr><th>اسم المشروع</th><td>${showDetails.projectName || '-'}</td></tr>
                                <tr><th>المبلغ الإجمالي</th><td><strong style="color: #16a34a; font-size: 16px;">${parseFloat(showDetails.amount).toLocaleString('en-US', {minimumFractionDigits: 2})} ر.س</strong></td></tr>
                                <tr><th>طريقة الدفع</th><td>${showDetails.paymentMethod}</td></tr>
                                <tr><th>رقم المرجع / الحوالة</th><td>${showDetails.reference || '-'}</td></tr>
                                <tr><th>ملاحظات</th><td>${showDetails.notes || '-'}</td></tr>
                              </tbody>
                            </table>
                            
                            <div class="signatures">
                              <div class="signature-block">
                                <p><strong>المنشئ والمدقق:</strong></p>
                                <p>الاسم: ${showDetails.createdBy || 'تلقائي'}</p>
                                <p>التاريخ: ${showDetails.createdAt ? new Date(showDetails.createdAt).toLocaleDateString('en-US') : showDetails.date}</p>
                                <p>التوقيع: ............................</p>
                              </div>
                              <div class="signature-block" style="text-align: left; direction: ltr;">
                                <p dir="rtl"><strong>الاعتماد والموافقة المعتمدة:</strong></p>
                                <p dir="rtl">الاسم: ${showDetails.approvedBy || '............................'}</p>
                                <p dir="rtl">التاريخ: ${showDetails.approvedAt ? new Date(showDetails.approvedAt).toLocaleDateString('en-US') : '............................'}</p>
                                <p dir="rtl">التوقيع والختم الرسمي: ............................</p>
                              </div>
                            </div>
                          </div>
                          
                          ${sharedPrintFooter}
                        </div>
                        
                        <script>
                          window.onload = () => {
                            window.print();
                            window.close();
                          }
                        </script>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                }
              }} className="px-6 py-2.5 text-[#0072BC] bg-blue-50 border border-blue-100 hover:bg-blue-100 font-bold rounded-xl transition flex items-center gap-2 shadow-sm">
                <Printer className="w-4 h-4" /> طباعة
              </button>
              <button onClick={() => setShowDetails(null)} className="px-6 py-2.5 text-white bg-slate-800 hover:bg-slate-900 font-bold rounded-xl transition shadow-sm">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Approve Confirmation Modal */}
      {approveConfirmItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setApproveConfirmItem(null)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 transition">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 text-emerald-600 mb-4">
              <div className="p-3 bg-emerald-50 rounded-full">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 font-sans">تأكيد اعتماد الإيراد</h3>
                <p className="text-sm text-slate-500 font-sans">سيتم تثبيت الإيراد واحتسابه مالياً</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl mb-6 text-sm text-slate-600 space-y-2 border border-slate-100 font-mono">
              <div className="flex justify-between">
                <span className="font-medium">رقم السجل:</span>
                <span className="font-mono font-bold text-slate-800">{approveConfirmItem.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">التاريخ:</span>
                <span className="text-slate-800">{approveConfirmItem.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">المبلغ:</span>
                <span className="font-bold text-emerald-600">{Number(approveConfirmItem.amount).toLocaleString('en-US')} ر.س</span>
              </div>
              {approveConfirmItem.client && (
                <div className="flex justify-between">
                  <span className="font-medium">العميل:</span>
                  <span className="text-slate-800 text-left">{approveConfirmItem.client}</span>
                </div>
              )}
            </div>

            <p className="text-slate-600 text-sm mb-6 leading-relaxed text-right font-sans">
              عند اعتماد هذا الإيراد، سيتم ترحيل المبلغ للأرصدة المالية واحتسابه ضمن الإيرادات المعتمدة. لن يمكن تعديله أو حذفه لاحقاً إلا بصلاحيات الإدارة العليا.
            </p>

            <div className="flex gap-3 justify-end">
              <button 
                disabled={processingId !== null} 
                onClick={() => setApproveConfirmItem(null)} 
                className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl transition font-sans"
              >
                إلغاء
              </button>
              <button 
                disabled={processingId !== null} 
                onClick={handleConfirmApprove} 
                className="px-5 py-2.5 text-white bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl transition shadow-md shadow-emerald-100 flex items-center gap-2 justify-center font-sans"
              >
                {processingId === approveConfirmItem.id && processingAction === "approve" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري الاعتماد...
                  </>
                ) : (
                  "نعم، اعتمد الآن"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setDeleteConfirmItem(null)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 transition">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-3 bg-rose-50 rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">تأكيد حذف الإيراد</h3>
                <p className="text-sm text-slate-500">لا يمكن التراجع عن هذا الإجراء</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl mb-6 text-sm text-slate-600 space-y-2 border border-slate-100">
              <div className="flex justify-between">
                <span className="font-medium">رقم الإيراد:</span>
                <span className="font-mono font-bold text-slate-800">{deleteConfirmItem.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">التاريخ:</span>
                <span className="text-slate-800">{deleteConfirmItem.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">المبلغ:</span>
                <span className="font-bold text-rose-600">{parseFloat(deleteConfirmItem.amount).toLocaleString('en-US')} ر.س</span>
              </div>
              {deleteConfirmItem.client && (
                <div className="flex justify-between">
                  <span className="font-medium">العميل:</span>
                  <span className="text-slate-800 text-left">{deleteConfirmItem.client}</span>
                </div>
              )}
            </div>

            <p className="text-slate-600 text-sm mb-6">
              هل أنت متأكد تماماً من رغبتك في حذف هذا السجل بشكل نهائي من قاعدة البيانات؟
            </p>

            <div className="flex gap-3 justify-end">
              <button 
                disabled={processingId !== null} 
                onClick={() => setDeleteConfirmItem(null)} 
                className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl transition"
              >
                إلغاء
              </button>
              <button 
                disabled={processingId !== null} 
                onClick={handleConfirmDelete} 
                className="px-5 py-2.5 text-white bg-rose-600 hover:bg-rose-700 font-bold rounded-xl transition shadow-md shadow-rose-100 flex items-center gap-2 justify-center"
              >
                {processingId === deleteConfirmItem.id && processingAction === "delete" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري الحذف...
                  </>
                ) : (
                  "نعم، احذف الآن"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Expenses Tab
// ============================================================================

function ExpensesTab({ user, lang, isAdmin }: { user: User, lang: 'ar' | 'en', isAdmin: boolean }) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMonth, setFilterMonth] = useState("");
  const [cashBoxes, setCashBoxes] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showDetails, setShowDetails] = useState<any>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<any>(null);
  const [approveConfirmItem, setApproveConfirmItem] = useState<any>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  
  const expenseTypes = [
    "مشتريات مواد", "رواتب", "إيجار", "كهرباء وماء", "وقود", "صيانة", 
    "اتصالات", "رسوم حكومية", "مصاريف سيارات", "مصاريف تشغيل", 
    "مصاريف إدارية", "مصاريف تركيب", "مصاريف نقل", "مصاريف أدوات وعدد", 
    "مصاريف طباعة", "مصاريف ضيافة", "مصاريف طارئة", "أخرى"
  ];

  const [formData, setFormData] = useState({
    id: "",
    date: new Date().toISOString().split('T')[0],
    expenseType: "مشتريات مواد",
    description: "",
    supplier: "",
    projectName: "",
    amount: "",
    paymentMethod: "تحويل بنكي",
    cashBoxId: "",
    bankAccountId: "",
    reference: "",
    attachmentData: "",
    status: "مسجل",
    notes: ""
  });

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [expRes, supRes, projRes, cbRes, baRes] = await Promise.all([
        fetch("/api/expenses"),
        fetch("/api/dynamic/suppliers"),
        fetch("/api/dynamic/production_projects"),
        fetch("/api/dynamic/cash_boxes"),
        fetch("/api/dynamic/bank_accounts")
      ]);
      const [expData, supData, projData, cbData, baData] = await Promise.all([
        expRes.json(),
        supRes.json(),
        projRes.json(),
        cbRes.json(),
        baRes.json()
      ]);
      setExpenses(Array.isArray(expData) ? expData : []);
      setSuppliers(Array.isArray(supData) ? supData : []);
      setProjects(Array.isArray(projData) ? projData : []);
      setCashBoxes(Array.isArray(cbData) ? cbData : []);
      setBankAccounts(Array.isArray(baData) ? baData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateExpId = () => {
    const d = new Date();
    const year = d.getFullYear();
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const monthAbbr = monthNames[d.getMonth()];
    const prefix = `EX${year}${monthAbbr}`;
    const matched = expenses.filter(r => r.id?.startsWith(prefix));
    let max = 0;
    for (const r of matched) {
      const suffix = r.id.slice(prefix.length);
      const num = parseInt(suffix, 10);
      if (!isNaN(num) && num > max) max = num;
    }
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
  };

  const handleSave = async (newStatus: string) => {
    if (!formData.date || !formData.expenseType || !formData.description || !formData.amount || !formData.paymentMethod) {
      alert("يرجى مراجعة الحقول المطلوبة قبل الحفظ.");
      return;
    }
    if (parseFloat(formData.amount) <= 0) {
      alert("يرجى إدخال مبلغ صحيح أكبر من صفر.");
      return;
    }

    const isCashPayment = ["نقدي", "من الصندوق"].includes(formData.paymentMethod);
    if (isCashPayment && !formData.cashBoxId) {
      alert("يرجى اختيار الصندوق المدفوع منه قيمة المصروف.");
      return;
    }
    const isBankPayment = ["تحويل بنكي", "من البنك", "شيك", "بطاقة", "مدى"].includes(formData.paymentMethod);
    if (isBankPayment && !formData.bankAccountId) {
      alert("يرجى اختيار الحساب البنكي المدفوع منه قيمة المصروف.");
      return;
    }

    const payload: Record<string, any> = {
      ...formData,
      status: newStatus,
      createdBy: user.username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (newStatus === "معتمد") {
      if (!confirm("هل أنت متأكد من حفظ واعتماد هذا المصروف؟")) return;
      payload.approvedBy = user.username;
      payload.approvedAt = new Date().toISOString();
    } else if (newStatus === "مدفوع") {
      if (!confirm("هل أنت متأكد من حفظ وتعميد هذا المصروف كمدفوع؟")) return;
      payload.approvedBy = payload.approvedBy || user.username;
      payload.approvedAt = payload.approvedAt || new Date().toISOString();
      payload.paidBy = user.username;
      payload.paidAt = new Date().toISOString();
    }

    try {
      if (editingItem) {
        await fetch(`/api/expenses/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...editingItem, ...payload })
        });
      } else {
        await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }
      fetchData();
      setShowAddModal(false);
      setEditingItem(null);
      alert(`تم حفظ المصروف بنجاح (${newStatus})`);
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الحفظ");
    }
  };

  const handleApprove = (item: any) => {
    setApproveConfirmItem(item);
  };

  const handleConfirmApprove = async () => {
    if (!approveConfirmItem) return;
    setProcessingId(approveConfirmItem.id);
    setProcessingAction("approve");
    try {
      await fetch(`/api/expenses/${approveConfirmItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...approveConfirmItem, status: "معتمد", approvedBy: user.username, approvedAt: new Date().toISOString() })
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
      setApproveConfirmItem(null);
    }
  };

  const handlePay = async (item: any) => {
    if (!confirm("هل أنت متأكد من تسجيل هذا المصروف كمدفوع؟")) return;
    setProcessingId(item.id);
    setProcessingAction("pay");
    try {
      await fetch(`/api/expenses/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, status: "مدفوع", paidBy: user.username, paidAt: new Date().toISOString() })
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  const handleReject = async (item: any) => {
    const reason = prompt("يرجى إدخال سبب الرفض:");
    if (reason === null) return;
    if (confirm("هل أنت متأكد من رفض هذا المصروف؟")) {
      setProcessingId(item.id);
      setProcessingAction("reject");
      try {
        await fetch(`/api/expenses/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...item, status: "مرفوض", rejectReason: reason, rejectedBy: user.username, rejectedAt: new Date().toISOString() })
        });
        await fetchData();
      } catch (err) {
        console.error(err);
      } finally {
        setProcessingId(null);
        setProcessingAction(null);
      }
    }
  };

  const handleCancel = async (item: any) => {
    const reason = prompt("يرجى إدخال سبب الإلغاء:");
    if (reason === null) return;
    if (confirm("هل أنت متأكد من إلغاء هذا المصروف؟")) {
      setProcessingId(item.id);
      setProcessingAction("cancel");
      try {
        await fetch(`/api/expenses/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...item, status: "ملغي", cancelReason: reason, canceledBy: user.username, canceledAt: new Date().toISOString() })
        });
        await fetchData();
      } catch (err) {
        console.error(err);
      } finally {
        setProcessingId(null);
        setProcessingAction(null);
      }
    }
  };

  const handleDelete = (item: any) => {
    if (item.status === "معتمد" || item.status === "مدفوع") {
      alert("لا يمكن حذف المصروفات المعتمدة أو المدفوعة. يرجى إلغاؤها بدلاً من ذلك لعكس القيود المحاسبية.");
      return;
    }
    setDeleteConfirmItem(item);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    setProcessingId(deleteConfirmItem.id);
    setProcessingAction("delete");
    try {
      await fetch(`/api/expenses/${deleteConfirmItem.id}`, { method: "DELETE" });
      setDeleteConfirmItem(null);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, attachmentData: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const filtered = expenses.filter(r => {
    const matchesSearch = 
      r.id?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      r.supplier?.toLowerCase().includes(search.toLowerCase()) ||
      r.projectName?.toLowerCase().includes(search.toLowerCase()) ||
      r.reference?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    const matchesMonth = filterMonth ? r.date?.startsWith(filterMonth) : true;
    return matchesSearch && matchesStatus && matchesMonth;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalPaid = expenses.filter(r => r.status === 'مدفوع').reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
  const totalApproved = expenses.filter(r => r.status === 'معتمد' || r.status === 'مدفوع').reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
  const pendingExpenses = expenses.filter(r => r.status === 'بانتظار اعتماد').reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Paid Expenses */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between cursor-pointer hover:shadow-md transition" onClick={() => setFilterStatus("مدفوع")}>
          <div className="space-y-1.5 text-right">
            <div className="text-xs font-bold text-slate-500">مصروفات مدفوعة</div>
            <div className="text-2xl font-black text-blue-600">
              {totalPaid.toLocaleString('en-US')} <span className="text-xs font-bold">ر.س</span>
            </div>
            <div className="text-[11px] text-blue-500 font-semibold">المبالغ المسددة بالكامل للجهات والموردين</div>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-50 text-blue-600">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Total Approved (unpaid) Expenses */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between cursor-pointer hover:shadow-md transition" onClick={() => setFilterStatus("معتمد")}>
          <div className="space-y-1.5 text-right">
            <div className="text-xs font-bold text-slate-500">معتمد (بانتظار الصرف)</div>
            <div className="text-2xl font-black text-emerald-600">
              {(totalApproved - totalPaid).toLocaleString('en-US')} <span className="text-xs font-bold">ر.س</span>
            </div>
            <div className="text-[11px] text-emerald-500 font-semibold">مبالغ معتمدة وجاهزة لأمر الصرف والتحويل</div>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Expenses */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between cursor-pointer hover:shadow-md transition" onClick={() => setFilterStatus("بانتظار اعتماد")}>
          <div className="space-y-1.5 text-right">
            <div className="text-xs font-bold text-slate-500">بانتظار الاعتماد</div>
            <div className="text-2xl font-black text-amber-500">
              {pendingExpenses.toLocaleString('en-US')} <span className="text-xs font-bold">ر.س</span>
            </div>
            <div className="text-[11px] text-amber-500 font-semibold">طلبات صرف معلقة تطلب موافقة المحاسب</div>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50 text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Total Expenses Transactions */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between cursor-pointer hover:shadow-md transition" onClick={() => setFilterStatus("all")}>
          <div className="space-y-1.5 text-right">
            <div className="text-xs font-bold text-slate-500">إجمالي حركات المصروفات</div>
            <div className="text-2xl font-black text-[#0072BC]">
              {expenses.length} <span className="text-xs font-bold">حركة</span>
            </div>
            <div className="text-[11px] text-slate-400">كافة العمليات والمدفوعات المسجلة</div>
          </div>
          <div className="p-3.5 rounded-xl bg-indigo-50 text-indigo-600">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="بحث في المصروفات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full md:w-48 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
          >
            <option value="all">كل الحالات</option>
            <option value="مسجل">مسجل</option>
            <option value="بانتظار اعتماد">بانتظار اعتماد</option>
            <option value="معتمد">معتمد</option>
            <option value="مدفوع">مدفوع</option>
            <option value="مرفوض">مرفوض</option>
            <option value="ملغي">ملغي</option>
          </select>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full md:w-48 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
          />
        </div>
        
        <button
          onClick={() => {
            setFormData({
              id: generateExpId(),
              date: new Date().toISOString().split('T')[0],
              expenseType: "مشتريات مواد",
              description: "",
              supplier: "",
              projectName: "",
              amount: "",
              paymentMethod: "تحويل بنكي",
              cashBoxId: "",
              bankAccountId: "",
              reference: "",
              attachmentData: "",
              status: "مسجل",
              notes: ""
            });
            setEditingItem(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-6 py-2 bg-[#0072BC] text-white rounded-xl font-bold hover:bg-[#005a96] transition-all duration-150 active:scale-95 shadow-sm w-full md:w-auto justify-center"
        >
          <PlusCircle className="w-5 h-5" />
          إضافة مصروف
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold text-slate-600">رقم المصروف</th>
                <th className="p-4 font-bold text-slate-600">التاريخ</th>
                <th className="p-4 font-bold text-slate-600">الوصف</th>
                <th className="p-4 font-bold text-slate-600">المبلغ</th>
                <th className="p-4 font-bold text-slate-600">طريقة الدفع</th>
                <th className="p-4 font-bold text-slate-600">الحالة</th>
                <th className="p-4 font-bold text-slate-600">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">جاري التحميل...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">لا توجد مصروفات مطابقة</td></tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-sm">{item.id}</td>
                    <td className="p-4">{item.date}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{item.description}</div>
                      <div className="text-xs text-slate-500">{item.supplier} - {item.expenseType}</div>
                    </td>
                    <td className="p-4 font-bold text-rose-600">{parseFloat(item.amount).toLocaleString('en-US')}</td>
                    <td className="p-4">{item.paymentMethod}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          item.status === 'مدفوع' ? 'bg-blue-100 text-blue-700' :
                          item.status === 'معتمد' ? 'bg-emerald-100 text-emerald-700' :
                          item.status === 'بانتظار اعتماد' ? 'bg-amber-100 text-amber-700' :
                          item.status === 'مرفوض' || item.status === 'ملغي' ? 'bg-rose-100 text-rose-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {item.status}
                        </span>
                        {item.journalStatus === 'failed' && (
                          <div className="flex flex-col gap-1 items-start bg-rose-50 text-rose-800 text-[10px] p-2 rounded-lg border border-rose-100 max-w-[200px]">
                            <span className="font-bold">فشل القيد التلقائي ❌</span>
                            <span className="break-words line-clamp-2">{item.journalError}</span>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm("هل تريد إعادة محاولة إنشاء القيد المحاسبي لهذا السجل؟")) {
                                  try {
                                    const res = await fetch(`/api/finance/retry/expenses/${item.id}`, { method: "POST" });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert("تم إنشاء القيد المحاسبي بنجاح ورقم القيد: " + data.journalEntryId);
                                      await fetchData();
                                    } else {
                                      alert("فشلت إعادة المحاولة: " + (data.error || "خطأ مجهول"));
                                    }
                                  } catch (err: any) {
                                    alert("خطأ: " + err.message);
                                  }
                                }
                              }}
                              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2 py-1 rounded text-[9px] mt-1 cursor-pointer transition active:scale-95"
                            >
                              إعادة المحاولة 🔄
                            </button>
                          </div>
                        )}
                        {item.approvedBy && (
                          <div className="text-[10px] text-slate-500 whitespace-nowrap">
                            بواسطة: {item.approvedBy}<br/>
                            {item.approvedAt && new Date(item.approvedAt).toLocaleDateString('en-US')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 flex gap-1">
                      <button onClick={() => setShowDetails(item)} className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg transition active:scale-90 duration-100" title="عرض التفاصيل"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => { setFormData({ cashBoxId: "", bankAccountId: "", ...item }); setEditingItem(item); setShowAddModal(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition active:scale-95 duration-100" title="تعديل"><Edit className="w-4 h-4" /></button>
                      {(item.status === 'بانتظار اعتماد' || item.status === 'مسجل') && (
                        <button 
                          disabled={processingId !== null} 
                          onClick={() => handleApprove(item)} 
                          className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition active:scale-95 duration-100 flex items-center justify-center min-w-[28px] min-h-[28px]" 
                          title="اعتماد"
                        >
                          {processingId === item.id && processingAction === "approve" ? (
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      {(item.status === 'معتمد' || item.status === 'بانتظار اعتماد') && (
                         <button 
                           disabled={processingId !== null} 
                           onClick={() => handlePay(item)} 
                           className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition active:scale-95 duration-100 flex items-center justify-center min-w-[28px] min-h-[28px]" 
                           title="تسجيل دفع"
                         >
                           {processingId === item.id && processingAction === "pay" ? (
                             <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                           ) : (
                             <DollarSign className="w-4 h-4" />
                           )}
                         </button>
                      )}
                      {item.status !== 'ملغي' && (
                        <button 
                          disabled={processingId !== null} 
                          onClick={() => handleCancel(item)} 
                          className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition active:scale-95 duration-100 flex items-center justify-center min-w-[28px] min-h-[28px]" 
                          title="إلغاء"
                        >
                          {processingId === item.id && processingAction === "cancel" ? (
                            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <button 
                        disabled={processingId !== null} 
                        onClick={() => handleDelete(item)} 
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition active:scale-95 duration-100 flex items-center justify-center min-w-[28px] min-h-[28px]" 
                        title="حذف"
                      >
                        {processingId === item.id && processingAction === "delete" ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Large Modal for Add/Edit Expense */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-xl font-black text-slate-800">{editingItem ? "تعديل المصروف" : "إضافة مصروف جديد +"}</h2>
                <p className="text-sm text-slate-500 mt-1">قم بتسجيل مبلغ خارج من الشركة مع تحديد نوع المصروف والجهة وطريقة الدفع والمرفق.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">رقم المصروف</label>
                  <input type="text" value={formData.id || "تلقائي"} disabled className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">التاريخ <span className="text-rose-500">*</span></label>
                  <input type="date" lang="en" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0072BC] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">نوع المصروف <span className="text-rose-500">*</span></label>
                  <select value={formData.expenseType} onChange={e => setFormData({...formData, expenseType: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0072BC] focus:outline-none">
                    {expenseTypes.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">الحالة</label>
                  <input type="text" value={formData.status} disabled className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 font-bold" />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">الوصف <span className="text-rose-500">*</span></label>
                  <input type="text" placeholder="وصف المصروف..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0072BC] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">المورد / الجهة</label>
                  <input type="text" list={formData.expenseType === 'مشتريات مواد' ? "suppliers-list" : undefined} placeholder="اختياري..." value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0072BC] focus:outline-none" />
                  {formData.expenseType === 'مشتريات مواد' && (
                    <datalist id="suppliers-list">
                      {suppliers.map(s => <option key={s.id} value={s.companyName || s.name} />)}
                    </datalist>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">المشروع المرتبط</label>
                  <input type="text" list="projects-list" placeholder="اختياري..." value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0072BC] focus:outline-none" />
                  <datalist id="projects-list">
                    {projects.map(p => <option key={p.id} value={p.projectName || p.name} />)}
                  </datalist>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">المبلغ <span className="text-rose-500">*</span></label>
                  <input type="number" lang="en" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0072BC] focus:outline-none font-bold text-rose-600 text-lg" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">طريقة الدفع <span className="text-rose-500">*</span></label>
                  <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0072BC] focus:outline-none">
                    <option>تحويل بنكي</option>
                    <option>نقدي</option>
                    <option>شيك</option>
                    <option>بطاقة</option>
                    <option>مدى</option>
                    <option>من الصندوق</option>
                    <option>من البنك</option>
                    <option>أخرى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">رقم المرجع</label>
                  <input type="text" placeholder="اختياري..." value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0072BC] focus:outline-none" />
                  {['تحويل بنكي', 'شيك'].includes(formData.paymentMethod) && !formData.reference && (
                    <p className="text-xs text-amber-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/> يفضل إدخال رقم المرجع</p>
                  )}
                </div>
              </div>

              {/* Conditional Bank/Cash Select */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["نقدي", "من الصندوق"].includes(formData.paymentMethod) ? (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">صندوق النقدية المدفوع منه <span className="text-rose-500">*</span></label>
                    <select value={formData.cashBoxId || ""} onChange={e => setFormData({...formData, cashBoxId: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0072BC] focus:outline-none">
                      <option value="">-- اختر الصندوق --</option>
                      {cashBoxes.map(cb => <option key={cb.id} value={cb.id}>{cb.name || cb.id}</option>)}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">الحساب البنكي المدفوع منه <span className="text-rose-500">*</span></label>
                    <select value={formData.bankAccountId || ""} onChange={e => setFormData({...formData, bankAccountId: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0072BC] focus:outline-none">
                      <option value="">-- اختر الحساب البنكي --</option>
                      {bankAccounts.map(ba => <option key={ba.id} value={ba.id}>{ba.bankName || ba.name || ba.id} - {ba.accountNumber}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">مرفق الفاتورة / السند</label>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                      <label className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 rounded-xl hover:border-[#0072BC] hover:bg-slate-50 cursor-pointer transition">
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-slate-500 text-sm">{formData.attachmentData ? 'تغيير المرفق' : 'اختر ملف...'}</span>
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />
                      </label>
                      {formData.attachmentData && (
                        <button onClick={() => setFormData({...formData, attachmentData: ''})} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl border border-rose-100 transition" title="حذف المرفق">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    {formData.attachmentData && (
                      <div className="mt-2 p-2 border border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
                        {formData.attachmentData.startsWith('data:image') ? (
                          <img src={formData.attachmentData} alt="مرفق معاينة" className="max-w-full max-h-32 object-contain rounded-lg" />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-slate-500">
                            <FileText className="w-8 h-8 text-blue-500" />
                            <a href={formData.attachmentData} download={`attachment-${formData.id || 'new'}.pdf`} className="text-blue-500 underline text-sm hover:text-blue-600 transition">تحميل / معاينة الملف (PDF)</a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">ملاحظات</label>
                  <textarea rows={2} placeholder="أي تفاصيل إضافية..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0072BC] focus:outline-none resize-none" />
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-2 justify-end">
              <button onClick={() => setShowAddModal(false)} className="px-6 py-2.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 font-bold rounded-xl transition shadow-sm">
                إلغاء
              </button>
              <button onClick={() => handleSave("مسجل")} className="px-6 py-2.5 text-slate-700 bg-slate-200 hover:bg-slate-300 font-bold rounded-xl transition flex items-center gap-2 shadow-sm">
                <Save className="w-4 h-4" />
                حفظ كمسجل
              </button>
              <button onClick={() => handleSave("بانتظار اعتماد")} className="px-6 py-2.5 text-amber-700 bg-amber-100 hover:bg-amber-200 font-bold rounded-xl transition flex items-center gap-2 shadow-sm">
                <RefreshCcw className="w-4 h-4" />
                حفظ وإرسال للاعتماد
              </button>
              <button onClick={() => handleSave("معتمد")} className="px-6 py-2.5 text-white bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl transition flex items-center gap-2 shadow-sm">
                <FileCheck className="w-4 h-4" />
                حفظ واعتماد
              </button>
              <button onClick={() => handleSave("مدفوع")} className="px-6 py-2.5 text-white bg-blue-600 hover:bg-blue-700 font-bold rounded-xl transition flex items-center gap-2 shadow-sm">
                <DollarSign className="w-4 h-4" />
                حفظ واعتماد وتسجيل كمدفوع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Large Modal for Details */}
      {showDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowDetails(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-black text-slate-800">تفاصيل المصروف - {showDetails.id}</h2>
              <button onClick={() => setShowDetails(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
                <div><span className="text-slate-500 block mb-1">التاريخ:</span> <strong className="text-slate-800">{showDetails.date}</strong></div>
                <div><span className="text-slate-500 block mb-1">الحالة:</span> <strong className="text-slate-800">{showDetails.status}</strong></div>
                <div><span className="text-slate-500 block mb-1">نوع المصروف:</span> <strong className="text-slate-800">{showDetails.expenseType}</strong></div>
                <div><span className="text-slate-500 block mb-1">الوصف:</span> <strong className="text-slate-800">{showDetails.description}</strong></div>
                <div><span className="text-slate-500 block mb-1">المورد / الجهة:</span> <strong className="text-slate-800">{showDetails.supplier || '-'}</strong></div>
                <div><span className="text-slate-500 block mb-1">المشروع المرتبط:</span> <strong className="text-slate-800">{showDetails.projectName || '-'}</strong></div>
                <div><span className="text-slate-500 block mb-1">المبلغ:</span> <strong className="text-rose-600 text-lg">{parseFloat(showDetails.amount).toLocaleString('en-US')} ر.س</strong></div>
                <div><span className="text-slate-500 block mb-1">طريقة الدفع:</span> <strong className="text-slate-800">{showDetails.paymentMethod}</strong></div>
                <div><span className="text-slate-500 block mb-1">رقم المرجع:</span> <strong className="text-slate-800">{showDetails.reference || '-'}</strong></div>
              </div>
              <div className="border-b border-slate-100 pb-4">
                <span className="text-slate-500 block mb-1">ملاحظات:</span>
                <p className="text-slate-800">{showDetails.notes || '-'}</p>
              </div>
              <div className="border-b border-slate-100 pb-4">
                <span className="text-slate-500 block mb-1">تاريخ الإنشاء:</span>
                <p className="text-slate-800">{new Date(showDetails.createdAt).toLocaleString('en-US')} ({showDetails.createdBy})</p>
                {showDetails.approvedBy && (
                  <>
                    <span className="text-slate-500 block mt-2 mb-1">الاعتماد:</span>
                    <p className="text-slate-800">{new Date(showDetails.approvedAt).toLocaleString('en-US')} ({showDetails.approvedBy})</p>
                  </>
                )}
                {showDetails.paidBy && (
                  <>
                    <span className="text-slate-500 block mt-2 mb-1">الدفع:</span>
                    <p className="text-slate-800">{new Date(showDetails.paidAt).toLocaleString('en-US')} ({showDetails.paidBy})</p>
                  </>
                )}
                {showDetails.canceledBy && (
                  <>
                    <span className="text-slate-500 block mt-2 mb-1">الإلغاء:</span>
                    <p className="text-slate-800">{new Date(showDetails.canceledAt).toLocaleString('en-US')} ({showDetails.canceledBy}) - السبب: {showDetails.cancelReason}</p>
                  </>
                )}
                {showDetails.rejectedBy && (
                  <>
                    <span className="text-slate-500 block mt-2 mb-1">الرفض:</span>
                    <p className="text-slate-800">{new Date(showDetails.rejectedAt).toLocaleString('en-US')} ({showDetails.rejectedBy}) - السبب: {showDetails.rejectReason}</p>
                  </>
                )}
              </div>
              {showDetails.attachmentData && (
                <div>
                  <span className="text-slate-500 block mb-2">المرفق:</span>
                  {showDetails.attachmentData.startsWith('data:image') ? (
                    <img src={showDetails.attachmentData} alt="مرفق" className="max-w-full h-auto rounded-lg border border-slate-200" />
                  ) : showDetails.attachmentData.startsWith('data:application/pdf') ? (
                    <div className="flex flex-col gap-2">
                      <iframe src={showDetails.attachmentData} className="w-full h-96 rounded-lg border border-slate-200" title="PDF Preview"></iframe>
                      <a href={showDetails.attachmentData} download={`attachment-${showDetails.id}.pdf`} className="text-blue-500 underline flex items-center gap-1 self-start">
                        <FileText className="w-4 h-4"/> تحميل المرفق PDF
                      </a>
                    </div>
                  ) : (
                    <a href={showDetails.attachmentData} download={`attachment-${showDetails.id}`} className="text-blue-500 underline flex items-center gap-1">
                      <FileText className="w-4 h-4"/> تحميل المرفق
                    </a>
                  )}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write(`
                    <html dir="rtl" lang="ar">
                      <head>
          <style>
            @import url('https://fonts.cdnfonts.com/css/ge-ss-two');
            @import url('https://fonts.cdnfonts.com/css/gotham-pro');
            * { font-family: 'GE SS Two', 'Gotham Pro', sans-serif !important; }
          </style>
                        <title>طباعة سند مصروف - ${showDetails.id}</title>
                        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">
                        <style>
                          ${sharedPrintStyles}
                          body {
                            padding: 20px;
                            box-sizing: border-box;
                          }
                          .print-container {
                            max-width: 800px;
                            margin: 0 auto;
                            display: flex;
                            flex-direction: column;
                            min-height: 95vh;
                          }
                          .content-wrapper {
                            flex-grow: 1;
                            margin-bottom: 40px;
                          }
                          .doc-title {
                            text-align: center;
                            color: #0072BC;
                            font-size: 22px;
                            font-weight: 800;
                            margin-top: 10px;
                            margin-bottom: 25px;
                            border-bottom: 1px dashed #cbd5e1;
                            padding-bottom: 12px;
                          }
                          table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 15px;
                            margin-bottom: 30px;
                          }
                          th, td {
                            border: 1px solid #e2e8f0;
                            padding: 12px 14px;
                            text-align: right;
                            font-size: 14px;
                          }
                          th {
                            background-color: #f8fafc;
                            color: #334155;
                            font-weight: 700;
                            width: 25%;
                          }
                          td {
                            color: #0f172a;
                          }
                          .signatures {
                            display: flex;
                            justify-content: space-between;
                            margin-top: 50px;
                            padding-top: 20px;
                            border-top: 1px solid #f1f5f9;
                          }
                          .signature-block {
                            width: 45%;
                          }
                          .signature-block p {
                            margin: 4px 0;
                            font-size: 13px;
                            color: #475569;
                          }
                        </style>
                      </head>
                      <body>
                        <div class="print-container">
                          <div class="content-wrapper">
                            ${sharedPrintHeader}
                            
                            <div class="doc-title">سند مصروف (#${showDetails.id})</div>
                            
                            <table>
                              <tbody>
                                <tr><th>رقم المصروف</th><td><strong>${showDetails.id}</strong></td></tr>
                                <tr><th>تاريخ القيد</th><td>${showDetails.date}</td></tr>
                                <tr><th>الحالة</th><td><span style="font-weight: bold; color: ${showDetails.status === 'مدفوع' ? '#16a34a' : showDetails.status === 'معتمد' ? '#2563eb' : '#ea580c'}">${showDetails.status}</span></td></tr>
                                <tr><th>نوع المصروف</th><td>${showDetails.expenseType}</td></tr>
                                <tr><th>الوصف</th><td>${showDetails.description}</td></tr>
                                <tr><th>المورد / الجهة</th><td>${showDetails.supplier || '-'}</td></tr>
                                <tr><th>المشروع المرتبط</th><td>${showDetails.projectName || '-'}</td></tr>
                                <tr><th>المبلغ الإجمالي</th><td><strong style="color: #e11d48; font-size: 16px;">${parseFloat(showDetails.amount).toLocaleString('en-US', {minimumFractionDigits: 2})} ر.س</strong></td></tr>
                                <tr><th>طريقة الدفع</th><td>${showDetails.paymentMethod}</td></tr>
                                <tr><th>رقم المرجع</th><td>${showDetails.reference || '-'}</td></tr>
                                <tr><th>ملاحظات</th><td>${showDetails.notes || '-'}</td></tr>
                              </tbody>
                            </table>
                            
                            <div class="signatures">
                              <div class="signature-block">
                                <p><strong>المنشئ والمدقق:</strong></p>
                                <p>الاسم: ${showDetails.createdBy || 'تلقائي'}</p>
                                <p>التاريخ: ${showDetails.createdAt ? new Date(showDetails.createdAt).toLocaleDateString('en-US') : showDetails.date}</p>
                                <p>التوقيع: ............................</p>
                              </div>
                              <div class="signature-block" style="text-align: left; direction: ltr;">
                                <p dir="rtl"><strong>الاعتماد والموافقة المعتمدة:</strong></p>
                                <p dir="rtl">الاسم: ${showDetails.approvedBy || '............................'}</p>
                                <p dir="rtl">التاريخ: ${showDetails.approvedAt ? new Date(showDetails.approvedAt).toLocaleDateString('en-US') : '............................'}</p>
                                <p dir="rtl">التوقيع والختم الرسمي: ............................</p>
                              </div>
                            </div>
                          </div>
                          
                          ${sharedPrintFooter}
                        </div>
                        
                        <script>
                          window.onload = () => {
                            window.print();
                            window.close();
                          }
                        </script>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                }
              }} className="px-6 py-2.5 text-[#0072BC] bg-blue-50 border border-blue-100 hover:bg-blue-100 font-bold rounded-xl transition flex items-center gap-2 shadow-sm">
                <Printer className="w-4 h-4" /> طباعة
              </button>
              <button onClick={() => setShowDetails(null)} className="px-6 py-2.5 text-white bg-slate-800 hover:bg-slate-900 font-bold rounded-xl transition shadow-sm">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Approve Confirmation Modal */}
      {approveConfirmItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setApproveConfirmItem(null)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 transition">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 text-emerald-600 mb-4">
              <div className="p-3 bg-emerald-50 rounded-full">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 font-sans">تأكيد اعتماد المصروف</h3>
                <p className="text-sm text-slate-500 font-sans">سيتم تثبيت المصروف واحتسابه مالياً</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl mb-6 text-sm text-slate-600 space-y-2 border border-slate-100 font-mono">
              <div className="flex justify-between">
                <span className="font-medium">رقم السجل:</span>
                <span className="font-mono font-bold text-slate-800">{approveConfirmItem.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">التاريخ:</span>
                <span className="text-slate-800">{approveConfirmItem.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">المبلغ:</span>
                <span className="font-bold text-rose-600">{Number(approveConfirmItem.amount).toLocaleString('en-US')} ر.س</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">النوع:</span>
                <span className="text-slate-800">{approveConfirmItem.expenseType}</span>
              </div>
              {approveConfirmItem.supplier && (
                <div className="flex justify-between">
                  <span className="font-medium">المورد:</span>
                  <span className="text-slate-800 text-left">{approveConfirmItem.supplier}</span>
                </div>
              )}
            </div>

            <p className="text-slate-600 text-sm mb-6 leading-relaxed text-right font-sans">
              عند اعتماد هذا المصروف، سيتم احتسابه ضمن المصروفات المعتمدة وترحيل أثره المالي. لن يمكن تعديله أو حذفه لاحقاً إلا بصلاحيات الإدارة العليا.
            </p>

            <div className="flex gap-3 justify-end">
              <button 
                disabled={processingId !== null} 
                onClick={() => setApproveConfirmItem(null)} 
                className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl transition font-sans"
              >
                إلغاء
              </button>
              <button 
                disabled={processingId !== null} 
                onClick={handleConfirmApprove} 
                className="px-5 py-2.5 text-white bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl transition shadow-md shadow-emerald-100 flex items-center gap-2 justify-center font-sans"
              >
                {processingId === approveConfirmItem.id && processingAction === "approve" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري الاعتماد...
                  </>
                ) : (
                  "نعم، اعتمد الآن"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full p-6 shadow-2xl relative animate-scaleUp">
            <button onClick={() => setDeleteConfirmItem(null)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 transition">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-3 bg-rose-50 rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">تأكيد حذف المصروف</h3>
                <p className="text-sm text-slate-500">لا يمكن التراجع عن هذا الإجراء</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl mb-6 text-sm text-slate-600 space-y-2 border border-slate-100">
              <div className="flex justify-between">
                <span className="font-medium">رقم المصروف:</span>
                <span className="font-mono font-bold text-slate-800">{deleteConfirmItem.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">التاريخ:</span>
                <span className="text-slate-800">{deleteConfirmItem.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">نوع المصروف:</span>
                <span className="text-slate-800">{deleteConfirmItem.expenseType}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">المبلغ:</span>
                <span className="font-bold text-rose-600">{parseFloat(deleteConfirmItem.amount).toLocaleString('en-US')} ر.س</span>
              </div>
              {deleteConfirmItem.supplier && (
                <div className="flex justify-between">
                  <span className="font-medium">المورد:</span>
                  <span className="text-slate-800 text-left">{deleteConfirmItem.supplier}</span>
                </div>
              )}
            </div>

            <p className="text-slate-600 text-sm mb-6">
              هل أنت متأكد تماماً من رغبتك في حذف هذا السجل بشكل نهائي من قاعدة البيانات؟
            </p>

            <div className="flex gap-3 justify-end">
              <button 
                disabled={processingId !== null} 
                onClick={() => setDeleteConfirmItem(null)} 
                className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl transition"
              >
                إلغاء
              </button>
              <button 
                disabled={processingId !== null} 
                onClick={handleConfirmDelete} 
                className="px-5 py-2.5 text-white bg-rose-600 hover:bg-rose-700 font-bold rounded-xl transition shadow-md shadow-rose-100 flex items-center gap-2 justify-center"
              >
                {processingId === deleteConfirmItem.id && processingAction === "delete" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري الحذف...
                  </>
                ) : (
                  "نعم، احذف الآن"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
