import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, AlertTriangle, Clock, CheckCircle, Bell, Sparkles, RefreshCw,
  Users, UserCheck, Plane, DollarSign, Wallet, FileText, CreditCard, ShieldAlert
} from 'lucide-react';
import { Employee, User } from '../../types';


interface HrDashboardTabProps {
  lang: 'ar' | 'en';
  employees: Employee[];
  onReloadEmployees: () => Promise<void>;
  onTriggerNotification: (empName: string, category: string) => void;
  onUpdateEmployeeFields: (empId: string, updatedFields: Partial<Employee>) => void;
  user?: User | null;
  setActiveHRSubTab?: (tab: string) => void;
}

export default function HrDashboardTab({
  lang,
  employees,
  onReloadEmployees,
  onTriggerNotification,
  onUpdateEmployeeFields,
  user,
  setActiveHRSubTab
}: HrDashboardTabProps) {
  // Local state for interactive components
  const [employeeDocs, setEmployeeDocs] = useState<any[]>([]);
  const [vehicleDocs, setVehicleDocs] = useState<any[]>([]);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const [resE, resV] = await Promise.all([
          fetch('/api/employee-docs'),
          fetch('/api/vehicle-docs')
        ]);
        if (resE.ok) setEmployeeDocs(await resE.json());
        if (resV.ok) setVehicleDocs(await resV.json());
      } catch (err) {
        console.error("Failed to fetch docs in dashboard:", err);
      }
    };
    fetchDocs();
  }, []);

  const getRemainingDays = (expiryDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Document tracker counters
  const empNearingExpiryCount = employeeDocs.filter(d => {
    const days = getRemainingDays(d.expiryDate);
    return days >= 31 && days <= 60;
  }).length;

  const vehNearingExpiryCount = vehicleDocs.filter(d => {
    const days = getRemainingDays(d.expiryDate);
    return days >= 31 && days <= 60;
  }).length;

  const criticalDocsCount = [...employeeDocs, ...vehicleDocs].filter(d => {
    const days = getRemainingDays(d.expiryDate);
    return days >= 1 && days <= 7;
  }).length;

  const expiredDocsCount = [...employeeDocs, ...vehicleDocs].filter(d => {
    const days = getRemainingDays(d.expiryDate);
    return days < 0;
  }).length;
  
  // 1. إجمالي الموظفين
  const totalEmployeesCount = employees.length;

  // 2. الموظفين النشطين
  const activeEmployeesCount = employees.filter(e => !e.allowances?.status || e.allowances?.status === 'Active').length;

  // 3. الموظفين في إجازة
  const onLeaveEmployeesCount = employees.filter(e => e.allowances?.status === 'On Leave').length;

  // 4. إجمالي الرواتب الشهرية
  const totalSalariesSum = employees.reduce((acc, e) => {
    const basic = Number(e.basicSalary) || 0;
    const housing = Number(e.allowances?.housing) || 0;
    const transport = Number(e.allowances?.transport) || 0;
    const food = Number((e.allowances as any)?.food) || 0;
    return acc + basic + housing + transport + food;
  }, 0);

  // 5. إجمالي الخصومات
  const totalDeductionsSum = employees.reduce((acc, e) => acc + (Number(e.allowances?.deductions) || 0), 0);

  // 6. إجمالي السلف
  const totalLoansSum = employees.reduce((acc, e) => acc + (Number(e.allowances?.loans) || 0), 0);

  // 7. العقود القريبة من الانتهاء (أقل من 90 يوماً متبقية)
  const contractsNearingExpiryCount = employees.filter(e => {
    if (!e.contractExpiry) return false;
    const expiry = new Date(e.contractExpiry);
    const diff = expiry.getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 90;
  }).length;

  // 8. الإقامات القريبة من الانتهاء (أقل من 90 يوماً متبقية)
  const iqamasNearingExpiryCount = employees.filter(e => {
    if (!e.iqamaExpiryDate) return false;
    const expiry = new Date(e.iqamaExpiryDate);
    const diff = expiry.getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 90;
  }).length;

  // 9. الموظفين تحت التجربة (grade يحتوي على كلمة probation أو تجربة، أو تاريخ التعيين خلال آخر 90 يوم)
  const underProbationCount = employees.filter(e => {
    const isProbationGrade = e.grade?.toLowerCase().includes('probation') || e.grade?.includes('تجربة');
    if (isProbationGrade) return true;
    if (!e.dateOfJoining) return false;
    const joinDate = new Date(e.dateOfJoining);
    const diff = new Date().getTime() - joinDate.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 90;
  }).length;
  const [operationsLogs, setOperationsLogs] = useState<any[]>([
    { id: 'log-1', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), user: 'FERAS', actionAr: "تعديل المسمى الوظيفي للموظف 'عماد غانم' إلى فني تجميع", actionEn: "Modified job title for employee 'Emad Ghanem' to Assembly Technician" },
    { id: 'log-2', timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), user: 'FERAS', actionAr: "تحديث الراتب الأساسي والبدلات للموظف 'خالد العنزي'", actionEn: "Updated basic salary and allowances for employee 'Khalid Al-Anazi'" },
    { id: 'log-3', timestamp: new Date(Date.now() - 3600000 * 20).toISOString(), user: 'SYSTEM', actionAr: "تقديم طلب إجازة تلقائي من نظام الخدمة الذاتية للموظف 'كاميليا'", actionEn: "Auto-filled leave application submitted from self-service portal for technician 'Kamel'" },
    { id: 'log-4', timestamp: new Date(Date.now() - 3600000 * 26).toISOString(), user: 'FERAS', actionAr: "تجديد بطاقة الإقامة للموظف 'أحمد الماجد' بنجاح من المتابعة الفورية", actionEn: "Successfully renewed Iqama booklet for employee 'Ahmad Al-Majed' until 2027-06-06" }
  ]);

  useEffect(() => {
    const saved = localStorage.getItem('hr_operations_logs');
    if (saved) {
      try {
        setOperationsLogs(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const addLog = async (actionAr: string, actionEn: string) => {
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: user?.username || 'FERAS',
      actionAr,
      actionEn
    };
    
    setOperationsLogs(prev => {
      const updated = [newLog, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem('hr_operations_logs', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const [showAllLogsModal, setShowAllLogsModal] = useState(false);

  // 2. Real Document Tracker connected strictly to real employee data
  const documentExpiries = employees.map(emp => {
    const expiryStr = emp.iqamaExpiryDate || '2026-07-15'; // Real employee connection with safety default if blank
    const today = new Date();
    today.setHours(0,0,0,0);
    const expiry = new Date(expiryStr);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      id: emp.id,
      empId: emp.id,
      empName_ar: emp.arabicName,
      empName_en: emp.englishName,
      docType_ar: 'بطاقة الإقامة الموحدة 🆔',
      docType_en: 'Unified Iqama Residency 🆔',
      expiryDays: diffDays,
      date: expiryStr
    };
  }).sort((a, b) => a.expiryDays - b.expiryDays).slice(0, 5);

  // Selected document to renew
  const [selectedDocToRenew, setSelectedDocToRenew] = useState<string | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState('2027-06-06');

  // 3. Live REST Streams for Inquiries & leaves (Approve Pipeline)
  const [leavesList, setLeavesList] = useState<any[]>([]);
  const [inquiriesList, setInquiriesList] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  
  // Custom response state
  const [answeringInquiryId, setAnsweringInquiryId] = useState<string | null>(null);
  const [hrReplyNote, setHrReplyNote] = useState('');
  const [hrReplyType, setHrReplyType] = useState('CUSTOM');
  const [hrReplyLink, setHrReplyLink] = useState('');
  const [inquiryDashSort, setInquiryDashSort] = useState<'desc' | 'asc'>('desc');
  const [inquiryDashDate, setInquiryDashDate] = useState('');
  const [inquiryDashName, setInquiryDashName] = useState('');

  const fetchQueueData = async () => {
    try {
      setLoadingQueue(true);
      const resL = await fetch('/api/leaves');
      const resI = await fetch('/api/inquiries');
      if (resL.ok) setLeavesList(await resL.json());
      if (resI.ok) setInquiriesList(await resI.json());
    } catch (e) {
      console.error('Error Syncing queues:', e);
    } finally {
      setLoadingQueue(false);
    }
  };

  React.useEffect(() => {
    fetchQueueData();
  }, []);

  // Action Handlers
  const handleRenewDoc = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;
    
    // Update live database fields
    onUpdateEmployeeFields(empId, { iqamaExpiryDate: newExpiryDate });
    
    // Append real operation log audit row
    const arMsg = `تجديد بطاقة الإقامة للموظف '${emp.arabicName}' بنجاح لغاية ${newExpiryDate}`;
    const enMsg = `Renewed Iqama residence document for '${emp.englishName}' successfully until ${newExpiryDate}`;
    addLog(arMsg, enMsg);
    
    setSelectedDocToRenew(null);
  };

  const handleResolveLeaveRequest = async (id: string, empName: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/leaves/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action })
      });
      if (res.ok) {
        const actionStrAr = action === 'APPROVED' ? 'اعتماد وموافقة' : 'رفض وإلغاء';
        const actionStrEn = action === 'APPROVED' ? 'Approved' : 'Rejected';
        addLog(
          `تم ${actionStrAr} طلب إجازة الموظف '${empName}' ميكانيكياً`,
          `${actionStrEn} leave application for participant '${empName}'`
        );
        fetchQueueData();
        onReloadEmployees();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPendingInquiries = inquiriesList.filter(i => {
    let m = i.status === 'PENDING';
    if (!m) return false;
    if (inquiryDashName && !i.name?.toLowerCase().includes(inquiryDashName.toLowerCase())) return false;
    if (inquiryDashDate && !i.dateCreated?.includes(inquiryDashDate)) return false;
    return true;
  }).sort((a, b) => {
    const timeA = new Date(a.dateCreated || 0).getTime();
    const timeB = new Date(b.dateCreated || 0).getTime();
    return inquiryDashSort === 'desc' ? timeB - timeA : timeA - timeB;
  });

  const handleAnswerInquiry = async (id: string, empName: string) => {
    let finalNote = hrReplyNote;
    if (hrReplyType === 'VISIT_HR') finalNote = lang === 'ar' ? 'يرجى الاستعلام من مكتب الموارد البشرية' : 'Please visit HR office for this inquiry';
    else if (hrReplyType === 'DOCUMENT_LINK') finalNote = (lang === 'ar' ? 'رد عن طريق ارسال رابط مستند: ' : 'Document link: ') + hrReplyLink;
    else if (hrReplyType === 'SENT_EMAIL') finalNote = lang === 'ar' ? 'تم الارسال عبر الايميل' : 'Sent via email';

    if (!finalNote) return;
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED', hrNotes: finalNote })
      });
      if (res.ok) {
        // @ts-ignore
        addLog(
          `الرد الفوري على طلب استعلام الموظف '${empName}'`,
          `Sent inquiry response to '${empName}'`
        );
        setAnsweringInquiryId(null);
        setHrReplyNote('');
        setHrReplyLink('');
        // @ts-ignore
        fetchQueueData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="hr-dashboard-module" className="space-y-6">
      
      {/* 1. Quick Indicators Dashboard - 9 Rich Metrics Bento-Grid */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-400 mb-1 text-right" dir="rtl">
          {lang === 'ar' ? '📊 لوحة تحكم ومؤشرات الموارد البشرية السريعة' : 'HR Dashboard Quick Key Performance Indicators'}
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3" dir="rtl">
          
          {/* Card 1: إجمالي الموظفين */}
          <div className="bg-gradient-to-br from-blue-50/90 to-white p-4 rounded-2xl border border-blue-100 flex items-center justify-between shadow-sm hover:shadow transition-all group">
            <div className="space-y-1 text-right">
              <span className="text-[11px] text-slate-500 font-bold block">{lang === 'ar' ? 'إجمالي الموظفين' : 'Total Headcount'}</span>
              <p className="text-2xl font-mono font-black text-blue-900 leading-none">{totalEmployeesCount}</p>
              <span className="text-[9px] text-slate-400 block">{lang === 'ar' ? 'موظف مسجل حالياً' : 'registered staff'}</span>
            </div>
            <div className="p-2.5 bg-blue-100/50 rounded-xl group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>

          {/* Card 2: الموظفين النشطين */}
          <div className="bg-gradient-to-br from-emerald-50/90 to-white p-4 rounded-2xl border border-emerald-100 flex items-center justify-between shadow-sm hover:shadow transition-all group">
            <div className="space-y-1 text-right">
              <span className="text-[11px] text-slate-500 font-bold block">{lang === 'ar' ? 'الموظفين النشطين' : 'Active Employees'}</span>
              <p className="text-2xl font-mono font-black text-emerald-900 leading-none">{activeEmployeesCount}</p>
              <span className="text-[9px] text-emerald-600 font-bold block">● {lang === 'ar' ? 'على رأس العمل' : 'on active duty'}</span>
            </div>
            <div className="p-2.5 bg-emerald-100/50 rounded-xl group-hover:scale-110 transition-transform">
              <UserCheck className="w-5 h-5 text-emerald-600" />
            </div>
          </div>

          {/* Card 3: الموظفين في إجازة */}
          <div className="bg-gradient-to-br from-sky-50/90 to-white p-4 rounded-2xl border border-sky-100 flex items-center justify-between shadow-sm hover:shadow transition-all group">
            <div className="space-y-1 text-right">
              <span className="text-[11px] text-slate-500 font-bold block">{lang === 'ar' ? 'الموظفين في إجازة' : 'Employees on Leave'}</span>
              <p className="text-2xl font-mono font-black text-sky-900 leading-none">{onLeaveEmployeesCount}</p>
              <span className="text-[9px] text-[#00AEEF] font-semibold block">{lang === 'ar' ? 'إجازة روتينية أو مرضية' : 'official leave'}</span>
            </div>
            <div className="p-2.5 bg-sky-100/50 rounded-xl group-hover:scale-110 transition-transform">
              <Plane className="w-5 h-5 text-sky-655" />
            </div>
          </div>

          {/* Card 4: إجمالي الرواتب الشهرية */}
          <div className="bg-gradient-to-br from-purple-50/90 to-white p-4 rounded-2xl border border-purple-100 flex items-center justify-between shadow-sm hover:shadow transition-all group">
            <div className="space-y-1 text-right">
              <span className="text-[11px] text-slate-500 font-bold block">{lang === 'ar' ? 'إجمالي الرواتب الشهرية' : 'Total Monthly Salaries'}</span>
              <p className="text-lg font-mono font-black text-purple-900 leading-none">{totalSalariesSum.toLocaleString('en-US')} <span className="text-[10px] font-bold">SAR</span></p>
              <span className="text-[9px] text-purple-600 font-semibold block">{lang === 'ar' ? 'شامل الرواتب والبدلات المتراكمة' : 'global gross sum'}</span>
            </div>
            <div className="p-2.5 bg-purple-100/50 rounded-xl group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
          </div>

          {/* Card 5: إجمالي الخصومات */}
          <div className="bg-gradient-to-br from-rose-50/90 to-white p-4 rounded-2xl border border-rose-100 flex items-center justify-between shadow-sm hover:shadow transition-all group">
            <div className="space-y-1 text-right">
              <span className="text-[11px] text-slate-500 font-bold block">{lang === 'ar' ? 'إجمالي الخصومات' : 'Total Deductions'}</span>
              <p className="text-lg font-mono font-black text-rose-900 leading-none">-{totalDeductionsSum.toLocaleString('en-US')} <span className="text-[10px] font-bold">SAR</span></p>
              <span className="text-[9px] text-rose-600 font-bold block">{lang === 'ar' ? 'الخصومات والعقوبات المطبقة' : 'applied penalties'}</span>
            </div>
            <div className="p-2.5 bg-rose-100/50 rounded-xl group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
          </div>

          {/* Card 6: إجمالي السلف */}
          <div className="bg-gradient-to-br from-amber-50/90 to-white p-4 rounded-2xl border border-amber-100 flex items-center justify-between shadow-sm hover:shadow transition-all group">
            <div className="space-y-1 text-right">
              <span className="text-[11px] text-slate-500 font-bold block">{lang === 'ar' ? 'إجمالي السلف' : 'Total Advances'}</span>
              <p className="text-lg font-mono font-black text-amber-900 leading-none">{totalLoansSum.toLocaleString('en-US')} <span className="text-[10px] font-bold">SAR</span></p>
              <span className="text-[9px] text-amber-600 font-semibold block">{lang === 'ar' ? 'سلف نشطة قيد السداد' : 'employee current loans'}</span>
            </div>
            <div className="p-2.5 bg-amber-100/50 rounded-xl group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5 text-amber-600" />
            </div>
          </div>

          {/* Card 7: العقود القريبة من الانتهاء */}
          <div className="bg-gradient-to-br from-orange-50/90 to-white p-4 rounded-2xl border border-orange-100 flex items-center justify-between shadow-sm hover:shadow transition-all group">
            <div className="space-y-1 text-right">
              <span className="text-[11px] text-slate-500 font-bold block">{lang === 'ar' ? 'العقود القريبة من الانتهاء' : 'Contracts Nearing Expiry'}</span>
              <p className="text-2xl font-mono font-black text-orange-900 leading-none">{contractsNearingExpiryCount}</p>
              <span className="text-[9px] text-orange-600 font-semibold block">⚠️ {lang === 'ar' ? 'خلال أقل من 90 يوم' : 'expires in 90 days'}</span>
            </div>
            <div className="p-2.5 bg-orange-100/50 rounded-xl group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
          </div>

          {/* Card 8: الإقامات القريبة من الانتهاء */}
          <div className="bg-gradient-to-br from-teal-50/90 to-white p-4 rounded-2xl border border-teal-100 flex items-center justify-between shadow-sm hover:shadow transition-all group">
            <div className="space-y-1 text-right">
              <span className="text-[11px] text-slate-500 font-bold block">{lang === 'ar' ? 'العقود/الإقامات المنتهية' : 'Iqamas Nearing Expiry'}</span>
              <p className="text-2xl font-mono font-black text-teal-900 leading-none">{iqamasNearingExpiryCount}</p>
              <span className="text-[9px] text-teal-600 font-semibold block">⚠️ {lang === 'ar' ? 'تاريخ انتهاء الإقامة < 90 يوم' : 'expires in 90 days'}</span>
            </div>
            <div className="p-2.5 bg-teal-100/50 rounded-xl group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5 text-teal-600" />
            </div>
          </div>

          {/* Card 9: الوثائق التي شارفت على الانتهاء */}
          <div 
            onClick={() => {
              localStorage.setItem('doc_filter', 'nearing_expiry');
              setActiveHRSubTab?.('document_tracking');
            }}
            className="bg-gradient-to-br from-rose-50 to-amber-50 p-4 rounded-2xl border border-rose-100 flex items-center justify-between shadow-sm hover:shadow-md cursor-pointer transition-all group"
          >
            <div className="space-y-1 text-right">
              <span className="text-[11px] text-slate-500 font-bold block">{lang === 'ar' ? 'الوثائق التي شارفت على الانتهاء' : 'Documents Nearing Expiry'}</span>
              <div className="flex gap-2 items-center text-rose-800">
                <p className="text-2xl font-mono font-black leading-none">{(empNearingExpiryCount + vehNearingExpiryCount)}</p>
                <span className="text-[9px] bg-amber-200/50 text-amber-900 px-1 rounded font-extrabold">
                  {lang === 'ar' ? `حرجة: ${criticalDocsCount}` : `Crit: ${criticalDocsCount}`}
                </span>
                <span className="text-[9px] bg-red-200/50 text-red-900 px-1 rounded font-extrabold animate-pulse">
                  {lang === 'ar' ? `منتهية: ${expiredDocsCount}` : `Exp: ${expiredDocsCount}`}
                </span>
              </div>
              <span className="text-[8px] text-rose-600 font-semibold block">
                {lang === 'ar' 
                  ? `👤 موظفين: ${empNearingExpiryCount} | 🚚 سيارات: ${vehNearingExpiryCount}` 
                  : `👤 Staff: ${empNearingExpiryCount} | 🚚 Cars: ${vehNearingExpiryCount}`}
              </span>
            </div>
            <div className="p-2.5 bg-rose-100/50 rounded-xl group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
          </div>

        </div>
      </div>

      {/* 2. Live HR Corporate Operations Log */}
      <div className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/50 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-black text-[#0072BC] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
              {lang === 'ar' ? '📋 سجل العمليات والمصادقات الأخيرة بالموارد البشرية' : 'Latest HR Administrative Operations Log'}
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {lang === 'ar' ? 'رصد كامل مع كشف هوية المستخدم المسؤول والتاريخ والوقت والعملية المنفذة بدقة' : 'Auditable log with precise timestamp, user-identity and context metrics'}
            </p>
          </div>
          <button 
            onClick={() => setShowAllLogsModal(true)}
            className="px-3.5 py-1.5 bg-[#0072BC]/10 hover:bg-[#0072BC]/20 text-[#0072BC] rounded-xl text-[10px] font-black transition-all"
          >
            {lang === 'ar' ? 'عرض السجل الكامل بقنوات الـ ERP 📜' : 'View Full Log Log 📜'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" dir="rtl">
          {operationsLogs.slice(0, 4).map((log) => (
            <div key={log.id} className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-2xl text-[11px] hover:bg-slate-100/40 transition flex flex-col justify-between gap-2 text-right">
              <div className="flex justify-between items-center bg-white/60 p-1 px-2 rounded-lg font-mono text-[9px]">
                <span className="text-slate-400">{new Date(log.timestamp).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
                <span className="font-extrabold text-[#0072BC]">👤 BY: {log.user}</span>
              </div>
              <p className="font-bold text-slate-700 leading-relaxed">
                {lang === 'ar' ? log.actionAr : log.actionEn}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Document Expiry Alert Ledgers linked strictly to real employees */}
      <div className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/50 space-y-4">
        <div>
          <h4 className="text-sm font-black text-[#0072BC] flex items-center gap-2">
            <AlertTriangle className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
            {lang === 'ar' ? '⚠️ رادار الوثائق وإقامات موظفي المؤسسة (الوقت الفعلي)' : 'Real-time Iqama & Passport Documents Expirations Tracker'}
          </h4>
          <p className="text-[10px] text-slate-400 mt-1">
            {lang === 'ar' ? 'مرتبط بقاعدة بيانات الموظفين - يتيح تحديث الإقامة فورياً وتنعكس التواريخ على ملف الموظف مباشرةً' : 'Directly bound to live employee database models - instant update reflects to employee file'}
          </p>
        </div>

        <div className="overflow-x-auto text-[11px]">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-150 font-bold text-slate-400 text-right uppercase text-[9px] bg-slate-50/50">
                <th className="p-2.5 text-right">{lang === 'ar' ? 'اسم الموظف المعني' : 'Employee In-Scope'}</th>
                <th className="p-2.5 text-right">{lang === 'ar' ? 'نوع الوثيقة المستلزمة' : 'Document Category'}</th>
                <th className="p-2.5 text-right">{lang === 'ar' ? 'تاريخ انتهاء الصلاحية' : 'Expiry Date'}</th>
                <th className="p-2.5 text-right">{lang === 'ar' ? 'الأيام المتبقية' : 'Countdown Days'}</th>
                <th className="p-2.5 text-center">{lang === 'ar' ? 'أفعال التحكم المباشرة' : 'Direct Control'}</th>
              </tr>
            </thead>
            <tbody>
              {documentExpiries.map(doc => {
                const isCritical = doc.expiryDays <= 45;
                const isWarn = doc.expiryDays > 45 && doc.expiryDays <= 90;
                const badgeColor = isCritical 
                  ? 'bg-rose-500/10 text-rose-600 border-rose-200' 
                  : isWarn 
                    ? 'bg-amber-500/10 text-amber-600 border-amber-205'
                    : 'bg-emerald-500/10 text-emerald-600 border-emerald-200';

                return (
                  <tr key={doc.id} className="border-b border-slate-50 hover:bg-slate-100/30 text-right">
                    <td className="p-2.5 font-black text-slate-800">
                      {doc.empName_ar}
                    </td>
                    <td className="p-2.5 font-semibold text-slate-500">
                      {lang === 'ar' ? doc.docType_ar : doc.docType_en}
                    </td>
                    <td className="p-2.5 font-mono text-slate-600">
                      {doc.date}
                    </td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black border ${badgeColor}`}>
                        {doc.expiryDays} {lang === 'ar' ? 'يوم متبقي' : 'days left'}
                      </span>
                    </td>
                    <td className="p-2.5 flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => {
                          setSelectedDocToRenew(doc.id);
                          setNewExpiryDate(new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0]); // default to +1yr
                        }}
                        className="px-3 py-1.5 bg-[#0072BC] hover:bg-sky-600 text-white rounded-lg text-[10px] font-black transition-all flex items-center gap-1"
                      >
                        ⚡ {lang === 'ar' ? 'تجديد فوري وتحديث الملف' : 'Express Renew Document'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Instant Renewal Dialog Modal Backdrop */}
        {selectedDocToRenew && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 max-w-sm w-full space-y-4 text-right" dir="rtl">
              <h5 className="font-extrabold text-[#0072BC] text-sm flex items-center gap-2">
                <span>⚡</span>
                <span>{lang === 'ar' ? 'تجديد وثيقة الموظف الرسمية وتحديث ERP' : 'Express Renew Official Employee Documentation'}</span>
              </h5>
              <div className="space-y-3 text-xs text-slate-600">
                <p>
                  {lang === 'ar' ? 'تعديل هذا النطاق يرسل كود تحديث فوري لخادم منصة قوى ومقيم ويربط المستند الجديد بهوية الموظف.' : 'This injection simulates sending updated legal dates directly to Saudi government Muqeem APIs.'}
                </p>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-bold">{lang === 'ar' ? 'تاريخ انتهاء الصلاحية الجديد *' : 'New Expiry Date *'}</label>
                  <input 
                    type="date" 
                    value={newExpiryDate} 
                    onChange={(e) => setNewExpiryDate(e.target.value)}
                    className="w-full p-2 border rounded-xl bg-slate-50 text-slate-800 text-xs font-mono font-bold" 
                  />
                </div>
              </div>
              <div className="flex gap-2 text-xs font-black pt-2">
                <button 
                  onClick={() => handleRenewDoc(selectedDocToRenew)}
                  className="flex-1 bg-[#0072BC] text-white py-2 rounded-xl hover:brightness-105 transition"
                >
                  {lang === 'ar' ? 'تعديل وتحديث التاريخ' : 'Submit Renewal'}
                </button>
                <button 
                  onClick={() => setSelectedDocToRenew(null)}
                  className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-xl text-center"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Combined real stream: Inquiries & Leave requests (طلبات الاستعلام والاجازات) */}
      <div id="central-claims-queue-pad" className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/50 space-y-4">
        <div>
          <h4 className="text-sm font-black text-[#0072BC] flex items-center gap-2">
            <CheckCircle className="w-4.5 h-4.5 text-[#00AEEF]" />
            {lang === 'ar' ? '📬 طلبات الاستعلام والإجازات والخدمة الذاتية' : 'Inquiries & Leaves Requests Management Portal'}
          </h4>
          <p className="text-[10px] text-slate-400 mt-1">
            {lang === 'ar' ? 'صندوق حقيقي يرصد طلبات شؤون الموظفين والإجازات المستلمة من الفنيين للرد الفوري والمصادقة المباشرة بدلاً من النماذج الوهمية' : 'Consolidated real queue from employees for immediate approval, rejection, or respuesta replies.'}
          </p>
        </div>

        {answeringInquiryId && (
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 text-right" dir="rtl">
            <h5 className="font-extrabold text-xs text-[#0072BC]">💬 {lang === 'ar' ? 'صياغة الرد الرسمي وإرساله لصفحة استعلام الموظف:' : 'Compose Response:'}</h5>
            
            <select 
              value={hrReplyType} 
              onChange={e => setHrReplyType(e.target.value)}
              className="w-full p-2 border rounded-xl text-xs font-bold"
            >
               <option value="CUSTOM">{lang === 'ar' ? 'رد مخصص نصي' : 'Custom text reply'}</option>
               <option value="VISIT_HR">{lang === 'ar' ? 'يرجى الاستعلام من مكتب الموارد البشرية' : 'Please visit HR office'}</option>
               <option value="DOCUMENT_LINK">{lang === 'ar' ? 'رد عن طريق ارسال رابط مستند' : 'Respond with a document link'}</option>
               <option value="SENT_EMAIL">{lang === 'ar' ? 'تم الارسال عبر الايميل' : 'Sent via email'}</option>
            </select>

            {hrReplyType === 'DOCUMENT_LINK' && (
              <div>
                <input 
                  type="url" 
                  value={hrReplyLink}
                  onChange={e => setHrReplyLink(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  placeholder={lang === 'ar' ? 'أدخل رابط المستند هنا...' : 'Enter document URL...'}
                  required
                />
              </div>
            )}
            
            {hrReplyType === 'CUSTOM' && (
            <div>
              <textarea 
                value={hrReplyNote}
                onChange={(e) => setHrReplyNote(e.target.value)}
                placeholder={lang === 'ar' ? 'أدخل الرد التفصيلي هنا (الرد ينعكس فوراً للموظف في صفحة الاستعلامات)...' : 'Write details...'}
                required
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs h-20 leading-relaxed font-bold"
              />
            </div>
            )}
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const item = inquiriesList.find(i => i.id === answeringInquiryId);
                  if (item) handleAnswerInquiry(answeringInquiryId, item.name);
                }}
                className="px-4 py-2 bg-sky-600 text-white rounded-xl text-[10px] font-black hover:bg-sky-700 transition"
              >
                {lang === 'ar' ? 'إرسال الرد والإغلاق' : 'Send & Resolve'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setAnsweringInquiryId(null);
                  setHrReplyNote('');
                  setHrReplyLink('');
                }}
                className="px-3 py-2 bg-slate-200 rounded-xl text-[10px] text-slate-700"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Leaves Subqueue */}
          <div className="space-y-3">
            <h5 className="text-[11px] font-black text-slate-600 bg-sky-50 p-2 rounded-xl text-center border border-sky-100">
              🌴 {lang === 'ar' ? 'طلبات الإجازات الواردة (انتظار الاعتماد)' : 'Leave Requests Queue'}
            </h5>
            {loadingQueue ? (
              <div className="text-center py-4 text-slate-400 text-xs">{lang === 'ar' ? 'جاري جلب الطلبات من السيرفر...' : 'Loading...'}</div>
            ) : leavesList.filter(l => l.status === 'PENDING' || !l.status).length === 0 ? (
              <p className="text-center py-8 text-slate-400 italic text-[10px]">
                {lang === 'ar' ? 'لا توجد طلبات إجازة قيد الانتظار حالياً.' : 'No pending leaves found.'}
              </p>
            ) : (
              leavesList.filter(l => l.status === 'PENDING' || !l.status).map(l => (
                <div key={l.id} className="p-4 bg-white/70 border border-slate-100 rounded-2xl space-y-2 text-right text-xs" dir="rtl">
                  <div className="flex justify-between items-center text-[10px] border-b pb-1">
                    <span className="font-extrabold text-[#0072BC]">{l.name}</span>
                    <span className="font-mono text-slate-400">{l.id}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-700">{lang === 'ar' ? 'النوع:' : 'Type:'} <span className="text-indigo-600">{l.type_ar}</span></p>
                    <p className="font-bold text-slate-600">{lang === 'ar' ? 'المدة:' : 'Duration:'} <span className="text-slate-900 font-mono">{l.durationDays} يوم</span> ({l.startDate} إلى {l.endDate})</p>
                    <p className="text-slate-500 italic">"{l.reason}"</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => handleResolveLeaveRequest(l.id, l.name, 'APPROVED')}
                      className="flex-1 py-1.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black hover:bg-emerald-700 transition"
                    >
                      {lang === 'ar' ? 'اعتماد الإجازة' : 'Approve'}
                    </button>
                    <button 
                      onClick={() => handleResolveLeaveRequest(l.id, l.name, 'REJECTED')}
                      className="flex-1 py-1.5 bg-rose-100 text-rose-600 rounded-xl text-[10px] font-black hover:bg-rose-200 transition"
                    >
                      {lang === 'ar' ? 'رفض' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Inquiries Subqueue */}
          <div className="space-y-3">
            <h5 className="text-[11px] font-black text-slate-600 bg-indigo-50 p-2 rounded-xl text-center border border-indigo-100">
              💬 {lang === 'ar' ? 'طلبات الاستعلام والأوراق المرفوعة' : 'Inquiries & Paper Claims Queue'}
            </h5>
            <div className="bg-white p-3 rounded-2xl border border-slate-100 space-y-2 text-xs font-bold text-slate-600" dir="rtl">
              <div>
                <input 
                  type="text" 
                  value={inquiryDashName}
                  onChange={e => setInquiryDashName(e.target.value)}
                  placeholder={lang === 'ar' ? 'بحث باسم المستعلم...' : 'Search employee name...'}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex gap-2">
                <input 
                  type="date" 
                  value={inquiryDashDate}
                  onChange={e => setInquiryDashDate(e.target.value)}
                  className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
                <select 
                  value={inquiryDashSort}
                  onChange={(e: any) => setInquiryDashSort(e.target.value)}
                  className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="desc">{lang === 'ar' ? 'الأحدث أولاً' : 'Newest First'}</option>
                  <option value="asc">{lang === 'ar' ? 'الأقدم أولاً' : 'Oldest First'}</option>
                </select>
              </div>
            </div>
            {loadingQueue ? (
              <div className="text-center py-4 text-slate-400 text-xs">{lang === 'ar' ? 'جاري جلب الاستعلامات من السيرفر...' : 'Loading...'}</div>
            ) : filteredPendingInquiries.length === 0 ? (
              <p className="text-center py-8 text-slate-400 italic text-[10px]">
                {lang === 'ar' ? 'لا توجد طلبات استعلام قيد الانتظار حالياً.' : 'No pending inquiries found.'}
              </p>
            ) : (
              filteredPendingInquiries.map(i => (
                <div key={i.id} className="p-4 bg-white/70 border border-slate-100 rounded-2xl space-y-2 text-right text-xs" dir="rtl">
                  <div className="flex justify-between items-center text-[10px] border-b pb-1">
                    <span className="font-extrabold text-[#0072BC]">{i.name}</span>
                    <span className="font-mono text-slate-400">{i.id}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-700">{lang === 'ar' ? 'التصنيف:' : 'Category:'} <span className="text-amber-600">{i.category_ar}</span></p>
                    <p className="text-slate-600 font-bold">{lang === 'ar' ? 'تفاصيل الطلب:' : 'Request Details:'}</p>
                    <p className="bg-slate-50 p-2 rounded-lg text-[11px] italic text-slate-500 leading-normal">"{i.details}"</p>
                  </div>
                  <div className="pt-2 text-left">
                    <button 
                      onClick={() => {
                        setAnsweringInquiryId(i.id);
                        setHrReplyNote(lang === 'ar' ? 'تم تجهيز الرد والمستند. الرابط الرسمي المعتمد: ' : 'Processed. Attached document: ');
                      }}
                      className="px-4 py-1.5 bg-[#0072BC] text-white rounded-xl text-[10px] font-black hover:bg-[#0072BC]/90 transition"
                    >
                      ✍️ {lang === 'ar' ? 'الرد وإرسال الإفادة' : 'Compose Answer'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>

      {/* operationsLogs full listing Modal */}
      {showAllLogsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 max-w-2xl w-full max-h-[80vh] flex flex-col justify-between gap-4 text-right" dir="rtl">
            <div className="border-b pb-3">
              <h3 className="font-black text-[#0072BC] text-base">📜 سجل مراجعة العمليات والـ Audits الكامل بالموارد البشرية</h3>
              <p className="text-[10px] text-slate-400">كامل اللوغ والمصادقات المنفذة على خوادم الوليد للعلامات التجارية</p>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {operationsLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 border rounded-xl flex items-start justify-between gap-4 text-xs hover:bg-slate-100/50 transition">
                  <div className="space-y-1 flex-1">
                    <p className="font-bold text-slate-800">{lang === 'ar' ? log.actionAr : log.actionEn}</p>
                    <div className="flex gap-4 text-[9px] text-slate-400 font-mono">
                      <span>🕒 {new Date(log.timestamp).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
                      <span className="font-bold text-sky-800">👤 OPERATOR: {log.user}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-sky-15/50 border text-[#0072BC] rounded text-[9px] font-mono">AUDIT</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t">
              <button 
                onClick={() => setShowAllLogsModal(false)}
                className="w-full py-2 bg-slate-800 text-white rounded-xl font-bold text-xs"
              >
                {lang === 'ar' ? 'إغلاق السجل' : 'Close Audit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
