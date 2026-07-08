const fs = require('fs');
const lines = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8').split('\n');

const startIdx = lines.findIndex(l => l.includes('return filtered.map((emp) => {'));
const endIdx = lines.findIndex(l => l.includes('}); })()}'));

if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
  const trBody = \`                          return filtered.map((emp) => {
                            const canModifyRow = selectedRun.status === "Draft" || selectedRun.status === "Needs Modification" || selectedRun.status === "Under Modification";
                            const netRemaining = Math.max(0, emp.netSalary - (emp.muddahAmount || 0));
                            return (
                              <tr key={emp.id} className="border-b border-slate-100/50 hover:bg-slate-50/50 transition-colors">
                                {/* EMPLOYEE INFO */}
                                <td className="py-4 px-4 sticky right-0 bg-white z-10 border-l border-slate-200">
                                  <div className="font-bold text-slate-800 text-[13.5px] font-arabic flex items-center gap-2">
                                    {emp.arabicName}
                                    {emp.company && (
                                      <span className={\\\`text-[9px] px-1.5 py-0.5 rounded border \\\${
                                        emp.company.includes("ساين")
                                          ? "bg-purple-50 text-purple-700 border-purple-100"
                                          : "bg-blue-50 text-blue-700 border-blue-100"
                                      }\\\`}>
                                        {emp.company}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10.5px] text-slate-500 font-mono font-bold mt-0.5">
                                    ID: {emp.employeeId} | {emp.jobTitle}
                                  </div>
                                </td>

                                {/* BANK INFO */}
                                <td className="py-4 px-4 bg-sky-50/20">
                                  <div className="space-y-1 text-right max-w-[140px]">
                                    <div className="flex items-center gap-1">
                                      <span className="text-[9px] text-slate-400">البنك:</span>
                                      <InlineEditable type="text" value={emp.bankName || ""} onSave={(val) => handleInlineSave(emp.id, 'bankName', val)} disabled={!canModifyRow || !isAccountant} className="font-arabic font-bold text-[10px] w-[80px] text-right" />
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-[9px] text-slate-400">IBAN:</span>
                                      <InlineEditable type="text" value={emp.iban || ""} onSave={(val) => handleInlineSave(emp.id, 'iban', val)} disabled={!canModifyRow || !isAccountant} className="font-mono font-bold text-[10px] tracking-tight text-right w-[110px]" />
                                    </div>
                                  </div>
                                </td>

                                {/* EARNINGS */}
                                <td className="py-4 px-3 font-mono font-bold text-slate-700 text-center"><InlineEditable value={emp.basicSalary} onSave={(val) => handleInlineSave(emp.id, 'basicSalary', val)} disabled={!canModifyRow || !isAccountant} /></td>
                                <td className="py-4 px-3 font-mono font-bold text-slate-700 text-center"><InlineEditable value={emp.housingAllowance} onSave={(val) => handleInlineSave(emp.id, 'housingAllowance', val)} disabled={!canModifyRow || !isAccountant} /></td>
                                <td className="py-4 px-3 font-mono font-bold text-slate-700 text-center"><InlineEditable value={emp.transportAllowance} onSave={(val) => handleInlineSave(emp.id, 'transportAllowance', val)} disabled={!canModifyRow || !isAccountant} /></td>
                                <td className="py-4 px-3 font-mono font-bold text-slate-700 text-center"><InlineEditable value={emp.foodAllowance} onSave={(val) => handleInlineSave(emp.id, 'foodAllowance', val)} disabled={!canModifyRow || !isAccountant} /></td>
                                <td className="py-4 px-3 font-mono font-bold text-indigo-600 text-center" style={{ display: 'none' }}><InlineEditable value={emp.muddahAmount} onSave={(val) => handleInlineSave(emp.id, 'muddahAmount', val)} disabled={!canModifyRow || !isAccountant} /></td>
                                <td className="py-4 px-3 font-mono font-bold text-indigo-600 text-center"><InlineEditable value={emp.overtimeHours} onSave={(val) => handleInlineSave(emp.id, 'overtimeHours', val)} disabled={!canModifyRow || !isAccountant} /></td>
                                <td className="py-4 px-3 font-mono font-bold text-indigo-600 text-center"><InlineEditable value={emp.overtimeAmount} onSave={(val) => handleInlineSave(emp.id, 'overtimeAmount', val)} disabled={!canModifyRow || !isAccountant} /></td>
                                <td className="py-4 px-3 font-mono font-bold text-[#0072BC] text-center"><InlineEditable value={emp.otherAllowances} onSave={(val) => handleInlineSave(emp.id, 'otherAllowances', val)} disabled={!canModifyRow || !isAccountant} /></td>

                                {/* DEDUCTIONS */}
                                {showDetailedDeductions && (
                                  <>
                                    <td className="py-4 px-3 font-mono font-bold text-rose-600 text-center"><InlineEditable value={emp.loansDeduction} onSave={(val) => handleInlineSave(emp.id, 'loansDeduction', val)} disabled={!canModifyRow || !isAccountant} /></td>
                                    <td className="py-4 px-3 font-mono font-bold text-rose-600 text-center"><InlineEditable value={emp.absenceDeduction} onSave={(val) => handleInlineSave(emp.id, 'absenceDeduction', val)} disabled={!canModifyRow || !isAccountant} /></td>
                                    <td className="py-4 px-3 font-mono font-bold text-rose-600 text-center"><InlineEditable value={emp.lateDeduction} onSave={(val) => handleInlineSave(emp.id, 'lateDeduction', val)} disabled={!canModifyRow || !isAccountant} /></td>
                                    <td className="py-4 px-3 font-mono font-bold text-rose-600 text-center"><InlineEditable value={emp.penaltyDeduction} onSave={(val) => handleInlineSave(emp.id, 'penaltyDeduction', val)} disabled={!canModifyRow || !isAccountant} /></td>
                                    <td className="py-4 px-3 font-mono font-bold text-rose-600 text-center"><InlineEditable value={emp.gosiDeduction} onSave={(val) => handleInlineSave(emp.id, 'gosiDeduction', val)} disabled={!canModifyRow || !isAccountant} /></td>
                                  </>
                                )}
                                
                                {/* OTHER DEDUCTIONS */}
                                <td className="py-4 px-3 font-mono font-bold text-rose-600 text-center">
                                  <InlineEditable value={emp.otherDeductions} onSave={(val) => handleInlineSave(emp.id, 'otherDeductions', val)} disabled={!canModifyRow || !isAccountant} />
                                </td>

                                {/* SUMMARY */}
                                <td className="py-4 px-3 font-mono font-bold text-indigo-600 text-center">
                                  {emp.netSalary.toLocaleString('en-US')}
                                </td>
                                <td className="py-4 px-3 font-mono font-bold text-amber-600 text-center bg-amber-50/30">
                                  <InlineEditable value={emp.muddahAmount || 0} onSave={(val) => handleInlineSave(emp.id, 'muddahAmount', val)} disabled={!canModifyRow || !isAccountant} />
                                </td>
                                <td className="py-4 px-3 font-mono font-bold text-emerald-600 text-center bg-emerald-50/20">
                                  {netRemaining.toLocaleString('en-US')}
                                </td>

                                {/* TRANSFER STATUS */}
                                <td className="py-4 px-3 text-center">
                                  <span className={\\\`text-[9px] px-2 py-0.5 rounded-full font-bold \\\${emp.transferStatus === 'Transferred' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}\\\`}>
                                    {emp.transferStatus === 'Transferred' ? 'تم التحويل' : 'بانتظار التحويل'}
                                  </span>
                                </td>

                                {/* ACTIONS */}
                                <td className="py-4 px-4 text-left">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => {
                                        setSelectedPayslipEmployee(emp);
                                        setIsPayslipModalOpen(true);
                                      }}
                                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold flex items-center gap-0.5"
                                      title="عرض كشف الراتب الفردي"
                                    >
                                      كشف راتب
                                    </button>
                                    {canModifyRow && (
                                      <button
                                        onClick={() => {
                                          handleRemoveEmployeeRow(emp.id);
                                        }}
                                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-[10px] font-bold flex items-center gap-0.5"
                                        title="حذف الموظف من المسير"
                                      >
                                        حذف
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          }); })()}\`;

  lines.splice(startIdx, endIdx - startIdx + 1, trBody);
  fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', lines.join('\\n'));
  console.log("Success replacing array.");
} else {
  console.log("Failed to find bounds.");
}
