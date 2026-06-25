import React, { useState, useMemo } from "react";
import { hasAdvancedPermission } from "../../lib/permissions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Building2,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Truck,
  ArrowRight,
  Settings,
  FileText,
  Hammer,
  Target,
  Users,
  Gauge,
  Zap,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

interface ProductionDashboardProps {
  lang: "ar" | "en";
  user: any;
  inboundRequests: any[];
  productionOrders: any[];
  activeProjects: any[];
  procurementRequests: any[];
  installationRequests: any[];
  installationOrders: any[];
  onSelectSubTab?: (id: string) => void;
}

export default function ProductionDashboard({
  lang,
  user,
  inboundRequests,
  productionOrders,
  activeProjects,
  procurementRequests,
  installationRequests,
  installationOrders,
  onSelectSubTab,
}: ProductionDashboardProps) {
  const [periodFilter, setPeriodFilter] = useState("month"); // today, week, month, year, custom

  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const filterByDate = (arr: any[]) => {
    return arr.filter((item) => {
      const dateStr =
        item.requestDate || item.startedAt || item.createdAt || item.date;
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

  const fInboundRequests = filterByDate(inboundRequests);
  const fProductionOrders = filterByDate(productionOrders);
  const fActiveProjects = filterByDate(activeProjects);
  const fProcurementRequests = filterByDate(procurementRequests);
  const fInstallationRequests = filterByDate(installationRequests);
  const fInstallationOrders = filterByDate(installationOrders);

  // Derived calculations
  const newRequests = fInboundRequests.filter(
    (r) => r.status === "طلب جديد" || r.status === "New Request",
  );
  const pendingReviewRequests = fInboundRequests.filter(
    (r) => r.status === "قيد المراجعة" || r.status === "Under Review",
  );
  const needsMaterialsReqs = fInboundRequests.filter(
    (r) => r.status === "بانتظار المواد" || r.status === "Pending Materials",
  );

  const activeOrders = fProductionOrders.filter(
    (o) => o.status !== "مغلق" && o.status !== "ملغى",
  );
  const manufacturingOrders = fProductionOrders.filter(
    (o) => o.status === "قيد التصنيع",
  );
  const prepOrders = fProductionOrders.filter(
    (o) => o.status === "قيد التجهيز",
  );
  const stoppedOrders = fProductionOrders.filter(
    (o) => o.status === "متوقف" || o.status === "Stopped",
  );

  const inProductionProjects = fActiveProjects.filter(
    (p) =>
      p.status === "قيد الإنتاج" ||
      p.status === "قيد التصنيع" ||
      p.status === "قيد التنفيذ" ||
      p.status === "In Production",
  );
  const normalProjects = inProductionProjects.filter((p) => !p.delayed);
  const needsFollowup = inProductionProjects.filter((p) => p.delayed);

  const delayedProjects = fActiveProjects.filter((p) => {
    if (!p.expectedDelivery) return false;
    const exp = new Date(p.expectedDelivery);
    return (
      exp < new Date() &&
      p.status !== "مكتمل" &&
      p.status !== "جاهز للتركيب" &&
      p.status !== "تم التسليم"
    );
  });

  const readyForInstall = fActiveProjects.filter(
    (p) =>
      p.status === "جاهز للتركيب" ||
      p.status === "في انتظار التركيب" ||
      p.status === "Ready for Installation",
  );
  const completedProjects = fActiveProjects.filter(
    (p) =>
      p.status === "مكتمل" ||
      p.status === "تم التسليم" ||
      p.status === "تم التركيب بنجاح" ||
      p.status === "تم التركيب والتشغيل",
  );

  const missingMaterialsProcs = fProcurementRequests.filter(
    (pr) => pr.status === "طلب مواد" || pr.status === "بانتظار المشتريات",
  );

  // Charts Data
  const statusDistData = [
    {
      name: lang === "ar" ? "جديد" : "New",
      value: newRequests.length,
      color: "#3b82f6",
    },
    {
      name: lang === "ar" ? "قيد التجهيز" : "Prep",
      value: prepOrders.length,
      color: "#f59e0b",
    },
    {
      name: lang === "ar" ? "قيد التصنيع" : "Manufacturing",
      value: manufacturingOrders.length,
      color: "#8b5cf6",
    },
    {
      name: lang === "ar" ? "جاهز للتركيب" : "Ready Install",
      value: readyForInstall.length,
      color: "#10b981",
    },
    {
      name: lang === "ar" ? "متأخر" : "Delayed",
      value: delayedProjects.length,
      color: "#ef4444",
    },
    {
      name: lang === "ar" ? "مكتمل" : "Completed",
      value: completedProjects.length,
      color: "#059669",
    },
    {
      name: lang === "ar" ? "متوقف" : "Stopped",
      value: stoppedOrders.length,
      color: "#6b7280",
    },
  ].filter((d) => d.value > 0);

  const phasesCount: Record<string, number> = {};
  inProductionProjects.forEach((p) => {
    if (
      p.pipelineStages &&
      Array.isArray(p.pipelineStages) &&
      typeof p.currentStageIndex === "number"
    ) {
      const stage = p.pipelineStages[p.currentStageIndex];
      if (stage && stage.name) {
        phasesCount[stage.name] = (phasesCount[stage.name] || 0) + 1;
      }
    }
  });

  const phasesData = Object.entries(phasesCount)
    .map(([name, count]) => ({
      name,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const delayProdData = [
    {
      name: lang === "ar" ? "في الموعد" : "On Time",
      count: normalProjects.length,
      color: "#10b981",
    },
    {
      name: lang === "ar" ? "متأخر" : "Delayed",
      count: delayedProjects.length,
      color: "#ef4444",
    },
    {
      name: lang === "ar" ? "متوقف" : "Stopped",
      count: stoppedOrders.length,
      color: "#f59e0b",
    },
    {
      name: lang === "ar" ? "مكتمل" : "Completed",
      count: completedProjects.length,
      color: "#3b82f6",
    },
  ];

  // Real Alerts
  const alerts = [];
  if (delayedProjects.length > 0)
    alerts.push({
      text:
        lang === "ar"
          ? `يوجد ${delayedProjects.length} مشروع متأخر.`
          : `There are ${delayedProjects.length} delayed projects.`,
      type: "danger",
    });
  if (missingMaterialsProcs.length > 0)
    alerts.push({
      text:
        lang === "ar"
          ? `يوجد مشاريع متوقفة بسبب نقص مواد.`
          : `Projects stopped due to missing materials.`,
      type: "danger",
    });
  if (newRequests.length > 0)
    alerts.push({
      text:
        lang === "ar"
          ? `يوجد ${newRequests.length} طلب إنتاج جديد بانتظار الاستلام.`
          : `${newRequests.length} new inbound requests pending.`,
      type: "warning",
    });
  if (readyForInstall.length > 0)
    alerts.push({
      text:
        lang === "ar"
          ? `يوجد ${readyForInstall.length} مشروع جاهز بانتظار الجدولة.`
          : `${readyForInstall.length} projects ready for installation.`,
      type: "info",
    });
  if (alerts.length === 0)
    alerts.push({
      text: lang === "ar" ? "لا توجد تنبيهات حالية." : "No active alerts.",
      type: "success",
    });

  return (
    <div
      className="space-y-6 animate-fade-in"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* 1. Header & Filter */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Gauge className="w-8 h-8 text-[#0072BC]" />
            {lang === "ar"
              ? "لوحة قيادة الإنتاج والمؤشرات"
              : "Production Dashboard"}
          </h2>
          <p className="text-slate-500 text-xs mt-2 font-medium">
            {lang === "ar"
              ? "صورة شاملة وسريعة عن حالة المصنع والمشاريع والإنتاج والتركيب والمواد."
              : "Comprehensive overview of factory status, projects, and materials."}
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
          </div>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: New Requests */}
        <div className="bg-white p-5 rounded-3xl border border-blue-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[11px] font-bold text-slate-400">
                {lang === "ar" ? "طلبات الإنتاج الجديدة" : "New Requests"}
              </p>
              <h3 className="text-3xl font-black text-blue-600 mt-1">
                {newRequests.length}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-2 mt-2 pt-3 border-t border-slate-50">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-500">
                {lang === "ar" ? "بانتظار المراجعة" : "Pending Review"}
              </span>
              <span className="text-slate-800">
                {pendingReviewRequests.length}
              </span>
            </div>
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-500">
                {lang === "ar" ? "تحتاج مواد" : "Needs Materials"}
              </span>
              <span className="text-amber-600">
                {needsMaterialsReqs.length}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Orders */}
        <div className="bg-white p-5 rounded-3xl border border-indigo-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[11px] font-bold text-slate-400">
                {lang === "ar" ? "أوامر الإنتاج النشطة" : "Active Orders"}
              </p>
              <h3 className="text-3xl font-black text-indigo-600 mt-1">
                {activeOrders.length}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
              <Settings className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-2 mt-2 pt-3 border-t border-slate-50">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-500">
                {lang === "ar" ? "قيد التصنيع" : "Manufacturing"}
              </span>
              <span className="text-indigo-600">
                {manufacturingOrders.length}
              </span>
            </div>
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-500">
                {lang === "ar" ? "متوقفة" : "Stopped"}
              </span>
              <span className="text-red-600">{stoppedOrders.length}</span>
            </div>
          </div>
        </div>

        {/* Card 3: In Production Projects */}
        <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[11px] font-bold text-slate-400">
                {lang === "ar" ? "المشاريع قيد الإنتاج" : "Projects in Prod"}
              </p>
              <h3 className="text-3xl font-black text-emerald-600 mt-1">
                {inProductionProjects.length}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <Hammer className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-2 mt-2 pt-3 border-t border-slate-50">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-500">
                {lang === "ar" ? "تسير طبيعياً" : "On Track"}
              </span>
              <span className="text-emerald-600">{normalProjects.length}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-500">
                {lang === "ar" ? "تحتاج متابعة" : "Needs Followup"}
              </span>
              <span className="text-amber-600">{needsFollowup.length}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Delayed Projects */}
        <div className="bg-white p-5 rounded-3xl border border-red-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 bg-red-50 rounded-br-full -z-10 opacity-50"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[11px] font-bold text-red-400">
                {lang === "ar" ? "المشاريع المتأخرة" : "Delayed Projects"}
              </p>
              <h3 className="text-3xl font-black text-red-600 mt-1">
                {delayedProjects.length}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-2 text-[10px] font-bold text-red-700 bg-red-50/50 p-2.5 rounded-xl border border-red-100">
            {lang === "ar"
              ? "تحتاج تدخل عاجل لمعالجة التأخير"
              : "Urgent intervention needed"}
          </div>
        </div>

        {/* Card 5: Ready for Install */}
        <div className="bg-white p-5 rounded-3xl border border-teal-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[11px] font-bold text-slate-400">
                {lang === "ar" ? "جاهزة للتركيب" : "Ready to Install"}
              </p>
              <h3 className="text-3xl font-black text-teal-600 mt-1">
                {readyForInstall.length}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-500">
              <Truck className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-2 mt-2 pt-3 border-t border-slate-50">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-500">
                {lang === "ar" ? "بانتظار الجدولة" : "Pending Schedule"}
              </span>
              <span className="text-teal-600">{readyForInstall.length}</span>
            </div>
          </div>
        </div>

        {/* Card 6: Completed */}
        <div className="bg-white p-5 rounded-3xl border border-green-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[11px] font-bold text-slate-400">
                {lang === "ar" ? "المشاريع المكتملة" : "Completed"}
              </p>
              <h3 className="text-3xl font-black text-green-600 mt-1">
                {completedProjects.length}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-2 mt-2 pt-3 border-t border-slate-50">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-500">
                {lang === "ar" ? "تم تسليمها للعميل" : "Delivered"}
              </span>
              <span className="text-green-600">{completedProjects.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* High-Level Gauges & Alerts Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Box */}
        <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            {lang === "ar"
              ? "تنبيهات الإنتاج المهمة"
              : "Important Production Alerts"}
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
      </div>

      {/* 3. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Donut Chart: Status Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm xl:col-span-1">
          <h3 className="text-sm font-black text-slate-800 mb-4">
            {lang === "ar" ? "توزيع حالات الإنتاج" : "Status Distribution"}
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistData}
                  cx="50%"
                  cy="45%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusDistData.map((entry, index) => (
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
                  wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Projects by Phase */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm xl:col-span-1">
          <h3 className="text-sm font-black text-slate-800 mb-4">
            {lang === "ar" ? "المشاريع حسب مراحل الإنتاج" : "Projects by Phase"}
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={phasesData}
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
                  dataKey="count"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Production vs Delay */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm xl:col-span-1">
          <h3 className="text-sm font-black text-slate-800 mb-4">
            {lang === "ar" ? "الإنتاج والتأخير" : "Production & Delays"}
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={delayProdData}
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
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={24}>
                  {delayProdData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Urgent Projects Table */}
      {delayedProjects.length > 0 && (
        <div className="bg-white rounded-3xl border border-red-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-red-100 bg-red-50/50 flex justify-between items-center">
            <h3 className="text-sm font-black text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {lang === "ar"
                ? "مشاريع تحتاج تدخل عاجل"
                : "Projects Needing Urgent Intervention"}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-red-50/50 text-red-800 font-bold">
                <tr>
                  <th className="p-4">
                    {lang === "ar" ? "رقم المشروع" : "Project ID"}
                  </th>
                  <th className="p-4">
                    {lang === "ar" ? "العميل / المشروع" : "Client / Project"}
                  </th>
                  <th className="p-4">{lang === "ar" ? "المرحلة" : "Phase"}</th>
                  <th className="p-4">
                    {lang === "ar" ? "نسبة الإنجاز" : "Progress"}
                  </th>
                  <th className="p-4">
                    {lang === "ar" ? "أيام التأخير" : "Delay Days"}
                  </th>
                  <th className="p-4">
                    {lang === "ar" ? "الإجراء المطلوب" : "Action Required"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-50 text-slate-700 font-medium bg-white">
                {delayedProjects.slice(0, 5).map((p) => {
                  const delayDays = Math.floor(
                    (new Date().getTime() -
                      new Date(p.expectedDelivery).getTime()) /
                      (1000 * 3600 * 24),
                  );
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4 font-mono font-bold text-slate-800">
                        {p.id}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800">
                          {p.projectName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {p.clientName}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-bold">
                          {p.currentPhase || p.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-500 rounded-full"
                              style={{ width: `${p.progress || 30}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">
                            {p.progress || 30}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-lg font-black text-[10px]">
                          {delayDays > 0
                            ? delayDays + (lang === "ar" ? " أيام" : " days")
                            : "---"}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() =>
                            onSelectSubTab &&
                            onSelectSubTab("prod_active_projects")
                          }
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black transition-all shadow-sm"
                        >
                          {lang === "ar" ? "معالجة التأخير" : "Resolve Delay"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Tables Layout (Side by side on large screens) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inbound Requests */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              {lang === "ar"
                ? "طلبات الإنتاج المستلمة"
                : "Received Production Requests"}
            </h3>
            <button
              onClick={() => onSelectSubTab && onSelectSubTab("prod_inbound")}
              className="text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              {lang === "ar" ? "عرض الكل" : "View All"}
            </button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-right text-xs">
              <thead className="bg-white text-slate-400 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-3">
                    {lang === "ar" ? "رقم الطلب" : "Request No"}
                  </th>
                  <th className="p-3">
                    {lang === "ar" ? "المشروع" : "Project"}
                  </th>
                  <th className="p-3">
                    {lang === "ar" ? "تاريخ الاستلام" : "Received"}
                  </th>
                  <th className="p-3">{lang === "ar" ? "الحالة" : "Status"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
                {fInboundRequests.slice(0, 5).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold">{r.id}</td>
                    <td className="p-3">
                      <p className="font-bold text-slate-800">
                        {r.projectName || r.quotationNumber}
                      </p>
                      <p className="text-[10px] text-slate-400">{r.salesRep}</p>
                    </td>
                    <td className="p-3">
                      {r.dateCreated
                        ? new Date(r.dateCreated).toLocaleDateString()
                        : "---"}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold text-[10px]">
                        {r.status || "جديد"}
                      </span>
                    </td>
                  </tr>
                ))}
                {fInboundRequests.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-8 text-center text-slate-400 font-medium"
                    >
                      {lang === "ar"
                        ? "لا توجد طلبات جديدة"
                        : "No new requests"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Production Orders */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-500" />
              {lang === "ar"
                ? "أوامر الإنتاج النشطة"
                : "Active Production Orders"}
            </h3>
            <button
              onClick={() => onSelectSubTab && onSelectSubTab("prod_orders")}
              className="text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              {lang === "ar" ? "عرض الكل" : "View All"}
            </button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-right text-xs">
              <thead className="bg-white text-slate-400 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-3">
                    {lang === "ar" ? "رقم الأمر" : "Order No"}
                  </th>
                  <th className="p-3">
                    {lang === "ar" ? "المشروع" : "Project"}
                  </th>
                  <th className="p-3">
                    {lang === "ar" ? "نسبة الإنجاز" : "Progress"}
                  </th>
                  <th className="p-3">
                    {lang === "ar" ? "المرحلة الحالية" : "Current Phase"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
                {activeOrders.slice(0, 5).map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-indigo-600">
                      {o.id}
                    </td>
                    <td className="p-3 font-bold">{o.projectName}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${o.progress || 10}%` }}
                          ></div>
                        </div>
                        <span className="text-[9px] font-bold text-slate-500">
                          {o.progress || 10}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-[10px]">
                        {o.status || "قيد التجهيز"}
                      </span>
                    </td>
                  </tr>
                ))}
                {activeOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-8 text-center text-slate-400 font-medium"
                    >
                      {lang === "ar"
                        ? "لا توجد أوامر نشطة"
                        : "No active orders"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Quick Shortcuts */}
      {hasAdvancedPermission(user, 'dashboard', 'quick_shortcuts', 'view_production_shortcuts') && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            {
              icon: Building2,
              label: lang === "ar" ? "استلام طلب" : "Receive Req",
              action: "prod_inbound",
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              icon: FileText,
              label: lang === "ar" ? "إنشاء أمر" : "Create Order",
              action: "prod_orders",
              color: "text-indigo-600",
              bg: "bg-indigo-50",
            },
            {
              icon: Target,
              label: lang === "ar" ? "تحديث مرحلة" : "Update Phase",
              action: "prod_active_projects",
              color: "text-purple-600",
              bg: "bg-purple-50",
            },
            {
              icon: AlertCircle,
              label: lang === "ar" ? "تسجيل مشكلة" : "Record Issue",
              action: "prod_active_projects",
              color: "text-red-600",
              bg: "bg-red-50",
            },
            {
              icon: Truck,
              label: lang === "ar" ? "جدولة تركيب" : "Schedule Install",
              action: "prod_installation",
              color: "text-teal-600",
              bg: "bg-teal-50",
            },
            {
              icon: ShieldCheck,
              label: lang === "ar" ? "فحص جودة" : "Quality Check",
              action: "prod_active_projects",
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              icon: Users,
              label: lang === "ar" ? "أداء الفرق" : "Team Perf",
              action: "prod_dashboard",
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              icon: Clock,
              label: lang === "ar" ? "المتأخرات" : "Delays",
              action: "prod_active_projects",
              color: "text-rose-600",
              bg: "bg-rose-50",
            },
          ].map((btn, i) => (
            <button
              key={i}
              onClick={() => onSelectSubTab && onSelectSubTab(btn.action)}
              className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer"
            >
              <div
                className={`w-10 h-10 rounded-xl ${btn.bg} flex items-center justify-center ${btn.color} group-hover:scale-110 transition-transform`}
              >
                <btn.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-600 text-center">
                {btn.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
