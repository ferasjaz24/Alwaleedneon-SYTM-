import { sharedPrintHeader, sharedPrintFooter, sharedPrintStyles } from "./PrintShared";

export interface PrintTemplateParams {
  selectedEmp: {
    id: string;
    arabicName?: string;
    englishName?: string;
    iqamaId?: string;
    nationality?: string;
    jobTitle?: string;
    dateOfJoining?: string;
    birthDate?: string;
    basicSalary?: number;
    department?: string;
    company?: string;
  };
  calcResults: {
    yearsOfService: number;
    remainingMonths: number;
    remainingDays: number;
    daysWorked: number;
    eosAward: number;
    accruedVacationDays: number;
    accruedVacationPay: number;
    totalDue: number;
    daysElapsedForAccrual: number;
    annualRate: number;
  };
  printLang: "ar" | "en";
  calcType: "eos" | "leave";
  payrollMonth: string;
  overtimeHours: number;
  overtimeRate: number;
  lastVacationEndDate: string;
  leaveStartDate: string;
  customAllowances: Array<{ name: string; amount: number }>;
  customDeductions: Array<{ name: string; amount: number }>;
  todayStr: string;
  docNo: string;
  empName: string;
  specialSettlementDeductions?: Array<{ reason: string; amount: number }>;
}

export function generatePrintTemplate(params: PrintTemplateParams): string {
  const {
    selectedEmp,
    calcResults,
    printLang,
    calcType,
    payrollMonth,
    overtimeHours,
    overtimeRate,
    lastVacationEndDate,
    leaveStartDate,
    customAllowances,
    customDeductions,
    todayStr,
    docNo,
    empName,
    specialSettlementDeductions,
  } = params;

  const isEos = calcType === "eos";
  const basicSalary = Number(selectedEmp.basicSalary || 0);

  // GOSI deduction calculation for Saudi nationals
  const isSaudi = selectedEmp.nationality === "سعودي" || selectedEmp.nationality?.toLowerCase().includes("saudi");
  const gosiDeduction = isSaudi ? (basicSalary * 9.75) / 100 : 0;
  const netBasicActiveMonth = basicSalary - gosiDeduction;

  const otTotalAmount = overtimeHours * overtimeRate;
  const customAllowancesSum = customAllowances.reduce((sum, item) => sum + item.amount, 0);
  const customDeductionsSum = customDeductions.reduce((sum, item) => sum + item.amount, 0);

  if (printLang === "en") {
    const customAllowancesHtmlEn = customAllowances.length > 0
      ? customAllowances.map(a => `
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding: 4px 0; direction: ltr;">
          <span>${a.name}:</span>
          <span style="color: #10b981; font-weight: 600;">+${a.amount.toLocaleString()} SAR</span>
        </div>
      `).join("")
      : `<div style="color: #94a3b8; font-style: italic; font-size: 11px; direction: ltr;">No additional allowances</div>`;

    const customDeductionsHtmlEn = customDeductions.length > 0
      ? customDeductions.map(d => `
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding: 4px 0; direction: ltr;">
          <span>${d.name}:</span>
          <span style="color: #ef4444; font-weight: 600;">-${d.amount.toLocaleString()} SAR</span>
        </div>
      `).join("")
      : `<div style="color: #94a3b8; font-style: italic; font-size: 11px; direction: ltr;">No additional deductions</div>`;

    return `
      <!DOCTYPE html>
      <html dir="ltr" lang="en">
      <head>
        <meta charset="utf-8">
        <title>Settlement & Entitlements - ${empName}</title>
        <style>
          ${sharedPrintStyles}
          body {
            color: #1e293b;
            background-color: #ffffff;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
            direction: ltr !important;
            text-align: left !important;
          }
          * {
            direction: ltr !important;
            text-align: left !important;
            font-family: "Inter", sans-serif !important;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
          }
          .title-section {
            text-align: center !important;
            margin-bottom: 20px;
          }
          .title-section h1 {
            font-size: 18px;
            color: #0f172a;
            margin: 0;
            font-weight: 800;
            text-align: center !important;
          }
          .badge {
            display: inline-block;
            background-color: #f0f9ff;
            color: #0369a1;
            padding: 4px 12px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 11px;
            margin-top: 6px;
            border: 1px solid #bae6fd;
            text-align: center !important;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 16px;
            margin-bottom: 20px;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 6px;
          }
          .info-label {
            font-weight: 700;
            color: #475569;
          }
          .info-value {
            font-weight: 500;
            color: #0f172a;
          }
          .section-title {
            font-size: 13px;
            font-weight: 800;
            color: #0284c7;
            border-left: 3px solid #0284c7;
            padding-left: 8px;
            margin: 16px 0 10px 0;
          }
          .calc-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .calc-table th {
            background-color: #f1f5f9;
            color: #475569;
            text-align: left !important;
            padding: 10px;
            font-weight: 700;
            border-bottom: 2px solid #cbd5e1;
          }
          .calc-table td {
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
            text-align: left !important;
          }
          .grand-total-panel {
            background-color: #0f172a;
            color: #ffffff;
            border-radius: 10px;
            padding: 16px;
            text-align: center !important;
            margin-bottom: 25px;
          }
          .grand-total-panel * {
            text-align: center !important;
          }
          .grand-total-value {
            font-size: 24px;
            font-weight: 800;
            color: #34d399;
            margin: 4px 0;
          }
          .signatures {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            text-align: center !important;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
          }
          .signatures * {
            text-align: center !important;
          }
          .sig-box {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 95px;
            height: auto;
          }
          .sig-title {
            font-weight: 700;
            color: #475569;
          }
          .sig-line {
            border-top: 1px dashed #cbd5e1;
            margin-top: auto;
            padding-top: 4px;
            font-size: 11px;
            color: #1e293b;
            font-weight: bold;
          }
          @media print {
            body {
              padding: 0;
            }
            .container {
              border: none;
              box-shadow: none;
              padding: 0;
            }
            @page {
              size: A4 portrait;
              margin: 12mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- 1. Header with corporate identity -->
          ${sharedPrintHeader}

          <!-- 2. Meta Document Header -->
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748b; margin-bottom: 20px;">
            <div>Document No: <strong>${docNo}</strong></div>
            <div>Date: <strong>${todayStr}</strong></div>
            <div>Page: <strong>1 of 1</strong></div>
          </div>

          <!-- 3. Document Title -->
          <div class="title-section">
            <h1>Employee Settlement & Entitlements Document</h1>
            <span class="badge">
              ${isEos ? "End of Service Settlement" : "Annual Leave Settlement"}
            </span>
          </div>

          <!-- 4. Employee Information Block -->
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Employee Name:</span>
              <span class="info-value">${empName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Iqama / ID No:</span>
              <span class="info-value">${selectedEmp.iqamaId || "---"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Employee ID:</span>
              <span class="info-value">${selectedEmp.id}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Nationality:</span>
              <span class="info-value">${selectedEmp.nationality || "---"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Job Title:</span>
              <span class="info-value">${selectedEmp.jobTitle || "---"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Date of Joining:</span>
              <span class="info-value">${selectedEmp.dateOfJoining || "---"}</span>
            </div>
          </div>

          <!-- 5. Contractual Salary Terms -->
          <div class="section-title">Approved Contractual Basic Salary</div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="font-weight: bold; color: #475569;">Approved Basic Salary:</span>
              <span style="font-weight: bold; color: #0f172a;">${basicSalary.toLocaleString()} SAR</span>
            </div>
          </div>

          <!-- 6. Active Month Settlement Info -->
          <div class="section-title">Current Month Payroll Settlement (${payrollMonth})</div>
          <table class="calc-table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Measurement & Control Details</th>
                <th style="text-align: right !important;">Financial Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Active Month Salary (Net Basic)</td>
                <td>Calculated from basic contract parameters minus GOSI deduction if applicable</td>
                <td style="text-align: right !important; font-weight: bold;">+${netBasicActiveMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</td>
              </tr>
              <tr>
                <td>Overtime (OT) Hours</td>
                <td>Total OT Hours: <strong>${overtimeHours} hrs</strong> | OT Hourly Rate: <strong>${overtimeRate.toFixed(2)} SAR/hr</strong> | Total OT Amount: <strong>${otTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</strong></td>
                <td style="text-align: right !important; font-weight: bold; color: #10b981;">+${otTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</td>
              </tr>
              <tr>
                <td>Additional Custom Allowances</td>
                <td>
                  <div style="font-size: 10px; color: #475569;">
                    ${customAllowancesHtmlEn}
                  </div>
                </td>
                <td style="text-align: right !important; color: #10b981; font-weight: 600;">
                  +${customAllowancesSum.toLocaleString()} SAR
                </td>
              </tr>
              <tr>
                <td>Applied Custom Deductions</td>
                <td>
                  <div style="font-size: 10px; color: #475569;">
                    ${customDeductionsHtmlEn}
                  </div>
                </td>
                <td style="text-align: right !important; color: #ef4444; font-weight: 600;">
                  -${customDeductionsSum.toLocaleString()} SAR
                </td>
              </tr>

            </tbody>
          </table>

          <!-- 7. EOS or Vacation details -->
          <div class="section-title">${isEos ? "End of Service Award & Vacation Settlement" : "Annual Vacation Settlement Details"}</div>
          <table class="calc-table" style="margin-bottom: 25px;">
            <thead>
              <tr>
                <th>Calculated Statement</th>
                <th>Measurement Details & Indicators</th>
                <th style="text-align: right !important;">Entitled Amount</th>
              </tr>
            </thead>
            <tbody>
              ${isEos ? `
                <tr>
                  <td>Continuous Service Duration</td>
                  <td>${calcResults.yearsOfService} Year(s), ${calcResults.remainingMonths} Month(s), ${calcResults.remainingDays} Day(s) (Total: ${Math.floor(calcResults.daysWorked)} Days)</td>
                  <td style="text-align: right !important; font-weight: bold;">---</td>
                </tr>
                <tr>
                  <td>End of Service (EOS) Award</td>
                  <td>Calculated legally according to Articles 84 and 85 of Saudi Labor Law</td>
                  <td style="text-align: right !important; font-weight: bold; color: #0284c7;">${calcResults.eosAward.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</td>
                </tr>
                <tr>
                  <td>Remaining Accumulated Vacation Balance</td>
                  <td>Last vacation end date: ${lastVacationEndDate} | Accrued entitlement: ${calcResults.accruedVacationDays.toFixed(1)} leave days</td>
                  <td style="text-align: right !important; font-weight: bold; color: #0284c7;">${calcResults.accruedVacationPay.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</td>
                </tr>
              ` : `
                <tr>
                  <td>Hiring Date & Work Period Before Leave</td>
                  <td>Date of Joining: ${selectedEmp.dateOfJoining || selectedEmp.birthDate} | Last vacation end: ${lastVacationEndDate || "Not specified"} | Leave start: ${leaveStartDate} (${Math.floor(calcResults.daysElapsedForAccrual)} accumulated working days)</td>
                  <td style="text-align: right !important; font-weight: bold;">Annual Rate: ${calcResults.annualRate} Days/Year</td>
                </tr>
                <tr>
                  <td>Accrued Accumulated Vacation Days</td>
                  <td>Based on hiring date (21 days/year for first 5 years, 30 days/year thereafter)</td>
                  <td style="text-align: right !important; font-weight: bold; color: #0284c7;">${calcResults.accruedVacationDays.toFixed(2)} Days</td>
                </tr>
                <tr>
                  <td>Net Vacation Days Settlement</td>
                  <td>Daily wage rate (${(basicSalary / 30).toFixed(2)} SAR) × ${calcResults.accruedVacationDays.toFixed(2)} Days</td>
                  <td style="text-align: right !important; font-weight: bold; color: #10b981;">${calcResults.accruedVacationPay.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</td>
                </tr>
              `}
            </tbody>
          </table>

          <!-- 8. Grand Total -->
          <div class="grand-total-panel">
            ${specialSettlementDeductions && specialSettlementDeductions.length > 0 ? `
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px dashed #cbd5e1;">
                <span>Total Entitlements (Before Special Deductions):</span>
                <span style="font-weight: 700; color: #0284c7;">${(calcResults.totalDue + specialSettlementDeductions.reduce((s,d) => s+d.amount, 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
              </div>
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: bold; margin-bottom: 8px; margin-top: 8px; text-align: left;">Itemized Special Settlement Deductions:</div>
              <div style="margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">
                ${specialSettlementDeductions.map(item => `
                  <div style="display: flex; justify-content: space-between; font-size: 13px; color: #ef4444; margin-bottom: 4px;">
                    <span>• ${item.reason}</span>
                    <span style="font-weight: 700;">-${Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: bold;">Net Grand Total Entitlements</div>
            <div class="grand-total-value">${calcResults.totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</div>
            <div style="font-size: 10px; color: #94a3b8; font-weight: 500;">Calculated and generated electronically in full compliance with Articles 84 and 85 of the Saudi Labor Law</div>
          </div>

          <!-- 8.5. Acknowledgment Statement -->
          <div style="margin-top: 25px; padding: 12px 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 11px; color: #334155; line-height: 1.5; margin-bottom: 20px; text-align: justify;">
            <strong>Acknowledgment of Receipt:</strong> I, the undersigned employee <strong>${empName}</strong> (Iqama/ID No: <strong>${selectedEmp.iqamaId || "---"}</strong>), hereby declare and acknowledge that I have received all my financial entitlements, settlements, and dues in full, as listed and detailed in this document. I fully release and discharge the company from any and all liabilities, claims, or demands of any nature whatsoever relating to my employment services, entitlements, or this final settlement.
          </div>

          <!-- 9. Signatures Section -->
          <div class="signatures">
            <div class="sig-box">
              <span class="sig-title">Human Resources Dept.</span>
              <span class="sig-line">Signature & Stamp</span>
            </div>
            <div class="sig-box">
              <span class="sig-title">Finance Accountant</span>
              <span class="sig-line">Signature & Stamp</span>
            </div>
            <div class="sig-box">
              <span class="sig-title">Employee Signature</span>
              <span class="sig-line" style="font-weight: normal; font-size: 11px; line-height: 1.4; text-align: left; padding-top: 6px;">
                <strong>Name:</strong> ${empName}<br/>
                <strong>Place/Dept:</strong> ${selectedEmp.department || selectedEmp.company || "---"}
              </span>
            </div>
          </div>

          <!-- 10. Shared Footer -->
          <div style="margin-top: 40px;">
            ${sharedPrintFooter}
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;
  } else {
    // PRINT IN ARABIC
    const customAllowancesHtmlAr = customAllowances.length > 0
      ? customAllowances.map(a => `
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding: 4px 0;">
          <span>${a.name}:</span>
          <span style="color: #10b981; font-weight: 600;">+${a.amount.toLocaleString()} ر.س</span>
        </div>
      `).join("")
      : `<div style="color: #94a3b8; font-style: italic; font-size: 11px;">لا توجد بدلات إضافية</div>`;

    const customDeductionsHtmlAr = customDeductions.length > 0
      ? customDeductions.map(d => `
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding: 4px 0;">
          <span>${d.name}:</span>
          <span style="color: #ef4444; font-weight: 600;">-${d.amount.toLocaleString()} ر.س</span>
        </div>
      `).join("")
      : `<div style="color: #94a3b8; font-style: italic; font-size: 11px;">لا توجد خصومات إضافية</div>`;

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>تصفية مستحقات - ${empName}</title>
        <style>
          ${sharedPrintStyles}
          body {
            color: #1e293b;
            background-color: #ffffff;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
          }
          .title-section {
            text-align: center;
            margin-bottom: 20px;
          }
          .title-section h1 {
            font-size: 18px;
            color: #0f172a;
            margin: 0;
            font-weight: 800;
          }
          .badge {
            display: inline-block;
            background-color: #f0f9ff;
            color: #0369a1;
            padding: 4px 12px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 11px;
            margin-top: 6px;
            border: 1px solid #bae6fd;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 16px;
            margin-bottom: 20px;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 6px;
          }
          .info-label {
            font-weight: 700;
            color: #475569;
          }
          .info-value {
            font-weight: 500;
            color: #0f172a;
          }
          .section-title {
            font-size: 13px;
            font-weight: 800;
            color: #0284c7;
            border-right: 3px solid #0284c7;
            padding-right: 8px;
            margin: 16px 0 10px 0;
          }
          .calc-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .calc-table th {
            background-color: #f1f5f9;
            color: #475569;
            text-align: right;
            padding: 10px;
            font-weight: 700;
            border-bottom: 2px solid #cbd5e1;
          }
          .calc-table td {
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
            text-align: right;
          }
          .grand-total-panel {
            background-color: #0f172a;
            color: #ffffff;
            border-radius: 10px;
            padding: 16px;
            text-align: center;
            margin-bottom: 25px;
          }
          .grand-total-value {
            font-size: 24px;
            font-weight: 800;
            color: #34d399;
            margin: 4px 0;
          }
          .signatures {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
          }
          .sig-box {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 95px;
            height: auto;
          }
          .sig-title {
            font-weight: 700;
            color: #475569;
          }
          .sig-line {
            border-top: 1px dashed #cbd5e1;
            margin-top: auto;
            padding-top: 4px;
            font-size: 11px;
            color: #1e293b;
            font-weight: bold;
          }
          @media print {
            body {
              padding: 0;
            }
            .container {
              border: none;
              box-shadow: none;
              padding: 0;
            }
            @page {
              size: A4 portrait;
              margin: 12mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- 1. Header with corporate identity -->
          ${sharedPrintHeader}

          <!-- 2. Meta Document Header -->
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748b; margin-bottom: 20px;">
            <div>رقم المستند: <strong>${docNo}</strong></div>
            <div>التاريخ: <strong>${todayStr}</strong></div>
            <div>الصفحة: <strong>1 من 1</strong></div>
          </div>

          <!-- 3. Document Title -->
          <div class="title-section">
            <h1>مستند تصفية ومستحقات الموظف المالي</h1>
            <span class="badge">
              ${isEos ? "تصفية نهاية الخدمة والمستحقات" : "تصفية ومستحقات إجازة سنوية"}
            </span>
          </div>

          <!-- 4. Employee Information Block -->
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">اسم الموظف:</span>
              <span class="info-value">${empName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">رقم الإقامة/الهوية:</span>
              <span class="info-value">${selectedEmp.iqamaId || "---"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">الرقم الوظيفي:</span>
              <span class="info-value">${selectedEmp.id}</span>
            </div>
            <div class="info-item">
              <span class="info-label">الجنسية:</span>
              <span class="info-value">${selectedEmp.nationality || "---"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">المسمى الوظيفي:</span>
              <span class="info-value">${selectedEmp.jobTitle || "---"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">تاريخ التعيين:</span>
              <span class="info-value">${selectedEmp.dateOfJoining || "---"}</span>
            </div>
          </div>

          <!-- 5. Contractual Salary Terms -->
          <div class="section-title">الأجر التعاقدي المعتمد</div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="font-weight: bold; color: #475569;">الراتب الأساسي المعتمد:</span>
              <span style="font-weight: bold; color: #0f172a;">${basicSalary.toLocaleString()} ر.س</span>
            </div>
          </div>

          <!-- 6. Active Month Settlement Info -->
          <div class="section-title">تسوية أجر الشهر الجاري (${payrollMonth})</div>
          <table class="calc-table">
            <thead>
              <tr>
                <th>بيان البند</th>
                <th>تفاصيل القياس والتحكم</th>
                <th style="text-align: left;">القيمة المالية</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>أجر الشهر الجاري (صافي)</td>
                <td>مسحوب تلقائياً من مسير معتمد بعد حسم حصة التأمينات الاجتماعية (GOSI) إن وجدت</td>
                <td style="text-align: left; font-weight: bold;">+${netBasicActiveMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س</td>
              </tr>
              <tr>
                <td>ساعات العمل الإضافية (أوفر تايم)</td>
                <td>عدد الساعات: <strong>${overtimeHours} ساعة</strong> | سعر الساعة الإضافية: <strong>${overtimeRate.toFixed(2)} ر.س</strong> | إجمالي ساعات الأوفر تايم: <strong>${otTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س</strong></td>
                <td style="text-align: left; font-weight: bold; color: #10b981;">+${otTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س</td>
              </tr>
              <tr>
                <td>البدلات الإضافية المخصصة للخدمة</td>
                <td>
                  <div style="font-size: 10px; color: #475569;">
                    ${customAllowancesHtmlAr}
                  </div>
                </td>
                <td style="text-align: left; color: #10b981; font-weight: 600;">
                  +${customAllowancesSum.toLocaleString()} ر.س
                </td>
              </tr>
              <tr>
                <td>الخصومات والجزاءات المخصصة</td>
                <td>
                  <div style="font-size: 10px; color: #475569;">
                    ${customDeductionsHtmlAr}
                  </div>
                </td>
                <td style="text-align: left; color: #ef4444; font-weight: 600;">
                  -${customDeductionsSum.toLocaleString()} ر.س
                </td>
              </tr>

            </tbody>
          </table>

          <!-- 7. EOS or Vacation details -->
          <div class="section-title">${isEos ? "مكافأة نهاية الخدمة وتصفية الإجازة" : "تفاصيل تصفية الإجازة السنوية"}</div>
          <table class="calc-table" style="margin-bottom: 25px;">
            <thead>
              <tr>
                <th>البيان المحسوب</th>
                <th>تفاصيل ومؤشرات القياس</th>
                <th style="text-align: left;">المبلغ المستحق</th>
              </tr>
            </thead>
            <tbody>
              ${isEos ? `
                <tr>
                  <td>مدة الخدمة المتواصلة</td>
                  <td>${calcResults.yearsOfService} سنة و ${calcResults.remainingMonths} شهر و ${calcResults.remainingDays} يوم (الإجمالي: ${Math.floor(calcResults.daysWorked)} يوم)</td>
                  <td style="text-align: left; font-weight: bold;">---</td>
                </tr>
                <tr>
                  <td>مكافأة نهاية الخدمة (EOS)</td>
                  <td>محتسبة قانوناً طبقاً للمواد 84 و 85 من نظام العمل</td>
                  <td style="text-align: left; font-weight: bold; color: #0284c7;">${calcResults.eosAward.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س</td>
                </tr>
                <tr>
                  <td>رصيد الإجازات التراكمي المتبقي</td>
                  <td>تاريخ نهاية آخر إجازة: ${lastVacationEndDate} | مستحق: ${calcResults.accruedVacationDays.toFixed(1)} يوم إجازة</td>
                  <td style="text-align: left; font-weight: bold; color: #0284c7;">${calcResults.accruedVacationPay.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س</td>
                </tr>
              ` : `
                <tr>
                  <td>تاريخ التعيين وفترة العمل قبل الإجازة</td>
                  <td>تاريخ التعيين: ${selectedEmp.dateOfJoining || selectedEmp.birthDate} | نهاية آخر إجازة: ${lastVacationEndDate || "غير محدد"} | بداية الإجازة: ${leaveStartDate} (${Math.floor(calcResults.daysElapsedForAccrual)} يوم عمل متراكم)</td>
                  <td style="text-align: left; font-weight: bold;">معدل الاستحقاق السنوي: ${calcResults.annualRate} يوم/سنة</td>
                </tr>
                <tr>
                  <td>أيام الإجازة التراكمية المستحقة</td>
                  <td>بناءً على تاريخ التعيين (أول 5 سنوات 21 يوماً سنوياً وما بعد ذلك 30 يوماً)</td>
                  <td style="text-align: left; font-weight: bold; color: #0284c7;">${calcResults.accruedVacationDays.toFixed(2)} يوم</td>
                </tr>
                <tr>
                  <td>صافي مستحقات أيام الإجازة</td>
                  <td>معدل الأجر اليومي (${(basicSalary / 30).toFixed(2)} ر.س) × ${calcResults.accruedVacationDays.toFixed(2)} يوم</td>
                  <td style="text-align: left; font-weight: bold; color: #10b981;">${calcResults.accruedVacationPay.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س</td>
                </tr>
              `}
            </tbody>
          </table>

          <!-- 8. Grand Total -->
          <div class="grand-total-panel">
            ${specialSettlementDeductions && specialSettlementDeductions.length > 0 ? `
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px dashed #cbd5e1; direction: rtl;">
                <span>إجمالي المستحقات (قبل الخصومات الخاصة):</span>
                <span style="font-weight: 700; color: #0284c7;">${(calcResults.totalDue + specialSettlementDeductions.reduce((s,d) => s+d.amount, 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س</span>
              </div>
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: bold; margin-bottom: 8px; margin-top: 8px; text-align: right;">تفاصيل خصومات التسوية الخاصة:</div>
              <div style="margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">
                ${specialSettlementDeductions.map(item => `
                  <div style="display: flex; justify-content: space-between; font-size: 13px; color: #ef4444; margin-bottom: 4px; direction: rtl;">
                    <span>• ${item.reason}</span>
                    <span style="font-weight: 700;">-${Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: bold;">صافي إجمالي المستحقات النهائية</div>
            <div class="grand-total-value">${calcResults.totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س</div>
            <div style="font-size: 10px; color: #94a3b8; font-weight: 500;">تم الحساب وإصدار التقرير إلكترونياً بالتوافق مع المادتين 84 و 85 لنظام العمل السعودي</div>
          </div>

          <!-- 8.5. Acknowledgment Statement -->
          <div style="margin-top: 25px; padding: 12px 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 11.5px; color: #334155; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
            <strong>إقرار واستلام المبالغ:</strong> أقر أنا الموظف الموقع أدناه/ <strong>${empName}</strong> (رقم الإقامة/الهوية: <strong>${selectedEmp.iqamaId || "---"}</strong>)، بأنني قد استلمت كامل مستحقاتي وتصفية حسابي المالي والبدلات المستحقة الموضحة في هذا المستند بالتفصيل والبالغ قدرها <strong>(${calcResults.totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س)</strong>، وذلك استلاماً كاملاً ونهائياً نافياً للجهالة، وأبرئ ذمة المنشأة إبراءً عاماً شاملاً ومطلقاً من أي مستحقات أو مطالبات مالية أو قانونية أخرى تتعلق بمدة خدمتي أو هذه التصفية.
          </div>

          <!-- 9. Signatures Section -->
          <div class="signatures">
            <div class="sig-box">
              <span class="sig-title">إدارة شؤون الموظفين</span>
              <span class="sig-line">التوقيع والختم</span>
            </div>
            <div class="sig-box">
              <span class="sig-title">المحاسب المالي</span>
              <span class="sig-line">التوقيع والختم</span>
            </div>
            <div class="sig-box">
              <span class="sig-title">توقيع الموظف المستلم</span>
              <span class="sig-line" style="font-weight: normal; font-size: 11px; line-height: 1.4; text-align: right; padding-top: 6px;">
                <strong>اسم الموظف:</strong> ${empName}<br/>
                <strong>مقر العمل:</strong> ${selectedEmp.department || selectedEmp.company || "---"}
              </span>
            </div>
          </div>

          <!-- 10. Shared Footer -->
          <div style="margin-top: 40px;">
            ${sharedPrintFooter}
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;
  }
}
