const fs = require('fs');
let content = fs.readFileSync('src/components/AdvancedPermissionsPortal.tsx', 'utf8');

const dict = {
  "الموارد البشرية": "Human Resources",
  "المبيعات": "Sales",
  "الإنتاج والمصنع": "Production & Factory",
  "المشتريات": "Procurement",
  "المحاسبة والمالية": "Accounting & Finance",
  "صلاحيات عامة (للكل)": "General Permissions",
  "لوحة المؤشرات العامة": "Main Dashboard",
  "لوحة القيادة والمؤشرات حقة المحاسبة": "Accounting Dashboard",
  "القيود اليومية العامة": "General Journal",
  "فواتير العملاء": "Customer Invoices",
  "الإيرادات والمستحقات": "Revenues",
  "فواتير الموردين": "Supplier Invoices",
  "المصروفات والمستحقات": "Expenses",
  "الرواتب الشهرية للأقسام": "Monthly Payroll",
  "الصندوق والبنك": "Banks & Cash",
  "الزكاة والضريبة": "Zakat & Tax",
  "التقارير المحاسبية": "Accounting Reports",
  "إعدادات الزكاة والضريبة": "Zakat & Tax Settings",
  "إشعارات النظام العامة": "System Notifications"
};

for (const [ar, en] of Object.entries(dict)) {
  content = content.replace(new RegExp(`en: '${ar}'`, 'g'), `en: '${en}'`);
}

fs.writeFileSync('src/components/AdvancedPermissionsPortal.tsx', content);
