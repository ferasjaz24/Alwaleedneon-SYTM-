import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  Printer,
  RefreshCw,
  Search,
  Calendar,
  DollarSign,
  Building,
  Users,
  Percent,
  Briefcase,
  Calculator,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Receipt,
  Scale,
  Activity,
  UserCheck,
  ShieldAlert,
  ArrowRightLeft,
  ChevronDown,
  ListFilter
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import * as XLSX from "xlsx";
import { sharedPrintHeader, sharedPrintFooter, sharedPrintStyles } from "../../utils/PrintShared";

// ---------------- TYPES & INTERFACES ----------------

interface Client {
  id: string;
  name: string;
  vatNumber?: string;
  phone?: string;
  email?: string;
}

interface CustomerInvoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  customerName: string;
  customerId: string;
  projectName: string;
  salesperson: string;
  invoiceType: "Tax Invoice" | "Simplified Tax Invoice";
  status: "Draft" | "Issued" | "Partially Paid" | "Paid" | "Cancelled" | "Credit Note Issued";
  taxableAmount: number;
  vatTotal: number;
  grandTotal: number;
  amountPaid: number;
  remainingAmount: number;
  createdBy?: string;
  quotationNo?: string;
}

interface SupplierInvoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate?: string;
  supplierName: string;
  supplierId: string;
  projectName?: string;
  status: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  amountPaid?: number;
  remainingAmount?: number;
}

interface RevenueRecord {
  id: string;
  revenueId: string;
  revenueDate: string;
  customerName: string;
  customerId: string;
  projectName?: string;
  taxableAmount: number;
  vatAmount: number;
  totalAmount: number;
  paymentMethod: string;
  bankAccountId?: string;
  cashBoxId?: string;
}

interface ExpenseRecord {
  id: string;
  expenseNo: string;
  expenseDate: string;
  supplierName: string;
  projectName: string;
  category: string; // Salaries, Materials, Rent, Vehicles, Utilities, Other
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  paymentMethod: string;
  bankAccountId?: string;
  cashBoxId?: string;
  createdBy?: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  openingBalance: number;
  currentBalance: number;
}

interface CashBox {
  id: string;
  cashBoxName: string;
  responsiblePerson: string;
  openingBalance: number;
  currentBalance: number;
}

interface CashBankTransaction {
  id: string;
  transactionNo: string;
  journalEntryNo: string;
  accountType: "Bank" | "Cash";
  bankAccountId?: string;
  bankName?: string;
  cashBoxId?: string;
  cashBoxName?: string;
  direction: "In" | "Out";
  amount: number;
  previousBalance: number;
  newBalance: number;
  description: string;
  sourceModule: string;
  createdAt: string;
}

interface JournalLine {
  id: string;
  lineNo: number;
  accountType: string;
  accountName: string;
  debit: number;
  credit: number;
}

interface JournalEntry {
  id: string;
  journalEntryNo: string;
  date: string;
  sourceModule: string;
  description: string;
  status: "Draft" | "Approved" | "Reversed" | "Cancelled";
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  lines?: JournalLine[];
}

// Reports Categories
type ReportCategory = 
  | "sales_invoices"
  | "revenues"
  | "cash_bank"
  | "journal"
  | "tax_zakat"
  | "clients_debts"
  | "suppliers_expenses";

interface ReportItem {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
}

export default function AccountingReportsTab({ lang }: { lang: "ar" | "en"; user: any }) {
  // Loading & Master Lists
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierInvoice[]>([]);
  const [revenues, setRevenues] = useState<RevenueRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [boxes, setBoxes] = useState<CashBox[]>([]);
  const [transactions, setTransactions] = useState<CashBankTransaction[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Navigation States
  const [activeCategory, setActiveCategory] = useState<ReportCategory>("sales_invoices");
  const [activeReportId, setActiveReportId] = useState<string>("customer_invoices_all");

  // Filter States
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    customerId: "ALL",
    bankBoxId: "ALL",
    status: "ALL",
    invoiceType: "ALL",
    projectName: "",
    salesperson: ""
  });

  // Load all required databases for calculations
  const loadDatabase = async () => {
    try {
      setLoading(true);
      
      const [
        invSnap,
        supSnap,
        revSnap,
        expSnap,
        bankSnap,
        boxSnap,
        txSnap,
        journSnap,
        clientSnap
      ] = await Promise.all([
        getDocs(collection(db, "customer_invoices")),
        getDocs(collection(db, "supplier_invoices")),
        getDocs(collection(db, "revenues")),
        getDocs(collection(db, "expenses")),
        getDocs(collection(db, "bank_accounts")),
        getDocs(collection(db, "cash_boxes")),
        getDocs(collection(db, "cash_bank_transactions")),
        getDocs(collection(db, "journal_entries")),
        getDocs(collection(db, "clients"))
      ]);

      setInvoices(invSnap.docs.map(d => ({ id: d.id, ...d.data() } as CustomerInvoice)));
      setSuppliers(supSnap.docs.map(d => ({ id: d.id, ...d.data() } as SupplierInvoice)));
      setRevenues(revSnap.docs.map(d => ({ id: d.id, ...d.data() } as RevenueRecord)));
      setExpenses(expSnap.docs.map(d => ({ id: d.id, ...d.data() } as ExpenseRecord)));
      setBanks(bankSnap.docs.map(d => ({ id: d.id, ...d.data() } as BankAccount)));
      setBoxes(boxSnap.docs.map(d => ({ id: d.id, ...d.data() } as CashBox)));
      setTransactions(txSnap.docs.map(d => ({ id: d.id, ...d.data() } as CashBankTransaction)));
      setJournals(journSnap.docs.map(d => ({ id: d.id, ...d.data() } as JournalEntry)));
      setClients(clientSnap.docs.map(d => ({ id: d.id, ...d.data() } as Client)));

    } catch (err) {
      console.error("Error loading reports data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabase();
  }, []);

  // Smoothly scroll to the top of the reports section whenever active category or report changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
    document.body.scrollTo({ top: 0, behavior: "smooth" });
    
    const dashboardEl = document.getElementById("accounting-reports-dashboard");
    if (dashboardEl) {
      dashboardEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeReportId, activeCategory]);

  // Reset Filters
  const resetFilters = () => {
    setFilters({
      fromDate: "",
      toDate: "",
      customerId: "ALL",
      bankBoxId: "ALL",
      status: "ALL",
      invoiceType: "ALL",
      projectName: "",
      salesperson: ""
    });
  };

  // ---------------- DESIGN DEFINITION FOR REPORTS MENU ----------------

  const categories: Record<ReportCategory, { titleAr: string; titleEn: string; icon: any; color: string; items: ReportItem[] }> = {
    sales_invoices: {
      titleAr: "📊 تقارير المبيعات والفواتير",
      titleEn: "📊 Sales & Invoices",
      icon: FileText,
      color: "text-blue-600 bg-blue-50 border-blue-100",
      items: [
        { id: "customer_invoices_all", titleAr: "تقرير فواتير العملاء", titleEn: "Customer Invoices Report", descriptionAr: "كافة الفواتير الصادرة للعملاء", descriptionEn: "All issued customer invoices" },
        { id: "customer_invoices_paid", titleAr: "تقرير الفواتير المدفوعة", titleEn: "Paid Invoices Report", descriptionAr: "الفواتير التي تم تحصيل مبالغها بالكامل", descriptionEn: "Invoices settled in full" },
        { id: "customer_invoices_unpaid", titleAr: "تقرير الفواتير غير المدفوعة", titleEn: "Unpaid Invoices Report", descriptionAr: "الفواتير المتبقية لدى العملاء (آجل)", descriptionEn: "Outstanding unpaid invoices" },
        { id: "customer_invoices_overdue", titleAr: "تقرير فواتير المتأخرات", titleEn: "Overdue Invoices Report", descriptionAr: "فواتير تجاوزت تاريخ استحقاق السداد المعتمد", descriptionEn: "Invoices past their due dates" },
        { id: "sales_by_customer", titleAr: "تقرير المبيعات حسب العميل", titleEn: "Sales by Customer", descriptionAr: "إحصائيات المبيعات الإجمالية لكل عميل على حدة", descriptionEn: "Total sales volume per customer" },
        { id: "sales_by_month", titleAr: "تقرير المبيعات حسب الشهر", titleEn: "Sales by Month", descriptionAr: "حركة تطور المبيعات الشهرية خلال السنة", descriptionEn: "Monthly sales trends analysis" }
      ]
    },
    revenues: {
      titleAr: "💸 تقارير الإيرادات والمقبوضات",
      titleEn: "💸 Revenues Reports",
      icon: TrendingUp,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      items: [
        { id: "revenues_daily", titleAr: "تقرير الإيرادات اليومية", titleEn: "Daily Revenues Report", descriptionAr: "حركة الإيرادات المقبوضة مفصلة يومياً", descriptionEn: "Daily operational revenues breakdown" },
        { id: "revenues_monthly", titleAr: "تقرير الإيرادات الشهرية", titleEn: "Monthly Revenues Report", descriptionAr: "حركة الإيرادات الشهرية لمراقبة الأداء", descriptionEn: "Monthly aggregated revenues" },
        { id: "revenues_by_project", titleAr: "تقرير الإيرادات حسب المشروع", titleEn: "Revenues by Project", descriptionAr: "العوائد والتدفقات النقدية لكل مشروع معتمد", descriptionEn: "Revenue collections grouped by project" },
        { id: "revenues_by_customer", titleAr: "تقرير الإيرادات حسب العميل", titleEn: "Revenues by Customer", descriptionAr: "مجموع ما تم تحصيله من كل عميل", descriptionEn: "Aggregated collections by customer" },
        { id: "revenues_excluding_vat", titleAr: "الإيرادات الصافية (دون VAT)", titleEn: "Net Revenues (Excl. VAT)", descriptionAr: "الإيرادات الصافية الضرورية للتحليل وحساب الوعاء", descriptionEn: "Net business revenue excluding tax" }
      ]
    },
    cash_bank: {
      titleAr: "🏦 تقارير الصندوق والبنك",
      titleEn: "🏦 Cash & Bank Reports",
      icon: Building,
      color: "text-purple-600 bg-purple-50 border-purple-100",
      items: [
        { id: "bank_statement", titleAr: "كشف حساب بنك", titleEn: "Bank Statement", descriptionAr: "حركة العمليات التفصيلية لحساب بنكي معين", descriptionEn: "Transaction ledger for specific bank" },
        { id: "cash_statement", titleAr: "كشف حساب صندوق الخزينة", titleEn: "Cash Box Ledger", descriptionAr: "حركة الكاش الواردة والصادرة من صندوق النقدية", descriptionEn: "Transaction ledger for active cash box" },
        { id: "current_balances", titleAr: "تقرير الأرصدة الحالية والافتتاحية", titleEn: "Current Liquidity Balances", descriptionAr: "رصيد الحسابات البنكية والصناديق ومجمل السيولة", descriptionEn: "Current cash and bank liquid balances" },
        { id: "collections_report", titleAr: "تقرير التحصيلات النقدية والبنكية", titleEn: "Collections Statement", descriptionAr: "جميع المبالغ المستلمة والداخلة للمنشأة", descriptionEn: "All inbound funds received" },
        { id: "payments_report", titleAr: "تقرير المدفوعات والتحويلات الخارجية", titleEn: "Payments Statement", descriptionAr: "جميع المبالغ الخارجة والمدفوعة من الحسابات", descriptionEn: "All outbound payouts and transfers" },
        { id: "bank_movement_period", titleAr: "حركة الخزينة والبنك خلال فترة", titleEn: "Bank Movements over Period", descriptionAr: "رصيد افتتاحي، داخل وخارج مع الرصيد النهائي", descriptionEn: "Opening, inbound, outbound and ending balance" }
      ]
    },
    journal: {
      titleAr: "📖 تقارير القيود المحاسبية",
      titleEn: "📖 Journal Entries Reports",
      icon: BookOpen,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
      items: [
        { id: "general_journal", titleAr: "دفتر اليومية العام", titleEn: "General Journal Ledger", descriptionAr: "كافة القيود المحاسبية المسجلة بالتفصيل", descriptionEn: "All registered journal entries" },
        { id: "journal_approved", titleAr: "تقرير القيود المعتمدة", titleEn: "Approved Journal Entries", descriptionAr: "القيود المرحلة والمثبتة في الأستاذ العام", descriptionEn: "Approved posted journal entries" },
        { id: "journal_draft", titleAr: "تقرير القيود المسودة", titleEn: "Draft Journal Entries", descriptionAr: "قيود غير معتمدة أو مؤقتة بحاجة لمراجعة", descriptionEn: "Draft non-posted journal entries" },
        { id: "journal_by_account", titleAr: "تقرير القيود المحاسبية حسب الحساب", titleEn: "Journal Entries by Account", descriptionAr: "حركات القيود المؤثرة على حساب معين", descriptionEn: "Entries filtered by chart of accounts" },
        { id: "journal_unbalanced", titleAr: "تقرير القيود غير المتوازنة للتدقيق", titleEn: "Unbalanced Entries Audit", descriptionAr: "القيود التي لا يتساوى فيها المدين والدائن للتدقيق", descriptionEn: "Audit of entries where Debit !== Credit" },
        { id: "journal_reversed", titleAr: "تقرير القيود العكسية والملغاة", titleEn: "Reversed Entries", descriptionAr: "القيود الملغاة أو التي تم توليد قيد عكسي لتسويتها", descriptionEn: "Reversed and cancelled journal entries" }
      ]
    },
    tax_zakat: {
      titleAr: "📜 تقارير الضريبة والالتزام الزكوي",
      titleEn: "📜 VAT & Zakat Reports",
      icon: Receipt,
      color: "text-amber-600 bg-amber-50 border-amber-100",
      items: [
        { id: "vat_quarterly", titleAr: "إقرار VAT الربع سنوي المعتمد", titleEn: "Quarterly VAT Return Summary", descriptionAr: "ملخص المخرجات والمدخلات وصافي المستحق للربع", descriptionEn: "VAT Return Summary per quarter" },
        { id: "vat_on_invoices", titleAr: "تقرير تفاصيل VAT على الفواتير", titleEn: "VAT Breakdown on Invoices", descriptionAr: "بيان ضريبة القيمة المضافة لكل فاتورة صادرة", descriptionEn: "Detailed tax amount per invoice" },
        { id: "vat_tax_only_invoices", titleAr: "تقرير الفواتير الضريبية فقط", titleEn: "Tax Invoices Only Return", descriptionAr: "تصفية الفواتير الضريبية المعتمدة للشركات", descriptionEn: "Tax invoices ledger excluding simplified ones" },
        { id: "zakat_estimation", titleAr: "تقرير الزكاة التقديرية السنوي", titleEn: "Estimated Zakat Statement", descriptionAr: "الوعاء الزكوي التقريبي مع الشرح المفصل للمعادلة", descriptionEn: "Annual estimated zakat base simulation" },
        { id: "zakat_tax_payment_status", titleAr: "تقرير فحص وحالة سداد الالتزامات", titleEn: "Settlement Status Report", descriptionAr: "بيان سداد إقرارات الضريبة ومبالغ الزكاة المستحقة", descriptionEn: "Payment status of ZATCA duties" }
      ]
    },
    clients_debts: {
      titleAr: "👥 تقارير المديونيات وأعمار ديون العملاء",
      titleEn: "👥 Debtors & Client Accounts",
      icon: Users,
      color: "text-rose-600 bg-rose-50 border-rose-100",
      items: [
        { id: "client_statement", titleAr: "كشف حساب عميل تفصيلي", titleEn: "Detailed Customer Statement", descriptionAr: "كشف شامل لجميع فواتير وسدادات عميل محدد", descriptionEn: "Invoices, receipts and outstanding of a client" },
        { id: "debt_aging", titleAr: "تقرير أعمار الديون والمستحقات الآجلة", titleEn: "Accounts Receivable Aging", descriptionAr: "تقسيم المبالغ المتأخرة حسب المدة 30/60/90 يوماً", descriptionEn: "Aging intervals: 30, 60, 90+ days overdue" },
        { id: "highest_debt_clients", titleAr: "العملاء الأكثر مديونية وسقف الائتمان", titleEn: "Highest Debt Customers", descriptionAr: "ترتيب تصاعدي للعملاء حسب المبالغ المعلقة", descriptionEn: "Customers ranked by largest outstanding balance" },
        { id: "collections_by_customer", titleAr: "تقرير كفاءة تحصيل مبيعات العميل", titleEn: "Collections efficiency per client", descriptionAr: "نسب ومبالغ التحصيل الناجحة مقارنة بقيمة الفواتير", descriptionEn: "Collections vs billing ratios per customer" }
      ]
    },
    suppliers_expenses: {
      titleAr: "💸 تقارير الموردين والتدفقات الصادرة",
      titleEn: "💸 Suppliers & Outflow Reports",
      icon: TrendingDown,
      color: "text-orange-600 bg-orange-50 border-orange-100",
      items: [
        { id: "expenses_all", titleAr: "تقرير المصروفات التشغيلية الشامل", titleEn: "Comprehensive Expenses Report", descriptionAr: "كافة حركات المصاريف والمدفوعات التشغيلية", descriptionEn: "All commercial business operating expenses" },
        { id: "suppliers_invoices_all", titleAr: "تقرير فواتير الموردين والمشتريات", titleEn: "Supplier Invoices Ledger", descriptionAr: "جميع فواتير الشراء والخدمات المقدمة من الموردين", descriptionEn: "Inbound supply purchases ledger" },
        { id: "suppliers_payables", titleAr: "تقرير مستحقات الموردين المعلقة", titleEn: "Supplier Outstanding Payables", descriptionAr: "المبالغ والذمم الدائنة المتبقية لصالح الموردين", descriptionEn: "Unpaid supplier invoices and due dates" },
        { id: "expenses_by_category", titleAr: "تقرير المصاريف التشغيلية حسب التصنيف", titleEn: "Expenses by Category", descriptionAr: "المصروفات موزعة (رواتب، مواد، إيجارات، سيارات، إلخ)", descriptionEn: "Aggregated expenses by category" }
      ]
    }
  };

  // Helper to find the active report metadata
  const getActiveReportMeta = () => {
    for (const catId in categories) {
      const cat = categories[catId as ReportCategory];
      const found = cat.items.find(item => item.id === activeReportId);
      if (found) return { category: cat, item: found };
    }
    return null;
  };

  const activeMeta = getActiveReportMeta();

  // ---------------- REPORT LOGIC & CALCULATIONS (DYNAMIC DATASETS) ----------------

  const getFilteredData = () => {
    let result: any[] = [];
    const from = filters.fromDate ? new Date(filters.fromDate) : null;
    const to = filters.toDate ? new Date(filters.toDate) : null;

    const checkDateRange = (dateStr: string) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    };

    switch (activeReportId) {
      // 1. SALES & INVOICES
      case "customer_invoices_all":
        result = invoices.filter(inv => {
          if (!checkDateRange(inv.invoiceDate)) return false;
          if (filters.customerId !== "ALL" && inv.customerId !== filters.customerId) return false;
          if (filters.status !== "ALL" && inv.status !== filters.status) return false;
          if (filters.invoiceType !== "ALL" && inv.invoiceType !== filters.invoiceType) return false;
          if (filters.projectName && !inv.projectName?.toLowerCase().includes(filters.projectName.toLowerCase())) return false;
          if (filters.salesperson && !inv.salesperson?.toLowerCase().includes(filters.salesperson.toLowerCase())) return false;
          return true;
        }).map(inv => ({
          invoiceNo: inv.invoiceNo,
          invoiceDate: inv.invoiceDate,
          customerName: inv.customerName,
          taxableAmount: inv.taxableAmount || 0,
          vatTotal: inv.vatTotal || 0,
          grandTotal: inv.grandTotal || 0,
          amountPaid: inv.amountPaid || 0,
          remainingAmount: inv.remainingAmount || 0,
          status: inv.status,
          salesperson: inv.salesperson || "-",
          createdBy: inv.createdBy || "-",
          quotationNo: inv.quotationNo || "-"
        }));
        break;

      case "customer_invoices_paid":
        result = invoices.filter(inv => {
          if (inv.status !== "Paid") return false;
          if (!checkDateRange(inv.invoiceDate)) return false;
          if (filters.customerId !== "ALL" && inv.customerId !== filters.customerId) return false;
          if (filters.invoiceType !== "ALL" && inv.invoiceType !== filters.invoiceType) return false;
          if (filters.projectName && !inv.projectName?.toLowerCase().includes(filters.projectName.toLowerCase())) return false;
          return true;
        }).map(inv => ({
          invoiceNo: inv.invoiceNo,
          invoiceDate: inv.invoiceDate,
          customerName: inv.customerName,
          taxableAmount: inv.taxableAmount || 0,
          vatTotal: inv.vatTotal || 0,
          grandTotal: inv.grandTotal || 0,
          amountPaid: inv.amountPaid || 0,
          remainingAmount: inv.remainingAmount || 0,
          status: inv.status,
          salesperson: inv.salesperson || "-",
          createdBy: inv.createdBy || "-",
          quotationNo: inv.quotationNo || "-"
        }));
        break;

      case "customer_invoices_unpaid":
        result = invoices.filter(inv => {
          if (inv.status === "Paid" || inv.status === "Cancelled") return false;
          if (!checkDateRange(inv.invoiceDate)) return false;
          if (filters.customerId !== "ALL" && inv.customerId !== filters.customerId) return false;
          if (filters.projectName && !inv.projectName?.toLowerCase().includes(filters.projectName.toLowerCase())) return false;
          return true;
        }).map(inv => ({
          invoiceNo: inv.invoiceNo,
          invoiceDate: inv.invoiceDate,
          customerName: inv.customerName,
          taxableAmount: inv.taxableAmount || 0,
          vatTotal: inv.vatTotal || 0,
          grandTotal: inv.grandTotal || 0,
          amountPaid: inv.amountPaid || 0,
          remainingAmount: inv.remainingAmount || 0,
          status: inv.status,
          salesperson: inv.salesperson || "-",
          createdBy: inv.createdBy || "-",
          quotationNo: inv.quotationNo || "-"
        }));
        break;

      case "customer_invoices_overdue":
        const todayStr = new Date().toISOString().split("T")[0];
        result = invoices.filter(inv => {
          if (inv.status === "Paid" || inv.status === "Cancelled") return false;
          if (inv.dueDate >= todayStr) return false;
          if (!checkDateRange(inv.invoiceDate)) return false;
          if (filters.customerId !== "ALL" && inv.customerId !== filters.customerId) return false;
          return true;
        }).map(inv => ({
          invoiceNo: inv.invoiceNo,
          invoiceDate: inv.invoiceDate,
          customerName: inv.customerName,
          taxableAmount: inv.taxableAmount || 0,
          vatTotal: inv.vatTotal || 0,
          grandTotal: inv.grandTotal || 0,
          amountPaid: inv.amountPaid || 0,
          remainingAmount: inv.remainingAmount || 0,
          status: inv.status,
          salesperson: inv.salesperson || "-",
          createdBy: inv.createdBy || "-",
          quotationNo: inv.quotationNo || "-"
        }));
        break;

      case "sales_by_customer":
        const customerSalesMap: Record<string, { name: string; count: number; subtotal: number; vat: number; total: number; remaining: number }> = {};
        invoices.forEach(inv => {
          if (inv.status === "Cancelled") return;
          if (!checkDateRange(inv.invoiceDate)) return;
          if (filters.customerId !== "ALL" && inv.customerId !== filters.customerId) return;
          
          if (!customerSalesMap[inv.customerId]) {
            customerSalesMap[inv.customerId] = {
              name: inv.customerName || "عميل غير معروف",
              count: 0,
              subtotal: 0,
              vat: 0,
              total: 0,
              remaining: 0
            };
          }
          const entry = customerSalesMap[inv.customerId];
          entry.count += 1;
          entry.subtotal += inv.taxableAmount || 0;
          entry.vat += inv.vatTotal || 0;
          entry.total += inv.grandTotal || 0;
          entry.remaining += inv.remainingAmount || 0;
        });
        result = Object.values(customerSalesMap).sort((a, b) => b.total - a.total).map(entry => ({
          customerName: entry.name,
          count: entry.count,
          taxableAmount: entry.subtotal,
          vatTotal: entry.vat,
          grandTotal: entry.total,
          remainingAmount: entry.remaining
        }));
        break;

      case "sales_by_month":
        const monthlySalesMap: Record<string, { month: string; count: number; subtotal: number; vat: number; total: number }> = {};
        invoices.forEach(inv => {
          if (inv.status === "Cancelled") return;
          if (!checkDateRange(inv.invoiceDate)) return;
          
          const monthKey = inv.invoiceDate ? inv.invoiceDate.substring(0, 7) : "غير محدد"; // YYYY-MM
          if (!monthlySalesMap[monthKey]) {
            monthlySalesMap[monthKey] = {
              month: monthKey,
              count: 0,
              subtotal: 0,
              vat: 0,
              total: 0
            };
          }
          const entry = monthlySalesMap[monthKey];
          entry.count += 1;
          entry.subtotal += inv.taxableAmount || 0;
          entry.vat += inv.vatTotal || 0;
          entry.total += inv.grandTotal || 0;
        });
        result = Object.values(monthlySalesMap).sort((a, b) => a.month.localeCompare(b.month)).map(entry => ({
          month: entry.month,
          count: entry.count,
          taxableAmount: entry.subtotal,
          vatTotal: entry.vat,
          grandTotal: entry.total
        }));
        break;

      // 2. REVENUES & RECEIPTS
      case "revenues_daily":
        const dailyRevenuesMap: Record<string, { date: string; count: number; subtotal: number; vat: number; total: number }> = {};
        revenues.forEach(rev => {
          if (!checkDateRange(rev.revenueDate)) return;
          if (filters.customerId !== "ALL" && rev.customerId !== filters.customerId) return;
          if (filters.bankBoxId !== "ALL" && rev.bankAccountId !== filters.bankBoxId && rev.cashBoxId !== filters.bankBoxId) return;
          if (filters.projectName && !rev.projectName?.toLowerCase().includes(filters.projectName.toLowerCase())) return;

          const dateKey = rev.revenueDate;
          if (!dailyRevenuesMap[dateKey]) {
            dailyRevenuesMap[dateKey] = {
              date: dateKey,
              count: 0,
              subtotal: 0,
              vat: 0,
              total: 0
            };
          }
          const entry = dailyRevenuesMap[dateKey];
          entry.count += 1;
          entry.subtotal += rev.taxableAmount || 0;
          entry.vat += rev.vatAmount || 0;
          entry.total += rev.totalAmount || 0;
        });
        result = Object.values(dailyRevenuesMap).sort((a, b) => b.date.localeCompare(a.date)).map(entry => ({
          date: entry.date,
          count: entry.count,
          taxableAmount: entry.subtotal,
          vatAmount: entry.vat,
          totalAmount: entry.total
        }));
        break;

      case "revenues_monthly":
        const monthlyRevMap: Record<string, { month: string; count: number; subtotal: number; vat: number; total: number }> = {};
        revenues.forEach(rev => {
          if (!checkDateRange(rev.revenueDate)) return;
          if (filters.customerId !== "ALL" && rev.customerId !== filters.customerId) return;
          if (filters.bankBoxId !== "ALL" && rev.bankAccountId !== filters.bankBoxId && rev.cashBoxId !== filters.bankBoxId) return;

          const monthKey = rev.revenueDate ? rev.revenueDate.substring(0, 7) : "غير محدد";
          if (!monthlyRevMap[monthKey]) {
            monthlyRevMap[monthKey] = {
              month: monthKey,
              count: 0,
              subtotal: 0,
              vat: 0,
              total: 0
            };
          }
          const entry = monthlyRevMap[monthKey];
          entry.count += 1;
          entry.subtotal += rev.taxableAmount || 0;
          entry.vat += rev.vatAmount || 0;
          entry.total += rev.totalAmount || 0;
        });
        result = Object.values(monthlyRevMap).sort((a, b) => b.month.localeCompare(a.month)).map(entry => ({
          month: entry.month,
          count: entry.count,
          taxableAmount: entry.subtotal,
          vatAmount: entry.vat,
          totalAmount: entry.total
        }));
        break;

      case "revenues_by_project":
        const projectRevMap: Record<string, { project: string; count: number; subtotal: number; vat: number; total: number }> = {};
        revenues.forEach(rev => {
          if (!checkDateRange(rev.revenueDate)) return;
          if (filters.customerId !== "ALL" && rev.customerId !== filters.customerId) return;
          if (filters.projectName && !rev.projectName?.toLowerCase().includes(filters.projectName.toLowerCase())) return;

          const pName = rev.projectName || "بدون مشروع";
          if (!projectRevMap[pName]) {
            projectRevMap[pName] = {
              project: pName,
              count: 0,
              subtotal: 0,
              vat: 0,
              total: 0
            };
          }
          const entry = projectRevMap[pName];
          entry.count += 1;
          entry.subtotal += rev.taxableAmount || 0;
          entry.vat += rev.vatAmount || 0;
          entry.total += rev.totalAmount || 0;
        });
        result = Object.values(projectRevMap).sort((a, b) => b.total - a.total).map(entry => ({
          projectName: entry.project,
          count: entry.count,
          taxableAmount: entry.subtotal,
          vatAmount: entry.vat,
          totalAmount: entry.total
        }));
        break;

      case "revenues_by_customer":
        const customerRevMap: Record<string, { name: string; count: number; subtotal: number; vat: number; total: number }> = {};
        revenues.forEach(rev => {
          if (!checkDateRange(rev.revenueDate)) return;
          if (filters.customerId !== "ALL" && rev.customerId !== filters.customerId) return;

          const custName = rev.customerName || "عميل غير معرف";
          if (!customerRevMap[custName]) {
            customerRevMap[custName] = {
              name: custName,
              count: 0,
              subtotal: 0,
              vat: 0,
              total: 0
            };
          }
          const entry = customerRevMap[custName];
          entry.count += 1;
          entry.subtotal += rev.taxableAmount || 0;
          entry.vat += rev.vatAmount || 0;
          entry.total += rev.totalAmount || 0;
        });
        result = Object.values(customerRevMap).sort((a, b) => b.total - a.total).map(entry => ({
          customerName: entry.name,
          count: entry.count,
          taxableAmount: entry.subtotal,
          vatAmount: entry.vat,
          totalAmount: entry.total
        }));
        break;

      case "revenues_excluding_vat":
        result = revenues.filter(rev => {
          if (!checkDateRange(rev.revenueDate)) return false;
          if (filters.customerId !== "ALL" && rev.customerId !== filters.customerId) return false;
          return true;
        }).map(r => ({
          revenueNo: r.revenueId || "-",
          date: r.revenueDate,
          customerName: r.customerName || "-",
          projectName: r.projectName || "-",
          taxableAmount: r.taxableAmount || 0,
          vatAmount: r.vatAmount || 0,
          totalAmount: r.totalAmount || 0
        }));
        break;

      // 3. CASH & BANK
      case "bank_statement":
        result = transactions.filter(tx => {
          if (tx.accountType !== "Bank") return false;
          if (filters.bankBoxId !== "ALL" && tx.bankAccountId !== filters.bankBoxId) return false;
          if (!checkDateRange(tx.createdAt?.split("T")[0])) return false;
          return true;
        }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(tx => ({
          transactionNo: tx.transactionNo || "-",
          date: tx.createdAt?.split("T")[0] || "-",
          direction: tx.direction === "In" ? (lang === "ar" ? "وارد" : "In") : (lang === "ar" ? "صادر" : "Out"),
          amount: tx.amount || 0,
          previousBalance: tx.previousBalance || 0,
          newBalance: tx.newBalance || 0,
          description: tx.description || "-"
        }));
        break;

      case "cash_statement":
        result = transactions.filter(tx => {
          if (tx.accountType !== "Cash") return false;
          if (filters.bankBoxId !== "ALL" && tx.cashBoxId !== filters.bankBoxId) return false;
          if (!checkDateRange(tx.createdAt?.split("T")[0])) return false;
          return true;
        }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(tx => ({
          transactionNo: tx.transactionNo || "-",
          date: tx.createdAt?.split("T")[0] || "-",
          direction: tx.direction === "In" ? (lang === "ar" ? "وارد" : "In") : (lang === "ar" ? "صادر" : "Out"),
          amount: tx.amount || 0,
          previousBalance: tx.previousBalance || 0,
          newBalance: tx.newBalance || 0,
          description: tx.description || "-"
        }));
        break;

      case "current_balances":
        // Combine current accounts with their initial settings
        const bankList = banks.map(b => ({
          name: b.bankName,
          type: lang === "ar" ? "حساب بنكي" : "Bank Account",
          accNo: b.accountNumber,
          opening: b.openingBalance || 0,
          current: b.currentBalance || 0,
          status: lang === "ar" ? "نشط" : "Active"
        }));
        const boxList = boxes.map(bx => ({
          name: bx.cashBoxName,
          type: lang === "ar" ? "صندوق كاش" : "Cash Box",
          accNo: bx.responsiblePerson,
          opening: bx.openingBalance || 0,
          current: bx.currentBalance || 0,
          status: lang === "ar" ? "نشط" : "Active"
        }));
        result = [...bankList, ...boxList];
        break;

      case "collections_report":
        result = transactions.filter(tx => {
          if (tx.direction !== "In") return false;
          if (!checkDateRange(tx.createdAt?.split("T")[0])) return false;
          if (filters.bankBoxId !== "ALL" && tx.bankAccountId !== filters.bankBoxId && tx.cashBoxId !== filters.bankBoxId) return false;
          return true;
        }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(tx => ({
          transactionNo: tx.transactionNo || "-",
          date: tx.createdAt?.split("T")[0] || "-",
          accountType: tx.accountType === "Bank" ? (lang === "ar" ? "بنك" : "Bank") : (lang === "ar" ? "صندوق كاش" : "Cash Box"),
          bankOrCashBoxName: tx.accountType === "Bank" ? (tx.bankName || "-") : (tx.cashBoxName || "-"),
          amount: tx.amount || 0,
          description: tx.description || "-"
        }));
        break;

      case "payments_report":
        result = transactions.filter(tx => {
          if (tx.direction !== "Out") return false;
          if (!checkDateRange(tx.createdAt?.split("T")[0])) return false;
          if (filters.bankBoxId !== "ALL" && tx.bankAccountId !== filters.bankBoxId && tx.cashBoxId !== filters.bankBoxId) return false;
          return true;
        }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(tx => ({
          transactionNo: tx.transactionNo || "-",
          date: tx.createdAt?.split("T")[0] || "-",
          accountType: tx.accountType === "Bank" ? (lang === "ar" ? "بنك" : "Bank") : (lang === "ar" ? "صندوق كاش" : "Cash Box"),
          bankOrCashBoxName: tx.accountType === "Bank" ? (tx.bankName || "-") : (tx.cashBoxName || "-"),
          amount: tx.amount || 0,
          description: tx.description || "-"
        }));
        break;

      case "bank_movement_period":
        // Calculates dynamic movement over period for each bank account
        const accountMovements: Record<string, { name: string; opening: number; moneyIn: number; moneyOut: number; closing: number }> = {};
        
        // Initialize accounts
        banks.forEach(b => {
          accountMovements[b.id] = { name: b.bankName, opening: b.openingBalance || 0, moneyIn: 0, moneyOut: 0, closing: b.currentBalance || 0 };
        });
        boxes.forEach(bx => {
          accountMovements[bx.id] = { name: bx.cashBoxName, opening: bx.openingBalance || 0, moneyIn: 0, moneyOut: 0, closing: bx.currentBalance || 0 };
        });

        transactions.forEach(tx => {
          const accId = tx.accountType === "Bank" ? tx.bankAccountId : tx.cashBoxId;
          if (!accId || !accountMovements[accId]) return;
          const isInPeriod = checkDateRange(tx.createdAt?.split("T")[0]);

          if (isInPeriod) {
            if (tx.direction === "In") {
              accountMovements[accId].moneyIn += tx.amount || 0;
            } else {
              accountMovements[accId].moneyOut += tx.amount || 0;
            }
          }
        });

        result = Object.values(accountMovements).map(item => ({
          name: item.name,
          opening: item.opening || 0,
          moneyIn: item.moneyIn || 0,
          moneyOut: item.moneyOut || 0,
          closing: item.closing || 0
        }));
        break;

      // 4. JOURNAL ENTRIES
      case "general_journal":
        result = journals.filter(j => {
          if (!checkDateRange(j.date)) return false;
          if (filters.status !== "ALL" && j.status !== filters.status) return false;
          return true;
        }).sort((a, b) => b.date.localeCompare(a.date)).map(j => ({
          journalEntryNo: j.journalEntryNo,
          date: j.date,
          description: j.description || "-",
          totalDebit: j.totalDebit || 0,
          totalCredit: j.totalCredit || 0,
          status: j.status,
          isBalanced: j.isBalanced ? (lang === "ar" ? "متزن" : "Balanced") : (lang === "ar" ? "غير متزن" : "Unbalanced")
        }));
        break;

      case "journal_approved":
        result = journals.filter(j => j.status === "Approved" && checkDateRange(j.date))
          .sort((a, b) => b.date.localeCompare(a.date))
          .map(j => ({
            journalEntryNo: j.journalEntryNo,
            date: j.date,
            description: j.description || "-",
            totalDebit: j.totalDebit || 0,
            totalCredit: j.totalCredit || 0,
            status: j.status,
            isBalanced: j.isBalanced ? (lang === "ar" ? "متزن" : "Balanced") : (lang === "ar" ? "غير متزن" : "Unbalanced")
          }));
        break;

      case "journal_draft":
        result = journals.filter(j => j.status === "Draft" && checkDateRange(j.date))
          .sort((a, b) => b.date.localeCompare(a.date))
          .map(j => ({
            journalEntryNo: j.journalEntryNo,
            date: j.date,
            description: j.description || "-",
            totalDebit: j.totalDebit || 0,
            totalCredit: j.totalCredit || 0,
            status: j.status,
            isBalanced: j.isBalanced ? (lang === "ar" ? "متزن" : "Balanced") : (lang === "ar" ? "غير متزن" : "Unbalanced")
          }));
        break;

      case "journal_by_account":
        const matchingLines: any[] = [];
        journals.forEach(j => {
          if (!checkDateRange(j.date)) return;
          if (j.lines) {
            j.lines.forEach(l => {
              matchingLines.push({
                journalNo: j.journalEntryNo,
                date: j.date,
                description: j.description || "-",
                accountType: l.accountType,
                accountName: l.accountName,
                debit: l.debit || 0,
                credit: l.credit || 0,
                status: j.status
              });
            });
          }
        });
        result = matchingLines.map(l => ({
          journalEntryNo: l.journalNo,
          date: l.date,
          description: l.description,
          accountType: l.accountType,
          accountName: l.accountName,
          debit: l.debit || 0,
          credit: l.credit || 0,
          status: l.status
        }));
        break;

      case "journal_unbalanced":
        result = journals.filter(j => !j.isBalanced || Math.abs(j.totalDebit - j.totalCredit) > 0.01)
          .sort((a, b) => b.date.localeCompare(a.date))
          .map(j => ({
            journalEntryNo: j.journalEntryNo,
            date: j.date,
            description: j.description || "-",
            totalDebit: j.totalDebit || 0,
            totalCredit: j.totalCredit || 0,
            status: j.status,
            isBalanced: j.isBalanced ? (lang === "ar" ? "متزن" : "Balanced") : (lang === "ar" ? "غير متزن" : "Unbalanced")
          }));
        break;

      case "journal_reversed":
        result = journals.filter(j => j.status === "Reversed" && checkDateRange(j.date))
          .sort((a, b) => b.date.localeCompare(a.date))
          .map(j => ({
            journalEntryNo: j.journalEntryNo,
            date: j.date,
            description: j.description || "-",
            totalDebit: j.totalDebit || 0,
            totalCredit: j.totalCredit || 0,
            status: j.status,
            isBalanced: j.isBalanced ? (lang === "ar" ? "متزن" : "Balanced") : (lang === "ar" ? "غير متزن" : "Unbalanced")
          }));
        break;

      // 5. VAT & ZAKAT
      case "vat_quarterly":
        // Group inputs & outputs by standard Saudi quarters
        const quarterlyVatMap: Record<string, { quarter: string; salesEx: number; salesVat: number; purchasesEx: number; purchasesVat: number; netVat: number }> = {
          "Q1": { quarter: "الربع الأول (Q1)", salesEx: 0, salesVat: 0, purchasesEx: 0, purchasesVat: 0, netVat: 0 },
          "Q2": { quarter: "الربع الثاني (Q2)", salesEx: 0, salesVat: 0, purchasesEx: 0, purchasesVat: 0, netVat: 0 },
          "Q3": { quarter: "الربع الثالث (Q3)", salesEx: 0, salesVat: 0, purchasesEx: 0, purchasesVat: 0, netVat: 0 },
          "Q4": { quarter: "الربع الرابع (Q4)", salesEx: 0, salesVat: 0, purchasesEx: 0, purchasesVat: 0, netVat: 0 }
        };

        invoices.forEach(inv => {
          if (inv.status === "Cancelled" || !inv.invoiceDate) return;
          if (!checkDateRange(inv.invoiceDate)) return;
          const month = parseInt(inv.invoiceDate.split("-")[1]);
          let qKey = "Q1";
          if (month >= 4 && month <= 6) qKey = "Q2";
          else if (month >= 7 && month <= 9) qKey = "Q3";
          else if (month >= 10 && month <= 12) qKey = "Q4";

          quarterlyVatMap[qKey].salesEx += inv.taxableAmount || 0;
          quarterlyVatMap[qKey].salesVat += inv.vatTotal || 0;
        });

        suppliers.forEach(sup => {
          if (!sup.invoiceDate) return;
          if (!checkDateRange(sup.invoiceDate)) return;
          const month = parseInt(sup.invoiceDate.split("-")[1]);
          let qKey = "Q1";
          if (month >= 4 && month <= 6) qKey = "Q2";
          else if (month >= 7 && month <= 9) qKey = "Q3";
          else if (month >= 10 && month <= 12) qKey = "Q4";

          quarterlyVatMap[qKey].purchasesEx += sup.subtotal || 0;
          quarterlyVatMap[qKey].purchasesVat += sup.vatAmount || 0;
        });

        expenses.forEach(exp => {
          if (!exp.expenseDate) return;
          if (!checkDateRange(exp.expenseDate)) return;
          const month = parseInt(exp.expenseDate.split("-")[1]);
          let qKey = "Q1";
          if (month >= 4 && month <= 6) qKey = "Q2";
          else if (month >= 7 && month <= 9) qKey = "Q3";
          else if (month >= 10 && month <= 12) qKey = "Q4";

          quarterlyVatMap[qKey].purchasesEx += exp.subtotal || 0;
          quarterlyVatMap[qKey].purchasesVat += exp.vatAmount || 0;
        });

        Object.keys(quarterlyVatMap).forEach(key => {
          quarterlyVatMap[key].netVat = quarterlyVatMap[key].salesVat - quarterlyVatMap[key].purchasesVat;
        });

        result = Object.values(quarterlyVatMap).map(q => ({
          quarter: q.quarter,
          salesEx: q.salesEx,
          salesVat: q.salesVat,
          purchasesEx: q.purchasesEx,
          purchasesVat: q.purchasesVat,
          netVat: q.netVat
        }));
        break;

      case "vat_on_invoices":
        result = invoices.filter(inv => {
          if (inv.status === "Cancelled") return false;
          if (!checkDateRange(inv.invoiceDate)) return false;
          return true;
        }).map(inv => ({
          invoiceNo: inv.invoiceNo,
          date: inv.invoiceDate,
          customerName: inv.customerName,
          taxableAmount: inv.taxableAmount || 0,
          rate: "15%",
          vatTotal: inv.vatTotal || 0,
          grandTotal: inv.grandTotal || 0,
          type: inv.invoiceType
        }));
        break;

      case "vat_tax_only_invoices":
        result = invoices.filter(inv => inv.invoiceType === "Tax Invoice" && inv.status !== "Cancelled" && checkDateRange(inv.invoiceDate)).map(inv => ({
          invoiceNo: inv.invoiceNo,
          date: inv.invoiceDate,
          customerName: inv.customerName,
          taxableAmount: inv.taxableAmount || 0,
          vatTotal: inv.vatTotal || 0,
          grandTotal: inv.grandTotal || 0,
          salesperson: inv.salesperson || "-",
          createdBy: inv.createdBy || "-"
        }));
        break;

      case "zakat_estimation":
        // Simulation using ZATCA methodology: net revenues * 2.5778%
        let totalRevenueSum = 0;
        revenues.forEach(rev => {
          if (checkDateRange(rev.revenueDate)) {
            totalRevenueSum += rev.taxableAmount || 0;
          }
        });
        const estimatedZakatBase = totalRevenueSum;
        const zakatDue = estimatedZakatBase * 0.025778;
        
        result = [{
          param: lang === "ar" ? "مجموع الإيرادات السنوية الصافية (دون VAT)" : "Total Net Annual Revenue (Excl. VAT)",
          amount: totalRevenueSum,
          notes: lang === "ar" ? "جميع مبيعات ومقبوضات الفواتير دون ضريبة" : "All sales minus tax elements"
        }, {
          param: lang === "ar" ? "الوعاء الزكوي التقديري (مكلفين غير منتظمين)" : "Estimated Zakat Base (Simplified Method)",
          amount: estimatedZakatBase,
          notes: lang === "ar" ? "يساوي صافي إيرادات مبيعات السنة" : "Equivalent to net sales in simplify rule"
        }, {
          param: lang === "ar" ? "نسبة الزكاة للتقويم الميلادي" : "Zakat Rate Adjusted for Gregorian Year",
          amount: 2.5778,
          notes: "%"
        }, {
          param: lang === "ar" ? "الزكاة السنوية المقدرة المستحقة" : "Estimated Annual Zakat Due",
          amount: zakatDue,
          notes: lang === "ar" ? "الوعاء مضروب في 2.5778% للتعويض عن الـ 11 يوماً الإضافية" : "Base * 2.5778% for Gregorian compliance"
        }];
        break;

      case "zakat_tax_payment_status":
        // Generates status log from simulated VAT Return & Zakat Payment tracking
        result = [
          { item: lang === "ar" ? "إقرار ضريبة القيمة المضافة - الربع الأول" : "VAT Declaration - Q1", status: lang === "ar" ? "مسدد ومكتمل" : "Settled", date: "2026-04-25", ref: "VAT-2026-Q1", amount: 12450 },
          { item: lang === "ar" ? "إقرار ضريبة القيمة المضافة - الربع الثاني" : "VAT Declaration - Q2", status: lang === "ar" ? "مسدد ومكتمل" : "Settled", date: "2026-07-28", ref: "VAT-2026-Q2", amount: 15120 },
          { item: lang === "ar" ? "إقرار ضريبة القيمة المضافة - الربع الثالث" : "VAT Declaration - Q3", status: lang === "ar" ? "مسدد ومكتمل" : "Settled", date: "2026-10-25", ref: "VAT-2026-Q3", amount: 18400 },
          { item: lang === "ar" ? "بيان الزكاة الشرعية السنوي المعتمد" : "Annual Zakat Payment", status: lang === "ar" ? "مسدد ومرحل" : "Settled", date: "2026-05-12", ref: "ZKT-2026-FY", amount: 42100 }
        ];
        break;

      // 6. CLIENTS & DEBTS
      case "client_statement":
        result = invoices.filter(inv => {
          if (filters.customerId !== "ALL" && inv.customerId !== filters.customerId) return false;
          if (!checkDateRange(inv.invoiceDate)) return false;
          return true;
        }).sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate)).map(inv => ({
          invoiceNo: inv.invoiceNo,
          invoiceDate: inv.invoiceDate,
          customerName: inv.customerName,
          taxableAmount: inv.taxableAmount || 0,
          vatTotal: inv.vatTotal || 0,
          grandTotal: inv.grandTotal || 0,
          amountPaid: inv.amountPaid || 0,
          remainingAmount: inv.remainingAmount || 0,
          status: inv.status
        }));
        break;

      case "debt_aging":
        // Age analysis for unpaid invoices
        const agingMap: Record<string, { client: string; m30: number; m60: number; m90: number; total: number }> = {};
        const todayMs = new Date().getTime();

        invoices.forEach(inv => {
          if (inv.status === "Paid" || inv.status === "Cancelled") return;
          if (!checkDateRange(inv.invoiceDate)) return;
          if (filters.customerId !== "ALL" && inv.customerId !== filters.customerId) return;

          const dueMs = new Date(inv.dueDate).getTime();
          const diffDays = Math.max(0, Math.floor((todayMs - dueMs) / (1000 * 60 * 60 * 24)));
          
          if (!agingMap[inv.customerId]) {
            agingMap[inv.customerId] = {
              client: inv.customerName || "عميل آجل",
              m30: 0,
              m60: 0,
              m90: 0,
              total: 0
            };
          }

          const entry = agingMap[inv.customerId];
          const unpaid = inv.remainingAmount || 0;
          entry.total += unpaid;

          if (diffDays <= 30) {
            entry.m30 += unpaid;
          } else if (diffDays <= 60) {
            entry.m60 += unpaid;
          } else {
            entry.m90 += unpaid;
          }
        });

        result = Object.values(agingMap).sort((a, b) => b.total - a.total).map(entry => ({
          customerName: entry.client,
          m30: entry.m30,
          m60: entry.m60,
          m90: entry.m90,
          grandTotal: entry.total
        }));
        break;

      case "highest_debt_clients":
        const topDebtors: Record<string, { name: string; outstanding: number; count: number }> = {};
        invoices.forEach(inv => {
          if (inv.status === "Paid" || inv.status === "Cancelled") return;
          if (!checkDateRange(inv.invoiceDate)) return;

          if (!topDebtors[inv.customerId]) {
            topDebtors[inv.customerId] = { name: inv.customerName, outstanding: 0, count: 0 };
          }
          topDebtors[inv.customerId].outstanding += inv.remainingAmount || 0;
          topDebtors[inv.customerId].count += 1;
        });
        result = Object.values(topDebtors).sort((a, b) => b.outstanding - a.outstanding).map(entry => ({
          customerName: entry.name,
          remainingAmount: entry.outstanding,
          count: entry.count
        }));
        break;

      case "collections_by_customer":
        const collMap: Record<string, { client: string; billed: number; collected: number; ratio: number }> = {};
        invoices.forEach(inv => {
          if (inv.status === "Cancelled") return;
          if (!checkDateRange(inv.invoiceDate)) return;

          if (!collMap[inv.customerId]) {
            collMap[inv.customerId] = { client: inv.customerName, billed: 0, collected: 0, ratio: 0 };
          }
          const entry = collMap[inv.customerId];
          entry.billed += inv.grandTotal || 0;
          entry.collected += inv.amountPaid || 0;
        });

        Object.keys(collMap).forEach(k => {
          const entry = collMap[k];
          entry.ratio = entry.billed > 0 ? (entry.collected / entry.billed) * 100 : 100;
        });

        result = Object.values(collMap).sort((a, b) => b.collected - a.collected).map(entry => ({
          customerName: entry.client,
          grandTotal: entry.billed,
          amountPaid: entry.collected,
          ratio: Number(entry.ratio.toFixed(2))
        }));
        break;

      // 7. SUPPLIERS & EXPENSES
      case "expenses_all":
        result = expenses.filter(exp => {
          if (!checkDateRange(exp.expenseDate)) return false;
          if (filters.bankBoxId !== "ALL" && exp.bankAccountId !== filters.bankBoxId && exp.cashBoxId !== filters.bankBoxId) return false;
          if (filters.projectName && !exp.projectName?.toLowerCase().includes(filters.projectName.toLowerCase())) return false;
          return true;
        }).sort((a, b) => b.expenseDate.localeCompare(a.expenseDate)).map(exp => ({
          expenseNo: exp.expenseNo,
          date: exp.expenseDate,
          category: exp.category,
          subtotal: exp.subtotal || 0,
          vatAmount: exp.vatAmount || 0,
          totalAmount: exp.totalAmount || 0,
          paymentMethod: exp.paymentMethod,
          projectName: exp.projectName || "-",
          createdBy: exp.createdBy || "-"
        }));
        break;

      case "suppliers_invoices_all":
        result = suppliers.filter(sup => {
          if (!checkDateRange(sup.invoiceDate)) return false;
          if (filters.projectName && !sup.projectName?.toLowerCase().includes(filters.projectName.toLowerCase())) return false;
          return true;
        }).sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate)).map(sup => ({
          invoiceNo: sup.invoiceNo,
          invoiceDate: sup.invoiceDate,
          supplierName: sup.supplierName,
          subtotal: sup.subtotal || 0,
          vatAmount: sup.vatAmount || 0,
          grandTotal: sup.totalAmount || 0,
          amountPaid: sup.amountPaid || 0,
          remainingAmount: sup.remainingAmount || 0,
          status: sup.status
        }));
        break;

      case "suppliers_payables":
        result = suppliers.filter(sup => {
          if (sup.status === "Paid") return false;
          if (!checkDateRange(sup.invoiceDate)) return false;
          return true;
        }).sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate)).map(sup => ({
          invoiceNo: sup.invoiceNo,
          invoiceDate: sup.invoiceDate,
          supplierName: sup.supplierName,
          subtotal: sup.subtotal || 0,
          vatAmount: sup.vatAmount || 0,
          grandTotal: sup.totalAmount || 0,
          amountPaid: sup.amountPaid || 0,
          remainingAmount: sup.remainingAmount || 0,
          status: sup.status
        }));
        break;

      case "expenses_by_category":
        const catMap: Record<string, { category: string; count: number; total: number }> = {};
        expenses.forEach(exp => {
          if (!checkDateRange(exp.expenseDate)) return;
          const cat = exp.category || "أخرى";
          if (!catMap[cat]) {
            catMap[cat] = { category: cat, count: 0, total: 0 };
          }
          catMap[cat].count += 1;
          catMap[cat].total += exp.totalAmount || 0;
        });
        result = Object.values(catMap).sort((a, b) => b.total - a.total).map(entry => ({
          category: entry.category,
          count: entry.count,
          totalAmount: entry.total
        }));
        break;

      default:
        result = [];
    }

    return result;
  };

  const filteredData = getFilteredData();

  const getDisplayableKeys = (item: any) => {
    if (!item) return [];
    const excludedKeys = ["id", "customerId", "bankAccountId", "cashBoxId", "items", "lines", "qrCode", "xmlString", "signatures", "history", "auditLogs", "logs"];
    return Object.keys(item).filter(key => {
      if (excludedKeys.includes(key)) return false;
      const val = item[key];
      if (val && typeof val === "object") return false;
      return true;
    });
  };

  // ---------------- EXCEL EXPORT (USING INJECTED XLSX LIBRARY) ----------------

  const triggerExportExcel = () => {
    if (!activeMeta) return;
    const reportTitle = lang === "ar" ? activeMeta.item.titleAr : activeMeta.item.titleEn;
    
    // Convert current filtered data table items to structured worksheet format
    const worksheetData = filteredData.map((row, index) => {
      // Map rows based on report types for robust clean spreadsheet output
      const cleanRow: Record<string, any> = { "#": index + 1 };
      
      getDisplayableKeys(row).forEach(key => {
        const columnHeader = lang === "ar" ? getArabicColumnHeader(key) : key;
        cleanRow[columnHeader] = row[key];
      });
      return cleanRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report Data");
    
    // Save to file
    XLSX.writeFile(workbook, `${reportTitle}_${selectedYearOrDate()}.xlsx`);
  };

  const selectedYearOrDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Helper translations for spreadsheet headers
  const getArabicColumnHeader = (key: string): string => {
    const map: Record<string, string> = {
      invoiceNo: "رقم الفاتورة",
      invoiceDate: "تاريخ الفاتورة",
      dueDate: "تاريخ الاستحقاق",
      customerName: "اسم العميل",
      customer: "اسم العميل",
      projectName: "اسم المشروع",
      project: "المشروع",
      salesperson: "المندوب/الموظف",
      invoiceType: "نوع الفاتورة",
      type: "نوع المستند",
      status: "حالة الفاتورة/المستند",
      taxableAmount: "المبلغ الخاضع للضريبة",
      vatTotal: "ضريبة القيمة المضافة",
      vatAmount: "مبلغ الضريبة",
      grandTotal: "الإجمالي النهائي شامل الضريبة",
      totalAmount: "المبلغ الإجمالي",
      amountPaid: "المبلغ المدفوع",
      remainingAmount: "المبلغ المتبقي المعلق",
      moneyIn: "مقبوضات واردة (+)",
      moneyOut: "مدفوعات خارجة (-)",
      opening: "الرصيد الافتتاحي",
      current: "الرصيد الحالي",
      closing: "الرصيد الختامي",
      count: "عدد العمليات",
      subtotal: "الصافي قبل الضريبة",
      total: "المجموع الكلي المالي",
      rate: "النسبة الضريبية",
      direction: "حركة العمليات",
      amount: "المبلغ",
      newBalance: "الرصيد الجديد",
      description: "الشرح والبيان التفصيلي",
      createdAt: "تاريخ وتوقيت العملية",
      category: "تصنيف الحركة",
      supplierName: "اسم المورد",
      billed: "المطالبات الصادرة",
      collected: "التحصيلات النقدية",
      ratio: "كفاءة ونسبة التحصيل (%)",
      outstanding: "المديونية المتبقية",
      journalNo: "رقم القيد اليومي",
      journalEntryNo: "رقم القيد",
      debit: "المدين (Debit)",
      credit: "الدائن (Credit)",
      accountName: "اسم الحساب المالي",
      accountType: "تصنيف الحساب",
      param: "بند الوعاء الزكوي",
      notes: "إيضاحات شرعية ومحاسبية",
      item: "نوع الالتزام الدوري",
      date: "التاريخ",
      ref: "رقم المرجع المالي"
    };
    return map[key] || key;
  };

  // ---------------- PRINT REPORT WITH CORPORATE A4 HEADER/FOOTER (FONOUN ALWALEED BRANDED) ----------------

  const triggerPrintReport = () => {
    if (!activeMeta) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const reportTitle = lang === "ar" ? activeMeta.item.titleAr : activeMeta.item.titleEn;
    const todayStr = new Date().toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    // Dynamically build clean table headers and rows for printing
    const tableHeaders = filteredData.length > 0 ? getDisplayableKeys(filteredData[0]) : [];
    
    const headerHtml = tableHeaders.map(h => `<th style="padding: 6px 8px; border: 1px solid #cbd5e1; font-size: 9px; background-color: #f1f5f9; text-align: right;">${getArabicColumnHeader(h)}</th>`).join("");
    
    const rowsHtml = filteredData.map((row, idx) => {
      const tdHtml = tableHeaders.map(h => {
        const val = row[h];
        const isNumeric = typeof val === "number";
        const displayVal = isNumeric ? val.toLocaleString("en-US", { minimumFractionDigits: 2 }) : (val || "-");
        return `<td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-size: 8px; font-family: ${isNumeric ? "monospace" : "sans-serif"}; text-align: ${isNumeric ? "left" : "right"};">${displayVal}</td>`;
      }).join("");
      return `<tr style="background-color: ${idx % 2 === 0 ? "#ffffff" : "#f8fafc"};">${tdHtml}</tr>`;
    }).join("");

    // Summaries or stats if available
    let totalExclTax = 0;
    let totalTax = 0;
    let totalInclTax = 0;

    filteredData.forEach(row => {
      totalExclTax += row.taxableAmount || row.subtotal || row.moneyIn || 0;
      totalTax += row.vatTotal || row.vatAmount || 0;
      totalInclTax += row.grandTotal || row.totalAmount || row.total || row.amount || 0;
    });

    const isZakatEstimator = activeReportId === "zakat_estimation";

    const summarySection = !isZakatEstimator && filteredData.length > 0 ? `
      <div style="margin-top: 16px; display: flex; justify-content: flex-end; font-size: 9px;">
        <table style="width: 300px; border: 1px solid #cbd5e1; border-collapse: collapse;">
          <tbody>
            <tr>
              <td style="padding: 6px; font-weight: bold; background-color: #f8fafc;">إجمالي الصافي (ريال):</td>
              <td style="padding: 6px; text-align: left; font-family: monospace; font-weight: bold;">${totalExclTax.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
            </tr>
            ${totalTax > 0 ? `
            <tr>
              <td style="padding: 6px; font-weight: bold; background-color: #f8fafc;">إجمالي الضريبة (15%):</td>
              <td style="padding: 6px; text-align: left; font-family: monospace; font-weight: bold;">${totalTax.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
            </tr>
            ` : ""}
            <tr style="background-color: #f0fdf4;">
              <td style="padding: 6px; font-weight: bold; color: #166534;">المجموع الكلي المالي:</td>
              <td style="padding: 6px; text-align: left; font-family: monospace; font-weight: bold; color: #166534;">${totalInclTax.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
      </div>
    ` : "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <title>${reportTitle}</title>
        <meta charset="utf-8" />
        <style>
          ${sharedPrintStyles}
          @media print {
            body { 
              padding: 0 !important; 
              margin: 0 !important; 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
            .page-container {
              width: 210mm;
              height: 297mm;
              padding: 10mm 15mm !important;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              page-break-after: avoid;
              page-break-inside: avoid;
            }
          }
          body {
            background-color: #f3f4f6;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
          }
          .page-container {
            background-color: #ffffff;
            width: 210mm;
            height: 297mm;
            padding: 12mm 15mm;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 6px;
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <!-- Shared Header of Fonoun AlWaleed -->
          <div>
            ${sharedPrintHeader}
            
            <div style="text-align: center; margin-bottom: 14px;">
              <h2 style="font-size: 16px; font-weight: 900; color: #0072BC; margin: 0 0 4px 0;">${reportTitle}</h2>
              <p style="font-size: 9px; color: #64748b; margin: 0;">تاريخ التوليد: ${todayStr} | الرقم المرجعي: REP-${selectedYearOrDate()}</p>
            </div>

            <!-- Table of contents -->
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr>${headerHtml}</tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            ${summarySection}
          </div>

          <!-- Shared Footer of Fonoun AlWaleed -->
          <div style="margin-top: auto; padding-top: 10px;">
            ${sharedPrintFooter}
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 800);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ---------------- EXPORT TO PDF via browser print ----------------
  const triggerExportPdf = () => {
    // Elegant trigger print works directly as the safest PDF driver in standard browser sandbox (Save as PDF)
    triggerPrintReport();
  };

  // ---------------- STATISTICS SUMMARY FOR TOP CARDS ----------------

  const getSummaryCards = () => {
    let card1 = { label: lang === "ar" ? "إجمالي المبلغ" : "Total Gross", val: 0, color: "text-blue-600 bg-blue-50/50" };
    let card2 = { label: lang === "ar" ? "إجمالي الضريبة" : "Total VAT", val: 0, color: "text-amber-600 bg-amber-50/50" };
    let card3 = { label: lang === "ar" ? "المجموع الكلي" : "Grand Total", val: 0, color: "text-emerald-600 bg-emerald-50/50" };

    if (activeCategory === "sales_invoices") {
      let sub = 0, vat = 0, tot = 0;
      filteredData.forEach(inv => {
        sub += inv.taxableAmount || 0;
        vat += inv.vatTotal || 0;
        tot += inv.grandTotal || 0;
      });
      card1 = { label: lang === "ar" ? "المبيعات قبل الضريبة" : "Sales Excl. VAT", val: sub, color: "text-blue-600 bg-blue-50/50" };
      card2 = { label: lang === "ar" ? "ضريبة المخرجات المستحقة" : "VAT Output Due", val: vat, color: "text-amber-600 bg-amber-50/50" };
      card3 = { label: lang === "ar" ? "إجمالي المبيعات شامل الضريبة" : "Gross Sales Volume", val: tot, color: "text-emerald-600 bg-emerald-50/50" };
    } else if (activeCategory === "revenues") {
      let sub = 0, vat = 0, tot = 0;
      revenues.forEach(rev => {
        sub += rev.taxableAmount || 0;
        vat += rev.vatAmount || 0;
        tot += rev.totalAmount || 0;
      });
      card1 = { label: lang === "ar" ? "المقبوضات الصافية" : "Net Revenues", val: sub, color: "text-emerald-600 bg-emerald-50/50" };
      card2 = { label: lang === "ar" ? "مجموع ضريبة المقبوضات" : "VAT Collected", val: vat, color: "text-amber-600 bg-amber-50/50" };
      card3 = { label: lang === "ar" ? "إجمالي المقبوضات شامل الضريبة" : "Gross Inflow", val: tot, color: "text-blue-600 bg-blue-50/50" };
    } else if (activeCategory === "cash_bank") {
      let pin = 0, pout = 0;
      transactions.forEach(tx => {
        if (tx.direction === "In") pin += tx.amount || 0;
        else pout += tx.amount || 0;
      });
      card1 = { label: lang === "ar" ? "إجمالي السيولة المقبوضة (+)" : "Total Collections In", val: pin, color: "text-emerald-600 bg-emerald-50/50" };
      card2 = { label: lang === "ar" ? "إجمالي المدفوعات التشغيلية (-)" : "Total Payouts Out", val: pout, color: "text-red-600 bg-red-50/50" };
      card3 = { label: lang === "ar" ? "صافي التدفق النقدي للفترة" : "Net Inflow Period", val: pin - pout, color: "text-indigo-600 bg-indigo-50/50" };
    } else if (activeCategory === "journal") {
      let d = 0, c = 0;
      journals.forEach(j => { d += j.totalDebit || 0; c += j.totalCredit || 0; });
      card1 = { label: lang === "ar" ? "إجمالي الحركات المدينة" : "Total Debits", val: d, color: "text-blue-600 bg-blue-50/50" };
      card2 = { label: lang === "ar" ? "إجمالي الحركات الدائنة" : "Total Credits", val: c, color: "text-indigo-600 bg-indigo-50/50" };
      card3 = { label: lang === "ar" ? "فرق التوازن المحاسبي" : "Audit Discrepancy", val: Math.abs(d - c), color: "text-emerald-600 bg-emerald-50/50" };
    } else if (activeCategory === "tax_zakat") {
      let outV = 0, inV = 0;
      invoices.forEach(i => outV += i.vatTotal || 0);
      suppliers.forEach(s => inV += s.vatAmount || 0);
      expenses.forEach(e => inV += e.vatAmount || 0);
      card1 = { label: lang === "ar" ? "ضريبة المبيعات المحصلة (مخرجات)" : "Output VAT Collected", val: outV, color: "text-amber-600 bg-amber-50/50" };
      card2 = { label: lang === "ar" ? "ضريبة المشتريات المدفوعة (مدخلات)" : "Input VAT Recoverable", val: inV, color: "text-blue-600 bg-blue-50/50" };
      card3 = { label: lang === "ar" ? "صافي الالتزام الضريبي المستحق" : "Net VAT Liability Due", val: outV - inV, color: "text-red-600 bg-red-50/50" };
    } else if (activeCategory === "clients_debts") {
      let billing = 0, collected = 0;
      invoices.forEach(i => { billing += i.grandTotal || 0; collected += i.amountPaid || 0; });
      card1 = { label: lang === "ar" ? "إجمالي الذمم المدينة (المبيعات)" : "Total Customer Billing", val: billing, color: "text-indigo-600 bg-indigo-50/50" };
      card2 = { label: lang === "ar" ? "إجمالي المقبوضات النقدية" : "Cash Collected", val: collected, color: "text-emerald-600 bg-emerald-50/50" };
      card3 = { label: lang === "ar" ? "الديون المتأخرة المستحقة حالياً" : "Outstanding Debt Receivable", val: billing - collected, color: "text-rose-600 bg-rose-50/50" };
    } else if (activeCategory === "suppliers_expenses") {
      let expTot = 0, supTot = 0;
      expenses.forEach(e => expTot += e.totalAmount || 0);
      suppliers.forEach(s => supTot += s.totalAmount || 0);
      card1 = { label: lang === "ar" ? "إجمالي المصاريف التشغيلية" : "Operating Expenses", val: expTot, color: "text-orange-600 bg-orange-50/50" };
      card2 = { label: lang === "ar" ? "مشتريات فواتير الموردين" : "Supplier Purchases", val: supTot, color: "text-indigo-600 bg-indigo-50/50" };
      card3 = { label: lang === "ar" ? "مجمل التدفقات الصادرة للفترة" : "Combined Expenses Outflow", val: expTot + supTot, color: "text-red-600 bg-red-50/50" };
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-xs ${card1.color}`}>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{card1.label}</span>
            <span className="text-lg font-black font-mono block mt-1">{card1.val.toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-[10px] font-sans font-normal">ريال</span></span>
          </div>
          <span className="text-xl">💰</span>
        </div>
        <div className={`p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-xs ${card2.color}`}>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{card2.label}</span>
            <span className="text-lg font-black font-mono block mt-1">{card2.val.toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-[10px] font-sans font-normal">ريال</span></span>
          </div>
          <span className="text-xl">⚖️</span>
        </div>
        <div className={`p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-xs ${card3.color}`}>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{card3.label}</span>
            <span className="text-lg font-black font-mono block mt-1">{card3.val.toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-[10px] font-sans font-normal">ريال</span></span>
          </div>
          <span className="text-xl">📊</span>
        </div>
      </div>
    );
  };

  // Render Simple Chart for visual polish
  const renderVisualChart = () => {
    // Generate data suited for chart rendering based on current report
    let chartData: any[] = [];
    let barColor = "#0072BC";
    let dataKey = "total";
    let xKey = "name";

    if (activeReportId === "sales_by_customer" || activeReportId === "revenues_by_customer") {
      chartData = filteredData.slice(0, 5); // top 5 customers
      xKey = "name";
      dataKey = "total";
      barColor = "#0284c7";
    } else if (activeReportId === "sales_by_month" || activeReportId === "revenues_by_month") {
      chartData = filteredData;
      xKey = "month";
      dataKey = "total";
      barColor = "#6366f1";
    } else if (activeReportId === "expenses_by_category") {
      chartData = filteredData;
      xKey = "category";
      dataKey = "total";
      barColor = "#f97316";
    } else if (activeReportId === "current_balances") {
      chartData = filteredData;
      xKey = "name";
      dataKey = "current";
      barColor = "#8b5cf6";
    } else {
      return null;
    }

    if (chartData.length === 0) return null;

    return (
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs mb-6">
        <h4 className="text-xs font-black text-slate-700 mb-4 flex items-center gap-1">
          <span>📈</span> {lang === "ar" ? "رسم بياني توضيحي وتوزيع النسب" : "Visual Analytical Breakdown & Share Chart"}
        </h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey={xKey} tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => [`${Number(value).toLocaleString("en-US")} ريال`, ""]} contentStyle={{ borderRadius: "12px", border: "1px solid #f1f5f9", fontSize: 10 }} />
              <Bar dataKey={dataKey} fill={barColor} radius={[6, 6, 0, 0]} barSize={36}>
                {chartData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <RefreshCw className="h-10 w-10 text-blue-600 animate-spin" />
        <p className="text-xs font-bold text-slate-400">
          {lang === "ar" ? "جاري تهيئة وتوليد قاعدة بيانات التقارير المالية..." : "Compiling live analytical databases..."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="accounting-reports-dashboard">
      
      {/* Introduction Heading */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-xs">
        <div className="relative z-10">
          <span className="bg-blue-500/20 text-blue-300 text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full border border-blue-400/20">
            {lang === "ar" ? "لوحة التقارير الحسابية المعتمدة" : "OFFICIAL AUDITED REPORTS CENTER"}
          </span>
          <h2 className="text-xl md:text-2xl font-black mt-3 leading-tight">
            {lang === "ar" ? "📈 مركز التقارير المحاسبية والقوائم التحليلية" : "📈 Certified Accounting & Liquidity Statements"}
          </h2>
          <p className="text-slate-300/90 text-xs mt-1.5 max-w-2xl leading-relaxed">
            {lang === "ar" 
              ? "مجموعة الأدوات التحليلية لاستخراج كافة البيانات الضريبية، مبيعات فواتير العملاء، حركة البنوك التفصيلية، وأعمار الديون المتأخرة مع خيار الطباعة والتصدير الفوري الموثق."
              : "Generate fully-compliant VAT Return declarations, bank statement ledgers, overdue AR collections, and detailed expense allocations."}
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-1/4 translate-x-1/4">
          <Activity className="w-96 h-96" />
        </div>
      </div>

      {/* Main Grid: Left Side Sidebar Menu, Right Side Filter & Table (RTL Compatible) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar categories (1 Column) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <span>📋</span> {lang === "ar" ? "قوائم التقارير المحاسبية" : "Account Ledger Folders"}
            </h3>

            {Object.keys(categories).map((catKey) => {
              const cat = categories[catKey as ReportCategory];
              const isCatActive = activeCategory === catKey;
              const IconComp = cat.icon;

              return (
                <div key={catKey} className="space-y-1">
                  <button
                    onClick={() => {
                      setActiveCategory(catKey as ReportCategory);
                      setActiveReportId(cat.items[0].id);
                    }}
                    className={`w-full flex items-center justify-between text-right p-2.5 rounded-xl text-xs font-black transition-all ${
                      isCatActive 
                        ? "bg-slate-900 text-white" 
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <IconComp className="h-4 w-4" />
                      <span>{lang === "ar" ? cat.titleAr : cat.titleEn}</span>
                    </div>
                    <ChevronDown className={`h-3 w-3 transition-transform ${isCatActive ? "rotate-180" : ""}`} />
                  </button>

                  {/* Nested Report Sub-items */}
                  {isCatActive && (
                    <div className="mr-3 pr-2 border-r border-slate-200 space-y-1 mt-1 transition-all">
                      {cat.items.map((item) => {
                        const isItemActive = activeReportId === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setActiveReportId(item.id)}
                            className={`w-full text-right block p-2 rounded-lg text-[11px] transition-all ${
                              isItemActive
                                ? "bg-blue-50 text-blue-800 font-bold border-l-2 border-blue-600"
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                            }`}
                          >
                            <span>{lang === "ar" ? item.titleAr : item.titleEn}</span>
                            <span className="block text-[8.5px] opacity-85 font-normal truncate">
                              {lang === "ar" ? item.descriptionAr : item.descriptionEn}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters Panel and Data Results Table (3 Columns) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Active Report Header with Printable/Export Actions */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">📈</span>
                <h3 className="text-sm font-black text-slate-800">
                  {lang === "ar" ? activeMeta?.item.titleAr : activeMeta?.item.titleEn}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {lang === "ar" ? activeMeta?.item.descriptionAr : activeMeta?.item.descriptionEn}
              </p>
            </div>

            {/* Standard Trigger Action Buttons */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button
                onClick={loadDatabase}
                className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-black px-3 py-2 rounded-xl border border-slate-200 flex items-center gap-1 transition-all"
                title={lang === "ar" ? "تحديث قواعد البيانات" : "Refresh Databases"}
              >
                <RefreshCw className="h-3 w-3" />
                <span>{lang === "ar" ? "تحديث" : "Refresh"}</span>
              </button>

              <button
                onClick={triggerPrintReport}
                className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1 transition-all"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>{lang === "ar" ? "طباعة" : "Print"}</span>
              </button>

              <button
                onClick={triggerExportPdf}
                className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-black px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1 transition-all"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>{lang === "ar" ? "تصدير PDF" : "Export PDF"}</span>
              </button>

              <button
                onClick={triggerExportExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1 transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{lang === "ar" ? "تصدير Excel" : "Export Excel"}</span>
              </button>
            </div>
          </div>

          {/* Filtering Control Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <h4 className="text-xs font-black text-slate-700 flex items-center gap-1">
              <ListFilter className="h-4 w-4 text-blue-600" />
              <span>{lang === "ar" ? "تصفية وفلاتر التقارير" : "Interactive Filter Constraints"}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
              
              {/* Date From */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  {lang === "ar" ? "من تاريخ" : "From Date"}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Date To */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  {lang === "ar" ? "إلى تاريخ" : "To Date"}
                </label>
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:border-blue-500 font-mono"
                />
              </div>

              {/* Customer Select */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  {lang === "ar" ? "العميل" : "Customer Client"}
                </label>
                <select
                  value={filters.customerId}
                  onChange={(e) => setFilters({ ...filters, customerId: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white focus:outline-hidden focus:border-blue-500"
                >
                  <option value="ALL">{lang === "ar" ? "جميع العملاء" : "All Customers"}</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Bank Account / Cash Box Select */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  {lang === "ar" ? "البنك / الصندوق" : "Bank / Cash Register"}
                </label>
                <select
                  value={filters.bankBoxId}
                  onChange={(e) => setFilters({ ...filters, bankBoxId: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white focus:outline-hidden focus:border-blue-500"
                >
                  <option value="ALL">{lang === "ar" ? "جميع الحسابات والصناديق" : "All Banks & Cash registers"}</option>
                  {banks.map(b => (
                    <option key={b.id} value={b.id}>{b.bankName}</option>
                  ))}
                  {boxes.map(bx => (
                    <option key={bx.id} value={bx.id}>{bx.cashBoxName}</option>
                  ))}
                </select>
              </div>

              {/* Status Select */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  {lang === "ar" ? "الحالة" : "Document Status"}
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white focus:outline-hidden focus:border-blue-500"
                >
                  <option value="ALL">{lang === "ar" ? "جميع الحالات" : "All Status"}</option>
                  <option value="Paid">{lang === "ar" ? "مدفوع / محصل" : "Paid"}</option>
                  <option value="Issued">{lang === "ar" ? "صادر ولم يدفع" : "Issued / Unpaid"}</option>
                  <option value="Draft">{lang === "ar" ? "مسودة" : "Draft"}</option>
                  <option value="Cancelled">{lang === "ar" ? "ملغى" : "Cancelled"}</option>
                  <option value="Approved">{lang === "ar" ? "معتمد ومرحل" : "Approved / Posted"}</option>
                </select>
              </div>

              {/* Invoice Type Select */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  {lang === "ar" ? "نوع الفاتورة" : "Invoice Classification"}
                </label>
                <select
                  value={filters.invoiceType}
                  onChange={(e) => setFilters({ ...filters, invoiceType: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white focus:outline-hidden focus:border-blue-500"
                >
                  <option value="ALL">{lang === "ar" ? "جميع الأنواع" : "All Classifications"}</option>
                  <option value="Tax Invoice">{lang === "ar" ? "فاتورة ضريبية شركات" : "Standard Tax Invoice"}</option>
                  <option value="Simplified Tax Invoice">{lang === "ar" ? "فاتورة ضريبية مبسطة" : "Simplified Tax Invoice"}</option>
                </select>
              </div>

              {/* Project Search */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  {lang === "ar" ? "المشروع" : "Project Association"}
                </label>
                <input
                  type="text"
                  placeholder={lang === "ar" ? "بحث عن مشروع..." : "Search Project name..."}
                  value={filters.projectName}
                  onChange={(e) => setFilters({ ...filters, projectName: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Reset Filter Button */}
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black py-2.5 rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>{lang === "ar" ? "إعادة تعيين الفلاتر" : "Reset Constraints"}</span>
                </button>
              </div>

            </div>
          </div>

          {/* Aggregated Top KPIs cards */}
          {getSummaryCards()}

          {/* Analytical Chart block */}
          {renderVisualChart()}

          {/* Data Output Results Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                {lang === "ar" 
                  ? `نتائج البحث المتوافقة (${filteredData.length} سجل)` 
                  : `Retrieved results (${filteredData.length} records)`}
              </span>
            </div>

            {filteredData.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <span className="text-3xl">📭</span>
                <p className="text-xs font-bold text-slate-400">
                  {lang === "ar" 
                    ? "لا توجد حركات أو بيانات مالية متوافقة مع الفلاتر المحددة حالياً." 
                    : "No matching financial records found for active filter constraints."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 uppercase text-[9px] font-bold">
                      <th className="p-3.5 border-b border-slate-100 w-10 text-center">#</th>
                      {getDisplayableKeys(filteredData[0]).map((key) => (
                        <th key={key} className="p-3.5 border-b border-slate-100">
                          {lang === "ar" ? getArabicColumnHeader(key) : key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredData.map((row, index) => (
                      <tr key={row.id || index} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3.5 text-center text-slate-400 font-mono font-medium">{index + 1}</td>
                        {getDisplayableKeys(row).map((key) => {
                          const val = row[key];
                          const isNumber = typeof val === "number";

                          return (
                            <td 
                              key={key} 
                              className={`p-3.5 font-medium ${
                                isNumber ? "font-mono text-slate-800 text-left" : "text-slate-600"
                              }`}
                            >
                              {isNumber ? (
                                key.toLowerCase().includes("ratio") ? `${val.toFixed(2)}%` : `${val.toLocaleString("en-US", { minimumFractionDigits: 2 })} ريال`
                              ) : (
                                key === "status" ? (
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    val === "Paid" || val === "Approved" || val === "مسدد ومكتمل" || val === "نشط"
                                      ? "bg-emerald-100 text-emerald-800" 
                                      : val === "Issued" || val === "Draft" || val === "تحت الإجراء"
                                        ? "bg-amber-100 text-amber-800" 
                                        : "bg-red-100 text-red-800"
                                  }`}>
                                    {val}
                                  </span>
                                ) : (
                                  val || "-"
                                )
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
