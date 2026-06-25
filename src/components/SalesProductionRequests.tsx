import { getStatusColors } from "../lib/statusUtils";
import React, { useState, useEffect } from "react";
import { User } from "../types";
import { getAccessLevel, hasPermission, getAdvancedPermissionScope } from '../lib/permissions';
import {
  Building2,
  Plus,
  Search,
  Calendar,
  Save,
  Trash2,
  RefreshCcw,
  AlertTriangle,
  FileCheck,
  X,
  Link as LinkIcon,
  Edit,
  Clock,
  ExternalLink,
} from "lucide-react";

interface SalesProductionRequestsProps {
  lang: string;
  user: User;
}

interface ProductionRequest {
  id?: string;
  requestNumber: string;
  quoteId: string;
  quotationNumber: string;
  clientName: string;
  projectName: string;
  designLink: string;
  completionDate: string;
  notes: string;
  status: string;
  statusUpdatedAt: string;
  createdAt: string;
  createdBy: string;
  creatorName: string;
}

export default function SalesProductionRequests({
  lang,
  user,
}: SalesProductionRequestsProps) {
  const isOwnerOrAdmin = getAccessLevel(user, 'sales', 'deleteAccess') === 'all';

  const [requests, setRequests] = useState<ProductionRequest[]>([]);
  const [approvedQuotes, setApprovedQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dialog (Alert/Confirm)
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    type: "alert" | "confirm";
    message: string;
    onConfirm?: () => void;
  } | null>(null);

  // Form State
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [quoteSearch, setQuoteSearch] = useState("");
  const [designLink, setDesignLink] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [notes, setNotes] = useState("");

  const [editingLinkReq, setEditingLinkReq] = useState<{
    id: string;
    link: string;
  } | null>(null);

  // Resubmission state & toast
  const [resubmitReq, setResubmitReq] = useState<any | null>(null);
  const [resubmitReason, setResubmitReason] = useState(
    "تم تعديل تفاصيل المشروع مع العميل",
  );
  const [resubmitCustom, setResubmitCustom] = useState("");
  const [topToast, setTopToast] = useState<string | null>(null);

  // Status List
  const statuses = [
    "الكل",
    "في انتظار المراجعة",
    "قيد المراجعة",
    "تم استلام الطلب",
    "قيد التنفيذ",
    "في انتظار التركيب",
    "في التركيب",
    "تم التركيب والتشغيل",
    "انتظار الدفعة الاخيرة",
    "مرفوض",
    "معلق",
    "تم التقييد",
  ];

  const showAlert = (message: string) => {
    setDialogConfig({ isOpen: true, type: "alert", message });
  };

  const showConfirm = (message: string, onConfirm: () => void) => {
    setDialogConfig({ isOpen: true, type: "confirm", message, onConfirm });
  };

  const closeDialog = () => setDialogConfig(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const ts = Date.now();
      const [resRequests, resQuotes] = await Promise.all([
        fetch(`/api/dynamic/sales_production_requests?t=${ts}`),
        fetch(`/api/sales_quotations?t=${ts}`),
      ]);

      if (resRequests.ok && resQuotes.ok) {
        let reqData = await resRequests.json();
        const quotesData = await resQuotes.json();

        // Ensure array
        if (!Array.isArray(reqData)) reqData = [];

        // View Filtering
        const viewScope = getAdvancedPermissionScope(user, 'sales', 'production_requests', 'view_requests');
        if (viewScope === 'own') {
          reqData = reqData.filter((r: any) => r.createdBy?.toLowerCase() === user?.username?.toLowerCase());
        } else if (viewScope === 'none') {
          reqData = [];
        }

        setApprovedQuotes(quotesData.filter((q: any) => q.status === "معتمد"));

        setRequests(reqData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateNew = () => {
    setSelectedQuoteId("");
    setQuoteSearch("");
    setDesignLink("");
    setCompletionDate("");
    setNotes("");
    setIsModalOpen(true);
  };

  const generateRequestNumber = () => {
    const existingIds = requests.map((r) => {
      const parts = r.requestNumber?.split("-");
      if (parts && parts.length === 2 && !isNaN(Number(parts[1]))) {
        return parseInt(parts[1], 10);
      }
      return 0;
    });
    const maxNum = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    return `PR-${String(maxNum + 1).padStart(4, "0")}`;
  };

  const handleSaveRequest = async () => {
    if (!selectedQuoteId) return showAlert("الرجاء اختيار المشروع / عرض السعر");
    if (!designLink.trim()) return showAlert("الرجاء إضافة رابط ملف التصميم");
    if (!completionDate)
      return showAlert("الرجاء تحديد تاريخ الانتهاء المتفق عليه");

    const quote = approvedQuotes.find((q) => q.id === selectedQuoteId);

    const newRequest: ProductionRequest = {
      requestNumber: generateRequestNumber(),
      quoteId: selectedQuoteId,
      quotationNumber: quote?.quotationNumber || quote?.id || "---",
      clientName: quote?.clientName || "---",
      projectName: quote?.projectName || "---",
      designLink: designLink.trim(),
      completionDate,
      notes: notes.trim(),
      status: "في انتظار المراجعة",
      statusUpdatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: user.username,
      creatorName: user.username,
    };

    try {
      const res = await fetch("/api/dynamic/sales_production_requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRequest),
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        showAlert("حدث خطأ أثناء حفظ الطلب");
      }
    } catch (e) {
      console.error(e);
      showAlert("حدث خطأ أثناء حفظ الطلب");
    }
  };

  const handleDeleteRequest = async (id: string) => {
    const req = requests.find((r) => r.id === id);
    if (!req) return;

    try {
      const ts = Date.now();
      const matRes = await fetch(
        `/api/dynamic/material_purchase_requests?t=${ts}`,
      );
      let associatedProcId: string | null = null;
      if (matRes.ok) {
        const matReqs = await matRes.json();
        const hasMatReq = matReqs.find(
          (m: any) =>
            m.projectId === id || m.quotationNumber === req.quotationNumber,
        );
        if (hasMatReq) {
          associatedProcId = hasMatReq.id;
          if (!isOwnerOrAdmin) {
            return showAlert(
              "لقد تم طلب مواد لهذا المشروع مسبقاً، يمنع حذف الطلب نهائياً. يرجى الرجوع للإدارة.",
            );
          }
        }
      }

      if (req.createdBy !== user.username && !isOwnerOrAdmin) {
        return showAlert("فقط منشئ الطلب أو الإدارة يمكنهم إلغاء الطلب");
      }

      showConfirm(
        "هل أنت متأكد من إلغاء طلب الإنتاج هذا؟ سيتم أيضاً حذف أية طلبات مواد مرتبطة إن وجدت. هذا الإجراء لا يمكن التراجع عنه.",
        async () => {
          try {
            const res = await fetch(
              `/api/dynamic/sales_production_requests/${id}`,
              {
                method: "DELETE",
              },
            );
            if (res.ok) {
              if (associatedProcId) {
                await fetch(
                  `/api/dynamic/material_purchase_requests/${associatedProcId}`,
                  { method: "DELETE" },
                );
              }
              fetchData();
              setTopToast("تم إلغاء وحذف الطلب بنجاح");
              setTimeout(() => setTopToast(null), 3000);
            } else {
              showAlert("حدث خطأ أثناء الإلغاء");
            }
          } catch (e) {
            console.error(e);
            showAlert("حدث خطأ أثناء الإلغاء");
          }
        },
      );
    } catch (e) {
      console.error(e);
      showAlert("حدث خطأ أثناء فحص البيانات للمشروع");
    }
  };

  const updateDesignLink = async (reqId: string, newLink: string) => {
    if (!newLink.trim()) return showAlert("الرابط لا يمكن أن يكون فارغاً");
    try {
      const res = await fetch(
        `/api/dynamic/sales_production_requests/${reqId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ designLink: newLink.trim() }),
        },
      );
      if (res.ok) {
        fetchData();
      } else {
        showAlert("حدث خطأ أثناء التحديث");
      }
    } catch (e) {
      console.error(e);
      showAlert("حدث خطأ أثناء التحديث");
    }
  };

  const handleResubmitRequest = async () => {
    if (!resubmitReq) return;
    const finalReason =
      resubmitReason === "سبب آخر" ? resubmitCustom : resubmitReason;
    if (resubmitReason === "سبب آخر" && !resubmitCustom.trim()) {
      showAlert("الرجاء كتابة سبب إعادة طلب الإنتاج المخصص.");
      return;
    }

    try {
      const res = await fetch(
        `/api/dynamic/sales_production_requests/${resubmitReq.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "في انتظار المراجعة",
            holdReason: "",
            resubmitReason: finalReason,
            resubmittedBy: user.username,
            resubmittedAt: new Date().toISOString(),
            statusUpdatedAt: new Date().toISOString(),
          }),
        },
      );
      if (res.ok) {
        setTopToast("تم ارسال اعادة طلب بنجاح");
        setTimeout(() => setTopToast(null), 3000);
        setResubmitReq(null);
        fetchData();
      } else {
        showAlert("خطأ أثناء تقديم إعادة الطلب");
      }
    } catch (e) {
      console.error(e);
      showAlert("حدث كشاف خطأ فني أثناء التعديل");
    }
  };

  const filteredRequests = requests
    .filter((r) => {
      if (statusFilter !== "الكل" && r.status !== statusFilter) return false;

      if (searchQuery) {
        const t = searchQuery.toLowerCase();
        if (
          !r.requestNumber?.toLowerCase().includes(t) &&
          !r.projectName?.toLowerCase().includes(t) &&
          !r.quotationNumber?.toLowerCase().includes(t)
        ) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      const d1 = new Date(a.createdAt).getTime();
      const d2 = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? d2 - d1 : d1 - d2;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {topToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-sm px-4">
          <div className="bg-emerald-600 text-white rounded-2xl shadow-xl p-4 text-center font-bold text-xs">
            🎉 {topToast}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-indigo-600" />
            طلبات الإنتاج المرسلة
          </h1>
          <p className="text-slate-500 mt-2">
            إدارة ومتابعة طلبات الإنتاج الموجهة لقسم الإنتاج وتتبع حالاتها.
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-indigo-200 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          إنشاء طلب إنتاج
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="البحث برقم الطلب، المشروع، العرض..."
            className="w-full pr-12 pl-4 py-3 border rounded-xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-3 border rounded-xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="w-full p-3 border rounded-xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition"
          >
            <option value="newest">الأحدث أولاً</option>
            <option value="oldest">الأقدم أولاً</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRequests.map((req: any) => (
          <div
            key={req.id}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col hover:shadow-xl transition-shadow relative"
          >
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-sm font-black text-indigo-700">
                  {req.creatorName?.[0] || "U"}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 block">
                    بواسطة
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {req.creatorName}
                  </span>
                </div>
              </div>
              <div
                className={`px-3 py-1 rounded-full border text-xs font-bold ${getStatusColors(req.status)}`}
              >
                {req.status}
              </div>
            </div>

            <div className="mb-4">
              <span className="text-xs font-bold text-slate-500 mb-1 block">
                رقم الطلب
              </span>
              <span className="text-lg font-black text-indigo-700">
                {req.requestNumber}
              </span>
            </div>

            <div className="space-y-3 mb-6 flex-1">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-slate-400" />
                <span
                  className="text-sm font-bold text-slate-700 truncate"
                  title={req.projectName}
                >
                  المشروع: {req.projectName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">
                  العرض: {req.quotationNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">
                  تاريخ الانتهاء:{" "}
                  <span className="font-bold">{req.completionDate}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500">
                  آخر تحديث:{" "}
                  {new Date(req.statusUpdatedAt).toLocaleDateString("ar-SA")}
                </span>
              </div>

              {/* Link Input / Button */}
              <div className="p-3 bg-slate-50 rounded-xl mt-4 border border-slate-100">
                <label className="text-xs font-bold text-slate-500 mb-2 block">
                  رابط ملف التصميم:
                </label>
                <div className="flex items-center gap-2">
                  <a
                    href={req.designLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition truncate"
                  >
                    <ExternalLink className="w-4 h-4" /> عرض ملف التصميم
                  </a>
                  {(user.username === req.createdBy || isOwnerOrAdmin) && (
                    <button
                      onClick={() =>
                        setEditingLinkReq({ id: req.id!, link: req.designLink })
                      }
                      className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg flex-shrink-0 transition"
                      title="تعديل الرابط"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {req.notes && (
                <div className="mt-4 text-sm text-slate-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
                  <span className="font-bold text-amber-800 block mb-1">
                    ملاحظات:
                  </span>
                  {req.notes}
                </div>
              )}

              {req.status === "تم التقييد" && (
                <div className="mt-4 p-3.5 bg-rose-50 border border-rose-155 rounded-2xl space-y-2">
                  <p className="text-xs text-rose-800 font-black">
                    ⚠️ تم تقييد الطلب من قاعة الإنتاج:
                  </p>
                  <p className="text-xs text-rose-950 font-extrabold">
                    {req.holdReason || "غير محدد"}
                  </p>
                  {req.heldBy && (
                    <p className="text-[10px] text-slate-400">
                      بواسطة {req.heldBy} في{" "}
                      {req.heldAt
                        ? new Date(req.heldAt).toLocaleString("ar-SA")
                        : ""}
                    </p>
                  )}

                  <button
                    onClick={() => {
                      setResubmitReq(req);
                      setResubmitReason("تم تعديل تفاصيل المشروع مع العميل");
                      setResubmitCustom("");
                    }}
                    className="mt-2.5 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl transition shadow-md shadow-indigo-100 cursor-pointer"
                  >
                    🔄 إعادة إرسال طلب إنتاج
                  </button>
                </div>
              )}

              {req.status === "تم التركيب بنجاح" && req.confirmedBy && (
                <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-150 rounded-2xl space-y-2">
                  <span className="flex items-center gap-2 text-xs text-emerald-800 font-black">
                    ✅ تم تأكيد اكتمال المشروع والتركيب بنجاح
                  </span>
                  <p className="text-[11px] text-slate-500 font-extrabold">
                    تم تأكيده بواسطة {req.confirmedBy} في{" "}
                    {req.completedAt
                      ? new Date(req.completedAt).toLocaleString("ar-SA")
                      : ""}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end items-center">
              {(user.username === req.createdBy || isOwnerOrAdmin) && (
                <button
                  onClick={() => handleDeleteRequest(req.id!)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition"
                  title="إلغاء الطلب"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}
        {filteredRequests.length === 0 && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 text-slate-500 font-bold">
            لا توجد طلبات إنتاج تطابق بحثك.
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto pt-20 pb-24">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-40 rounded-t-3xl">
              <h2 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
                <Plus className="w-6 h-6" /> إنشاء طلب إنتاج جديد
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Project Selection */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  اختيار المشروع / عرض السعر
                </label>
                <div className="relative group/quote z-30" tabIndex={0}>
                  <div className="w-full p-4 border rounded-xl font-bold bg-slate-50 focus-within:bg-white focus-within:border-indigo-500 flex justify-between items-center cursor-pointer">
                    <span className="truncate">
                      {selectedQuoteId
                        ? (() => {
                            const q = approvedQuotes.find(
                              (x) => x.id === selectedQuoteId,
                            );
                            return q
                              ? `${q.quotationNumber} - ${q.projectName || q.clientName}`
                              : "اختر المشروع";
                          })()
                        : "-- اختر المشروع --"}
                    </span>
                  </div>

                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-xl p-2 hidden group-focus-within/quote:block hover:block z-40 max-h-60 overflow-y-auto">
                    <input
                      type="text"
                      placeholder="البحث باسم المشروع أو الكوتيشن..."
                      value={quoteSearch}
                      onChange={(e) => setQuoteSearch(e.target.value)}
                      className="w-full p-2 mb-2 border rounded-xl font-bold bg-slate-50 focus:bg-white focus:border-indigo-500 text-sm sticky top-0"
                    />

                    <div className="flex flex-col gap-1">
                      {approvedQuotes
                        .filter((q) => {
                          if (!quoteSearch) return true;
                          const term = quoteSearch.toLowerCase();
                          return (
                            q.quotationNumber?.toLowerCase().includes(term) ||
                            (q.projectName &&
                              q.projectName.toLowerCase().includes(term)) ||
                            (q.clientName &&
                              q.clientName.toLowerCase().includes(term))
                          );
                        })
                        .map((q) => (
                          <div
                            key={q.id}
                            onClick={() => {
                              setSelectedQuoteId(q.id);
                              if (
                                document.activeElement instanceof HTMLElement
                              ) {
                                document.activeElement.blur();
                              }
                            }}
                            className={`p-3 rounded-xl cursor-pointer text-sm font-bold transition hover:bg-slate-50 ${selectedQuoteId === q.id ? "bg-indigo-50 text-indigo-700" : "text-slate-700"}`}
                          >
                            {q.quotationNumber} -{" "}
                            {q.projectName || q.clientName}
                          </div>
                        ))}
                      {approvedQuotes.length > 0 &&
                        approvedQuotes.filter((q) => {
                          if (!quoteSearch) return true;
                          const term = quoteSearch.toLowerCase();
                          return (
                            q.quotationNumber?.toLowerCase().includes(term) ||
                            (q.projectName &&
                              q.projectName.toLowerCase().includes(term)) ||
                            (q.clientName &&
                              q.clientName.toLowerCase().includes(term))
                          );
                        }).length === 0 && (
                          <div className="p-3 text-center text-sm text-slate-500 font-bold">
                            لا توجد نتائج
                          </div>
                        )}
                      {approvedQuotes.length === 0 && (
                        <div className="p-3 text-center text-sm text-slate-500 font-bold">
                          لا توجد عروض أسعار متاحة
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Design Link */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  رابط ملف التصميم
                </label>
                <div className="relative">
                  <LinkIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="url"
                    placeholder="https://..."
                    value={designLink}
                    onChange={(e) => setDesignLink(e.target.value)}
                    className="w-full pr-12 pl-4 py-3 border rounded-xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Completion Date */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  تاريخ الانتهاء المتفق عليه مع العميل
                </label>
                <div className="relative">
                  <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="date"
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                    className="w-full pr-12 pl-4 py-3 border rounded-xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  ملاحظات لقسم الإنتاج (اختياري)
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أدخل أي ملاحظات إضافية..."
                  className="w-full p-4 border rounded-xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                ></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-3xl">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveRequest}
                className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-200"
              >
                <Save className="w-5 h-5" />
                إرسال طلب إنتاج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog */}
      {dialogConfig?.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center">
            {dialogConfig.type === "confirm" ? (
              <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
            ) : (
              <AlertTriangle className="w-16 h-16 text-indigo-500 mb-4" />
            )}
            <p className="text-slate-800 text-lg font-bold mb-6">
              {dialogConfig.message}
            </p>
            <div className="flex gap-3 w-full">
              {dialogConfig.type === "confirm" && (
                <button
                  onClick={closeDialog}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"
                >
                  إلغاء
                </button>
              )}
              <button
                onClick={() => {
                  dialogConfig.onConfirm?.();
                  closeDialog();
                }}
                className={`flex-1 px-4 py-3 text-white rounded-xl font-bold transition ${dialogConfig.type === "confirm" ? "bg-red-500 hover:bg-red-600" : "bg-indigo-600 hover:bg-indigo-700"}`}
              >
                {dialogConfig.type === "confirm" ? "موافق، احذف" : "حسناً"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Link Modal */}
      {editingLinkReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              تعديل رابط ملف التصميم
            </h3>
            <input
              type="url"
              value={editingLinkReq.link}
              onChange={(e) =>
                setEditingLinkReq({ ...editingLinkReq, link: e.target.value })
              }
              className="w-full p-3 border rounded-xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-left mb-6"
              dir="ltr"
              placeholder="https://..."
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEditingLinkReq(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  updateDesignLink(editingLinkReq.id, editingLinkReq.link);
                  setEditingLinkReq(null);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resubmission Modal (Requirement) */}
      {resubmitReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col text-right"
            dir="rtl"
          >
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-1.5">
              🔄{" "}
              {lang === "ar"
                ? "إعادة إرسال طلب الإنتاج"
                : "Resubmit request to Production"}
            </h3>

            <p className="text-xs text-slate-400 mb-4">
              يرجى من فضلك اختيار المبرر أو الإجراء المصحح الذي تم اتخاذه
              للتجاوز:
            </p>

            <div className="space-y-3 mb-6 text-xs text-slate-600 font-bold">
              {[
                "تم تعديل تفاصيل المشروع مع العميل",
                "تم تعديل وقت المشروع مع العميل",
                "تم استلام الدفعة الاولى من العميل",
                "سبب آخر",
              ].map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-2.5 p-2.5 hover:bg-slate-50 border rounded-xl cursor-pointer"
                >
                  <input
                    type="radio"
                    name="resubmit_opt"
                    value={opt}
                    checked={resubmitReason === opt}
                    onChange={(e) => setResubmitReason(e.target.value)}
                  />
                  <span>{opt}</span>
                </label>
              ))}

              {resubmitReason === "سبب آخر" && (
                <textarea
                  value={resubmitCustom}
                  onChange={(e) => setResubmitCustom(e.target.value)}
                  placeholder="اكتب تفاصيل سبب إعادة التقديم هنا..."
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-semibold outline-none focus:bg-white"
                />
              )}
            </div>

            <div className="flex gap-2.5 justify-end border-t pt-3.5">
              <button
                onClick={() => setResubmitReq(null)}
                className="px-4 py-2 bg-slate-100 text-slate-650 rounded-xl font-bold text-xs hover:bg-slate-200"
              >
                إلغاء
              </button>
              <button
                onClick={handleResubmitRequest}
                className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white font-black text-xs rounded-xl transition shadow-md shadow-indigo-100"
              >
                🚀 إرسال التحديث للإنتاج
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
