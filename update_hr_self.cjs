const fs = require('fs');
const path = require('path');

const updateHrSelfService = () => {
    let file = path.join(__dirname, 'src/components/hr/HrSelfServiceTab.tsx');
    let content = fs.readFileSync(file, 'utf8');

    if (!content.includes('sharedPrintHeader')) {
        content = content.replace(
            "import React, { useState, useEffect } from 'react';", 
            "import React, { useState, useEffect } from 'react';\nimport { sharedPrintHeader, sharedPrintFooter, sharedPrintStyles } from '../../utils/PrintShared';"
        );

        content = content.replace(
            /const printHtml = `[\s\S]*?<\/html>\s*`;/g,
            `const printHtml = \`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>طباعة بيان - \${item.id}</title>
        <style>
          \${sharedPrintStyles}
          body { padding: 20px; font-family: 'Tajawal', sans-serif, system-ui; }
          .document-content { min-height: 50vh; margin-top: 20px; }
          .header-title { font-size: 20px; font-weight: bold; margin-bottom: 5px; color: #333;text-align:center;}
          .header-meta { font-size: 12px; color: #666; margin-bottom: 30px; text-align:center;}
          .info-box { border: 2px solid #0072BC; padding: 15px; border-radius: 8px; margin-bottom: 25px; background: #f8fafc; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px; }
          .details-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
          .details-card h3 { border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; font-size: 16px; color: #0f172a; margin-top:0; }
          .notes-text { font-size: 14px; line-height: 1.8; color: #334155; white-space: pre-wrap; padding-top: 10px;}
          .footer-claims { text-align: center; margin-top: 40px; font-size: 12px; color: #64748b; padding-top: 20px; border-top: 1px dashed #cbd5e1; }
          @media print { .no-print { display: none !important; } }
        </style>
      </head>
      <body>
        <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; min-height: 90vh;">
          \${sharedPrintHeader}
          <div style="flex-grow: 1;">
            <div class="header-title">بيان كشف حالة ومسير عمليات مصغّر</div>
            <div class="header-meta">
              <p>رقم المرجع: \${item.id}</p>
              <p>تاريخ الصدور: \${item.dateCreated}</p>
            </div>

            <div class="info-box">
              <div class="info-grid">
                <div><strong>اسم الموظف:</strong> \${item.name}</div>
                <div><strong>المعرف الوظيفي:</strong> \${item.empId}</div>
                <div><strong>الوصف:</strong> \${item.details}</div>
                <div><strong>الحالة:</strong> مصادق ومعتمد رسمياً من الإدارة المالية</div>
              </div>
            </div>

            <div class="details-card">
              <h3>📊 تفاصيل الرواتب والبدلات ومسير المستحقات:</h3>
              <div class="notes-text">\${item.hrNotes || 'لا توجد بيانات تفصيلية إضافية.'}</div>
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
    \`;`
        );
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed HrSelfServiceTab');
    }
}

updateHrSelfService();
