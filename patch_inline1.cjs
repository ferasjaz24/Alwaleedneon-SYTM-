const fs = require('fs');
let code = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

const inlineEditableComp = `
const InlineEditable = ({ 
  value, 
  onSave, 
  type = "number", 
  className = "", 
  disabled = false 
}: { 
  value: any, 
  onSave: (val: any) => void, 
  type?: string, 
  className?: string, 
  disabled?: boolean 
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  if (disabled) {
    return <span className={className}>{type === "number" ? (Number(value) || 0).toLocaleString('en-US') : value}</span>;
  }

  if (isEditing) {
    return (
      <input
        autoFocus
        type={type}
        value={localValue}
        onChange={(e) => setLocalValue(type === "number" ? Number(e.target.value) : e.target.value)}
        onBlur={() => {
          setIsEditing(false);
          if (localValue !== value) {
            onSave(localValue);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setIsEditing(false);
            if (localValue !== value) {
              onSave(localValue);
            }
          }
        }}
        className="w-full px-1 py-1 border border-indigo-500 rounded text-[11px] font-mono font-bold text-slate-900 text-center shadow-sm focus:outline-none min-w-[60px]"
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={\`cursor-pointer hover:bg-slate-100 hover:ring-1 hover:ring-slate-300 rounded px-1 py-0.5 min-w-[2rem] text-center transition-all \${className}\`}
      title="انقر للتعديل"
    >
      {type === "number" ? (Number(value) || 0).toLocaleString('en-US') : (value || "—")}
    </div>
  );
};
`;

code = code.replace("export default function MonthlyPayrollRuns({", inlineEditableComp + "\nexport default function MonthlyPayrollRuns({");

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', code);
