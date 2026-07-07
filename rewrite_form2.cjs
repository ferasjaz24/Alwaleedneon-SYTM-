const fs = require('fs');
let code = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

const startStr = '{/* SECTION 1: Compensations & Allowances editing */}';
const endStr = '/* READ ONLY PRESENTATION & COUNTDOWN BADGES */';

const startIdx = code.indexOf(startStr);
const endIdx = code.indexOf(endStr);

if (startIdx === -1 || endIdx === -1) {
  console.log("Could not find boundaries", startIdx, endIdx);
  process.exit(1);
}

const replacement = `
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
                              onChange={(e) => setSalaryContractForm({ ...salaryContractForm, basicSalary: parseFloat(e.target.value) || 0 })}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 font-bold mb-1 text-[10px]">
                              {lang === "ar" ? "بدل سكن" : "Housing Allowance"}
                            </label>
                            <input
                              type="number"
                              value={salaryContractForm.housing || ""}
                              onChange={(e) => setSalaryContractForm({ ...salaryContractForm, housing: parseFloat(e.target.value) || 0 })}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 font-bold mb-1 text-[10px]">
                              {lang === "ar" ? "بدل نقل" : "Transport Allowance"}
                            </label>
                            <input
                              type="number"
                              value={salaryContractForm.transport || ""}
                              onChange={(e) => setSalaryContractForm({ ...salaryContractForm, transport: parseFloat(e.target.value) || 0 })}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-center"
                            />
                          </div>
                        </div>

                        {/* Row 2: Status, Loans, Deductions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-right pt-3 border-t border-slate-100">
                          <div>
                            <label className="block text-slate-400 font-bold mb-1 text-[10px]">
                              {lang === "ar" ? "حالة العمل" : "Work Status"}
                            </label>
                            <select
                              value={salaryContractForm.status || "Active"}
                              onChange={(e) => setSalaryContractForm({ ...salaryContractForm, status: e.target.value })}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold text-center"
                            >
                              <option value="Active">{lang === "ar" ? "نشط (على رأس العمل)" : "Active (Working)"}</option>
                              <option value="OnLeave">{lang === "ar" ? "في إجازة" : "On Leave"}</option>
                              <option value="Terminated">{lang === "ar" ? "مستقيل / منتهي عقده" : "Terminated / Resigned"}</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-400 font-bold mb-1 text-[10px]">
                              {lang === "ar" ? "سلف نشطة" : "Active Loans"}
                            </label>
                            <input
                              type="number"
                              value={salaryContractForm.loans || ""}
                              onChange={(e) => setSalaryContractForm({ ...salaryContractForm, loans: parseFloat(e.target.value) || 0 })}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-center text-amber-600"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 font-bold mb-1 text-[10px]">
                              {lang === "ar" ? "خصومات وجزاءات" : "Deductions & Penalties"}
                            </label>
                            <input
                              type="number"
                              value={salaryContractForm.deductions || ""}
                              onChange={(e) => setSalaryContractForm({ ...salaryContractForm, deductions: parseFloat(e.target.value) || 0 })}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-center text-rose-600"
                            />
                          </div>
                        </div>
                        <div className="bg-emerald-50 text-emerald-900 px-3 py-2 rounded-lg border border-emerald-100 flex items-center justify-between mt-3">
                          <span className="text-[10px] font-bold">{lang === "ar" ? "إجمالي الراتب والبدلات:" : "Total Salary & Allowances:"}</span>
                          <span className="font-mono font-black text-sm">
                            {(Number(salaryContractForm.basicSalary) + Number(salaryContractForm.housing) + Number(salaryContractForm.transport)).toLocaleString('en-US')} {lang === "ar" ? "ريال سعودي" : "SAR"}
                          </span>
                        </div>
                      </div>

                      {/* SECTION 2: Contract Info editing */}
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 space-y-3">
                        <h5 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                          <span>📄</span>
                          {lang === "ar" ? "بيانات وتوثيق العقد" : "Contract Details"}
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-right">
                          <div>
                            <label className="block text-slate-400 font-bold mb-1 text-[10px]">
                              {lang === "ar" ? "رقم عقد منصة قوى" : "Qiwa Contract Number"}
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. QW-905183"
                              value={salaryContractForm.contractQiwaNumber}
                              onChange={(e) => setSalaryContractForm({ ...salaryContractForm, contractQiwaNumber: e.target.value })}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 font-bold mb-1 text-[10px]">
                              {lang === "ar" ? "تاريخ انتهاء عقد العمل" : "Contract Expiry Date"}
                            </label>
                            <input
                              type="date"
                              value={salaryContractForm.contractExpiry}
                              onChange={(e) => setSalaryContractForm({ ...salaryContractForm, contractExpiry: e.target.value })}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-center"
                            />
                          </div>
                        </div>
                        <div className="space-y-2 mt-2 text-right">
                          <label className="block text-slate-400 font-bold text-[10px]">
                            {lang === "ar" ? "ملف أو رابط العقد / المستند" : "Contract Document File or URL"}
                          </label>
                          <div className="flex flex-col gap-2">
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="https://example.com/contract.pdf"
                                value={salaryContractForm.contractUrl?.startsWith("data:") ? "" : salaryContractForm.contractUrl}
                                onChange={(e) => setSalaryContractForm({ ...salaryContractForm, contractUrl: e.target.value })}
                                className="w-full text-[11px] p-2.5 bg-white border border-slate-200 rounded-xl font-bold font-mono text-left"
                              />
                              <div className="absolute top-1/2 -translate-y-1/2 right-2 text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">URL</div>
                            </div>
                            <div className="relative">
                              <input
                                type="file"
                                id="contractFile"
                                className="hidden"
                                accept=".pdf,image/png,image/jpeg"
                                onChange={async (e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    try {
                                      const base64 = await handleFileToBase64(file);
                                      setSalaryContractForm({ ...salaryContractForm, contractUrl: base64 });
                                      showToast(lang === "ar" ? "✓ تم رفع وتجهيز الملف للقرص بنجاح!" : "✓ File prepared successfully!", "success");
                                    } catch (err) {
                                      showToast(lang === "ar" ? "فشل معالجة الملف" : "File processing failed", "error");
                                    }
                                  }
                                }}
                              />
                              <label htmlFor="contractFile" className="flex items-center justify-center gap-2 w-full py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 border-dashed rounded-xl cursor-pointer transition text-xs font-bold text-slate-600">
                                <span>📁</span>
                                {lang === "ar" ? "رفع ملف عقد (PDF/Image)" : "Upload Contract File"}
                              </label>
                            </div>
                          </div>
                          {salaryContractForm.contractUrl && (
                            <div className="flex justify-between items-center bg-sky-50 text-sky-850 px-3 py-1.5 rounded-lg text-[10px] border border-sky-100/50 mt-1.5 font-bold">
                              <span className="flex items-center gap-1">
                                <span>📎</span>
                                <span>
                                  {salaryContractForm.contractUrl.startsWith("data:application/pdf")
                                    ? (lang === "ar" ? "ملف مستند PDF مجهز للتعاقد" : "PDF Document Ready")
                                    : salaryContractForm.contractUrl.startsWith("data:image/")
                                      ? (lang === "ar" ? "صورة العقد مجهزة" : "Image Document Ready")
                                      : (lang === "ar" ? "رابط ويب خارجي مدخل" : "External Web URL Entered")}
                                </span>
                              </span>
                              <button type="button" onClick={() => setSalaryContractForm({ ...salaryContractForm, contractUrl: "" })} className="text-rose-600 hover:text-rose-850 px-2 py-0.5 rounded-md hover:bg-rose-100/40 transition font-black">
                                {lang === "ar" ? "إزالة" : "Remove"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions bar for Salay and Contract edits form */}
                      <div className="flex gap-2 text-xs font-black pt-2">
                        <button type="submit" className="flex-1 bg-[#0072BC] hover:bg-[#0072BC]/95 text-white py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                          <span>✅</span>
                          <span>{lang === "ar" ? "حفظ بيانات الراتب والعقد" : "Commit Changes"}</span>
                        </button>
                        <button type="button" onClick={() => setIsEditingSalaryContract(false)} className="px-4 bg-slate-100 text-slate-600 py-2 rounded-xl hover:bg-slate-200 transition-all cursor-pointer">
                          {lang === "ar" ? "إلغاء" : "Cancel"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    {`;

code = code.substring(0, startIdx) + replacement + code.substring(endIdx - 2); // get `{/* READ...`
fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', code);
