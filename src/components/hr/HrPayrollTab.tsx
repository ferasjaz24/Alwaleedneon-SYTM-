import React, { useState } from 'react';
import { 
  DollarSign, Landmark, Receipt, Users, Search, Eye, 
  Printer, FileText, Send, CheckCircle, Calculator, ChevronRight, X
} from 'lucide-react';
import { Employee } from '../../types';
import { sharedPrintHeader, sharedPrintFooter, sharedPrintStyles } from '../../utils/PrintShared';

interface HrPayrollTabProps {
  lang: 'ar' | 'en';
  employees: Employee[];
  onUpdateEmployeeFields: (empId: string, updatedFields: Partial<Employee>) => void;
  onReloadEmployees: () => Promise<void>;
  activeHRSubTab?: string;
}

export default function HrPayrollTab({
  lang,
  employees,
  onUpdateEmployeeFields,
  onReloadEmployees,
  activeHRSubTab
}: HrPayrollTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [showPayslipView, setShowPayslipView] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // GREGORIAN MONTH LISTS
  const gregoryMonths = [
    { id: '2026-01', name_ar: 'يناير', name_en: 'January' },
    { id: '2026-02', name_ar: 'فبراير', name_en: 'February' },
    { id: '2026-03', name_ar: 'مارس', name_en: 'March' },
    { id: '2026-04', name_ar: 'أبريل', name_en: 'April' },
    { id: '2026-05', name_ar: 'مايو', name_en: 'May' },
    { id: '2026-06', name_ar: 'يونيو', name_en: 'June' },
    { id: '2026-07', name_ar: 'يوليو', name_en: 'July' },
    { id: '2026-08', name_ar: 'أغسطس', name_en: 'August' },
    { id: '2026-09', name_ar: 'سبتمبر', name_en: 'September' },
    { id: '2026-10', name_ar: 'أكتوبر', name_en: 'October' },
    { id: '2026-11', name_ar: 'نوفمبر', name_en: 'November' },
    { id: '2026-12', name_ar: 'ديسمبر', name_en: 'December' }
  ];

  // Month target state
  const [selectedMonth, setSelectedMonth] = useState('2026-06');

  // Interactive Live data states populated from backend APIs
  const [deductionsList, setDeductionsList] = useState<any[]>([]);
  const [monthlyPayrolls, setMonthlyPayrolls] = useState<any[]>([]);
  const [deductionSearchQuery, setDeductionSearchQuery] = useState('');
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState<any | null>(null);

  // Form fields inside Deductions modal
  const [dedFormEmpId, setDedFormEmpId] = useState('');
  const [modalEmpSearch, setModalEmpSearch] = useState('');
  const [dedFormType, setDedFormType] = useState('تأخير');
  const [dedFormAmount, setDedFormAmount] = useState<number>(0);
  const [dedFormReason, setDedFormReason] = useState('');
  const [dedFormDate, setDedFormDate] = useState('2026-06-13');
  const [dedFormIsManual, setDedFormIsManual] = useState(false);
  const [dedFormStatus, setDedFormStatus] = useState('confirmed'); // draft | confirmed | notified
  const [calcDays, setCalcDays] = useState<number>(1);
  const [adminApplyDeduction, setAdminApplyDeduction] = useState(false);
  const [advDate, setAdvDate] = useState('2026-06-13');

  // Advance fields
  const [advAmount, setAdvAmount] = useState<number>(1000);
  const [advReason, setAdvReason] = useState('سلفة زواج / شخصية طارئة');
  const [advRepayment, setAdvRepayment] = useState('أقساط شهرياً');
  const [advFinalRepayDate, setAdvFinalRepayDate] = useState('2026-12-30');

  // Violation fields
  const [violCategory, setViolCategory] = useState('مرورية');
  const [violOtherDetails, setViolOtherDetails] = useState('');

  // Custody Damage fields
  const [damageItemName, setDamageItemName] = useState('');
  const [damagePrice, setDamagePrice] = useState<number>(0);

  // Administrative fields
  const [adminNotes, setAdminNotes] = useState('');
  const [withdrawCustody, setWithdrawCustody] = useState(false);

  // Toast & Safe confirmations
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const triggerSuccess = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const triggerError = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 5000);
  };

  // Inline salaries grid for "all 12 months" sheets
  const [inlineWages, setInlineWages] = useState<Record<string, { basic: number, allowances: number, deductions: number, status: string }>>({});

  // Loading indicator for background tasks
  const [fetchingData, setFetchingData] = useState(false);

  const fetchDeductionsAndPayrolls = async () => {
    try {
      setFetchingData(true);
      const [resD, resP] = await Promise.all([
        fetch('/api/deductions'),
        fetch('/api/monthly_payrolls')
      ]);
      if (resD.ok) {
        setDeductionsList(await resD.json());
      }
      if (resP.ok) {
        setMonthlyPayrolls(await resP.json());
      }
    } catch (e) {
      console.error('Error fetching payroll lists:', e);
    } finally {
      setFetchingData(false);
    }
  };

  React.useEffect(() => {
    fetchDeductionsAndPayrolls();
  }, []);

  // Recompute automatically calculated deduction fields
  React.useEffect(() => {
    if (!showDeductionModal || !dedFormEmpId) return;
    const emp = employees.find(e => e.id === dedFormEmpId);
    if (!emp) return;

    // Calculate total salary package
    const basic = Number(emp.basicSalary) || 0;
    const h = Number(emp.allowances?.housing) || 0;
    const t = Number(emp.allowances?.transport) || 0;
    const p = Number(emp.allowances?.phone) || 0;
    const f = Number(emp.allowances?.food) || 0;
    const o = Number(emp.allowances?.overtime) || 0;
    const b = Number(emp.allowances?.bonuses) || 0;
    const totalSalary = basic + h + t + p + f + o + b;
    const dailyRate = totalSalary / 30;

    if (dedFormType === 'تأخير') {
      const amt = Number(((dailyRate * 0.25) * calcDays).toFixed(2));
      setDedFormAmount(amt);
      setDedFormReason(`تأخير ومواظبة لعدد (${calcDays}) وحدات زائدة عن المسموح - خُصم ربع اليومية (بواقع ${(dailyRate * 0.25).toFixed(2)} ريال للوحدة) من إجمالي الأجر البالغ ${totalSalary} ريال.`);
    } else if (dedFormType === 'غياب') {
      const amt = Number(((dailyRate * 2) * calcDays).toFixed(2));
      setDedFormAmount(amt);
      setDedFormReason(`خصم غياب لعدد (${calcDays}) أيام بدون إذن رسمي - بمضاعفة اليومية (خصم مزدوج بواقع ${(dailyRate * 2).toFixed(2)} ريال لليوم) من إجمالي الأجر البالغ ${totalSalary} ريال.`);
    } else if (dedFormType === 'سلفة') {
      setDedFormAmount(advAmount);
      setDedFormReason(`سلفة مالية طارئة ممنوحة للموظف بقيمة (${advAmount}) ريال. نظام الوفاء: (${advRepayment}). تاريخ السلفة: (${advDate}). تاريخ السداد النهائي: (${advFinalRepayDate}). سبب ومنفعة الطلب: (${advReason || 'طلب شخصي'}).`);
    } else if (dedFormType === 'تلف عهدة') {
      setDedFormAmount(damagePrice);
      setDedFormReason(`خصم قيمة إهلاك أو تلف عهدة من أصول المنشأة المسلمة للموظف. بند العهدة المتلفة: (${damageItemName || 'أجهزة إلكترونية'}). التكلفة المستقطعة للتعويض: (${damagePrice}) ريال.`);
    } else if (dedFormType === 'خصم إداري') {
      if (!adminApplyDeduction) {
        setDedFormAmount(0);
      }
      setDedFormReason(`استقطاع وجزاء انضباطي إداري بقرار الموارد البشرية. الإجراء التكميلي: ${withdrawCustody ? 'سحب العهد وتجميد الصلاحيات الفورية' : 'لا توجد إجراءات إضافية'}. مبررات القرارات والحيثيات: (${adminNotes || 'بدون تفاصيل إدارية'}).`);
    }
  }, [
    showDeductionModal, 
    dedFormEmpId, 
    dedFormType, 
    calcDays, 
    advAmount, 
    advReason, 
    advDate, 
    advRepayment, 
    advFinalRepayDate, 
    violCategory, 
    violOtherDetails, 
    damageItemName, 
    damagePrice, 
    adminApplyDeduction, 
    adminNotes, 
    withdrawCustody, 
    employees
  ]);

  // Compute live active deductions for each employee to link databases
  const getEmployeeDeductionsTotal = (empId: string) => {
    return deductionsList
      .filter(d => d.employeeId === empId && d.date && d.date.startsWith(selectedMonth) && (d.status === 'confirmed' || d.status === 'notified'))
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  // Handle deduction submission save
  const handleSaveDeduction = async (statusOverride?: string) => {
    if (!dedFormEmpId) {
      triggerError(lang === 'ar' ? 'الرجاء اختيار الموظف أولاً من القائمة!' : 'Please choose an employee first!');
      return;
    }
    const emp = employees.find(e => e.id === dedFormEmpId);
    if (!emp) return;

    const payload = {
      id: editingDeduction?.id || undefined,
      employeeId: dedFormEmpId,
      employeeName: emp.arabicName,
      type: dedFormType,
      amount: Number(dedFormAmount) || 0,
      reason: dedFormReason,
      date: dedFormDate,
      isManual: true,
      status: statusOverride || dedFormStatus
    };

    try {
      const isNew = !editingDeduction;
      const res = await fetch('/api/deductions', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        triggerSuccess(lang === 'ar' ? 'تم تسجيل وتوثيق حركة العقوبة والخصم المالي في قاعدة البيانات الفعلية! ✅' : 'Deduction record synchronized successfully! ✅');
        setShowDeductionModal(false);
        setEditingDeduction(null);
        // Clear forms
        setDedFormEmpId('');
        setDedFormReason('');
        setDedFormAmount(0);
        setCalcDays(1);
        setDamageItemName('');
        setDamagePrice(0);
        setViolOtherDetails('');
        setAdminNotes('');
        // Reload list
        fetchDeductionsAndPayrolls();
      } else {
        const errTxt = await res.text();
        triggerError('Server Error: ' + errTxt);
      }
    } catch (err) {
      console.error(err);
      triggerError(String(err));
    }
  };

  // Delete deduction
  const handleDeleteDeduction = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      triggerSuccess(lang === 'ar' ? '⚠️ يرجى الضغط مرة أخرى على زر الإزالة لتأكيد الحذف نهائياً' : '⚠️ Please click remove again to confirm final deletion');
      // Reset confirmation after 5 seconds
      setTimeout(() => {
        setConfirmDeleteId(null);
      }, 5000);
      return;
    }
    try {
      const res = await fetch(`/api/deductions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        triggerSuccess(lang === 'ar' ? 'تم مسح وإلغاء الاستقطاع المالي بنجاح! ✅' : 'Deduction deleted successfully! ✅');
        setConfirmDeleteId(null);
        setShowDeductionModal(false);
        setEditingDeduction(null);
        fetchDeductionsAndPayrolls();
      } else {
        triggerError(lang === 'ar' ? 'فشل حذف الخصم من الخادم!' : 'Failed to delete deduction on server!');
      }
    } catch (e) {
      console.error(e);
      triggerError(String(e));
    }
  };

  // Open Edit Deduction Dialog
  const handleOpenEditDeduction = (item: any) => {
    setEditingDeduction(item);
    setDedFormEmpId(item.employeeId || '');
    setDedFormType(item.type || 'تأخير');
    setDedFormAmount(Number(item.amount) || 0);
    setDedFormReason(item.reason || '');
    setDedFormDate(item.date || '2026-06-13');
    setDedFormIsManual(!!item.isManual);
    setDedFormStatus(item.status || 'confirmed');
    setShowDeductionModal(true);
  };

  // Initialize spreadsheet inline data whenever lists modify
  const initializeInlineWagesForMonth = () => {
    const grid: Record<string, { basic: number, allowances: number, deductions: number, status: string }> = {};
    employees.forEach(emp => {
      // Calculate active allowances total
      const h = Number(emp.allowances?.housing) || 0;
      const t = Number(emp.allowances?.transport) || 0;
      const p = Number(emp.allowances?.phone) || 0;
      const f = Number(emp.allowances?.food) || 0;
      const o = Number(emp.allowances?.overtime) || 0;
      const b = Number(emp.allowances?.bonuses) || 0;
      const allowancesSum = h + t + p + f + o + b;

      // Base deductions + dynamic month active ones
      const defaultD = Number(emp.allowances?.deductions) || 0;
      const defaultL = Number(emp.allowances?.loans) || 0;
      const dynamicD = getEmployeeDeductionsTotal(emp.id);

      // Check if already approved/recorded paid slip
      const matchedPaidSlip = monthlyPayrolls.find(p => p.month === selectedMonth && p.employeeId === emp.id);

      grid[emp.id] = {
        basic: matchedPaidSlip ? matchedPaidSlip.basicSalary : (Number(emp.basicSalary) || 0),
        allowances: matchedPaidSlip ? matchedPaidSlip.allowancesSum : allowancesSum,
        deductions: matchedPaidSlip ? matchedPaidSlip.deductionsSum : (defaultD + defaultL + dynamicD),
        status: matchedPaidSlip ? matchedPaidSlip.status : 'مسودة'
      };
    });
    setInlineWages(grid);
  };

  React.useEffect(() => {
    initializeInlineWagesForMonth();
  }, [selectedMonth, employees, deductionsList, monthlyPayrolls]);

  // Save changes to Monthly Salaries Sheet
  const handleSaveMonthlyWagesSheet = async () => {
    const records = Object.entries(inlineWages).map(([empId, val]) => {
      const emp = employees.find(e => e.id === empId);
      const v = val as { basic: number; allowances: number; deductions: number; status: string };
      return {
        employeeId: empId,
        employeeName: emp ? emp.arabicName : 'موظف مجهول',
        month: selectedMonth,
        basicSalary: v.basic,
        allowancesSum: v.allowances,
        deductionsSum: v.deductions,
        netSalary: v.basic + v.allowances - v.deductions,
        status: v.status
      };
    });

    try {
      const res = await fetch('/api/monthly_payrolls/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, records })
      });
      if (res.ok) {
        triggerSuccess(lang === 'ar' ? 'تم حفظ واعتماد مسير الرواتب الموحد بجميع بنوده وتعميم الحالات! 🔐✅' : 'Monthly wages sheet saved successfully in core ledger! 🔐✅');
        fetchDeductionsAndPayrolls();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Import custom file and match values intelligently
  const handleFileUploadTextParse = (text: string) => {
    const lines = text.split('\n');
    const updatedGrid = { ...inlineWages };
    let matchedCount = 0;

    lines.forEach(line => {
      employees.forEach(emp => {
        if (line.includes(emp.id) || line.includes(emp.arabicName) || (emp.englishName && line.includes(emp.englishName))) {
          const nums = line.match(/\d+(\.\d+)?/g);
          if (nums && nums.length >= 2) {
            const basicVal = Number(nums[0]) || emp.basicSalary || 0;
            const allowVal = Number(nums[1]) || 0;
            const deductVal = Number(nums[2]) || 0;

            updatedGrid[emp.id] = {
              basic: Number(basicVal),
              allowances: Number(allowVal),
              deductions: Number(deductVal),
              status: 'مستورد معدل 📄'
            };
            matchedCount++;
          }
        }
      });
    });

    setInlineWages(updatedGrid);
    triggerSuccess(lang === 'ar' 
      ? `رائع! تم تصفح وفحص الملف ذكياً بنجاح. تم فحص وتعديل أجور (${matchedCount}) موظفين بمطابقة البيانات الحية.` 
      : `Complete success! Text parsing mapped (${matchedCount}) personnel sheets seamlessly.`
    );
  };

  // Print list sheets
  const handlePrintMonthlySalariesSheet = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentMonthData = gregoryMonths.find(m => m.id === selectedMonth);
    const monthLabel = lang === 'ar' ? currentMonthData?.name_ar : currentMonthData?.name_en;

    const rowsHtml = employees.map(emp => {
      const data = inlineWages[emp.id] || { basic: 0, allowances: 0, deductions: 0, status: 'مسودة' };
      const net = data.basic + data.allowances - data.deductions;
      return `
        <tr>
          <td style="border: 1px solid #ddd; padding: 10px; font-family: monospace;">${emp.id}</td>
          <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">${emp.arabicName}</td>
          <td style="border: 1px solid #ddd; padding: 10px; font-family: monospace;">${data.basic.toLocaleString()} ريال</td>
          <td style="border: 1px solid #ddd; padding: 10px; font-family: monospace; color: green;">+${data.allowances.toLocaleString()} ريال</td>
          <td style="border: 1px solid #ddd; padding: 10px; font-family: monospace; color: red;">-${data.deductions.toLocaleString()} ريال</td>
          <td style="border: 1px solid #ddd; padding: 10px; font-family: monospace; font-weight: bold; background: #f9f9f9;">${net.toLocaleString()} ريال</td>
          <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; color: #0072BC;">${data.status}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>مسير الرواتب المعتمد والشامل - شهر ${monthLabel} (${selectedMonth})</title>
        <style>
          ${sharedPrintStyles}
          body { padding: 20px; color: #333; line-height: 1.5; }
          .hdr { text-align: center; border-bottom: 2px solid #0072BC; padding-bottom: 15px; margin-bottom: 25px; }
          .hdr h1 { margin: 0 0 5px; color: #0072BC; font-size: 20px; }
          .tbl { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
          .tbl th { background: #0072BC; color: white; border: 1px solid #ddd; padding: 10px; text-align: right; }
          .tbl td { text-align: right; }
          .sum-card { margin-top: 30px; border: 2px solid #0072BC; padding: 15px; border-radius: 8px; background: #f7fcff; font-size: 12px; }
          .footer-signs { display: flex; justify-content: space-between; margin-top: 50px; font-size: 11px; }
          .sig-box { border-top: 1px solid #444; width: 180px; text-align: center; padding-top: 5px; }
          @media print { .no-print { display: none !important; } }
        </style>
      </head>
      <body>
        <div style="max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; min-height: 90vh;">
          ${sharedPrintHeader}
          <div style="flex-grow: 1;">
            <div style="text-align:center; margin-bottom: 20px;">
              <h2 style="font-size: 18px; margin: 0;">كشف مسير رواتب الموظفين الموحد لشهر: ${monthLabel} (${selectedMonth})</h2>
              <p style="font-size: 12px; margin: 5px 0;">تاريخ استخراج وثيقة الصرف: ${new Date().toLocaleDateString()}</p>
            </div>

            <table class="tbl">
              <thead>
                <tr>
                  <th>كود الموظف</th>
                  <th>اسم الموظف</th>
                  <th>الراتب الأساسي</th>
                  <th>إجمالي البدلات</th>
                  <th>إجمالي المستقطعات</th>
                  <th>صافي الدفع الفعلي</th>
                  <th>الحالة والاعتماد</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <div class="sum-card">
              <strong>📝 إحصاء الصرف الإجمالي للمسير الحالي المعتمد:</strong>
              <p>إجمالي المدفوعات الأساسية: ${employees.reduce((s, e) => s + (inlineWages[e.id]?.basic || 0), 0).toLocaleString()} ريال</p>
              <p>إجمالي الاستقطاعات والجزاءات: ${employees.reduce((s, e) => s + (inlineWages[e.id]?.deductions || 0), 0).toLocaleString()} ريال</p>
              <p>صوافي الأجور المعدة للحوالات (WPS): <strong>${employees.reduce((s, e) => {
                const row = inlineWages[e.id] || { basic: 0, allowances: 0, deductions: 0 };
                return s + (row.basic + row.allowances - row.deductions);
              }, 0).toLocaleString()} ريال سعودي</strong></p>
            </div>

            <div class="footer-signs">
              <div>
                <p>مُعِد الكشف والمسيرات المالية:</p>
                <div class="sig-box" style="margin-top:25px;">إدارة الشؤون المالية والمحاسبية</div>
              </div>
              <div>
                <p>التدقيق للامتثال والالتزام:</p>
                <div class="sig-box" style="margin-top:25px;">مدير الموارد البشرية (HR Manager)</div>
              </div>
              <div>
                <p>الاعتماد النهائي للصرف الفعلي:</p>
                <div class="sig-box" style="margin-top:25px;">المدير العام والمسؤول التنفيذي</div>
              </div>
            </div>
          </div>
          ${sharedPrintFooter}
        </div>
        <script>
          window.print();
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Dropdown-based state for individual employees view
  const [dropdownEmpId, setDropdownEmpId] = useState<string>('');

  const handleDropdownSelectChange = (empId: string) => {
    setDropdownEmpId(empId);
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setEditBasic(Number(emp.basicSalary) || 0);
      setEditHousing(Number(emp.allowances?.housing) || 0);
      setEditTransport(Number(emp.allowances?.transport) || 0);
      setEditOvertime(Number(emp.allowances?.overtime) || 0);
      setEditBonuses(Number(emp.allowances?.bonuses) || 0);
      setEditDeductions(Number(emp.allowances?.deductions) || 0);
      setEditLoans(Number(emp.allowances?.loans) || 0);
    }
  };

  React.useEffect(() => {
    if (!dropdownEmpId && employees.length > 0) {
      handleDropdownSelectChange(employees[0].id);
    }
  }, [employees, dropdownEmpId]);

  // States for live editing within the salary details popup before permanent save
  const [editBasic, setEditBasic] = useState<number>(0);
  const [editHousing, setEditHousing] = useState<number>(0);
  const [editTransport, setEditTransport] = useState<number>(0);
  const [editOvertime, setEditOvertime] = useState<number>(0);
  const [editBonuses, setEditBonuses] = useState<number>(0);
  const [editDeductions, setEditDeductions] = useState<number>(0);
  const [editLoans, setEditLoans] = useState<number>(0);

  // Summary statistics across active employees
  const totalBaseSalaries = employees.reduce((acc, emp) => acc + (Number(emp.basicSalary) || 0), 0);
  
  const totalAllowances = employees.reduce((acc, emp) => {
    const h = Number(emp.allowances?.housing) || 0;
    const t = Number(emp.allowances?.transport) || 0;
    const p = Number(emp.allowances?.phone) || 0;
    const f = Number(emp.allowances?.food) || 0;
    const o = Number(emp.allowances?.overtime) || 0;
    const b = Number(emp.allowances?.bonuses) || 0;
    return acc + h + t + p + f + o + b;
  }, 0);

  const totalDeductionsPlusLoans = employees.reduce((acc, emp) => {
    const d = Number(emp.allowances?.deductions) || 0;
    const l = Number(emp.allowances?.loans) || 0;
    const dynamicD = getEmployeeDeductionsTotal(emp.id);
    return acc + d + l + dynamicD;
  }, 0);

  const netPayrollSum = totalBaseSalaries + totalAllowances - totalDeductionsPlusLoans;
  const staffCountInPayroll = employees.length;

  const handleOpenEmpSalary = (emp: Employee) => {
    setSelectedEmp(emp);
    setShowPayslipView(false);
    setSendSuccess(false);
    
    // Instantiate states from chosen employee record
    setEditBasic(Number(emp.basicSalary) || 0);
    setEditHousing(Number(emp.allowances?.housing) || 0);
    setEditTransport(Number(emp.allowances?.transport) || 0);
    setEditOvertime(Number(emp.allowances?.overtime) || 0);
    setEditBonuses(Number(emp.allowances?.bonuses) || 0);
    setEditDeductions(Number(emp.allowances?.deductions) || 0);
    setEditLoans(Number(emp.allowances?.loans) || 0);
  };

  const handleSaveChangesLocal = async () => {
    if (!selectedEmp) return;
    
    const updatedAllowances = {
      ...(selectedEmp.allowances || {}),
      housing: editHousing,
      transport: editTransport,
      overtime: editOvertime,
      bonuses: editBonuses,
      deductions: editDeductions,
      loans: editLoans
    };

    onUpdateEmployeeFields(selectedEmp.id, {
      basicSalary: editBasic,
      allowances: updatedAllowances
    });

    // Mirror updates in selectedEmp reference
    setSelectedEmp({
      ...selectedEmp,
      basicSalary: editBasic,
      allowances: updatedAllowances
    });

    onReloadEmployees();
    triggerSuccess(lang === 'ar' ? 'تم تحديث البيانات المالية للموظف بنجاح في قاعدة البيانات الحقيقية! ✅' : 'Employee financial details successfully saved to active DB! ✅');
  };

  const handleSendPayslipToESS = async () => {
    if (!selectedEmp) return;

    const netSalaryCalculated = editBasic + editHousing + editTransport + editOvertime + editBonuses - editDeductions - editLoans;

    const payload = {
      empId: selectedEmp.id,
      name: selectedEmp.arabicName, // Linked straight to employee portal by arabic / english name
      category_ar: 'كشف راتب رسمي 💵',
      category_en: 'Official Payslip 💵',
      details: lang === 'ar' 
        ? `تم إصدار وإرسال كشف مسير راتب رسمي إلكتروني لشهر يونيو يونيو للعام الحالي.` 
        : `Electronic official Payslip compiled and issued by HR-Finance department for the current month.`,
      status: 'RESOLVED',
      hrNotes: lang === 'ar' 
        ? `الراتب الأساسي: ${editBasic} ريال | بدل سكن: ${editHousing} ريال | بدل نقل: ${editTransport} ريال\nإضافي: ${editOvertime} ريال | مكافآت: ${editBonuses} ريال\nخصومات: -${editDeductions} ريال | سلف مستقطعة: -${editLoans} ريال\n---------------------------\n💰 صافي الراتب المستحق: ${netSalaryCalculated} ريال سعودي\nتم الإرسال والاعتماد بواسطة: رئيس الموارد البشرية.`
        : `Basic Salary: ${editBasic} SAR | Housing: ${editHousing} SAR | Transport: ${editTransport} SAR\nOvertime: ${editOvertime} SAR | Bonuses: ${editBonuses} SAR\nDeductions: -${editDeductions} SAR | Loans: -${editLoans} SAR\n---------------------------\n💰 Net Disbursed Wages: ${netSalaryCalculated} SAR\nApproved & certified by: Head of HR Administration.`
    };

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSendSuccess(true);
      }
    } catch (err) {
      console.error('Error issuing payslip claim:', err);
    }
  };

  const handlePrintPayslip = () => {
    // Elegant targeted clean printing inside client browser using dedicated iframe pattern or window.print
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const netCalculated = editBasic + editHousing + editTransport + editOvertime + editBonuses - editDeductions - editLoans;

    const printHtml = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>كشف مسير راتب - ${selectedEmp?.arabicName}</title>
        <style>
          ${'/*styles*/'}
          body { padding: 20px; color: #333; line-height: 1.6; }
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          .info-table td { padding: 8px 12px; border: 1px solid #efefef; font-size: 13px; }
          .info-table td.lbl { font-weight: bold; background: #f9f9f9; width: 20%; }
          .fin-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          .fin-table th { background: #0072BC; padding: 10px; font-size: 13px; color: white; border: 1px solid #0072BC; }
          .fin-table td { padding: 11px; border: 1px solid #ddd; text-align: center; font-size: 13px; font-weight: bold; }
          .net-box { margin-top: 35px; border: 2px solid #00AEEF; background: #f0faff; padding: 15px; text-align: center; border-radius: 8px; }
          .net-box h2 { margin: 0 0 5px; color: #0072BC; font-size: 18px; }
          .net-box p { margin: 0; font-size: 24px; font-weight: 900; color: #09751e; }
          .footer-claims { text-align: center; margin-top: 30px; font-size: 11px; color: #888; border-top: 1px solid #efefef; padding-top: 15px; }
          @media print { .no-print { display: none !important; } }
        </style>
      </head>
      <body>
        <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; min-height: 90vh;">
          ${sharedPrintHeader}
          <div style="flex-grow: 1;">
            <div style="text-align:center; margin-bottom:20px;">
              <h2 style="margin: 0; font-size: 18px;">كشف مسير الرواتب والأجور الشهري الرسمي المعتمد</h2>
              <p style="margin: 5px 0;">تاريخ الصدور: ${new Date().toLocaleDateString('ar-EG')}</p>
            </div>

            <table class="info-table">
              <tr>
                <td class="lbl">اسم الموظف:</td>
                <td>${selectedEmp?.arabicName}</td>
                <td class="lbl">الرقم الوظيفي:</td>
                <td>${selectedEmp?.id}</td>
              </tr>
              <tr>
                <td class="lbl">رقم الهوية / الإقامة:</td>
                <td>${selectedEmp?.iqamaId || '---'}</td>
                <td class="lbl">المسمى الوظيفي:</td>
                <td>${selectedEmp?.jobTitle}</td>
              </tr>
              <tr>
                <td class="lbl">القسم الإداري:</td>
                <td>${selectedEmp?.department || 'إدارة عامة'}</td>
                <td class="lbl">تصنيف الفئة:</td>
                <td>${selectedEmp?.classification || 'موظف'}</td>
              </tr>
            </table>

            <h3 style="color: #0072BC; border-bottom: 1px solid #ddd; padding-bottom: 5px;">📊 تفاصيل المستحقات والاستقطاعات المالية:</h3>
            <table class="fin-table">
              <thead>
                <tr>
                  <th style="background:#555;">الراتب الأساسي</th>
                  <th>بدل السكن</th>
                  <th>بدل النقل</th>
                  <th>إضافي ساعات العمل</th>
                  <th>مكافآت وحوافز</th>
                  <th style="background:#b91c1c;">خصومات وغيابات</th>
                  <th style="background:#b91c1c;">عهد وسلف مستقطعة</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${editBasic} ريال</td>
                  <td>${editHousing} ريال</td>
                  <td>${editTransport} ريال</td>
                  <td>${editOvertime} ريال</td>
                  <td>${editBonuses} ريال</td>
                  <td style="color:#b91c1c;">${editDeductions} ريال</td>
                  <td style="color:#b91c1c;">${editLoans} ريال</td>
                </tr>
              </tbody>
            </table>

            <div class="net-box">
              <h2>صافي الراتب المستحق للصرف وإيداع الحساب (Net Disbursed Salary)</h2>
              <p>${netCalculated} ر.س</p>
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

  const handleDownloadPDF = () => {
    // Reuses the modular native print framework which lets user cleanly Save as PDF in all browsers (Vite/Run constraints favorite)
    handlePrintPayslip();
  };

  // Filter employees registry list for search matches
  const filteredEmployees = employees.filter(emp => {
    const q = searchQuery.toLowerCase();
    const idMatch = (emp.id || '').toLowerCase().includes(q);
    const iqamaMatch = (emp.iqamaId || '').toLowerCase().includes(q);
    const nameArMatch = (emp.arabicName || '').toLowerCase().includes(q);
    const nameEnMatch = (emp.englishName || '').toLowerCase().includes(q);
    const titleMatch = (emp.jobTitle || '').toLowerCase().includes(q);
    return idMatch || iqamaMatch || nameArMatch || nameEnMatch || titleMatch;
  });

  // Check if deduction exceeds half the candidate's salary
  let deductionWarningMessage = '';
  let isDeductionBlocked = false;

  if (showDeductionModal && dedFormEmpId) {
    const emp = employees.find(e => e.id === dedFormEmpId);
    if (emp) {
      const basic = Number(emp.basicSalary) || 0;
      const h = Number(emp.allowances?.housing) || 0;
      const t = Number(emp.allowances?.transport) || 0;
      const p = Number(emp.allowances?.phone) || 0;
      const f = Number(emp.allowances?.food) || 0;
      const o = Number(emp.allowances?.overtime) || 0;
      const b = Number(emp.allowances?.bonuses) || 0;
      const totalSalary = basic + h + t + p + f + o + b;
      const halfSalary = totalSalary / 2;

      // Deductions already confirmed for this employee in selectedMonth, excluding the one currently being edited
      const otherConfirmedDeductions = deductionsList
        .filter(d => 
          d.employeeId === dedFormEmpId && 
          d.date && 
          d.date.startsWith(selectedMonth) && 
          d.id !== editingDeduction?.id && 
          (d.status === 'confirmed' || d.status === 'notified')
        )
        .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

      const totalProjectedDeductions = otherConfirmedDeductions + (Number(dedFormAmount) || 0);

      if (totalProjectedDeductions > halfSalary) {
        isDeductionBlocked = true;
        deductionWarningMessage = lang === 'ar'
          ? `المجموع الحالي لخصومات هذا الموظف خلال الشهر هو (${otherConfirmedDeductions.toLocaleString()} ريال). وبإضافة قيمة هذا الخصم (${(Number(dedFormAmount) || 0).toLocaleString()} ريال)، يصبح إجمالي الخصم المقرّر له خلال الشهر (${totalProjectedDeductions.toLocaleString()} ريال)، وهو ما يتجاوز نصف الراتب الإجمالي البالغ (${totalSalary.toLocaleString()} ريال، والحد الأقصى المسموح به هو ${halfSalary.toLocaleString()} ريال).`
          : `The current sum of this employee's deductions during this month is (${otherConfirmedDeductions.toLocaleString()} SAR). Adding this deduction (${(Number(dedFormAmount) || 0).toLocaleString()} SAR), the target total becomes (${totalProjectedDeductions.toLocaleString()} SAR), which exceeds 50% of the total monthly salary package (${totalSalary.toLocaleString()} SAR, limit: ${halfSalary.toLocaleString()} SAR).`;
      }
    }
  }

  return (
    <div id="hr-payroll-system-module" className="space-y-6 text-right">
      
      {/* Dynamic Safe Toast Notifications */}
      {successToast && (
        <div className="fixed top-5 left-5 z-[100] max-w-sm bg-emerald-600 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/30 flex items-center gap-3 animate-bounce" dir="rtl">
          <span className="text-xl">✅</span>
          <p className="text-xs font-black">{successToast}</p>
        </div>
      )}
      {errorToast && (
        <div className="fixed top-5 left-5 z-[100] max-w-sm bg-rose-600 text-white p-4 rounded-2xl shadow-2xl border border-rose-500/30 flex items-center gap-3 animate-bounce" dir="rtl">
          <span className="text-xl">❌</span>
          <p className="text-xs font-black">{errorToast}</p>
        </div>
      )}

      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden text-right" dir="rtl">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full filter blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-mono tracking-wider uppercase font-black">
              📊 WPS PAYROLL HUB
            </span>
            <h1 className="text-2xl font-black mt-2">
              {lang === 'ar' ? '💵 مركز الإدارة ومسير رواتب الموظفين الممتاز' : 'WPS Authorized Payroll Control Center'}
            </h1>
            <p className="text-xs text-blue-100 mt-1 max-w-xl">
              {lang === 'ar' ? 'رصد كامل للتعويضات، الأجور الأساسية، البدلات والخصومات، وإصدار فوري لكشوفات الرواتب الإلكترونية المرتبطة بملفات الموظفين وقواعد البيانات.' : 'Auditable database track for base wages, housing allow, deductions and loan balance releases.'}
            </p>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl border border-white/5 flex items-center gap-3">
            <Landmark className="w-8 h-8 text-sky-300 animate-pulse" />
            <div className="text-right">
              <span className="text-[10px] block opacity-70">{lang === 'ar' ? 'نظام حماية الأجور (WPS)' : 'Saudi WPS Link'}</span>
              <span className="text-xs font-black text-emerald-400">● {lang === 'ar' ? 'متصل ونشط' : 'CONNECTED'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Total Salaries Summary Cards (إجمالي الرواتب) */}
      {activeHRSubTab === 'payroll_main' && (
        <div className="space-y-4">

          {/* Mudad Legal Platform Shortcut */}
          <div className="bg-amber-50/50 border border-amber-200/60 p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 text-right" dir="rtl" id="mudad-portal-quick-link-banner">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🇸🇦</span>
              <div>
                <h4 className="text-xs font-black text-amber-900">منصة مدد الرقمية لحماية الأجور (Mudad Portal):</h4>
                <p className="text-[10px] text-amber-700 font-bold">بوابتك الرسمية لتوثيق العقود والتزام نظام حماية الأجور السعودي للخدمات المالي والامتثال.</p>
              </div>
            </div>
            <a
              href="https://mudad.com.sa/registration"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl transition shadow-sm flex items-center gap-1.5 whitespace-nowrap"
              id="mudad-portal-button"
            >
              <span>🌐 الانتقال إلى منصة مدد</span>
            </a>
          </div>
          
          {/* Month target filter card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 text-right" dir="rtl">
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-slate-800">🗓️ {lang === 'ar' ? 'الاستعلام والفحص المالي حسب الشهر' : 'Filter Financial Summaries By Month'}</h4>
              <p className="text-[10px] text-slate-400">{lang === 'ar' ? 'اختر الشهر المستهدف لتصفية مؤشرات الاستقطاع وتحديث الموازنة الفورية.' : 'Select target month to screen deductions metrics.'}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">{lang === 'ar' ? 'الشهر المستهدف:' : 'Target Month:'}</span>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-black text-slate-700 outline-none focus:border-[#0072BC]"
              >
                {gregoryMonths.map(m => (
                  <option key={m.id} value={m.id}>{lang === 'ar' ? `${m.name_ar} (${m.id})` : `${m.name_en} (${m.id})`}</option>
                ))}
              </select>
            </div>
          </div>

          <h3 className="text-xs font-bold text-slate-400 text-right" dir="rtl">
            {lang === 'ar' ? '📊 بيان الموازنة الفورية والخصومات الصادرة لشهر ' + gregoryMonths.find(m => m.id === selectedMonth)?.name_ar : 'Wages Metrics'}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" dir="rtl">
            
            {/* Card A: مجموع الرواتب الأساسية */}
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow transition flex items-center justify-between group">
              <div className="text-right space-y-1">
                <span className="text-[11px] text-slate-400 font-extrabold block">{lang === 'ar' ? 'إجمالي الرواتب الأساسية لموظفي الشركة' : 'Total Base Salaries'}</span>
                <p className="text-xl font-mono font-black text-slate-800 leading-none">{totalBaseSalaries.toLocaleString()} <span className="text-[10px] text-slate-400">ريال</span></p>
                <span className="text-[9px] text-blue-600 block flex items-center gap-0.5">💸 {lang === 'ar' ? 'قبل البدلات والاستقطاعات والمكافآت' : 'wages without adjustments'}</span>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            {/* Card B: مجموع البدلات والمزايا */}
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow transition flex items-center justify-between group">
              <div className="text-right space-y-1">
                <span className="text-[11px] text-slate-400 font-extrabold block">{lang === 'ar' ? 'مجموع البدلات لموظفي الشركة' : 'Total Allowances & Overtime'}</span>
                <p className="text-xl font-mono font-black text-slate-800 leading-none">{totalAllowances.toLocaleString()} <span className="text-[10px] text-slate-400">ريال</span></p>
                <span className="text-[9px] text-amber-600 block flex items-center gap-0.5">🏠 {lang === 'ar' ? 'يشمل سكن، نقل، إضافي، وحوافز' : 'housing, travel, incentives'}</span>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition">
                <Receipt className="w-5 h-5" />
              </div>
            </div>

            {/* Card C: إجمالي الرواتب شاملة البدلات والمستقطعات الفورية */}
            <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-5 rounded-2xl shadow-sm hover:shadow transition flex items-center justify-between group">
              <div className="text-right space-y-1">
                <span className="text-[11px] text-slate-500 font-extrabold block">{lang === 'ar' ? 'إجمالي الرواتب والمسير شامل البدلات والخصم' : 'WPS Net Monthly Payroll'}</span>
                <p className="text-xl font-mono font-black text-emerald-800 leading-none">{netPayrollSum.toLocaleString()} <span className="text-[10px] text-emerald-600">ريال</span></p>
                <span className="text-[9px] text-emerald-600 block flex items-center gap-0.5">✓ {lang === 'ar' ? 'المجموع المستحق للصرف الفعلي الحالي' : 'Wages sum including adjustments'}</span>
              </div>
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl group-hover:scale-110 transition">
                <Landmark className="w-5 h-5" />
              </div>
            </div>

            {/* Card E: إجمالي خصومات شهر معین */}
            <div className="bg-gradient-to-br from-red-50 to-white border border-red-100 p-5 rounded-2xl shadow-sm hover:shadow transition flex items-center justify-between group">
              <div className="text-right space-y-1">
                <span className="text-[11px] text-red-500 font-extrabold block">{lang === 'ar' ? 'إجمالي الخصومات المستقطعة للشهر' : 'Total Month Deductions'}</span>
                <p className="text-xl font-mono font-black text-red-600 leading-none">
                  {deductionsList
                    .filter(d => d.date && d.date.startsWith(selectedMonth) && (d.status === 'confirmed' || d.status === 'notified'))
                    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
                    .toLocaleString()} <span className="text-[10px] text-red-400">ريال</span>
                </p>
                <span className="text-[9px] text-red-500 block flex items-center gap-0.5">📉 {lang === 'ar' ? `مخصومة مباشرة من رواتب وبنود الشهر` : 'Direct payroll deduction impact'}</span>
              </div>
              <div className="p-3 bg-red-100 text-red-600 rounded-xl group-hover:scale-110 transition">
                <Landmark className="w-5 h-5 text-red-500" />
              </div>
            </div>

            {/* Card D: عدد الموظفين داخل المسير */}
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow transition flex items-center justify-between group">
              <div className="text-right space-y-1">
                <span className="text-[11px] text-slate-400 font-extrabold block">{lang === 'ar' ? 'عدد الموظفين داخل جدول الرواتب' : 'WPS Registered Personnel'}</span>
                <p className="text-xl font-mono font-black text-slate-800 leading-none">{staffCountInPayroll} <span className="text-[10px] text-slate-400">موظف</span></p>
                <span className="text-[9px] text-indigo-600 block flex items-center gap-0.5">👥 {lang === 'ar' ? 'تغطية 100٪ بمسير الأجور الذاتي' : '100% headcount covered'}</span>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition">
                <Users className="w-5 h-5" />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Conditionally Render Dropdown Selector if we are on payroll_employees tab */}
      {activeHRSubTab === 'payroll_employees' && (
        <div className="bg-gradient-to-br from-[#0072BC]/10 to-indigo-50/50 rounded-3xl border border-[#0072BC]/20 p-6 space-y-4 text-right" dir="rtl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h3 className="text-base font-black text-[#0072BC]">
                👤 {lang === 'ar' ? 'مسير رواتب الموظفين - الاختيار والتعديل المباشر' : 'Employee Wages Directory Selector'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'ar' ? 'اختر أي موظف من القائمة المنسدلة لفتح ملفه المالي مباشرة، وتعديل بنوده بالتفصيل، وإصدار أو إرسال كشوفات الرواتب لخدمته الذاتية.' : 'Select an employee from the dropdown list below to quickly view or adjust their ledger.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100">
            <label className="text-xs font-black text-slate-700 whitespace-nowrap min-w-[120px]">
              🎯 {lang === 'ar' ? 'اختر الموظف المستهدف:' : 'Target Employee:'}
            </label>
            <select
              value={dropdownEmpId}
              onChange={(e) => handleDropdownSelectChange(e.target.value)}
              className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0072BC] focus:bg-white transition"
            >
              <option value="">{lang === 'ar' ? '-- اختر موظفاً من القائمة --' : '-- Choose Employee --'}</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.arabicName} ({emp.jobTitle}) - {emp.id}
                </option>
              ))}
            </select>
          </div>

          {dropdownEmpId ? (
            (() => {
              const emp = employees.find(e => e.id === dropdownEmpId);
              if (!emp) return null;

              // Calculate Net
              const computedNet = editBasic + editHousing + editTransport + editOvertime + editBonuses - editDeductions - editLoans;

              return (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
                  {/* Selected employee quick summary */}
                  <div className="flex justify-between items-center border-b pb-4">
                    <div>
                      <span className="text-[10px] bg-blue-50 text-[#0072BC] font-black px-2 py-1 rounded-lg">
                        ID: {emp.id}
                      </span>
                      <h4 className="text-sm font-black text-slate-800 mt-1">{emp.arabicName}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{emp.jobTitle} | {emp.department || 'الإدارة'}</p>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'رقم الهوية / الإقامة' : 'National ID'}</span>
                      <span className="text-xs font-mono font-black text-slate-750">{emp.iqamaId || '---'}</span>
                    </div>
                  </div>

                  {/* Financial Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Basic */}
                    <div className="space-y-1.5 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="text-[10px] font-extrabold text-slate-450 block">💵 {lang === 'ar' ? 'الراتب الأساسي' : 'Basic Salary'}</label>
                      <input 
                        type="number"
                        value={editBasic}
                        onChange={(e) => setEditBasic(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-800 text-center"
                      />
                    </div>

                    {/* Housing */}
                    <div className="space-y-1.5 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="text-[10px] font-extrabold text-slate-450 block">🏠 {lang === 'ar' ? 'بدل السكن' : 'Housing Allowance'}</label>
                      <input 
                        type="number"
                        value={editHousing}
                        onChange={(e) => setEditHousing(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-800 text-center"
                      />
                    </div>

                    {/* Transport */}
                    <div className="space-y-1.5 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="text-[10px] font-extrabold text-slate-455 block">🚗 {lang === 'ar' ? 'بدل النقل' : 'Transport Allowance'}</label>
                      <input 
                        type="number"
                        value={editTransport}
                        onChange={(e) => setEditTransport(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-800 text-center"
                      />
                    </div>

                    {/* Overtime */}
                    <div className="space-y-1.5 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="text-[10px] font-extrabold text-slate-455 block">⏱️ {lang === 'ar' ? 'إضافي' : 'Overtime'}</label>
                      <input 
                        type="number"
                        value={editOvertime}
                        onChange={(e) => setEditOvertime(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-800 text-center"
                      />
                    </div>

                    {/* Bonuses */}
                    <div className="space-y-1.5 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="text-[10px] font-extrabold text-slate-455 block">🎁 {lang === 'ar' ? 'مكافآت' : 'Bonuses / Incentives'}</label>
                      <input 
                        type="number"
                        value={editBonuses}
                        onChange={(e) => setEditBonuses(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-800 text-center"
                      />
                    </div>

                    {/* Deductions */}
                    <div className="space-y-1.5 bg-red-50/30 p-3 rounded-xl border border-red-100/60">
                      <label className="text-[10px] font-extrabold text-red-500 block">📉 {lang === 'ar' ? 'خصومات' : 'Deductions'}</label>
                      <input 
                        type="number"
                        value={editDeductions}
                        onChange={(e) => setEditDeductions(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full bg-white border border-red-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-red-800 text-center"
                      />
                    </div>

                    {/* Loans */}
                    <div className="space-y-1.5 bg-amber-50/30 p-3 rounded-xl border border-amber-100/60">
                      <label className="text-[10px] font-extrabold text-amber-600 block">🛡️ {lang === 'ar' ? 'سلف' : 'Outstanding Loans'}</label>
                      <input 
                        type="number"
                        value={editLoans}
                        onChange={(e) => setEditLoans(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full bg-white border border-amber-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-amber-800 text-center"
                      />
                    </div>

                    {/* Net Salary (Display Only) */}
                    <div className="space-y-1.5 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                      <label className="text-[10px] font-black text-emerald-800 block">💰 {lang === 'ar' ? 'صافي الراتب' : 'Computed Net Salary'}</label>
                      <div className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-mono font-black text-emerald-850 text-center shadow-inner">
                        {computedNet.toLocaleString()} ريال
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar inside details */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => {
                        const updatedFields: Partial<Employee> = {
                          basicSalary: editBasic,
                          allowances: {
                            housing: editHousing,
                            transport: editTransport,
                            phone: Number(emp.allowances?.phone) || 0,
                            food: Number(emp.allowances?.food) || 0,
                            overtime: editOvertime,
                            bonuses: editBonuses,
                            deductions: editDeductions,
                            loans: editLoans,
                            status: emp.allowances?.status || 'Active'
                          }
                        };
                        onUpdateEmployeeFields(emp.id, updatedFields);
                        triggerSuccess(lang === 'ar' ? '✅ تم تحديث الموقف المالي وحفظ البيانات بنجاح.' : '✅ Financial records updated successfully.');
                      }}
                      className="w-full sm:w-auto px-6 py-2.5 bg-[#0072BC] text-white hover:bg-[#0072BC]/95 rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow"
                    >
                      <span>💾 {lang === 'ar' ? 'تحديث وحفظ الملف المالي للموظف' : 'Save Adjustments'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenEmpSalary(emp)}
                      className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-650 text-white hover:brightness-105 rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow"
                    >
                      <FileText className="w-4 h-4" />
                      <span>📄 {lang === 'ar' ? 'كشف راتب موظف بالتفصيل' : 'Interactive Detail Payslip'}</span>
                    </button>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400 italic text-xs">
              {lang === 'ar' ? 'الرجاء اختيار أحد الموظفين من القائمة المنسدلة للتعديل أو إصدار كشف الراتب.' : 'Please select an employee to adjust values.'}
            </div>
          )}
        </div>
      )}

      {/* 3. Employee Payroll Directory List & Search */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4 text-right" dir="rtl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-base font-black text-slate-850">
              📋 {lang === 'ar' ? 'سجل وكشوفات مسير رواتب الموظفين' : 'All Registered Employee Financial Records'}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {lang === 'ar' ? 'استعلم وابحث واعرض كشوفات رواتب الموظفين التفصيلية وقابلية إرسالها الفوري والطباعة وتصدير الـ PDF' : 'Query, preview, certify and emit electronic pay slips directly to active employee claim portal.'}
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text"
              placeholder={lang === 'ar' ? 'ابحث باسم الموظف، هويته، أو المسمى...' : 'Search by name, ID, title, iqama...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold font-sans text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0072BC] focus:bg-white transition"
            />
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto text-right">
          <table className="w-full text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-150 text-slate-400 font-extrabold bg-slate-50 text-[10px]">
                <th className="py-2.5 px-3 text-right">{lang === 'ar' ? 'المعرف الوظيفي' : 'EMP ID'}</th>
                <th className="py-2.5 px-3 text-right">{lang === 'ar' ? 'اسم الموظف' : 'Employee Name'}</th>
                <th className="py-2.5 px-3 text-right">{lang === 'ar' ? 'رقم الإقامة / الهوية' : 'National ID / Iqama NO'}</th>
                <th className="py-2.5 px-3 text-right">{lang === 'ar' ? 'المسمى الوظيفي' : 'Job Title'}</th>
                <th className="py-2.5 px-3 text-right">{lang === 'ar' ? 'الراتب الأساسي' : 'Base wage'}</th>
                <th className="py-2.5 px-3 text-right">{lang === 'ar' ? 'إجمالي البدلات' : 'Allowances Sum'}</th>
                <th className="py-2.5 px-3 text-right">{lang === 'ar' ? 'الصافي التقريبي' : 'Net Estimate'}</th>
                <th className="py-2.5 px-3 text-center">{lang === 'ar' ? 'مسير الراتب وإجراءات الصرف' : 'Certified Payslip Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                    {lang === 'ar' ? 'لا يوجد موظف يطابق مدخلات البحث هذه حالياً.' : 'No candidate record matches the search parameters.'}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const basic = Number(emp.basicSalary) || 0;
                  const housing = Number(emp.allowances?.housing) || 0;
                  const transport = Number(emp.allowances?.transport) || 0;
                  const phone = Number(emp.allowances?.phone) || 0;
                  const food = Number(emp.allowances?.food) || 0;
                  const overtime = Number(emp.allowances?.overtime) || 0;
                  const bonuses = Number(emp.allowances?.bonuses) || 0;
                  const deductions = Number(emp.allowances?.deductions) || 0;
                  const loans = Number(emp.allowances?.loans) || 0;

                  const allowSum = housing + transport + phone + food + overtime + bonuses;
                  const netSalary = basic + allowSum - deductions - loans;

                  return (
                    <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50/50 text-slate-600 transition">
                      <td className="py-3 px-3 font-mono font-black text-[#0072BC]">{emp.id}</td>
                      <td className="py-3 px-3">
                        <p className="font-extrabold text-slate-800 leading-tight">{emp.arabicName}</p>
                        <span className="text-[9px] text-slate-400 font-mono italic block">{emp.englishName}</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-500">{emp.iqamaId || '---'}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">{emp.jobTitle}</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">{basic.toLocaleString()} ريال</td>
                      <td className="py-3 px-3 font-mono text-amber-700">+{allowSum.toLocaleString()} ريال</td>
                      <td className="py-3 px-3 font-mono font-black text-emerald-700">{netSalary.toLocaleString()} ريال</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleOpenEmpSalary(emp)}
                          className="px-3 py-1.5 bg-[#0072BC] hover:bg-sky-600 font-extrabold text-white text-[10px] rounded-xl transition flex items-center gap-1.5 mx-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'عرض وتحديث مسير الراتب' : 'View & Adjust Financial Record'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Banks Redirect Shortcuts Section - WPS Integration */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl text-right mt-4" id="bank-quick-billing-links-container" dir="rtl">
          <div className="space-y-1">
            <h5 className="text-xs font-black text-slate-700">🏦 بوابة البنوك المباشرة وصرف أجور ورواتب الموظفين (WPS):</h5>
            <p className="text-[10px] text-slate-400 font-medium">سجل دخولاً آمناً لبوابتك المصرفية المباشرة لرفع مسير شهر {gregoryMonths.find(m => m.id === selectedMonth)?.name_ar} وإرسال الرواتب مباشرة للموظفين.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. بنك الراجحي (أزرق) */}
            <a
              href="https://business.alrajhibank.com.sa/business/#/login"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm"
              id="bank-alrajhi-link"
            >
              <span>🏛️ بنك الراجحي</span>
            </a>

            {/* 2. بنك الاهلي (أخضر) */}
            <a
              href="https://www.alahliecorp.com/eCorpNew/login?lang=ar"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm"
              id="bank-alahli-link"
            >
              <span>🏛️ بنك الاهلي</span>
            </a>

            {/* 3. بنك الرياض (بنفسجي) */}
            <a
              href="https://www.riyadbank.com/ar/business-pioneers-sme"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm"
              id="bank-riyad-link"
            >
              <span>🏛️ بنك الرياض</span>
            </a>
          </div>
        </div>
      </div>

      {/* 4. Rich Popup Dialog Modal showing finances & Payslip option */}
      {selectedEmp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 max-w-2xl w-full max-h-[92vh] flex flex-col justify-between gap-4 text-right overflow-y-auto" dir="rtl">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b pb-3">
              <button 
                onClick={() => setSelectedEmp(null)}
                className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-xs font-black"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="text-right">
                <h3 className="font-black text-[#0072BC] text-base">
                  💵 {lang === 'ar' ? 'الملف المالي والمكافآت والبدلات للموظف' : 'Wages Ledger and adjustments card'}
                </h3>
                <p className="text-[10px] text-slate-400">
                  {selectedEmp.arabicName} | ID: {selectedEmp.id}
                </p>
              </div>
            </div>

            {/* Content Tabs (Editor / Printable Document generator) */}
            <div className="flex-1 space-y-4">
              
              {/* Tabs button */}
              <div className="flex border-b border-slate-100 text-xs gap-4 font-black">
                <button 
                  onClick={() => setShowPayslipView(false)}
                  className={`pb-2 border-b-2 px-1 transition ${!showPayslipView ? 'border-[#0072BC] text-[#0072BC]' : 'border-transparent text-slate-400'}`}
                >
                  ⚙️ {lang === 'ar' ? 'مراجعة وتعديل المبالغ المالية' : 'Adjust Ledger Variables'}
                </button>
                <button 
                  onClick={() => setShowPayslipView(true)}
                  className={`pb-2 border-b-2 px-1 transition ${showPayslipView ? 'border-[#0072BC] text-[#0072BC]' : 'border-transparent text-slate-400'}`}
                >
                  📄 {lang === 'ar' ? 'عرض وإصدار كشف الراتب (Payslip Document)' : 'Payslip Document Proof'}
                </button>
              </div>

              {/* View Panel A: Raw Financial Editor (تحديث بيانات حقيقية بقاعدة البيانات) */}
              {!showPayslipView && (
                <div className="space-y-4">
                  <p className="text-[11px] text-indigo-700 bg-indigo-50/50 p-2 border border-indigo-100/50 rounded-xl leading-normal font-medium">
                    🔍 {lang === 'ar' ? 'ملاحظة: تعديل وتحديث هذه الحقول المالية يرتبط برقم الموظف وقاعدة البيانات الحقيقية للشركة.' : 'Tuning variables will override structural data rows in storage directly.'}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    
                    {/* Basic */}
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'الراتب الأساسي (ريال) *' : 'Base Basic Salary *'}</label>
                      <input 
                        type="number"
                        value={editBasic}
                        onChange={(e) => setEditBasic(Number(e.target.value) || 0)}
                        className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 font-mono font-bold"
                      />
                    </div>

                    {/* Housing */}
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'بدل سكن شهري (ريال) *' : 'Housing Allowance *'}</label>
                      <input 
                        type="number"
                        value={editHousing}
                        onChange={(e) => setEditHousing(Number(e.target.value) || 0)}
                        className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 font-mono font-bold"
                      />
                    </div>

                    {/* Transport */}
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'بدل نقل شهري (ريال) *' : 'Transport Allowance *'}</label>
                      <input 
                        type="number"
                        value={editTransport}
                        onChange={(e) => setEditTransport(Number(e.target.value) || 0)}
                        className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 font-mono font-bold"
                      />
                    </div>

                    {/* Overtime */}
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'إضافي ساعات العمل (ريال)' : 'Overtime Extra SAR'}</label>
                      <input 
                        type="number"
                        value={editOvertime}
                        onChange={(e) => setEditOvertime(Number(e.target.value) || 0)}
                        className="w-full p-2 border border-slate-200 rounded-xl bg-sky-50 text-indigo-900 font-mono font-bold"
                      />
                    </div>

                    {/* Bonuses */}
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'مكافآت وحوافز أداء (ريال)' : 'Bonuses / Rewards Outstanding'}</label>
                      <input 
                        type="number"
                        value={editBonuses}
                        onChange={(e) => setEditBonuses(Number(e.target.value) || 0)}
                        className="w-full p-2 border border-slate-200 rounded-xl bg-sky-50 text-indigo-900 font-mono font-bold"
                      />
                    </div>

                    {/* Deductions */}
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'خصومات وتأخيرات وغيابات (ريال)' : 'Deductions Overlord'}</label>
                      <input 
                        type="number"
                        value={editDeductions}
                        onChange={(e) => setEditDeductions(Number(e.target.value) || 0)}
                        className="w-full p-2 border border-slate-200 rounded-xl bg-rose-50 text-rose-800 font-mono font-bold"
                      />
                    </div>

                    {/* Loans */}
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'سلف مالية مستقطعة (ريال)' : 'Advances Loans outstanding'}</label>
                      <input 
                        type="number"
                        value={editLoans}
                        onChange={(e) => setEditLoans(Number(e.target.value) || 0)}
                        className="w-full p-2 border border-slate-200 rounded-xl bg-rose-50 text-rose-800 font-mono font-bold"
                      />
                    </div>

                    {/* Net Calculations Indicator */}
                    <div className="space-y-1 text-right flex flex-col justify-end">
                      <span className="block text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'صافي الراتب المستحق (بعد الحساب)' : 'Net Wages Calculated'}</span>
                      <p className="text-lg font-black text-emerald-700 font-mono leading-none pt-2">
                        {(editBasic + editHousing + editTransport + editOvertime + editBonuses - editDeductions - editLoans).toLocaleString()} ريال
                      </p>
                    </div>

                  </div>

                  {/* Save button to Database */}
                  <div className="pt-2 text-left">
                    <button 
                      onClick={handleSaveChangesLocal}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition"
                    >
                      💾 {lang === 'ar' ? 'حفظ وتحديث ملف الموظف والمسير' : 'Save Salary Record to DB'}
                    </button>
                  </div>
                </div>
              )}

              {/* View Panel B: Printable Official Document */}
              {showPayslipView && (
                <div className="space-y-4">
                  
                  {/* Clean table design ready to print */}
                  <div className="p-5 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/60 font-sans space-y-4 text-xs">
                    
                    {/* Header */}
                    <div className="border-b-2 border-slate-200 pb-2 flex justify-between items-center">
                      <div className="text-right">
                        <h4 className="font-black text-slate-800 text-sm">مجموعة الوليد للعلامات التجارية</h4>
                        <p className="text-[9px] text-slate-400">WPS Compliant Standard Payslip</p>
                      </div>
                      <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-bold">رسمي ومعتمد</span>
                    </div>

                    {/* Meta information */}
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-slate-600 text-[11px] pb-2 border-b border-slate-100">
                      <p><strong>الموظف:</strong> {selectedEmp.arabicName}</p>
                      <p><strong>رقم الموظف:</strong> <span className="font-mono font-black">{selectedEmp.id}</span></p>
                      <p><strong>رقم الهوية/الإقامة:</strong> <span className="font-mono">{selectedEmp.iqamaId || '---'}</span></p>
                      <p><strong>المسمى الوظيفي:</strong> {selectedEmp.jobTitle}</p>
                    </div>

                    {/* Financial details table */}
                    <div className="space-y-1.5 pt-1">
                      <h5 className="font-extrabold text-[11px] text-[#0072BC]">تفريغ الحركة المالية للشهر الحالي:</h5>
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                        <div className="bg-slate-100 p-1.5 rounded">
                          <span className="text-slate-400 text-[9px] block">راتب أساسي</span>
                          <span className="text-slate-800 font-mono text-[11px]">{editBasic}</span>
                        </div>
                        <div className="bg-slate-100 p-1.5 rounded">
                          <span className="text-slate-400 text-[9px] block">بدل السكن</span>
                          <span className="text-slate-800 font-mono text-[11px]">{editHousing}</span>
                        </div>
                        <div className="bg-slate-100 p-1.5 rounded">
                          <span className="text-slate-400 text-[9px] block">بدل نقل</span>
                          <span className="text-slate-800 font-mono text-[11px]">{editTransport}</span>
                        </div>
                        <div className="bg-sky-50 p-1.5 rounded border border-sky-100">
                          <span className="text-sky-600 text-[9px] block">إضافي ومكافآت</span>
                          <span className="text-indigo-900 font-mono text-[11px]">{editOvertime + editBonuses}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold pt-1">
                        <div className="bg-rose-50 p-1.5 rounded border border-rose-100">
                          <span className="text-rose-600 text-[9px] block">استقطاع غياب/خصومات</span>
                          <span className="text-rose-800 font-mono text-[11px]">-{editDeductions}</span>
                        </div>
                        <div className="bg-rose-50 p-1.5 rounded border border-rose-100">
                          <span className="text-rose-600 text-[9px] block">سلف مستقطعة</span>
                          <span className="text-rose-800 font-mono text-[11px]">-{editLoans}</span>
                        </div>
                        <div className="bg-emerald-50 p-1.5 rounded border border-emerald-100 text-emerald-800">
                          <span className="text-emerald-700 text-[9px] block font-black">صافي الراتب المستحق</span>
                          <span className="text-emerald-900 font-mono text-[12px] font-extrabold">
                            {editBasic + editHousing + editTransport + editOvertime + editBonuses - editDeductions - editLoans} ريال
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Document Command Center buttons */}
                  <div className="flex flex-wrap gap-2 text-xs font-black justify-end pt-2">
                    
                    {/* Send to ESS button */}
                    <button 
                      onClick={handleSendPayslipToESS}
                      className={`px-4 py-2 text-white rounded-xl transition flex items-center gap-1.5 ${
                        sendSuccess ? 'bg-emerald-600' : 'bg-[#0072BC] hover:brightness-105'
                      }`}
                    >
                      {sendSuccess ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>{lang === 'ar' ? 'تم الإرسال لملف الموظف بنجاح ✓' : 'Sent to ESS successfully ✓'}</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>{lang === 'ar' ? 'إرسال مسير الراتب الفوري' : 'Send Payslip to ESS'}</span>
                        </>
                      )}
                    </button>

                    {/* Print button */}
                    <button 
                      onClick={handlePrintPayslip}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex items-center gap-1.5"
                    >
                      <Printer className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'طباعة الكشف' : 'Print now'}</span>
                    </button>

                    {/* PDF Export button */}
                    <button 
                      onClick={handleDownloadPDF}
                      className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center gap-1.5"
                    >
                      <FileText className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'تصدير كشفت PDF' : 'Save as PDF'}</span>
                    </button>

                  </div>
                </div>
              )}

            </div>

            {/* Back Close */}
            <div className="border-t pt-3">
              <button 
                onClick={() => setSelectedEmp(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs"
              >
                {lang === 'ar' ? 'إغلاق ومتابعة المسير' : 'Close Details'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. DEDUCTIONS AND DISCIPLINARY ACTIONS MODULE (الخصومات والجزاءات) */}
      {/* ======================================================== */}
      {activeHRSubTab === 'payroll_deductions' && (
        <div className="space-y-6 text-right" dir="rtl">
          
          {/* Header Action Section */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-800">🛑 إدارة الخصومات والجزاءات المالية للموظفين</h3>
              <p className="text-xs text-slate-500">
                تسجيل حركة الجزاءات والخصومات والسلف يدوياً استناداً إلى قرارات وإشراف الموارد البشرية، مع إمكانية التعديل والإزالة والاتصال المباشر بحساب الموظف.
              </p>
            </div>
            
            <button
              onClick={() => {
                setEditingDeduction(null);
                setDedFormEmpId(employees[0]?.id || '');
                setDedFormType('تأخير');
                setDedFormAmount(0);
                setDedFormReason('');
                setDedFormDate('2026-06-13');
                setDedFormIsManual(false);
                setDedFormStatus('confirmed');
                setCalcDays(1);
                setShowDeductionModal(true);
              }}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-sm shadow-red-100"
            >
              📥 + إضافة خصم جزائي / سلفة للموظف
            </button>
          </div>

          {/* Search bar inside Deductions list */}
          <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 border border-slate-100">
            <Search className="w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="اكتب اسم الموظف أو رقم الإقامة لتصفية الاستقطاعات المستهدفة..."
              value={deductionSearchQuery}
              onChange={(e) => setDeductionSearchQuery(e.target.value)}
              className="bg-transparent text-xs w-full text-slate-800 focus:outline-none placeholder-slate-400 font-bold"
            />
          </div>

          {/* Deductions registry list */}
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-fold">
                    <th className="p-4 whitespace-nowrap">اسم الموظف</th>
                    <th className="p-4 whitespace-nowrap">نوع الخصم</th>
                    <th className="p-4 whitespace-nowrap">المبلغ المستقطع</th>
                    <th className="p-4 whitespace-nowrap">التفاصيل والسبب المحتسب</th>
                    <th className="p-4 whitespace-nowrap">التاريخ</th>
                    <th className="p-4 whitespace-nowrap">حالة الاعتماد</th>
                    <th className="p-4 whitespace-nowrap">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fetchingData ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-400 font-black">
                        ⏳ جاري فحص وتحميل البيانات الحية من الخادم الآمن...
                      </td>
                    </tr>
                  ) : deductionsList.filter(d => {
                    const term = deductionSearchQuery.toLowerCase();
                    return (d.employeeName || '').toLowerCase().includes(term) || (d.reason || '').toLowerCase().includes(term);
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400 font-bold">
                        📭 لا يوجد أي سجل خصومات أو عقوبات مالية تطابق فلاتر البحث الحالي لشهر {selectedMonth}.
                      </td>
                    </tr>
                  ) : deductionsList.filter(d => {
                    const term = deductionSearchQuery.toLowerCase();
                    return (d.employeeName || '').toLowerCase().includes(term) || (d.reason || '').toLowerCase().includes(term);
                  }).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition font-bold text-slate-700">
                      <td className="p-4 block">
                        <p className="font-extrabold text-slate-800 text-xs">{item.employeeName}</p>
                        <span className="text-[10px] font-mono text-slate-400">ID: {item.employeeId}</span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                          item.type === 'غياب' ? 'bg-red-50 text-red-700' :
                          item.type === 'سلفة' ? 'bg-indigo-50 text-indigo-700' :
                          item.type === 'تأخير' ? 'bg-amber-50 text-amber-700' :
                          item.type === 'مخالفة' ? 'bg-orange-50 text-orange-700' :
                          item.type === 'تلف عهدة' ? 'bg-yellow-50 text-yellow-700' :
                          item.type === 'خصم إداري' ? 'bg-slate-50 text-slate-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap font-mono text-red-600 font-extrabold">
                        {Number(item.amount).toLocaleString()} ريال
                      </td>
                      <td className="p-4 text-slate-500 max-w-sm font-medium">
                        {item.reason}
                      </td>
                      <td className="p-4 whitespace-nowrap font-mono text-slate-400">{item.date}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] ${
                          item.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
                          item.status === 'notified' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.status === 'confirmed' ? 'مؤكد معتمد 🔐' :
                           item.status === 'notified' ? 'مُرسل للموظف 📤' : 'مسودة مؤقتة 📄'}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap flex gap-1 items-center">
                        <button 
                          onClick={() => handleOpenEditDeduction(item)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-black text-[10px] transition"
                        >
                          ⚙️ تعديل
                        </button>
                        <button 
                          onClick={() => handleDeleteDeduction(item.id)}
                          className={`px-2.5 py-1 rounded font-black text-[10px] transition ${
                            confirmDeleteId === item.id 
                              ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse' 
                              : 'bg-red-50 hover:bg-red-100 text-red-600'
                          }`}
                        >
                          {confirmDeleteId === item.id ? '⚠️ لتأكيد المسح اضغط ثانية' : '🗑️ إزالة'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ==================== CREATE/EDIT DEDUCTION POPUP MODAL ==================== */}
          {showDeductionModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" dir="rtl">
              <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-100 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" id="deductions-interactive-modal">
                
                <div className="flex justify-between items-center pb-2 border-b">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5 text-[#0072BC]">
                    {editingDeduction ? '⚠️ تعديل تفاصيل ومستند حركة الاستقطاع' : '📥 إيقاع جزاء جديد أو تسجيل استقطاع مالي للموظف'}
                  </h4>
                  <button 
                    onClick={() => { setShowDeductionModal(false); setEditingDeduction(null); }}
                    className="text-slate-400 hover:text-slate-600 text-lg font-black"
                  >
                    ✕
                  </button>
                </div>

                {/* Step 1: Employee search or details view */}
                <div className="space-y-3">
                  {!dedFormEmpId ? (
                    <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-right">
                      <label className="block text-xs font-black text-slate-700">👤 ابحث باسم الموظف بناءً على البيانات في الموارد البشرية:</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="اكتب جزءاً من اسم الموظف، الكود، أو رقم الإقامة..."
                          value={modalEmpSearch}
                          onChange={(e) => setModalEmpSearch(e.target.value)}
                          className="w-full bg-white border border-slate-200 p-3 pr-10 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                        />
                        <Search className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" />
                      </div>
                      
                      <div className="max-h-48 overflow-y-auto space-y-1.5 mt-2 bg-white p-2 rounded-xl border border-slate-100">
                        {employees
                          .filter(emp => {
                            const query = modalEmpSearch.toLowerCase();
                            return (
                              (emp.arabicName || '').toLowerCase().includes(query) ||
                              (emp.englishName || '').toLowerCase().includes(query) ||
                              (emp.id || '').toLowerCase().includes(query) ||
                              (emp.iqamaId || '').toLowerCase().includes(query) ||
                              (emp.jobTitle || '').toLowerCase().includes(query)
                            );
                          })
                          .map(emp => (
                            <button
                              key={emp.id}
                              type="button"
                              onClick={() => {
                                setDedFormEmpId(emp.id);
                                setModalEmpSearch('');
                              }}
                              className="w-full text-right p-2.5 hover:bg-slate-50 rounded-lg flex justify-between items-center text-xs transition border border-transparent hover:border-slate-200 font-bold text-slate-800"
                            >
                              <div>
                                <p className="font-extrabold text-slate-800">{emp.arabicName}</p>
                                <span className="text-[10px] text-slate-400 font-semibold">{emp.jobTitle} • {emp.department}</span>
                              </div>
                              <span className="text-indigo-600 font-mono text-[10px] bg-indigo-50 px-2.5 py-1 rounded-md font-black">{emp.id}</span>
                            </button>
                          ))}
                        {employees.filter(emp => {
                          const query = modalEmpSearch.toLowerCase();
                          return (emp.arabicName || '').toLowerCase().includes(query) || (emp.englishName || '').toLowerCase().includes(query) || (emp.id || '').toLowerCase().includes(query);
                        }).length === 0 && (
                          <p className="text-center text-slate-400 text-xs py-4">لا توجد نتائج تطابق البحث</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Display selected employee visual finance details card
                    (() => {
                      const emp = employees.find(e => e.id === dedFormEmpId);
                      if (!emp) return null;
                      const basic = Number(emp.basicSalary) || 0;
                      const h = Number(emp.allowances?.housing) || 0;
                      const t = Number(emp.allowances?.transport) || 0;
                      const p = Number(emp.allowances?.phone) || 0;
                      const f = Number(emp.allowances?.food) || 0;
                      const o = Number(emp.allowances?.overtime) || 0;
                      const b = Number(emp.allowances?.bonuses) || 0;
                      const totalSalary = basic + h + t + p + f + o + b;
                      const dailyRate = totalSalary / 30;

                      return (
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-right space-y-3">
                          <div className="flex justify-between items-center border-b pb-2">
                            <div>
                              <h5 className="font-extrabold text-slate-800 text-xs">👤 الموظف المحدد وعموم بياناته الحية:</h5>
                              <p className="font-black text-[#0072BC] text-sm mt-0.5">{emp.arabicName} ({emp.id})</p>
                            </div>
                            {!editingDeduction && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDedFormEmpId('');
                                  setDedFormAmount(0);
                                  setCalcDays(1);
                                }}
                                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-black rounded-lg transition"
                              >
                                🔄 تغيير الموظف
                              </button>
                            )}
                          </div>

                          {/* Profile Personnel Info */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-100">
                            <div>
                              <span className="text-slate-400 block text-[9px] font-bold">المسمى الوظيفي:</span>
                              <p className="font-extrabold text-slate-800 mt-0.5">{emp.jobTitle}</p>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9px] font-bold">القسم الإداري:</span>
                              <p className="font-extrabold text-slate-800 mt-0.5">{emp.department || 'إدارة عامة'}</p>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9px] font-bold">رقم الإقامة / الهوية:</span>
                              <p className="font-mono font-extrabold text-[#0072BC] mt-0.5">{emp.iqamaId || '---'}</p>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9px] font-bold">الجنسية:</span>
                              <p className="font-extrabold text-slate-800 mt-0.5">{emp.nationality || 'سعودي'}</p>
                            </div>
                          </div>

                          {/* Financial Details */}
                          <h6 className="font-black text-slate-700 text-xs px-1">📊 الحزمة المالية والراتب للشهر الجاري:</h6>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-700">
                            <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                              <span className="text-slate-400 block text-[9px] font-bold">الراتب الأساسي:</span>
                              <p className="font-mono font-black text-slate-800 mt-0.5">{basic.toLocaleString()} ريال</p>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                              <span className="text-slate-400 block text-[9px] font-bold">بدلات ومكافآت:</span>
                              <p className="font-mono font-black text-emerald-600 mt-0.5">{(h + t + p + f + o + b).toLocaleString()} ريال</p>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-100 bg-sky-50/50">
                              <span className="text-slate-400 block text-[9px] font-bold text-sky-800">إجمالي الأجر المعتمد:</span>
                              <p className="font-mono font-black text-slate-800 mt-0.5">{totalSalary.toLocaleString()} ريال</p>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-100 bg-rose-50/30">
                              <span className="text-slate-400 block text-[9px] font-bold text-red-700">قيمة يومية الأجر (1/30):</span>
                              <p className="font-mono font-black text-red-600 mt-0.5">{dailyRate.toFixed(2)} ريال</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>

                {/* Step 2: Form options */}
                {dedFormEmpId && (
                  <div className="space-y-4">
                    
                    {/* Select Category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-black text-slate-600">🛑 تصنيف بند الخصم والعملية:</label>
                        <select
                          value={dedFormType}
                          onChange={(e) => setDedFormType(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:bg-white"
                        >
                          <option value="تأخير">تأخير حركي ومواظبة (تأخير)</option>
                          <option value="غياب">غياب بدون إذن رسمي (غياب)</option>
                          <option value="سلفة">سلفة مالية طارئة (سلفة)</option>
                          <option value="مخالفة">ارتكاب مخالفة لائحة العمل (مخالفة)</option>
                          <option value="تلف عهدة">تلف أو إهلاك عهدة وتجهیزات</option>
                          <option value="خصم إداري">استقطاع انضباطي إداري</option>
                          <option value="أخرى">أشياء وأسباب أخرى</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-black text-slate-600">📅 تاريخ قيد الواقعة بالملف:</label>
                        <input 
                          type="date"
                          value={dedFormDate}
                          onChange={(e) => setDedFormDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-mono font-bold text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Specialized options conditional fields */}
                    <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-3.5 text-right">
                      
                      {dedFormType === 'تأخير' && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-slate-700">🕒 معامل التأخير بالملف (عدد الأيام / الواقعات):</span>
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded">ربع يومية مستقطعة لكل واقعة</span>
                          </div>
                          <input 
                            type="number"
                            min={1}
                            value={calcDays}
                            onChange={(e) => setCalcDays(Math.max(1, Number(e.target.value) || 1))}
                            className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold font-mono focus:outline-none"
                            placeholder="أدخل عدد المرات أو الأيام..."
                          />
                          <p className="text-[10px] text-slate-500 font-extrabold leading-relaxed">
                            💡 الحساب التلقائي للجزاء: (ربع اليومية من إجمالي الأجر) ← 
                            <span className="text-red-600 font-mono font-black mx-1">
                              {(( (employees.find(e => e.id === dedFormEmpId)?.basicSalary || 0) / 30 ) * 0.25).toFixed(2)} ريال 
                            </span> 
                            عن اليوم، ليصبح الإجمالي المستقطع: 
                            <span className="text-red-700 font-mono font-black mx-1">
                              {dedFormAmount} ريال.
                            </span>
                          </p>
                        </div>
                      )}

                      {dedFormType === 'غياب' && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-slate-700">🚫 غياب غير مبرر أو مرخص (عدد الأيام):</span>
                            <span className="text-[10px] bg-red-100 text-red-800 font-black px-2 py-0.5 rounded">خصم مزدوج دبل اليومية</span>
                          </div>
                          <input 
                            type="number"
                            min={1}
                            value={calcDays}
                            onChange={(e) => setCalcDays(Math.max(1, Number(e.target.value) || 1))}
                            className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold font-mono focus:outline-none"
                            placeholder="أدخل عدد أيام الغياب..."
                          />
                          <p className="text-[10px] text-slate-500 font-extrabold leading-relaxed">
                            💡 الحساب التلقائي للجزاء: (خصم يومين دبل عالي من الإجمالي) ← 
                            <span className="text-red-600 font-mono font-black mx-1">
                              {(( (employees.find(e => e.id === dedFormEmpId)?.basicSalary || 0) / 30 ) * 2).toFixed(2)} ريال 
                            </span> 
                            عن اليوم غياب واحد، ليصبح ضربة الجزاء المستقطعة: 
                            <span className="text-red-700 font-mono font-black mx-1">
                              {dedFormAmount} ريال.
                            </span>
                          </p>
                        </div>
                      )}

                      {dedFormType === 'سلفة' && (
                        <div className="space-y-3">
                          <h6 className="text-xs font-black text-[#0072BC]">💰 خيارات وضوابط السداد والتقسيط للسلفة:</h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-500">1. مبلغ السلفة المالية المطلوبة (ريال):</label>
                              <input 
                                type="number"
                                value={advAmount}
                                onChange={(e) => setAdvAmount(Number(e.target.value) || 0)}
                                className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs font-mono font-black text-slate-800 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-500">2. تاريخ صرف/تسليم السلفة المعتمد:</label>
                              <input 
                                type="date"
                                value={advDate}
                                onChange={(e) => setAdvDate(e.target.value)}
                                className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs font-mono font-bold text-slate-700"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-500">3. سبب تقديم السلفة الموجه للإدارة:</label>
                              <input 
                                type="text"
                                value={advReason}
                                onChange={(e) => setAdvReason(e.target.value)}
                                className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                                placeholder="مثال: سلفة لدواعي زواج أو صحية شخصية..."
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-500">4. نظام سداد وقسط الاستقطاع:</label>
                              <select 
                                value={advRepayment}
                                onChange={(e) => setAdvRepayment(e.target.value)}
                                className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs font-bold text-slate-700"
                              >
                                <option value="نظام أقساط شهرياً">نظام أقساط (استقطاع تدريجي)</option>
                                <option value="دفع كامل المبلغ في مسير الشهر المقبل">دفع كامل المبلغ دفعة واحدة</option>
                              </select>
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-500">5. تاريخ استحقاق القسط/السداد الأخير:</label>
                              <input 
                                type="date"
                                value={advFinalRepayDate}
                                onChange={(e) => setAdvFinalRepayDate(e.target.value)}
                                className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs font-mono font-bold text-slate-700"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {dedFormType === 'مخالفة' && (
                        <div className="space-y-3">
                          <h6 className="text-xs font-black text-orange-700_">⚖️ تصنيف نوع المخالفة المرتكبة من القائمة المقررة:</h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-500">تصنيف المخالفة العمالية:</label>
                              <select
                                value={violCategory}
                                onChange={(e) => setViolCategory(e.target.value)}
                                className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold text-slate-800"
                              >
                                <option value="مرورية">مخالفة مرورية مروية (سيارات المنشأة)</option>
                                <option value="سلامة PPE السيفتي">مخالفة سلامة وصحة مهنية PPE السيفتي</option>
                                <option value="سياسات الشركة">مخالفة سياسات وقواعد السلوك بالشركة</option>
                                <option value="إنتاجية">مخالفة إنتاجية وتقصير في مسار العمل</option>
                                <option value="أخرى">أخرى (أسباب مخصصة مع الوصف)</option>
                              </select>
                            </div>
                            
                            {violCategory === 'أخرى' && (
                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-500">اكتب هنا تفاصيل نوع المخالفة المقررة:</label>
                                <input 
                                  type="text"
                                  value={violOtherDetails}
                                  onChange={(e) => setViolOtherDetails(e.target.value)}
                                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                                  placeholder="مثال: مخالفة التأخر المتكرر بعد ساعات الراحة..."
                                />
                              </div>
                            )}

                            <div className={`space-y-1 ${violCategory !== 'أخرى' ? 'md:col-span-2' : ''}`}>
                              <label className="block text-[10px] font-bold text-slate-500">مبلغ الاستقطاع المالي للجزاء كاش (ريال):</label>
                              <input 
                                type="number"
                                value={dedFormAmount}
                                onChange={(e) => setDedFormAmount(Number(e.target.value) || 0)}
                                className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-mono font-black text-red-600 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {dedFormType === 'تلف عهدة' && (
                        <div className="space-y-3">
                          <h6 className="text-xs font-black text-yellow-800_">🛡️ العهد المسلمة للموضع وخصم التلف عنها:</h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            
                            {/* Fetch custody keys */}
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-500">اختر العهد التابعة للموظف من السجل:</label>
                              <select
                                onChange={(e) => setDamageItemName(e.target.value)}
                                value={damageItemName}
                                className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs font-bold text-slate-800"
                              >
                                <option value="">-- اختر العهدة المطابقة للتخريب --</option>
                                {(() => {
                                  const emp = employees.find(e => e.id === dedFormEmpId);
                                  if (!emp) return null;
                                  const list: string[] = [];
                                  if (emp.custody?.laptop) list.push(`كمبيوتر محمول: ${emp.custody.laptop}`);
                                  if (emp.custody?.tools) list.push(`أدوات وتجهيزات عمل: ${emp.custody.tools}`);
                                  if (emp.custody?.vehicles) list.push(`مركبة نقل تابعة: ${emp.custody.vehicles}`);
                                  if (emp.custody?.other) list.push(`عهدة أخرى: ${emp.custody.other}`);
                                  
                                  if (emp.custodyAssets) {
                                    emp.custodyAssets.forEach(a => {
                                      list.push(`${a.category} - ${a.name} (${a.additionalInfo})`);
                                    });
                                  }

                                  if (list.length === 0) {
                                    return <option value="أدوات عامة">لا توجد عهد رسمية مقيدة (سجل عهدة عام)</option>;
                                  }
                                  return list.map((item, index) => (
                                    <option key={index} value={item}>{item}</option>
                                  ));
                                })()}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-500">اسم بند الخصم (العهد المتلفة):</label>
                              <input 
                                type="text"
                                value={damageItemName}
                                onChange={(e) => setDamageItemName(e.target.value)}
                                className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                                placeholder="مثال: شاشة الهاتف المحمول، مفاتيح العهد..."
                              />
                            </div>

                            <div className="space-y-1 md:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-500">التكلفة والخصم المستقطع الفعلي للتعويض (ريال):</label>
                              <input 
                                type="number"
                                value={damagePrice}
                                onChange={(e) => setDamagePrice(Number(e.target.value) || 0)}
                                className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs font-mono font-black text-red-600 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {dedFormType === 'خصم إداري' && (
                        <div className="space-y-3">
                          <h6 className="text-xs font-black text-slate-700">💼 استقطاع انضباطي إداري تفصيلي ومباشر:</h6>
                          <div className="space-y-2">
                            
                            {/* Checkbox pull custody */}
                            <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                              <input 
                                type="checkbox"
                                checked={withdrawCustody}
                                onChange={(e) => setWithdrawCustody(e.target.checked)}
                                className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                              />
                              <span>سحب العهد وتجميد الصلاحيات التقنية للموظف 🛑</span>
                            </label>

                            {/* Checkbox apply financial deduction */}
                            <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                              <input 
                                type="checkbox"
                                checked={adminApplyDeduction}
                                onChange={(e) => setAdminApplyDeduction(e.target.checked)}
                                className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                              />
                              <span>تحميل واستقطاع مالي مباشر من الراتب شهرياً 💵</span>
                            </label>

                            {adminApplyDeduction && (
                              <div className="space-y-1 text-right">
                                <label className="block text-[10px] font-bold text-slate-500">القيمة المستقطعة يدوياً للخصم الإداري (ريال):</label>
                                <input 
                                  type="number"
                                  value={dedFormAmount}
                                  onChange={(e) => setDedFormAmount(Number(e.target.value) || 0)}
                                  className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs font-mono font-black text-red-600 focus:outline-none"
                                />
                              </div>
                            )}

                            {/* Reason for executive order */}
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-500">حيثيات وموافقة القرار الإداري المسند للملف:</label>
                              <textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                                rows={2}
                                placeholder="اكتب هنا مبررات وسند هذا الخصم الإداري بالتفصيل..."
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {dedFormType === 'أخرى' && (
                        <div className="space-y-2">
                          <label className="block text-xs font-black text-slate-700">💵 القيمة المالية للخصم يدوياً (ريال):</label>
                          <input 
                            type="number"
                            value={dedFormAmount}
                            onChange={(e) => setDedFormAmount(Number(e.target.value) || 0)}
                            className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-mono font-black text-red-600 focus:outline-none focus:bg-white"
                          />
                        </div>
                      )}

                    </div>

                    {/* Step 3: Global summary display */}
                    <div className="space-y-1">
                      <label className="block text-xs font-black text-[#0072BC]">✍️ شرح تفصيلي وسبب الخصم (يظهر مباشرة للموظف في حسابه كإشعار رسمي):</label>
                      <textarea 
                        value={dedFormReason}
                        onChange={(e) => setDedFormReason(e.target.value)}
                        placeholder="اكتب تفاصيل المخالفة أو السلفة أو سبب هذا الخصم بالتفصيل ليكون واضحاً للموظف..."
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:bg-white leading-relaxed"
                        rows={3}
                      />
                    </div>

                    {/* Warning banner */}
                    {isDeductionBlocked && (
                      <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-2 text-rose-800 text-xs font-bold leading-relaxed mb-4 text-right" id="deductions-limit-warning-banner">
                        <span className="text-base">⚠️</span>
                        <div>
                          <p className="font-extrabold">{lang === 'ar' ? 'تنبيه تجاوز الحد القانوني للاستقطاعات (نصف الراتب):' : 'WPS Legal Deduction Limit Warning:'}</p>
                          <p className="text-[11px] mt-1 text-rose-700">{deductionWarningMessage}</p>
                        </div>
                      </div>
                    )}

                    {/* Action buttons with custom labels requested by user */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
                      <div className="flex gap-2">
                        {/* 1. حفظ كمسودة */}
                        <button
                          onClick={() => handleSaveDeduction('draft')}
                          className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs rounded-xl transition"
                        >
                          💾 حفظ الخصم كمسودة
                        </button>

                        {/* 2. تأكيد الخصم */}
                        <button
                          onClick={() => {
                            if (isDeductionBlocked) {
                              triggerError(lang === 'ar' ? 'عذراً لا تقدر على تأكيد الخصم لتجاوزه نسبة نصف الراتب!' : 'Deduction exceeds half of monthly salary threshold!');
                              return;
                            }
                            handleSaveDeduction('confirmed');
                          }}
                          disabled={isDeductionBlocked}
                          className={`px-4 py-2.5 font-black text-xs rounded-xl shadow-sm transition-all duration-250 ${
                            isDeductionBlocked 
                              ? 'bg-rose-100 text-rose-400 border border-rose-200 cursor-not-allowed select-none opacity-50' 
                              : 'bg-red-600 hover:bg-red-700 text-white'
                          }`}
                        >
                          🔐 تأكيد الخصم
                        </button>
                      </div>

                      <div className="flex gap-2">
                        {/* 3. ارسال اشعار خصم للموظف */}
                        <button
                          onClick={() => {
                            if (isDeductionBlocked) {
                              triggerError(lang === 'ar' ? 'عذراً لا تقدر على التفعيل لأن إجمالي الخصم يتجاوز نصف الراتب!' : 'Deduction exceeds half of monthly salary threshold!');
                              return;
                            }
                            handleSaveDeduction('notified');
                          }}
                          disabled={isDeductionBlocked}
                          className={`px-4 py-2.5 font-black text-xs rounded-xl transition shadow-sm ${
                            isDeductionBlocked 
                              ? 'bg-[#0072BC]/20 text-blue-200 border border-[#0072BC]/10 cursor-not-allowed select-none opacity-50' 
                              : 'bg-[#0072BC] hover:brightness-105 text-white'
                          }`}
                        >
                          📤 ارسال اشعار خصم للموظف
                        </button>

                        {/* 4. ازالة الخصم */}
                        {editingDeduction && (
                          <button
                            onClick={() => handleDeleteDeduction(editingDeduction.id)}
                            className={`px-4 py-2.5 font-black text-xs rounded-xl transition ${
                              confirmDeleteId === editingDeduction.id
                                ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                            }`}
                          >
                            {confirmDeleteId === editingDeduction.id ? '⚠️ لتأكيد المسح اضغط ثانية' : '🗑️ ازالة الخصم'}
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MONTHLY ALL 12 MONTHS SALARIES MULTI-GRID PLATFORM */}
      {/* ======================================================== */}
      {activeHRSubTab === 'payroll_monthly_salaries' && (
        <div className="space-y-6 text-right font-sans" dir="rtl">
          
          {/* Header Controls for Payrolls Sheet */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-800">🗓️ مسير الرواتب الموحد والشامل (12 شهراً ميلادياً)</h3>
              <p className="text-xs text-slate-500">
                لوحة كشف ورصد رواتب كافة منتسبي الشركة للشهر المحدد، مع كامل القدرة لتحديث الحالات، تصفح، سحب وطباعة المسيرات الرسمية.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500">الشهر المفتوح للصرف:</span>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-[#0072BC]"
              >
                {gregoryMonths.map(m => (
                  <option key={m.id} value={m.id}>{m.name_ar} ({m.id})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Import / Export Command Bar */}
          <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100 space-y-4">
            <h4 className="text-xs font-black text-slate-700">📁 أدوات دفق وتعميم البيانات والموازنة:</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Box A: Multi-Upload Simulation */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-[10px] uppercase font-black text-slate-400 block">📄 استيراد الأجور عن طريق الإكسل أو ملف PDF:</span>
                <p className="text-[10px] text-slate-500">
                  قم بإرسال أو توجيه ملف الأجر ليتعرف خادم الذكاء الفوري ERP على الحقول، الرواتب والعهد وتحديث اللائحة آلياً.
                </p>
                
                {/* Simulated file drag and drop click upload */}
                <div 
                  onClick={() => {
                    const promptText = prompt(
                      lang === 'ar' 
                        ? "أدخل النص المنسوخ من جدول مسيرات الرواتب (يحتوي على الأرقام الحسابية) وسيتولى الخادم الآمن التعرف المطابق لكل موظف وعكس قيمه:" 
                        : "Paste text containing personnel IDs and basic numeric salaries to map matching tables immediately:"
                    );
                    if (promptText) {
                      handleFileUploadTextParse(promptText);
                    }
                  }}
                  className="border-2 border-dashed border-[#0072BC]/20 hover:border-[#0072BC]/80 transition p-3 rounded-xl text-center cursor-pointer bg-[#0072BC]/5"
                >
                  <span className="text-[10px] font-black text-[#0072BC] block">📤 اضغط هنا لتحديد الملف أو إسقاطه</span>
                  <span className="text-[8px] text-slate-400 block mt-0.5">يدعم أوراق العمل XLS, CSV, PDF</span>
                </div>
              </div>

              {/* Box B: Hardcopy PDF print option */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-2 text-right">
                <span className="text-[10px] uppercase font-black text-slate-400 block">🖨️ التصدير والطباعة الورقية بكشف مالي موحد:</span>
                <p className="text-[10px] text-slate-500">
                  استخرج نسخة رسمية معتمدة قابلة للطباعة أو الحفظ كشفت PDF جاهز مصحوباً بمساحات تفريغ التواقيع الرسمية للجنة التدقيق والرقابة.
                </p>
                <button
                  onClick={handlePrintMonthlySalariesSheet}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-black rounded-xl transition"
                >
                  🖨️ طباعة المسير + تحويله إلى مستند PDF
                </button>
              </div>

              {/* Box C: Bulk Status Commitment */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-2 text-right">
                <span className="text-[10px] uppercase font-black text-slate-400 block">🔐 قفل المسير وحسابات رواتب الشهر:</span>
                <p className="text-[10px] text-slate-500">
                  عند حفظ وتحديث المسير الحالي، تتوفر كشوفات الرواتب لجميع الموظفين في حساباتهم لضمان الشفافية والموثوقية الفائقة.
                </p>
                <button
                  onClick={handleSaveMonthlyWagesSheet}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-xl transition shadow-sm shadow-emerald-50"
                >
                  🔒 حفظ وترحيل المسير المفتوح لقفل الحسابات
                </button>
              </div>

            </div>
          </div>

          {/* Interactive Multi-Grid Spreadsheet Layout */}
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <h4 className="p-4 text-xs font-black text-slate-800 border-b">
              📝 المسير التفصيلي - جدول إدخال وتعديل الأجور لجميع موظفي المنشأة الحيين لشهر {selectedMonth}:
            </h4>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-fold">
                    <th className="p-4 whitespace-nowrap">الكود الموحد</th>
                    <th className="p-4 whitespace-nowrap">اسم الموظف</th>
                    <th className="p-4 whitespace-nowrap">الراتب الأساسي (ريال)</th>
                    <th className="p-4 whitespace-nowrap">مجموع البدلات الفعالة (+ريال)</th>
                    <th className="p-4 whitespace-nowrap">مجموع الخصومات والعهد (-ريال)</th>
                    <th className="p-4 whitespace-nowrap">صافي الأجر المحتسب</th>
                    <th className="p-4 whitespace-nowrap">تراكم حركة الخصومات الحية</th>
                    <th className="p-4 whitespace-nowrap">حالة التعديل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map(emp => {
                    const row = inlineWages[emp.id] || { basic: 0, allowances: 0, deductions: 0, status: 'مسودة' };
                    const net = row.basic + row.allowances - row.deductions;
                    const dynamicDeductions = getEmployeeDeductionsTotal(emp.id);

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/70 transition font-bold text-slate-700">
                        <td className="p-4 whitespace-nowrap font-mono">{emp.id}</td>
                        <td className="p-4 whitespace-nowrap text-slate-900 font-extrabold">{emp.arabicName}</td>
                        
                        {/* Inline Basic Salary */}
                        <td className="p-3 whitespace-nowrap">
                          <input 
                            type="number"
                            value={row.basic ?? 0}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setInlineWages(prev => ({
                                ...prev,
                                [emp.id]: { ...prev[emp.id], basic: val, status: 'معدل يدوياً ⚙️' }
                              }));
                            }}
                            className="bg-slate-50 border border-slate-200 p-1.5 w-24 rounded-lg text-center font-mono focus:bg-white text-slate-800"
                          />
                        </td>

                        {/* Inline Allowances Total */}
                        <td className="p-3 whitespace-nowrap">
                          <input 
                            type="number"
                            value={row.allowances ?? 0}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setInlineWages(prev => ({
                                ...prev,
                                [emp.id]: { ...prev[emp.id], allowances: val, status: 'معدل يدوياً ⚙️' }
                              }));
                            }}
                            className="bg-slate-50 border border-slate-200 p-1.5 w-24 rounded-lg text-center font-mono focus:bg-white text-emerald-700"
                          />
                        </td>

                        {/* Inline Deductions Total */}
                        <td className="p-3 whitespace-nowrap">
                          <input 
                            type="number"
                            value={row.deductions ?? 0}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setInlineWages(prev => ({
                                ...prev,
                                [emp.id]: { ...prev[emp.id], deductions: val, status: 'معدل يدوياً ⚙️' }
                              }));
                            }}
                            className="bg-rose-50 border border-rose-100 p-1.5 w-24 rounded-lg text-center font-mono focus:bg-white text-red-600 font-black"
                          />
                        </td>

                        {/* Net Salary computed */}
                        <td className="p-4 whitespace-nowrap text-slate-900 font-extrabold font-mono">
                          {net.toLocaleString()} ريال
                        </td>

                        {/* Track dynamic deductions link */}
                        <td className="p-4 whitespace-nowrap text-[10px] text-slate-400">
                          {dynamicDeductions > 0 ? (
                            <span className="text-red-500">⚠️ يتضمن ({dynamicDeductions}) خصومات نشطة بالشهر</span>
                          ) : (
                            <span>لا توجد خصومات جزائية للشهر</span>
                          )}
                        </td>

                        {/* Row status badge */}
                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[9px] ${
                            row.status.includes('معدل') ? 'bg-amber-100 text-amber-800' :
                            row.status.includes('مستورد') ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {row.status}
                          </span>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
