import React, { useState } from 'react';
import { 
  Users, Plus, Trash2, Edit2, Check, X, Search, FileText, Gift, Calendar, 
  MapPin, Shield, Tag, HelpCircle, Briefcase, Info, RefreshCw, Eye
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Employee, CustodyAsset, User } from '../../types';

interface HrEmployeeDirectoryTabProps {
  lang: 'ar' | 'en';
  employees: Employee[];
  onUpdateEmployeeFields: (empId: string, updatedFields: Partial<Employee>) => void;
  onInitializeClearance?: (emp: Employee) => void;
  onReloadEmployees?: () => Promise<void> | void;
  onAddEmployee?: (newEmp: Partial<Employee>) => void;
  onDeleteEmployee?: (empId: string) => void;
  user?: User | null;
}

export function getInsuranceStatus(expiryDateStr?: string, lang: 'ar' | 'en' = 'ar') {
  if (!expiryDateStr) {
    return {
      status: lang === 'ar' ? 'غير مسجل' : 'Not Registered',
      daysLeft: 0,
      badgeClass: 'bg-slate-50 text-slate-500 border border-slate-200'
    };
  }
  const expiry = new Date(expiryDateStr);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { status: lang === 'ar' ? 'منتهي الصلاحية' : 'Expired', daysLeft: 0, badgeClass: 'bg-rose-500 text-white' };
  } else if (diffDays <= 30) {
    return { status: lang === 'ar' ? 'ينتهي قريباً' : 'Expiring Soon', daysLeft: diffDays, badgeClass: 'bg-orange-500 text-white' };
  } else {
    return { status: lang === 'ar' ? 'ساري' : 'Valid', daysLeft: diffDays, badgeClass: 'bg-emerald-500 text-white' };
  }
}

export function getIqamaStatus(expiryDateStr?: string, lang: 'ar' | 'en' = 'ar') {
  if (!expiryDateStr) {
    return {
      status: lang === 'ar' ? 'غير محدد' : 'Not Set',
      daysLeft: 0,
      badgeClass: 'bg-slate-50 text-slate-500 border border-slate-200'
    };
  }

  const expiry = new Date(expiryDateStr);
  const today = new Date();
  
  expiry.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: lang === 'ar' ? 'انتهت صلاحية الإقامة' : 'Iqama Expired',
      daysLeft: diffDays,
      badgeClass: 'bg-rose-50 text-rose-600 border border-rose-200 font-extrabold'
    };
  } else if (diffDays <= 30) {
    return {
      status: lang === 'ar' ? 'أوشكت الإقامة على الانتهاء' : 'Iqama Expiring Soon',
      daysLeft: diffDays,
      badgeClass: 'bg-amber-50 text-amber-600 border border-amber-300 font-extrabold animate-pulse'
    };
  } else if (diffDays > 330) {
    return {
      status: lang === 'ar' ? 'إقامة صالحة' : 'Valid Iqama',
      daysLeft: diffDays,
      badgeClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200'
    };
  } else {
    return {
      status: lang === 'ar' ? 'إقامة سارية' : 'Active Iqama',
      daysLeft: diffDays,
      badgeClass: 'bg-blue-50/50 text-[#0072BC] border border-blue-100'
    };
  }
}

export default function HrEmployeeDirectoryTab({
  lang,
  employees,
  onUpdateEmployeeFields,
  onInitializeClearance,
  onReloadEmployees,
  onAddEmployee,
  onDeleteEmployee,
  user
}: HrEmployeeDirectoryTabProps) {
  // Search query state
  const [searchQuery, setSearchQuery] = useState('');

  // Selected employee for "View More" (عرض المزيد) modal
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form states for creating a new employee
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAiImportOpen, setIsAiImportOpen] = useState(false);
  const [aiImportLoading, setAiImportLoading] = useState(false);
  const [aiImportText, setAiImportText] = useState('');
  const [aiImportFile, setAiImportFile] = useState<File | null>(null);

  // Deletion state & 4-second countdown
  const [empToDelete, setEmpToDelete] = useState<Employee | null>(null);
  const [deleteCountdown, setDeleteCountdown] = useState(4);

  React.useEffect(() => {
    if (!empToDelete) return;
    if (deleteCountdown <= 0) return;

    const timer = setInterval(() => {
      setDeleteCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [empToDelete, deleteCountdown]);

  const [newEmpForm, setNewEmpForm] = useState({
    arabicName: '',
    englishName: '',
    mobile: '',
    birthDate: '',
    dateOfJoining: '',
    nationality: 'سعودي',
    passportDetails: '',
    iqamaId: '',
    iqamaExpiryDate: '',
        insurancePolicyNumber: '',
        insuranceCompany: '',
        insuranceClass: 'C',
        insuranceExpiryDate: '',
    passportExpiryDate: '',
    jobTitle: '',
    classification: 'موظف',
    grade: 'Grade 1',
    basicSalary: 6000,
    allowances: { housing: 1500, transport: 500, phone: 200 },
    homeAddress: 'الرياض، المملكة العربية السعودية',
    department: 'Neon Fabrication',
    contractExpiry: ''
  });

  // Edit states for biography
  const [editForm, setEditForm] = useState<Partial<Employee>>({});

  // Salary & contract state variables
  const [isEditingSalaryContract, setIsEditingSalaryContract] = useState(false);
  const [salaryContractForm, setSalaryContractForm] = useState({
    basicSalary: 0,
    housing: 0,
    transport: 0,
    food: 0,
    loans: 0,
    deductions: 0,
    status: 'Active',
    contractQiwaNumber: '',
    contractUrl: '',
    contractExpiry: ''
  });

  // New manual custody asset state (for "العهد المسجلة لدى الموظف" تكتب يدوياً)
  const [newAsset, setNewAsset] = useState({
    name: '',
    receivedDate: '',
    category: 'أجهزة ومعدات',
    additionalInfo: ''
  });

  // Dynamic calculation of experience based on joining date to today
  const calculateExperience = (joiningDateStr?: string) => {
    if (!joiningDateStr) return 0;
    const joinDate = new Date(joiningDateStr);
    const today = new Date();
    
    let years = today.getFullYear() - joinDate.getFullYear();
    const monthDiff = today.getMonth() - joinDate.getMonth();
    
    // Adjust year if today is before the joining anniversary month/day
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < joinDate.getDate())) {
      years--;
    }
    
    return years < 0 ? 0 : years;
  };

  // Handle Search and Filter
  const filteredEmployees = employees.filter(emp => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (emp.arabicName || '').toLowerCase().includes(q) ||
      (emp.englishName || '').toLowerCase().includes(q) ||
      (emp.mobile || '').toLowerCase().includes(q) ||
      (emp.jobTitle || '').toLowerCase().includes(q) ||
      (emp.iqamaId || '').toLowerCase().includes(q)
    );
  });

  // Open "View More" modal
  const [isContractEditingUrl, setIsContractEditingUrl] = useState(false);

  const handleOpenViewMore = (emp: Employee) => {
    setSelectedEmp(emp);
    setEditForm({ ...emp });
    setIsEditing(false);
    setIsEditingSalaryContract(false);
    setIsContractEditingUrl(!emp.contractUrl);
    setSalaryContractForm({
      basicSalary: emp.basicSalary || 0,
      housing: emp.allowances?.housing || 0,
      transport: emp.allowances?.transport || 0,
      food: emp.allowances?.food || 0,
      loans: emp.allowances?.loans || 0,
      deductions: emp.allowances?.deductions || 0,
      status: emp.allowances?.status || 'Active',
      contractQiwaNumber: emp.contractQiwaNumber || '',
      contractUrl: emp.contractUrl || '',
      contractExpiry: emp.contractExpiry || ''
    });
  };

  // Close "View More" modal
  const handleCloseViewMore = () => {
    setSelectedEmp(null);
    setIsEditing(false);
  };

  // Save Biographic edits
  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;

    // Trigger update callback
    onUpdateEmployeeFields(selectedEmp.id, editForm);
    
    // Update currently viewed employee in local state
    setSelectedEmp(prev => prev ? { ...prev, ...editForm } : null);
    setIsEditing(false);
    
    if (onReloadEmployees) {
      await onReloadEmployees();
    }
    alert(lang === 'ar' ? '✓ تم حفظ تعديل البيانات بنجاح!' : '✓ Employee files updated successfully!');
  };

  // Handle deleting employee (إزالة الموظف من الجدول)
  const handleDeleteEmployee = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setEmpToDelete(emp);
      setDeleteCountdown(4);
    }
  };

  // Confirm and perform the actual deletion
  const confirmDeleteEmployee = () => {
    if (!empToDelete) return;
    if (onDeleteEmployee) {
      onDeleteEmployee(empToDelete.id);
    }
    setEmpToDelete(null);
    handleCloseViewMore();
  };

  // Add a custody asset to an employee manually
  const handleAddCustodyAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;

    if (!newAsset.name.trim()) {
      alert(lang === 'ar' ? 'يرجى إدخال اسم العهدة أولاً!' : 'Please enter asset name!');
      return;
    }

    const recDate = newAsset.receivedDate || new Date().toISOString().split('T')[0];
    const assetRecord: CustodyAsset = {
      name: newAsset.name,
      receivedDate: recDate,
      category: newAsset.category,
      additionalInfo: newAsset.additionalInfo
    };

    const currentAssets = selectedEmp.custodyAssets || [];
    const updatedAssets = [...currentAssets, assetRecord];

    // Trigger update on backend
    onUpdateEmployeeFields(selectedEmp.id, {
      custodyAssets: updatedAssets
    });

    // Sync state visual
    setSelectedEmp(prev => prev ? { ...prev, custodyAssets: updatedAssets } : null);
    
    // Reset inputs
    setNewAsset({
      name: '',
      receivedDate: '',
      category: 'أجهزة ومعدات',
      additionalInfo: ''
    });

    if (onReloadEmployees) {
      onReloadEmployees();
    }
  };

  // Remove a custody asset from an employee manually
  const handleRemoveCustodyAsset = (index: number) => {
    if (!selectedEmp) return;

    const currentAssets = selectedEmp.custodyAssets || [];
    const updatedAssets = currentAssets.filter((_, i) => i !== index);

    // Save
    onUpdateEmployeeFields(selectedEmp.id, { custodyAssets: updatedAssets });
    setSelectedEmp(prev => prev ? { ...prev, custodyAssets: updatedAssets } : null);

    if (onReloadEmployees) {
      onReloadEmployees();
    }
  };

  // Handle AI Import Submission
  const handleAiImportSubmit = async () => {
    if (!aiImportText.trim() && !aiImportFile) {
      alert(lang === 'ar' ? 'يرجى إدخال النص أو رفع ملف' : 'Please provide text or a file');
      return;
    }

    setAiImportLoading(true);
    try {
      let importedEmployees: any[] = [];

      // Check if it's an Excel file
      if (aiImportFile && (aiImportFile.name.endsWith('.xlsx') || aiImportFile.name.endsWith('.xls') || aiImportFile.name.endsWith('.csv'))) {
        const data = await aiImportFile.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        // Transform JSON if needed or send to AI to transform
        // For robustness, let's ask Gemini to transform the raw JSON into proper Employee array format
        const res = await fetch('/api/gemini/parse-employee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `Please convert this Excel JSON data into the requested employees array format: ${JSON.stringify(json)}`,
          }),
        });

        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Failed to parse Excel data via AI');
        if (resData.employees && Array.isArray(resData.employees)) {
          importedEmployees = resData.employees;
        } else if (Array.isArray(resData)) {
          importedEmployees = resData;
        } else {
          importedEmployees = [resData];
        }
      } else {
        // Handle normal text or image/PDF via AI
        let fileBase64 = null;
        if (aiImportFile) {
          const reader = new FileReader();
          fileBase64 = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result?.toString() || '');
            reader.onerror = reject;
            reader.readAsDataURL(aiImportFile);
          });
        }

        const res = await fetch('/api/gemini/parse-employee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: aiImportText,
            fileBase64: fileBase64,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to parse AI data');
        
        if (data.employees && Array.isArray(data.employees)) {
          importedEmployees = data.employees;
        } else if (Array.isArray(data)) {
          importedEmployees = data;
        } else {
          importedEmployees = [data]; // Graceful fallback
        }
      }

      if (importedEmployees.length === 0) {
        throw new Error(lang === 'ar' ? 'لم يتم العثور على بيانات موظفين صالحة.' : 'No valid employee data found.');
      }

      // Automatically add them directly to the database without stopping for confirmation
      let addedCount = 0;
      let index = 0;

      for (const empData of importedEmployees) {
        if (!empData.arabicName && !empData.englishName) continue; // Skip empty row
        
        index++;
        // Generate a completely unique, non-colliding ID based on timestamp and a random suffix
        const uniqueId = `EMP-${Date.now()}-${Math.floor(Math.random() * 10000)}-${index}`;

        if (onAddEmployee) {
          const promise = (onAddEmployee as any)({
            id: uniqueId,
            arabicName: empData.arabicName || '',
            englishName: empData.englishName || empData.arabicName || '',
            iqamaId: empData.iqamaId || '',
            iqamaExpiryDate: empData.iqamaExpiryDate || '',
            passportDetails: empData.passportDetails || '',
            passportExpiryDate: empData.passportExpiryDate || '',
            jobTitle: empData.jobTitle || 'موظف',
            department: empData.department || 'عام',
            basicSalary: Number(empData.basicSalary) || 0,
            allowances: {
              housing: Number(empData.housing) || 0,
              transport: Number(empData.transport) || 0,
              food: 0,
              phone: 0,
              status: 'Active'
            },
            birthDate: empData.birthDate || '',
            dateOfJoining: new Date().toISOString().split('T')[0],
            contractExpiry: empData.iqamaExpiryDate || '',
            nationality: empData.nationality || '',
            custody: { items: [], lastUpdated: new Date().toISOString() },
            grade: 'Staff',
            homeAddress: '',
            mobile: ''
          });

          // If onAddEmployee returns a promise, await it sequentially to prevent state/API race conditions
          if (promise && typeof promise.then === 'function') {
            await promise;
          }
          addedCount++;
        }
      }

      // reset and close modal
      setIsAiImportOpen(false);
      setAiImportText('');
      setAiImportFile(null);
      
      alert(lang === 'ar' 
        ? `تم الاستيراد بنجاح! تمت إضافة ${addedCount} موظف بنجاح.`
        : `Import successful! Added ${addedCount} employees successfully.`);
        
    } catch (err: any) {
      console.error(err);
      alert(lang === 'ar' ? 'حدث خطأ أثناء الاستيراد: ' + err.message : 'Error during import: ' + err.message);
    } finally {
      setAiImportLoading(false);
    }
  };

  // Handle addition of a new employee
  const handleCreateNewEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpForm.arabicName.trim() || !newEmpForm.jobTitle.trim() || !newEmpForm.iqamaId.trim()) {
      alert(lang === 'ar' ? 'يرجى تعبئة الحقول الأساسية: الاسم، المسمى، ورقم الهوية!' : 'Fields required: Name, Job Title, and Iqama ID!');
      return;
    }

    // Default englishName fallback if left blank
    const completeEmpForm = {
      ...newEmpForm,
      englishName: newEmpForm.englishName || newEmpForm.arabicName,
      contractExpiry: newEmpForm.iqamaExpiryDate // Sync for standard metrics
    };

    if (onAddEmployee) {
      onAddEmployee(completeEmpForm);
      setIsAddOpen(false);
      // Reset form
      setNewEmpForm({
        arabicName: '',
        englishName: '',
        birthDate: '',
        dateOfJoining: '',
        nationality: 'سعودي',
        passportDetails: '',
        iqamaId: '',
        iqamaExpiryDate: '',
        insurancePolicyNumber: '',
        insuranceCompany: '',
        insuranceClass: 'C',
        insuranceExpiryDate: '',
        mobile: '',
        passportExpiryDate: '',
        jobTitle: '',
        classification: 'موظف',
        grade: 'Grade 1',
        basicSalary: 6000,
        allowances: { housing: 1500, transport: 500, phone: 200 },
        homeAddress: 'الرياض، المملكة العربية السعودية',
        department: 'Neon Fabrication',
        contractExpiry: ''
      });
      alert(lang === 'ar' ? '✓ تم تعيين وإلحاق الموظف الجديد بنجاح!' : '✓ New employee registered and dispatched successfully!');
      if (onReloadEmployees) {
        setTimeout(() => onReloadEmployees(), 400);
      }
    }
  };

  return (
    <div id="hr-employee-directory-tab" className="space-y-6">
      
      {/* 1. KEY METRICS HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-100 shadow-sm animate-fade-in" dir="rtl">
        <div>
          <h2 className="text-xl font-black text-[#0072BC] flex items-center gap-2">
            <span>👥</span>
            {lang === 'ar' ? 'بيانات الموظفين' : 'Employee Bureau Directory'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ar' 
              ? 'تسيير ملفات العمالة وتوزيع بطاقات الهوية والعهد المسجلة وجدول خبراتهم بالتفصيل.' 
              : 'Administer worker portfolios, custom manual custody registrations, and dynamic join age logs.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* بوابة مقيم (برتقالي) */}
          <a
            href="https://muqeem.sa/#/home"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4.5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-2xl transition shadow-sm flex items-center gap-1.5"
            id="muqeem-portal-button"
          >
            <span>🪪 بوابة مقيم</span>
          </a>

          {/* بوابة قوى (أزرق) */}
          <a
            href="https://qiwa.sa/en"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4.5 py-3 bg-sky-600 hover:bg-sky-700 text-white font-black text-xs rounded-2xl transition shadow-sm flex items-center gap-1.5"
            id="qiwa-portal-button"
          >
            <span>💼 بوابة قوى</span>
          </a>

          {/* Create new employee option */}
          <button
            onClick={() => setIsAiImportOpen(true)}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 transition-all shadow-md select-none"
          >
            <span>🤖</span>
            <span>{lang === 'ar' ? 'استيراد بالذكاء الاصطناعي' : 'AI Import'}</span>
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-5 py-3 bg-[#0072BC] hover:bg-[#0072BC]/90 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 transition-all shadow-md select-none"
          >
            <Plus className="w-4.5 h-4.5 stroke-[3]" />
            <span>{lang === 'ar' ? 'إضافة موظف جديد' : 'Enroll New Employee'}</span>
          </button>
        </div>
      </div>

      {/* 2. LIVE SEARCH BAR */}
      <div className="relative" dir="rtl">
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input 
          type="text" 
          placeholder={lang === 'ar' ? 'ابحث هنا باسم الموظف، المسمى الوظيفي، أو رقم الإقامة / الهوية...' : 'Filter list by name, iqama, passport or role...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-4 pr-11 py-3 text-xs bg-white/80 border border-slate-200 rounded-2xl text-right font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0072BC] transition-all"
        />
      </div>

      {/* 3. SIMPLIFIED DIRECTORY RASTER CARD */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-100 shadow-sm overflow-hidden" dir="rtl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-right text-xs">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] uppercase font-black tracking-wider">
                <th className="p-4 pr-6 font-extrabold">{lang === 'ar' ? 'الاسم رباعي' : 'Arabic Name / Bio'}</th>
                <th className="p-4 font-extrabold">{lang === 'ar' ? 'المسمى الوظيفي' : 'Job Title'}</th>
                <th className="p-4 font-extrabold">{lang === 'ar' ? 'رقم الإقامة / الهوية' : 'ID / Iqama ID'}</th>
                <th className="p-4 pl-6 text-center font-extrabold">{lang === 'ar' ? 'ملفات الموظف' : 'Interventions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-4 pr-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0072BC] flex items-center justify-center font-black text-sm shadow-inner">
                        {emp.arabicName ? emp.arabicName[0] : 'U'}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-800 text-[13px]">{emp.arabicName}</p>
                        <p className="text-[10px] text-slate-450 font-mono mt-0.5">{emp.englishName || emp.id}</p>
                        {emp.mobile && <p className="text-[10px] text-[#0072BC] font-mono font-bold mt-0.5" dir="ltr">{emp.mobile}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 font-extrabold rounded-lg text-[10.5px]">
                        {emp.jobTitle}
                      </span>
                      {emp.classification && (
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-[#0072BC]/10 text-[#0072BC] rounded">
                          {emp.classification}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="font-mono font-bold text-slate-800 text-xs">
                        {emp.iqamaId}
                      </span>
                      {emp.iqamaExpiryDate && (() => {
                        const statusObj = getIqamaStatus(emp.iqamaExpiryDate, lang);
                        return (
                          <span className={`text-[9.5px] font-black px-2 py-0.5 rounded leading-tight ${statusObj.badgeClass}`}>
                            {statusObj.status} {statusObj.daysLeft > 0 ? `(${statusObj.daysLeft} ${lang === 'ar' ? 'يوم' : 'days'})` : ''}
                          </span>
                        );
                      })()}
                      {emp.insurancePolicyNumber && (
                        <div className="mt-1 flex flex-col gap-0.5">
                          <span className="text-[9px] text-slate-400 font-bold">{lang === 'ar' ? 'تأمين طبي:' : 'Medical Ins:'} {emp.insuranceCompany} ({emp.insuranceClass})</span>
                          {emp.insuranceExpiryDate && (() => {
                            const insStatus = getInsuranceStatus(emp.insuranceExpiryDate, lang);
                            return (
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded w-fit ${insStatus.badgeClass}`}>
                                &#10010; {insStatus.status} {insStatus.daysLeft > 0 ? `(${insStatus.daysLeft})` : ''}
                              </span>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 pl-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenViewMore(emp)}
                        className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-[#0072BC] font-extrabold text-[11px] rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                        title={lang === 'ar' ? 'عرض أكثر وتفصيل وتتبع' : 'View full Employee profile'}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'عرض المزيد' : 'View More'}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(emp.id)}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-[11px] rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                        title={lang === 'ar' ? 'إزالة هذا الموظف من الجدول' : 'Remove this employee from the table'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'إزالة الموظف' : 'Remove Employee'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400 font-semibold bg-slate-50/20">
                    {lang === 'ar' ? '⚠️ لا توجد نتائج مطابقة لفلترة البحث.' : 'No matched staff records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL DETAILED PRESENTATION HUB ("عرض المزيد" + تعديل + حذف + عهد يدوية) */}
      {selectedEmp && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in" dir="rtl">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 relative">
            
            {/* Modal Exit Trigger */}
            <button 
              onClick={handleCloseViewMore}
              className="absolute top-4 left-4 p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl transition-all cursor-pointer"
              title={lang === 'ar' ? 'إغلاق نافذة التفاصيل' : 'Close Details'}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="border-b border-slate-100 pb-4 ml-6">
              <span className="text-[9px] bg-[#0072BC]/10 text-[#0072BC] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                🏷️ ID: {selectedEmp.id}
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">
                {selectedEmp.arabicName}
              </h3>
              <p className="text-xs text-slate-450 font-bold tracking-wide mt-1">
                {selectedEmp.jobTitle} • {selectedEmp.nationality || 'سعودي'}
              </p>
            </div>

            {/* Modal Inner Tab-Panel */}
            <div className="space-y-6 text-xs text-slate-700">

              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-150/70">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                  <h4 className="font-extrabold text-[#0072BC] text-xs flex items-center gap-1.5/5">
                    <span>👤</span>
                    {lang === 'ar' ? 'بيانات الموظف الشاملة:' : 'Biographical Employee Information:'}
                  </h4>
                  
                  {/* Edit Activation button */}
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#0072BC] font-extrabold rounded-lg flex items-center gap-1 transition-all"
                    >
                      <Edit2 className="w-3 h-3 text-[#0072BC]/80" />
                      <span>{lang === 'ar' ? 'تعديل البيانات' : 'Edit File'}</span>
                    </button>
                  )}
                </div>

                {isEditing ? (
                  /* EDITING FORM PORTAL */
                  <form onSubmit={handleSaveBio} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">{lang === 'ar' ? 'اسمه (بالعربية)' : 'Arabic Name'}</label>
                        <input 
                          type="text" 
                          value={editForm.arabicName || ''} 
                          onChange={e => setEditForm({ ...editForm, arabicName: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-right"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">{lang === 'ar' ? 'الاسم بالإنجليزية' : 'English Name'}</label>
                        <input 
                          type="text" 
                          value={editForm.englishName || ''} 
                          onChange={e => setEditForm({ ...editForm, englishName: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-right"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">{lang === 'ar' ? 'الجنسية' : 'Nationality'}</label>
                        <input 
                          type="text" 
                          value={editForm.nationality || ''} 
                          onChange={e => setEditForm({ ...editForm, nationality: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-right"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">{lang === 'ar' ? 'المسمى الوظيفي' : 'Job Title'}</label>
                        <input 
                          type="text" 
                          value={editForm.jobTitle || ''} 
                          onChange={e => setEditForm({ ...editForm, jobTitle: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-right"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">{lang === 'ar' ? 'التصنيف الوظيفي' : 'Job Classification'}</label>
                        <select 
                          value={editForm.classification || 'موظف'} 
                          onChange={e => setEditForm({ ...editForm, classification: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-right text-slate-700"
                        >
                          <option value="موظف">{lang === 'ar' ? 'موظف' : 'Staff'}</option>
                          <option value="عامل تصنيع">{lang === 'ar' ? 'عامل تصنيع' : 'Manufacturing Worker'}</option>
                          <option value="إداري">{lang === 'ar' ? 'إداري' : 'Administrative'}</option>
                          <option value="الإدارة العليا">{lang === 'ar' ? 'الإدارة العليا' : 'Senior Management'}</option>
                          <option value="فراس">{lang === 'ar' ? 'فراس' : 'Firas'}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">{lang === 'ar' ? 'رقم الإقامة / الهوية' : 'ID / Iqama ID'}</label>
                        <input 
                          type="text" 
                          value={editForm.iqamaId || ''} 
                          onChange={e => setEditForm({ ...editForm, iqamaId: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-center"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">{lang === 'ar' ? 'رقم الجوال' : 'Mobile Number'}</label>
                        <input 
                          type="text" 
                          value={editForm.mobile || ''} 
                          onChange={e => setEditForm({ ...editForm, mobile: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">{lang === 'ar' ? 'رقم الجواز' : 'Passport Number'}</label>
                        <input 
                          type="text" 
                          value={editForm.passportDetails || ''} 
                          onChange={e => setEditForm({ ...editForm, passportDetails: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">{lang === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}</label>
                        <input 
                          type="date" 
                          value={editForm.birthDate || ''} 
                          onChange={e => setEditForm({ ...editForm, birthDate: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">{lang === 'ar' ? 'تاريخ التحاقه بالعمل' : 'Date of Joining'}</label>
                        <input 
                          type="date" 
                          value={editForm.dateOfJoining || ''} 
                          onChange={e => setEditForm({ ...editForm, dateOfJoining: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">{lang === 'ar' ? 'تاريخ انتهاء الإقامة' : 'Iqama Expiry Date'}</label>
                        <input 
                          type="date" 
                          value={editForm.iqamaExpiryDate || ''} 
                          onChange={e => setEditForm({ ...editForm, iqamaExpiryDate: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">{lang === 'ar' ? 'تاريخ انتهاء الجواز' : 'Passport Expiry Date'}</label>
                        <input 
                          type="date" 
                          value={editForm.passportExpiryDate || ''} 
                          onChange={e => setEditForm({ ...editForm, passportExpiryDate: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-center"
                        />
                      </div>
                    </div>

                      <div className="col-span-1 md:col-span-2 border-t border-slate-100 pt-3 mt-1">
                        <h4 className="text-xs font-black text-[#0072BC] mb-2">{lang === 'ar' ? 'التأمين الطبي' : 'Medical Insurance'}</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-2 col-span-1 md:col-span-2">
                        <div>
                           <label className="block text-slate-400 font-bold mb-1">{lang === 'ar' ? 'رقم البوليصة' : 'Policy Number'}</label>
                           <input type="text" value={editForm.insurancePolicyNumber || ''} onChange={e => setEditForm({...editForm, insurancePolicyNumber: e.target.value})} className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs" />
                        </div>
                        <div>
                           <label className="block text-slate-400 font-bold mb-1">{lang === 'ar' ? 'شركة التأمين' : 'Insurance Company'}</label>
                           <input type="text" value={editForm.insuranceCompany || ''} onChange={e => setEditForm({...editForm, insuranceCompany: e.target.value})} className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 col-span-1 md:col-span-2">
                        <div>
                           <label className="block text-slate-400 font-bold mb-1">{lang === 'ar' ? 'فئة التأمين' : 'Insurance Class'}</label>
                           <select value={editForm.insuranceClass || 'C'} onChange={e => setEditForm({...editForm, insuranceClass: e.target.value})} className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs form-select">
                              <option value="VIP">VIP</option>
                              <option value="A">Class A</option>
                              <option value="B">Class B</option>
                              <option value="C">Class C</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-slate-400 font-bold mb-1">{lang === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}</label>
                           <input type="date" value={editForm.insuranceExpiryDate || ''} onChange={e => setEditForm({...editForm, insuranceExpiryDate: e.target.value})} className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-center text-xs" />
                        </div>
                      </div>


                    <div className="flex gap-2 text-xs font-black pt-3">
                      <button 
                        type="submit" 
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Check className="w-4 h-4" />
                        <span>{lang === 'ar' ? 'حفظ وتعديل التبعات' : 'Save Modifications'}</span>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setIsEditing(false)} 
                        className="px-4 bg-slate-200 text-slate-700 py-2 rounded-xl transition-all"
                      >
                        {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* VIEWING DATA MODE */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-right">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">{lang === 'ar' ? 'اسمه الكامل:' : 'Arabic Name:'}</span>
                      <p className="font-extrabold text-slate-800 text-[13px]">{selectedEmp.arabicName}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">{lang === 'ar' ? 'الاسم باللغة الإنجليزية:' : 'English Name:'}</span>
                      <p className="font-bold text-slate-800 font-mono text-[11px]">{selectedEmp.englishName || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">{lang === 'ar' ? 'الجنسية:' : 'Nationality:'}</span>
                      <p className="font-bold text-slate-800">{selectedEmp.nationality || 'سعودي'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">{lang === 'ar' ? 'المسمى الوظيفي:' : 'Job Title:'}</span>
                      <p className="font-bold text-indigo-750">{selectedEmp.jobTitle}</p>
                      {selectedEmp.classification && (
                        <span className="inline-block mt-1 px-2.5 py-0.5 text-[10px] font-black bg-[#0072BC]/10 text-[#0072BC] rounded-md">
                          {selectedEmp.classification}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">{lang === 'ar' ? 'رقم الإقامة / الهوية الوطنية:' : 'ID / Iqama ID:'}</span>
                      <p className="font-mono font-black text-slate-800 text-[13px]">{selectedEmp.iqamaId}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">{lang === 'ar' ? 'رقم الجوال:' : 'Mobile Number:'}</span>
                      <p className="font-mono font-black text-slate-800 text-[13px]">{selectedEmp.mobile || (lang === 'ar' ? 'غير مسجل' : 'Not Set')}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">{lang === 'ar' ? 'رقم جواز السفر:' : 'Passport Book Number:'}</span>
                      <p className="font-mono font-bold text-slate-700">{selectedEmp.passportDetails || (lang === 'ar' ? 'غير مسجل يدوياً' : 'Not Set')}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">{lang === 'ar' ? 'تاريخ الميلاد:' : 'Date of Birth:'}</span>
                      <p className="font-mono text-slate-700">{selectedEmp.birthDate || '1995-12-10'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">{lang === 'ar' ? 'تاريخ التحاقه بالعمل:' : 'Date of Joining:'}</span>
                      <p className="font-mono text-slate-700">{selectedEmp.dateOfJoining || '2022-01-01'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">{lang === 'ar' ? 'تاريخ انتهاء الإقامة:' : 'Iqama Expiry Date:'}</span>
                      <div className="flex flex-col gap-1 items-start mt-0.5">
                        <span className="font-mono font-bold text-slate-800">{selectedEmp.iqamaExpiryDate || (lang === 'ar' ? 'غير محدد' : 'Not Specified')}</span>
                        {selectedEmp.iqamaExpiryDate && (() => {
                          const statusObj = getIqamaStatus(selectedEmp.iqamaExpiryDate, lang);
                          return (
                            <span className={`px-2 py-0.5 text-[9.5px] font-black rounded border ${statusObj.badgeClass}`}>
                              {statusObj.status} {statusObj.daysLeft > 0 ? `(${statusObj.daysLeft} ${lang === 'ar' ? 'يوم' : 'days'})` : ''}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    
                    <div className="col-span-2 border-t pt-2 mt-2">
                      <span className="text-xs text-[#0072BC] block font-black mb-2">{lang === 'ar' ? 'تأمين طبي:' : 'Medical Insurance:'}</span>
                      <div className="flex flex-wrap gap-4">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">{lang === 'ar' ? 'رقم البوليصة:' : 'Policy/Company:'}</span>
                          <p className="font-mono font-black text-slate-800 text-xs">{selectedEmp.insurancePolicyNumber || '-'} / {selectedEmp.insuranceCompany || '-'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">{lang === 'ar' ? 'الفئة:' : 'Class:'}</span>
                          <p className="font-black text-slate-800 text-xs">{selectedEmp.insuranceClass || '-'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">{lang === 'ar' ? 'تاريخ الانتهاء:' : 'Expiry Date:'}</span>
                          <div className="flex flex-col gap-1 items-start mt-0.5">
                            <span className="font-mono font-bold text-slate-800 text-xs">{selectedEmp.insuranceExpiryDate || (lang === 'ar' ? 'غير مسجل' : 'Not Set')}</span>
                            {selectedEmp.insuranceExpiryDate && (() => {
                              const insStatus = getInsuranceStatus(selectedEmp.insuranceExpiryDate, lang);
                              return (
                                <span className={`px-2 py-0.5 text-[9.5px] font-black rounded border ${insStatus.badgeClass}`}>
                                  {insStatus.status} {insStatus.daysLeft > 0 ? `(${insStatus.daysLeft} ${lang === 'ar' ? 'يوم' : 'days'})` : ''}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">{lang === 'ar' ? 'تاريخ انتهاء الجواز:' : 'Passport Expiry Date:'}</span>
                      <p className="font-mono font-semibold text-amber-700">{selectedEmp.passportExpiryDate || 'عير محدد'}</p>
                    </div>
                    
                    {/* Dynamic Calculated Years of Experience built natively on dateOfJoining subtraction */}
                    <div className="col-span-1 sm:col-span-2 bg-[#0072BC]/5 p-3.5 rounded-xl border border-[#0072BC]/10 flex justify-between items-center text-xs mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">📊</span>
                        <div>
                          <p className="font-extrabold text-[#0072BC]">{lang === 'ar' ? 'سنوات الخبرة بالمنشأة' : 'Calculated In-House Service'}</p>
                          <p className="text-[10px] text-slate-450">{lang === 'ar' ? 'محسوبة تلقائياً بناءً على تاريخ الالتحاق إلى اليوم' : 'Parsed dynamically up to current UTC time'}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="font-mono text-lg font-black text-[#0072BC] bg-[#0072BC]/15 px-3 py-1 rounded-lg">
                          {calculateExperience(selectedEmp.dateOfJoining)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold mr-1.5">{lang === 'ar' ? 'سنوات' : 'Years'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>


              {/* SECTION: Salary and Employment Contract Details */}
              <div className="bg-white p-5 rounded-2xl border border-slate-150 space-y-4 text-right">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base text-slate-705">💵</span>
                    <div>
                      <h4 className="font-extrabold text-[#0072BC] text-xs">
                        {lang === 'ar' ? 'بيانات الراتب والعقد الوظيفي' : 'Salary and Employment Contract Details'}
                      </h4>
                      <span className="text-[10px] text-slate-400 block">
                        {lang === 'ar' ? 'إدارة الرواتب الأساسية، البدلات (سكن، نقل، طعام)، وتواريخ العقود لمنصة قوى.' : 'Manage basic compensation, allowances (housing, food, transport), and Qiwa contract specifics.'}
                      </span>
                    </div>
                  </div>
                  
                  {!isEditingSalaryContract && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingSalaryContract(true);
                        setSalaryContractForm({
                          basicSalary: selectedEmp.basicSalary || 0,
                          housing: selectedEmp.allowances?.housing || 0,
                          transport: selectedEmp.allowances?.transport || 0,
                          food: (selectedEmp.allowances as any)?.food || 0,
                          loans: selectedEmp.allowances?.loans || 0,
                          deductions: selectedEmp.allowances?.deductions || 0,
                          status: selectedEmp.allowances?.status || 'Active',
                          contractQiwaNumber: selectedEmp.contractQiwaNumber || '',
                          contractUrl: selectedEmp.contractUrl || '',
                          contractExpiry: selectedEmp.contractExpiry || ''
                        });
                        setIsContractEditingUrl(!selectedEmp.contractUrl);
                      }}
                      className="px-3 py-1 bg-[#0072BC]/10 hover:bg-[#0072BC]/20 text-[#0072BC] font-extrabold text-[11px] rounded-lg transition-all cursor-pointer"
                    >
                      {lang === 'ar' ? 'تعديل الراتب والعقد' : 'Edit Salary & Contract'}
                    </button>
                  )}
                </div>

                {isEditingSalaryContract ? (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const updatedFields: Partial<Employee> = {
                      basicSalary: Number(salaryContractForm.basicSalary) || 0,
                      allowances: {
                        housing: Number(salaryContractForm.housing) || 0,
                        transport: Number(salaryContractForm.transport) || 0,
                        phone: selectedEmp.allowances?.phone || 0,
                        food: Number(salaryContractForm.food) || 0,
                        loans: Number(salaryContractForm.loans) || 0,
                        deductions: Number(salaryContractForm.deductions) || 0,
                        status: salaryContractForm.status || 'Active'
                      },
                      contractQiwaNumber: salaryContractForm.contractQiwaNumber || '',
                      contractUrl: salaryContractForm.contractUrl || '',
                      contractExpiry: salaryContractForm.contractExpiry || ''
                    };
                    onUpdateEmployeeFields(selectedEmp.id, updatedFields);
                    setSelectedEmp(prev => prev ? { ...prev, ...updatedFields } : null);
                    setIsEditingSalaryContract(false);
                    if (onReloadEmployees) {
                      await onReloadEmployees();
                    }
                    alert(lang === 'ar' ? '✓ تم حفظ تعديلات الراتب والعقد بنجاح!' : '✓ Salary and contract modifications saved!');
                  }} className="space-y-4">
                    {/* SECTION 1: Compensations & Allowances editing */}
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 space-y-3">
                      <h5 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                        <span>💰</span>
                        {lang === 'ar' ? 'تفاصيل الراتب والبدلات' : 'Salary & Allowance Items'}
                      </h5>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-right">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1 text-[10px]">{lang === 'ar' ? 'الراتب الأساسي' : 'Basic Salary'}</label>
                          <input 
                            type="number"
                            value={salaryContractForm.basicSalary || ''}
                            onChange={e => setSalaryContractForm({ ...salaryContractForm, basicSalary: parseFloat(e.target.value) || 0 })}
                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1 text-[10px]">{lang === 'ar' ? 'بدل سكن' : 'Housing Allowance'}</label>
                          <input 
                            type="number"
                            value={salaryContractForm.housing || ''}
                            onChange={e => setSalaryContractForm({ ...salaryContractForm, housing: parseFloat(e.target.value) || 0 })}
                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1 text-[10px]">{lang === 'ar' ? 'بدل نقل' : 'Transport Allowance'}</label>
                          <input 
                            type="number"
                            value={salaryContractForm.transport || ''}
                            onChange={e => setSalaryContractForm({ ...salaryContractForm, transport: parseFloat(e.target.value) || 0 })}
                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1 text-[10px]">{lang === 'ar' ? 'بدل طعام' : 'Food Allowance'}</label>
                          <input 
                            type="number"
                            value={salaryContractForm.food || ''}
                            onChange={e => setSalaryContractForm({ ...salaryContractForm, food: parseFloat(e.target.value) || 0 })}
                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-center"
                          />
                        </div>
                      </div>

                      {/* Row 2: Status, Loans, Deductions */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-right pt-3 border-t border-slate-100">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1 text-[10px]">{lang === 'ar' ? 'حالة الموظف' : 'Employee Status'}</label>
                          <select 
                            value={salaryContractForm.status || 'Active'}
                            onChange={e => setSalaryContractForm({ ...salaryContractForm, status: e.target.value })}
                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold text-center"
                          >
                            <option value="Active">{lang === 'ar' ? '🟢 نشط (Active)' : 'Active'}</option>
                            <option value="On Leave">{lang === 'ar' ? '🌴 في إجازة (On Leave)' : 'On Leave'}</option>
                            <option value="Suspended">{lang === 'ar' ? '🔴 موقوف عن العمل (Suspended)' : 'Suspended'}</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1 text-[10px]">{lang === 'ar' ? 'السلفة المالية النشطة (ريال)' : 'Active Loan/Advance (SAR)'}</label>
                          <input 
                            type="number"
                            value={salaryContractForm.loans || ''}
                            onChange={e => setSalaryContractForm({ ...salaryContractForm, loans: parseFloat(e.target.value) || 0 })}
                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-center text-amber-600"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1 text-[10px]">{lang === 'ar' ? 'إجمالي الخصومات هذا الشهر (ريال)' : 'This Month Deductions (SAR)'}</label>
                          <input 
                            type="number"
                            value={salaryContractForm.deductions || ''}
                            onChange={e => setSalaryContractForm({ ...salaryContractForm, deductions: parseFloat(e.target.value) || 0 })}
                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-center text-rose-600"
                          />
                        </div>
                      </div>

                      {/* Live Total calculation badge */}
                      <div className="flex justify-between items-center bg-emerald-50 text-emerald-800 px-3 py-2 rounded-xl text-xs border border-emerald-100/50 mt-1">
                        <span className="font-bold">{lang === 'ar' ? 'إجمالي الراتب المحسوب:' : 'Calculated Gross Salary:'}</span>
                        <span className="font-mono font-black text-sm">
                          {(Number(salaryContractForm.basicSalary) + Number(salaryContractForm.housing) + Number(salaryContractForm.transport) + Number(salaryContractForm.food)).toLocaleString()} {lang === 'ar' ? 'ريال سعودي' : 'SAR'}
                        </span>
                      </div>
                    </div>

                    {/* SECTION 2: Contract Specifics editing */}
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 space-y-3">
                      <h5 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                        <span>📜</span>
                        {lang === 'ar' ? 'تفاصيل عقد العمل والمنصات' : 'Qiwa Platform & Contract Details'}
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-right">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1 text-[10px]">{lang === 'ar' ? 'رقم العقد في منصة قوى' : 'Qiwa Contract Number'}</label>
                          <input 
                            type="text"
                            placeholder="e.g. QW-905183"
                            value={salaryContractForm.contractQiwaNumber}
                            onChange={e => setSalaryContractForm({ ...salaryContractForm, contractQiwaNumber: e.target.value })}
                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1 text-[10px]">{lang === 'ar' ? 'تاريخ انتهاء عقد العمل' : 'Contract Expiry Date'}</label>
                          <input 
                            type="date"
                            value={salaryContractForm.contractExpiry}
                            onChange={e => setSalaryContractForm({ ...salaryContractForm, contractExpiry: e.target.value })}
                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-center"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 mt-2 text-right">
                        <label className="block text-slate-400 font-bold text-[10px]">{lang === 'ar' ? 'رابط ملف العقد / المستند' : 'Contract Document URL'}</label>
                        <input 
                          type="url"
                          placeholder="https://example.com/contract.pdf"
                          value={salaryContractForm.contractUrl}
                          onChange={e => setSalaryContractForm({ ...salaryContractForm, contractUrl: e.target.value })}
                          className="w-full text-[11px] p-2.5 bg-white border border-slate-200 rounded-xl font-bold font-mono text-left"
                        />
                      </div>
                    </div>

                    {/* Actions bar for Salay and Contract edits form */}
                    <div className="flex gap-2 text-xs font-black pt-2">
                      <button 
                        type="submit" 
                        className="flex-1 bg-[#0072BC] hover:bg-[#0072BC]/95 text-white py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>{lang === 'ar' ? 'حفظ بيانات الراتب والعقد' : 'Commit Changes'}</span>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setIsEditingSalaryContract(false)} 
                        className="px-4 bg-slate-100 text-slate-600 py-2 rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                      >
                        {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* READ ONLY PRESENTATION & COUNTDOWN BADGES */
                  <div className="space-y-4">
                    {/* compensations table-like items */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-right">
                      <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100/70">
                        <span className="block text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'الراتب الأساسي' : 'Basic Salary:'}</span>
                        <p className="font-mono font-black text-slate-800 mt-0.5">{selectedEmp.basicSalary?.toLocaleString() || 0} SAR</p>
                      </div>
                      <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100/70">
                        <span className="block text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'بدل سكن' : 'Housing Allowance:'}</span>
                        <p className="font-mono font-black text-slate-700 mt-0.5">{selectedEmp.allowances?.housing?.toLocaleString() || 0} SAR</p>
                      </div>
                      <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100/70">
                        <span className="block text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'بدل نقل' : 'Transport Allowance:'}</span>
                        <p className="font-mono font-black text-slate-700 mt-0.5">{selectedEmp.allowances?.transport?.toLocaleString() || 0} SAR</p>
                      </div>
                      <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100/70">
                        <span className="block text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'بدل طعام' : 'Food Allowance:'}</span>
                        <p className="font-mono font-black text-slate-700 mt-0.5">{(selectedEmp.allowances as any)?.food?.toLocaleString() || 0} SAR</p>
                      </div>
                    </div>

                    {/* Secondary Metrics row for Status, Active Loans and Deductions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-right">
                      <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100/70">
                        <span className="block text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'حالة العمل الحالية' : 'Work Status:'}</span>
                        <p className="font-extrabold mt-0.5 text-xs text-slate-800">
                          {selectedEmp.allowances?.status === 'On Leave' 
                            ? (lang === 'ar' ? '🌴 في إجازة (On Leave)' : 'On Leave')
                            : selectedEmp.allowances?.status === 'Suspended'
                              ? (lang === 'ar' ? '🔴 موقوف عن العمل (Suspended)' : 'Suspended')
                              : (lang === 'ar' ? '🟢 نشط (Active)' : 'Active')
                          }
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100/70">
                        <span className="block text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'السلفة المالية النشطة' : 'Active Personal Loan:'}</span>
                        <p className="font-mono font-black text-amber-600 mt-0.5">{(selectedEmp.allowances?.loans || 0).toLocaleString()} SAR</p>
                      </div>
                      <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100/70">
                        <span className="block text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'الخصومات هذا الشهر' : 'This Month Deductions:'}</span>
                        <p className="font-mono font-black text-rose-500 mt-0.5">-{(selectedEmp.allowances?.deductions || 0).toLocaleString()} SAR</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-[#0072BC]/5 text-[#0072BC] px-4 py-3 rounded-xl text-xs border border-[#0072BC]/10">
                      <span className="font-black text-slate-750">{lang === 'ar' ? 'إجمالي الراتب الشهري الشامل:' : 'Total Calculated Gross Compensation:'}</span>
                      <span className="font-mono font-black text-base">
                        {((selectedEmp.basicSalary || 0) + 
                          (selectedEmp.allowances?.housing || 0) + 
                          (selectedEmp.allowances?.transport || 0) + 
                          ((selectedEmp.allowances as any)?.food || 0)).toLocaleString()} {lang === 'ar' ? 'ريال سعودي' : 'SAR'}
                      </span>
                    </div>

                    {/* Contract Details and Counter/Countdown */}
                    <div className="bg-slate-50/40 p-4 rounded-xl border border-slate-100 space-y-3 text-right">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="block text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'رقم العقد في قوى:' : 'Qiwa Contract Number:'}</span>
                          <p className="font-mono font-bold text-slate-800 text-xs mt-0.5">{selectedEmp.contractQiwaNumber || (lang === 'ar' ? 'غير مسجل' : 'N/A')}</p>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'تاريخ انتهاء عقد العمل:' : 'Contract Expiry Date:'}</span>
                          <p className="font-mono font-bold text-slate-800 text-xs mt-0.5">{selectedEmp.contractExpiry || (lang === 'ar' ? 'غير محدد' : 'N/A')}</p>
                        </div>
                      </div>

                      {/* Contract Countdown Bar */}
                      {selectedEmp.contractExpiry && (() => {
                        const expiry = new Date(selectedEmp.contractExpiry);
                        const today = new Date();
                        expiry.setHours(0, 0, 0, 0);
                        today.setHours(0, 0, 0, 0);
                        const diffTime = expiry.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        let badgeColorClass = "";
                        let textMessage = "";
                        let isExpired = false;

                        if (diffDays <= 0) {
                          isExpired = true;
                          badgeColorClass = "bg-rose-50 text-rose-700 border-rose-200";
                          textMessage = lang === 'ar' 
                            ? "⚠️ انتهى العقد! يرجى اتخاذ إجراء إما بإنهاء العلاقة التعاقدية أو تجديد عقد العمل، ويرجى إعلام الموظف بانتهاء عقد العمل."
                            : "⚠️ Contract Expired! Please take action: either terminate the contractual relationship or renew the employment contract, and notify the employee of contract expiration.";
                        } else if (diffDays <= 60) {
                          // Less than or equal to 2 months (60 days)
                          badgeColorClass = "bg-orange-50 text-orange-700 border-orange-200 animate-pulse";
                          textMessage = lang === 'ar' 
                            ? "⚠️ بقي أقل من شهرين! يرجى الاستعداد لتسوية العقد أو أخذ خطوة تجديد عقد العمل." 
                            : "⚠️ Less than 2 months remaining. Prepare contract actions.";
                        } else if (diffDays <= 90) {
                          // Less than 3 months but more than 2 months (61 to 90 days)
                          badgeColorClass = "bg-yellow-50 text-yellow-700 border-yellow-200";
                        } else {
                          // More than 3 months
                          badgeColorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                        }

                        return (
                          <div className="mt-3 space-y-2 border-t border-slate-100 pt-2.5">
                            <div className="flex justify-between items-center text-right" dir="rtl">
                              <span className="text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'حالة سريان العقد:' : 'Contract Validity State:'}</span>
                              <span className={`px-3 py-1 text-xs font-black rounded-lg border flex items-center gap-1 font-mono ${badgeColorClass}`}>
                                ⏳ {isExpired ? (
                                  <span>{lang === 'ar' ? 'منتهي الصلاحية' : 'Expired'}</span>
                                ) : (
                                  <span>
                                    {lang === 'ar' ? `متبقي ${diffDays} يوم` : `${diffDays} days remaining`}
                                  </span>
                                )}
                              </span>
                            </div>
                            
                            {textMessage && (
                              <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl mt-1.5">
                                <p className="text-red-700 text-xs font-extrabold leading-relaxed text-right" dir="rtl">
                                  {textMessage}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Displaying / Opening Contract Link URL */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-2.5 border-t border-slate-100">
                        {selectedEmp.contractUrl ? (
                          <>
                            <a 
                              href={selectedEmp.contractUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 font-black text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-center"
                            >
                              <span>📂 {lang === 'ar' ? 'عرض ملف العقد Web' : 'View Contract File'}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                setSalaryContractForm({
                                  basicSalary: selectedEmp.basicSalary || 0,
                                  housing: selectedEmp.allowances?.housing || 0,
                                  transport: selectedEmp.allowances?.transport || 0,
                                  food: (selectedEmp.allowances as any)?.food || 0,
                                  loans: selectedEmp.allowances?.loans || 0,
                                  deductions: selectedEmp.allowances?.deductions || 0,
                                  status: selectedEmp.allowances?.status || 'Active',
                                  contractQiwaNumber: selectedEmp.contractQiwaNumber || '',
                                  contractUrl: selectedEmp.contractUrl || '',
                                  contractExpiry: selectedEmp.contractExpiry || ''
                                });
                                setIsEditingSalaryContract(true);
                              }}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>✏️ {lang === 'ar' ? 'تعديل ملف العقد' : 'Edit Contract Link'}</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSalaryContractForm({
                                basicSalary: selectedEmp.basicSalary || 0,
                                housing: selectedEmp.allowances?.housing || 0,
                                transport: selectedEmp.allowances?.transport || 0,
                                food: (selectedEmp.allowances as any)?.food || 0,
                                loans: selectedEmp.allowances?.loans || 0,
                                deductions: selectedEmp.allowances?.deductions || 0,
                                status: selectedEmp.allowances?.status || 'Active',
                                contractQiwaNumber: selectedEmp.contractQiwaNumber || '',
                                contractUrl: selectedEmp.contractUrl || '',
                                contractExpiry: selectedEmp.contractExpiry || ''
                              });
                              setIsEditingSalaryContract(true);
                            }}
                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer col-span-2"
                          >
                            <span>⚠️ {lang === 'ar' ? 'لم يتم حفظ ملف العقد (اضغط لتعديل وإدراج الرابط)' : 'No Contract File Uploaded (Click to Insert URL)'}</span>
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                )}
              </div>

              {/* SECTION: Custody Assets ("العهد المسجلة لدى الموظف" تكتب يدوياً) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-150 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                  <span className="text-base text-slate-700">🛡️</span>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-xs">{lang === 'ar' ? 'العهد المسجلة لدى الموظف' : 'Registered Employee Custody List'}</h4>
                    <span className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'إضافة عهد يدوية مع تتبع تواريخ الاستلام وتصنيف العهدة بالتفصيل.' : 'A complete manual record of tools, laptops, or cars allocated to this staff.'}</span>
                  </div>
                </div>

                {/* List of custom assets inside selected employee */}
                <div className="space-y-2">
                  {selectedEmp.custodyAssets && selectedEmp.custodyAssets.length > 0 ? (
                    <div className="border border-slate-100 rounded-xl overflow-hidden text-right">
                      <table className="w-full text-[11px] border-collapse bg-slate-50/50">
                        <thead>
                          <tr className="bg-slate-100/60 text-slate-500 text-[9px] uppercase font-bold border-b border-slate-150">
                            <th className="p-2 font-black">{lang === 'ar' ? 'العهدة' : 'Asset'}</th>
                            <th className="p-2 font-black">{lang === 'ar' ? 'تاريخ الاستلام' : 'Receipt Date'}</th>
                            <th className="p-2 font-black">{lang === 'ar' ? 'تصنيف العهدة' : 'Category'}</th>
                            <th className="p-2 font-black">{lang === 'ar' ? 'معلومات إضافية' : 'Additional Info'}</th>
                            <th className="p-2 text-center font-black">{lang === 'ar' ? 'حذف' : 'Remove'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          {selectedEmp.custodyAssets.map((asset, idx) => (
                            <tr key={idx} className="hover:bg-white transition-colors text-slate-700 font-bold">
                              <td className="p-2 text-indigo-700">{asset.name}</td>
                              <td className="p-2 font-mono text-[10px]">{asset.receivedDate}</td>
                              <td className="p-2">
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[9px]">
                                  {asset.category}
                                </span>
                              </td>
                              <td className="p-2 text-slate-500 font-medium">{asset.additionalInfo || '—'}</td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustodyAsset(idx)}
                                  className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg transition-all"
                                  title={lang === 'ar' ? 'مسح العهدة' : 'Delete asset'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div id="no-custody" className="p-6 bg-slate-50 rounded-xl text-center text-slate-400 font-bold border border-dashed border-slate-200">
                      {lang === 'ar' ? '✕ لا توجد أي عهد مسجلة مخصصة لهذا الموظف حالياً.' : 'No manual custody registry found for this individual.'}
                    </div>
                  )}
                </div>

                {/* Manuel Asset Registration Form */}
                <form onSubmit={handleAddCustodyAsset} className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/55 space-y-4 text-right">
                  <h5 className="font-extrabold text-xs text-slate-700">
                    ➕ {lang === 'ar' ? 'إضافة عهدة للموظف يدوياً:' : 'Register New Custom Custody Area:'}
                  </h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-slate-400 text-[10px] font-bold mb-1">{lang === 'ar' ? 'العهدة المستلمة' : 'Asset'}</label>
                      <input 
                        required
                        type="text" 
                        placeholder={lang === 'ar' ? 'مثال: لابتوب، جهاز معيرة' : 'e.g. Dell Latitue L54'}
                        value={newAsset.name} 
                        onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] font-bold mb-1">{lang === 'ar' ? 'تاريخ الاستلام' : 'Receipt Date'}</label>
                      <input 
                        type="date" 
                        value={newAsset.receivedDate} 
                        onChange={e => setNewAsset({ ...newAsset, receivedDate: e.target.value })}
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] font-bold mb-1">{lang === 'ar' ? 'تصنيف العهدة' : 'Category'}</label>
                      <select 
                        value={newAsset.category}
                        onChange={e => setNewAsset({ ...newAsset, category: e.target.value })}
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold text-right text-slate-700"
                      >
                        <option value="أجهزة ومعدات">{lang === 'ar' ? 'أجهزة ومعدات ومستلزمات' : 'IT/Electronic hardware'}</option>
                        <option value="سيارات ونقل">{lang === 'ar' ? 'سيارات وشاحنات نقل' : 'Vehicles / Mobility'}</option>
                        <option value="أدوات ورش ومصنع">{lang === 'ar' ? 'أدوات ورش ومصنع نيون' : 'Shopfloor Mechanical tools'}</option>
                        <option value="أثاث ومجهوزات">{lang === 'ar' ? 'أثاث ومجهوزات مكتبية' : 'Furniture & Office supplies'}</option>
                        <option value="أخرى">{lang === 'ar' ? 'تصنيفات أخرى' : 'Other'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] font-bold mb-1">{lang === 'ar' ? 'معلومات إضافية ومحضر الاستلام' : 'Additional details'}</label>
                      <input 
                        type="text" 
                        placeholder={lang === 'ar' ? 'مثال: رقم تسلسلي، قطع إضافية' : 'Serial tag or status description'}
                        value={newAsset.additionalInfo} 
                        onChange={e => setNewAsset({ ...newAsset, additionalInfo: e.target.value })}
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold text-right"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-[#0072BC] hover:bg-[#0072BC]/95 text-white font-black text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    ⚡ {lang === 'ar' ? 'إضافة وتسجيل العهدة فوراً للسيستم' : 'Commit Asset Handover & Save'}
                  </button>
                </form>
              </div>

              {/* REMOVE EMPLOYEE FROM TABLE TRIGGER (إزالة الموظف من الجدول) */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDeleteEmployee(selectedEmp.id)}
                  className="px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>{lang === 'ar' ? 'إزالة هذا الموظف من الجدول' : 'Remove Employee From Table'}</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 5. ADD NEW EMPLOYEE DIALOG MODAL (إضافة موظف) */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in" dir="rtl">
          <form onSubmit={handleCreateNewEmployeeSubmit} className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4 text-xs text-right">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800">
                ➕ {lang === 'ar' ? 'نموذج إلحاق وتعيين موظف جديد' : 'New Personnel Onboarding Form'}
              </h3>
              <button 
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="p-1 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              
              <div>
                <label className="block text-slate-500 font-bold mb-1">{lang === 'ar' ? 'اسمه رباعي بالعربية (مطلوب)' : 'Full Name Arabic (Required)'}</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: سلمان بن فيصل العتيبي"
                  value={newEmpForm.arabicName} 
                  onChange={e => setNewEmpForm({ ...newEmpForm, arabicName: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-right"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">{lang === 'ar' ? 'الاسم بالإنجليزية (اختياري)' : 'Full Name English (Optional)'}</label>
                <input 
                  type="text" 
                  placeholder="e.g. Salman Faisal Al-Otaibi"
                  value={newEmpForm.englishName} 
                  onChange={e => setNewEmpForm({ ...newEmpForm, englishName: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-right font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">{lang === 'ar' ? 'التصنيف الوظيفي (مطلوب)' : 'Job Classification (Required)'}</label>
                  <select 
                    value={newEmpForm.classification} 
                    onChange={e => setNewEmpForm({ ...newEmpForm, classification: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-right text-slate-700"
                  >
                    <option value="موظف">{lang === 'ar' ? 'موظف' : 'Staff'}</option>
                    <option value="عامل تصنيع">{lang === 'ar' ? 'عامل تصنيع' : 'Manufacturing Worker'}</option>
                    <option value="إداري">{lang === 'ar' ? 'إداري' : 'Administrative'}</option>
                    <option value="الإدارة العليا">{lang === 'ar' ? 'الإدارة العليا' : 'Senior Management'}</option>
                    <option value="فراس">{lang === 'ar' ? 'فراس' : 'Firas'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">{lang === 'ar' ? 'المسمى الوظيفي (مطلوب)' : 'Job Title (Required)'}</label>
                  <input 
                    type="text" 
                    required
                    placeholder="فني تجميع / أخصائي مبيعات"
                    value={newEmpForm.jobTitle} 
                    onChange={e => setNewEmpForm({ ...newEmpForm, jobTitle: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">{lang === 'ar' ? 'الجنسية' : 'Nationality'}</label>
                  <input 
                    type="text" 
                    value={newEmpForm.nationality} 
                    onChange={e => setNewEmpForm({ ...newEmpForm, nationality: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-right"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">{lang === 'ar' ? 'رقم الجوال' : 'Mobile Number'}</label>
                  <input 
                    type="text" 
                    value={newEmpForm.mobile} 
                    onChange={e => setNewEmpForm({ ...newEmpForm, mobile: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">{lang === 'ar' ? 'رقم الإقامة / الهوية (مطلوب)' : 'Iqama / ID Number (Required)'}</label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: 2409819482"
                    value={newEmpForm.iqamaId} 
                    onChange={e => setNewEmpForm({ ...newEmpForm, iqamaId: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">{lang === 'ar' ? 'رقم جواز السفر' : 'Passport Book Number'}</label>
                  <input 
                    type="text" 
                    placeholder="مثال: SA0928371"
                    value={newEmpForm.passportDetails} 
                    onChange={e => setNewEmpForm({ ...newEmpForm, passportDetails: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">{lang === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}</label>
                  <input 
                    type="date" 
                    value={newEmpForm.birthDate} 
                    onChange={e => setNewEmpForm({ ...newEmpForm, birthDate: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">{lang === 'ar' ? 'تاريخ التحاقه بالعمل' : 'Date of Joining'}</label>
                  <input 
                    type="date" 
                    value={newEmpForm.dateOfJoining} 
                    onChange={e => setNewEmpForm({ ...newEmpForm, dateOfJoining: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">{lang === 'ar' ? 'تاريخ انتهاء الإقامة' : 'Iqama Expiry Date'}</label>
                  <input 
                    type="date" 
                    value={newEmpForm.iqamaExpiryDate} 
                    onChange={e => setNewEmpForm({ ...newEmpForm, iqamaExpiryDate: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">{lang === 'ar' ? 'تاريخ انتهاء الجواز' : 'Passport Expiry Date'}</label>
                  <input 
                    type="date" 
                    value={newEmpForm.passportExpiryDate} 
                    onChange={e => setNewEmpForm({ ...newEmpForm, passportExpiryDate: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center"
                  />
                </div>
              </div>
              
              {/* Medical Insurance */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-black text-[#0072BC] mb-4">{lang === 'ar' ? 'التأمين الطبي (اختياري)' : 'Medical Insurance'}</h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">{lang === 'ar' ? 'رقم البوليصة' : 'Policy Number'}</label>
                    <input type="text" value={newEmpForm.insurancePolicyNumber || ''} onChange={e => setNewEmpForm({...newEmpForm, insurancePolicyNumber: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">{lang === 'ar' ? 'شركة التأمين' : 'Insurance Company'}</label>
                    <input type="text" value={newEmpForm.insuranceCompany || ''} onChange={e => setNewEmpForm({...newEmpForm, insuranceCompany: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">{lang === 'ar' ? 'فئة التأمين' : 'Class'}</label>
                    <select value={newEmpForm.insuranceClass || 'C'} onChange={e => setNewEmpForm({...newEmpForm, insuranceClass: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm">
                      <option value="VIP">VIP</option>
                      <option value="A">Class A</option>
                      <option value="B">Class B</option>
                      <option value="C">Class C</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">{lang === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}</label>
                    <input type="date" value={newEmpForm.insuranceExpiryDate || ''} onChange={e => setNewEmpForm({...newEmpForm, insuranceExpiryDate: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center" />
                  </div>
                </div>
              </div>


            </div>

            <div className="flex gap-2 text-xs font-black pt-4">
              <button 
                type="submit" 
                className="flex-1 bg-[#0072BC] hover:bg-[#0072BC]/95 text-white py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
              >
                {lang === 'ar' ? 'إضافة وحفظ' : 'Enroll Employee'}
              </button>
              <button 
                type="button" 
                onClick={() => setIsAddOpen(false)} 
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* 6. AI IMPORT MODAL (استيراد بالذكاء الاصطناعي) */}
      {isAiImportOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" dir="rtl">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4 text-xs text-right">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-indigo-700 flex items-center gap-2">
                <span>🤖</span>
                {lang === 'ar' ? 'استيراد بيانات ذكي' : 'Smart Data Import'}
              </h3>
              <button onClick={() => setIsAiImportOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-slate-500 font-medium leading-relaxed">
              {lang === 'ar' 
                ? 'قم بلصق النص المنسوخ من الجواز أو الإقامة، أو رفع صورة لمستند (PDF/Image). الذكاء الاصطناعي سيقوم باستخراج الاسم، التواريخ، الأرقام وغيرها تلقائياً!'
                : 'Paste text from a document, or upload an image/PDF. Our AI will extract all relevant information automatically.'}
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="font-extrabold text-slate-700">
                  {lang === 'ar' ? '١. الصق نصاً أو بيانات:' : '1. Paste Text/Data:'}
                </label>
                <textarea
                  value={aiImportText}
                  onChange={e => setAiImportText(e.target.value)}
                  placeholder={lang === 'ar' ? 'انسخ بيانات الإقامة أو الجواز والصقها هنا...' : 'Paste document text...'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 h-32 focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="font-extrabold text-slate-700">
                  {lang === 'ar' ? '٢. أو ارفع صورة / مستند (PDF/Excel):' : '2. Or Upload Document (PDF/Excel/Image):'}
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf,.xlsx,.xls,.csv"
                  onChange={e => setAiImportFile(e.target.files?.[0] || null)}
                  className="w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all border border-slate-200 rounded-xl p-2"
                />
              </div>
            </div>

            <div className="flex gap-2 text-xs font-black pt-4">
              <button 
                onClick={handleAiImportSubmit}
                disabled={aiImportLoading || (!aiImportText && !aiImportFile)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {aiImportLoading ? (
                  <span className="animate-pulse">{lang === 'ar' ? 'جاري الاستخراج...' : 'Extracting...'}</span>
                ) : (
                  <>
                    <span>🤖</span>
                    <span>{lang === 'ar' ? 'استخراج وتعبئة' : 'Extract & Fill'}</span>
                  </>
                )}
              </button>
              <button 
                onClick={() => setIsAiImportOpen(false)} 
                className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl transition-all cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. CUSTOM COUNTDOWN DELETE MODAL */}
      {empToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4 text-right">
            <div className="flex items-center gap-2 justify-end text-rose-600 pb-2 border-b">
              <span className="text-base font-black">
                {lang === 'ar' ? 'تأكيد إزالة الموظف من الجدول' : 'Confirm Employee Removal'}
              </span>
              <Trash2 className="w-5 h-5" />
            </div>
            
            <p className="text-xs text-slate-600 font-bold leading-relaxed">
              {lang === 'ar' 
                ? `هل أنت متأكد من رغبتك في إزالة الموظف "${empToDelete.arabicName || empToDelete.englishName}" من النظام؟` 
                : `Are you sure you want to remove employee "${empToDelete.englishName || empToDelete.arabicName}" from the system?`}
            </p>

            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-rose-700 text-[11px] space-y-1">
              <p className="font-black">
                {lang === 'ar' ? '⚠️ تحذير أمني هام:' : '⚠️ Important Security Warning:'}
              </p>
              <p className="font-bold">
                {lang === 'ar' 
                  ? 'هذا الإجراء سيقوم بحذف كافة سجلات وعقود وعهدات الموظف تماماً من قاعدة البيانات. الرجاء قراءة هذا التنبيه بعناية.' 
                  : 'This action will permanently delete all records, contracts, and assets of this employee from the database. Please read this caution carefully.'}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center py-2">
              {deleteCountdown > 0 ? (
                <div className="flex items-center gap-2 text-indigo-600 font-black text-xs animate-pulse">
                  <span>⏳</span>
                  <span>
                    {lang === 'ar' 
                      ? `يرجى الانتظار والمراجعة لـ ${deleteCountdown} ثوانٍ...` 
                      : `Please wait and review for ${deleteCountdown} seconds...`}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-600 font-black text-xs">
                  <span>✅</span>
                  <span>
                    {lang === 'ar' ? 'يمكنك الآن تأكيد الحذف النهائي' : 'You can now confirm permanent deletion'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={confirmDeleteEmployee}
                disabled={deleteCountdown > 0}
                className={`px-5 py-2.5 text-white font-black text-xs rounded-xl shadow transition-all flex items-center gap-1.5 ${
                  deleteCountdown > 0 
                    ? 'bg-rose-300 cursor-not-allowed opacity-75' 
                    : 'bg-rose-600 hover:bg-rose-700 cursor-pointer active:scale-95'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {deleteCountdown > 0 
                    ? (lang === 'ar' ? `انتظر (${deleteCountdown}ث)` : `Wait (${deleteCountdown}s)`)
                    : (lang === 'ar' ? 'تأكيد الحذف النهائي' : 'Confirm Permanent Delete')}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setEmpToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
