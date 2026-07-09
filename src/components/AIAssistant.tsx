import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  MinusCircle,
  Cpu,
  CheckCircle,
  HelpCircle,
  Clock,
  ChevronDown,
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
  Zap,
} from "lucide-react";

interface Message {
  id: string;
  text: string;
  isAi: boolean;
  status?: "execute" | "clarify" | "error" | "pending";
  timestamp: string;
  actionDetails?: any;
}

// Complete Departments Registry matching SmartAssistantCommands
const DEPARTMENTS = [
  {
    id: "general",
    nameAr: "عام 🌐",
    color: "slate",
    icon: "Sparkles",
    subsections: [
      { id: "all", nameAr: "البحث العام", icon: "Sparkles" }
    ],
    presets: [
      { title: "تعديل بدل سكن 🏠", prompt: "تعديل بدل السكن لمحمد موسى إلى 500 ريال" },
      { title: "تحديث الراتب 💵", prompt: "تحديث الراتب الأساسي للموظف محمد موسى العتيبي ليصبح 6000 ريال" }
    ]
  },
  {
    id: "hr",
    nameAr: "الموارد البشرية 👥",
    color: "indigo",
    icon: "User",
    subsections: [
      { id: "hr_employees", nameAr: "دليل الموظفين", icon: "User" },
      { id: "hr_payroll", nameAr: "الرواتب والأجور", icon: "CreditCard" },
      { id: "hr_contracts", nameAr: "العقود والإقامات", icon: "FileText" }
    ],
    presets: [
      { title: "إضافة الموظف عمر 🆕", prompt: "تسجيل الموظف الجديد عمر العتيبي براتب أساسي 5000 ريال وبدل سكن 1000 ريال ووظيفته فني تجميع" },
      { title: "تعديل بدل سكن 🏠", prompt: "تعديل بدل السكن لمحمد موسى إلى 500 ريال" },
      { title: "تحديث عقد 📅", prompt: "تحديث تاريخ انتهاء عقد الموظف Gasem Alyami إلى 2027-12-31" }
    ]
  },
  {
    id: "sales",
    nameAr: "المبيعات 📈",
    color: "sky",
    icon: "FileSpreadsheet",
    subsections: [
      { id: "sales_quotations", nameAr: "عروض الأسعار", icon: "FileSpreadsheet" },
      { id: "sales_targets", nameAr: "أهداف المناديب", icon: "Target" }
    ],
    presets: [
      { title: "عرض سعر جديد 📄", prompt: "أريد عمل عرض سعر لعميل إيراب للمقاولات يحتوي على صنفين: الأول لوح Clerk ثلاثة بالليل حبتين بسعر 600 ريال، والثاني لوح Clerk زنك حبة واحدة بسعر 1200 ريال" },
      { title: "تعديل هدف المندوب 🎯", prompt: "تعديل هدف المبيعات للشهر الحالي للمندوب أحمد ليصبح 45,000 ريال" }
    ]
  },
  {
    id: "procurement",
    nameAr: "المشتريات 🛒",
    color: "amber",
    icon: "ShoppingBag",
    subsections: [
      { id: "procurement_requests", nameAr: "طلبات الشراء", icon: "ShoppingBag" },
      { id: "procurement_suppliers", nameAr: "أسعار الموردين", icon: "Truck" }
    ],
    presets: [
      { title: "طلب شراء 📦", prompt: "إنشاء طلب شراء مواد أولية بقيمة 12,000 ريال من المورد شركة اليمامة للحديد لمستودع Neon" },
      { title: "تعديل سعر مورد 🏷️", prompt: "تعديل تسعيرة المورد لشركة اليمامة لصنف زوايا الألومنيوم لتصبح 95 ريال" }
    ]
  },
  {
    id: "accounting",
    nameAr: "المحاسبة 💰",
    color: "emerald",
    icon: "DollarSign",
    subsections: [
      { id: "accounting_approvals", nameAr: "الموافقات المالية", icon: "CheckSquare" },
      { id: "accounting_collections", nameAr: "التحصيلات والديون", icon: "DollarSign" }
    ],
    presets: [
      { title: "تسجيل تحصيل عميل 📥", prompt: "تسجيل تحصيل دفعة بقيمة 8,500 ريال من شركة ركاز للمقاولات" },
      { title: "مراجعة الموافقات 💸", prompt: "مراجعة الموافقات المالية المعلقة للمصاريف الإدارية والتشغيلية" }
    ]
  },
  {
    id: "production",
    nameAr: "الإنتاج ⚙️",
    color: "rose",
    icon: "Hammer",
    subsections: [
      { id: "production_hub", nameAr: "ورشة الإنتاج", icon: "Hammer" },
      { id: "production_materials", nameAr: "المستودع", icon: "Layers" }
    ],
    presets: [
      { title: "تحديث حالة الإنتاج 🛠️", prompt: "تعديل حالة تشغيل لوحة Neon للعميل إيراب إلى 'قيد التجميع النهائي والتسليم'" },
      { title: "تعديل رصيد مستودع 📐", prompt: "تحديث رصيد مستودع المواد الأولية: إضافة 150 متر من شريط Neon LED أزرق" }
    ]
  }
];

const SubsectionIcon = ({ name, className = "w-3.5 h-3.5" }: { name: string; className?: string }) => {
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
  };

  const IconComponent = icons[name] || Sparkles;
  return <IconComponent className={className} />;
};

export default function AIAssistant({ lang }: { lang: "ar" | "en" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      text:
        lang === "ar"
          ? "أهلاً بك في المساعد التنفيذي الفائق (F24). يمكنك تحديد القسم المعني بالأسفل وتوجيهي باللغة العربية فوراً لتعديل وحفظ البيانات مباشرة في النظام."
          : "Welcome to F24 Executive Assistant. Choose a department below and direct me in Arabic to modify database records directly.",
      isAi: true,
      timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeMainDept, setActiveMainDept] = useState("general");
  const [activeSubDept, setActiveSubDept] = useState("all");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, activeMainDept]);

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const queryText = (customText || inputMessage).trim();
    if (!queryText) return;

    if (!customText) setInputMessage("");

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      text: queryText,
      isAi: false,
      timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const contextHistory = messages
      .slice(-6)
      .map((msg) => ({
        role: msg.isAi ? "model" : "user",
        text: msg.text,
      }));

    try {
      const response = await fetch("/api/ai-commands/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: queryText,
          department: activeMainDept === "general" ? "general" : `${activeMainDept} - ${activeSubDept}`,
          history: contextHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(
          lang === "ar"
            ? "فشل الاتصال بخادم الأوامر الذكية."
            : "Failed to connect to AI command server."
        );
      }

      const data = await response.json();

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        text: data.message || "عذراً، لم أستطع معالجة هذا الأمر.",
        isAi: true,
        status: data.status,
        timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
        actionDetails: data.action,
      };

      setMessages((prev) => [...prev, aiMsg]);

      // If action was executed successfully, dispatch global reload event so all tables refresh!
      if (data.status === "execute") {
        window.dispatchEvent(new Event("F24DataReload"));
      }

    } catch (err: any) {
      console.error("F24 AI Assistant Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          text: `❌ ${lang === "ar" ? "خطأ في النظام:" : "System Error:"} ${err.message || "Error"}`,
          isAi: true,
          status: "error",
          timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPreset = (prompt: string) => {
    setInputMessage(prompt);
  };

  const activeDeptConfig = DEPARTMENTS.find((d) => d.id === activeMainDept) || DEPARTMENTS[0];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 p-4 bg-gradient-to-r from-indigo-600 to-slate-900 text-white rounded-full shadow-2xl hover:shadow-indigo-500/30 hover:scale-105 transition-all flex items-center justify-center animate-bounce-subtle group border border-indigo-500/30"
        title="بوابة التحكم الفائق بالذكاء الاصطناعي F24"
      >
        <div className="relative">
          <Cpu className="w-6 h-6 group-hover:rotate-12 transition-transform text-white" />
          <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
        <span className="mr-2 font-black font-arabic text-sm hidden md:inline">بوابة الأوامر F24</span>
      </button>
    );
  }

  return (
    <div
      className={`fixed z-[100] transition-all duration-300 ease-in-out flex flex-col bg-white shadow-2xl rounded-3xl overflow-hidden border border-slate-200/80 text-right font-arabic
      ${
        isMinimized
          ? "bottom-6 left-6 w-80 h-14"
          : "bottom-6 left-6 w-96 md:w-[480px] h-[640px]"
      }`}
      style={{ direction: "rtl" }}
    >
      {/* Header */}
      <div
        className="bg-slate-900 text-white p-4 flex justify-between items-center cursor-pointer select-none border-b border-slate-800"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-600 text-white rounded-xl">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm flex items-center gap-1.5">
              <span>المساعد التنفيذي الفائق (F24)</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md font-bold">نشط وحي</span>
            </h3>
            {!isMinimized && (
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                قناة الاتصال المباشرة بقاعدة البيانات (Live Firestore)
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
          >
            <MinusCircle className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              setIsMinimized(false);
            }}
            className="p-1.5 hover:bg-rose-500/20 rounded-xl text-slate-400 hover:text-rose-400 transition cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Chat Area (Hidden when minimized) */}
      {!isMinimized && (
        <>
          {/* Main message area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 max-w-[88%] ${msg.isAi ? "mr-0 ml-auto" : "mr-auto ml-0 flex-row-reverse"}`}
              >
                <div
                  className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center shadow-sm ${
                    msg.isAi ? "bg-slate-900 text-white" : "bg-indigo-600 text-white font-bold"
                  }`}
                >
                  {msg.isAi ? <Bot className="w-4.5 h-4.5 text-indigo-400" /> : <User className="w-4.5 h-4.5" />}
                </div>
                <div className="space-y-1">
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      msg.isAi
                        ? "bg-white border border-slate-100 text-slate-700 rounded-tr-none"
                        : "bg-indigo-600 text-white rounded-tl-none font-semibold"
                    }`}
                  >
                    <p className="whitespace-pre-wrap font-medium">{msg.text}</p>

                    {/* Meta execution log */}
                    {msg.isAi && msg.status && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 text-[9px]">
                        <span className="text-slate-400 font-bold">الحالة:</span>
                        {msg.status === "execute" ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black flex items-center gap-1">
                            <CheckCircle className="w-2.5 h-2.5" /> تم الحفظ والتحديث بنجاح
                          </span>
                        ) : msg.status === "clarify" ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-black flex items-center gap-1">
                            <HelpCircle className="w-2.5 h-2.5" /> بانتظار التفاصيل
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">خطأ</span>
                        )}
                      </div>
                    )}

                    {/* Action breakdown log */}
                    {msg.isAi && msg.status === "execute" && msg.actionDetails && (
                      <div className="mt-2 p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-mono text-slate-500">
                        <div className="font-bold text-slate-700">⚙️ السند: {msg.actionDetails.type}</div>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] block text-slate-400 px-1 font-bold">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 mr-0 ml-auto max-w-[85%]">
                <div className="w-8 h-8 shrink-0 rounded-xl bg-slate-900 text-white flex items-center justify-center animate-spin">
                  <Cpu className="w-4.5 h-4.5 text-indigo-400" />
                </div>
                <div className="p-3 bg-white border border-slate-100 rounded-2xl rounded-tr-none shadow-sm flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span className="text-[11px] text-slate-500 font-bold">جاري مراجعة سجلات قطاعات النظام وتنفيذ الأمر المباشر...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick presets suggestions carousel */}
          {activeDeptConfig.presets.length > 0 && (
            <div className="px-4 py-2.5 bg-slate-100/80 border-t border-slate-200/50 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <span className="text-[10px] font-black text-slate-400 flex items-center gap-0.5 shrink-0">
                <Zap className="w-3 h-3 text-amber-500" /> اقتراحات:
              </span>
              {activeDeptConfig.presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset.prompt)}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 text-[10px] font-black rounded-lg transition-all active:scale-95 shrink-0 cursor-pointer"
                >
                  {preset.title}
                </button>
              ))}
            </div>
          )}

          {/* Control center & Input area */}
          <div className="p-4 bg-slate-50 border-t border-slate-200/80 space-y-3">
            {/* Dept tabs Level 1 */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-black text-slate-400">تأطير تركيز المساعد (قسم النظام الفعلي):</div>
              <div className="grid grid-cols-3 gap-1">
                {DEPARTMENTS.map((dept) => {
                  const isActive = activeMainDept === dept.id;
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => {
                        setActiveMainDept(dept.id);
                        const firstSub = dept.subsections[0]?.id || "all";
                        setActiveSubDept(firstSub);
                      }}
                      className={`px-2 py-1.5 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1 border active:scale-95 duration-200 cursor-pointer ${
                        isActive
                          ? "bg-indigo-600 text-white border-indigo-700 shadow-sm"
                          : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <span className="font-arabic font-extrabold text-[9px]">{dept.nameAr}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subsection select Level 2 */}
            {activeMainDept !== "general" && (
              <div className="space-y-1 bg-white p-2 rounded-xl border border-slate-200/50">
                <div className="text-[9px] font-black text-slate-400">الفرع الدقيق:</div>
                <div className="flex flex-wrap gap-1">
                  {activeDeptConfig.subsections.map((sub) => {
                    const isSubActive = activeSubDept === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setActiveSubDept(sub.id)}
                        className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-all flex items-center gap-1 border cursor-pointer ${
                          isSubActive
                            ? "bg-indigo-50 text-indigo-700 border-indigo-300"
                            : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <SubsectionIcon name={sub.icon} className="w-2.5 h-2.5" />
                        <span>{sub.nameAr}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Input field and send */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="اكتب أمر التعديل المحفوظ بقاعدة البيانات مباشرة..."
                className="flex-1 bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 font-semibold transition-all focus:outline-none"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className={`p-2 rounded-xl font-bold transition-all flex items-center justify-center cursor-pointer ${
                  !inputMessage.trim() || isLoading
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 shadow"
                }`}
              >
                <Send className="w-4 h-4 rotate-180" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
