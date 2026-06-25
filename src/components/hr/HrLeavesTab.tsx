import React, { useState, useEffect } from 'react';
import { Calendar, PlusCircle, Check, X, ShieldAlert, FileText, UserPlus, Send, RefreshCw } from 'lucide-react';
import { Employee, User } from '../../types';

interface LeaveRequest {
  id: string;
  empId: string;
  name: string;
  type_ar: string;
  type_en: string;
  durationDays: number;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submissionType: 'self' | 'hr';
}

interface HrLeavesTabProps {
  lang: 'ar' | 'en';
  employees: Employee[];
  user?: User | null;
  onUpdateEmployeeFields?: (empId: string, updatedFields: Partial<Employee>) => void;
}

interface VacationBalanceInputProps {
  empId: string;
  field: 'vacationBalance' | 'vacationUsed' | 'sickUsed';
  initialValue: number;
  onSave: (empId: string, updatedFields: Partial<Employee>) => void;
  lang: 'ar' | 'en';
}

function VacationBalanceInput({ empId, field, initialValue, onSave, lang }: VacationBalanceInputProps) {
  const [val, setVal] = useState<number>(initialValue);
  const [saved, setSaved] = useState(false);

  // Sync with initialValue if it changes from outside
  useEffect(() => {
    setVal(initialValue);
  }, [initialValue]);

  const handleBlurOrSave = () => {
    if (val !== initialValue) {
      onSave(empId, { [field]: val });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="flex items-center justify-center gap-1.5" id={`balance-input-container-${empId}-${field}`}>
      <input
        id={`balance-input-field-${empId}-${field}`}
        type="number"
        value={val}
        onChange={(e) => setVal(Number(e.target.value))}
        onBlur={handleBlurOrSave}
        className={`w-16 px-1 py-1 text-center bg-stone-50 border rounded-lg font-bold transition-all ${
          saved
            ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
            : 'border-slate-200 text-slate-700 focus:border-[#0072BC] focus:bg-white focus:ring-1 focus:ring-[#0072BC]'
        }`}
        title={lang === 'ar' ? 'اضغط خارج الخانة أو اضغط حفظ لتأكيد التغيير' : 'Click outside or click save to confirm change'}
      />
      <button
        id={`balance-save-btn-${empId}-${field}`}
        type="button"
        onClick={handleBlurOrSave}
        className={`p-1 rounded-lg border transition ${
          saved
            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500 hover:text-[#0072BC] cursor-pointer'
        }`}
        title={lang === 'ar' ? 'حفظ التعديل' : 'Save adjustment'}
      >
        {saved ? '✔️' : '💾'}
      </button>
    </div>
  );
}

export default function HrLeavesTab({ lang, employees, user, onUpdateEmployeeFields }: HrLeavesTabProps) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // HR-Initiated form states
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [leaveType, setLeaveType] = useState('Annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Accruals simulation context
  const [accrualMonths, setAccrualMonths] = useState(0);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/leaves');
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error('Error fetching leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleResolveLeave = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/leaves/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action })
      });
      if (res.ok) {
        fetchLeaves();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleHrSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!selectedEmpId || !startDate || !endDate || !reason) {
      setFormError(lang === 'ar' ? 'الرجاء تعبئة كافة الحقول المطلوبة واختيار موظف.' : 'Please fill all fields and select an employee.');
      return;
    }

    const emp = employees.find(e => e.id === selectedEmpId);
    if (!emp) return;

    // Calculate duration in days
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      setFormError(lang === 'ar' ? 'تاريخ النهاية لا يمكن أن يكون قبل تاريخ البداية.' : 'End date cannot precede start date.');
      return;
    }
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Build bilingual type label
    let type_ar = 'سنوية';
    let type_en = 'Annual';
    if (leaveType === 'Sick') { type_ar = 'مرضية'; type_en = 'Sick'; }
    else if (leaveType === 'Emergency') { type_ar = 'طارئة'; type_en = 'Emergency'; }
    else if (leaveType === 'Unpaid') { type_ar = 'بدون راتب'; type_en = 'Unpaid'; }
    else if (leaveType === 'Marriage') { type_ar = 'زواج'; type_en = 'Marriage'; }
    else if (leaveType === 'Death') { type_ar = 'وفاة'; type_en = 'Death'; }

    const payload = {
      empId: selectedEmpId,
      name: lang === 'ar' ? emp.arabicName : emp.englishName,
      type_ar,
      type_en,
      durationDays,
      startDate,
      endDate,
      reason,
      status: 'PENDING',
      submissionType: 'hr'
    };

    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setFormSuccess(lang === 'ar' ? 'تم تسجيل الإجازة بنجاح!' : 'Leave request registered successfully!');
        setSelectedEmpId('');
        setStartDate('');
        setEndDate('');
        setReason('');
        fetchLeaves();
      } else {
        setFormError('Failed to register leave on server.');
      }
    } catch (err) {
      console.error(err);
      setFormError('Connection error.');
    }
  };

  const isAllowedToEdit = 
    !!user && (
      user.role === 'Super Admin' || 
      user.username === 'FERAS' || 
      user.role === 'Senior Management' || 
      user.role === 'الادارة العليا' || 
      user.role === 'HR Manager' || 
      user.role === 'HR' || 
      user.role === 'موارد بشرية' || 
      user.role === 'Admin' || 
      user.role === 'إداري'
    );

  const calculateBalances = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    // Basic settings: 30 days standard annual allowance or custom
    const annualBalance = emp?.vacationBalance !== undefined ? Number(emp.vacationBalance) : 30;
    
    // Default calculated values from requests if no custom value is stored directly
    const computedAnnualUsed = requests
      .filter(r => r.empId === empId && r.status === 'APPROVED' && r.type_en === 'Annual')
      .reduce((sum, r) => sum + r.durationDays, 0);

    const computedSickUsed = requests
      .filter(r => r.empId === empId && r.status === 'APPROVED' && r.type_en === 'Sick')
      .reduce((sum, r) => sum + r.durationDays, 0);

    const emergencyUsed = requests
      .filter(r => r.empId === empId && r.status === 'APPROVED' && r.type_en === 'Emergency')
      .reduce((sum, r) => sum + r.durationDays, 0);

    const finalAnnual = annualBalance + (accrualMonths * 2.5);
    const finalAnnualUsed = emp?.vacationUsed !== undefined ? Number(emp.vacationUsed) : computedAnnualUsed;
    const finalSickUsed = emp?.sickUsed !== undefined ? Number(emp.sickUsed) : computedSickUsed;

    return {
      annual: finalAnnual,
      annualUsed: finalAnnualUsed,
      remaining: finalAnnual - finalAnnualUsed,
      sickUsed: finalSickUsed,
      emergencyUsed
    };
  };

  return (
    <div id="hr-leaves-management" className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/50 space-y-6">
      
      {/* Header title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-4">
        <div>
          <h4 className="text-sm font-black text-[#0072BC] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#00AEEF]" />
            {lang === 'ar' ? '🌴 إدارة وأرصدة إجازات الموظفين' : 'Vacation Accruals & Leave Auditing Track'}
          </h4>
          <p className="text-[11px] text-slate-400 mt-1">
            {lang === 'ar' ? 'كشوف الأرصدة التراكمية، الإجازات المرضية والطارئة، وتقديم طلبات الإجازة من قبل الإدارة.' : 'Simulate custom monthly accruals increments and review pipeline absences'}
          </p>
        </div>

        <div className="flex gap-2">
          {/* Simulated accruals incremental addition */}
          <button 
            onClick={() => setAccrualMonths(p => p + 1)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black flex items-center gap-1 shrink-0 transition"
          >
            ⏱️ {lang === 'ar' ? 'تراكم بمعدل ٢.٥ يوم شهرياً' : 'Simulate 2.5d Accrual Month'}
          </button>
          
          <button 
            onClick={fetchLeaves}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side Column: Leave Balances Table (8 Columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Leave Balances Grid */}
          <div className="glass-panel p-5 bg-white rounded-3xl border border-slate-100/85">
            <h5 className="font-extrabold text-sm text-[#0072BC] mb-4">
              🌴 {lang === 'ar' ? 'رصيد ومُستحقات الإجازات القانونية' : 'Annual Vacation Balances Inventory'}
            </h5>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold bg-slate-50/50">
                    <th className="py-2.5 px-2 text-right">{lang === 'ar' ? 'الموظف' : 'Employee'}</th>
                    <th className="py-2.5 px-2 text-center">{lang === 'ar' ? 'الرصيد السنوي' : 'Annual Balance'}</th>
                    <th className="py-2.5 px-2 text-center">{lang === 'ar' ? 'المستهلك' : 'Used'}</th>
                    <th className="py-2.5 px-2 text-center text-teal-600">{lang === 'ar' ? 'المتبقي الحالي' : 'Remaining'}</th>
                    <th className="py-2.5 px-2 text-center text-amber-600">{lang === 'ar' ? 'غياب مرضي' : 'Sick Leaves'}</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => {
                    const bal = calculateBalances(emp.id);
                    return (
                      <tr key={emp.id} className="border-b border-stone-100 hover:bg-stone-50/40 font-medium text-slate-700">
                        <td className="py-2.5 px-2">
                          <p className="font-bold">{lang === 'ar' ? emp.arabicName : emp.englishName}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{emp.id} - {emp.jobTitle}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-slate-500">
                          {isAllowedToEdit ? (
                            <VacationBalanceInput
                              empId={emp.id}
                              field="vacationBalance"
                              initialValue={emp.vacationBalance !== undefined ? emp.vacationBalance : 30}
                              onSave={(id, updated) => onUpdateEmployeeFields?.(id, updated)}
                              lang={lang}
                            />
                          ) : (
                            <span>{bal.annual} {lang === 'ar' ? 'يوم' : 'days'}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-rose-500">
                          {isAllowedToEdit ? (
                            <VacationBalanceInput
                              empId={emp.id}
                              field="vacationUsed"
                              initialValue={bal.annualUsed}
                              onSave={(id, updated) => onUpdateEmployeeFields?.(id, updated)}
                              lang={lang}
                            />
                          ) : (
                            <span>{bal.annualUsed} {lang === 'ar' ? 'يوم' : 'days'}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-teal-600 bg-teal-50/30">
                          <span className="px-2 py-1 rounded bg-teal-50 text-teal-700 font-extrabold font-mono">
                            {bal.remaining} {lang === 'ar' ? 'يوم' : 'days'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-600">
                          {isAllowedToEdit ? (
                            <VacationBalanceInput
                              empId={emp.id}
                              field="sickUsed"
                              initialValue={bal.sickUsed}
                              onSave={(id, updated) => onUpdateEmployeeFields?.(id, updated)}
                              lang={lang}
                            />
                          ) : (
                            <span>{bal.sickUsed} {lang === 'ar' ? 'أيام' : 'days'}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leave Requests Ledger list */}
          <div className="glass-panel p-5 bg-white rounded-3xl border border-slate-100/85">
            <h5 className="font-extrabold text-sm text-slate-800 mb-4">
              📑 {lang === 'ar' ? 'طلبات الإجازات النشطة وقيد المراجعة' : 'Leave Application Audit Pipeline'}
            </h5>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold bg-slate-50">
                    <th className="py-2.5 px-2 text-right">{lang === 'ar' ? 'اسم الموظف' : 'Employee Name'}</th>
                    <th className="py-2.5 px-2 text-right">{lang === 'ar' ? 'نوع الإجازة' : 'Leave Type'}</th>
                    <th className="py-2.5 px-2 text-center">{lang === 'ar' ? 'من تاريخ' : 'Start Date'}</th>
                    <th className="py-2.5 px-2 text-center">{lang === 'ar' ? 'إلى تاريخ' : 'End Date'}</th>
                    <th className="py-2.5 px-2 text-center">{lang === 'ar' ? 'الأيام' : 'Days'}</th>
                    <th className="py-2.5 px-2 text-right">{lang === 'ar' ? 'السبب والتقديم' : 'Reason / Creator'}</th>
                    <th className="py-2.5 px-2 text-center">{lang === 'ar' ? 'حالة الطلب' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        {lang === 'ar' ? 'لا توجد طلبات إجازة مضافة في السيرفر حالياً.' : 'No active leave requests found.'}
                      </td>
                    </tr>
                  )}
                  {requests.map((req) => (
                    <tr key={req.id} className="border-b border-stone-100 hover:bg-stone-50/40 text-slate-600">
                      <td className="py-3 px-2 font-bold text-slate-800">{req.name}</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-1 bg-sky-50 text-[#0072BC] rounded-lg text-[10px] font-bold">
                          {lang === 'ar' ? req.type_ar : req.type_en}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-[#0072BC] font-semibold">{req.startDate}</td>
                      <td className="py-3 px-2 text-center font-mono text-[#0072BC] font-semibold">{req.endDate}</td>
                      <td className="py-3 px-2 text-center font-bold text-slate-800">{req.durationDays} {lang === 'ar' ? 'يوم' : 'days'}</td>
                      <td className="py-3 px-2 text-right max-w-xs truncate">
                        <p className="font-medium text-slate-700">{req.reason}</p>
                        <span className="text-[10px] text-slate-400 block font-semibold">
                          {req.submissionType === 'hr' ? (
                            <span className="text-amber-600 font-bold">🧑‍💼 {lang === 'ar' ? 'مرفوع من الإدارة' : 'HR Execulated'}</span>
                          ) : (
                            <span className="text-teal-600 font-bold">👤 {lang === 'ar' ? 'مرفوع من الخدمة الذاتية' : 'ESS Portal'}</span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className={`px-2 py-1 text-[10px] rounded-lg font-black uppercase inline-block ${
                            (req.status === 'PENDING' || !req.status) ? 'bg-amber-100 text-amber-800' :
                            req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {(req.status === 'PENDING' || !req.status) ? (lang === 'ar' ? 'قيد المراجعة' : 'Pending') :
                             req.status === 'APPROVED' ? (lang === 'ar' ? 'مقبولة' : 'Accepted') :
                             (lang === 'ar' ? 'مرفوضة' : 'Rejected')}
                          </span>
                          
                          {(req.status === 'PENDING' || !req.status) && (
                            <div className="flex gap-1 mt-1">
                              <button 
                                onClick={() => handleResolveLeave(req.id, 'APPROVED')}
                                className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
                                title="Approve Request"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleResolveLeave(req.id, 'REJECTED')}
                                className="p-1.5 bg-rose-600 text-white rounded hover:bg-rose-700 transition"
                                title="Reject Request"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side Column: Submit Leave Request Form (HR-Initiated) (4 Columns) */}
        <div className="lg:col-span-4 bg-white border border-slate-100 rounded-3xl p-5 shadow-lg space-y-4 text-xs font-semibold">
          <div className="pb-2 border-b border-slate-100">
            <h5 className="font-extrabold text-sm text-slate-800">
              ✈️ {lang === 'ar' ? 'إدخال إجازة من طرف الإدارة' : 'HR Admin Leave Dispatch'}
            </h5>
            <p className="text-[10px] text-stone-400 font-normal">
              {lang === 'ar' ? 'تقديم طلب إجازة رسمي وتثبيته مباشرة بأمر الإدارة نيابة عن الموظف.' : 'Submit a direct vacation command for an employee.'}
            </p>
          </div>

          <form onSubmit={handleHrSubmitLeave} className="space-y-4">
            
            {/* Pick Employee */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">
                {lang === 'ar' ? 'اسم الموظف المستفيد *' : 'Beneficiary Staff member *'}
              </label>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              >
                <option value="">-- {lang === 'ar' ? 'اختر الموظف' : 'Select Employee'} --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.id} - {lang === 'ar' ? emp.arabicName : emp.englishName}
                  </option>
                ))}
              </select>
            </div>

            {/* Leave Type */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">
                {lang === 'ar' ? 'نوع الإجازة المطلوبة *' : 'Vacation Category *'}
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="Annual">{lang === 'ar' ? 'إجازة سنوية اعتيادية' : 'Annual Paid Leave'}</option>
                <option value="Sick">{lang === 'ar' ? 'إجازة مرضية ببيان طبي' : 'Sick Medical Leave'}</option>
                <option value="Emergency">{lang === 'ar' ? 'إجازة طارئة للمناسبات' : 'Emergency Leave'}</option>
                <option value="Unpaid">{lang === 'ar' ? 'إجازة بدون راتب' : 'Unpaid Sabbatical'}</option>
                <option value="Marriage">{lang === 'ar' ? 'إجازة زواج للشركة' : 'Marriage Leave'}</option>
                <option value="Death">{lang === 'ar' ? 'إجازة وفاة وعزاء' : 'Compassionate Mourning'}</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  {lang === 'ar' ? 'من تاريخ *' : 'Start Date *'}
                </label>
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[#0072BC] font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  {lang === 'ar' ? 'إلى تاريخ *' : 'End Date *'}
                </label>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[#0072BC] font-mono"
                />
              </div>
            </div>

            {/* Purpose or Justification */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">
                {lang === 'ar' ? 'سبب الإجازة وملاحظات تفصيلية *' : 'Justification details *'}
              </label>
              <textarea
                placeholder={lang === 'ar' ? 'أكتب عذر الإجازة والمستندات المرفقة...' : 'Details representing travel plans or sick diagnostic proof...'}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-medium font-bold">
                ⚠️ {formError}
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-bold">
                ✅ {formSuccess}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#0072BC] hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-[#0072BC]/10 transition flex items-center justify-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'إصدار أمر إجازة مباشر' : 'Dispatch Leave Command'}</span>
            </button>
          </form>

          {/* Operational Overlap reminder */}
          <div className="p-3.5 bg-rose-500/10 border border-rose-200 text-slate-700 rounded-2xl text-[11px] leading-relaxed space-y-1 font-semibold">
            <h6 className="font-extrabold text-rose-700 flex items-center gap-1">
              ⚠️ {lang === 'ar' ? 'تفادي النقص في المصنع والرياض' : 'Factory Capacity Guard'}
            </h6>
            <p className="text-[10px] text-slate-500">
              {lang === 'ar' ? 'تأكد من عدم تداخل تاريخ الإجازات للمهندسين من الرياض لضمان استمرارية إنتاج إضاءات النيون للشركاء.' : 'Avoid parallel approvals for Riyadh technicians to sustain constant active production lines.'}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
