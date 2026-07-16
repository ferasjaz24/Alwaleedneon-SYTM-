sed -i '/const InlineEditable =/,/};/b; /const ClickableDeduction =/b; /const InlineEditable/i \
const ClickableDeduction = ({ value, mod, onClick, className = "", disabled }: { value: any, mod?: any, onClick: () => void, className?: string, disabled?: boolean }) => {\
  const displayVal = (Number(value) || 0).toLocaleString("en-US");\
  return (\
    <div\
      onClick={() => { if (!disabled) onClick(); }}\
      className={`relative inline-block ${disabled ? "" : "cursor-pointer hover:bg-slate-100 hover:ring-1 hover:ring-slate-300"} rounded px-1 py-0.5 min-w-[2rem] text-center transition-all group ${className} ${mod ? "bg-amber-50/50 ring-1 ring-amber-200" : ""}`}\
    >\
      <span>{displayVal}</span>\
      {mod && (\
        <>\
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 border border-white"></span>\
          <div className="absolute z-[100] invisible group-hover:visible bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] p-2 rounded whitespace-nowrap font-arabic shadow-xl text-right min-w-[120px] pointer-events-none">\
            <div className="font-bold text-amber-300">{mod.modifiedBy}</div>\
            <div className="text-slate-300 text-[9px] mb-1">{new Date(mod.modifiedAt).toLocaleString("ar-SA")}</div>\
            <div className="text-white border-t border-slate-600 pt-1">القيمة السابقة: <span className="font-mono text-amber-200">{mod.oldValue}</span></div>\
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>\
          </div>\
        </>\
      )}\
    </div>\
  );\
};\
' src/components/finance/MonthlyPayrollRuns.tsx
