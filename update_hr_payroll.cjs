const fs = require('fs');
const path = require('path');

const updateHrPayroll = () => {
    let file = path.join(__dirname, 'src/components/hr/HrPayrollTab.tsx');
    let content = fs.readFileSync(file, 'utf8');

    if (!content.includes('sharedPrintHeader')) {
        content = content.replace(
            "import React, { useState, useEffect } from 'react';", 
            "import React, { useState, useEffect } from 'react';\nimport { sharedPrintHeader, sharedPrintFooter, sharedPrintStyles } from '../../utils/PrintShared';"
        );

        // First HTML block (line ~413)
        // Let's replace the whole string `const html = \` ... \`;`
        
        let regex1 = /const html = `[\s\S]*?<\/html>\s*`;/;
        content = content.replace(regex1, `const html = \`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>مسير الرواتب المعتمد والشامل - شهر \${monthLabel} (\${selectedMonth})</title>
        <style>
          \${sharedPrintStyles}
          body { padding: 20px; color: #333; line-height: 1.5; }
          .hdr { text-align: center; border-bottom: 2px solid #0072BC; padding-bottom: 15px; margin-bottom: 25px; }
          .hdr h1 { margin: 0 0 5px; color: #0072BC; font-size: 20px; }
          .tbl { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
          .tbl th { background: #0072BC; color: white; border: 1px solid #ddd; padding: 10px; text-align: right; }
          .tbl td { text-align: right; }
          .sum-card { margin-top: 30px; border: 2px solid #0072BC; padding: 15px; border-radius: 8px; background: #f7fcff; font-size: 12px; }
          .footer-signs { display: flex; justify-content: space-between; margin-top: 50px; font-size: 11px; }
          .sig-box { border-top: 1px solid #444; width: 180px; text-align: center; padding-top: 5px; }
          @media print { .no-print { display: none !important; } }
        </style>
      </head>
      <body>
        <div style="max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; min-height: 90vh;">
          \${sharedPrintHeader}
          <div style="flex-grow: 1;">
            <div style="text-align:center; margin-bottom: 20px;">
              <h2 style="font-size: 18px; margin: 0;">كشف مسير رواتب الموظفين الموحد لشهر: \${monthLabel} (\${selectedMonth})</h2>
              <p style="font-size: 12px; margin: 5px 0;">تاريخ استخراج وثيقة الصرف: \${new Date().toLocaleDateString()}</p>
            </div>

            <table class="tbl">
              <thead>
                <tr>
                  <th>كود الموظف</th>
                  <th>اسم الموظف</th>
                  <th>الراتب الأساسي</th>
                  <th>إجمالي البدلات</th>
                  <th>إجمالي المستقطعات</th>
                  <th>صافي الدفع الفعلي</th>
                  <th>الحالة والاعتماد</th>
                </tr>
              </thead>
              <tbody>
                \${rowsHtml}
              </tbody>
            </table>

            <div class="sum-card">
              <strong>📝 إحصاء الصرف الإجمالي للمسير الحالي المعتمد:</strong>
              <p>إجمالي المدفوعات الأساسية: \${employees.reduce((s, e) => s + (inlineWages[e.id]?.basic || 0), 0).toLocaleString()} ريال</p>
              <p>إجمالي الاستقطاعات والجزاءات: \${employees.reduce((s, e) => s + (inlineWages[e.id]?.deductions || 0), 0).toLocaleString()} ريال</p>
              <p>صوافي الأجور المعدة للحوالات (WPS): <strong>\${employees.reduce((s, e) => {
                const row = inlineWages[e.id] || { basic: 0, allowances: 0, deductions: 0 };
                return s + (row.basic + row.allowances - row.deductions);
              }, 0).toLocaleString()} ريال سعودي</strong></p>
            </div>

            <div class="footer-signs">
              <div>
                <p>مُعِد الكشف والمسيرات المالية:</p>
                <div class="sig-box" style="margin-top:25px;">إدارة الشؤون المالية والمحاسبية</div>
              </div>
              <div>
                <p>التدقيق للامتثال والالتزام:</p>
                <div class="sig-box" style="margin-top:25px;">مدير الموارد البشرية (HR Manager)</div>
              </div>
              <div>
                <p>الاعتماد النهائي للصرف الفعلي:</p>
                <div class="sig-box" style="margin-top:25px;">المدير العام والمسؤول التنفيذي</div>
              </div>
            </div>
          </div>
          \${sharedPrintFooter}
        </div>
        <script>
          window.print();
        </script>
      </body>
      </html>
    \`;`);

        // Second HTML block (line ~632)
        let regex2 = /const printHtml = `[\s\S]*?<\/html>\s*`;/;
        content = content.replace(regex2, `const printHtml = \`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>كشف مسير راتب - \${selectedEmp?.arabicName}</title>
        <style>
          \${sharedPrintStyles}
          body { padding: 20px; color: #333; line-height: 1.6; }
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          .info-table td { padding: 8px 12px; border: 1px solid #efefef; font-size: 13px; }
          .info-table td.lbl { font-weight: bold; background: #f9f9f9; width: 20%; }
          .fin-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          .fin-table th { background: #0072BC; padding: 10px; font-size: 13px; color: white; border: 1px solid #0072BC; }
          .fin-table td { padding: 11px; border: 1px solid #ddd; text-align: center; font-size: 13px; font-weight: bold; }
          .net-box { margin-top: 35px; border: 2px solid #00AEEF; background: #f0faff; padding: 15px; text-align: center; border-radius: 8px; }
          .net-box h2 { margin: 0 0 5px; color: #0072BC; font-size: 18px; }
          .net-box p { margin: 0; font-size: 24px; font-weight: 900; color: #09751e; }
          .footer-claims { text-align: center; margin-top: 30px; font-size: 11px; color: #888; border-top: 1px solid #efefef; padding-top: 15px; }
          @media print { .no-print { display: none !important; } }
        </style>
      </head>
      <body>
        <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; min-height: 90vh;">
          \${sharedPrintHeader}
          <div style="flex-grow: 1;">
            <div style="text-align:center; margin-bottom:20px;">
              <h2 style="margin: 0; font-size: 18px;">كشف مسير الرواتب والأجور الشهري الرسمي المعتمد</h2>
              <p style="margin: 5px 0;">تاريخ الصدور: \${new Date().toLocaleDateString('ar-EG')}</p>
            </div>

            <table class="info-table">
              <tr>
                <td class="lbl">اسم الموظف:</td>
                <td>\${selectedEmp?.arabicName}</td>
                <td class="lbl">الرقم الوظيفي:</td>
                <td>\${selectedEmp?.id}</td>
              </tr>
              <tr>
                <td class="lbl">رقم الهوية / الإقامة:</td>
                <td>\${selectedEmp?.iqamaId || '---'}</td>
                <td class="lbl">المسمى الوظيفي:</td>
                <td>\${selectedEmp?.jobTitle}</td>
              </tr>
              <tr>
                <td class="lbl">القسم الإداري:</td>
                <td>\${selectedEmp?.department || 'إدارة عامة'}</td>
                <td class="lbl">تصنيف الفئة:</td>
                <td>\${selectedEmp?.classification || 'موظف'}</td>
              </tr>
            </table>

            <h3 style="color: #0072BC; border-bottom: 1px solid #ddd; padding-bottom: 5px;">📊 تفاصيل المستحقات والاستقطاعات المالية:</h3>
            <table class="fin-table">
              <thead>
                <tr>
                  <th style="background:#555;">الراتب الأساسي</th>
                  <th>بدل السكن</th>
                  <th>بدل النقل</th>
                  <th>إضافي ساعات العمل</th>
                  <th>مكافآت وحوافز</th>
                  <th style="background:#b91c1c;">خصومات وغيابات</th>
                  <th style="background:#b91c1c;">عهد وسلف مستقطعة</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>\${editBasic} ريال</td>
                  <td>\${editHousing} ريال</td>
                  <td>\${editTransport} ريال</td>
                  <td>\${editOvertime} ريال</td>
                  <td>\${editBonuses} ريال</td>
                  <td style="color:#b91c1c;">\${editDeductions} ريال</td>
                  <td style="color:#b91c1c;">\${editLoans} ريال</td>
                </tr>
              </tbody>
            </table>

            <div class="net-box">
              <h2>صافي الراتب المستحق للصرف وإيداع الحساب (Net Disbursed Salary)</h2>
              <p>\${netCalculated} ر.س</p>
            </div>

            <div class="footer-claims">
              <p>هذا الكشف الإلكتروني معتمد رسمياً ومستخرج من بنية النظام المالي الذاتي للشركة.</p>
              <p>توقيع وختم الإدارة الحسابية والمالية للمجموعة 📄</p>
              <button class="no-print" style="margin-top: 15px; padding: 8px 18px; background: #0072BC; color:white; border:none; border-radius: 4px; cursor:pointer;" onclick="window.print()">طباعة الآن</button>
            </div>
          </div>
          \${sharedPrintFooter}
        </div>
      </body>
      </html>
    \`;`);

        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed HrPayrollTab');
    }
}

updateHrPayroll();
