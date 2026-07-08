const fs = require('fs');
let code = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

const regexMap = [
  { field: "basicSalary", label: "BASIC SALARY" },
  { field: "housingAllowance", label: "HOUSING ALLOWANCE" },
  { field: "transportAllowance", label: "TRANSPORT ALLOWANCE" },
  { field: "foodAllowance", label: "FOOD ALLOWANCE" },
  { field: "muddahAmount", label: "MUDDAH AMOUNT" },
  { field: "overtimeHours", label: "OVERTIME HOURS" },
  { field: "overtimeAmount", label: "OVERTIME AMOUNT" },
  { field: "otherAllowances", label: "OTHER ALLOWANCES" },
  { field: "loansDeduction", label: "LOANS DEDUCTION" },
  { field: "absenceDeduction", label: "ABSENCE DEDUCTION" },
  { field: "lateDeduction", label: "LATE DEDUCTION" },
  { field: "penaltyDeduction", label: "PENALTY DEDUCTION" },
  { field: "gosiDeduction", label: "GOSI" },
];

for (const { field, label } of regexMap) {
  const regex = new RegExp("\\{\\/\\* " + label + " \\*\\/\\}\\s*<td[\\s\\S]*?<\\/td>");
  
  let textClass = "font-mono font-bold text-slate-700";
  if (label.includes("DEDUCTION") || label === "GOSI") textClass = "font-mono font-bold text-rose-600";
  if (label.includes("MUDDAH") || label.includes("OVERTIME")) textClass = "font-mono font-bold text-indigo-600";
  if (label === "OTHER ALLOWANCES") textClass = "font-mono font-bold text-[#0072BC]";
  
  const replacement = "{/* " + label + " */}\n" +
"                              <td className=\"py-4 px-3 " + textClass + "\">\n" +
"                                <InlineEditable \n" +
"                                  value={emp." + field + "} \n" +
"                                  onSave={(val) => handleInlineSave(emp.id, '" + field + "', val)} \n" +
"                                  disabled={!canModifyRow || !isAccountant} \n" +
"                                />\n" +
"                              </td>";
                              
  code = code.replace(regex, replacement);
}

const otherDeductionsRegex = new RegExp("\\{\\/\\* OTHER DEDUCTIONS \\*\\/\\}\\s*<td[\\s\\S]*?<\\/td>");
const otherDeductionsReplacement = "{/* OTHER DEDUCTIONS */}\n" +
"                              <td className=\"py-4 px-3 font-mono font-bold text-rose-600 text-center\">\n" +
"                                <InlineEditable \n" +
"                                  value={emp.otherDeductions} \n" +
"                                  onSave={(val) => handleInlineSave(emp.id, 'otherDeductions', val)} \n" +
"                                  disabled={!canModifyRow || !isAccountant} \n" +
"                                />\n" +
"                              </td>";
code = code.replace(otherDeductionsRegex, otherDeductionsReplacement);

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', code);
