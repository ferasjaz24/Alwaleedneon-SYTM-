const fs = require('fs');
let code = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

const tableBodyRegex = /\{filtered\.map\(\(emp\) => \{[\s\S]*?return \([\s\S]*?<tr key=\{emp\.id\}[\s\S]*?<\/tr>\s*\);\s*\}\);\s*\}\)\(\)\}/;

const trBody = "{filtered.map((emp) => {\n" +
"                          const netRemaining = Math.max(0, emp.netSalary - (emp.muddahAmount || 0));\n" +
"                          return (\n" +
"                            <tr key={emp.id} className=\"border-b border-slate-100/50 hover:bg-slate-50/50 transition-colors\">\n" +
"                              {/* EMPLOYEE INFO */}\n" +
"                              <td className=\"py-4 px-4 sticky right-0 bg-white z-10 border-l border-slate-200\">\n" +
"                                <div className=\"font-bold text-slate-800 text-[13.5px] font-arabic flex items-center gap-2\">\n" +
"                                  {emp.arabicName}\n" +
"                                  {emp.company && (\n" +
"                                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${ emp.company.includes('ساين') ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100' }`}>\n" +
"                                      {emp.company}\n" +
"                                    </span>\n" +
"                                  )}\n" +
"                                </div>\n" +
"                                <div className=\"text-[10.5px] text-slate-500 font-mono font-bold mt-0.5\">\n" +
"                                  ID: {emp.employeeId} | {emp.jobTitle}\n" +
"                                </div>\n" +
"                              </td>\n" +
"\n" +
"                              {/* BANK INFO */}\n" +
"                              <td className=\"py-4 px-4 bg-sky-50/20\">\n" +
"                                <div className=\"space-y-1 text-right max-w-[140px]\">\n" +
"                                  <div className=\"flex items-center gap-1\">\n" +
"                                    <span className=\"text-[9px] text-slate-400\">البنك:</span>\n" +
"                                    <InlineEditable type=\"text\" value={emp.bankName || \"\"} onSave={(val) => handleInlineSave(emp.id, 'bankName', val)} disabled={!canModifyRow || !isAccountant} className=\"font-arabic font-bold text-[10px] w-[80px] text-right\" />\n" +
"                                  </div>\n" +
"                                  <div className=\"flex items-center gap-1\">\n" +
"                                    <span className=\"text-[9px] text-slate-400\">IBAN:</span>\n" +
"                                    <InlineEditable type=\"text\" value={emp.iban || \"\"} onSave={(val) => handleInlineSave(emp.id, 'iban', val)} disabled={!canModifyRow || !isAccountant} className=\"font-mono font-bold text-[10px] tracking-tight text-right w-[110px]\" />\n" +
"                                  </div>\n" +
"                                </div>\n" +
"                              </td>\n" +
"\n" +
"                              {/* EARNINGS */}\n" +
"                              <td className=\"py-4 px-3 font-mono font-bold text-slate-700 text-center\"><InlineEditable value={emp.basicSalary} onSave={(val) => handleInlineSave(emp.id, 'basicSalary', val)} disabled={!canModifyRow || !isAccountant} /></td>\n" +
"                              <td className=\"py-4 px-3 font-mono font-bold text-slate-700 text-center\"><InlineEditable value={emp.housingAllowance} onSave={(val) => handleInlineSave(emp.id, 'housingAllowance', val)} disabled={!canModifyRow || !isAccountant} /></td>\n" +
"                              <td className=\"py-4 px-3 font-mono font-bold text-slate-700 text-center\"><InlineEditable value={emp.transportAllowance} onSave={(val) => handleInlineSave(emp.id, 'transportAllowance', val)} disabled={!canModifyRow || !isAccountant} /></td>\n" +
"                              <td className=\"py-4 px-3 font-mono font-bold text-slate-700 text-center\"><InlineEditable value={emp.foodAllowance} onSave={(val) => handleInlineSave(emp.id, 'foodAllowance', val)} disabled={!canModifyRow || !isAccountant} /></td>\n" +
"                              <td className=\"py-4 px-3 font-mono font-bold text-indigo-600 text-center\" style={{ display: 'none' }}><InlineEditable value={emp.muddahAmount} onSave={(val) => handleInlineSave(emp.id, 'muddahAmount', val)} disabled={!canModifyRow || !isAccountant} /></td>\n" +
"                              <td className=\"py-4 px-3 font-mono font-bold text-indigo-600 text-center\"><InlineEditable value={emp.overtimeHours} onSave={(val) => handleInlineSave(emp.id, 'overtimeHours', val)} disabled={!canModifyRow || !isAccountant} /></td>\n" +
"                              <td className=\"py-4 px-3 font-mono font-bold text-indigo-600 text-center\"><InlineEditable value={emp.overtimeAmount} onSave={(val) => handleInlineSave(emp.id, 'overtimeAmount', val)} disabled={!canModifyRow || !isAccountant} /></td>\n" +
"                              <td className=\"py-4 px-3 font-mono font-bold text-[#0072BC] text-center\"><InlineEditable value={emp.otherAllowances} onSave={(val) => handleInlineSave(emp.id, 'otherAllowances', val)} disabled={!canModifyRow || !isAccountant} /></td>\n" +
"\n" +
"                              {/* DEDUCTIONS */}\n" +
"                              {showDetailedDeductions && (\n" +
"                                <>\n" +
"                                  <td className=\"py-4 px-3 font-mono font-bold text-rose-600 text-center\"><InlineEditable value={emp.loansDeduction} onSave={(val) => handleInlineSave(emp.id, 'loansDeduction', val)} disabled={!canModifyRow || !isAccountant} /></td>\n" +
"                                  <td className=\"py-4 px-3 font-mono font-bold text-rose-600 text-center\"><InlineEditable value={emp.absenceDeduction} onSave={(val) => handleInlineSave(emp.id, 'absenceDeduction', val)} disabled={!canModifyRow || !isAccountant} /></td>\n" +
"                                  <td className=\"py-4 px-3 font-mono font-bold text-rose-600 text-center\"><InlineEditable value={emp.lateDeduction} onSave={(val) => handleInlineSave(emp.id, 'lateDeduction', val)} disabled={!canModifyRow || !isAccountant} /></td>\n" +
"                                  <td className=\"py-4 px-3 font-mono font-bold text-rose-600 text-center\"><InlineEditable value={emp.penaltyDeduction} onSave={(val) => handleInlineSave(emp.id, 'penaltyDeduction', val)} disabled={!canModifyRow || !isAccountant} /></td>\n" +
"                                  <td className=\"py-4 px-3 font-mono font-bold text-rose-600 text-center\"><InlineEditable value={emp.gosiDeduction} onSave={(val) => handleInlineSave(emp.id, 'gosiDeduction', val)} disabled={!canModifyRow || !isAccountant} /></td>\n" +
"                                </>\n" +
"                              )}\n" +
"                              \n" +
"                              {/* OTHER DEDUCTIONS */}\n" +
"                              <td className=\"py-4 px-3 font-mono font-bold text-rose-600 text-center\">\n" +
"                                <InlineEditable value={emp.otherDeductions} onSave={(val) => handleInlineSave(emp.id, 'otherDeductions', val)} disabled={!canModifyRow || !isAccountant} />\n" +
"                              </td>\n" +
"\n" +
"                              {/* SUMMARY */}\n" +
"                              <td className=\"py-4 px-3 font-mono font-bold text-indigo-600 text-center\">\n" +
"                                {emp.netSalary.toLocaleString('en-US')}\n" +
"                              </td>\n" +
"                              <td className=\"py-4 px-3 font-mono font-bold text-amber-600 text-center bg-amber-50/30\">\n" +
"                                <InlineEditable value={emp.muddahAmount || 0} onSave={(val) => handleInlineSave(emp.id, 'muddahAmount', val)} disabled={!canModifyRow || !isAccountant} />\n" +
"                              </td>\n" +
"                              <td className=\"py-4 px-3 font-mono font-bold text-emerald-600 text-center bg-emerald-50/20\">\n" +
"                                {netRemaining.toLocaleString('en-US')}\n" +
"                              </td>\n" +
"\n" +
"                              {/* TRANSFER STATUS */}\n" +
"                              <td className=\"py-4 px-3 text-center\">\n" +
"                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${emp.transferStatus === 'Transferred' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>\n" +
"                                  {emp.transferStatus === 'Transferred' ? 'تم التحويل' : 'بانتظار التحويل'}\n" +
"                                </span>\n" +
"                              </td>\n" +
"\n" +
"                              {/* ACTIONS */}\n" +
"                              <td className=\"py-4 px-4 text-left\">\n" +
"                                <div className=\"flex items-center justify-end gap-1\">\n" +
"                                  <button\n" +
"                                    onClick={() => {\n" +
"                                      setSelectedPayslipEmployee(emp);\n" +
"                                      setIsPayslipModalOpen(true);\n" +
"                                    }}\n" +
"                                    className=\"px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold flex items-center gap-0.5\"\n" +
"                                    title=\"عرض كشف الراتب الفردي\"\n" +
"                                  >\n" +
"                                    كشف راتب\n" +
"                                  </button>\n" +
"                                  {canModifyRow && (\n" +
"                                    <button\n" +
"                                      onClick={() => {\n" +
"                                        handleRemoveEmployeeRow(emp.id);\n" +
"                                      }}\n" +
"                                      className=\"px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-[10px] font-bold flex items-center gap-0.5\"\n" +
"                                      title=\"حذف الموظف من المسير\"\n" +
"                                    >\n" +
"                                      حذف\n" +
"                                    </button>\n" +
"                                  )}\n" +
"                                </div>\n" +
"                              </td>\n" +
"                            </tr>\n" +
"                          );\n" +
"                        }); })()}";

code = code.replace(tableBodyRegex, trBody);
if (!code.includes("filtered.map((emp) => {")) {
  console.log("Regex didn't match!");
}
fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', code);
