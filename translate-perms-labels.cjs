const fs = require('fs');
let content = fs.readFileSync('src/components/AdvancedPermissionsPortal.tsx', 'utf8');

const dict = {
  "عرض بوابة فواتير العملاء": "View Customer Invoices",
  "إضافة فاتورة عميل جديدة": "Add New Customer Invoice",
  "تعديل فاتورة عميل": "Edit Customer Invoice",
  "اعتماد فاتورة عميل": "Approve Customer Invoice",
  "عرض بوابة فواتير الموردين": "View Supplier Invoices",
  "إضافة فاتورة مورد جديدة": "Add New Supplier Invoice",
  "تعديل فاتورة مورد": "Edit Supplier Invoice",
  "اعتماد فاتورة مورد": "Approve Supplier Invoice",
  "عرض المصروفات والمستحقات": "View Expenses",
  "تعديل المصروفات المستحقة": "Edit Expenses",
  "الاطلاع على الرواتب الشهرية فقط": "View Payroll Only",
  "تعديل ومعالجة الرواتب الشهرية بالكامل": "Process & Edit Payroll",
  "عرض لوحة قيادة المؤشرات المالية": "View Accounting Dashboard",
  "عرض دفتر القيود اليومية": "View Journal Entries",
  "إضافة قيد جديد": "Add New Entry",
  "تعديل قيد يومية": "Edit Journal Entry",
  "إرسال القيد للاعتماد": "Submit Entry for Approval",
  "اعتماد قيد اليومية": "Approve Journal Entry"
};

for (const [ar, en] of Object.entries(dict)) {
  content = content.replace(new RegExp(`labelEn: '${ar}'`, 'g'), `labelEn: '${en}'`);
}

fs.writeFileSync('src/components/AdvancedPermissionsPortal.tsx', content);
