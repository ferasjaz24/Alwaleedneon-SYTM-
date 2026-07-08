import React, { useState, useRef, useEffect } from "react";
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  FileText,
  Gift,
  Calendar,
  MapPin,
  Shield,
  Tag,
  HelpCircle,
  Briefcase,
  Info,
  RefreshCw,
  Eye,
  Download,
  Upload,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Employee, CustodyAsset, User } from "../../types";
import { countries, getNationalityCode } from "../../utils/countries";
import { searchEmployeesIndexed } from "../../lib/searchIndex";
import { detectBankFromIban } from "../../utils/ibanHelper";
import { TranslatedText } from "../../utils/translator";
// Custom Country Select Component
function CountrySelect({
  value,
  onChange,
  lang,
}: {
  value: string;
  onChange: (val: string) => void;
  lang: "ar" | "en";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const filteredCountries = countries.filter(
    (c) =>
      c.ar.toLowerCase().includes(search.toLowerCase()) ||
      c.en.toLowerCase().includes(search.toLowerCase()),
  );
  const displayCode =
    getNationalityCode(value) !== "un" ? getNationalityCode(value) : "sa";
  const displayVal = value || (lang === "ar" ? "سعودي" : "Saudi Arabia");
  return (
    <div
      ref={wrapperRef}
      className="relative w-full text-right"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <div
        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-2">
          <img
            src={`https://flagcdn.com/w20/${displayCode}.png`}
            alt=""
            width="20"
            className="rounded-sm"
          />
          {displayVal}
        </span>
        <span className="text-slate-400 text-xs">▼</span>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-right"
              placeholder={
                lang === "ar" ? "ابحث عن دولة..." : "Search country..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto bg-white">
            {filteredCountries.map((c) => (
              <div
                key={c.code}
                className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center gap-2 text-sm border-b border-slate-50 last:border-0"
                onClick={() => {
                  onChange(lang === "ar" ? c.ar : c.en);
                  setIsOpen(false);
                  setSearch("");
                }}
              >
                <img
                  src={`https://flagcdn.com/w20/${c.code}.png`}
                  alt=""
                  width="20"
                  className="rounded-sm"
                />
                <span>{lang === "ar" ? c.ar : c.en}</span>
              </div>
            ))}
            {filteredCountries.length === 0 && (
              <div className="p-4 text-center text-slate-500 text-sm">
                {lang === "ar" ? "لا توجد نتائج" : "No results found"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
// Helper to convert base64 PDF to a local Blob URL for reliable iframe preview
function base64ToBlobUrl(
  base64Data: string,
  contentType: string = "application/pdf",
): string {
  try {
    const sliceSize = 512;
    let b64Data = base64Data;
    const commaIndex = base64Data.indexOf(",");
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
interface HrEmployeeDirectoryTabProps {
  lang: "ar" | "en";
  employees: Employee[];
  onUpdateEmployeeFields: (
    empId: string,
    updatedFields: Partial<Employee>,
  ) => void;
  onInitializeClearance?: (emp: Employee) => void;
  onReloadEmployees?: () => Promise<void> | void;
  onAddEmployee?: (newEmp: Partial<Employee>) => void;
  onDeleteEmployee?: (empId: string) => void;
  user?: User | null;
}
export function getInsuranceStatus(
  expiryDateStr?: string,
  lang: "ar" | "en" = "ar",
) {
  return getIqamaStatus(expiryDateStr, lang, "insurance");
}
export function getIqamaStatus(
  expiryDateStr?: string,
  lang: "ar" | "en" = "ar",
  docType: "iqama" | "passport" | "insurance" | "contract" = "iqama",
) {
  if (!expiryDateStr) {
    return {
      status: lang === "ar" ? "غير محدد" : "Not Set",
      daysLeft: 0,
      badgeClass: "bg-slate-50 text-slate-500 border border-slate-200",
    };
  }
  const expiry = new Date(expiryDateStr);
  const today = new Date();
  expiry.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const names = {
    iqama: {
      expired: { ar: "انتهت صلاحية الإقامة", en: "Iqama Expired" },
      soon: { ar: "أوشكت الإقامة على الانتهاء", en: "Iqama Expiring Soon" },
      valid: { ar: "إقامة صالحة", en: "Valid Iqama" },
      active: { ar: "إقامة سارية", en: "Active Iqama" },
    },
    passport: {
      expired: { ar: "انتهت صلاحية الجواز", en: "Passport Expired" },
      soon: { ar: "أوشك الجواز على الانتهاء", en: "Passport Expiring Soon" },
      valid: { ar: "جواز سفر صالح", en: "Valid Passport" },
      active: { ar: "جواز سفر ساري", en: "Active Passport" },
    },
    insurance: {
      expired: { ar: "انتهى التأمين الطبي", en: "Insurance Expired" },
      soon: { ar: "أوشك التأمين على الانتهاء", en: "Insurance Expiring Soon" },
      valid: { ar: "تأمين صالح", en: "Valid Insurance" },
      active: { ar: "تأمين ساري", en: "Active Insurance" },
    },
    contract: {
      expired: { ar: "انتهى عقد العمل", en: "Contract Expired" },
      soon: { ar: "أوشك العقد على الانتهاء", en: "Contract Expiring Soon" },
      valid: { ar: "عقد عمل صالح", en: "Valid Contract" },
      active: { ar: "عقد عمل ساري", en: "Active Contract" },
    },
  };
  const docNames = names[docType] || names.iqama;
  if (diffDays < 0) {
    return {
      status: lang === "ar" ? docNames.expired.ar : docNames.expired.en,
      daysLeft: diffDays,
      badgeClass:
        "bg-rose-50 text-rose-600 border border-rose-200 font-extrabold",
    };
  } else if (diffDays <= 30) {
    return {
      status: lang === "ar" ? docNames.soon.ar : docNames.soon.en,
      daysLeft: diffDays,
      badgeClass:
        "bg-amber-50 text-amber-600 border border-amber-300 font-extrabold animate-pulse",
    };
  } else if (diffDays > 330) {
    return {
      status: lang === "ar" ? docNames.valid.ar : docNames.valid.en,
      daysLeft: diffDays,
      badgeClass: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    };
  } else {
    return {
      status: lang === "ar" ? docNames.active.ar : docNames.active.en,
      daysLeft: diffDays,
      badgeClass: "bg-blue-50/50 text-[#0072BC] border border-blue-100",
    };
  }
}
function EmployeeAttachmentsPanel({
  lang,
  emp,
  onUpdate,
  showToast,
}: {
  lang: "ar" | "en";
  emp: any;
  onUpdate: (f: any) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
}) {
  const handleFileUpload =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.type.startsWith("image/")) {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = (ev) => {
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            // Max dimension 800px to ensure it safely fits in Firestore 1MB limit
            const MAX_DIM = 800;
            if (width > height && width > MAX_DIM) {
              height *= MAX_DIM / width;
              width = MAX_DIM;
            } else if (height > MAX_DIM) {
              width *= MAX_DIM / height;
              height = MAX_DIM;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
            try {
              onUpdate({ [field]: compressedDataUrl });
            } catch (err) {
              showToast(
                lang === "ar"
                  ? "الصورة كبيرة جداً، يرجى اختيار صورة أصغر."
                  : "Image is too large, please select a smaller one.",
                "error",
              );
            }
          };
          img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        // For PDFs or other non-images
        if (file.size > 800 * 1024) {
          // 800KB limit
          showToast(
            lang === "ar"
              ? "حجم الملف يجب أن يكون أقل من 800 كيلوبايت"
              : "File size must be less than 800KB",
            "error",
          );
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            onUpdate({ [field]: ev.target?.result });
          } catch (err) {
            showToast(
              lang === "ar" ? "الملف كبير جداً." : "File is too large.",
              "error",
            );
          }
        };
        reader.readAsDataURL(file);
      }
    };
  const AttachmentCard = ({
    title,
    field,
  }: {
    title: string;
    field: string;
  }) => {
    const fileData = emp[field];
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <span className="font-extrabold text-slate-800 text-sm">{title}</span>
          {fileData && (
            <a
              href={fileData}
              download={`${emp.englishName || emp.arabicName || "Employee"}_${field}`}
              className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
              title={lang === "ar" ? "تنزيل" : "Download"}
            >
              <Download className="w-4 h-4" />
            </a>
          )}
        </div>
        {fileData ? (
          <div className="relative w-full bg-slate-100 flex items-center justify-center p-6 min-h-[16rem]">
            {fileData.startsWith("data:image/") ? (
              <img
                src={fileData}
                alt={title}
                className="max-w-full max-h-[350px] object-contain rounded-xl shadow-sm border border-slate-200 bg-white"
              />
            ) : (
              <div className="text-slate-400 text-xs flex flex-col items-center py-20">
                <FileText className="w-10 h-10 mb-2 opacity-50" />
                <span>
                  {lang === "ar" ? "مستند مرفق" : "Document Attached"}
                </span>
              </div>
            )}
            <label className="absolute bottom-4 left-4 p-2.5 bg-white/90 backdrop-blur shadow-lg rounded-xl cursor-pointer hover:bg-white text-slate-800 transition-all border border-slate-200">
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload(field)}
                accept="image/*,.pdf"
              />
              <Upload className="w-4 h-4" />
            </label>
          </div>
        ) : (
          <label className="w-full min-h-[16rem] bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:bg-[#0072BC]/5 hover:text-[#0072BC] transition-colors cursor-pointer p-8">
            <Upload className="w-8 h-8 mb-3" />
            <span className="text-sm font-bold">
              {lang === "ar"
                ? "انقر لرفع ملف (صورة أو PDF)"
                : "Click to upload (Image or PDF)"}
            </span>
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload(field)}
              accept="image/*,.pdf"
            />
          </label>
        )}
      </div>
    );
  };
  return (
    <div className="space-y-4">
      <AttachmentCard
        title={lang === "ar" ? "الصورة الشخصية" : "Personal Photo"}
        field="personalPhoto"
      />
      <AttachmentCard
        title={lang === "ar" ? "صورة الإقامة" : "Iqama Photo"}
        field="iqamaPhoto"
      />
      <AttachmentCard
        title={lang === "ar" ? "صورة الجواز" : "Passport Photo"}
        field="passportPhoto"
      />
    </div>
  );
}
export default function HrEmployeeDirectoryTab({
  lang,
  employees,
  onUpdateEmployeeFields,
  onInitializeClearance,
  onReloadEmployees,
  onAddEmployee,
  onDeleteEmployee,
  user,
}: HrEmployeeDirectoryTabProps) {
  // Search query state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterNationality, setFilterNationality] = useState("all");
  const [filterExpiredDocs, setFilterExpiredDocs] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };
  // Selected employee for "View More" (عرض المزيد) modal
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  // Form states for creating a new employee
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAiImportOpen, setIsAiImportOpen] = useState(false);
  const [aiImportLoading, setAiImportLoading] = useState(false);
  const [aiImportText, setAiImportText] = useState("");
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
    arabicName: "",
    englishName: "",
    mobile: "",
    birthDate: "",
    dateOfJoining: "",
    nationality: "سعودي",
    passportDetails: "",
    iqamaId: "",
    iqamaExpiryDate: "",
    insurancePolicyNumber: "",
    insuranceCompany: "",
    insuranceClass: "C",
    insuranceExpiryDate: "",
    passportExpiryDate: "",
    jobTitle: "",
    classification: "موظف",
    grade: "Grade 1",
    allowances: { housing: 0, transport: 0,   },
    basicSalary: 6000,
    homeAddress: "الرياض، المملكة العربية السعودية",
    department: "Neon Fabrication",
    contractExpiry: "",
    bankName: "",
    accountHolderName: "",
    iban: "",
    accountNumber: "",
    swiftCode: "",
    transferMethod: "SARIE",
    bankNotes: "",
    company: "شركة فنون الوليد",
  });
  // Edit states for biography
  const [editForm, setEditForm] = useState<Partial<Employee>>({});
  // Salary & contract state variables
  const [isEditingSalaryContract, setIsEditingSalaryContract] = useState(false);
  const [salaryContractForm, setSalaryContractForm] = useState({
    basicSalary: 0,
    housing: 0,
    transport: 0,
    loans: 0,
    deductions: 0,
    status: "Active",
    contractQiwaNumber: "",
    contractUrl: "",
    contractExpiry: "",
  });
  // Bank & Transfer Info state variables
  const isStandardBank = (name: string) => {
    if (!name) return true;
    const standardBanks = [
      "مصرف الراجحي", "Al Rajhi Bank",
      "البنك الأهلي السعودي (SNB)", "Saudi National Bank (SNB)",
      "بنك الرياض", "Riyadh Bank",
      "مصرف الإنماء", "Alinma Bank",
      "البنك العربي الوطني", "Arab National Bank",
      "البنك السعودي الأول (SAB)", "Saudi First Bank (SAB)",
      "بنك البلاد", "Bank Albilad",
      "بنك الجزيرة", "Bank AlJazira",
      "البنك السعودي للاستثمار", "Saudi Investment Bank",
      "بنك الخليج الدولي", "Gulf International Bank"
    ];
    return standardBanks.includes(name);
  };
  const [showCustomBankInput, setShowCustomBankInput] = useState(false);
  const [showNewEmpCustomBankInput, setShowNewEmpCustomBankInput] = useState(false);
  const [isEditingBankInfo, setIsEditingBankInfo] = useState(false);
  const [bankInfoForm, setBankInfoForm] = useState({
    bankName: "",
    iban: "",
    accountNumber: "",
    swiftCode: "",
    transferMethod: "SARIE",
    accountHolderName: "",
    bankNotes: "",
  });
  const [isPreviewingContract, setIsPreviewingContract] = useState(false);
  const [contractPdfBlobUrl, setContractPdfBlobUrl] = useState<string | null>(
    null,
  );
  // Helper to convert uploaded files to compressed base64
  const handleFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };
  useEffect(() => {
    if (
      selectedEmp &&
      selectedEmp.contractUrl &&
      selectedEmp.contractUrl.startsWith("data:application/pdf")
    ) {
      const url = base64ToBlobUrl(selectedEmp.contractUrl, "application/pdf");
      setContractPdfBlobUrl(url);
    } else {
      if (contractPdfBlobUrl) {
        URL.revokeObjectURL(contractPdfBlobUrl);
        setContractPdfBlobUrl(null);
      }
    }
    return () => {
      if (contractPdfBlobUrl) {
        URL.revokeObjectURL(contractPdfBlobUrl);
      }
    };
  }, [selectedEmp, selectedEmp?.contractUrl]);
  // New manual custody asset state (for "العهد المسجلة لدى الموظف" تكتب يدوياً)
  const [newAsset, setNewAsset] = useState({
    name: "",
    receivedDate: "",
    category: "أجهزة ومعدات",
    additionalInfo: "",
  });
  // Dynamic calculation of experience based on joining date to today
  const calculateExperience = (joiningDateStr?: string) => {
    if (!joiningDateStr) return 0;
    const joinDate = new Date(joiningDateStr);
    const today = new Date();
    let years = today.getFullYear() - joinDate.getFullYear();
    const monthDiff = today.getMonth() - joinDate.getMonth();
    // Adjust year if today is before the joining anniversary month/day
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < joinDate.getDate())
    ) {
      years--;
    }
    return years < 0 ? 0 : years;
  };
  // Handle Search and Filter with high-performance indexes

  const isDocumentExpired = (emp: Employee) => {
    const isExpired = (dateString?: string) => {
      if (!dateString) return false;
      const d = new Date(dateString);
      return !isNaN(d.getTime()) && d < new Date();
    };
    return isExpired(emp.iqamaExpiryDate) || isExpired(emp.passportExpiryDate) || isExpired(emp.insuranceExpiryDate) || isExpired(emp.contractExpiry);
  };

  const filteredEmployees = React.useMemo(() => {
    let result = employees;

    if (searchQuery.trim()) {
      const searchRes = searchEmployeesIndexed(searchQuery, result);
      result = searchRes.results;
    }

    if (filterNationality !== "all") {
      result = result.filter(emp => emp.nationality === filterNationality);
    }

    if (filterExpiredDocs === "expired") {
      result = result.filter(emp => isDocumentExpired(emp));
    } else if (filterExpiredDocs === "valid") {
      result = result.filter(emp => !isDocumentExpired(emp));
    }

    result = [...result].sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.dateOfJoining || 0).getTime() - new Date(b.dateOfJoining || 0).getTime();
      } else if (sortBy === "newest") {
        return new Date(b.dateOfJoining || 0).getTime() - new Date(a.dateOfJoining || 0).getTime();
      } else if (sortBy === "age_oldest") {
        return new Date(a.birthDate || 0).getTime() - new Date(b.birthDate || 0).getTime();
      } else if (sortBy === "nationality") {
        return (a.nationality || "").localeCompare(b.nationality || "");
      }
      return 0;
    });

    return result;
  }, [searchQuery, employees, filterNationality, filterExpiredDocs, sortBy]);

  // Open "View More" modal
  const [isContractEditingUrl, setIsContractEditingUrl] = useState(false);
  const [modalTab, setModalTab] = useState<"info" | "attachments">("info");
  const handleOpenViewMore = (emp: Employee) => {
    setSelectedEmp(emp);
    setEditForm({ ...emp });
    setIsEditing(false);
    setModalTab("info");
    setIsEditingSalaryContract(false);
    setIsEditingBankInfo(false);
    setIsContractEditingUrl(!emp.contractUrl);
    setSalaryContractForm({
                                      basicSalary: selectedEmp.basicSalary || 0,
                                      housing: selectedEmp.allowances?.housing || 0,
                                      transport: selectedEmp.allowances?.transport || 0,
                                      loans: selectedEmp.allowances?.loans || 0,
                                      deductions: selectedEmp.allowances?.deductions || 0,
                                      status: selectedEmp.allowances?.status || "Active",
                                      contractQiwaNumber: selectedEmp.contractQiwaNumber || "",
                                      contractUrl: selectedEmp.contractUrl || "",
                                      contractExpiry: selectedEmp.contractExpiry || "",
                                    });
    setBankInfoForm({
      bankName: emp.bankName || "",
      iban: emp.iban || "",
      accountNumber: emp.accountNumber || "",
      swiftCode: emp.swiftCode || "",
      transferMethod: emp.transferMethod || "SARIE",
      accountHolderName: emp.accountHolderName || "",
      bankNotes: emp.bankNotes || "",
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
    setSelectedEmp((prev) => (prev ? { ...prev, ...editForm } : null));
    setIsEditing(false);
    showToast(
      lang === "ar"
        ? "✓ تم حفظ تعديل البيانات بنجاح!"
        : "✓ Employee files updated successfully!",
      "success",
    );
  };
  // Handle deleting employee (إزالة الموظف من الجدول)
  const handleDeleteEmployee = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
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
      showToast(
        lang === "ar"
          ? "يرجى إدخال اسم العهدة أولاً!"
          : "Please enter asset name!",
        "error",
      );
      return;
    }
    const recDate =
      newAsset.receivedDate || new Date().toISOString().split("T")[0];
    const assetRecord: CustodyAsset = {
      name: newAsset.name,
      receivedDate: recDate,
      category: newAsset.category,
      additionalInfo: newAsset.additionalInfo,
    };
    const currentAssets = selectedEmp.custodyAssets || [];
    const updatedAssets = [...currentAssets, assetRecord];
    // Trigger update on backend
    onUpdateEmployeeFields(selectedEmp.id, {
      custodyAssets: updatedAssets,
    });
    // Sync state visual
    setSelectedEmp((prev) =>
      prev ? { ...prev, custodyAssets: updatedAssets } : null,
    );
    // Reset inputs
    setNewAsset({
      name: "",
      receivedDate: "",
      category: "أجهزة ومعدات",
      additionalInfo: "",
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
    setSelectedEmp((prev) =>
      prev ? { ...prev, custodyAssets: updatedAssets } : null,
    );
    if (onReloadEmployees) {
      onReloadEmployees();
    }
  };
  // Handle AI Import Submission
  const handleAiImportSubmit = async () => {
    if (!aiImportText.trim() && !aiImportFile) {
      showToast(
        lang === "ar"
          ? "يرجى إدخال النص أو رفع ملف"
          : "Please provide text or a file",
        "error",
      );
      return;
    }
    setAiImportLoading(true);
    try {
      let importedEmployees: any[] = [];
      // Check if it's an Excel file
      if (
        aiImportFile &&
        (aiImportFile.name.endsWith(".xlsx") ||
          aiImportFile.name.endsWith(".xls") ||
          aiImportFile.name.endsWith(".csv"))
      ) {
        const data = await aiImportFile.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        // Transform JSON if needed or send to AI to transform
        // For robustness, let's ask Gemini to transform the raw JSON into proper Employee array format
        const res = await fetch("/api/gemini/parse-employee", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `Please convert this Excel JSON data into the requested employees array format: ${JSON.stringify(json)}`,
          }),
        });
        const resData = await res.json();
        if (!res.ok)
          throw new Error(resData.error || "Failed to parse Excel data via AI");
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
            reader.onload = () => resolve(reader.result?.toString() || "");
            reader.onerror = reject;
            reader.readAsDataURL(aiImportFile);
          });
        }
        const res = await fetch("/api/gemini/parse-employee", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: aiImportText,
            fileBase64: fileBase64,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to parse AI data");
        if (data.employees && Array.isArray(data.employees)) {
          importedEmployees = data.employees;
        } else if (Array.isArray(data)) {
          importedEmployees = data;
        } else {
          importedEmployees = [data]; // Graceful fallback
        }
      }
      if (importedEmployees.length === 0) {
        throw new Error(
          lang === "ar"
            ? "لم يتم العثور على بيانات موظفين صالحة."
            : "No valid employee data found.",
        );
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
            arabicName: empData.arabicName || "",
            englishName: empData.englishName || empData.arabicName || "",
            iqamaId: empData.iqamaId || "",
            iqamaExpiryDate: empData.iqamaExpiryDate || "",
            passportDetails: empData.passportDetails || "",
            passportExpiryDate: empData.passportExpiryDate || "",
            jobTitle: empData.jobTitle || "موظف",
            department: empData.department || "عام",
            basicSalary: Number(empData.basicSalary) || 0,
            allowances: {
              housing: Number(empData.housing) || 0,
              transport: Number(empData.transport) || 0,
              status: "Active",
            },
            birthDate: empData.birthDate || "",
            dateOfJoining: new Date().toISOString().split("T")[0],
            contractExpiry: empData.iqamaExpiryDate || "",
            nationality: empData.nationality || "",
            custody: { items: [], lastUpdated: new Date().toISOString() },
            grade: "Staff",
            homeAddress: "",
            mobile: "",
          });
          // If onAddEmployee returns a promise, await it sequentially to prevent state/API race conditions
          if (promise && typeof promise.then === "function") {
            await promise;
          }
          addedCount++;
        }
      }
      // reset and close modal
      setIsAiImportOpen(false);
      setAiImportText("");
      setAiImportFile(null);
      showToast(
        lang === "ar"
          ? `تم الاستيراد بنجاح! تمت إضافة ${addedCount} موظف بنجاح.`
          : `Import successful! Added ${addedCount} employees successfully.`,
        "success",
      );
    } catch (err: any) {
      console.error(err);
      showToast(
        lang === "ar"
          ? "حدث خطأ أثناء الاستيراد: " + err.message
          : "Error during import: " + err.message,
        "error",
      );
    } finally {
      setAiImportLoading(false);
    }
  };
  // Handle addition of a new employee
  const handleCreateNewEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newEmpForm.arabicName.trim() ||
      !newEmpForm.jobTitle.trim() ||
      !newEmpForm.iqamaId.trim()
    ) {
      showToast(
        lang === "ar"
          ? "يرجى تعبئة الحقول الأساسية: الاسم، المسمى، ورقم الهوية!"
          : "Fields required: Name, Job Title, and Iqama ID!",
        "error",
      );
      return;
    }
    // Default englishName fallback if left blank
    const completeEmpForm = {
      ...newEmpForm,
      englishName: newEmpForm.englishName || newEmpForm.arabicName,
      contractExpiry: newEmpForm.iqamaExpiryDate, // Sync for standard metrics
      bankInfo: {
        bankName: newEmpForm.bankName,
        iban: newEmpForm.iban,
        accountNumber: newEmpForm.accountNumber,
        swiftCode: newEmpForm.swiftCode,
        transferMethod: newEmpForm.transferMethod,
        accountHolderName: newEmpForm.accountHolderName,
        bankNotes: newEmpForm.bankNotes,
      }
    };
    if (onAddEmployee) {
      onAddEmployee(completeEmpForm);
      setIsAddOpen(false);
      // Reset form
      setNewEmpForm({
        arabicName: "",
        englishName: "",
        birthDate: "",
        dateOfJoining: "",
        nationality: "سعودي",
        passportDetails: "",
        iqamaId: "",
        iqamaExpiryDate: "",
        insurancePolicyNumber: "",
        insuranceCompany: "",
        insuranceClass: "C",
        insuranceExpiryDate: "",
        mobile: "",
        passportExpiryDate: "",
        jobTitle: "",
        classification: "موظف",
        grade: "Grade 1",
        allowances: { housing: 0, transport: 0,   },
        basicSalary: 6000,
        homeAddress: "الرياض، المملكة العربية السعودية",
        department: "Neon Fabrication",
        contractExpiry: "",
        bankName: "",
        accountHolderName: "",
        iban: "",
        accountNumber: "",
        swiftCode: "",
        transferMethod: "SARIE",
        bankNotes: "",
        company: "شركة فنون الوليد",
      });
      showToast(
        lang === "ar"
          ? "✓ تم تعيين وإلحاق الموظف الجديد بنجاح!"
          : "✓ New employee registered and dispatched successfully!",
        "success",
      );
      if (onReloadEmployees) {
        setTimeout(() => onReloadEmployees(), 400);
      }
    }
  };
  const handlePrint = () => {
    if (!selectedEmp) return;
    try {
      const newWindow = window.open("", "_blank");
      if (!newWindow) {
        showToast(
          lang === "ar"
            ? "يرجى السماح بالنوافذ المنبثقة (Pop-ups) للطباعة."
            : "Please allow pop-ups to print.",
          "error",
        );
        return;
      }
      const totalAllowances = selectedEmp.allowances
        ? (Number(selectedEmp.allowances.housing || 0) +
           Number(selectedEmp.allowances.transport || 0) +
           Number((selectedEmp.allowances as any).food || 0))
        : 0;
      const printHTML = `
        <div style="font-family: 'GE SS Two', 'Gotham Pro', Arial, sans-serif; max-width: 800px; margin: 0 auto; direction: rtl;">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0072BC; padding-bottom: 8px; margin-bottom: 16px;">
            <div style="text-align: right; direction: rtl;">
              <h2 style="font-size: 24px; font-weight: 900; color: #374151; margin: 0;">شركة فنون الوليد للصناعة</h2>
              <h3 style="font-size: 11px; font-weight: bold; color: #6b7280; margin: 4px 0 0 0; letter-spacing: 0.1em; direction: ltr; text-align: right;">FONOUN ALWALEED INDUSTRIAL CO.</h3>
            </div>
            <div>
              <img src="https://i.postimg.cc/0jQj3XVc/Alwaleed-Logo-Vertical-Blue.png" alt="Logo" style="height: 100px; object-fit: contain;" />
            </div>
          </div>
          <h1 style="text-align: center; color: #0072BC; margin-bottom: 20px; font-size: 20px;">سجل الموظف الشامل | Employee Profile Record</h1>
          <div style="display: flex; gap: 20px; margin-bottom: 20px;">
            ${
              selectedEmp.personalPhoto
                ? `
            <div style="width: 140px; flex-shrink: 0;">
              <img src="${selectedEmp.personalPhoto}" style="width: 140px; height: 160px; object-fit: cover; border-radius: 12px; border: 2px solid #f3f4f6; box-shadow: 0 2px 4px rgba(0,0,0,0.05);" />
            </div>
            `
                : ""
            }
            <div style="flex-grow: 1;">
              <div style="margin-bottom: 12px; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;">
                <span style="color: #6b7280; font-size: 12px; display: inline-block; width: 100px;">الاسم (عربي)</span>
                <strong style="font-size: 18px; color: #111827;">${selectedEmp.arabicName}</strong>
              </div>
              <div style="margin-bottom: 12px; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;">
                <span style="color: #6b7280; font-size: 12px; display: inline-block; width: 100px;">Name (En)</span>
                <strong style="font-size: 16px; color: #374151;">${selectedEmp.englishName || "-"}</strong>
              </div>
              <div style="display: flex; gap: 24px; margin-bottom: 12px;">
                <div style="flex: 1; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;">
                  <span style="color: #6b7280; font-size: 12px; display: inline-block; width: 80px;">الرقم الوظيفي</span>
                  <strong style="color: #0072BC; font-family: monospace; font-size: 16px;">${selectedEmp.id}</strong>
                </div>
                <div style="flex: 1; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;">
                  <span style="color: #6b7280; font-size: 12px; display: inline-block; width: 80px;">المسمى الوظيفي</span>
                  <strong style="color: #111827;">${selectedEmp.jobTitle}</strong>
                </div>
              </div>
            </div>
          </div>
          <!-- Section: Basic Info -->
          <h3 style="color: #0072BC; font-size: 16px; margin-bottom: 12px; border-bottom: 2px solid #0072BC; padding-bottom: 4px; display: inline-block;">البيانات الأساسية Basic Info</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px 32px; margin-bottom: 24px; font-size: 14px;">
            <div style="border-bottom: 1px dashed #e5e7eb; padding-bottom: 6px;">
               <span style="color: #6b7280; width: 130px; display: inline-block;">رقم الإقامة/الهوية:</span>
               <strong>${selectedEmp.iqamaId || "-"}</strong>
            </div>
            <div style="border-bottom: 1px dashed #e5e7eb; padding-bottom: 6px;">
               <span style="color: #6b7280; width: 130px; display: inline-block;">تاريخ انتهاء الإقامة:</span>
               <strong>${selectedEmp.iqamaExpiryDate || "-"}</strong>
            </div>
            <div style="border-bottom: 1px dashed #e5e7eb; padding-bottom: 6px;">
               <span style="color: #6b7280; width: 130px; display: inline-block;">رقم الجواز:</span>
               <strong>${selectedEmp.passportDetails || "-"}</strong>
            </div>
            <div style="border-bottom: 1px dashed #e5e7eb; padding-bottom: 6px;">
               <span style="color: #6b7280; width: 130px; display: inline-block;">تاريخ انتهاء الجواز:</span>
               <strong>${selectedEmp.passportExpiryDate || "-"}</strong>
            </div>
            <div style="border-bottom: 1px dashed #e5e7eb; padding-bottom: 6px;">
               <span style="color: #6b7280; width: 130px; display: inline-block;">الجنسية:</span>
               <strong>${selectedEmp.nationality || "-"}</strong>
            </div>
            <div style="border-bottom: 1px dashed #e5e7eb; padding-bottom: 6px;">
               <span style="color: #6b7280; width: 130px; display: inline-block;">الديانة:</span>
               <strong>${selectedEmp.religion || "-"}</strong>
            </div>
            <div style="border-bottom: 1px dashed #e5e7eb; padding-bottom: 6px;">
               <span style="color: #6b7280; width: 130px; display: inline-block;">تاريخ الميلاد:</span>
               <strong>${selectedEmp.birthDate || "-"}</strong>
            </div>
            <div style="border-bottom: 1px dashed #e5e7eb; padding-bottom: 6px;">
               <span style="color: #6b7280; width: 130px; display: inline-block;">القسم:</span>
               <strong>${selectedEmp.department || "-"}</strong>
            </div>
            <div style="border-bottom: 1px dashed #e5e7eb; padding-bottom: 6px;">
               <span style="color: #6b7280; width: 130px; display: inline-block;">رقم الجوال:</span>
               <strong dir="ltr">${selectedEmp.mobile || "-"}</strong>
            </div>
            <div style="border-bottom: 1px dashed #e5e7eb; padding-bottom: 6px;">
               <span style="color: #6b7280; width: 130px; display: inline-block;">العنوان:</span>
               <strong>${selectedEmp.homeAddress || "-"}</strong>
            </div>
          </div>
          <!-- Section: Contract Info -->
          <h3 style="color: #0072BC; font-size: 16px; margin-bottom: 12px; border-bottom: 2px solid #0072BC; padding-bottom: 4px; display: inline-block;">تفاصيل العقد Contract Details</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px 32px; margin-bottom: 24px; font-size: 14px;">
            <div style="border-bottom: 1px dashed #e5e7eb; padding-bottom: 6px;">
               <span style="color: #6b7280; width: 130px; display: inline-block;">تاريخ التعيين:</span>
               <strong>${selectedEmp.dateOfJoining || "-"}</strong>
            </div>
            <div style="border-bottom: 1px dashed #e5e7eb; padding-bottom: 6px;">
               <span style="color: #6b7280; width: 130px; display: inline-block;">نهاية العقد:</span>
               <strong>${selectedEmp.contractExpiry || "-"}</strong>
            </div>
            <div style="border-bottom: 1px dashed #e5e7eb; padding-bottom: 6px;">
               <span style="color: #6b7280; width: 130px; display: inline-block;">التصنيف:</span>
               <strong>${selectedEmp.classification || "-"}</strong>
            </div>
            <div style="border-bottom: 1px dashed #e5e7eb; padding-bottom: 6px;">
               <span style="color: #6b7280; width: 130px; display: inline-block;">الدرجة الوظيفية:</span>
               <strong>${selectedEmp.grade || "-"}</strong>
            </div>
            <div style="border-bottom: 1px dashed #e5e7eb; padding-bottom: 6px;">
               <span style="color: #6b7280; width: 130px; display: inline-block;">فئة التأمين:</span>
               <strong>${selectedEmp.insuranceClass || "-"}</strong>
            </div>
            <div style="border-bottom: 1px dashed #e5e7eb; padding-bottom: 6px;">
               <span style="color: #6b7280; width: 130px; display: inline-block;">انتهاء التأمين:</span>
               <strong>${selectedEmp.insuranceExpiryDate || "-"}</strong>
            </div>
            <div style="border-bottom: 1px dashed #e5e7eb; padding-bottom: 6px;">
               <span style="color: #6b7280; width: 130px; display: inline-block;">الراتب الأساسي:</span>
               <strong>${selectedEmp.basicSalary || "-"} SAR</strong>
            </div>
            <div style="border-bottom: 1px dashed #e5e7eb; padding-bottom: 6px;">
               <span style="color: #6b7280; width: 130px; display: inline-block;">إجمالي البدلات:</span>
               <strong>${totalAllowances} SAR</strong>
            </div>
          </div>
          <!-- Section: Custody Assets -->
          ${
            selectedEmp.custodyAssets && selectedEmp.custodyAssets.length > 0
              ? `
          <div style="page-break-inside: avoid;">
            <h3 style="color: #0072BC; font-size: 16px; margin-bottom: 12px; border-bottom: 2px solid #0072BC; padding-bottom: 4px; display: inline-block;">العهد المسجلة Custody Assets</h3>
            <div style="margin-bottom: 24px;">
              <ul style="list-style-type: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                ${selectedEmp.custodyAssets
                  .map(
                    (asset: any) => `
                  <li style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; background: #f9fafb;">
                    <strong style="color: #111827; display: block; margin-bottom: 4px;">${asset.name}</strong>
                    <div style="color: #6b7280; font-size: 12px; display: flex; justify-content: space-between;">
                      <span>التصنيف: ${asset.category}</span>
                      <span>الاستلام: ${asset.receivedDate}</span>
                    </div>
                    ${asset.additionalInfo ? `<div style="color: #6b7280; font-size: 12px; margin-top: 4px;">الملاحظات: ${asset.additionalInfo}</div>` : ""}
                  </li>
                `,
                  )
                  .join("")}
              </ul>
            </div>
          </div>
          `
              : ""
          }
          <!-- Attachments (Images) -->
          ${
            selectedEmp.iqamaPhoto || selectedEmp.passportPhoto
              ? `
          <div style="page-break-inside: avoid;">
            <h3 style="color: #0072BC; font-size: 16px; margin-bottom: 12px; border-bottom: 2px solid #0072BC; padding-bottom: 4px; display: inline-block;">الإثباتات المرفقة Attached Documents</h3>
            <div style="display: flex; gap: 20px; justify-content: start; margin-bottom: 16px;">
               ${
                 selectedEmp.iqamaPhoto
                   ? `
               <div style="flex: 1; border: 1px solid #e5e7eb; border-radius: 12px; padding: 10px; background: #f9fafb; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                 <h4 style="margin: 0 0 8px 0; color: #4b5563; font-size: 13px;">صورة الإقامة Iqama</h4>
                 <img src="${selectedEmp.iqamaPhoto}" style="max-width: 100%; max-height: 180px; height: auto; object-fit: contain; border-radius: 8px; border: 1px solid #d1d5db; background: white;" />
               </div>`
                   : ""
               }
               ${
                 selectedEmp.passportPhoto
                   ? `
               <div style="flex: 1; border: 1px solid #e5e7eb; border-radius: 12px; padding: 10px; background: #f9fafb; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                 <h4 style="margin: 0 0 8px 0; color: #4b5563; font-size: 13px;">صورة الجواز Passport</h4>
                 <img src="${selectedEmp.passportPhoto}" style="max-width: 100%; max-height: 180px; height: auto; object-fit: contain; border-radius: 8px; border: 1px solid #d1d5db; background: white;" />
               </div>`
                   : ""
               }
            </div>
          </div>
          `
              : ""
          }
          <!-- Footer -->
          <div style="margin-top: 30px; border-top: 1px solid #0072BC; padding-top: 16px; display: flex; justify-content: space-between; font-size: 10px; color: #4b5563;" dir="ltr">
             <div style="line-height: 1.6;">
                <p style="margin:0;"><span style="font-weight:bold; color:#0072BC;">T:</span> +966 13 833 4115</p>
                <p style="margin:0;"><span style="font-weight:bold; color:#0072BC;">Factory:</span> Dallah Industrial District, Dammam 32445, Saudi Arabia.</p>
             </div>
             <div style="text-align:right; line-height: 1.6;">
                <p style="margin:0;">info@alwaleedneon.com | www.alwaleedneon.com</p>
                <p style="margin:0;"><span style="font-weight:bold; color:#0072BC;">Riyad Bank Iban:</span> SA6 320 000 003 220 402 999 901</p>
             </div>
          </div>
        </div>
      `;
      newWindow.document.write(
        "<html><head><style>@import url('https://fonts.cdnfonts.com/css/ge-ss-two'); @import url('https://fonts.cdnfonts.com/css/gotham-pro'); * { font-family: 'GE SS Two', 'Gotham Pro', sans-serif !important; }</style><title>" +
          (selectedEmp?.arabicName || "Print") +
          "</title>",
      );
      newWindow.document.write(
        "<style>@page { margin: 15px 20px 20px; }</style>",
      );
      newWindow.document.write(
        '</head><body style="margin:0; padding:15px 20px; background:white;">',
      );
      newWindow.document.write(printHTML);
      newWindow.document.write("</body></html>");
      newWindow.document.close();
      setTimeout(() => {
        newWindow.focus();
        newWindow.print();
      }, 500);
    } catch (e) {
      showToast(
        lang === "ar"
          ? "حدث خطأ أثناء محاولة الطباعة. يرجى التأكد من صلاحيات المتصفح."
          : "An error occurred while trying to print. Please check browser permissions.",
        "error",
      );
    }
  };
  return (
    <div id="hr-employee-directory-tab" className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[3000] w-full max-w-md px-4 animate-in slide-in-from-top duration-300">
          <div
            className={`border text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 ${
              toast.type === "success"
                ? "bg-emerald-600 border-emerald-500"
                : toast.type === "error"
                  ? "bg-rose-600 border-rose-500"
                  : "bg-slate-900 border-slate-800"
            }`}
          >
            <span className="text-xl">
              {toast.type === "success"
                ? "✅"
                : toast.type === "error"
                  ? "❌"
                  : "ℹ️"}
            </span>
            <p className="text-sm font-bold leading-normal">{toast.message}</p>
          </div>
        </div>
      )}
      {/* 1. KEY METRICS HEADER BAR */}
      <div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-100 shadow-sm animate-fade-in"
        dir="rtl"
      >
        <div>
          <h2 className="text-xl font-black text-[#0072BC] flex items-center gap-2">
            <span>👥</span>
            {lang === "ar" ? "بيانات الموظفين" : "Employee Bureau Directory"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {lang === "ar"
              ? "تسيير ملفات العمالة وتوزيع بطاقات الهوية والعهد المسجلة وجدول خبراتهم بالتفصيل."
              : "Administer worker portfolios, custom manual custody registrations, and dynamic join age logs."}
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
            <span>
              {lang === "ar" ? "استيراد بالذكاء الاصطناعي" : "AI Import"}
            </span>
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-5 py-3 bg-[#0072BC] hover:bg-[#0072BC]/90 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 transition-all shadow-md select-none"
          >
            <Plus className="w-4.5 h-4.5 stroke-[3]" />
            <span>
              {lang === "ar" ? "إضافة موظف جديد" : "Enroll New Employee"}
            </span>
          </button>
        </div>
      </div>
      
      {/* 2. ADVANCED SEARCH & FILTER BAR */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3" dir="rtl">
        <div className="relative">
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder={
              lang === "ar"
                ? "ابحث هنا باسم الموظف، المسمى الوظيفي، أو رقم الإقامة / الهوية..."
                : "Search by name, role, or ID..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-11 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl text-right font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0072BC] focus:ring-1 focus:ring-[#0072BC] transition-all"
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Sorting */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-[#0072BC] cursor-pointer min-w-[150px]"
          >
            <option value="newest">{lang === "ar" ? "الأحدث انضماماً" : "Newest Joined"}</option>
            <option value="oldest">{lang === "ar" ? "الأقدم للأحدث" : "Oldest to Newest"}</option>
            <option value="age_oldest">{lang === "ar" ? "الأكبر عمراً" : "Oldest (Age)"}</option>
            <option value="nationality">{lang === "ar" ? "حسب الجنسية" : "By Nationality"}</option>
          </select>

          {/* Document Status Filter */}
          <select
            value={filterExpiredDocs}
            onChange={(e) => setFilterExpiredDocs(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-[#0072BC] cursor-pointer min-w-[150px]"
          >
            <option value="all">{lang === "ar" ? "جميع الوثائق" : "All Documents"}</option>
            <option value="expired">{lang === "ar" ? "وثائق منتهية (إقامة، عقد، الخ)" : "Expired Documents"}</option>
            <option value="valid">{lang === "ar" ? "وثائق صالحة" : "Valid Documents"}</option>
          </select>

          {/* Nationality Filter */}
          <select
            value={filterNationality}
            onChange={(e) => setFilterNationality(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-[#0072BC] cursor-pointer min-w-[150px]"
          >
            <option value="all">{lang === "ar" ? "جميع الجنسيات" : "All Nationalities"}</option>
            {Array.from(new Set(employees.map(e => e.nationality).filter(Boolean))).sort().map(nat => (
              <option key={nat} value={nat}>{nat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. SIMPLIFIED DIRECTORY RASTER CARD */}
      <div
        className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
        dir="rtl"
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-right text-xs">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] uppercase font-black tracking-wider">
                <th className="p-4 pr-6 font-extrabold">
                  {lang === "ar" ? "الاسم رباعي" : "Arabic Name / Bio"}
                </th>
                <th className="p-4 font-extrabold">
                  {lang === "ar" ? "المسمى الوظيفي" : "Job Title"}
                </th>
                <th className="p-4 font-extrabold">
                  {lang === "ar" ? "حالة الموظف" : "Employee Status"}
                </th>
                <th className="p-4 font-extrabold">
                  {lang === "ar" ? "تواريخ الوثائق" : "Document Dates"}
                </th>
                <th className="p-4 font-extrabold">
                  {lang === "ar" ? "رقم الإقامة / الهوية" : "ID / Iqama ID"}
                </th>
                <th className="p-4 pl-6 text-center font-extrabold">
                  {lang === "ar" ? "ملفات الموظف" : "Interventions"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredEmployees.map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-slate-50/30 transition-colors"
                >
                  <td className="p-4 pr-6">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0072BC] flex items-center justify-center font-black text-sm shadow-inner cursor-pointer transition-colors"
                        onClick={() => handleOpenViewMore(emp)}
                      >
                        {emp.arabicName ? emp.arabicName[0] : "U"}
                      </div>
                      <div>
                        <p
                          className="font-extrabold text-slate-800 text-[13px] cursor-pointer hover:text-[#0072BC] hover:underline transition-all"
                          onClick={() => handleOpenViewMore(emp)}
                        >
                          {lang === "en" ? (emp.englishName || <TranslatedText text={emp.arabicName} lang={lang} />) : emp.arabicName}
                        </p>
                        <p className="text-[10px] text-slate-450 font-mono mt-0.5">
                          {emp.englishName || emp.id}
                        </p>
                        {emp.mobile && (
                          <p
                            className="text-[10px] text-[#0072BC] font-mono font-bold mt-0.5"
                            dir="ltr"
                          >
                            {emp.mobile}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 font-extrabold rounded-lg text-[10.5px]">
                        <TranslatedText text={emp.jobTitle} lang={lang} />
                      </span>
                      {emp.classification && (
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-[#0072BC]/10 text-[#0072BC] rounded">
                          <TranslatedText text={emp.classification} lang={lang} />
                        </span>
                      )}
                      {emp.company && (
                        <span className={`px-2 py-0.5 text-[9px] font-black rounded mt-0.5 border ${
                          emp.company.includes("ساين")
                            ? "bg-purple-50 text-purple-700 border-purple-100"
                            : "bg-blue-50 text-blue-700 border-blue-100"
                        }`}>
                          <TranslatedText text={emp.company} lang={lang} />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-start">
                      <span
                        className={`px-3 py-1 text-[10.5px] font-bold rounded-lg ${emp.allowances?.status === "On Leave" ? "bg-amber-100 text-amber-700" : emp.allowances?.status === "Suspended" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
                      >
                        {emp.allowances?.status === "On Leave"
                          ? lang === "ar"
                            ? "في إجازة"
                            : "On Leave"
                          : emp.allowances?.status === "Suspended"
                            ? lang === "ar"
                              ? "موقوف"
                              : "Suspended"
                            : lang === "ar"
                              ? "على رأس العمل"
                              : "Active"}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1.5 items-start min-w-[180px]">
                      {emp.iqamaExpiryDate &&
                        (() => {
                          const statusObj = getIqamaStatus(
                            emp.iqamaExpiryDate,
                            lang,
                            "iqama",
                          );
                          return (
                            <div className="flex items-center gap-2 w-full justify-between border-b border-slate-100 pb-1">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                                  {lang === "ar" ? "الإقامة:" : "Iqama:"}
                                </span>
                                <span className="text-[11px] font-mono font-bold text-slate-700">
                                  {emp.iqamaExpiryDate}
                                </span>
                              </div>
                              <span
                                className={`text-[9px] font-black px-1.5 py-0.5 rounded leading-tight whitespace-nowrap ${statusObj.badgeClass}`}
                              >
                                {statusObj.status}
                              </span>
                            </div>
                          );
                        })()}
                      {emp.passportExpiryDate &&
                        (() => {
                          const statusObj = getIqamaStatus(
                            emp.passportExpiryDate,
                            lang,
                            "passport",
                          );
                          return (
                            <div className="flex items-center gap-2 w-full justify-between border-b border-slate-100 pb-1">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                                  {lang === "ar" ? "الجواز:" : "Passport:"}
                                </span>
                                <span className="text-[11px] font-mono font-bold text-slate-700">
                                  {emp.passportExpiryDate}
                                </span>
                              </div>
                              <span
                                className={`text-[9px] font-black px-1.5 py-0.5 rounded leading-tight whitespace-nowrap ${statusObj.badgeClass}`}
                              >
                                {statusObj.status}
                              </span>
                            </div>
                          );
                        })()}
                      {emp.insuranceExpiryDate &&
                        (() => {
                          const statusObj = getIqamaStatus(
                            emp.insuranceExpiryDate,
                            lang,
                            "insurance",
                          );
                          return (
                            <div className="flex items-center gap-2 w-full justify-between border-b border-slate-100 pb-1">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                                  {lang === "ar" ? "التأمين:" : "Insurance:"}
                                </span>
                                <span className="text-[11px] font-mono font-bold text-slate-700">
                                  {emp.insuranceExpiryDate}
                                </span>
                              </div>
                              <span
                                className={`text-[9px] font-black px-1.5 py-0.5 rounded leading-tight whitespace-nowrap ${statusObj.badgeClass}`}
                              >
                                {statusObj.status}
                              </span>
                            </div>
                          );
                        })()}
                      {emp.contractExpiry &&
                        (() => {
                          const statusObj = getIqamaStatus(
                            emp.contractExpiry,
                            lang,
                            "contract",
                          );
                          return (
                            <div className="flex items-center gap-2 w-full justify-between">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                                  {lang === "ar" ? "العقد:" : "Contract:"}
                                </span>
                                <span className="text-[11px] font-mono font-bold text-slate-700">
                                  {emp.contractExpiry}
                                </span>
                              </div>
                              <span
                                className={`text-[9px] font-black px-1.5 py-0.5 rounded leading-tight whitespace-nowrap ${statusObj.badgeClass}`}
                              >
                                {statusObj.status}
                              </span>
                            </div>
                          );
                        })()}
                      {!emp.iqamaExpiryDate &&
                        !emp.passportExpiryDate &&
                        !emp.insuranceExpiryDate &&
                        !emp.contractExpiry && (
                          <span className="text-[10px] text-slate-400 font-bold">
                            {lang === "ar"
                              ? "لا توجد وثائق مسجلة"
                              : "No dates registered"}
                          </span>
                        )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 items-start">
                      <div className="flex items-center gap-1.5" dir="ltr">
                        {getNationalityCode(emp.nationality) !== "un" ? (
                          <img
                            src={`https://flagcdn.com/w20/${getNationalityCode(emp.nationality)}.png`}
                            srcSet={`https://flagcdn.com/w40/${getNationalityCode(emp.nationality)}.png 2x`}
                            width="20"
                            alt={emp.nationality || "سعودي"}
                            title={emp.nationality || "سعودي"}
                            className="rounded-sm"
                          />
                        ) : (
                          <span
                            className="text-lg leading-none"
                            title={emp.nationality || "سعودي"}
                          >
                            🌐
                          </span>
                        )}
                        <span className="font-mono font-bold text-slate-800 text-xs">
                          {emp.iqamaId}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 pl-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenViewMore(emp)}
                        className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-[#0072BC] font-extrabold text-[11px] rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                        title={
                          lang === "ar"
                            ? "عرض أكثر وتفصيل وتتبع"
                            : "View full Employee profile"
                        }
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>
                          {lang === "ar" ? "عرض المزيد" : "View More"}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-12 text-slate-400 font-semibold bg-slate-50/20"
                  >
                    {lang === "ar"
                      ? "⚠️ لا توجد نتائج مطابقة لفلترة البحث."
                      : "No matched staff records found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* 4. MODAL DETAILED PRESENTATION HUB ("عرض المزيد" + تعديل + حذف + عهد يدوية) */}
      {selectedEmp && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in print:bg-white print:p-0 print:static print:inset-auto print:overflow-visible print:block"
          dir="rtl"
        >
          <div
            id="printable-certificate-area"
            className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-0 max-w-4xl w-full h-[90vh] flex flex-col overflow-hidden relative print:h-auto print:shadow-none print:border-none print:w-full print:overflow-visible"
          >
            {/* Modal Exit Trigger */}
            <button
              onClick={handleCloseViewMore}
              className="absolute top-4 left-4 p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl transition-all cursor-pointer z-10 print:hidden"
              title={lang === "ar" ? "إغلاق نافذة التفاصيل" : "Close Details"}
            >
              <X className="w-4 h-4" />
            </button>
            {/* Print Trigger */}
            <button
              onClick={handlePrint}
              className="absolute top-4 left-16 p-2 bg-[#0072BC] hover:bg-[#0072BC]/90 text-white rounded-xl transition-all cursor-pointer z-10 print:hidden"
              title={
                lang === "ar"
                  ? "طباعة كامل معلومات الموظف"
                  : "Print all employee details"
              }
            >
              <FileText className="w-4 h-4" />
            </button>
            {/* Scrollable Content Wrapper */}
            <div className="w-full p-6 overflow-y-auto print:overflow-visible relative">
              {/* Modal Header */}
              <div className="border-b border-slate-100 pb-4 ml-6 mb-4">
                <span className="text-[9px] bg-[#0072BC]/10 text-[#0072BC] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                  🏷️ ID: {selectedEmp.id}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-2">
                  {selectedEmp.arabicName}
                </h3>
                <p className="text-xs text-slate-450 font-bold tracking-wide mt-1 flex items-center justify-center gap-2">
                  <span>
                    {selectedEmp.jobTitle} •{" "}
                    {selectedEmp.nationality || "سعودي"}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[9px] font-bold rounded ${selectedEmp.allowances?.status === "On Leave" ? "bg-amber-100 text-amber-700" : selectedEmp.allowances?.status === "Suspended" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
                  >
                    {selectedEmp.allowances?.status === "On Leave"
                      ? lang === "ar"
                        ? "في إجازة"
                        : "On Leave"
                      : selectedEmp.allowances?.status === "Suspended"
                        ? lang === "ar"
                          ? "موقوف"
                          : "Suspended"
                        : lang === "ar"
                          ? "على رأس العمل"
                          : "Active"}
                  </span>
                </p>
              </div>
              {/* Tab Selector */}
              <div className="flex gap-2 mb-6 border-b border-slate-100 pb-2 print:hidden">
                <button
                  onClick={() => setModalTab("info")}
                  className={`px-4 py-2 font-bold text-sm rounded-xl transition-all ${modalTab === "info" ? "bg-[#0072BC] text-white shadow" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                >
                  {lang === "ar" ? "المعلومات الأساسية" : "Basic Info"}
                </button>
                <button
                  onClick={() => setModalTab("attachments")}
                  className={`px-4 py-2 font-bold text-sm rounded-xl transition-all ${modalTab === "attachments" ? "bg-[#0072BC] text-white shadow" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                >
                  {lang === "ar"
                    ? "المرفقات والمستندات"
                    : "Attachments & Documents"}
                </button>
              </div>
              {/* TAB 1: INFO CONTENT */}
              <div
                className={`space-y-6 text-xs text-slate-700 ${modalTab === "info" ? "block" : "hidden"} print:block`}
              >
                <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-150/70">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                    <h4 className="font-extrabold text-[#0072BC] text-xs flex items-center gap-1.5/5">
                      <span>👤</span>
                      {lang === "ar"
                        ? "بيانات الموظف الشاملة:"
                        : "Biographical Employee Information:"}
                    </h4>
                    {/* Edit Activation button */}
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#0072BC] font-extrabold rounded-lg flex items-center gap-1 transition-all"
                      >
                        <Edit2 className="w-3 h-3 text-[#0072BC]/80" />
                        <span>
                          {lang === "ar" ? "تعديل البيانات" : "Edit File"}
                        </span>
                      </button>
                    )}
                  </div>
                  {isEditing ? (
                    /* EDITING FORM PORTAL */
                    <form onSubmit={handleSaveBio} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            {lang === "ar" ? "اسمه (بالعربية)" : "Arabic Name"}
                          </label>
                          <input
                            type="text"
                            value={editForm.arabicName || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                arabicName: e.target.value,
                              })
                            }
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-right"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            {lang === "ar"
                              ? "الاسم بالإنجليزية"
                              : "English Name"}
                          </label>
                          <input
                            type="text"
                            value={editForm.englishName || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                englishName: e.target.value,
                              })
                            }
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-right"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            {lang === "ar" ? "الجنسية" : "Nationality"}
                          </label>
                          <CountrySelect
                            value={editForm.nationality || ""}
                            onChange={(val) =>
                              setEditForm({ ...editForm, nationality: val })
                            }
                            lang={lang}
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            {lang === "ar" ? "الشركة" : "Company"}
                          </label>
                          <select
                            value={editForm.company || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, company: e.target.value })
                            }
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-right text-xs"
                          >
                            <option value="">{lang === "ar" ? "اختر الشركة..." : "Select Company..."}</option>
                            <option value="شركة فنون الوليد">شركة فنون الوليد</option>
                            <option value="شركة ساين اكس">شركة ساين اكس</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            {lang === "ar" ? "المسمى الوظيفي" : "Job Title"}
                          </label>
                          <input
                            type="text"
                            value={editForm.jobTitle || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                jobTitle: e.target.value,
                              })
                            }
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-right"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            {lang === "ar"
                              ? "التصنيف الوظيفي"
                              : "Job Classification"}
                          </label>
                          <select
                            value={editForm.classification || "موظف"}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                classification: e.target.value,
                              })
                            }
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-right text-slate-700"
                          >
                            <option value="موظف">
                              {lang === "ar" ? "موظف" : "Staff"}
                            </option>
                            <option value="عامل تصنيع">
                              {lang === "ar"
                                ? "عامل تصنيع"
                                : "Manufacturing Worker"}
                            </option>
                            <option value="إداري">
                              {lang === "ar" ? "إداري" : "Administrative"}
                            </option>
                            <option value="الإدارة العليا">
                              {lang === "ar"
                                ? "الإدارة العليا"
                                : "Senior Management"}
                            </option>
                            <option value="فراس">
                              {lang === "ar" ? "فراس" : "Firas"}
                            </option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            {lang === "ar" ? "حالة الموظف" : "Employee Status"}
                          </label>
                          <select
                            value={editForm.allowances?.status || "Active"}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                allowances: {
                                  ...(editForm.allowances || {
                                    housing: 0,
                                    transport: 0,
                                  }),
                                  status: e.target.value,
                                },
                              })
                            }
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-right text-slate-700"
                          >
                            <option value="Active">
                              {lang === "ar" ? "على رأس العمل" : "Active"}
                            </option>
                            <option value="On Leave">
                              {lang === "ar" ? "في إجازة" : "On Leave"}
                            </option>
                            <option value="Suspended">
                              {lang === "ar" ? "موقوف" : "Suspended"}
                            </option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            {lang === "ar"
                              ? "رقم الإقامة / الهوية"
                              : "ID / Iqama ID"}
                          </label>
                          <input
                            type="text"
                            value={editForm.iqamaId || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                iqamaId: e.target.value,
                              })
                            }
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-center"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            {lang === "ar" ? "رقم الجوال" : "Mobile Number"}
                          </label>
                          <input
                            type="text"
                            value={editForm.mobile || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                mobile: e.target.value,
                              })
                            }
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            {lang === "ar" ? "رقم الجواز" : "Passport Number"}
                          </label>
                          <input
                            type="text"
                            value={editForm.passportDetails || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                passportDetails: e.target.value,
                              })
                            }
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            {lang === "ar" ? "تاريخ الميلاد" : "Date of Birth"}
                          </label>
                          <input
                            type="date"
                            value={editForm.birthDate || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                birthDate: e.target.value,
                              })
                            }
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            {lang === "ar"
                              ? "تاريخ التحاقه بالعمل"
                              : "Date of Joining"}
                          </label>
                          <input
                            type="date"
                            value={editForm.dateOfJoining || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                dateOfJoining: e.target.value,
                              })
                            }
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            {lang === "ar"
                              ? "تاريخ انتهاء الإقامة"
                              : "Iqama Expiry Date"}
                          </label>
                          <input
                            type="date"
                            value={editForm.iqamaExpiryDate || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                iqamaExpiryDate: e.target.value,
                              })
                            }
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            {lang === "ar"
                              ? "تاريخ انتهاء الجواز"
                              : "Passport Expiry Date"}
                          </label>
                          <input
                            type="date"
                            value={editForm.passportExpiryDate || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                passportExpiryDate: e.target.value,
                              })
                            }
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-center"
                          />
                        </div>
                      </div>
                      <div className="col-span-1 md:col-span-2 border-t border-slate-100 pt-3 mt-1">
                        <h4 className="text-xs font-black text-[#0072BC] mb-2">
                          {lang === "ar"
                            ? "التأمين الطبي"
                            : "Medical Insurance"}
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-2 col-span-1 md:col-span-2">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            {lang === "ar" ? "رقم البوليصة" : "Policy Number"}
                          </label>
                          <input
                            type="text"
                            value={editForm.insurancePolicyNumber || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                insurancePolicyNumber: e.target.value,
                              })
                            }
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            {lang === "ar"
                              ? "شركة التأمين"
                              : "Insurance Company"}
                          </label>
                          <input
                            type="text"
                            value={editForm.insuranceCompany || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                insuranceCompany: e.target.value,
                              })
                            }
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 col-span-1 md:col-span-2">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            {lang === "ar" ? "فئة التأمين" : "Insurance Class"}
                          </label>
                          <select
                            value={editForm.insuranceClass || "C"}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                insuranceClass: e.target.value,
                              })
                            }
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs form-select"
                          >
                            <option value="VIP">VIP</option>
                            <option value="A">Class A</option>
                            <option value="B">Class B</option>
                            <option value="C">Class C</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            {lang === "ar" ? "تاريخ الانتهاء" : "Expiry Date"}
                          </label>
                          <input
                            type="date"
                            value={editForm.insuranceExpiryDate || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                insuranceExpiryDate: e.target.value,
                              })
                            }
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-center text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 text-xs font-black pt-3">
                        <button
                          type="submit"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Check className="w-4 h-4" />
                          <span>
                            {lang === "ar"
                              ? "حفظ وتعديل التبعات"
                              : "Save Modifications"}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-4 bg-slate-200 text-slate-700 py-2 rounded-xl transition-all"
                        >
                          {lang === "ar" ? "إلغاء" : "Cancel"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* VIEWING DATA MODE */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-right">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">
                          {lang === "ar" ? "اسمه الكامل:" : "Arabic Name:"}
                        </span>
                        <p className="font-extrabold text-slate-800 text-[13px]">
                          {selectedEmp.arabicName}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">
                          {lang === "ar"
                            ? "الاسم باللغة الإنجليزية:"
                            : "English Name:"}
                        </span>
                        <p className="font-bold text-slate-800 font-mono text-[11px]">
                          {selectedEmp.englishName || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">
                          {lang === "ar" ? "الجنسية:" : "Nationality:"}
                        </span>
                        <p className="font-bold text-slate-800">
                          {selectedEmp.nationality || "سعودي"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">
                          {lang === "ar" ? "الشركة:" : "Company:"}
                        </span>
                        <p className="font-extrabold text-[#0072BC]">
                          {selectedEmp.company || "شركة فنون الوليد"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">
                          {lang === "ar" ? "المسمى الوظيفي:" : "Job Title:"}
                        </span>
                        <div className="flex flex-col items-start gap-1">
                          <p className="font-bold text-indigo-750">
                            {selectedEmp.jobTitle}
                          </p>
                          {selectedEmp.classification && (
                            <span className="inline-block mt-1 px-2.5 py-0.5 text-[10px] font-black bg-[#0072BC]/10 text-[#0072BC] rounded-md">
                              {selectedEmp.classification}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">
                          {lang === "ar" ? "حالة الموظف:" : "Employee Status:"}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`px-3 py-1 text-[10.5px] font-bold rounded-lg ${selectedEmp.allowances?.status === "On Leave" ? "bg-amber-100 text-amber-700" : selectedEmp.allowances?.status === "Suspended" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
                          >
                            {selectedEmp.allowances?.status === "On Leave"
                              ? lang === "ar"
                                ? "في إجازة"
                                : "On Leave"
                              : selectedEmp.allowances?.status === "Suspended"
                                ? lang === "ar"
                                  ? "موقوف"
                                  : "Suspended"
                                : lang === "ar"
                                  ? "على رأس العمل"
                                  : "Active"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">
                          {lang === "ar"
                            ? "رقم الإقامة / الهوية الوطنية:"
                            : "ID / Iqama ID:"}
                        </span>
                        <p className="font-mono font-black text-slate-800 text-[13px]">
                          {selectedEmp.iqamaId}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">
                          {lang === "ar" ? "رقم الجوال:" : "Mobile Number:"}
                        </span>
                        <p className="font-mono font-black text-slate-800 text-[13px]">
                          {selectedEmp.mobile ||
                            (lang === "ar" ? "غير مسجل" : "Not Set")}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">
                          {lang === "ar"
                            ? "رقم جواز السفر:"
                            : "Passport Book Number:"}
                        </span>
                        <p className="font-mono font-bold text-slate-700">
                          {selectedEmp.passportDetails ||
                            (lang === "ar" ? "غير مسجل يدوياً" : "Not Set")}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">
                          {lang === "ar" ? "تاريخ الميلاد:" : "Date of Birth:"}
                        </span>
                        <p className="font-mono text-slate-700">
                          {selectedEmp.birthDate || "1995-12-10"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">
                          {lang === "ar"
                            ? "تاريخ التحاقه بالعمل:"
                            : "Date of Joining:"}
                        </span>
                        <p className="font-mono text-slate-700">
                          {selectedEmp.dateOfJoining || "2022-01-01"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">
                          {lang === "ar"
                            ? "تاريخ انتهاء الإقامة:"
                            : "Iqama Expiry Date:"}
                        </span>
                        <div className="flex flex-col gap-1 items-start mt-0.5">
                          <span className="font-mono font-bold text-slate-800">
                            {selectedEmp.iqamaExpiryDate ||
                              (lang === "ar" ? "غير محدد" : "Not Specified")}
                          </span>
                          {selectedEmp.iqamaExpiryDate &&
                            (() => {
                              const statusObj = getIqamaStatus(
                                selectedEmp.iqamaExpiryDate,
                                lang,
                                "iqama",
                              );
                              return (
                                <span
                                  className={`px-2 py-0.5 text-[9.5px] font-black rounded border ${statusObj.badgeClass}`}
                                >
                                  {statusObj.status}{" "}
                                  {statusObj.daysLeft > 0
                                    ? `(${statusObj.daysLeft} ${lang === "ar" ? "يوم" : "days"})`
                                    : ""}
                                </span>
                              );
                            })()}
                        </div>
                      </div>
                      <div className="col-span-2 border-t pt-2 mt-2">
                        <span className="text-xs text-[#0072BC] block font-black mb-2">
                          {lang === "ar" ? "تأمين طبي:" : "Medical Insurance:"}
                        </span>
                        <div className="flex flex-wrap gap-4">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">
                              {lang === "ar"
                                ? "رقم البوليصة:"
                                : "Policy/Company:"}
                            </span>
                            <p className="font-mono font-black text-slate-800 text-xs">
                              {selectedEmp.insurancePolicyNumber || "-"} /{" "}
                              {selectedEmp.insuranceCompany || "-"}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">
                              {lang === "ar" ? "الفئة:" : "Class:"}
                            </span>
                            <p className="font-black text-slate-800 text-xs">
                              {selectedEmp.insuranceClass || "-"}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">
                              {lang === "ar"
                                ? "تاريخ الانتهاء:"
                                : "Expiry Date:"}
                            </span>
                            <div className="flex flex-col gap-1 items-start mt-0.5">
                              <span className="font-mono font-bold text-slate-800 text-xs">
                                {selectedEmp.insuranceExpiryDate ||
                                  (lang === "ar" ? "غير مسجل" : "Not Set")}
                              </span>
                              {selectedEmp.insuranceExpiryDate &&
                                (() => {
                                  const insStatus = getInsuranceStatus(
                                    selectedEmp.insuranceExpiryDate,
                                    lang,
                                  );
                                  return (
                                    <span
                                      className={`px-2 py-0.5 text-[9.5px] font-black rounded border ${insStatus.badgeClass}`}
                                    >
                                      {insStatus.status}{" "}
                                      {insStatus.daysLeft > 0
                                        ? `(${insStatus.daysLeft} ${lang === "ar" ? "يوم" : "days"})`
                                        : ""}
                                    </span>
                                  );
                                })()}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">
                          {lang === "ar"
                            ? "تاريخ انتهاء الجواز:"
                            : "Passport Expiry Date:"}
                        </span>
                        <p className="font-mono font-semibold text-amber-700">
                          {selectedEmp.passportExpiryDate || "عير محدد"}
                        </p>
                      </div>
                      {/* Dynamic Calculated Years of Experience built natively on dateOfJoining subtraction */}
                      <div className="col-span-1 sm:col-span-2 bg-[#0072BC]/5 p-3.5 rounded-xl border border-[#0072BC]/10 flex justify-between items-center text-xs mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">📊</span>
                          <div>
                            <p className="font-extrabold text-[#0072BC]">
                              {lang === "ar"
                                ? "سنوات الخبرة بالمنشأة"
                                : "Calculated In-House Service"}
                            </p>
                            <p className="text-[10px] text-slate-450">
                              {lang === "ar"
                                ? "محسوبة تلقائياً بناءً على تاريخ الالتحاق إلى اليوم"
                                : "Parsed dynamically up to current UTC time"}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="font-mono text-lg font-black text-[#0072BC] bg-[#0072BC]/15 px-3 py-1 rounded-lg">
                            {calculateExperience(selectedEmp.dateOfJoining)}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold mr-1.5">
                            {lang === "ar" ? "سنوات" : "Years"}
                          </span>
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
                          {lang === "ar"
                            ? "بيانات الراتب والعقد الوظيفي"
                            : "Salary and Employment Contract Details"}
                        </h4>
                        <span className="text-[10px] text-slate-400 block">
                          {lang === "ar"
                            ? "إدارة الرواتب الأساسية، البدلات (سكن، نقل، طعام)، وتواريخ العقود لمنصة قوى."
                            : "Manage basic compensation, allowances (housing, food, transport), and Qiwa contract specifics."}
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
                                      loans: selectedEmp.allowances?.loans || 0,
                                      deductions: selectedEmp.allowances?.deductions || 0,
                                      status: selectedEmp.allowances?.status || "Active",
                                      contractQiwaNumber: selectedEmp.contractQiwaNumber || "",
                                      contractUrl: selectedEmp.contractUrl || "",
                                      contractExpiry: selectedEmp.contractExpiry || "",
                                    });
                          setIsContractEditingUrl(!selectedEmp.contractUrl);
                        }}
                        className="px-3 py-1 bg-[#0072BC]/10 hover:bg-[#0072BC]/20 text-[#0072BC] font-extrabold text-[11px] rounded-lg transition-all cursor-pointer"
                      >
                        {lang === "ar"
                          ? "تعديل الراتب والعقد"
                          : "Edit Salary & Contract"}
                      </button>
                    )}
                  </div>
                  {isEditingSalaryContract ? (
  <form
    onSubmit={async (e) => {
      e.preventDefault();
      const updatedFields = {
        basicSalary: Number(salaryContractForm.basicSalary) || 0,
        allowances: {
          housing: Number(salaryContractForm.housing) || 0,
          transport: Number(salaryContractForm.transport) || 0,
          loans: Number(salaryContractForm.loans) || 0,
          deductions: Number(salaryContractForm.deductions) || 0,
          status: salaryContractForm.status || "Active",
        },
        contractQiwaNumber: salaryContractForm.contractQiwaNumber || "",
        contractUrl: salaryContractForm.contractUrl || "",
        contractExpiry: salaryContractForm.contractExpiry || "",
      };
      onUpdateEmployeeFields(selectedEmp.id, updatedFields);
      setSelectedEmp((prev) =>
        prev ? { ...prev, ...updatedFields } : null,
      );
      setIsEditingSalaryContract(false);
      if (onReloadEmployees) {
        await onReloadEmployees();
      }
      showToast(
        lang === "ar"
          ? "✓ تم حفظ تعديلات الراتب والعقد بنجاح!"
          : "✓ Salary and contract modifications saved!",
        "success",
      );
    }}
    className="space-y-4"
  >
    {/* SECTION 1: Compensations & Allowances editing */}
    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 space-y-3">
      <h5 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
        <span>💰</span>
        {lang === "ar" ? "تفاصيل الراتب والبدلات" : "Salary & Allowance Items"}
      </h5>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-right">
        <div>
          <label className="block text-slate-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "الراتب الأساسي" : "Basic Salary"}
          </label>
          <input
            type="number"
            value={salaryContractForm.basicSalary || ""}
            onChange={(e) => setSalaryContractForm({ ...salaryContractForm, basicSalary: Number(e.target.value) || 0 })}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 transition-all text-right font-extrabold"
          />
        </div>
        <div>
          <label className="block text-slate-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "بدل السكن" : "Housing Allowance"}
          </label>
          <input
            type="number"
            value={salaryContractForm.housing || ""}
            onChange={(e) => setSalaryContractForm({ ...salaryContractForm, housing: Number(e.target.value) || 0 })}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 transition-all text-right font-bold"
          />
        </div>
        <div>
          <label className="block text-slate-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "بدل المواصلات" : "Transport Allowance"}
          </label>
          <input
            type="number"
            value={salaryContractForm.transport || ""}
            onChange={(e) => setSalaryContractForm({ ...salaryContractForm, transport: Number(e.target.value) || 0 })}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 transition-all text-right font-bold"
          />
        </div>
        <div>
          <label className="block text-rose-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "السلف والقروض" : "Loans"}
          </label>
          <input
            type="number"
            value={salaryContractForm.loans || ""}
            onChange={(e) => setSalaryContractForm({ ...salaryContractForm, loans: Number(e.target.value) || 0 })}
            className="w-full bg-rose-50/50 border border-rose-200 rounded-lg px-3 py-1.5 text-xs text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all text-right font-bold"
          />
        </div>
        <div>
          <label className="block text-rose-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "الخصومات" : "Deductions"}
          </label>
          <input
            type="number"
            value={salaryContractForm.deductions || ""}
            onChange={(e) => setSalaryContractForm({ ...salaryContractForm, deductions: Number(e.target.value) || 0 })}
            className="w-full bg-rose-50/50 border border-rose-200 rounded-lg px-3 py-1.5 text-xs text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all text-right font-bold"
          />
        </div>
      </div>
    </div>

    {/* SECTION 2: Contract Info editing */}
    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 space-y-3">
      <h5 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
        <span>📄</span>
        {lang === "ar" ? "معلومات العقد" : "Contract Info"}
      </h5>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
        <div>
          <label className="block text-slate-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "رقم عقد قوى" : "Qiwa Contract Number"}
          </label>
          <input
            type="text"
            value={salaryContractForm.contractQiwaNumber || ""}
            onChange={(e) => setSalaryContractForm({ ...salaryContractForm, contractQiwaNumber: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 transition-all text-right font-bold"
          />
        </div>
        <div>
          <label className="block text-slate-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "تاريخ انتهاء العقد" : "Contract Expiry"}
          </label>
          <input
            type="date"
            value={salaryContractForm.contractExpiry || ""}
            onChange={(e) => setSalaryContractForm({ ...salaryContractForm, contractExpiry: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 transition-all text-right font-bold"
          />
        </div>
      </div>
    </div>

    <div className="flex gap-2 justify-end pt-2">
      <button
        type="button"
        onClick={() => setIsEditingSalaryContract(false)}
        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs rounded-xl transition-all"
      >
        {lang === "ar" ? "إلغاء" : "Cancel"}
      </button>
      <button
        type="submit"
        className="px-4 py-2 bg-[#0072BC] hover:bg-[#005a96] text-white font-extrabold text-xs rounded-xl transition-all shadow-sm"
      >
        {lang === "ar" ? "حفظ التعديلات" : "Save Changes"}
      </button>
    </div>
  </form>
) : (
  <div className="space-y-4">
    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 space-y-3">
      <h5 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
        <span>💰</span>
        {lang === "ar" ? "تفاصيل الراتب والبدلات" : "Salary & Allowance Items"}
      </h5>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-right">
        <div>
          <span className="block text-slate-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "الراتب الأساسي" : "Basic Salary"}
          </span>
          <span className="font-extrabold text-sm text-slate-700">
            {selectedEmp.basicSalary} {lang === "ar" ? "ر.س" : "SAR"}
          </span>
        </div>
        <div>
          <span className="block text-slate-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "بدل السكن" : "Housing Allowance"}
          </span>
          <span className="font-bold text-xs text-slate-600">
            {selectedEmp.allowances?.housing || 0} {lang === "ar" ? "ر.س" : "SAR"}
          </span>
        </div>
        <div>
          <span className="block text-slate-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "بدل المواصلات" : "Transport Allowance"}
          </span>
          <span className="font-bold text-xs text-slate-600">
            {selectedEmp.allowances?.transport || 0} {lang === "ar" ? "ر.س" : "SAR"}
          </span>
        </div>
      </div>
    </div>
    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 space-y-3">
      <h5 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
        <span>📄</span>
        {lang === "ar" ? "معلومات العقد" : "Contract Info"}
      </h5>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
        <div>
          <span className="block text-slate-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "رقم عقد قوى" : "Qiwa Contract Number"}
          </span>
          <span className="font-bold text-xs text-slate-600">
            {selectedEmp.contractQiwaNumber || "-"}
          </span>
        </div>
        <div>
          <span className="block text-slate-400 font-bold mb-1 text-[10px]">
            {lang === "ar" ? "تاريخ انتهاء العقد" : "Contract Expiry"}
          </span>
          <span className="font-bold text-xs text-slate-600">
            {selectedEmp.contractExpiry || "-"}
          </span>
        </div>
      </div>
    </div>
  </div>
)}
              </div>
                {/* SECTION: Bank & Transfer Information */}
                <div className="bg-white p-5 rounded-2xl border border-slate-150 space-y-4 text-right">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base text-slate-705">🏦</span>
                      <div>
                        <h4 className="font-extrabold text-[#0072BC] text-xs">
                          {lang === "ar"
                            ? "بيانات البنك والتحويل"
                            : "Bank & Transfer Information"}
                        </h4>
                        <span className="text-[10px] text-slate-400 block">
                          {lang === "ar"
                            ? "إدارة الحسابات البنكية، رمز الآيبان الدولي، وطريقة التحويل المعتمدة للموظف."
                            : "Manage employee bank accounts, IBAN, and preferred transfer methodologies."}
                        </span>
                      </div>
                    </div>
                    {!isEditingBankInfo && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingBankInfo(true);
                          const isCustom = !isStandardBank(selectedEmp.bankName || "");
                          setShowCustomBankInput(isCustom);
                          setBankInfoForm({
                            bankName: selectedEmp.bankName || (selectedEmp as any).bankInfo?.bankName || "",
                            iban: selectedEmp.iban || (selectedEmp as any).bankInfo?.iban || "",
                            accountNumber: selectedEmp.accountNumber || (selectedEmp as any).bankInfo?.accountNumber || "",
                            swiftCode: selectedEmp.swiftCode || (selectedEmp as any).bankInfo?.swiftCode || "",
                            transferMethod: selectedEmp.transferMethod || (selectedEmp as any).bankInfo?.transferMethod || "SARIE",
                            accountHolderName: selectedEmp.accountHolderName || (selectedEmp as any).bankInfo?.accountHolderName || "",
                            bankNotes: selectedEmp.bankNotes || (selectedEmp as any).bankInfo?.bankNotes || "",
                          });
                        }}
                        className="px-3 py-1 bg-[#0072BC]/10 hover:bg-[#0072BC]/20 text-[#0072BC] font-extrabold text-[11px] rounded-lg transition-all cursor-pointer"
                      >
                        {lang === "ar" ? "تعديل الحساب البنكي" : "Edit Bank Details"}
                      </button>
                    )}
                  </div>
                  {isEditingBankInfo ? (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        // Validate IBAN
                        const cleanIban = bankInfoForm.iban.replace(/\s+/g, "").toUpperCase();
                        if (cleanIban && (!cleanIban.startsWith("SA") || cleanIban.length !== 24)) {
                          showToast(
                            lang === "ar"
                              ? "❌ صيغة الآيبان غير صحيحة! يجب أن يبدأ بـ SA ويتكون من 24 حرفاً ورقماً."
                              : "❌ Invalid IBAN! Must start with 'SA' and be exactly 24 characters long.",
                            "error"
                          );
                          return;
                        }
                        const updatedFields: any = {
                          bankName: bankInfoForm.bankName,
                          iban: cleanIban,
                          accountNumber: bankInfoForm.accountNumber,
                          swiftCode: bankInfoForm.swiftCode,
                          transferMethod: bankInfoForm.transferMethod,
                          accountHolderName: bankInfoForm.accountHolderName,
                          bankNotes: bankInfoForm.bankNotes,
                          bankInfo: {
                            bankName: bankInfoForm.bankName,
                            iban: cleanIban,
                            accountNumber: bankInfoForm.accountNumber,
                            swiftCode: bankInfoForm.swiftCode,
                            transferMethod: bankInfoForm.transferMethod,
                            accountHolderName: bankInfoForm.accountHolderName,
                            bankNotes: bankInfoForm.bankNotes,
                          }
                        };
                        onUpdateEmployeeFields(selectedEmp.id, updatedFields);
                        setSelectedEmp((prev) =>
                          prev ? { ...prev, ...updatedFields } : null
                        );
                        setIsEditingBankInfo(false);
                        if (onReloadEmployees) {
                          await onReloadEmployees();
                        }
                        showToast(
                          lang === "ar"
                            ? "✓ تم حفظ البيانات البنكية والتحويل بنجاح!"
                            : "✓ Bank and transfer details saved successfully!",
                          "success"
                        );
                      }}
                      className="space-y-4"
                    >
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-right">
                          {/* Bank Name Selection */}
                          <div>
                            <label className="block text-slate-400 font-bold mb-1 text-[10px]">
                              {lang === "ar" ? "اسم البنك" : "Bank Name"}
                            </label>
                            <select
                              value={showCustomBankInput ? "Other" : bankInfoForm.bankName}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "Other") {
                                  setShowCustomBankInput(true);
                                  setBankInfoForm({
                                    ...bankInfoForm,
                                    bankName: "",
                                  });
                                } else {
                                  setShowCustomBankInput(false);
                                  const matched = [
                                    { nameAr: "مصرف الراجحي", nameEn: "Al Rajhi Bank", swift: "RJHIYARI" },
                                    { nameAr: "البنك الأهلي السعودي (SNB)", nameEn: "Saudi National Bank (SNB)", swift: "NCBKSARI" },
                                    { nameAr: "بنك الرياض", nameEn: "Riyadh Bank", swift: "RYADKARI" },
                                    { nameAr: "مصرف الإنماء", nameEn: "Alinma Bank", swift: "ALBIKARI" },
                                    { nameAr: "البنك العربي الوطني", nameEn: "Arab National Bank", swift: "ARABKARI" },
                                    { nameAr: "البنك السعودي الأول (SAB)", nameEn: "Saudi First Bank (SAB)", swift: "SABBKSRI" },
                                    { nameAr: "بنك البلاد", nameEn: "Bank Albilad", swift: "ALBIKARI" },
                                    { nameAr: "بنك الجزيرة", nameEn: "Bank AlJazira", swift: "BJAZKARI" },
                                    { nameAr: "البنك السعودي للاستثمار", nameEn: "Saudi Investment Bank", swift: "BSFKKARI" },
                                    { nameAr: "بنك الخليج الدولي", nameEn: "Gulf International Bank", swift: "GIBKKARI" },
                                  ].find(b => b.nameAr === val || b.nameEn === val);
                                  setBankInfoForm({
                                    ...bankInfoForm,
                                    bankName: val,
                                    swiftCode: matched ? matched.swift : bankInfoForm.swiftCode,
                                  });
                                }
                              }}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold"
                            >
                              <option value="">{lang === "ar" ? "-- اختر البنك --" : "-- Select Bank --"}</option>
                              {[
                                { nameAr: "مصرف الراجحي", nameEn: "Al Rajhi Bank" },
                                { nameAr: "البنك الأهلي السعودي (SNB)", nameEn: "Saudi National Bank (SNB)" },
                                { nameAr: "بنك الرياض", nameEn: "Riyadh Bank" },
                                { nameAr: "مصرف الإنماء", nameEn: "Alinma Bank" },
                                { nameAr: "البنك العربي الوطني", nameEn: "Arab National Bank" },
                                { nameAr: "البنك السعودي الأول (SAB)", nameEn: "Saudi First Bank (SAB)" },
                                { nameAr: "بنك البلاد", nameEn: "Bank Albilad" },
                                { nameAr: "بنك الجزيرة", nameEn: "Bank AlJazira" },
                                { nameAr: "البنك السعودي للاستثمار", nameEn: "Saudi Investment Bank" },
                                { nameAr: "بنك الخليج الدولي", nameEn: "Gulf International Bank" },
                              ].map((b, idx) => (
                                <option key={idx} value={lang === "ar" ? b.nameAr : b.nameEn}>
                                  {lang === "ar" ? b.nameAr : b.nameEn}
                                </option>
                              ))}
                              <option value="Other">{lang === "ar" ? "بنك آخر / غير مدرج" : "Other / Not Listed"}</option>
                            </select>
                            {showCustomBankInput && (
                              <input
                                type="text"
                                placeholder={lang === "ar" ? "أدخل اسم البنك يدوياً" : "Enter bank name manually"}
                                value={bankInfoForm.bankName}
                                onChange={(e) => setBankInfoForm({ ...bankInfoForm, bankName: e.target.value })}
                                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold mt-1.5"
                              />
                            )}
                          </div>
                          {/* Account Holder Name */}
                          <div>
                            <label className="block text-slate-400 font-bold mb-1 text-[10px]">
                              {lang === "ar" ? "اسم صاحب الحساب" : "Account Holder Name"}
                            </label>
                            <input
                              type="text"
                              value={bankInfoForm.accountHolderName}
                              onChange={(e) => setBankInfoForm({ ...bankInfoForm, accountHolderName: e.target.value })}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold text-right"
                              placeholder={selectedEmp.arabicName}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-right">
                          {/* IBAN */}
                          <div className="md:col-span-2">
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-slate-400 font-bold text-[10px]">
                                {lang === "ar" ? "رقم الآيبان (IBAN - يبدأ بـ SA و 24 حرف)" : "IBAN (Must start with SA)"}
                              </label>
                              {bankInfoForm.iban && (() => {
                                const det = detectBankFromIban(bankInfoForm.iban, lang);
                                return det.matched ? (
                                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-100">
                                    ✓ {lang === "ar" ? det.ar : det.en}
                                  </span>
                                ) : null;
                              })()}
                            </div>
                            <input
                              type="text"
                              value={bankInfoForm.iban}
                              onChange={(e) => {
                                const val = e.target.value.toUpperCase().replace(/\s+/g, "");
                                const det = detectBankFromIban(val, lang);
                                if (det.matched) {
                                  const matchedBank = [
                                    { nameAr: "مصرف الراجحي", nameEn: "Al Rajhi Bank", swift: "RJHIYARI" },
                                    { nameAr: "البنك الأهلي السعودي (SNB)", nameEn: "Saudi National Bank (SNB)", swift: "NCBKSARI" },
                                    { nameAr: "بنك الرياض", nameEn: "Riyadh Bank", swift: "RYADKARI" },
                                    { nameAr: "مصرف الإنماء", nameEn: "Alinma Bank", swift: "ALBIKARI" },
                                    { nameAr: "البنك العربي الوطني", nameEn: "Arab National Bank", swift: "ARABKARI" },
                                    { nameAr: "البنك السعودي الأول (SAB)", nameEn: "Saudi First Bank (SAB)", swift: "SABBKSRI" },
                                    { nameAr: "بنك البلاد", nameEn: "Bank Albilad", swift: "ALBIKARI" },
                                    { nameAr: "بنك الجزيرة", nameEn: "Bank AlJazira", swift: "BJAZKARI" },
                                    { nameAr: "البنك السعودي للاستثمار", nameEn: "Saudi Investment Bank", swift: "BSFKKARI" },
                                    { nameAr: "بنك الخليج الدولي", nameEn: "Gulf International Bank", swift: "GIBKKARI" },
                                  ].find(b => b.nameAr === det.ar || b.nameEn === det.en);
                                  
                                  setShowCustomBankInput(false);
                                  setBankInfoForm({
                                    ...bankInfoForm,
                                    iban: val,
                                    bankName: lang === "ar" ? det.ar : det.en,
                                    swiftCode: matchedBank ? matchedBank.swift : bankInfoForm.swiftCode,
                                  });
                                } else {
                                  setBankInfoForm({ ...bankInfoForm, iban: val });
                                }
                              }}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-left"
                              placeholder="SA..."
                              maxLength={34}
                            />
                            {bankInfoForm.iban && bankInfoForm.iban.replace(/\s+/g, "").length !== 24 && (
                              <span className="text-[9px] text-amber-600 block mt-0.5">
                                {lang === "ar"
                                  ? `⚠️ طول الآيبان الحالي: ${bankInfoForm.iban.replace(/\s+/g, "").length} من 24 حرفاً.`
                                  : `⚠️ Current length: ${bankInfoForm.iban.replace(/\s+/g, "").length} out of 24 characters.`}
                              </span>
                            )}
                          </div>
                          {/* Account Number */}
                          <div>
                            <label className="block text-slate-400 font-bold mb-1 text-[10px]">
                              {lang === "ar" ? "رقم الحساب المحلي" : "Account Number"}
                            </label>
                            <input
                              type="text"
                              value={bankInfoForm.accountNumber}
                              onChange={(e) => setBankInfoForm({ ...bankInfoForm, accountNumber: e.target.value })}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-center"
                              placeholder="e.g. 108031580001"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-right">
                          {/* SWIFT Code */}
                          <div>
                            <label className="block text-slate-400 font-bold mb-1 text-[10px]">
                              {lang === "ar" ? "رمز السويفت كود (SWIFT Code)" : "SWIFT Code"}
                            </label>
                            <input
                              type="text"
                              value={bankInfoForm.swiftCode}
                              onChange={(e) => setBankInfoForm({ ...bankInfoForm, swiftCode: e.target.value })}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-center"
                              placeholder="e.g. RJHIYARI"
                            />
                          </div>
                          {/* Transfer Method */}
                          <div>
                            <label className="block text-slate-400 font-bold mb-1 text-[10px]">
                              {lang === "ar" ? "طريقة التحويل المفضلة" : "Preferred Transfer Method"}
                            </label>
                            <select
                              value={bankInfoForm.transferMethod}
                              onChange={(e) => setBankInfoForm({ ...bankInfoForm, transferMethod: e.target.value })}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold"
                            >
                              <option value="SARIE">{lang === "ar" ? "تحويل نظام سريع (SARIE)" : "SARIE Bank Transfer"}</option>
                              <option value="Local Transfer">{lang === "ar" ? "تحويل محلي عادي" : "Local Transfer"}</option>
                              <option value="Cash">{lang === "ar" ? "تسليم نقدي (Cash)" : "Cash Handover"}</option>
                              <option value="Cheque">{lang === "ar" ? "شيك بنكي (Cheque)" : "Bank Cheque"}</option>
                            </select>
                          </div>
                        </div>
                        {/* Bank Notes */}
                        <div>
                          <label className="block text-slate-400 font-bold mb-1 text-[10px]">
                            {lang === "ar" ? "ملاحظات إضافية حول الحساب والتحويل" : "Bank Transfer Notes"}
                          </label>
                          <textarea
                            value={bankInfoForm.bankNotes}
                            onChange={(e) => setBankInfoForm({ ...bankInfoForm, bankNotes: e.target.value })}
                            rows={2}
                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-semibold"
                            placeholder={lang === "ar" ? "أي ملاحظات خاصة بالتحويل والعمولات..." : "Any routing or fee constraints..."}
                          />
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex gap-2 text-xs font-black pt-2">
                        <button
                          type="submit"
                          className="flex-1 bg-[#0072BC] hover:bg-[#0072BC]/95 text-white py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>{lang === "ar" ? "حفظ البيانات البنكية" : "Save Bank Details"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingBankInfo(false)}
                          className="px-4 bg-slate-100 text-slate-600 py-2 rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                        >
                          {lang === "ar" ? "إلغاء" : "Cancel"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Read Only View */
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-right">
                        <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100/70">
                          <span className="block text-[10px] text-slate-400 font-bold">
                            {lang === "ar" ? "اسم البنك:" : "Bank Name:"}
                          </span>
                          <p className="font-bold text-slate-800 mt-0.5 text-xs">
                            {selectedEmp.bankName || (lang === "ar" ? "غير مسجل" : "N/A")}
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100/70">
                          <span className="block text-[10px] text-slate-400 font-bold">
                            {lang === "ar" ? "اسم صاحب الحساب:" : "Account Holder:"}
                          </span>
                          <p className="font-bold text-slate-800 mt-0.5 text-xs">
                            {selectedEmp.accountHolderName || selectedEmp.arabicName}
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100/70">
                          <span className="block text-[10px] text-slate-400 font-bold">
                            {lang === "ar" ? "طريقة التحويل المالي:" : "Transfer Method:"}
                          </span>
                          <p className="font-bold text-[#0072BC] mt-0.5 text-xs">
                            {selectedEmp.transferMethod === "SARIE"
                              ? lang === "ar" ? "نظام سريع (SARIE)" : "SARIE Transfer"
                              : selectedEmp.transferMethod === "Cash"
                              ? lang === "ar" ? "تسليم نقدي" : "Cash"
                              : selectedEmp.transferMethod === "Cheque"
                              ? lang === "ar" ? "شيك بنكي" : "Cheque"
                              : selectedEmp.transferMethod || (lang === "ar" ? "تحويل بنكي عادي" : "Bank Transfer")}
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100/70">
                          <span className="block text-[10px] text-slate-400 font-bold">
                            {lang === "ar" ? "سويفت كود (SWIFT):" : "SWIFT Code:"}
                          </span>
                          <p className="font-mono font-bold text-slate-700 mt-0.5 text-xs">
                            {selectedEmp.swiftCode || (lang === "ar" ? "غير مسجل" : "N/A")}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-right">
                        <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100/70 md:col-span-2">
                          <span className="block text-[10px] text-slate-400 font-bold">
                            {lang === "ar" ? "رقم الآيبان الدولي (IBAN):" : "IBAN Number:"}
                          </span>
                          <p className="font-mono font-black text-slate-800 mt-0.5 text-xs tracking-wider text-left">
                            {selectedEmp.iban ? (
                              <span className="text-emerald-700">
                                {selectedEmp.iban.match(/.{1,4}/g)?.join(" ")}
                              </span>
                            ) : (
                              <span className="text-rose-500 font-bold">
                                {lang === "ar" ? "⚠️ الآيبان مطلوب لضمان مسير الرواتب!" : "⚠️ Missing IBAN!"}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100/70">
                          <span className="block text-[10px] text-slate-400 font-bold">
                            {lang === "ar" ? "رقم الحساب:" : "Account Number:"}
                          </span>
                          <p className="font-mono font-bold text-slate-800 mt-0.5 text-xs">
                            {selectedEmp.accountNumber || (lang === "ar" ? "غير مسجل" : "N/A")}
                          </p>
                        </div>
                      </div>
                      {selectedEmp.bankNotes && (
                        <div className="p-3 bg-blue-50/30 rounded-xl border border-blue-100/30 text-right">
                          <span className="block text-[10px] text-[#0072BC] font-bold">
                            {lang === "ar" ? "ملاحظات الدفع والتحويل:" : "Transfer Notes:"}
                          </span>
                          <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                            {selectedEmp.bankNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* SECTION: Custody Assets ("العهد المسجلة لدى الموظف" تكتب يدوياً) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-150 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                    <span className="text-base text-slate-700">🛡️</span>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs">
                        {lang === "ar"
                          ? "العهد المسجلة لدى الموظف"
                          : "Registered Employee Custody List"}
                      </h4>
                      <span className="text-[10px] text-slate-400 block">
                        {lang === "ar"
                          ? "إضافة عهد يدوية مع تتبع تواريخ الاستلام وتصنيف العهدة بالتفصيل."
                          : "A complete manual record of tools, laptops, or cars allocated to this staff."}
                      </span>
                    </div>
                  </div>
                  {/* List of custom assets inside selected employee */}
                  <div className="space-y-2">
                    {selectedEmp.custodyAssets &&
                    selectedEmp.custodyAssets.length > 0 ? (
                      <div className="border border-slate-100 rounded-xl overflow-hidden text-right">
                        <table className="w-full text-[11px] border-collapse bg-slate-50/50">
                          <thead>
                            <tr className="bg-slate-100/60 text-slate-500 text-[9px] uppercase font-bold border-b border-slate-150">
                              <th className="p-2 font-black">
                                {lang === "ar" ? "العهدة" : "Asset"}
                              </th>
                              <th className="p-2 font-black">
                                {lang === "ar"
                                  ? "تاريخ الاستلام"
                                  : "Receipt Date"}
                              </th>
                              <th className="p-2 font-black">
                                {lang === "ar" ? "تصنيف العهدة" : "Category"}
                              </th>
                              <th className="p-2 font-black">
                                {lang === "ar"
                                  ? "معلومات إضافية"
                                  : "Additional Info"}
                              </th>
                              <th className="p-2 text-center font-black">
                                {lang === "ar" ? "حذف" : "Remove"}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150">
                            {selectedEmp.custodyAssets.map((asset, idx) => (
                              <tr
                                key={idx}
                                className="hover:bg-white transition-colors text-slate-700 font-bold"
                              >
                                <td className="p-2 text-indigo-700">
                                  {asset.name}
                                </td>
                                <td className="p-2 font-mono text-[10px]">
                                  {asset.receivedDate}
                                </td>
                                <td className="p-2">
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[9px]">
                                    {asset.category}
                                  </span>
                                </td>
                                <td className="p-2 text-slate-500 font-medium">
                                  {asset.additionalInfo || "—"}
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveCustodyAsset(idx)
                                    }
                                    className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg transition-all"
                                    title={
                                      lang === "ar"
                                        ? "مسح العهدة"
                                        : "Delete asset"
                                    }
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
                      <div
                        id="no-custody"
                        className="p-6 bg-slate-50 rounded-xl text-center text-slate-400 font-bold border border-dashed border-slate-200"
                      >
                        {lang === "ar"
                          ? "✕ لا توجد أي عهد مسجلة مخصصة لهذا الموظف حالياً."
                          : "No manual custody registry found for this individual."}
                      </div>
                    )}
                  </div>
                  {/* Manuel Asset Registration Form */}
                  <form
                    onSubmit={handleAddCustodyAsset}
                    className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/55 space-y-4 text-right"
                  >
                    <h5 className="font-extrabold text-xs text-slate-700">
                      ➕{" "}
                      {lang === "ar"
                        ? "إضافة عهدة للموظف يدوياً:"
                        : "Register New Custom Custody Area:"}
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-slate-400 text-[10px] font-bold mb-1">
                          {lang === "ar" ? "العهدة المستلمة" : "Asset"}
                        </label>
                        <input
                          required
                          type="text"
                          placeholder={
                            lang === "ar"
                              ? "مثال: لابتوب، جهاز معيرة"
                              : "e.g. Dell Latitue L54"
                          }
                          value={newAsset.name}
                          onChange={(e) =>
                            setNewAsset({ ...newAsset, name: e.target.value })
                          }
                          className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold text-right"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] font-bold mb-1">
                          {lang === "ar" ? "تاريخ الاستلام" : "Receipt Date"}
                        </label>
                        <input
                          type="date"
                          value={newAsset.receivedDate}
                          onChange={(e) =>
                            setNewAsset({
                              ...newAsset,
                              receivedDate: e.target.value,
                            })
                          }
                          className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-mono text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] font-bold mb-1">
                          {lang === "ar" ? "تصنيف العهدة" : "Category"}
                        </label>
                        <select
                          value={newAsset.category}
                          onChange={(e) =>
                            setNewAsset({
                              ...newAsset,
                              category: e.target.value,
                            })
                          }
                          className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold text-right text-slate-700"
                        >
                          <option value="أجهزة ومعدات">
                            {lang === "ar"
                              ? "أجهزة ومعدات ومستلزمات"
                              : "IT/Electronic hardware"}
                          </option>
                          <option value="سيارات ونقل">
                            {lang === "ar"
                              ? "سيارات وشاحنات نقل"
                              : "Vehicles / Mobility"}
                          </option>
                          <option value="أدوات ورش ومصنع">
                            {lang === "ar"
                              ? "أدوات ورش ومصنع نيون"
                              : "Shopfloor Mechanical tools"}
                          </option>
                          <option value="أثاث ومجهوزات">
                            {lang === "ar"
                              ? "أثاث ومجهوزات مكتبية"
                              : "Furniture & Office supplies"}
                          </option>
                          <option value="أخرى">
                            {lang === "ar" ? "تصنيفات أخرى" : "Other"}
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] font-bold mb-1">
                          {lang === "ar"
                            ? "معلومات إضافية ومحضر الاستلام"
                            : "Additional details"}
                        </label>
                        <input
                          type="text"
                          placeholder={
                            lang === "ar"
                              ? "مثال: رقم تسلسلي، قطع إضافية"
                              : "Serial tag or status description"
                          }
                          value={newAsset.additionalInfo}
                          onChange={(e) =>
                            setNewAsset({
                              ...newAsset,
                              additionalInfo: e.target.value,
                            })
                          }
                          className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold text-right"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-[#0072BC] hover:bg-[#0072BC]/95 text-white font-black text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      ⚡{" "}
                      {lang === "ar"
                        ? "إضافة وتسجيل العهدة فوراً للسيستم"
                        : "Commit Asset Handover & Save"}
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
                    <span>
                      {lang === "ar"
                        ? "إزالة هذا الموظف من الجدول"
                        : "Remove Employee From Table"}
                    </span>
                  </button>
                </div>
              </div>{" "}
              {/* CLOSE TAB 1: INFO CONTENT */}
              {/* TAB 2: ATTACHMENTS CONTENT */}
              <div
                className={`w-full mt-8 bg-slate-50 rounded-2xl border border-slate-100 p-6 print:w-full print:border-none print:break-before-page ${modalTab === "attachments" ? "block" : "hidden"} print:block`}
              >
                <h3 className="font-black text-slate-800 text-lg mb-6 border-b border-slate-200 pb-3">
                  {lang === "ar"
                    ? "المرفقات والمستندات"
                    : "Attachments & Documents"}
                </h3>
                <EmployeeAttachmentsPanel
                  lang={lang}
                  showToast={showToast}
                  emp={selectedEmp}
                  onUpdate={(fields) => {
                    onUpdateEmployeeFields(selectedEmp.id, fields);
                    setSelectedEmp({ ...selectedEmp, ...fields });
                  }}
                />
              </div>
            </div>{" "}
            {/* Close Scrollable Content Wrapper */}
          </div>{" "}
          {/* Close Flex container */}
        </div>
      )}
      {/* 5. ADD NEW EMPLOYEE DIALOG MODAL (إضافة موظف) */}
      {isAddOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in"
          dir="rtl"
        >
          <form
            onSubmit={handleCreateNewEmployeeSubmit}
            className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4 text-xs text-right"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800">
                ➕{" "}
                {lang === "ar"
                  ? "نموذج إلحاق وتعيين موظف جديد"
                  : "New Personnel Onboarding Form"}
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
                <label className="block text-slate-500 font-bold mb-1">
                  {lang === "ar"
                    ? "اسمه رباعي بالعربية (مطلوب)"
                    : "Full Name Arabic (Required)"}
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سلمان بن فيصل العتيبي"
                  value={newEmpForm.arabicName}
                  onChange={(e) =>
                    setNewEmpForm({ ...newEmpForm, arabicName: e.target.value })
                  }
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-right"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">
                  {lang === "ar"
                    ? "الاسم بالإنجليزية (اختياري)"
                    : "Full Name English (Optional)"}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Salman Faisal Al-Otaibi"
                  value={newEmpForm.englishName}
                  onChange={(e) =>
                    setNewEmpForm({
                      ...newEmpForm,
                      englishName: e.target.value,
                    })
                  }
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-right font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">
                    {lang === "ar"
                      ? "التصنيف الوظيفي (مطلوب)"
                      : "Job Classification (Required)"}
                  </label>
                  <select
                    value={newEmpForm.classification}
                    onChange={(e) =>
                      setNewEmpForm({
                        ...newEmpForm,
                        classification: e.target.value,
                      })
                    }
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-right text-slate-700"
                  >
                    <option value="موظف">
                      {lang === "ar" ? "موظف" : "Staff"}
                    </option>
                    <option value="عامل تصنيع">
                      {lang === "ar" ? "عامل تصنيع" : "Manufacturing Worker"}
                    </option>
                    <option value="إداري">
                      {lang === "ar" ? "إداري" : "Administrative"}
                    </option>
                    <option value="الإدارة العليا">
                      {lang === "ar" ? "الإدارة العليا" : "Senior Management"}
                    </option>
                    <option value="فراس">
                      {lang === "ar" ? "فراس" : "Firas"}
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">
                    {lang === "ar"
                      ? "المسمى الوظيفي (مطلوب)"
                      : "Job Title (Required)"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="فني تجميع / أخصائي مبيعات"
                    value={newEmpForm.jobTitle}
                    onChange={(e) =>
                      setNewEmpForm({ ...newEmpForm, jobTitle: e.target.value })
                    }
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-right"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">
                    {lang === "ar" ? "الجنسية" : "Nationality"}
                  </label>
                  <CountrySelect
                    value={newEmpForm.nationality}
                    onChange={(val) =>
                      setNewEmpForm({ ...newEmpForm, nationality: val })
                    }
                    lang={lang}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">
                    {lang === "ar" ? "الشركة" : "Company"}
                  </label>
                  <select
                    value={newEmpForm.company}
                    onChange={(e) =>
                      setNewEmpForm({ ...newEmpForm, company: e.target.value })
                    }
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-right text-xs"
                  >
                    <option value="شركة فنون الوليد">شركة فنون الوليد</option>
                    <option value="شركة ساين اكس">شركة ساين اكس</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">
                    {lang === "ar" ? "رقم الجوال" : "Mobile Number"}
                  </label>
                  <input
                    type="text"
                    value={newEmpForm.mobile}
                    onChange={(e) =>
                      setNewEmpForm({ ...newEmpForm, mobile: e.target.value })
                    }
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-right"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">
                    {lang === "ar"
                      ? "رقم الإقامة / الهوية (مطلوب)"
                      : "Iqama / ID Number (Required)"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 2409819482"
                    value={newEmpForm.iqamaId}
                    onChange={(e) =>
                      setNewEmpForm({ ...newEmpForm, iqamaId: e.target.value })
                    }
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">
                    {lang === "ar" ? "رقم جواز السفر" : "Passport Book Number"}
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: SA0928371"
                    value={newEmpForm.passportDetails}
                    onChange={(e) =>
                      setNewEmpForm({
                        ...newEmpForm,
                        passportDetails: e.target.value,
                      })
                    }
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">
                    {lang === "ar" ? "تاريخ الميلاد" : "Date of Birth"}
                  </label>
                  <input
                    type="date"
                    value={newEmpForm.birthDate}
                    onChange={(e) =>
                      setNewEmpForm({
                        ...newEmpForm,
                        birthDate: e.target.value,
                      })
                    }
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">
                    {lang === "ar" ? "تاريخ التحاقه بالعمل" : "Date of Joining"}
                  </label>
                  <input
                    type="date"
                    value={newEmpForm.dateOfJoining}
                    onChange={(e) =>
                      setNewEmpForm({
                        ...newEmpForm,
                        dateOfJoining: e.target.value,
                      })
                    }
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">
                    {lang === "ar"
                      ? "تاريخ انتهاء الإقامة"
                      : "Iqama Expiry Date"}
                  </label>
                  <input
                    type="date"
                    value={newEmpForm.iqamaExpiryDate}
                    onChange={(e) =>
                      setNewEmpForm({
                        ...newEmpForm,
                        iqamaExpiryDate: e.target.value,
                      })
                    }
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">
                    {lang === "ar"
                      ? "تاريخ انتهاء الجواز"
                      : "Passport Expiry Date"}
                  </label>
                  <input
                    type="date"
                    value={newEmpForm.passportExpiryDate}
                    onChange={(e) =>
                      setNewEmpForm({
                        ...newEmpForm,
                        passportExpiryDate: e.target.value,
                      })
                    }
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center"
                  />
                </div>
              </div>
              {/* Medical Insurance */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-black text-[#0072BC] mb-4">
                  {lang === "ar"
                    ? "التأمين الطبي (اختياري)"
                    : "Medical Insurance"}
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">
                      {lang === "ar" ? "رقم البوليصة" : "Policy Number"}
                    </label>
                    <input
                      type="text"
                      value={newEmpForm.insurancePolicyNumber || ""}
                      onChange={(e) =>
                        setNewEmpForm({
                          ...newEmpForm,
                          insurancePolicyNumber: e.target.value,
                        })
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">
                      {lang === "ar" ? "شركة التأمين" : "Insurance Company"}
                    </label>
                    <input
                      type="text"
                      value={newEmpForm.insuranceCompany || ""}
                      onChange={(e) =>
                        setNewEmpForm({
                          ...newEmpForm,
                          insuranceCompany: e.target.value,
                        })
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">
                      {lang === "ar" ? "فئة التأمين" : "Class"}
                    </label>
                    <select
                      value={newEmpForm.insuranceClass || "C"}
                      onChange={(e) =>
                        setNewEmpForm({
                          ...newEmpForm,
                          insuranceClass: e.target.value,
                        })
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm"
                    >
                      <option value="VIP">VIP</option>
                      <option value="A">Class A</option>
                      <option value="B">Class B</option>
                      <option value="C">Class C</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">
                      {lang === "ar" ? "تاريخ الانتهاء" : "Expiry Date"}
                    </label>
                    <input
                      type="date"
                      value={newEmpForm.insuranceExpiryDate || ""}
                      onChange={(e) =>
                        setNewEmpForm({
                          ...newEmpForm,
                          insuranceExpiryDate: e.target.value,
                        })
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center"
                    />
                  </div>
                </div>
              </div>
              {/* Salary & Allowances */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-black text-[#0072BC] mb-4">
                  {lang === "ar" ? "بيانات الراتب والبدلات" : "Salary & Allowances"}
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">
                      {lang === "ar" ? "الراتب الأساسي" : "Basic Salary"}
                    </label>
                    <input
                      type="number"
                      required
                      value={newEmpForm.basicSalary}
                      onChange={(e) =>
                        setNewEmpForm({ ...newEmpForm, basicSalary: Number(e.target.value) || 0 })
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">
                      {lang === "ar" ? "بدل السكن" : "Housing Allowance"}
                    </label>
                    <input
                      type="number"
                      value={newEmpForm.allowances?.housing || 0}
                      onChange={(e) =>
                        setNewEmpForm({
                          ...newEmpForm,
                          allowances: { ...newEmpForm.allowances, housing: Number(e.target.value) || 0 },
                        })
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">
                      {lang === "ar" ? "بدل نقل" : "Transport"}
                    </label>
                    <input
                      type="number"
                      value={newEmpForm.allowances?.transport || 0}
                      onChange={(e) =>
                        setNewEmpForm({
                          ...newEmpForm,
                          allowances: { ...newEmpForm.allowances, transport: Number(e.target.value) || 0 },
                        })
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center"
                    />
                  </div>
                </div>
              </div>
              {/* Bank & Transfer details */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-black text-[#0072BC] mb-4">
                  {lang === "ar"
                    ? "بيانات البنك والتحويل (اختياري)"
                    : "Bank & Transfer Details (Optional)"}
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">
                      {lang === "ar" ? "اسم البنك" : "Bank Name"}
                    </label>
                    <select
                      value={showNewEmpCustomBankInput ? "Other" : (newEmpForm.bankName || "")}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "Other") {
                          setShowNewEmpCustomBankInput(true);
                          setNewEmpForm({
                            ...newEmpForm,
                            bankName: "",
                          });
                        } else {
                          setShowNewEmpCustomBankInput(false);
                          const matched = [
                            { nameAr: "مصرف الراجحي", nameEn: "Al Rajhi Bank", swift: "RJHIYARI" },
                            { nameAr: "البنك الأهلي السعودي (SNB)", nameEn: "Saudi National Bank (SNB)", swift: "NCBKSARI" },
                            { nameAr: "بنك الرياض", nameEn: "Riyadh Bank", swift: "RYADKARI" },
                            { nameAr: "مصرف الإنماء", nameEn: "Alinma Bank", swift: "ALBIKARI" },
                            { nameAr: "البنك العربي الوطني", nameEn: "Arab National Bank", swift: "ARABKARI" },
                            { nameAr: "البنك السعودي الأول (SAB)", nameEn: "Saudi First Bank (SAB)", swift: "SABBKSRI" },
                            { nameAr: "بنك البلاد", nameEn: "Bank Albilad", swift: "ALBIKARI" },
                            { nameAr: "بنك الجزيرة", nameEn: "Bank AlJazira", swift: "BJAZKARI" },
                            { nameAr: "البنك السعودي للاستثمار", nameEn: "Saudi Investment Bank", swift: "BSFKKARI" },
                            { nameAr: "بنك الخليج الدولي", nameEn: "Gulf International Bank", swift: "GIBKKARI" },
                          ].find(b => b.nameAr === val || b.nameEn === val);
                          setNewEmpForm({
                            ...newEmpForm,
                            bankName: val,
                            swiftCode: matched ? matched.swift : (newEmpForm.swiftCode || ""),
                          });
                        }
                      }}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm"
                    >
                      <option value="">{lang === "ar" ? "-- اختر البنك --" : "-- Select Bank --"}</option>
                      {[
                        { nameAr: "مصرف الراجحي", nameEn: "Al Rajhi Bank" },
                        { nameAr: "البنك الأهلي السعودي (SNB)", nameEn: "Saudi National Bank (SNB)" },
                        { nameAr: "بنك الرياض", nameEn: "Riyadh Bank" },
                        { nameAr: "مصرف الإنماء", nameEn: "Alinma Bank" },
                        { nameAr: "البنك العربي الوطني", nameEn: "Arab National Bank" },
                        { nameAr: "البنك السعودي الأول (SAB)", nameEn: "Saudi First Bank (SAB)" },
                        { nameAr: "بنك البلاد", nameEn: "Bank Albilad" },
                        { nameAr: "بنك الجزيرة", nameEn: "Bank AlJazira" },
                        { nameAr: "البنك السعودي للاستثمار", nameEn: "Saudi Investment Bank" },
                        { nameAr: "بنك الخليج الدولي", nameEn: "Gulf International Bank" },
                      ].map((b, idx) => (
                        <option key={idx} value={lang === "ar" ? b.nameAr : b.nameEn}>
                          {lang === "ar" ? b.nameAr : b.nameEn}
                        </option>
                      ))}
                      <option value="Other">{lang === "ar" ? "بنك آخر / غير مدرج" : "Other / Not Listed"}</option>
                    </select>
                    {showNewEmpCustomBankInput && (
                      <input
                        type="text"
                        placeholder={lang === "ar" ? "أدخل اسم البنك يدوياً" : "Enter bank name manually"}
                        value={newEmpForm.bankName || ""}
                        onChange={(e) =>
                          setNewEmpForm({
                            ...newEmpForm,
                            bankName: e.target.value,
                          })
                        }
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-bold mt-1.5"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">
                      {lang === "ar" ? "اسم صاحب الحساب" : "Account Holder Name"}
                    </label>
                    <input
                      type="text"
                      placeholder={lang === "ar" ? "مثال: سلمان بن فيصل العتيبي" : "e.g. Salman Faisal"}
                      value={newEmpForm.accountHolderName || ""}
                      onChange={(e) =>
                        setNewEmpForm({
                          ...newEmpForm,
                          accountHolderName: e.target.value,
                        })
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm text-right font-sans"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-slate-500 font-bold">
                        {lang === "ar" ? "رقم الآيبان (IBAN)" : "IBAN (Must start with SA)"}
                      </label>
                      {newEmpForm.iban && (() => {
                        const det = detectBankFromIban(newEmpForm.iban, lang);
                        return det.matched ? (
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-100">
                            ✓ {lang === "ar" ? det.ar : det.en}
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <input
                      type="text"
                      placeholder="SA..."
                      maxLength={24}
                      value={newEmpForm.iban || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\s+/g, "").toUpperCase();
                        const det = detectBankFromIban(val, lang);
                        if (det.matched) {
                          setShowNewEmpCustomBankInput(false);
                          setNewEmpForm({
                            ...newEmpForm,
                            iban: val,
                            bankName: lang === "ar" ? det.ar : det.en,
                          });
                        } else {
                          setNewEmpForm({
                            ...newEmpForm,
                            iban: val,
                          });
                        }
                      }}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">
                      {lang === "ar" ? "رقم الحساب المحلي" : "Account Number"}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 108031580001"
                      value={newEmpForm.accountNumber || ""}
                      onChange={(e) =>
                        setNewEmpForm({
                          ...newEmpForm,
                          accountNumber: e.target.value,
                        })
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">
                      {lang === "ar" ? "رمز السويفت كود" : "SWIFT Code"}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. RJHIYARI"
                      value={newEmpForm.swiftCode || ""}
                      onChange={(e) =>
                        setNewEmpForm({
                          ...newEmpForm,
                          swiftCode: e.target.value,
                        })
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">
                      {lang === "ar" ? "طريقة التحويل المفضلة" : "Preferred Method"}
                    </label>
                    <select
                      value={newEmpForm.transferMethod || "SARIE"}
                      onChange={(e) =>
                        setNewEmpForm({
                          ...newEmpForm,
                          transferMethod: e.target.value,
                        })
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-sans"
                    >
                      <option value="SARIE">{lang === "ar" ? "تحويل نظام سريع (SARIE)" : "SARIE Transfer"}</option>
                      <option value="Local Transfer">{lang === "ar" ? "تحويل محلي عادي" : "Local Transfer"}</option>
                      <option value="Cash">{lang === "ar" ? "تسليم نقدي (Cash)" : "Cash"}</option>
                      <option value="Cheque">{lang === "ar" ? "شيك بنكي (Cheque)" : "Cheque"}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">
                    {lang === "ar" ? "ملاحظات إضافية" : "Bank Transfer Notes"}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={lang === "ar" ? "أي ملاحظات للتحويل البنكي والرواتب..." : "Any bank transfer notes..."}
                    value={newEmpForm.bankNotes || ""}
                    onChange={(e) =>
                      setNewEmpForm({
                        ...newEmpForm,
                        bankNotes: e.target.value,
                      })
                    }
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 text-xs font-black pt-4">
              <button
                type="submit"
                className="flex-1 bg-[#0072BC] hover:bg-[#0072BC]/95 text-white py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
              >
                {lang === "ar" ? "إضافة وحفظ" : "Enroll Employee"}
              </button>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </form>
        </div>
      )}
      {/* 6. AI IMPORT MODAL (استيراد بالذكاء الاصطناعي) */}
      {isAiImportOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          dir="rtl"
        >
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4 text-xs text-right">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-indigo-700 flex items-center gap-2">
                <span>🤖</span>
                {lang === "ar" ? "استيراد بيانات ذكي" : "Smart Data Import"}
              </h3>
              <button
                onClick={() => setIsAiImportOpen(false)}
                className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-500 font-medium leading-relaxed">
              {lang === "ar"
                ? "قم بلصق النص المنسوخ من الجواز أو الإقامة، أو رفع صورة لمستند (PDF/Image). الذكاء الاصطناعي سيقوم باستخراج الاسم، التواريخ، الأرقام وغيرها تلقائياً!"
                : "Paste text from a document, or upload an image/PDF. Our AI will extract all relevant information automatically."}
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="font-extrabold text-slate-700">
                  {lang === "ar"
                    ? "1. الصق نصاً أو بيانات:"
                    : "1. Paste Text/Data:"}
                </label>
                <textarea
                  value={aiImportText}
                  onChange={(e) => setAiImportText(e.target.value)}
                  placeholder={
                    lang === "ar"
                      ? "انسخ بيانات الإقامة أو الجواز والصقها هنا..."
                      : "Paste document text..."
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 h-32 focus:border-indigo-500 outline-none resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="font-extrabold text-slate-700">
                  {lang === "ar"
                    ? "2. أو ارفع صورة / مستند (PDF/Excel):"
                    : "2. Or Upload Document (PDF/Excel/Image):"}
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf,.xlsx,.xls,.csv"
                  onChange={(e) => setAiImportFile(e.target.files?.[0] || null)}
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
                  <span className="animate-pulse">
                    {lang === "ar" ? "جاري الاستخراج..." : "Extracting..."}
                  </span>
                ) : (
                  <>
                    <span>🤖</span>
                    <span>
                      {lang === "ar" ? "استخراج وتعبئة" : "Extract & Fill"}
                    </span>
                  </>
                )}
              </button>
              <button
                onClick={() => setIsAiImportOpen(false)}
                className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl transition-all cursor-pointer"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 7. CUSTOM COUNTDOWN DELETE MODAL */}
      {empToDelete && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          dir="rtl"
        >
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4 text-right">
            <div className="flex items-center gap-2 justify-end text-rose-600 pb-2 border-b">
              <span className="text-base font-black">
                {lang === "ar"
                  ? "تأكيد إزالة الموظف من الجدول"
                  : "Confirm Employee Removal"}
              </span>
              <Trash2 className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-600 font-bold leading-relaxed">
              {lang === "ar"
                ? `هل أنت متأكد من رغبتك في إزالة الموظف "${empToDelete.arabicName || empToDelete.englishName}" من النظام؟`
                : `Are you sure you want to remove employee "${empToDelete.englishName || empToDelete.arabicName}" from the system?`}
            </p>
            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-rose-700 text-[11px] space-y-1">
              <p className="font-black">
                {lang === "ar"
                  ? "⚠️ تحذير أمني هام:"
                  : "⚠️ Important Security Warning:"}
              </p>
              <p className="font-bold">
                {lang === "ar"
                  ? "هذا الإجراء سيقوم بحذف كافة سجلات وعقود وعهدات الموظف تماماً من قاعدة البيانات. الرجاء قراءة هذا التنبيه بعناية."
                  : "This action will permanently delete all records, contracts, and assets of this employee from the database. Please read this caution carefully."}
              </p>
            </div>
            <div className="flex flex-col items-center justify-center py-2">
              {deleteCountdown > 0 ? (
                <div className="flex items-center gap-2 text-indigo-600 font-black text-xs animate-pulse">
                  <span>⏳</span>
                  <span>
                    {lang === "ar"
                      ? `يرجى الانتظار والمراجعة لـ ${deleteCountdown} ثوانٍ...`
                      : `Please wait and review for ${deleteCountdown} seconds...`}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-600 font-black text-xs">
                  <span>✅</span>
                  <span>
                    {lang === "ar"
                      ? "يمكنك الآن تأكيد الحذف النهائي"
                      : "You can now confirm permanent deletion"}
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
                    ? "bg-rose-300 cursor-not-allowed opacity-75"
                    : "bg-rose-600 hover:bg-rose-700 cursor-pointer active:scale-95"
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {deleteCountdown > 0
                    ? lang === "ar"
                      ? `انتظر (${deleteCountdown}ث)`
                      : `Wait (${deleteCountdown}s)`
                    : lang === "ar"
                      ? "تأكيد الحذف النهائي"
                      : "Confirm Permanent Delete"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setEmpToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
