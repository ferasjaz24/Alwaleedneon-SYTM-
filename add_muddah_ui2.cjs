const fs = require('fs');
let content = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

const targetFoodInput = /<label className="block text-slate-400 font-bold mb-1 text-\[10px\]">\s*\{lang === "ar" \? "بدل طعام" : "Food Allowance"\}\s*<\/label>\s*<input\s*type="number"\s*value=\{salaryContractForm\.food \|\| ""\}\s*onChange=\{\(e\) =>\s*setSalaryContractForm\(\{\s*\.\.\.salaryContractForm,\s*food: parseFloat\(e\.target\.value\) \|\| 0,\s*\}\)\s*\}\s*className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-center"\s*\/>\s*<\/div>/;

const replacementInput = `<label className="block text-slate-400 font-bold mb-1 text-[10px]">
                              {lang === "ar" ? "بدل طعام" : "Food Allowance"}
                            </label>
                            <input
                              type="number"
                              value={salaryContractForm.food || ""}
                              onChange={(e) =>
                                setSalaryContractForm({
                                  ...salaryContractForm,
                                  food: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 font-bold mb-1 text-[10px]">
                              {lang === "ar" ? "بدل مدة / ساعات" : "Muddah/Hours"}
                            </label>
                            <input
                              type="number"
                              value={salaryContractForm.muddah || ""}
                              onChange={(e) =>
                                setSalaryContractForm({
                                  ...salaryContractForm,
                                  muddah: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-center"
                            />
                          </div>`;

content = content.replace(targetFoodInput, replacementInput);

fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', content);
