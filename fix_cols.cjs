const fs = require('fs');
let content = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

// The columns are:
// <th className="py-4 px-3 text-right text-rose-600">خصومات أخرى</th>
// <th className="py-4 px-3 text-right text-emerald-600 font-black">الصافي البنكي</th>

// Replace it with:
content = content.replace(/<th className="py-4 px-3 text-right text-rose-600">خصومات أخرى<\/th>\s*<th className="py-4 px-3 text-right text-emerald-600 font-black">الصافي البنكي<\/th>/,
    `<th className="py-4 px-3 text-right text-rose-600">خصومات أخرى</th>
                          <th className="py-4 px-3 text-right text-amber-600 font-black">مُدد</th>
                          <th className="py-4 px-3 text-right text-emerald-600 font-black">باقي الراتب</th>`);

// And for the rows themselves:
// In the <tbody> mapping over employees:
// <td className="py-4 px-3 whitespace-nowrap text-rose-600">
//   SAR {(emp.otherDeductions || 0).toLocaleString('en-US')}
// </td>
// <td className="py-4 px-3 whitespace-nowrap bg-emerald-50/50">
//   <div className="font-bold text-emerald-600 font-mono text-sm">
//     SAR {emp.netSalary.toLocaleString('en-US')}
//   </div>
// </td>

content = content.replace(/(<td className="py-4 px-3 whitespace-nowrap text-rose-600">[\s\S]*?<\/td>)\s*(<td className="py-4 px-3 whitespace-nowrap bg-emerald-50\/50">)/,
    `$1
                            <td className="py-4 px-3 whitespace-nowrap text-amber-600 font-bold bg-amber-50/50">
                              <div className="flex items-center gap-1 font-mono text-sm">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editEmployeeForm.muddahAmount ?? emp.muddahAmount}
                                    onChange={(e) =>
                                      setEditEmployeeForm({
                                        ...editEmployeeForm,
                                        muddahAmount: Number(e.target.value),
                                      })
                                    }
                                    className="w-20 p-1 border border-amber-300 rounded focus:outline-none focus:border-amber-500 text-center"
                                  />
                                ) : (
                                  <span>SAR {(emp.muddahAmount || 0).toLocaleString('en-US')}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-3 whitespace-nowrap bg-emerald-50/50">
                              <div className="font-bold text-emerald-600 font-mono text-sm">
                                SAR {(emp.netSalary - (emp.muddahAmount || 0)).toLocaleString('en-US')}
                              </div>
                            </td>`);

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', content);

