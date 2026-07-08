const fs = require('fs');
let code = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

const bankInfoRegex = /\{\/\* BANK INFO \*\/\}[\s\S]*?\) : \([\s\S]*?<div\s+onClick=\{\(\) => \{(?:.|\n)*?<span className="text-\[10px\] font-mono text-slate-500 tracking-wider font-semibold select-all">\s*\{emp\.iban \|\| "—"\}\s*<\/span>\s*<\/div>\s*\)\s*\}\s*<\/td>/;

const newBankInfo = `{/* BANK INFO */}
                              <td className="py-4 px-4 bg-sky-50/20">
                                <div className="space-y-1 text-right max-w-[140px]">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] text-slate-400">البنك:</span>
                                    <InlineEditable 
                                      type="text"
                                      value={emp.bankName || ""} 
                                      onSave={(val) => handleInlineSave(emp.id, 'bankName', val)} 
                                      disabled={!canModifyRow || !isAccountant} 
                                      className="font-arabic font-bold text-[10px]"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] text-slate-400">IBAN:</span>
                                    <InlineEditable 
                                      type="text"
                                      value={emp.iban || ""} 
                                      onSave={(val) => handleInlineSave(emp.id, 'iban', val)} 
                                      disabled={!canModifyRow || !isAccountant}
                                      className="font-mono font-bold text-[10px] tracking-tight"
                                    />
                                  </div>
                                </div>
                              </td>`;

code = code.replace(bankInfoRegex, newBankInfo);

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', code);
