const fs = require('fs');
const path = require('path');

const replaceOldNames = () => {
    // 1. SalesHub.tsx
    let salesPath = path.join(__dirname, 'src/components/SalesHub.tsx');
    let salesContent = fs.readFileSync(salesPath, 'utf8');
    salesContent = salesContent.replace(/شركة الوليد للنيون وتشكيل المشغيلات/g, 'شركة فنون الوليد للصناعة');
    salesContent = salesContent.replace(/شركة الوليد للنيون/g, 'شركة فنون الوليد للصناعة');
    salesContent = salesContent.replace(/لشركة الوليد/g, 'لشركة فنون الوليد');
    fs.writeFileSync(salesPath, salesContent, 'utf8');

    // 2. HrContractsTab.tsx
    let hrContractsPath = path.join(__dirname, 'src/components/hr/HrContractsTab.tsx');
    let hrContractsContent = fs.readFileSync(hrContractsPath, 'utf8');
    hrContractsContent = hrContractsContent.replace(/شركة الوليد للدعاية والنيون/g, 'شركة فنون الوليد للصناعة');
    hrContractsContent = hrContractsContent.replace(/شركة الوليد/g, 'شركة فنون الوليد');
    fs.writeFileSync(hrContractsPath, hrContractsContent, 'utf8');

    // 3. HrSubSections.tsx
    let hrSubPath = path.join(__dirname, 'src/components/HrSubSections.tsx');
    let hrSubContent = fs.readFileSync(hrSubPath, 'utf8');
    hrSubContent = hrSubContent.replace(/شركة الوليد للعلامات التجارية/g, 'شركة فنون الوليد للصناعة');
    hrSubContent = hrSubContent.replace(/شركة الوليد/g, 'شركة فنون الوليد');
    fs.writeFileSync(hrSubPath, hrSubContent, 'utf8');

    console.log('Fixed old company names globally');
}

replaceOldNames();
