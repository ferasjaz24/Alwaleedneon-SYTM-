import fs from 'fs';
let f = 'src/components/finance/RevenuesExpenses.tsx';
let c = fs.readFileSync(f, 'utf-8');
c = c.replace(/disabled=\{!isManager\(user\) && \(item\.status === 'معتمد' \|\| item\.status === 'ملغي'\)\}/g, "disabled={!isManager(user)}");
c = c.replace(/disabled=\{!isManager\(user\) && \(item\.status === 'معتمد' \|\| item\.status === 'مدفوع' \|\| item\.status === 'ملغي'\)\}/g, "disabled={!isManager(user)}");
c = c.replace(/disabled=\{processingId !== null \|\| \(item\.status === 'معتمد' && !isManager\(user\)\)\}/g, "disabled={processingId !== null || !isManager(user)}");
c = c.replace(/disabled=\{processingId !== null \|\| \(\(item\.status === 'معتمد' \|\| item\.status === 'مدفوع'\) && !isManager\(user\)\)\}/g, "disabled={processingId !== null || !isManager(user)}");
fs.writeFileSync(f, c);
console.log('RevenuesExpenses patched');
