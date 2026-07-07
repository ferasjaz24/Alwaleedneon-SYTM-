const fs = require('fs');

let content = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

// 1. Remove muddah from entitlements
content = content.replace(/ \+ Number\(emp\.muddahAmount \|\| 0\)/g, '');
content = content.replace(/ \+ \((emp|item)\.muddahAmount \|\| 0\)/g, '');
content = content.replace(/ \+ \(e\.muddahAmount \|\| 0\)/g, '');
content = content.replace(/\(selectedPayslipEmployee\.muddahAmount \|\| 0\) \+/g, '');
content = content.replace(/\+ \(selectedPayslipEmployee\.muddahAmount \|\| 0\)/g, '');

// Also search and remove if it's there without Number()
content = content.replace(/muddah \+/g, '');
content = content.replace(/\+ muddah \+/g, '+');
content = content.replace(/\+ muddah/g, '');

// 2. Add remainingSalary to EmployeePayrollData
// wait, we can just compute it on the fly: emp.netSalary - (emp.muddahAmount || 0)
// For "باقي الراتب", let's update the columns

// Table header in UI
content = content.replace(/(<th className="py-4 px-4 text-left whitespace-nowrap">)\s*({lang === "ar" \? "صافي الراتب" : "Net Salary"})\s*(<\/th>)/, 
  `$1$2$3\n                        <th className="py-4 px-4 text-left whitespace-nowrap">{lang === "ar" ? "مُدد" : "Muddah"}</th>\n                        <th className="py-4 px-4 text-left whitespace-nowrap">{lang === "ar" ? "باقي الراتب" : "Remaining"}</th>`);

// Table row in UI
content = content.replace(/(<td className="py-4 px-4 whitespace-nowrap">)\s*(<div className="font-bold text-emerald-600 font-mono">SAR \{emp\.netSalary\.toLocaleString\('en-US'\)\}<\/div>)\s*(<\/td>)/,
  `$1$2$3\n                            <td className="py-4 px-4 whitespace-nowrap">\n                              <div className="font-bold text-amber-600 font-mono">SAR {(emp.muddahAmount || 0).toLocaleString('en-US')}</div>\n                            </td>\n                            <td className="py-4 px-4 whitespace-nowrap">\n                              <div className="font-bold text-indigo-600 font-mono">SAR {(emp.netSalary - (emp.muddahAmount || 0)).toLocaleString('en-US')}</div>\n                            </td>`);

// In Payslip PDF export:
// Add remaining salary after net salary
// Let's modify the html builder for exportPayrollPDF
content = content.replace(/<td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #059669; font-family: 'Gotham Pro', 'GE SS Two', sans-serif !important;">\$\{emp\.netSalary\.toLocaleString\('en-US'\)\}<\/td>/, 
  `<td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #059669; font-family: 'Gotham Pro', 'GE SS Two', sans-serif !important;">\${emp.netSalary.toLocaleString('en-US')}</td>\n        <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: 'Gotham Pro', 'GE SS Two', sans-serif !important;">\${(emp.muddahAmount || 0).toLocaleString('en-US')}</td>\n        <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #4f46e5; font-family: 'Gotham Pro', 'GE SS Two', sans-serif !important;">\${(emp.netSalary - (emp.muddahAmount || 0)).toLocaleString('en-US')}</td>`);

content = content.replace(/<th style="background-color: #0072BC; color: white; padding: 8px; border: 1px solid #cbd5e1; text-align: right;">صافي الراتب<\/th>/,
  `<th style="background-color: #0072BC; color: white; padding: 8px; border: 1px solid #cbd5e1; text-align: right;">صافي الراتب</th>\n              <th style="background-color: #0072BC; color: white; padding: 8px; border: 1px solid #cbd5e1; text-align: right;">مُدد</th>\n              <th style="background-color: #0072BC; color: white; padding: 8px; border: 1px solid #cbd5e1; text-align: right;">باقي الراتب</th>`);

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', content);

