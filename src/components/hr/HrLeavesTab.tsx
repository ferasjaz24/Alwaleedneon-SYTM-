import React, { useState, useEffect } from "react";
import {
  Calendar,
  PlusCircle,
  Check,
  X,
  ShieldAlert,
  FileText,
  UserPlus,
  Send,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Employee, User } from "../../types";

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
  routeFrom?: string;
  routeTo?: string;
  totalEntitlements?: string;
  file1?: string;
  file2?: string;
  attachments?: { id: string; name: string; fileData: string }[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  submissionType: "self" | "hr";
}

interface HrLeavesTabProps {
  lang: "ar" | "en";
  employees: Employee[];
  user?: User | null;
  onUpdateEmployeeFields?: (
    empId: string,
    updatedFields: Partial<Employee>,
  ) => void;
}

interface VacationBalanceInputProps {
  empId: string;
  field: "vacationBalance" | "vacationUsed" | "sickUsed";
  initialValue: number;
  onSave: (empId: string, updatedFields: Partial<Employee>) => void;
  lang: "ar" | "en";
}

function VacationBalanceInput({
  empId,
  field,
  initialValue,
  onSave,
  lang,
}: VacationBalanceInputProps) {
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
    <div
      className="flex items-center justify-center gap-1.5"
      id={`balance-input-container-${empId}-${field}`}
    >
      <input
        id={`balance-input-field-${empId}-${field}`}
        type="number"
        value={val}
        onChange={(e) => setVal(Number(e.target.value))}
        onBlur={handleBlurOrSave}
        className={`w-16 px-1 py-1 text-center bg-stone-50 border rounded-lg font-bold transition-all ${
          saved
            ? "border-emerald-500 text-emerald-600 bg-emerald-50"
            : "border-slate-200 text-slate-700 focus:border-[#0072BC] focus:bg-white focus:ring-1 focus:ring-[#0072BC]"
        }`}
        title={
          lang === "ar"
            ? "اضغط خارج الخانة أو اضغط حفظ لتأكيد التغيير"
            : "Click outside or click save to confirm change"
        }
      />
      <button
        id={`balance-save-btn-${empId}-${field}`}
        type="button"
        onClick={handleBlurOrSave}
        className={`p-1 rounded-lg border transition ${
          saved
            ? "bg-emerald-50 border-emerald-200 text-emerald-600"
            : "bg-white hover:bg-slate-50 border-slate-200 text-slate-500 hover:text-[#0072BC] cursor-pointer"
        }`}
        title={lang === "ar" ? "حفظ التعديل" : "Save adjustment"}
      >
        {saved ? "✔️" : "💾"}
      </button>
    </div>
  );
}

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  lang,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  lang: "ar" | "en";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOption = options.find((o) => o.id === value);
  const filteredOptions = options.filter(
    (o) =>
      o.label.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="relative">
      <div
        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <span className="text-slate-400">▼</span>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 flex flex-col">
          <div className="p-2 border-b border-slate-100 sticky top-0 bg-white rounded-t-xl">
            <input
              type="text"
              autoFocus
              className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-[#0072BC]"
              placeholder={lang === "ar" ? "بحث..." : "Search..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-slate-400">
                {lang === "ar" ? "لا توجد نتائج" : "No results found"}
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-sky-50 ${value === opt.id ? "bg-sky-100 text-[#0072BC] font-bold" : "text-slate-700"}`}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearch("");
                  }}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AttachmentsModal({
  req,
  onClose,
  onUpdate,
  onPreview,
  lang,
  setConfirmAction,
}: {
  req: LeaveRequest;
  onClose: () => void;
  onUpdate: (req: LeaveRequest) => Promise<void>;
  onPreview: (f: string) => void;
  lang: "ar" | "en";
  setConfirmAction: (
    action: { message: string; onConfirm: () => void } | null,
  ) => void;
}) {
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newName, setNewName] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);

  const attachments = req.attachments || [];
  // Migrate legacy file1/file2 to attachments array for unified view
  const allAttachments = [...attachments];
  if (req.file1 && !allAttachments.find((a) => a.fileData === req.file1))
    allAttachments.push({
      id: "legacy-1",
      name: lang === "ar" ? "مرفق 1 (قديم)" : "Attachment 1 (Legacy)",
      fileData: req.file1,
    });
  if (req.file2 && !allAttachments.find((a) => a.fileData === req.file2))
    allAttachments.push({
      id: "legacy-2",
      name: lang === "ar" ? "مرفق 2 (قديم)" : "Attachment 2 (Legacy)",
      fileData: req.file2,
    });

  const handleUpload = () => {
    if (!newFile) return;
    const nameToUse = newName.trim() || newFile.name;
    setIsUpdating(true);
    setTargetId("uploading");
    const reader = new FileReader();
    reader.readAsDataURL(newFile);
    reader.onload = async () => {
      const newAtt = {
        id: Date.now().toString(),
        name: nameToUse,
        fileData: reader.result as string,
      };
      const updatedReq = {
        ...req,
        attachments: [...(req.attachments || []), newAtt],
      };
      await onUpdate(updatedReq);
      setNewFile(null);
      setNewName("");
      setIsUpdating(false);
      setTargetId(null);
    };
  };

  const handleDelete = async (id: string) => {
    setConfirmAction({
      message:
        lang === "ar"
          ? "هل أنت متأكد من إزالة هذا المرفق؟"
          : "Are you sure you want to remove this attachment?",
      onConfirm: async () => {
        setConfirmAction(null);
        setTargetId(id);
        setIsUpdating(true);
        let updatedReq = { ...req };
        if (id === "legacy-1") updatedReq.file1 = undefined;
        else if (id === "legacy-2") updatedReq.file2 = undefined;
        else
          updatedReq.attachments = (updatedReq.attachments || []).filter(
            (a) => a.id !== id,
          );
        await onUpdate(updatedReq);
        setIsUpdating(false);
        setTargetId(null);
      },
    });
  };

  const handleSaveEdit = async (id: string) => {
    let updatedReq = { ...req };
    setTargetId(id);
    setIsUpdating(true);
    // We cannot edit legacy file names, they will just be migrated implicitly if we wanted, but let's only allow editing actual attachments array
    if (id !== "legacy-1" && id !== "legacy-2" && updatedReq.attachments) {
      updatedReq.attachments = updatedReq.attachments.map((a) =>
        a.id === id ? { ...a, name: editingName } : a,
      );
      await onUpdate(updatedReq);
    }
    setEditingIndex(null);
    setIsUpdating(false);
    setTargetId(null);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-5 w-full max-w-lg shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0072BC]" />
            {lang === "ar" ? "إدارة المرفقات" : "Manage Attachments"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {allAttachments.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm font-semibold">
              {lang === "ar"
                ? "لا توجد مرفقات لهذه الإجازة"
                : "No attachments found for this leave"}
            </div>
          ) : (
            allAttachments.map((att, idx) => (
              <div
                key={att.id}
                className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between group"
              >
                <div className="flex-1 min-w-0 mr-2">
                  {editingIndex === idx &&
                  att.id !== "legacy-1" &&
                  att.id !== "legacy-2" ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full text-xs px-2 py-1 border border-[#0072BC] rounded"
                      autoFocus
                    />
                  ) : (
                    <p className="text-sm font-bold text-slate-700 truncate">
                      {att.name}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {editingIndex === idx &&
                  att.id !== "legacy-1" &&
                  att.id !== "legacy-2" ? (
                    <button
                      onClick={() => handleSaveEdit(att.id)}
                      disabled={isUpdating && targetId === att.id}
                      className="px-2 py-1 bg-emerald-500 disabled:bg-slate-400 text-white rounded text-xs font-bold min-w-[50px] flex items-center justify-center"
                    >
                      {isUpdating && targetId === att.id ? (
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : lang === "ar" ? (
                        "حفظ"
                      ) : (
                        "Save"
                      )}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => onPreview(att.fileData)}
                        className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-xs font-bold hover:bg-indigo-100"
                      >
                        {lang === "ar" ? "عرض" : "View"}
                      </button>
                      <a
                        href={att.fileData}
                        download={att.name}
                        className="px-2 py-1 bg-sky-50 text-[#0072BC] rounded text-xs font-bold hover:bg-sky-100"
                      >
                        {lang === "ar" ? "تحميل" : "Download"}
                      </a>
                      {att.id !== "legacy-1" && att.id !== "legacy-2" && (
                        <button
                          onClick={() => {
                            setEditingIndex(idx);
                            setEditingName(att.name);
                          }}
                          className="px-2 py-1 bg-amber-50 text-amber-600 rounded text-xs font-bold hover:bg-amber-100"
                        >
                          {lang === "ar" ? "تعديل" : "Edit"}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(att.id)}
                        disabled={isUpdating && targetId === att.id}
                        className="px-2 py-1 bg-rose-50 disabled:bg-slate-200 disabled:text-slate-500 text-rose-600 rounded text-xs font-bold hover:bg-rose-100 flex items-center gap-1 min-w-[75px] justify-center"
                      >
                        {isUpdating && targetId === att.id ? (
                          <span className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></span>
                        ) : lang === "ar" ? (
                          "إزالة الملف"
                        ) : (
                          "Remove File"
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-700 mb-2">
            {lang === "ar" ? "إضافة مرفق جديد" : "Add New Attachment"}
          </h4>
          <div className="flex gap-2 items-start">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                placeholder={
                  lang === "ar"
                    ? "اسم المرفق (اختياري)"
                    : "Attachment Name (Optional)"
                }
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
              />
              <input
                type="file"
                onChange={(e) =>
                  setNewFile(e.target.files ? e.target.files[0] : null)
                }
                className="w-full text-xs file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:bg-sky-50 file:text-[#0072BC] file:font-bold"
              />
            </div>
            <button
              onClick={handleUpload}
              disabled={!newFile || isUpdating}
              className="px-4 py-2 bg-[#0072BC] hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shrink-0 min-w-[70px] flex items-center justify-center"
            >
              {isUpdating && targetId === "uploading" ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : lang === "ar" ? (
                "رفع"
              ) : (
                "Upload"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HrLeavesTab({
  lang,
  employees,
  user,
  onUpdateEmployeeFields,
}: HrLeavesTabProps) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // HR-Initiated form states
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [leaveType, setLeaveType] = useState("Annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [routeFrom, setRouteFrom] = useState("");
  const [routeTo, setRouteTo] = useState("");
  const [totalEntitlements, setTotalEntitlements] = useState("");
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [reason, setReason] = useState("");
  const [editingLeaveId, setEditingLeaveId] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [managingAttachmentsFor, setManagingAttachmentsFor] =
    useState<LeaveRequest | null>(null);

  // Accruals simulation context
  const [accrualMonths, setAccrualMonths] = useState(0);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/leaves");
      if (res.ok) {
        let data = await res.json();
        // Sort newest first based on id (since id usually includes timestamp) or just reverse
        data = data.sort((a: any, b: any) => (b.id > a.id ? 1 : -1));
        setRequests(data);

        // Auto-update employee status based on active leaves
        if (onUpdateEmployeeFields) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          employees.forEach((emp) => {
            const activeLeave = data.find(
              (r: LeaveRequest) =>
                r.empId === emp.id &&
                r.status === "APPROVED" &&
                new Date(r.startDate) <= today &&
                new Date(r.endDate) >= today,
            );

            if (activeLeave && emp.allowances?.status !== "On Leave") {
              onUpdateEmployeeFields(emp.id, {
                allowances: emp.allowances ? { ...emp.allowances, status: "On Leave" } : { housing: 0, transport: 0, status: "On Leave" },
              });
            } else if (!activeLeave && emp.allowances?.status === "On Leave") {
              onUpdateEmployeeFields(emp.id, {
                allowances: emp.allowances ? { ...emp.allowances, status: "Active" } : { housing: 0, transport: 0, status: "Active" },
              });
            }
          });
        }
      }
    } catch (err) {
      console.error("Error fetching leaves:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleResolveLeave = async (
    id: string,
    action: "APPROVED" | "REJECTED",
  ) => {
    try {
      const res = await fetch(`/api/leaves/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
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
    setFormError("");
    setFormSuccess("");

    if (!selectedEmpId || !startDate || !endDate || !reason) {
      setFormError(
        lang === "ar"
          ? "الرجاء تعبئة كافة الحقول المطلوبة واختيار موظف."
          : "Please fill all fields and select an employee.",
      );
      return;
    }

    const emp = employees.find((e) => e.id === selectedEmpId);
    if (!emp) return;

    // Calculate duration in days
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      setFormError(
        lang === "ar"
          ? "تاريخ النهاية لا يمكن أن يكون قبل تاريخ البداية."
          : "End date cannot precede start date.",
      );
      return;
    }
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Build bilingual type label
    let type_ar = "سنوية";
    let type_en = "Annual";
    if (leaveType === "Sick") {
      type_ar = "مرضية";
      type_en = "Sick";
    } else if (leaveType === "Emergency") {
      type_ar = "طارئة";
      type_en = "Emergency";
    } else if (leaveType === "Unpaid") {
      type_ar = "بدون راتب";
      type_en = "Unpaid";
    } else if (leaveType === "Marriage") {
      type_ar = "زواج";
      type_en = "Marriage";
    } else if (leaveType === "Death") {
      type_ar = "وفاة";
      type_en = "Death";
    }

    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });
    };

    let base64File1 = "";
    let base64File2 = "";
    if (file1) base64File1 = await fileToBase64(file1);
    if (file2) base64File2 = await fileToBase64(file2);

    const payload = {
      empId: selectedEmpId,
      name: lang === "ar" ? emp.arabicName : emp.englishName,
      type_ar,
      type_en,
      durationDays,
      startDate,
      endDate,
      routeFrom,
      routeTo,
      totalEntitlements,
      ...(base64File1 && { file1: base64File1 }),
      ...(base64File2 && { file2: base64File2 }),
      reason,
      status: "APPROVED",
      submissionType: "hr",
    };

    try {
      setIsSubmitting(true);
      const url = editingLeaveId
        ? `/api/leaves/${editingLeaveId}`
        : "/api/leaves";
      const method = editingLeaveId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setFormSuccess(
          lang === "ar"
            ? "تم تسجيل الإجازة بنجاح!"
            : "Leave request registered successfully!",
        );
        setSelectedEmpId("");
        setStartDate("");
        setEndDate("");
        setReason("");
        setRouteFrom("");
        setRouteTo("");
        setTotalEntitlements("");
        setFile1(null);
        setFile2(null);
        setEditingLeaveId("");
        fetchLeaves();
      } else {
        setFormError("Failed to register leave on server.");
      }
    } catch (err) {
      console.error(err);
      setFormError("Connection error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (req: LeaveRequest) => {
    setEditingLeaveId(req.id);
    setSelectedEmpId(req.empId);
    setStartDate(req.startDate);
    setEndDate(req.endDate);
    setReason(req.reason);
    setRouteFrom(req.routeFrom || "");
    setRouteTo(req.routeTo || "");
    setTotalEntitlements(req.totalEntitlements || "");
    // Reset file inputs because we can't easily prepopulate file inputs, but they are optional when editing
    setFile1(null);
    setFile2(null);
    setFormError("");
    setFormSuccess("");

    // Set leaveType based on type_en
    if (req.type_en === "Sick") setLeaveType("Sick");
    else if (req.type_en === "Emergency") setLeaveType("Emergency");
    else if (req.type_en === "Unpaid") setLeaveType("Unpaid");
    else if (req.type_en === "Marriage") setLeaveType("Marriage");
    else if (req.type_en === "Death") setLeaveType("Death");
    else setLeaveType("Annual");

    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const handleDeleteLeave = async (id: string) => {
    setConfirmAction({
      message:
        lang === "ar"
          ? "هل أنت متأكد من حذف هذه الإجازة نهائياً؟"
          : "Are you sure you want to permanently delete this leave?",
      onConfirm: async () => {
        setConfirmAction(null);
        setDeletingId(id);
        try {
          const res = await fetch(`/api/leaves/${id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            fetchLeaves();
          }
        } catch (err) {
          console.error(err);
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const isAllowedToEdit =
    !!user &&
    (user.role === "Super Admin" ||
      user.username === "FERAS" ||
      user.role === "Senior Management" ||
      user.role === "الادارة العليا" ||
      user.role === "HR Manager" ||
      user.role === "HR" ||
      user.role === "موارد بشرية" ||
      user.role === "Admin" ||
      user.role === "إداري");

  const calculateBalances = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    // Basic settings: 30 days standard annual allowance or custom
    const annualBalance =
      emp?.vacationBalance !== undefined ? Number(emp.vacationBalance) : 30;

    // Default calculated values from requests if no custom value is stored directly
    const computedAnnualUsed = requests
      .filter(
        (r) =>
          r.empId === empId &&
          r.status === "APPROVED" &&
          r.type_en === "Annual",
      )
      .reduce((sum, r) => sum + r.durationDays, 0);

    const computedSickUsed = requests
      .filter(
        (r) =>
          r.empId === empId && r.status === "APPROVED" && r.type_en === "Sick",
      )
      .reduce((sum, r) => sum + r.durationDays, 0);

    const emergencyUsed = requests
      .filter(
        (r) =>
          r.empId === empId &&
          r.status === "APPROVED" &&
          r.type_en === "Emergency",
      )
      .reduce((sum, r) => sum + r.durationDays, 0);

    const finalAnnual = annualBalance + accrualMonths * 2.5;
    const finalAnnualUsed =
      emp?.vacationUsed !== undefined
        ? Number(emp.vacationUsed)
        : computedAnnualUsed;
    const finalSickUsed =
      emp?.sickUsed !== undefined ? Number(emp.sickUsed) : computedSickUsed;

    return {
      annual: finalAnnual,
      annualUsed: finalAnnualUsed,
      remaining: finalAnnual - finalAnnualUsed,
      sickUsed: finalSickUsed,
      emergencyUsed,
    };
  };

  return (
    <div
      id="hr-leaves-management"
      className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/50 space-y-6"
    >
      {/* Header title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-4">
        <div>
          <h4 className="text-sm font-black text-[#0072BC] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#00AEEF]" />
            {lang === "ar"
              ? "🌴 إدارة وأرصدة إجازات الموظفين"
              : "Vacation Accruals & Leave Auditing Track"}
          </h4>
          <p className="text-[11px] text-slate-400 mt-1">
            {lang === "ar"
              ? "كشوف الأرصدة التراكمية، الإجازات المرضية والطارئة، وتقديم طلبات الإجازة من قبل الإدارة."
              : "Simulate custom monthly accruals increments and review pipeline absences"}
          </p>
        </div>

        <div className="flex gap-2">
          {/* Simulated accruals incremental addition */}
          <button
            onClick={() => setAccrualMonths((p) => p + 1)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black flex items-center gap-1 shrink-0 transition"
          >
            ⏱️{" "}
            {lang === "ar"
              ? "تراكم بمعدل ٢.٥ يوم شهرياً"
              : "Simulate 2.5d Accrual Month"}
          </button>

          <button
            onClick={fetchLeaves}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
      <div className="space-y-6">
        {/* Top Section: Submit Leave Request Form (HR-Initiated) */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-lg space-y-4 text-xs font-semibold">
          <div className="pb-2 border-b border-slate-100">
            <h5 className="font-extrabold text-sm text-slate-800 flex items-center justify-between">
              <span>
                ✈️{" "}
                {lang === "ar"
                  ? editingLeaveId
                    ? "تعديل إجازة الإدارة"
                    : "إدخال إجازة من طرف الإدارة"
                  : editingLeaveId
                    ? "Edit HR Leave Dispatch"
                    : "HR Admin Leave Dispatch"}
              </span>
              {editingLeaveId && (
                <button
                  onClick={() => {
                    setEditingLeaveId("");
                    setSelectedEmpId("");
                    setStartDate("");
                    setEndDate("");
                    setReason("");
                    setRouteFrom("");
                    setRouteTo("");
                    setTotalEntitlements("");
                    setFile1(null);
                    setFile2(null);
                  }}
                  className="text-[10px] text-slate-500 hover:text-rose-500 border border-slate-200 px-2 py-1 rounded"
                >
                  {lang === "ar" ? "إلغاء التعديل" : "Cancel Edit"}
                </button>
              )}
            </h5>
            <p className="text-[10px] text-stone-400 font-normal mt-1">
              {lang === "ar"
                ? "تقديم طلب إجازة رسمي وتثبيته مباشرة بأمر الإدارة نيابة عن الموظف."
                : "Submit a direct vacation command for an employee."}
            </p>
          </div>

          <form onSubmit={handleHrSubmitLeave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Pick Employee */}
              <div className="relative">
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  {lang === "ar" ? "الموظف المستفيد *" : "Beneficiary Staff *"}
                </label>
                <SearchableSelect
                  options={employees.map((e) => ({
                    id: e.id,
                    label: `${e.id} - ${lang === "ar" ? e.arabicName : e.englishName}`,
                  }))}
                  value={selectedEmpId}
                  onChange={setSelectedEmpId}
                  placeholder={`-- ${lang === "ar" ? "اختر الموظف" : "Select Employee"} --`}
                  lang={lang}
                />
              </div>

              {/* Leave Type */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  {lang === "ar"
                    ? "نوع الإجازة المطلوبة *"
                    : "Vacation Category *"}
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Annual">
                    {lang === "ar"
                      ? "إجازة سنوية اعتيادية"
                      : "Annual Paid Leave"}
                  </option>
                  <option value="Sick">
                    {lang === "ar"
                      ? "إجازة مرضية ببيان طبي"
                      : "Sick Medical Leave"}
                  </option>
                  <option value="Emergency">
                    {lang === "ar"
                      ? "إجازة طارئة للمناسبات"
                      : "Emergency Leave"}
                  </option>
                  <option value="Unpaid">
                    {lang === "ar" ? "إجازة بدون راتب" : "Unpaid Sabbatical"}
                  </option>
                  <option value="Marriage">
                    {lang === "ar" ? "إجازة زواج للشركة" : "Marriage Leave"}
                  </option>
                  <option value="Death">
                    {lang === "ar"
                      ? "إجازة وفاة وعزاء"
                      : "Compassionate Mourning"}
                  </option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  {lang === "ar" ? "من تاريخ *" : "Start Date *"}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[#0072BC] font-mono"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  {lang === "ar" ? "إلى تاريخ *" : "End Date *"}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[#0072BC] font-mono"
                />
              </div>

              {/* Route From */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  {lang === "ar" ? "مسار الرحلة (من)" : "Travel Route (From)"}
                </label>
                <input
                  type="text"
                  value={routeFrom}
                  onChange={(e) => setRouteFrom(e.target.value)}
                  placeholder={lang === "ar" ? "مثال: الرياض" : "e.g. Riyadh"}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Route To */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  {lang === "ar" ? "مسار الرحلة (إلى)" : "Travel Route (To)"}
                </label>
                <input
                  type="text"
                  value={routeTo}
                  onChange={(e) => setRouteTo(e.target.value)}
                  placeholder={lang === "ar" ? "مثال: القاهرة" : "e.g. Cairo"}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Total Entitlements */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  {lang === "ar" ? "إجمالي المستحقات (للسفر)" : "Total Entitlements (Travel)"}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={totalEntitlements}
                    onChange={(e) => setTotalEntitlements(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                  <span className="absolute left-2 top-2 text-xs font-bold text-slate-400">SAR</span>
                </div>
              </div>

              {/* File Upload 1 */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  {lang === "ar"
                    ? "مرفق 1 (تذكرة/فيزا)"
                    : "Attachment 1 (Ticket/Visa)"}
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) =>
                    setFile1(e.target.files ? e.target.files[0] : null)
                  }
                  className="w-full text-[10px] px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-[#0072BC] file:text-white file:font-bold hover:file:bg-sky-700"
                />
              </div>

              {/* File Upload 2 */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  {lang === "ar" ? "مرفق 2 (إضافي)" : "Attachment 2 (Optional)"}
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) =>
                    setFile2(e.target.files ? e.target.files[0] : null)
                  }
                  className="w-full text-[10px] px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-[#0072BC] file:text-white file:font-bold hover:file:bg-sky-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* Total Days & Reason */}
              <div className="md:col-span-8 space-y-2">
                {startDate && endDate && (
                  <div className="bg-sky-50 text-[#0072BC] p-2 rounded-xl text-center font-bold text-xs inline-block mb-2 px-3">
                    {lang === "ar" ? "إجمالي الأيام:" : "Total Days:"}{" "}
                    {(() => {
                      const s = new Date(startDate);
                      const e = new Date(endDate);
                      if (e >= s) {
                        return (
                          Math.ceil(
                            Math.abs(e.getTime() - s.getTime()) /
                              (1000 * 60 * 60 * 24),
                          ) + 1
                        );
                      }
                      return 0;
                    })()}{" "}
                    {lang === "ar" ? "يوم" : "days"}
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">
                    {lang === "ar"
                      ? "سبب الإجازة وملاحظات تفصيلية *"
                      : "Justification details *"}
                  </label>
                  <textarea
                    placeholder={
                      lang === "ar"
                        ? "أكتب عذر الإجازة والمستندات المرفقة..."
                        : "Details representing travel plans or sick diagnostic proof..."
                    }
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Submit & Error/Success Messages */}
              <div className="md:col-span-4 space-y-2">
                {formError && (
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-bold">
                    ⚠️ {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-bold">
                    ✅ {formSuccess}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#0072BC] hover:bg-sky-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-lg shadow-[#0072BC]/10 transition flex items-center justify-center gap-1"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isSubmitting
                      ? lang === "ar"
                        ? "جاري الحفظ..."
                        : "Saving..."
                      : lang === "ar"
                        ? editingLeaveId
                          ? "حفظ التعديلات"
                          : "إصدار أمر إجازة مباشر"
                        : editingLeaveId
                          ? "Save Changes"
                          : "Dispatch Leave Command"}
                  </span>
                </button>
              </div>
            </div>
          </form>


        </div>
      </div>

      <div className="space-y-6">
        {/* Leave Requests Ledger list */}
        <div className="glass-panel p-5 bg-white rounded-3xl border border-slate-100/85">
          <h5 className="font-extrabold text-sm text-slate-800 mb-4">
            📑{" "}
            {lang === "ar"
              ? "طلبات الإجازات النشطة وقيد المراجعة"
              : "Leave Application Audit Pipeline"}
          </h5>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold bg-slate-50">
                  <th className="py-2.5 px-2 text-right">
                    {lang === "ar" ? "اسم الموظف" : "Employee Name"}
                  </th>
                  <th className="py-2.5 px-2 text-right">
                    {lang === "ar" ? "نوع الإجازة" : "Leave Type"}
                  </th>
                  <th className="py-2.5 px-2 text-center">
                    {lang === "ar" ? "من تاريخ" : "Start Date"}
                  </th>
                  <th className="py-2.5 px-2 text-center">
                    {lang === "ar" ? "إلى تاريخ" : "End Date"}
                  </th>
                  <th className="py-2.5 px-2 text-center">
                    {lang === "ar" ? "الأيام" : "Days"}
                  </th>
                  <th className="py-2.5 px-2 text-center">
                    {lang === "ar" ? "المستحقات" : "Entitlements"}
                  </th>
                  <th className="py-2.5 px-2 text-center">
                    {lang === "ar"
                      ? "تفاصيل السفر والمرفقات"
                      : "Travel & Attachments"}
                  </th>
                  <th className="py-2.5 px-2 text-right">
                    {lang === "ar" ? "السبب والتقديم" : "Reason / Creator"}
                  </th>
                  <th className="py-2.5 px-2 text-center">
                    {lang === "ar" ? "حالة الطلب" : "Status"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      {lang === "ar"
                        ? "لا توجد طلبات إجازة مضافة في السيرفر حالياً."
                        : "No active leave requests found."}
                    </td>
                  </tr>
                )}
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    className="border-b border-stone-100 hover:bg-stone-50/40 text-slate-600"
                  >
                    <td className="py-3 px-2 font-bold text-slate-800">
                      {req.name}
                    </td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-1 bg-sky-50 text-[#0072BC] rounded-lg text-[10px] font-bold">
                        {lang === "ar" ? req.type_ar : req.type_en}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-[#0072BC] font-semibold">
                      {req.startDate}
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-[#0072BC] font-semibold">
                      {req.endDate}
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-slate-800">
                      {req.durationDays} {lang === "ar" ? "يوم" : "days"}
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-emerald-600">
                      {req.totalEntitlements ? `${Number(req.totalEntitlements).toLocaleString('en-US')} SAR` : "-"}
                    </td>
                    <td className="py-3 px-2 text-center text-[10px]">
                      {(req.routeFrom || req.routeTo) && (
                        <div className="font-semibold text-slate-600 mb-1">
                          ✈️ {req.routeFrom || "?"} ➔ {req.routeTo || "?"}
                        </div>
                      )}
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => setManagingAttachmentsFor(req)}
                          className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition text-[10px] font-bold flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          {lang === "ar" ? "عرض المرفقات" : "Attachments"}
                          {(req.attachments?.length || 0) +
                            (req.file1 ? 1 : 0) +
                            (req.file2 ? 1 : 0) >
                            0 &&
                            ` (${(req.attachments?.length || 0) + (req.file1 ? 1 : 0) + (req.file2 ? 1 : 0)})`}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right max-w-xs truncate">
                      <p className="font-medium text-slate-700">{req.reason}</p>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        {req.submissionType === "hr" ? (
                          <span className="text-amber-600 font-bold">
                            🧑‍💼{" "}
                            {lang === "ar"
                              ? "مرفوع من الإدارة"
                              : "HR Execulated"}
                          </span>
                        ) : (
                          <span className="text-teal-600 font-bold">
                            👤{" "}
                            {lang === "ar"
                              ? "مرفوع من الخدمة الذاتية"
                              : "ESS Portal"}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span
                          className={`px-2 py-1 text-[10px] rounded-lg font-black uppercase inline-block ${
                            req.status === "PENDING" || !req.status
                              ? "bg-amber-100 text-amber-800"
                              : req.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {req.status === "PENDING" || !req.status
                            ? lang === "ar"
                              ? "قيد المراجعة"
                              : "Pending"
                            : req.status === "APPROVED"
                              ? lang === "ar"
                                ? "مقبولة"
                                : "Accepted"
                              : lang === "ar"
                                ? "مرفوضة"
                                : "Rejected"}
                        </span>

                        {(req.status === "PENDING" || !req.status) && (
                          <div className="flex gap-1 mt-1">
                            <button
                              onClick={() =>
                                handleResolveLeave(req.id, "APPROVED")
                              }
                              className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
                              title="Approve Request"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                handleResolveLeave(req.id, "REJECTED")
                              }
                              className="p-1.5 bg-rose-600 text-white rounded hover:bg-rose-700 transition"
                              title="Reject Request"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        {isAllowedToEdit && (
                          <div className="flex gap-1 mt-1">
                            <button
                              onClick={() => handleEditClick(req)}
                              className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] rounded font-bold hover:bg-amber-100 transition"
                            >
                              {lang === "ar" ? "تعديل الإجازة" : "Edit"}
                            </button>
                            <button
                              onClick={() => handleDeleteLeave(req.id)}
                              disabled={deletingId === req.id}
                              className="px-2 py-0.5 bg-red-50 disabled:bg-slate-200 disabled:text-slate-500 text-red-600 text-[10px] rounded font-bold hover:bg-red-100 transition flex items-center justify-center min-w-[60px]"
                            >
                              {deletingId === req.id ? (
                                <span className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></span>
                              ) : lang === "ar" ? (
                                "حذف الإجازة"
                              ) : (
                                "Delete"
                              )}
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

          {/* Leave Balances Grid */}
          <div className="glass-panel p-5 bg-white rounded-3xl border border-slate-100/85">
            <h5 className="font-extrabold text-sm text-[#0072BC] mb-4">
              🌴{" "}
              {lang === "ar"
                ? "رصيد ومُستحقات الإجازات القانونية"
                : "Annual Vacation Balances Inventory"}
            </h5>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold bg-slate-50/50">
                    <th className="py-2.5 px-2 text-right">
                      {lang === "ar" ? "الموظف" : "Employee"}
                    </th>
                    <th className="py-2.5 px-2 text-center">
                      {lang === "ar" ? "الرصيد السنوي" : "Annual Balance"}
                    </th>
                    <th className="py-2.5 px-2 text-center">
                      {lang === "ar" ? "المستهلك" : "Used"}
                    </th>
                    <th className="py-2.5 px-2 text-center text-teal-600">
                      {lang === "ar" ? "المتبقي الحالي" : "Remaining"}
                    </th>
                    <th className="py-2.5 px-2 text-center text-amber-600">
                      {lang === "ar" ? "غياب مرضي" : "Sick Leaves"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => {
                    const bal = calculateBalances(emp.id);
                    return (
                      <tr
                        key={emp.id}
                        className="border-b border-stone-100 hover:bg-stone-50/40 font-medium text-slate-700"
                      >
                        <td className="py-2.5 px-2">
                          <p className="font-bold">
                            {lang === "ar" ? emp.arabicName : emp.englishName}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {emp.id} - {emp.jobTitle}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-slate-500">
                          {isAllowedToEdit ? (
                            <VacationBalanceInput
                              empId={emp.id}
                              field="vacationBalance"
                              initialValue={
                                emp.vacationBalance !== undefined
                                  ? emp.vacationBalance
                                  : 30
                              }
                              onSave={(id, updated) =>
                                onUpdateEmployeeFields?.(id, updated)
                              }
                              lang={lang}
                            />
                          ) : (
                            <span>
                              {bal.annual} {lang === "ar" ? "يوم" : "days"}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-rose-500">
                          {isAllowedToEdit ? (
                            <VacationBalanceInput
                              empId={emp.id}
                              field="vacationUsed"
                              initialValue={bal.annualUsed}
                              onSave={(id, updated) =>
                                onUpdateEmployeeFields?.(id, updated)
                              }
                              lang={lang}
                            />
                          ) : (
                            <span>
                              {bal.annualUsed} {lang === "ar" ? "يوم" : "days"}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-teal-600 bg-teal-50/30">
                          <span className="px-2 py-1 rounded bg-teal-50 text-teal-700 font-extrabold font-mono">
                            {bal.remaining} {lang === "ar" ? "يوم" : "days"}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-600">
                          {isAllowedToEdit ? (
                            <VacationBalanceInput
                              empId={emp.id}
                              field="sickUsed"
                              initialValue={bal.sickUsed}
                              onSave={(id, updated) =>
                                onUpdateEmployeeFields?.(id, updated)
                              }
                              lang={lang}
                            />
                          ) : (
                            <span>
                              {bal.sickUsed} {lang === "ar" ? "أيام" : "days"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Attachments Management Modal */}
      {managingAttachmentsFor && (
        <AttachmentsModal
          req={managingAttachmentsFor}
          onClose={() => setManagingAttachmentsFor(null)}
          setConfirmAction={setConfirmAction}
          onUpdate={async (updatedReq) => {
            try {
              const res = await fetch(`/api/leaves/${updatedReq.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedReq),
              });
              if (res.ok) {
                setManagingAttachmentsFor(updatedReq);
                fetchLeaves();
              }
            } catch (e) {
              console.error(e);
            }
          }}
          onPreview={(file) => setPreviewFile(file)}
          lang={lang}
        />
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-white rounded-3xl p-2 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">
                {lang === "ar" ? "معاينة المرفق" : "Preview Attachment"}
              </h3>
              <div className="flex gap-2 items-center">
                <a
                  href={previewFile}
                  download="attachment"
                  className="text-xs px-3 py-1.5 bg-[#0072BC] text-white rounded-xl font-bold hover:bg-sky-700"
                >
                  {lang === "ar" ? "تحميل" : "Download"}
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-1 hover:bg-slate-100 rounded-full text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-2 flex items-center justify-center bg-slate-50 rounded-b-2xl min-h-[50vh]">
              {previewFile.startsWith("data:image") ||
              previewFile.match(/\.(jpeg|jpg|gif|png)$/i) != null ? (
                <img
                  src={previewFile}
                  alt="Attachment"
                  className="max-w-full max-h-[75vh] object-contain rounded-lg"
                />
              ) : previewFile.startsWith("data:application/pdf") ||
                previewFile.match(/\.pdf$/i) != null ? (
                <iframe
                  src={previewFile}
                  className="w-full h-[75vh] rounded-lg border-none bg-white"
                  title="PDF Preview"
                />
              ) : (
                <div className="text-center text-slate-500">
                  <p className="mb-2">
                    {lang === "ar"
                      ? "لا يمكن معاينة هذا النوع من الملفات"
                      : "Cannot preview this file type"}
                  </p>
                  <a
                    href={previewFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0072BC] underline font-bold px-4 py-2 block"
                  >
                    {lang === "ar" ? "فتح في نافذة جديدة" : "Open in new tab"}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 leading-snug">
                {confirmAction.message}
              </h3>
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition text-sm"
                >
                  {lang === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  onClick={confirmAction.onConfirm}
                  className="flex-1 px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition text-sm"
                >
                  {lang === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
