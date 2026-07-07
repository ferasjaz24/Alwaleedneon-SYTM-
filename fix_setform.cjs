const fs = require('fs');
let code = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

const regex = /setSalaryContractForm\(\{[\s\S]*?contractExpiry:[\s\S]*?\|\|\s*""\,\s*\}\);/g;

code = code.replace(regex, `setSalaryContractForm({
                                      basicSalary: selectedEmp.basicSalary || 0,
                                      housing: selectedEmp.allowances?.housing || 0,
                                      transport: selectedEmp.allowances?.transport || 0,
                                      loans: selectedEmp.allowances?.loans || 0,
                                      deductions: selectedEmp.allowances?.deductions || 0,
                                      status: selectedEmp.allowances?.status || "Active",
                                      contractQiwaNumber: selectedEmp.contractQiwaNumber || "",
                                      contractUrl: selectedEmp.contractUrl || "",
                                      contractExpiry: selectedEmp.contractExpiry || "",
                                    });`);

fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', code);
