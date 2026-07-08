const fs = require('fs');
let code = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

const additionalViewFields = `
        <div>
          <span className="block text-slate-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "بدل طعام" : "Food Allowance"}
          </span>
          <span className="font-bold text-xs text-slate-600">
            {selectedEmp.allowances?.food || 0} {lang === "ar" ? "ر.س" : "SAR"}
          </span>
        </div>
        <div>
          <span className="block text-slate-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "بدلات أخرى" : "Other Allowances"}
          </span>
          <span className="font-bold text-xs text-slate-600">
            {selectedEmp.allowances?.otherAllowances || 0} {lang === "ar" ? "ر.س" : "SAR"}
          </span>
        </div>
        <div>
          <span className="block text-purple-400 font-bold mb-1 text-[10px]" title="مبلغ مدد لا يضاف لإجمالي الراتب، بل هو جزء من الأساسي">
            {lang === "ar" ? "مبلغ مدد (من الأساسي)" : "Muddah Amount"}
          </span>
          <span className="font-bold text-xs text-purple-600">
            {selectedEmp.allowances?.muddah || 0} {lang === "ar" ? "ر.س" : "SAR"}
          </span>
        </div>
      </div>
`;

code = code.replace(/        <div>\s*<span className="block text-slate-400 font-bold mb-1 text-\[10px\]">\s*\{lang === "ar" \? "بدل المواصلات" : "Transport Allowance"\}\s*<\/span>\s*<span className="font-bold text-xs text-slate-600">\s*\{selectedEmp\.allowances\?\.transport \|\| 0\} \{lang === "ar" \? "ر\.س" : "SAR"\}\s*<\/span>\s*<\/div>\s*<\/div>/, `        <div>
          <span className="block text-slate-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "بدل المواصلات" : "Transport Allowance"}
          </span>
          <span className="font-bold text-xs text-slate-600">
            {selectedEmp.allowances?.transport || 0} {lang === "ar" ? "ر.س" : "SAR"}
          </span>
        </div>` + additionalViewFields);

fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', code);
