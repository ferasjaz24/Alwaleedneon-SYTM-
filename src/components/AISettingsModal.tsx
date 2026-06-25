import React, { useState, useEffect } from 'react';
import { Sparkles, Key, Save, X, Info } from 'lucide-react';

interface Props {
  lang: 'ar' | 'en';
  onClose: () => void;
}

export default function AISettingsModal({ lang, onClose }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Fetch the current key from server
    fetch('/api/settings/gemini')
      .then(res => res.json())
      .then(data => {
        if (data.apiKey) {
          setApiKey(data.apiKey);
        }
      })
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/settings/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      });
      if (res.ok) {
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              {lang === 'ar' ? 'إعدادات الذكاء الاصطناعي مدمجة' : 'Integrated AI Settings'}
            </h2>
            <p className="text-xs text-slate-500 font-bold mt-1">
              {lang === 'ar' ? 'نظام المعالجة الذكية والذكاء الاصطناعي الخاص بالمنصة' : 'Platform AI capabilities configuration'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="p-4 bg-purple-50 text-purple-800 rounded-xl text-xs font-bold border border-purple-100 flex gap-3">
             <Info className="w-5 h-5 shrink-0" />
             <p>{lang === 'ar' ? 'لجعل الذكاء الاصطناعي يعمل عند استضافة الموقع على دومينك الخاص، يرجى تزويد النظام بمفتاح برمجي للذكاء الاصطناعي (Gemini API Key). هذا سيفعل كافة ميزات التدقيق والاستعلام المتطورة والمترجم الفوري.' : 'To enable AI capabilities on your own domain deployment, please provide a Gemini API Key. This will unlock all smart translation, intelligence and auditing features.'}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">
                {lang === 'ar' ? 'مفتاح الاستخدام (Gemini API Key)' : 'Access Key (Gemini API Key)'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  autoComplete="off"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono text-left"
                  placeholder="AIzaSy..."
                  dir="ltr"
                />
                <Key className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-bold leading-relaxed">
                {lang === 'ar' ? 'يتم حفظ هذا المفتاح بشكل مشفر ومحمي داخل مركز البيانات ولن يكون مرئياً لأي مستخدم آخر. يمكنك الحصول عليه من منصة Google AI Studio مجاناً.' : 'This key is securely stored in your backend. You can get one for free from Google AI Studio.'}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-purple-600 hover:text-purple-700 underline mx-1">
                   {lang === 'ar' ? 'الحصول على المفتاح من هنا' : 'Get API Key here'}
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-3xl">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
          >
            {lang === 'ar' ? 'إغلاق' : 'Close'}
          </button>
          <button 
            onClick={handleSave}
            disabled={status === 'loading'}
            className={`px-8 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition flex items-center gap-2 ${status === 'success' ? 'bg-emerald-500' : 'bg-purple-600 hover:bg-purple-700'}`}
          >
            {status === 'loading' ? (
               <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : status === 'success' ? (
               <Sparkles className="w-4 h-4" />
            ) : (
               <Save className="w-4 h-4" />
            )}
            {status === 'success' 
               ? (lang === 'ar' ? 'تم الحفظ والربط بنجاح!' : 'Saved successfully!')
               : (lang === 'ar' ? 'حفظ وتفعيل التكامل الذكي' : 'Save & Enable AI Integration')
            }
          </button>
        </div>
      </div>
    </div>
  );
}
