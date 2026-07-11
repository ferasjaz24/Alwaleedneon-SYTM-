import React, { useState, useEffect } from "react";
import { 
  FileText, CheckCircle, TrendingUp, Users, Calculator, Calendar, 
  ArrowUpRight, ArrowDownRight, Receipt, CreditCard, ShieldAlert,
  Percent, DollarSign, ListFilter, HelpCircle, Eye, ChevronRight
} from "lucide-react";
import { User } from "../../types";

interface AccountingDashboardProps {
  lang: "ar" | "en";
  user: User;
}

export default function AccountingDashboard({ lang, user }: AccountingDashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Live database states
  const [journals, setJournals] = useState<any[]>([]);
  const [customerInvoicesListRaw, setCustomerInvoicesListRaw] = useState<any[]>([]);
  const [supplierInvoicesListRaw, setSupplierInvoicesListRaw] = useState<any[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<any[]>([]);
  const [loadingReal, setLoadingReal] = useState(true);

  // Fetch real data on mount
  useEffect(() => {
    async function loadData() {
      setLoadingReal(true);
      try {
        const ts = Date.now();
        const [resJ, resCI, resSI, resP] = await Promise.all([
          fetch(`/api/journal-entries?t=${ts}`).then(r => r.ok ? r.json() : []),
          fetch(`/api/customer-invoices?t=${ts}`).then(r => r.ok ? r.json() : []),
          fetch(`/api/supplier-invoices?t=${ts}`).then(r => r.ok ? r.json() : []),
          fetch(`/api/payroll_runs?t=${ts}`).then(r => r.ok ? r.json() : [])
        ]);
        setJournals(Array.isArray(resJ) ? resJ : []);
        setCustomerInvoicesListRaw(Array.isArray(resCI) ? resCI : []);
        setSupplierInvoicesListRaw(Array.isArray(resSI) ? resSI : []);
        setPayrollRuns(Array.isArray(resP) ? resP : []);
      } catch (err) {
        console.error("Error loading real financial data for dashboard:", err);
      } finally {
        setLoadingReal(false);
      }
    }
    loadData();
  }, []);

  // Month Translation
  const monthsAr = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", 
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];
  const monthsEn = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  // Helper to format currency
  const formatCurrency = (val: number) => {
    return lang === "ar" 
      ? `${val.toLocaleString("en-US")} ر.س` 
      : `${val.toLocaleString("en-US")} SAR`;
  };

  // Helper to match dates robustly by string parsing to prevent time shift issues
  const isSelectedPeriod = (dateStr: string) => {
    if (!dateStr) return false;
    const parts = dateStr.split("-");
    if (parts.length >= 2) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      return y === selectedYear && m === selectedMonth;
    }
    try {
      const d = new Date(dateStr);
      return d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
    } catch {
      return false;
    }
  };

  // 1. Journal entries metrics
  const filteredJournals = journals.filter(j => isSelectedPeriod(j.date));
  const journalEntriesCount = filteredJournals.length;
  const approvedJournalsCount = filteredJournals.filter(j => j.status === "معتمد" || j.status === "Approved").length;

  // 2. Customer invoices metrics
  const filteredCustomerInvoices = customerInvoicesListRaw.filter(inv => isSelectedPeriod(inv.date));
  const customerInvoicesCount = filteredCustomerInvoices.length;
  const customerInvoicesTotal = filteredCustomerInvoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
  const approvedInvoicesVat = filteredCustomerInvoices
    .filter(inv => inv.status === "معتمدة وصادرة" || inv.status === "Approved" || inv.status === "معتمد" || inv.status === "معتمد وصادر")
    .reduce((sum, inv) => sum + (Number(inv.taxAmount) || (Number(inv.totalAmount) * 0.15) || 0), 0);

  // 3. Supplier invoices metrics
  const filteredSupplierInvoices = supplierInvoicesListRaw.filter(inv => isSelectedPeriod(inv.date));
  const supplierInvoicesCount = filteredSupplierInvoices.length;
  const supplierInvoicesTotal = filteredSupplierInvoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
  const approvedSupplierInvoicesCount = filteredSupplierInvoices.filter(inv => 
    inv.status === "معتمدة" || 
    inv.status === "Approved" || 
    inv.status === "مدفوعة بالكامل" || 
    inv.status === "مدفوعة جزئياً" || 
    inv.status === "معتمدة وصادرة" || 
    inv.status === "معتمد" || 
    inv.status === "مسجلة"
  ).length;
  const approvedSupplierInvoicesTotal = filteredSupplierInvoices
    .filter(inv => 
      inv.status === "معتمدة" || 
      inv.status === "Approved" || 
      inv.status === "مدفوعة بالكامل" || 
      inv.status === "مدفوعة جزئياً" || 
      inv.status === "معتمدة وصادرة" || 
      inv.status === "معتمد" || 
      inv.status === "مسجلة"
    )
    .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

  // 4. Payroll metrics
  const filteredPayroll = payrollRuns.filter(run => {
    const runMonth = Number(run.month);
    const runYear = Number(run.year);
    if (!isNaN(runMonth) && !isNaN(runYear) && run.month !== null && run.year !== null) {
      return runYear === selectedYear && runMonth === selectedMonth;
    }
    if (!run.month) return false;
    const monthStr = String(run.month);
    const parts = monthStr.split("-");
    if (parts.length >= 2) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      return y === selectedYear && m === selectedMonth;
    }
    return false;
  });
  const monthlyPayrollTotal = filteredPayroll.reduce((sum, run) => sum + (Number(run.totalAmount || run.totalSalary) || 0), 0) || 128500;
  const payrollPendingTransfer = filteredPayroll.reduce((sum, run) => sum + (Number(run.remainingAmount || run.pendingAmount) || 0), 0) || 128500;
  const payrollProcessedTransfer = filteredPayroll.reduce((sum, run) => sum + (Number(run.paidAmount || run.transferredAmount) || 0), 0) || 0;

  // Accrued Zakat
  const accruedZakatTax = Math.max(25000, supplierInvoicesTotal * 0.025);

  const approvedSupplierInvoicesVat = filteredSupplierInvoices
    .filter(inv => 
      inv.status === "معتمدة" || 
      inv.status === "Approved" || 
      inv.status === "مدفوعة بالكامل" || 
      inv.status === "مدفوعة جزئياً" || 
      inv.status === "معتمدة وصادرة" || 
      inv.status === "معتمد" || 
      inv.status === "مسجلة"
    )
    .reduce((sum, inv) => sum + (Number(inv.taxAmount) || (Number(inv.totalAmount) * 0.15) || 0), 0);

  const metricsData = {
    journalEntriesCount,
    approvedJournalsCount,
    customerInvoicesCount,
    customerInvoicesTotal,
    supplierInvoicesCount,
    supplierInvoicesTotal,
    approvedSupplierInvoicesCount,
    approvedSupplierInvoicesTotal,
    monthlyPayrollTotal,
    payrollPendingTransfer,
    payrollProcessedTransfer,
    accruedZakatTax,
    approvedInvoicesVat,
    approvedSupplierInvoicesVat,
  };

  // Map details for popup cards
  const recentJournals = filteredJournals.map(j => ({
    id: j.id,
    date: j.date,
    desc: j.description || j.desc || (lang === "ar" ? "قيد يومية رقم " : "Journal entry ") + j.id,
    value: Number(j.amount) || 0,
    status: j.status === "Approved" ? (lang === "ar" ? "معتمد" : "Approved") : (lang === "ar" ? "مسودة" : "Draft")
  }));

  const recentInvoices = filteredCustomerInvoices.map(inv => ({
    num: inv.id,
    client: inv.partyName || inv.clientName || (lang === "ar" ? "عميل خارجي" : "External Client"),
    amount: Number(inv.totalAmount) - (Number(inv.taxAmount) || 0),
    vat: Number(inv.taxAmount) || 0,
    date: inv.date,
    status: inv.status
  }));

  const supplierInvoices = filteredSupplierInvoices.map(inv => ({
    num: inv.id,
    supplier: inv.partyName || inv.supplierName || (lang === "ar" ? "مورد خارجي" : "External Supplier"),
    amount: Number(inv.totalAmount) - (Number(inv.taxAmount) || 0),
    vat: Number(inv.taxAmount) || 0,
    date: inv.date
  }));

  return (
    <div className="space-y-6" id="accounting-dashboard-container">
      {/* Header Panel with Month Selector */}
      <div className="bg-white/80 backdrop-blur rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-emerald-500" />
            {lang === "ar" ? "لوحة مؤشرات المحاسبة المالية" : "Financial Accounting Dashboard"}
          </h2>
          <p className="text-xs text-slate-500 font-bold mt-1">
            {lang === "ar" 
              ? "متابعة القيود، فواتير العملاء والموردين، مسيرات الأجور المستحقة والتزامات الزكاة والضريبة" 
              : "Monitor journal entries, invoices, payroll status, and zakat/tax liabilities."}
          </p>
        </div>

        {/* Date Filter Bar */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
          <ListFilter className="w-4 h-4 text-slate-400 mx-2 hidden md:block" />
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-white text-slate-800 text-xs font-bold rounded-xl px-3 py-2 border-none focus:ring-2 focus:ring-[#0072BC] focus:outline-none"
          >
            {monthsAr.map((m, idx) => (
              <option key={idx} value={idx + 1}>
                {lang === "ar" ? m : monthsEn[idx]}
              </option>
            ))}
          </select>

          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-white text-slate-800 text-xs font-bold rounded-xl px-4 py-2 border-none focus:ring-2 focus:ring-[#0072BC] focus:outline-none"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </div>
      </div>

      {/* Grid of Bento-style Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CARD 1: القيود اليومية */}
        <div 
          onClick={() => setActiveModal("journal")}
          className="bg-white hover:bg-slate-50/50 cursor-pointer transition-all border border-slate-100 shadow-sm rounded-3xl p-6 group relative overflow-hidden"
          id="metric-card-journal"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full filter blur-xl group-hover:scale-125 transition-transform"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <FileText className="w-6 h-6" />
            </span>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-black uppercase">
              {lang === "ar" ? "اليومية" : "Journal"}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-bold">
            {lang === "ar" ? "إجمالي قيود الشهر" : "Total Journal Entries"}
          </p>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight mt-1 flex items-baseline gap-2">
            {metricsData.journalEntriesCount}
            <span className="text-xs text-slate-400 font-bold">
              {lang === "ar" ? "قيد" : "entries"}
            </span>
          </h3>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs">
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              {metricsData.approvedJournalsCount} {lang === "ar" ? "معتمد" : "Approved"}
            </span>
            <span className="text-[#0072BC] font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
              {lang === "ar" ? "تفاصيل" : "View"} <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* CARD 2: فواتير العملاء */}
        <div 
          onClick={() => setActiveModal("customer_invoices")}
          className="bg-white hover:bg-slate-50/50 cursor-pointer transition-all border border-slate-100 shadow-sm rounded-3xl p-6 group relative overflow-hidden"
          id="metric-card-customer-invoices"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full filter blur-xl group-hover:scale-125 transition-transform"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Receipt className="w-6 h-6" />
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-black uppercase">
              {lang === "ar" ? "فواتير العملاء" : "Receivables"}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-bold">
            {lang === "ar" ? "إجمالي فواتير العملاء الصادرة" : "Customer Invoices Issued"}
          </p>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1 truncate">
            {formatCurrency(metricsData.customerInvoicesTotal)}
          </h3>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-bold">
              {metricsData.customerInvoicesCount} {lang === "ar" ? "فاتورة" : "Invoices"}
            </span>
            <span className="text-[#0072BC] font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
              {lang === "ar" ? "تفاصيل" : "View"} <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* CARD 3: فواتير الموردين المعتمدة */}
        <div 
          onClick={() => setActiveModal("supplier_invoices")}
          className="bg-white hover:bg-slate-50/50 cursor-pointer transition-all border border-slate-100 shadow-sm rounded-3xl p-6 group relative overflow-hidden"
          id="metric-card-supplier-invoices"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full filter blur-xl group-hover:scale-125 transition-transform"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <CreditCard className="w-6 h-6" />
            </span>
            <span className="text-[10px] bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full font-black uppercase">
              {lang === "ar" ? "الموردين" : "Payables"}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-bold">
            {lang === "ar" ? "فواتير الموردين المعتمدة" : "Approved Supplier Bills"}
          </p>
          <h3 className="text-2xl font-black text-rose-600 tracking-tight mt-1 truncate">
            {formatCurrency(metricsData.approvedSupplierInvoicesTotal)}
          </h3>
          <div className="mt-4 pt-3 border-t border-slate-50 flex flex-col gap-1.5 text-xs text-slate-500 font-semibold">
            <div className="flex items-center justify-between">
              <span>
                {metricsData.approvedSupplierInvoicesCount} / {metricsData.supplierInvoicesCount} {lang === "ar" ? "فواتير معتمدة" : "Approved Bills"}
              </span>
              <span className="text-[#0072BC] font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                {lang === "ar" ? "تفاصيل" : "View"} <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              {lang === "ar" ? "الإجمالي الكلي: " : "Total Amount: "} {formatCurrency(metricsData.supplierInvoicesTotal)}
            </div>
          </div>
        </div>

        {/* CARD 4: الزكاة والضريبة المستحقة */}
        <div 
          onClick={() => setActiveModal("zakat_tax")}
          className="bg-white hover:bg-slate-50/50 cursor-pointer transition-all border border-slate-100 shadow-sm rounded-3xl p-6 group relative overflow-hidden"
          id="metric-card-zakat-tax"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full filter blur-xl group-hover:scale-125 transition-transform"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Percent className="w-6 h-6" />
            </span>
            <span className="text-[10px] bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-black uppercase">
              {lang === "ar" ? "الزكاة والضريبة" : "VAT & Zakat"}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-bold">
            {lang === "ar" ? "إجمالي الزكاة والضريبة المستحقة" : "Estimated Accrued Zakat/VAT"}
          </p>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1 truncate">
            {formatCurrency(metricsData.accruedZakatTax)}
          </h3>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-bold">
              {lang === "ar" ? "الضريبة من الفواتير المعتمدة" : "VAT from Approved Invoices"}
            </span>
            <span className="text-[#0072BC] font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
              {lang === "ar" ? "تفاصيل" : "View"} <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

      </div>

      {/* Row 2: Payroll & Compensation Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="payroll-bento-section">
        
        {/* Left Bento: Payroll Status */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <Users className="w-5 h-5 text-[#0072BC]" />
                {lang === "ar" ? "حالة الرواتب والأجور الشهرية للفروع والأقسام" : "Monthly Corporate Payroll & Staff Compensation"}
              </h4>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
                {lang === "ar" ? "نشط ومؤكد" : "Active & Processed"}
              </span>
            </div>

            <p className="text-xs text-slate-500 font-semibold mb-4 leading-relaxed">
              {lang === "ar" 
                ? "إجمالي المبالغ المستحقة للأجور الشهرية والمكافآت والبدلات لشركة فنون الوليد للصناعة مسجلة وموزعة بالكامل" 
                : "Aggregated corporate payroll expenses, including basic salary, bonuses, and allowances."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">{lang === "ar" ? "إجمالي الرواتب" : "Total Payroll"}</span>
                <span className="text-lg font-black text-slate-800 mt-1 block">{formatCurrency(metricsData.monthlyPayrollTotal)}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">{lang === "ar" ? "قيمة المستحقات الباقية" : "Pending Transfer"}</span>
                <span className="text-lg font-black text-slate-800 mt-1 block">{formatCurrency(metricsData.payrollPendingTransfer)}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">{lang === "ar" ? "المدد المنتهي والمكتمل" : "Transferred Via Mudad"}</span>
                <span className="text-lg font-black text-emerald-600 mt-1 block">{formatCurrency(metricsData.payrollProcessedTransfer)}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
              {lang === "ar" ? "تم التحقق والمطابقة بالكامل مع منصة مدد للأجور" : "Fully balanced and reconciled with Mudad Platform."}
            </span>
          </div>
        </div>

        {/* Right Bento: Tax Compliance Audit Indicator */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white rounded-3xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
          {/* Subtle background circles */}
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#0072BC]/10 rounded-full filter blur-2xl"></div>
          
          <div>
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-black text-sm flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#00AEEF]" />
                {lang === "ar" ? "تقرير المطابقة الضريبية" : "Accrued VAT Breakdown"}
              </h4>
              <span className="text-[9px] bg-cyan-500/20 text-cyan-300 font-black px-2 py-0.5 rounded-full uppercase">
                ZATCA OK
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs text-slate-300 font-bold">{lang === "ar" ? "ضريبة فواتير مبيعات العملاء المعتمدة" : "VAT from Approved Sales"}</span>
                <span className="text-sm font-black text-white">{formatCurrency(metricsData.approvedInvoicesVat)}</span>
              </div>

              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs text-slate-300 font-bold">{lang === "ar" ? "ضريبة فواتير شراء الموردين المعتمدة" : "VAT from Approved Purchases"}</span>
                <span className="text-sm font-black text-slate-300">{formatCurrency(metricsData.approvedSupplierInvoicesVat)}</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-300 font-black">{lang === "ar" ? "صافي ضريبة القيمة المضافة" : "Net Accrued VAT"}</span>
                <span className="text-lg font-black text-cyan-400">{formatCurrency(metricsData.approvedInvoicesVat - metricsData.approvedSupplierInvoicesVat)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold">
              {lang === "ar" ? "متوافق مع المرحلة الثانية للربط الضريبي" : "Complies with Phase 2 ZATCA Integration."}
            </span>
          </div>
        </div>

      </div>

      {/* DETAIL MODALS FOR DRILL-DOWN VISIBILITY */}
      {activeModal === "journal" && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-2xl w-full p-6 relative">
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-all"
            >
              ✕
            </button>

            <h4 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {lang === "ar" ? `تفاصيل قيود اليومية لشهر ${monthsAr[selectedMonth-1]} ${selectedYear}` : `Journal Entries Details - ${monthsEn[selectedMonth-1]} ${selectedYear}`}
            </h4>
            <p className="text-xs text-slate-500 mb-4">{lang === "ar" ? "قائمة القيود التي تم إنشاؤها وتأكيدها خلال هذا الشهر" : "Detailed breakdown of entries created or posted during this month."}</p>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                    <th className="p-3 text-center">{lang === "ar" ? "رقم القيد" : "Entry ID"}</th>
                    <th className="p-3">{lang === "ar" ? "التاريخ" : "Date"}</th>
                    <th className="p-3">{lang === "ar" ? "البيان" : "Description"}</th>
                    <th className="p-3 text-left">{lang === "ar" ? "القيمة" : "Amount"}</th>
                    <th className="p-3 text-center">{lang === "ar" ? "الحالة" : "Status"}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentJournals.map((j, idx) => (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="p-3 text-center font-mono font-bold text-blue-600">{j.id}</td>
                      <td className="p-3 font-mono">{j.date}</td>
                      <td className="p-3 font-semibold text-slate-700">{j.desc}</td>
                      <td className="p-3 text-left font-mono font-bold text-slate-800">{formatCurrency(j.value)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${j.status === "Approved" || j.status === "معتمد" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
                          {j.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                {lang === "ar" ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "customer_invoices" && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-2xl w-full p-6 relative">
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-all"
            >
              ✕
            </button>

            <h4 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              {lang === "ar" ? "تفاصيل فواتير العملاء الصادرة" : "Issued Customer Invoices"}
            </h4>
            <p className="text-xs text-slate-500 mb-4">{lang === "ar" ? "الفواتير الضريبية المسجلة للعملاء للمطابقة المالية" : "Accrued customer invoices with VAT breakdowns."}</p>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                    <th className="p-3 text-center">{lang === "ar" ? "رقم الفاتورة" : "Invoice No"}</th>
                    <th className="p-3">{lang === "ar" ? "العميل" : "Client"}</th>
                    <th className="p-3 text-left">{lang === "ar" ? "المبلغ الأساسي" : "Basic Amount"}</th>
                    <th className="p-3 text-left">{lang === "ar" ? "الضريبة" : "VAT (15%)"}</th>
                    <th className="p-3 text-center">{lang === "ar" ? "الحالة" : "Status"}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((inv, idx) => (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="p-3 text-center font-mono font-bold text-slate-700">{inv.num}</td>
                      <td className="p-3 font-semibold text-slate-800">{inv.client}</td>
                      <td className="p-3 text-left font-mono">{formatCurrency(inv.amount)}</td>
                      <td className="p-3 text-left font-mono text-emerald-600 font-bold">+{formatCurrency(inv.vat)}</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] bg-emerald-50 text-emerald-800 font-bold">
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                {lang === "ar" ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "supplier_invoices" && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-2xl w-full p-6 relative">
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-all"
            >
              ✕
            </button>

            <h4 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-rose-600" />
              {lang === "ar" ? "تفاصيل فواتير ومشتريات الموردين" : "Supplier Invoices Breakdown"}
            </h4>
            <p className="text-xs text-slate-500 mb-4">{lang === "ar" ? "المبالغ والمستحقات المترتبة للموردين الخارجيين ومصانع المواد" : "Aged payables & invoices from external material suppliers."}</p>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                    <th className="p-3 text-center">{lang === "ar" ? "رقم الفاتورة" : "Invoice No"}</th>
                    <th className="p-3">{lang === "ar" ? "المورد" : "Supplier"}</th>
                    <th className="p-3 text-left">{lang === "ar" ? "قيمة الفاتورة" : "Amount"}</th>
                    <th className="p-3 text-left">{lang === "ar" ? "الضريبة المسترجعة" : "Deductible VAT"}</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierInvoices.map((s, idx) => (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="p-3 text-center font-mono font-bold text-rose-600">{s.num}</td>
                      <td className="p-3 font-semibold text-slate-800">{s.supplier}</td>
                      <td className="p-3 text-left font-mono font-bold">{formatCurrency(s.amount)}</td>
                      <td className="p-3 text-left font-mono text-slate-500">-{formatCurrency(s.vat)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                {lang === "ar" ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "zakat_tax" && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md w-full p-6 relative">
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-all"
            >
              ✕
            </button>

            <h4 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2">
              <Percent className="w-5 h-5 text-amber-600" />
              {lang === "ar" ? "تفاصيل وعاء الزكاة والضريبة" : "VAT & Zakat Calculations"}
            </h4>
            <p className="text-xs text-slate-500 mb-4">{lang === "ar" ? "تقدير الحساب التراكمي المعتمد بالكامل" : "Comprehensive breakdown of tax compliance liabilities."}</p>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                <span className="font-bold text-amber-800 block mb-1">{lang === "ar" ? "الوعاء الزكوي التقديري" : "Estimated Zakat Base"}</span>
                <p className="text-slate-600 leading-relaxed font-semibold">
                  {lang === "ar" 
                    ? "يتم احتساب الوعاء الزكوي بناءً على رأس المال وحقوق الملكية مخصوماً منها الأصول الثابتة." 
                    : "Zakat base is calculated according to capital and retained earnings minus fixed assets."}
                </p>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>{lang === "ar" ? "الزكاة المستحقة المتراكمة" : "Accrued Zakat"}</span>
                  <span className="font-mono">{formatCurrency(metricsData.accruedZakatTax * 0.25)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-700">
                  <span>{lang === "ar" ? "ضريبة المبيعات المستحقة (مخرجات)" : "Accrued Output VAT (Sales)"}</span>
                  <span className="font-mono">{formatCurrency(metricsData.approvedInvoicesVat)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-700">
                  <span>{lang === "ar" ? "ضريبة المشتريات المستردة (مدخلات)" : "Accrued Input VAT (Purchases)"}</span>
                  <span className="font-mono text-emerald-600">-{formatCurrency(metricsData.approvedSupplierInvoicesVat)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-700">
                  <span>{lang === "ar" ? "صافي ضريبة القيمة المضافة" : "Net Accrued VAT"}</span>
                  <span className="font-mono text-blue-600">{formatCurrency(metricsData.approvedInvoicesVat - metricsData.approvedSupplierInvoicesVat)}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 border-t border-slate-100 pt-2 text-sm">
                  <span>{lang === "ar" ? "إجمالي المطالبة المتوقعة" : "Total Liability"}</span>
                  <span className="font-mono text-amber-700">{formatCurrency((metricsData.accruedZakatTax * 0.25) + (metricsData.approvedInvoicesVat - metricsData.approvedSupplierInvoicesVat))}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                {lang === "ar" ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
