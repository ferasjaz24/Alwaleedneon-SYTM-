const fs = require('fs');
let content = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

const salaryBlock = `
              {/* Salary & Allowances */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-black text-[#0072BC] mb-4">
                  {lang === "ar" ? "بيانات الراتب والبدلات" : "Salary & Allowances"}
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">
                      {lang === "ar" ? "الراتب الأساسي" : "Basic Salary"}
                    </label>
                    <input
                      type="number"
                      required
                      value={newEmpForm.basicSalary}
                      onChange={(e) =>
                        setNewEmpForm({ ...newEmpForm, basicSalary: Number(e.target.value) || 0 })
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">
                      {lang === "ar" ? "بدل السكن" : "Housing Allowance"}
                    </label>
                    <input
                      type="number"
                      value={newEmpForm.allowances?.housing || 0}
                      onChange={(e) =>
                        setNewEmpForm({
                          ...newEmpForm,
                          allowances: { ...newEmpForm.allowances, housing: Number(e.target.value) || 0 },
                        })
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">
                      {lang === "ar" ? "بدل نقل" : "Transport"}
                    </label>
                    <input
                      type="number"
                      value={newEmpForm.allowances?.transport || 0}
                      onChange={(e) =>
                        setNewEmpForm({
                          ...newEmpForm,
                          allowances: { ...newEmpForm.allowances, transport: Number(e.target.value) || 0 },
                        })
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">
                      {lang === "ar" ? "بدل إعاشة" : "Food"}
                    </label>
                    <input
                      type="number"
                      value={(newEmpForm.allowances as any)?.food || 0}
                      onChange={(e) =>
                        setNewEmpForm({
                          ...newEmpForm,
                          allowances: { ...newEmpForm.allowances, food: Number(e.target.value) || 0 } as any,
                        })
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1 text-[10px]">
                      {lang === "ar" ? "بدل مدة / ساعات" : "Muddah/Hours"}
                    </label>
                    <input
                      type="number"
                      value={(newEmpForm.allowances as any)?.muddah || 0}
                      onChange={(e) =>
                        setNewEmpForm({
                          ...newEmpForm,
                          allowances: { ...newEmpForm.allowances, muddah: Number(e.target.value) || 0 } as any,
                        })
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center"
                    />
                  </div>
                </div>
              </div>
`;

content = content.replace(
    '{/* Bank & Transfer details */}',
    salaryBlock + '\n              {/* Bank & Transfer details */}'
);

fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', content);
