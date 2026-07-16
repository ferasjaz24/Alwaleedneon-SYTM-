sed -i '/    <\/div>\n  );\n}/i \
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">\
        {toasts.map(toast => (\
          <div key={toast.id} className={`p-4 rounded-xl shadow-xl flex items-center gap-3 w-80 pointer-events-auto animate-in slide-in-from-right-8 duration-300 ${toast.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-rose-50 border border-rose-200 text-rose-800"}`}>\
            <div className={`p-1.5 rounded-full ${toast.type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>\
              {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}\
            </div>\
            <div>\
              <div className="font-bold text-sm font-arabic">{toast.messageAr}</div>\
              <div className="text-xs opacity-75">{toast.messageEn}</div>\
            </div>\
            <button onClick={() => setToasts(p => p.filter(t => t.id !== toast.id))} className="mr-auto opacity-50 hover:opacity-100">\
              <X className="w-4 h-4" />\
            </button>\
          </div>\
        ))}\
      </div>' src/components/finance/MonthlyPayrollRuns.tsx
