const fs = require('fs');
let code = fs.readFileSync('src/components/hr/HrDashboardTab.tsx', 'utf8');

// Replace iqamasNearingExpiryCount logic with expiredIqamasCount
code = code.replace(
  /\/\/ 8\. الإقامات القريبة من الانتهاء[\s\S]*?\}\)\.length;/g,
  `// 8. العقود والإقامات المنتهية
  const expiredIqamasCount = employees.filter(e => {
    let expired = false;
    if (e.iqamaExpiryDate) {
      const diff = new Date(e.iqamaExpiryDate).getTime() - new Date().getTime();
      if (diff < 0) expired = true;
    }
    if (e.contractExpiry) {
      const diff = new Date(e.contractExpiry).getTime() - new Date().getTime();
      if (diff < 0) expired = true;
    }
    return expired;
  }).length;`
);

// Replace the UI part
code = code.replace(
  /\{iqamasNearingExpiryCount\}/g,
  `{expiredIqamasCount}`
);

code = code.replace(
  /تاريخ انتهاء الإقامة < 90 يوم/g,
  `منتهية الصلاحية تماماً`
);
code = code.replace(
  /'expires in 90 days'/g,
  `'already expired'`
);

fs.writeFileSync('src/components/hr/HrDashboardTab.tsx', code);
console.log('Fixed HrDashboardTab.tsx');
