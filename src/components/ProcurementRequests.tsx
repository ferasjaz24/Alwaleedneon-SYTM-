import { getStatusColors } from "../lib/statusUtils";
import { getAccessLevel, hasAdvancedPermission, getAdvancedPermissionScope } from "../lib/permissions";
import React, { useState, useEffect } from "react";
import {
  Search,
  FileText,
  Check,
  Clock,
  ShieldCheck,
  X,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Tag,
  Calendar,
  User,
  Package,
  Layers,
} from "lucide-react";

interface ProcurementRequestsProps {
  lang: "ar" | "en";
  user: any;
}

interface PurchaseItem {
  itemName: string;
  qty: number;
  notes?: string;
}

interface MaterialPurchaseRequest {
  id: string;
  projectId: string; // quotaId or requestNumber
  requestNumber: string; // e.g. PRQ-0001
  projectName: string;
  quotationNumber: string;
  clientName: string;
  requestedBy: string; // production username
  requestedAt: string;
  isOrder: boolean;
  orderCreatedBy?: string;
  orderCreatedAt?: string;
  inStockItems?: any[];
  outOfStockItems?: any[];
  pricingDetails?: any[];
  status:
    | "في انتظار المراجعة"
    | "في انتظار أمر الشراء"
    | "قيد الطلب"
    | "في انتظار الدفعة"
    | "تم الطلب من المورد"
    | "تم استلام المواد"
    | string;
  items: PurchaseItem[];
  updatesLog?: {
    user: string;
    action: string;
    timestamp: string;
  }[];
}

export default function ProcurementRequests({
  lang,
  user,
}: ProcurementRequestsProps) {
  const [activePortal, setActivePortal] = useState<"requests" | "orders">(
    "requests",
  );
  const [requests, setRequests] = useState<MaterialPurchaseRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReq, setSelectedReq] =
    useState<MaterialPurchaseRequest | null>(null);

  // Search/Filters state
  const [searchPRQ, setSearchPRQ] = useState<string>("");
  const [searchRep, setSearchRep] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Interactive Toast State
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "err";
  } | null>(null);

  // Material Availability Check States
  const [materialsStock, setMaterialsStock] = useState<any[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [inStockItems, setInStockItems] = useState<any[]>([]);
  const [outOfStockItems, setOutOfStockItems] = useState<any[]>([]);
  const [isSendingToPricing, setIsSendingToPricing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const showLocalToast = (
    message: string,
    type: "success" | "err" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const isRoleAuthorizedForOrder = true;

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const ts = Date.now();
      const [res, matRes] = await Promise.all([
        fetch(`/api/dynamic/material_purchase_requests?t=${ts}`),
        fetch(`/api/dynamic/materials_warehouse?t=${ts}`),
      ]);
      if (res.ok) {
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
      }
      if (matRes.ok) {
        const data = await matRes.json();
        setMaterialsStock(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Error fetching procurement requests:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Update request state dynamically
  const updateRequestStatusInDb = async (
    reqId: string,
    payload: Partial<MaterialPurchaseRequest>,
  ) => {
    try {
      const res = await fetch(
        `/api/dynamic/material_purchase_requests/${reqId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (res.ok) {
        fetchRequests();
        const updated = {
          ...selectedReq,
          ...payload,
        } as MaterialPurchaseRequest;
        setSelectedReq(updated);
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const handleUndoOrder = async () => {
    if (!selectedReq || !hasAdvancedPermission(user, 'procurement', 'finance_approval', 'undo_po') || !selectedReq.isOrder) return;

    setConfirmDialog({
      message: lang === 'ar' ? 'هل أنت متأكد من التراجع عن أمر الشراء المنشئ وإعادته إلى طلبات الشراء؟' : 'Are you sure you want to undo this PO?',
      onConfirm: async () => {
        const payload: Partial<MaterialPurchaseRequest> = {
          isOrder: false,
          orderCreatedBy: "",
          orderCreatedAt: "",
          status: "معتمد", 
          updatesLog: [
            ...(selectedReq.updatesLog || []),
            {
              user: user.username,
              action: "التراجع عن أمر الشراء وإعادته لطلبات الشراء لاعتماده",
              timestamp: new Date().toISOString(),
            },
          ],
        };

        const success = await updateRequestStatusInDb(selectedReq.id, payload);
        if (success) {
          showLocalToast(lang === "ar" ? "تم التراجع عن أمر الشراء بنجاح" : "PO undone successfully");
          setActivePortal("requests");
          setSelectedReq(null);
        }
      }
    });
  };

  // Change procurement stage step-by-step
  const handleNextStatus = async (nextStatus: string) => {
    if (!selectedReq) return;

    setConfirmDialog({
      message:
        lang === "ar"
          ? `هل أنت متأكد من تغيير واستكمال الحالة إلى "${nextStatus}"؟`
          : `Are you sure you want to proceed to "${nextStatus}"?`,
      onConfirm: async () => {
        // For regular purchase requests (not yet an order)
        if (!selectedReq.isOrder) {
          if (
            nextStatus !== "في انتظار أمر الشراء" &&
            nextStatus !== "في انتظار المراجعة" &&
            nextStatus !== "مرسل للموردين والتسعير" &&
            nextStatus !== "قيد الطلب"
          ) {
            showLocalToast(
              lang === "ar"
                ? "⚠️ لا يمكن تغيير الحالة للخطوات المتقدمة إلا بعد إنشاء أمر الشراء الرسمي."
                : "⚠️ Status cannot transition without a formalized Purchase Order.",
              "err",
            );
            return;
          }
        }

        const payload: Partial<MaterialPurchaseRequest> = {
          status: nextStatus,
          updatesLog: [
            ...(selectedReq.updatesLog || []),
            {
              user: user.username,
              action: `تغيير حالة طلب الشراء إلى (${nextStatus})`,
              timestamp: new Date().toISOString(),
            },
          ],
        };

        const success = await updateRequestStatusInDb(selectedReq.id, payload);
        if (success) {
          if (nextStatus === "تم استلام المواد") {
            // Smart Warehouse: Add received materials to stock
            for (const reqItem of selectedReq.items) {
              const mat = materialsStock.find(
                (m: any) =>
                  m.name === reqItem.itemName ||
                  m.nameAr === reqItem.itemName ||
                  m.nameEn === reqItem.itemName,
              );
              if (mat) {
                await fetch(`/api/dynamic/materials_warehouse/${mat.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    currentQty:
                      Number(mat.currentQty || 0) + Number(reqItem.qty || 0),
                  }),
                });
              } else {
                // Optionally create it if strictly needed, but prompt implies match by name
              }
            }
          }
          showLocalToast(
            lang === "ar"
              ? `تم تغيير الحالة إلى ${nextStatus}${nextStatus === "تم استلام المواد" ? " وتم إضافة الكميات للمستودع" : ""}`
              : `Status updated to ${nextStatus}`,
          );
        }
      },
    });
  };

  const handleRevertStatus = async (prevStatus: string) => {
    if (!selectedReq) return;
    setConfirmDialog({
      message:
        lang === "ar"
          ? `⚠️ الانتباه: هل أنت متأكد من التراجع عن الحالة وإعادتها إلى "${prevStatus}"؟`
          : `Are you sure you want to revert status back to "${prevStatus}"?`,
      onConfirm: async () => {
        const payload: Partial<MaterialPurchaseRequest> = {
          status: prevStatus,
          updatesLog: [
            ...(selectedReq.updatesLog || []),
            {
              user: user.username,
              action: `تراجع مالي/إداري إلى حالة (${prevStatus})`,
              timestamp: new Date().toISOString(),
            },
          ],
        };

        const success = await updateRequestStatusInDb(selectedReq.id, payload);
        if (success) {
          showLocalToast(
            lang === "ar"
              ? `تم التراجع إلى ${prevStatus}`
              : `Reverted to ${prevStatus}`,
            "success",
          );
        }
      },
    });
  };

  // Parse Month of requestedAt
  const getMonthIndex = (isoString: string): number => {
    try {
      const dt = new Date(isoString);
      return dt.getMonth() + 1; // 1-12
    } catch {
      return 0;
    }
  };

  const monthsList = [
    { value: "1", ar: "يناير - Jan", en: "January" },
    { value: "2", ar: "فبراير - Feb", en: "February" },
    { value: "3", ar: "مارس - Mar", en: "March" },
    { value: "4", ar: "أبريل - Apr", en: "April" },
    { value: "5", ar: "مايو - May", en: "May" },
    { value: "6", ar: "يونيو - Jun", en: "June" },
    { value: "7", ar: "يوليو - Jul", en: "July" },
    { value: "8", ar: "أغسطس - Aug", en: "August" },
    { value: "9", ar: "سبتمبر - Sep", en: "September" },
    { value: "10", ar: "أكتوبر - Oct", en: "October" },
    { value: "11", ar: "نوفمبر - Nov", en: "November" },
    { value: "12", ar: "ديسمبر - Dec", en: "December" },
  ];

  const procurementViewAccess = getAdvancedPermissionScope(user, "procurement", "requests", "view_requests");

  const filteredRequests = requests
    .filter((req) => {
      // Data Scope enforcement:
      if (procurementViewAccess === 'own' && req.requestedBy !== user.username) {
          return false;
      }
      if (procurementViewAccess === 'none') {
          return false;
      }

      // Portal logic
      if (activePortal === "requests" && req.isOrder) return false;
      if (activePortal === "orders" && !req.isOrder) return false;

      // Search by Request Number
      if (
        searchPRQ &&
        !req.requestNumber?.toLowerCase().includes(searchPRQ.toLowerCase())
      )
        return false;

      // Search by Sales Rep
      if (
        searchRep &&
        !req.requestedBy?.toLowerCase().includes(searchRep.toLowerCase())
      )
        return false;

      // Filter by Month
      if (selectedMonth !== "all") {
        const mIdx = getMonthIndex(req.requestedAt);
        if (String(mIdx) !== selectedMonth) return false;
      }

      // Filter by Status
      if (
        statusFilter !== "all" &&
        req.status !== statusFilter &&
        !(
          statusFilter === "في انتظار الدفع" &&
          req.status === "في انتظار الدفعة"
        )
      )
        return false;

      return true;
    })
    .sort((a, b) => {
      const d1 = new Date(a.requestedAt).getTime();
      const d2 = new Date(b.requestedAt).getTime();
      return sortOrder === "newest" ? d2 - d1 : d1 - d2;
    });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Dynamic Floating Toast (3 seconds, required) */}
      {toast && (
        <div
          id="procurement-toast"
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-sm px-4 animate-in slide-in-from-top duration-300"
        >
          <div
            className={`p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-sm font-bold ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <span>{toast.type === "success" ? "✅" : "❌"}</span>
            <p className="flex-grow">{toast.message}</p>
          </div>
        </div>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in duration-300 border border-slate-100">
            <div className="p-6">
              <h3 className="text-lg font-black text-slate-800 mb-2">
                {lang === "ar" ? "تأكيد الإجراء" : "Confirm Action"}
              </h3>
              <p className="text-slate-600 font-bold text-sm leading-relaxed">
                {confirmDialog.message}
              </p>
            </div>
            <div className="flex bg-slate-50 border-t border-slate-100 p-4 gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 px-4 py-2.5 bg-white text-slate-700 font-extrabold text-sm rounded-xl border-slate-200 border cursor-pointer hover:bg-slate-50 transition"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="flex-1 px-4 py-2.5 bg-[#0072BC] text-white font-extrabold text-sm rounded-xl cursor-pointer hover:bg-blue-700 shadow-md transition"
              >
                {lang === "ar" ? "تأكيد واستمرار" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Portals */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-7 h-7 text-[#0072BC]" />
            {lang === "ar"
              ? "إدارة مشتريات وتوريد المواد الـ BoM"
              : "Procurement & BoM Sourcing"}
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            {lang === "ar"
              ? "حوكمة ترحيل الأصناف المطلوبة للتصنيع إلى أوامر توريد ومتابعة التوصيل مع الموردين الكترونياً."
              : "Approve hardware BoM items, convert them to orders, and trace supplier deliverable checklists."}
          </p>
        </div>

        {/* Dual Portal Switchers (بوابتين) */}
        <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 border border-slate-200">
          <button
            onClick={() => {
              setActivePortal("requests");
              setStatusFilter("all");
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
              activePortal === "requests"
                ? "bg-white text-indigo-700 shadow-md shadow-indigo-100"
                : "text-slate-500 hover:text-indigo-600"
            }`}
          >
            📋{" "}
            {lang === "ar" ? "طلبات شراء المواد المبرمة" : "Material Requests"}
          </button>
          <button
            onClick={() => {
              setActivePortal("orders");
              setStatusFilter("all");
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
              activePortal === "orders"
                ? "bg-[#0072BC] text-white shadow-md shadow-blue-200"
                : "text-slate-500 hover:text-[#0072BC]"
            }`}
          >
            ⚡{" "}
            {lang === "ar"
              ? "أوامر شراء المواد المعتمدة"
              : "Material Purchase Orders"}
          </button>
        </div>
      </div>

      {/* Modern Search Filters Panel */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Search by PR number */}
        <div>
          <label className="block text-[11px] font-black text-slate-400 mb-1.5">
            {lang === "ar" ? "رقم طلب الشراء" : "Request Number"}
          </label>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="PRQ-..."
              className="w-full pr-9 pl-3 py-2 text-xs border rounded-xl font-bold bg-slate-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition"
              value={searchPRQ}
              onChange={(e) => setSearchPRQ(e.target.value)}
            />
          </div>
        </div>

        {/* Search by Sales rep */}
        <div>
          <label className="block text-[11px] font-black text-slate-400 mb-1.5">
            {lang === "ar" ? "اسم المندوب" : "Sales Rep"}
          </label>
          <div className="relative">
            <User className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder={lang === "ar" ? "اسم المندوب..." : "Username..."}
              className="w-full pr-9 pl-3 py-2 text-xs border rounded-xl font-bold bg-slate-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition"
              value={searchRep}
              onChange={(e) => setSearchRep(e.target.value)}
            />
          </div>
        </div>

        {/* Month Selection */}
        <div>
          <label className="block text-[11px] font-black text-slate-400 mb-1.5">
            {lang === "ar" ? "فلترة حسب الشهر" : "Filter by Month"}
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full p-2 text-xs border rounded-xl font-bold bg-slate-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition"
          >
            <option value="all">
              📅 {lang === "ar" ? "جميع الشهور" : "All Months"}
            </option>
            {monthsList.map((m) => (
              <option key={m.value} value={m.value}>
                {m.ar}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-[11px] font-black text-slate-400 mb-1.5">
            {lang === "ar" ? "حالة الطلب" : "Status"}
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2 text-xs border rounded-xl font-bold bg-slate-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition"
          >
            <option value="all">
              🔍 {lang === "ar" ? "جميع الحالات" : "All Statuses"}
            </option>
            {activePortal === "requests" ? (
              <>
                <option value="في انتظار المراجعة">
                  {lang === "ar" ? "في انتظار المراجعة" : "Waiting"}
                </option>
                <option value="في انتظار أمر الشراء">
                  {lang === "ar" ? "في انتظار أمر الشراء" : "Pending Order"}
                </option>
              </>
            ) : (
              <>
                <option value="قيد الطلب">
                  {lang === "ar" ? "قيد الطلب" : "Requested"}
                </option>
                <option value="في انتظار الدفعة">
                  {lang === "ar" ? "في انتظار الدفعة" : "Wait for payment"}
                </option>
                <option value="تم الطلب من المورد">
                  {lang === "ar"
                    ? "تم الطلب من المورد"
                    : "Ordered form supplier"}
                </option>
                <option value="تم استلام المواد">
                  {lang === "ar" ? "تم استلام المواد" : "Materials Received"}
                </option>
              </>
            )}
          </select>
        </div>

        {/* Sorting Order */}
        <div>
          <label className="block text-[11px] font-black text-slate-400 mb-1.5">
            {lang === "ar" ? "ترتيب النتائج" : "Sort"}
          </label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="w-full p-2 text-xs border rounded-xl font-bold bg-slate-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition"
          >
            <option value="newest">
              👇 {lang === "ar" ? "الأحدث للأقدم" : "Newest First"}
            </option>
            <option value="oldest">
              👆 {lang === "ar" ? "الأقدم للأحدث" : "Oldest First"}
            </option>
          </select>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-bold text-xs space-y-2">
            <p>
              📦{" "}
              {lang === "ar"
                ? "لا يوجد طلبات أو تفاصيل شراء ضمن هذا القسم حالياً."
                : "No items matched your requirements."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold">
                <tr>
                  <th className="p-3.5 rounded-r-2xl">
                    {lang === "ar" ? "رقم طلب الشراء" : "Request #"}
                  </th>
                  <th className="p-3.5">
                    {lang === "ar" ? "اسم المشروع" : "Project"}
                  </th>
                  <th className="p-3.5">
                    {lang === "ar" ? "رقم الكوتيشن" : "Quote ID"}
                  </th>
                  <th className="p-3.5">
                    {lang === "ar" ? "تاريخ تقديم الطلب" : "Date Requested"}
                  </th>
                  <th className="p-3.5">
                    {lang === "ar" ? "طالب الشراء (الإنتاج)" : "Requested By"}
                  </th>
                  <th className="p-3.5">
                    {lang === "ar" ? "الحالة التشغيلية" : "Status"}
                  </th>
                  <th className="p-3.5 text-center rounded-l-2xl">
                    {lang === "ar" ? "خيار المزامنة" : "Action"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-semibold text-slate-800 font-mono">
                      {req.requestNumber}
                    </td>
                    <td className="p-3.5 font-bold text-indigo-950">
                      {req.projectName}
                    </td>
                    <td className="p-3.5 font-bold text-slate-500 font-mono">
                      {req.quotationNumber}
                    </td>
                    <td className="p-3.5 font-medium text-slate-400 font-mono">
                      <div>
                        {new Date(req.requestedAt).toLocaleString('en-US', {
                          hour12: true,
                        })}
                      </div>
                      {req.isOrder && req.orderCreatedAt && (
                        <div className="text-[10px] text-indigo-600 mt-1 font-bold flex items-center gap-1">
                          <span>🎯</span>
                          <span>{lang === "ar" ? "تعميد: " : "PO: "}</span>
                          <span>{new Date(req.orderCreatedAt).toLocaleString('en-US', { hour12: true })}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 font-medium">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600 font-bold text-[10px]">
                        👤 {req.requestedBy}
                      </span>
                      {req.isOrder && req.orderCreatedBy && (
                        <div className="mt-1">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 text-[10px] font-black inline-block">
                            ✍️ {lang === "ar" ? "بواسطة: " : "By: "} {req.orderCreatedBy}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-3 py-1 rounded-full border text-[10px] font-black inline-block ${
                          req.status === "تم استلام المواد"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : req.status === "تم الطلب من المورد"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                              : req.status === "في انتظار الدفعة"
                                ? "bg-purple-50 text-purple-700 border-purple-100"
                                : req.status === "قيد الطلب"
                                  ? "bg-amber-50 text-amber-700 border-amber-100 animate-pulse"
                                  : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setSelectedReq(req)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-[#0072BC] text-slate-700 hover:text-white rounded-lg border border-slate-200 hover:border-transparent transition text-[10px] font-black cursor-pointer shadow-sm"
                      >
                        👁️ {lang === "ar" ? "عرض تفصيلي" : "View Sourcing"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details & Actions Popup */}
      {selectedReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1100] flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 p-6 flex flex-col space-y-5 animate-in fade-in zoom-in-95 duration-150 text-right"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <span>📦</span>{" "}
                  {lang === "ar"
                    ? "تفاصيل ومعاينة طلب شراء المواد"
                    : "Material Sourcing Docket"}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === "ar"
                    ? "متابعة خط التحصيل وهياكل توريد الخامات مع المورد المعتمد"
                    : "Monitor quotation collection stages and material receipts"}
                </p>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full transition text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Request Summary Metadata Card */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl text-xs text-slate-600 leading-normal">
              <div>
                <span className="font-black text-slate-400 block mb-0.5">
                  {lang === "ar" ? "المشروع المطلوب:" : "Project Name:"}
                </span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {selectedReq.projectName}
                </span>
              </div>
              <div>
                <span className="font-black text-slate-400 block mb-0.5">
                  {lang === "ar" ? "العميل:" : "Client Name:"}
                </span>
                <span className="font-bold text-slate-700">
                  {selectedReq.clientName}
                </span>
              </div>
              <div>
                <span className="font-black text-slate-400 block mb-0.5">
                  {lang === "ar" ? "رقم الكوتيشن:" : "Quotation No:"}
                </span>
                <span className="font-bold text-indigo-600 font-mono text-xs">
                  {selectedReq.quotationNumber}
                </span>
              </div>
              <div>
                <span className="font-black text-slate-400 block mb-0.5">
                  {lang === "ar" ? "رقم طلب الشراء:" : "Request Code:"}
                </span>
                <span className="font-bold text-slate-700 font-mono">
                  {selectedReq.requestNumber}
                </span>
              </div>
              <div>
                <span className="font-black text-slate-400 block mb-0.5">
                  {lang === "ar" ? "تاريخ الطلب:" : "Request Date:"}
                </span>
                <span className="font-bold font-mono text-slate-700">
                  {new Date(selectedReq.requestedAt).toLocaleString('en-US')}
                </span>
              </div>
              <div>
                <span className="font-black text-slate-400 block mb-0.5">
                  {lang === "ar" ? "حالة الطلب الحالية:" : "Current Status:"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] inline-block ${getStatusColors(selectedReq.status)}`}
                >
                  {selectedReq.status}
                </span>
              </div>
            </div>

            {/* List of Items Sourced from Production Panel */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  {lang === "ar"
                    ? "تفاصيل حالة توفر المواد وطلب الشراء:"
                    : "Raw Materials list details:"}
                </h4>
                {selectedReq.isOrder && (
                  <button
                    onClick={() => {
                      const printWin = window.open("", "_blank");
                      if (!printWin) return;
                      let html = `
                        <html dir="${lang === "ar" ? "rtl" : "ltr"}">
                        <head>
                          <title>أمر شراء مواد</title>
                          <style>
                            body { font-family: sans-serif; padding: 20px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
                            th, td { border: 1px solid #ddd; padding: 10px; text-align: ${lang === "ar" ? "right" : "left"}; }
                            th { background-color: #f1f5f9; }
                          </style>
                        </head>
                        <body>
                          <h2 style="text-align: center; color: #0072BC;">${lang === "ar" ? "أمر شراء مواد" : "Material Purchase Order"}</h2>
                          <div style="margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
                            <p><strong>${lang === "ar" ? "المشروع:" : "Project:"}</strong> ${selectedReq.projectName}</p>
                            <p><strong>${lang === "ar" ? "رقم الكوتيشن:" : "Quotation No:"}</strong> ${selectedReq.quotationNumber}</p>
                            <p><strong>${lang === "ar" ? "بواسطة:" : "Order By:"}</strong> ${selectedReq.orderCreatedBy}</p>
                            <p><strong>${lang === "ar" ? "تاريخ الأمر:" : "Date:"}</strong> ${selectedReq.orderCreatedAt ? new Date(selectedReq.orderCreatedAt).toLocaleString('en-US') : ""}</p>
                          </div>
                          
                          <h3>${lang === "ar" ? "المواد المتوفرة بالمستودع (تمت تغطيتها)" : "Available Materials"}</h3>
                          <table>
                            <thead><tr><th>الصنف</th><th>الكمية</th></tr></thead>
                            <tbody>
                               ${selectedReq.inStockItems?.map((i: any) => `<tr><td>${i.itemName}</td><td>${i.qty}</td></tr>`).join("") || ""}
                            </tbody>
                          </table>

                          <h3 style="margin-top: 30px;">${lang === "ar" ? "المواد المطلوب شراؤها (مع الموردين)" : "Materials to Purchase"}</h3>
                          <table>
                            <thead><tr><th>الصنف</th><th>الكمية</th><th>المورد المختار</th><th>السعر</th><th>شامل الضريبة</th></tr></thead>
                            <tbody>
                               ${selectedReq.pricingDetails?.map((i: any) => `<tr><td>${i.materialName}</td><td>${i.quantity}</td><td>${i.supplierName || i.supplierId || ""}</td><td>${i.price}</td><td>${i.isVatInclusive ? "نعم" : "لا"}</td></tr>`).join("") || ""}
                            </tbody>
                          </table>
                          <div style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px; font-size: 11px; text-align: center; color: #666;">
                             تم الاعتماد بواسطة: ${selectedReq.orderCreatedBy}
                          </div>
                        </body>
                        </html>
                      `;
                      printWin.document.write(html);
                      printWin.document.close();
                      printWin.print();
                    }}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-[10px] transition flex items-center gap-1"
                  >
                    🖨️{" "}
                    {lang === "ar"
                      ? "طباعة أمر الشراء كمستند PDF"
                      : "Print PO as PDF"}
                  </button>
                )}

                {selectedReq.isOrder && hasAdvancedPermission(user, 'procurement', 'finance_approval', 'undo_po') && (
                  <button
                    onClick={handleUndoOrder}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-[10px] transition flex items-center gap-1"
                  >
                    ↩️{" "}
                    {lang === "ar"
                      ? "تراجع عن أمر الشراء للإدارة"
                      : "Undo PO (Admin)"}
                  </button>
                )}
              </div>

              {!selectedReq.isOrder ? (
                <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-right text-[11px]">
                    <thead className="bg-slate-50 font-bold text-slate-500">
                      <tr>
                        <th className="p-2">
                          {lang === "ar" ? "الصنف" : "Item"}
                        </th>
                        <th className="p-2 text-center">
                          {lang === "ar" ? "الكمية المطلوبة" : "Qty"}
                        </th>
                        <th className="p-2">
                          {lang === "ar" ? "الملاحظات" : "Notes/Remarks"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {selectedReq.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2 font-extrabold text-slate-800">
                            {item.itemName}
                          </td>
                          <td className="p-2 text-center font-bold text-slate-700">
                            {item.qty}
                          </td>
                          <td className="p-2 text-slate-500">
                            {item.notes || "---"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h5 className="font-bold text-xs text-emerald-700 mb-2">
                      {lang === "ar"
                        ? "المواد المتوفرة في المخزون:"
                        : "In-Stock Materials:"}
                    </h5>
                    <div className="border border-emerald-100 rounded-2xl overflow-hidden">
                      <table className="w-full text-right text-[11px]">
                        <thead className="bg-emerald-50 font-bold text-emerald-800">
                          <tr>
                            <th className="p-2">الصنف</th>
                            <th className="p-2 text-center">الكمية</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-50 bg-white">
                          {selectedReq.inStockItems?.map(
                            (item: any, idx: number) => (
                              <tr key={idx}>
                                <td className="p-2 font-bold text-slate-800">
                                  {item.itemName}
                                </td>
                                <td className="p-2 text-center font-bold text-emerald-600">
                                  {item.qty} ✓
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-rose-700 mb-2">
                      {lang === "ar"
                        ? "المواد التي تم طلبها وشرائها:"
                        : "Purchased Materials:"}
                    </h5>
                    <div className="border border-rose-100 rounded-2xl overflow-hidden">
                      <table className="w-full text-right text-[11px]">
                        <thead className="bg-rose-50 font-bold text-rose-800">
                          <tr>
                            <th className="p-2">الصنف</th>
                            <th className="p-2 text-center">الكمية</th>
                            <th className="p-2">المورد</th>
                            <th className="p-2">المبلغ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-50 bg-white">
                          {selectedReq.pricingDetails?.map(
                            (item: any, idx: number) => (
                              <tr key={idx}>
                                <td className="p-2 font-bold text-slate-800">
                                  {item.materialName}
                                </td>
                                <td className="p-2 text-center font-bold text-rose-600">
                                  {item.quantity}
                                </td>
                                <td className="p-2 text-slate-600">
                                  {item.supplierName ||
                                    item.supplierId ||
                                    "---"}
                                </td>
                                <td className="p-2 font-mono text-slate-700">
                                  {item.price} {lang === "ar" ? "ر.س" : "SAR"}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order status tracking info if promoted */}
            {selectedReq.isOrder && (
              <div className="bg-indigo-50/60 p-4 border border-indigo-100 rounded-2xl text-xs space-y-1">
                <p className="font-black text-indigo-950 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  {lang === "ar"
                    ? `تم اعتماد أمر الشراء بواسطة (${selectedReq.orderCreatedBy})`
                    : `Corporate Purchase Order confirmed by (${selectedReq.orderCreatedBy})`}
                </p>
                <span className="text-[10px] text-slate-400 font-mono">
                  {lang === "ar" ? "بتاريخ: " : "Date: "}
                  {selectedReq.orderCreatedAt
                    ? new Date(selectedReq.orderCreatedAt).toLocaleString(
                        "ar-SA",
                      )
                    : ""}
                </span>
              </div>
            )}

            {/* Updates Log Section (Requirement) */}
            {selectedReq.updatesLog && selectedReq.updatesLog.length > 0 && (
              <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl space-y-2">
                <h4 className="text-[11px] font-black text-slate-500">
                  {lang === "ar"
                    ? "سجل تتبع التحديثات والحالات:"
                    : "Status Transition History:"}
                </h4>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {selectedReq.updatesLog.map((log: any, i: number) => (
                    <div
                      key={i}
                      className="text-[10px] flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-white p-2 border border-slate-100 rounded-lg"
                    >
                      <span className="font-bold text-slate-700">
                        {log.action}{" "}
                        <span className="text-indigo-600 font-black px-1">
                          بواسطة ({log.user})
                        </span>
                      </span>
                      <span className="text-slate-400 font-mono" dir="ltr">
                        {new Date(log.timestamp).toLocaleString('en-US')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Buttons control zone (as requested) */}
            <div className="flex flex-col gap-3 pt-3 border-t border-slate-100">
              {/* Step updates for status (strictly compliant to user requirements) */}
              <div className="flex flex-col items-center gap-3 py-3 px-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[11px] font-black text-slate-500 self-start">
                  (تعديل حالة أمر الشراء)
                </p>

                {!selectedReq.isOrder ? (
                  // For requests, show "Filter Materials and Issue Preliminary Pricing" -> tables -> send to pricing
                  <div className="w-full flex flex-col items-center gap-2">
                    {!showFilterPanel ? (
                      <button
                        onClick={() => {
                          // Check availability against materialsStock
                          const inStock: any[] = [];
                          const outStock: any[] = [];

                          selectedReq.items.forEach((item: any) => {
                            const found = materialsStock.find(
                              (m) =>
                                m.itemNameAr === item.itemName ||
                                m.itemNameEn === item.itemName ||
                                m.name === item.itemName ||
                                m.itemName === item.itemName,
                            );
                            const availableQty = found
                              ? Number(found.currentQty || found.quantity || 0)
                              : 0;
                            const unit = found
                              ? found.uom || found.unit || ""
                              : "";
                            const requestedQty = Number(item.qty || 0);

                            if (availableQty >= requestedQty) {
                              inStock.push({ ...item, availableQty, unit });
                            } else {
                              outStock.push({ ...item, availableQty, unit });
                            }
                          });

                          setInStockItems(inStock);
                          setOutOfStockItems(outStock);
                          setShowFilterPanel(true);
                        }}
                        className="w-full max-w-md py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-indigo-150 cursor-pointer"
                      >
                        {lang === "ar"
                          ? "تصفية المواد و اصدار تسعيرة مبدأية"
                          : "Filter Materials & Preliminary Pricing"}
                      </button>
                    ) : (
                      <div className="w-full animate-in slide-in-from-top-4 duration-300">
                        <h4 className="font-bold text-slate-800 text-sm mb-3">
                          {lang === "ar"
                            ? "المواد المطلوبة المتوفرة التي تغطي الطلب"
                            : "Items In Stock"}
                        </h4>
                        <table className="w-full text-right text-xs mb-6 border border-slate-200 rounded-xl overflow-hidden">
                          <thead className="bg-slate-100/50">
                            <tr>
                              <th className="p-2 border-b">
                                {lang === "ar" ? "الصنف" : "Item"}
                              </th>
                              <th className="p-2 border-b">
                                {lang === "ar" ? "الكمية المطلوبة" : "Qty"}
                              </th>
                              <th className="p-2 border-b">
                                {lang === "ar"
                                  ? "المتوفر في المستودع"
                                  : "Available"}
                              </th>
                              <th className="p-2 border-b">
                                {lang === "ar" ? "الملاحظات" : "Notes"}
                              </th>
                              <th className="p-2 border-b">
                                {lang === "ar" ? "الحالة" : "Status"}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {inStockItems.map((pi, idx) => (
                              <tr key={idx} className="border-b bg-white">
                                <td className="p-2 font-bold text-slate-800">
                                  {pi.itemName}
                                </td>
                                <td className="p-2 font-mono">{pi.qty}</td>
                                <td className="p-2 font-mono text-slate-600">
                                  {pi.availableQty || 0} {pi.unit || ""}
                                </td>
                                <td className="p-2 text-slate-500">
                                  {pi.notes || "---"}
                                </td>
                                <td className="p-2 text-emerald-600 font-bold whitespace-nowrap">
                                  ✓{" "}
                                  {lang === "ar"
                                    ? "الكمية تغطي الطلب"
                                    : "Covers Request"}
                                </td>
                              </tr>
                            ))}
                            {inStockItems.length === 0 && (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="p-4 text-center text-slate-400 bg-white"
                                >
                                  ---
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>

                        <h4 className="font-bold text-slate-800 text-sm mb-3">
                          {lang === "ar"
                            ? "عناصر نفذت وتحتاج للطلب"
                            : "Items out of stock needed to order"}
                        </h4>
                        <table className="w-full text-right text-xs mb-6 border border-slate-200 rounded-xl overflow-hidden">
                          <thead className="bg-rose-50/50 text-rose-900">
                            <tr>
                              <th className="p-2 border-b border-rose-100">
                                {lang === "ar" ? "الصنف" : "Item"}
                              </th>
                              <th className="p-2 border-b border-rose-100">
                                {lang === "ar" ? "مطلوب للمشروع" : "Requested"}
                              </th>
                              <th className="p-2 border-b border-rose-100">
                                {lang === "ar" ? "المتوفر" : "Available"}
                              </th>
                              <th className="p-2 border-b border-rose-100 bg-rose-100">
                                {lang === "ar"
                                  ? "كم أحتاج أطلب؟"
                                  : "Need to Buy"}
                              </th>
                              <th className="p-2 border-b border-rose-100">
                                {lang === "ar" ? "الحالة" : "Status"}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {outOfStockItems.map((pi, idx) => {
                              const requested = Number(pi.qty) || 0;
                              const available = Number(pi.availableQty) || 0;
                              const missing =
                                requested > available
                                  ? requested - available
                                  : requested;
                              return (
                                <tr
                                  key={idx}
                                  className="border-b border-rose-50 bg-white"
                                >
                                  <td className="p-2 font-bold text-slate-800">
                                    {pi.itemName}
                                  </td>
                                  <td className="p-2 font-mono">{pi.qty}</td>
                                  <td className="p-2 font-mono text-slate-600">
                                    {pi.availableQty || 0} {pi.unit || ""}
                                  </td>
                                  <td className="p-2 font-mono font-black text-rose-700 bg-rose-50">
                                    {missing} {pi.unit || ""}
                                  </td>
                                  <td className="p-2 text-rose-600 font-bold whitespace-nowrap">
                                    {lang === "ar"
                                      ? "الكمية لا تغطي الطلب"
                                      : "Does Not Cover"}
                                  </td>
                                </tr>
                              );
                            })}
                            {outOfStockItems.length === 0 && (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="p-4 text-center text-slate-400 bg-white"
                                >
                                  ---
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>

                        <button
                          disabled={isSendingToPricing}
                          onClick={async () => {
                            setConfirmDialog({
                              message:
                                lang === "ar"
                                  ? "هل أنت متأكد من تحويل هذا الطلب إلى قسم التسعير والموردين؟"
                                  : "Are you sure you want to send this to the pricing department?",
                              onConfirm: async () => {
                                setIsSendingToPricing(true);
                                try {
                                  // 1. Send data to pricing logic
                                  const payload = {
                                    id: `PRC-${Date.now()}`,
                                    originalRequestId: selectedReq.id,
                                    projectName: selectedReq.projectName,
                                    quotationNumber:
                                      selectedReq.quotationNumber,
                                    requestedBy: selectedReq.requestedBy,
                                    requestedAt: new Date().toISOString(),
                                    status: "تم الارسال للتسعير",
                                    inStockItems: inStockItems,
                                    outOfStockItems: outOfStockItems,
                                  };
                                  await fetch(
                                    `/api/dynamic/pricing_requests/${payload.id}`,
                                    {
                                      method: "PUT",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify(payload),
                                    },
                                  );

                                  // 2. Update Procurement requests to show sent
                                  await fetch(
                                    `/api/dynamic/material_purchase_requests/${selectedReq.id}`,
                                    {
                                      method: "PUT",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        status: "مرسل للموردين والتسعير",
                                      }),
                                    },
                                  );

                                  showLocalToast(
                                    lang === "ar"
                                      ? "تم ارسال الطلب الى التسعير والموردين بنجاح."
                                      : "Data sent to pricing department",
                                    "success",
                                  );
                                  setSelectedReq(null);
                                  fetchRequests();
                                } catch (e) {
                                  showLocalToast(
                                    lang === "ar" ? "حدث خطأ" : "Error",
                                    "err",
                                  );
                                }
                                setIsSendingToPricing(false);
                              },
                            });
                          }}
                          className={`${isSendingToPricing ? "opacity-50" : ""} w-full max-w-md mx-auto py-3 px-6 bg-[#0072BC] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-blue-100 cursor-pointer`}
                        >
                          💸{" "}
                          {lang === "ar"
                            ? "ارسال الطلب الى التسعير والموردين"
                            : "Send Request to Pricing & Suppliers"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Once promoted, we cycle step-by-step: قيد الطلب -> في انتظار الدفع -> تم الطلب من المورد -> تم استلام المواد
                  <div className="w-full flex-col flex items-center gap-2">
                    {(() => {
                      const cur = selectedReq.status;
                      if (
                        cur !== "قيد الطلب" &&
                        cur !== "قيد طلب الانتاج" &&
                        cur !== "في انتظار الدفع" &&
                        cur !== "في انتظار الدفعة" &&
                        cur !== "تم الطلب من المورد" &&
                        cur !== "تم استلام المواد"
                      ) {
                        // If it's something else, the next state is 'قيد طلب الانتاج'
                        return (
                          <button
                            onClick={() => handleNextStatus("قيد طلب الانتاج")}
                            className="w-full max-w-md py-3 px-6 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                          >
                            ⚙️{" "}
                            {lang === "ar"
                              ? "تغيير الحالة إلى قيد طلب الانتاج"
                              : "Set Status to: Under Request"}
                          </button>
                        );
                      } else if (
                        cur === "قيد الطلب" ||
                        cur === "قيد طلب الانتاج"
                      ) {
                        return (
                          <>
                            <button
                              onClick={() =>
                                handleNextStatus("في انتظار الدفع")
                              }
                              className="w-full max-w-md py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                            >
                              💵{" "}
                              {lang === "ar"
                                ? "تغيير الحالة إلى في انتظار الدفع"
                                : "Set Status to: Wait for Payment"}
                            </button>
                          </>
                        );
                      } else if (
                        cur === "في انتظار الدفع" ||
                        cur === "في انتظار الدفعة"
                      ) {
                        return (
                          <>
                            <button
                              onClick={() =>
                                handleNextStatus("تم الطلب من المورد")
                              }
                              className="w-full max-w-md py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                            >
                              🛒{" "}
                              {lang === "ar"
                                ? "تغيير الحالة إلى تم الطلب من المورد"
                                : "Set Status to: Ordered from Supplier"}
                            </button>
                            <button
                              onClick={() => handleRevertStatus("قيد الطلب")}
                              className="w-full max-w-md py-3 px-6 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold rounded-xl text-xs transition border border-rose-200 cursor-pointer flex items-center justify-center gap-2"
                            >
                              {lang === "ar"
                                ? "إلغاء أخر حالة (تراجع)"
                                : "Undo Status to Pending PO"}
                            </button>
                          </>
                        );
                      } else if (cur === "تم الطلب من المورد") {
                        return (
                          <>
                            <button
                              onClick={() =>
                                handleNextStatus("تم استلام المواد")
                              }
                              className="w-full max-w-md py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                            >
                              ✔️{" "}
                              {lang === "ar"
                                ? "تغيير الحالة إلى تم استلام المواد"
                                : "Set Status to: Materials Received"}
                            </button>
                            <button
                              onClick={() =>
                                handleRevertStatus("في انتظار الدفع")
                              }
                              className="w-full max-w-md py-3 px-6 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold rounded-xl text-xs transition border border-rose-200 cursor-pointer flex items-center justify-center gap-2"
                            >
                              {lang === "ar"
                                ? "إلغاء أخر حالة (تراجع)"
                                : "Undo Status to Wait Payment"}
                            </button>
                          </>
                        );
                      } else if (cur === "تم استلام المواد") {
                        return (
                          <>
                            <div className="w-full text-center p-3.5 bg-emerald-50 rounded-xl border border-emerald-250 text-emerald-800 text-xs font-black flex items-center justify-center gap-2">
                              🎉{" "}
                              {lang === "ar"
                                ? "تم استلام وتوريد كافة المواد والـ BoM للمستودع وتحديث الحالة بالكامل"
                                : "BoM Sourcing completed & terms closed!"}
                            </div>
                            <button
                              onClick={() =>
                                handleRevertStatus("تم الطلب من المورد")
                              }
                              className="w-full max-w-md py-3 px-6 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold rounded-xl text-xs transition border border-rose-200 cursor-pointer flex items-center justify-center gap-2"
                            >
                              {lang === "ar"
                                ? "إلغاء أخر حالة (تراجع)"
                                : "Undo Status to Ordered"}
                            </button>
                          </>
                        );
                      }
                    })()}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedReq(null)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold rounded-xl transition text-xs cursor-pointer"
                >
                  {lang === "ar" ? "إغلاق" : "Close"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
