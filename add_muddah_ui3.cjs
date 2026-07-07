const fs = require('fs');
let content = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

const targetFoodDisplay = /<div className="p-3 bg-slate-50\/60 rounded-xl border border-slate-100\/70">\s*<span className="block text-\[10px\] text-slate-400 font-bold">\s*\{lang === "ar" \? "بدل طعام" : "Food Allowance:"\}\s*<\/span>\s*<p className="font-mono font-black text-slate-700 mt-0\.5">\s*\{\(\s*selectedEmp\.allowances as any\s*\)\?\.food\?\.toLocaleString\('en-US'\) \|\| 0\}\{" "\}\s*SAR\s*<\/p>\s*<\/div>/;

const replacementDisplay = `<div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100/70">
                          <span className="block text-[10px] text-slate-400 font-bold">
                            {lang === "ar" ? "بدل طعام" : "Food Allowance:"}
                          </span>
                          <p className="font-mono font-black text-slate-700 mt-0.5">
                            {(
                              selectedEmp.allowances as any
                            )?.food?.toLocaleString('en-US') || 0}{" "}
                            SAR
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100/70">
                          <span className="block text-[10px] text-slate-400 font-bold">
                            {lang === "ar" ? "بدل مدة / ساعات" : "Muddah/Hours:"}
                          </span>
                          <p className="font-mono font-black text-slate-700 mt-0.5">
                            {(
                              selectedEmp.allowances as any
                            )?.muddah?.toLocaleString('en-US') || 0}{" "}
                            SAR
                          </p>
                        </div>`;

content = content.replace(targetFoodDisplay, replacementDisplay);

// And we need to add it to the total salary display calculation
content = content.replace(/\(selectedEmp\.basicSalary \|\| 0\) \+\n\s*\(selectedEmp\.allowances\?\.housing \|\| 0\) \+\n\s*\(selectedEmp\.allowances\?\.transport \|\| 0\) \+\n\s*\(\(selectedEmp\.allowances as any\)\?\.food \|\| 0\)/,
    "(selectedEmp.basicSalary || 0) + (selectedEmp.allowances?.housing || 0) + (selectedEmp.allowances?.transport || 0) + ((selectedEmp.allowances as any)?.food || 0) + ((selectedEmp.allowances as any)?.muddah || 0)");

// And inside the sum for the editing view:
content = content.replace(/Number\(salaryContractForm\.basicSalary\) \+\n\s*Number\(salaryContractForm\.housing\) \+\n\s*Number\(salaryContractForm\.transport\) \+\n\s*Number\(salaryContractForm\.food\)/,
    "Number(salaryContractForm.basicSalary) + Number(salaryContractForm.housing) + Number(salaryContractForm.transport) + Number(salaryContractForm.food) + Number(salaryContractForm.muddah)");

fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', content);
