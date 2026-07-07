import React, { useState } from 'react';
import { Briefcase, Key, Shield, Percent, AlertCircle, Plus } from 'lucide-react';

interface JobRole {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  gradeScale: number; // 1-10
  basicMin: number;
  basicMax: number;
  fieldAllowance: number; // بدل ميداني / مخاطر
  kpiGoalName_ar: string;
  kpiGoalName_en: string;
  permissionsScope_ar: string;
  permissionsScope_en: string;
  safetyChecklists: string[]; // e.g. "Working at Heights Certification"
}

interface HrJobManagementTabProps {
  lang: 'ar' | 'en';
}

export default function HrJobManagementTab({ lang }: HrJobManagementTabProps) {
  // Built-in list of Advertising & Signage specific technical roles
  const [jobRoles, setJobRoles] = useState<JobRole[]>([
    {
      id: 'J-001',
      code: 'NEON-FAB-SPEC',
      name_ar: 'فني تشكيل زجاج النيون والغازات النادرة',
      name_en: 'Neon Fabrication Technician',
      gradeScale: 4,
      basicMin: 4500,
      basicMax: 7000,
      fieldAllowance: 800,
      kpiGoalName_ar: 'انحناء لا يقل عن 12 متر زجاج يوميا وبدون تشققات',
      kpiGoalName_en: 'Minimum 12 linear glass meters shaped correctly daily',
      permissionsScope_ar: 'رؤية حضور ومهام الإنتاج الخاص بفريقه فقط',
      permissionsScope_en: 'Team-level production tasks visibility',
      safetyChecklists: ['شهادة التعامل مع أنابيب غاز النيون السام', 'رخصة التعامل مع محولات الجهد العالي (High Voltage)']
    },
    {
      id: 'J-002',
      code: 'FIELD-INSTALL-SPEC',
      name_ar: 'أخصائي تركيب الهياكل الإعلانية الميدانية والارتفاعات',
      name_en: 'Structural Field Installation Specialist',
      gradeScale: 6,
      basicMin: 5500,
      basicMax: 9000,
      fieldAllowance: 1500,
      kpiGoalName_ar: 'تأمين تركيب ورفع لوحة كلادينج عملاقة في اقل من 3 ساعات المسموح',
      kpiGoalName_en: 'Mount mega cladding panels safely under 3hr target limit',
      permissionsScope_ar: 'موقع التركيب الفعلي والـ GPS فقط لإتمام البصمة',
      permissionsScope_en: 'GPS check-in terminal accessibility',
      safetyChecklists: ['رخصة القيادة والعمل بالمرتفعات الثابتة (Working at Heights)', 'شهادة الفحص الطبي لهوا الحبل والرافعات']
    },
    {
      id: 'J-003',
      code: 'CNC-ROUT-OP',
      name_ar: 'مشغل ماكينات الثني الرقمي ومجموعة الأكريليك CNC',
      name_en: 'CNC Laser Routing & Acrylic Operator',
      gradeScale: 5,
      basicMin: 5000,
      basicMax: 8000,
      fieldAllowance: 600,
      kpiGoalName_ar: 'تقليل فاقد ألواح أكريليك وشيتات الكلادينج لأقل من 3% شهرياً',
      kpiGoalName_en: 'Maintain raw acrylic sheet scrap below 3% monthly',
      permissionsScope_ar: 'رؤية مخططات التصميم (Design Blueprints) وجدولة العمل',
      permissionsScope_en: 'Technical vector plans & tasks scheduler access',
      safetyChecklists: ['دقة التصوير وفحص شعاع الكنترول الليزر', 'نظارات وعوازل الحماية بالورشة']
    },
    {
      id: 'J-004',
      code: 'SR-SIGN-DESIGN',
      name_ar: 'مصمم واجهات ولوحات النيون ثلاثية الأبعاد',
      name_en: 'Senior Signage Graphic Designer',
      gradeScale: 7,
      basicMin: 7000,
      basicMax: 12000,
      fieldAllowance: 0,
      kpiGoalName_ar: 'توليد 3 منظور زوايا ثلاثية الأبعاد لكل مقترح واجهة',
      kpiGoalName_en: 'Deliver 3 high-quality render concept packages daily',
      permissionsScope_ar: 'ملفات العملاء، واجهة التصاميم، الخدمة الذاتية',
      permissionsScope_en: 'Designs workspace & CRM briefs access',
      safetyChecklists: ['إتقان برامج 3ds Max / CorelDRAW للتصنيع المتجه']
    },
    {
      id: 'J-005',
      code: 'SIGN-SALES-REP',
      name_ar: 'ممثل مبيعات إعلانية ومستشار تسعير لوحات',
      name_en: 'Signage Sales Rep & Project Estimator',
      gradeScale: 5,
      basicMin: 4500,
      basicMax: 10000,
      fieldAllowance: 500,
      kpiGoalName_ar: 'تحقيق مستهدف مبيعات ربع سنوي 200 ألف ريال سعودي',
      kpiGoalName_en: 'Secure quarterly contract value of SAR 200,000 threshold',
      permissionsScope_ar: 'صلاحيات إرسال كشوف عروض التسعير وقفل العقود',
      permissionsScope_en: 'Quotations editing, custom customer sales hub',
      safetyChecklists: ['رخصة قيادة واجتياز دورة تقدير تكاليف خامات المعادن والأكريليك']
    }
  ]);

  // Form additions
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newTitleAr, setNewTitleAr] = useState('');
  const [newTitleEn, setNewTitleEn] = useState('');
  const [newGrade, setNewGrade] = useState(5);
  const [newMinPay, setNewMinPay] = useState(5000);
  const [newMaxPay, setNewMaxPay] = useState(10000);
  const [newFieldAllow, setNewFieldAllow] = useState(800);
  const [newSafety, setNewSafety] = useState('Working at Heights Certification');

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newTitleAr || !newTitleEn) return;

    const role: JobRole = {
      id: `J-${Date.now().toString().slice(-4)}`,
      code: newCode.toUpperCase(),
      name_ar: newTitleAr,
      name_en: newTitleEn,
      gradeScale: Number(newGrade),
      basicMin: Number(newMinPay),
      basicMax: Number(newMaxPay),
      fieldAllowance: Number(newFieldAllow),
      kpiGoalName_ar: 'تأدية المهام الإعلانية بدقة وحوكمة معايير الورشة المعيارية',
      kpiGoalName_en: 'Meet standard shop floor production criteria',
      permissionsScope_ar: 'الخدمة الذاتية ورؤية البيانات الفنية المعيارية',
      permissionsScope_en: 'Standard ESS & workspace terminal access',
      safetyChecklists: [newSafety]
    };

    setJobRoles(prev => [...prev, role]);
    setIsFormOpen(false);
    // clean
    setNewCode('');
    setNewTitleAr('');
    setNewTitleEn('');
  };

  return (
    <div id="hr-jobroles-module" className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/50 space-y-6">
      
      {/* Title Header Banner */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <div>
          <h4 className="text-sm font-black text-[#0072BC] flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#00AEEF]" />
            {lang === 'ar' ? '💼 المسميات وسكك السلم الوظيفي بالتأمين والسلامة' : 'Job Tiers, Bounded Pay Scales & Mandatory Safety Credentials'}
          </h4>
          <p className="text-[10px] text-slate-400 mt-1">
            {lang === 'ar' ? 'حوكمة الدرجات (١-١٠) والبدلات الإجبارية ورخص المرتفعات والرافعات' : 'Configure compensation caps, pre-injected field allowance modifiers and safety qualifications'}
          </p>
        </div>

        <button 
          onClick={() => setIsFormOpen(true)}
          className="px-3 py-1.5 bg-[#0072BC] text-white text-[11px] font-black rounded-xl flex items-center gap-1 hover:bg-[#0072BC]/95"
        >
          <Plus className="w-3.5 h-3.5" />
          {lang === 'ar' ? 'إضافة منصب هرمي' : 'Create Job Profile'}
        </button>
      </div>

      {/* Main Ledger Grid Map */}
      <div className="grid grid-cols-1 gap-4">
        {jobRoles.map(role => (
          <div key={role.id} className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100/50 space-y-3 relative hover:bg-slate-100/20 transition-all">
            
            {/* Header row details */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200/50 pb-2">
              <div>
                <span className="text-[9px] bg-slate-200 text-slate-600 font-mono px-2 py-0.5 rounded font-black mr-2 uppercase">{role.code}</span>
                <span className="text-[9px] bg-[#00AEEF]/20 text-[#0072BC] font-mono px-2 py-0.5 rounded font-black uppercase">Grade {role.gradeScale} / المجموع الدرجة {role.gradeScale}</span>
                <h5 className="font-extrabold text-sm text-slate-800 mt-1">
                  {lang === 'ar' ? role.name_ar : role.name_en}
                </h5>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'النطاق الحاكم للراتب المعتمد' : 'Authorized Base Pay Range'}</span>
                <p className="text-xs font-black text-[#0072BC] font-mono">
                  SAR {role.basicMin.toLocaleString('en-US')} - {role.basicMax.toLocaleString('en-US')}
                </p>
              </div>
            </div>

            {/* Content particulars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-100">
                <span className="text-[9px] text-slate-400 font-bold block">🚒 {lang === 'ar' ? 'بدل ميداني ومخاطر التصنيع' : 'Field & Risk Allowance'}</span>
                <p className="font-black font-mono text-amber-600">
                  SAR {role.fieldAllowance} / {lang === 'ar' ? 'شهرياً مضاف' : 'fixed monthly'}
                </p>
              </div>

              <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-100">
                <span className="text-[9px] text-slate-400 font-bold block">🎯 {lang === 'ar' ? 'أهداف التميز ومؤشرات الأداء KPI' : 'Job Target KPIs Baseline'}</span>
                <p className="text-[11px] text-slate-600 italic">
                  "{lang === 'ar' ? role.kpiGoalName_ar : role.kpiGoalName_en}"
                </p>
              </div>

              <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-105">
                <span className="text-[9px] text-slate-400 font-bold block">🎫 {lang === 'ar' ? 'مستوى الصلاحية في منظومة الـ ERP' : 'System Security Access Grant'}</span>
                <p className="text-[11px] text-slate-500 font-medium">
                  {lang === 'ar' ? role.permissionsScope_ar : role.permissionsScope_en}
                </p>
              </div>
            </div>

            {/* Safety Compliance lists labels */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="text-[9px] uppercase font-bold text-[#0072BC] flex items-center gap-1 shrink-0">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                {lang === 'ar' ? 'مستندات السلامة المهنية الإلزامية:' : 'Required Safety Clearance Paper:'}
              </span>
              {role.safetyChecklists.map((sc, i) => (
                <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200">
                  ⚠️ {sc}
                </span>
              ))}
            </div>

          </div>
        ))}
      </div>

      {/* Creation Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateJob} className="bg-white p-6 rounded-3xl border border-slate-100 max-w-md w-full space-y-4 text-xs">
            <h5 className="font-extrabold text-[#0072BC] text-sm">
              💼 {lang === 'ar' ? 'توليد مسمى ودرجة وظيفية جديدة' : 'Add New Corporate Job Profile'}
            </h5>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'كود الفرز الاختصار' : 'Unique Job Code'}</label>
                <input required type="text" placeholder="e.g. CNC-OP" value={newCode} onChange={e => setNewCode(e.target.value)} className="w-full p-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'سلم الدرجة (١-١٠)' : 'Job Grade Scale'}</label>
                <input required type="number" min="1" max="10" value={newGrade} onChange={e => setNewGrade(Number(e.target.value))} className="w-full p-2 border rounded-xl" />
              </div>
              <div className="col-span-2">
                <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'الاسم الوظيفي بالعربية' : 'Arabic Title Name'}</label>
                <input required type="text" value={newTitleAr} onChange={e => setNewTitleAr(e.target.value)} className="w-full p-2 border rounded-xl" />
              </div>
              <div className="col-span-2">
                <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'الاسم الوظيفي بالإنجليزية' : 'English Title Name'}</label>
                <input required type="text" value={newTitleEn} onChange={e => setNewTitleEn(e.target.value)} className="w-full p-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'الحد الأدنى للراتب' : 'Salary min range (SAR)'}</label>
                <input type="number" value={newMinPay} onChange={e => setNewMinPay(Number(e.target.value))} className="w-full p-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'الحد الأقصى للراتب' : 'Salary max range (SAR)'}</label>
                <input type="number" value={newMaxPay} onChange={e => setNewMaxPay(Number(e.target.value))} className="w-full p-2 border rounded-xl" />
              </div>
              <div className="col-span-2">
                <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'البدلات الميدانية والحياكة المضافة' : 'Field/Risk Allowance (SAR)'}</label>
                <input type="number" value={newFieldAllow} onChange={e => setNewFieldAllow(Number(e.target.value))} className="w-full p-2 border rounded-xl" />
              </div>
              <div className="col-span-2">
                <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'رخصة السلامة الحاكمة المعتمدة' : 'Emergency Safety Certificate Requirement'}</label>
                <select value={newSafety} onChange={e => setNewSafety(e.target.value)} className="w-full p-2 border rounded-xl bg-slate-50 text-slate-800">
                  <option value="Working at Heights Certification">Working at Heights Certification / رخصة تركيب بالارتفاعات</option>
                  <option value="Crane Machinery Operation Permit">Crane Machinery Operation Permit / رخصة تشغيل رافعة ذراع</option>
                  <option value="High Voltage Neon Transformers Certification">High Voltage Neon Transformers Certification / التعامل مع الجهد العالي للنيون</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 text-xs font-black">
              <button type="submit" className="flex-1 bg-[#0072BC] text-white py-2 rounded-xl">
                {lang === 'ar' ? 'تأكيد الحفظ وحقن السلم' : 'Save & Publish Job Role'}
              </button>
              <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-xl">
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
