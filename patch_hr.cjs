const fs = require('fs');

let hrContent = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

// Add muddah to defaults
hrContent = hrContent.replace(/food: emp\.allowances\?\.food \|\| 0,/g, `food: emp.allowances?.food || 0,\n      muddah: emp.allowances?.muddah || 0,`);

hrContent = hrContent.replace(/food: \(selectedEmp\.allowances as any\)\?\.food \|\| 0,/g, `food: (selectedEmp.allowances as any)?.food || 0,\n                            muddah: (selectedEmp.allowances as any)?.muddah || 0,`);

// Add the field in UI
const hrUIField = `
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 font-arabic">
                              {lang === "ar" ? "مُدد" : "Muddah"}
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">SAR</span>
                              <input
                                type="number"
                                min="0"
                                className="w-full pl-10 pr-3 py-2 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-sm font-bold font-mono transition-all"
                                value={financialForm.muddah || 0}
                                onChange={(e) =>
                                  setFinancialForm({
                                    ...financialForm,
                                    muddah: Number(e.target.value),
                                  })
                                }
                              />
                            </div>
                          </div>`;

hrContent = hrContent.replace(/(<label className="block text-xs font-bold text-slate-700 mb-1.5 font-arabic">\s*\{lang === "ar" \? "بدل المعيشة\/طعام" : "Food\/Living Allowance"\}\s*<\/label>[\s\S]*?<\/div>\s*<\/div>)/, `$1\n${hrUIField}`);

const hrReadonlyField = `
                          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 mb-1">{lang === "ar" ? "مُدد" : "Muddah"}</p>
                            <p className="font-mono font-bold text-slate-800">
                              SAR {((selectedEmp.allowances as any)?.muddah || 0).toLocaleString('en-US')}
                            </p>
                          </div>`;

hrContent = hrContent.replace(/(<p className="text-\[10px\] font-bold text-slate-400 mb-1">\{lang === "ar" \? "بدل الإعاشة" : "Food Allowance"\}<\/p>[\s\S]*?<\/div>)/, `$1\n${hrReadonlyField}`);

fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', hrContent);
