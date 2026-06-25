const fs = require('fs');
const path = require('path');

const appFile = path.join(__dirname, 'src/App.tsx');
let content = fs.readFileSync(appFile, 'utf8');

const replacements = [
  // Demo Login Accounts
  [
    `            <div className="mt-8 text-center text-xs text-slate-400 border-t border-slate-800/80 pt-4 flex flex-col gap-2">
              <p>{lang === 'ar' ? 'حسابات الدخول التجريبية:' : 'Quick Demo System Credentials:'}</p>
              <div className="flex justify-center gap-3 font-mono text-[10px] bg-slate-900/50 p-2 rounded-xl text-cyan-400">
                <span>HR: <strong className="text-white">AL_HR</strong></span>
                <span>/</span>
                <span>Sales: <strong className="text-white">AL_SALES</strong></span>
              </div>
            </div>`,
    ""
  ],
  [
    `            <div className="mt-8 text-center text-xs text-slate-400 border-t border-slate-800/80 pt-4 flex flex-col gap-2">
              <p>{lang === 'ar' ? 'حسابات الدخول التجريبية:' : 'Quick Demo System Credentials:'}</p>
              <div className="flex justify-center gap-3 font-mono text-[10px] bg-slate-900/50 p-2 rounded-xl text-cyan-400">
                <span>HR: <strong className="text-white">AL_HR</strong></span>
                <span>/</span>
                <span>Sales: <strong className="text-white">AL_SALES</strong></span>
              </div>
            </div>`,
    ""
  ],
  // Texts
  [
    `متابعة حية لصناعة لوحات النيون الراقية، تخطيط العمالة الفلبينية والسعودية بالرياض وحالة الدفعات المالية المؤجلة.`,
    `متابعة حية لصناعة لوحات النيون الراقية، تخطيط العمالة وحالة الدفعات المالية المؤجلة.`
  ],
  [
    `Real-time workflow tracker for high-end neon tube installations, staff planning matrices in Riyadh, and milestone payment updates.`,
    `Real-time workflow tracker for high-end neon tube installations, staff planning matrices, and milestone payment updates.`
  ],
  [
    `المدينة المعتمدة: الرياض، المملكة العربية السعودية`,
    `المدينة المعتمدة: المملكة العربية السعودية`
  ],
  [
    `Riyadh Central Operations`,
    `Central Operations`
  ],
  [
    `العنوان الوطني التفصيلي بالرياض`,
    `العنوان الوطني التفصيلي`
  ],
  [
    `Riyadh Residence Address`,
    `Residence Address`
  ],
  [
    `Al-Yasmine District, Riyadh`,
    `E.g., District Name`
  ],
  [
    `استشِر نموذج جيميناي 3.5 فلاش لملء الهياكل التنظيمية لورش وتركيبات اللوحات الإعلانية ومشاريع الرياض الكبرى.`,
    `استشِر نموذج جيميناي 3.5 فلاش لملء الهياكل التنظيمية لورش وتركيبات اللوحات الإعلانية والمشاريع الكبرى.`
  ],
  [
    `بوابة المعالجة لشركة فنون الوليد بالرياض`,
    `بوابة المعالجة لشركة فنون الوليد`
  ],
  [
    `Boulevard Riyadh Zone-4`,
    `Boulevard Zone-4`
  ],
  [
    `Aligned with Riyadh average compensation`,
    `Aligned with average compensation`
  ]
];

for (let [search, replace] of replacements) {
    content = content.replace(search, replace);
}

fs.writeFileSync(appFile, content, 'utf8');
console.log('Replaced Riyadh mentions and Demo accounts in App.tsx');
