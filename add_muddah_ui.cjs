const fs = require('fs');

let content = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

const foodInput = \`<div>
                            <label className="block text-slate-400 font-bold mb-1 text-[10px]">
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
                          </div>\`;

const muddahInput = \`<div>
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
                          </div>\`;

content = content.replace(foodInput, foodInput + "\\n" + muddahInput);

const foodDisplay = \`<div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100/70">
                          <span className="block text-[10px] text-slate-400 font-bold">
                            {lang === "ar" ? "بدل طعام" : "Food Allowance:"}
                          </span>
                          <p className="font-mono font-black text-slate-700 mt-0.5">
                            {(
                              selectedEmp.allowances as any
                            )?.food?.toLocaleString('en-US') || 0}{" "}
                            SAR
                          </p>
                        </div>\`;

const muddahDisplay = \`<div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100/70">
                          <span className="block text-[10px] text-slate-400 font-bold">
                            {lang === "ar" ? "بدل مدة / ساعات" : "Muddah/Hours:"}
                          </span>
                          <p className="font-mono font-black text-slate-700 mt-0.5">
                            {(
                              selectedEmp.allowances as any
                            )?.muddah?.toLocaleString('en-US') || 0}{" "}
                            SAR
                          </p>
                        </div>\`;

content = content.replace(foodDisplay, foodDisplay + "\\n" + muddahDisplay);

// And we need to add it to the total salary display calculation
content = content.replace(/(selectedEmp.basicSalary \|\| 0\) \+\n\s*\(selectedEmp.allowances\?\.housing \|\| 0\) \+\n\s*\(selectedEmp.allowances\?\.transport \|\| 0\) \+\n\s*\(\(selectedEmp.allowances as any\)\?\.food \|\| 0\))/,
    "$1 + ((selectedEmp.allowances as any)?.muddah || 0)");

// And inside the sum for the editing view:
content = content.replace(/Number\(salaryContractForm\.basicSalary\) \+\n\s*Number\(salaryContractForm\.housing\) \+\n\s*Number\(salaryContractForm\.transport\) \+\n\s*Number\(salaryContractForm\.food\)/,
    "Number(salaryContractForm.basicSalary) + Number(salaryContractForm.housing) + Number(salaryContractForm.transport) + Number(salaryContractForm.food) + Number(salaryContractForm.muddah)");

fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', content);
