const fs = require('fs');
let content = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

// For payroll list button
content = content.replace(
  /<button\s*onClick={handleExportPayrollPDF}\s*className="p-2\.5 bg-rose-50 hover:bg-rose-100 rounded-xl text-rose-700 transition-colors flex items-center gap-1\.5 text-xs font-bold font-arabic"\s*title="تصدير مسير الرواتب لـ PDF"\s*>\s*<FileText className="w-5 h-5" \/>\s*<span className="hidden sm:inline">تصدير PDF<\/span>\s*<\/button>/g,
  `<button
                  onClick={handleExportPayrollPDF}
                  className="p-2.5 bg-rose-50 hover:bg-rose-100 rounded-xl text-rose-700 transition-colors flex items-center justify-center gap-1.5 text-xs font-bold font-arabic"
                  title="معاينة وطباعة PDF"
                >
                  <Printer className="w-5 h-5" />
                </button>`
);

// For payslip button
content = content.replace(
  /<button\s*onClick={handleExportPayslipPDF}\s*className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"\s*>\s*<FileText className="w-4 h-4" \/>\s*<span>تصدير PDF 📄<\/span>\s*<\/button>/g,
  `<button
                onClick={handleExportPayslipPDF}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة ومعاينة 📄</span>
              </button>`
);

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', content);
