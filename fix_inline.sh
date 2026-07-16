sed -i '160,221c\
  const [isEditing, setIsEditing] = React.useState(false);\
  const [localValue, setLocalValue] = React.useState(value);\
\
  React.useEffect(() => {\
    setLocalValue(value);\
  }, [value]);\
\
  const displayVal = type === "number" ? (Number(value) || 0).toLocaleString("en-US") : (value || "—");\
\
  if (disabled) {\
    return (\
      <div className="relative inline-block group">\
        <span className={className}>{displayVal}</span>\
        {mod && (\
          <>\
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 border border-white cursor-help"></span>\
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
  }\
\
  if (isEditing) {\
    return (\
      <input\
        autoFocus\
        type={type}\
        value={localValue === 0 && type === "number" ? "" : localValue}\
        onFocus={(e) => e.target.select()}\
        onChange={(e) => setLocalValue(type === "number" ? (e.target.value === "" ? 0 : Number(e.target.value)) : e.target.value)}\
        onBlur={() => {\
          setIsEditing(false);\
          if (localValue !== value) {\
            onSave(localValue);\
          }\
        }}\
        onKeyDown={(e) => {\
          if (e.key === "Enter") {\
            setIsEditing(false);\
            if (localValue !== value) {\
              onSave(localValue);\
            }\
          }\
        }}\
        className="w-full px-1 py-1 border border-indigo-500 rounded text-[11px] font-mono font-bold text-slate-900 text-center shadow-sm focus:outline-none min-w-[60px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"\
      />\
    );\
  }\
\
  return (\
    <div\
      onClick={() => setIsEditing(true)}\
      className={`relative cursor-pointer hover:bg-slate-100 hover:ring-1 hover:ring-slate-300 rounded px-1 py-0.5 min-w-[2rem] text-center transition-all group ${className} ${mod ? "bg-amber-50/50 ring-1 ring-amber-200" : ""}`}\
    >\
      {displayVal}\
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
};' src/components/finance/MonthlyPayrollRuns.tsx
