import React, { useState, useEffect } from "react";
import { PlusCircle, Search, Filter, Eye, Edit, CheckCircle, XCircle, Printer, FileText, Trash2, X, Upload } from "lucide-react";
import { User } from "../../types";
import { hasAdvancedPermission } from "../../lib/permissions";

interface JournalEntryProps {
  lang: "ar" | "en";
  user: User;
}

export default function JournalEntries({ lang, user }: JournalEntryProps) {
  const [entries, setEntries] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // State for Add Modal
  const [entryForm, setEntryForm] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "",
    status: "مسودة",
    debitAccount: "",
    creditAccount: "",
    amount: "",
    reference: "",
    project: "",
    attachment: null as File | null,
    description: "",
    notes: ""
  });
  
  const [formError, setFormError] = useState("");

  const accounts = [
    "الصندوق", "البنك", "العملاء", "الموردون", "المخزون", 
    "مصروف رواتب", "مصروف إيجار", "مصروف مشتريات مواد", 
    "مصروف تشغيل", "إيرادات مبيعات", "إيرادات خدمات", 
    "رواتب مستحقة", "ضريبة القيمة المضافة", "ضريبة القيمة المضافة المستحقة"
  ];

  const types = [
    "قيد إيراد", "قيد مصروف", "قيد تحصيل عميل", "قيد دفع مورد", 
    "قيد رواتب", "قيد ضريبة", "قيد تحويل بين الصندوق والبنك", 
    "قيد تسوية", "قيد تصحيحي", "قيد افتتاحي", "قيد إغلاق", "أخرى"
  ];

  const canAddEntry = hasAdvancedPermission(user, 'finance', 'journal', 'add_entry');
  const canSubmitApproval = hasAdvancedPermission(user, 'finance', 'journal', 'submit_approval');
  const canApprove = hasAdvancedPermission(user, 'finance', 'journal', 'approve_entry');
  const canViewProjects = hasAdvancedPermission(user, 'finance', 'journal', 'view_projects');
  const canUploadAttachment = hasAdvancedPermission(user, 'finance', 'journal', 'upload_attachment');

  const handleCloseModal = () => {
    const isFormEdited = entryForm.type || entryForm.debitAccount || entryForm.creditAccount || entryForm.amount || entryForm.description;
    if (isFormEdited) {
      if (confirm("لديك بيانات غير محفوظة، هل تريد إغلاق النافذة؟")) {
        setShowAddModal(false);
      }
    } else {
      setShowAddModal(false);
    }
  };

  const validateForm = () => {
    if (!entryForm.date) return "يرجى اختيار تاريخ القيد.";
    if (!entryForm.type) return "يرجى اختيار نوع القيد.";
    if (!entryForm.debitAccount) return "يرجى اختيار الحساب المدين.";
    if (!entryForm.creditAccount) return "يرجى اختيار الحساب الدائن.";
    if (entryForm.debitAccount === entryForm.creditAccount) return "لا يمكن أن يكون الحساب المدين نفس الحساب الدائن.";
    if (!entryForm.amount || Number(entryForm.amount) <= 0) return "يرجى إدخال مبلغ صحيح أكبر من صفر.";
    if (!entryForm.description.trim()) return "يرجى كتابة وصف القيد.";
    return "";
  };

  const handleSave = (status: string) => {
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }
    
    // Simulate save
    const newId = "JE-2026-" + String(entries.length + 1).padStart(4, '0');
    const newEntry = {
      id: newId,
      ...entryForm,
      status,
      createdBy: user.username,
      updatedAt: new Date().toISOString()
    };
    
    setEntries([newEntry, ...entries]);
    setShowAddModal(false);
    
    let actionType = "إنشاء قيد مسودة";
    if (status === "بانتظار اعتماد") actionType = "إرسال قيد للاعتماد";
    if (status === "معتمد") actionType = "إنشاء واعتماد قيد";
    
    console.log("Audit Log Recorded:", {
      username: user.username,
      timestamp: new Date().toISOString(),
      entryId: newId,
      actionType
    });
    
    if (status === "مسودة") alert("تم حفظ القيد كمسودة بنجاح.");
    else if (status === "بانتظار اعتماد") alert("تم حفظ القيد وإرساله للاعتماد.");
    else if (status === "معتمد") alert("تم حفظ واعتماد القيد بنجاح.");
    
    // Reset form
    setEntryForm({
      date: new Date().toISOString().split("T")[0],
      type: "",
      status: "مسودة",
      debitAccount: "",
      creditAccount: "",
      amount: "",
      reference: "",
      project: "",
      attachment: null,
      description: "",
      notes: ""
    });
    setFormError("");
  };

  const confirmApprove = () => {
    if (confirm("هل أنت متأكد من حفظ واعتماد هذا القيد؟ بعد الاعتماد لن يمكن تعديله إلا بصلاحية خاصة.")) {
      handleSave("معتمد");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Summary Cards */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">القيود اليومية</h2>
        {canAddEntry && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-5 h-5" /> إضافة قيد يومي
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: "إجمالي القيود", value: entries.length, color: "bg-blue-50 text-blue-700 border-blue-200" },
          { label: "قيود اليوم", value: entries.filter(e => e.date === new Date().toISOString().split("T")[0]).length, color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
          { label: "هذا الشهر", value: 0, color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
          { label: "بانتظار الاعتماد", value: entries.filter(e => e.status === "بانتظار اعتماد").length, color: "bg-amber-50 text-amber-700 border-amber-200" },
          { label: "معتمدة", value: entries.filter(e => e.status === "معتمد").length, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
          { label: "ملغاة", value: entries.filter(e => e.status === "ملغي").length, color: "bg-rose-50 text-rose-700 border-rose-200" }
        ].map((stat, i) => (
          <div key={i} className={`p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all ${stat.color}`}>
            <p className="text-sm font-bold opacity-80">{stat.label}</p>
            <p className="text-2xl font-black mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute right-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="بحث برقم القيد، الوصف، المرجع..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50">
          <Filter className="w-4 h-4" /> فلاتر
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 border-b text-slate-600 font-bold">
              <tr>
                <th className="p-4">رقم القيد</th>
                <th className="p-4">تاريخ القيد</th>
                <th className="p-4">النوع</th>
                <th className="p-4">وصف القيد</th>
                <th className="p-4">الحساب المدين</th>
                <th className="p-4">الحساب الدائن</th>
                <th className="p-4">المبلغ</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">لا توجد قيود يومية مسجلة</td>
                </tr>
              ) : (
                entries.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-4 font-mono text-blue-600 font-bold">{entry.id}</td>
                    <td className="p-4">{entry.date}</td>
                    <td className="p-4 text-slate-600">{entry.type}</td>
                    <td className="p-4">{entry.description}</td>
                    <td className="p-4 text-rose-600">{entry.debitAccount}</td>
                    <td className="p-4 text-emerald-600">{entry.creditAccount}</td>
                    <td className="p-4 font-bold">{Number(entry.amount).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        entry.status === 'معتمد' ? 'bg-emerald-100 text-emerald-700' :
                        entry.status === 'بانتظار اعتماد' ? 'bg-amber-100 text-amber-700' :
                        entry.status === 'ملغي' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="p-4 flex items-center gap-1">
                      <button className="text-slate-500 hover:bg-slate-100 p-1.5 rounded transition-colors" title="عرض التفاصيل"><Eye className="w-4 h-4" /></button>
                      {hasAdvancedPermission(user, 'finance', 'journal', 'edit_entry') && <button className="text-blue-500 hover:bg-blue-50 p-1.5 rounded transition-colors" title="تعديل"><Edit className="w-4 h-4" /></button>}
                      {hasAdvancedPermission(user, 'finance', 'journal', 'approve_entry') && entry.status !== 'معتمد' && <button className="text-emerald-500 hover:bg-emerald-50 p-1.5 rounded transition-colors" title="اعتماد"><CheckCircle className="w-4 h-4" /></button>}
                      {hasAdvancedPermission(user, 'finance', 'journal', 'cancel_entry') && entry.status !== 'ملغي' && <button className="text-amber-500 hover:bg-amber-50 p-1.5 rounded transition-colors" title="إلغاء"><XCircle className="w-4 h-4" /></button>}
                      {hasAdvancedPermission(user, 'finance', 'journal', 'print_entry') && <button className="text-indigo-500 hover:bg-indigo-50 p-1.5 rounded transition-colors" title="طباعة"><Printer className="w-4 h-4" /></button>}
                      {hasAdvancedPermission(user, 'finance', 'journal', 'export_pdf') && <button className="text-rose-500 hover:bg-rose-50 p-1.5 rounded transition-colors" title="تصدير PDF"><FileText className="w-4 h-4" /></button>}
                      {hasAdvancedPermission(user, 'finance', 'journal', 'delete_entry') && <button className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors" title="حذف"><Trash2 className="w-4 h-4" /></button>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">إضافة قيد يومي جديد +</h3>
                <p className="text-sm text-slate-500 mt-1">قم بتسجيل قيد محاسبي جديد مع تحديد الحساب المدين والدائن والمبلغ.</p>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-white space-y-6">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold rounded-lg mb-4">
                  {formError}
                </div>
              )}

              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">رقم القيد</label>
                  <input type="text" disabled value="تلقائي (مثل JE-2026-0001)" className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ القيد <span className="text-rose-500">*</span></label>
                  <input type="date" value={entryForm.date} onChange={(e) => setEntryForm({...entryForm, date: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">نوع القيد <span className="text-rose-500">*</span></label>
                  <select value={entryForm.type} onChange={(e) => setEntryForm({...entryForm, type: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">اختر النوع</option>
                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">الحالة</label>
                  <input type="text" disabled value={entryForm.status} className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-sm font-bold" />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-sm font-bold text-rose-700 mb-2">الحساب المدين <span className="text-rose-500">*</span></label>
                  <select value={entryForm.debitAccount} onChange={(e) => setEntryForm({...entryForm, debitAccount: e.target.value})} className="w-full p-2.5 border border-rose-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none bg-white">
                    <option value="">اختر الحساب المدين</option>
                    {accounts.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-emerald-700 mb-2">الحساب الدائن <span className="text-rose-500">*</span></label>
                  <select value={entryForm.creditAccount} onChange={(e) => setEntryForm({...entryForm, creditAccount: e.target.value})} className="w-full p-2.5 border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                    <option value="">اختر الحساب الدائن</option>
                    {accounts.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">المبلغ <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold">SAR</span>
                    <input type="number" min="0.01" step="0.01" placeholder="0.00" value={entryForm.amount} onChange={(e) => setEntryForm({...entryForm, amount: e.target.value})} className="w-full p-2.5 pl-12 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-left font-mono font-bold" dir="ltr" />
                  </div>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">المرجع</label>
                  <input type="text" placeholder="رقم فاتورة، سند..." value={entryForm.reference} onChange={(e) => setEntryForm({...entryForm, reference: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                {canViewProjects && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">المشروع المرتبط</label>
                    <select value={entryForm.project} onChange={(e) => setEntryForm({...entryForm, project: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">بدون مشروع</option>
                      <option value="p1">مشروع توريد لوحات</option>
                      <option value="p2">مشروع صيانة</option>
                    </select>
                  </div>
                )}
                {canUploadAttachment && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">المرفق</label>
                    <div 
                      className="flex items-center gap-2 w-full p-1.5 border border-dashed border-slate-300 rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => {
                        console.log("Audit Log Recorded:", {
                          username: user.username,
                          timestamp: new Date().toISOString(),
                          entryId: "Draft",
                          actionType: "رفع مرفق قيد"
                        });
                        alert("تم رفع المرفق وتسجيل العملية في السجل.");
                      }}
                    >
                      <div className="bg-white p-2 rounded shadow-sm border text-slate-600"><Upload className="w-4 h-4" /></div>
                      <span className="text-xs text-slate-500">رفع فاتورة أو إيصال (اختياري)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">وصف القيد <span className="text-rose-500">*</span></label>
                  <textarea rows={2} placeholder="وصف مختصر لسبب القيد المحاسبي..." value={entryForm.description} onChange={(e) => setEntryForm({...entryForm, description: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات (اختياري)</label>
                  <textarea rows={2} placeholder="تفاصيل إضافية لا تظهر في التقارير..." value={entryForm.notes} onChange={(e) => setEntryForm({...entryForm, notes: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <button onClick={handleCloseModal} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors">
                إلغاء
              </button>
              
              <div className="flex items-center gap-3">
                {canAddEntry && (
                  <button onClick={() => handleSave("مسودة")} className="px-6 py-2.5 text-slate-700 bg-white border border-slate-300 font-bold hover:bg-slate-50 rounded-lg transition-colors shadow-sm">
                    حفظ كمسودة
                  </button>
                )}
                {canSubmitApproval && (
                  <button onClick={() => handleSave("بانتظار اعتماد")} className="px-6 py-2.5 text-blue-700 bg-blue-50 border border-blue-200 font-bold hover:bg-blue-100 rounded-lg transition-colors shadow-sm">
                    حفظ وإرسال للاعتماد
                  </button>
                )}
                {canApprove && (
                  <button onClick={confirmApprove} className="px-6 py-2.5 text-white bg-emerald-600 font-bold hover:bg-emerald-700 rounded-lg transition-colors shadow-sm flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" /> حفظ واعتماد
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
