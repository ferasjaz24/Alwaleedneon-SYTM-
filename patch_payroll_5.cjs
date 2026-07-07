const fs = require('fs');

let content = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

// Filter UI Dropdown
const bankFilterUI = `
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-700">تصفية البنك:</label>
                      <select
                        value={bankFilter}
                        onChange={(e) => setBankFilter(e.target.value)}
                        className="p-2 border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="All">الجميع</option>
                        {Array.from(new Set(runEmployees.map(e => e.bankName || "Cash"))).map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>`;

content = content.replace(/(<span className="bg-slate-800 px-3 py-1 rounded-full text-\[#00AEEF\] font-mono font-bold">\{runEmployees\.length\} موظف<\/span>)/, 
    `$1\n                    ${bankFilterUI}`);

// Render `filteredRunEmployees`
if (!content.includes('const filteredRunEmployees = runEmployees.filter')) {
    content = content.replace(/<div className="bg-slate-900 text-white p-4 font-black flex justify-between items-center text-xs rounded-t-2xl font-arabic">/, 
      `
      const filteredRunEmployees = runEmployees.filter(e => {
        if (bankFilter !== "All" && (e.bankName || "Cash") !== bankFilter) return false;
        // if (searchQuery && !e.arabicName?.includes(searchQuery) && !e.iqamaId?.includes(searchQuery)) return false;
        return true;
      });
      \n<div className="bg-slate-900 text-white p-4 font-black flex justify-between items-center text-xs rounded-t-2xl font-arabic">`);
      
    // Replace mapping
    content = content.replace(/runEmployees\.map\(\(emp\) => \{/g, `filteredRunEmployees.map((emp) => {`);
}

// Add Transfer Checkbox Column
content = content.replace(/<th className="py-4 px-3 text-right text-emerald-600 font-black">الصافي البنكي<\/th>/,
    `<th className="py-4 px-3 text-right text-emerald-600 font-black">الصافي البنكي</th>\n                          <th className="py-4 px-3 text-center">تم التحويل؟</th>`);

// The Row Data
content = content.replace(/(<td className="py-4 px-3 whitespace-nowrap bg-emerald-50\/50">[\s\S]*?<\/td>)/,
    `$1\n                            <td className="py-4 px-3 text-center whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={emp.isTransferred || false}
                                onChange={(e) => {
                                  const updated = runEmployees.map(x => x.id === emp.id ? { ...x, isTransferred: e.target.checked } : x);
                                  setRunEmployees(updated);
                                }}
                                disabled={selectedRun.status !== "Approved"}
                                className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                              />
                            </td>`);

// Save Transfer Checkboxes button & validation
const saveTransferBtn = `
                      {selectedRun.status === "Approved" && isPayer && (
                        <button
                          onClick={() => {
                            // Save isTransferred to server/selectedRun
                            const updatedRun = {
                              ...selectedRun,
                              employees: runEmployees,
                              updatedAt: new Date().toISOString(),
                            };
                            setSelectedRun(updatedRun);
                            setPayrollRuns(payrollRuns.map(r => r.id === selectedRun.id ? updatedRun : r));
                            
                            showToast("تم حفظ حالة التحويل للموظفين بنجاح!", "Transfer statuses saved successfully!", "success");
                          }}
                          className="px-5 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-extrabold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5 font-arabic"
                        >
                          <span>حفظ حالة التحويل (يدوي) 💾</span>
                        </button>
                      )}
`;

content = content.replace(/(<button\s*onClick=\{[^}]*?setIsTransferModalOpen\(true\)\}[\s\S]*?<\/button>)/,
    `${saveTransferBtn}\n                      $1`);
    
// Require all checked for setIsTransferModalOpen
content = content.replace(/onClick=\{\(\) => setIsTransferModalOpen\(true\)\}/,
    `onClick={() => {
        const allChecked = runEmployees.every(e => e.isTransferred);
        if (!allChecked) {
            showToast("يجب وضع علامة (تم التحويل) لجميع الموظفين قبل الاعتماد النهائي وإغلاق المسير", "Must mark all employees as transferred first", "error");
            return;
        }
        setIsTransferModalOpen(true);
    }}`);

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', content);

