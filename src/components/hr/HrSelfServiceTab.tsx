import React, { useState, useEffect } from 'react';
import { sharedPrintHeader, sharedPrintFooter, sharedPrintStyles } from '../../utils/PrintShared';
import { HelpCircle, Clock, CheckCircle, Send, RefreshCw, Layers, FileSpreadsheet, FileText, ClipboardList } from 'lucide-react';
import { Employee, User } from '../../types';

interface InquiryRequest {
  id: string;
  empId: string;
  name: string;
  category_ar: string;
  category_en: string;
  details: string;
  status: 'PENDING' | 'RESOLVED';
  dateCreated: string;
  hrNotes?: string;
}

interface HrSelfServiceTabProps {
  lang: 'ar' | 'en';
  user?: User | null;
  employees: Employee[];
}

export default function HrSelfServiceTab({ lang, user, employees }: HrSelfServiceTabProps) {
  const [inquiries, setInquiries] = useState<InquiryRequest[]>([]);
  const [leavesList, setLeavesList] = useState<any[]>([]);
  const [deductions, setDeductions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // View toggle for HR users so they have their own inquiries
  const [forceViewAsEmployee, setForceViewAsEmployee] = useState(false);

  // Sub-Tab switcher for Employee role
  const [employeeActiveSection, setEmployeeActiveSection] = useState<'inquiries' | 'leaves' | 'payroll' | 'deductions'>('inquiries');

  // Form states (Employee Inquiry submission)
  const [inquiryCategory, setInquiryCategory] = useState('Contract Expiry Status');
  const [inquiryDetails, setInquiryDetails] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Form states (Employee Leave submission)
  const [leaveType, setLeaveType] = useState('Annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveError, setLeaveError] = useState('');
  const [leaveSuccess, setLeaveSuccess] = useState('');

  // HR Resolution form
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [hrNotes, setHrNotes] = useState('');
  const [hrReplyType, setHrReplyType] = useState('CUSTOM');
  const [hrReplyLink, setHrReplyLink] = useState('');
  // Filter and config
  const [inquirySortOrder, setInquirySortOrder] = useState<'desc' | 'asc'>('desc');
  const [inquiryDateFilter, setInquiryDateFilter] = useState('');
  const [inquiryNameFilter, setInquiryNameFilter] = useState('');

  // Locate the employee bound context
  const isEmployeeRole = user?.role === 'Employee (Inquiries)' || user?.role === 'Employee' || user?.role === 'موظف' || user?.role === 'موظف - استعلامات' || user?.username === 'KAMEL' || forceViewAsEmployee;
  
  // High-intelligence matching mapping to link a logged-in user account dynamically to their HR Employee ID
  const matchedEmployee = React.useMemo(() => {
    if (!employees || employees.length === 0) return null;
    
    // 1. Direct linkage via explicitly saved empId
    if (user?.empId) {
      const found = employees.find(e => e.id === user.empId);
      if (found) return found;
    }
    
    const cleanUsername = (user?.username || '').toUpperCase();
    if (cleanUsername) {
      // 2. Exact match check for key demo accounts
      if (cleanUsername === 'KAMEL') {
        const found = employees.find(e => e.id === 'EMP-1003');
        if (found) return found;
      }
      
      // 3. Substring matching against English name or profile ID
      const foundEn = employees.find(e => (e.englishName || '').toUpperCase().includes(cleanUsername));
      if (foundEn) return foundEn;

      // 4. Substring matching against Arabic name
      const foundAr = employees.find(e => (e.arabicName || '').includes(user?.username || ''));
      if (foundAr) return foundAr;

      const foundId = employees.find(e => (e.id || '').toUpperCase().includes(cleanUsername));
      if (foundId) return foundId;
    }
    
    return null;
  }, [user, employees]);

  const boundEmployeeId = user?.empId || matchedEmployee?.id || (user?.username === 'KAMEL' ? 'EMP-1003' : 'EMP-1002');
  const boundEmployee = matchedEmployee || employees.find(e => e.id === boundEmployeeId);

  const fetchInquiriesAndLeaves = async () => {
    try {
      setLoading(true);
      const [resI, resL, resD] = await Promise.all([
        fetch('/api/inquiries'),
        fetch('/api/leaves'),
        fetch('/api/deductions')
      ]);
      if (resI.ok) {
        setInquiries(await resI.json());
      }
      if (resL.ok) {
        setLeavesList(await resL.json());
      }
      if (resD.ok) {
        setDeductions(await resD.json());
      }
    } catch (err) {
      console.error('Error fetching queues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiriesAndLeaves();
  }, []);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!inquiryDetails) {
      setSubmitError(lang === 'ar' ? 'الرجاء إدخال تفاصيل الاستفسار.' : 'Inquiry details are required.');
      return;
    }

    let category_ar = 'حالة العقد ورخص العمل';
    let category_en = 'Contract Status';
    if (inquiryCategory === 'Salary Distribution') { category_ar = 'توزيع وتفاصيل الراتب'; category_en = 'Salary Distribution'; }
    else if (inquiryCategory === 'Working Hours') { category_ar = 'ساعات العمل والورديات'; category_en = 'Working Hours'; }
    else if (inquiryCategory === 'Job Title / Grade') { category_ar = 'المسمى الوظيفي والترقيات'; category_en = 'Job Title / Grade'; }
    else if (inquiryCategory === 'Salary Proof') { category_ar = 'طلب مستند: تعريف بالراتب'; category_en = 'Request Document: Salary Proof'; }
    else if (inquiryCategory === 'Experience Certificate') { category_ar = 'طلب مستند: شهادة خبرة'; category_en = 'Request Document: Experience Certificate'; }

    const payload = {
      empId: boundEmployeeId || 'EMP-1002',
      name: boundEmployee ? (lang === 'ar' ? boundEmployee.arabicName : boundEmployee.englishName) : user?.username || 'Kamel',
      category_ar,
      category_en,
      details: inquiryDetails,
      status: 'PENDING'
    };

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSubmitSuccess(lang === 'ar' ? 'تم تقديم طلب الاستعلام للموارد البشرية بنجاح!' : 'Your inquiry has been submitted successfully to HR!');
        setInquiryDetails('');
        fetchInquiriesAndLeaves();
      }
    } catch (err) {
      console.error(err);
      setSubmitError('Connection failed.');
    }
  };

  const handleSelfLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeaveError('');
    setLeaveSuccess('');

    if (!startDate || !endDate || !leaveReason) {
      setLeaveError(lang === 'ar' ? 'الرجاء ملء كل الحقول المطلوبة لطلب الإجازة.' : 'Please enter active dates and leave reason.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      setLeaveError(lang === 'ar' ? 'تاريخ النهاية لا يمكن أن يكون قبل تاريخ البداية.' : 'End date cannot follow start date.');
      return;
    }
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    let type_ar = 'سنوية';
    let type_en = 'Annual';
    if (leaveType === 'Sick') { type_ar = 'مرضية'; type_en = 'Sick'; }
    else if (leaveType === 'Emergency') { type_ar = 'طارئة'; type_en = 'Emergency'; }
    else if (leaveType === 'Unpaid') { type_ar = 'بدون راتب'; type_en = 'Unpaid'; }
    else if (leaveType === 'Marriage') { type_ar = 'زواج'; type_en = 'Marriage'; }
    else if (leaveType === 'Death') { type_ar = 'وفاة'; type_en = 'Death'; }

    const payload = {
      empId: boundEmployeeId || 'EMP-1002',
      name: boundEmployee ? (lang === 'ar' ? boundEmployee.arabicName : boundEmployee.englishName) : user?.username || 'Kamel',
      type_ar,
      type_en,
      durationDays,
      startDate,
      endDate,
      reason: leaveReason,
      status: 'PENDING', submissionType: 'self'
    };

    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setLeaveSuccess(lang === 'ar' ? 'تم إرسال طلب الإجازة للمراجعة بنجاح! ستظهر نتيجته في السجل.' : 'Leave demand submitted successfully for HR Review!');
        setStartDate('');
        setEndDate('');
        setLeaveReason('');
      } else {
        setLeaveError('Failed to record on server.');
      }
    } catch (err) {
      console.error(err);
      setLeaveError('Server connection failure.');
    }
  };

  const handleResolveInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingId || !hrNotes) return;

    try {
      const res = await fetch(`/api/inquiries/${resolvingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED', hrNotes })
      });
      if (res.ok) {
        setResolvingId(null);
        setHrNotes('');
        fetchInquiriesAndLeaves();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter inquiry lists based on employee constraints
  const filteredInquiries = inquiries.filter(i => {
    if (isEmployeeRole) {
      if (i.empId !== boundEmployeeId) return false;
    }
    if (inquiryNameFilter && !i.name?.toLowerCase().includes(inquiryNameFilter.toLowerCase())) return false;
    if (inquiryDateFilter && !i.dateCreated?.includes(inquiryDateFilter)) return false;
    return true;
  }).sort((a, b) => {
    const timeA = new Date(a.dateCreated || 0).getTime();
    const timeB = new Date(b.dateCreated || 0).getTime();
    return inquirySortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  const generalInquiries = filteredInquiries.filter(i => 
    !i.category_ar.includes('كشف راتب') && !i.category_en.includes('Payslip')
  );

  const receivedPayslips = filteredInquiries.filter(i => 
    i.category_ar.includes('كشف راتب') || i.category_en.includes('Payslip')
  );

  const handlePrintInquiryPayslip = (item: InquiryRequest) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
          <style>
            @font-face { font-family: 'GE SS Two'; src: url('/fonts/GE-SS-Two.ttf') format('truetype'); font-weight: normal; font-style: normal; }
            @font-face { font-family: 'Gotham Pro'; src: url('/fonts/Gotham-Pro.ttf') format('truetype'); font-weight: normal; font-style: normal; }
            * { font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif !important; }
          </style>
        <meta charset="utf-8">
        <title>طباعة بيان - ${item.id}</title>
        <style>
          ${sharedPrintStyles}
          body { padding: 20px; font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif, system-ui; }
          .document-content { min-height: 50vh; margin-top: 20px; }
          .header-title { font-size: 20px; font-weight: bold; margin-bottom: 5px; color: #333;text-align:center;}
          .header-meta { font-size: 12px; color: #666; margin-bottom: 30px; text-align:center;}
          .info-box { border: 2px solid #0072BC; padding: 15px; border-radius: 8px; margin-bottom: 25px; background: #f8fafc; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px; }
          .details-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
          .details-card h3 { border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; font-size: 16px; color: #0f172a; margin-top:0; }
          .notes-text { font-size: 14px; line-height: 1.8; color: #334155; white-space: pre-wrap; padding-top: 10px;}
          .footer-claims { text-align: center; margin-top: 40px; font-size: 12px; color: #64748b; padding-top: 20px; border-top: 1px dashed #cbd5e1; }
          @media print { .no-print { display: none !important; } }
        </style>
      </head>
      <body>
        <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; min-height: 90vh;">
          ${sharedPrintHeader}
          <div style="flex-grow: 1;">
            <div class="header-title">بيان كشف حالة ومسير عمليات مصغّر</div>
            <div class="header-meta">
              <p>رقم المرجع: ${item.id}</p>
              <p>تاريخ الصدور: ${item.dateCreated}</p>
            </div>

            <div class="info-box">
              <div class="info-grid">
                <div><strong>اسم الموظف:</strong> ${item.name}</div>
                <div><strong>المعرف الوظيفي:</strong> ${item.empId}</div>
                <div><strong>الوصف:</strong> ${item.details}</div>
                <div><strong>الحالة:</strong> مصادق ومعتمد رسمياً من الإدارة المالية</div>
              </div>
            </div>

            <div class="details-card">
              <h3>📊 تفاصيل الرواتب والبدلات ومسير المستحقات:</h3>
              <div class="notes-text">${item.hrNotes || 'لا توجد بيانات تفصيلية إضافية.'}</div>
            </div>

            <div class="footer-claims">
              <p>هذا الكشف الإلكتروني معتمد رسمياً ومستخرج من بنية النظام المالي الذاتي للشركة.</p>
              <p>توقيع وختم الإدارة الحسابية والمالية للمجموعة 📄</p>
              <button class="no-print" style="margin-top: 15px; padding: 8px 18px; background: #0072BC; color:white; border:none; border-radius: 4px; cursor:pointer;" onclick="window.print()">طباعة الآن</button>
            </div>
          </div>
          ${sharedPrintFooter}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  return (
    <div id="hr-selfservice-management" className="space-y-6">
      
      {/* Dual Mode View Toggle for Admin / HR Managers / Super Admin */}
      {!(user?.role === 'Employee (Inquiries)' || user?.role === 'Employee' || user?.role === 'موظف' || user?.role === 'موظف - استعلامات') && (
        <div id="self-service-view-toggle" className="flex bg-slate-100/90 p-1 rounded-2xl w-max gap-1 border border-slate-200/50">
          <button
            onClick={() => setForceViewAsEmployee(false)}
            className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all ${!forceViewAsEmployee ? 'bg-white text-[#0072BC] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            💼 {lang === 'ar' ? 'إدراة ومراجعة طلبات واستعلامات الموظفين' : 'Manage Employee Claims (Admin)'}
          </button>
          <button
            onClick={() => {
              setForceViewAsEmployee(true);
              setEmployeeActiveSection('inquiries');
            }}
            className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all ${forceViewAsEmployee ? 'bg-[#0072BC] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            👤 {lang === 'ar' ? 'ملفي الشخصي واستعلاماتي كباقي الموظفين' : 'My Personal Self-Service (ESS)'}
          </button>
        </div>
      )}
      
      {/* Dynamic welcome hero depending on role */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden bg-gradient-to-r from-sky-50 to-white text-slate-800 shadow-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-200/20 rounded-full filter blur-[60px]" />
        
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="px-3 py-1 bg-[#0072BC]/15 text-[#0072BC] rounded-full text-[10px] font-bold uppercase tracking-wider">
              {isEmployeeRole ? (lang === 'ar' ? 'بوابة الخدمة الذاتية للموظف' : 'EMPLOYEE ESS CENTRAL COCKPIT') : (lang === 'ar' ? 'إدارة استعلامات وطلبات الموظفين' : 'HR GENERAL CLAIMS CONTROL')}
            </span>
            <h3 className="text-2xl font-black mt-2 text-[#0072BC]">
              {isEmployeeRole 
                ? (lang === 'ar' ? `أهلاً بك، ${boundEmployee ? boundEmployee.arabicName : user?.username} 👋` : `Welcome, ${boundEmployee ? boundEmployee.englishName : user?.username} 👋`)
                : (lang === 'ar' ? 'صندوق استحقاقات واستعلامات الموظفين' : 'Employee Claims & Documentation Inbox')}
            </h3>
            <p className="text-[12px] text-slate-500 mt-1">
              {isEmployeeRole
                ? (lang === 'ar' ? 'قم برفع طلبات الإجازات والاستعلام عن العقد أو الراتب ومتابعة ردود الإدارة الفورية.' : 'Request letters, claim wages info, check contract renewals or apply for annual leaves.')
                : (lang === 'ar' ? 'تحقق من طلبات التعريف بالرواتب والمستندات المقدمة من الفنيين، وأرسل رابط التحميل والملاحظات بضغطة زر.' : 'Provide document download URLs and response commentaries to worker claims.')}
            </p>
          </div>
          
          <button 
            onClick={fetchInquiriesAndLeaves}
            className="p-2.5 bg-sky-50 hover:bg-sky-100 text-[#0072BC] rounded-xl transition flex items-center gap-1 text-[11px] font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{lang === 'ar' ? 'تحديث الصندوق' : 'Sync'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Row A: If Employee logged-in, they see Forms card (4 Columns) */}
        {isEmployeeRole && (
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Form A: Lift Leave Request */}
            <div className="glass-panel p-5 bg-white rounded-3xl border border-slate-100/90 shadow-sm space-y-4">
              <div className="pb-2 border-b border-slate-100">
                <h4 className="font-extrabold text-xs text-sky-800 flex items-center gap-1.5">
                  ✈️ {lang === 'ar' ? 'تقديم طلب إجازة رسمي' : 'File a leave Application'}
                </h4>
              </div>

              <form onSubmit={handleSelfLeaveSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold mb-1 block">{lang === 'ar' ? 'نوع الإجازة المطلوبة *' : 'Leave category *'}</label>
                  <select 
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg font-bold"
                  >
                    <option value="Annual">{lang === 'ar' ? 'إجازة سنوية اعتيادية' : 'Annual Paid Leave'}</option>
                    <option value="Sick">{lang === 'ar' ? 'إجازة مرضية ببيان طبي' : 'Sick Medical Leave'}</option>
                    <option value="Emergency">{lang === 'ar' ? 'إجازة طارئة للمناسبات' : 'Emergency Leave'}</option>
                    <option value="Unpaid">{lang === 'ar' ? 'إجازة بدون راتب' : 'Unpaid Leave'}</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold mb- block">{lang === 'ar' ? 'من تاريخ *' : 'From Date *'}</label>
                    <input 
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-lg text-[#0072BC] font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold mb- block">{lang === 'ar' ? 'إلى تاريخ *' : 'To Date *'}</label>
                    <input 
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-lg text-[#0072BC] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold mb-1 block">{lang === 'ar' ? 'ملاحظة وتبرير الطلب *' : 'Provide Reason *'}</label>
                  <textarea 
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثلاً: خطة السفر لقضاء تصفية الإجازة السنوية بالخارج...' : 'e.g., traveling home for annual flight reservation...'}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg"
                    rows={2}
                  />
                </div>

                {leaveError && (
                  <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg text-[10px]">
                    ⚠️ {leaveError}
                  </div>
                )}

                {leaveSuccess && (
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px]">
                    ✅ {leaveSuccess}
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full py-2 bg-[#0072BC] text-white rounded-lg font-bold hover:bg-sky-700 transition"
                >
                  🚀 {lang === 'ar' ? 'رفع الطلب للإدارة' : 'Send for HR Approval'}
                </button>
              </form>
            </div>

            {/* Form B: Submit Inquiry / Request Doc */}
            <div className="glass-panel p-5 bg-white rounded-3xl border border-slate-100/90 shadow-sm space-y-4">
              <div className="pb-2 border-b border-slate-100">
                <h4 className="font-extrabold text-xs text-sky-800 flex items-center gap-1.5">
                  ✏️ {lang === 'ar' ? 'رفع طلب استعلام أو مستند وثائق' : 'Request Inquiry or Document'}
                </h4>
              </div>

              <form onSubmit={handleInquirySubmit} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">{lang === 'ar' ? 'نوع الاستعلام المطلوب *' : 'Inquiry Category *'}</label>
                  <select
                    value={inquiryCategory}
                    onChange={(e) => setInquiryCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg font-bold"
                  >
                    <option value="Contract Expiry Status">{lang === 'ar' ? 'حالة العقد ورخص العمل والاقامة' : 'Contract / Iqama Status'}</option>
                    <option value="Salary Distribution">{lang === 'ar' ? 'تفاصيل الرواتب وتوزيع المستحقات' : 'Salary Distribution Detail'}</option>
                    <option value="Working Hours">{lang === 'ar' ? 'ساعات العمل الرسمية والورديات' : 'Working Hours / Shifts'}</option>
                    <option value="Job Title / Grade">{lang === 'ar' ? 'المسمى الوظيفي والترقية الحالية' : 'Job Title / Category'}</option>
                    <option value="Salary Proof">{lang === 'ar' ? 'طلب مستند: تعريف رسمي بالراتب' : 'Request: Certified Payslip Proof'}</option>
                    <option value="Experience Certificate">{lang === 'ar' ? 'طلب مستند: شهادة خبرة رسمية' : 'Request: Experience Certificate'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">{lang === 'ar' ? 'التفاصيل الاستفسارية المطلوبة *' : 'Detailed Notes *'}</label>
                  <textarea
                    rows={3}
                    placeholder={lang === 'ar' ? 'أكتب هنا التفاصيل أو وجهتك المطلوبة للمستند...' : 'Detail here your inquiries or destination of the required paper...'}
                    value={inquiryDetails}
                    onChange={(e) => setInquiryDetails(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg"
                  />
                </div>

                {submitError && (
                  <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg text-[10px]">
                    ⚠️ {submitError}
                  </div>
                )}

                {submitSuccess && (
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px]">
                    ✅ {submitSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition flex items-center justify-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'تأكيد إرسال الطلب' : 'Send inquiry'}</span>
                </button>
              </form>
            </div>

          </div>
        )}

        {/* Column B: Claims / Inquiries inbox (Main area 8 or 12 Columns depending on view) */}
        <div className={isEmployeeRole ? "lg:col-span-8 flex flex-col gap-6" : "lg:col-span-12 flex flex-col gap-6"}>
          
          {/* List of claims */}
          <div className="glass-panel p-6 bg-white rounded-3xl border border-slate-100/90 shadow-sm space-y-4">
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
              <ClipboardList className="w-4.5 h-4.5 text-[#0072BC]" />
              {isEmployeeRole ? (lang === 'ar' ? 'حالة طلباتك واستعلاماتك السابقة' : 'Status of Your Requests') : (lang === 'ar' ? 'صندوق استعلامات الموظفين وطلبات الأوراق' : 'Worker Requests & Claims Pipeline')}
            </h4>

            {resolvingId && (
              <form onSubmit={handleResolveInquiry} className="p-4 bg-slate-50 border rounded-2xl space-y-3 mb-4 text-xs">
                <p className="font-bold text-[#0072BC]">✍️ {lang === 'ar' ? 'الرد وإرسال رد الموارد والإنتاج:' : 'Draft Response Content:'}</p>
                
                <div>
                  <label className="text-[10px] text-slate-400 font-bold mb-1 block">
                    {lang === 'ar' ? 'أكتب الرد نصياً وقم بإدراج رابط تحميل المستند إن وجد:' : 'Enter notes and provide document links if applicable:'}
                  </label>
                  <textarea 
                    value={hrNotes}
                    onChange={(e) => setHrNotes(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: تم إعداد خطاب تَعريف الراتب. رابط التحميل: https://shared.alwaleed-erp.com/salary-kamel.pdf' : 'e.g., salary paper prepared. Attached retrieval link: https://...'}
                    required
                    rows={3}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs"
                  />
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold">
                    {lang === 'ar' ? 'تأكيد وإرسال الرد' : 'Submit Response'}
                  </button>
                  <button type="button" onClick={() => setResolvingId(null)} className="px-3 py-1.5 bg-slate-200 rounded-xl">
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>
            )}

            {/* IF NOT EMPLOYEE ROLE (HR ADMIN PORTAL VIEW) */}
            {!isEmployeeRole ? (
              <div className="space-y-4">
                {/* Advanced Filters */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold text-slate-600" dir="rtl">
                  <div>
                    <label className="block mb-1">{lang === 'ar' ? 'بحث باسم الموظف:' : 'Search by Name:'}</label>
                    <input 
                      type="text" 
                      value={inquiryNameFilter}
                      onChange={e => setInquiryNameFilter(e.target.value)}
                      placeholder={lang === 'ar' ? 'اكتب اسم الموظف...' : 'Enter name...'}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">{lang === 'ar' ? 'بحث بالتاريخ:' : 'Search by Date:'}</label>
                    <input 
                      type="date" 
                      value={inquiryDateFilter}
                      onChange={e => setInquiryDateFilter(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">{lang === 'ar' ? 'ترتيب حسب (الأحدث/الأقدم):' : 'Sort By:'}</label>
                    <select 
                      value={inquirySortOrder}
                      onChange={(e: any) => setInquirySortOrder(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl"
                    >
                      <option value="desc">{lang === 'ar' ? 'من الأحدث إلى الأقدم' : 'Newest to Oldest'}</option>
                      <option value="asc">{lang === 'ar' ? 'من الأقدم إلى الأحدث' : 'Oldest to Newest'}</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                <table className="w-full text-xs text-right whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold bg-slate-50">
                      <th className="py-2.5 px-2 text-right">{lang === 'ar' ? 'رقم ووظيفة الفني' : 'ID & Worker'}</th>
                      <th className="py-2.5 px-2 text-right">{lang === 'ar' ? 'نوع وتصنيف الاستعلام' : 'Category'}</th>
                      <th className="py-2.5 px-2 text-right">{lang === 'ar' ? 'الاستفسار والطلب بالتفصيل' : 'Inquiry Details'}</th>
                      <th className="py-2.5 px-2 text-center">{lang === 'ar' ? 'تاريخ الرفع' : 'Date Filed'}</th>
                      <th className="py-2.5 px-2 text-center">{lang === 'ar' ? 'الحالة والأجوبة' : 'Resolution / Notes'}</th>
                      <th className="py-2.5 px-2 text-center">{lang === 'ar' ? 'إجراءات' : 'Command'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInquiries.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          {lang === 'ar' ? 'لا توجد طلبات استعلام مسجلة حالياً.' : 'No claims found in pipeline.'}
                        </td>
                      </tr>
                    )}
                    {filteredInquiries.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50 text-slate-600">
                        <td className="py-3 px-2">
                          <p className="font-bold text-slate-800">{item.name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{item.empId}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold">
                            {lang === 'ar' ? item.category_ar : item.category_en}
                          </span>
                        </td>
                        <td className="py-3 px-2 max-w-sm whitespace-normal">
                          <p className="font-medium text-slate-700">{item.details}</p>
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-bold text-[#0072BC]">{item.dateCreated}</td>
                        <td className="py-3 px-2 text-right max-w-xs whitespace-normal">
                          <div className="flex flex-col items-start gap-1">
                            <span className={`px-2 py-0.5 text-[9px] rounded-full font-black ${
                              item.status === 'PENDING' ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {item.status === 'PENDING' ? (lang === 'ar' ? 'قيد المعالجة الإدارية ⏱️' : 'Under Review') : (lang === 'ar' ? 'تم الرد بنجاح ✓' : 'Answered ✓')}
                            </span>
                            
                            {item.hrNotes ? (
                              <div className="p-2 bg-sky-50 border border-sky-100 rounded-xl text-[10px] text-slate-600 mt-1 max-w-xs font-bold leading-relaxed shadow-sm">
                                <p className="text-sky-800 font-black mb-0.5">💬 {lang === 'ar' ? 'رد شؤون الموظفين:' : 'HR response notes:'}</p>
                                {item.hrNotes.includes('http') ? (
                                        <>
                                          <p>{item.hrNotes.split('http')[0]}</p>
                                          <a 
                                            href={'http' + item.hrNotes.split('http').slice(1).join('http')} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="mt-1 inline-flex items-center gap-1 p-1.5 px-3 bg-[#0072BC] text-white rounded text-[10px] font-black hover:brightness-105"
                                          >
                                            📥 {lang === 'ar' ? 'فتح المرفق وإظهاره' : 'Open document'}
                                          </a>
                                        </>
                                      ) : (
                                  <p>{item.hrNotes}</p>
                                )}
                              </div>
                            ) : (
                              <p className="text-[10px] italic text-slate-400">{lang === 'ar' ? 'لا يوجد تعليق إداري مضاف بعد.' : 'No feedback comment attached.'}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          {item.status === 'PENDING' ? (
                            <button
                              onClick={() => {
                                setResolvingId(item.id);
                                setHrNotes(lang === 'ar' ? 'تم معالجة الطلب بخصوص... الرابط المرفق: ' : 'Processed as requested. URL attach: ');
                              }}
                              className="px-2.5 py-1.5 bg-[#0072BC] hover:bg-sky-700 text-white rounded-lg text-[10px] font-bold"
                            >
                              ✍️ {lang === 'ar' ? 'الرد الكلي' : 'Solve claim'}
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">---</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>
            ) : (
              /* IS EMPLOYEE ROLE (PORTAL ENHANCED COCKPIT VIEW) */
              <div className="space-y-6 text-right" dir="rtl">
                
                {/* Segmented Internal Navigation Tabs */}
                <div className="flex border-b border-slate-100 gap-1 overflow-x-auto pb-1" id="employee-dashboard-internal-tabs">
                  <button
                    onClick={() => setEmployeeActiveSection('inquiries')}
                    className={`px-4 py-2.5 rounded-t-xl text-xs font-black transition-all ${
                      employeeActiveSection === 'inquiries'
                        ? 'bg-[#0072BC] text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    💬 {lang === 'ar' ? 'الاستعلامات والخطابات' : 'Inquiries & Letters'}
                  </button>
                  <button
                    onClick={() => setEmployeeActiveSection('leaves')}
                    className={`px-4 py-2.5 rounded-t-xl text-xs font-black transition-all ${
                      employeeActiveSection === 'leaves'
                        ? 'bg-[#0072BC] text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    🌴 {lang === 'ar' ? 'سجل الإجازات' : 'My Leaves'}
                  </button>
                  <button
                    onClick={() => setEmployeeActiveSection('payroll')}
                    className={`px-4 py-2.5 rounded-t-xl text-xs font-black transition-all ${
                      employeeActiveSection === 'payroll'
                        ? 'bg-[#0072BC] text-white shadow-sm font-black'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    💵 {lang === 'ar' ? 'مسير الرواتب الخاص بي' : 'My Payroll / Payslips'}
                  </button>
                  <button
                    onClick={() => setEmployeeActiveSection('deductions')}
                    className={`px-4 py-2.5 rounded-t-xl text-xs font-black transition-all ${
                      employeeActiveSection === 'deductions'
                        ? 'bg-red-600 text-white shadow-sm font-black'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    📉 {lang === 'ar' ? 'الخصومات المقررة ⚠️' : 'Assessed Deductions ⚠️'}
                  </button>
                </div>

                {/* Tab Group 1: Inquiries & Received Letters */}
                {employeeActiveSection === 'inquiries' && (
                  <div className="space-y-3" id="employee-inquiries-tab">
                    <h5 className="font-extrabold text-[#0072BC] text-xs pb-1 border-b flex items-center gap-1">
                      💬 {lang === 'ar' ? 'استعلاماتك الإدارية وخطابات التعريف الصادرة:' : 'Your Administrative Claims & Inquiries:'}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {generalInquiries.length === 0 ? (
                        <p className="text-slate-400 text-xs italic py-4 col-span-2 text-center">{lang === 'ar' ? 'لم تقم برفع أي استعلامات بعد.' : 'No inquiries filed yet.'}</p>
                      ) : (
                        generalInquiries.map(item => (
                          <div key={item.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 hover:shadow-sm transition">
                            <div className="flex justify-between items-center text-[10px] border-b pb-1">
                              <span className="px-2 py-0.5 bg-blue-100/60 text-[#0072BC] rounded-full font-black">
                                {lang === 'ar' ? item.category_ar : item.category_en}
                              </span>
                              <span className="text-slate-400 font-mono">{item.dateCreated}</span>
                            </div>
                            
                            <p className="text-xs font-semibold text-slate-700">“{item.details}”</p>
                            
                            <div className="pt-2 text-right">
                              {item.status === 'PENDING' ? (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-1 rounded-lg">
                                  ⏱️ {lang === 'ar' ? 'قيد المراجعة الإدارية والرد قريباً' : 'Pending review'}
                                </span>
                              ) : (
                                <div className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1">
                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black block w-max">
                                    ✓ {lang === 'ar' ? 'تم الرد المباشر' : 'Answered'}
                                  </span>
                                  {item.hrNotes && (
                                    <div className="text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed mt-1">
                                      {item.hrNotes.includes('http') ? (
                                        <>
                                          <p>{item.hrNotes.split('http')[0]}</p>
                                          <a 
                                            href={'http' + item.hrNotes.split('http')[1]} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="mt-1 inline-flex items-center gap-1 p-1.5 px-3 bg-[#0072BC] text-white rounded text-[10px] font-black hover:brightness-105"
                                          >
                                            📥 {lang === 'ar' ? 'تحميل ومراجعة المستند المرفق' : 'Download document'}
                                          </a>
                                        </>
                                      ) : (
                                        <p>{item.hrNotes}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Tab Group 2: My Leave Requests (الصادرة والواردة ببيان حقيقي) */}
                {employeeActiveSection === 'leaves' && (
                  <div className="space-y-3" id="employee-leaves-tab">
                    <h5 className="font-extrabold text-[#0072BC] text-xs pb-1 border-b flex items-center gap-1">
                      🌴 {lang === 'ar' ? 'سجل طلبات الإجازات (سواء رفعتها أنت أو أدخلتها الإدارة لك):' : 'Your Leave Requests (Self-Submitted & HR-Administered Logs):'}
                    </h5>
                    
                    <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100">
                      <table className="w-full text-xs text-right whitespace-nowrap">
                        <thead>
                          <tr className="border-b bg-slate-50 text-slate-400 font-bold">
                            <th className="p-2.5">{lang === 'ar' ? 'رقم السجل' : 'Leave ID'}</th>
                            <th className="p-2.5">{lang === 'ar' ? 'النوع' : 'Category'}</th>
                            <th className="p-2.5">{lang === 'ar' ? 'المدة والتواريخ' : 'Duration & Dates'}</th>
                            <th className="p-2.5">{lang === 'ar' ? 'مصدر الرفع' : 'Origin'}</th>
                            <th className="p-2.5">{lang === 'ar' ? 'السبب والبيان' : 'Context Reason'}</th>
                            <th className="p-2.5 text-center">{lang === 'ar' ? 'الحالة مع الإفادة' : 'Status & reply'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leavesList.filter(l => 
                            l.empId === boundEmployeeId || 
                            (boundEmployee && (l.name === boundEmployee.arabicName || l.name === boundEmployee.englishName))
                          ).length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                                {lang === 'ar' ? 'لا تتوفر أي طلبات إجازة مرتبطة باسمك حالياً.' : 'No leave requests on file.'}
                              </td>
                            </tr>
                          ) : (
                            leavesList.filter(l => 
                              l.empId === boundEmployeeId || 
                              (boundEmployee && (l.name === boundEmployee.arabicName || l.name === boundEmployee.englishName))
                            ).map((leave) => (
                              <tr key={leave.id} className="border-b border-slate-50 hover:bg-slate-50/50 text-slate-600">
                                <td className="p-2.5 font-mono font-bold text-indigo-700">{leave.id}</td>
                                <td className="p-2.5">
                                  <span className="px-2 py-0.5 bg-sky-50 text-sky-800 rounded font-black text-[10px]">
                                    {lang === 'ar' ? leave.type_ar : leave.type_en}
                                  </span>
                                </td>
                                <td className="p-2.5">
                                  <p className="font-bold text-slate-800">{leave.durationDays} يوم</p>
                                  <span className="text-[9px] text-slate-400 font-mono block">({leave.startDate} → {leave.endDate})</span>
                                </td>
                                <td className="p-2.5 font-semibold">
                                  {leave.submissionType === 'self' ? (
                                    <span className="text-blue-600">👤 {lang === 'ar' ? 'طلب شخصي' : 'Self Service'}</span>
                                  ) : (
                                    <span className="text-amber-600">🏢 {lang === 'ar' ? 'مسجل بواسطة الإدارة / HR' : 'Entered by HR Admin'}</span>
                                  )}
                                </td>
                                <td className="p-2.5 max-w-xs whitespace-normal truncate text-[10px] text-slate-500">
                                  "{leave.reason || '---'}"
                                </td>
                                <td className="p-2.5 text-center">
                                  <span className={`px-2 py-1 text-[9px] rounded-full font-black italic block w-max mx-auto ${
                                    leave.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                                    leave.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800 animate-pulse'
                                  }`}>
                                    {leave.status === 'APPROVED' ? (lang === 'ar' ? 'تمت الموافقة والاعتماد ✓' : 'Approved ✓') :
                                     leave.status === 'REJECTED' ? (lang === 'ar' ? 'تم الرفض والاعتذار' : 'Rejected') :
                                     (lang === 'ar' ? 'قيد مراجعة الموارد البشرية ⏱️' : 'Under Review')}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab Group 3: My Officially Received Monthly Payslips */}
                {employeeActiveSection === 'payroll' && (
                  <div className="space-y-3" id="employee-payroll-tab">
                    <h5 className="font-extrabold text-[#0072BC] text-xs pb-1 flex items-center gap-1.5">
                      💵 {lang === 'ar' ? 'كشوف الرواتب الشهرية الرسمية المستلمة (مسير الرواتب المعتمد):' : 'Officially Certified Monthly Payslips:'}
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {receivedPayslips.length === 0 ? (
                        <p className="text-slate-400 text-xs italic py-6 col-span-2 text-center">
                          {lang === 'ar' ? 'لم يتم إرسال أي كشوف رواتب لك حتى الآن.' : 'No monthly payslips issued on file.'}
                        </p>
                      ) : (
                        receivedPayslips.map(item => (
                          <div key={item.id} className="p-4 bg-gradient-to-br from-emerald-50/40 to-white border border-emerald-100 rounded-3xl space-y-3 shadow-sm hover:shadow transition relative overflow-hidden text-right">
                            <div className="absolute top-0 left-0 bg-emerald-600 text-white font-mono text-[9px] px-2 py-0.5 rounded-br-lg font-black uppercase">
                              WPS CERTIFIED
                            </div>
                            
                            <div className="flex justify-between items-center text-[10px] border-b border-emerald-100/60 pb-1.5 pt-1">
                              <span className="font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                💵 {lang === 'ar' ? item.category_ar : item.category_en}
                              </span>
                              <span className="text-slate-400 font-mono font-bold">{item.dateCreated}</span>
                            </div>

                            <p className="text-xs font-bold text-slate-800">
                              {lang === 'ar' ? 'مسير الرواتب المعتمد والمثبت في كشوف الإدارة' : 'June Monthly Certified Wages Certificate'}
                            </p>

                            <div className="bg-white border border-emerald-50 p-2.5 rounded-2xl">
                              <pre className="text-[11px] text-slate-600 font-mono whitespace-pre-wrap leading-relaxed">
                                {item.hrNotes}
                              </pre>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                              <span className="text-[9px] text-[#0072BC] font-mono">ID: {item.id}</span>
                              <button
                                onClick={() => handlePrintInquiryPayslip(item)}
                                className="px-3.5 py-1.5 bg-[#0072BC] hover:bg-[#0072BC]/95 text-white rounded-xl text-[10px] font-black transition flex items-center gap-1"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>{lang === 'ar' ? 'طـبـاعـة كـشـف الـراتـب 🖨️ / تصدير PDF' : 'Print Payslip 🖨️ / PDF'}</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Tab Group 4: Assessed Deductions */}
                {employeeActiveSection === 'deductions' && (
                  <div className="space-y-3 font-semibold pb-6 text-right" id="employee-deductions-tab">
                    <h5 className="font-extrabold text-red-600 text-xs pb-1 border-b flex items-center gap-1.5">
                      📉 {lang === 'ar' ? 'الخصومات والجزاءات المالية الصادرة بحقك:' : 'Your Official Financial Deductions & Penalties:'}
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {deductions.filter(d => d.employeeId === boundEmployeeId && d.status === 'notified').length === 0 ? (
                        <p className="text-slate-400 text-xs italic py-8 col-span-2 text-center bg-slate-50/50 border border-dashed rounded-3xl">
                          {lang === 'ar' ? 'لا توجد أي خصومات أو جزاءات مالية معلنة مقيدة بحقك حالياً.' : 'No declared active deductions on your profile.'}
                        </p>
                      ) : (
                        deductions.filter(d => d.employeeId === boundEmployeeId && d.status === 'notified').map((item: any) => (
                          <div key={item.id} className="p-5 bg-gradient-to-br from-red-50/40 to-white border border-red-100/90 rounded-3xl space-y-3.5 hover:shadow-md transition relative overflow-hidden text-right shadow-sm">
                            <div className="absolute top-0 left-0 bg-red-600 text-white font-mono text-[8px] px-2.5 py-1 rounded-br-2xl font-black uppercase">
                              NOTICE
                            </div>
                            
                            <div className="flex justify-between items-center text-[10px] border-b border-red-100/60 pb-2 pt-1">
                              <span className="font-extrabold text-red-800 bg-red-100/80 px-2.5 py-0.5 rounded-full">
                                ⚠️ نوع الخصم: {item.type}
                              </span>
                              <span className="text-slate-400 font-mono font-bold">{item.date}</span>
                            </div>

                            <div className="space-y-1.5">
                              <p className="text-xs font-black text-red-600">
                                {lang === 'ar' ? `مبلغ الاستقطاع المالي: -${item.amount} ريال سعودي` : `Deducted amount: -${item.amount} SAR`}
                              </p>
                              {item.reason && (
                                <p className="text-[11px] text-slate-600 font-bold leading-relaxed bg-red-50/20 p-2.5 rounded-xl border border-red-50/60">
                                  {lang === 'ar' ? `السبب الموجز والمستند القانوني: ${item.reason}` : `Reason & context: ${item.reason}`}
                                </p>
                              )}
                            </div>

                            <div className="text-[9px] text-slate-400 text-left font-mono pt-1 border-t border-slate-50">
                              REF_NO: {item.id} | ISSUED_BY: HR_DEPT_WPS
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
