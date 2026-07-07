const fs = require('fs');
let content = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

// Update font to GE SS
content = content.replace(
  /<div style="font-family: 'Tajawal', sans-serif; direction: rtl; padding: 20px; color: #0f172a; width: 100%; background: white;">/g,
  `<style>
    @import url('https://fonts.cdnfonts.com/css/ge-ss-two');
    @import url('https://fonts.cdnfonts.com/css/gotham-pro');
  </style>
  <div style="font-family: 'GE SS', 'GE SS Two', 'Tajawal', sans-serif; direction: rtl; padding: 20px; color: #0f172a; width: 100%; background: white;">`
);

content = content.replace(
  /<div style="font-family: 'Tajawal', sans-serif; direction: rtl; padding: 20px; color: #0f172a; max-width: 800px; margin: 0 auto; background: white;">/g,
  `<style>
    @import url('https://fonts.cdnfonts.com/css/ge-ss-two');
    @import url('https://fonts.cdnfonts.com/css/gotham-pro');
  </style>
  <div style="font-family: 'GE SS', 'GE SS Two', 'Tajawal', sans-serif; direction: rtl; padding: 20px; color: #0f172a; max-width: 800px; margin: 0 auto; background: white;">`
);

// Insert Logo in PayrollPDF
content = content.replace(
  /<div>\s*<h1 style="color: #0072BC; margin: 0; font-size: 24px; font-weight: 900;">شركة فنون الوليد للصناعة<\/h1>/g,
  `<div style="display: flex; align-items: center; gap: 15px;">
    <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#0072BC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 21h18"></path>
      <path d="M9 8h1"></path>
      <path d="M9 12h1"></path>
      <path d="M9 16h1"></path>
      <path d="M14 8h1"></path>
      <path d="M14 12h1"></path>
      <path d="M14 16h1"></path>
      <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path>
    </svg>
    <div>
      <h1 style="color: #0072BC; margin: 0; font-size: 24px; font-weight: 900;">شركة فنون الوليد للصناعة</h1>`
);

// Close the div we opened for the logo. The next line is <p>...
content = content.replace(
  /<p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">مسير رواتب موظفي وعمال المصنع المعتمد<\/p>\s*<\/div>/g,
  `<p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">مسير رواتب موظفي وعمال المصنع المعتمد</p>
    </div>
  </div>`
);

content = content.replace(
  /<p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">مسير رواتب موظفي وعمال المصنع<\/p>\s*<\/div>/g,
  `<p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">مسير رواتب موظفي وعمال المصنع</p>
    </div>
  </div>`
);

// Change jsPDF portrait
content = content.replace(
  /jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }/g,
  `jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }`
);

// Re-enable window.open
content = content.replace(
  /html2pdf\(\)\.from\(element\)\.set\(opt\)\.save\(\)\.then\(function\(\) {/g,
  `html2pdf().from(element).set(opt).output('bloburl').then(function(pdfBlobUrl: string) {
      window.open(pdfBlobUrl, '_blank');`
);

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', content);
