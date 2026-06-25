const fs = require('fs');
const path = require('path');

let f = path.join(__dirname, 'src/components/SalesHub.tsx');
let c = fs.readFileSync(f, 'utf8');

// 1. Remove "(اختياري)"
c = c.replace(/<span>📍 تفاصيل العنوان الوطني \(اختياري\)<\/span>/g, '<span>📍 تفاصيل العنوان الوطني</span>');

// 2. Add Country, Region, and National Address to the printClientDetails
// First find the <tr> with <th ...>المدينة</th>
const printRegex = /<tr>\s*<th style="border: 1px solid #ccc; padding: 10px; background: #f8fafc;">المدينة<\/th>[\s\S]*?<\/tr>/g;
const newPrintCityRow = `
          <tr>
            <th style="border: 1px solid #ccc; padding: 10px; background: #f8fafc;">الدولة</th>
            <td style="border: 1px solid #ccc; padding: 10px;">\${client.country || '---'}</td>
             <th style="border: 1px solid #ccc; padding: 10px; background: #f8fafc;">الاقليم / المنطقة</th>
            <td style="border: 1px solid #ccc; padding: 10px;">\${client.region || '---'}</td>
          </tr>
          <tr>
             <th style="border: 1px solid #ccc; padding: 10px; background: #f8fafc;">المدينة</th>
            <td style="border: 1px solid #ccc; padding: 10px;">\${client.city || '---'}</td>
            <th style="border: 1px solid #ccc; padding: 10px; background: #f8fafc;">التصنيف التجاري</th>
            <td style="border: 1px solid #ccc; padding: 10px;">\${client.classification || '---'}</td>
          </tr>`;
c = c.replace(printRegex, newPrintCityRow);

// Now add the National Address section after the </table> but before "سجل عروض الأسعار"
const tableEndRegex = /<\/table>\s*<h3 style="color: #334155; margin-top: 40px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">سجل عروض الأسعار المرتبطة<\/h3>/g;
const nationalAddressPrint = `</table>

        \${client.nationalAddress && (client.nationalAddress.buildingNumber || client.nationalAddress.streetName || client.nationalAddress.district || client.nationalAddress.city || client.nationalAddress.postalCode || client.nationalAddress.additionalNumber) ? \`
        <h3 style="color: #334155; margin-top: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">تفاصيل العنوان الوطني</h3>
        <table style="width: 100%; margin-top: 10px; border-collapse: collapse; font-size: 13px;">
          <tr>
            <th style="border: 1px solid #ccc; padding: 8px; background: #f8fafc;">رقم المبنى</th>
            <td style="border: 1px solid #ccc; padding: 8px;">\${client.nationalAddress.buildingNumber || '---'}</td>
            <th style="border: 1px solid #ccc; padding: 8px; background: #f8fafc;">اسم الشارع</th>
            <td style="border: 1px solid #ccc; padding: 8px;">\${client.nationalAddress.streetName || '---'}</td>
          </tr>
          <tr>
            <th style="border: 1px solid #ccc; padding: 8px; background: #f8fafc;">اسم الحي</th>
            <td style="border: 1px solid #ccc; padding: 8px;">\${client.nationalAddress.district || '---'}</td>
            <th style="border: 1px solid #ccc; padding: 8px; background: #f8fafc;">المدينة</th>
            <td style="border: 1px solid #ccc; padding: 8px;">\${client.nationalAddress.city || '---'}</td>
          </tr>
           <tr>
             <th style="border: 1px solid #ccc; padding: 8px; background: #f8fafc;">الرمز البريدي</th>
            <td style="border: 1px solid #ccc; padding: 8px;">\${client.nationalAddress.postalCode || '---'}</td>
             <th style="border: 1px solid #ccc; padding: 8px; background: #f8fafc;">الرقم الإضافي</th>
            <td style="border: 1px solid #ccc; padding: 8px;">\${client.nationalAddress.additionalNumber || '---'}</td>
          </tr>
        </table>\` : ''}

        <h3 style="color: #334155; margin-top: 40px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">سجل عروض الأسعار المرتبطة</h3>`;

c = c.replace(tableEndRegex, nationalAddressPrint);

fs.writeFileSync(f, c, 'utf8');
