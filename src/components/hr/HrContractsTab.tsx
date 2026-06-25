import React, { useState } from 'react';
const DocumentHeader = () => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #0072BC', paddingBottom: '16px', marginBottom: '32px', userSelect: 'none', direction: 'ltr' }}>
    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#374151', margin: 0, fontFamily: '"Tajawal", sans-serif' }} dir="rtl">
        شركة فنون الوليد للصناعة
      </h2>
      <h3 style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', margin: '4px 0 0 0', letterSpacing: '0.1em', fontFamily: 'sans-serif' }}>
        FONOUN ALWALEED INDUSTRIAL CO.
      </h3>
    </div>
    <div style={{ textAlign: 'right' }}>
      <img src="https://pbs.twimg.com/media/HE46IrybcAAMq7L?format=png&name=small" referrerPolicy="no-referrer" alt="Fonoun Alwaleed Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
    </div>
  </div>
);

const DocumentFooter = () => (
  <div style={{ marginTop: 'auto', borderTop: '1px solid #0072BC', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '10px', color: '#4b5563', userSelect: 'none', direction: 'ltr', minHeight: '80px' }}>
    <div style={{ textAlign: 'left', lineHeight: '1.6' }}>
      <p style={{margin:0}}><span style={{ fontWeight: 'bold', color: '#0072BC' }}>T:</span> +966 13 833 4115</p>
      <p style={{margin:0}}><span style={{ fontWeight: 'bold', color: '#0072BC' }}>Factory:</span> Dallah Industrial District, Dammam 32445, Saudi Arabia.</p>
    </div>
    <div style={{ textAlign: 'right', lineHeight: '1.6' }}>
      <p style={{margin:0}}>info@alwaleedneon.com | www.alwaleedneon.com</p>
      <p style={{margin:0}}><span style={{ fontWeight: 'bold', color: '#0072BC' }}>Riyad Bank Iban:</span> SA6 320 000 003 220 402 999 901</p>
    </div>
  </div>
);
import { FileText, Printer, Save, RefreshCw, Award, Info } from 'lucide-react';
import { Employee } from '../../types';

interface ContractAmendment {
  id: string;
  empId: string;
  date: string;
  byUser: string;
  changeCategory_ar: string;
  changeCategory_en: string;
  details: string;
}

interface HrContractsTabProps {
  lang: 'ar' | 'en';
  employees: Employee[];
}

export default function HrContractsTab({ lang, employees }: HrContractsTabProps) {
  // All template options
  const [selectedTemplate, setSelectedTemplate] = useState<'saudi_fixed' | 'saudi_indefinite' | 'expat_muqeem' | 'temp_project'>('saudi_fixed');
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.id || 'EMP-1002');
  const [appendSpecialNotes, setAppendSpecialNotes] = useState('');
  
  // Immutably logged alterations ledger
  const [amendments, setAmendments] = useState<ContractAmendment[]>([
    { id: 'AMD-500', empId: 'EMP-1002', date: '2026-06-01', byUser: 'Feras (Owner)', changeCategory_ar: 'ملحق رقم ١: زيادة الراتب ومخاطر الارتفاع', changeCategory_en: 'Addendum 1: Pay bump & Safety risk allowance injection', details: 'Added SAR 500 risk premium for crane operations at alturas.' }
  ]);

  const activeEmp = employees.find(e => e.id === selectedEmpId) || employees[0];

  if (!activeEmp) {
    return (
      <div className="bg-white/60 p-6 rounded-3xl text-center text-slate-500">
        {lang === 'ar' ? '⚠️ لا يوجد موظفين مسجلين لعرض عقودهم.' : 'No active employees to preview contracts'}
      </div>
    );
  }

  // Legal Templates Text Generator with variable injection mapping
  const getContractLegalBody = () => {
    const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const empName = lang === 'ar' ? activeEmp.arabicName : activeEmp.englishName;
    const basicPay = activeEmp.basicSalary;
    const housing = activeEmp.allowances?.housing || Math.floor(basicPay * 0.25);
    const transport = activeEmp.allowances?.transport || 500;
    const totalGOSICompensation = basicPay + housing;

    if (selectedTemplate === 'expat_muqeem') {
      return {
        title_ar: 'عقد عمل لإقامة غير سعودي (موثق بمدد قوى)',
        title_en: 'Expat Labor Employment Agreement (Qiwa Compliant)',
        body_ar: `إنه في يوم ${today}، جرى الاتفاق والتعاقد بين شركة فنون الوليد للصناعة وبصفتها الطرف الأول، والسيد ${empName} (جنسيته وافد وجوازه رقم ${activeEmp.passportDetails} وإقامته رقم ${activeEmp.iqamaId}) بصفته الطرف الثاني على التالي:
1. يلتزم الطرف الثاني بالعمل كموظف بمسمى "${activeEmp.jobTitle}" تحت قيادة وتوجيه إدارة القسم "${activeEmp.department}".
2. يلتزم الطرف الأول بسداد مقابل مالي أساسي قدره ${basicPay} ريال سعودي، بالإضافة لبدل سكن وقدره ${housing} وبدل انتقال قدره ${transport} تلافياً للمخالفات.
3. يعتبر هذا العقد مرتبطاً شكلاً ومضموناً بصلاحية رخصة العمل والإقامة النظامية، ويجدد برصيد موافقة الطرفين عبر منصة قوى المعتمدة من وزارة الموارد البشرية رقم المادة ٥٥ لعمل الوافدين.`,
        body_en: `On this day of ${today}, this contract is finalized between Al-Waleed Advertising & Neon Co. Ltd. (First Party) and Mr. ${empName}, holder of Passport No. ${activeEmp.passportDetails} & Residency Id: ${activeEmp.iqamaId} (Second Party):
1. The Second Party agrees to perform duties associated with the job rank "${activeEmp.jobTitle}" in "${activeEmp.department}" department safely.
2. First Party shall pay a core Basic monthly compensation of SAR ${basicPay}, in addition to housing allowance of SAR ${housing} and transport allowance of SAR ${transport} strictly inside electronic WPS bank portal.
3. This agreement is tied sequentially to Iqama work authorization validities. Changes or renewals shall be synchronized immediately on Ministry of Labor Qiwa channels.`
      };
    }

    if (selectedTemplate === 'temp_project') {
      return {
        title_ar: 'عقد عمل مؤقت ومحدد بمشروع (سين جيو شابيلي مول)',
        title_en: 'Temporary Project-Based Employment Agreement',
        body_ar: `عقد عمل مخصص لإنجاز مهام وعقود تركيب لوحات مشروع فني ("موقت - مول شابيلي جراند بالرياض") بين الطرف الأول شركة فنون الوليد والطرف الثاني السيد ${empName}:
1. يلتزم الطرف الثاني بتسخير مهام خبرته لإنجاز مقاسات ورفع لوحات وبدلات النيون المضيئة لهذا المقصد الحصري.
2. تنتهي العلاقة التعاقدية حكماً وتلقائياً فور تصفية وإعلان تسليم اللوحات الخارجية للجهة الاستشارية للمشروع، وبدون الحاجة لإنذار مسبق المادة ٥٤ لقانون العمل السعودي.
3. يستحق الطرف الثاني الراتب الحصري البالغ ${basicPay} ريال سعودي ولا يجوز المطالبة بملحق دائم بعد إنتهاء التصفية.`,
        body_en: `This Task-Specific Temporary labor agreement is signed for the exclusive execution of signage assemblies at "Shabili Mall Riyadh construction project" between First Party and Second Party Mr. ${empName}:
1. The specialist shall deploy technical proficiency to shape, drill and mount structural outdoor letters for Shabili Mall.
2. This service terminates automatically and instantly upon official engineering sign-off of signage project handovers without prior termination letters requirements.
3. Compensation shall be restricted to SAR ${basicPay} plus designated field bonuses.`
      };
    }

    // Default: Saudi national fixed contract
    return {
      title_ar: 'عقد العمل الموحد للمواطنين حاملي الهوية الوطنية',
      title_en: 'Standard National Labor Covenant (Saudi Fixed Framework)',
      body_ar: `إنه في يوم ${today}، جرى تحرير هذا الاتفاق بالتراضي بين شركة فنون الوليد للصناعة (الطرف الأول) والمواطن السعودي السيد ${empName} (هوية وطنية رقم ${activeEmp.iqamaId}) ويشار إليه بـ (الطرف الثاني) على ما يلي:
1. يلتزم الموظف بالعمل بملف المسمى الحوكمي "${activeEmp.jobTitle}" وسكك الدرجة السلمية المعتمدة بالقسم.
2. مدة هذا الاتفاق سنة واحدة تبدأ من تاريخ مباشرة العمل الفعلي ${activeEmp.dateOfJoining || today}. ويخضع الموظف الحائز لفترة تجربة (٩٠ يوماً) قانونية تحت المادة ٨٠ لتقييم الكفاءة.
3. يلتزم الطرف الأول بإلحاق وتسجيل الطرف الثاني بالهيئة الوطنية للتأمينات الاجتماعية (GOSI)، وسداد وعاء أجور كلي معتمد يبلغ ${(basicPay + housing).toLocaleString()} ريال شامل أساس وبدل سكن.`,
      body_en: `On this day of ${today}, this employment agreement is ratified between Al-Waleed Neon Ltd. (First Party) and Saudi Citizen Mr. ${empName}, holder of National ID: ${activeEmp.iqamaId} (Second Party):
1. Second Party is assigned to perform technical operations under the approved job description of "${activeEmp.jobTitle}".
2. Agreement covers a 12-month fixed timeline beginning on ${activeEmp.dateOfJoining || today}. Staff shall complete a 90-day clinical probation window evaluated under Saudi Labor Code constraints.
3. First Party guarantees full subscription inside General Organization for Social Insurance (GOSI) with total calculated monthly wage of SAR ${(basicPay + housing).toLocaleString()} (including housing allowance).`
    };
  };

  const legalContent = getContractLegalBody();

  // Handle append custom clauses
  const handleAddAmendment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appendSpecialNotes) return;

    const newAmd: ContractAmendment = {
      id: `AMD-${Date.now().toString().slice(-3)}`,
      empId: activeEmp.id,
      date: new Date().toISOString().slice(0, 10),
      byUser: 'Feras (Super Admin)',
      changeCategory_ar: 'إلحاق بند شرطي تعديلي',
      changeCategory_en: 'Contract Addendum/Amend Clause',
      details: appendSpecialNotes
    };

    setAmendments(prev => [...prev, newAmd]);
    setAppendSpecialNotes('');
    alert(lang === 'ar' ? 'تم تسجيل وتأمين ملحق العهد القانوني بنجاح!' : 'Amendement addendum finalized and logged immutable.');
  };

  const handlePrintContract = () => {
    window.print();
  };

  return (
    <div id="hr-contracts-module" className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/50 space-y-6">
      
      {/* 1. Header Configurations bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-4">
        <div>
          <h4 className="text-sm font-black text-[#0072BC] flex items-center gap-2">
            <FileText className="w-4.5 h-4.5 text-[#00AEEF]" />
            {lang === 'ar' ? '📄 محرك صياغة وأتمتة العقود والملاحق القانونية' : 'Legal Contract Automation & Dynamic Variables Injection Engine'}
          </h4>
          <p className="text-[10px] text-slate-400 mt-1">
            {lang === 'ar' ? 'سحب فوري لبيانات الـ ERP لملأ الفراغات النظامية وطباعة أوراق الشركة الرسمية' : 'Siphon live payroll variables, GOSI weights and passports into verified contract drafts'}
          </p>
        </div>

        {/* Print call */}
        <button 
          onClick={handlePrintContract}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black flex items-center gap-1 shrink-0 shadow-md"
        >
          <Printer className="w-3.5 h-3.5" />
          {lang === 'ar' ? 'طباعة العقد الفورية 🖨️' : 'Print Draft Agreement 🖨️'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Control Column: Variables select (4 columns) */}
        <div className="md:col-span-4 bg-slate-50/60 p-4 rounded-2xl border border-slate-100 space-y-4 text-xs font-semibold">
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{lang === 'ar' ? 'خيارات حقن البيانات والنموذج:' : 'VARIABLES & INJECTION PARAMETERS:'}</p>
          
          <div>
            <label className="block text-slate-450 mb-1">{lang === 'ar' ? 'اختر الموظف المستهدف:' : 'Import Employee Subject:'}</label>
            <select 
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full p-2 border rounded-xl bg-white text-slate-800 text-xs font-bold"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{lang === 'ar' ? emp.arabicName : emp.englishName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-450 mb-1">{lang === 'ar' ? 'اختر القالب النظامي لقانون العمل:' : 'Select Civil Code Legal Template:'}</label>
            <select 
              value={selectedTemplate}
              onChange={(e: any) => setSelectedTemplate(e.target.value)}
              className="w-full p-2 border rounded-xl bg-white text-slate-800 text-xs font-bold"
            >
              <option value="saudi_fixed">Saudi Fixed Covenant (سعودي محدد المدة)</option>
              <option value="expat_muqeem">Expat Muqeem Qiwa Draft (مقيم لوافد - قوى)</option>
              <option value="temp_project">Temporary Signage Task Contract (مؤقت إعلاني محدد لمشروع)</option>
            </select>
          </div>

          {/* Form to append direct contract amendments */}
          <form onSubmit={handleAddAmendment} className="pt-3 border-t border-slate-200 space-y-2">
            <label className="block text-[#0072BC] font-black">{lang === 'ar' ? '✍️ صياغة ملاحاق وشروط خاصة إضافية:' : '✍️ Append Custom Addendum Clauses:'}</label>
            <textarea 
              value={appendSpecialNotes}
              onChange={e => setAppendSpecialNotes(e.target.value)}
              placeholder={lang === 'ar' ? 'أضف شروط عهد السيارات والتحمل بالتأمين، أو شروط العمل المسائي بالكلادينج...' : 'e.g. Employee accepts responsibility for Signage vehicle custody...'}
              className="w-full p-2 border rounded-xl h-20 text-[11px] bg-white font-medium" 
            />
            <button 
              type="submit" 
              className="w-full py-1.5 bg-[#0072BC] hover:bg-[#0072BC]/95 text-white rounded-xl text-[10px] font-black"
            >
              🔗 {lang === 'ar' ? 'حقن وحفظ الملحق بالعقد' : 'Inject Amendment'}
            </button>
          </form>
        </div>

        {/* Right Printable Layout Preview: Dynamic Document simulated envelope (8 columns) */}
        <div id="contracts-document-preview-pane" className="md:col-span-8 bg-white border border-slate-205 p-8 rounded-2xl shadow-sm space-y-6 relative print:p-0 print:border-0 print:shadow-none">
          
          {/* Company letterhead watermark */}
          <DocumentHeader />

          {/* Contract Content body */}
          <div className="space-y-4 leading-relaxed text-slate-800">
            <div className="text-center font-black text-sm text-[#0072BC] border-b pb-2">
              {lang === 'ar' ? legalContent.title_ar : legalContent.title_en}
            </div>

            <div className="text-xs space-y-4 whitespace-pre-wrap font-medium">
              <p className="leading-normal">{lang === 'ar' ? legalContent.body_ar : legalContent.body_en}</p>
              
              {/* Special injected notes if any */}
              {amendments.filter(a => a.empId === activeEmp.id).length > 0 && (
                <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl space-y-2 mt-4">
                  <span className="text-[10px] uppercase font-black text-amber-700 block">⚠️ Integrated Addendum amendments clauses (الملاحق النشطة الحاكمة):</span>
                  {amendments.filter(a => a.empId === activeEmp.id).map(a => (
                    <div key={a.id} className="text-[11px] leading-relaxed relative">
                      <p className="font-bold text-slate-800">● {lang === 'ar' ? a.changeCategory_ar : a.changeCategory_en} ({a.date})</p>
                      <p className="text-slate-500 italic pl-3">"Clause: {a.details}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contract bottom details printable mock signatures */}
          <div className="pt-8 border-t border-dashed grid grid-cols-2 gap-4 text-xs font-bold text-slate-700 text-center mb-8">
            <div className="space-y-4">
              <p>{lang === 'ar' ? 'الطرف الأول: شركة فنون الوليد للصناعة' : 'First Party: Al-Waleed Co Director'}</p>
              <div className="h-10 flex items-center justify-center italic text-slate-300">
                [ {lang === 'ar' ? 'توقيع وختم الإدارة الإلكتروني' : 'Signed E-Seal' } ]
              </div>
            </div>
            <div className="space-y-4">
              <p>{lang === 'ar' ? 'الطرف الثاني: الموظف المستلم' : 'Second Party: Employee Signature'}</p>
              <div className="h-10 flex items-center justify-center italic text-slate-300">
                [ {activeEmp.englishName} ]
              </div>
            </div>
          </div>
          <DocumentFooter />
        </div>

      </div>

    </div>
  );
}
