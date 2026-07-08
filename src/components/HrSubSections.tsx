import React, { useState } from 'react';
import { 
  Users, FileText, TrendingUp, DollarSign, Search, PlusCircle, CheckCircle2, 
  Trash2, Shield, Calendar, Clock, AlertTriangle, Briefcase, Award, 
  Layers, MapPin, Sparkles, HelpCircle, FileSpreadsheet, Percent, Calculator, Activity, Heart, Bookmark
} from 'lucide-react';
import { sharedPrintHeader, sharedPrintFooter, sharedPrintStyles } from '../utils/PrintShared';
import { Employee, ClearanceProfile, User } from '../types';

// Importing pristine modular HR sub-tabs
import HrDashboardTab from './hr/HrDashboardTab';
import HrOrgStructureTab from './hr/HrOrgStructureTab';
import HrJobManagementTab from './hr/HrJobManagementTab';
import HrEmployeeDirectoryTab from './hr/HrEmployeeDirectoryTab';
import HrRecruitmentTab from './hr/HrRecruitmentTab';
import HrContractsTab from './hr/HrContractsTab';
import HrAttendanceTab from './hr/HrAttendanceTab';
import HrLeavesTab from './hr/HrLeavesTab';
import HrSelfServiceTab from './hr/HrSelfServiceTab';
import HrPayrollTab from './hr/HrPayrollTab';
import HrDocumentTrackingTab from './hr/HrDocumentTrackingTab';

interface HrSubSectionsProps {
  employees: Employee[];
  lang: 'ar' | 'en';
  onReloadEmployees: () => Promise<void>;
  metrics: any;
  clearances: ClearanceProfile[];
  onReloadClearances: () => Promise<void>;
  onReloadMetrics: () => Promise<void>;
  onInitializeClearance: (emp: Employee) => void;
  onResolveClearanceBlocker: (clearanceId: string, blockerType: 'vehicles' | 'it' | 'tools') => Promise<void>;
  activeHRSubTab?: string;
  setActiveHRSubTab?: (tab: string) => void;
  onDeleteEmployee?: (id: string) => void;
  user?: User | null;
}

export default function HrSubSections({
  lang,
  employees,
  onReloadEmployees,
  metrics,
  clearances,
  onReloadClearances,
  onReloadMetrics,
  onInitializeClearance,
  onResolveClearanceBlocker,
  activeHRSubTab: propActiveHRSubTab,
  setActiveHRSubTab: propSetActiveHRSubTab,
  onDeleteEmployee,
  user
}: HrSubSectionsProps) {
  
  // Selected SubTab
  const [localActiveHRSubTab, setLocalActiveHRSubTab] = useState('dashboard');
  const activeHRSubTab = propActiveHRSubTab !== undefined ? propActiveHRSubTab : localActiveHRSubTab;
  const setActiveHRSubTab = propSetActiveHRSubTab !== undefined ? propSetActiveHRSubTab : setLocalActiveHRSubTab;

  // Local state for instant feedback syncing from props as fallback
  const [localEmployees, setLocalEmployees] = useState<Employee[]>(employees);

  // States for bulk custody handover and deletion
  const [bulkField, setBulkField] = useState<'laptop' | 'vehicles' | 'tools'>('laptop');
  const [bulkValue, setBulkValue] = useState('');

  React.useEffect(() => {
    setLocalEmployees(employees);
  }, [employees]);

  // WPS Payroll Interactive custom state adjustments
  const [payrollSearchQuery, setPayrollSearchQuery] = useState('');
  const [payAdditionState, setPayAdditionState] = useState<Record<string, number>>({});
  const [payBonusState, setPayBonusState] = useState<Record<string, number>>({});
  const [payDeductionState, setPayDeductionState] = useState<Record<string, number>>({});
  
  // Custom payslip popup / viewing States
  const [selectedPayslipEmp, setSelectedPayslipEmp] = useState<Employee | null>(null);
  const [isSendingPayslip, setIsSendingPayslip] = useState<string | null>(null);

  // Automated CRUD backports to backend with graceful failsafes
  const handleAddEmployeeLocally = (newEmp: Partial<Employee>) => {
    const fullEmp: Employee = {
      id: newEmp.id || `EMP-${Date.now().toString().slice(-4)}`,
      arabicName: newEmp.arabicName || '',
      englishName: newEmp.englishName || '',
      iqamaId: newEmp.iqamaId || '',
      passportDetails: newEmp.passportDetails || '',
      jobTitle: newEmp.jobTitle || 'Technician',
      grade: newEmp.grade || 'PROBATION',
      basicSalary: newEmp.basicSalary || 5000,
      allowances: newEmp.allowances || { housing: 1500, transport: 500 },
      homeAddress: newEmp.homeAddress || '',
      custody: newEmp.custody || {},
      birthDate: newEmp.birthDate || '',
      dateOfJoining: newEmp.dateOfJoining || new Date().toISOString().slice(0, 10),
      contractExpiry: newEmp.contractExpiry || '',
      department: newEmp.department || 'Production',
      ...newEmp // Spread all other fields to preserve them
    };

    setLocalEmployees(prev => [...prev, fullEmp]);

    // REST POST request to server
    fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullEmp)
    }).then(() => {
      onReloadEmployees();
    }).catch(err => console.log('API save bypassed, local memory active:', err));
  };

  const handleUpdateEmployeeFields = (empId: string, updatedFields: Partial<Employee>) => {
    setLocalEmployees(prev => prev.map(e => e.id === empId ? { ...e, ...updatedFields } : e));

    // REST PUT request to server
    fetch(`/api/employees/${empId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFields)
    }).then(() => {
      onReloadEmployees();
    }).catch(err => console.log('API update bypassed, local memory active:', err));
  };

  const handleClearCustodyField = (empId: string, field: 'laptop' | 'vehicles' | 'tools') => {
    const emp = localEmployees.find(e => e.id === empId);
    if (!emp) return;

    const updatedCustody = {
      ...(emp.custody || { laptop: '', vehicles: '', tools: '' }),
      [field]: ''
    };

    handleUpdateEmployeeFields(empId, { custody: updatedCustody });
  };

  const handleBulkAssignCustody = () => {
    const isAr = lang === 'ar';

    if (!bulkValue.trim()) {
      alert(isAr ? 'الرجاء إدخال اسم وتفاصيل العهدة لتطبيقها!' : 'Please enter custody details first!');
      return;
    }

    // Mutate and save for everyone optimistically
    const updatedEmployees = localEmployees.map(emp => {
      const updatedCustody = {
        ...(emp.custody || { laptop: '', vehicles: '', tools: '' }),
        [bulkField]: bulkValue
      };
      
      // Dispatch PUT request
      fetch(`/api/employees/${emp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custody: updatedCustody })
      }).catch(err => console.log('Bypassed bulk save:', err));

      return {
        ...emp,
        custody: updatedCustody
      };
    });

    setLocalEmployees(updatedEmployees);
    if (onReloadEmployees) {
      onReloadEmployees();
    }
    alert(isAr ? '✓ تم إسناد وإضافة العهدة لجميع الموظفين بنجاح!' : '✓ Custody assigned to all employees successfully!');
    setBulkValue('');
  };

  const handleBulkDeleteCustody = () => {
    const isAr = lang === 'ar';

    // Mutate and save for everyone optimistically
    const updatedEmployees = localEmployees.map(emp => {
      const updatedCustody = {
        ...(emp.custody || { laptop: '', vehicles: '', tools: '' }),
        [bulkField]: ''
      };

      // Dispatch PUT request
      fetch(`/api/employees/${emp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custody: updatedCustody })
      }).catch(err => console.log('Bypassed bulk delete:', err));

      return {
        ...emp,
        custody: updatedCustody
      };
    });

    setLocalEmployees(updatedEmployees);
    if (onReloadEmployees) {
      onReloadEmployees();
    }
    alert(isAr ? '✓ تم حذف وإزالة العهدة لجميع الموظفين بنجاح!' : '✓ Custody deleted/cleared for all employees successfully!');
  };

  // Browser-based notification simulator
  const handleTriggerSMSNotification = (empName: string, docType: string) => {
    const smsText = lang === 'ar' 
      ? `عزيزي الموظف ${empName}، يرجى التكرم بتقديم وثائق تجديد [${docType}] لقسم الموارد البشرية لتفادي وقف الخدمات.`
      : `Dear ${empName}, please upload renewed [${docType}] files to HR portal immediately.`;
    
    if (confirm(lang === 'ar' ? `محاكاة إرسال رسالة SMS للموظف:\n\n"${smsText}"` : `Simulate sending system SMS:\n\n"${smsText}"`)) {
      alert(lang === 'ar' ? '✓ تم إرسال التنبيه لهاتف الموظف المسجل بنجاح!' : '✓ Alert dispatched successfully!');
    }
  };
  
  // Collapsible sections state
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    dashboard: true,
    employees: true,
    structure: false,
    titles: false,
    recruitment: false,
    contracts: false,
    attendance: false,
    leaves: false,
    payroll: false,
    loans: false,
    custody: false,
    performance: false,
    promotions: false,
    disciplinary: false,
    training: false,
    insurance: false,
    gov_docs: false,
    eos: false,
    clearance: false,
    library: false,
    ess: false,
    approvals: false,
    reports: false,
    alerts: false,
  });

  const toggleGroup = (grp: string) => {
    setExpandedGroups(prev => ({ ...prev, [grp]: !prev[grp] }));
  };

  // State engines for interactive widgets
  const [newEmpTab, setNewEmpTab] = useState<'personal' | 'work' | 'salary' | 'bank' | 'docs'>('personal');
  const [eosYears, setEosYears] = useState(5);
  const [eosReason, setEosReason] = useState<'resigned' | 'terminated'>('terminated');
  const [eosSalary, setEosSalary] = useState(8000);
  const [selectedLetterEmp, setSelectedLetterEmp] = useState<Employee | null>(employees[0] || null);
  const [selectedLetterType, setSelectedLetterType] = useState('experience');
  const [loanAmount, setLoanAmount] = useState(25000);
  const [loanMonths, setLoanMonths] = useState(12);

  // Saudi EOS Award logic based on Saudi Labor Law
  const calculateSaudiEos = () => {
    let multiplier = eosReason === 'terminated' ? 1.0 : (eosYears < 2 ? 0.0 : eosYears <= 5 ? (1/3) : eosYears <= 10 ? (2/3) : 1.0);
    let totalAward = 0;
    if (eosYears <= 5) {
      totalAward = (eosSalary / 2) * eosYears;
    } else {
      totalAward = (eosSalary / 2) * 5 + (eosSalary) * (eosYears - 5);
    }
    return totalAward * multiplier;
  };

  // SubTab configuration array to map side link translations
  const subTabGroups = [
    {
      id: 'dashboard',
      icon: TrendingUp,
      title_ar: 'لوحة التحكم',
      title_en: 'Dashboard Hub',
      subs: [{ id: 'dashboard', label_ar: 'نظرة عامة والمؤشرات', label_en: 'Overview Metrics' }]
    },
    {
      id: 'employees',
      icon: Users,
      title_ar: 'إدارة الموظفين',
      title_en: 'Employees Admin',
      subs: [
        { id: 'employees_all', label_ar: 'قائمة جميع الموظفين', label_en: 'All Staff Profiles' },
        { id: 'employees_add', label_ar: 'إلحاق وإضافة موظف جديد', label_en: 'Add Employee Wizard' },
        { id: 'employees_factory', label_ar: 'عمال المصنع ⚙️', label_en: 'Factory Workers ⚙️' },
        { id: 'document_tracking', label_ar: 'الوثائق الحكومية والتراخيص 📄', label_en: 'Gov & Corporate Docs 📄' }
      ]
    },
    {
      id: 'structure',
      icon: Layers,
      title_ar: 'الهيكل التنظيمي',
      title_en: 'Org Structure',
      subs: [
        { id: 'org_divisions', label_ar: 'الإدارات والأقسام والفروع', label_en: 'Divisions & Branches' }
      ]
    },
    {
      id: 'titles',
      icon: Briefcase,
      title_ar: 'المسميات والسلم الوظيفي',
      title_en: 'Job Titles & Grades',
      subs: [
        { id: 'job_titles_ladder', label_ar: 'مستويات السلم المهني والدرجات', label_en: 'Schedules & Grades' }
      ]
    },
    {
      id: 'recruitment',
      icon: Sparkles,
      title_ar: 'التوظيف والاستقطاب',
      title_en: 'Recruitment & Sourcing',
      subs: [
        { id: 'rec_pipeline', label_ar: 'طلبات ومقابلات وعروض العمل', label_en: 'Hiring Queue & Offers' }
      ]
    },
    {
      id: 'contracts',
      icon: FileText,
      title_ar: 'العقود والتجديدات',
      title_en: 'Contracts & Renewals',
      subs: [
        { id: 'contracts_active', label_ar: 'عقود الموظفين وقوالب النماذج', label_en: 'Contract Templates' }
      ]
    },
    {
      id: 'attendance',
      icon: Clock,
      title_ar: 'الحضور والانصراف والعمل الإضافي',
      title_en: 'Time & Attendance Tracker',
      subs: [
        { id: 'att_logs', label_ar: 'الحضور اليومي والتأخير ومزامنة البصمة', label_en: 'Daily Log & Biometrics' }
      ]
    },
    {
      id: 'leaves',
      icon: Calendar,
      title_ar: 'الإجازات وأرصدة الموظفين',
      title_en: 'Leaves & Balances',
      subs: [
        { id: 'leaves_tracker', label_ar: 'طلبات الإجازة والتقويم الفعلي', label_en: 'Vacations & Calendars' }
      ]
    },
    {
      id: 'payroll',
      icon: DollarSign,
      title_ar: 'الرواتب والبدلات والخصومات',
      title_en: 'Payroll & Allowances',
      subs: [
        { id: 'payroll_registers', label_ar: 'مسير الرواتب الشهري WPS والكشوف', label_en: 'WPS Registers & Payslips' }
      ]
    },
    {
      id: 'loans',
      icon: Calculator,
      title_ar: 'السلف والقروض الشخصية',
      title_en: 'Loans & Advances',
      subs: [
        { id: 'loans_calculator', label_ar: 'طلبات السلف وجدولة الأقساط', label_en: 'Cash Advances Scheduling' }
      ]
    },
    {
      id: 'custody',
      icon: Shield,
      title_ar: 'العهد والأصول المستلمة',
      title_en: 'Assets & Custody',
      subs: [
        { id: 'custody_ledger', label_ar: 'سجل العهد وتسليم اللوازم للعمال', label_en: 'Vehicle & Toolkit Handover' }
      ]
    },
    {
      id: 'performance',
      icon: Award,
      title_ar: 'تقييم الأداء ومؤشرات الـ KPI',
      title_en: 'Performance & KPIs',
      subs: [
        { id: 'perf_reviews', label_ar: 'خطط التقييم السنوية ونتائج الأهداف', label_en: 'KPI Audits & Appraisals' }
      ]
    },
    {
      id: 'promotions',
      icon: TrendingUp,
      title_ar: 'الترقيات والزيادات والمكافآت',
      title_en: 'Promotions & Upgrades',
      subs: [
        { id: 'promo_records', label_ar: 'سجل ترقية المسميات والعلاوات الاستثنائية', label_en: 'Increments & Honorariums' }
      ]
    },
    {
      id: 'disciplinary',
      icon: AlertTriangle,
      title_ar: 'الإنذارات والمخالفات والتحقيقات',
      title_en: 'Disciplinary & Violations',
      subs: [
        { id: 'violations_penalties', label_ar: 'تسجيل الإنذارات الرسمية والجزاءات', label_en: 'Official Warnings & Inquiries' }
      ]
    },
    {
      id: 'insurance',
      icon: Heart,
      title_ar: 'التأمين الطبي والتعاقدات',
      title_en: 'Medical Insurance',
      subs: [
        { id: 'med_insurance', label_ar: 'المؤمن عليهم والتابعين والمطالبات', label_en: 'Insurers & Dependents Claims' }
      ]
    },
    {
      id: 'gov_docs',
      icon: Bookmark,
      title_ar: 'التنبيهات والوثائق الحكومية',
      title_en: 'Government Compliance',
      subs: [
        { id: 'gov_documents', label_ar: 'الإقامات والجوازات والتأمينات الاجتماعية', label_en: 'Iqama, Passport & GOSI limits' }
      ]
    },
    {
      id: 'eos',
      icon: Calculator,
      title_ar: 'إنهاء الخدمة ومستحقات العمالة',
      title_en: 'End of Service Award (EOS)',
      subs: [
        { id: 'eos_calculator', label_ar: 'حساب مكافأة نهاية الخدمة بالخدمة الذاتية', label_en: 'EOS Saudi Labor Law Calculator' }
      ]
    },
    {
      id: 'clearance',
      icon: CheckCircle2,
      title_ar: 'إخلاء الطرف والعهد',
      title_en: 'Personnel Clearances',
      subs: [
        { id: 'clearance_matrix', label_ar: 'مسارات تصفية العهد والاعتماد الأمني', label_en: 'Exit clearance checklists' }
      ]
    },
    {
      id: 'library',
      icon: FileSpreadsheet,
      title_ar: 'مكتبة الموارد البشرية ونماذج الخطابات',
      title_en: 'HR Templates Generator',
      subs: [
        { id: 'hr_library_letters', label_ar: 'توليد خطابات التعريف والشهادات المباشرة', label_en: 'Print letters & certificates' }
      ]
    },
    {
      id: 'ess',
      icon: Users,
      title_ar: 'الخدمة الذاتية للموظف (ESS)',
      title_en: 'Employee Self-Service (ESS)',
      subs: [
        { id: 'ess_dashboard', label_ar: 'بيانات الموظف وطلباته النشطة', label_en: 'Personal Dashboard & Claims' }
      ]
    },
    {
      id: 'payroll_group',
      icon: DollarSign,
      title_ar: 'مسير الرواتب المالي (WPS)',
      title_en: 'Payroll Management (WPS)',
      subs: [
        { id: 'payroll_main', label_ar: '💵 مسير الرواتب - الرئيسية', label_en: '💵 Payroll Overview' }
      ]
    },
    {
      id: 'approvals',
      icon: CheckCircle2,
      title_ar: 'مركز الموافقات المركزي',
      title_en: 'Central Approvals Queue',
      subs: [
        { id: 'approvals_hub', label_ar: 'طلبات الإجازات والسلف تحت نظر المراجعة', label_en: 'Accept/Decline Requests' }
      ]
    },
    {
      id: 'reports',
      icon: FileSpreadsheet,
      title_ar: 'التقارير والمؤشرات الإستراتيجية',
      title_en: 'HR Executive Reports',
      subs: [
        { id: 'strategic_reports', label_ar: 'تقارير توزيع الأجور والتوطين والعهد', label_en: 'Staff Analytics & WPS Audits' }
      ]
    }
  ];

  const isExternalNav = propActiveHRSubTab !== undefined;

  return (
    <div id="hr-subsections-root-layout" className="grid grid-cols-12 gap-6 items-start">
      
      {/* SIDEBAR SUB-CATEGORIES DROPDOWN (ONLY SHOW IF NOT USING THE UNIFIED MAIN SIDEBAR) */}
      {!isExternalNav && (
        <aside className="col-span-12 lg:col-span-4 bg-white/70 backdrop-blur-md border border-slate-100 rounded-3xl p-6 space-y-3 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-extrabold text-[#0072BC] text-sm flex items-center gap-2">
              <span>⚙️</span>
              {lang === 'ar' ? 'القائمة الكاملة لشؤون الموظفين' : 'HR Affairs Modules Matrix'}
            </h4>
            <span className="text-[10px] bg-[#00AEEF]/20 text-[#0072BC] font-mono px-2 py-0.5 rounded font-extrabold">
              24 {lang === 'ar' ? 'مسار نشط' : 'active views'}
            </span>
          </div>

          <div className="space-y-1">
            {subTabGroups.map(grp => {
              const Icon = grp.icon;
              const isExpanded = expandedGroups[grp.id];
              return (
                <div key={grp.id} className="border-b border-slate-50 pb-1">
                  <button
                    onClick={() => toggleGroup(grp.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-black transition-all ${
                      isExpanded ? 'bg-[#0072BC]/5 text-[#0072BC]' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#0072BC]" />
                      <span>{lang === 'ar' ? grp.title_ar : grp.title_en}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{isExpanded ? '▼' : '►'}</span>
                  </button>

                  {isExpanded && (
                    <div className="mt-1 pl-6 pr-2 space-y-1 border-l border-dashed border-slate-200 ml-3">
                      {grp.subs.map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => setActiveHRSubTab(sub.id)}
                          className={`w-full text-left p-2 rounded-lg text-[11px] font-bold transition-all text-right ${
                            activeHRSubTab === sub.id 
                            ? 'bg-[#00AEEF] text-white shadow-sm' 
                            : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-800'
                          }`}
                        >
                          {lang === 'ar' ? sub.label_ar : sub.label_en}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      )}

      {/* DYNAMIC CONTENT VIEWS (LOADED ON ACTIVE SELECTION) */}
      <section className={`${isExternalNav ? 'col-span-12' : 'col-span-12 lg:col-span-8'} space-y-6`}>
        
        {/* VIEW 1: Overview Telemetry Dashboard */}
        {activeHRSubTab === 'dashboard' && (
          <HrDashboardTab 
            lang={lang} 
            employees={localEmployees} 
            onReloadEmployees={onReloadEmployees} 
            onTriggerNotification={handleTriggerSMSNotification}
            onUpdateEmployeeFields={handleUpdateEmployeeFields}
            user={user}
            setActiveHRSubTab={setActiveHRSubTab}
          />
        )}

        {/* VIEW 2: All Employees */}
        {activeHRSubTab === 'employees_all' && (
          <HrEmployeeDirectoryTab 
            lang={lang} 
            employees={localEmployees} 
            onUpdateEmployeeFields={handleUpdateEmployeeFields}
            onInitializeClearance={onInitializeClearance}
            onReloadEmployees={onReloadEmployees}
            onAddEmployee={handleAddEmployeeLocally}
            user={user}
            onDeleteEmployee={(id) => {
              setLocalEmployees(prev => prev.filter(e => e.id !== id));
              if (onDeleteEmployee) {
                onDeleteEmployee(id);
              }
            }}
          />
        )}

        {/* VIEW: Factory Workers "عمال المصنع" */}
        {activeHRSubTab === 'employees_factory' && (
          <div id="factory-workers-panel" className="glass-panel p-6 rounded-3xl bg-white/80 border border-slate-100 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
              <div className="text-right">
                <h3 className="text-lg font-black text-[#0072BC]">
                  ⚙️ {lang === 'ar' ? 'عمال فنيين المصنع والورشة' : 'Factory & Workshop Workers'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'ar' 
                    ? 'إدارة فنيي ومعدي خطوط الإنتاج والقص واللحام والتثبيت والمطابقة الجمركية.' 
                    : 'Manage active labor force, machinery operators, and assembly workers.'}
                </p>
              </div>
              
              <div className="bg-blue-50 text-blue-800 font-extrabold text-xs px-3 py-1.5 rounded-xl border border-blue-100">
                {lang === 'ar' ? 'إجمالي عمال الورشة:' : 'Total Active Labor:'}{' '}
                {localEmployees.filter(e => e.department === 'عمال المصنع').length}
              </div>
            </div>

            {/* Quick Add Form */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 text-right">
                ➕ {lang === 'ar' ? 'إضافة عامل فني جديد للورشة:' : 'Deploy New Workshop Laborer:'}
              </h4>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const data = new FormData(form);
                  const nameAr = data.get('arabicName') as string;
                  const jobTitle = data.get('jobTitle') as string;
                  const expYears = Number(data.get('experienceYears')) || 0;

                  if (!nameAr.trim()) {
                    alert(lang === 'ar' ? 'يرجى كتابة الاسم الرباعي للعامل!' : 'Please enter worker name');
                    return;
                  }

                  const newWorker: Partial<Employee> = {
                    arabicName: nameAr,
                    englishName: nameAr, // fallback
                    jobTitle: jobTitle,
                    department: 'عمال المصنع',
                    basicSalary: 4500, // standard factory salary
                    experienceYears: expYears,
                    iqamaId: `24${Math.floor(10000000 + Math.random() * 90000000)}`,
                    passportDetails: `AC${Math.floor(100000 + Math.random() * 900000)}`,
                    allowances: { housing: 1000, transport: 400 },
                    grade: 'Grade 1'
                  };

                  handleAddEmployeeLocally(newWorker);
                  form.reset();
                }}
                className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end text-right"
              >
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold mb-1">{lang === 'ar' ? 'الاسم الفني الكامل' : 'Full Name'}</label>
                  <input 
                    name="arabicName"
                    type="text"
                    required
                    placeholder={lang === 'ar' ? 'مثال: سلمان العتيبي' : 'e.g. Salman Al-Otaibi'}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold text-right"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold mb-1">{lang === 'ar' ? 'المسمى الوظيفي والمهارة' : 'Job Title & Skill'}</label>
                  <select 
                    name="jobTitle"
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold text-right"
                  >
                    <option value="مشغل ليزر وراوتر CNC">{lang === 'ar' ? 'مشغل ليزر وراوتر CNC' : 'CNC Router Operator'}</option>
                    <option value="فني لحام وتشكيل">{lang === 'ar' ? 'فني لحام وتشكيل' : 'Welder Tech'}</option>
                    <option value="فني تجميع واجهات وأكريليك">{lang === 'ar' ? 'فني تجميع واجهات وأكريليك' : 'Acrylic Board Maker'}</option>
                    <option value="فني كهرباء وتمديد ليد">{lang === 'ar' ? 'فني كهرباء وتمديد ليد' : 'LED Electrician'}</option>
                    <option value="فني دهان ورش وتصفية">{lang === 'ar' ? 'فني دهان ورش وتصفية' : 'Finish Painter'}</option>
                    <option value="عامل مناولة وتعبئة">{lang === 'ar' ? 'عامل مناولة وتعبئة' : 'Packer & Laborer'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold mb-1">{lang === 'ar' ? 'سنوات الخبرة الفنية' : 'Years of Experience'}</label>
                  <input 
                    name="experienceYears"
                    type="number"
                    min="0"
                    max="45"
                    defaultValue="3"
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold text-center font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all"
                >
                  ⚡ {lang === 'ar' ? 'تعيين وإدراج العامل' : 'Deploy Worker'}
                </button>
              </form>
            </div>

            {/* Workers Cards / List Grid */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-700 text-right">
                ⚙️ {lang === 'ar' ? 'ملفات وقوائم الموظفين الفعليين بقسم الورشة والمصنع:' : 'Active Factory Labor roster:'}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {localEmployees.filter(e => e.department === 'عمال المصنع').map(emp => (
                  <div 
                    key={emp.id} 
                    className="bg-white p-4 rounded-2xl border border-slate-100 hover:shadow-md transition-all flex justify-between items-center"
                  >
                    <button
                      type="button"
                    onClick={() => {
                        if (confirm(lang === 'ar' ? 'هل أنت متأكد من رغبتك في تسريح أو شطب هذا العامل من قائمة عمال المصنع؟' : 'Are you sure you want to dismiss this worker?')) {
                          // Optimistic visual wipe
                          setLocalEmployees(prev => prev.filter(x => x.id !== emp.id));
                          if (onDeleteEmployee) {
                            onDeleteEmployee(emp.id);
                          }
                          fetch(`/api/employees/${emp.id}`, { method: 'DELETE' }).then(() => {
                            onReloadEmployees();
                          });
                        }
                      }}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      title={lang === 'ar' ? 'شطب ملف العامل' : 'Dismiss worker'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="text-right space-y-1">
                      <div className="font-extrabold text-[#0072BC] text-xs">
                        {lang === 'ar' ? emp.arabicName : emp.englishName}
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5 justify-end">
                        <Briefcase className="w-3 h-3 text-cyan-600" />
                        <span>{emp.jobTitle}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {lang === 'ar' ? 'سنوات الخبرة:' : 'Years of Experience:'}{' '}
                        <strong className="text-slate-700 font-mono text-[11px]">{emp.experienceYears || 0}</strong> {lang === 'ar' ? 'سنوات' : 'Years'}
                      </div>
                      <div className="text-[9px] text-[#0072BC] font-mono bg-blue-50 px-1.5 py-0.5 rounded inline-block">
                        {emp.id}
                      </div>
                    </div>
                  </div>
                ))}

                {localEmployees.filter(e => e.department === 'عمال المصنع').length === 0 && (
                  <div className="col-span-2 text-center py-8 text-slate-400 font-semibold bg-slate-50 rounded-2xl border border-dashed">
                    {lang === 'ar' 
                      ? 'لا يوجد عمال مصنع مسجلين حالياً. يرجى إضافة عمال بالاستمارة أعلاه.' 
                      : 'No factory workers registered yet. Please add them above.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: Redirect Add Employee dynamic portal to directory */}
        {activeHRSubTab === 'employees_add' && (
          <div className="glass-panel p-6 rounded-3xl bg-white/80 border border-slate-100 space-y-4">
            <h3 className="text-base font-black text-[#0072BC]">{lang === 'ar' ? 'إضافة وتعيين الموظفين الجدد' : 'New Personnel Strategic Sourcing'}</h3>
            <p className="text-xs text-slate-500 leading-normal">
              {lang === 'ar' ? 'يرجى الانتقال لصفحة "التوظيف والاستقطاب" واستعمال خاصية "التوظيف بنقرة واحدة - One Click Hire" لنقل المتقدمين أو مرشحي التشكيل وتوليد أرقامهم الوظيفية تلقائياً دون كتابة!' : 'For maximum efficiency, please use the automated "One-Click Hire & Export" wizard inside the Sourcing Queue tab.'}
            </p>
            <div className="flex gap-2 text-xs">
              <button 
                onClick={() => setActiveHRSubTab('rec_pipeline')}
                className="px-4 py-2 bg-[#0072BC] text-white rounded-xl font-bold font-mono"
              >
                🎯 {lang === 'ar' ? 'الذهاب لطلبات ومقابلات التوظيف' : 'Open Sourcing Queue'}
              </button>
              <button 
                onClick={() => setActiveHRSubTab('employees_all')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold font-mono"
              >
                👤 {lang === 'ar' ? 'الذهاب لدليل الملفات الشامل' : 'Open Directory'}
              </button>
            </div>
          </div>
        )}

        {/* VIEW 4: Org Structure divisions list */}
        {activeHRSubTab === 'org_divisions' && (
          <HrOrgStructureTab 
            lang={lang} 
            employees={localEmployees} 
          />
        )}

        {/* VIEW 5: Job titles dynamic list and scales */}
        {activeHRSubTab === 'job_titles_ladder' && (
          <HrJobManagementTab 
            lang={lang} 
          />
        )}

        {/* VIEW 6: Recruitment & Pipeline Sourcing */}
        {activeHRSubTab === 'rec_pipeline' && (
          <HrRecruitmentTab 
            lang={lang} 
            onAddEmployeeLocally={handleAddEmployeeLocally}
          />
        )}

        {/* VIEW 7: Active Contracts list */}
        {activeHRSubTab === 'contracts_active' && (
          <HrContractsTab 
            lang={lang} 
            employees={localEmployees} 
          />
        )}

        {/* VIEW 8: Time and Attendance Daily Logs */}
        {activeHRSubTab === 'att_logs' && (
          <HrAttendanceTab 
            lang={lang} 
            employees={localEmployees} 
          />
        )}

        {/* VIEW 9: Leaves Tracker */}
        {activeHRSubTab === 'leaves_tracker' && (
          <HrLeavesTab 
            lang={lang} 
            employees={localEmployees} 
            user={user}
            onUpdateEmployeeFields={handleUpdateEmployeeFields}
          />
        )}

        {/* VIEW 10: Payroll registers (WPS compliant) */}
        {activeHRSubTab === 'payroll_registers' && (() => {
          // Calculates aggregate totals
          const totalBasics = localEmployees.reduce((sum, e) => sum + (Number(e.basicSalary) || 0), 0);
          const totalAllowances = localEmployees.reduce((sum, e) => {
            const h = e.allowances?.housing || Math.round((Number(e.basicSalary) || 0) * 0.25);
            const t = e.allowances?.transport || 500;
            return sum + h + t;
          }, 0);
          const grandTotalSalaries = totalBasics + totalAllowances;
          const employeeCount = localEmployees.length;

          // Filtered list for payslip search
          const filteredPayroll = localEmployees.filter(emp => {
            const query = payrollSearchQuery.toLowerCase();
            return (
              (emp.arabicName || '').toLowerCase().includes(query) ||
              (emp.englishName || '').toLowerCase().includes(query) ||
              (emp.jobTitle || '').toLowerCase().includes(query) ||
              emp.iqamaId.includes(query)
            );
          });

          const handlePrintReceipt = (emp: Employee) => {
            const h = emp.allowances?.housing || Math.round(emp.basicSalary * 0.25);
            const t = emp.allowances?.transport || 500;
            const extra = payAdditionState[emp.id] || 0;
            const b = payBonusState[emp.id] || 0;
            const ded = payDeductionState[emp.id] || 0;
            const loan = emp.allowances?.loans || 0;
            const net = Math.round(emp.basicSalary + h + t + extra + b - ded - loan);

            const printContent = `
              <div style="text-align: center; margin-bottom: 25px;">
                <h1 style="color: #0072BC; margin: 0; font-size: 24px;">شركة فنون الوليد للصناعة</h1>
                <p style="color: #555; margin: 5px 0 0 0; font-size: 12px; font-weight: bold;">Al Waleed Brands Co. ERP Payroll Document</p>
                <div style="height: 3px; bg-color: #0072BC; background: #0072BC; margin-top: 15px;"></div>
              </div>
              
              <h3 style="text-align: center; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-bottom: 20px;">كشف الراتب الشهري وتقرير الاستحقاقات (يونيو 2026)</h3>
              
              <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; line-height: 2;">
                <div>
                  <strong>اسم الموظف:</strong> ${emp.arabicName}<br/>
                  <strong>المسمى الوظيفي:</strong> ${emp.jobTitle}<br/>
                  <strong>القسم:</strong> ${emp.department || 'الإنتاج والعمليات'}
                </div>
                <div style="text-align: left;">
                  <strong>رقم الهوية/الإقامة:</strong> ${emp.iqamaId}<br/>
                  <strong>رقم الموظف:</strong> ${emp.id}<br/>
                  <strong>الحالة:</strong> معتمد للصرف بنظام WPS
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th style="background: #f1f5f9; padding: 10px; border: 1px solid #cbd5e1; text-align: right;">البند المالي (المستحقات)</th>
                    <th style="background: #f1f5f9; padding: 10px; border: 1px solid #cbd5e1; text-align: left;">المبلغ (SAR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">الراتب الأساسي</td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold;">SAR ${(emp.basicSalary || 0).toLocaleString('en-US')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">بدل السكن (25%)</td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace;">SAR ${(h || 0).toLocaleString('en-US')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">بدل الانتقال والترحيل</td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace;">SAR ${(t || 0).toLocaleString('en-US')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">العمل الإضافي والساعات المعتمدة</td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; color: #16a34a;">+SAR ${(extra || 0).toLocaleString('en-US')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">المكافآت التشجيعية والإنتاجية</td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; color: #16a34a;">+SAR ${(b || 0).toLocaleString('en-US')}</td>
                  </tr>
                  <tr style="background: #fff1f2;">
                    <td style="padding: 10px; border: 1px solid #fecdd3; color: #be123c;">الخصومات والجزاءات الإدارية</td>
                    <td style="padding: 10px; border: 1px solid #fecdd3; font-family: monospace; color: #be123c;">-SAR ${(ded || 0).toLocaleString('en-US')}</td>
                  </tr>
                  <tr style="background: #fff1f2;">
                    <td style="padding: 10px; border: 1px solid #fecdd3; color: #be123c;">أقساط السلف والتسويات المستقطعة</td>
                    <td style="padding: 10px; border: 1px solid #fecdd3; font-family: monospace; color: #be123c;">-SAR ${(loan || 0).toLocaleString('en-US')}</td>
                  </tr>
                </tbody>
              </table>

              <div style="border: 2px dashed #0072BC; font-size: 18px; font-weight: bold; padding: 15px; text-align: center; margin-top: 25px; background: #f0f9ff; text-align: right; display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #0072BC;">صافي الراتب المستحق والصرف البنكي:</span>
                <span style="font-family: monospace; font-size: 22px; color: #0072BC;">SAR ${(net || 0).toLocaleString('en-US')}</span>
              </div>

              <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b;">
                <div>توقيع قسم الموارد البشرية والمالية: __________________</div>
                <div>ختم شركة فنون الوليد الرسمي للعلامات التجارية [الاعتماد البنكي المرن]</div>
              </div>
            `;

            const printWin = window.open('', '_blank');
            if (printWin) {
              printWin.document.write(`
                <!DOCTYPE html>
                <html lang="ar" dir="rtl">
                  <head>
                    <title>كشف مسير راتب أفراد - ${emp.arabicName}</title>
                    <style>
                      ${sharedPrintStyles}
                      body { padding: 0; font-family: 'GE SS Two', 'Gotham Pro', Tahoma, Arial, sans-serif; direction: rtl; text-align: right; background: #fff; }
                      .payslip-box { padding: 0 10px; }
                      table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                      th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: right; font-size: 13px; }
                      th { background-color: #f8fafc; font-weight: bold; }
                    </style>
                  </head>
                  <body>
                    <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; min-height: 90vh;">
                      ${sharedPrintHeader}
                      <div class="payslip-box" style="flex-grow: 1;">
                        <h2 style="color: #0072BC; font-size: 20px; text-align: center; margin-bottom: 5px;">كشف راتب الشهر المعتمد</h2>
                        ${printContent}
                      </div>
                      ${sharedPrintFooter}
                    </div>
                    <script>
                      window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 700);
                      };
                    </script>
                  </body>
                </html>
              `);
              printWin.document.close();
            }
          };

          const handleSendPayslipDirect = async (emp: Employee) => {
            setIsSendingPayslip(emp.id);
            try {
              const h = emp.allowances?.housing || Math.round(emp.basicSalary * 0.25);
              const t = emp.allowances?.transport || 500;
              const extra = payAdditionState[emp.id] || 0;
              const b = payBonusState[emp.id] || 0;
              const ded = payDeductionState[emp.id] || 0;
              const loan = emp.allowances?.loans || 0;
              const net = Math.round(emp.basicSalary + h + t + extra + b - ded - loan);

              const response = await fetch('/api/inquiries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  empId: emp.id,
                  name: emp.arabicName,
                  category_ar: 'كشف الراتب الشهري المعتمد 💵',
                  category_en: 'Official Certified E-Payslip 💵',
                  details: `عزيزي الموظف الموقر، تم إصدار كشف مسير راتب وورد ستاير WPS الخاص بك لشهر يونيو 2026 بنجاح.\n\nالراتب الأساسي: SAR ${(emp.basicSalary || 0).toLocaleString('en-US')}\nبدل السكن: SAR ${(h || 0).toLocaleString('en-US')}\nبدل النقل: SAR ${(t || 0).toLocaleString('en-US')}\nإضافي ومكافآت الساعات: SAR ${((extra || 0) + (b || 0)).toLocaleString('en-US')}\nمستقطع السلف والخصومات: SAR ${((ded || 0) + (loan || 0)).toLocaleString('en-US')}\nصافي الراتب المستحق صرفه بنكياً: SAR ${(net || 0).toLocaleString('en-US')}\n\nالحالة: معتمد ومنفّذ ✓`,
                  status: 'RESOLVED',
                  hrNotes: `أهلاً بك، تم إرسال كشف الراتب الرسمي وإيداعه بمسير ووردستار البنكي لشهر يونيو 2026 بنجاح. رمز تفويض النقد البنكي الوطني: BK-WPS-2026-AR`
                })
              });

              if (response.ok) {
                alert(`✓ تم إرسال مسير الراتب بنجاح إلى الموظف '${emp.arabicName}' وسيظهر فوراً في استعلامات خدمته الذاتية!`);
              } else {
                alert(lang === 'ar' ? 'عذراً، فشل رفع الرسالة وخوادم الاستعلام.' : 'Sorry, failed to upload message to servers.');
              }
            } catch (err) {
              console.error('Failed to post pay slip e-record:', err);
            } finally {
              setIsSendingPayslip(null);
            }
          };

          return (
            <div className="space-y-6" dir="rtl">
              
              {/* 1. WPS Financial Indicators Panel */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-indigo-50 to-white p-4 rounded-2xl border border-indigo-100 text-right space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">مجموع الرواتب الأساسية</span>
                  <p className="text-xl font-mono font-black text-indigo-950">SAR {(totalBasics || 0).toLocaleString('en-US')}</p>
                  <span className="text-[9px] text-slate-400 block">لكافة موظفي الشركة المسجلين</span>
                </div>

                <div className="bg-gradient-to-br from-sky-50 to-white p-4 rounded-2xl border border-sky-100 text-right space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">مجموع البدلات (سكن ونقل)</span>
                  <p className="text-xl font-mono font-black text-slate-900">SAR {(totalAllowances || 0).toLocaleString('en-US')}</p>
                  <span className="text-[9px] text-slate-400 block">السكن 25% والتنقل المتغير للجميع</span>
                </div>

                <div className="bg-gradient-to-br from-[#0072BC]/5 to-white p-4 rounded-2xl border border-[#0072BC]/20 text-right space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">إجمالي الرواتب شاملة البدلات</span>
                  <p className="text-xl font-mono font-black text-[#0072BC]">SAR {(grandTotalSalaries || 0).toLocaleString('en-US')}</p>
                  <span className="text-[9px] text-[#0072BC] font-semibold block">مغطي بمسير WPS البنكي 💸</span>
                </div>

                <div className="bg-gradient-to-br from-slate-50 to-white p-4 rounded-2xl border border-slate-100 text-right space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">الموظفين داخل المسير</span>
                  <p className="text-xl font-mono font-black text-slate-800">{employeeCount} موظفاً</p>
                  <span className="text-[9px] text-slate-400 block">على رأس العمل ومثبت بالملفات</span>
                </div>
              </div>

              {/* 2. Detailed Employee Payslip Finder & Search Bar */}
              <div className="glass-panel p-5 rounded-3xl bg-white border border-slate-100 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-black text-[#0072BC]">🔍 محرك بحث كشوفات ومسيرات الموظفين الفردية</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">البحث الفوري بالاسم، والوظيفة، ورقم الهوية لعرض وطباعة وإرسال المستندات الجاهزة</p>
                  </div>
                  <div className="relative max-w-xs w-full">
                    <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="ابحث بالاسم، الهوية، أو الوظيفة..." 
                      value={payrollSearchQuery}
                      onChange={(e) => setPayrollSearchQuery(e.target.value)}
                      className="w-full text-xs p-2.5 pr-9 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]/30 bg-slate-50 font-bold"
                    />
                  </div>
                </div>

                {payrollSearchQuery && (
                  <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-[#0072BC]/5 text-[#0072BC] font-bold text-[10px] border-b border-slate-150">
                          <th className="p-2">الاسم</th>
                          <th className="p-2">رقم الهوية/الإقامة</th>
                          <th className="p-2">المسمى الوظيفي</th>
                          <th className="p-2 text-center">أفعال الاستعراض المالي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPayroll.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-slate-400 italic">لا توجد نتائج مطابقة لبحثك.</td>
                          </tr>
                        ) : (
                          filteredPayroll.map(emp => (
                            <tr key={emp.id} className="border-b border-slate-100 bg-white hover:bg-[#0072BC]/5">
                              <td className="p-2 font-extrabold text-slate-800">{emp.arabicName}</td>
                              <td className="p-2 font-mono text-slate-500">{emp.iqamaId}</td>
                              <td className="p-2 text-slate-600 font-bold">{emp.jobTitle}</td>
                              <td className="p-2 text-center">
                                <button 
                                  onClick={() => setSelectedPayslipEmp(emp)}
                                  className="px-3.5 py-1.5 bg-[#0072BC] text-white text-[10px] font-black rounded-lg hover:bg-sky-600 transition"
                                >
                                  📄 عرض كشف مسير الراتب
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 3. Global Interactive Payroll Spreadsheet */}
              <div className="glass-panel p-6 rounded-3xl bg-white border border-slate-100 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-black text-[#0072BC] block">🇸🇦 مسير WPS والرواتب الكلية المعتمد للشهر الجاري</h4>
                  <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-200 text-[10px] rounded-lg font-black font-mono">WPS COMPLIANT ✓</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-[11px] border-collapse min-w-[950px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-mono text-slate-400">
                        <th className="p-2 text-right">الاسم الموظف</th>
                        <th className="p-2 text-right">المسمى والدرجة</th>
                        <th className="p-2 text-right">الأساسي (SAR)</th>
                        <th className="p-2 text-right">سكن (25%)</th>
                        <th className="p-2 text-right">نقل (SAR)</th>
                        <th className="p-2 text-right" style={{ width: '80px' }}>إضافي</th>
                        <th className="p-2 text-right" style={{ width: '80px' }}>مكافأة</th>
                        <th className="p-2 text-right" style={{ width: '80px' }}>خصومات</th>
                        <th className="p-2 text-right">سلف (ERP)</th>
                        <th className="p-2 text-right text-[#0072BC]">صافي المستحق</th>
                        <th className="p-2 text-center">التوثيق والإرسال</th>
                      </tr>
                    </thead>
                    <tbody>
                      {localEmployees.map(emp => {
                        const h = emp.allowances?.housing || Math.round(emp.basicSalary * 0.25);
                        const t = emp.allowances?.transport || 500;
                        const extra = payAdditionState[emp.id] || 0;
                        const b = payBonusState[emp.id] || 0;
                        const ded = payDeductionState[emp.id] || 0;
                        const loans = emp.allowances?.loans || 0;
                        
                        const netVal = Math.round(emp.basicSalary + h + t + extra + b - ded - loans);

                        return (
                          <tr key={emp.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition">
                            <td className="p-2">
                              <p className="font-black text-slate-900">{emp.arabicName}</p>
                              <span className="text-[9px] text-slate-400 font-mono">ID: {emp.id}</span>
                            </td>
                            <td className="p-2">
                              <p className="font-bold text-slate-600">{emp.jobTitle}</p>
                              <span className="text-[9px] bg-slate-100 p-0.5 rounded px-1 text-slate-500 font-mono">{emp.grade}</span>
                            </td>
                            <td className="p-2 font-mono font-bold text-slate-800">{(emp.basicSalary || 0).toLocaleString('en-US')}</td>
                            <td className="p-2 font-mono text-slate-500">{(h || 0).toLocaleString('en-US')}</td>
                            <td className="p-2 font-mono text-slate-500">{(t || 0).toLocaleString('en-US')}</td>
                            
                            {/* Editable Additions */}
                            <td className="p-2">
                              <input 
                                type="number" 
                                placeholder="0" 
                                value={payAdditionState[emp.id] || ''}
                                onChange={(e) => setPayAdditionState(prev => ({ ...prev, [emp.id]: Number(e.target.value) }))}
                                className="w-16 p-1 border rounded text-xs text-center font-mono focus:ring-1 focus:ring-[#0072BC]"
                              />
                            </td>

                            {/* Editable Bonuses */}
                            <td className="p-2">
                              <input 
                                type="number" 
                                placeholder="0" 
                                value={payBonusState[emp.id] || ''}
                                onChange={(e) => setPayBonusState(prev => ({ ...prev, [emp.id]: Number(e.target.value) }))}
                                className="w-16 p-1 border rounded text-xs text-center font-mono focus:ring-1 focus:ring-emerald-500"
                              />
                            </td>

                            {/* Editable Deductions */}
                            <td className="p-2">
                              <input 
                                type="number" 
                                placeholder="0" 
                                value={payDeductionState[emp.id] || ''}
                                onChange={(e) => setPayDeductionState(prev => ({ ...prev, [emp.id]: Number(e.target.value) }))}
                                className="w-16 p-1 border rounded text-xs text-center text-rose-600 font-mono focus:ring-1 focus:ring-rose-500"
                              />
                            </td>

                            {/* ERP Loans integration */}
                            <td className="p-2 font-mono text-rose-500 font-bold">
                              {loans ? `-${(loans || 0).toLocaleString('en-US')}` : '0'}
                            </td>

                            {/* NET SALARY RESULT */}
                            <td className="p-2 font-mono font-black text-[#0072BC] text-xs">
                              {(netVal || 0).toLocaleString('en-US')}
                            </td>

                            {/* Controls */}
                            <td className="p-2 flex gap-1 justify-center">
                              <button 
                                onClick={() => setSelectedPayslipEmp(emp)}
                                title="استعراض الكشف الرسمي للطباعة والتوقيع"
                                className="p-1 px-2 bg-slate-100 text-slate-700 hover:bg-[#0072BC] hover:text-white rounded font-bold text-[10px] transition"
                              >
                                📄 كشف الراتب
                              </button>
                              <button 
                                onClick={() => handleSendPayslipDirect(emp)}
                                disabled={isSendingPayslip === emp.id}
                                className={`p-1 px-2 text-white font-bold text-[10px] rounded transition ${isSendingPayslip === emp.id ? 'bg-slate-300' : 'bg-[#0072BC] hover:bg-emerald-600'}`}
                              >
                                {isSendingPayslip === emp.id ? 'جاري الإرسال..' : 'إرسال للموظف 📲'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dynamic Payslip Popup Dialog Modal Backdrop */}
              {selectedPayslipEmp && (() => {
                const emp = selectedPayslipEmp;
                const h = emp.allowances?.housing || Math.round(emp.basicSalary * 0.25);
                const t = emp.allowances?.transport || 500;
                const extra = payAdditionState[emp.id] || 0;
                const b = payBonusState[emp.id] || 0;
                const ded = payDeductionState[emp.id] || 0;
                const loan = emp.allowances?.loans || 0;
                const net = Math.round(emp.basicSalary + h + t + extra + b - ded - loan);

                return (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 max-w-xl w-full flex flex-col justify-between gap-4 text-right shadow-2xl" dir="rtl">
                      <div className="flex justify-between items-center border-b pb-3">
                        <div>
                          <h3 className="font-extrabold text-[#0072BC] text-base">📄 مستند كشف الراتب وشؤون التصفية ومسيرات WPS</h3>
                          <p className="text-[10px] text-slate-400">مراجعة رسمية معتمدة قابلة للتصدير والطباعة والرفع على منصة قوى والبنك</p>
                        </div>
                        <button onClick={() => setSelectedPayslipEmp(null)} className="p-1 text-slate-400 hover:text-slate-800 font-bold">✕</button>
                      </div>

                      {/* Official Print Layout Preview box */}
                      <div id="print-payslip-canvas" className="p-5 border border-slate-200 rounded-2xl bg-slate-50 space-y-4 max-h-[50vh] overflow-y-auto">
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                          <h4 style={{ color: '#0072BC', margin: 0, fontSize: '18px', fontWeight: 'bold' }}>شركة فنون الوليد للصناعة</h4>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>AL WALEED BRANDS CO. WPS SYSTEM</span>
                        </div>

                        <div className="grid grid-cols-2 gap-y-1.5 text-[11px] leading-relaxed border-b pb-3 border-slate-200">
                          <p><strong>اسم الموظف:</strong> <span className="text-slate-800 font-bold">{emp.arabicName}</span></p>
                          <p><strong>الهوية الوطنية/الإقامة:</strong> <span className="text-slate-800 font-mono">{emp.iqamaId}</span></p>
                          <p><strong>المسمى الوظيفي:</strong> <span className="text-slate-600 font-bold">{emp.jobTitle}</span></p>
                          <p><strong>كود ملف الموظف:</strong> <span className="text-slate-600 font-mono">{emp.id}</span></p>
                          <p><strong>حالة المسير:</strong> <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold">معتمد WPS بنجاح</span></p>
                        </div>

                        <table className="w-full text-right text-[11px] border border-slate-200">
                          <thead>
                            <tr className="bg-slate-150 border-b">
                              <th className="p-2 text-right text-[10px] text-slate-500 bg-slate-100/80">البند المالي المصدّق</th>
                              <th className="p-2 text-left text-[10px] text-slate-500 bg-slate-100/80">المستحق (SAR)</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            <tr className="border-b">
                              <td className="p-2">الرتب الأساسي المفصل</td>
                              <td className="p-2 text-left font-mono font-bold">SAR {(emp.basicSalary || 0).toLocaleString('en-US')}</td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2">بدل السكن القانوني (25% من الأساسي)</td>
                              <td className="p-2 text-left font-mono text-slate-500">SAR {(h || 0).toLocaleString('en-US')}</td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2">بدل النقل وتغطية السفر والموقع</td>
                              <td className="p-2 text-left font-mono text-slate-500">SAR {(t || 0).toLocaleString('en-US')}</td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2 text-emerald-600">القيمة والإنتاجية الإضافية للشهر</td>
                              <td className="p-2 text-left font-mono text-emerald-600 font-bold">+SAR {(extra || 0).toLocaleString('en-US')}</td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2 text-emerald-600">المكافآت والبدلات الميدانية الخاصة</td>
                              <td className="p-2 text-left font-mono text-emerald-600 font-bold">+SAR {(b || 0).toLocaleString('en-US')}</td>
                            </tr>
                            <tr className="border-b text-rose-600 bg-rose-50/30">
                              <td className="p-2">الخصومات والجزاءات المستقطعة</td>
                              <td className="p-2 text-left font-mono">-SAR {(ded || 0).toLocaleString('en-US')}</td>
                            </tr>
                            <tr className="border-b text-rose-600 bg-rose-50/50">
                              <td className="p-2">مستنزلات أقساط السلف (ERP)</td>
                              <td className="p-2 text-left font-mono font-black">-SAR {(loan || 0).toLocaleString('en-US')}</td>
                            </tr>
                          </tbody>
                        </table>

                        <div className="p-3 bg-[#0072BC]/10 border border-all border-[#0072BC]/20 rounded-xl flex justify-between items-center font-bold text-xs">
                          <span className="text-[#0072BC]">إجمالي صافي الراتب المستلم للبنك:</span>
                          <span className="text-[#0072BC] font-mono text-sm">SAR {(net || 0).toLocaleString('en-US')}</span>
                        </div>
                      </div>

                      {/* Controls inside dialog popup */}
                      <div className="flex gap-2 text-xs pt-3 border-t font-black">
                        <button 
                          onClick={() => handlePrintReceipt(emp)}
                          className="flex-1 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition"
                        >
                          🖨️ طباعة المستند الآن
                        </button>
                        
                        <button 
                          onClick={() => {
                            // Senders PDF generator triggering native browser print view
                            handlePrintReceipt(emp);
                          }}
                          className="flex-1 py-2.5 bg-sky-600 text-white rounded-xl hover:bg-sky-500 transition"
                        >
                          📥 تصدير كـ PDF الكتروني
                        </button>

                        <button 
                          onClick={() => handleSendPayslipDirect(emp)}
                          disabled={isSendingPayslip === emp.id}
                          className={`flex-1 py-2.5 text-white rounded-xl transition ${isSendingPayslip === emp.id ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                        >
                          {isSendingPayslip === emp.id ? 'جاري الإرسال..' : '📲 إرسال لصفحة الموظف'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()}

        {/* VIEW 11: Loans and Advances detailed calculator */}
        {activeHRSubTab === 'loans_calculator' && (
          <div className="glass-panel p-6 rounded-3xl bg-white/80 border border-slate-100 space-y-6">
            <h3 className="text-base font-black text-[#0072BC]">{lang === 'ar' ? 'طلبات السلف وجدولة الأقساط الشهرية' : 'Personal Loans & Monthly Cash Installment Scheduler'}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="space-y-4 text-xs">
                <p className="font-extrabold text-slate-700">{lang === 'ar' ? 'محاكي السلفة والأقساط' : 'Loan Amortization Tool'}</p>
                <div>
                  <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'قيمة السلفة المطلوب سحبها' : 'Loan Capital Requested (SAR)'}</label>
                  <input type="number" lang="en" value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))} className="w-full p-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'فترة السداد بالأشهر' : 'Tenure (Months)'}</label>
                  <input type="number" lang="en" value={loanMonths} onChange={(e) => setLoanMonths(Number(e.target.value))} className="w-full p-2 border rounded-xl" />
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-150 rounded-2xl flex flex-col justify-between text-xs text-slate-700">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">{lang === 'ar' ? 'المستحق المالي المقتطع كل مسير رواتب' : 'Deduction Per Monthly Paycheck'}</span>
                  <p className="text-3xl font-black text-[#0072BC] font-mono mt-1">SAR {(loanAmount / (loanMonths || 1)).toFixed(2)}</p>
                </div>
                <div className="space-y-1 text-[11px] text-slate-500 pt-3 border-t border-slate-100 mt-2">
                  <p>🔹 {lang === 'ar' ? 'إجمالي السلفة: ' : 'Total Cash Out: '} <strong className="font-mono">SAR {loanAmount}</strong></p>
                  <p>🔹 {lang === 'ar' ? 'الأقساط المتبقية: ' : 'Total payments: '} <strong className="font-mono">{loanMonths} installments</strong></p>
                  <p className="text-[10px] text-cyan-600 font-bold">✓ {lang === 'ar' ? 'متوافق مع الهيئة العليا للعمل والعمال' : '0% Interest, Compliant with Labor Regulations'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 12: Custody Handover Directory */}
        {activeHRSubTab === 'custody_ledger' && (
          <div className="glass-panel p-6 rounded-3xl bg-white/80 border border-slate-100 space-y-4">
            <h3 className="text-base font-black text-[#0072BC]">{lang === 'ar' ? 'سجل العهد وتسليم اللوازم والأصول للعمال' : 'Workers Custody allocation, handovers & return notes'}</h3>
            
            {/* Bulk Custody Operations Card */}
            <div className="bg-slate-50/85 p-5 rounded-2xl border border-slate-150 space-y-3 dark:border-slate-700/40">
              <div className="flex items-center gap-2 border-b border-slate-200/50 pb-2">
                <span className="text-sm">📦</span>
                <h4 className="font-extrabold text-[#0072BC] text-xs">
                  {lang === 'ar' ? 'التحكم الجماعي بالعهدة (لجميع الموظفين)' : 'Bulk Custody Handover Management (All Staff)'}
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end text-xs text-right" dir="rtl">
                <div>
                  <label className="block text-slate-500 font-bold mb-1 col-span-1">
                    {lang === 'ar' ? 'تصنيف العهدة المستهدفة' : 'Target Custody Category'}
                  </label>
                  <select
                    value={bulkField}
                    onChange={(e) => setBulkField(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-250 rounded-xl font-bold focus:outline-none focus:border-[#0072BC]"
                  >
                    <option value="laptop">{lang === 'ar' ? 'أجهزة وكمبيوتر (Laptop)' : 'Laptop / IT'}</option>
                    <option value="vehicles">{lang === 'ar' ? 'سيارات الشركة (Vehicles)' : 'Vehicles / Cars'}</option>
                    <option value="tools">{lang === 'ar' ? 'معدات فنية وورشتية (Tools)' : 'Tools / Workshop'}</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-slate-500 font-bold mb-1">
                    {lang === 'ar' ? 'تفاصيل / اسم العهدة الجديد' : 'New Custody Details / Serial'}
                  </label>
                  <input
                    type="text"
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: لابتوب Lenovo / مفك آلي...' : 'e.g., Lenovo L380 / Tools kit'}
                    className="w-full text-xs p-2.5 bg-white border border-slate-250 rounded-xl font-bold font-sans"
                  />
                </div>

                <div className="flex gap-2 md:col-span-2">
                  <button
                    type="button"
                    onClick={handleBulkAssignCustody}
                    className="flex-1 py-2.5 px-4 bg-[#0072BC] hover:bg-[#0072BC]/95 text-white font-black text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>➕ {lang === 'ar' ? 'إضافة عهدة للجميع' : 'Assign to All Staff'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkDeleteCustody}
                    className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-750 text-white font-black text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'حذف العهدة' : 'Delete Custody'}</span>
                  </button>
                </div>
              </div>
            </div>

            <table className="w-full text-xs text-slate-700">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase">
                  <th className="p-2 text-right">{lang === 'ar' ? 'الموظف' : 'Staff'}</th>
                  <th className="p-2 text-right">{lang === 'ar' ? 'أجهزة وكمبيوتر (Laptop)' : 'IT Gear'}</th>
                  <th className="p-2 text-right">{lang === 'ar' ? 'سيارات الشركة' : 'Vehicle'}</th>
                  <th className="p-2 text-right">{lang === 'ar' ? 'معدات فنية ويدوية' : 'Work tools'}</th>
                </tr>
              </thead>
              <tbody>
                {localEmployees.map(emp => (
                  <tr key={emp.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-2 font-bold">{lang === 'ar' ? emp.arabicName : emp.englishName}</td>
                    <td className="p-2 font-mono">
                      {emp.custody?.laptop ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#0072BC] font-semibold">{emp.custody.laptop}</span>
                          <button 
                            onClick={() => handleClearCustodyField(emp.id, 'laptop')}
                            className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg transition-all"
                            title={lang === 'ar' ? 'حذف العهدة' : 'Delete Laptop'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-350">✕</span>
                      )}
                    </td>
                    <td className="p-2 font-mono">
                      {emp.custody?.vehicles ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#00AEEF] font-semibold">{emp.custody.vehicles}</span>
                          <button 
                            onClick={() => handleClearCustodyField(emp.id, 'vehicles')}
                            className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg transition-all"
                            title={lang === 'ar' ? 'حذف العهدة' : 'Delete Vehicle'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-350">✕</span>
                      )}
                    </td>
                    <td className="p-2 font-mono">
                      {emp.custody?.tools ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-indigo-600 font-semibold">{emp.custody.tools}</span>
                          <button 
                            onClick={() => handleClearCustodyField(emp.id, 'tools')}
                            className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg transition-all"
                            title={lang === 'ar' ? 'حذف العهدة' : 'Delete Tools'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-350">✕</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 13: KPIs and performance appraisal */}
        {activeHRSubTab === 'perf_reviews' && (
          <div className="glass-panel p-6 rounded-3xl bg-white/80 border border-slate-100 space-y-4">
            <h3 className="text-base font-black text-[#0072BC]">{lang === 'ar' ? 'خطط التقييم السنوية ومؤشرات الأداء KPI' : 'Annual appraisals plan, KPIs metrics & Goals scorecard'}</h3>
            <div className="space-y-3">
              {[
                { name: 'Riyadh Fabrication Unit', target: 'Efficiency & Speed of bending tubes', current: 'A Grade' },
                { name: 'Installation Fleet team', target: 'Zero damage, Safe crane and hoist delivery', current: 'A- Grade' },
                { name: 'Sales Coordination Desk', target: 'RFQ Response speed within 2 hours', current: 'B+ Grade' }
              ].map((kpi, index) => (
                <div key={index} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-extrabold text-slate-800">{kpi.name}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">{lang === 'ar' ? 'الهدف المجدول: ' : 'Primary KPI Goal: '} {kpi.target}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-lg">{kpi.current}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 14: Career pathing and promotions */}
        {activeHRSubTab === 'promo_records' && (
          <div className="glass-panel p-6 rounded-3xl bg-white/80 border border-slate-100 space-y-4">
            <h3 className="text-base font-black text-[#0072BC]">{lang === 'ar' ? 'سجل ترقية المسميات والزيادات المالية' : 'Promotions, spot bonuses & career upgrades log'}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {lang === 'ar' ? 'يتم هنا تسجيل المباشرات والترقيات من رتبة فني إلى فني أول أو زيادة الراتب الأساسي مع التحديث الفوري في العقود والتأمينات.' : 'View logs of internal corporate rank upgrades, compensation increments, and certifications.'}
            </p>
            <button onClick={() => alert('Feature simulation - New Promotion letter logged')} className="px-4 py-2 bg-[#0072BC] text-white text-xs font-black rounded-xl shadow-md">{lang === 'ar' ? 'رفع درجة وعلاوة لموظف جديد' : 'Log New Upgraded Staff'}</button>
          </div>
        )}

        {/* VIEW 15: Warning and disciplinary letter log */}
        {activeHRSubTab === 'violations_penalties' && (
          <div className="glass-panel p-6 rounded-3xl bg-white/80 border border-slate-100 space-y-4">
            <h3 className="text-base font-black text-rose-600">{lang === 'ar' ? 'تسجيل الإنذارات الرسمية والمخالفات والتحقيقات' : 'Official Written Warnings, Violations & Investigations Log'}</h3>
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs space-y-2">
              <span className="font-extrabold text-rose-800">⚠️ {lang === 'ar' ? 'سجل الجزاءات والتحقيقات العالقة' : 'Active Infractions in last 90 days'}</span>
              <p className="text-rose-700 leading-relaxed text-[11px]">
                {lang === 'ar' ? 'موظف واحد مسجل لديه إنذار كتابي أول بسبب التأخر المتكرر ومستند بتقرير البصمة لمزامنة الدوام.' : 'One active write-up recorded under technician staff for repetitive unexcused delay. Audited against fingerprint clock in.'}
              </p>
            </div>
          </div>
        )}

        {/* VIEW 16: Medical Insurance profiles */}
        {activeHRSubTab === 'med_insurance' && (
          <div className="glass-panel p-6 rounded-3xl bg-white/80 border border-slate-100 space-y-4">
            <h3 className="text-base font-black text-[#0072BC]">{lang === 'ar' ? 'التأمين الطبي والتعاقدات العائلية' : 'Bupa & Tawuniya Medical Insurance Directory'}</h3>
            <table className="w-full text-xs text-slate-700">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase">
                  <th className="p-2 text-right">{lang === 'ar' ? 'الموظف المؤمن عليه' : 'Staff'}</th>
                  <th className="p-2 text-right">{lang === 'ar' ? 'فئة التأمين' : 'Category'}</th>
                  <th className="p-2 text-right">{lang === 'ar' ? 'عدد التابعين' : 'Dependents'}</th>
                  <th className="p-2 text-right">{lang === 'ar' ? 'تاريخ التجديد' : 'Expiry/Renewal'}</th>
                </tr>
              </thead>
              <tbody>
                {localEmployees.map(emp => (
                  <tr key={emp.id} className="border-b border-slate-50">
                    <td className="p-2 font-bold">{lang === 'ar' ? emp.arabicName : emp.englishName}</td>
                    <td className="p-2 font-mono">Class B Elite</td>
                    <td className="p-2 font-mono">3 dependents</td>
                    <td className="p-2 font-mono text-slate-500">2027-01-15</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 16.5: Document Tracking Tab */}
        {activeHRSubTab === 'document_tracking' && (
          <HrDocumentTrackingTab
            lang={lang}
            employees={localEmployees}
            user={user}
            setActiveHRSubTab={setActiveHRSubTab}
          />
        )}

        {/* VIEW 17: Government compliance papers i.e Iqama & Passports */}
        {activeHRSubTab === 'gov_documents' && (
          <div className="glass-panel p-6 rounded-3xl bg-white/80 border border-slate-100 space-y-4">
            <h3 className="text-base font-black text-[#0072BC]">{lang === 'ar' ? 'التأمينات الاجتماعية وصلاحيات رخص العمل والإقامات' : 'Ministry of Labor Residency (Iqama), Passport & GOSI tracking'}</h3>
            <table className="w-full text-xs text-slate-700">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase">
                  <th className="p-2 text-right">{lang === 'ar' ? 'الموظف' : 'Staff'}</th>
                  <th className="p-2 text-right">{lang === 'ar' ? 'رقم الإقامة' : 'Iqama / ID'}</th>
                  <th className="p-2 text-right">{lang === 'ar' ? 'رخصة العمل' : 'Work Permit'}</th>
                  <th className="p-2 text-right">{lang === 'ar' ? 'التأمينات GOSI' : 'GOSI Register'}</th>
                </tr>
              </thead>
              <tbody>
                {localEmployees.map(emp => (
                  <tr key={emp.id} className="border-b border-slate-50">
                    <td className="p-2 font-bold">{lang === 'ar' ? emp.arabicName : emp.englishName}</td>
                    <td className="p-2 font-mono font-black">{emp.iqamaId}</td>
                    <td className="p-2 text-[#00AEEF] font-mono">Active (Qiwa)</td>
                    <td className="p-2 text-emerald-600">Enrolled (100%)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 18: Saudi Labor Law End of Service Calculator */}
        {activeHRSubTab === 'eos_calculator' && (
          <div className="glass-panel p-6 rounded-3xl bg-white/80 border border-slate-100 space-y-6">
            <h3 className="text-base font-black text-[#0072BC]">{lang === 'ar' ? 'مكافأة نهاية الخدمة بالخدمة الذاتية (حسب قانون العمل السعودي)' : 'Saudi Labor Law End of Service (EOS) Gratuity Calculator'}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="space-y-4 text-xs">
                <p className="font-extrabold text-slate-705">{lang === 'ar' ? 'مدخلات احتساب السفر المستحق' : 'Saudi Labor Code EOS Inputs'}</p>
                <div>
                  <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'الراتب الفعلي المسجل (أساسي + سكن)' : 'Actual Salary Base (SAR)'}</label>
                  <input type="number" lang="en" value={eosSalary} onChange={(e) => setEosSalary(Number(e.target.value))} className="w-full p-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'إجمالي سنوات الخدمة' : 'Service Tenure in Years'}</label>
                  <input type="number" lang="en" value={eosYears} onChange={(e) => setEosYears(Number(e.target.value))} className="w-full p-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'طريقة إنهاء العلاقة التعاقدية' : 'Termination Type'}</label>
                  <select value={eosReason} onChange={(e: any) => setEosReason(e.target.value)} className="w-full p-2 border rounded-xl bg-white text-slate-800">
                    <option value="terminated">{lang === 'ar' ? 'إنهاء من طرف صاحب العمل العادل' : 'Contract Terminated by Employer'}</option>
                    <option value="resigned">{lang === 'ar' ? 'تقديم استقالة بشكل اختياري' : 'Voluntary Resignation'}</option>
                  </select>
                </div>
              </div>

              <div className="p-5 bg-[#0072BC] text-white rounded-2xl flex flex-col justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase text-cyan-200 font-extrabold block">{lang === 'ar' ? 'قيمة مكافأة نهاية الخدمة الشرعية' : 'Calculated Saudi Labor EOS Award'}</span>
                  <p className="text-3xl font-black font-mono mt-1">SAR {(calculateSaudiEos() || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="space-y-1.5 text-[11px] text-cyan-100 pt-3 border-t border-cyan-800">
                  <p>⚖️ {lang === 'ar' ? 'نظام الاحتساب مأخوذ من ملخص المادة 84 لقانون العمل السعودي.' : 'Based strictly on Saudi Article 84 rule: 0.5 salary for first 5 years, 1.0 salary for subsequent years, pro-rated.'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 19: Clearances Checklists */}
        {activeHRSubTab === 'clearance_matrix' && (
          <div className="glass-panel p-6 rounded-3xl bg-white/80 border border-slate-100 space-y-4">
            <h3 className="text-base font-black text-[#0072BC]">{lang === 'ar' ? 'طلبات مسارات التصفية الفنية والأمنية' : 'Personnel exit & clearance workflows'}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {lang === 'ar' ? 'تجد أدناه الموظفين الذين تحت مسار تصفية العهد مع مراجعة عهدة السيارات وأجهزة تلافياً للالتزامات المالية.' : 'Check and resolve pending fleet, IT, and workshop tool blockages for offboarding personnel.'}
            </p>
            <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-1">
              {clearances.map(clr => {
                const isAllCleared = clr.isFullyCertifiedCleared || 
                  (!clr.checkpointBlockers.pendingVehiclesHandover && 
                   !clr.checkpointBlockers.pendingITHandover && 
                   !clr.checkpointBlockers.pendingToolkitsHandover);
                return (
                  <div key={clr.clearanceId} className="p-3 bg-white border rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-extrabold text-slate-800">{clr.clearanceId} ({clr.reasonCategory})</p>
                      <p className="text-[10px] text-slate-400">Settle Target: {clr.scheduledFinalSettleDate}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black ${isAllCleared ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {isAllCleared ? (lang === 'ar' ? 'جاهز للتسوية' : 'FULLY CLEARED') : (lang === 'ar' ? 'محتجز بالعهدة' : 'PENDING RETURNS')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 20: HR Documents templates library */}
        {activeHRSubTab === 'hr_library_letters' && (
          <div className="glass-panel p-6 rounded-3xl bg-white/80 border border-slate-100 space-y-6">
            <h3 className="text-base font-black text-[#0072BC]">{lang === 'ar' ? 'توليد وطباعة خطابات الموارد البشرية الفورية' : 'HR Letters & Corporate Certificates Printer'}</h3>
            
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'اختر الموظف المعني' : 'Select Employee Subject'}</label>
                  <select
                    value={selectedLetterEmp ? selectedLetterEmp.id : ''}
                    onChange={(e) => setSelectedLetterEmp(localEmployees.find(x => x.id === e.target.value) || null)}
                    className="w-full p-2 border rounded-xl bg-white text-slate-800"
                  >
                    {localEmployees.map(e => (
                      <option key={e.id} value={e.id}>{lang === 'ar' ? e.arabicName : e.englishName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'نوع شهادة الموارد البشرية' : 'Template Type'}</label>
                  <select
                    value={selectedLetterType}
                    onChange={(e) => setSelectedLetterType(e.target.value)}
                    className="w-full p-2 border rounded-xl bg-white text-slate-800"
                  >
                    <option value="salary_cert">{lang === 'ar' ? 'شهادة تعريف بالراتب' : 'Salary Certificate'}</option>
                    <option value="experience">{lang === 'ar' ? 'شهادة خبرة رسمية' : 'Experience Certificate'}</option>
                    <option value="joining">{lang === 'ar' ? 'خطاب مباشرة عمل' : 'Work Commencement Letter'}</option>
                    <option value="resignation">{lang === 'ar' ? 'قبول استقالة وتصفية' : 'Declining/Accepting Resignation Letter'}</option>
                  </select>
                </div>
              </div>

              {selectedLetterEmp && (
                <div className="p-8 bg-white border-2 border-dashed border-slate-200 rounded-2xl space-y-4 uppercase text-[11px] leading-relaxed font-mono">
                  <div className="text-center font-extrabold text-sm border-b pb-3 text-[#0072BC]">
                    🏢 Al-Waleed Signage & Neon Co. Ltd.
                  </div>
                  <p>Date: {new Date().toLocaleDateString()}</p>
                  <p>To Whom It May Concern,</p>
                  <p> This is to certify that <strong>{selectedLetterEmp.englishName}</strong> (Iqama ID: <strong>{selectedLetterEmp.iqamaId}</strong>) has been with Al-Waleed company as <strong>{selectedLetterEmp.jobTitle}</strong> in {selectedLetterEmp.department} department.</p>
                  {selectedLetterType === 'salary_cert' && (
                    <p> The employee earns a base pay of <strong>SAR {selectedLetterEmp.basicSalary}</strong> plus housing allowance. This certificate is issued on request.</p>
                  )}
                  <p className="text-right border-t pt-4">Human Resources Department Director / مدير الموارد البشرية</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 21: ESS Employee personal dashboard */}
        {activeHRSubTab === 'ess_dashboard' && (
          <HrSelfServiceTab 
            lang={lang} 
            user={user} 
            employees={localEmployees} 
          />
        )}

        {/* VIEW: Payroll Section */}
        {(activeHRSubTab === 'payroll_main') && (
          <HrPayrollTab 
            lang={lang}
            employees={localEmployees}
            onUpdateEmployeeFields={handleUpdateEmployeeFields}
            onReloadEmployees={onReloadEmployees}
            activeHRSubTab={activeHRSubTab}
          />
        )}

        {/* VIEW 22: Manager approvals hub */}
        {activeHRSubTab === 'approvals_hub' && (
          <div className="glass-panel p-6 rounded-3xl bg-white/80 border border-slate-100 space-y-4">
            <h3 className="text-base font-black text-[#0072BC]">{lang === 'ar' ? 'مركز الموافقات الفورية الموحد للمدير العام' : 'Unified Executive Approvals Hub'}</h3>
            <p className="text-xs text-slate-500">
              {lang === 'ar' ? 'اعتماد طلبات الإجازات، السلف، تجديدات العقود للمؤسسة في لوحة مصادقة واحدة.' : 'Approve pending contracts, employee cash advance loan requests, and travel leaves.'}
            </p>
            <div className="p-4 bg-slate-150 rounded-xl bg-slate-50 space-y-2 text-xs">
              <div className="p-3 bg-white border rounded-xl flex justify-between items-center">
                <span>🇸🇦 {lang === 'ar' ? 'فرع الرياض: طلب سداد سلفة SAR 15,000' : 'Riyadh Branch: SAR 15,000 Advance Loan Request'}</span>
                <button onClick={() => alert('Approved loan')} className="px-3 py-1 bg-emerald-500 text-white rounded text-[10px] font-bold">{lang === 'ar' ? 'موافق' : 'Approve'}</button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 23: Strategic and executive reports */}
        {activeHRSubTab === 'strategic_reports' && (
          <div className="glass-panel p-6 rounded-3xl bg-white/80 border border-slate-100 space-y-4">
            <h3 className="text-base font-black text-[#0072BC]">{lang === 'ar' ? 'التقارير والمؤشرات الإستراتيجية للأرباح' : 'Executive HR Analytics & WPS Auditing Reports'}</h3>
            <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs">
              <p>📊 {lang === 'ar' ? 'معدل التوطين الكلي للمنشأة: ' : 'Overall Nitaqat Saudization Grade: '} <strong className="text-emerald-600 font-extrabold">PLATINUM / بلاتيني</strong></p>
              <p>📊 {lang === 'ar' ? 'متوسط الرواتب الأساسية المسجلة: ' : 'Average Employee Salary Base: '} <strong>SAR 7,200</strong></p>
              <p>📊 {lang === 'ar' ? 'نسبة تسوية العهد المنتهية: ' : 'Asset Return Settlement Rate: '} <strong className="text-[#00AEEF]">100% compliant</strong></p>
            </div>
          </div>
        )}

      </section>

    </div>
  );
}
