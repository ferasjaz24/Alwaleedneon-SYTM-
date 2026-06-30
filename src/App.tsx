/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { hasPermission, canAccessModule, getAccessLevel, hasAdvancedPermission, canShowSubmenu } from './lib/permissions';
import {
  Shield,
  ShieldCheck,
  Users,
  FileText,
  Box,
  TrendingUp,
  DollarSign,
  UserPlus,
  Trash2,
  Filter,
  Printer,
  PlusCircle,
  FileCode,
  Search,
  Lightbulb,
  MapPin,
  BadgeAlert,
  Briefcase,
  Layers,
  Sparkles,
  ArrowRight,
  Globe,
  Settings,
  Lock,
  Database,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Accessibility,
} from "lucide-react";
import { Employee, User, Quotation, RecruitmentTemplate } from "./types";
import HrSubSections from "./components/HrSubSections";
import SalesHub from "./components/SalesHub";
import SalesQuotations from "./components/SalesQuotations";
import FinancialCollections from "./components/FinancialCollections";
import SalesProductionRequests from "./components/SalesProductionRequests";
import AIAssistant from "./components/AIAssistant";
import { sharedPrintHeader, sharedPrintFooter, sharedPrintStyles } from './utils/PrintShared';
import SalesLetters from "./components/SalesLetters";
import SalesRepsTargets from "./components/SalesRepsTargets";
import SalesReports from "./components/SalesReports";
import SalesDashboard from "./components/SalesDashboard";
import ProjectPricingStudy from "./components/sales/ProjectPricingStudy";
import ProductionHub from "./components/ProductionHub";
import InstantDocumentsHub from "./components/hr/InstantDocumentsHub";
import ItemsWarehouse from "./components/ItemsWarehouse";
import MaterialsWarehouse from "./components/MaterialsWarehouse";
import ProcurementDashboard from "./components/procurement/ProcurementDashboard";
import ProcurementRequests from "./components/ProcurementRequests";
import SuppliersPricing from "./components/SuppliersPricing";
import FinanceApprovals from "./components/FinanceApprovals";
import AdvancedPermissionsPortal from "./components/AdvancedPermissionsPortal";
import AISettingsModal from "./components/AISettingsModal";
import MainDashboard from "./components/MainDashboard";
import JournalEntries from "./components/finance/JournalEntries";
import RevenuesExpenses from "./components/finance/RevenuesExpenses";
import CustomerSupplierInvoices from "./components/finance/CustomerSupplierInvoices";

export const hrSubmenus = [
  { id: "dashboard", ar: "📊 لوحة القيادة والمؤشرات", en: "📊 HR Dashboard" },
  {
    id: "ess_dashboard",
    ar: "👤 الخدمة الذاتية والاستعلامات",
    en: "👤 Self-Service & Claims",
  },
  { id: "employees_all", ar: "👥 بيانات الموظفين", en: "👥 Employee Data" },
  { id: "document_tracking", ar: "📄 الوثائق الحكومية والتراخيص", en: "📄 Gov & Corporate Docs" },
  {
    id: "leaves_tracker",
    ar: "🌴 طلبات وأرصدة الإجازات",
    en: "🌴 Leaves & Balances",
  },
  {
    id: "payroll_main",
    ar: "💵 مسير الرواتب والمكافآت",
    en: "💵 Payroll Overview",
  },
  {
    id: "recruitment",
    ar: "🧠 استقطاب الكفاءات بالذكاء",
    en: "🧠 AI Recruitment Hub",
  },
  {
    id: "documents",
    ar: "🖨️ مستندات الخطابات الفورية",
    en: "🖨️ Instant Document Hub",
  },
];

export const salesSubmenus = [
  {
    id: "sales_dashboard",
    ar: "📊 لوحة القيادة والمؤشرات",
    en: "📊 Sales Dashboard",
  },
  { id: "sales_crm", ar: "👥 العملاء", en: "👥 Clients" },
  { id: "sales_quotations", ar: "📄 عروض الأسعار", en: "📄 Quotations" },
  {
    id: "sales_collections",
    ar: "💰 قسم التحصيل المالي",
    en: "💰 Financial Collections",
  },
  {
    id: "sales_production_requests",
    ar: "🚀 طلبات الإنتاج المرسلة",
    en: "🚀 Sent Production Requests",
  },
  { id: "sales_letters", ar: "📝 خطابات المبيعات", en: "📝 Sales Letters" },
  { id: "sales_reports", ar: "📈 التقارير", en: "📈 Reports" },
  {
    id: "sales_reps_targets",
    ar: "🎯 المندوبين والأهداف",
    en: "🎯 Sales Reps & Targets",
  },
  {
    id: "sales_pricing_study",
    ar: "📊 دراسة تسعير المشاريع",
    en: "📊 Project Pricing Study",
  },
];

export const productionSubmenus = [
  {
    id: "prod_dashboard",
    ar: "📊 لوحة قيادة الإنتاج",
    en: "Production Dashboard",
  },
  {
    id: "prod_daily_followup",
    ar: "📋 متابعة الإنتاج اليومية",
    en: "Daily Production Follow-up",
  },
  {
    id: "prod_inbound",
    ar: "📥 طلبات الإنتاج المستلمة",
    en: "Inbound Production Requests",
  },
  { id: "prod_orders", ar: "📋 أوامر الإنتاج", en: "Production Orders" },
  {
    id: "prod_active_projects",
    ar: "🏗️ مشاريع الإنتاج القائمة",
    en: "Active Production Projects",
  },
  {
    id: "prod_installation",
    ar: "🚚 قسم التركيب",
    en: "Installation Department",
  },
];

export const financeSubmenus = [
  {
    id: "finance_journal",
    ar: "📒 القيود اليومية",
    en: "📒 Journal Entries"
  },
  {
    id: "finance_revenues_expenses",
    ar: "💰 الإيرادات والمصروفات",
    en: "💰 Revenues & Expenses"
  },
  {
    id: "finance_customer_supplier_invoices",
    ar: "🧾 فواتير العملاء والموردين",
    en: "🧾 Customer & Supplier Invoices"
  }
];

export default function App() {
  // Locale state
  const [lang, setLang] = useState<"ar" | "en">("ar");
  
  // Accessibility state
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [fontSize, setFontSize] = useState<"ss" | "s" | "m" | "l" | "xl">("m");
  const [isAccessibilityMenuOpen, setIsAccessibilityMenuOpen] = useState(false);
  
  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Super Admin backdoor (F24) state
  const [showF24Modal, setShowF24Modal] = useState(false);
  const [f24ClickCount, setF24ClickCount] = useState(0);
  const [f24User, setF24User] = useState("");
  const [f24Pass, setF24Pass] = useState("");
  const [f24Error, setF24Error] = useState("");

  // DB States (synchronized with server API)
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [logPage, setLogPage] = useState(1);
  const [logPerPage, setLogPerPage] = useState(5);
  const [loading, setLoading] = useState(true);

  // Active module tab
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "hr"
    | "sales"
    | "recruitment"
    | "documents"
    | "production"
    | "warehouse"
    | "finance"
  >("dashboard");

  // Active HR Sub-Tabs and collapsible states
  const [activeHrSubTab, setActiveHrSubTab] = useState("employees_all");
  const [isHrDropdownOpen, setIsHrDropdownOpen] = useState(false);

  // Active Sales Sub-Tabs and collapsible states
  const [activeSalesSubTab, setActiveSalesSubTab] = useState("sales_dashboard");
  const [isSalesDropdownOpen, setIsSalesDropdownOpen] = useState(false);

  // Active Production Sub-Tabs and collapsible states
  const [activeProductionSubTab, setActiveProductionSubTab] =
    useState("prod_dashboard");
  const [isProductionDropdownOpen, setIsProductionDropdownOpen] =
    useState(false);

  // Active Warehouse Sub-Tabs and collapsible states
  const [activeWarehouseSubTab, setActiveWarehouseSubTab] =
    useState("warehouse_dashboard");
  const [isWarehouseDropdownOpen, setIsWarehouseDropdownOpen] = useState(false);

  // Active Finance Sub-Tabs and collapsible states
  const [activeFinanceSubTab, setActiveFinanceSubTab] = useState("finance_journal");
  const [isFinanceDropdownOpen, setIsFinanceDropdownOpen] = useState(false);

  // Directory Filters

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [expiryFilter, setExpiryFilter] = useState("all"); // all, near_expiry (<= 1 year), ok
  const [custodyFilter, setCustodyFilter] = useState("all"); // all, laptop, tools, vehicle

  // Employee CRUD edit state
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [showEmpForm, setShowEmpForm] = useState(false);

  // New employee state
  const [newEmp, setNewEmp] = useState<Partial<Employee>>({
    arabicName: "",
    englishName: "",
    iqamaId: "",
    passportDetails: "",
    jobTitle: "Senior Signage Technician",
    grade: "Grade 3",
    basicSalary: 6000,
    allowances: { housing: 1500, transport: 800, phone: 0 },
    homeAddress: "",
    custody: { laptop: "", tools: "", vehicles: "", other: "" },
    birthDate: "1995-01-01",
    dateOfJoining: "2024-01-01",
    contractExpiry: "2027-01-01",
    iqamaExpiryDate: "2027-01-01",
    passportExpiryDate: "2029-01-01",
    department: "Neon Fabrication",
  });

  // Quotation state
  const [selectedQuo, setSelectedQuo] = useState<Quotation | null>(null);
  const [showQuoForm, setShowQuoForm] = useState(false);
  const [newQuo, setNewQuo] = useState<Partial<Quotation>>({
    clientName: "",
    projectTitle: "",
    stage: "New Lead",
    neonMeters: 50,
    installationFees: 2500,
    vatRate: 0.15,
    items: [
      {
        id: "1",
        description: "Acrylic Glowing Flex Elements",
        quantity: 1,
        unitPrice: 4500,
      },
    ],
  });

  // Quick user creation (F24 portal)
  const [newAdminUser, setNewAdminUser] = useState<{
    username: string;
    password: string;
    jobTitle: string;
    role?: string;
    empId?: string;
  }>({ username: "", password: "", jobTitle: "HR Assistant" });
  const [userCreationError, setUserCreationError] = useState("");
  const [userCreationSuccess, setUserCreationSuccess] = useState("");
  const [showAISettings, setShowAISettings] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] =
    useState<User | null>(null);

  const isCurrentTabAccessible = (): boolean => {
    if (!user) return false;
    
    // Everyone has access to the main dashboard
    if (activeTab === "dashboard") return true;

    const username = user.username?.toLowerCase() || '';
    const roleName = user.role?.toLowerCase() || '';
    const isSuperAdmin = username === 'feras' || username === 'admin' || roleName === 'super admin' || roleName === 'general admin director' || roleName.includes('الادارة العليا') || roleName === 'senior management';

    if (activeTab === "super_admin" as any) {
      return isSuperAdmin;
    }

    // 1. HR module
    if (activeTab === "hr") {
      if (!canAccessModule(user, "hr")) return false;
      if (activeHrSubTab) {
        return canShowSubmenu(user, "hr", activeHrSubTab);
      }
      return true;
    }

    // 2. Sales module
    if (activeTab === "sales") {
      if (!canAccessModule(user, "sales")) return false;
      if (activeSalesSubTab) {
        return canShowSubmenu(user, "sales", activeSalesSubTab);
      }
      return true;
    }

    // 3. Procurement / Warehouse module
    if (activeTab === "warehouse") {
      if (!canAccessModule(user, "procurement")) return false;
      if (activeWarehouseSubTab) {
        return canShowSubmenu(user, "procurement", activeWarehouseSubTab);
      }
      return true;
    }

    // 4. Production module
    if (activeTab === "production") {
      if (!canAccessModule(user, "production")) return false;
      if (activeProductionSubTab) {
        return canShowSubmenu(user, "production", activeProductionSubTab);
      }
      return true;
    }

    return true;
  };

  // AI Recruitment engine state
  const [aiJobTitle, setAiJobTitle] = useState(
    "Senior Neon bending specialist",
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<RecruitmentTemplate | null>(null);
  const [budgetCheckInfo, setBudgetCheckInfo] = useState<string | null>(null);

  // Document management state

  // Live Telemetry metrics & clearance states
  const [metrics, setMetrics] = useState<any>(null);
  const [clearances, setClearances] = useState<any[]>([]);
  const [showClearanceModal, setShowClearanceModal] = useState(false);
  const [selectedClearanceEmp, setSelectedClearanceEmp] =
    useState<Employee | null>(null);
  const [clearanceForm, setClearanceForm] = useState({
    commenceDate: new Date().toISOString().split("T")[0],
    reasonCategory: "CONTRACT_EXPIRATION",
    detailedJustification: "",
    fleetManager: "FLEET_OFF_NAIF",
    itDirector: "IT_DIR_MAJED",
    warehouseController: "WH_CONTROLLER_MOHSEN",
  });

  const handleReloadMetrics = async () => {
    try {
      const res = await fetch("/api/v1/hr/dashboard/metrics");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.warn("Unable to fetch telemetry metrics:", err);
    }
  };

  const handleReloadClearances = async () => {
    try {
      const res = await fetch("/api/v1/hr/clearances");
      if (res.ok) {
        setClearances(await res.json());
      }
    } catch (err) {
      console.warn("Unable to fetch clearances database list:", err);
    }
  };

  const handleInitializeClearance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClearanceEmp) return;
    try {
      const res = await fetch("/api/v1/hr/clearance/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedClearanceEmp.id,
          commenceDate: clearanceForm.commenceDate,
          reasonCategory: clearanceForm.reasonCategory,
          detailedJustification: clearanceForm.detailedJustification,
          signatories: {
            fleetManager: clearanceForm.fleetManager,
            itDirector: clearanceForm.itDirector,
            warehouseController: clearanceForm.warehouseController,
          },
        }),
      });
      if (res.ok) {
        setShowClearanceModal(false);
        setSelectedClearanceEmp(null);
        setClearanceForm({
          commenceDate: new Date().toISOString().split("T")[0],
          reasonCategory: "CONTRACT_EXPIRATION",
          detailedJustification: "",
          fleetManager: "FLEET_OFF_NAIF",
          itDirector: "IT_DIR_MAJED",
          warehouseController: "WH_CONTROLLER_MOHSEN",
        });
        await handleReloadClearances();
        await handleReloadMetrics();
        await handleReloadEmployees();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveClearanceBlocker = async (
    clearanceId: string,
    blockerType: "vehicles" | "it" | "tools",
  ) => {
    try {
      const res = await fetch(
        `/api/v1/hr/clearance/${clearanceId}/resolve-blocker`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blockerType }),
        },
      );
      if (res.ok) {
        await handleReloadClearances();
        await handleReloadMetrics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Apply Accessibility Settings
  useEffect(() => {
    const htmlEl = document.documentElement;
    // Theme
    if (theme === "dark") {
      htmlEl.classList.add("dark");
      htmlEl.style.filter = "invert(0.9) hue-rotate(180deg)";
    } else {
      htmlEl.classList.remove("dark");
      htmlEl.style.filter = "none";
    }

    // Font Size Scaling
    let styleEl = document.getElementById("a11y-styles");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "a11y-styles";
      document.head.appendChild(styleEl);
    }
    
    const scale = {
      ss: 0.85,
      s: 0.95,
      m: 1,
      l: 1.1,
      xl: 1.2
    }[fontSize];

    if (scale === 1) {
      styleEl.innerHTML = "";
    } else {
      let css = "";
      for (let i = 8; i <= 40; i++) {
        css += `.text-\\[${i}px\\] { font-size: ${i * scale}px !important; }\n`;
      }
      css += `
        .text-xs { font-size: ${12 * scale}px !important; line-height: ${16 * scale}px !important; }
        .text-sm { font-size: ${14 * scale}px !important; line-height: ${20 * scale}px !important; }
        .text-base { font-size: ${16 * scale}px !important; line-height: ${24 * scale}px !important; }
        .text-lg { font-size: ${18 * scale}px !important; line-height: ${28 * scale}px !important; }
        .text-xl { font-size: ${20 * scale}px !important; line-height: ${28 * scale}px !important; }
        .text-2xl { font-size: ${24 * scale}px !important; line-height: ${32 * scale}px !important; }
        .text-3xl { font-size: ${30 * scale}px !important; line-height: ${36 * scale}px !important; }
        .text-4xl { font-size: ${36 * scale}px !important; line-height: ${40 * scale}px !important; }
      `;
      styleEl.innerHTML = css;
    }
  }, [theme, fontSize]);

  // Fetch initial system data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [uRes, eRes, qRes, lLogsRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/employees"),
          fetch("/api/quotations"),
          fetch("/api/login-logs").catch(() => null),
        ]);
        if (uRes.ok) setUsers(await uRes.json());
        if (eRes.ok) setEmployees(await eRes.json());
        if (qRes.ok) setQuotations(await qRes.json());
        if (lLogsRes && lLogsRes.ok) setLoginLogs(await lLogsRes.json());

        // Load initial live telemetry indices
        await handleReloadMetrics();
        await handleReloadClearances();
      } catch (err) {
        console.error("Unable to load Al-Waleed data endpoints: ", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Auto-expand HR dropdown when the HR tab becomes active
  useEffect(() => {
    if (activeTab === "hr") {
      setIsHrDropdownOpen(true);
    }
  }, [activeTab]);

  // Auto-expand Sales dropdown when the Sales tab becomes active
  useEffect(() => {
    if (activeTab === "sales") {
      setIsSalesDropdownOpen(true);
    }
  }, [activeTab]);

  // Update list functions
  const handleReloadLoginLogs = async () => {
    try {
      const res = await fetch("/api/login-logs");
      if (res.ok) {
        setLoginLogs(await res.json());
      }
    } catch (e) {
      console.error("Failed to load login logs:", e);
    }
  };

  const handleReloadUsers = async () => {
    const res = await fetch("/api/users");
    if (res.ok) {
      setUsers(await res.json());
    }
  };

  const handleReloadEmployees = async () => {
    const res = await fetch("/api/employees");
    if (res.ok) {
      setEmployees(await res.json());
      await handleReloadMetrics();
    }
  };

  const handleReloadQuotations = async () => {
    const res = await fetch("/api/quotations");
    if (res.ok) {
      setQuotations(await res.json());
    }
  };

  // Log login event to database
  const logLoginEvent = async (username: string) => {
    try {
      let ipAddress = "";
      try {
        // Try IPv4/IPv6 resolver first
        const ipRes = await fetch("https://api64.ipify.org?format=json");
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          ipAddress = ipData.ip;
        } else {
          // Fallback 1: ipapi
          const ipResAlt = await fetch("https://ipapi.co/json/");
          if (ipResAlt.ok) {
            const ipDataAlt = await ipResAlt.json();
            ipAddress = ipDataAlt.ip;
          }
        }
      } catch (err) {
        console.warn("Client IP fetch bypassed or failed, server will fallback:", err);
      }

      const now = new Date();
      // Format exact device-side client date and time
      const clientDate = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
      const clientTime = now.toLocaleTimeString('en-US', { hour12: false }); // HH:MM:SS

      await fetch("/api/login-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username, 
          ipAddress,
          clientDate,
          clientTime
        }),
      });
      handleReloadLoginLogs();
    } catch (e) {
      console.error("Failed to log login:", e);
    }
  };

  // Standard login trigger
  const handleRegularLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const uName = loginUsername.toUpperCase().trim();
    // Validate from loaded system users
    const matched = users.find((u) => u.username.toUpperCase() === uName);
    if (matched) {
      if (
        loginPassword &&
        matched.password &&
        matched.password !== loginPassword
      ) {
        setLoginError(
          lang === "ar"
            ? "كلمة المرور غير صحيحة"
            : "Incorrect passcode entered.",
        );
        return;
      }
      setUser(matched);
      logLoginEvent(matched.username);

      // Auto assign tabs based on roles/permissions
      const isTopLevel = 
        hasAdvancedPermission(matched, 'dashboard', 'metrics', 'view_main') || 
        matched.username?.toUpperCase() === "FERAS" ||
        matched.username?.toUpperCase() === "فراس" ||
        matched.username?.toUpperCase() === "ADMIN" ||
        matched.role === "الادارة العليا" ||
        matched.role === "الإدارة العليا" ||
        matched.role === "top_management" ||
        matched.role === "Super Admin" ||
        matched.role === "Admin";

      if (isTopLevel) {
        setActiveTab("dashboard");
      } else if (hasAdvancedPermission(matched, 'production', 'prod_dashboard', 'view_prod_dashboard') || canAccessModule(matched, 'production')) {
        setActiveTab("production");
        setActiveProductionSubTab("prod_dashboard");
      } else if (canAccessModule(matched, 'procurement')) {
        setActiveTab("warehouse");
        setActiveWarehouseSubTab("warehouse_dashboard");
      } else if (hasAdvancedPermission(matched, 'sales', 'dashboard', 'view_dashboard') || canAccessModule(matched, 'sales')) {
        setActiveTab("sales");
        setActiveSalesSubTab("sales_dashboard");
      } else if (canAccessModule(matched, 'hr')) {
        setActiveTab("hr");
        setActiveHrSubTab("dashboard");
      } else {
        setActiveTab("dashboard");
      }
    } else {
      setLoginError(
        lang === "ar"
          ? "اسم المستخدم المكتوب غير موجود بصندوق النظام"
          : "Username not registered in the system.",
      );
    }
  };

  // F24 Backdoor login validation
  const handleF24Login = (e: React.FormEvent) => {
    e.preventDefault();
    setF24Error("");
    if (f24User.toUpperCase() === "FERAS" && f24Pass === "!Feras2424$") {
      const superAdmin: User = {
        username: "FERAS",
        role: "Super Admin",
        jobTitle: "Owner / GM",
        dateCreated: "2026-01-01",
      };
      setUser(superAdmin);
      logLoginEvent("FERAS");
      setShowF24Modal(false);
      setActiveTab("dashboard");
    } else {
      setF24Error(
        lang === "ar"
          ? "رمز المعلم أو كلمة المرور خاطئة"
          : "Invalid master developer key or password.",
      );
    }
  };

  // Super Admin adds new user mapped instantly
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserCreationError("");
    setUserCreationSuccess("");
    if (!newAdminUser.username || !newAdminUser.password) {
      setUserCreationError(
        lang === "ar"
          ? "الرجاء ملء اسم المستخدم والرقم السري"
          : "Username and Password fields required.",
      );
      return;
    }
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAdminUser),
      });
      const data = await res.json();
      if (!res.ok) {
        setUserCreationError(data.error || "Server rejected registration");
      } else {
        setUserCreationSuccess(
          lang === "ar"
            ? `تم تسجيل المستخدم بنجاح بمستوى: ${data.user.role}`
            : `Success. Assigned role level: ${data.user.role}`,
        );
        setNewAdminUser({
          username: "",
          password: "",
          jobTitle: "HR Assistant",
        });
        handleReloadUsers();
      }
    } catch (err: any) {
      setUserCreationError(err.message || "Error occurred");
    }
  };

  // Super Admin deletes user
  const handleDeleteUser = async (uName: string) => {
    if (uName.toUpperCase() === "FERAS") return;
    try {
      const res = await fetch(`/api/users/${uName}`, { method: "DELETE" });
      if (res.ok) {
        handleReloadUsers();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "تحديث فاشل");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUser = async (username: string, updatedFields: any) => {
    try {
      const res = await fetch(`/api/users/${username}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      if (res.ok) {
        handleReloadUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create or Update Employee profiles (HR module)
  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = editingEmp ? { ...editingEmp } : { ...newEmp };
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowEmpForm(false);
        setEditingEmp(null);
        handleReloadEmployees();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEmployee = async (empId: string) => {
    if (
      !confirm(
        lang === "ar"
          ? "هل أنت متأكد من حذف هذا الموظف وملفه بالكامل؟"
          : "Are you sure you want to delete this employee?",
      )
    )
      return;
    try {
      const res = await fetch(`/api/employees/${empId}`, { method: "DELETE" });
      if (res.ok) {
        handleReloadEmployees();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sales and collection creation
  const handleSaveQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Calculate milestone costs automatically based on 50/30/20% rules
      const sumItems = (newQuo.items || []).reduce(
        (acc, item) => acc + item.quantity * item.unitPrice,
        0,
      );
      const totalAmount = sumItems + (newQuo.installationFees || 0);
      const grossTotal = totalAmount * (1 + (newQuo.vatRate || 0.15));

      const updatedMilestones = {
        downPayment: {
          amount: Number((grossTotal * 0.5).toFixed(2)),
          percentage: 50,
          isCollected: false,
          alertSent: false,
        },
        preInstallation: {
          amount: Number((grossTotal * 0.3).toFixed(2)),
          percentage: 30,
          isCollected: false,
          alertSent: false,
        },
        uponDelivery: {
          amount: Number((grossTotal * 0.2).toFixed(2)),
          percentage: 20,
          isCollected: false,
          alertSent: false,
        },
      };

      const payload = {
        ...newQuo,
        milestones: updatedMilestones,
      };

      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowQuoForm(false);
        setNewQuo({
          clientName: "",
          projectTitle: "",
          stage: "New Lead",
          neonMeters: 50,
          installationFees: 2500,
          vatRate: 0.15,
          items: [
            {
              id: "1",
              description: "Acrylic Glowing Flex Elements",
              quantity: 1,
              unitPrice: 4500,
            },
          ],
        });
        handleReloadQuotations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle collection checkpoints
  const toggleCollectionMilestone = async (
    quotation: Quotation,
    milestoneName: "downPayment" | "preInstallation" | "uponDelivery",
  ) => {
    const updated = { ...quotation };
    if (!updated.milestones) {
      const itemsList = updated.items || [];
      const sumItems = itemsList.reduce(
        (sum, item: any) =>
          sum + (item.quantity || 1) * (item.unitPrice || item.price || 0),
        0,
      );
      const fees = updated.installationFees || 0;
      const vat = updated.vatRate !== undefined ? updated.vatRate : 0.15;
      const grossTotal = (sumItems + fees) * (1 + vat);
      updated.milestones = {
        downPayment: {
          amount: Number((grossTotal * 0.5).toFixed(2)),
          percentage: 50,
          isCollected: false,
          alertSent: false,
        },
        preInstallation: {
          amount: Number((grossTotal * 0.3).toFixed(2)),
          percentage: 30,
          isCollected: false,
          alertSent: false,
        },
        uponDelivery: {
          amount: Number((grossTotal * 0.2).toFixed(2)),
          percentage: 20,
          isCollected: false,
          alertSent: false,
        },
      };
    }

    if (!updated.milestones.downPayment)
      updated.milestones.downPayment = {
        amount: 0,
        percentage: 50,
        isCollected: false,
        alertSent: false,
      };
    if (!updated.milestones.preInstallation)
      updated.milestones.preInstallation = {
        amount: 0,
        percentage: 30,
        isCollected: false,
        alertSent: false,
      };
    if (!updated.milestones.uponDelivery)
      updated.milestones.uponDelivery = {
        amount: 0,
        percentage: 20,
        isCollected: false,
        alertSent: false,
      };

    updated.milestones[milestoneName].isCollected =
      !updated.milestones[milestoneName].isCollected;
    // Auto-update project stage dynamically if payment checks succeed
    if (
      milestoneName === "downPayment" &&
      updated.milestones.downPayment.isCollected
    ) {
      updated.stage = "Down-payment";
    } else if (
      milestoneName === "uponDelivery" &&
      updated.milestones.uponDelivery.isCollected
    ) {
      updated.stage = "Production Start";
    }

    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        handleReloadQuotations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // AI Career ladder generator using Gemini API
  const handleAiRecruitGenerate = async () => {
    if (!aiJobTitle) return;
    setAiLoading(true);
    setAiResult(null);
    setBudgetCheckInfo(null);
    try {
      const res = await fetch("/api/gemini/recruit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle: aiJobTitle }),
      });
      if (res.ok) {
        const payload: RecruitmentTemplate = await res.json();
        setAiResult(payload);

        // Dynamic recruitment budget validation
        // Total company salary allocation calculation
        const totalSalaryExpense = employees.reduce(
          (acc, emp) => acc + emp.basicSalary,
          0,
        );
        const monthlyHRBudget = 150000; // Al-Waleed target cap
        const potentialIncrease = payload.salaryMax || 8000;

        if (totalSalaryExpense + potentialIncrease > monthlyHRBudget) {
          setBudgetCheckInfo(
            lang === "ar"
              ? `⚠️ تنبيه الميزانية المالية: تجاوز سقف الصرف للأجور الحالي (${totalSalaryExpense} SAR) مع قيمة الوظيفة المقترحة (لحد أقصى ${payload.salaryMax} SAR)`
              : `⚠️ Financial Budget Warning: Total company compensation (${totalSalaryExpense} SAR) + new hire (${payload.salaryMax} SAR) exceeds corporate salary limit of ${monthlyHRBudget} SAR.`,
          );
        } else {
          setBudgetCheckInfo(
            lang === "ar"
              ? `✅ الميزانية مناسبة: إجمالي أجور الشركة سيبقى تحت السقف المعتمد (${totalSalaryExpense + potentialIncrease} / ${monthlyHRBudget} ريال سعودي)`
              : `✅ Budget approved: Total corporate expenses remain healthy at (${totalSalaryExpense + potentialIncrease} / ${monthlyHRBudget} SAR).`,
          );
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  // Dynamic values calculation for global dashboard
  const totalEmployeesCount = employees.length;
  const activeQuotationsCount = quotations.length;

  // Calculate aggregate collections metrics
  const totalCollectionsTarget = quotations.reduce((acc, q) => {
    const itemsList = q.items || [];
    const sumItems = itemsList.reduce(
      (sum, item: any) =>
        sum + (item.quantity || 1) * (item.unitPrice || item.price || 0),
      0,
    );
    const fees = q.installationFees || 0;
    const vat = q.vatRate !== undefined ? q.vatRate : 0.15;
    const grossTotal = (sumItems + fees) * (1 + vat);
    return acc + grossTotal;
  }, 0);

  const totalCollectedAmount = quotations.reduce((acc, q) => {
    let qTotalCollected = 0;
    if (q.milestones?.downPayment?.isCollected)
      qTotalCollected += q.milestones.downPayment.amount || 0;
    if (q.milestones?.preInstallation?.isCollected)
      qTotalCollected += q.milestones.preInstallation.amount || 0;
    if (q.milestones?.uponDelivery?.isCollected)
      qTotalCollected += q.milestones.uponDelivery.amount || 0;
    return acc + qTotalCollected;
  }, 0);

  // Compute Aged receivables categorization arrays for billing graphs
  const currentOverdueClients = [
    {
      name: "Al-Muhaidib Corp",
      overDays: 45,
      amount: 31872.5,
      status: "Aged 30-60 Days",
    },
    {
      name: "Boulevard Zone-4",
      overDays: 12,
      amount: 203385.0,
      status: "Current",
    },
    {
      name: "Retro Pink Coffee Cafe",
      overDays: 95,
      amount: 11822.0,
      status: "Critical Over 90 Days",
    },
  ];

  // Document generators fillings

  // Direct Browser action helper (Printing)
  const handlePrintDocument = () => {
    window.print();
  };

  // Advanced filters calculation list for directory
  const filteredEmployees = employees.filter((emp) => {
    // Exact text queries
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchText = (
        emp.arabicName +
        emp.englishName +
        emp.id +
        emp.iqamaId +
        emp.jobTitle
      ).toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    // Roles filter
    if (roleFilter && emp.jobTitle !== roleFilter) return false;
    // Expiry filters (Within 1 year)
    if (expiryFilter === "near_expiry") {
      const expiryYear = new Date(emp.contractExpiry).getFullYear();
      const currentYear = new Date().getFullYear();
      if (expiryYear - currentYear > 1) return false;
    }
    // Custody options
    if (custodyFilter === "laptop" && !emp.custody.laptop) return false;
    if (custodyFilter === "tools" && !emp.custody.tools) return false;
    if (custodyFilter === "vehicle" && !emp.custody.vehicles) return false;

    return true;
  });

  // Calculate unique job titles present for selection in filtering
  const existingJobTitles = Array.from(
    new Set(employees.map((e) => e.jobTitle)),
  );

  return (
    <div
      id="app-root-container"
      className="min-h-screen flex flex-col font-sans bg-[#F1F5F9]/50 text-slate-800 transition-all print:bg-white print:block"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <div className="hidden print:block" dangerouslySetInnerHTML={{ __html: `<style>${sharedPrintStyles}</style>` + sharedPrintHeader }} />
      <style>{`
        .sidebar-collapsed span:not(.lucide):not(.text-\\[11px\\]) {
          display: none !important;
        }
        .sidebar-collapsed .text-\\[11px\\] {
          display: none !important;
        }
        .sidebar-collapsed .mt-1.mr-2.ml-2.pr-4 {
          display: none !important;
        }
        .sidebar-collapsed button {
          justify-content: center !important;
          padding-left: 0.5rem !important;
          padding-right: 0.5rem !important;
        }
        .sidebar-collapsed button > div.flex.items-center {
          justify-content: center !important;
          width: 100%;
        }
        .sidebar-collapsed .text-\\[10px\\] {
          display: none !important;
        }
        .sidebar-collapsed .glass-panel {
          padding-left: 0.5rem !important;
          padding-right: 0.5rem !important;
        }
        .sidebar-collapsed .justify-between.mb-2 {
          justify-content: center !important;
        }
        html.dark img, html.dark video {
          filter: invert(1) hue-rotate(180deg);
        }
      `}</style>
      {/* 2. HEADER BAR (Al-Waleed Integrated Theme) */}
      <header
        id="main-global-header"
        className="h-20 glass-panel sticky top-0 z-30 flex items-center justify-between px-6 md:px-12 border-b border-white/50 bg-white/80 select-none print:hidden"
      >
        {/* Brand Logo Group */}
        <div id="brand-identity-group" className="flex items-center gap-4">
          <img
            src="https://pbs.twimg.com/media/HE46IrybcAAMq7L?format=png&name=small"
            referrerPolicy="no-referrer"
            alt="Fonoun Alwaleed Logo"
            className="w-12 h-12 object-contain"
          />
          <div>
            <h1
              id="brand-main-title"
              className="text-xl font-black text-[#0072BC] tracking-wider font-sans"
            >
              {lang === "ar" ? "فنون الوليد" : "Fonoun Alwaleed"}
            </h1>
            <p
              id="brand-subtitle"
              className="text-[10px] text-[#00AEEF] font-bold tracking-widest uppercase"
            >
              {lang === "ar" ? "النظام الرقمي المتكامل" : "Neon Integrated ERP"}
            </p>
          </div>
        </div>

        {/* Global Toolbar Control */}
        <div
          id="toolbar-global-actions"
          className="flex items-center gap-4 md:gap-6"
        >
          {/* Bilingual Language Switcher & Accessibility */}
          <div className="flex items-center gap-2 relative">
            <div
              id="lang-switch-container"
              className="flex bg-slate-200/60 p-1 rounded-xl"
            >
              <button
                id="lang-btn-ar"
                onClick={() => setLang("ar")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === "ar" ? "bg-[#0072BC] text-white shadow-md" : "text-slate-600 hover:text-[#0072BC]"}`}
              >
                العربية
              </button>
              <button
                id="lang-btn-en"
                onClick={() => setLang("en")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === "en" ? "bg-[#0072BC] text-white shadow-md" : "text-slate-600 hover:text-[#0072BC]"}`}
              >
                EN
              </button>
            </div>

            {/* Accessibility Menu Button */}
            <div className="relative">
              <button
                onClick={() => setIsAccessibilityMenuOpen(!isAccessibilityMenuOpen)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors shadow-sm flex items-center justify-center"
                title={lang === "ar" ? "تسهيلات الاستخدام" : "Accessibility"}
              >
                <Accessibility className="w-5 h-5" />
              </button>
              {isAccessibilityMenuOpen && (
                <div className="absolute top-12 left-0 md:right-0 md:left-auto bg-white shadow-xl border border-slate-100 rounded-2xl p-4 w-64 z-50">
                  <h4 className="font-bold text-slate-800 mb-3">{lang === "ar" ? "تسهيلات الاستخدام" : "Accessibility Options"}</h4>
                  
                  <div className="mb-4">
                    <span className="text-xs font-bold text-slate-500 mb-2 block">{lang === "ar" ? "المظهر" : "Theme"}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setTheme("light")} className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${theme === "light" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{lang === "ar" ? "فاتح" : "Light"}</button>
                      <button onClick={() => setTheme("dark")} className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${theme === "dark" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{lang === "ar" ? "داكن" : "Dark"}</button>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-500 mb-2 block">{lang === "ar" ? "حجم الخط" : "Font Size"}</span>
                    <div className="flex gap-1">
                      {["ss", "s", "m", "l", "xl"].map(size => (
                        <button 
                          key={size}
                          onClick={() => setFontSize(size as any)} 
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase ${fontSize === size ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User profile check */}
          {user && (
            <div
              id="logged-user-avatar-tag"
              className="flex items-center gap-3 bg-white/60 p-1.5 pr-4 rounded-xl border border-slate-200"
            >
              <div className="text-right">
                <p className="text-sm font-black text-slate-800 uppercase">
                  {user.username}
                </p>
                <p className="text-[10px] text-[#00AEEF] font-bold uppercase">
                  {lang === "ar" ? user.role : user.role}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0072BC] to-[#00AEEF] flex items-center justify-center text-white font-bold text-lg shadow-inner">
                {user.username.charAt(0)}
              </div>
              <button
                id="user-logout-trigger"
                onClick={() => setUser(null)}
                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                title={lang === "ar" ? "تسجيل الخروج" : "Logout Session"}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 3. MAIN WORKSPACE */}
      {!user ? (
        /* SECURE GLASSMORPHISM LOGIN FIELD */
        <div
          id="login-module-section"
          className="flex-1 flex flex-col items-center justify-center p-6 relative bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#011424] overflow-hidden"
        >
          {/* Ambient Blur Lights simulation */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#0072BC]/20 rounded-full filter blur-[100px] pointer-events-none animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00AEEF]/10 rounded-full filter blur-[120px] pointer-events-none"></div>

          <div
            id="login-container-card"
            className="w-full max-w-md dark-glass-panel rounded-3xl p-8 relative flex flex-col z-10 transition-transform"
          >
            {/* HIDDEN BACKDOOR "F24" TRIGGER (CLICK 4 TIMES) */}
            <button
              id="f24-backdoor-trigger"
              onClick={() => {
                const newCount = f24ClickCount + 1;
                if (newCount >= 4) {
                  setShowF24Modal(true);
                  setF24Error("");
                  setF24ClickCount(0); // Reset count
                } else {
                  setF24ClickCount(newCount);
                }
              }}
              className="absolute top-4 right-4 w-12 h-12 opacity-0 cursor-default select-none z-50 bg-transparent rounded-full"
            >
            </button>

            {/* Logo details inside card */}
            <div className="flex flex-col items-center text-center mb-8">
              <img
                src="https://pbs.twimg.com/media/HE46IrybcAAMq7L?format=png&name=small"
                referrerPolicy="no-referrer"
                alt="Fonoun Alwaleed Logo"
                className="w-28 h-28 mx-auto mb-4 object-contain animate-pulse"
              />
              <h2 className="text-2xl font-black text-white tracking-wide">
                {lang === "ar"
                  ? "بوابة فنون الوليد لخدمات الأعمال"
                  : "Fonoun Alwaleed System"}
              </h2>
              <p className="text-xs text-cyan-400 font-bold tracking-widest uppercase mt-1">
                {lang === "ar"
                  ? "التحقق الثنائي لشركة فنون الوليد للصناعة"
                  : "Standard Enterprise Gatekeeper"}
              </p>
            </div>

            {/* Standard Login Forms */}
            <form onSubmit={handleRegularLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-2 tracking-wide">
                  {lang === "ar"
                    ? "اسم المستخدم المعتمد"
                    : "Corporate Account Username"}
                </label>
                <input
                  id="input-login-name"
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder={lang === "ar" ? "أدخل اسم المستخدم" : "Enter Username"}
                  className="w-full px-5 py-3.5 bg-slate-900/80 border border-slate-700 rounded-2xl text-white text-sm font-mono placeholder-slate-500 focus:outline-none focus:border-[#00AEEF] focus:ring-1 focus:ring-[#00AEEF] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-2 tracking-wide">
                  {lang === "ar"
                    ? "كلمة المرور المشفرة"
                    : "Encrypted Workspace Passcode"}
                </label>
                <input
                  id="input-login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-3.5 bg-slate-900/80 border border-slate-700 rounded-2xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#0072BC] focus:ring-1 focus:ring-[#0072BC] transition-all"
                  required
                />
              </div>

              {loginError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl font-bold">
                  {loginError}
                </div>
              )}

              <button
                id="btn-login-submit"
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-[#0072BC] to-[#00AEEF] text-white font-bold rounded-2xl text-sm shadow-xl hover:shadow-[#00AEEF]/20 transition-all active:scale-[0.98] neon-glow-cyan"
              >
                {lang === "ar"
                  ? "تصديق الدخول للنظام 🡠"
                  : "Authenticate Session 🡲"}
              </button>
            </form>
          </div>

          {/* SUPER ADMIN CONSOLE SIGN-IN EMBEDDED OVERLAY */}
          {showF24Modal && (
            <div
              id="f24-overlay"
              className="absolute inset-0 bg-slate-950/90 z-40 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-sm dark-glass-panel border-2 border-cyan-400 p-8 rounded-3xl relative">
                <div className="text-center mb-6">
                  <span className="inline-block p-3 bg-[#0072BC]/20 text-[#00AEEF] rounded-2xl mb-2">
                    <Shield className="w-8 h-8" />
                  </span>
                  <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                    {lang === "ar"
                      ? "الدخول المباشر المعلم فراس"
                      : "RESTRICTED MASTER BYPASS"}
                  </p>
                </div>

                <form onSubmit={handleF24Login} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      user
                    </label>
                    <input
                      id="f24-user-input"
                      type="text"
                      value={f24User}
                      onChange={(e) => setF24User(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#00AEEF]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      password
                    </label>
                    <input
                      id="f24-pass-input"
                      type="password"
                      value={f24Pass}
                      onChange={(e) => setF24Pass(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#0072BC]"
                      required
                    />
                  </div>

                  {f24Error && (
                    <div className="p-3 bg-rose-500/10 text-rose-400 text-xs rounded-xl font-bold border border-rose-500/30">
                      {f24Error}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      id="f24-btn-cancel"
                      type="button"
                      onClick={() => setShowF24Modal(false)}
                      className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold"
                    >
                      {lang === "ar" ? "إلغاء" : "Cancel"}
                    </button>
                    <button
                      id="f24-btn-submit"
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-[#0072BC] text-white rounded-xl text-xs font-bold shadow-lg"
                    >
                      {lang === "ar" ? "تحقيق 👤" : "Verify"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* AUTHENTICATED WORKSPACE LAYOUT */
        <div
          id="authorized-workspace-block"
          className="flex-1 grid grid-cols-12 w-full px-2 md:px-4 py-6 gap-6 print:block print:p-0"
        >
          {/* LEFT SIDEBAR NAVIGATION PANELS (FROSTED GLASS ARCHITECTURE) */}
          <aside
            id="sidebar-panel-container"
            className={`col-span-12 ${isSidebarCollapsed ? 'lg:col-span-1 sidebar-collapsed' : 'lg:col-span-3'} flex flex-col gap-4 print:hidden transition-all duration-300`}
          >
            {/* Quick module router widget */}
            <div className="glass-panel rounded-3xl p-6 flex flex-col gap-2 relative overflow-hidden bg-white/70">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-[#0072BC] tracking-widest uppercase">
                  {lang === "ar"
                    ? "أقسام النظام الأساسية"
                    : "Al-Waleed ERP Modules"}
                </p>
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="p-1 rounded-md text-slate-400 hover:text-[#0072BC] hover:bg-blue-50 transition-colors"
                  title={isSidebarCollapsed ? (lang === "ar" ? "عرض الأقسام" : "Expand Modules") : (lang === "ar" ? "طي الأقسام" : "Collapse Modules")}
                >
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? "-rotate-90" : "rotate-0"}`} />
                </button>
              </div>

              {/* Dashboard Nav (Global) */}
              {(user.role === "Super Admin" ||
                user.username.toUpperCase() === "FERAS" ||
                user.username.toUpperCase() === "فراس" ||
                user.role === "الادارة العليا" ||
                user.role === "الإدارة العليا") && (
                <button
                  id="tab-btn-dashboard"
                  onClick={() => setActiveTab("dashboard")}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === "dashboard" ? "bg-[#0072BC] text-white shadow-lg shadow-[#0072BC]/15 neon-glow-blue" : "text-slate-600 hover:bg-white/90 hover:text-[#0072BC]"}`}
                >
                  <TrendingUp className="w-5 h-5" />
                  <span>
                    {lang === "ar"
                      ? "لوحة القيادة والمؤشرات"
                      : "Main Dashboard"}
                  </span>
                </button>
              )}

              {/* HRM Module Router */}
              {canAccessModule(user, 'hr') && (
                <div
                  id="tab-btn-hr-group"
                  className="w-full flex flex-col gap-2"
                >
                  <button
                    id="tab-btn-hr"
                    onClick={() => {
                      setActiveTab("hr");
                      setIsHrDropdownOpen(!isHrDropdownOpen);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl text-[14px] font-extrabold transition-all duration-300 ${activeTab === "hr" ? "bg-[#0072BC] text-white shadow-xl shadow-[#0072BC]/20" : "text-slate-600 hover:bg-slate-50 hover:text-[#0072BC]"}`}
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5" />
                      <span className="leading-relaxed">
                        {lang === "ar" ? "الموارد البشرية" : "Human Resources"}
                      </span>
                    </div>
                    <span className="text-[11px] font-black opacity-90 select-none transition-transform duration-300">
                      {isHrDropdownOpen ? "▼" : "▲"}
                    </span>
                  </button>

                  {/* Nested Accordion Submenus */}
                  {isHrDropdownOpen && (
                    <div className="mt-1 mr-2 ml-2 pr-4 text-[13px] flex flex-col gap-2 border-r-2 border-[#0072BC]/30 py-2">
                      {hrSubmenus
                        .filter((sub) => {
                          if (!canShowSubmenu(user, "hr", sub.id)) {
                            return false;
                          }
                          if (
                            user.role === "Employee (Inquiries)" ||
                            user.role === "موظف - استعلامات"
                          ) {
                            return sub.id === "ess_dashboard";
                          }
                          return true;
                        })
                        .map((sub) => {
                          const isSubActive =
                            activeTab === "hr" && activeHrSubTab === sub.id;
                          return (
                            <button
                              key={sub.id}
                              onClick={() => {
                                setActiveTab("hr");
                                setActiveHrSubTab(sub.id);
                              }}
                              className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl text-right font-semibold transition-all duration-200 ${
                                isSubActive
                                  ? "bg-[#0072BC] text-white font-extrabold shadow-md shadow-[#0072BC]/15 scale-[1.02]"
                                  : "text-slate-600 hover:bg-slate-100 hover:text-[#0072BC]"
                              }`}
                            >
                              <span className="truncate leading-loose">
                                {lang === "ar" ? sub.ar : sub.en}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* Sales Module Router with Nested Collapsible Dropdown */}
              {canAccessModule(user, 'sales') && (
                <div
                  id="tab-btn-sales-group"
                  className="w-full flex flex-col gap-2"
                >
                  <button
                    id="tab-btn-sales"
                    onClick={() => {
                      setActiveTab("sales");
                      setIsSalesDropdownOpen(!isSalesDropdownOpen);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl text-[14px] font-extrabold transition-all duration-300 ${activeTab === "sales" ? "bg-[#0072BC] text-white shadow-xl shadow-[#0072BC]/20" : "text-slate-600 hover:bg-slate-50 hover:text-[#0072BC]"}`}
                  >
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5" />
                      <span className="leading-relaxed">
                        {lang === "ar"
                          ? "المبيعات والتحصيل"
                          : "Sales & Collections"}
                      </span>
                    </div>
                    <span className="text-[11px] font-black opacity-90 select-none transition-transform duration-300">
                      {isSalesDropdownOpen ? "▼" : "▲"}
                    </span>
                  </button>

                  {/* Nested Accordion Submenus */}
                  {isSalesDropdownOpen && (
                    <div className="mt-1 mr-2 ml-2 pr-4 text-[13px] flex flex-col gap-2 border-r-2 border-[#0072BC]/30 py-2">
                      {salesSubmenus
                        .filter((sub) => {
                          if (!canShowSubmenu(user, "sales", sub.id)) {
                            return false;
                          }
                          if (user && user.role === "Sales Rep") {
                            if (
                              sub.id === "sales_reports" ||
                              sub.id === "sales_reps_targets"
                            ) {
                              return false;
                            }
                          }
                          if (sub.id === "sales_costing") {
                            if (!user) return false;
                            const role = user.role || "";
                            const title = (user.jobTitle || "").toLowerCase();
                            const username = (
                              user.username || ""
                            ).toUpperCase();
                            const isRep =
                              title.includes("rep") ||
                              title.includes("associate") ||
                              title.includes("مندوب") ||
                              role === "Sales Rep";
                            const isMgmt =
                              role === "Super Admin" ||
                              role === "Sales Manager" ||
                              role === "Manager" ||
                              username === "FERAS" ||
                              title.includes("manager") ||
                              title.includes("director") ||
                              title.includes("إدارة") ||
                              title.includes("مدير") ||
                              title.includes("owner") ||
                              title.includes("gm");
                            return isMgmt && !isRep;
                          }
                          return true;
                        })
                        .map((sub) => {
                          const isSubActive =
                            activeTab === "sales" &&
                            activeSalesSubTab === sub.id;
                          return (
                            <button
                              key={sub.id}
                              onClick={() => {
                                setActiveTab("sales");
                                setActiveSalesSubTab(sub.id);
                              }}
                              className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl text-right font-semibold transition-all duration-200 ${
                                isSubActive
                                  ? "bg-[#0072BC] text-white font-extrabold shadow-md shadow-[#0072BC]/15 scale-[1.02]"
                                  : "text-slate-600 hover:bg-slate-100 hover:text-[#0072BC]"
                              }`}
                            >
                              <span className="truncate leading-loose">
                                {lang === "ar" ? sub.ar : sub.en}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* Purchases and Warehouse */}
              {canAccessModule(user, 'procurement') && (
                <div
                  id="tab-btn-warehouse-group"
                  className="w-full flex flex-col gap-2"
                >
                  <button
                    id="tab-btn-warehouse"
                    onClick={() => {
                      setActiveTab("warehouse");
                      setIsWarehouseDropdownOpen(!isWarehouseDropdownOpen);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl text-[14px] font-extrabold transition-all duration-300 ${activeTab === "warehouse" ? "bg-[#0072BC] text-white shadow-xl shadow-[#0072BC]/20" : "text-slate-600 hover:bg-slate-50 hover:text-[#0072BC]"}`}
                  >
                    <div className="flex items-center gap-3">
                      <Box className="w-5 h-5 text-indigo-500 fill-indigo-500/20" />
                      <span>
                        {lang === "ar"
                          ? "المشتريات و المستودع 📦"
                          : "Purchases & Warehouse 📦"}
                      </span>
                    </div>
                    <span className="text-[11px] font-black opacity-90 select-none transition-transform duration-300">
                      {isWarehouseDropdownOpen ? "▼" : "▲"}
                    </span>
                  </button>

                  {/* Nested Accordion Submenus */}
                  {isWarehouseDropdownOpen && (
                    <div className="mt-1 mr-2 ml-2 pr-4 text-[13px] flex flex-col gap-2 border-r-2 border-[#0072BC]/30 py-2">
                      {[
                        {
                          id: "warehouse_dashboard",
                          ar: "📊 لوحة القيادة",
                          en: "📊 Dashboard",
                        },
                        {
                          id: "warehouse_items",
                          ar: "🔖 مستودع الاصناف",
                          en: "🔖 Items Warehouse",
                        },
                        {
                          id: "materials_warehouse",
                          ar: "🧱 مستودع المواد",
                          en: "🧱 Materials Warehouse",
                        },
                        {
                          id: "warehouse_procurement",
                          ar: "📦 طلبات شراء المواد",
                          en: "📦 Material Procurement",
                        },
                        {
                          id: "warehouse_suppliers_pricing",
                          ar: "🤝 الموردين والتسعير",
                          en: "🤝 Suppliers & Pricing",
                        },
                        ...(hasAdvancedPermission(user, 'procurement', 'finance_approval', 'view_finance_po') ? [{
                          id: "warehouse_finance_approval",
                          ar: "💵 بوابة تعميد المشتريات (المالية)",
                          en: "💵 Finance PO Approvals",
                        }] : []),
                      ].filter((sub) => canShowSubmenu(user, "procurement", sub.id)).map((sub) => {
                        const isSubActive =
                          activeTab === "warehouse" &&
                          activeWarehouseSubTab === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => {
                              setActiveTab("warehouse");
                              setActiveWarehouseSubTab(sub.id);
                            }}
                            className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl text-right font-semibold transition-all duration-200 ${
                              isSubActive
                                ? "bg-[#0072BC] text-white font-extrabold shadow-md shadow-[#0072BC]/15 scale-[1.02]"
                                : "text-slate-600 hover:bg-slate-100 hover:text-[#0072BC]"
                            }`}
                          >
                            <span className="truncate leading-loose">
                              {lang === "ar" ? sub.ar : sub.en}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Financial Accounting */}
              <div
                id="tab-btn-finance-group"
                className="w-full flex flex-col gap-2"
              >
                <button
                  id="tab-btn-finance"
                  onClick={() => {
                    setActiveTab("finance");
                    setIsFinanceDropdownOpen(!isFinanceDropdownOpen);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl text-[14px] font-extrabold transition-all duration-300 ${activeTab === "finance" ? "bg-[#0072BC] text-white shadow-xl shadow-[#0072BC]/20" : "text-slate-600 hover:bg-slate-50 hover:text-[#0072BC]"}`}
                >
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                    <span>
                      {lang === "ar"
                        ? "المحاسبة المالية 💰"
                        : "Financial Accounting 💰"}
                    </span>
                  </div>
                  <span className="text-[11px] font-black opacity-90 select-none transition-transform duration-300">
                    {isFinanceDropdownOpen ? "▼" : "▲"}
                  </span>
                </button>

                {/* Nested Accordion Submenus */}
                {isFinanceDropdownOpen && (
                  <div className="mt-1 mr-2 ml-2 pr-4 text-[13px] flex flex-col gap-2 border-r-2 border-[#0072BC]/30 py-2">
                    {financeSubmenus.filter((sub) => {
                      if (sub.id === "finance_journal") {
                        return canShowSubmenu(user!, "finance", "journal");
                      }
                      if (sub.id === "finance_customer_supplier_invoices") {
                        return canShowSubmenu(user!, "finance", "invoices");
                      }
                      return true;
                    }).map((sub) => {
                      const isSubActive =
                        activeTab === "finance" &&
                        activeFinanceSubTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setActiveTab("finance");
                            setActiveFinanceSubTab(sub.id);
                          }}
                          className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl text-right font-semibold transition-all duration-200 ${
                            isSubActive
                              ? "bg-[#0072BC] text-white font-extrabold shadow-md shadow-[#0072BC]/15 scale-[1.02]"
                              : "text-slate-600 hover:bg-slate-100 hover:text-[#0072BC]"
                          }`}
                        >
                          <span className="truncate leading-loose">
                            {lang === "ar" ? sub.ar : sub.en}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Manufacturing Production Control Hub */}
              {canAccessModule(user, 'production') && (
                <div
                  id="tab-btn-production-group"
                  className="w-full flex flex-col gap-2"
                >
                  <button
                    id="tab-btn-production"
                    onClick={() => {
                      setActiveTab("production");
                      setIsProductionDropdownOpen(!isProductionDropdownOpen);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl text-[14px] font-extrabold transition-all duration-300 ${activeTab === "production" ? "bg-[#0072BC] text-white shadow-xl shadow-[#0072BC]/20" : "text-slate-600 hover:bg-slate-50 hover:text-[#0072BC]"}`}
                  >
                    <div className="flex items-center gap-3">
                      <Layers className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                      <span>
                        {lang === "ar"
                          ? "مركز التحكم بالإنتاج ⚙️"
                          : "Production Center ⚙️"}
                      </span>
                    </div>
                    <span className="text-[11px] font-black opacity-90 select-none transition-transform duration-300">
                      {isProductionDropdownOpen ? "▼" : "▲"}
                    </span>
                  </button>

                  {/* Nested Accordion Submenus */}
                  {isProductionDropdownOpen && (
                    <div className="mt-1 mr-2 ml-2 pr-4 text-[13px] flex flex-col gap-2 border-r-2 border-[#0072BC]/30 py-2">
                      {productionSubmenus
                        .filter((sub) => {
                          if (!canShowSubmenu(user, "production", sub.id)) {
                            return false;
                          }
                          // Sales Rep can ONLY see the dashboard & metrics tab!
                          const isSales = user.role === "Sales Rep";
                          if (isSales) {
                            return sub.id === "prod_dashboard";
                          }
                          return true;
                        })
                        .map((sub) => {
                          const isSubActive =
                            activeTab === "production" &&
                            activeProductionSubTab === sub.id;
                          return (
                            <button
                              key={sub.id}
                              onClick={() => {
                                setActiveTab("production");
                                setActiveProductionSubTab(sub.id);
                              }}
                              className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl text-right font-semibold transition-all duration-200 ${
                                isSubActive
                                  ? "bg-[#0072BC] text-white font-extrabold shadow-md shadow-[#0072BC]/15 scale-[1.02]"
                                  : "text-slate-600 hover:bg-slate-100 hover:text-[#0072BC]"
                              }`}
                            >
                              <span className="truncate leading-loose">
                                {lang === "ar" ? sub.ar : sub.en}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* Super Admin Console */}
              {(user.role === "Super Admin" || user.username === "FERAS") && (
                <button
                  id="tab-btn-superadmin"
                  onClick={() => {
                    setActiveTab("super_admin" as any);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === ("super_admin" as any) ? "bg-[#0072BC] text-white shadow-lg shadow-[#0072BC]/15 neon-glow-blue" : "text-slate-600 hover:bg-white/90 hover:text-[#0072BC]"}`}
                >
                  <Shield className="w-5 h-5 text-rose-500 animate-pulse" />
                  <span>
                    {lang === "ar"
                      ? "👮 التحكم الإداري الفائق"
                      : "👮 Super Admin Console"}
                  </span>
                </button>
              )}

              {/* Secure F24 Indicator Badge */}
              <div className="mt-4 p-4 rounded-2xl bg-slate-100/80 border border-slate-200/50 flex flex-col gap-2">
                <p className="text-[10px] uppercase font-black text-rose-500 tracking-wider">
                  🔐{" "}
                  {lang === "ar"
                    ? "حالة التشفير وبورت الخدمة"
                    : "Security Status Log"}
                </p>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-[11px] font-mono text-slate-500 font-bold uppercase">
                    {lang === "ar" ? "اتصال مرمز SSL نشط" : "SSL Active 100%"}
                  </span>
                </div>
              </div>
            </div>

            {/* SUPER ADMIN COMPACT CONSOLE (USER MAPPING SYSTEM) */}
            {user.role === "Super Admin" && (
              <div
                id="super-admin-rbac-box"
                className="glass-panel rounded-3xl p-6 border-2 border-[#00AEEF]/30 bg-white/70"
              >
                <div className="flex items-center gap-2 text-[#0072BC] mb-4">
                  <Shield className="w-5 h-5" />
                  <h3 className="font-black text-sm tracking-wide">
                    {lang === "ar"
                      ? "لوحة تحكم المشرف الفائق"
                      : "F24 User Architect"}
                  </h3>
                </div>

                {/* Users register list */}
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase font-bold text-slate-400">
                    {lang === "ar"
                      ? "المستخدمين النشطين بالنظام"
                      : "Active System Accounts"}
                  </h4>

                  <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                    {users.map((item) => (
                      <div
                        key={item.username}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-200/50"
                      >
                        <div>
                          <p className="text-xs font-mono font-bold">
                            {item.username}
                          </p>
                          <p className="text-[9px] text-slate-500">
                            {item.jobTitle}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-cyan-100 text-cyan-800 text-[9px] rounded font-bold">
                            {item.role}
                          </span>
                          {item.username !== "FERAS" && (
                            <button
                              onClick={() => handleDeleteUser(item.username)}
                              className="text-stone-400 hover:text-rose-500 p-1"
                              title="Delete System Access"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add User mapped automatically on Job Title selection */}
                  <form
                    onSubmit={handleAddUser}
                    className="space-y-2 border-t border-slate-100 pt-3"
                  >
                    <p className="text-[11px] font-bold text-[#0072BC]">
                      ➕{" "}
                      {lang === "ar"
                        ? "تعيين حساب جديد فوري"
                        : "Map New Role Access"}
                    </p>

                    <input
                      type="text"
                      placeholder={
                        lang === "ar" ? "اسم الحساب الوظيفي" : "New Username"
                      }
                      value={newAdminUser.username}
                      onChange={(e) =>
                        setNewAdminUser({
                          ...newAdminUser,
                          username: e.target.value,
                        })
                      }
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg placeholder-slate-400 font-mono"
                    />

                    <input
                      type="password"
                      placeholder={lang === "ar" ? "الرقم السري" : "Password"}
                      value={newAdminUser.password}
                      onChange={(e) =>
                        setNewAdminUser({
                          ...newAdminUser,
                          password: e.target.value,
                        })
                      }
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 mb-0.5">
                        {lang === "ar"
                          ? "المسمى الوظيفي المربوط بالدور"
                          : "Associated Job Title Rule"}
                      </label>
                      <select
                        value={newAdminUser.jobTitle}
                        onChange={(e) =>
                          setNewAdminUser({
                            ...newAdminUser,
                            jobTitle: e.target.value,
                          })
                        }
                        className="w-full text-xs px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                      >
                        <option value="General Admin Director">
                          {lang === "ar"
                            ? "مدير إداري عام (المشرف الأعلى)"
                            : "General Admin Director (Super Admin)"}
                        </option>
                        <option value="HR Manager">
                          {lang === "ar"
                            ? "مدير الموارد البشرية (صلاحيات التوظيف)"
                            : "HR Manager"}
                        </option>
                        <option value="Sales Coordinator">
                          {lang === "ar"
                            ? "منسق المبيعات والتحصيل (مبيعات)"
                            : "Sales Coordinator (Sales Rep)"}
                        </option>
                      </select>
                    </div>

                    {userCreationError && (
                      <p className="text-[10px] text-rose-500 font-medium">
                        {userCreationError}
                      </p>
                    )}
                    {userCreationSuccess && (
                      <p className="text-[10px] text-emerald-600 font-medium">
                        {userCreationSuccess}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2 bg-[#0072BC] text-white text-xs font-bold rounded-lg shadow-md"
                    >
                      {lang === "ar"
                        ? "توليد الحساب التلقائي"
                        : "Map Credentials"}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </aside>

          {selectedUserForPermissions && (
            <AdvancedPermissionsPortal
              user={selectedUserForPermissions}
              allUsers={users}
              lang={lang}
              onClose={() => setSelectedUserForPermissions(null)}
              onSave={async (username, payload) => {
                const { newUsername, password, role, jobTitle, ...rest } =
                  payload as any;
                await handleUpdateUser(username, {
                  ...(newUsername && { newUsername }),
                  ...(password && { password }),
                  ...(role && { role }),
                  ...(jobTitle && { jobTitle }),
                  permissions: rest,
                });
              }}
            />
          )}
          {showAISettings && (
            <AISettingsModal
              lang={lang}
              onClose={() => setShowAISettings(false)}
            />
          )}
          {/* MAIN MODULE CONTENT GATEWAY */}
          <main
            id="main-tabs-content-gate"
            className={`col-span-12 ${isSidebarCollapsed ? 'lg:col-span-11' : 'lg:col-span-9'} flex flex-col gap-6 print:block transition-all duration-300`}
          >
            {!isCurrentTabAccessible() ? (
              <div className="flex flex-col items-center justify-center min-h-[500px] p-8 bg-white border border-slate-200 rounded-3xl shadow-sm text-center">
                <div className="p-4 bg-rose-50 text-rose-600 rounded-full mb-6">
                  <Lock className="w-12 h-12 stroke-[2]" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">
                  {lang === 'ar' ? 'عذراً، لا تملك صلاحية الوصول!' : 'Access Denied!'}
                </h3>
                <p className="text-sm text-slate-500 max-w-md leading-relaxed mb-8">
                  {lang === 'ar' 
                    ? 'ليس لديك الصلاحيات الكافية لاستعراض أو استخدام هذا القسم الفرعي. يرجى التواصل مع المدير المسؤول أو مالك النظام لتعديل صلاحيات حسابك.' 
                    : 'You do not have the required permissions to view or interact with this section. Please contact your administrator to adjust your account permissions.'}
                </p>
                <button
                  onClick={() => {
                    setActiveTab('dashboard');
                  }}
                  className="px-6 py-3 bg-[#0072BC] hover:bg-[#005a96] text-white rounded-xl text-sm font-black transition-all shadow-md flex items-center gap-2"
                >
                  <span>{lang === 'ar' ? 'الرجوع إلى لوحة المؤشرات' : 'Back to Dashboard'}</span>
                </button>
              </div>
            ) : (
              <>
            {/* SUPER ADMIN ADVANCED MASTER PANELS */}
            {activeTab === ("super_admin" as any) && (
              <div id="content-tab-superadmin" className="space-y-6">
                <div className="glass-panel rounded-3xl p-8 relative overflow-hidden bg-gradient-to-r from-red-50 to-white text-slate-800 shadow-md border-r-4 border-rose-500">
                  <div
                    className="absolute top-0 left-0 w-64 h-64 bg-rose-500/5 rounded-full filter blur-[60px]"
                    style={{ direction: "rtl" }}
                  />
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <span className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-full text-xs font-bold uppercase tracking-widest">
                        {lang === "ar"
                          ? "التحكم الإداري الفائق والخصوصية الآمنة"
                          : "ERP CORE INSTANCE OWNER"}
                      </span>
                      <h2 className="text-3xl font-black mt-3 text-rose-700">
                        {lang === "ar"
                          ? "لوحة تحكم المشرف الفائق (فراس)"
                          : "Super Admin Domain Configuration (FERAS)"}
                      </h2>
                      <p className="text-xs text-slate-500 leading-relaxed mt-2 max-w-xl">
                        {lang === "ar"
                          ? "إدارة الحسابات الأمنية، كلمات السر، مستويات الوصولوصلاحيات الأقسام لجميع الموظفين."
                          : "Override master roles, manage user passwords, and configure access profiles directly."}
                      </p>
                    </div>
                    <div
                      className="p-4 bg-purple-500/10 border border-purple-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-purple-500/20 transition group"
                      onClick={() => setShowAISettings(true)}
                    >
                      <p className="text-[10px] uppercase font-bold text-purple-700 tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 group-hover:animate-ping" />
                        {lang === "ar"
                          ? "إعدادات الذكاء الاصطناعي (مدمج)"
                          : "AI Integration Setup"}
                      </p>
                      <p className="text-sm font-black text-purple-600 mt-2">
                        {lang === "ar"
                          ? "اضغط للتهيئة ⚙️"
                          : "Configure Engine ⚙️"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Create New User Account card */}
                  <div className="glass-panel rounded-3xl p-6 bg-white shadow-xl flex flex-col gap-4 border border-slate-100">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">
                        {lang === "ar"
                          ? "➕ إنشاء حساب وصول جديد"
                          : "➕ Set Up Access Credentials"}
                      </h3>
                      <p className="text-xs text-stone-400 mt-1">
                        {lang === "ar"
                          ? "قم بإدخال بيانات الحساب واختيار الموظف المناسب كمرجع."
                          : "Submit credentials mapped to a real staff employee."}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">
                          {lang === "ar"
                            ? "اسم الحساب (مستحب بالإنجليزية)"
                            : "Username (English)"}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. KAMEL"
                          value={newAdminUser.username}
                          onChange={(e) =>
                            setNewAdminUser({
                              ...newAdminUser,
                              username: e.target.value.toUpperCase(),
                            })
                          }
                          className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono placeholder-slate-400 font-bold uppercase"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">
                          {lang === "ar" ? "كلمة المرور" : "Password"}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 1234"
                          value={newAdminUser.password}
                          onChange={(e) =>
                            setNewAdminUser({
                              ...newAdminUser,
                              password: e.target.value,
                            })
                          }
                          className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">
                          {lang === "ar" ? "المسمى الوظيفي" : "Job Title"}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Electrical Technician"
                          value={newAdminUser.jobTitle || ""}
                          onChange={(e) =>
                            setNewAdminUser({
                              ...newAdminUser,
                              jobTitle: e.target.value,
                            })
                          }
                          className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">
                          {lang === "ar"
                            ? "صلاحية الوصول ومستوى القسم"
                            : "System Authorization Role"}
                        </label>
                        <select
                          value={newAdminUser.role || ""}
                          onChange={(e) =>
                            setNewAdminUser({
                              ...newAdminUser,
                              role: e.target.value,
                            })
                          }
                          className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                        >
                          <option value="">
                            --{" "}
                            {lang === "ar"
                              ? "اختر الصلاحية المناسبة"
                              : "Select access role"}{" "}
                            --
                          </option>
                          <option value="Employee (Inquiries)">
                            {lang === "ar"
                              ? "موظف - استعلامات (الخدمة الذاتية)"
                              : "Employee (Inquiries) - Self Service Portal"}
                          </option>
                          <option value="HR Manager">
                            {lang === "ar"
                              ? "مدير الموارد البشرية"
                              : "HR Manager"}
                          </option>
                          <option value="Sales Rep">
                            {lang === "ar"
                              ? "مندوب مبيعات - إدخال تسعير وتعديل"
                              : "Sales Rep & Costing"}
                          </option>
                          <option value="Purchasing">
                            {lang === "ar" ? "مندوب مشتريات" : "Purchasing"}
                          </option>
                          <option value="Production">
                            {lang === "ar"
                              ? "فني إنتاج وإحصائيات"
                              : "Production Hub Viewer"}
                          </option>
                          <option value="Admin">
                            {lang === "ar"
                              ? "إداري - وصول كامل"
                              : "General Admin (Full Edit)"}
                          </option>
                          <option value="Senior Management">
                            {lang === "ar"
                              ? "إدارة عليا - وصول كامل"
                              : "Senior Management (Full)"}
                          </option>
                          <option value="Super Admin">
                            {lang === "ar" ? "مشرف فائق النظام" : "Super Admin"}
                          </option>
                        </select>
                      </div>

                      {/* Map to Real Employee list */}
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">
                          {lang === "ar"
                            ? "ربط الحساب بموظف حقيقي"
                            : "Associate with Real Employee"}
                        </label>
                        <select
                          value={newAdminUser.empId || ""}
                          onChange={(e) => {
                            const emp = employees.find(
                              (emp) => emp.id === e.target.value,
                            );
                            setNewAdminUser({
                              ...newAdminUser,
                              empId: e.target.value,
                              jobTitle: emp
                                ? emp.jobTitle
                                : newAdminUser.jobTitle,
                            });
                          }}
                          className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                        >
                          <option value="">
                            --{" "}
                            {lang === "ar"
                              ? "ربط الحساب بموظف (اختياري)"
                              : "Optional: Map to employee"}{" "}
                            --
                          </option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.id} -{" "}
                              {lang === "ar" ? emp.arabicName : emp.englishName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {userCreationError && (
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-medium">
                          ⚠️ {userCreationError}
                        </div>
                      )}

                      {userCreationSuccess && (
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-medium">
                          ✅ {userCreationSuccess}
                        </div>
                      )}

                      <button
                        onClick={handleAddUser}
                        className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-600/10 transition-all flex items-center justify-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>
                          {lang === "ar"
                            ? "تأكيد الحساب على السيرفر"
                            : "Register Account"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Active Registered Accounts grid list */}
                  <div className="lg:col-span-2 glass-panel rounded-3xl p-6 bg-white shadow-xl border border-slate-100 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg text-slate-800">
                          {lang === "ar"
                            ? "🛡️ حسابات النظام والأمن الفعالة"
                            : "🛡️ Registered System Accounts"}
                        </h3>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {lang === "ar"
                            ? "قائمة كاملة بجميع كلمات المرور ومستويات الوصول."
                            : "Modify passwords, access roles, and assign employee IDs."}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs rounded-full font-bold border border-amber-200">
                        {users.length}{" "}
                        {lang === "ar" ? "حسابات نشطة" : "Active Keys"}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400">
                            <th className="py-3 px-2 text-right">
                              {lang === "ar" ? "اسم الحساب" : "Account Name"}
                            </th>
                            <th className="py-3 px-2 text-right">
                              {lang === "ar"
                                ? "المسمى والربط"
                                : "Job / Bound ID"}
                            </th>
                            <th className="py-3 px-2 text-right">
                              {lang === "ar" ? "صلاحية الوصول" : "Role Access"}
                            </th>
                            <th className="py-3 px-1 text-right">
                              {lang === "ar" ? "الرقم السري" : "Password"}
                            </th>
                            <th className="py-3 px-2 text-center">
                              {lang === "ar" ? "خيارات" : "Options"}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((item) => {
                            const isFeras = item.username === "FERAS";
                            return (
                              <tr
                                key={item.username}
                                className="border-b border-slate-50 hover:bg-slate-50/50 transition-all"
                              >
                                <td className="py-3 px-2">
                                  <div className="flex items-center gap-2">
                                    <Lock className="w-3.5 h-3.5 text-rose-500" />
                                    <span className="font-mono font-black text-slate-800 text-xs tracking-wider">
                                      {item.username}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-2 flex flex-col gap-1 items-start">
                                  <input
                                    type="text"
                                    disabled={isFeras}
                                    value={item.jobTitle || ""}
                                    onChange={(e) => {
                                      const updatedValue = e.target.value;
                                      setUsers((prev) =>
                                        prev.map((u) =>
                                          u.username === item.username
                                            ? { ...u, jobTitle: updatedValue }
                                            : u,
                                        ),
                                      );
                                    }}
                                    className={`w-full min-w-[140px] px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-700 focus:bg-white ${isFeras ? "opacity-50" : ""}`}
                                    placeholder={
                                      lang === "ar"
                                        ? "أدخل المسمى الوظيفي"
                                        : "Enter Job Title"
                                    }
                                  />
                                  {item.empId ? (
                                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                      🔗{" "}
                                      {lang === "ar" ? "مرتبط بـ: " : "Bound: "}
                                      {item.empId}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-amber-500 font-bold">
                                      {lang === "ar"
                                        ? "⚠️ غير مرتبط بموظف"
                                        : "⚠️ Unbound"}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-2">
                                  <span className="px-2 py-1 bg-rose-50 text-rose-700 rounded-lg text-[10px] font-bold border border-rose-100 inline-block">
                                    {item.role}
                                  </span>
                                </td>
                                <td className="py-3 px-1">
                                  <input
                                    type="text"
                                    disabled={isFeras}
                                    value={item.password || "1234"}
                                    onChange={(e) => {
                                      const updatedValue = e.target.value;
                                      setUsers((prev) =>
                                        prev.map((u) =>
                                          u.username === item.username
                                            ? { ...u, password: updatedValue }
                                            : u,
                                        ),
                                      );
                                    }}
                                    className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-center text-xs font-mono text-indigo-700 focus:bg-white"
                                  />
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    {!isFeras && (
                                      <button
                                        onClick={() =>
                                          setSelectedUserForPermissions(item)
                                        }
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                                        title={
                                          lang === "ar"
                                            ? "تخصيص الصلاحيات"
                                            : "Permissions"
                                        }
                                      >
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {!isFeras && (
                                      <button
                                        onClick={() =>
                                          handleUpdateUser(item.username, {
                                            role: item.role,
                                            jobTitle: item.jobTitle,
                                            password: item.password,
                                          })
                                        }
                                        className="px-2.5 py-1.5 bg-[#0072BC] hover:bg-sky-700 text-white rounded text-[10px] font-black transition"
                                      >
                                        {lang === "ar" ? "حفظ" : "Save"}
                                      </button>
                                    )}
                                    {!isFeras && (
                                      <button
                                        onClick={() =>
                                          handleDeleteUser(item.username)
                                        }
                                        className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                                        title="Revoke Credentials"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Real-time Login Logs Card */}
                  <div className="lg:col-span-3 glass-panel rounded-3xl p-6 bg-white shadow-xl border border-slate-100 flex flex-col gap-4">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div>
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                          <span>📋 {lang === "ar" ? "سجل حركة تسجيل الدخول والأمن" : "Active Security Login Logs"}</span>
                        </h3>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {lang === "ar"
                            ? "مراقبة فورية لجميع عمليات الدخول باسم المستخدم، عنوان الـ IP، والوقت الدقيق."
                            : "Real-time monitoring of all successful console login entries with source IP."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleReloadLoginLogs}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-bold transition flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{lang === "ar" ? "تحديث السجل" : "Refresh Logs"}</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      {(() => {
                        const totalLogs = loginLogs.length;
                        const totalLogPages = Math.ceil(totalLogs / logPerPage) || 1;
                        const currentLogPage = Math.min(logPage, totalLogPages);
                        const startIndex = (currentLogPage - 1) * logPerPage;
                        const paginatedLogs = loginLogs.slice(startIndex, startIndex + logPerPage);

                        return (
                          <>
                            {totalLogs === 0 ? (
                              <div className="p-8 text-center text-slate-400 text-xs">
                                {lang === "ar" ? "لا توجد سجلات دخول حتى الآن" : "No login records registered yet."}
                              </div>
                            ) : (
                              <>
                                <table className="w-full text-right text-xs">
                                  <thead>
                                    <tr className="border-b border-slate-100 text-slate-400">
                                      <th className="py-3 px-2 text-right">
                                        {lang === "ar" ? "المستخدم" : "User Account"}
                                      </th>
                                      <th className="py-3 px-2 text-right">
                                        {lang === "ar" ? "عنوان IP للجهاز" : "Device IP Address"}
                                      </th>
                                      <th className="py-3 px-2 text-right">
                                        {lang === "ar" ? "التاريخ" : "Date"}
                                      </th>
                                      <th className="py-3 px-2 text-right">
                                        {lang === "ar" ? "الوقت" : "Time"}
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {paginatedLogs.map((logItem) => {
                                      const cleanedUsername = logItem.username ? logItem.username.replace(/\s*\(.*\)\s*/g, "").trim() : "Unknown";
                                      const logDate = logItem.date || (logItem.timestamp ? new Date(logItem.timestamp).toLocaleDateString('en-CA') : "-");
                                      const logTime = logItem.time || (logItem.timestamp ? new Date(logItem.timestamp).toLocaleTimeString('en-US', { hour12: false }) : "-");
                                      return (
                                        <tr
                                          key={logItem.id}
                                          className="border-b border-slate-50 hover:bg-slate-50/50 transition-all font-mono"
                                        >
                                          <td className="py-3 px-2 font-sans font-bold text-slate-800">
                                            <div className="flex items-center gap-2">
                                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                              <span>{cleanedUsername}</span>
                                            </div>
                                          </td>
                                          <td className="py-3 px-2">
                                            <span className="px-2 py-1 bg-sky-50 text-sky-700 font-bold rounded-lg border border-sky-100 text-[10px]">
                                              🌐 {logItem.ipAddress}
                                            </span>
                                          </td>
                                          <td className="py-3 px-2 text-slate-600">
                                            {logDate}
                                          </td>
                                          <td className="py-3 px-2 text-indigo-600 font-semibold">
                                            {logTime}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>

                                {/* Pagination Controls */}
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                                  <div className="flex items-center gap-2">
                                    <span>{lang === "ar" ? "عدد السجلات المعروضة:" : "Rows per page:"}</span>
                                    <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
                                      {[5, 20, 50, 100].map((size) => (
                                        <button
                                          key={size}
                                          type="button"
                                          onClick={() => {
                                            setLogPerPage(size);
                                            setLogPage(1);
                                          }}
                                          className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                                            logPerPage === size
                                              ? "bg-[#0072BC] text-white shadow-sm"
                                              : "text-slate-600 hover:bg-slate-200/50"
                                          }`}
                                        >
                                          {size}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      disabled={currentLogPage === 1}
                                      onClick={() => setLogPage((prev) => Math.max(prev - 1, 1))}
                                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600 transition"
                                    >
                                      {lang === "ar" ? (
                                        <ChevronRight className="w-4 h-4" />
                                      ) : (
                                        <ChevronLeft className="w-4 h-4" />
                                      )}
                                    </button>
                                    
                                    <span className="font-mono">
                                      {lang === "ar"
                                        ? `الصفحة ${currentLogPage} من ${totalLogPages}`
                                        : `Page ${currentLogPage} of ${totalLogPages}`}
                                    </span>

                                    <button
                                      type="button"
                                      disabled={currentLogPage === totalLogPages}
                                      onClick={() => setLogPage((prev) => Math.min(prev + 1, totalLogPages))}
                                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600 transition"
                                    >
                                      {lang === "ar" ? (
                                        <ChevronLeft className="w-4 h-4" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB A: GLOBAL DYNAMIC DASHBOARD */}
            {activeTab === "dashboard" && (
              <div id="content-tab-dashboard" className="space-y-6">
                <MainDashboard
                  user={user}
                  lang={lang}
                  onNavigate={(tab, subTab) => {
                    setActiveTab(tab as any);
                    if (subTab) {
                      if (tab === "hr") setActiveHrSubTab(subTab);
                      else if (tab === "sales") setActiveSalesSubTab(subTab);
                      else if (tab === "production")
                        setActiveProductionSubTab(subTab);
                      else if (tab === "warehouse")
                        setActiveWarehouseSubTab(subTab);
                    }
                  }}
                />
              </div>
            )}

            {/* TAB B: ADVANCED HUMAN RESOURCES DIVISION */}
            {activeTab === "hr" &&
              activeHrSubTab !== "recruitment" &&
              activeHrSubTab !== "documents" && (
                <div id="content-tab-hr" className="space-y-6">
                  <HrSubSections
                    lang={lang}
                    employees={employees}
                    onReloadEmployees={handleReloadEmployees}
                    onDeleteEmployee={async (id) => {
                      setEmployees((prev) => prev.filter((e) => e.id !== id));
                      try {
                        await fetch(`/api/employees/${id}`, {
                          method: "DELETE",
                        });
                        await handleReloadEmployees();
                      } catch (err) {
                        console.error(
                          "Failed to delet employee server-side:",
                          err,
                        );
                      }
                    }}
                    metrics={metrics}
                    clearances={clearances}
                    onReloadClearances={handleReloadClearances}
                    onReloadMetrics={handleReloadMetrics}
                    onInitializeClearance={(emp) => {
                      setSelectedClearanceEmp(emp);
                      setShowClearanceModal(true);
                    }}
                    user={user}
                    onResolveClearanceBlocker={handleResolveClearanceBlocker}
                    activeHRSubTab={activeHrSubTab}
                    setActiveHRSubTab={setActiveHrSubTab}
                  />

                  {/* DEACTIVATED LEGACY MONOLITH: */}
                  {false && (
                    <>
                      {/* Header title controller */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 p-6 rounded-3xl border border-white/50">
                        <div>
                          <h2 className="text-2xl font-black text-[#0072BC]">
                            {lang === "ar"
                              ? "دليل ملفات شؤون الموظفين (HRM)"
                              : "Ultimate HR Master Directory"}
                          </h2>
                          <p className="text-xs text-slate-400 mt-1">
                            {lang === "ar"
                              ? "إدارة عقود عمل العمالة وتوزيع الرواتب والعهد وتنبيهات مستند الإقامة."
                              : "Manage quadruple Arabic names, basic compensation components, custody registers, and visa track limits."}
                          </p>
                        </div>

                        {/* Action to create new employee profile */}
                        <button
                          id="hr-btn-create-employee"
                          onClick={() => {
                            setEditingEmp(null);
                            setShowEmpForm(true);
                          }}
                          className="px-5 py-3 bg-[#0072BC] text-white rounded-2xl text-xs font-bold hover:bg-[#0072BC]/90 flex items-center gap-2 shadow-lg"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>
                            {lang === "ar"
                              ? "إضافة موظف جديد بالملف"
                              : "Enroll New Employee"}
                          </span>
                        </button>
                      </div>

                      {/* 2. ADVANCED REAL-TIME DEEP FILTER COMPONENT */}
                      <div
                        id="hr-deep-filters-box"
                        className="glass-panel p-6 rounded-3xl bg-white/70 space-y-4"
                      >
                        <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                          <Filter className="w-4 h-4 text-[#0072BC]" />
                          <span>
                            {lang === "ar"
                              ? "محرك البحث والتصفية المتقدمة"
                              : "Advanced Real-time Multi-filters"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* TextInput search ID & Names */}
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                              {lang === "ar"
                                ? "بحث بالاسم المربوط أو الرقم الوظيفي"
                                : "Search name / passport / IQ"}
                            </label>
                            <div className="relative">
                              <input
                                id="filter-search-input"
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={
                                  lang === "ar"
                                    ? "الاسم، رقم الهوية أو الإقامة..."
                                    : "Write search key..."
                                }
                                className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0072BC] pr-8"
                              />
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-3" />
                            </div>
                          </div>

                          {/* Filter by Expiry state */}
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                              {lang === "ar"
                                ? "حالة صلاحية وثيقة العمل والمستندات"
                                : "Visa & Document Expiry Status"}
                            </label>
                            <select
                              id="filter-expiry-select"
                              value={expiryFilter}
                              onChange={(e) => setExpiryFilter(e.target.value)}
                              className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                            >
                              <option value="all">
                                {lang === "ar"
                                  ? "كل وثائق العاملين"
                                  : "All Employees"}
                              </option>
                              <option value="near_expiry">
                                {lang === "ar"
                                  ? "مواليد أو إقامات تنتهي قريباً (أقل من سنة)"
                                  : "Expiring in <= 1 Year"}
                              </option>
                            </select>
                          </div>

                          {/* Custody classification filters */}
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                              {lang === "ar"
                                ? "تصفية بنوع العهدة واللوازم"
                                : "Custody Categories"}
                            </label>
                            <select
                              id="filter-custody-select"
                              value={custodyFilter}
                              onChange={(e) => setCustodyFilter(e.target.value)}
                              className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                            >
                              <option value="all">
                                {lang === "ar"
                                  ? "كل أنواع العهد"
                                  : "Any Custody Status"}
                              </option>
                              <option value="laptop">
                                {lang === "ar"
                                  ? "عهدة أجهزة لابتوب"
                                  : "Has Assigned Laptop"}
                              </option>
                              <option value="tools">
                                {lang === "ar"
                                  ? "عهد آلات توصيل ومثاقيب ورش"
                                  : "Has Workshop Tools"}
                              </option>
                              <option value="vehicle">
                                {lang === "ar"
                                  ? "شاحنات نقل وسفاريات"
                                  : "Has Company Vehicle"}
                              </option>
                            </select>
                          </div>

                          {/* Filter specific job title role */}
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                              {lang === "ar"
                                ? "تصفية بالمسمى الفني"
                                : "Filter by Job Role"}
                            </label>
                            <select
                              id="filter-role-select"
                              value={roleFilter}
                              onChange={(e) => setRoleFilter(e.target.value)}
                              className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                            >
                              <option value="">
                                {lang === "ar"
                                  ? "كل المسميات الوظيفية"
                                  : "All Roles Available"}
                              </option>
                              {existingJobTitles.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* 3. SHOW AND EDIT EMPLOYEE MODAL DIALOG */}
                      {showEmpForm && (
                        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
                          <div className="w-full max-w-2xl bg-white rounded-3xl p-8 relative overflow-y-auto max-h-[90vh]">
                            <div className="flex justify-between items-center mb-6">
                              <h3 className="text-lg font-black text-[#0072BC]">
                                {editingEmp
                                  ? lang === "ar"
                                    ? "تعديل ملف الموظف القائم"
                                    : "Update Employee Record"
                                  : lang === "ar"
                                    ? "إنشاء وتسجيل موظف جديد"
                                    : "Enroll New Al-Waleed Staff"}
                              </h3>
                              <button
                                onClick={() => {
                                  setShowEmpForm(false);
                                  setEditingEmp(null);
                                }}
                                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                              >
                                ✕
                              </button>
                            </div>

                            <form
                              onSubmit={handleSaveEmployee}
                              className="space-y-4 text-xs"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block mb-1 font-bold text-slate-500">
                                    {lang === "ar"
                                      ? "الاسم الرباعي الكامل (بالعربية)"
                                      : "Quadruple Name in Arabic"}
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={
                                      editingEmp
                                        ? editingEmp.arabicName
                                        : newEmp.arabicName
                                    }
                                    onChange={(e) =>
                                      editingEmp
                                        ? setEditingEmp({
                                            ...editingEmp,
                                            arabicName: e.target.value,
                                          })
                                        : setNewEmp({
                                            ...newEmp,
                                            arabicName: e.target.value,
                                          })
                                    }
                                    placeholder="أحمد بن عبد الله العتيبي"
                                    className="w-full px-3 py-2 border rounded-xl"
                                  />
                                </div>

                                <div>
                                  <label className="block mb-1 font-bold text-slate-500">
                                    {lang === "ar"
                                      ? "الاسم باللغة الإنجليزية"
                                      : "English Full Name"}
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={
                                      editingEmp
                                        ? editingEmp.englishName
                                        : newEmp.englishName
                                    }
                                    onChange={(e) =>
                                      editingEmp
                                        ? setEditingEmp({
                                            ...editingEmp,
                                            englishName: e.target.value,
                                          })
                                        : setNewEmp({
                                            ...newEmp,
                                            englishName: e.target.value,
                                          })
                                    }
                                    placeholder="Ahmad Al-Otaibi"
                                    className="w-full px-3 py-2 border rounded-xl"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block mb-1 font-bold text-slate-500">
                                    {lang === "ar"
                                      ? "رقم الإقامة أو الهوية"
                                      : "Iqama / National ID"}
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={
                                      editingEmp
                                        ? editingEmp.iqamaId
                                        : newEmp.iqamaId
                                    }
                                    onChange={(e) =>
                                      editingEmp
                                        ? setEditingEmp({
                                            ...editingEmp,
                                            iqamaId: e.target.value,
                                          })
                                        : setNewEmp({
                                            ...newEmp,
                                            iqamaId: e.target.value,
                                          })
                                    }
                                    className="w-full px-3 py-2 border rounded-xl font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block mb-1 font-bold text-slate-500">
                                    {lang === "ar"
                                      ? "رقم جواز السفر الحالي"
                                      : "Passport Details"}
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={
                                      editingEmp
                                        ? editingEmp.passportDetails
                                        : newEmp.passportDetails
                                    }
                                    onChange={(e) =>
                                      editingEmp
                                        ? setEditingEmp({
                                            ...editingEmp,
                                            passportDetails: e.target.value,
                                          })
                                        : setNewEmp({
                                            ...newEmp,
                                            passportDetails: e.target.value,
                                          })
                                    }
                                    className="w-full px-3 py-2 border rounded-xl font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block mb-1 font-bold text-slate-500">
                                    {lang === "ar"
                                      ? "القسم التنظيمي"
                                      : "Department Assignment"}
                                  </label>
                                  <select
                                    value={
                                      editingEmp
                                        ? editingEmp.department
                                        : newEmp.department
                                    }
                                    onChange={(e) =>
                                      editingEmp
                                        ? setEditingEmp({
                                            ...editingEmp,
                                            department: e.target.value,
                                          })
                                        : setNewEmp({
                                            ...newEmp,
                                            department: e.target.value,
                                          })
                                    }
                                    className="w-full px-3 py-2 border rounded-xl"
                                  >
                                    <option value="Neon Fabrication">
                                      Neon Fabrication / تفريغ وتوصيل نيون
                                    </option>
                                    <option value="Sales & Client Relations">
                                      Sales & ERP Administration / المبيعات
                                      والتحصيل
                                    </option>
                                    <option value="Human Resources">
                                      Human Resources / الموارد البشرية
                                    </option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block mb-1 font-bold text-slate-500">
                                    {lang === "ar"
                                      ? "المسمى الوظيفي المعتمد"
                                      : "Corporate Job Title"}
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={
                                      editingEmp
                                        ? editingEmp.jobTitle
                                        : newEmp.jobTitle
                                    }
                                    onChange={(e) =>
                                      editingEmp
                                        ? setEditingEmp({
                                            ...editingEmp,
                                            jobTitle: e.target.value,
                                          })
                                        : setNewEmp({
                                            ...newEmp,
                                            jobTitle: e.target.value,
                                          })
                                    }
                                    className="w-full px-3 py-2 border rounded-xl"
                                  />
                                </div>
                                <div>
                                  <label className="block mb-1 font-bold text-slate-500">
                                    {lang === "ar"
                                      ? "المرتبة والدرجة الوظيفية"
                                      : "Grade Ladder"}
                                  </label>
                                  <input
                                    type="text"
                                    value={
                                      editingEmp
                                        ? editingEmp.grade
                                        : newEmp.grade
                                    }
                                    onChange={(e) =>
                                      editingEmp
                                        ? setEditingEmp({
                                            ...editingEmp,
                                            grade: e.target.value,
                                          })
                                        : setNewEmp({
                                            ...newEmp,
                                            grade: e.target.value,
                                          })
                                    }
                                    className="w-full px-3 py-2 border rounded-xl"
                                  />
                                </div>
                                <div>
                                  <label className="block mb-1 font-bold text-slate-500">
                                    {lang === "ar"
                                      ? "الأجر والراتب الأساسي (ريال سعودي)"
                                      : "Basic Monthly Salary (SAR)"}
                                  </label>
                                  <input
                                    type="number"
                                    required
                                    value={
                                      editingEmp
                                        ? editingEmp.basicSalary
                                        : newEmp.basicSalary
                                    }
                                    onChange={(e) =>
                                      editingEmp
                                        ? setEditingEmp({
                                            ...editingEmp,
                                            basicSalary: Number(e.target.value),
                                          })
                                        : setNewEmp({
                                            ...newEmp,
                                            basicSalary: Number(e.target.value),
                                          })
                                    }
                                    className="w-full px-3 py-2 border rounded-xl font-mono"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block mb-1 font-bold text-slate-300">
                                    {lang === "ar"
                                      ? "بدل سكن تأميني شهري"
                                      : "Housing Allowance (SAR)"}
                                  </label>
                                  <input
                                    type="number"
                                    value={
                                      editingEmp
                                        ? editingEmp.allowances.housing
                                        : newEmp.allowances?.housing
                                    }
                                    onChange={(e) => {
                                      editingEmp
                                        ? setEditingEmp({
                                            ...editingEmp,
                                            allowances: {
                                              ...editingEmp.allowances,
                                              housing: Number(e.target.value),
                                            },
                                          })
                                        : setNewEmp({
                                            ...newEmp,
                                            allowances: {
                                              ...newEmp.allowances!,
                                              housing: Number(e.target.value),
                                            },
                                          });
                                    }}
                                    className="w-full px-3 py-2 border rounded-xl font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block mb-1 font-bold text-slate-300">
                                    {lang === "ar"
                                      ? "بدل سفر وانتقال"
                                      : "Transport Allowance (SAR)"}
                                  </label>
                                  <input
                                    type="number"
                                    value={
                                      editingEmp
                                        ? editingEmp.allowances.transport
                                        : newEmp.allowances?.transport
                                    }
                                    onChange={(e) => {
                                      editingEmp
                                        ? setEditingEmp({
                                            ...editingEmp,
                                            allowances: {
                                              ...editingEmp.allowances,
                                              transport: Number(e.target.value),
                                            },
                                          })
                                        : setNewEmp({
                                            ...newEmp,
                                            allowances: {
                                              ...newEmp.allowances!,
                                              transport: Number(e.target.value),
                                            },
                                          });
                                    }}
                                    className="w-full px-3 py-2 border rounded-xl font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block mb-1 font-bold text-slate-300">
                                    {lang === "ar"
                                      ? "بدل اتصالات وجوال ورش"
                                      : "Phone Allowance (SAR)"}
                                  </label>
                                  <input
                                    type="number"
                                    value={
                                      editingEmp
                                        ? editingEmp.allowances.phone
                                        : newEmp.allowances?.phone
                                    }
                                    onChange={(e) => {
                                      editingEmp
                                        ? setEditingEmp({
                                            ...editingEmp,
                                            allowances: {
                                              ...editingEmp.allowances,
                                              phone: Number(e.target.value),
                                            },
                                          })
                                        : setNewEmp({
                                            ...newEmp,
                                            allowances: {
                                              ...newEmp.allowances!,
                                              phone: Number(e.target.value),
                                            },
                                          });
                                    }}
                                    className="w-full px-3 py-2 border rounded-xl font-mono"
                                  />
                                </div>
                              </div>

                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-250/60 space-y-3">
                                <p className="font-bold text-xs text-[#0072BC]">
                                  📦{" "}
                                  {lang === "ar"
                                    ? "سجل عهَد ومستلزمات الموظف"
                                    : "Custody Items & Logistics Handover"}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <input
                                      type="text"
                                      placeholder={
                                        lang === "ar"
                                          ? "طراز الحاسب المحمول"
                                          : "Laptop details"
                                      }
                                      value={
                                        editingEmp
                                          ? editingEmp.custody.laptop
                                          : newEmp.custody?.laptop
                                      }
                                      onChange={(e) => {
                                        editingEmp
                                          ? setEditingEmp({
                                              ...editingEmp,
                                              custody: {
                                                ...editingEmp.custody,
                                                laptop: e.target.value,
                                              },
                                            })
                                          : setNewEmp({
                                              ...newEmp,
                                              custody: {
                                                ...newEmp.custody!,
                                                laptop: e.target.value,
                                              },
                                            });
                                      }}
                                      className="w-full px-3 py-2 border rounded-xl font-sans"
                                    />
                                  </div>
                                  <div>
                                    <input
                                      type="text"
                                      placeholder={
                                        lang === "ar"
                                          ? "حقيبة أدوات التشكيل"
                                          : "Tool kits assigned"
                                      }
                                      value={
                                        editingEmp
                                          ? editingEmp.custody.tools
                                          : newEmp.custody?.tools
                                      }
                                      onChange={(e) => {
                                        editingEmp
                                          ? setEditingEmp({
                                              ...editingEmp,
                                              custody: {
                                                ...editingEmp.custody,
                                                tools: e.target.value,
                                              },
                                            })
                                          : setNewEmp({
                                              ...newEmp,
                                              custody: {
                                                ...newEmp.custody!,
                                                tools: e.target.value,
                                              },
                                            });
                                      }}
                                      className="w-full px-3 py-2 border rounded-xl"
                                    />
                                  </div>
                                  <div>
                                    <input
                                      type="text"
                                      placeholder={
                                        lang === "ar"
                                          ? "رقم شاحنة التوصيل"
                                          : "Vehicle description"
                                      }
                                      value={
                                        editingEmp
                                          ? editingEmp.custody.vehicles
                                          : newEmp.custody?.vehicles
                                      }
                                      onChange={(e) => {
                                        editingEmp
                                          ? setEditingEmp({
                                              ...editingEmp,
                                              custody: {
                                                ...editingEmp.custody,
                                                vehicles: e.target.value,
                                              },
                                            })
                                          : setNewEmp({
                                              ...newEmp,
                                              custody: {
                                                ...newEmp.custody!,
                                                vehicles: e.target.value,
                                              },
                                            });
                                      }}
                                      className="w-full px-3 py-2 border rounded-xl"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block mb-1 font-bold text-slate-500">
                                    {lang === "ar"
                                      ? "تاريخ الميلاد الموثق"
                                      : "Birth Date"}
                                  </label>
                                  <input
                                    type="date"
                                    required
                                    value={
                                      editingEmp
                                        ? editingEmp.birthDate
                                        : newEmp.birthDate
                                    }
                                    onChange={(e) =>
                                      editingEmp
                                        ? setEditingEmp({
                                            ...editingEmp,
                                            birthDate: e.target.value,
                                          })
                                        : setNewEmp({
                                            ...newEmp,
                                            birthDate: e.target.value,
                                          })
                                    }
                                    className="w-full px-3 py-2 border rounded-xl"
                                  />
                                </div>
                                <div>
                                  <label className="block mb-1 font-bold text-slate-500">
                                    {lang === "ar"
                                      ? "تاريخ المباشرة للعمل"
                                      : "Date of Joining"}
                                  </label>
                                  <input
                                    type="date"
                                    required
                                    value={
                                      editingEmp
                                        ? editingEmp.dateOfJoining
                                        : newEmp.dateOfJoining
                                    }
                                    onChange={(e) =>
                                      editingEmp
                                        ? setEditingEmp({
                                            ...editingEmp,
                                            dateOfJoining: e.target.value,
                                          })
                                        : setNewEmp({
                                            ...newEmp,
                                            dateOfJoining: e.target.value,
                                          })
                                    }
                                    className="w-full px-3 py-2 border rounded-xl"
                                  />
                                </div>
                                <div>
                                  <label className="block mb-1 font-bold text-slate-500">
                                    {lang === "ar"
                                      ? "تاريخ انتهاء عقد العمل / الإقامة"
                                      : "Contract/Visa Expiry"}
                                  </label>
                                  <input
                                    type="date"
                                    required
                                    value={
                                      editingEmp
                                        ? editingEmp.contractExpiry
                                        : newEmp.contractExpiry
                                    }
                                    onChange={(e) =>
                                      editingEmp
                                        ? setEditingEmp({
                                            ...editingEmp,
                                            contractExpiry: e.target.value,
                                          })
                                        : setNewEmp({
                                            ...newEmp,
                                            contractExpiry: e.target.value,
                                          })
                                    }
                                    className="w-full px-3 py-2 border rounded-xl"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block mb-1 font-bold text-slate-500">
                                    {lang === "ar"
                                      ? "تاريخ انتهاء الإقامة (Iqama)"
                                      : "Iqama Expiry Date"}
                                  </label>
                                  <input
                                    type="date"
                                    value={
                                      editingEmp
                                        ? (editingEmp.iqamaExpiryDate || "")
                                        : (newEmp.iqamaExpiryDate || "")
                                    }
                                    onChange={(e) =>
                                      editingEmp
                                        ? setEditingEmp({
                                            ...editingEmp,
                                            iqamaExpiryDate: e.target.value,
                                          })
                                        : setNewEmp({
                                            ...newEmp,
                                            iqamaExpiryDate: e.target.value,
                                          })
                                    }
                                    className="w-full px-3 py-2 border rounded-xl font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block mb-1 font-bold text-slate-500">
                                    {lang === "ar"
                                      ? "تاريخ انتهاء جواز السفر"
                                      : "Passport Expiry Date"}
                                  </label>
                                  <input
                                    type="date"
                                    value={
                                      editingEmp
                                        ? (editingEmp.passportExpiryDate || "")
                                        : (newEmp.passportExpiryDate || "")
                                    }
                                    onChange={(e) =>
                                      editingEmp
                                        ? setEditingEmp({
                                            ...editingEmp,
                                            passportExpiryDate: e.target.value,
                                          })
                                        : setNewEmp({
                                            ...newEmp,
                                            passportExpiryDate: e.target.value,
                                          })
                                    }
                                    className="w-full px-3 py-2 border rounded-xl font-mono"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block mb-1 font-bold text-slate-500">
                                  {lang === "ar"
                                    ? "العنوان الوطني التفصيلي"
                                    : "Residence Address"}
                                </label>
                                <input
                                  type="text"
                                  value={
                                    editingEmp
                                      ? editingEmp.homeAddress
                                      : newEmp.homeAddress
                                  }
                                  onChange={(e) =>
                                    editingEmp
                                      ? setEditingEmp({
                                          ...editingEmp,
                                          homeAddress: e.target.value,
                                        })
                                      : setNewEmp({
                                          ...newEmp,
                                          homeAddress: e.target.value,
                                        })
                                  }
                                  placeholder="E.g., District Name"
                                  className="w-full px-3 py-2 border rounded-xl"
                                />
                              </div>

                              <div className="flex gap-2 justify-end pt-4">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowEmpForm(false);
                                    setEditingEmp(null);
                                  }}
                                  className="px-4 py-2 bg-slate-100 rounded-xl"
                                >
                                  {lang === "ar" ? "إلغاء" : "Cancel"}
                                </button>
                                <button
                                  type="submit"
                                  className="px-6 py-2 bg-[#0072BC] text-white rounded-xl font-bold shadow-md"
                                >
                                  {lang === "ar"
                                    ? "حفظ ملف العامل 💾"
                                    : "Save Employee Profile"}
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}

                      {/* LIVE WORKFORCE TELEMETRY SUMMARY MATRIX */}
                      {metrics && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-white/50">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                {lang === "ar"
                                  ? "إجمالي قوة العمل الفعالة"
                                  : "Total Workforce Active"}
                              </span>
                              <h4 className="text-2xl font-black text-[#0072BC] font-mono mt-1">
                                {metrics.workforce.totalActiveStaff}
                              </h4>
                            </div>
                            <div className="flex gap-2 text-[10px] text-slate-400 mt-2 font-mono">
                              <span>
                                🇸🇦 Saudi: {metrics.workforce.saudiNationals}
                              </span>
                              <span>•</span>
                              <span>
                                🌍 Expat: {metrics.workforce.expatNationals}
                              </span>
                            </div>
                          </div>

                          <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                  {lang === "ar"
                                    ? "معدل التوطين (البلاتيني)"
                                    : "Saudization Ratio"}
                                </span>
                                <span className="text-[8px] bg-emerald-500/20 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded-full">
                                  {metrics.compliance.saudizationNitaqatGrade}
                                </span>
                              </div>
                              <h4 className="text-2xl font-black text-emerald-600 font-mono mt-1">
                                {metrics.compliance.saudizationPercentage}%
                              </h4>
                            </div>
                            <p className="text-[9px] text-[#0072BC] font-semibold mt-2">
                              {lang === "ar"
                                ? "متوافق مع نطاقات الموارد البشرية"
                                : "WPS & Nitaqat Compliant"}
                            </p>
                          </div>

                          <div className="p-4 bg-rose-50/40 rounded-2xl border border-rose-100 flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">
                                {lang === "ar"
                                  ? "الإقامات الحرجة والانتهاء"
                                  : "Document Alerts"}
                              </span>
                              <h4 className="text-2xl font-black text-rose-600 font-mono mt-1">
                                {metrics.actionsRoom
                                  .criticalDocumentExpirations30Days
                                  .iqamasExpired +
                                  metrics.actionsRoom
                                    .criticalDocumentExpirations30Days
                                    .passportsRenewalsNeeded}
                              </h4>
                            </div>
                            <p className="text-[9px] text-rose-500 mt-2">
                              {lang === "ar"
                                ? `⚠️ إقامات منتهية: ${metrics.actionsRoom.criticalDocumentExpirations30Days.iqamasExpired}`
                                : `⚠️ Critical exp: ${metrics.actionsRoom.criticalDocumentExpirations30Days.iqamasExpired}`}
                            </p>
                          </div>

                          <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest font-mono">
                                {lang === "ar"
                                  ? "مسودة الأجور الشهرية WPS"
                                  : "Monthly Payroll (WPS)"}
                              </span>
                              <h4 className="text-base font-black text-white font-mono mt-1">
                                SAR{" "}
                                {metrics.financialBurnAnnualProjection.currentMonthWPSPayrollTotal.toLocaleString(
                                  undefined,
                                  { maximumFractionDigits: 0 },
                                )}
                              </h4>
                            </div>
                            <div className="flex justify-between items-center text-[9px] text-slate-400 mt-2">
                              <span>Loans Active:</span>
                              <span className="font-mono text-[#00AEEF]">
                                SAR{" "}
                                {metrics.financialBurnAnnualProjection.pendingApprovedLoansActiveVal.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TERMINAL CUSTODY CLEARANCES & OFFBOARDING */}
                      <div className="glass-panel p-6 rounded-3xl bg-white/70 space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-black text-sm text-[#0072BC] flex items-center gap-2">
                            <span>👋</span>
                            {lang === "ar"
                              ? "مسارات إخلاء الطرف وإغلاق ذمم العهد"
                              : "Terminal Custody Clearance & Offboarding Matrix"}
                          </h3>
                          <span className="text-[10px] bg-slate-200 text-slate-600 font-mono px-2 py-0.5 rounded font-extrabold uppercase">
                            {clearances.length} Active processes
                          </span>
                        </div>

                        {clearances.length === 0 ? (
                          <p className="text-xs text-slate-400 leading-relaxed py-4 text-center">
                            {lang === "ar"
                              ? "لا توجد طلبات إخلاء طرف قيد التنفيذ حالياً."
                              : "No active personnel clearances in process."}
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {clearances.map((clr) => {
                              const clrEmp = employees.find(
                                (e) => e.id === clr.employeeId,
                              );
                              const isAllCleared =
                                clr.isFullyCertifiedCleared ||
                                (!clr.checkpointBlockers
                                  .pendingVehiclesHandover &&
                                  !clr.checkpointBlockers.pendingITHandover &&
                                  !clr.checkpointBlockers
                                    .pendingToolkitsHandover);
                              return (
                                <div
                                  key={clr.clearanceId}
                                  className="p-5 bg-white border border-slate-100 rounded-2xl space-y-3 relative hover:shadow-md transition-all"
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-bold text-sm text-slate-800">
                                        {clrEmp
                                          ? lang === "ar"
                                            ? clrEmp.arabicName
                                            : clrEmp.englishName
                                          : `ID: ${clr.employeeId}`}
                                      </h4>
                                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                        {clr.clearanceId} | Code:{" "}
                                        {clr.reasonCategory}
                                      </p>
                                    </div>
                                    <span
                                      className={`px-2 py-0.5 rounded text-[8px] font-extrabold font-mono ${isAllCleared ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-rose-100 text-rose-800 animate-pulse"}`}
                                    >
                                      {isAllCleared
                                        ? lang === "ar"
                                          ? "مكتمل المصادقة"
                                          : "CERTIFIED"
                                        : lang === "ar"
                                          ? "معلّق بالعهد"
                                          : "CUSTODY BLOCK"}
                                    </span>
                                  </div>

                                  <p className="text-[11px] text-slate-600 line-clamp-1 italic">
                                    "{clr.detailedJustification}"
                                  </p>

                                  <div className="border-t border-slate-50 pt-3 space-y-2">
                                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                                      {lang === "ar"
                                        ? "قائمة الفحص والموافقات الثلاثية"
                                        : "Three-tier blocker checklists"}
                                    </p>

                                    <div className="grid grid-cols-3 gap-2">
                                      {/* Vehicles Check */}
                                      <button
                                        disabled={
                                          !clr.checkpointBlockers
                                            .pendingVehiclesHandover
                                        }
                                        onClick={() =>
                                          handleResolveClearanceBlocker(
                                            clr.clearanceId,
                                            "vehicles",
                                          )
                                        }
                                        className={`p-2 rounded-xl text-center transition-all flex flex-col items-center justify-center border text-[9px] ${clr.checkpointBlockers.pendingVehiclesHandover ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 border-emerald-200 cursor-not-allowed"}`}
                                      >
                                        <span>🛻 Fleet</span>
                                        <span className="font-bold mt-0.5">
                                          {clr.checkpointBlockers
                                            .pendingVehiclesHandover
                                            ? lang === "ar"
                                              ? "تخليص 🔓"
                                              : "Pending 🔓"
                                            : "Cleared ✅"}
                                        </span>
                                      </button>

                                      {/* IT check */}
                                      <button
                                        disabled={
                                          !clr.checkpointBlockers
                                            .pendingITHandover
                                        }
                                        onClick={() =>
                                          handleResolveClearanceBlocker(
                                            clr.clearanceId,
                                            "it",
                                          )
                                        }
                                        className={`p-2 rounded-xl text-center transition-all flex flex-col items-center justify-center border text-[9px] ${clr.checkpointBlockers.pendingITHandover ? "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100" : "bg-emerald-50 text-emerald-700 border-emerald-200 cursor-not-allowed"}`}
                                      >
                                        <span>💻 IT Assets</span>
                                        <span className="font-bold mt-0.5">
                                          {clr.checkpointBlockers
                                            .pendingITHandover
                                            ? lang === "ar"
                                              ? "تخليص 🔓"
                                              : "Pending 🔓"
                                            : "Cleared ✅"}
                                        </span>
                                      </button>

                                      {/* Workshop Tools */}
                                      <button
                                        disabled={
                                          !clr.checkpointBlockers
                                            .pendingToolkitsHandover
                                        }
                                        onClick={() =>
                                          handleResolveClearanceBlocker(
                                            clr.clearanceId,
                                            "tools",
                                          )
                                        }
                                        className={`p-2 rounded-xl text-center transition-all flex flex-col items-center justify-center border text-[9px] ${clr.checkpointBlockers.pendingToolkitsHandover ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" : "bg-emerald-50 text-emerald-700 border-emerald-200 cursor-not-allowed"}`}
                                      >
                                        <span>🔧 Toolkits</span>
                                        <span className="font-bold mt-0.5">
                                          {clr.checkpointBlockers
                                            .pendingToolkitsHandover
                                            ? lang === "ar"
                                              ? "تخليص 🔓"
                                              : "Pending 🔓"
                                            : "Cleared ✅"}
                                        </span>
                                      </button>
                                    </div>
                                  </div>

                                  <div className="bg-slate-55 flex justify-between items-center text-[9px] font-mono text-slate-400 p-2 rounded-lg mt-1 border border-slate-100">
                                    <span>
                                      Settle: {clr.scheduledFinalSettleDate}
                                    </span>
                                    <span
                                      className="truncate max-w-[150px]"
                                      title={clr.auditSecurityHash}
                                    >
                                      {clr.auditSecurityHash}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* INITIALIZE CLEARANCE MODAL */}
                      {showClearanceModal && selectedClearanceEmp && (
                        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
                          <div className="w-full max-w-lg bg-white rounded-3xl p-8 relative">
                            <div className="flex justify-between items-center mb-6">
                              <h3 className="text-base font-black text-[#0072BC]">
                                {lang === "ar"
                                  ? "بدء إجراءات إخلاء طرف الموظف"
                                  : "Initialize Offboarding Clearance"}
                              </h3>
                              <button
                                onClick={() => {
                                  setShowClearanceModal(false);
                                  setSelectedClearanceEmp(null);
                                }}
                                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                              >
                                ✕
                              </button>
                            </div>

                            <form
                              onSubmit={handleInitializeClearance}
                              className="space-y-4 text-xs font-sans"
                            >
                              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                <p className="font-bold text-slate-700">
                                  {lang === "ar"
                                    ? "الموظف المستهدف:"
                                    : "Offboarding Employee:"}
                                </p>
                                <p className="text-sm font-black text-[#0072BC] mt-0.5">
                                  {selectedClearanceEmp.arabicName} (
                                  {selectedClearanceEmp.englishName})
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  {selectedClearanceEmp.id} | Department:{" "}
                                  {selectedClearanceEmp.department}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block mb-1 font-bold text-slate-500">
                                    {lang === "ar"
                                      ? "تاريخ بدء الفحص"
                                      : "Commencement Date"}
                                  </label>
                                  <input
                                    type="date"
                                    required
                                    value={clearanceForm.commenceDate}
                                    onChange={(e) =>
                                      setClearanceForm({
                                        ...clearanceForm,
                                        commenceDate: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border rounded-xl"
                                  />
                                </div>

                                <div>
                                  <label className="block mb-1 font-bold text-slate-500">
                                    {lang === "ar"
                                      ? "سبب إنهاء العلاقة"
                                      : "Termination Reason"}
                                  </label>
                                  <select
                                    value={clearanceForm.reasonCategory}
                                    onChange={(e) =>
                                      setClearanceForm({
                                        ...clearanceForm,
                                        reasonCategory: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border rounded-xl bg-white text-slate-800"
                                  >
                                    <option value="CONTRACT_EXPIRATION">
                                      Contract Expiration / انتهاء مدة عقد العمل
                                    </option>
                                    <option value="VOLUNTARY_RESIGNATION">
                                      Voluntary Resignation / استقالة اختيارية
                                      بالطلب
                                    </option>
                                    <option value="UNILATERAL_DISMISSAL">
                                      Unilateral Dismissal / إنهاء من جانب
                                      المنشأة
                                    </option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block mb-1 font-bold text-slate-500">
                                  {lang === "ar"
                                    ? "شرح المسببات والبيانات الإضافية"
                                    : "Detailed Offboarding Explanation"}
                                </label>
                                <textarea
                                  value={clearanceForm.detailedJustification}
                                  onChange={(e) =>
                                    setClearanceForm({
                                      ...clearanceForm,
                                      detailedJustification: e.target.value,
                                    })
                                  }
                                  placeholder={
                                    lang === "ar"
                                      ? "تفاصيل عهر تسليم المركبات أو معدات التشكيل المستردة..."
                                      : "e.g. Expatriate package completed without further extension."
                                  }
                                  rows={3}
                                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-[#0072BC]"
                                />
                              </div>

                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2">
                                <p className="font-bold text-slate-705">
                                  {lang === "ar"
                                    ? "الموقعين والمصادقة الأمنية المعتمدة"
                                    : "Assigned Signatories Workflow"}
                                </p>
                                <div className="space-y-1 text-[10px] text-slate-500 font-mono">
                                  <p>
                                    🚚 Fleet Control:{" "}
                                    <strong>
                                      {clearanceForm.fleetManager}
                                    </strong>
                                  </p>
                                  <p>
                                    💻 IT Director Check:{" "}
                                    <strong>{clearanceForm.itDirector}</strong>
                                  </p>
                                  <p>
                                    🔧 Warehouse Gate:{" "}
                                    <strong>
                                      {clearanceForm.warehouseController}
                                    </strong>
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-2 justify-end pt-4">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowClearanceModal(false);
                                    setSelectedClearanceEmp(null);
                                  }}
                                  className="px-4 py-2 bg-slate-100 rounded-xl"
                                >
                                  {lang === "ar" ? "إلغاء" : "Cancel"}
                                </button>
                                <button
                                  type="submit"
                                  className="px-6 py-2 bg-[#0072BC] text-white rounded-xl font-bold shadow-md"
                                >
                                  {lang === "ar"
                                    ? "إطلاق إخلاء الطرف 🚀"
                                    : "Initialize Offboarding 🚀"}
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}

                      {/* 4. HIGH END CUSTODY DIRECTORY CARDS GRID AND STATS TABLE */}
                      <div id="hr-master-records-wrapper" className="space-y-4">
                        {/* Visual list and grid layout */}
                        <div className="glass-panel p-6 rounded-3xl bg-white/70 overflow-hidden">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-black text-sm text-[#0072BC] uppercase tracking-wider">
                              {lang === "ar"
                                ? "قائمة تفصيل الكوادر الفنية والمكتبية"
                                : "Al-Waleed Staff Master Listing"}
                            </h4>
                            <span className="text-xs bg-cyan-100 text-[#0072BC] px-3 py-1 rounded-full font-bold">
                              {filteredEmployees.length}{" "}
                              {lang === "ar"
                                ? "مطابق للبحث الفعلي"
                                : "Matching staff records"}
                            </span>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-right md:text-right font-sans">
                              <thead>
                                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider">
                                  <th className="pb-3 text-right">
                                    {lang === "ar"
                                      ? "ملف الموظف والهوية"
                                      : "EMPLOYEE"}
                                  </th>
                                  <th className="pb-3 text-right">
                                    {lang === "ar"
                                      ? "المسمى والقسم"
                                      : "JOB & DEPT"}
                                  </th>
                                  <th className="pb-3 text-right">
                                    {lang === "ar"
                                      ? "الراتب والبدلات"
                                      : "COMPENSATIONS"}
                                  </th>
                                  <th className="pb-3 text-right font-mono">
                                    {lang === "ar" ? "رقم الإقامة" : "IQAMA ID"}
                                  </th>
                                  <th className="pb-3 text-right">
                                    {lang === "ar"
                                      ? "عقود / عهد نشطة"
                                      : "ACTIVE CUSTODY"}
                                  </th>
                                  <th className="pb-3 text-left">
                                    {lang === "ar" ? "إجراءات" : "ACTIONS"}
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {filteredEmployees.map((emp) => {
                                  const totalSalary =
                                    emp.basicSalary +
                                    emp.allowances.housing +
                                    emp.allowances.transport +
                                    emp.allowances.phone;
                                  return (
                                    <tr
                                      key={emp.id}
                                      className="hover:bg-slate-50/80 transition-colors"
                                    >
                                      {/* Employee card group */}
                                      <td className="py-2">
                                        <div>
                                          <p className="font-bold text-slate-800 text-sm">
                                            {emp.arabicName}
                                          </p>
                                          <p className="text-[10px] text-slate-400 font-mono tracking-wider">
                                            {emp.englishName} | {emp.id}
                                          </p>
                                        </div>
                                      </td>

                                      {/* Role and department */}
                                      <td className="py-2 text-slate-800 font-semibold p-1">
                                        <p>{emp.jobTitle}</p>
                                        <p className="text-[9px] text-cyan-600 font-bold uppercase">
                                          {emp.department}
                                        </p>
                                      </td>

                                      {/* Financial break downs */}
                                      <td className="py-2 font-mono p-1">
                                        <p className="font-extrabold text-[#0072BC]">
                                          SAR {totalSalary.toLocaleString()}
                                        </p>
                                        <p className="text-[8px] text-slate-400">
                                          Basic: {emp.basicSalary} | Allaw:{" "}
                                          {emp.allowances.housing +
                                            emp.allowances.transport +
                                            emp.allowances.phone}
                                        </p>
                                      </td>

                                      {/* Iqama status info */}
                                      <td className="py-2 text-slate-600 font-mono text-[11px] p-1">
                                        {emp.iqamaId}
                                      </td>

                                      {/* Custody tags indicators */}
                                      <td className="py-2 text-slate-700">
                                        <div className="flex flex-wrap gap-1">
                                          {emp.custody.laptop && (
                                            <span
                                              className="px-1.5 py-0.5 bg-sky-100 text-sky-850 text-[9px] rounded font-bold"
                                              title={emp.custody.laptop}
                                            >
                                              💻 Laptop
                                            </span>
                                          )}
                                          {emp.custody.tools && (
                                            <span
                                              className="px-1.5 py-0.5 bg-indigo-100 text-indigo-850 text-[9px] rounded font-bold"
                                              title={emp.custody.tools}
                                            >
                                              🔧 Tools
                                            </span>
                                          )}
                                          {emp.custody.vehicles && (
                                            <span
                                              className="px-1.5 py-0.5 bg-emerald-100 text-emerald-850 text-[9px] rounded font-bold"
                                              title={emp.custody.vehicles}
                                            >
                                              🛻 Vehicle: {emp.custody.vehicles}
                                            </span>
                                          )}
                                          {!emp.custody.laptop &&
                                            !emp.custody.tools &&
                                            !emp.custody.vehicles && (
                                              <span className="text-[9px] text-slate-400">
                                                None
                                              </span>
                                            )}
                                        </div>
                                      </td>

                                      {/* Action buttons */}
                                      <td className="py-2 text-left">
                                        <div className="flex items-center gap-1 justify-end">
                                          <button
                                            onClick={() => {
                                              setActiveTab("documents");
                                            }}
                                            className="p-1 px-1.5 bg-blue-50 text-[#0072BC] hover:bg-blue-100 rounded font-bold text-[10px]"
                                            title="Generate Salary Certificate"
                                          >
                                            📄 Cert
                                          </button>
                                          <button
                                            onClick={() => {
                                              setSelectedClearanceEmp(emp);
                                              setShowClearanceModal(true);
                                            }}
                                            className="p-1 px-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded font-bold text-[10px]"
                                            title="Initialize Exit Clearance"
                                          >
                                            👋 Exit
                                          </button>
                                          <button
                                            onClick={() => {
                                              setEditingEmp(emp);
                                              setShowEmpForm(true);
                                            }}
                                            className="p-1.5 text-stone-500 hover:text-[#0072BC] hover:bg-slate-100 rounded"
                                            title="Edit details"
                                          >
                                            📝
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleDeleteEmployee(emp.id)
                                            }
                                            className="p-1.5 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded"
                                            title="Instantly terminate"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

            {/* TAB C: INTELLIGENT AI RECRUITMENT ENGINE */}
            {activeTab === "hr" && activeHrSubTab === "recruitment" && (
              <div id="content-tab-recruitment" className="space-y-6">
                {/* AI Intro card */}
                <div className="glass-panel rounded-3xl p-6 bg-white/70 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="p-3 bg-gradient-to-tr from-[#00AEEF]/20 to-[#0072BC]/20 text-cyan-600 rounded-2xl">
                      <Sparkles className="w-8 h-8 text-amber-500 animate-spin" />
                    </span>
                    <div>
                      <h2 className="text-xl font-black text-[#0072BC]">
                        {lang === "ar"
                          ? "مخطط الكفاءات ومطابقة الميزانية بالذكاء"
                          : "Gemini AI Recruiting & Salary Ladder Planner"}
                      </h2>
                      <p className="text-xs text-slate-400">
                        {lang === "ar"
                          ? "استشِر نموذج جيميناي 3.5 فلاش لملء الهياكل التنظيمية لورش وتركيبات اللوحات الإعلانية والمشاريع الكبرى."
                          : "Inquire Gemini AI helper for instant career path mapping, monthly budget simulation, and specialized responsibilities."}
                      </p>
                    </div>
                  </div>

                  {/* Input search selection */}
                  <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-2xl flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full space-y-1">
                      <label className="text-[10px] text-cyan-400 font-bold uppercase">
                        {lang === "ar"
                          ? "المسمى الوظيفي المستهدف للدراسة"
                          : "Target Recuritment Title Designation"}
                      </label>
                      <input
                        id="ai-job-title-input"
                        type="text"
                        value={aiJobTitle}
                        onChange={(e) => setAiJobTitle(e.target.value)}
                        placeholder="e.g. Senior Neon Fabrication Expert"
                        className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#00AEEF]"
                      />
                    </div>
                    <button
                      id="ai-btn-generate"
                      onClick={handleAiRecruitGenerate}
                      disabled={aiLoading}
                      className="w-full md:w-auto px-6 py-4 bg-[#00AEEF] hover:bg-[#0072BC] text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all self-end shadow-lg"
                    >
                      {aiLoading
                        ? lang === "ar"
                          ? "جاري تحليل الهياكل..."
                          : "Planning metrics..."
                        : lang === "ar"
                          ? "توليد الهيكل التنظيمي ✨"
                          : "Generate Matrix ✨"}
                    </button>
                  </div>

                  {/* Budget verification output */}
                  {budgetCheckInfo && (
                    <div className="p-4 bg-white border border-cyan-100 rounded-2xl flex items-center gap-3">
                      <span className="text-lg">💰</span>
                      <p className="text-xs font-bold text-slate-700">
                        {budgetCheckInfo}
                      </p>
                    </div>
                  )}

                  {/* Dynamic AI Results display */}
                  {aiResult && (
                    <div
                      id="ai-structured-payload"
                      className="p-6 bg-[#0072BC]/5 rounded-3xl border border-[#0072BC]/20 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in text-xs whitespace-pre-line leading-relaxed"
                    >
                      {/* Career details */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-[#0072BC]">
                            {lang === "ar"
                              ? "المسمى المخطط له"
                              : "Proposed Title"}
                          </p>
                          <h4 className="text-xl font-black text-slate-800">
                            {aiResult.jobTitle}
                          </h4>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase font-bold text-[#0072BC]">
                            {lang === "ar"
                              ? "سلّم الأجور المتوّقع (بالريال السعودي)"
                              : "Optimal Monthy Salary Ladder (SAR)"}
                          </p>
                          <p className="text-lg font-black font-mono text-emerald-600 mt-1">
                            SAR {aiResult.salaryMin.toLocaleString()} - SAR{" "}
                            {aiResult.salaryMax.toLocaleString()}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {lang === "ar"
                              ? "تشمل الأجر الأساسي المستحق طبقاً لدليل الهيئة الوطنية للدعاية."
                              : "Aligned with average compensation for advertising fabrication experts."}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">
                            {lang === "ar"
                              ? "المسار والتدرج الوظيفي (السلم المعين)"
                              : "Career Pathfinder"}
                          </p>
                          <div id="career-steps" className="space-y-2">
                            {aiResult.careerPath.map((itm, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-100"
                              >
                                <span className="w-5 h-5 rounded-full bg-cyan-100 text-[#0072BC] font-mono font-bold flex items-center justify-center text-[10px]">
                                  {i + 1}
                                </span>
                                <span className="font-semibold text-slate-700">
                                  {itm}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Responsibilities and skills */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">
                            {lang === "ar"
                              ? "المهام الإدارية والصلاحيات الممنوحة"
                              : "Scope of Work & Responsibilities"}
                          </p>
                          <ul className="space-y-2 text-slate-700">
                            {aiResult.responsibilities.map((itm, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <div className="text-[#00AEEF] text-base leading-none">
                                  ✔
                                </div>
                                <span>{itm}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">
                            {lang === "ar"
                              ? "المتطلبات والمهارات المهنية"
                              : "Required Neon Industry Skills"}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {aiResult.skills.map((itm, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 bg-[#0072BC]/10 text-[#0072BC] rounded-full text-[10px] font-bold"
                              >
                                {itm}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fallback load prompt if no analysis yet */}
                  {!aiResult && !aiLoading && (
                    <div className="py-12 text-center text-slate-400 flex flex-col items-center">
                      <span className="text-3xl mb-2">💡</span>
                      <p className="text-xs font-semibold">
                        {lang === "ar"
                          ? "أدخل أي مسمى تجاري للشركة وتكفل جيميناي برسم المهام وسن الراتب المناسب."
                          : "Type a title to unleash deep demographic recruitment guidelines and budget constraints."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB D: SALES PIPELINE, CRM & COLLECTION MODULE */}
            {activeTab === "sales" && (
              <div id="content-tab-sales" className="space-y-6">
                {activeSalesSubTab === "sales_dashboard" ? (
                  <SalesDashboard
                    lang={lang}
                    user={user!}
                    setActiveSubTab={setActiveSalesSubTab}
                  />
                ) : activeSalesSubTab === "sales_quotations" ? (
                  <SalesQuotations lang={lang} user={user!} />
                ) : activeSalesSubTab === "sales_collections" ? (
                  <FinancialCollections lang={lang} user={user!} />
                ) : activeSalesSubTab === "sales_production_requests" ? (
                  <SalesProductionRequests lang={lang} user={user!} />
                ) : activeSalesSubTab === "sales_letters" ? (
                  <SalesLetters lang={lang} user={user!} />
                ) : activeSalesSubTab === "sales_reports" ? (
                  user?.role === "Sales Rep" ? (
                    <div className="p-8 bg-amber-50 border border-amber-250 text-amber-900 rounded-3xl text-center font-bold">
                      {lang === "ar"
                        ? "عذراً، هذا القسم مخصص فقط للإدارة العليا وصاحب النظام ولا تملك صلاحية الوصول إليه."
                        : "Sorry, this section is restricted to senior management and system owner."}
                    </div>
                  ) : (
                    <SalesReports lang={lang} user={user!} />
                  )
                ) : activeSalesSubTab === "sales_reps_targets" ? (
                  user?.role === "Sales Rep" ? (
                    <div className="p-8 bg-amber-50 border border-amber-250 text-amber-900 rounded-3xl text-center font-bold">
                      {lang === "ar"
                        ? "عذراً، هذا القسم مخصص فقط للإدارة العليا وصاحب النظام ولا تملك صلاحية الوصول إليه."
                        : "Sorry, this section is restricted to senior management and system owner."}
                    </div>
                  ) : (
                    <SalesRepsTargets lang={lang} user={user!} />
                  )
                ) : activeSalesSubTab === "sales_pricing_study" ? (
                  <ProjectPricingStudy lang={lang} user={user!} employees={employees} />
                ) : (
                  <SalesHub
                    lang={lang}
                    user={user!}
                    quotations={quotations}
                    employees={employees}
                    activeSubTab={activeSalesSubTab}
                    onSaveQuotation={async (rQuo) => {
                      const res = await fetch("/api/quotations", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(rQuo),
                      });
                      if (res.ok) {
                        await handleReloadQuotations();
                      }
                    }}
                    onDeleteQuotation={async (id) => {
                      const res = await fetch(`/api/quotations/${id}`, {
                        method: "DELETE",
                      });
                      if (res.ok) {
                        await handleReloadQuotations();
                      }
                    }}
                  />
                )}
              </div>
            )}

            {/* TAB: WAREHOUSE */}
            {activeTab === "warehouse" &&
              activeWarehouseSubTab === "warehouse_dashboard" && (
                <div id="content-tab-warehouse-dashboard" className="space-y-6">
                  <ProcurementDashboard lang={lang} user={user!} onNavigate={(sub) => setActiveWarehouseSubTab(sub)} />
                </div>
              )}

            {activeTab === "warehouse" &&
              activeWarehouseSubTab === "warehouse_items" && (
                <div id="content-tab-warehouse" className="space-y-6">
                  <ItemsWarehouse lang={lang} />
                </div>
              )}

            {activeTab === "warehouse" &&
              activeWarehouseSubTab === "materials_warehouse" && (
                <div id="content-tab-materials-warehouse" className="space-y-6">
                  <MaterialsWarehouse lang={lang} />
                </div>
              )}

            {activeTab === "warehouse" &&
              activeWarehouseSubTab === "warehouse_procurement" && (
                <div
                  id="content-tab-warehouse-procurement"
                  className="space-y-6"
                >
                  <ProcurementRequests lang={lang} user={user!} />
                </div>
              )}

            {activeTab === "warehouse" &&
              activeWarehouseSubTab === "warehouse_suppliers_pricing" && (
                <div
                  id="content-tab-warehouse-suppliers-pricing"
                  className="space-y-6"
                >
                  <SuppliersPricing lang={lang} user={user!} />
                </div>
              )}

            {activeTab === "warehouse" &&
              activeWarehouseSubTab === "warehouse_finance_approval" && hasAdvancedPermission(user, 'procurement', 'finance_approval', 'view_finance_po') && (
                <div
                  id="content-tab-warehouse-finance-approval"
                  className="space-y-6"
                >
                  <FinanceApprovals lang={lang} user={user!} />
                </div>
              )}

            {/* TAB: FINANCIAL ACCOUNTING */}
            {activeTab === "finance" && activeFinanceSubTab === "finance_journal" && (
              <div id="content-tab-finance-journal" className="space-y-6">
                <JournalEntries lang={lang} user={user!} />
              </div>
            )}
            {activeTab === "finance" && activeFinanceSubTab === "finance_revenues_expenses" && (
              <div id="content-tab-finance-revenues" className="space-y-6">
                <RevenuesExpenses lang={lang} user={user!} />
              </div>
            )}
            {activeTab === "finance" && activeFinanceSubTab === "finance_customer_supplier_invoices" && (
              <div id="content-tab-finance-invoices" className="space-y-6">
                <CustomerSupplierInvoices lang={lang} user={user!} />
              </div>
            )}

            {/* TAB: MANUFACTURING PRODUCTION CONTROL CENTER */}
            {activeTab === "production" && (
              <div id="content-tab-production" className="space-y-6">
                <ProductionHub
                  lang={lang}
                  user={user!}
                  employees={employees}
                  quotations={quotations}
                  activeSubTab={activeProductionSubTab}
                  onSelectSubTab={setActiveProductionSubTab}
                  onSaveQuotation={async (rQuo) => {
                    const res = await fetch("/api/quotations", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(rQuo),
                    });
                    if (res.ok) {
                      await handleReloadQuotations();
                    }
                  }}
                  onDeleteQuotation={async (id) => {
                    const res = await fetch(`/api/quotations/${id}`, {
                      method: "DELETE",
                    });
                    if (res.ok) {
                      await handleReloadQuotations();
                    }
                  }}
                />
              </div>
            )}

            {/* TAB E: AUTOMATED DOCUMENT LIBRARY & PRINTING ENGINE */}
            {activeTab === "hr" && activeHrSubTab === "documents" && (
              <div
                id="content-tab-documents"
                className="space-y-6 bg-white/50 backdrop-blur rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100 print:p-0 print:border-none print:shadow-none print:bg-transparent"
              >
                <InstantDocumentsHub
                  lang={lang}
                  user={user!}
                  employees={employees}
                />
              </div>
            )}
              </>
            )}
          </main>
        </div>
      )}

      {/* 4. FOOTER CREDITS */}
      <footer
        id="app-footer-credit-line"
        className="mt-auto py-6 bg-slate-900 text-slate-400 text-xs text-center border-t border-slate-850 select-none print:hidden"
      >
        <p>
          © 2026 Fonoun Alwaleed Integrated System Mapped Securely. Engineered
          with Dual-language (Ar/En) auto-persister.
        </p>
        <p className="text-[10px] text-cyan-400 mt-1 uppercase font-bold tracking-widest">
          {lang === "ar"
            ? "بوابة النظام لشركة فنون الوليد | تم تصميم وتشغيل وبرمجة كامل النظام بواسطة فراس محمد الجزائري - ferasbusiness24@gmail.com"
            : "Fonoun Alwaleed System Gate | Designed, operated and programmed entirely by Feras Mohamed Al-Jazaery - ferasbusiness24@gmail.com"}
        </p>
      </footer>
      <div className="hidden print:block" dangerouslySetInnerHTML={{ __html: sharedPrintFooter }} />
      {user && <AIAssistant lang={lang} />}
    </div>
  );
}
