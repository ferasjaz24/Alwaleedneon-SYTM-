import React, { useState, useRef, useEffect } from "react";
import {
  Cpu,
  Send,
  Sparkles,
  Bot,
  User,
  CheckCircle,
  HelpCircle,
  Clock,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  FolderOpen,
  Info,
  RefreshCw,
  // New icons for subsections
  CreditCard,
  FileText,
  Calendar,
  ClipboardList,
  GitMerge,
  FileSpreadsheet,
  Target,
  BarChart3,
  Mail,
  ShoppingBag,
  Truck,
  CheckSquare,
  DollarSign,
  Hammer,
  Layers,
  Package,
  ShieldAlert,
  ChevronDown
} from "lucide-react";

// Subsection Icon Renderer
const SubsectionIcon = ({ name, className = "w-4 h-4" }: { name: string; className?: string }) => {
  const icons: Record<string, React.ComponentType<any>> = {
    User,
    CreditCard,
    FileText,
    Calendar,
    ClipboardList,
    GitMerge,
    FileSpreadsheet,
    Target,
    BarChart3,
    Mail,
    ShoppingBag,
    Truck,
    CheckSquare,
    DollarSign,
    Hammer,
    Layers,
    Package,
    ShieldAlert,
    Sparkles,
    FolderOpen,
  };

  const IconComponent = icons[name] || Sparkles;
  return <IconComponent className={className} />;
};

// Safe compile color mapping for Tailwind CSS classes
const getColorClasses = (color: string, isActive: boolean) => {
  switch (color) {
    case "indigo":
      return isActive
        ? "bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-600/15"
        : "bg-white border-slate-200/80 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700";
    case "sky":
      return isActive
        ? "bg-sky-600 text-white border-sky-700 shadow-lg shadow-sky-600/15"
        : "bg-white border-slate-200/80 text-slate-700 hover:border-sky-200 hover:bg-sky-50/50 hover:text-sky-700";
    case "amber":
      return isActive
        ? "bg-amber-600 text-white border-amber-700 shadow-lg shadow-amber-600/15"
        : "bg-white border-slate-200/80 text-slate-700 hover:border-amber-200 hover:bg-amber-50/50 hover:text-amber-700";
    case "emerald":
      return isActive
        ? "bg-emerald-600 text-white border-emerald-700 shadow-lg shadow-emerald-600/15"
        : "bg-white border-slate-200/80 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700";
    case "rose":
      return isActive
        ? "bg-rose-600 text-white border-rose-700 shadow-lg shadow-rose-600/15"
        : "bg-white border-slate-200/80 text-slate-700 hover:border-rose-200 hover:bg-rose-50/50 hover:text-rose-700";
    default:
      return isActive
        ? "bg-slate-900 text-white border-slate-950 shadow-lg shadow-slate-900/15"
        : "bg-white border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-100 text-slate-700";
  }
};

// Complete Departments & Subsections Registry
const DEPARTMENTS = [
  {
    id: "general",
    nameAr: "البحث العام والذكي 🌐",
    nameEn: "Global Smart Search",
    color: "slate",
    icon: "Sparkles",
    subsections: [
      { id: "all", nameAr: "كامل أقسام النظام آلياً", nameEn: "All Departments", icon: "Sparkles" }
    ],
    presets: [
      {
        title: "تعديل بدل سكن موظف 🏠",
        prompt: "تعديل بدل السكن لمحمد موسى إلى 500 ريال",
        subDept: "all"
      },
      {
        title: "إنشاء عرض سعر مفصل 📄",
        prompt: "أريد عمل عرض سعر لعميل إيراب للمقاولات يحتوي على صنفين: الأول لوح Clerk ثلاثة بالليل حبتين بسعر 600 ريال، والثاني لوح Clerk زنك حبة واحدة بسعر 1200 ريال",
        subDept: "all"
      },
      {
        title: "تغيير الراتب الأساسي 💵",
        prompt: "تحديث الراتب الأساسي للموظف محمد موسى العتيبي ليصبح 6000 ريال",
        subDept: "all"
      }
    ]
  },
  {
    id: "hr",
    nameAr: "الموارد البشرية 👥",
    nameEn: "Human Resources",
    color: "indigo",
    icon: "User",
    subsections: [
      { id: "all_hr", nameAr: "البحث العام بالموارد البشرية", nameEn: "All HR Section", icon: "User" },
      { id: "hr_employees", nameAr: "دليل الموظفين", nameEn: "Employee Directory", icon: "User" },
      { id: "hr_payroll", nameAr: "الرواتب والأجور", nameEn: "Payroll System", icon: "CreditCard" },
      { id: "hr_contracts", nameAr: "العقود والإقامات", nameEn: "Contracts & Iqamas", icon: "FileText" },
      { id: "hr_leaves", nameAr: "الإجازات والغياب", nameEn: "Leaves & Attendance", icon: "Calendar" },
      { id: "hr_documents", nameAr: "متابعة الوثائق والتراخيص", nameEn: "Document Tracking", icon: "ClipboardList" },
      { id: "hr_org", nameAr: "الهيكل والتنظيم", nameEn: "Org Structure & Hiring", icon: "GitMerge" }
    ],
    presets: [
      {
        title: "تعديل بدل سكن موظف 🏠",
        prompt: "تعديل بدل السكن لمحمد موسى إلى 500 ريال",
        subDept: "hr_payroll"
      },
      {
        title: "تحديث راتب أساسي 💵",
        prompt: "تحديث الراتب الأساسي للموظف محمد موسى العتيبي ليصبح 6000 ريال",
        subDept: "hr_payroll"
      },
      {
        title: "تحديث تاريخ انتهاء العقد 📅",
        prompt: "تحديث تاريخ انتهاء عقد الموظف Gasem Alyami إلى 2027-12-31",
        subDept: "hr_contracts"
      },
      {
        title: "جنسية موظف 🌍",
        prompt: "تغيير جنسية الموظف محمد موسى إلى سعودي",
        subDept: "hr_employees"
      },
      {
        title: "رصيد الإجازات 🏖️",
        prompt: "تحديث رصيد الإجازات السنوية للموظف محمد موسى ليصبح 30 يوماً",
        subDept: "hr_leaves"
      }
    ]
  },
  {
    id: "sales",
    nameAr: "المبيعات وعروض الأسعار 📈",
    nameEn: "Sales & CRM",
    color: "sky",
    icon: "FolderOpen",
    subsections: [
      { id: "all_sales", nameAr: "البحث العام بالمبيعات", nameEn: "All Sales", icon: "FolderOpen" },
      { id: "sales_quotations", nameAr: "عروض الأسعار", nameEn: "Sales Quotations", icon: "FileSpreadsheet" },
      { id: "sales_targets", nameAr: "أهداف مبيعات المناديب", nameEn: "Reps Targets", icon: "Target" },
      { id: "sales_reports", nameAr: "تقارير المبيعات", nameEn: "Sales Reports", icon: "BarChart3" },
      { id: "sales_letters", nameAr: "خطابات المبيعات", nameEn: "Sales Letters", icon: "Mail" }
    ],
    presets: [
      {
        title: "إنشاء عرض سعر مفصل 📄",
        prompt: "أريد عمل عرض سعر لعميل إيراب للمقاولات يحتوي على صنفين: الأول لوح Clerk ثلاثة بالليل حبتين بسعر 600 ريال، والثاني لوح Clerk زنك حبة واحدة بسعر 1200 ريال",
        subDept: "sales_quotations"
      },
      {
        title: "تعديل هدف المبيعات 🎯",
        prompt: "تعديل هدف المبيعات للشهر الحالي للمندوب أحمد ليصبح 45,000 ريال",
        subDept: "sales_targets"
      },
      {
        title: "عرض حالة الأسعار 📊",
        prompt: "عرض تقرير مختصر عن حالة عروض الأسعار المسودة والمقبولة للشهر الجاري",
        subDept: "sales_reports"
      }
    ]
  },
  {
    id: "procurement",
    nameAr: "المشتريات والموردين 🛒",
    nameEn: "Procurement & Suppliers",
    color: "amber",
    icon: "ShoppingBag",
    subsections: [
      { id: "all_procurement", nameAr: "البحث العام بالمشتريات", nameEn: "All Procurement", icon: "ShoppingBag" },
      { id: "procurement_requests", nameAr: "طلبات الشراء", nameEn: "Procurement Requests", icon: "ShoppingBag" },
      { id: "procurement_suppliers", nameAr: "أسعار الموردين", nameEn: "Suppliers & Pricing", icon: "Truck" }
    ],
    presets: [
      {
        title: "إنشاء طلب شراء 📦",
        prompt: "إنشاء طلب شراء مواد أولية بقيمة 12,000 ريال من المورد شركة اليمامة للحديد لمستودع Neon",
        subDept: "procurement_requests"
      },
      {
        title: "تعديل تسعيرة مورد 🏷️",
        prompt: "تعديل تسعيرة المورد لشركة اليمامة لصنف زوايا الألومنيوم لتصبح 95 ريال للقطعة",
        subDept: "procurement_suppliers"
      }
    ]
  },
  {
    id: "accounting",
    nameAr: "المحاسبة والمالية 💰",
    nameEn: "Accounting & Finance",
    color: "emerald",
    icon: "DollarSign",
    subsections: [
      { id: "all_accounting", nameAr: "البحث العام بالمالية", nameEn: "All Finance", icon: "DollarSign" },
      { id: "accounting_approvals", nameAr: "الموافقات المالية", nameEn: "Finance Approvals", icon: "CheckSquare" },
      { id: "accounting_collections", nameAr: "التحصيلات والديون", nameEn: "Financial Collections", icon: "DollarSign" }
    ],
    presets: [
      {
        title: "مراجعة الموافقات المعلقة 💸",
        prompt: "مراجعة الموافقات المالية المعلقة للمصاريف الإدارية والتشغيلية",
        subDept: "accounting_approvals"
      },
      {
        title: "تسجيل تحصيل عميل 📥",
        prompt: "تسجيل تحصيل دفعة بقيمة 8,500 ريال من شركة ركاز للمقاولات",
        subDept: "accounting_collections"
      }
    ]
  },
  {
    id: "production",
    nameAr: "الإنتاج والتصنيع ⚙️",
    nameEn: "Production & Manufacturing",
    color: "rose",
    icon: "Hammer",
    subsections: [
      { id: "all_production", nameAr: "البحث العام بالإنتاج", nameEn: "All Production", icon: "Hammer" },
      { id: "production_hub", nameAr: "ورشة الإنتاج والتصنيع", nameEn: "Production Hub", icon: "Hammer" },
      { id: "production_materials", nameAr: "مستودع المواد الأولية", nameEn: "Materials Warehouse", icon: "Layers" },
      { id: "production_products", nameAr: "مستودع المنتجات الجاهزة", nameEn: "Finished Products", icon: "Package" },
      { id: "production_quality", nameAr: "إدارة الجودة", nameEn: "Quality Assurance", icon: "ShieldAlert" }
    ],
    presets: [
      {
        title: "تحديث حالة أمر إنتاج 🛠️",
        prompt: "تعديل حالة تشغيل لوحة Neon للعميل إيراب إلى 'قيد التجميع النهائي والتسليم'",
        subDept: "production_hub"
      },
      {
        title: "تعديل رصيد مستودع 📐",
        prompt: "تحديث رصيد مستودع المواد الأولية: إضافة 150 متر من شريط Neon LED أزرق",
        subDept: "production_materials"
      },
      {
        title: "فحص جودة المنتج 🛡️",
        prompt: "تسجيل تقرير فحص الجودة برقم 'QA-2026-95' بنتيجة مقبول لمنتجات ورشة القص واللحام",
        subDept: "production_quality"
      }
    ]
  }
];

interface ChatMessage {
  id: string;
  text: string;
  isAi: boolean;
  status?: "execute" | "clarify" | "error" | "pending";
  timestamp: string;
  suggestedDepartment?: string;
  actionDetails?: any;
}

interface SmartAssistantCommandsProps {
  lang: "ar" | "en";
  user: any;
  onRefreshData?: () => void;
}

export default function SmartAssistantCommands({
  lang,
  user,
  onRefreshData,
}: SmartAssistantCommandsProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      text:
        lang === "ar"
          ? "أهلاً بك في بوابة الأوامر الفائقة (F24). يمكنك توجيهي باللغة العربية لتحديث سجلات الموظفين، أو إنشاء عروض الأسعار، أو توجيه أوامر لأي قسم في النظام فوراً."
          : "Welcome to the Super Command Gate (F24). You can direct me in Arabic to update employee files, create quotations, or route commands to any system department instantly.",
      isAi: true,
      timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [promptInput, setPromptInput] = useState("");
  const [activeMainDept, setActiveMainDept] = useState<string>("general");
  const [activeSubDept, setActiveSubDept] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle preset suggestions
  const handleApplyPreset = (text: string, mainDeptId: string, subDeptId: string) => {
    setPromptInput(text);
    setActiveMainDept(mainDeptId);
    setActiveSubDept(subDeptId);
  };

  const handleSendCommand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptInput.trim() || isLoading) return;

    const userQuery = promptInput.trim();
    setPromptInput("");

    // Add user message
    const userMsgId = `usr-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      text: userQuery,
      isAi: false,
      timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Build chat history for context (last 8 messages)
    const contextHistory = messages
      .slice(-8)
      .map((msg) => ({
        role: msg.isAi ? "model" : "user",
        text: msg.text,
      }));

    try {
      const response = await fetch("/api/ai-commands/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userQuery,
          department: activeMainDept === "general" ? "general" : `${activeMainDept} - ${activeSubDept}`,
          history: contextHistory,
        }),
      });

      if (!response.ok) {
        throw new Error("فشلت عملية الاتصال بخادم الذكاء الاصطناعي.");
      }

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        text: data.message || "عذراً، لم أستطع معالجة هذا الأمر.",
        isAi: true,
        status: data.status,
        timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
        suggestedDepartment: data.suggestedDepartment,
        actionDetails: data.action,
      };

      setMessages((prev) => [...prev, aiMsg]);

      // If action was executed successfully, trigger global data reload so other tabs update in real-time!
      if (data.status === "execute" && onRefreshData) {
        onRefreshData();
      }

    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          text: `❌ خطأ في النظام: ${error.message || "حدث خطأ غير متوقع."}`,
          isAi: true,
          status: "error",
          timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get active presets dynamically based on selected department and subsection
  const activeDeptConfig = DEPARTMENTS.find(d => d.id === activeMainDept) || DEPARTMENTS[0];
  const presetsToShow = activeDeptConfig.presets;

  return (
    <div className="space-y-6 text-right" style={{ direction: "rtl" }}>
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 border border-slate-800 shadow-xl">
        <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-[80px]" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-sky-500/5 rounded-full filter blur-[100px]" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full text-xs font-black uppercase tracking-wider mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>نظام الأوامر الفائقة المباشر للذكاء الاصطناعي (F24)</span>
            </div>
            <h1 className="text-3xl font-black font-arabic tracking-tight text-white leading-tight">
              أوامر المساعد الذكي الفائق 🧠
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
              من هذه الصفحة الحصرية للإدارة العليا فقط، يمتلك المساعد الذكي الفائق صلاحية تعديل سجلات جميع أقسام الشركة مباشرة في قاعدة البيانات. انقر على أي قسم لتعليمه أو تحديد السياق المناسب.
            </p>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-4 flex flex-col items-center min-w-[180px]">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">صلاحية المستخدم الحالية</span>
            <span className="text-sm font-black text-emerald-400 mt-1">مدير الإدارة العليا (F24)</span>
            <div className="flex items-center gap-1.5 mt-3 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-[10px] text-emerald-300 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>قناة الاتصال مشفرة ونشطة</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* SIDE SUGGESTIONS PANEL */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>أوامر تجريبية سريعة</span>
              </h3>
              <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {activeDeptConfig.nameAr.split(" ")[0]}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              نماذج أوامر ذكية مخصصة لقسم <strong className="text-slate-700">{activeDeptConfig.nameAr.split(" ")[0]}</strong>. انقر لملء صندوق النص آلياً:
            </p>

            <div className="space-y-3">
              {presetsToShow.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleApplyPreset(preset.prompt, activeMainDept, preset.subDept || "all")}
                  className="w-full text-right p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 transition-all active:scale-[0.98] group flex flex-col justify-between cursor-pointer"
                >
                  <div className="text-xs font-black text-indigo-600 group-hover:text-indigo-700 font-arabic flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    {preset.title}
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    "{preset.prompt}"
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200/50">
            <h4 className="text-xs font-extrabold text-slate-700 mb-2 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-indigo-500" />
              <span>دليل التحكم المتكامل</span>
            </h4>
            <ul className="list-disc list-inside text-[11px] text-slate-500 space-y-2 leading-relaxed pr-2">
              <li>استخدم الأزرار بالأسفل لتوجيه الذكاء الاصطناعي بدقة إلى أحد قطاعات النظام الخمسة.</li>
              <li>اختيار القسم يضيق نطاق البحث والتركيز المعرفي للنموذج لتجنب الأخطاء وسرعة الاستجابة.</li>
              <li>جميع العمليات تجري على قاعدة البيانات الحية Firestore وتؤرشف تحت سجلات تدقيق F24.</li>
            </ul>
          </div>
        </div>

        {/* CHAT AND INPUT CANVAS */}
        <div className="lg:col-span-3 flex flex-col h-[650px] bg-white rounded-3xl border border-slate-200/80 shadow-lg overflow-hidden">
          {/* TOP BAR */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200/80">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 text-white rounded-xl">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">المساعد التنفيذي المؤتمت</h3>
                <span className="text-[10px] text-slate-400 font-bold">بوابة فراس بن وليد للتحكم الفائق (Gemini Core)</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                if (onRefreshData) onRefreshData();
                setMessages([
                  {
                    id: "init",
                    text: "تم تصفير المحادثة وتحديث كشوفات الموظفين وعروض الأسعار في الذاكرة المؤقتة للذكاء الاصطناعي بنجاح.",
                    isAi: true,
                    timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
                  }
                ]);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-[11px] font-bold text-slate-600 flex items-center gap-1.5 active:scale-95 transition-all"
              title="تفريغ ذاكرة المساعد وتحديث السياق"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تحديث وتفريغ الذاكرة</span>
            </button>
          </div>

          {/* MESSAGE VIEW AREA */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${
                  msg.isAi ? "mr-0 ml-auto" : "mr-auto ml-0 flex-row-reverse"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    msg.isAi
                      ? "bg-slate-900 text-white border border-slate-800"
                      : "bg-indigo-600 text-white"
                  }`}
                >
                  {msg.isAi ? <Bot className="w-5 h-5 text-indigo-400" /> : <User className="w-5 h-5" />}
                </div>

                {/* Bubble */}
                <div className="space-y-1 text-right">
                  <div
                    className={`px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                      msg.isAi
                        ? "bg-white text-slate-800 border border-slate-100 shadow-sm rounded-tr-none"
                        : "bg-indigo-600 text-white rounded-tl-none font-bold"
                    }`}
                  >
                    <p className="whitespace-pre-line font-arabic font-medium">{msg.text}</p>

                    {/* Meta Status Indicator (AI only) */}
                    {msg.isAi && msg.status && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-[10px]">
                        <span className="text-slate-400 font-bold">حالة التنفيذ:</span>
                        {msg.status === "execute" ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-black flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            تم الحفظ فوراً بقاعدة البيانات
                          </span>
                        ) : msg.status === "clarify" ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-black flex items-center gap-1">
                            <HelpCircle className="w-3 h-3 text-amber-600" />
                            بانتظار تأكيدك / تفاصيل إضافية
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-black">
                            خطأ في العملية
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action breakdown log */}
                    {msg.isAi && msg.status === "execute" && msg.actionDetails && (
                      <div className="mt-2.5 p-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-mono text-slate-500">
                        <div className="font-bold text-slate-700 mb-1 font-arabic">⚙️ تفاصيل السند المنفذ:</div>
                        <div>العملية: {msg.actionDetails.type === "update_employee" ? "تعديل موظف" : "إنشاء عرض سعر"}</div>
                        {msg.actionDetails.employeeId && <div>كود الموظف: {msg.actionDetails.employeeId}</div>}
                        {msg.actionDetails.employeeUpdateData && (
                          <pre className="mt-1 bg-white p-1 border border-slate-100 rounded overflow-x-auto text-[9px]">
                            {JSON.stringify(msg.actionDetails.employeeUpdateData, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-[9px] text-slate-400 px-1 font-bold flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* AI LOADING PLACEHOLDER */}
            {isLoading && (
              <div className="flex gap-3 mr-0 ml-auto max-w-[85%]">
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 text-white flex items-center justify-center animate-spin">
                  <Cpu className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="px-4 py-3 bg-white text-slate-500 border border-slate-100 shadow-sm rounded-2xl rounded-tr-none text-xs flex items-center gap-2 font-arabic font-bold">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                  <span>المساعد يفكر ويبحث في سجلات كشوفات الموظفين وعقود العمل لتنفيذ أمرك...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* BOTTOM FORM AND INPUTS */}
          <div className="p-5 bg-slate-50 border-t border-slate-200/80 space-y-4">
            {/* DEPARTMENT ROTATIONAL CONTROLS */}
            <div className="space-y-3">
              {/* LEVEL 1: MASTER SYSTEM DEPARTMENTS */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-500 font-arabic flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                    <span>توجيه ذكي لقسم النظام الرئيسي (F24 Command Line):</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">حدد القسم لتأطير المعالجة الذكية</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                  {DEPARTMENTS.map((dept) => {
                    const isActive = activeMainDept === dept.id;
                    const colorStyle = getColorClasses(dept.color, isActive);
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => {
                          setActiveMainDept(dept.id);
                          // Set default subdepartment of selected main department
                          const defaultSub = dept.subsections[0]?.id || "all";
                          setActiveSubDept(defaultSub);
                        }}
                        className={`px-3 py-2.5 rounded-2xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1.5 border active:scale-95 duration-200 cursor-pointer ${colorStyle}`}
                      >
                        <SubsectionIcon name={dept.icon} className={`w-5 h-5 ${isActive ? "text-white" : ""}`} />
                        <span className="font-arabic">{dept.nameAr.replace(/👥|📈|🛒|💰|⚙️|🌐/, "").trim()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LEVEL 2: SUBSECTIONS (DISPLAYED ONLY IF DEPT SELECTED & NOT GENERAL) */}
              {activeMainDept !== "general" && (
                <div className="p-3 bg-white rounded-2xl border border-slate-200/60 shadow-inner space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black text-slate-500 font-arabic flex items-center gap-1">
                      <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />
                      <span>الأقسام الفرعية النشطة داخل {activeDeptConfig.nameAr.replace(/👥|📈|🛒|💰|⚙️|🌐/, "").trim()}:</span>
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">اختر القسم الفرعي لزيادة مستوى تركيز الذكاء الاصطناعي</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {activeDeptConfig.subsections.map((sub) => {
                      const isSubActive = activeSubDept === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setActiveSubDept(sub.id)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black transition-all flex items-center gap-1.5 border cursor-pointer active:scale-95 ${
                            isSubActive
                              ? `bg-indigo-600 text-white border-indigo-700 shadow-sm`
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                          }`}
                        >
                          <SubsectionIcon name={sub.icon} className="w-3.5 h-3.5" />
                          <span className="font-arabic">{sub.nameAr}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* INPUT FIELD */}
            <form onSubmit={handleSendCommand} className="flex gap-3">
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="اكتب أمر التعديل هنا (مثال: عدل بدل سكن الموظف محمد موسى إلى 500 ريال)..."
                className="flex-1 bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl px-5 py-3.5 text-xs text-slate-800 placeholder-slate-400 font-arabic leading-relaxed font-semibold transition-all shadow-inner focus:outline-none"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!promptInput.trim() || isLoading}
                className={`px-5 py-3.5 rounded-2xl font-black text-xs transition-all shadow-md flex items-center gap-1.5 font-arabic ${
                  !promptInput.trim() || isLoading
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 hover:shadow-lg hover:shadow-indigo-600/15"
                }`}
              >
                <span>أرسل التنفيذ</span>
                <Send className="w-4 h-4 rotate-180" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
