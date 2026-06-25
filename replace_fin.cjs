const fs = require('fs');
const path = require('path');

const p = path.resolve('src/components/FinancialCollections.tsx');
let content = fs.readFileSync(p, 'utf8');

const regex = /<td className="p-3">\s*\{ph\.status\.includes\('تم التحصيل'\) \? \([\s\S]*? بانتظار الدفعة\s*<\/span>\s*\)\}\s*<\/td>/g;

content = content.replace(regex, `<td className="p-3">
                            <span className={\`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black \${getStatusColors(ph.status)}\`}>
                              {ph.status.includes('تم التحصيل') ? <CheckCircle className="w-3 h-3" /> : (ph.status === 'متأخر' ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />)}
                              {ph.status === 'اقترب وقت التحصيل' ? 'اقترب الموعد' : (ph.status === 'بانتظار الدفعة' ? 'بانتظار الدفعة' : ph.status)}
                              {ph.collectedDate && \` بتاريخ: \$\{ph.collectedDate\}\`}
                            </span>
                          </td>`);

if (!content.includes('getStatusColors')) {
  content = content.replace("import type { User, Employee } from '../types';", "import type { User, Employee } from '../types';\nimport { getStatusColors } from '../lib/statusUtils';");
}

fs.writeFileSync(p, content, 'utf8');
