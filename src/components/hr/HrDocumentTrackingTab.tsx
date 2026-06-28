import React, { useState, useEffect } from 'react';
import { 
  FileText, Calendar, PlusCircle, Search, Trash2, Edit2, Eye, 
  AlertTriangle, CheckCircle2, Truck, User, FileCheck, RefreshCw, 
  SlidersHorizontal, Download, Printer, Clock, FileSpreadsheet, X, HelpCircle,
  Upload, Paperclip
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Employee, EmployeeDoc, VehicleDoc, DocActivityLog, User as SystemUser } from '../../types';
import { sharedPrintHeader, sharedPrintFooter, sharedPrintStyles } from '../../utils/PrintShared';

// Helper to convert base64 PDF to a local Blob URL for reliable iframe preview
function base64ToBlobUrl(base64Data: string, contentType: string = 'application/pdf'): string {
  try {
    const sliceSize = 512;
    let b64Data = base64Data;
    const commaIndex = base64Data.indexOf(',');
    if (commaIndex !== -1) {
      b64Data = base64Data.substring(commaIndex + 1);
    }
    
    const byteCharacters = atob(b64Data);
    const byteArrays: Uint8Array[] = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Failed to convert base64 to blob URL:", error);
    return base64Data; // Fallback to original
  }
}

interface HrDocumentTrackingTabProps {
  lang: 'ar' | 'en';
  employees: Employee[];
  user?: SystemUser | null;
  setActiveHRSubTab?: (tab: string) => void;
}

export default function HrDocumentTrackingTab({
  lang,
  employees,
  user,
  setActiveHRSubTab
}: HrDocumentTrackingTabProps) {
  const isAr = lang === 'ar';

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  
  const showToastMsg = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // View Document Modal States
  const [isViewDocOpen, setIsViewDocOpen] = useState(false);
  const [selectedViewDoc, setSelectedViewDoc] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (selectedViewDoc && selectedViewDoc.docFile && selectedViewDoc.docFile.startsWith('data:application/pdf')) {
      const url = base64ToBlobUrl(selectedViewDoc.docFile, 'application/pdf');
      setPdfBlobUrl(url);
    } else {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
    }
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [selectedViewDoc]);

  // Helper to convert uploaded files to compressed base64
  const handleFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      if (file.type.startsWith('image/')) {
        const img = new Image();
        reader.onload = (ev) => {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const MAX_DIM = 1000;
            if (width > height && width > MAX_DIM) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else if (height > MAX_DIM) {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
              resolve(dataUrl);
            } else {
              resolve(ev.target?.result as string);
            }
          };
          img.src = ev.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      } else {
        reader.onload = (ev) => {
          resolve(ev.target?.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }
    });
  };

  // State lists
  const [employeeDocs, setEmployeeDocs] = useState<EmployeeDoc[]>([]);
  const [vehicleDocs, setVehicleDocs] = useState<VehicleDoc[]>([]);
  const [activityLogs, setActivityLogs] = useState<DocActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Active portal tab: 'employee' or 'vehicle'
  const [activePortal, setActivePortal] = useState<'employee' | 'vehicle'>('employee');

  // Filter and Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [empFilter, setEmpFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [sortBy, setSortBy] = useState<'near_expiry' | 'oldest' | 'newest' | 'expired_first'>('near_expiry');

  // Modals / Windows
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [isEditDocOpen, setIsEditDocOpen] = useState(false);
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  
  // Selected Doc for Edit or Renewal
  const [selectedEmpDoc, setSelectedEmpDoc] = useState<EmployeeDoc | null>(null);
  const [selectedVehicleDoc, setSelectedVehicleDoc] = useState<VehicleDoc | null>(null);
  const [docToDelete, setDocToDelete] = useState<any | null>(null);

  // Expiry renewal sub-states
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');
  const [renewNotes, setRenewNotes] = useState('');
  const [renewWarningUrl, setRenewWarningUrl] = useState(false);

  // Add Document Form State
  const [addEmpForm, setAddEmpForm] = useState({
    employeeId: '',
    employeeName: '',
    employeeNum: '',
    department: '',
    jobTitle: '',
    docType: '',
    customDocType: '',
    docNumber: '',
    issueDate: '',
    expiryDate: '',
    docUrl: '',
    docFile: '',
    notes: '',
    alertDays: 30
  });

  const [addVehForm, setAddVehForm] = useState({
    vehicleName: '',
    plateNumber: '',
    model: '',
    driverName: '',
    docType: '',
    customDocType: '',
    docNumber: '',
    issueDate: '',
    expiryDate: '',
    docUrl: '',
    docFile: '',
    notes: '',
    alertDays: 30
  });

  // Edit forms
  const [editEmpForm, setEditEmpForm] = useState<Partial<EmployeeDoc>>({});
  const [editVehForm, setEditVehForm] = useState<Partial<VehicleDoc>>({});

  // Suggestion Constants
  const EMPLOYEE_DOC_SUGGESTIONS = [
    'السجل التجاري (CR)', 'شهادة الزكاة والدخل', 'رخصة البلدية والتشغيل', 
    'عضوية الغرفة التجارية', 'شهادة التوطين (نطاقات)', 'اشتراك التأمينات الاجتماعية', 
    'رخصة الدفاع المدني', 'شهادة ضريبة القيمة المضافة', 'العلامة التجارية المسجلة', 
    'صك ملكية العقار / عقد الإيجار', 'رخصة تشغيل صناعية', 'وثيقة أخرى'
  ];

  const VEHICLE_DOC_SUGGESTIONS = [
    'تأمين السيارة', 'استمارة السيارة', 'الفحص الدوري', 
    'رخصة السير', 'تصريح دخول موقع', 'بطاقة تشغيل', 
    'وثيقة صيانة', 'وثيقة أخرى'
  ];

  // Load Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resEmpDocs, resVehDocs, resLogs] = await Promise.all([
        fetch('/api/employee-docs'),
        fetch('/api/vehicle-docs'),
        fetch('/api/doc-activity-logs')
      ]);

      if (resEmpDocs.ok) setEmployeeDocs(await resEmpDocs.json());
      if (resVehDocs.ok) setVehicleDocs(await resVehDocs.json());
      if (resLogs.ok) {
        const logsData = await resLogs.json();
        // Sort logs by timestamp descending
        setActivityLogs(logsData.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }
    } catch (e) {
      console.error('Error fetching document tracking data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Read initial filter if coming from dashboard
    const savedFilter = localStorage.getItem('doc_filter');
    if (savedFilter === 'nearing_expiry') {
      setStatusFilter('qareeb_or_mootabaa_or_harej');
      localStorage.removeItem('doc_filter'); // Clear
    }
  }, []);

  // Post activity log
  const logActivity = async (
    actionType: DocActivityLog['actionType'],
    docCategory: DocActivityLog['docCategory'],
    docType: string,
    docNumber: string,
    relatedName: string,
    beforeState?: string,
    afterState?: string
  ) => {
    try {
      await fetch('/api/doc-activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          user: user?.username || 'HR_ADMIN',
          actionType,
          docCategory,
          docType,
          docNumber,
          relatedName,
          beforeState,
          afterState
        })
      });
      // Fetch latest logs
      const resLogs = await fetch('/api/doc-activity-logs');
      if (resLogs.ok) {
        const logsData = await resLogs.json();
        setActivityLogs(logsData.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }
    } catch (e) {
      console.error('Error saving activity log:', e);
    }
  };

  // Remaining days calculation
  const getRemainingDays = (expiryDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getRemainingDaysText = (expiryDateStr: string) => {
    const days = getRemainingDays(expiryDateStr);
    if (days < 0) {
      return isAr ? `منتهية منذ ${Math.abs(days)} يوم` : `Expired ${Math.abs(days)} days ago`;
    } else if (days === 0) {
      return isAr ? 'تنتهي اليوم' : 'Expires today';
    } else {
      return isAr ? `باقي ${days} يوم` : `${days} days remaining`;
    }
  };

  // Status calculation and classes
  const getDocStatus = (expiryDateStr: string) => {
    const days = getRemainingDays(expiryDateStr);
    if (days < 0) {
      return {
        textAr: 'منتهية',
        textEn: 'Expired',
        color: 'bg-stone-900 text-stone-100 border-stone-800',
        textColor: 'text-stone-800'
      };
    } else if (days === 0) {
      return {
        textAr: 'تنتهي اليوم',
        textEn: 'Expires Today',
        color: 'bg-red-950 text-red-100 border-red-900 animate-pulse',
        textColor: 'text-red-900 font-extrabold'
      };
    } else if (days >= 1 && days <= 7) {
      return {
        textAr: 'حرجة',
        textEn: 'Critical',
        color: 'bg-rose-500 text-white border-rose-600',
        textColor: 'text-rose-600 font-bold'
      };
    } else if (days >= 8 && days <= 30) {
      return {
        textAr: 'تحتاج متابعة',
        textEn: 'Needs Follow-up',
        color: 'bg-amber-500 text-white border-amber-600',
        textColor: 'text-amber-600 font-semibold'
      };
    } else if (days >= 31 && days <= 60) {
      return {
        textAr: 'قريبة من الانتهاء',
        textEn: 'Expiring Soon',
        color: 'bg-sky-500 text-white border-sky-600',
        textColor: 'text-sky-600 font-medium'
      };
    } else {
      return {
        textAr: 'سارية',
        textEn: 'Valid',
        color: 'bg-emerald-500 text-white border-emerald-600',
        textColor: 'text-emerald-600 font-medium'
      };
    }
  };

  // Metrics Calculations
  const allDocsCount = employeeDocs.length + vehicleDocs.length;
  const activeCount = [...employeeDocs, ...vehicleDocs].filter(d => getRemainingDays(d.expiryDate) > 60).length;
  const nearingExpiryCount = [...employeeDocs, ...vehicleDocs].filter(d => {
    const days = getRemainingDays(d.expiryDate);
    return days >= 31 && days <= 60;
  }).length;
  const expiredCount = [...employeeDocs, ...vehicleDocs].filter(d => getRemainingDays(d.expiryDate) < 0).length;
  const needsFileUpdateCount = [...employeeDocs, ...vehicleDocs].filter(d => !d.docUrl || d.notes?.toLowerCase().includes('تحديث')).length;

  const employeeDocsCount = employeeDocs.length;
  const vehicleDocsCount = vehicleDocs.length;

  // Add Employee Doc Submit
  const handleAddEmployeeDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!addEmpForm.employeeName || !addEmpForm.employeeId) {
      alert(isAr ? 'الرجاء كتابة اسم المنشأة والرقم الموحد!' : 'Please specify Establishment name and Registration ID!');
      return;
    }

    const finalType = addEmpForm.docType === 'وثيقة أخرى' ? addEmpForm.customDocType : addEmpForm.docType;
    if (!finalType) {
      alert(isAr ? 'الرجاء اختيار أو كتابة نوع الوثيقة!' : 'Please specify document type!');
      return;
    }

    // Check duplicate
    const isDuplicate = employeeDocs.some(d => 
      (d.employeeId.trim().toLowerCase() === addEmpForm.employeeId.trim().toLowerCase() && 
       d.docType.trim().toLowerCase() === finalType.trim().toLowerCase()) ||
      (addEmpForm.docNumber && d.docNumber.trim() && d.docNumber.trim().toLowerCase() === addEmpForm.docNumber.trim().toLowerCase())
    );

    if (isDuplicate) {
      showToastMsg(
        isAr 
          ? '⚠️ خطأ: هذه الوثيقة مسجلة مسبقاً بنفس رقم السجل والنوع أو نفس رقم الوثيقة!' 
          : '⚠️ Error: This document is already registered with the same registration number & type or document number!',
        'error'
      );
      return;
    }

    setIsSubmitting(true);
    const docStatus = getDocStatus(addEmpForm.expiryDate).textAr;

    const payload: Omit<EmployeeDoc, 'id'> = {
      employeeId: addEmpForm.employeeId,
      employeeName: addEmpForm.employeeName,
      employeeNum: addEmpForm.employeeId,
      department: addEmpForm.department || (isAr ? 'الإدارة العامة' : 'General Admin'),
      jobTitle: addEmpForm.jobTitle || (isAr ? 'وزارة التجارة' : 'Commerce Authority'),
      docType: finalType,
      docNumber: addEmpForm.docNumber,
      issueDate: addEmpForm.issueDate || undefined,
      expiryDate: addEmpForm.expiryDate,
      docUrl: addEmpForm.docUrl,
      docFile: addEmpForm.docFile || '',
      notes: addEmpForm.notes,
      status: docStatus,
      alertDays: Number(addEmpForm.alertDays) || 30,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.username || 'HR_ADMIN'
    };

    try {
      const res = await fetch('/api/employee-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await logActivity('ADD_DOC', 'employee', finalType, addEmpForm.docNumber, addEmpForm.employeeName, undefined, docStatus);
        setIsAddDocOpen(false);
        setAddEmpForm({
          employeeId: '',
          employeeName: '',
          employeeNum: '',
          department: '',
          jobTitle: '',
          docType: '',
          customDocType: '',
          docNumber: '',
          issueDate: '',
          expiryDate: '',
          docUrl: '',
          docFile: '',
          notes: '',
          alertDays: 30
        });
        showToastMsg(
          isAr ? '🎉 تم إضافة الوثيقة والملف بنجاح!' : '🎉 Document and file added successfully!',
          'success'
        );
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Vehicle Doc Submit
  const handleAddVehicleDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const finalType = addVehForm.docType === 'وثيقة أخرى' ? addVehForm.customDocType : addVehForm.docType;
    if (!finalType) {
      alert(isAr ? 'الرجاء اختيار أو كتابة نوع الوثيقة!' : 'Please specify document type!');
      return;
    }

    // Check duplicate
    const isDuplicate = vehicleDocs.some(d => 
      (d.plateNumber.trim().toLowerCase() === addVehForm.plateNumber.trim().toLowerCase() && 
       d.docType.trim().toLowerCase() === finalType.trim().toLowerCase()) ||
      (addVehForm.docNumber && d.docNumber.trim() && d.docNumber.trim().toLowerCase() === addVehForm.docNumber.trim().toLowerCase())
    );

    if (isDuplicate) {
      showToastMsg(
        isAr 
          ? '⚠️ خطأ: هذه الوثيقة مسجلة مسبقاً بنفس رقم اللوحة والنوع أو نفس رقم الوثيقة!' 
          : '⚠️ Error: This document already exists with the same plate number & type or document number!',
        'error'
      );
      return;
    }

    setIsSubmitting(true);
    const docStatus = getDocStatus(addVehForm.expiryDate).textAr;

    const payload: Omit<VehicleDoc, 'id'> = {
      vehicleName: addVehForm.vehicleName,
      plateNumber: addVehForm.plateNumber,
      model: addVehForm.model,
      driverName: addVehForm.driverName || undefined,
      docType: finalType,
      docNumber: addVehForm.docNumber,
      issueDate: addVehForm.issueDate || undefined,
      expiryDate: addVehForm.expiryDate,
      docUrl: addVehForm.docUrl,
      docFile: addVehForm.docFile || '',
      notes: addVehForm.notes,
      status: docStatus,
      alertDays: Number(addVehForm.alertDays) || 30,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.username || 'HR_ADMIN'
    };

    try {
      const res = await fetch('/api/vehicle-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const saved = await res.json();
        await logActivity('ADD_DOC', 'vehicle', finalType, addVehForm.docNumber, `${addVehForm.vehicleName} (${addVehForm.plateNumber})`, undefined, docStatus);
        setIsAddDocOpen(false);
        setAddVehForm({
          vehicleName: '',
          plateNumber: '',
          model: '',
          driverName: '',
          docType: '',
          customDocType: '',
          docNumber: '',
          issueDate: '',
          expiryDate: '',
          docUrl: '',
          docFile: '',
          notes: '',
          alertDays: 30
        });
        showToastMsg(
          isAr ? '🎉 تم إضافة وثيقة المركبة بنجاح!' : '🎉 Vehicle document added successfully!',
          'success'
        );
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Expiry date logic
  const handleOpenRenewModal = (docObj: any) => {
    if (activePortal === 'employee') {
      setSelectedEmpDoc(docObj);
      setSelectedVehicleDoc(null);
    } else {
      setSelectedVehicleDoc(docObj);
      setSelectedEmpDoc(null);
    }
    setNewExpiryDate(docObj.expiryDate);
    setNewDocUrl(docObj.docUrl || '');
    setRenewNotes(docObj.notes || '');
    setRenewWarningUrl(false);
    setIsRenewOpen(true);
  };

  const handleConfirmRenewal = async () => {
    const activeDoc = activePortal === 'employee' ? selectedEmpDoc : selectedVehicleDoc;
    if (!activeDoc) return;

    // Warning validation
    if (!newDocUrl && !renewWarningUrl) {
      setRenewWarningUrl(true);
      return; // Stop and display warning
    }

    const docStatus = getDocStatus(newExpiryDate).textAr;
    const beforeState = `${activeDoc.expiryDate} | ${activeDoc.status}`;
    const afterState = `${newExpiryDate} | ${docStatus}`;

    const updatedData = {
      ...activeDoc,
      expiryDate: newExpiryDate,
      docUrl: newDocUrl,
      notes: renewNotes,
      status: docStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.username || 'HR_ADMIN'
    };

    const endpoint = activePortal === 'employee' 
      ? `/api/employee-docs/${activeDoc.id}`
      : `/api/vehicle-docs/${activeDoc.id}`;

    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        await logActivity(
          'UPDATE_EXPIRY', 
          activePortal, 
          activeDoc.docType, 
          activeDoc.docNumber, 
          activePortal === 'employee' ? (activeDoc as EmployeeDoc).employeeName : `${(activeDoc as VehicleDoc).vehicleName} (${(activeDoc as VehicleDoc).plateNumber})`,
          beforeState,
          afterState
        );
        
        if (!newDocUrl) {
          alert(isAr 
            ? 'تم تحديث التاريخ، لكن لم يتم تحديث رابط ملف الوثيقة. يرجى التأكد من رفع أو تجديد ملف الوثيقة.'
            : 'Date updated but document file link was not provided. Please ensure you upload the file.'
          );
        }

        setIsRenewOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete document (opens custom modal)
  const handleDeleteDoc = (docObj: any) => {
    setDocToDelete(docObj);
  };

  const confirmDeleteDoc = async () => {
    if (!docToDelete) return;
    const docObj = docToDelete;
    const endpoint = activePortal === 'employee' 
      ? `/api/employee-docs/${docObj.id}`
      : `/api/vehicle-docs/${docObj.id}`;

    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        await logActivity(
          'DELETE_DOC', 
          activePortal, 
          docObj.docType, 
          docObj.docNumber, 
          activePortal === 'employee' ? docObj.employeeName : `${docObj.vehicleName} (${docObj.plateNumber})`,
          `${docObj.expiryDate} | ${docObj.status}`
        );
        setDocToDelete(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Doc Logic
  const handleOpenEditModal = (docObj: any) => {
    if (activePortal === 'employee') {
      setSelectedEmpDoc(docObj);
      setEditEmpForm({ ...docObj });
      setSelectedVehicleDoc(null);
    } else {
      setSelectedVehicleDoc(docObj);
      setEditVehForm({ ...docObj });
      setSelectedEmpDoc(null);
    }
    setIsEditDocOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const isEmployee = activePortal === 'employee';
    const activeDoc = isEmployee ? selectedEmpDoc : selectedVehicleDoc;
    if (!activeDoc) return;

    const updatedFields = isEmployee ? editEmpForm : editVehForm;
    const finalExpiry = updatedFields.expiryDate || activeDoc.expiryDate;
    const docStatus = getDocStatus(finalExpiry).textAr;

    const finalType = updatedFields.docType || activeDoc.docType;
    const finalDocNo = updatedFields.docNumber || activeDoc.docNumber;

    // Check duplicate excluding the current document being edited
    const isDuplicate = isEmployee
      ? employeeDocs.some(d => d.id !== activeDoc.id && (
          (d.employeeId.trim().toLowerCase() === (editEmpForm.employeeId || (activeDoc as EmployeeDoc).employeeId || '').trim().toLowerCase() && 
           d.docType.trim().toLowerCase() === finalType.trim().toLowerCase()) ||
          (finalDocNo && d.docNumber.trim() && d.docNumber.trim().toLowerCase() === finalDocNo.trim().toLowerCase())
        ))
      : vehicleDocs.some(d => d.id !== activeDoc.id && (
          (d.plateNumber.trim().toLowerCase() === (editVehForm.plateNumber || (activeDoc as VehicleDoc).plateNumber || '').trim().toLowerCase() && 
           d.docType.trim().toLowerCase() === finalType.trim().toLowerCase()) ||
          (finalDocNo && d.docNumber.trim() && d.docNumber.trim().toLowerCase() === finalDocNo.trim().toLowerCase())
        ));

    if (isDuplicate) {
      showToastMsg(
        isAr 
          ? '⚠️ تعديل مرفوض! هذه الوثيقة مكررة مع سجل آخر موجود بالفعل.' 
          : '⚠️ Edit rejected! This document is a duplicate of an existing record.',
        'error'
      );
      return;
    }

    setIsSubmitting(true);
    const updatedData = {
      ...activeDoc,
      ...updatedFields,
      status: docStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.username || 'HR_ADMIN'
    };

    const endpoint = isEmployee 
      ? `/api/employee-docs/${activeDoc.id}`
      : `/api/vehicle-docs/${activeDoc.id}`;

    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        await logActivity(
          'EDIT_DOC', 
          activePortal, 
          activeDoc.docType, 
          activeDoc.docNumber, 
          isEmployee ? (activeDoc as EmployeeDoc).employeeName : `${(activeDoc as VehicleDoc).vehicleName} (${(activeDoc as VehicleDoc).plateNumber})`,
          JSON.stringify(activeDoc),
          JSON.stringify(updatedData)
        );
        setIsEditDocOpen(false);
        showToastMsg(
          isAr ? '🎉 تم حفظ وتعديل البيانات بنجاح!' : '🎉 Document details modified successfully!',
          'success'
        );
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateFileFromView = async (newFileBase64: string) => {
    if (!selectedViewDoc) return;
    const isEmployee = activePortal === 'employee';
    const updatedData = {
      ...selectedViewDoc,
      docFile: newFileBase64,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.username || 'HR_ADMIN'
    };

    const endpoint = isEmployee 
      ? `/api/employee-docs/${selectedViewDoc.id}`
      : `/api/vehicle-docs/${selectedViewDoc.id}`;

    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        setSelectedViewDoc(updatedData);
        showToastMsg(
          isAr ? '🎉 تم تحديث مستند الوثيقة المرفق بنجاح!' : '🎉 Document scan updated successfully!',
          'success'
        );
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFileFromView = async () => {
    if (!selectedViewDoc) return;
    const isEmployee = activePortal === 'employee';
    const updatedData = {
      ...selectedViewDoc,
      docFile: '',
      updatedAt: new Date().toISOString(),
      updatedBy: user?.username || 'HR_ADMIN'
    };

    const endpoint = isEmployee 
      ? `/api/employee-docs/${selectedViewDoc.id}`
      : `/api/vehicle-docs/${selectedViewDoc.id}`;

    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        setSelectedViewDoc(updatedData);
        showToastMsg(
          isAr ? '❌ تم إزالة المستند المرفق بنجاح!' : '❌ Attached document removed successfully!',
          'success'
        );
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger download / print report
  const handlePrintReport = () => {
    const list = activePortal === 'employee' ? employeeDocs : vehicleDocs;
    
    // Log the print action
    logActivity('EXPORT_REPORT', activePortal, 'REPORT', 'ALL', activePortal === 'employee' ? 'Corporate Docs List' : 'Vehicle Docs List');

    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const title = isAr 
      ? (activePortal === 'employee' ? 'تقرير الوثائق والتراخيص الحكومية للشركة' : 'تقرير وثائق سيارات الشركة')
      : (activePortal === 'employee' ? 'Corporate & Gov Compliance Documents Report' : 'Company Fleet Documents Report');

    const headers = isAr
      ? (activePortal === 'employee'
        ? ['المنشأة/الكيان', 'الرقم الموحد/السجل', 'الفرع/النشاط', 'الجهة المصدرة', 'نوع الوثيقة', 'رقم الوثيقة', 'تاريخ الانتهاء', 'الوقت المتبقي', 'الحالة']
        : ['السيارة', 'اللوحة', 'الموديل', 'السائق المسؤول', 'نوع الوثيقة', 'رقم الوثيقة', 'تاريخ الانتهاء', 'الوقت المتبقي', 'الحالة'])
      : (activePortal === 'employee'
        ? ['Establishment/Entity', 'Registration ID', 'Branch/Sector', 'Issuing Authority', 'Doc Type', 'Doc No', 'Expiry', 'Time Left', 'Status']
        : ['Vehicle', 'Plate', 'Model', 'Driver', 'Doc Type', 'Doc No', 'Expiry', 'Time Left', 'Status']);

    let rowsHTML = '';
    list.forEach(docObj => {
      const remainingText = getRemainingDaysText(docObj.expiryDate);
      const statusObj = getDocStatus(docObj.expiryDate);
      const statusText = isAr ? statusObj.textAr : statusObj.textEn;

      if (activePortal === 'employee') {
        const empDoc = docObj as EmployeeDoc;
        rowsHTML += `
          <tr>
            <td>${empDoc.employeeName}</td>
            <td>${empDoc.employeeId}</td>
            <td>${empDoc.department}</td>
            <td>${empDoc.jobTitle}</td>
            <td>${empDoc.docType}</td>
            <td>${empDoc.docNumber}</td>
            <td>${empDoc.expiryDate}</td>
            <td>${remainingText}</td>
            <td style="font-weight: bold;">${statusText}</td>
          </tr>
        `;
      } else {
        const vehDoc = docObj as VehicleDoc;
        rowsHTML += `
          <tr>
            <td>${vehDoc.vehicleName}</td>
            <td>${vehDoc.plateNumber}</td>
            <td>${vehDoc.model}</td>
            <td>${vehDoc.driverName || '—'}</td>
            <td>${vehDoc.docType}</td>
            <td>${vehDoc.docNumber}</td>
            <td>${vehDoc.expiryDate}</td>
            <td>${remainingText}</td>
            <td style="font-weight: bold;">${statusText}</td>
          </tr>
        `;
      }
    });

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="${lang}" dir="${isAr ? 'rtl' : 'ltr'}">
        <head>
          <title>${title}</title>
          <style>
            ${sharedPrintStyles}
            body { font-family: 'Tajawal', Tahoma, Arial, sans-serif; padding: 30px; direction: ${isAr ? 'rtl' : 'ltr'}; text-align: ${isAr ? 'right' : 'left'}; }
            h2 { color: #0072BC; text-align: center; margin-bottom: 5px; }
            p.meta { text-align: center; font-size: 12px; color: #666; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; font-size: 11px; text-align: ${isAr ? 'right' : 'left'}; }
            th { background-color: #f8fafc; font-weight: bold; }
            tr:nth-child(even) { background-color: #fcfcfc; }
          </style>
        </head>
        <body>
          ${sharedPrintHeader}
          <h2>${title}</h2>
          <p class="meta">${isAr ? 'تاريخ التوليد:' : 'Generated Date:'} ${new Date().toLocaleDateString()} | ${isAr ? 'الجهة المسؤولة:' : 'Department:'} قسم الموارد البشرية والامتثال</p>
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>
          ${sharedPrintFooter}
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
  };

  // Export excel helper
  const handleExportExcel = () => {
    const list = activePortal === 'employee' ? employeeDocs : vehicleDocs;
    logActivity('EXPORT_REPORT', activePortal, 'EXCEL', 'ALL', activePortal === 'employee' ? 'Corporate Docs List' : 'Vehicle Docs List');

    const formatted = list.map(docObj => {
      const remainingText = getRemainingDaysText(docObj.expiryDate);
      const statusObj = getDocStatus(docObj.expiryDate);
      const statusText = isAr ? statusObj.textAr : statusObj.textEn;

      if (activePortal === 'employee') {
        const empDoc = docObj as EmployeeDoc;
        return {
          [isAr ? 'المنشأة/الكيان' : 'Establishment/Entity']: empDoc.employeeName,
          [isAr ? 'الرقم الموحد/السجل' : 'Registration ID']: empDoc.employeeId,
          [isAr ? 'الفرع/النشاط' : 'Branch/Sector']: empDoc.department,
          [isAr ? 'الجهة المصدرة' : 'Issuing Authority']: empDoc.jobTitle,
          [isAr ? 'نوع الوثيقة' : 'Doc Type']: empDoc.docType,
          [isAr ? 'رقم الوثيقة' : 'Doc No']: empDoc.docNumber,
          [isAr ? 'تاريخ الانتهاء' : 'Expiry']: empDoc.expiryDate,
          [isAr ? 'الوقت المتبقي' : 'Time Left']: remainingText,
          [isAr ? 'الحالة' : 'Status']: statusText,
          [isAr ? 'ملاحظات' : 'Notes']: empDoc.notes || ''
        };
      } else {
        const vehDoc = docObj as VehicleDoc;
        return {
          [isAr ? 'السيارة' : 'Vehicle']: vehDoc.vehicleName,
          [isAr ? 'اللوحة' : 'Plate']: vehDoc.plateNumber,
          [isAr ? 'الموديل' : 'Model']: vehDoc.model,
          [isAr ? 'السائق المسؤول' : 'Driver']: vehDoc.driverName || '—',
          [isAr ? 'نوع الوثيقة' : 'Doc Type']: vehDoc.docType,
          [isAr ? 'رقم الوثيقة' : 'Doc No']: vehDoc.docNumber,
          [isAr ? 'تاريخ الانتهاء' : 'Expiry']: vehDoc.expiryDate,
          [isAr ? 'الوقت المتبقي' : 'Time Left']: remainingText,
          [isAr ? 'الحالة' : 'Status']: statusText,
          [isAr ? 'ملاحظات' : 'Notes']: vehDoc.notes || ''
        };
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(formatted);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Documents');
    XLSX.writeFile(workbook, activePortal === 'employee' ? 'Corporate_Compliance_Documents.xlsx' : 'Vehicle_Documents.xlsx');
  };

  // Helper lists for filtering
  const uniqueDocTypes = Array.from(
    new Set(
      activePortal === 'employee'
        ? employeeDocs.map(d => d.docType)
        : vehicleDocs.map(d => d.docType)
    )
  );

  const uniqueDepts = Array.from(new Set(employeeDocs.map(d => d.department)));

  // Filter & Search Implementation
  const listToDisplay = (activePortal === 'employee' ? employeeDocs : vehicleDocs).filter(docObj => {
    // Search query match
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      if (activePortal === 'employee') {
        const d = docObj as EmployeeDoc;
        const matchesSearch = 
          d.employeeName.toLowerCase().includes(q) ||
          d.employeeId.toLowerCase().includes(q) ||
          d.docType.toLowerCase().includes(q) ||
          d.docNumber.toLowerCase().includes(q) ||
          (d.notes && d.notes.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      } else {
        const d = docObj as VehicleDoc;
        const matchesSearch = 
          d.vehicleName.toLowerCase().includes(q) ||
          d.plateNumber.toLowerCase().includes(q) ||
          d.docType.toLowerCase().includes(q) ||
          d.docNumber.toLowerCase().includes(q) ||
          (d.driverName && d.driverName.toLowerCase().includes(q)) ||
          (d.notes && d.notes.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }
    }

    // Status Filter
    if (statusFilter) {
      const days = getRemainingDays(docObj.expiryDate);
      if (statusFilter === 'saria' && days <= 60) return false;
      if (statusFilter === 'qareeb' && (days < 31 || days > 60)) return false;
      if (statusFilter === 'mootabaa' && (days < 8 || days > 30)) return false;
      if (statusFilter === 'harej' && (days < 1 || days > 7)) return false;
      if (statusFilter === 'alyoum' && days !== 0) return false;
      if (statusFilter === 'muntahia' && days >= 0) return false;
      
      // Multi-state helper (for nearing expiry indicator card filter)
      if (statusFilter === 'qareeb_or_mootabaa_or_harej' && (days <= 0 || days > 60)) return false;
    }

    // Document Type Filter
    if (typeFilter && docObj.docType !== typeFilter) return false;

    // Dept Filter (Employee only)
    if (activePortal === 'employee' && deptFilter) {
      if ((docObj as EmployeeDoc).department !== deptFilter) return false;
    }

    // Specific Employee Filter (Employee only)
    if (activePortal === 'employee' && empFilter) {
      if ((docObj as EmployeeDoc).employeeId !== empFilter) return false;
    }

    // Specific Vehicle Filter (Vehicle only)
    if (activePortal === 'vehicle' && vehicleFilter) {
      if ((docObj as VehicleDoc).plateNumber !== vehicleFilter) return false;
    }

    // Month & Year Filter
    if (docObj.expiryDate) {
      const dateParts = docObj.expiryDate.split('-'); // YYYY-MM-DD
      if (yearFilter && dateParts[0] !== yearFilter) return false;
      if (monthFilter && dateParts[1] !== monthFilter) return false;
    }

    return true;
  }).sort((a, b) => {
    const daysA = getRemainingDays(a.expiryDate);
    const daysB = getRemainingDays(b.expiryDate);

    if (sortBy === 'near_expiry') {
      // Ascending remaining days (closest first)
      return daysA - daysB;
    } else if (sortBy === 'oldest') {
      // Expiry Date Ascending
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    } else if (sortBy === 'newest') {
      // Expiry Date Descending
      return new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime();
    } else if (sortBy === 'expired_first') {
      // Expired first, then closest
      const isExpiredA = daysA < 0 ? 1 : 0;
      const isExpiredB = daysB < 0 ? 1 : 0;
      if (isExpiredA !== isExpiredB) {
        return isExpiredB - isExpiredA; // expired first
      }
      return daysA - daysB;
    }
    return 0;
  });

  // Top critical alerts block (تنبيهات الوثائق القريبة من الانتهاء)
  const criticalAlerts = [...employeeDocs, ...vehicleDocs].filter(d => {
    const days = getRemainingDays(d.expiryDate);
    return days <= 30; // Critical or Needs follow up
  }).sort((a, b) => getRemainingDays(a.expiryDate) - getRemainingDays(b.expiryDate)).slice(0, 5);

  return (
    <div id="hr-document-tracking-tab" className="space-y-6 text-right" dir="rtl">
      
      {/* FLOATING TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 p-4 bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl animate-fade-in">
          <div className={`w-3 h-3 rounded-full ${toast.type === 'success' ? 'bg-emerald-500 animate-pulse' : toast.type === 'error' ? 'bg-rose-500' : 'bg-amber-500'}`} />
          <span className="text-xs font-black">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white mr-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      
      {/* Header & Launcher banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-l from-slate-900 via-blue-950 to-slate-900 p-6 rounded-3xl border border-white/10 text-white shadow-xl">
        <div className="space-y-1">
          <h2 className="text-xl font-black flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#00AEEF] animate-bounce" />
            <span>{isAr ? 'نظام تتبع الوثائق والامتثال الشامل' : 'Comprehensive Document Expiry & Compliance Tracker'}</span>
          </h2>
          <p className="text-xs text-slate-300">
            {isAr 
              ? 'مراقبة فورية لصلاحية الإقامات، رخص العمل، تأمينات السيارات، الاستمارات، الفحص الدوري، مع التنبيهات الذكية وتوليد التقارير.' 
              : 'Real-time corporate compliance tracking for employee residencies, work permits, vehicle insurances, and safety tests.'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              // Pre-populate defaults
              setAddEmpForm({
                employeeId: 'CORP-01',
                employeeName: 'شركة فنون الوليد (المركز الرئيسي)',
                employeeNum: '1010724819',
                department: 'الإدارة العامة والامتثال',
                jobTitle: 'وزارة التجارة والاستثمار',
                docType: 'السجل التجاري (CR)',
                customDocType: '',
                docNumber: '',
                issueDate: '',
                expiryDate: new Date(Date.now() + 365 * 24 * 3600000).toISOString().split('T')[0],
                docUrl: '',
                docFile: '',
                notes: '',
                alertDays: 30
              });
              setAddVehForm({
                vehicleName: '',
                plateNumber: '',
                model: '',
                driverName: '',
                docType: 'تأمين السيارة',
                customDocType: '',
                docNumber: '',
                issueDate: '',
                expiryDate: new Date(Date.now() + 365 * 24 * 3600000).toISOString().split('T')[0],
                docUrl: '',
                docFile: '',
                notes: '',
                alertDays: 30
              });
              setIsAddDocOpen(true);
            }}
            className="px-4 py-2 bg-[#00AEEF] hover:bg-[#0072BC] text-slate-950 hover:text-white font-black text-xs rounded-xl transition-all shadow-md shadow-[#00AEEF]/20 flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isAr ? 'إضافة وثيقة جديدة' : 'Add New Document'}</span>
          </button>
          
          <button
            onClick={handlePrintReport}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all border border-slate-700 flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>{isAr ? 'طباعة تقرير' : 'Print Report'}</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all border border-emerald-700 flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'تصدير Excel' : 'Export Excel'}</span>
          </button>
          
          <button
            onClick={fetchData}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-slate-300 transition-all"
            title={isAr ? 'مزامنة وتحديث البيانات' : 'Sync latest docs'}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Indicative Indicators Cards (Bento Board) */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[...Array(7)].map((_, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm animate-pulse h-20"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          
          {/* 1. Total Documents */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col justify-between shadow-sm hover:shadow transition-all text-right">
            <span className="text-[10px] text-slate-400 font-extrabold">{isAr ? 'إجمالي الوثائق' : 'Total Docs'}</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-mono font-black text-slate-800">{allDocsCount}</span>
              <FileCheck className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-[9px] text-slate-500 mt-1">{isAr ? 'وثيقة نشطة بالنظام' : 'documents monitored'}</span>
          </div>

          {/* 2. Valid */}
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col justify-between shadow-sm hover:shadow transition-all text-right">
            <span className="text-[10px] text-emerald-600 font-extrabold">{isAr ? 'وثائق سارية' : 'Valid Docs'}</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-mono font-black text-emerald-800">{activeCount}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-[9px] text-emerald-600 mt-1">{isAr ? 'مستندات آمنة وصالحة' : 'safe & compliant'}</span>
          </div>

          {/* 3. Expiring Soon */}
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex flex-col justify-between shadow-sm hover:shadow transition-all text-right cursor-pointer"
               onClick={() => setStatusFilter(statusFilter === 'qareeb' ? '' : 'qareeb')}>
            <span className="text-[10px] text-blue-600 font-extrabold">{isAr ? 'شارفت على الانتهاء' : 'Expiring Soon'}</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-mono font-black text-blue-800">{nearingExpiryCount}</span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-[9px] text-blue-500 mt-1">{isAr ? 'تاريخ انتهائها < 60 يوم' : 'expires in 31-60 days'}</span>
          </div>

          {/* 4. Expired */}
          <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex flex-col justify-between shadow-sm hover:shadow transition-all text-right cursor-pointer"
               onClick={() => setStatusFilter(statusFilter === 'muntahia' ? '' : 'muntahia')}>
            <span className="text-[10px] text-rose-600 font-extrabold">{isAr ? 'وثائق منتهية' : 'Expired Docs'}</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-mono font-black text-rose-800">{expiredCount}</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <span className="text-[9px] text-rose-600 mt-1">{isAr ? 'تحتاج تجديد فوري' : 'expired already'}</span>
          </div>

          {/* 5. Needs file update */}
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex flex-col justify-between shadow-sm hover:shadow transition-all text-right">
            <span className="text-[10px] text-amber-600 font-extrabold">{isAr ? 'تحتاج تحديث ملف' : 'Missing Files'}</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-mono font-black text-amber-800">{needsFileUpdateCount}</span>
              <FileText className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-[9px] text-amber-500 mt-1">{isAr ? 'بلا ملف مرفق' : 'no digital doc attached'}</span>
          </div>

          {/* 6. Employee Docs */}
          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col justify-between shadow-sm hover:shadow transition-all text-right cursor-pointer"
               onClick={() => setActivePortal('employee')}>
            <span className="text-[10px] text-indigo-600 font-extrabold">{isAr ? 'الوثائق الحكومية والتراخيص' : 'Gov & Corp Docs'}</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-mono font-black text-indigo-800">{employeeDocsCount}</span>
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-[9px] text-indigo-500 mt-1">{isAr ? 'سجلات، زكاة، رخص وشهادات' : 'CR, Zakat, Licenses & Certs'}</span>
          </div>

          {/* 7. Vehicle Docs */}
          <div className="bg-cyan-50/50 p-4 rounded-2xl border border-cyan-100 flex flex-col justify-between shadow-sm hover:shadow transition-all text-right cursor-pointer"
               onClick={() => setActivePortal('vehicle')}>
            <span className="text-[10px] text-cyan-600 font-extrabold">{isAr ? 'وثائق السيارات والأسطول' : 'Fleet Docs'}</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-mono font-black text-cyan-800">{vehicleDocsCount}</span>
              <Truck className="w-4 h-4 text-cyan-600" />
            </div>
            <span className="text-[9px] text-cyan-500 mt-1">{isAr ? 'تأمين وفحص واستمارة' : 'insurances & safety'}</span>
          </div>

        </div>
      )}

      {/* Critical Alert Banner Notifications */}
      {criticalAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-2 shadow-sm text-right">
          <div className="flex items-center gap-2 pb-1.5 border-b border-amber-200 text-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse" />
            <h4 className="text-xs font-black">
              {isAr ? 'تنبيهات عاجلة: وثائق شركة أو مركبات شارفت على الانتهاء وتحتاج إجراء عاجل!' : 'Urgent Compliance Warnings: Action required!'}
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
            {criticalAlerts.map(docObj => {
              const days = getRemainingDays(docObj.expiryDate);
              const isEmp = 'employeeName' in docObj;
              const name = isEmp ? (docObj as EmployeeDoc).employeeName : `${(docObj as VehicleDoc).vehicleName} (${(docObj as VehicleDoc).plateNumber})`;
              const remainingText = getRemainingDaysText(docObj.expiryDate);
              
              return (
                <div key={docObj.id} className="flex justify-between items-center text-xs bg-white/70 p-2.5 rounded-xl border border-amber-100 hover:bg-amber-100/30 transition-all">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="text-[10px] bg-amber-200/50 text-amber-900 px-2 py-0.5 rounded-md font-extrabold">
                      {isEmp ? (isAr ? 'وثيقة شركة' : 'Gov/Corp') : (isAr ? 'مركبة' : 'Vehicle')}
                    </span>
                    <span className="text-slate-800 truncate max-w-[200px]">{name}</span>
                  </div>
                  <div className="text-left space-y-0.5">
                    <div className="text-[10px] text-slate-500 font-bold">{docObj.docType} (No. {docObj.docNumber})</div>
                    <div className={`font-mono font-black text-[11px] ${days < 0 ? 'text-rose-600' : days <= 7 ? 'text-red-500 animate-pulse' : 'text-amber-600'}`}>
                      {remainingText}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Double Portal Tab Selector */}
      <div className="flex border-b border-slate-100 gap-1 bg-white p-1 rounded-2xl border">
        <button
          onClick={() => {
            setActivePortal('employee');
            setSearchQuery('');
            setStatusFilter('');
            setTypeFilter('');
          }}
          className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
            activePortal === 'employee'
              ? 'bg-[#0072BC] text-white shadow-md shadow-[#0072BC]/20'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{isAr ? 'الوثائق الحكومية وتراخيص الشركة والمصنع' : 'Company Registries & Gov Licenses Portal'}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${activePortal === 'employee' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-500'}`}>
            {employeeDocsCount}
          </span>
        </button>

        <button
          onClick={() => {
            setActivePortal('vehicle');
            setSearchQuery('');
            setStatusFilter('');
            setTypeFilter('');
          }}
          className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
            activePortal === 'vehicle'
              ? 'bg-[#0072BC] text-white shadow-md shadow-[#0072BC]/20'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>{isAr ? 'وثائق سيارات وأسطول الشركة' : 'Company Fleet & Vehicle Compliance Portal'}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${activePortal === 'vehicle' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-500'}`}>
            {vehicleDocsCount}
          </span>
        </button>
      </div>

      {/* Filter and Search Box Controls */}
      <div className="bg-white/95 p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 text-right">
        <div className="flex items-center justify-between pb-2 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#0072BC]" />
            <h3 className="text-xs font-black text-slate-800">{isAr ? 'شريط البحث الذكي والتصفية الشاملة' : 'Advanced Search & Multi-Filters Bar'}</h3>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('');
              setTypeFilter('');
              setDeptFilter('');
              setEmpFilter('');
              setVehicleFilter('');
              setMonthFilter('');
              setYearFilter('');
              setSortBy('near_expiry');
            }}
            className="text-[10px] font-black text-[#0072BC] hover:underline"
          >
            {isAr ? '✓ إعادة ضبط الفلاتر' : 'Reset All Filters'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          {/* Quick Search */}
          <div className="relative">
            <label className="block text-[10px] font-extrabold text-slate-400 mb-1">{isAr ? 'البحث السريع' : 'Quick Search'}</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'ابحث باسم، رقم وثيقة، لوحة...' : 'Search by name, plate, number...'}
                className="w-full text-xs pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-right text-slate-700 focus:outline-none focus:border-[#0072BC]"
              />
              <Search className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 mb-1">{isAr ? 'تصفية حسب الحالة' : 'Status Filter'}</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-right"
            >
              <option value="">{isAr ? 'الكل' : 'All States'}</option>
              <option value="saria">{isAr ? '🟢 سارية (أكثر من 60 يوم)' : '🟢 Valid (> 60 days)'}</option>
              <option value="qareeb">{isAr ? '🔵 قريبة من الانتهاء (31 - 60 يوم)' : '🔵 Expiring Soon (31-60 days)'}</option>
              <option value="mootabaa">{isAr ? '🟠 تحتاج متابعة (8 - 30 يوم)' : '🟠 Needs Follow-up (8-30 days)'}</option>
              <option value="harej">{isAr ? '🔴 حرجة (1 - 7 أيام)' : '🔴 Critical (1-7 days)'}</option>
              <option value="alyoum">{isAr ? '🚨 تنتهي اليوم' : '🚨 Expires Today'}</option>
              <option value="muntahia">{isAr ? '⚫ منتهية' : '⚫ Expired'}</option>
            </select>
          </div>

          {/* Doc Type Filter */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 mb-1">{isAr ? 'نوع الوثيقة' : 'Document Type'}</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-right"
            >
              <option value="">{isAr ? 'كل الأنواع' : 'All Document Types'}</option>
              {uniqueDocTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Sorting */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 mb-1">{isAr ? 'ترتيب السجلات' : 'Sort Records'}</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-right"
            >
              <option value="near_expiry">{isAr ? 'الأقرب انتهاءً أولاً (افتراضي)' : 'Soonest Expiry (Default)'}</option>
              <option value="expired_first">{isAr ? 'المنتهية أولاً' : 'Expired First'}</option>
              <option value="oldest">{isAr ? 'تاريخ الانتهاء (من الأقدم للأحدث)' : 'Expiry Date (Ascending)'}</option>
              <option value="newest">{isAr ? 'تاريخ الانتهاء (من الأحدث للأقدم)' : 'Expiry Date (Descending)'}</option>
            </select>
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          
          {/* Specific employee or vehicle selection */}
          {activePortal === 'employee' ? (
            <>
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 mb-1">{isAr ? 'فلترة حسب الكيان/الجهة' : 'Filter by Entity'}</label>
                <select
                  value={empFilter}
                  onChange={(e) => setEmpFilter(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-right"
                >
                  <option value="">{isAr ? 'كل الكيانات والجهات' : 'All Entities'}</option>
                  {Array.from(new Set(employeeDocs.map(d => JSON.stringify({id: d.employeeId, name: d.employeeName})))).map(str => {
                    const parsed = JSON.parse(str);
                    return (
                      <option key={parsed.id} value={parsed.id}>{parsed.name}</option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 mb-1">{isAr ? 'فلترة حسب الفرع/النشاط' : 'Filter by Branch'}</label>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-right"
                >
                  <option value="">{isAr ? 'كل الفروع والأنشطة' : 'All Branches/Sectors'}</option>
                  {uniqueDepts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 mb-1">{isAr ? 'فلترة حسب السيارة' : 'Filter by Vehicle'}</label>
              <select
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-right"
              >
                <option value="">{isAr ? 'كل السيارات' : 'All Vehicles'}</option>
                {Array.from(new Set(vehicleDocs.map(d => d.plateNumber))).map(plate => {
                  const name = vehicleDocs.find(v => v.plateNumber === plate)?.vehicleName || 'سيارة';
                  return (
                    <option key={plate} value={plate}>{name} ({plate})</option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Month expiry */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 mb-1">{isAr ? 'فلترة حسب الشهر (الانتهاء)' : 'Expiry Month'}</label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-right"
            >
              <option value="">{isAr ? 'كل الأشهر' : 'All Months'}</option>
              {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Year expiry */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 mb-1">{isAr ? 'فلترة حسب السنة (الانتهاء)' : 'Expiry Year'}</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-right"
            >
              <option value="">{isAr ? 'كل السنوات' : 'All Years'}</option>
              {['2025', '2026', '2027', '2028', '2029', '2030', '2031'].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Main Table Segment */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-right">
        <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
          <h4 className="text-xs font-black text-[#0072BC]">
            {activePortal === 'employee' 
              ? (isAr ? 'جدول الوثائق والتراخيص الحكومية والبلدية للشركة' : 'Official Corporate & Gov Compliance Documents Ledger')
              : (isAr ? 'جدول وثائق وتأمين أسطول سيارات الشركة' : 'Company Fleet & Logistics Insurance Ledger')
            }
          </h4>
          <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full font-mono font-bold text-slate-700">
            {isAr ? 'سجلات معروضة:' : 'Records showing:'} {listToDisplay.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          {listToDisplay.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-bold flex flex-col items-center justify-center gap-2">
              <SlidersHorizontal className="w-8 h-8 text-slate-300 animate-pulse" />
              <span>{isAr ? 'لم يتم العثور على أي وثيقة مطابقة لمعايير البحث والتصفية.' : 'No compliance documents matches the active filters.'}</span>
            </div>
          ) : (
            <table className="w-full text-xs text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-[11px] font-black uppercase text-slate-600">
                  {activePortal === 'employee' ? (
                    <>
                      <th className="p-3 text-right">{isAr ? 'المنشأة / الكيان' : 'Establishment / Entity'}</th>
                      <th className="p-3 text-right">{isAr ? 'الرقم الموحد / السجل' : 'Registration ID'}</th>
                      <th className="p-3 text-right">{isAr ? 'الفرع / النشاط' : 'Branch / Sector'}</th>
                      <th className="p-3 text-right">{isAr ? 'الجهة الحكومية المصدرة' : 'Issuing Authority'}</th>
                      <th className="p-3 text-right">{isAr ? 'نوع الوثيقة' : 'Doc Type'}</th>
                      <th className="p-3 text-right">{isAr ? 'رقم الوثيقة' : 'Doc Number'}</th>
                      <th className="p-3 text-right">{isAr ? 'تاريخ الإصدار' : 'Issue Date'}</th>
                      <th className="p-3 text-right">{isAr ? 'تاريخ الانتهاء' : 'Expiry Date'}</th>
                      <th className="p-3 text-right">{isAr ? 'الوقت المتبقي' : 'Time Left'}</th>
                      <th className="p-3 text-right">{isAr ? 'حالة الوثيقة' : 'Status'}</th>
                      <th className="p-3 text-center">{isAr ? 'الإجراءات والتحكم' : 'Actions'}</th>
                    </>
                  ) : (
                    <>
                      <th className="p-3 text-right">{isAr ? 'رقم اللوحة' : 'Plate No.'}</th>
                      <th className="p-3 text-right">{isAr ? 'نوع السيارة' : 'Vehicle Type'}</th>
                      <th className="p-3 text-right">{isAr ? 'موديل السيارة' : 'Model'}</th>
                      <th className="p-3 text-right">{isAr ? 'السائق المسؤول' : 'Driver'}</th>
                      <th className="p-3 text-right">{isAr ? 'نوع الوثيقة' : 'Doc Type'}</th>
                      <th className="p-3 text-right">{isAr ? 'رقم الوثيقة' : 'Doc Number'}</th>
                      <th className="p-3 text-right">{isAr ? 'تاريخ الإصدار' : 'Issue Date'}</th>
                      <th className="p-3 text-right">{isAr ? 'تاريخ الانتهاء' : 'Expiry Date'}</th>
                      <th className="p-3 text-right">{isAr ? 'الوقت المتبقي' : 'Time Left'}</th>
                      <th className="p-3 text-right">{isAr ? 'حالة الوثيقة' : 'Status'}</th>
                      <th className="p-3 text-center">{isAr ? 'الإجراءات والتحكم' : 'Actions'}</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {listToDisplay.map(docObj => {
                  const statusObj = getDocStatus(docObj.expiryDate);
                  const remainingText = getRemainingDaysText(docObj.expiryDate);
                  const days = getRemainingDays(docObj.expiryDate);

                  return (
                    <tr key={docObj.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      {activePortal === 'employee' ? (
                        <>
                          <td className="p-3 font-extrabold text-slate-900">{(docObj as EmployeeDoc).employeeName}</td>
                          <td className="p-3 font-mono text-slate-500">{(docObj as EmployeeDoc).employeeId}</td>
                          <td className="p-3 font-semibold text-slate-600">{(docObj as EmployeeDoc).department}</td>
                          <td className="p-3 font-medium text-slate-500">{(docObj as EmployeeDoc).jobTitle}</td>
                          <td className="p-3 font-extrabold text-[#0072BC]">{docObj.docType}</td>
                          <td className="p-3 font-mono font-semibold">{docObj.docNumber}</td>
                          <td className="p-3 font-mono text-slate-400">{docObj.issueDate || '—'}</td>
                          <td className="p-3 font-mono font-extrabold text-slate-800">{docObj.expiryDate}</td>
                          <td className={`p-3 font-mono font-black ${days < 0 ? 'text-rose-600' : days <= 7 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
                            {remainingText}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${statusObj.color}`}>
                              {isAr ? statusObj.textAr : statusObj.textEn}
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 font-mono font-extrabold text-slate-900">{(docObj as VehicleDoc).plateNumber}</td>
                          <td className="p-3 font-extrabold text-slate-800">{(docObj as VehicleDoc).vehicleName}</td>
                          <td className="p-3 font-medium text-slate-500">{(docObj as VehicleDoc).model}</td>
                          <td className="p-3 font-semibold text-slate-600">{(docObj as VehicleDoc).driverName || '—'}</td>
                          <td className="p-3 font-extrabold text-cyan-700">{docObj.docType}</td>
                          <td className="p-3 font-mono font-semibold">{docObj.docNumber}</td>
                          <td className="p-3 font-mono text-slate-400">{docObj.issueDate || '—'}</td>
                          <td className="p-3 font-mono font-extrabold text-slate-800">{docObj.expiryDate}</td>
                          <td className={`p-3 font-mono font-black ${days < 0 ? 'text-rose-600' : days <= 7 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
                            {remainingText}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${statusObj.color}`}>
                              {isAr ? statusObj.textAr : statusObj.textEn}
                            </span>
                          </td>
                        </>
                      )}
                      
                      {/* Action buttons */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          
                          {/* 1. View document */}
                          <button
                            onClick={() => {
                              setSelectedViewDoc(docObj);
                              setIsViewDocOpen(true);
                              logActivity('VIEW_LINK', activePortal, docObj.docType, docObj.docNumber, activePortal === 'employee' ? (docObj as EmployeeDoc).employeeName : `${(docObj as VehicleDoc).vehicleName} (${(docObj as VehicleDoc).plateNumber})`);
                            }}
                            className={`p-1.5 rounded-lg transition-all ${docObj.docFile || docObj.docUrl ? 'bg-blue-50 text-blue-600 hover:bg-[#0072BC] hover:text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                            title={isAr ? 'عرض ومعاينة المستند' : 'View & preview document'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Quick update expiry */}
                          <button
                            onClick={() => handleOpenRenewModal(docObj)}
                            className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-lg transition-all"
                            title={isAr ? 'تحديث تاريخ الانتهاء عاجل' : 'Quick renew'}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>

                          {/* 3. Edit full record */}
                          <button
                            onClick={() => handleOpenEditModal(docObj)}
                            className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-all"
                            title={isAr ? 'تعديل البيانات' : 'Edit details'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* 4. Delete record */}
                          <button
                            onClick={() => handleDeleteDoc(docObj)}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all"
                            title={isAr ? 'حذف السجل نهائيا' : 'Delete document'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Mini Auditable Log Section */}
      <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/50 space-y-3 text-right">
        <h4 className="text-xs font-black text-[#0072BC] flex items-center gap-1.5 justify-start">
          <Clock className="w-4 h-4 text-[#0072BC]" />
          <span>{isAr ? 'سجل عمليات تدقيق الوثائق والالتزام' : 'Compliance Auditing Operations History'}</span>
        </h4>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {activityLogs.map(log => (
            <div key={log.id} className="text-[10px] bg-white p-2.5 rounded-xl border border-slate-100 flex justify-between items-center gap-4">
              <span className="font-mono text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
              <div className="flex-1 text-slate-700">
                <strong>{log.user}</strong>{' '}
                {log.actionType === 'ADD_DOC' && (isAr ? 'أضاف وثيقة جديدة' : 'added a new compliance paper')}
                {log.actionType === 'EDIT_DOC' && (isAr ? 'عدّل بيانات وثيقة' : 'edited compliance document metadata')}
                {log.actionType === 'UPDATE_EXPIRY' && (isAr ? 'جدّد وحدّث تاريخ انتهاء' : 'renewed expiry date on')}
                {log.actionType === 'DELETE_DOC' && (isAr ? 'حذف وثيقة' : 'deleted a compliance record for')}
                {log.actionType === 'VIEW_LINK' && (isAr ? 'عرض رابط ملف وثيقة' : 'viewed attachment file of')}
                {log.actionType === 'EXPORT_REPORT' && (isAr ? 'صدّر تقرير الوثائق المالي' : 'exported compliance reports for')}{' '}
                <strong className="text-[#0072BC]">{log.docType} ({log.docNumber})</strong>{' '}
                {isAr ? 'لـ' : 'for'} <strong>{log.relatedName}</strong>
              </div>
            </div>
          ))}
          {activityLogs.length === 0 && (
            <div className="text-center py-4 text-slate-400 font-semibold">{isAr ? 'لا توجد عمليات مسجلة حالياً.' : 'No compliance activity logged yet.'}</div>
          )}
        </div>
      </div>

      {/* MODAL 1: ADD DOCUMENT */}
      {isAddDocOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <h3 className="text-base font-black text-[#0072BC]">
                {activePortal === 'employee' 
                  ? (isAr ? '➕ إضافة وثيقة أو ترخيص حكومي جديد للمنشأة' : 'Add Corporate & Gov Compliance Doc')
                  : (isAr ? '➕ إضافة وثيقة تأمين سيارة' : 'Add Vehicle Compliance Doc')
                }
              </h3>
              <button onClick={() => setIsAddDocOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            {activePortal === 'employee' ? (
              // Add Employee Doc form
              <form onSubmit={handleAddEmployeeDoc} className="space-y-4 text-right">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'اسم المنشأة / الكيان' : 'Establishment / Entity Name'}</label>
                    <input
                      type="text"
                      required
                      value={addEmpForm.employeeName || ''}
                      onChange={(e) => setAddEmpForm({ ...addEmpForm, employeeName: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-right"
                      placeholder={isAr ? 'مثال: شركة فنون الوليد (المركز الرئيسي)' : 'e.g. Fonoun Alwaleed (Main HQ)'}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'الرقم الموحد / رقم السجل' : 'Unified ID / CR Number'}</label>
                    <input
                      type="text"
                      required
                      value={addEmpForm.employeeId || ''}
                      onChange={(e) => setAddEmpForm({ ...addEmpForm, employeeId: e.target.value, employeeNum: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center"
                      placeholder="1010724819"
                    />
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'الفرع / النشاط' : 'Branch / Active Sector'}</label>
                    <input
                      type="text"
                      required
                      value={addEmpForm.department || ''}
                      onChange={(e) => setAddEmpForm({ ...addEmpForm, department: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-right"
                      placeholder={isAr ? 'مثال: الإدارة العامة، مصنع الحديد، مستودع الدمام' : 'e.g. General Administration, Steel Factory'}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'الجهة المصدرة للوثيقة' : 'Issuing Gov Authority'}</label>
                    <input
                      type="text"
                      required
                      value={addEmpForm.jobTitle || ''}
                      onChange={(e) => setAddEmpForm({ ...addEmpForm, jobTitle: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-right"
                      placeholder={isAr ? 'مثال: وزارة التجارة، هيئة الزكاة، أمانة الشرقية' : 'e.g. Ministry of Commerce, ZATCA'}
                    />
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'نوع الوثيقة' : 'Document Type'}</label>
                    <select
                      required
                      value={addEmpForm.docType}
                      onChange={(e) => setAddEmpForm({ ...addEmpForm, docType: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-right"
                    >
                      <option value="">{isAr ? '-- حدد نوع الوثيقة --' : '-- Choose type --'}</option>
                      {EMPLOYEE_DOC_SUGGESTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {addEmpForm.docType === 'وثيقة أخرى' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'اكتب نوع الوثيقة يدوياً' : 'Write Document Type'}</label>
                      <input
                        type="text"
                        required
                        value={addEmpForm.customDocType}
                        onChange={(e) => setAddEmpForm({ ...addEmpForm, customDocType: e.target.value })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-right text-slate-700"
                        placeholder={isAr ? 'مثال: تفويض مروري' : 'e.g. custom paper'}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'رقم الوثيقة' : 'Document Number'}</label>
                    <input
                      type="text"
                      required
                      value={addEmpForm.docNumber}
                      onChange={(e) => setAddEmpForm({ ...addEmpForm, docNumber: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center"
                      placeholder="1234567890"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'تاريخ الإصدار (اختياري)' : 'Issue Date'}</label>
                    <input
                      type="date"
                      value={addEmpForm.issueDate}
                      onChange={(e) => setAddEmpForm({ ...addEmpForm, issueDate: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'تاريخ الانتهاء' : 'Expiry Date'}</label>
                    <input
                      type="date"
                      required
                      value={addEmpForm.expiryDate}
                      onChange={(e) => setAddEmpForm({ ...addEmpForm, expiryDate: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'أيام التنبيه المسبق' : 'Alert Advance Days'}</label>
                    <input
                      type="number"
                      value={addEmpForm.alertDays}
                      onChange={(e) => setAddEmpForm({ ...addEmpForm, alertDays: Number(e.target.value) })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'رابط ملف الوثيقة (المستند)' : 'Document Digital Link URL'}</label>
                  <input
                    type="url"
                    value={addEmpForm.docUrl}
                    onChange={(e) => setAddEmpForm({ ...addEmpForm, docUrl: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-left"
                    placeholder="https://example.com/document.pdf"
                  />
                </div>

                {/* File Upload Field */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2 text-right">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-700">{isAr ? 'إرفاق ملف/صورة الوثيقة الكترونياً' : 'Upload Digital Document File'}</span>
                    {addEmpForm.docFile && (
                      <button
                        type="button"
                        onClick={() => setAddEmpForm({ ...addEmpForm, docFile: '' })}
                        className="text-[10px] text-rose-500 font-bold hover:underline"
                      >
                        {isAr ? 'إزالة الملف ❌' : 'Remove File ❌'}
                      </button>
                    )}
                  </div>
                  
                  {addEmpForm.docFile ? (
                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-emerald-100">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 text-right" dir="rtl">
                        <p className="text-[11px] font-bold text-slate-800 truncate">{isAr ? 'تم إرفاق المستند بنجاح' : 'Document file attached successfully'}</p>
                        <p className="text-[9px] text-slate-400 font-mono">base64 encoded data</p>
                      </div>
                      <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden border">
                        {addEmpForm.docFile.startsWith('data:image/') ? (
                          <img src={addEmpForm.docFile} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-red-500">PDF</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center py-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                      <Upload className="w-6 h-6 text-[#0072BC] mb-1 animate-pulse" />
                      <span className="text-[10px] font-bold text-slate-600">{isAr ? 'اسحب الملف هنا أو انقر للتصفح' : 'Drag file here or click to browse'}</span>
                      <span className="text-[8px] text-slate-400 mt-0.5">{isAr ? 'يدعم الصور و ملفات PDF (بحد أقصى 1MB)' : 'Supports Images & PDF (Max 1MB)'}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 1.2 * 1024 * 1024) {
                              alert(isAr ? 'حجم الملف كبير جداً! الحد الأقصى هو 1MB لضمان الحفظ في قاعدة البيانات.' : 'File is too large! Max allowed is 1MB to preserve database space.');
                              return;
                            }
                            try {
                              const b64 = await handleFileToBase64(file);
                              setAddEmpForm({ ...addEmpForm, docFile: b64 });
                              showToastMsg(isAr ? 'تم تحميل الملف بنجاح!' : 'File loaded successfully!', 'success');
                            } catch (err) {
                              console.error(err);
                              alert(isAr ? 'فشل تحميل الملف' : 'Failed to load file');
                            }
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'ملاحظات وتفاصيل إضافية' : 'Notes'}</label>
                  <textarea
                    value={addEmpForm.notes}
                    onChange={(e) => setAddEmpForm({ ...addEmpForm, notes: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-right"
                    rows={2}
                    placeholder={isAr ? 'كتابة تفاصيل عن الحافظة أو مستند التجديد...' : 'Any compliance notes...'}
                  />
                </div>

                <div className="flex gap-2 justify-end pt-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-5 py-2 text-white font-black text-xs rounded-xl shadow transition-all flex items-center gap-2 ${
                      isSubmitting 
                        ? 'bg-slate-400 cursor-not-allowed opacity-80' 
                        : 'bg-[#0072BC] hover:bg-blue-800'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
                      </>
                    ) : (
                      <span>{isAr ? 'حفظ وإدراج الوثيقة' : 'Confirm & Save'}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsAddDocOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all disabled:opacity-50"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>
            ) : (
              // Add Vehicle Doc form
              <form onSubmit={handleAddVehicleDoc} className="space-y-4 text-right">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'اسم الشاحنة/السيارة' : 'Vehicle Brand'}</label>
                    <input
                      type="text"
                      required
                      value={addVehForm.vehicleName}
                      onChange={(e) => setAddVehForm({ ...addVehForm, vehicleName: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-right"
                      placeholder="e.g. Toyota Hilux"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'رقم اللوحة' : 'Plate Number'}</label>
                    <input
                      type="text"
                      required
                      value={addVehForm.plateNumber}
                      onChange={(e) => setAddVehForm({ ...addVehForm, plateNumber: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center"
                      placeholder="أ ب ج 1234"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'الموديل/السنة' : 'Model Year'}</label>
                    <input
                      type="text"
                      required
                      value={addVehForm.model}
                      onChange={(e) => setAddVehForm({ ...addVehForm, model: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center"
                      placeholder="2026"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'السائق المسؤول (اختياري)' : 'Responsible Driver'}</label>
                    <input
                      type="text"
                      value={addVehForm.driverName}
                      onChange={(e) => setAddVehForm({ ...addVehForm, driverName: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-right"
                      placeholder={isAr ? 'اسم السائق' : 'Driver name'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'نوع وثيقة السيارة' : 'Doc Type'}</label>
                    <select
                      required
                      value={addVehForm.docType}
                      onChange={(e) => setAddVehForm({ ...addVehForm, docType: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-right"
                    >
                      <option value="">{isAr ? '-- حدد نوع الوثيقة --' : '-- Choose type --'}</option>
                      {VEHICLE_DOC_SUGGESTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {addVehForm.docType === 'وثيقة أخرى' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'اكتب نوع الوثيقة يدوياً' : 'Write Document Type'}</label>
                      <input
                        type="text"
                        required
                        value={addVehForm.customDocType}
                        onChange={(e) => setAddVehForm({ ...addVehForm, customDocType: e.target.value })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-right text-slate-700"
                        placeholder={isAr ? 'مثال: فحص جمركي' : 'e.g. custom test'}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'رقم الوثيقة' : 'Document Number'}</label>
                    <input
                      type="text"
                      required
                      value={addVehForm.docNumber}
                      onChange={(e) => setAddVehForm({ ...addVehForm, docNumber: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center"
                      placeholder="6543219"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'تاريخ الإصدار (اختياري)' : 'Issue Date'}</label>
                    <input
                      type="date"
                      value={addVehForm.issueDate}
                      onChange={(e) => setAddVehForm({ ...addVehForm, issueDate: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'تاريخ الانتهاء' : 'Expiry Date'}</label>
                    <input
                      type="date"
                      required
                      value={addVehForm.expiryDate}
                      onChange={(e) => setAddVehForm({ ...addVehForm, expiryDate: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'أيام التنبيه المسبق' : 'Alert Advance Days'}</label>
                    <input
                      type="number"
                      value={addVehForm.alertDays}
                      onChange={(e) => setAddVehForm({ ...addVehForm, alertDays: Number(e.target.value) })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'رابط ملف الوثيقة (المستند)' : 'Document Digital Link URL'}</label>
                  <input
                    type="url"
                    value={addVehForm.docUrl}
                    onChange={(e) => setAddVehForm({ ...addVehForm, docUrl: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-left"
                    placeholder="https://example.com/vehicle-insurance.pdf"
                  />
                </div>

                {/* File Upload Field for Vehicle */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2 text-right">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-700">{isAr ? 'إرفاق ملف/صورة الوثيقة الكترونياً' : 'Upload Digital Document File'}</span>
                    {addVehForm.docFile && (
                      <button
                        type="button"
                        onClick={() => setAddVehForm({ ...addVehForm, docFile: '' })}
                        className="text-[10px] text-rose-500 font-bold hover:underline"
                      >
                        {isAr ? 'إزالة الملف ❌' : 'Remove File ❌'}
                      </button>
                    )}
                  </div>
                  
                  {addVehForm.docFile ? (
                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-emerald-100">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 text-right" dir="rtl">
                        <p className="text-[11px] font-bold text-slate-800 truncate">{isAr ? 'تم إرفاق المستند بنجاح' : 'Document file attached successfully'}</p>
                        <p className="text-[9px] text-slate-400 font-mono">base64 encoded data</p>
                      </div>
                      <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden border">
                        {addVehForm.docFile.startsWith('data:image/') ? (
                          <img src={addVehForm.docFile} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-red-500">PDF</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center py-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                      <Upload className="w-6 h-6 text-[#0072BC] mb-1 animate-pulse" />
                      <span className="text-[10px] font-bold text-slate-600">{isAr ? 'اسحب الملف هنا أو انقر للتصفح' : 'Drag file here or click to browse'}</span>
                      <span className="text-[8px] text-slate-400 mt-0.5">{isAr ? 'يدعم الصور و ملفات PDF (بحد أقصى 1MB)' : 'Supports Images & PDF (Max 1MB)'}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 1.2 * 1024 * 1024) {
                              alert(isAr ? 'حجم الملف كبير جداً! الحد الأقصى هو 1MB لضمان الحفظ في قاعدة البيانات.' : 'File is too large! Max allowed is 1MB to preserve database space.');
                              return;
                            }
                            try {
                              const b64 = await handleFileToBase64(file);
                              setAddVehForm({ ...addVehForm, docFile: b64 });
                              showToastMsg(isAr ? 'تم تحميل الملف بنجاح!' : 'File loaded successfully!', 'success');
                            } catch (err) {
                              console.error(err);
                              alert(isAr ? 'فشل تحميل الملف' : 'Failed to load file');
                            }
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'ملاحظات وتفاصيل إضافية' : 'Notes'}</label>
                  <textarea
                    value={addVehForm.notes}
                    onChange={(e) => setAddVehForm({ ...addVehForm, notes: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-right"
                    rows={2}
                    placeholder={isAr ? 'كتابة ملاحظات عن بوليصة التأمين أو شركة الفحص الدوري...' : 'Fleet notes...'}
                  />
                </div>

                <div className="flex gap-2 justify-end pt-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-5 py-2 text-white font-black text-xs rounded-xl shadow transition-all flex items-center gap-2 ${
                      isSubmitting 
                        ? 'bg-slate-400 cursor-not-allowed opacity-80' 
                        : 'bg-[#0072BC] hover:bg-blue-800'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
                      </>
                    ) : (
                      <span>{isAr ? 'حفظ وإدراج الوثيقة' : 'Confirm & Save'}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsAddDocOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all disabled:opacity-50"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* MODAL 2: QUICK RENEW EXPIRY DATE */}
      {isRenewOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <h3 className="text-base font-black text-amber-600 flex items-center gap-1">
                <RefreshCw className="w-5 h-5" />
                <span>{isAr ? 'تحديث وتمديد تاريخ صلاحية الوثيقة' : 'Renew Document Compliance'}</span>
              </h3>
              <button onClick={() => setIsRenewOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="text-right space-y-2 bg-slate-50 p-3 rounded-2xl border text-xs">
              <div>
                <strong>{isAr ? 'الوثيقة المراد تمديدها:' : 'Selected Doc:'}</strong>{' '}
                <span className="text-[#0072BC] font-bold">
                  {selectedEmpDoc ? `${selectedEmpDoc.docType} (${selectedEmpDoc.employeeName})` : `${selectedVehicleDoc?.docType} (${selectedVehicleDoc?.vehicleName})`}
                </span>
              </div>
              <div><strong>{isAr ? 'رقم الوثيقة الحالي:' : 'Doc Number:'}</strong> <span className="font-mono">{selectedEmpDoc ? selectedEmpDoc.docNumber : selectedVehicleDoc?.docNumber}</span></div>
              <div><strong>{isAr ? 'تاريخ الانتهاء الحالي:' : 'Current Expiry:'}</strong> <span className="font-mono text-rose-600 font-bold">{selectedEmpDoc ? selectedEmpDoc.expiryDate : selectedVehicleDoc?.expiryDate}</span></div>
            </div>

            {renewWarningUrl && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex gap-2 shadow-sm text-right">
                <AlertTriangle className="w-5 h-5 text-amber-600 animate-bounce flex-shrink-0" />
                <p className="text-xs text-amber-900 font-bold leading-normal">
                  {isAr 
                    ? 'تنبيه: عند تحديث تاريخ انتهاء الوثيقة، تأكد من تجديد ملف الوثيقة ورفع الرابط الجديد أو تحديث رابط الوثيقة الحالي. هل تؤكد تحديث التاريخ؟'
                    : 'Warning: When updating document expiration, ensure you replace or update the attached scan file link. Do you confirm updating?'
                  }
                </p>
              </div>
            )}

            <div className="space-y-3 text-right">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'تاريخ الانتهاء الجديد' : 'New Expiry Date'}</label>
                <input
                  type="date"
                  required
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'رابط ملف الوثيقة الجديد (مستحسن)' : 'New Scan Link (Recommended)'}</label>
                <input
                  type="url"
                  value={newDocUrl}
                  onChange={(e) => setNewDocUrl(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-left"
                  placeholder="https://example.com/new-scanned-doc.pdf"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'ملاحظات التحديث والامتداد' : 'Notes/Details'}</label>
                <textarea
                  value={renewNotes}
                  onChange={(e) => setRenewNotes(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-right"
                  rows={2}
                  placeholder={isAr ? 'تفاصيل تجديد المستند من المنصة الحكومية (أبشر، قوى، تم، بلدي)...' : 'Updates log details...'}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <button
                onClick={handleConfirmRenewal}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow transition-all flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{renewWarningUrl ? (isAr ? 'نعم، تأكيد التحديث النهائي' : 'Yes, Confirm Expiry') : (isAr ? 'تأكيد التحديث' : 'Confirm Renewal')}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsRenewOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT DOCUMENT */}
      {isEditDocOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <h3 className="text-base font-black text-slate-800">
                ✏️ {isAr ? 'تعديل بيانات وسجل الوثيقة' : 'Edit Compliance Metadata'}
              </h3>
              <button onClick={() => setIsEditDocOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-right">
              {activePortal === 'employee' ? (
                // Edit Employee fields
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'اسم المنشأة / الكيان' : 'Establishment / Entity Name'}</label>
                      <input
                        type="text"
                        required
                        value={editEmpForm.employeeName || ''}
                        onChange={(e) => setEditEmpForm({ ...editEmpForm, employeeName: e.target.value })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'الرقم الموحد / السجل' : 'Unified ID / CR Number'}</label>
                      <input
                        type="text"
                        required
                        value={editEmpForm.employeeId || ''}
                        onChange={(e) => setEditEmpForm({ ...editEmpForm, employeeId: e.target.value, employeeNum: e.target.value })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'الفرع / النشاط' : 'Branch / Active Sector'}</label>
                      <input
                        type="text"
                        required
                        value={editEmpForm.department || ''}
                        onChange={(e) => setEditEmpForm({ ...editEmpForm, department: e.target.value })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'الجهة المصدرة للوثيقة' : 'Issuing Gov Authority'}</label>
                      <input
                        type="text"
                        required
                        value={editEmpForm.jobTitle || ''}
                        onChange={(e) => setEditEmpForm({ ...editEmpForm, jobTitle: e.target.value })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-right"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'نوع الوثيقة' : 'Document Type'}</label>
                      <input
                        type="text"
                        required
                        value={editEmpForm.docType || ''}
                        onChange={(e) => setEditEmpForm({ ...editEmpForm, docType: e.target.value })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-right text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'رقم الوثيقة' : 'Document Number'}</label>
                      <input
                        type="text"
                        required
                        value={editEmpForm.docNumber || ''}
                        onChange={(e) => setEditEmpForm({ ...editEmpForm, docNumber: e.target.value })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'تاريخ الإصدار (اختياري)' : 'Issue Date'}</label>
                      <input
                        type="date"
                        value={editEmpForm.issueDate || ''}
                        onChange={(e) => setEditEmpForm({ ...editEmpForm, issueDate: e.target.value })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'تاريخ الانتهاء' : 'Expiry Date'}</label>
                      <input
                        type="date"
                        required
                        value={editEmpForm.expiryDate || ''}
                        onChange={(e) => setEditEmpForm({ ...editEmpForm, expiryDate: e.target.value })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'أيام التنبيه المسبق' : 'Alert Days'}</label>
                      <input
                        type="number"
                        value={editEmpForm.alertDays || 30}
                        onChange={(e) => setEditEmpForm({ ...editEmpForm, alertDays: Number(e.target.value) })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'رابط ملف الوثيقة (المستند)' : 'Document Digital Link URL'}</label>
                    <input
                      type="url"
                      value={editEmpForm.docUrl || ''}
                      onChange={(e) => setEditEmpForm({ ...editEmpForm, docUrl: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-left"
                    />
                  </div>

                  {/* File Upload Field for Edit Employee */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2 text-right">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-700">{isAr ? 'تحديث ملف/صورة الوثيقة الكترونياً' : 'Update Digital Document File'}</span>
                      {editEmpForm.docFile && (
                        <button
                          type="button"
                          onClick={() => setEditEmpForm({ ...editEmpForm, docFile: '' })}
                          className="text-[10px] text-rose-500 font-bold hover:underline"
                        >
                          {isAr ? 'إزالة الملف ❌' : 'Remove File ❌'}
                        </button>
                      )}
                    </div>
                    
                    {editEmpForm.docFile ? (
                      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-emerald-100">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                          <Paperclip className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0 text-right" dir="rtl">
                          <p className="text-[11px] font-bold text-slate-800 truncate">{isAr ? 'تم إرفاق المستند بنجاح' : 'Document file attached successfully'}</p>
                          <p className="text-[9px] text-slate-400 font-mono">base64 encoded data</p>
                        </div>
                        <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden border">
                          {editEmpForm.docFile.startsWith('data:image/') ? (
                            <img src={editEmpForm.docFile} alt="preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-red-500">PDF</div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center py-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                        <Upload className="w-6 h-6 text-[#0072BC] mb-1 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-600">{isAr ? 'اسحب الملف هنا أو انقر للتصفح' : 'Drag file here or click to browse'}</span>
                        <span className="text-[8px] text-slate-400 mt-0.5">{isAr ? 'يدعم الصور و ملفات PDF (بحد أقصى 1MB)' : 'Supports Images & PDF (Max 1MB)'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 1.2 * 1024 * 1024) {
                                alert(isAr ? 'حجم الملف كبير جداً! الحد الأقصى هو 1MB لضمان الحفظ في قاعدة البيانات.' : 'File is too large! Max allowed is 1MB to preserve database space.');
                                return;
                              }
                              try {
                                const b64 = await handleFileToBase64(file);
                                setEditEmpForm({ ...editEmpForm, docFile: b64 });
                                showToastMsg(isAr ? 'تم تحميل الملف بنجاح!' : 'File loaded successfully!', 'success');
                              } catch (err) {
                                console.error(err);
                                alert(isAr ? 'فشل تحميل الملف' : 'Failed to load file');
                              }
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'ملاحظات وتفاصيل إضافية' : 'Notes'}</label>
                    <textarea
                      value={editEmpForm.notes || ''}
                      onChange={(e) => setEditEmpForm({ ...editEmpForm, notes: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-right"
                      rows={2}
                    />
                  </div>
                </>
              ) : (
                // Edit Vehicle fields
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'اسم الشاحنة/السيارة' : 'Vehicle Name'}</label>
                      <input
                        type="text"
                        required
                        value={editVehForm.vehicleName || ''}
                        onChange={(e) => setEditVehForm({ ...editVehForm, vehicleName: e.target.value })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'رقم اللوحة' : 'Plate Number'}</label>
                      <input
                        type="text"
                        required
                        value={editVehForm.plateNumber || ''}
                        onChange={(e) => setEditVehForm({ ...editVehForm, plateNumber: e.target.value })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'الموديل' : 'Model'}</label>
                      <input
                        type="text"
                        required
                        value={editVehForm.model || ''}
                        onChange={(e) => setEditVehForm({ ...editVehForm, model: e.target.value })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'السائق المسؤول' : 'Driver'}</label>
                      <input
                        type="text"
                        value={editVehForm.driverName || ''}
                        onChange={(e) => setEditVehForm({ ...editVehForm, driverName: e.target.value })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'نوع الوثيقة' : 'Doc Type'}</label>
                      <input
                        type="text"
                        required
                        value={editVehForm.docType || ''}
                        onChange={(e) => setEditVehForm({ ...editVehForm, docType: e.target.value })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-right text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'رقم الوثيقة' : 'Doc Number'}</label>
                      <input
                        type="text"
                        required
                        value={editVehForm.docNumber || ''}
                        onChange={(e) => setEditVehForm({ ...editVehForm, docNumber: e.target.value })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'تاريخ الإصدار' : 'Issue Date'}</label>
                      <input
                        type="date"
                        value={editVehForm.issueDate || ''}
                        onChange={(e) => setEditVehForm({ ...editVehForm, issueDate: e.target.value })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'تاريخ الانتهاء' : 'Expiry Date'}</label>
                      <input
                        type="date"
                        required
                        value={editVehForm.expiryDate || ''}
                        onChange={(e) => setEditVehForm({ ...editVehForm, expiryDate: e.target.value })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'رابط ملف الوثيقة (المستند)' : 'Document Digital Link URL'}</label>
                    <input
                      type="url"
                      value={editVehForm.docUrl || ''}
                      onChange={(e) => setEditVehForm({ ...editVehForm, docUrl: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-left"
                    />
                  </div>

                  {/* File Upload Field for Edit Vehicle */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2 text-right">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-700">{isAr ? 'تحديث ملف/صورة الوثيقة الكترونياً' : 'Update Digital Document File'}</span>
                      {editVehForm.docFile && (
                        <button
                          type="button"
                          onClick={() => setEditVehForm({ ...editVehForm, docFile: '' })}
                          className="text-[10px] text-rose-500 font-bold hover:underline"
                        >
                          {isAr ? 'إزالة الملف ❌' : 'Remove File ❌'}
                        </button>
                      )}
                    </div>
                    
                    {editVehForm.docFile ? (
                      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-emerald-100">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                          <Paperclip className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0 text-right" dir="rtl">
                          <p className="text-[11px] font-bold text-slate-800 truncate">{isAr ? 'تم إرفاق المستند بنجاح' : 'Document file attached successfully'}</p>
                          <p className="text-[9px] text-slate-400 font-mono">base64 encoded data</p>
                        </div>
                        <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden border">
                          {editVehForm.docFile.startsWith('data:image/') ? (
                            <img src={editVehForm.docFile} alt="preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-red-500">PDF</div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center py-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                        <Upload className="w-6 h-6 text-[#0072BC] mb-1 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-600">{isAr ? 'اسحب الملف هنا أو انقر للتصفح' : 'Drag file here or click to browse'}</span>
                        <span className="text-[8px] text-slate-400 mt-0.5">{isAr ? 'يدعم الصور و ملفات PDF (بحد أقصى 1MB)' : 'Supports Images & PDF (Max 1MB)'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 1.2 * 1024 * 1024) {
                                alert(isAr ? 'حجم الملف كبير جداً! الحد الأقصى هو 1MB لضمان الحفظ في قاعدة البيانات.' : 'File is too large! Max allowed is 1MB to preserve database space.');
                                return;
                              }
                              try {
                                const b64 = await handleFileToBase64(file);
                                setEditVehForm({ ...editVehForm, docFile: b64 });
                                showToastMsg(isAr ? 'تم تحميل الملف بنجاح!' : 'File loaded successfully!', 'success');
                              } catch (err) {
                                console.error(err);
                                alert(isAr ? 'فشل تحميل الملف' : 'Failed to load file');
                              }
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{isAr ? 'ملاحظات وتفاصيل إضافية' : 'Notes'}</label>
                    <textarea
                      value={editVehForm.notes || ''}
                      onChange={(e) => setEditVehForm({ ...editVehForm, notes: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-right"
                      rows={2}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2 text-white font-black text-xs rounded-xl shadow transition-all flex items-center gap-2 ${
                    isSubmitting 
                      ? 'bg-slate-400 cursor-not-allowed opacity-80' 
                      : 'bg-[#0072BC] hover:bg-blue-800'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>{isAr ? 'جاري حفظ التعديلات...' : 'Saving changes...'}</span>
                    </>
                  ) : (
                    <span>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsEditDocOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all disabled:opacity-50"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CUSTOM DELETE CONFIRMATION */}
      {docToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4 text-right">
            <div className="flex items-center gap-2 justify-end text-rose-600 pb-2 border-b">
              <span className="text-base font-black">{isAr ? 'تأكيد حذف الوثيقة نهائياً' : 'Confirm Document Deletion'}</span>
              <AlertTriangle className="w-5 h-5" />
            </div>
            
            <p className="text-xs text-slate-600 font-bold leading-relaxed">
              {isAr 
                ? `هل أنت متأكد من رغبتك في حذف وثيقة "${docToDelete.docType}" الرقم (${docToDelete.docNumber || ''}) التابعة لـ "${activePortal === 'employee' ? docToDelete.employeeName : docToDelete.vehicleName}"؟` 
                : `Are you sure you want to permanently delete "${docToDelete.docType}" (No. ${docToDelete.docNumber || ''}) for "${activePortal === 'employee' ? docToDelete.employeeName : docToDelete.vehicleName}"?`}
            </p>

            <p className="text-[11px] text-slate-400">
              {isAr 
                ? '⚠️ هذا الإجراء لا يمكن التراجع عنه وسيتم حذفه بالكامل من قاعدة البيانات.' 
                : '⚠️ This action is irreversible and the document will be permanently removed from the database.'}
            </p>

            <div className="flex gap-2 justify-end pt-3">
              <button
                type="button"
                onClick={confirmDeleteDoc}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'تأكيد الحذف نهائياً' : 'Confirm Permanent Delete'}</span>
              </button>
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: DETAILED DOCUMENT VIEW & LIVE PREVIEW */}
      {isViewDocOpen && selectedViewDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6 text-right">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b">
              <h3 className="text-base font-black text-[#0072BC] flex items-center gap-1.5">
                <FileText className="w-5 h-5 text-[#00AEEF]" />
                <span>{isAr ? 'عرض ومعاينة المستند والامتثال' : 'View Document Compliance & Live Preview'}</span>
              </h3>
              <button onClick={() => { setIsViewDocOpen(false); setSelectedViewDoc(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bento-style Grid Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold">{isAr ? 'نوع الوثيقة' : 'Document Type'}</span>
                <span className="text-xs font-black text-slate-800">{selectedViewDoc.docType}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold">{isAr ? 'رقم الوثيقة' : 'Document Number'}</span>
                <span className="text-xs font-mono font-bold text-slate-800">{selectedViewDoc.docNumber || '—'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold">{isAr ? 'تاريخ الانتهاء' : 'Expiry Date'}</span>
                <span className="text-xs font-mono font-black text-rose-600">{selectedViewDoc.expiryDate}</span>
              </div>
              
              {activePortal === 'employee' ? (
                <>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">{isAr ? 'اسم المنشأة / الكيان' : 'Establishment Name'}</span>
                    <span className="text-xs font-black text-[#0072BC]">{selectedViewDoc.employeeName}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">{isAr ? 'الرقم الموحد / رقم السجل' : 'Unified ID / CR Number'}</span>
                    <span className="text-xs font-mono font-bold text-slate-800">{selectedViewDoc.employeeId}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">{isAr ? 'الفرع / النشاط' : 'Branch / Active Sector'}</span>
                    <span className="text-xs font-bold text-slate-600">{selectedViewDoc.department}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">{isAr ? 'رقم لوحة المركبة' : 'Plate Number'}</span>
                    <span className="text-xs font-mono font-black text-slate-800">{selectedViewDoc.plateNumber}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">{isAr ? 'المركبة' : 'Vehicle'}</span>
                    <span className="text-xs font-bold text-slate-800">{selectedViewDoc.vehicleName}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">{isAr ? 'الموديل والسائق' : 'Model & Driver'}</span>
                    <span className="text-xs font-bold text-slate-600">{selectedViewDoc.model} - {selectedViewDoc.driverName || '—'}</span>
                  </div>
                </>
              )}
            </div>

            {/* Document Image & PDF Visualizer Card */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-700 flex items-center justify-between">
                <span>{isAr ? '🖼️ الصورة أو الملف الرقمي للوثيقة' : '🖼️ Digital Scan & Document Card'}</span>
                
                {selectedViewDoc.docFile && (
                  <button
                    type="button"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedViewDoc.docFile;
                      link.download = `document_${selectedViewDoc.docType}_${selectedViewDoc.docNumber || 'scan'}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      showToastMsg(isAr ? 'جاري تنزيل المستند المرفق...' : 'Downloading attached scan file...', 'success');
                    }}
                    className="text-[10px] bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white px-2.5 py-1 rounded-lg border border-emerald-200 transition-all flex items-center gap-1 font-bold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تحميل وحفظ على جهازي' : 'Download file'}</span>
                  </button>
                )}
              </h4>

              {selectedViewDoc.docFile ? (
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-100 flex flex-col items-center justify-center p-4 min-h-[300px] shadow-inner relative group">
                  {selectedViewDoc.docFile.startsWith('data:image/') ? (
                    <img 
                      src={selectedViewDoc.docFile} 
                      alt="Compliance Doc Scan" 
                      className="max-h-[500px] max-w-full rounded-lg shadow border object-contain bg-white animate-fade-in"
                    />
                  ) : selectedViewDoc.docFile.startsWith('data:application/pdf') ? (
                    <div className="w-full h-[600px] bg-white rounded-xl border p-1 shadow-lg flex flex-col">
                      <div className="flex justify-between items-center bg-slate-100 p-2 rounded-t-lg border-b text-xs font-bold text-slate-700">
                        {pdfBlobUrl && (
                          <a 
                            href={pdfBlobUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-black text-[10px]"
                          >
                            {isAr ? 'فتح في علامة تبويب جديدة ↗' : 'Open in New Tab ↗'}
                          </a>
                        )}
                        <span>{isAr ? '📄 معاين ملف PDF المباشر' : '📄 Live PDF Viewer'}</span>
                      </div>
                      {pdfBlobUrl ? (
                        <iframe 
                          src={pdfBlobUrl} 
                          title="PDF Preview"
                          className="w-full flex-1 rounded-b-lg border-0" 
                        />
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                          {isAr ? 'جاري تهيئة الملف...' : 'Initializing preview...'}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-white rounded-2xl border max-w-sm">
                      <Paperclip className="w-12 h-12 text-[#0072BC] mx-auto mb-2 animate-bounce" />
                      <p className="text-xs font-bold text-slate-800">{isAr ? 'تم تحميل مستند PDF بنجاح' : 'PDF Document Loaded successfully'}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{isAr ? 'يمكنك تنزيله على جهازك لمشاهدته بشكل كامل.' : 'You can download it to view it fully.'}</p>
                    </div>
                  )}

                  {/* Actions overlay for changing / removing the file */}
                  <div className="mt-4 flex gap-2 justify-center w-full">
                    <label className="text-[11px] bg-blue-50 text-blue-700 hover:bg-[#0072BC] hover:text-white px-3 py-1.5 rounded-xl border border-blue-200 cursor-pointer transition-all font-bold flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تغيير أو تحديث الملف المرفق' : 'Change attached file'}</span>
                      <input 
                        type="file" 
                        accept="image/*,application/pdf" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 1.2 * 1024 * 1024) {
                              alert(isAr ? 'حجم الملف كبير جداً! الأقصى 1MB' : 'File is too large! Max 1MB');
                              return;
                            }
                            try {
                              const b64 = await handleFileToBase64(file);
                              await handleUpdateFileFromView(b64);
                            } catch (err) {
                              console.error(err);
                            }
                          }
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleRemoveFileFromView}
                      className="text-[11px] bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white px-3 py-1.5 rounded-xl border border-rose-200 transition-all font-bold flex items-center gap-1"
                    >
                      <span>❌ {isAr ? 'إزالة الملف المرفق' : 'Remove file'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center bg-slate-50 flex flex-col items-center justify-center gap-2">
                  <Upload className="w-10 h-10 text-slate-300 animate-pulse" />
                  <p className="text-xs font-bold text-slate-700">{isAr ? 'لا يوجد ملف مرفق الكترونياً لهذه الوثيقة حالياً!' : 'No attached scan file found!'}</p>
                  <p className="text-[10px] text-slate-400 max-w-md">{isAr ? 'يمكنك رفع صورة للوثيقة أو ملف PDF هنا لحفظه مباشرة في السجل وعرضه وتنزيله في أي وقت.' : 'Upload a scan/photo of the document or PDF here to save directly.'}</p>
                  
                  <label className="mt-2 text-xs bg-[#0072BC] hover:bg-blue-800 text-white font-black px-4 py-2 rounded-xl shadow cursor-pointer transition-all flex items-center gap-1.5">
                    <Upload className="w-4 h-4" />
                    <span>{isAr ? 'اختر ملف الوثيقة لرفعه الآن' : 'Upload file now'}</span>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf" 
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 1.2 * 1024 * 1024) {
                            alert(isAr ? 'حجم الملف كبير جداً! الأقصى 1MB' : 'File too large! Max 1MB');
                            return;
                          }
                          try {
                            const b64 = await handleFileToBase64(file);
                            await handleUpdateFileFromView(b64);
                          } catch (err) {
                            console.error(err);
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              )}

              {/* Document external link url preview */}
              {selectedViewDoc.docUrl && (
                <div className="bg-slate-50 p-3 rounded-2xl border flex items-center justify-between text-xs">
                  <div className="text-right">
                    <span className="font-bold text-slate-500 block text-[10px]">{isAr ? 'الرابط الرقمي الخارجي المربوط:' : 'Linked External URL:'}</span>
                    <a href={selectedViewDoc.docUrl} target="_blank" rel="noreferrer" className="text-[#0072BC] underline font-mono break-all">{selectedViewDoc.docUrl}</a>
                  </div>
                  <a 
                    href={selectedViewDoc.docUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 bg-[#0072BC]/10 text-[#0072BC] hover:bg-[#0072BC] hover:text-white rounded-xl transition-all font-bold text-[10px]"
                  >
                    {isAr ? 'فتح في علامة تبويب جديدة 🌐' : 'Open Link 🌐'}
                  </a>
                </div>
              )}

              {selectedViewDoc.notes && (
                <div className="bg-slate-50 p-3 rounded-2xl border text-xs text-right">
                  <span className="font-bold text-slate-500 block text-[10px]">{isAr ? 'تفاصيل وملاحظات إضافية:' : 'Notes / Additional Details:'}</span>
                  <p className="text-slate-700 font-bold mt-1 leading-relaxed">{selectedViewDoc.notes}</p>
                </div>
              )}

            </div>

            {/* Footer buttons */}
            <div className="flex gap-2 justify-end border-t pt-4">
              <button
                type="button"
                onClick={() => { setIsViewDocOpen(false); setSelectedViewDoc(null); }}
                className="px-5 py-2.5 bg-slate-900 text-white font-black text-xs rounded-xl shadow-md hover:bg-slate-800 transition-all"
              >
                {isAr ? 'إغلاق المعاينة' : 'Close Preview'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
