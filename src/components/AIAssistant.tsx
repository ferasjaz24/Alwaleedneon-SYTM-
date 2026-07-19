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
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";

interface Message {
  id: string;
  text: string;
  isAi: boolean;
  timestamp: Date;
}

export default function AIAssistant({ lang }: { lang: "ar" | "en" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text:
        lang === "ar"
          ? "مرحباً! أنا المساعد الذكي الخاص بك في نظام الوليد. كيف يمكنني مساعدتك اليوم؟"
          : "Hello! I am your Al-Waleed AI Assistant. How can I help you today?",
      isAi: true,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    setInputMessage("");

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      text: userText,
      isAi: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Setup dynamic API key from Vite env
      const env = (import.meta as any).env || {};
      const apiKey =
        env.VITE_GEMINI_API_KEY ||
        localStorage.getItem("VITE_GEMINI_API_KEY");

      if (!apiKey) {
        throw new Error(
          lang === "ar"
            ? "الرجاء إدخال مفتاح Gemini API في إعدادات الذكاء الاصطناعي."
            : "Please configure Gemini API Key in Settings.",
        );
      }

      // Initialize the official SDK
      const ai = new GoogleGenAI({ apiKey });

      // Build context history for the assistant
      const historyText = messages
        .map((m) => `${m.isAi ? "Assistant" : "User"}: ${m.text}`)
        .join("\n");
      const prompt = `Context:\n${historyText}\n\nUser: ${userText}\n\nAssistant:`;

      // Use the model dynamically
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const aiResponseText =
        response.text ||
        (lang === "ar"
          ? "عفواً، لم أتمكن من معالجة الطلب."
          : "Sorry, I could not process that request.");

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: aiResponseText,
          isAi: true,
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      console.error("AI Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text:
            err.message ||
            (lang === "ar"
              ? "حدث خطأ في الاتصال بالمساعد الذكي."
              : "Error connecting to AI Assistant."),
          isAi: true,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-2xl hover:shadow-purple-500/30 hover:scale-105 transition-all flex items-center justify-center animate-bounce-subtle group"
      >
        <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
      </button>
    );
  }

  return (
    <div
      className={`fixed z-[100] transition-all duration-300 ease-in-out flex flex-col bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-200
      ${
        isMinimized
          ? "bottom-6 right-6 w-72 h-14"
          : "bottom-6 right-6 w-80 md:w-96 h-[500px]"
      }`}
    >
      {/* Header */}
      <div
        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 flex justify-between items-center cursor-pointer select-none"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <div>
            <h3 className="font-bold text-sm">
              {lang === "ar" ? "المساعد الذكي" : "AI Assistant"}
            </h3>
            {!isMinimized && (
              <p className="text-[10px] text-purple-200">
                {lang === "ar" ? "مدعوم من Gemini" : "Powered by Gemini"}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className="p-1 hover:bg-white/20 rounded transition"
          >
            <MinusCircle className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              setIsMinimized(false);
            }}
            className="p-1 hover:bg-white/20 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Area (Hidden when minimized) */}
      {!isMinimized && (
        <>
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"
            style={{ direction: lang === "ar" ? "rtl" : "ltr" }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.isAi ? "flex-row" : "flex-row-reverse"}`}
              >
                <div
                  className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center shadow-sm ${msg.isAi ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-600"}`}
                >
                  {msg.isAi ? (
                    <Bot className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`max-w-[75%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.isAi
                      ? "bg-white border border-slate-100 text-slate-700 rounded-tr-none"
                      : "bg-indigo-600 text-white rounded-tl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span
                    className={`text-[9px] block mt-1 ${msg.isAi ? "text-slate-400" : "text-indigo-200"}`}
                  >
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 flex-row">
                <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center bg-indigo-100 text-indigo-600 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 bg-white border border-slate-100 rounded-2xl rounded-tr-none shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span className="text-xs text-slate-400">
                    {lang === "ar" ? "يفكر..." : "Thinking..."}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  lang === "ar" ? "اكتب رسالتك هنا..." : "Type your message..."
                }
                className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ direction: lang === "ar" ? "rtl" : "ltr" }}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md"
              >
                <Send
                  className={`w-4 h-4 ${lang === "ar" ? "rotate-180" : ""}`}
                />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
