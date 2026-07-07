import React, { useState, useEffect } from "react";
import { PlusCircle, Search, Filter, Eye, Edit, CheckCircle, XCircle, Printer, FileText, Trash2, X, Upload } from "lucide-react";
import { User } from "../../types";
import { hasAdvancedPermission } from "../../lib/permissions";
import { sharedPrintHeader, sharedPrintFooter, sharedPrintStyles } from "../../utils/PrintShared";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";

interface JournalEntryProps {
  lang: "ar" | "en";
  user: User;
}

export default function JournalEntries({ lang, user }: JournalEntryProps) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEntryId, setEditingEntryId] = useState("");
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<any>(null);
  const [approveConfirmItem, setApproveConfirmItem] = useState<any>(null);

  const [cashBoxes, setCashBoxes] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);

  const filteredEntries = entries.filter((e) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      e.id?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.reference?.toLowerCase().includes(q) ||
      e.sourceModule?.toLowerCase().includes(q) ||
      e.sourceRecordId?.toLowerCase().includes(q);
    const matchesMonth = filterMonth ? e.date?.startsWith(filterMonth) : true;
    return matchesSearch && matchesMonth;
  });

  useEffect(() => {
    fetchEntries();
    fetchCashBoxesAndBankAccounts();
  }, []);

  const fetchCashBoxesAndBankAccounts = async () => {
    try {
      const cbRes = await fetch("/api/dynamic/cash_boxes");
      if (cbRes.ok) {
        const cbData = await cbRes.json();
        setCashBoxes(cbData);
      }

      const baRes = await fetch("/api/dynamic/bank_accounts");
      if (baRes.ok) {
        const baData = await baRes.json();
        setBankAccounts(baData);
      }
    } catch (err) {
      console.error("Error fetching sub accounts: ", err);
    }
  };

  const fetchEntries = async () => {
    try {
      const res = await fetch("/api/journal-entries");
      if (res.ok) {
        const data = await res.json();
        data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setEntries(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // State for Add Modal
  const [entryForm, setEntryForm] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "",
    status: "مسودة",
    debitAccount: "",
    creditAccount: "",
    debitSubId: "",
    creditSubId: "",
    amount: "",
    reference: "",
    project: "",
    attachment: null as File | null,
    attachmentData: "",
    attachmentType: "",
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
    setShowAddModal(false);
    setEditingEntryId("");
    setEntryForm({
      date: new Date().toISOString().split("T")[0],
      type: "",
      status: "مسودة",
      debitAccount: "",
      creditAccount: "",
      debitSubId: "",
      creditSubId: "",
      amount: "",
      reference: "",
      project: "",
      attachment: null,
      attachmentData: "",
      attachmentType: "",
      description: "",
      notes: ""
    });
    setFormError("");
  };

  const validateForm = () => {
    if (!entryForm.date) return "يرجى اختيار تاريخ القيد.";
    if (!entryForm.type) return "يرجى اختيار نوع القيد.";
    if (!entryForm.debitAccount) return "يرجى اختيار الحساب المدين.";
    if (!entryForm.creditAccount) return "يرجى اختيار الحساب الدائن.";
    if (entryForm.debitAccount === entryForm.creditAccount) return "لا يمكن أن يكون الحساب المدين نفس الحساب الدائن.";
    if (!entryForm.amount || Number(entryForm.amount) <= 0) return "يرجى إدخال مبلغ صحيح أكبر من صفر.";

    if (entryForm.debitAccount === "الصندوق" && !entryForm.debitSubId) {
      return "يرجى اختيار الصندوق للحساب المدين.";
    }
    if (entryForm.debitAccount === "البنك" && !entryForm.debitSubId) {
      return "يرجى اختيار الحساب البنكي للحساب المدين.";
    }
    if (entryForm.creditAccount === "الصندوق" && !entryForm.creditSubId) {
      return "يرجى اختيار الصندوق للحساب الدائن.";
    }
    if (entryForm.creditAccount === "البنك" && !entryForm.creditSubId) {
      return "يرجى اختيار الحساب البنكي للحساب الدائن.";
    }

    if (!entryForm.description.trim()) return "يرجى كتابة وصف القيد.";
    return "";
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSave = async (status: string) => {
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }
    
    let base64File = entryForm.attachmentData;
    let fileType = entryForm.attachmentType;
    if (entryForm.attachment) {
      base64File = await fileToBase64(entryForm.attachment);
      fileType = entryForm.attachment.type;
    }

    const payload = {
      ...entryForm,
      attachment: undefined,
      attachmentData: base64File,
      attachmentType: fileType,
      status,
      createdBy: user.username,
      updatedAt: new Date().toISOString()
    };

    try {
      const url = editingEntryId ? `/api/journal-entries/${editingEntryId}` : "/api/journal-entries";
      const method = editingEntryId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchEntries();
        setShowAddModal(false);
        if (status === "مسودة") alert("تم حفظ القيد كمسودة بنجاح.");
        else if (status === "بانتظار اعتماد") alert("تم حفظ القيد وإرساله للاعتماد.");
        else if (status === "معتمد") alert("تم حفظ واعتماد القيد بنجاح.");
        setEditingEntryId("");
        setEntryForm({
          date: new Date().toISOString().split("T")[0],
          type: "",
          status: "مسودة",
          debitAccount: "",
          creditAccount: "",
          debitSubId: "",
          creditSubId: "",
          amount: "",
          reference: "",
          project: "",
          attachment: null,
          attachmentData: "",
          attachmentType: "",
          description: "",
          notes: ""
        });
        setFormError("");
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الحفظ");
    }
  };

  const [testing, setTesting] = useState(false);

  const handleTestCreate = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/journal-entries/test-create", {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        alert(`تم إنشاء القيد التجريبي بنجاح! رقم القيد: ${data.jvId}\nالمدين: الصندوق بقيمة 100 ر.س\nالدائن: الإيرادات بقيمة 100 ر.س`);
        fetchEntries();
      } else {
        const data = await res.json();
        alert(`فشل إنشاء القيد التجريبي: ${data.error}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`خطأ: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleEdit = (entry: any) => {
    setEditingEntryId(entry.id);
    setEntryForm({
      date: entry.date || "",
      type: entry.type || "",
      status: entry.status || "مسودة",
      debitAccount: entry.debitAccount || "",
      creditAccount: entry.creditAccount || "",
      debitSubId: entry.debitSubId || "",
      creditSubId: entry.creditSubId || "",
      amount: entry.amount || "",
      reference: entry.reference || "",
      project: entry.project || "",
      attachment: null,
      attachmentData: entry.attachmentData || "",
      attachmentType: entry.attachmentType || "",
      description: entry.description || "",
      notes: entry.notes || ""
    });
    setShowAddModal(true);
  };

  const isAdmin = (u: User) => {
    const un = u.username?.toLowerCase() || '';
    const rn = u.role?.toLowerCase() || '';
    return un === 'feras' || un === 'admin' || rn === 'super admin' || rn === 'general admin director' || rn.includes('الادارة العليا') || rn === 'senior management';
  };

  const handleDelete = (entry: any) => {
    setDeleteConfirmItem(entry);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    if (deleteConfirmItem.status === "معتمد" && !isAdmin(user)) {
      return; // Handled in UI (button disabled)
    }
    try {
      const res = await fetch(`/api/journal-entries/${deleteConfirmItem.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "فشل إلغاء أو حذف القيد اليومي.");
        return;
      }
      setDeleteConfirmItem(null);
      fetchEntries();
    } catch (err) {
      console.error(err);
      alert("حدث خطأ غير متوقع أثناء معالجة القيد المحاسبي.");
    }
  };

  const handlePrintPdf = (entry: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html dir="${lang === "ar" ? "rtl" : "ltr"}">
        <head>
          <style>
            @import url('https://fonts.cdnfonts.com/css/ge-ss-two');
            @import url('https://fonts.cdnfonts.com/css/gotham-pro');
            * { font-family: 'GE SS Two', 'Gotham Pro', sans-serif !important; }
          </style>
          <title>قيد يومي - ${entry.id}</title>
          <style>${sharedPrintStyles}</style>
          <style>
            body { font-family: 'GE SS Two', 'Gotham Pro', sans-serif; background: white; margin: 0; padding: 20px; color: #1e293b; font-size: 14px; }
            .entry-header { display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #0072BC; }
            .info-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
            .label { font-size: 12px; color: #64748b; font-weight: bold; margin-bottom: 4px; display: block; }
            .value { font-size: 15px; color: #0f172a; font-weight: bold; }
            .accounts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .account-box { padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .account-box.debit { background: #fff1f2; border-color: #fecdd3; }
            .account-box.credit { background: #ecfdf5; border-color: #a7f3d0; }
            .amount { font-size: 24px; font-weight: 900; margin-top: 10px; text-align: center; }
          </style>
        </head>
        <body>
          ${sharedPrintHeader}
          <h2 style="text-align: center; color: #0072BC; margin: 30px 0;">قيد يومي (Journal Entry)</h2>
          
          <div class="entry-header">
            <div>
              <span class="label">رقم القيد</span>
              <span class="value" style="color: #0072BC; font-size: 18px;">${entry.id}</span>
            </div>
            <div style="text-align: left;">
              <span class="label">تاريخ القيد</span>
              <span class="value">${entry.date}</span>
            </div>
          </div>

          <div class="info-box">
            <div class="info-grid">
              <div>
                <span class="label">نوع القيد</span>
                <span class="value">${entry.type}</span>
              </div>
              <div>
                <span class="label">حالة القيد</span>
                <span class="value">${entry.status}</span>
              </div>
              <div style="grid-column: span 2;">
                <span class="label">وصف القيد</span>
                <span class="value">${entry.description}</span>
              </div>
            </div>
          </div>

          <div class="accounts-grid">
            <div class="account-box debit">
              <span class="label" style="color: #be123c;">الحساب المدين (Debit)</span>
              <span class="value" style="color: #881337; font-size: 18px;">${entry.debitAccount}</span>
              <div class="amount" style="color: #be123c;">${Number(entry.amount).toLocaleString('en-US')} SAR</div>
            </div>
            <div class="account-box credit">
              <span class="label" style="color: #047857;">الحساب الدائن (Credit)</span>
              <span class="value" style="color: #064e3b; font-size: 18px;">${entry.creditAccount}</span>
              <div class="amount" style="color: #047857;">${Number(entry.amount).toLocaleString('en-US')} SAR</div>
            </div>
          </div>

          ${entry.reference ? `
          <div class="info-box">
            <span class="label">المرجع</span>
            <span class="value">${entry.reference}</span>
          </div>
          ` : ''}

          ${entry.notes ? `
          <div class="info-box">
            <span class="label">ملاحظات</span>
            <span class="value">${entry.notes}</span>
          </div>
          ` : ''}
          
          ${sharedPrintFooter}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  const confirmApprove = () => {
    if (confirm("هل أنت متأكد من حفظ واعتماد هذا القيد؟ بعد الاعتماد لن يمكن تعديله إلا بصلاحية خاصة.")) {
      handleSave("معتمد");
    }
  };

  const handleApprove = (entry: any) => {
    setApproveConfirmItem(entry);
  };

  const handleConfirmApprove = async () => {
    if (!approveConfirmItem) return;
    try {
      await fetch(`/api/journal-entries/${approveConfirmItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...approveConfirmItem, status: "معتمد" })
      });
      setApproveConfirmItem(null);
      fetchEntries();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Summary Cards */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">القيود اليومية</h2>
        <div className="flex gap-2">
          <button
            onClick={handleTestCreate}
            disabled={testing}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {testing ? "جاري الإنشاء..." : "Test Create Journal Entry"}
          </button>
          {canAddEntry && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="w-5 h-5" /> إضافة قيد يومي
            </button>
          )}
        </div>
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
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="w-full md:w-48 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
                <th className="p-4">نموذج المصدر</th>
                <th className="p-4">سجل المصدر</th>
                <th className="p-4">وصف القيد</th>
                <th className="p-4">إجمالي المدين</th>
                <th className="p-4">إجمالي الدائن</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">لا توجد قيود يومية مسجلة</td>
                </tr>
              ) : (
                filteredEntries.map((entry, idx) => {
                  const getSourceModuleLabel = (mod: string) => {
                    switch (mod) {
                      case "revenues": return "الإيرادات";
                      case "expenses": return "المصروفات";
                      case "customer_invoices": return "فواتير العملاء";
                      case "supplier_invoices": return "فواتير الموردين";
                      case "payments": return "المدفوعات والقبض";
                      case "payroll": return "الرواتب والأجور";
                      case "test_debug": return "فحص تجريبي 🧪";
                      default: return "قيد يدوي";
                    }
                  };

                  const totalDebit = Number(entry.totalDebit || entry.amount || 0);
                  const totalCredit = Number(entry.totalCredit || entry.amount || 0);

                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-4 font-mono text-blue-600 font-bold">{entry.id}</td>
                      <td className="p-4 text-slate-600">{entry.date}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          entry.sourceModule ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-600'
                        }`}>
                          {getSourceModuleLabel(entry.sourceModule)}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-600">{entry.sourceRecordId || "-"}</td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{entry.description}</div>
                        {(entry.debitAccount || entry.creditAccount) && (
                          <div className="text-xs text-slate-400 mt-1">
                            {entry.debitAccount} (مدين) ➔ {entry.creditAccount} (دائن)
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-bold text-rose-600">
                        {totalDebit.toLocaleString('en-US')}
                      </td>
                      <td className="p-4 font-bold text-emerald-600">
                        {totalCredit.toLocaleString('en-US')}
                      </td>
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
                        {entry.attachmentData && <button onClick={() => setPreviewFile(entry.attachmentData)} className="text-purple-500 hover:bg-purple-50 p-1.5 rounded transition-colors" title="معاينة المرفق"><Eye className="w-4 h-4" /></button>}
                        {hasAdvancedPermission(user, 'finance', 'journal', 'edit_entry') && <button onClick={() => handleEdit(entry)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded transition-colors" title="تعديل"><Edit className="w-4 h-4" /></button>}
                        {entry.status !== 'معتمد' && (
                          <button 
                            onClick={() => handleApprove(entry)} 
                            className="text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg transition active:scale-95 duration-100" 
                            title="اعتماد"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {hasAdvancedPermission(user, 'finance', 'journal', 'print_entry') && <button onClick={() => handlePrintPdf(entry)} className="text-indigo-500 hover:bg-indigo-50 p-1.5 rounded transition-colors" title="طباعة"><Printer className="w-4 h-4" /></button>}
                        <button onClick={() => handleDelete(entry)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition active:scale-95 duration-100" title="حذف"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  );
                })
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
                <h3 className="text-xl font-bold text-slate-800">{editingEntryId ? "تعديل قيد يومي" : "إضافة قيد يومي جديد +"}</h3>
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
                  <input type="text" disabled value={editingEntryId || "تلقائي (مثل JV26060001)"} className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-sm font-mono" />
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
                  <select value={entryForm.debitAccount} onChange={(e) => setEntryForm({...entryForm, debitAccount: e.target.value, debitSubId: ""})} className="w-full p-2.5 border border-rose-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none bg-white">
                    <option value="">اختر الحساب المدين</option>
                    {accounts.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  {entryForm.debitAccount === "الصندوق" && (
                    <div className="mt-3">
                      <label className="block text-xs font-bold text-rose-600 mb-1">اختر الصندوق المدين <span className="text-rose-500">*</span></label>
                      <select value={entryForm.debitSubId} onChange={(e) => setEntryForm({...entryForm, debitSubId: e.target.value})} className="w-full p-2 border border-rose-300 rounded-lg text-xs outline-none bg-white">
                        <option value="">اختر الصندوق...</option>
                        {cashBoxes.map(b => <option key={b.id} value={b.id}>{lang === "ar" ? b.name_ar : b.name_en} ({b.code})</option>)}
                      </select>
                    </div>
                  )}
                  {entryForm.debitAccount === "البنك" && (
                    <div className="mt-3">
                      <label className="block text-xs font-bold text-rose-600 mb-1">اختر الحساب البنكي المدين <span className="text-rose-500">*</span></label>
                      <select value={entryForm.debitSubId} onChange={(e) => setEntryForm({...entryForm, debitSubId: e.target.value})} className="w-full p-2 border border-rose-300 rounded-lg text-xs outline-none bg-white">
                        <option value="">اختر الحساب البنكي...</option>
                        {bankAccounts.map(b => <option key={b.id} value={b.id}>{lang === "ar" ? b.bank_name_ar : b.bank_name_en} - {b.account_number}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-emerald-700 mb-2">الحساب الدائن <span className="text-rose-500">*</span></label>
                  <select value={entryForm.creditAccount} onChange={(e) => setEntryForm({...entryForm, creditAccount: e.target.value, creditSubId: ""})} className="w-full p-2.5 border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                    <option value="">اختر الحساب الدائن</option>
                    {accounts.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  {entryForm.creditAccount === "الصندوق" && (
                    <div className="mt-3">
                      <label className="block text-xs font-bold text-emerald-600 mb-1">اختر الصندوق الدائن <span className="text-rose-500">*</span></label>
                      <select value={entryForm.creditSubId} onChange={(e) => setEntryForm({...entryForm, creditSubId: e.target.value})} className="w-full p-2 border border-emerald-300 rounded-lg text-xs outline-none bg-white">
                        <option value="">اختر الصندوق...</option>
                        {cashBoxes.map(b => <option key={b.id} value={b.id}>{lang === "ar" ? b.name_ar : b.name_en} ({b.code})</option>)}
                      </select>
                    </div>
                  )}
                  {entryForm.creditAccount === "البنك" && (
                    <div className="mt-3">
                      <label className="block text-xs font-bold text-emerald-600 mb-1">اختر الحساب البنكي الدائن <span className="text-rose-500">*</span></label>
                      <select value={entryForm.creditSubId} onChange={(e) => setEntryForm({...entryForm, creditSubId: e.target.value})} className="w-full p-2 border border-emerald-300 rounded-lg text-xs outline-none bg-white">
                        <option value="">اختر الحساب البنكي...</option>
                        {bankAccounts.map(b => <option key={b.id} value={b.id}>{lang === "ar" ? b.bank_name_ar : b.bank_name_en} - {b.account_number}</option>)}
                      </select>
                    </div>
                  )}
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
                    <label className="block text-sm font-bold text-slate-700 mb-2">المرفق (اختياري)</label>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setEntryForm({...entryForm, attachment: e.target.files[0]});
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {entryForm.attachmentData && !entryForm.attachment && (
                       <div className="mt-2 text-xs text-emerald-600 font-bold">يوجد مرفق محفوظ مسبقاً</div>
                    )}
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

      {/* Attachment Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">معاينة المرفق</h3>
              <button onClick={() => setPreviewFile(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex justify-center bg-slate-100">
              {previewFile.startsWith("data:application/pdf") ? (
                <iframe src={previewFile} className="w-full h-full min-h-[60vh] border-0 rounded-lg shadow-inner" />
              ) : (
                <img src={previewFile} alt="مرفق" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setDeleteConfirmItem(null)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 transition">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-3 bg-rose-50 rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {deleteConfirmItem.status === "معتمد" ? "تأكيد إلغاء وعكس القيد اليومي" : "تأكيد حذف مسودة القيد"}
                </h3>
                <p className="text-sm text-slate-500">
                  {deleteConfirmItem.status === "معتمد" ? "سيتم عكس التأثيرات المالية بالكامل" : "لا يمكن التراجع عن هذا الإجراء"}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl mb-6 text-sm text-slate-600 space-y-2 border border-slate-100">
              <div className="flex justify-between">
                <span className="font-medium">رقم القيد:</span>
                <span className="font-mono font-bold text-slate-800">{deleteConfirmItem.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">التاريخ:</span>
                <span className="text-slate-800">{deleteConfirmItem.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">النوع:</span>
                <span className="text-slate-800">{deleteConfirmItem.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">المبلغ:</span>
                <span className="font-bold text-rose-600">{Number(deleteConfirmItem.amount).toLocaleString('en-US')} ر.س</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">الحالة:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  deleteConfirmItem.status === 'معتمد' ? 'bg-emerald-100 text-emerald-700' :
                  deleteConfirmItem.status === 'بانتظار اعتماد' ? 'bg-amber-100 text-amber-700' :
                  deleteConfirmItem.status === 'ملغي' ? 'bg-rose-100 text-rose-700' :
                  'bg-slate-100 text-slate-700'
                }`}>{deleteConfirmItem.status}</span>
              </div>
            </div>

            {deleteConfirmItem.status === "معتمد" && isAdmin(user) ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs mb-6 leading-relaxed">
                تنبيه: هذا القيد معتمد ومثبت محاسبياً. بدلاً من حذفه بشكل نهائي، سيقوم النظام تلقائياً بإنشاء حركة عكسية وإلغائه محاسبياً للحفاظ على سلامة القيود والتسلسل المالي للتدقيق القانوني.
              </div>
            ) : deleteConfirmItem.status === "معتمد" && !isAdmin(user) ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs mb-6 leading-relaxed">
                عذراً، هذا القيد اليومي معتمد ومثبت محاسبياً. لا يمكن إلغاء القيود المعتمدة إلا من قبل الإدارة العليا أو المخولين بالصلاحيات الإدارية الكاملة.
              </div>
            ) : (
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                هل أنت متأكد تماماً من رغبتك في حذف مسودة هذا القيد اليومي بشكل نهائي من قاعدة البيانات؟
              </p>
            )}

            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirmItem(null)} className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl transition">
                إلغاء
              </button>
              <button 
                onClick={handleConfirmDelete} 
                disabled={deleteConfirmItem.status === "معتمد" && !isAdmin(user)}
                className={`px-5 py-2.5 text-white font-bold rounded-xl transition shadow-md ${
                  deleteConfirmItem.status === "معتمد" && !isAdmin(user)
                    ? "bg-slate-300 cursor-not-allowed shadow-none"
                    : "bg-rose-600 hover:bg-rose-700 shadow-rose-100"
                }`}
              >
                {deleteConfirmItem.status === "معتمد" ? "نعم، الغِ واعكس القيد" : "نعم، احذف المسودة"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Approve Confirmation Modal */}
      {approveConfirmItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setApproveConfirmItem(null)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 transition">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 text-emerald-600 mb-4">
              <div className="p-3 bg-emerald-50 rounded-full">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">تأكيد اعتماد القيد اليومي</h3>
                <p className="text-sm text-slate-500">سيتم تثبيت القيد وترحيله للحسابات</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl mb-6 text-sm text-slate-600 space-y-2 border border-slate-100">
              <div className="flex justify-between">
                <span className="font-medium">رقم القيد:</span>
                <span className="font-mono font-bold text-slate-800">{approveConfirmItem.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">التاريخ:</span>
                <span className="text-slate-800">{approveConfirmItem.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">الحساب المدين:</span>
                <span className="text-rose-600 font-medium">{approveConfirmItem.debitAccount}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">الحساب الدائن:</span>
                <span className="text-emerald-600 font-medium">{approveConfirmItem.creditAccount}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">المبلغ:</span>
                <span className="font-bold text-slate-800">{Number(approveConfirmItem.amount).toLocaleString('en-US')} ر.س</span>
              </div>
            </div>

            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              عند اعتماد هذا القيد، سيتم إقفاله محاسبياً وترحيله للأرصدة المالية. لن يمكن تعديله أو حذفه لاحقاً إلا بصلاحيات الإدارة العليا.
            </p>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setApproveConfirmItem(null)} className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl transition">
                إلغاء
              </button>
              <button 
                onClick={handleConfirmApprove} 
                className="px-5 py-2.5 text-white bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl transition shadow-md shadow-emerald-100"
              >
                نعم، اعتمد القيد الآن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
