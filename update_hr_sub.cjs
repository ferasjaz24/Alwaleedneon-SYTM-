const fs = require('fs');
const path = require('path');

const updateHrSubSections = () => {
    let file = path.join(__dirname, 'src/components/HrSubSections.tsx');
    let content = fs.readFileSync(file, 'utf8');

    if (!content.includes('sharedPrintHeader')) {
        content = content.replace(
            "import { Check, Edit, Save, ShieldAlert, Trophy, X, Calendar, UserCheck } from 'lucide-react';", 
            "import { Check, Edit, Save, ShieldAlert, Trophy, X, Calendar, UserCheck } from 'lucide-react';\nimport { sharedPrintHeader, sharedPrintFooter, sharedPrintStyles } from '../utils/PrintShared';"
        );

        let regexHTML = /printWin\.document\.write\(\`[\s\S]*?body>\s*<\/html>\s*\`\);/;

        let targetHtml = `printWin.document.write(\`
                <!DOCTYPE html>
                <html lang="ar" dir="rtl">
                  <head>
                    <title>كشف مسير راتب أفراد - \${employee.name}</title>
                    <style>
                      \${sharedPrintStyles}
                      body { padding: 40px; font-family: 'Tajawal', Tahoma, Arial, sans-serif; direction: rtl; text-align: right; background: #fff; }
                      .payslip-box { padding: 0 10px; }
                      table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                      th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: right; font-size: 13px; }
                      th { background-color: #f8fafc; font-weight: bold; }
                    </style>
                  </head>
                  <body>
                    <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; min-height: 90vh;">
                      \${sharedPrintHeader}
                      <div class="payslip-box" style="flex-grow: 1;">
                        <h2 style="color: #0072BC; font-size: 20px; text-align: center; margin-bottom: 5px;">كشف راتب الشهر المعتمد</h2>
                        \${printContent}
                      </div>
                      \${sharedPrintFooter}
                    </div>
                    <script>
                      window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 700);
                      };
                    </script>
                  </body>
                </html>
              \`);`;

        content = content.replace(regexHTML, targetHtml);

        // Also clean up printContent top part that had Al-Waleed old name
        const printContentRegex = /<h2 style="color: #334155; margin-bottom: 5px; font-size: 22px;">شركة الوليد للعلامات التجارية المحدودة<\/h2>/;
        content = content.replace(printContentRegex, ``);

        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed HrSubSections');
    }
}

updateHrSubSections();
