                  {isEditingSalaryContract ? (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const updatedFields: Partial<Employee> = {
                          basicSalary:
                            Number(salaryContractForm.basicSalary) || 0,
                          allowances: {
                            housing: Number(salaryContractForm.housing) || 0,
                            transport:
                              Number(salaryContractForm.transport) || 0,
                            loans: Number(salaryContractForm.loans) || 0,
                            deductions:
                              Number(salaryContractForm.deductions) || 0,
                            status: salaryContractForm.status || "Active",
                          },
                          contractQiwaNumber:
                            salaryContractForm.contractQiwaNumber || "",
                          contractUrl: salaryContractForm.contractUrl || "",
                          contractExpiry:
                            salaryContractForm.contractExpiry || "",
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
                              onChange={(e) => setSalaryContractForm({
                                      basicSalary: selectedEmp.basicSalary || 0,
                                      housing: selectedEmp.allowances?.housing || 0,
                                      transport: selectedEmp.allowances?.transport || 0,
                                      loans: selectedEmp.allowances?.loans || 0,
                                      deductions: selectedEmp.allowances?.deductions || 0,
                                      status: selectedEmp.allowances?.status || "Active",
                                      contractQiwaNumber: selectedEmp.contractQiwaNumber || "",
                                      contractUrl: selectedEmp.contractUrl || "",
                                      contractExpiry: selectedEmp.contractExpiry || "",
                                    });
                                    setIsEditingSalaryContract(true);
                                  }}
                                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-650 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer text-center"
                                >
                                  <span>
                                    ✏️{" "}
                                    {lang === "ar"
                                      ? "تعديل / استبدال"
                                      : "Edit / Replace"}
                                  </span>
                                </button>
                                {/* 4. Delete contract file button */}
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (
                                      window.confirm(
                                        lang === "ar"
                                          ? "هل أنت متأكد من رغبتك في حذف مستند العقد بشكل نهائي؟"
                                          : "Are you sure you want to delete the contract document permanently?",
                                      )
                                    ) {
                                      try {
                                        const updatedFields: Partial<Employee> =
                                          { contractUrl: "" };
                                        onUpdateEmployeeFields(
                                          selectedEmp.id,
                                          updatedFields,
                                        );
                                        setSelectedEmp((prev) =>
                                          prev
                                            ? { ...prev, ...updatedFields }
                                            : null,
                                        );
                                        if (onReloadEmployees) {
                                          await onReloadEmployees();
                                        }
                                        setIsPreviewingContract(false);
                                        showToast(
                                          lang === "ar"
                                            ? "✓ تم حذف ملف العقد بنجاح!"
                                            : "✓ Contract file deleted successfully!",
                                          "success",
                                        );
                                      } catch (err) {
                                        showToast(
                                          lang === "ar"
                                            ? "فشل حذف الملف"
                                            : "Failed to delete file",
                                          "error",
                                        );
                                      }
                                    }
                                  }}
                                  className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                                >
                                  <span>
                                    🗑️{" "}
                                    {lang === "ar"
                                      ? "حذف العقد"
                                      : "Delete File"}
                                  </span>
                                </button>
                              </div>
                              {/* Inline system viewer container */}
                              {isPreviewingContract && (
                                <div className="mt-3 border border-slate-150 rounded-2xl overflow-hidden bg-slate-50/50 p-2 shadow-inner space-y-2 animate-fade-in">
                                  <div className="flex justify-between items-center bg-slate-100 p-2 rounded-xl text-xs font-bold text-slate-700">
                                    <span className="flex items-center gap-1.5">
                                      <span>📄</span>
                                      <span>
                                        {lang === "ar"
                                          ? "معاينة مستند عقد العمل داخل النظام"
                                          : "In-System Employment Contract Preview"}
                                      </span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setIsPreviewingContract(false)
                                      }
                                      className="text-slate-400 hover:text-slate-600 px-2 py-0.5 rounded-md hover:bg-slate-200 transition font-black"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  <div className="w-full flex justify-center bg-white rounded-xl border p-1 overflow-hidden min-h-[300px]">
                                    {selectedEmp.contractUrl.startsWith(
                                      "data:application/pdf",
                                    ) ? (
                                      <div className="w-full h-[550px] flex flex-col">
                                        {contractPdfBlobUrl ? (
                                          <iframe
                                            src={contractPdfBlobUrl}
                                            title="Contract PDF Preview"
                                            className="w-full flex-1 rounded-lg border-0"
                                          />
                                        ) : (
                                          <div className="p-8 text-center text-slate-400 text-xs">
                                            {lang === "ar"
                                              ? "جاري تهيئة معاينة ملف الـ PDF..."
                                              : "Preparing PDF preview..."}
                                          </div>
                                        )}
                                      </div>
                                    ) : selectedEmp.contractUrl.startsWith(
                                        "data:image/",
                                      ) ? (
                                      <div className="p-2 flex justify-center items-center w-full bg-slate-50/25">
                                        <img
                                          src={selectedEmp.contractUrl}
                                          alt="Contract Scan"
                                          className="max-h-[550px] max-w-full rounded-lg object-contain shadow-md"
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-full p-6 text-center text-slate-500 text-xs space-y-3 flex flex-col justify-center items-center">
                                        <p className="font-extrabold text-slate-600">
                                          {lang === "ar"
                                            ? "المستند الحالي مخزن كرابط ويب خارجي ولا يمكن معاينته مباشرة هنا."
                                            : "The current document is stored as a web URL and cannot be displayed inline."}
                                        </p>
                                        <a
                                          href={selectedEmp.contractUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-sm"
                                        >
                                          {lang === "ar"
                                            ? "فتح الرابط في نافذة جديدة ↗"
                                            : "Open External URL ↗"}
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSalaryContractForm({
                                      basicSalary: selectedEmp.basicSalary || 0,
                                      housing: selectedEmp.allowances?.housing || 0,
                                      transport: selectedEmp.allowances?.transport || 0,
                                      loans: selectedEmp.allowances?.loans || 0,
                                      deductions: selectedEmp.allowances?.deductions || 0,
                                      status: selectedEmp.allowances?.status || "Active",
                                      contractQiwaNumber: selectedEmp.contractQiwaNumber || "",
                                      contractUrl: selectedEmp.contractUrl || "",
                                      contractExpiry: selectedEmp.contractExpiry || "",
                                    });
                                setIsEditingSalaryContract(true);
                              }}
                              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-550 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>
                                ⚠️{" "}
                                {lang === "ar"
                                  ? "لم يتم رفع مستند العقد بعد (اضغط لتعديل ورفع ملف PDF أو صورة)"
                                  : "No Contract Document Uploaded Yet (Click to Upload)"}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
