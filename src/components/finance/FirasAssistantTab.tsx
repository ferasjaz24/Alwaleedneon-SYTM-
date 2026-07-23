import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Trash2, 
  Bot, 
  HelpCircle, 
  DollarSign, 
  FileText, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  Save,
  History,
  Plus,
  MessageSquare,
  Calendar,
  X
} from "lucide-react";
import Markdown from "react-markdown";
import { db } from "../../firebase";
import { collection, addDoc, getDocs, query, where, orderBy, doc, deleteDoc } from "firebase/firestore";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface SavedChat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

interface FirasAssistantTabProps {
  lang: "ar" | "en";
  user: any;
}

export default function FirasAssistantTab({ lang, user }: FirasAssistantTabProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // History list and sidebar states
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [activeSavedChatId, setActiveSavedChatId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load Saved Chats History & Initialize fresh active chat on mount (cleared on return)
  useEffect(() => {
    // 1. Initialize fresh welcome message (always starts fresh when returning to this tab)
    const welcomeMsg: Message = {
      id: "welcome",
      role: "assistant",
      content: lang === "ar" 
        ? "مرحباً! أنا **المحاسب المالي الذكي**، مستشارك المالي الذكي ومحاسبك القانوني وخبير الأنظمة المالية بأكثر من 60 عاماً من الخبرة المترسخة.\n\nيسعدني جداً تقديم الدعم لك في كل ما يتعلق بـ:\n- فهم وتطبيق قوانين العمل السعودية (نهاية الخدمة، الإجازات، البدلات).\n- إرشادات إعداد الحسابات الختامية والقيود المزدوجة.\n- الالتزام الضريبي ونظام هيئة الزكاة والضريبة والجمارك (ZATCA).\n- تحليل التكاليف وهوامش الربح للمشاريع.\n\n*يرجى العلم بأنني مختص حصرياً بالمسائل المالية والضريبية والمحاسبية.* كيف يمكنني مساعدتك اليوم؟"
        : "Hello! I am your **Smart Financial Accountant**, Certified Public Accountant, and financial systems expert with over 60 years of extensive experience.\n\nI'm delighted to assist you with:\n- Understanding and applying Saudi labor laws (EOS payouts, vacations, allowances).\n- Accounting entries, double-entry bookkeeping, and ledger auditing.\n- Zakat, Tax, and Customs Authority (ZATCA) electronic invoicing compliance.\n- Cost analyses, project profit margins, and budgeting.\n\n*Please note that my expertise is strictly restricted to financial, accounting, and taxation matters.* How can I assist you today?",
      timestamp: new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([welcomeMsg]);
    setActiveSavedChatId(null);
    setError(null);

    // 2. Fetch saved chats list
    fetchSavedChats();
  }, [lang, user]);

  // Fetch saved conversations from Firestore
  const fetchSavedChats = async () => {
    try {
      const q = query(
        collection(db, "firas_saved_chats"),
        where("userId", "==", user?.id || "guest")
      );
      const snap = await getDocs(q);
      const chats = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as SavedChat[];
      
      // Sort client-side by createdAt descending to avoid composite index requirement
      chats.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setSavedChats(chats);
      
      // Sync to localStorage
      localStorage.setItem(`firas_saved_chats_list_${user?.id || "guest"}`, JSON.stringify(chats));
    } catch (e) {
      console.error("Failed to fetch saved chats from Firestore, falling back to localStorage:", e);
      const local = localStorage.getItem(`firas_saved_chats_list_${user?.id || "guest"}`);
      if (local) {
        try {
          setSavedChats(JSON.parse(local));
        } catch (err) {
          console.error("Failed to parse local saved chats:", err);
        }
      }
    }
  };

  // Scroll active chat panel to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/gemini/firas-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        let errorMsg = lang === "ar" ? "فشل الاتصال بالخادم المالي" : "Failed to connect to the financial server";
        try {
          const errData = await response.json();
          if (errData && (errData.error || errData.details)) {
            errorMsg = errData.details || errData.error;
          }
        } catch (e) {
          // ignore parsing error
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.text || (lang === "ar" ? "عذراً، لم أستطع صياغة رد مالي في هذه اللحظة." : "Apologies, I was unable to compile a financial response at this time."),
        timestamp: new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })
      };

      setMessages([...updatedMessages, assistantMsg]);
    } catch (err: any) {
      console.error("Smart Accountant API Connection Error Details:", err);
      setError(err.message || (lang === "ar" ? "حدث خطأ غير متوقع." : "An unexpected error occurred."));
    } finally {
      setIsLoading(false);
    }
  };

  // Save current conversation to history list
  const saveCurrentChat = async () => {
    if (messages.length <= 1) {
      alert(lang === "ar" ? "لا توجد رسائل لحفظها في المحادثة الحالية." : "There are no messages to save in the current conversation.");
      return;
    }

    const firstUserQuery = messages.find(m => m.role === "user")?.content || "";
    const defaultTitle = firstUserQuery 
      ? (firstUserQuery.length > 40 ? firstUserQuery.substring(0, 40) + "..." : firstUserQuery)
      : (lang === "ar" ? "محادثة مالية جديدة" : "New Financial Chat");

    const title = window.prompt(
      lang === "ar" ? "أدخل عنواناً لحفظ هذه المحادثة:" : "Enter a title to save this conversation:",
      defaultTitle
    );

    if (title === null) return; // User cancelled

    const finalTitle = title.trim() || defaultTitle;

    const newSavedChat = {
      userId: user?.id || "guest",
      title: finalTitle,
      messages: messages,
      createdAt: new Date().toISOString(),
    };

    setIsLoading(true);
    try {
      const docRef = await addDoc(collection(db, "firas_saved_chats"), newSavedChat);
      
      const chatWithId: SavedChat = {
        id: docRef.id,
        title: finalTitle,
        messages: messages,
        createdAt: newSavedChat.createdAt
      };
      
      const updatedList = [chatWithId, ...savedChats];
      setSavedChats(updatedList);
      localStorage.setItem(`firas_saved_chats_list_${user?.id || "guest"}`, JSON.stringify(updatedList));
      setActiveSavedChatId(docRef.id);
      
      alert(lang === "ar" ? "تم حفظ المحادثة بنجاح في سجل المحادثات المحفوظة!" : "Conversation saved successfully to history!");
    } catch (e) {
      console.error("Failed to save chat to Firestore:", e);
      // Local fallback
      const localId = crypto.randomUUID();
      const chatWithId: SavedChat = {
        id: localId,
        title: finalTitle,
        messages: messages,
        createdAt: newSavedChat.createdAt
      };
      const updatedList = [chatWithId, ...savedChats];
      setSavedChats(updatedList);
      localStorage.setItem(`firas_saved_chats_list_${user?.id || "guest"}`, JSON.stringify(updatedList));
      setActiveSavedChatId(localId);
      alert(lang === "ar" ? "تم الحفظ محلياً بنجاح (فشل الاتصال بقاعدة البيانات)" : "Saved locally successfully (database connection failed)");
    } finally {
      setIsLoading(false);
    }
  };

  // Start a fresh empty/welcome conversation
  const startNewChat = () => {
    setActiveSavedChatId(null);
    const welcomeMsg: Message = {
      id: "welcome",
      role: "assistant",
      content: lang === "ar" 
        ? "مرحباً! أنا **المحاسب المالي الذكي**، مستشارك المالي الذكي ومحاسبك القانوني وخبير الأنظمة المالية بأكثر من 60 عاماً من الخبرة المترسخة.\n\nيسعدني جداً تقديم الدعم لك في كل ما يتعلق بـ:\n- فهم وتطبيق قوانين العمل السعودية (نهاية الخدمة، الإجازات، البدلات).\n- إرشادات إعداد الحسابات الختامية والقيود المزدوجة.\n- الالتزام الضريبي ونظام هيئة الزكاة والضريبة والجمارك (ZATCA).\n- تحليل التكاليف وهوامش الربح للمشاريع.\n\n*يرجى العلم بأنني مختص حصرياً بالمسائل المالية والضريبية والمحاسبية.* كيف يمكنني مساعدتك اليوم؟"
        : "Hello! I am your **Smart Financial Accountant**, Certified Public Accountant, and financial systems expert with over 60 years of extensive experience.\n\nI'm delighted to assist you with:\n- Understanding and applying Saudi labor laws (EOS payouts, vacations, allowances).\n- Accounting entries, double-entry bookkeeping, and ledger auditing.\n- Zakat, Tax, and Customs Authority (ZATCA) electronic invoicing compliance.\n- Cost analyses, project profit margins, and budgeting.\n\n*Please note that my expertise is strictly restricted to financial, accounting, and taxation matters.* How can I assist you today?",
      timestamp: new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([welcomeMsg]);
    setError(null);
  };

  // Load a saved conversation into the active chat panel
  const loadSavedChat = (chat: SavedChat) => {
    setActiveSavedChatId(chat.id);
    setMessages(chat.messages);
    setError(null);
  };

  // Delete saved conversation
  const deleteSavedChat = async (chatId: string) => {
    if (window.confirm(lang === "ar" ? "هل أنت متأكد من حذف هذه المحادثة من سجل المحفوظات؟" : "Are you sure you want to delete this conversation from history?")) {
      try {
        await deleteDoc(doc(db, "firas_saved_chats", chatId));
        const updatedList = savedChats.filter(c => c.id !== chatId);
        setSavedChats(updatedList);
        localStorage.setItem(`firas_saved_chats_list_${user?.id || "guest"}`, JSON.stringify(updatedList));
        if (activeSavedChatId === chatId) {
          startNewChat();
        }
      } catch (e) {
        console.error("Failed to delete chat from Firestore, performing local removal fallback:", e);
        const updatedList = savedChats.filter(c => c.id !== chatId);
        setSavedChats(updatedList);
        localStorage.setItem(`firas_saved_chats_list_${user?.id || "guest"}`, JSON.stringify(updatedList));
        if (activeSavedChatId === chatId) {
          startNewChat();
        }
      }
    }
  };

  const suggestions = lang === "ar" ? [
    {
      title: "قانون العمل السعودي 🇸🇦",
      desc: "كيف تحسب مكافأة نهاية الخدمة للمستقيل قبل 5 سنوات؟",
      prompt: "كيف يتم حساب مكافأة نهاية الخدمة في قانون العمل السعودي للموظف المستقيل الذي خدم أقل من 5 سنوات؟"
    },
    {
      title: "دليل قيود المحاسبة 📒",
      desc: "صيغة قيد إهلاك الأصول الثابتة السنوية",
      prompt: "ساعدني في كتابة قيد مزدوج صحيح محاسبياً لإهلاك الأصول الثابتة (مثل أجهزة الحاسب الآلي للشركة)."
    },
    {
      title: "شرح فواتير ZATCA 🧾",
      desc: "شروط إصدار الفاتورة الضريبية المبسطة",
      prompt: "ما هي المتطلبات والشروط الأساسية للفاتورة الضريبية المبسطة الإلكترونية (ZATCA) في المرحلة الثانية؟"
    }
  ] : [
    {
      title: "Saudi Labor Law 🇸🇦",
      desc: "How is EOS calculated for resignation under 5 years?",
      prompt: "How is the End of Service (EOS) award calculated under Saudi labor law for an employee who resigns before completing 5 years of service?"
    },
    {
      title: "Accounting Entries 📒",
      desc: "Depreciation of fixed assets journal entry",
      prompt: "Help me write a standard double-entry journal entry to record annual depreciation for company fixed assets (laptops/equipment)."
    },
    {
      title: "ZATCA Compliance 🧾",
      desc: "Simplified Tax Invoice requirements",
      prompt: "What are the core requirements for a Simplified Tax Invoice in Phase 2 of ZATCA electronic invoicing?"
    }
  ];

  return (
    <div id="firas-assistant-tab-container" className="flex flex-col md:flex-row h-[calc(100vh-210px)] max-h-[850px] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      
      {/* LEFT PANE: Active Chat Panel */}
      <div id="firas-active-chat-panel" className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
        
        {/* Top Header */}
        <div id="firas-chat-header" className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                {lang === "ar" ? "المحاسب المالي الذكي" : "Smart Financial Accountant"}
                <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-sky-100">
                  <Sparkles className="w-3 h-3 text-sky-500" />
                  {lang === "ar" ? "مستشار ذكي" : "AI Specialist"}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === "ar" ? "محاسبة إلكترونية معتمدة وفق الأنظمة المالية والضريبية السعودية" : "Automated certified accounting compliant with Saudi financial & ZATCA regulations"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Save Chat Button */}
            <button
              id="firas-save-chat-btn"
              onClick={saveCurrentChat}
              disabled={messages.length <= 1 || isLoading}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer select-none"
              title={lang === "ar" ? "حفظ هذه المحادثة الحالية" : "Save this active conversation"}
            >
              <Save className="w-4 h-4" />
              <span>{lang === "ar" ? "حفظ المحادثة" : "Save Chat"}</span>
            </button>

            {/* Toggle History Button (Mobile Only) */}
            <button
              id="firas-toggle-history-btn"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="md:hidden flex items-center justify-center p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title={lang === "ar" ? "سجل المحادثات" : "Chat History"}
            >
              <History className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeSavedChatId && (
            <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-[11px] text-amber-800 text-center font-semibold mb-2">
              ⚠️ {lang === "ar" ? "أنت تستعرض محادثة محفوظة من السجل." : "You are viewing a saved conversation from history."}
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ms-auto flex-row-reverse" : "me-auto"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700 shrink-0 select-none">
                  <Bot className="w-4.5 h-4.5" />
                </div>
              )}
              
              <div className="space-y-1">
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-sky-600 text-white rounded-tr-none"
                      : "bg-white text-slate-700 border border-slate-200 rounded-tl-none shadow-xs"
                  }`}
                >
                  <div className="markdown-body">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </div>
                <p className={`text-[10px] text-slate-400 px-1 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 max-w-[85%] me-auto">
              <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700 shrink-0 animate-spin">
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none text-sm text-slate-400 flex items-center gap-2 shadow-xs">
                <span>{lang === "ar" ? "يجري التحليل المحاسبي والتدقيق الفني..." : "Smart Financial Accountant is compiling and auditing financial data..."}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl flex items-center gap-2 max-w-[85%] me-auto">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Suggested Quick Prompts */}
        {messages.length === 1 && !isLoading && (
          <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-200/60 shrink-0">
            <p className="text-[11px] font-extrabold text-slate-400 mb-2 flex items-center gap-1.5 uppercase tracking-wide select-none">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              {lang === "ar" ? "مواضيع مقترحة للمناقشة المالية:" : "Suggested financial topics:"}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s.prompt)}
                  className="p-3 bg-white hover:bg-sky-50/50 border border-slate-200 hover:border-sky-200 rounded-xl text-right transition-all group cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-500 group-hover:scale-125 transition-transform" />
                    <span className="text-xs font-bold text-slate-700 group-hover:text-sky-800">{s.title}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 group-hover:text-slate-500 line-clamp-1">
                    {s.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Input Area */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              placeholder={
                lang === "ar" 
                  ? "اسأل المحاسب المالي الذكي عن مكافآت نهاية الخدمة، القيود المحاسبية، الالتزام الضريبي..." 
                  : "Ask the Smart Financial Accountant about EOS calculations, accounting journal entries, ZATCA tax rules..."
              }
              className="flex-1 px-4 py-3 bg-slate-50 hover:bg-slate-100/75 focus:bg-white text-sm text-slate-800 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="px-4 py-3 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl font-bold flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Send className="w-4.5 h-4.5" />}
            </button>
          </form>
          <p className="text-[10px] text-slate-400 mt-2 text-center select-none">
            {lang === "ar" 
              ? "المحاسب المالي الذكي هو مساعد مالي مدعوم بالذكاء الاصطناعي. يرجى دائماً مراجعة المستندات والبيانات الحسابية والاعتماد على توثيق هيئة الزكاة والضريبة."
              : "The Smart Financial Accountant is an AI-powered financial assistant. Please double check reports, double-entries, and refer to official ZATCA documentation."}
          </p>
        </div>
      </div>

      {/* RIGHT PANE: Saved Chats History (Collapsible on mobile, persistent on desktop) */}
      <div 
        id="firas-saved-chats-sidebar"
        className={`${
          isHistoryOpen ? "block" : "hidden"
        } md:block md:w-80 bg-white border-t md:border-t-0 border-r-0 md:border-l border-slate-200 flex flex-col h-full overflow-hidden shrink-0`}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-slate-50/75 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2 text-slate-700 select-none">
            <History className="w-4.5 h-4.5 text-sky-600" />
            <span className="font-extrabold text-xs">{lang === "ar" ? "سجل المحادثات المحفوظة" : "Saved Conversations"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={startNewChat}
              className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
              title={lang === "ar" ? "بدء محادثة جديدة" : "Start New Conversation"}
            >
              <Plus className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => setIsHistoryOpen(false)}
              className="md:hidden p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
              title={lang === "ar" ? "إغلاق السجل" : "Close History"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {savedChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-center px-4 select-none">
              <MessageSquare className="w-8 h-8 mb-2 text-slate-300 stroke-[1.5]" />
              <p className="text-xs">{lang === "ar" ? "لا توجد محادثات محفوظة بعد." : "No saved chats yet."}</p>
              <p className="text-[10px] text-slate-400 mt-1">{lang === "ar" ? "ابدأ محادثة ثم اضغط على حفظ المحادثة للاحتفاظ بها هنا." : "Start a chat and click Save Chat to keep it here."}</p>
            </div>
          ) : (
            savedChats.map((chat) => {
              const isSelected = activeSavedChatId === chat.id;
              return (
                <div
                  key={chat.id}
                  onClick={() => loadSavedChat(chat)}
                  className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? "bg-sky-50/75 border-sky-200 shadow-2xs" 
                      : "bg-white hover:bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <MessageSquare className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? "text-sky-600 font-extrabold" : "text-slate-400"}`} />
                    <div className="flex-1 min-w-0 pr-4">
                      <h4 className={`text-xs font-bold truncate ${isSelected ? "text-sky-900" : "text-slate-700"}`}>
                        {chat.title}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>{new Date(chat.createdAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Delete Saved Chat Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSavedChat(chat.id);
                    }}
                    className="absolute top-2.5 left-2.5 opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all cursor-pointer"
                    title={lang === "ar" ? "حذف من السجل" : "Delete from history"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
