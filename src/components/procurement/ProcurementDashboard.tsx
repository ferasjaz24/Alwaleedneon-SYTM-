import { hasAdvancedPermission } from "../../lib/permissions";
import React, { useState, useEffect } from "react";
import {
  Package,
  Layers,
  AlertTriangle,
  FileText,
  CheckCircle,
  Truck,
  DollarSign,
  Users,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Legend,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface ProcurementDashboardProps {
  lang: "ar" | "en";
  user: any;
  onNavigate?: (tab: string) => void;
}

export default function ProcurementDashboard({
  lang,
  user,
  onNavigate,
}: ProcurementDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState("month"); // today, week, month, year, custom
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [materials, setMaterials] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [productionOrders, setProductionOrders] = useState<any[]>([]);
  const [operations, setOperations] = useState<any[]>([]); // dummy for now or parse from logs

  const fetchData = async () => {
    setLoading(true);
    try {
      const ts = new Date().getTime();
      const [matRes, itemRes, prqRes, supRes, prodRes] = await Promise.all([
        fetch(`/api/dynamic/materials_warehouse?t=${ts}`),
        fetch(`/api/dynamic/items_warehouse?t=${ts}`),
        fetch(`/api/dynamic/material_purchase_requests?t=${ts}`),
        fetch(`/api/dynamic/suppliers?t=${ts}`),
        fetch(`/api/dynamic/sales_production_requests?t=${ts}`),
      ]);

      const mats = matRes.ok ? await matRes.json() : [];
      const itms = itemRes.ok ? await itemRes.json() : [];
      const prqs = prqRes.ok ? await prqRes.json() : [];
      const sups = supRes.ok ? await supRes.json() : [];
      const prods = prodRes.ok ? await prodRes.json() : [];

      setMaterials(mats);
      setItems(itms);
      setPurchaseRequests(prqs);
      setSuppliers(sups);
      setProductionOrders(prods);

      // Extract operations from logs
      let allLogs: any[] = [];
      prqs.forEach((req: any) => {
        if (req.logs) {
          req.logs.forEach((log: any) => {
            allLogs.push({
              date: log.date,
              user: log.user || req.requestedBy,
              department: "Procurement",
              action: log.action,
              ref: req.prqNumber || req.id,
              status: req.status,
            });
          });
        }
      });
      // Sort desc
      allLogs.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      setOperations(allLogs);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filterByDate = (arr: any[], dateField = "date") => {
    return arr.filter((item) => {
      const dateStr = item[dateField] || item.createdAt || item.requestDate;
      if (!dateStr) return true;
      const d = new Date(dateStr);
      const now = new Date();

      if (periodFilter === "today") {
        return d.toDateString() === now.toDateString();
      }
      if (periodFilter === "week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        return d >= startOfWeek;
      }
      if (periodFilter === "month") {
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }
      if (periodFilter === "year") {
        return d.getFullYear() === now.getFullYear();
      }
      if (periodFilter === "custom" && customStartDate && customEndDate) {
        return d >= new Date(customStartDate) && d <= new Date(customEndDate);
      }
      return true;
    });
  };

  // KPI Calculations
  const fMaterials = filterByDate(materials, "createdAt");
  const fItems = filterByDate(items, "createdAt");
  const fPrqs = filterByDate(purchaseRequests, "requestDate");
  const fProds = filterByDate(productionOrders, "requestDate");

  // 1. Total Items (Items + Materials)
  const totalItemsCount = items.length + materials.length;
  const newItemsThisMonth = fItems.length + fMaterials.length; // Approximate based on filter

  // 2. Stock Status (Materials)
  let availableCount = 0;
  let lowCount = 0;
  let outCount = 0;

  materials.forEach((m) => {
    const qty = m.currentQty || 0;
    const min = m.minQty || 0;
    if (qty === 0) outCount++;
    else if (qty <= min) lowCount++;
    else availableCount++;
  });

  // 3. Critical Materials & Inventory Impact on Production
  const missingMaterialsProcs = purchaseRequests.filter(
    (pr) => pr.status === "طلب مواد" || pr.status === "Pending Materials",
  );

  let criticalCount = outCount + lowCount; // Simplify: anything out or low is critical if requested.
  // Real logic: Check production orders needing materials
  // Since we don't have exact BOMs easily mapped, we use PRQs generated from production.

  // 4. PRQ Summaries
  const openPrqs = purchaseRequests.filter(
    (r) => !r.isOrder && r.status !== "مكتمل" && r.status !== "مرفوض",
  );
  const pendingPricingPrqs = openPrqs.filter(
    (r) => r.status === "مرسل للتسعير",
  );
  const pendingFinancePrqs = openPrqs.filter(
    (r) => r.status === "بانتظار التعميد المالي",
  );
  const approvedPrqs = purchaseRequests.filter(
    (r) => r.status === "معتمد" || r.isOrder,
  );

  // 5. Approved POs
  const approvedPos = purchaseRequests.filter((r) => r.isOrder);
  const totalPoValue = approvedPos.reduce(
    (sum, po) => sum + (po.estimatedTotal || 0),
    0,
  );
  const pendingPaymentPos = approvedPos.filter(
    (po) => po.paymentStatus !== "مدفوع",
  );
  const pendingReceiptPos = approvedPos.filter(
    (po) => po.status !== "مكتمل" && po.status !== "تم الاستلام",
  );

  // 6. Receiving
  const receivedThisMonth = filterByDate(
    approvedPos.filter((po) => po.status === "مكتمل"),
    "updatedAt",
  );

  // 7. Value
  const totalInventoryValue =
    materials.reduce(
      (sum, m) => sum + (m.currentQty || 0) * (m.price || 0),
      0,
    ) + items.reduce((sum, i) => sum + (i.currentQty || 0) * (i.price || 0), 0);

  // 8. Suppliers
  const activeSuppliers = suppliers.filter(
    (s) => s.status === "نشط" || !s.status,
  );

  // Charts
  const stockStatusData = [
    {
      name: lang === "ar" ? "متوفر" : "Available",
      value: availableCount,
      color: "#10b981",
    },
    {
      name: lang === "ar" ? "منخفض" : "Low",
      value: lowCount,
      color: "#f59e0b",
    },
    {
      name: lang === "ar" ? "غير متوفر" : "Out of Stock",
      value: outCount,
      color: "#ef4444",
    },
  ];

  const prqStatusCount: any = {};
  purchaseRequests.forEach((r) => {
    const st = r.status || "جديد";
    prqStatusCount[st] = (prqStatusCount[st] || 0) + 1;
  });
  const prqStatusData = Object.entries(prqStatusCount).map(([name, value]) => ({
    name,
    value,
    color: "#6366f1",
  }));

  // Urgent Materials (Out of stock or low)
  const urgentMaterials = materials
    .filter((m) => {
      const qty = m.currentQty || 0;
      const min = m.minQty || 0;
      return qty <= min;
    })
    .slice(0, 5);

  // Health
  const healthPercent = Math.max(0, 100 - outCount * 2 - lowCount);
  let healthStatus = "ممتاز";
  let healthColor = "text-emerald-600";
  if (healthPercent < 50) {
    healthStatus = "خطر";
    healthColor = "text-red-600";
  } else if (healthPercent < 80) {
    healthStatus = "يحتاج متابعة";
    healthColor = "text-amber-600";
  }

  // Alerts
  const alerts = [];
  if (outCount > 0)
    alerts.push({
      text:
        lang === "ar"
          ? `يوجد ${outCount} صنف غير متوفر تماماً.`
          : `${outCount} items completely out of stock.`,
      type: "danger",
    });
  if (lowCount > 0)
    alerts.push({
      text:
        lang === "ar"
          ? `يوجد ${lowCount} صنف وصل للحد الأدنى.`
          : `${lowCount} items reached minimum level.`,
      type: "warning",
    });
  if (pendingFinancePrqs.length > 0)
    alerts.push({
      text:
        lang === "ar"
          ? `يوجد ${pendingFinancePrqs.length} طلب بانتظار التعميد المالي.`
          : `${pendingFinancePrqs.length} requests pending financial approval.`,
      type: "info",
    });
  if (missingMaterialsProcs.length > 0)
    alerts.push({
      text:
        lang === "ar"
          ? `يوجد مشاريع إنتاج متأثرة بنقص المواد.`
          : `Production projects affected by material shortage.`,
      type: "danger",
    });
  if (alerts.length === 0)
    alerts.push({
      text:
        lang === "ar"
          ? "حالة المخزون والمشتريات مستقرة."
          : "Inventory and procurement status is stable.",
      type: "success",
    });

  // Top Materials logic
  const materialReqCount: any = {};
  purchaseRequests.forEach((r) => {
    if (r.materials) {
      r.materials.forEach((m: any) => {
        const matName = m.name || m.materialName || "مادة";
        materialReqCount[matName] =
          (materialReqCount[matName] || 0) + (m.quantity || 1);
      });
    }
  });
  const topMaterialsData = Object.entries(materialReqCount)
    .map(([name, value]) => ({
      name: name.length > 15 ? name.substring(0, 15) + "..." : name,
      value,
    }))
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 5);

  // Category logic
  const categoryCount: any = {};
  materials.forEach((m) => {
    const cat = m.category || "أخرى";
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });
  const categoryData = Object.entries(categoryCount).map(([name, value]) => ({
    name,
    value,
  }));

  // PO Value logic
  const monthlyPoValues: any = {};
  approvedPos.forEach((po) => {
    const d = new Date(po.createdAt || po.requestDate);
    const monthYear = d.toLocaleString('en-US', {
      month: "short",
      year: "numeric",
    });
    monthlyPoValues[monthYear] =
      (monthlyPoValues[monthYear] || 0) + (po.estimatedTotal || 0);
  });
  const poValueData = Object.entries(monthlyPoValues).map(([name, value]) => ({
    name,
    value,
  }));

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        {lang === "ar"
          ? "جاري تحميل بيانات لوحة القيادة..."
          : "Loading dashboard data..."}
      </div>
    );
  }

  return (
    <div
      className="space-y-6 animate-fade-in"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <PieChart className="w-8 h-8 text-indigo-600" />
            {lang === "ar"
              ? "لوحة قيادة المشتريات والمستودع"
              : "Procurement & Inventory Dashboard"}
          </h2>
          <p className="text-sm font-bold text-slate-500 mt-1">
            {lang === "ar"
              ? "نظرة شاملة ومباشرة على حالة المخزون والمشتريات والموردين."
              : "Comprehensive overview of inventory, procurement, and suppliers."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {periodFilter === "custom" && (
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 outline-none focus:border-indigo-500"
              />
              <span className="text-slate-400 text-xs font-bold">-</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 outline-none focus:border-indigo-500"
              />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            {["today", "week", "month", "year", "custom"].map((period) => (
              <button
                key={period}
                onClick={() => setPeriodFilter(period)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  periodFilter === period
                    ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {lang === "ar"
                  ? period === "today"
                    ? "اليوم"
                    : period === "week"
                      ? "هذا الأسبوع"
                      : period === "month"
                        ? "هذا الشهر"
                        : period === "year"
                          ? "هذه السنة"
                          : "مخصص"
                  : period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
            <button
              onClick={fetchData}
              className="px-3 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Items */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[11px] font-bold text-slate-400">
                {lang === "ar" ? "إجمالي الأصناف" : "Total Items"}
              </p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">
                {totalItemsCount}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-2 mt-2 pt-3 border-t border-slate-50">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-500">
                {lang === "ar" ? "أصناف جديدة" : "New Items"}
              </span>
              <span className="text-blue-600">{newItemsThisMonth}</span>
            </div>
          </div>
        </div>

        {/* Stock Status */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[11px] font-bold text-slate-400">
                {lang === "ar" ? "حالة المخزون" : "Stock Status"}
              </p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">
                {materials.length}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <Layers className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-2 mt-2 pt-3 border-t border-slate-50">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-emerald-500">
                {lang === "ar" ? "متوفر" : "Available"}
              </span>
              <span className="text-emerald-600">{availableCount}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-amber-500">
                {lang === "ar" ? "منخفض" : "Low"}
              </span>
              <span className="text-amber-600">{lowCount}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-red-500">
                {lang === "ar" ? "غير متوفر" : "Out of Stock"}
              </span>
              <span className="text-red-600">{outCount}</span>
            </div>
          </div>
        </div>

        {/* PRQs */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[11px] font-bold text-slate-400">
                {lang === "ar" ? "طلبات الشراء المفتوحة" : "Open PRQs"}
              </p>
              <h3 className="text-3xl font-black text-indigo-600 mt-1">
                {openPrqs.length}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
              <FileText className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-2 mt-2 pt-3 border-t border-slate-50">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-500">
                {lang === "ar" ? "بانتظار التسعير" : "Pending Pricing"}
              </span>
              <span className="text-indigo-600">
                {pendingPricingPrqs.length}
              </span>
            </div>
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-500">
                {lang === "ar" ? "بانتظار التعميد" : "Pending Approval"}
              </span>
              <span className="text-amber-600">
                {pendingFinancePrqs.length}
              </span>
            </div>
          </div>
        </div>

        {/* POs */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[11px] font-bold text-slate-400">
                {lang === "ar" ? "أوامر الشراء المعتمدة" : "Approved POs"}
              </p>
              <h3 className="text-3xl font-black text-emerald-600 mt-1">
                {approvedPos.length}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-2 mt-2 pt-3 border-t border-slate-50">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-500">
                {lang === "ar" ? "بانتظار الدفع" : "Pending Payment"}
              </span>
              <span className="text-amber-600">{pendingPaymentPos.length}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-500">
                {lang === "ar" ? "بانتظار الاستلام" : "Pending Receipt"}
              </span>
              <span className="text-blue-600">{pendingReceiptPos.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Alerts Box */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            {lang === "ar"
              ? "تنبيهات المشتريات والمستودع"
              : "Procurement & Inventory Alerts"}
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-2xl border text-xs font-bold flex items-start gap-3 ${
                  alert.type === "danger"
                    ? "bg-red-50 border-red-100 text-red-800"
                    : alert.type === "warning"
                      ? "bg-amber-50 border-amber-100 text-amber-800"
                      : alert.type === "success"
                        ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                        : "bg-blue-50 border-blue-100 text-blue-800"
                }`}
              >
                <span className="mt-0.5">
                  {alert.type === "danger"
                    ? "🔴"
                    : alert.type === "warning"
                      ? "🟠"
                      : alert.type === "success"
                        ? "🟢"
                        : "🔵"}
                </span>
                <span className="leading-relaxed flex-1">{alert.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Health Gauge */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
          <h3 className="text-sm font-black text-slate-800 absolute top-6 right-6 flex items-center gap-2">
            {lang === "ar" ? "صحة المخزون" : "Inventory Health"}
          </h3>
          <div className="w-32 h-32 mt-8 relative">
            <svg
              viewBox="0 0 100 50"
              className="w-full h-full overflow-visible"
            >
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="12"
                strokeLinecap="round"
              />
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke={
                  healthPercent > 80
                    ? "#10b981"
                    : healthPercent > 50
                      ? "#f59e0b"
                      : "#ef4444"
                }
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={"" + (healthPercent / 100) * 125 + " 125"}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
              <span className={"text-3xl font-black " + healthColor}>
                {healthPercent}%
              </span>
            </div>
          </div>
          <div
            className={
              "mt-6 px-4 py-2 rounded-xl text-xs font-bold bg-slate-50 " +
              healthColor
            }
          >
            {lang === "ar" ? "الحالة: " : "Status: "} {healthStatus}
          </div>
        </div>

        {/* Supply Speed & Impact */}
        <div className="grid grid-rows-2 gap-6">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">
                  {lang === "ar" ? "متوسط سرعة التوريد" : "Avg Supply Speed"}
                </p>
                <h4 className="text-lg font-black text-slate-800">
                  {lang === "ar" ? "4 أيام" : "4 Days"}
                </h4>
              </div>
            </div>
            <div className="text-[10px] font-bold text-slate-500 flex justify-between">
              <span>{lang === "ar" ? "طلبات متأخرة:" : "Delayed:"}</span>
              <span className="text-red-500">{pendingReceiptPos.length}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-fuchsia-50 text-fuchsia-500 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">
                  {lang === "ar"
                    ? "تأثير المخزون على الإنتاج"
                    : "Production Impact"}
                </p>
                <h4 className="text-lg font-black text-slate-800">
                  {missingMaterialsProcs.length}
                </h4>
              </div>
            </div>
            <div className="text-[10px] font-bold text-slate-500 flex justify-between">
              <span>
                {lang === "ar" ? "طلبات مواد عاجلة:" : "Urgent Reqs:"}
              </span>
              <span className="text-amber-600">
                {
                  missingMaterialsProcs.filter(
                    (p: any) => p.priority === "عالي" || p.priority === "High",
                  ).length
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 mb-4">
            {lang === "ar" ? "توزيع حالة المخزون" : "Stock Status"}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockStatusData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stockStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "10px", fontWeight: "bold" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 mb-4">
            {lang === "ar" ? "حالات طلبات الشراء" : "PRQ Statuses"}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={prqStatusData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                />
                <RechartsTooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 mb-4">
            {lang === "ar" ? "الأصناف حسب التصنيف" : "Items by Category"}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                />
                <RechartsTooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#8b5cf6"
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 mb-4">
            {lang === "ar" ? "أكثر المواد طلباً" : "Top Requested Materials"}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topMaterialsData}
                layout="vertical"
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  width={80}
                />
                <RechartsTooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#ec4899"
                  radius={[0, 6, 6, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {hasAdvancedPermission(
          user,
          "procurement",
          "finance_approval",
          "view_finance_po",
        ) ? (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 mb-4">
              {lang === "ar"
                ? "قيمة أوامر الشراء المعتمدة"
                : "Approved PO Value"}
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={poValueData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="hidden"></div>
        )}
      </div>

      {/* Production Material Requests Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-fuchsia-500" />
            {lang === "ar"
              ? "طلبات المواد من الإنتاج"
              : "Production Material Requests"}
          </h3>
          <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
            {lang === "ar" ? "عرض الكل" : "View All"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table
            className="w-full text-sm text-left"
            dir={lang === "ar" ? "rtl" : "ltr"}
          >
            <thead className="text-[10px] uppercase bg-slate-50 text-slate-500 font-bold">
              <tr>
                <th className="px-4 py-3 rounded-r-xl">
                  {lang === "ar" ? "رقم الطلب" : "Req No"}
                </th>
                <th className="px-4 py-3">
                  {lang === "ar" ? "المشروع" : "Project"}
                </th>
                <th className="px-4 py-3">
                  {lang === "ar" ? "المادة المطلوبة" : "Requested Material"}
                </th>
                <th className="px-4 py-3">
                  {lang === "ar" ? "الكمية" : "Qty"}
                </th>
                <th className="px-4 py-3">
                  {lang === "ar" ? "تاريخ الحاجة" : "Needed Date"}
                </th>
                <th className="px-4 py-3">
                  {lang === "ar" ? "الحالة" : "Status"}
                </th>
                <th className="px-4 py-3 rounded-l-xl text-center">
                  {lang === "ar" ? "إجراء" : "Action"}
                </th>
              </tr>
            </thead>
            <tbody>
              {missingMaterialsProcs.slice(0, 5).map((pr, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs font-bold text-fuchsia-600">
                    {pr.prqNumber || pr.id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">
                    {pr.projectName || "---"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {pr.materials?.[0]?.name ||
                      pr.materials?.[0]?.materialName ||
                      "---"}
                  </td>
                  <td className="px-4 py-3 font-bold text-fuchsia-600">
                    {pr.materials?.[0]?.quantity || 0}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {new Date(
                      pr.requestDate || pr.createdAt,
                    ).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                      {pr.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800">
                      {lang === "ar" ? "صرف / شراء" : "Issue / Buy"}
                    </button>
                  </td>
                </tr>
              ))}
              {missingMaterialsProcs.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-slate-500 font-bold"
                  >
                    {lang === "ar"
                      ? "لا توجد طلبات مواد من الإنتاج"
                      : "No production material requests."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open PRQs Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            {lang === "ar" ? "طلبات الشراء المفتوحة" : "Open PRQs"}
          </h3>
          <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
            {lang === "ar" ? "عرض الكل" : "View All"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table
            className="w-full text-sm text-left"
            dir={lang === "ar" ? "rtl" : "ltr"}
          >
            <thead className="text-[10px] uppercase bg-slate-50 text-slate-500 font-bold">
              <tr>
                <th className="px-4 py-3 rounded-r-xl">
                  {lang === "ar" ? "رقم الطلب" : "PRQ No"}
                </th>
                <th className="px-4 py-3">
                  {lang === "ar" ? "المشروع" : "Project"}
                </th>
                <th className="px-4 py-3">
                  {lang === "ar" ? "طالب الشراء" : "Requested By"}
                </th>
                <th className="px-4 py-3">
                  {lang === "ar" ? "تاريخ الطلب" : "Date"}
                </th>
                <th className="px-4 py-3">
                  {lang === "ar" ? "الحالة" : "Status"}
                </th>
                <th className="px-4 py-3 rounded-l-xl text-center">
                  {lang === "ar" ? "إجراء" : "Action"}
                </th>
              </tr>
            </thead>
            <tbody>
              {openPrqs.slice(0, 5).map((prq, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs font-bold text-indigo-600">
                    {prq.prqNumber || prq.id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">
                    {prq.projectName || "---"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {prq.requestedBy}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {new Date(
                      prq.requestDate || prq.createdAt,
                    ).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                      {prq.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800">
                      {lang === "ar" ? "عرض" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
              {openPrqs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-500 font-bold"
                  >
                    {lang === "ar"
                      ? "لا توجد طلبات شراء مفتوحة"
                      : "No open PRQs."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approved POs Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            {lang === "ar" ? "أوامر الشراء المعتمدة" : "Approved POs"}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table
            className="w-full text-sm text-left"
            dir={lang === "ar" ? "rtl" : "ltr"}
          >
            <thead className="text-[10px] uppercase bg-slate-50 text-slate-500 font-bold">
              <tr>
                <th className="px-4 py-3 rounded-r-xl">
                  {lang === "ar" ? "رقم الأمر" : "PO No"}
                </th>
                <th className="px-4 py-3">
                  {lang === "ar" ? "المورد" : "Supplier"}
                </th>
                <th className="px-4 py-3">
                  {lang === "ar" ? "المشروع" : "Project"}
                </th>
                <th className="px-4 py-3">
                  {lang === "ar" ? "القيمة" : "Value"}
                </th>
                <th className="px-4 py-3">
                  {lang === "ar"
                    ? "تاريخ الاستلام المتوقع"
                    : "Expected Receipt"}
                </th>
                <th className="px-4 py-3 rounded-l-xl text-center">
                  {lang === "ar" ? "الحالة" : "Status"}
                </th>
              </tr>
            </thead>
            <tbody>
              {approvedPos.slice(0, 5).map((po, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs font-bold text-emerald-600">
                    {po.orderNumber || po.id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">
                    {po.selectedSupplier?.name || "---"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {po.projectName || "---"}
                  </td>
                  <td className="px-4 py-3 font-bold text-emerald-600">
                    {po.estimatedTotal || 0} SAR
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {po.expectedDelivery
                      ? new Date(po.expectedDelivery).toLocaleDateString()
                      : "---"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                      {po.status}
                    </span>
                  </td>
                </tr>
              ))}
              {approvedPos.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-500 font-bold"
                  >
                    {lang === "ar"
                      ? "لا توجد أوامر شراء معتمدة"
                      : "No approved POs."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operations Activity Feed */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            {lang === "ar"
              ? "آخر عمليات المستودع والمشتريات"
              : "Recent Operations"}
          </h3>
        </div>
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
          {operations.slice(0, 10).map((op, i) => (
            <div
              key={i}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                    {new Date(op.date).toLocaleString('en-US')}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-indigo-600 border border-indigo-100">
                    {op.user}
                  </span>
                </div>
                <h4 className="text-xs font-black text-slate-800">
                  {op.action}
                </h4>
                <div className="text-[10px] text-slate-500 mt-1 font-bold">
                  {lang === "ar" ? "المرجع:" : "Ref:"}{" "}
                  <span className="text-slate-700">{op.ref}</span>
                </div>
              </div>
            </div>
          ))}
          {operations.length === 0 && (
            <div className="text-center py-8 text-xs font-bold text-slate-400">
              {lang === "ar"
                ? "لا توجد عمليات مؤخراً"
                : "No recent operations."}
            </div>
          )}
        </div>
      </div>

      {/* Urgent Materials Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            {lang === "ar" ? "مواد تحتاج تدخل سريع" : "Urgent Materials"}
          </h3>
          <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
            {lang === "ar" ? "عرض الكل" : "View All"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table
            className="w-full text-sm text-left"
            dir={lang === "ar" ? "rtl" : "ltr"}
          >
            <thead className="text-[10px] uppercase bg-slate-50 text-slate-500 font-bold">
              <tr>
                <th className="px-4 py-3 rounded-r-xl">
                  {lang === "ar" ? "كود المادة" : "Code"}
                </th>
                <th className="px-4 py-3">
                  {lang === "ar" ? "اسم المادة" : "Material Name"}
                </th>
                <th className="px-4 py-3">
                  {lang === "ar" ? "الكمية الحالية" : "Current Qty"}
                </th>
                <th className="px-4 py-3">
                  {lang === "ar" ? "الحد الأدنى" : "Min Qty"}
                </th>
                <th className="px-4 py-3 rounded-l-xl text-center">
                  {lang === "ar" ? "إجراء" : "Action"}
                </th>
              </tr>
            </thead>
            <tbody>
              {urgentMaterials.map((mat, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs">
                    {mat.code || mat.id.slice(0, 6)}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">
                    {mat.name}
                  </td>
                  <td className="px-4 py-3 font-bold text-red-600">
                    {mat.currentQty || 0}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-500">
                    {mat.minQty || 0}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button className="text-[10px] font-bold text-white bg-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-700">
                      {lang === "ar" ? "إنشاء طلب شراء" : "Create PRQ"}
                    </button>
                  </td>
                </tr>
              ))}
              {urgentMaterials.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-slate-500 font-bold"
                  >
                    {lang === "ar"
                      ? "لا توجد مواد ناقصة حالياً"
                      : "No urgent materials."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Shortcuts */}
      {hasAdvancedPermission(user, 'dashboard', 'quick_shortcuts', 'view_procurement_shortcuts') && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 mb-4">
            {lang === "ar" ? "اختصارات سريعة" : "Quick Shortcuts"}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[
              {
                label: lang === "ar" ? "إضافة صنف" : "Add Item",
                icon: Plus,
                action: "warehouse_items",
                bg: "bg-indigo-50",
                color: "text-indigo-600",
              },
              {
                label: lang === "ar" ? "طلب شراء" : "Purchase Req",
                icon: FileText,
                action: "warehouse_procurement",
                bg: "bg-blue-50",
                color: "text-blue-600",
              },
              {
                label: lang === "ar" ? "أوامر الشراء" : "POs",
                icon: CheckCircle,
                action: "warehouse_finance_approval",
                bg: "bg-emerald-50",
                color: "text-emerald-600",
              },
              {
                label: lang === "ar" ? "الموردين" : "Suppliers",
                icon: Users,
                action: "warehouse_suppliers_pricing",
                bg: "bg-amber-50",
                color: "text-amber-600",
              },
            ].map((btn, i) => (
              <button
                key={i}
                onClick={() => onNavigate && onNavigate(btn.action)}
                className="p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all flex flex-col items-center justify-center gap-3 group cursor-pointer bg-white"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${btn.bg} flex items-center justify-center ${btn.color} group-hover:scale-110 transition-transform`}
                >
                  <btn.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-700 text-center">
                  {btn.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
