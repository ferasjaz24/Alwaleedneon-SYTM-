export const sharedPrintHeader = `
  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0072BC; padding-bottom: 16px; margin-bottom: 32px; user-select: none; direction: ltr;">
    <div style="text-align: left; display: flex; flex-direction: column; justify-content: center;">
      <h2 style="font-size: 24px; font-weight: 900; color: #374151; margin: 0; font-family: 'GE SS Two', 'Gotham Pro', sans-serif;" dir="rtl">
        شركة فنون الوليد للصناعة
      </h2>
      <h3 style="font-size: 11px; font-weight: bold; color: #6b7280; margin: 4px 0 0 0; letter-spacing: 0.1em; font-family: 'Gotham Pro', sans-serif;">
        FONOUN ALWALEED INDUSTRIAL CO.
      </h3>
    </div>
    <div style="text-align: right;">
      <img src="https://i.postimg.cc/0jQj3XVc/Alwaleed-Logo-Vertical-Blue.png" referrerpolicy="no-referrer" alt="Fonoun Alwaleed Logo" style="width: 120px; height: 120px; object-fit: contain;" />
    </div>
  </div>
`;

export const sharedPrintFooter = `
  <div style="margin-top: auto; border-top: 2px solid #0072BC; padding-top: 12px; display: flex; justify-content: space-between; align-items: flex-start; font-size: 10px; color: #4b5563; user-select: none; direction: ltr; min-height: 80px;">
    <div style="text-align: left; line-height: 1.6;">
      <p style="margin:0;"><span style="font-weight: bold; color: #0072BC;">T:</span> +966 13 833 4115</p>
      <p style="margin:0;"><span style="font-weight: bold; color: #0072BC;">Factory:</span> Dallah Industrial District, Dammam 32445, Saudi Arabia.</p>
    </div>
    <div style="text-align: right; line-height: 1.6;">
      <p style="margin:0;">info@alwaleedneon.com | www.alwaleedneon.com</p>
      <p style="margin:0;"><span style="font-weight: bold; color: #0072BC;">Riyad Bank Iban:</span> SA6 320 000 003 220 402 999 901</p>
    </div>
  </div>
`;

export const sharedPrintStyles = `
  @font-face { font-family: 'GE SS Two'; src: url('/fonts/GE-SS-Two.ttf') format('truetype'); font-weight: normal; font-style: normal; }
    @font-face { font-family: 'Gotham Pro'; src: url('/fonts/Gotham-Pro.ttf') format('truetype'); font-weight: normal; font-style: normal; }
    @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { margin: 20mm; size: A4; }
  }
  body { font-family: 'EnglishNumbersOnly', 'Gotham Pro', 'GE SS', 'GE SS Two', sans-serif, system-ui !important; direction: rtl; }
  * { font-family: 'EnglishNumbersOnly', 'Gotham Pro', 'GE SS', 'GE SS Two', sans-serif !important; }
  .ql-align-center { text-align: center; }
  .ql-align-right { text-align: right; }
  .ql-align-left { text-align: left; }
  .ql-align-justify { text-align: justify; }
  .ql-font-tajawal { font-family: 'GE SS Two', 'Gotham Pro', sans-serif; }
  .ql-font-arial { font-family: 'Arial', 'Gotham Pro', sans-serif; }
  .ql-font-tahoma { font-family: 'Tahoma', 'Gotham Pro', sans-serif; }
  .ql-font-cairo { font-family: 'GE SS Two', 'Gotham Pro', 'Gotham Pro', sans-serif; }
  .ql-font-times-new-roman { font-family: 'Times New Roman', serif; }
  .ql-editor ul { padding-right: 20px; list-style-type: disc; }
  .ql-editor ol { padding-right: 20px; list-style-type: decimal; }
`;
