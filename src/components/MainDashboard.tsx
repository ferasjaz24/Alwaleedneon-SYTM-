import React, { useState, useEffect } from "react";
import SaudiRiyal from "./SaudiRiyal";
import {
 TrendingUp,
 Users,
 DollarSign,
 Box,
 FileText,
 BadgeAlert,
 Settings,
 Clock,
 CheckCircle,
 Package,
 ArrowUpRight,
 RefreshCw,
 TrendingDown,
 LayoutDashboard,
 AlertCircle,
 CalendarDays,
 UserCheck,
 Activity,
 Briefcase,
 Award,
 ShieldAlert,
 FileClock,
 Calendar,
 FileSignature,
 ChevronRight,
 Download,
 BarChart3,
 AlertTriangle,
 UserPlus,
 Zap,
 Sparkles,
 Shield,
 ArrowRight,
} from "lucide-react";
import { User } from "../types";
import { hasAdvancedPermission, canAccessModule } from "../lib/permissions";
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
 LineChart,
 Line,
} from "recharts";

interface DashboardProps {
 user: User;
 lang: "ar" | "en";
 onNavigate: (tab: string, subTab?: string) => void;
}

export default function MainDashboard({
 user,
 lang,
 onNavigate,
}: DashboardProps) {
 // Filters
 const [selectedMonth, setSelectedMonth] = useState<string>(
 (new Date().getMonth() + 1).toString().padStart(2, "0"),
 );
 const [selectedYear, setSelectedYear] = useState<string>(
 new Date().getFullYear().toString(),
 );
 const [period, setPeriod] = useState<"today" | "week" | "month" | "year">(
 "month",
 );

 const [loading, setLoading] = useState(true);
 const [showAllLogs, setShowAllLogs] = useState(false);

 // States for Data
 const [salesQuotations, setSalesQuotations] = useState<any[]>([]);
 const [financialCollections, setFinancialCollections] = useState<any[]>([]);
 const [productionProjects, setProductionProjects] = useState<any[]>([]);
 const [productionOrders, setProductionOrders] = useState<any[]>([]);
 const [employees, setEmployees] = useState<any[]>([]);
 const [attendance, setAttendance] = useState<any[]>([]);
 const [leaves, setLeaves] = useState<any[]>([]);
 const [inquiries, setInquiries] = useState<any[]>([]);
 const [documentLogs, setDocumentLogs] = useState<any[]>([]);
 const [warehouseItems, setWarehouseItems] = useState<any[]>([]);
 const [materials, setMaterials] = useState<any[]>([]);
 const [activityLogs, setActivityLogs] = useState<any[]>([]);
 const [purchaseRequests, setPurchaseRequests] = useState<any[]>([]);
 const [salesProdRequests, setSalesProdRequests] = useState<any[]>([]);
 const [revenues, setRevenues] = useState<any[]>([]);
 const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);
 const [expenses, setExpenses] = useState<any[]>([]);

 const fetchData = async () => {
 setLoading(true);
 try {
 const ts = new Date().getTime();
 const [
 sqRes,
 fcRes,
 ppRes,
 poRes,
 empRes,
 wiRes,
 mwRes,
 alRes,
 purchaseRes,
 attRes,
 leavesRes,
 inqRes,
 docsRes,
 prodReqsRes,
 revRes,
 ciRes,
 expRes,
 ] = await Promise.all([
 fetch(`/api/sales_quotations?t=${ts}`).then((r) =>
 r.ok ? r.json() : [],
 ),
 fetch(`/api/dynamic/financial_collections?t=${ts}`).then((r) =>
 r.ok ? r.json() : [],
 ),
 fetch(`/api/dynamic/production_projects?t=${ts}`).then((r) =>
 r.ok ? r.json() : [],
 ),
 fetch(`/api/dynamic/production_orders?t=${ts}`).then((r) =>
 r.ok ? r.json() : [],
 ),
 fetch(`/api/employees?t=${ts}`).then((r) => (r.ok ? r.json() : [])),
 fetch(`/api/warehouse_items?t=${ts}`).then((r) =>
 r.ok ? r.json() : [],
 ),
 fetch(`/api/dynamic/materials_warehouse?t=${ts}`).then((r) =>
 r.ok ? r.json() : [],
 ),
 fetch(`/api/dynamic/activity_logs?t=${ts}`).then((r) =>
 r.ok ? r.json() : [],
 ),
 fetch(`/api/dynamic/material_purchase_requests?t=${ts}`).then((r) =>
 r.ok ? r.json() : [],
 ),
 fetch(`/api/attendance?t=${ts}`).then((r) => (r.ok ? r.json() : [])),
 fetch(`/api/leaves?t=${ts}`).then((r) => (r.ok ? r.json() : [])),
 fetch(`/api/inquiries?t=${ts}`).then((r) => (r.ok ? r.json() : [])),
 fetch(`/api/dynamic/document_logs?t=${ts}`).then((r) =>
 r.ok ? r.json() : [],
 ),
 fetch(`/api/dynamic/sales_production_requests?t=${ts}`).then((r) =>
 r.ok ? r.json() : [],
 ),
 fetch(`/api/revenues?t=${ts}`).then((r) => (r.ok ? r.json() : [])),
 fetch(`/api/customer-invoices?t=${ts}`).then((r) => (r.ok ? r.json() : [])),
 fetch(`/api/expenses?t=${ts}`).then((r) => (r.ok ? r.json() : [])),
 ]);

 setSalesQuotations(sqRes);
 setFinancialCollections(fcRes);
 setProductionProjects(ppRes);
 setProductionOrders(poRes);
 setEmployees(empRes);
 setWarehouseItems(wiRes);
 setMaterials(mwRes);
 setActivityLogs(alRes);
 setPurchaseRequests(purchaseRes);
 setAttendance(attRes);
 setLeaves(leavesRes);
 setInquiries(inqRes);
 setDocumentLogs(docsRes);
 setSalesProdRequests(prodReqsRes);
 setRevenues(revRes);
 setCustomerInvoices(ciRes);
 setExpenses(expRes);
 } catch (err) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchData();
 }, [selectedMonth, selectedYear, period]);

 const safeFormatDate = (d: any) => {
 if (!d) return "-";
 const parsed = new Date(d);
 if (isNaN(parsed.getTime())) return "-";
 return parsed.toISOString().split("T")[0];
 };

 const filterByDate = (dateStr: string) => {
 if (!dateStr) return true;
 const d = new Date(dateStr);
 if (isNaN(d.getTime())) return true;

 if (period === "year") {
 return d.getFullYear().toString() === selectedYear;
 } else if (period === "month") {
 return (
 d.getFullYear().toString() === selectedYear &&
 (d.getMonth() + 1).toString().padStart(2, "0") === selectedMonth
 );
 } else if (period === "today") {
 const today = new Date();
 return d.toDateString() === today.toDateString();
 } else if (period === "week") {
 const today = new Date();
 const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
 return d >= weekAgo && d <= today;
 }
 return true;
 };

 // -------------------------
 // CALCULATION LOGIC
 // -------------------------
 const filteredSales = salesQuotations.filter((sq) =>
 filterByDate(sq.date || sq.dateCreated || sq.createdAt || sq.lastUpdated || sq.quoteDate),
 );
 const countSales = filteredSales.length;
 const approvedSales = filteredSales.filter((sq) => sq.status === "معتمد");
 const activeSales = filteredSales.filter(
 (sq) => sq.status === "نشط" || sq.status === "مراجع",
 );
 const draftSales = filteredSales.filter((sq) => sq.status === "مسودة");
 const sentToProdSales = filteredSales.filter(
 (sq) =>
 sq.stage === "Production Start" ||
 sq.stage === "Production Finished" ||
 sq.status === "تم التحويل للإنتاج",
 );

 const totalQuotationsValue = filteredSales.reduce((sum, q) => {
 const st =
 q.items?.reduce(
 (s: number, i: any) => s + i.quantity * (i.unitPrice || 0),
 0,
 ) || 0;
 const fees = q.installationFees || 0;
 const vat = q.vatRate || 0.15;
 return sum + (st + fees) * (1 + vat);
 }, 0);

 const totalSalesValue = filteredSales.reduce((sum, q) => {
 const st =
 q.items?.reduce(
 (s: number, i: any) => s + (Number(i.quantity) || 1) * (Number(i.unitPrice) || 0) * (1 - (Number(i.discountPct) || 0) / 100),
 0,
 ) || 0;
 return sum + (st * 1.15);
 }, 0);

 const filteredCollections = financialCollections.filter((fc) =>
 filterByDate(fc.date || fc.dateCreated || fc.createdAt || fc.lastUpdated),
 );

 // Compute total collections dynamically from Financial Collections phases
 let totalCollected = 0;
 let totalOverdue = 0;
 let overdueCount = 0;

 financialCollections.forEach((fc) => {
 if (fc.phases && Array.isArray(fc.phases)) {
 fc.phases.forEach((ph: any) => {
 const isOverdue = ph.status?.includes("متأخر");
 const isCollected = ph.status?.includes("تم التحصيل") || ph.status?.includes("مدفوعة") || ph.isCollected;
 
 // Use phase date if available, else plan date
 const phaseDate = ph.collectedDate || ph.dueDate || fc.date || fc.createdAt || fc.lastUpdated;
 
 if (filterByDate(phaseDate)) {
 if (isCollected) {
 totalCollected += (Number(ph.amount) || 0);
 }
 if (isOverdue) {
 totalOverdue += (Number(ph.amount) || 0);
 overdueCount++;
 }
 }
 });
 }
 });

 const totalRemaining = Math.max(0, totalSalesValue - totalCollected);

 // Fallback if latePayments array is needed for badge count
 const latePayments = new Array(overdueCount).fill({});

 const prodItems = [...productionProjects, ...productionOrders];
 const newProdOrders = prodItems.filter((p) =>
 ["جديد", "بانتظار الاعتماد", "قيد إسناد المهام"].includes(
 p.status || p.productionStatus,
 ),
 );
 const inProd = prodItems.filter((p) =>
 ["قيد العمل", "قيد التصنيع", "في الإنتاج"].includes(
 p.status || p.productionStatus,
 ),
 );
 const delayedProd = prodItems.filter(
 (p) => (p.status || p.productionStatus) === "متأخر" || p.isDelayed,
 );
 const readyProd = prodItems.filter((p) =>
 ["جاهز للتسليم", "جاهز للتركيب"].includes(p.status || p.productionStatus),
 );
 const completedProd = prodItems.filter((p) =>
 ["مكتمل", "تم التسليم"].includes(p.status || p.productionStatus),
 );

 const totalItems = materials.length;
 const lowStock = materials.filter(
 (i) => (i.currentQty || 0) > 0 && (i.currentQty || 0) <= (i.minStock || 5),
 );
 const outOfStock = materials.filter((i) => (i.currentQty || 0) <= 0);
 const openPurchases = purchaseRequests.filter(
 (r) => r.status !== "تم استلام المواد" && !r.status?.includes("اكتمل"),
 );
 const fromProdReqs = purchaseRequests.filter(
 (r) =>
 r.status === "في انتظار أمر الشراء" || r.status === "في انتظار المراجعة",
 );
 const stockValue = materials.reduce(
 (s, i) => s + (i.currentQty || 0) * (i.purchasePrice || 0),
 0,
 );
 const materialRequestCounts: Record<string, number> = {};
 purchaseRequests.forEach((req) => {
 if (req.items && Array.isArray(req.items)) {
 req.items.forEach((item: any) => {
 const matName = item.itemName || item.name || item.materialName;
 if (matName) {
 materialRequestCounts[matName] =
 (materialRequestCounts[matName] || 0) +
 (Number(item.qty || item.quantity) || 1);
 }
 });
 }
 });

 const sortedMat = Object.entries(materialRequestCounts)
 .sort(([, a], [, b]) => (b as number) - (a as number))
 .slice(0, 5)
 .map(([name, count]) => ({ name, timesRequested: count as number }));

 const countEmp = employees.length;
 const activeEmps = employees.filter((e) => e.status !== "Inactive");

 const approvedLeaves = leaves.filter((l) =>
 ["Approved", "مقبول"].includes(l.status),
 );
 const onVacation =
 approvedLeaves.length > 0
 ? approvedLeaves.length
 : employees.filter((e) => e.status === "OnLeave").length;

 const expiringContracts = employees.filter((e) => {
 if (!e.contractExpiry) return false;
 const diff = new Date(e.contractExpiry).getTime() - new Date().getTime();
 return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
 });

 const expiringIqamas = documentLogs.filter((d) => {
 if (!d.expiryDate || d.documentType !== "إقامة") return false;
 const diff = new Date(d.expiryDate).getTime() - new Date().getTime();
 return diff > 0 && diff < 60 * 24 * 60 * 60 * 1000;
 }).length;

 const pendingRequests = inquiries.filter((i) =>
 ["PENDING", "جديد", "قيد المراجعة"].includes(i.status),
 ).length;

 // INSIGHT TAGS - SALES
 let topOverdue = { val: 0, client: lang === "ar" ? "لا يوجد" : "None" };
 filteredCollections.forEach((fc) => {
 let over =
 fc.phases
 ?.filter((p: any) => !p.status.includes("تم التحصيل"))
 .reduce((s: number, p: any) => s + (p.amount || 0), 0) || 0;
 if (over > topOverdue.val) {
 topOverdue = { val: over, client: fc.clientName || fc.projectName };
 }
 });

 const creatorCounts: Record<string, number> = {};
 approvedSales.forEach((s) => {
 creatorCounts[s.createdBy || s.creatorName || "Auto"] =
 (creatorCounts[s.createdBy || s.creatorName || "Auto"] || 0) + 1;
 });
 const bestSeller = Object.keys(creatorCounts).sort(
 (a, b) => creatorCounts[b] - creatorCounts[a],
 )[0];
 const bestSellerCount = bestSeller ? creatorCounts[bestSeller] : 0;

 const conversionRate =
 countSales > 0 ? Math.round((approvedSales.length / countSales) * 100) : 0;

 // INSIGHT TAGS - PROD
 const delayedByClient = salesProdRequests.filter(
 (p) => p.status === "تم التقييد" && p.holdReason?.includes("العميل"),
 ).length;
 const missingMatProd = salesProdRequests.filter(
 (p) => p.status === "تم التقييد" && p.holdReason?.includes("مواد"),
 ).length;

 const stageCounts: Record<string, number> = {};
 prodItems.forEach((p) => {
 if (
 p.currentStage &&
 p.currentStage !== "مكتمل" &&
 p.currentStage !== "تسليم"
 ) {
 stageCounts[p.currentStage] = (stageCounts[p.currentStage] || 0) + 1;
 }
 });
 const bottleneck = Object.keys(stageCounts).sort(
 (a, b) => stageCounts[b] - stageCounts[a],
 )[0];
 const bottleneckCount = bottleneck ? stageCounts[bottleneck] : 0;
 const topAlerts = [];
 if (latePayments.length > 0)
 topAlerts.push({
 text:
 lang === "ar"
 ? `يوجد ${latePayments.length} دفعات متأخرة`
 : `${latePayments.length} late payments`,
 color: "text-amber-700",
 bg: "bg-amber-100/50",
 border: "border-amber-200",
 });
 if (approvedSales.length > sentToProdSales.length)
 topAlerts.push({
 text:
 lang === "ar"
 ? "عروض معتمدة بانتظار الإنتاج"
 : "Approved quotes pending prod",
 color: "text-blue-700",
 bg: "bg-blue-100/50",
 border: "border-blue-200",
 });
 if (delayedProd.length > 0)
 topAlerts.push({
 text:
 lang === "ar"
 ? `${delayedProd.length} مشاريع متأخرة بالإنتاج`
 : `${delayedProd.length} delayed prod projects`,
 color: "text-rose-700",
 bg: "bg-rose-100/50",
 border: "border-rose-200",
 });
 if (outOfStock.length > 0)
 topAlerts.push({
 text:
 lang === "ar"
 ? `${outOfStock.length} أصناف تنقص المستودع`
 : `${outOfStock.length} missing items`,
 color: "text-rose-700",
 bg: "bg-rose-100/50",
 border: "border-rose-200",
 });
 if (pendingRequests > 0)
 topAlerts.push({
 text:
 lang === "ar"
 ? `يوجد ${pendingRequests} طلب موارد بشرية معلق`
 : `${pendingRequests} pending HR requests`,
 color: "text-orange-700",
 bg: "bg-orange-100/50",
 border: "border-orange-200",
 });
 if (expiringContracts.length > 0)
 topAlerts.push({
 text:
 lang === "ar"
 ? `${expiringContracts.length} عقود ستنتهي قريباً`
 : `${expiringContracts.length} expiring contracts`,
 color: "text-indigo-700",
 bg: "bg-indigo-100/50",
 border: "border-indigo-200",
 });

 // -------------------------
 // HISTORY
 // -------------------------
 let historyLogs: any[] = [];
 filteredSales.slice(0, 3).forEach((s) => {
 if (s && s.id) {
 historyLogs.push({
 date: s.createdAt,
 user: s.createdBy || "Auto",
 dept: "المبيعات",
 action: "إنشاء عرض سعر",
 ref: s.id,
 });
 }
 });
 productionOrders.slice(0, 3).forEach((p) => {
 if (p && p.id) {
 historyLogs.push({
 date: p.createdAt,
 user: p.statusUpdatedBy || "Auto",
 dept: "الإنتاج",
 action: "تحديث أمر إنتاج",
 ref: p.id,
 });
 }
 });
 openPurchases.slice(0, 2).forEach((p) => {
 if (p && p.id) {
 historyLogs.push({
 date: p.requestDate,
 user: p.requestedBy || "Auto",
 dept: "المشتريات",
 action: "طلب شراء مفتوح",
 ref: p.id,
 });
 }
 });
 historyLogs.push(...activityLogs);
 historyLogs.sort(
 (a, b) =>
 (new Date(b.date || b.timestamp).getTime() || 0) -
 (new Date(a.date || a.timestamp).getTime() || 0),
 );
 historyLogs = historyLogs.slice(0, 30);

 if (loading) {
 return (
 <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
 <div className="w-10 h-10 border-4 border-[#0072BC]/20 border-t-[#0072BC] rounded-full animate-spin"></div>
 <p className="text-slate-400 font-bold tracking-wide">
 {lang === "ar"
 ? "جاري تحميل لوحة القيادة التنفيذية..."
 : "Loading Executive Dashboard..."}
 </p>
 </div>
 );
 }

 const isSuperAdminOrOwner = !!(user && (
   user.username?.toUpperCase() === "FERAS" ||
   user.username?.toUpperCase() === "FERASADMIN" ||
   user.username?.toUpperCase() === "فراس" ||
   user.username?.toUpperCase() === "ADMIN" ||
   user.role === "الادارة العليا" ||
   user.role === "الإدارة العليا" ||
   user.role === "top_management" ||
   user.role === "Super Admin" ||
   user.role === "Admin"
 ));

 const canViewMain = isSuperAdminOrOwner || hasAdvancedPermission(user, 'dashboard', 'metrics', 'view_main');
 const canViewSales = canViewMain || hasAdvancedPermission(user, 'dashboard', 'metrics', 'view_sales');
 const canViewProduction = canViewMain || hasAdvancedPermission(user, 'dashboard', 'metrics', 'view_production');
 const canViewHR = canViewMain || hasAdvancedPermission(user, 'dashboard', 'metrics', 'view_hr');
 const canViewProcurement = canViewMain || hasAdvancedPermission(user, 'dashboard', 'metrics', 'view_procurement');
 const canViewAlerts = canViewMain || hasAdvancedPermission(user, 'dashboard', 'metrics', 'view_alerts');
 const canViewLogs = canViewMain || hasAdvancedPermission(user, 'dashboard', 'metrics', 'view_logs');
 const canViewShortcuts = canViewMain || hasAdvancedPermission(user, 'dashboard', 'quick_shortcuts', 'view_main_shortcuts');
 const canFilterDate = canViewMain || hasAdvancedPermission(user, 'dashboard', 'metrics', 'filter_date');

 const hasAnyDashboardMetric = canViewMain || canViewSales || canViewProduction || canViewHR || canViewProcurement || canViewAlerts || canViewLogs || canViewShortcuts;

 if (!hasAnyDashboardMetric) {
   return (
     <div className="space-y-8 pb-12 animate-in fade-in duration-300">
       {/* Welcome Hero Banner */}
       <div className="relative overflow-hidden bg-gradient-to-r from-[#0a2540] via-[#0072BC] to-[#00558c] rounded-3xl p-8 lg:p-10 text-white shadow-xl">
         <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
           <div className="space-y-3 max-w-2xl">
             <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-bold tracking-wide text-blue-100">
               <Sparkles className="w-4 h-4 text-amber-300" />
               <span>{lang === "ar" ? "نظام شركة فنون الوليد" : "Fonoun Alwaleed ERP"}</span>
             </div>
             <h1 className="text-2xl md:text-3xl lg:text-4xl font-black leading-tight">
               {lang === "ar"
                 ? `أهلاً وسهلاً بك، ${user?.username || "المستخدم"} 👋`
                 : `Welcome back, ${user?.username || "User"} 👋`}
             </h1>
             <p className="text-blue-100 text-sm font-medium leading-relaxed">
               {lang === "ar"
                 ? "مرحباً بك في لوحتك الرئيسية. يمكنك الوصول المباشر إلى جميع الأقسام والخدمات المصرح لك باستخدامها أدناه."
                 : "Welcome to your personal dashboard. Access all your authorized system modules and services below."}
             </p>
           </div>
           
           <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-xs font-bold text-white shadow-inner">
             <Shield className="w-5 h-5 text-emerald-400" />
             <div>
               <p className="text-blue-200 text-[10px]">{lang === "ar" ? "المسمى الوظيفي / الدور" : "Role / Title"}</p>
               <p className="font-extrabold text-sm">{user?.role || "عضو في النظام"}</p>
             </div>
           </div>
         </div>
       </div>

       {/* Authorized Modules Navigation */}
       <div className="space-y-4">
         <div className="flex items-center justify-between">
           <h2 className="text-xl font-black text-[#0a2540] flex items-center gap-2">
             <LayoutDashboard className="w-5 h-5 text-[#0072BC]" />
             {lang === "ar" ? "الأقسام المتاحة بحسابك" : "Your Accessible Modules"}
           </h2>
           <span className="text-xs text-slate-500 font-bold">
             {lang === "ar" ? "توجيه سريع للخدمات المصرحة" : "Quick navigation"}
           </span>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {canAccessModule(user, 'hr') && (
             <div 
               onClick={() => onNavigate("hr", "hr_inquiries")}
               className="group bg-white rounded-3xl p-6 border border-slate-200 hover:border-[#0072BC] shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-5"
             >
               <div className="space-y-3">
                 <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0072BC] flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                   <Users className="w-6 h-6" />
                 </div>
                 <h3 className="font-black text-lg text-[#0a2540] group-hover:text-[#0072BC] transition-colors">
                   {lang === "ar" ? "الموارد البشرية والخدمة الذاتية" : "HR & Self Service"}
                 </h3>
                 <p className="text-xs text-slate-500 font-medium leading-relaxed">
                   {lang === "ar"
                     ? "الاستعلامات، تقديم الطلبات، متابعة الإجازات، والخدمات الموظف الذاتية."
                     : "Employee enquiries, leave applications, and self service features."}
                 </p>
               </div>
               <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs font-bold text-[#0072BC]">
                 <span>{lang === "ar" ? "الانتقال إلى القسم" : "Open Module"}</span>
                 <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
               </div>
             </div>
           )}

           {canAccessModule(user, 'sales') && (
             <div 
               onClick={() => onNavigate("sales", "sales_quotations")}
               className="group bg-white rounded-3xl p-6 border border-slate-200 hover:border-[#0072BC] shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-5"
             >
               <div className="space-y-3">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                   <Briefcase className="w-6 h-6" />
                 </div>
                 <h3 className="font-black text-lg text-[#0a2540] group-hover:text-[#0072BC] transition-colors">
                   {lang === "ar" ? "المبيعات والعملاء" : "Sales & Clients"}
                 </h3>
                 <p className="text-xs text-slate-500 font-medium leading-relaxed">
                   {lang === "ar"
                     ? "إدارة العملاء، عروض الأسعار، متابعة التحصيل والخطابات."
                     : "Client management, quotations, collections, and correspondence."}
                 </p>
               </div>
               <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs font-bold text-emerald-600">
                 <span>{lang === "ar" ? "الانتقال إلى القسم" : "Open Module"}</span>
                 <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
               </div>
             </div>
           )}

           {canAccessModule(user, 'production') && (
             <div 
               onClick={() => onNavigate("production", "prod_active_projects")}
               className="group bg-white rounded-3xl p-6 border border-slate-200 hover:border-[#0072BC] shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-5"
             >
               <div className="space-y-3">
                 <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                   <Box className="w-6 h-6" />
                 </div>
                 <h3 className="font-black text-lg text-[#0a2540] group-hover:text-[#0072BC] transition-colors">
                   {lang === "ar" ? "مركز التحكم بالإنتاج" : "Production Center"}
                 </h3>
                 <p className="text-xs text-slate-500 font-medium leading-relaxed">
                   {lang === "ar"
                     ? "متابعة أوامر الإنتاج اليومية، المشاريع القائمة، وقسم التركيب."
                     : "Follow daily production orders, active projects, and installations."}
                 </p>
               </div>
               <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs font-bold text-indigo-600">
                 <span>{lang === "ar" ? "الانتقال إلى القسم" : "Open Module"}</span>
                 <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
               </div>
             </div>
           )}

           {canAccessModule(user, 'procurement') && (
             <div 
               onClick={() => onNavigate("warehouse", "materials_warehouse")}
               className="group bg-white rounded-3xl p-6 border border-slate-200 hover:border-[#0072BC] shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-5"
             >
               <div className="space-y-3">
                 <div className="w-12 h-12 rounded-2xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                   <Package className="w-6 h-6" />
                 </div>
                 <h3 className="font-black text-lg text-[#0a2540] group-hover:text-[#0072BC] transition-colors">
                   {lang === "ar" ? "المستودعات والمشتريات" : "Warehouse & Procurement"}
                 </h3>
                 <p className="text-xs text-slate-500 font-medium leading-relaxed">
                   {lang === "ar"
                     ? "مستودع المواد والأصناف، طلبات الشراء، وأوامر الموردين."
                     : "Manage raw materials, inventory items, and purchase requests."}
                 </p>
               </div>
               <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs font-bold text-fuchsia-600">
                 <span>{lang === "ar" ? "الانتقال إلى القسم" : "Open Module"}</span>
                 <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
               </div>
             </div>
           )}

           {canAccessModule(user, 'finance') && (
             <div 
               onClick={() => onNavigate("finance", "accounting_dashboard")}
               className="group bg-white rounded-3xl p-6 border border-slate-200 hover:border-[#0072BC] shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-5"
             >
               <div className="space-y-3">
                 <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                   <DollarSign className="w-6 h-6" />
                 </div>
                 <h3 className="font-black text-lg text-[#0a2540] group-hover:text-[#0072BC] transition-colors">
                   {lang === "ar" ? "الإدارة المالية والحسابات" : "Finance & Accounting"}
                 </h3>
                 <p className="text-xs text-slate-500 font-medium leading-relaxed">
                   {lang === "ar"
                     ? "القيود اليومية، الفواتير، المصروفات، والصندوق والبنك."
                     : "General journal, invoices, expenses, cash & bank accounts."}
                 </p>
               </div>
               <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs font-bold text-amber-600">
                 <span>{lang === "ar" ? "الانتقال إلى القسم" : "Open Module"}</span>
                 <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
               </div>
             </div>
           )}
         </div>
       </div>

       {/* Notice Info Card */}
       <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex items-center gap-3 text-xs text-blue-800 font-medium">
         <Sparkles className="w-5 h-5 text-[#0072BC] shrink-0" />
         <p>
           {lang === "ar"
             ? "ملاحظة: يمكنك طلب تفويض صلاحيات إضافية لعرض مؤشرات القيادة التنفيذية من مسؤول النظام عبر قسم إدارة الصلاحيات المتقدمة."
             : "Note: You can request additional permissions to view executive metrics from your system administrator."}
         </p>
       </div>
     </div>
   );
 }

 const kpiFormatter = new Intl.NumberFormat("en-US", {
 notation: "compact",
 compactDisplay: "short",
 });

 return (
 <div className="space-y-8 pb-20">
 {/* 1. SMART HEADER */}
 <div className="bg-white/80 backdrop-blur-xl border border-slate-100/60 p-6 rounded-3xl shadow-[0_4px_30px_rgb(0,0,0,0.02)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
 <div>
 <h1 className="text-3xl font-black text-[#0a2540] tracking-tight">
 {lang === "ar" ? "لوحة المؤشرات الرئيسية" : "Executive Dashboard"}
 </h1>
 <p className="text-slate-500 font-medium text-sm mt-1.5 max-w-lg">
 {lang === "ar"
 ? "نظرة تنفيذية شاملة على الأداء العام للشركة عبر الموارد البشرية، المبيعات، المشتريات، والإنتاج."
 : "Comprehensive executive overview of company performance."}
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-3">
 <select
 value={selectedYear}
 onChange={(e) => setSelectedYear(e.target.value)}
 className="appearance-none bg-slate-50/80 border border-slate-200/60 hover:border-slate-300 text-slate-700 text-sm font-bold rounded-xl px-4 py-2.5 outline-none w-24 text-center cursor-pointer"
 >
 <option value="2026">2026</option>
 <option value="2025">2025</option>
 <option value="2024">2024</option>
 </select>
 <select
 value={selectedMonth}
 onChange={(e) => setSelectedMonth(e.target.value)}
 className="appearance-none bg-slate-50/80 border border-slate-200/60 hover:border-slate-300 text-slate-700 text-sm font-bold rounded-xl px-4 py-2.5 outline-none w-20 text-center cursor-pointer"
 >
 {Array.from({ length: 12 }).map((_, i) => (
 <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
 {i + 1}
 </option>
 ))}
 </select>
 <select
 value={period}
 onChange={(e) => setPeriod(e.target.value as any)}
 className="appearance-none bg-slate-50/80 border border-slate-200/60 hover:border-slate-300 text-slate-700 text-sm font-bold rounded-xl px-6 py-2.5 outline-none cursor-pointer"
 >
 <option value="today">{lang === "ar" ? "اليوم" : "Today"}</option>
 <option value="week">
 {lang === "ar" ? "هذا الأسبوع" : "This Week"}
 </option>
 <option value="month">
 {lang === "ar" ? "هذا الشهر" : "This Month"}
 </option>
 <option value="year">
 {lang === "ar" ? "هذه السنة" : "This Year"}
 </option>
 </select>
 <button
 onClick={fetchData}
 className="bg-[#0072BC]/10 hover:bg-[#0072BC]/20 text-[#0072BC] p-2.5 rounded-xl "
 >
 <RefreshCw className="w-5 h-5" />
 </button>
 </div>
 </div>

 {/* 2. TOP ALERTS BAR */}
 {hasAdvancedPermission(user, 'dashboard', 'metrics', 'view_alerts') && topAlerts.length > 0 && (
 <div className="flex flex-wrap gap-3">
 {topAlerts.slice(0, 6).map((al, idx) => (
 <div
 key={idx}
 className={`${al.bg} ${al.border} border px-4 py-2.5 rounded-full flex items-center gap-2.5 cursor-default`}
 >
 <AlertCircle className={`w-4 h-4 ${al.color}`} />
 <span className={`text-xs font-bold ${al.color}`}>{al.text}</span>
 </div>
 ))}
 </div>
 )}

 {/* 3. TOP EXECUTIVE KPIs */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
 {canViewSales && (
 <KpiCard
 onClick={() => onNavigate("sales", "sales_quotations")}
 title={lang === "ar" ? "إجمالي المبيعات" : "Total Sales"}
 value={totalSalesValue}
 isCurrency
 icon={FileText}
 iconColor="text-blue-600"
 iconBg="bg-blue-50"
 subtitle={
 lang === "ar"
 ? `الصفقات المعتمدة: ${approvedSales.length}`
 : `Approved: ${approvedSales.length}`
 }
 badgeText={`${conversionRate}%`}
 badgeColor="text-emerald-700 bg-emerald-50 border-emerald-100"
 />
 )}
 {canViewSales && (
 <KpiCard
 onClick={() => onNavigate("sales", "sales_collections")}
 title={lang === "ar" ? "التحصيل النقدي الفعلي" : "Actual Collected"}
 value={totalCollected}
 isCurrency
 icon={DollarSign}
 iconColor="text-emerald-600"
 iconBg="bg-emerald-50"
 subtitle={lang === "ar" ? "التحصيل من الإيرادات والفواتير" : "Collected from all sources"}
 badgeText={`${totalSalesValue ? Math.round((totalCollected / totalSalesValue) * 100) : 0}%`}
 badgeColor="text-emerald-700 bg-emerald-50 border-emerald-100"
 />
 )}
 {canViewSales && (
 <KpiCard
 onClick={() => onNavigate("sales", "sales_collections")}
 title={lang === "ar" ? "المتأخرات" : "Overdue"}
 value={totalOverdue}
 isCurrency
 icon={AlertTriangle}
 iconColor="text-rose-600"
 iconBg="bg-rose-50"
 subtitle={lang === "ar" ? "إجمالي المبالغ المتأخرة في التحصيل" : "Total overdue collections"}
 badgeText={String(latePayments.length)}
 badgeColor="text-rose-700 bg-rose-50 border-rose-100"
 />
 )}
 {canViewProduction && (
 <KpiCard
 onClick={() => onNavigate("production", "prod_active_projects")}
 title={lang === "ar" ? "مشاريع قيد الإنتاج" : "In Production"}
 value={inProd.length}
 icon={Settings}
 iconColor="text-indigo-600"
 iconBg="bg-indigo-50"
 subtitle={lang === "ar" ? "مشاريع فعالة" : "Active Projects"}
 badgeText={`${prodItems.length ? Math.round((completedProd.length / prodItems.length) * 100) : 0}%`}
 badgeColor="text-indigo-700 bg-indigo-50 border-indigo-100"
 />
 )}
 {canViewHR && (
 <KpiCard
 onClick={() => onNavigate("hr", "hr_employees")}
 title={lang === "ar" ? "إجمالي الموظفين" : "Total Employees"}
 value={countEmp}
 icon={Users}
 iconColor="text-slate-600"
 iconBg="bg-slate-100"
 subtitle={lang === "ar" ? "موظفين على رأس العمل" : "Active workforce"}
 />
 )}
 {canViewProcurement && (
 <KpiCard
 onClick={() => onNavigate("warehouse", "materials_warehouse")}
 title={lang === "ar" ? "قيمة المخروات والمخزون" : "Inventory Value"}
 value={stockValue}
 isCurrency
 icon={Box}
 iconColor="text-teal-600"
 iconBg="bg-teal-50"
 subtitle={
 lang === "ar" ? "إجمالي الأصول بالمستودع" : "Total warehouse assets"
 }
 />
 )}
 {canViewProcurement && (
 <KpiCard
 onClick={() => onNavigate("warehouse", "procurement_requests")}
 title={lang === "ar" ? "طلبات مواد معلقة" : "Pending Mat"}
 value={fromProdReqs.length}
 icon={Box}
 iconColor="text-fuchsia-600"
 iconBg="bg-fuchsia-50"
 subtitle={
 lang === "ar" ? "طلبات تنتظر التنفيذ" : "Awaiting fullfillment"
 }
 badgeText={String(fromProdReqs.length)}
 badgeColor="text-fuchsia-700 bg-fuchsia-50 border-fuchsia-100"
 />
 )}
 {canViewAlerts && (
 <KpiCard
 title={lang === "ar" ? "تنبيهات النظام" : "Alerts"}
 value={topAlerts.length}
 icon={ShieldAlert}
 iconColor="text-amber-600"
 iconBg="bg-amber-50"
 subtitle={lang === "ar" ? "إشعارات هامة" : "Critical notices"}
 badgeText={lang === "ar" ? "مساعدة" : "Help"}
 badgeColor="text-amber-700 bg-amber-50 border-amber-100"
 />
 )}
 </div>

 {/* 4. OPERATIONAL AREAS */}

 {/* A. SALES & COLLECTIONS */}
 {canViewSales && (
 <section className="bg-white rounded-[28px] p-6 lg:p-8 border border-slate-200 shadow-sm space-y-8">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-2xl font-black text-[#0a2540] flex items-center gap-3">
 <TrendingUp className="w-6 h-6 text-[#0072BC]" />
 {lang === "ar"
 ? "مؤشرات المبيعات والتحصيل"
 : "Sales & Collections"}
 </h2>
 <p className="text-sm font-medium text-slate-400 mt-1.5">
 {lang === "ar"
 ? "متابعة العروض، الاعتماد، التحصيل، والمتأخرات."
 : "Overview of quotes, approvals, and collections."}
 </p>
 </div>
 <button
 onClick={() => onNavigate("sales")}
 className="hidden sm:flex items-center gap-2 text-sm font-bold text-[#0072BC] hover:text-[#0a2540] px-4 py-2 bg-slate-50 rounded-xl hover:bg-slate-100"
 >
 {lang === "ar" ? "الذهاب للقسم" : "Go to Section"}
 <ArrowUpRight className="w-4 h-4" />
 </button>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
 <MiniStat
 onClick={() => onNavigate("sales", "sales_quotations")}
 title={lang === "ar" ? "عروض الأسعار" : "Total Quotes"}
 value={countSales}
 />
 <MiniStat
 onClick={() => onNavigate("sales", "sales_quotations")}
 title={lang === "ar" ? "معتمدة" : "Approved"}
 value={approvedSales.length}
 color="text-blue-600"
 />
 <MiniStat
 onClick={() => onNavigate("sales", "sales_quotations")}
 title={lang === "ar" ? "للإنتاج" : "To Prod"}
 value={sentToProdSales.length}
 color="text-indigo-600"
 />
 <MiniStat
 onClick={() => onNavigate("sales", "sales_collections")}
 title={lang === "ar" ? "المحصل" : "Collected"}
 value={kpiFormatter.format(totalCollected)}
 color="text-emerald-600"
 />
 <MiniStat
 onClick={() => onNavigate("sales", "sales_collections")}
 title={lang === "ar" ? "المتأخر" : "Overdue"}
 value={kpiFormatter.format(totalOverdue)}
 color="text-rose-600"
 />
 <MiniStat
 onClick={() => onNavigate("sales", "sales_collections")}
 title={lang === "ar" ? "نسبة التحصيل" : "Collection %"}
 value={`${totalSalesValue ? Math.round((totalCollected / totalSalesValue) * 100) : 0}%`}
 color="text-amber-500"
 />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 bg-slate-50/50 rounded-2xl p-6 border border-slate-100/50 h-[300px]">
 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
 {lang === "ar" ? "مقارنة الأداء النقدي" : "Financial Comparison"}
 </h4>
 <ResponsiveContainer width="100%" height="100%">
 <BarChart
 data={[
 {
 name: lang === "ar" ? "المبيعات" : "Sales",
 val: totalSalesValue,
 fill: "#0a2540",
 },
 {
 name: lang === "ar" ? "التحصيل" : "Collected",
 val: totalCollected,
 fill: "#10b981",
 },
 {
 name: lang === "ar" ? "المتأخر" : "Overdue",
 val: totalOverdue,
 fill: "#f43f5e",
 },
 ]}
 layout="vertical"
 margin={{ left: 0, right: 30, top: 0, bottom: 20 }}
 >
 <CartesianGrid
 strokeDasharray="3 3"
 horizontal={false}
 stroke="#e2e8f0"
 />
 <XAxis
 type="number"
 tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }}
 axisLine={false}
 tickLine={false}
 />
 <YAxis
 dataKey="name"
 type="category"
 width={100}
 tick={{ fontSize: 12, fill: "#334155", fontWeight: "bold" }}
 axisLine={false}
 tickLine={false}
 />
 <RechartsTooltip
 cursor={{ fill: "transparent" }}
 contentStyle={{
 borderRadius: "12px",
 border: "none",
 boxShadow: "0 4px 20px rgb(0,0,0,0.1)",
 }}
 />
 <Bar dataKey="val" radius={[0, 6, 6, 0]} barSize={24} />
 </BarChart>
 </ResponsiveContainer>
 </div>

 <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100/50 flex flex-col h-[300px]">
 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
 {lang === "ar" ? "حالة العروض" : "Quotes Status"}
 </h4>
 <div className="flex-1 min-h-0 relative">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={[
 {
 name: lang === "ar" ? "مسودة" : "Draft",
 value: draftSales.length || 1,
 color: "#94a3b8",
 },
 {
 name: lang === "ar" ? "نشط" : "Active",
 value: activeSales.length || 1,
 color: "#f59e0b",
 },
 {
 name: lang === "ar" ? "معتمد" : "Approved",
 value: approvedSales.length || 1,
 color: "#10b981",
 },
 {
 name: lang === "ar" ? "إنتاج" : "In Prod",
 value: sentToProdSales.length || 0,
 color: "#8b5cf6",
 },
 ]}
 innerRadius="45%"
 outerRadius="65%"
 paddingAngle={3}
 dataKey="value"
 >
 {[
 { fill: "#94a3b8" },
 { fill: "#f59e0b" },
 { fill: "#10b981" },
 { fill: "#8b5cf6" },
 ].map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.fill} />
 ))}
 </Pie>
 <RechartsTooltip
 contentStyle={{
 borderRadius: "12px",
 border: "none",
 boxShadow: "0 4px 20px rgb(0,0,0,0.1)",
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
 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
 <span className="text-3xl font-black text-slate-800">
 {countSales}
 </span>
 <span className="text-[10px] font-bold text-slate-400 uppercase">
 {lang === "ar" ? "الإجمالي" : "Total"}
 </span>
 </div>
 </div>
 </div>
 </div>

 <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
 <InsightTag
 title={lang === "ar" ? "أعلى مبلغ متبقي" : "Top Overdue"}
 value={kpiFormatter.format(topOverdue.val)}
 subtitle={topOverdue.client}
 color="text-rose-600"
 bg="bg-rose-50"
 border="border-rose-100"
 />
 <InsightTag
 title={lang === "ar" ? "أفضل مبيعات" : "Top Sales"}
 value={bestSeller || "-"}
 subtitle={
 lang === "ar"
 ? `${bestSellerCount} عروض معتمدة`
 : `${bestSellerCount} approved quotes`
 }
 color="text-emerald-600"
 bg="bg-emerald-50"
 border="border-emerald-100"
 />
 <InsightTag
 title={lang === "ar" ? "دفعات متأخرة" : "Late Payments"}
 value={String(latePayments.length)}
 subtitle={lang === "ar" ? "تحتاج متابعة" : "Need follow up"}
 color="text-amber-600"
 bg="bg-amber-50"
 border="border-amber-100"
 />
 <InsightTag
 title={lang === "ar" ? "معدل التحويل" : "Conversion"}
 value={`${conversionRate}%`}
 subtitle={lang === "ar" ? "من كل العروض لمعتمد" : "To approved"}
 color="text-blue-600"
 bg="bg-blue-50"
 border="border-blue-100"
 />
 </div>
 </section>
 )}

 {/* B. PRODUCTION CONTROL */}
 {canViewProduction && (
 <section className="bg-white rounded-[28px] p-6 lg:p-8 border border-slate-200 shadow-sm space-y-8">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-2xl font-black text-[#0a2540] flex items-center gap-3">
 <Settings className="w-6 h-6 text-[#0072BC]" />
 {lang === "ar" ? "مركز التحكم بالإنتاج" : "Production Center"}
 </h2>
 <p className="text-sm font-medium text-slate-400 mt-1.5">
 {lang === "ar"
 ? "متابعة أوامر الإنتاج، المراحل، الجاهزية، والتأخير."
 : "Tracking production orders, stages, readiness, and delays."}
 </p>
 </div>
 <button
 onClick={() => onNavigate("production")}
 className="hidden sm:flex items-center gap-2 text-sm font-bold text-[#0072BC] hover:text-[#0a2540] px-4 py-2 bg-slate-50 rounded-xl hover:bg-slate-100"
 >
 {lang === "ar" ? "الذهاب للقسم" : "Go to Section"}
 <ArrowUpRight className="w-4 h-4" />
 </button>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
 <MiniStat
 onClick={() => onNavigate("production", "prod_orders")}
 title={lang === "ar" ? "جديد" : "New"}
 value={newProdOrders.length}
 />
 <MiniStat
 onClick={() => onNavigate("production", "prod_active_projects")}
 title={lang === "ar" ? "قيد التصنيع" : "In Prod"}
 value={inProd.length}
 color="text-blue-600"
 />
 <MiniStat
 onClick={() => onNavigate("production", "prod_active_projects")}
 title={lang === "ar" ? "جاهز" : "Ready"}
 value={readyProd.length}
 color="text-emerald-600"
 />
 <MiniStat
 onClick={() => onNavigate("production", "prod_active_projects")}
 title={lang === "ar" ? "متأخر" : "Delayed"}
 value={delayedProd.length}
 color="text-rose-600"
 />
 <MiniStat
 onClick={() => onNavigate("production", "prod_active_projects")}
 title={lang === "ar" ? "مكتمل" : "Completed"}
 value={completedProd.length}
 color="text-[#0a2540]"
 />
 <MiniStat
 onClick={() => onNavigate("production", "prod_active_projects")}
 title={lang === "ar" ? "نسبة الإنجاز" : "Progress"}
 value={`${prodItems.length ? Math.round((completedProd.length / prodItems.length) * 100) : 0}%`}
 color="text-emerald-500"
 />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100/50 h-[300px] flex flex-col">
 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
 {lang === "ar" ? "توزيع الحالات" : "Status Distribution"}
 </h4>
 <div className="flex-1 min-h-0 relative">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={[
 {
 name: "جديد",
 value: newProdOrders.length || 1,
 color: "#e2e8f0",
 },
 {
 name: "قيد التنفيذ",
 value: inProd.length || 1,
 color: "#38bdf8",
 },
 {
 name: "جاهز",
 value: readyProd.length || 0,
 color: "#10b981",
 },
 {
 name: "متأخر",
 value: delayedProd.length || 0,
 color: "#f43f5e",
 },
 ]}
 innerRadius="40%"
 outerRadius="60%"
 paddingAngle={4}
 dataKey="value"
 >
 {[
 { fill: "#e2e8f0" },
 { fill: "#38bdf8" },
 { fill: "#10b981" },
 { fill: "#f43f5e" },
 ].map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.fill} />
 ))}
 </Pie>
 <RechartsTooltip
 contentStyle={{
 borderRadius: "12px",
 border: "none",
 boxShadow: "0 4px 20px rgb(0,0,0,0.1)",
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

 <div className="lg:col-span-2 bg-slate-50/50 rounded-2xl p-6 border border-slate-100/50 flex flex-col">
 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
 {lang === "ar"
 ? "مشاريع تحتاج متابعة"
 : "Projects needing attention"}
 </h4>
 <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin">
 {delayedProd.length === 0 && (
 <p className="text-sm font-medium text-slate-400 text-center mt-10">
 {lang === "ar"
 ? "لا يوجد مشاريع متأخرة الحمد لله"
 : "No delayed projects."}
 </p>
 )}
 {delayedProd.slice(0, 4).map((p, i) => (
 <div
 key={i}
 className="flex items-center justify-between p-4 bg-white rounded-xl border border-rose-100 shadow-sm"
 >
 <div>
 <p className="text-sm font-bold text-slate-800">
 {p.projectName || p.id}
 </p>
 <p className="text-[10px] font-bold text-rose-500 mt-0.5">
 {lang === "ar" ? "حالة: متأخر" : "Status: Delayed"}
 </p>
 </div>
 <div className="w-16 bg-slate-100 rounded-full h-1.5 mt-2">
 <div
 className="bg-rose-500 h-1.5 rounded-full"
 style={{ width: `${p.progress || 30}%` }}
 ></div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>

 <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
 <InsightTag
 title={lang === "ar" ? "تأخير بسبب العميل" : "Delayed by Client"}
 value={String(delayedByClient)}
 subtitle={lang === "ar" ? "مشاريع معلقة" : "Pending projects"}
 color="text-amber-600"
 bg="bg-amber-50"
 border="border-amber-100"
 />
 <InsightTag
 title={lang === "ar" ? "نقص مواد" : "Material Shortage"}
 value={String(missingMatProd)}
 subtitle={lang === "ar" ? "عنصر موقف للإنتاج" : "Hold on item"}
 color="text-rose-600"
 bg="bg-rose-50"
 border="border-rose-100"
 />
 <InsightTag
 title={lang === "ar" ? "مرحلة عنق الزجاجة" : "Bottleneck Stage"}
 value={bottleneck || "-"}
 subtitle={
 lang === "ar"
 ? `${bottleneckCount} مشاريع متكدسة`
 : `${bottleneckCount} projects stacked`
 }
 color="text-slate-600"
 bg="bg-slate-100"
 border="border-slate-200"
 />
 </div>
 </section>
 )}

 {/* C. WAREHOUSE & PROCUREMENT */}
 {canViewProcurement && (
 <section className="bg-white rounded-[28px] p-6 lg:p-8 border border-slate-200 shadow-sm space-y-8">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-2xl font-black text-[#0a2540] flex items-center gap-3">
 <Package className="w-6 h-6 text-[#0072BC]" />
 {lang === "ar"
 ? "المشتريات والمستودع"
 : "Procurement & Warehouse"}
 </h2>
 <p className="text-sm font-medium text-slate-400 mt-1.5">
 {lang === "ar"
 ? "متابعة الأصناف، النواقص، طلبات الشراء، وحالة المخزون."
 : "Tracking items, shortages, POs, and stock status."}
 </p>
 </div>
 <button
 onClick={() => onNavigate("warehouse")}
 className="hidden sm:flex items-center gap-2 text-sm font-bold text-[#0072BC] hover:text-[#0a2540] px-4 py-2 bg-slate-50 rounded-xl hover:bg-slate-100"
 >
 {lang === "ar" ? "الذهاب للقسم" : "Go to Section"}
 <ArrowUpRight className="w-4 h-4" />
 </button>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
 <MiniStat
 onClick={() => onNavigate("warehouse", "materials_warehouse")}
 title={lang === "ar" ? "إجمالي الأصناف" : "Total Items"}
 value={totalItems}
 />
 <MiniStat
 onClick={() => onNavigate("warehouse", "materials_warehouse")}
 title={lang === "ar" ? "منخفضة" : "Low Stock"}
 value={lowStock.length}
 color="text-amber-500"
 />
 <MiniStat
 onClick={() => onNavigate("warehouse", "materials_warehouse")}
 title={lang === "ar" ? "غير متوفرة" : "Out of Stock"}
 value={outOfStock.length}
 color="text-rose-600"
 />
 <MiniStat
 onClick={() => onNavigate("warehouse", "procurement_requests")}
 title={lang === "ar" ? "طلبات شراء" : "Open POs"}
 value={openPurchases.length}
 color="text-blue-600"
 />
 <MiniStat
 onClick={() => onNavigate("warehouse", "procurement_requests")}
 title={lang === "ar" ? "طلبات مواد" : "Prod Requests"}
 value={fromProdReqs.length}
 color="text-indigo-600"
 />
 <MiniStat
 onClick={() => onNavigate("warehouse", "materials_warehouse")}
 title={lang === "ar" ? "قيمة المخزون" : "Stock Val"}
 value={kpiFormatter.format(stockValue)}
 color="text-slate-800"
 />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100/50">
 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
 {lang === "ar" ? "أكثر المواد طلباً" : "Top Requested Mats"}
 </h4>
 <div className="space-y-3">
 {sortedMat.length === 0 && (
 <p className="text-sm text-slate-400">
 {lang === "ar" ? "لا توجد بيانات" : "No data"}
 </p>
 )}
 {sortedMat.map((m, i) => (
 <div
 key={i}
 className="flex justify-between items-center p-3.5 bg-white border border-slate-100 rounded-xl shadow-sm"
 >
 <div className="flex items-center gap-3">
 <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">
 {i + 1}
 </span>
 <span className="text-sm font-bold text-slate-700">
 {m.name}
 </span>
 </div>
 <div className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
 {m.timesRequested} {lang === "ar" ? "طلب" : "req"}
 </div>
 </div>
 ))}
 </div>
 </div>
 <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100/50 flex flex-col">
 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
 {lang === "ar" ? "طلبات شراء تحتاج متابعة" : "POs Needing Action"}
 </h4>
 <div className="flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-thin">
 {openPurchases.length === 0 && (
 <p className="text-sm text-slate-400">
 {lang === "ar" ? "لا توجد طلبات معلقة" : "No pending POs"}
 </p>
 )}
 {openPurchases.slice(0, 4).map((po, i) => (
 <div
 key={i}
 className="p-3.5 bg-white border border-amber-100 rounded-xl shadow-sm border-l-4 border-l-amber-400"
 >
 <div className="flex justify-between items-start">
 <p className="text-xs text-slate-400 font-mono font-bold">
 {String(po.requestNumber || po.id).substring(0, 8)}
 </p>
 <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded uppercase">
 {po.status}
 </span>
 </div>
 <p className="text-sm font-bold text-slate-700 mt-1">
 {po.projectName || po.supplierName || "غير محدد"}
 </p>
 <p className="text-[10px] text-slate-400 mt-1">
 {safeFormatDate(po.requestedAt || po.requestDate)}
 </p>
 </div>
 ))}
 </div>
 </div>
 </div>
 </section>
 )}

 {/* D. HUMAN RESOURCES */}
 {canViewHR && (
 <section className="bg-white rounded-[28px] p-6 lg:p-8 border border-slate-200 shadow-sm space-y-8">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-2xl font-black text-[#0a2540] flex items-center gap-3">
 <Briefcase className="w-6 h-6 text-[#0072BC]" />
 {lang === "ar" ? "مؤشرات الموارد البشرية" : "Human Resources"}
 </h2>
 <p className="text-sm font-medium text-slate-400 mt-1.5">
 {lang === "ar"
 ? "متابعة الموظفين، الحضور، الإجازات، العقود، والوثائق."
 : "Tracking employees, attendance, leaves, and contracts."}
 </p>
 </div>
 <button
 onClick={() => onNavigate("hr")}
 className="hidden sm:flex items-center gap-2 text-sm font-bold text-[#0072BC] hover:text-[#0a2540] px-4 py-2 bg-slate-50 rounded-xl hover:bg-slate-100"
 >
 {lang === "ar" ? "الذهاب للقسم" : "Go to Section"}
 <ArrowUpRight className="w-4 h-4" />
 </button>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
 <MiniStat
 onClick={() => onNavigate("hr", "hr_employees")}
 title={lang === "ar" ? "الموظفين" : "Employees"}
 value={countEmp}
 />
 <MiniStat
 onClick={() => onNavigate("hr", "hr_leaves")}
 title={lang === "ar" ? "في إجازة" : "On Leave"}
 value={onVacation}
 color="text-blue-500"
 />
 <MiniStat
 onClick={() => onNavigate("hr", "hr_self_service")}
 title={lang === "ar" ? "طلبات معلقة" : "Pending"}
 value={pendingRequests}
 color="text-slate-600"
 />
 <MiniStat
 onClick={() => onNavigate("hr", "hr_documents")}
 title={lang === "ar" ? "عقود تنتهي" : "Exp Cont"}
 value={expiringContracts.length}
 color="text-indigo-600"
 />
 <MiniStat
 onClick={() => onNavigate("hr", "hr_documents")}
 title={lang === "ar" ? "إقامات تنتهي" : "Exp Res"}
 value={expiringIqamas}
 color="text-purple-600"
 />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100/50 h-[280px] flex flex-col">
 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
 {lang === "ar" ? "حالة الموظفين" : "Employees Status"}
 </h4>
 <div className="flex-1 min-h-0 relative">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={[
 {
 name: lang === "ar" ? "على رأس العمل" : "Active",
 value: activeEmps.length - onVacation || 1,
 color: "#0d9488",
 },
 {
 name: lang === "ar" ? "في إجازة" : "On Leave",
 value: onVacation || 0,
 color: "#3b82f6",
 },
 {
 name: lang === "ar" ? "غير نشط" : "Inactive",
 value: countEmp - activeEmps.length || 0,
 color: "#64748b",
 },
 ]}
 innerRadius="50%"
 outerRadius="70%"
 paddingAngle={4}
 dataKey="value"
 >
 {[
 { fill: "#0d9488" },
 { fill: "#3b82f6" },
 { fill: "#64748b" },
 ].map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.fill} />
 ))}
 </Pie>
 <RechartsTooltip
 contentStyle={{ borderRadius: "12px", border: "none" }}
 />
 <Legend
 verticalAlign="bottom"
 height={36}
 iconType="circle"
 wrapperStyle={{ fontSize: "10px", fontWeight: "bold" }}
 />
 </PieChart>
 </ResponsiveContainer>
 <div className="absolute inset-0 flex flex-col items-center justify-center my-auto mx-auto pointer-events-none">
 <span className="text-2xl font-black text-slate-800">
 {countEmp}
 </span>
 <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">
 {lang === "ar" ? "موظف" : "Employees"}
 </span>
 </div>
 </div>
 </div>

 <div className="lg:col-span-2 bg-slate-50/50 rounded-2xl p-6 border border-slate-100/50 flex flex-col">
 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
 {lang === "ar"
 ? "وثائق وعقود تحتاج متابعة"
 : "Expiring Documents"}
 </h4>
 <div className="flex flex-col gap-3">
 {expiringContracts.length === 0 && (
 <p className="text-sm text-slate-400">
 {lang === "ar"
 ? "لا يوجد عقود قريبة الانتهاء"
 : "No expiring docs."}
 </p>
 )}
 {expiringContracts.slice(0, 3).map((e) => (
 <div
 key={e.id}
 className="flex justify-between items-center p-4 bg-white border border-indigo-100 rounded-xl shadow-sm"
 >
 <div className="flex gap-4 items-center">
 <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
 {e.name?.[0] || "M"}
 </div>
 <div>
 <p className="text-sm font-bold text-slate-800">
 {e.name}
 </p>
 <p className="text-[10px] text-slate-500 font-bold">
 {lang === "ar" ? "أيام متبقية للعقد:" : "Days left:"} 28
 </p>
 </div>
 </div>
 <button className="text-[10px] font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 ">
 {lang === "ar" ? "عرض" : "View"}
 </button>
 </div>
 ))}
 </div>
 </div>
 </div>
 </section>
 )}

 {/* 5. QUICK ACTIONS */}
 {canViewShortcuts && (
 <section className="bg-gradient-to-l from-[#0072BC] to-[#0a2540] p-6 lg:p-8 rounded-[28px] text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
 <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500 opacity-20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>

 <div className="space-y-2 relative z-10 text-center md:text-right">
 <h2 className="text-xl font-black flex items-center justify-center md:justify-start gap-2">
 <Zap className="w-6 h-6 text-yellow-400" />
 {lang === "ar"
 ? "الروابط السريعة والاختصارات"
 : "Quick Actions & Shortcuts"}
 </h2>
 <p className="text-sm text-blue-100 font-medium">
 {lang === "ar"
 ? "قم بتنفيذ المهام الأساسية بسرعة وسهولة عبر النظام"
 : "Execute key tasks directly from the dashboard."}
 </p>
 </div>

 <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 relative z-10 w-full md:w-auto">
 <button
 onClick={() => onNavigate("sales", "sales_quotations")}
 className="bg-white/10 hover:bg-white text-white hover:text-[#0a2540] border border-white/20 px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 "
 >
 <FileText className="w-4 h-4" />{" "}
 {lang === "ar" ? "عرض سعر جديد" : "New Quote"}
 </button>
 <button
 onClick={() => onNavigate("sales", "sales_crm")}
 className="bg-white/10 hover:bg-white text-white hover:text-indigo-600 border border-white/20 px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 "
 >
 <UserPlus className="w-4 h-4" />{" "}
 {lang === "ar" ? "إضافة عميل" : "Add Client"}
 </button>
 <button
 onClick={() => onNavigate("sales", "sales_collections")}
 className="bg-white/10 hover:bg-white text-white hover:text-emerald-600 border border-white/20 px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 "
 >
 <DollarSign className="w-4 h-4" />{" "}
 {lang === "ar" ? "تسجيل دفعة" : "Record Payment"}
 </button>
 <button
 onClick={() => onNavigate("production", "prod_orders")}
 className="bg-white/10 hover:bg-white text-white hover:text-amber-600 border border-white/20 px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 "
 >
 <Settings className="w-4 h-4" />{" "}
 {lang === "ar" ? "أمر إنتاج" : "New Prod Order"}
 </button>
 <button
 onClick={() => onNavigate("warehouse", "warehouse_items")}
 className="bg-white/10 hover:bg-white text-white hover:text-fuchsia-600 border border-white/20 px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 "
 >
 <Box className="w-4 h-4" />{" "}
 {lang === "ar" ? "إضافة صنف" : "Add Item"}
 </button>
 <button
 onClick={() => onNavigate("warehouse", "procurement_requests")}
 className="bg-white/10 hover:bg-white text-white hover:text-rose-600 border border-white/20 px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 "
 >
 <Package className="w-4 h-4" />{" "}
 {lang === "ar" ? "طلب شراء" : "Purchase Req"}
 </button>
 </div>
 </section>
 )}

 {/* 6. HISTORY */}
 {canViewLogs && (
 <section className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
 <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between">
 <div>
 <h2 className="text-xl font-black text-[#0a2540] flex items-center gap-3">
 <Activity className="w-5 h-5 text-[#0072BC]" />
 {lang === "ar" ? "آخر العمليات في النظام" : "Recent Activities"}
 </h2>
 <p className="text-xs text-slate-400 mt-1">
 {lang === "ar"
 ? "سجل لجميع الحركات والإجراءات"
 : "Activity trail for all actions"}
 </p>
 </div>
 </div>
 <div className="overflow-x-auto">
 <table
 className="w-full text-right"
 dir={lang === "ar" ? "rtl" : "ltr"}
 >
 <thead className="bg-[#f8fafc] text-[10px] uppercase font-bold text-slate-400 tracking-wider">
 <tr>
 <th className="p-4 pl-6 font-medium">
 {lang === "ar" ? "العملية / القسم" : "Action / Unit"}
 </th>
 <th className="p-4 font-medium">
 {lang === "ar" ? "المرجع" : "Reference"}
 </th>
 <th className="p-4 font-medium">
 {lang === "ar" ? "بواسطة" : "User"}
 </th>
 <th className="p-4 pr-6 font-medium">
 {lang === "ar" ? "التاريخ" : "Date"}
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {(showAllLogs ? historyLogs : historyLogs.slice(0, 4)).map(
 (h, i) => (
 <tr
 key={i}
 className="hover:bg-slate-50/50 group"
 >
 <td className="p-4 pl-6">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
 <CheckCircle className="w-4 h-4" />
 </div>
 <div>
 <p className="text-sm font-black text-slate-700">
 {h.action || h.activityType}
 </p>
 <p className="text-[10px] font-bold text-[#0072BC] bg-[#0072BC]/10 inline-block px-1.5 py-0.5 rounded mt-1">
 {h.dept || h.module || "نظام"}
 </p>
 </div>
 </div>
 </td>
 <td className="p-4 align-middle">
 <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">
 {String(h.ref || h.id || "-").substring(0, 8)}
 </span>
 </td>
 <td className="p-4 align-middle">
 <span className="text-xs font-bold text-slate-600">
 {h.user || h.employeeName || h.createdBy || "-"}
 </span>
 </td>
 <td className="p-4 pr-6 align-middle">
 <span className="text-xs font-mono text-slate-400">
 {safeFormatDate(h.date || h.timestamp)}
 </span>
 </td>
 </tr>
 ),
 )}
 {historyLogs.length === 0 && (
 <tr>
 <td
 colSpan={4}
 className="p-10 text-center text-slate-400 font-bold text-sm"
 >
 {lang === "ar"
 ? "لا توجد عمليات مؤخراً"
 : "No activities found"}
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 {historyLogs.length > 4 && (
 <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
 <button
 onClick={() => setShowAllLogs(!showAllLogs)}
 className="text-sm font-bold text-[#0072BC] hover:text-[#0a2540] "
 >
 {showAllLogs
 ? lang === "ar"
 ? "عرض القليل"
 : "Show Less"
 : lang === "ar"
 ? "عرض المزيد"
 : "Show More"}
 </button>
 </div>
 )}
 </section>
 )}
 </div>
 );
}

// -------------------------
// REUSABLE COMPONENTS
// -------------------------
function KpiCard({
 title,
 value,
 icon: Icon,
 iconColor,
 iconBg,
 isCurrency = false,
 onClick,
 subtitle,
 badgeText,
 badgeColor,
}: any) {
 return (
 <div
 onClick={onClick}
 className={`bg-white border border-slate-150 p-6 rounded-3xl flex flex-col justify-between ${onClick ? "cursor-pointer hover:shadow-lg" : "hover:shadow-md"}`}
 >
 <div className="flex justify-between items-start">
 <div className="space-y-1">
 <span className="text-slate-400 font-bold text-xs uppercase block">
 {title}
 </span>
 <h3
 className={`text-2xl font-black text-slate-800 ${isCurrency ? "tracking-tight" : ""}`}
 >
 {isCurrency ? Number(value).toLocaleString('en-US') : value}{" "}
 {isCurrency && (
 <span className="text-xs font-bold text-slate-500 ml-1">
 ريال
 </span>
 )}
 </h3>
 </div>
 <div className={`p-3.5 ${iconBg} ${iconColor} rounded-2xl shrink-0`}>
 <Icon className="w-6 h-6" />
 </div>
 </div>

 {(subtitle || badgeText) && (
 <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
 <span className="text-slate-500">{subtitle}</span>
 {badgeText && (
 <span
 className={`${badgeColor || "text-slate-700 bg-slate-50 border-slate-200"} px-2.5 py-0.5 rounded-lg text-[10px]`}
 >
 {badgeText}
 </span>
 )}
 </div>
 )}
 </div>
 );
}

function MiniStat({ title, value, color = "text-slate-800", onClick }: any) {
 const getColors = (c: string) => {
 if (c.includes("emerald") || c.includes("teal"))
 return "bg-emerald-50/70 border-emerald-200/60";
 if (c.includes("blue") || c.includes("sky"))
 return "bg-blue-50/70 border-blue-200/60";
 if (c.includes("indigo") || c.includes("purple") || c.includes("fuchsia"))
 return "bg-indigo-50/70 border-indigo-200/60";
 if (c.includes("rose") || c.includes("red"))
 return "bg-rose-50/70 border-rose-200/60";
 if (c.includes("amber") || c.includes("orange"))
 return "bg-amber-50/70 border-amber-200/60";
 return "bg-slate-50 border-slate-200/60";
 };
 const themeClasses = getColors(color);
 return (
 <div
 onClick={onClick}
 className={`${themeClasses} rounded-2xl p-4 border flex flex-col justify-center group ${onClick ? "cursor-pointer hover:bg-white hover:shadow-md hover:border-slate-300 " : ""}`}
 >
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 group-hover:text-slate-600 ">
 {title}
 </p>
 <p
 className={`text-xl font-black ${color} `}
 >
 {value}
 </p>
 </div>
 );
}

function InsightTag({ title, subtitle, value, color, bg, border }: any) {
 return (
 <div
 className={`shrink-0 w-[200px] p-4 rounded-2xl border ${border} ${bg} hover:shadow-sm`}
 >
 <p className={`text-[10px] font-bold uppercase ${color} mb-1`}>{title}</p>
 <p className="text-xl font-black text-slate-800 tracking-tight mt-1 mb-0.5">
 {value}
 </p>
 <p className="text-xs font-bold text-slate-500">{subtitle}</p>
 </div>
 );
}

function QuickBtn({ onClick, icon: Icon, label, color, hoverBorder }: any) {
 return (
 <button
 onClick={onClick}
 className={`bg-white border border-slate-200 px-5 py-3 rounded-2xl text-sm font-bold text-slate-700 shadow-sm flex items-center gap-3 hover:shadow ${hoverBorder}`}
 >
 <Icon className={`w-5 h-5 ${color}`} />
 {label}
 </button>
 );
}
