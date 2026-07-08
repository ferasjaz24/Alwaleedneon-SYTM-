const fs = require('fs');
let code = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

// Add sortFilter state
code = code.replace(/const \[bankFilter, setBankFilter\] = useState\("All"\);/, 
`const [bankFilter, setBankFilter] = useState("All");
  const [sortFilter, setSortFilter] = useState("default");`);

// Add sort filter to UI and add text-black to the selects
const filterUI = `<div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-700">تصفية البنك:</label>
                      <select
                        value={bankFilter}
                        onChange={(e) => setBankFilter(e.target.value)}
                        className="p-2 border border-slate-200 rounded-lg text-xs text-black"
                      >
                        <option value="All">الجميع</option>
                        {Array.from(new Set(runEmployees.map(e => e.bankName || "Cash"))).map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>`;

const newFilterUI = `<div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-700">ترتيب:</label>
                        <select
                          value={sortFilter}
                          onChange={(e) => setSortFilter(e.target.value)}
                          className="p-2 border border-slate-200 rounded-lg text-xs text-black"
                        >
                          <option value="default">الافتراضي</option>
                          <option value="highestSalary">أعلى راتب</option>
                          <option value="role">حسب الدور</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-700">تصفية البنك:</label>
                        <select
                          value={bankFilter}
                          onChange={(e) => setBankFilter(e.target.value)}
                          className="p-2 border border-slate-200 rounded-lg text-xs text-black"
                        >
                          <option value="All">الجميع</option>
                          {Array.from(new Set(runEmployees.map(e => e.bankName || "Cash"))).map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                    </div>`;

code = code.replace(/<div className="flex items-center gap-2">\s*<label className="text-xs font-bold text-slate-700">تصفية البنك:<\/label>\s*<select\s*value=\{bankFilter\}\s*onChange=\{\(e\) => setBankFilter\(e\.target\.value\)\}\s*className="p-2 border border-slate-200 rounded-lg text-xs"\s*>\s*<option value="All">الجميع<\/option>\s*\{Array\.from\(new Set\(runEmployees\.map\(e => e\.bankName \|\| "Cash"\)\)\)\.map\(b => \(\s*<option key=\{b\} value=\{b\}>\{b\}<\/option>\s*\)\)\}\s*<\/select>\s*<\/div>/, newFilterUI);

// Update map logic to include sorting
const mapRegex = /\{runEmployees\.filter\(e => bankFilter === "All" \|\| \(e\.bankName \|\| "Cash"\) === bankFilter\)\.map\(\(emp\) => \{/;
const newMapLogic = `{(() => {
                          let filtered = runEmployees.filter(e => bankFilter === "All" || (e.bankName || "Cash") === bankFilter);
                          
                          if (sortFilter === "highestSalary") {
                            filtered = filtered.sort((a, b) => (b.totalEntitlements || 0) - (a.totalEntitlements || 0));
                          } else if (sortFilter === "role") {
                            const roleOrder = {
                              "الإدارة العليا": 1,
                              "فراس": 2,
                              "إداري": 3,
                              "موظف": 4,
                              "عامل تصنيع": 5
                            };
                            filtered = filtered.sort((a, b) => {
                              const empA = employees.find(e => e.id === a.employeeId);
                              const empB = employees.find(e => e.id === b.employeeId);
                              const roleA = empA?.classification || "موظف";
                              const roleB = empB?.classification || "موظف";
                              const orderA = roleOrder[roleA as keyof typeof roleOrder] || 99;
                              const orderB = roleOrder[roleB as keyof typeof roleOrder] || 99;
                              return orderA - orderB;
                            });
                          }
                          
                          return filtered.map((emp) => {`;

code = code.replace(mapRegex, newMapLogic);

// Make sure to close the IIFE for the map
// We need to replace the closing brace of the map function if we opened an IIFE.
// However, the original was `{runEmployees.filter(...).map((emp) => {`
// And we replaced it with `{(() => { ... return filtered.map((emp) => {`
// So at the very end of the tbody, there's `})}` which should now be `}); })()}`
code = code.replace(/                           \}\)\}\n                      <\/tbody>/, `                           });\n                        })()}\n                      </tbody>`);


fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', code);
