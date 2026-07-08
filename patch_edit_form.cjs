const fs = require('fs');
let code = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

const additionalFields = `
        <div>
          <label className="block text-slate-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "بدل طعام" : "Food Allowance"}
          </label>
          <input
            type="number"
            value={salaryContractForm.food || ""}
            onChange={(e) => setSalaryContractForm({ ...salaryContractForm, food: Number(e.target.value) || 0 })}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 transition-all text-right font-bold"
          />
        </div>
        <div>
          <label className="block text-slate-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "بدلات أخرى" : "Other Allowances"}
          </label>
          <input
            type="number"
            value={salaryContractForm.otherAllowances || ""}
            onChange={(e) => setSalaryContractForm({ ...salaryContractForm, otherAllowances: Number(e.target.value) || 0 })}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 transition-all text-right font-bold"
          />
        </div>
        <div>
          <label className="block text-purple-400 font-bold mb-1 text-[10px]" title="مبلغ مدد لا يضاف لإجمالي الراتب، بل هو جزء من الأساسي">
            {lang === "ar" ? "مبلغ مدد (من الأساسي)" : "Muddah Amount"}
          </label>
          <input
            type="number"
            value={salaryContractForm.muddah || ""}
            onChange={(e) => setSalaryContractForm({ ...salaryContractForm, muddah: Number(e.target.value) || 0 })}
            className="w-full bg-purple-50/50 border border-purple-200 rounded-lg px-3 py-1.5 text-xs text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all text-right font-bold"
          />
        </div>
        <div>
          <label className="block text-rose-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "السلف والقروض" : "Loans"}
          </label>
`;

code = code.replace(/        <div>\s*<label className="block text-rose-400 font-bold mb-1 text-\[10px\]">\s*\{lang === "ar" \? "السلف والقروض" : "Loans"\}\s*<\/label>/, additionalFields);

fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', code);
