import React, { useState } from 'react';
import { Target, Sparkles, Star, Award, Heart, PlusCircle, CheckCircle } from 'lucide-react';
import { Employee } from '../../types';

interface Candidate {
  id: string;
  name: string;
  nationality: string;
  expYears: number;
  skills: string[];
  appliedTitle: string;
  expectedSalary: number;
  scoreAppearance: number; // 1-5
  scoreTechnical: number; // 1-5
  scoreCommunication: number; // 1-5
  notes: string;
  status: 'UNDER_REVIEW' | 'INTERVIEWED' | 'PROMOTED_TO_EMP';
}

interface Requisition {
  id: string;
  title: string;
  dept: string;
  budgetCap: number;
  reason: string;
  approved: boolean;
}

interface HrRecruitmentTabProps {
  lang: 'ar' | 'en';
  onAddEmployeeLocally: (emp: Partial<Employee>) => void;
}

export default function HrRecruitmentTab({ lang, onAddEmployeeLocally }: HrRecruitmentTabProps) {
  // 1. Initial vacancy demands ledger
  const [requisitions, setRequisitions] = useState<Requisition[]>([
    { id: 'REQ-01', title: 'Senior Neon Glass Bender', dept: 'Neon Fabrication Division', budgetCap: 7500, reason: 'Expansion of Olaya neon signage workshop orders', approved: true },
    { id: 'REQ-02', title: 'Outdoor Cladding Installation specialist', dept: 'Field Installation & Cranes', budgetCap: 8000, reason: 'High-Altitude sign hoist and crane operations safety backup', approved: true },
    { id: 'REQ-03', title: 'CNC Acrylic Carver & Vector Prep', dept: 'CNC Laser Carving Section', budgetCap: 6500, reason: 'CNC router speed expansion due to Shabili Mall project timeline', approved: false }
  ]);

  // 2. Candidate roster with evaluation matrices
  const [candidates, setCandidates] = useState<Candidate[]>([
    {
      id: 'CAN-802',
      name: 'Ahmad Al-Wadi',
      nationality: 'Yemeni (Resident)',
      expYears: 6,
      skills: ['Rare Gas Siphoning', 'Neon Tube bending', 'High voltage transformers mounting', 'Glass blowing'],
      appliedTitle: 'Senior Neon Glass Bender',
      expectedSalary: 6200,
      scoreAppearance: 5,
      scoreTechnical: 5,
      scoreCommunication: 4,
      notes: 'Exceptional visual dexterity. Performed faultless glass bending trial in our South Workshop yard. High understanding of safety hazards.',
      status: 'INTERVIEWED'
    },
    {
      id: 'CAN-803',
      name: 'Naif Al-Ghamdi',
      nationality: 'Saudi',
      expYears: 3,
      skills: ['CorelDRAW vectors', 'Estimating face meters', 'Customer pricing proposals'],
      appliedTitle: 'Advertising Sales & Estimating',
      expectedSalary: 7000,
      scoreAppearance: 4,
      scoreTechnical: 3,
      scoreCommunication: 5,
      notes: 'Very articulate Saudi youth. Highly communicative. Needs technical training on acrylic grades pricing calculations.',
      status: 'UNDER_REVIEW'
    },
    {
      id: 'CAN-804',
      name: 'Michael Chen',
      nationality: 'Filipino',
      expYears: 8,
      skills: ['CNC steel engraving', '3D letter acrylic carving', 'AutoCAD router drafting'],
      appliedTitle: 'CNC Acrylic Carver & Vector Prep',
      expectedSalary: 5500,
      scoreAppearance: 3,
      scoreTechnical: 5,
      scoreCommunication: 3,
      notes: 'Excellent CNC specialist. Handled laser and routing beds seamlessly. Immediate visa available.',
      status: 'UNDER_REVIEW'
    }
  ]);

  // Selected candidate to inspect
  const [selectedCanId, setSelectedCanId] = useState('CAN-802');

  // Form states
  const [isReqOpen, setIsReqOpen] = useState(false);
  const [reqTitle, setReqTitle] = useState('');
  const [reqDept, setReqDept] = useState('Neon Fabrication Division');
  const [reqBudget, setReqBudget] = useState(6000);
  const [reqReason, setReqReason] = useState('Corporate project load');

  const activeCandidate = candidates.find(c => c.id === selectedCanId) || candidates[0];

  // Rating update handler
  const handleRateCandidate = (criteria: 'appearance' | 'technical' | 'communication', rating: number) => {
    setCandidates(prev => prev.map(can => {
      if (can.id === selectedCanId) {
        if (criteria === 'appearance') return { ...can, scoreAppearance: rating };
        if (criteria === 'technical') return { ...can, scoreTechnical: rating };
        if (criteria === 'communication') return { ...can, scoreCommunication: rating };
      }
      return can;
    }));
  };

  // Requisition submission
  const handleCreateReq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle) return;
    const newReq: Requisition = {
      id: `REQ-${Date.now().toString().slice(-2)}`,
      title: reqTitle,
      dept: reqDept,
      budgetCap: reqBudget,
      reason: reqReason,
      approved: false // awaits administrative approval
    };
    setRequisitions(prev => [...prev, newReq]);
    setIsReqOpen(false);
  };

  // HIRED - ONE CLICK HIRE-PROMOTE SUPER ACTION FUNCTION
  const handleOneClickHire = (candidate: Candidate) => {
    if (candidate.status === 'PROMOTED_TO_EMP') {
      alert('This candidate has already been hired and migrated to the master database!');
      return;
    }

    // A. Direct transform candidate metrics into a pristine Employee Profile
    const newEmpId = `EMP-${Math.floor(1004 + Math.random() * 8000)}`;
    const mockEmployeeProfile: Partial<Employee> = {
      id: newEmpId,
      arabicName: candidate.name, // Bilingual map
      englishName: candidate.name,
      iqamaId: candidate.nationality.toLowerCase().includes('saudi') ? `1${Math.floor(100000000 + Math.random() * 900000000)}` : `2${Math.floor(100000000 + Math.random() * 900000000)}`,
      passportDetails: `SA${Math.floor(1000000 + Math.random() * 9000000)}`,
      jobTitle: candidate.appliedTitle,
      grade: 'PROBATION', // Starts active probation
      basicSalary: candidate.expectedSalary,
      allowances: {
        housing: Math.floor(candidate.expectedSalary * 0.25),
        transport: 500,
        phone: 200
      },
      homeAddress: 'Saudi Arabia, Riyadh Branch Quarter Workspace',
      custody: {
        laptop: 'Assigned Draft',
        tools: 'Assigned Draft',
        vehicles: 'None'
      },
      birthDate: '1995-05-15',
      dateOfJoining: new Date().toISOString().slice(0, 10),
      contractExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      department: candidate.appliedTitle.includes('Neon') ? 'Neon Production Division' : 'Engineering & Fabrication'
    };

    // B. Trigger locally added employee append callback to root list
    onAddEmployeeLocally(mockEmployeeProfile);

    // C. Change status in Candidate list to show Promoted & archived
    setCandidates(prev => prev.map(c => {
      if (c.id === candidate.id) {
        return { ...c, status: 'PROMOTED_TO_EMP' };
      }
      return c;
    }));

    // Alert successful automated migration
    const succMsg = lang === 'ar'
      ? `👑 قنبلة الأتمتة الإدارية! تم نسخ كافة بيانات "${candidate.name}" بنجاح، وولد له الرقم الوظيفي (${newEmpId}) كملف رسمي نشط فورياً في دليل شؤون الموظفين دون إعادة كتابة أي حرف!`
      : `👑 One-Click Sourcing Complete! "${candidate.name}" successfully migrated into Master Directory as active staff under ID (${newEmpId}) with automatic GOSI and allowances injection.`;
    alert(succMsg);
  };

  return (
    <div id="hr-recruitment-module" className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/50 space-y-6">
      
      {/* Title Header Section banner */}
      <h4 className="text-sm font-black text-[#0072BC] flex items-center justify-between pb-2 border-b border-slate-100">
        <span className="flex items-center gap-2">
          <Target className="w-4.5 h-4.5 text-[#00AEEF]" />
          {lang === 'ar' ? '🎯 التوظيف الذكي ومخطط المقابلات الفنية' : 'Recruitment pipeline & Candidate screening rubric'}
        </span>
        <button 
          onClick={() => setIsReqOpen(true)}
          className="px-3 py-1 bg-[#0072BC] text-white text-[10px] font-black rounded-xl hover:bg-[#0072BC]/90"
        >
          {lang === 'ar' ? 'طلب احتياج بشري للقسم +' : 'New Job Requisition +'}
        </button>
      </h4>

      {/* Grid: 1. Vacancy requisitions list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {requisitions.map(req => (
          <div key={req.id} className="p-4 bg-slate-50/75 rounded-2xl border border-slate-100 text-xs space-y-1 relative">
            <span className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-black ${req.approved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {req.approved ? (lang === 'ar' ? 'معتمد ومفتوح' : 'APPROVED & OPEN') : (lang === 'ar' ? 'معلق وافقت الإدارة' : 'PENDING REVIEW')}
            </span>
            <p className="font-extrabold text-slate-800">{req.title}</p>
            <p className="text-[10px] text-[#0072BC] font-mono">{req.dept}</p>
            <p className="text-[11px] text-slate-500 italic mt-1 font-mono">"Reason: {req.reason}"</p>
            <p className="text-[10px] text-slate-400 border-t pt-1 mt-1">Budget Cap: <strong className="font-mono text-[#0072BC]">SAR {req.budgetCap}/mo</strong></p>
          </div>
        ))}
      </div>

      {/* Grid: 2. Core candidates review panel & rate matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 border-t border-slate-100">
        
        {/* Left Side: Candidates fast switch list (4 cols) */}
        <div className="lg:col-span-4 bg-slate-50/60 p-4 rounded-2xl border border-slate-100 space-y-3">
          <p className="text-[10px] text-slate-400 font-extrabold uppercase uppercase tracking-wider">{lang === 'ar' ? 'طابور فرز المتقدمين:' : 'APPLICANTS PIPELINE:'}</p>
          
          <div className="space-y-1.5">
            {candidates.map(can => {
              const isSelected = can.id === selectedCanId;
              return (
                <button
                  key={can.id}
                  onClick={() => setSelectedCanId(can.id)}
                  className={`w-full text-right p-3 rounded-xl flex items-center justify-between transition-all text-xs ${
                    isSelected ? 'bg-[#0072BC] text-white font-bold' : 'bg-white text-slate-700 hover:bg-slate-105'
                  }`}
                >
                  <div>
                    <p className="font-extrabold">{can.name}</p>
                    <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                      {can.appliedTitle}
                    </p>
                  </div>
                  {can.status === 'PROMOTED_TO_EMP' ? (
                    <span className="bg-emerald-500 text-white text-[8px] font-black px-1.5 rounded uppercase">HIRED</span>
                  ) : (
                    <span className="text-[9px] font-mono font-black">{can.expYears} yr exp</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Evaluation Matrix details & One-Click Hire (8 cols) */}
        {activeCandidate && (
          <div className="lg:col-span-8 bg-white border border-slate-150 p-5 rounded-2xl space-y-4">
            
            <div className="flex justify-between items-start pb-3 border-b flex-wrap gap-2">
              <div>
                <h5 className="font-extrabold text-sm text-slate-800">{activeCandidate.name}</h5>
                <p className="text-xs text-slate-400">{activeCandidate.nationality} | {activeCandidate.expYears} Years Signage Experience</p>
              </div>

              {/* AUTOMATION HIRED SUPER TRIGGER BUTTON */}
              {activeCandidate.status !== 'PROMOTED_TO_EMP' ? (
                <button
                  onClick={() => handleOneClickHire(activeCandidate)}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-[#00AEEF] text-white hover:brightness-105 shadow-md flex items-center gap-1.5 rounded-xl text-xs font-black animate-bounce"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  {lang === 'ar' ? '⚡ التوظيف الفوري الذكي (One-Click Hire)' : '⚡ One-Click HIRE & Export!'}
                </button>
              ) : (
                <span className="px-4 py-2 bg-emerald-100 border border-emerald-350 text-emerald-800 text-xs font-black rounded-xl uppercase flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  {lang === 'ar' ? 'تم التعيين ودمجه بقاعدة البيانات الكبرى' : 'Contract finalized & Active in ERP'}
                </span>
              )}
            </div>

            {/* Tech tag list */}
            <div>
              <span className="text-[10px] text-slate-400 block mb-1.5">{lang === 'ar' ? 'المهارات والخلاصة الوظيفية:' : 'Skills Inventory & Tech Tags:'}</span>
              <div className="flex flex-wrap gap-1">
                {activeCandidate.skills.map((s, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-sky-50 text-[#0072BC] text-[10px] font-bold rounded-lg border border-sky-100">
                    ⚙️ {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Assessment Score Rubrics Grid */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-3">
              <span className="text-[10px] uppercase font-black text-[#0072BC] block">⭐ Technical & Visual Interview Rating Rubric:</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-600">
                {/* 1. Appearance */}
                <div className="bg-white p-3 rounded-lg border flex flex-col justify-between h-18">
                  <span>{lang === 'ar' ? 'المظهر والهندام المهني' : 'Appearance / Fit'}</span>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button 
                        type="button" 
                        key={star} 
                        disabled={activeCandidate.status === 'PROMOTED_TO_EMP'}
                        onClick={() => handleRateCandidate('appearance', star)}
                        className={`text-sm ${star <= activeCandidate.scoreAppearance ? 'text-amber-500' : 'text-slate-300'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Technical Skill */}
                <div className="bg-white p-3 rounded-lg border flex flex-col justify-between h-18">
                  <span>{lang === 'ar' ? 'الخبرة الفنية والتشكيل' : 'Technical Signage Skills'}</span>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button 
                        type="button" 
                        key={star} 
                        disabled={activeCandidate.status === 'PROMOTED_TO_EMP'}
                        onClick={() => handleRateCandidate('technical', star)}
                        className={`text-sm ${star <= activeCandidate.scoreTechnical ? 'text-amber-500' : 'text-slate-300'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Communication */}
                <div className="bg-white p-3 rounded-lg border flex flex-col justify-between h-18">
                  <span>{lang === 'ar' ? 'التفاهم والوعي بالسلامة' : 'Communication & Safety'}</span>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button 
                        type="button" 
                        key={star} 
                        disabled={activeCandidate.status === 'PROMOTED_TO_EMP'}
                        onClick={() => handleRateCandidate('communication', star)}
                        className={`text-sm ${star <= activeCandidate.scoreCommunication ? 'text-amber-500' : 'text-slate-300'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Interviewer notes */}
            <div className="text-xs text-slate-650 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
              <span className="text-[10px] text-amber-800 font-extrabold block mb-1">✍️ Interviewer Technical Comments / ملاحظات لجنة التقييم:</span>
              <p className="italic text-slate-600">
                "{activeCandidate.notes}"
              </p>
            </div>

            {/* Remuneration check */}
            <div className="text-xs text-slate-400 flex justify-between border-t border-slate-100/60 pt-2 font-mono">
              <span>Expected Pay: <strong className="text-slate-700">SAR {activeCandidate.expectedSalary}/mo</strong></span>
              <span>Requisition Cap: <strong className="text-[#0072BC]">SAR 7,500/mo</strong></span>
            </div>

          </div>
        )}

      </div>

      {/* Requisition dialog modal */}
      {isReqOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-xs">
          <form onSubmit={handleCreateReq} className="bg-white p-6 rounded-3xl border border-slate-100 max-w-sm w-full space-y-4">
            <h5 className="font-extrabold text-[#0072BC] text-sm">
              ➕ {lang === 'ar' ? 'إنشاء طلب توظيف وإعلان وظيفة' : 'Raise New Vacant Requisition'}
            </h5>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'اسم الوظيفة المطلوبة' : 'Requested Job Title'}</label>
                <input required type="text" value={reqTitle} onChange={e => setReqTitle(e.target.value)} className="w-full p-2 border rounded-xl" placeholder="e.g. Neon Apprentice" />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'القسم الحاحب للطلب' : 'Division'}</label>
                <select value={reqDept} onChange={e => setReqDept(e.target.value)} className="w-full p-2 border rounded-xl bg-slate-50">
                  <option value="Neon Fabrication Division">Neon Fabrication Division / الورشة الكبرى</option>
                  <option value="Field Installation & Cranes">Cranes / التركيبات الميدانية والرافعات</option>
                  <option value="CNC Laser Carving Section">CNC Laser / التفريغ والتشكيل</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'الراتب المخصص كحد أقصى' : 'Salary Maximum threshold (SAR)'}</label>
                <input type="number" value={reqBudget} onChange={e => setReqBudget(Number(e.target.value))} className="w-full p-2 border rounded-xl" />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'مبرر رفع الاحتياج الميداني' : 'Justification Reasoning'}</label>
                <textarea value={reqReason} onChange={e => setReqReason(e.target.value)} className="w-full p-2 border rounded-xl h-14" />
              </div>
            </div>

            <div className="flex gap-2 font-black">
              <button type="submit" className="flex-1 bg-[#0072BC] text-white py-2 rounded-xl">
                {lang === 'ar' ? 'إرسال للموافقة بالـ ERP' : 'Publish Requisition'}
              </button>
              <button type="button" onClick={() => setIsReqOpen(false)} className="flex-1 bg-slate-100 text-slate-705 py-2 rounded-xl">
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
