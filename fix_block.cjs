const fs = require('fs');
let code = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

const startStr = '{isEditingSalaryContract ? (';
const endStr = '{/* SECTION: Bank & Transfer Information */}';

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find start or end index');
    process.exit(1);
}

const replacement = `{isEditingSalaryContract ? (
  <form
    onSubmit={async (e) => {
      e.preventDefault();
      const updatedFields = {
        basicSalary: Number(salaryContractForm.basicSalary) || 0,
        allowances: {
          housing: Number(salaryContractForm.housing) || 0,
          transport: Number(salaryContractForm.transport) || 0,
          loans: Number(salaryContractForm.loans) || 0,
          deductions: Number(salaryContractForm.deductions) || 0,
          status: salaryContractForm.status || "Active",
        },
        contractQiwaNumber: salaryContractForm.contractQiwaNumber || "",
        contractUrl: salaryContractForm.contractUrl || "",
        contractExpiry: salaryContractForm.contractExpiry || "",
      };
      onUpdateEmployeeFields(selectedEmp.id, updatedFields);
      setSelectedEmp((prev) =>
        prev ? { ...prev, ...updatedFields } : null,
      );
      setIsEditingSalaryContract(false);
      if (onReloadEmployees) {
        await onReloadEmployees();
      }
      showToast(
        lang === "ar"
          ? "✓ تم حفظ تعديلات الراتب والعقد بنجاح!"
          : "✓ Salary and contract modifications saved!",
        "success",
      );
    }}
    className="space-y-4"
  >
    {/* SECTION 1: Compensations & Allowances editing */}
    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 space-y-3">
      <h5 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
        <span>💰</span>
        {lang === "ar" ? "تفاصيل الراتب والبدلات" : "Salary & Allowance Items"}
      </h5>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-right">
        <div>
          <label className="block text-slate-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "الراتب الأساسي" : "Basic Salary"}
          </label>
          <input
            type="number"
            value={salaryContractForm.basicSalary || ""}
            onChange={(e) => setSalaryContractForm({ ...salaryContractForm, basicSalary: Number(e.target.value) || 0 })}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 transition-all text-right font-extrabold"
          />
        </div>
        <div>
          <label className="block text-slate-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "بدل السكن" : "Housing Allowance"}
          </label>
          <input
            type="number"
            value={salaryContractForm.housing || ""}
            onChange={(e) => setSalaryContractForm({ ...salaryContractForm, housing: Number(e.target.value) || 0 })}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 transition-all text-right font-bold"
          />
        </div>
        <div>
          <label className="block text-slate-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "بدل المواصلات" : "Transport Allowance"}
          </label>
          <input
            type="number"
            value={salaryContractForm.transport || ""}
            onChange={(e) => setSalaryContractForm({ ...salaryContractForm, transport: Number(e.target.value) || 0 })}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 transition-all text-right font-bold"
          />
        </div>
        <div>
          <label className="block text-rose-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "السلف والقروض" : "Loans"}
          </label>
          <input
            type="number"
            value={salaryContractForm.loans || ""}
            onChange={(e) => setSalaryContractForm({ ...salaryContractForm, loans: Number(e.target.value) || 0 })}
            className="w-full bg-rose-50/50 border border-rose-200 rounded-lg px-3 py-1.5 text-xs text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all text-right font-bold"
          />
        </div>
        <div>
          <label className="block text-rose-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "الخصومات" : "Deductions"}
          </label>
          <input
            type="number"
            value={salaryContractForm.deductions || ""}
            onChange={(e) => setSalaryContractForm({ ...salaryContractForm, deductions: Number(e.target.value) || 0 })}
            className="w-full bg-rose-50/50 border border-rose-200 rounded-lg px-3 py-1.5 text-xs text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all text-right font-bold"
          />
        </div>
      </div>
    </div>

    {/* SECTION 2: Contract Info editing */}
    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 space-y-3">
      <h5 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
        <span>📄</span>
        {lang === "ar" ? "معلومات العقد" : "Contract Info"}
      </h5>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
        <div>
          <label className="block text-slate-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "رقم عقد قوى" : "Qiwa Contract Number"}
          </label>
          <input
            type="text"
            value={salaryContractForm.contractQiwaNumber || ""}
            onChange={(e) => setSalaryContractForm({ ...salaryContractForm, contractQiwaNumber: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 transition-all text-right font-bold"
          />
        </div>
        <div>
          <label className="block text-slate-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "تاريخ انتهاء العقد" : "Contract Expiry"}
          </label>
          <input
            type="date"
            value={salaryContractForm.contractExpiry || ""}
            onChange={(e) => setSalaryContractForm({ ...salaryContractForm, contractExpiry: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 transition-all text-right font-bold"
          />
        </div>
      </div>
    </div>

    <div className="flex gap-2 justify-end pt-2">
      <button
        type="button"
        onClick={() => setIsEditingSalaryContract(false)}
        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs rounded-xl transition-all"
      >
        {lang === "ar" ? "إلغاء" : "Cancel"}
      </button>
      <button
        type="submit"
        className="px-4 py-2 bg-[#0072BC] hover:bg-[#005a96] text-white font-extrabold text-xs rounded-xl transition-all shadow-sm"
      >
        {lang === "ar" ? "حفظ التعديلات" : "Save Changes"}
      </button>
    </div>
  </form>
) : (
  <div className="space-y-4">
    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 space-y-3">
      <h5 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
        <span>💰</span>
        {lang === "ar" ? "تفاصيل الراتب والبدلات" : "Salary & Allowance Items"}
      </h5>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-right">
        <div>
          <span className="block text-slate-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "الراتب الأساسي" : "Basic Salary"}
          </span>
          <span className="font-extrabold text-sm text-slate-700">
            {selectedEmp.basicSalary} {lang === "ar" ? "ر.س" : "SAR"}
          </span>
        </div>
        <div>
          <span className="block text-slate-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "بدل السكن" : "Housing Allowance"}
          </span>
          <span className="font-bold text-xs text-slate-600">
            {selectedEmp.allowances?.housing || 0} {lang === "ar" ? "ر.س" : "SAR"}
          </span>
        </div>
        <div>
          <span className="block text-slate-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "بدل المواصلات" : "Transport Allowance"}
          </span>
          <span className="font-bold text-xs text-slate-600">
            {selectedEmp.allowances?.transport || 0} {lang === "ar" ? "ر.س" : "SAR"}
          </span>
        </div>
      </div>
    </div>
    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 space-y-3">
      <h5 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
        <span>📄</span>
        {lang === "ar" ? "معلومات العقد" : "Contract Info"}
      </h5>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
        <div>
          <span className="block text-slate-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "رقم عقد قوى" : "Qiwa Contract Number"}
          </span>
          <span className="font-bold text-xs text-slate-600">
            {selectedEmp.contractQiwaNumber || "-"}
          </span>
        </div>
        <div>
          <span className="block text-slate-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "تاريخ انتهاء العقد" : "Contract Expiry"}
          </span>
          <span className="font-bold text-xs text-slate-600">
            {selectedEmp.contractExpiry || "-"}
          </span>
        </div>
      </div>
    </div>
  </div>
)}
                `;

const newCode = code.substring(0, startIndex) + replacement + code.substring(endIndex);
fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', newCode);
console.log('Fixed block!');
