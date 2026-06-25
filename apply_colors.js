import fs from 'fs';
import glob from 'glob';
import path from 'path';

const files = glob.sync('src/components/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Add import if not exists
  if (!content.includes('getStatusColors') && !content.includes('statusUtils')) {
    const importStatement = `import { getStatusColors } from '../lib/statusUtils';\n`;
    content = importStatement + content;
    changed = true;
  }

  // Define regex replacements for some specific status patterns

  // 1. ProductionHub req.status
  let oldProcStatus = /<span className=\{\`px-3 py-1 rounded-full border text-\[10px\] font-black uppercase tracking-wide \$\{[\s\S]*?req\.status === 'قيد المراجعة' \? 'bg-blue-50 text-blue-700 border-blue-100' :[\s\S]*?'bg-slate-50 text-slate-600 border-slate-200'[\s\S]*?\}\`\}>/g;
  if(oldProcStatus.test(content)) {
     content = content.replace(oldProcStatus, `<span className={\`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wide \$\{getStatusColors(req.status)}\`}>`);
     changed = true;
  }

  // 2. ProductionHub associatedProc.status
  let oldAssocProc = /bg-slate-50 text-slate-700 border border-slate-200'[\s\S]*?\}\`\}>/g;
  let oldAssFull = /<span className=\{\`mr-2 px-2 py-0\.5 rounded-full text-\[9px\] font-black \$\{[\s\S]*?associatedProc\.status === 'تم استلام المواد' \? 'bg-emerald-50 text-emerald-800 border-emerald-100' :[\s\S]*?'bg-slate-50 text-slate-700 border border-slate-200'[\s\S]*?\}\`\}>/g;
  if (oldAssFull.test(content)) {
     content = content.replace(oldAssFull, `<span className={\`mr-2 px-2 py-0.5 rounded-full text-[9px] font-black \$\{getStatusColors(associatedProc.status)}\`}>`);
     changed = true;
  }

  // 3. SalesProductionRequests.tsx getStatusColor => getStatusColors
  if (content.includes('const getStatusColor =')) {
     const fnRegex = /\/\/ Status mapping colors\s*const getStatusColor = \(status: string\) => \{[\s\S]*?\}\s*;\s*/g;
     content = content.replace(fnRegex, '');
     content = content.replace(/getStatusColor\(/g, 'getStatusColors(');
     changed = true;
  }

  // 4. SalesQuotations
  let qtnStatusPattern = /\{q\.status === 'معتمد' && <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black">معتمد<\/span>\}\s*\{q\.status === 'مسودة' && <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-black">مسودة<\/span>\}\s*\{q\.status === 'نشط' && <span className="bg-blue-100 text-\[\#0072BC\] px-3 py-1 rounded-full text-xs font-black">نشط<\/span>\}/g;
  if (qtnStatusPattern.test(content)) {
     content = content.replace(qtnStatusPattern, `<span className={\`px-3 py-1 rounded-full text-xs font-black \$\{getStatusColors(q.status)}\`}>{q.status}</span>`);
     changed = true;
  }

  // 5. ProcurementRequests.tsx
  let proqStatusPattern = /<span\s*className=\{\`px-3 py-1 rounded-full border text-\[10px\] font-black uppercase tracking-wide inline-flex items-center gap-1 \$\{[\s\S]*?req\.status === 'تم الطلب من المورد'[\s\S]*?\}\`\}\s*>/g;
  if (proqStatusPattern.test(content)) {
     content = content.replace(proqStatusPattern, `<span className={\`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wide inline-flex items-center gap-1 \$\{getStatusColors(req.status)}\`}>`);
     changed = true;
  }

  let selectedReqPat = /<span className="px-2 py-0\.5 rounded-md font-extrabold text-\[10px\] bg-indigo-50 text-indigo-700 border border-indigo-100 inline-block">/g;
  if (selectedReqPat.test(content) && content.includes('{selectedReq.status}')) {
     content = content.replace(selectedReqPat, `<span className={\`px-2 py-0.5 rounded-md font-extrabold text-[10px] inline-block \$\{getStatusColors(selectedReq.status)}\`}>`);
     changed = true;
  }

  // 6. FinanceApprovals.tsx
  let finStatus = /<div className="mt-2 text-xs font-bold text-indigo-700 bg-indigo-50 inline-block px-3 py-1 rounded-full border border-indigo-200">\s*\{r\.status\}\s*<\/div>/g;
  if (finStatus.test(content)) {
     content = content.replace(finStatus, `<div className={\`mt-2 text-xs font-bold inline-block px-3 py-1 rounded-full \$\{getStatusColors(r.status)}\`}>{r.status}</div>`);
     changed = true;
  }

  // 7. SuppliersPricing.tsx
  let suppStatus = /<p className="text-xs text-slate-500">\{r\.status\}<\/p>/g;
  if (suppStatus.test(content)) {
      content = content.replace(suppStatus, `<span className={\`mt-1 inline-block px-2 py-0.5 rounded-md text-[10px] font-bold \$\{getStatusColors(r.status)}\`}>{r.status}</span>`);
      changed = true;
  }

  // 8. FinancialCollections.tsx  
  let fcStatus = /<span className="inline-flex items-center gap-1 px-2\.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-700">\s*<CheckCircle className="w-3 h-3" \/> \{ph\.status\}\s*\{ph\.collectedDate && \` بتاريخ: \$\{ph\.collectedDate\}\`\}\s*<\/span>\s*\) : ph\.status === 'متأخر' \? \(\s*<span className="inline-flex items-center gap-1 px-2\.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-700">\s*<AlertTriangle className="w-3 h-3" \/> متأخر\s*<\/span>\s*\) : \(\s*<span className="inline-flex items-center gap-1 px-2\.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700">\s*<Clock className="w-3 h-3" \/> \{ph\.status\}\s*<\/span>/g;
  if (fcStatus.test(content)) {
      content = content.replace(fcStatus, `<span className={\`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black \$\{getStatusColors(ph.status)}\`}>
          {ph.status.includes('تم التحصيل') && <CheckCircle className="w-3 h-3" />}
          {ph.status === 'متأخر' && <AlertTriangle className="w-3 h-3" />}
          {!ph.status.includes('تم التحصيل') && ph.status !== 'متأخر' && <Clock className="w-3 h-3" />}
          {ph.status}
          {ph.collectedDate && \` بتاريخ: \$\{ph.collectedDate\}\`}
        </span>`);
      changed = true;
  }

  // 9. ProductionHub prj.status
  let prjStPattern = /\{prj\.status && <span className="mr-2 px-2 py-0\.5 rounded-full text-\[9px\] bg-indigo-50 text-indigo-700 border border-indigo-100 font-black">\{prj\.status\}<\/span>\}/g;
  if (prjStPattern.test(content)) {
      content = content.replace(prjStPattern, `{prj.status && <span className={\`mr-2 px-2 py-0.5 rounded-full text-[9px] font-black \$\{getStatusColors(prj.status)}\`}>{prj.status}</span>}`);
      changed = true;
  }

  if (changed) {
     fs.writeFileSync(file, content, 'utf8');
     console.log('Updated', file);
  } else {
     // if it was just added but no replacement made, we shouldn't save imports everywhere unnecessarily
     if (content.startsWith("import { getStatusColors }")) {
        const lines = content.split('\n');
        lines.shift();
        fs.writeFileSync(file, lines.join('\n'), 'utf8');
     }
  }
});
