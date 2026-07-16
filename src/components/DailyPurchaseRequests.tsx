import React, { useState, useEffect } from "react";
import { 
  Search, 
  Calendar, 
  Plus, 
  Printer, 
  Trash2, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  FileText, 
  ShoppingBag, 
  X,
  RefreshCw,
  Bell
} from "lucide-react";
import { hasAdvancedPermission } from "../lib/permissions";
import { sharedPrintHeader, sharedPrintFooter, sharedPrintStyles } from "../utils/PrintShared";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

interface DailyPurchaseRequestsProps {
  lang: "ar" | "en";
  user: any;
}

interface DailyRequestItem {
  id: string;
  requestNumber: string;
  date: string;
  type: "materials" | "other";
  source: "manual" | "procurement_system";
  status: "بانتظار التأكيد من المالية" | "تم التأكيد والدفع من المالية" | "مرفوض";
  itemName?: string;
  materialId?: string;
  qty?: number;
  unitPrice?: number;
  totalAmount: number;
  reason?: string;
  notes?: string;
  rejectReason?: string;
  userCreated: string;
  originalPoId?: string;
  projectName?: string;
  itemsList?: Array<{
    itemName: string;
    qty: number;
    unitPrice: number;
    total: number;
  }>;
  updatesLog?: Array<{
    user: string;
    action: string;
    timestamp: string;
  }>;
}

export default function DailyPurchaseRequests({ lang, user }: DailyPurchaseRequestsProps) {
  const [requests, setRequests] = useState<DailyRequestItem[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchDate, setSearchDate] = useState("");
  const [searchNumber, setSearchNumber] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DailyRequestItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<DailyRequestItem | null>(null);
  const [showConfirmDisburse, setShowConfirmDisburse] = useState(false);
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);
  const [rejectionReasonText, setRejectionReasonText] = useState("");

  // Form state
  const [formType, setFormType] = useState<"materials" | "other">("materials");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [customItemName, setCustomItemName] = useState("");
  const [formQty, setFormQty] = useState<number>(1);
  const [formUnitPrice, setFormUnitPrice] = useState<number>(0);
  const [formReason, setFormReason] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formQuotationRecord, setFormQuotationRecord] = useState("");

  // Multi-item builder state
  const [formItems, setFormItems] = useState<Array<{
    itemName: string;
    qty: number;
    unitPrice: number;
    total: number;
    materialId?: string;
  }>>([]);

  const resetFormState = () => {
    setSelectedMaterialId("");
    setCustomItemName("");
    setFormQty(1);
    setFormUnitPrice(0);
    setFormReason("");
    setFormNotes("");
    setFormQuotationRecord("");
    setFormItems([]);
  };

  const handleAddFormItem = () => {
    let itemName = "";
    if (formType === "materials") {
      const selectedMat = materials.find(m => m.id === selectedMaterialId);
      if (!selectedMat) {
        alert(lang === "ar" ? "الرجاء اختيار مادة من المستودع" : "Please select a material from the warehouse.");
        return;
      }
      itemName = selectedMat.itemNameAr || selectedMat.nameAr || selectedMat.name || selectedMat.itemName;
    } else {
      if (!customItemName.trim()) {
        alert(lang === "ar" ? "الرجاء إدخال اسم الصنف/الشيء المراد شراؤه" : "Please enter the item description.");
        return;
      }
      itemName = customItemName.trim();
    }

    if (formQty <= 0) {
      alert(lang === "ar" ? "الرجاء إدخال كمية صحيحة" : "Please enter a valid quantity.");
      return;
    }

    if (formUnitPrice < 0) {
      alert(lang === "ar" ? "الرجاء إدخال سعر صحيح" : "Please enter a valid price.");
      return;
    }

    const newItem = {
      itemName,
      qty: Number(formQty),
      unitPrice: Number(formUnitPrice),
      total: Number(formQty) * Number(formUnitPrice),
      materialId: formType === "materials" ? selectedMaterialId : undefined
    };

    setFormItems([...formItems, newItem]);
    
    // Reset individual item inputs, keep global inputs like date/reason/notes
    setSelectedMaterialId("");
    setCustomItemName("");
    setFormQty(1);
    setFormUnitPrice(0);
  };

  const handleRemoveFormItem = (index: number) => {
    setFormItems(formItems.filter((_, idx) => idx !== index));
  };

  // Print modal / settings state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printMonth, setPrintMonth] = useState(new Date().toISOString().slice(5, 7)); // e.g., "07"
  const [printYear, setPrintYear] = useState(new Date().getFullYear().toString());

  // Check permissions
  const canAdd = hasAdvancedPermission(user, "procurement", "daily_purchases", "add_daily_purchase");
  const canDelete = hasAdvancedPermission(user, "procurement", "daily_purchases", "delete_daily_purchase");
  const canConfirmFinance = hasAdvancedPermission(user, "procurement", "daily_purchases", "confirm_finance_daily");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dynamic/daily_purchase_requests?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Sort by date newest first, then requestNumber
          const sorted = data.sort((a, b) => {
            const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
            if (dateCompare !== 0) return dateCompare;
            return b.requestNumber.localeCompare(a.requestNumber);
          });
          setRequests(sorted);
        }
      }
    } catch (error) {
      console.error("Error fetching daily purchases:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const res = await fetch(`/api/dynamic/materials_warehouse?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setMaterials(data);
        }
      }
    } catch (error) {
      console.error("Error fetching materials warehouse:", error);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchMaterials();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      alert(lang === "ar" ? "ليس لديك صلاحية لإضافة طلبات شراء يومية" : "You do not have permission to add daily purchase requests.");
      return;
    }

    let finalItems = [...formItems];

    // Fallback: if list is empty, try to add the currently entered item fields
    if (finalItems.length === 0) {
      let finalItemName = "";
      if (formType === "materials") {
        const selectedMat = materials.find(m => m.id === selectedMaterialId);
        if (selectedMat) {
          finalItemName = selectedMat.itemNameAr || selectedMat.nameAr || selectedMat.name || selectedMat.itemName;
        }
      } else {
        finalItemName = customItemName.trim();
      }

      if (finalItemName && formQty > 0 && formUnitPrice >= 0) {
        finalItems.push({
          itemName: finalItemName,
          qty: Number(formQty),
          unitPrice: Number(formUnitPrice),
          total: Number(formQty) * Number(formUnitPrice),
          materialId: formType === "materials" ? selectedMaterialId : undefined
        });
      }
    }

    if (finalItems.length === 0) {
      alert(lang === "ar" ? "الرجاء إضافة صنف واحد على الأقل للطلب" : "Please add at least one item to the request.");
      return;
    }

    if (!formReason.trim()) {
      alert(lang === "ar" ? "الرجاء كتابة السبب والمبرر للطلب" : "Please specify the reason/justification.");
      return;
    }

    // Generate Request Number (BRQ + Year(2 digits) + Month(first 3 letters) + 3 digits serial)
    const d = new Date(formDate);
    const yearShort = String(d.getFullYear()).slice(-2);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbr = monthNames[d.getMonth()];
    
    const prefix = `BRQ${yearShort}${monthAbbr}-`;
    const monthlyRequests = requests.filter(r => r.requestNumber?.startsWith(`BRQ${yearShort}${monthAbbr}`));
    const serial = String(monthlyRequests.length + 1).padStart(3, "0");
    const requestNumber = `${prefix}${serial}`;

    const totalAmount = finalItems.reduce((sum, item) => sum + item.total, 0);

    // Primary item name represents the request in lists
    let primaryItemName = "";
    if (finalItems.length === 1) {
      primaryItemName = finalItems[0].itemName;
    } else {
      primaryItemName = `${finalItems[0].itemName} ... (+${finalItems.length - 1} أصناف أخرى)`;
    }

    const payload: Omit<DailyRequestItem, "id"> & { quotationRecord?: string } = {
      requestNumber,
      date: formDate,
      type: formType,
      source: "manual",
      status: "بانتظار التأكيد من المالية",
      itemName: primaryItemName,
      qty: finalItems.length === 1 ? finalItems[0].qty : 1,
      unitPrice: finalItems.length === 1 ? finalItems[0].unitPrice : totalAmount,
      totalAmount: totalAmount,
      reason: formReason,
      notes: formNotes,
      quotationRecord: formQuotationRecord,
      itemsList: finalItems.map(item => ({
        itemName: item.itemName,
        qty: item.qty,
        unitPrice: item.unitPrice,
        total: item.total
      })),
      userCreated: user?.username || "system",
      updatesLog: [
        {
          user: user?.username || "system",
          action: "إنشاء طلب الشراء اليومي يدوياً",
          timestamp: new Date().toISOString()
        }
      ]
    };

    try {
      const uniqueId = `DP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const res = await fetch("/api/dynamic/daily_purchase_requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: uniqueId, ...payload }),
      });

      if (res.ok) {
        // Post a system notification for the finance department
        try {
          await fetch("/api/dynamic/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: `NOTIF-${Date.now()}`,
              title: "طلب شراء يومي جديد",
              titleEn: "New Daily Purchase Request",
              message: `تم إنشاء طلب شراء يومي جديد برقم ${requestNumber} بواسطة ${user?.username || "المستخدم"} بانتظار التأكيد المالي.`,
              messageEn: `New daily purchase request ${requestNumber} created by ${user?.username || "user"} pending finance confirmation.`,
              category: "finance",
              timestamp: new Date().toISOString(),
              readBy: []
            })
          });
        } catch (errNotif) {
          console.error("Error creating notification:", errNotif);
        }

        resetFormState();
        setShowAddModal(false);
        fetchRequests();
      } else {
        alert(lang === "ar" ? "فشل حفظ الطلب" : "Failed to save the request.");
      }
    } catch (error) {
      console.error("Error creating request:", error);
      alert(lang === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred.");
    }
  };

  const handleUpdateStatus = async (reqId: string, nextStatus: "تم التأكيد والدفع من المالية" | "مرفوض", reasonOfRejection?: string) => {
    if (!canConfirmFinance) {
      alert(lang === "ar" ? "ليس لديك صلاحية لاعتماد أو رفض طلبات الشراء مالياً" : "You do not have permission to approve/reject daily purchases.");
      return;
    }

    try {
      const currentReq = requests.find(r => r.id === reqId);
      const existingLog = currentReq?.updatesLog || [];
      
      let actionDesc = "";
      if (nextStatus === "تم التأكيد والدفع من المالية") {
        actionDesc = lang === "ar" ? "تم التأكيد والدفع والاعتماد المالي" : "Paid & Confirmed by Finance";
      } else {
        actionDesc = lang === "ar" ? `تم رفض الطلب من المالية. السبب: ${reasonOfRejection || 'غير محدد'}` : `Rejected by Finance. Reason: ${reasonOfRejection || 'not specified'}`;
      }

      const newLogEntry = {
        user: user?.username || "finance",
        action: actionDesc,
        timestamp: new Date().toISOString()
      };

      const updatedLog = [...existingLog, newLogEntry];

      // If nextStatus is "تم التأكيد والدفع من المالية", generate the Draft Journal Entry
      if (nextStatus === "تم التأكيد والدفع من المالية" && currentReq) {
        const jvId = `JV_DPR_${reqId}`;
        const journalEntryNo = `JV-${currentReq.requestNumber}`;
        const jvDate = currentReq.date || new Date().toISOString().split("T")[0];
        
        const jvPayload = {
          id: jvId,
          journalEntryNo,
          date: jvDate,
          sourceModule: "مشتريات يومية",
          sourceId: reqId,
          description: lang === "ar"
            ? `صرف مشتريات يومية رقم ${currentReq.requestNumber} - صنف: ${currentReq.itemName || "أصناف متنوعة"}`
            : `Daily Purchases Disbursed #${currentReq.requestNumber} - item: ${currentReq.itemName || "misc"}`,
          status: "Draft",
          totalDebit: Number(currentReq.totalAmount || 0),
          totalCredit: Number(currentReq.totalAmount || 0),
          isBalanced: true,
          cashBankApplied: false,
          createdAt: new Date().toISOString(),
          createdBy: user?.username || "finance",
          createdByName: user?.username || "Finance User",
          lines: [
            {
              id: `JV_L_${reqId}_1`,
              lineNo: 1,
              accountType: "Expense",
              accountCode: "5010",
              accountName: lang === "ar" ? "مصروفات مشتريات يومية" : "Daily Purchases Expenses",
              debit: Number(currentReq.totalAmount || 0),
              credit: 0,
              description: lang === "ar"
                ? `مصروف مشتريات يومية: ${currentReq.itemName || "صنف مشتريات"}`
                : `Daily Purchases Expense: ${currentReq.itemName || "purchased item"}`
            },
            {
              id: `JV_L_${reqId}_2`,
              lineNo: 2,
              accountType: "Accounts Payable",
              accountCode: "2205",
              accountName: lang === "ar" ? "مستحقات مشتريات يومية" : "Accrued Daily Purchases",
              debit: 0,
              credit: Number(currentReq.totalAmount || 0),
              description: lang === "ar"
                ? `إثبات مستحقات مشتريات يومية رقم ${currentReq.requestNumber}`
                : `Accrued Daily Purchases Liability #${currentReq.requestNumber}`
            }
          ]
        };

        try {
          await setDoc(doc(db, "journal_entries", jvId), jvPayload);
        } catch (jeErr) {
          console.error("Failed to create automated draft Journal Entry:", jeErr);
        }
      }

      const res = await fetch(`/api/dynamic/daily_purchase_requests/${reqId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: nextStatus,
          updatesLog: updatedLog,
          rejectReason: nextStatus === "مرفوض" ? (reasonOfRejection || "") : (currentReq?.rejectReason || "")
        }),
      });

      if (res.ok) {
        // Also update selectedRequest view if open
        if (selectedRequest && selectedRequest.id === reqId) {
          setSelectedRequest({ 
            ...selectedRequest, 
            status: nextStatus, 
            updatesLog: updatedLog,
            rejectReason: nextStatus === "مرفوض" ? (reasonOfRejection || "") : (selectedRequest.rejectReason || "")
          });
        }
        fetchRequests();
      } else {
        alert(lang === "ar" ? "فشل تحديث حالة الطلب" : "Failed to update the status.");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDeleteRequest = async () => {
    if (!requestToDelete) return;
    if (!canDelete) {
      alert(lang === "ar" ? "صلاحية الحذف مخصصة للإدارة فقط" : "Delete capability is restricted to management only.");
      return;
    }

    try {
      const res = await fetch(`/api/dynamic/daily_purchase_requests/${requestToDelete.id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setShowDeleteConfirm(false);
        setRequestToDelete(null);
        setSelectedRequest(null);
        setShowDetailModal(false);
        fetchRequests();
      } else {
        alert(lang === "ar" ? "فشل حذف الطلب" : "Failed to delete the request.");
      }
    } catch (error) {
      console.error("Error deleting request:", error);
    }
  };

  const triggerDeleteConfirm = (req: DailyRequestItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setRequestToDelete(req);
    setShowDeleteConfirm(true);
  };

  // Printing monthly report
  const handlePrintSummary = () => {
    // Filter requests for the selected month and year
    const filtered = requests.filter(r => {
      if (!r.date) return false;
      const rYear = r.date.slice(0, 4);
      const rMonth = r.date.slice(5, 7);
      return rYear === printYear && rMonth === printMonth;
    });

    if (filtered.length === 0) {
      alert(lang === "ar" ? "لا توجد طلبات شراء مسجلة في هذا الشهر لتوليد التقرير" : "No requests found for the selected month/year.");
      return;
    }

    const totalSpent = filtered.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
    const confirmedCount = filtered.filter(r => r.status === "تم التأكيد والدفع من المالية").length;
    const pendingCount = filtered.filter(r => r.status === "بانتظار التأكيد من المالية").length;
    const rejectedCount = filtered.filter(r => r.status === "مرفوض").length;

    // Build print HTML table
    const tableRows = filtered.map((r, idx) => {
      let itemDesc = r.source === "procurement_system" 
        ? `${r.itemName} (${lang === "ar" ? "نظام المشتريات" : "Procurement"})`
        : r.itemName;
      
      // If there are detailed items, render them beautifully
      if (r.itemsList && r.itemsList.length > 0) {
        const listItemsHtml = r.itemsList.map(item => {
          return `<li style="font-size: 10px; color: #475569; margin-top: 2px;">
            ${item.itemName} (${item.qty} × SAR ${Number(item.unitPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}) = <strong>SAR ${Number(item.total).toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
          </li>`;
        }).join("");
        itemDesc += `<ul style="margin: 4px 0 0 0; padding-right: 15px; list-style-type: square; font-size: 10.5px;">${listItemsHtml}</ul>`;
      }
      
      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: bold; text-align: center;">${r.requestNumber}</td>
          <td style="text-align: center;">${r.date}</td>
          <td>
            <strong>${itemDesc}</strong>
            ${r.projectName ? `<br/><small style="color: #64748b;">المشروع: ${r.projectName}</small>` : ""}
            ${r.reason ? `<br/><small style="color: #8b5cf6;">السبب/الكوتيشن: ${r.reason}</small>` : ""}
          </td>
          <td style="text-align: center;">${r.qty || 1}</td>
          <td style="text-align: right; font-family: monospace;">SAR ${Number(r.unitPrice || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
          <td style="text-align: right; font-family: monospace; font-weight: bold;">SAR ${Number(r.totalAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
          <td style="text-align: center; font-weight: bold;">${r.status}</td>
        </tr>
      `;
    }).join("");

    const monthNamesAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const monthArName = monthNamesAr[parseInt(printMonth) - 1] || "";

    const htmlContent = `
      <div style="direction: rtl; font-family: 'GE SS Two', 'Gotham Pro', sans-serif;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="font-size: 20px; font-weight: bold; color: #1e3a8a; margin: 0; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; display: inline-block;">
            ملخص وتقرير طلبات الشراء اليومية لشهـر ${monthArName} ${printYear}
          </h2>
          <p style="font-size: 11px; color: #64748b; margin-top: 6px;">تاريخ إصدار التقرير: ${new Date().toISOString().slice(0, 10)} | مصدر البيانات: الشؤون المالية والمشتريات</p>
        </div>

        <!-- Metrics cards -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;">
          <div style="border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; text-align: center; background-color: #f8fafc;">
            <div style="font-size: 11px; color: #64748b; font-weight: bold;">إجمالي المبالغ المطلوبة</div>
            <div style="font-size: 18px; font-weight: 900; color: #1e3a8a; margin-top: 4px; font-family: monospace;">SAR ${totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
          </div>
          <div style="border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; text-align: center; background-color: #f0fdf4; border-color: #bbf7d0;">
            <div style="font-size: 11px; color: #166534; font-weight: bold;">تم الدفع والتأكيد</div>
            <div style="font-size: 18px; font-weight: 900; color: #15803d; margin-top: 4px;">${confirmedCount} طلب</div>
          </div>
          <div style="border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; text-align: center; background-color: #fffbeb; border-color: #fef08a;">
            <div style="font-size: 11px; color: #854d0e; font-weight: bold;">قيد الانتظار</div>
            <div style="font-size: 18px; font-weight: 900; color: #a16207; margin-top: 4px;">${pendingCount} طلب</div>
          </div>
          <div style="border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; text-align: center; background-color: #fef2f2; border-color: #fecaca;">
            <div style="font-size: 11px; color: #991b1b; font-weight: bold;">الطلبات المرفوضة</div>
            <div style="font-size: 18px; font-weight: 900; color: #dc2626; margin-top: 4px;">${rejectedCount} طلب</div>
          </div>
        </div>

        <!-- Details table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">م</th>
              <th style="width: 15%; text-align: center;">رقم الطلب</th>
              <th style="width: 12%; text-align: center;">التاريخ</th>
              <th style="width: 30%; text-align: right;">البيان وصنف المادة</th>
              <th style="width: 8%; text-align: center;">الكمية</th>
              <th style="width: 12%; text-align: right;">سعر الوحدة</th>
              <th style="width: 12%; text-align: right;">الإجمالي (شامل ضريبة)</th>
              <th style="width: 10%; text-align: center;">الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            <tr class="total-row">
              <td colspan="6" style="text-align: left; padding: 12px; font-size: 13px;">المجموع الإجمالي للتقرير:</td>
              <td style="text-align: right; padding: 12px; font-size: 14px; font-family: monospace; font-weight: 900; color: #1e3a8a;">SAR ${totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <!-- Signatures Section -->
        <div class="signatures-grid">
          <div class="signature-block">
            <div class="signature-title">إعداد: مسؤول المشتريات</div>
            <div style="margin-top: 25px; margin-bottom: 5px; height: 1px; background: transparent;"></div>
            <div class="signature-line">التوقيع والتاريخ</div>
          </div>
          <div class="signature-block">
            <div class="signature-title">مراجعة وتأكيد: المدير المالي</div>
            <div style="margin-top: 25px; margin-bottom: 5px; height: 1px; background: transparent;"></div>
            <div class="signature-line">التوقيع والتاريخ</div>
          </div>
          <div class="signature-block">
            <div class="signature-title">اعتماد: المدير العام للشركة</div>
            <div style="margin-top: 25px; margin-bottom: 5px; height: 1px; background: transparent;"></div>
            <div class="signature-line">التوقيع والختم الرسمي</div>
          </div>
        </div>
      </div>
    `;

    const fullHtmlDocument = `
      <html>
        <head>
          <title>Print Monthly Report</title>
          <style>
            ${sharedPrintStyles}
            body {
              font-family: 'GE SS Two', 'Gotham Pro', sans-serif;
              padding: 20px;
              direction: rtl;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              margin-bottom: 30px;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 10px;
              text-align: right;
              font-size: 11px;
              line-height: 1.4;
            }
            th {
              background-color: #f1f5f9 !important;
              font-weight: bold;
              color: #0f172a;
            }
            .total-row {
              background-color: #e2e8f0 !important;
              font-weight: bold;
            }
            .signatures-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-top: 40px;
              margin-bottom: 30px;
              text-align: center;
            }
            .signature-block {
              border: 1px dashed #94a3b8;
              padding: 12px;
              border-radius: 6px;
              background-color: #fafafa;
            }
            .signature-title {
              font-weight: bold;
              font-size: 12px;
              margin-bottom: 35px;
              color: #334155;
            }
            .signature-line {
              border-top: 1px solid #475569;
              width: 80%;
              margin: 0 auto;
              padding-top: 5px;
              font-size: 10px;
              color: #475569;
            }
          </style>
        </head>
        <body>
          ${sharedPrintHeader}
          ${htmlContent}
          ${sharedPrintFooter}
        </body>
      </html>
    `;

    // Attempt to open in a new tab/window for external viewing & printing
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(fullHtmlDocument);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    } else {
      // Fallback: Fire custom iframe print layout if new tab is blocked by browser/iframe
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.width = "0px";
      iframe.style.height = "0px";
      iframe.style.border = "none";
      document.body.appendChild(iframe);
      
      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(fullHtmlDocument);
        doc.close();
        
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          document.body.removeChild(iframe);
        }, 500);
      }
    }

    setShowPrintModal(false);
  };

  // Group or Filter items
  const filteredRequests = requests.filter(r => {
    // Search Number filter
    if (searchNumber.trim() !== "") {
      if (!r.requestNumber?.toLowerCase().includes(searchNumber.toLowerCase())) {
        return false;
      }
    }
    // Search Date filter
    if (searchDate.trim() !== "") {
      if (!r.date?.includes(searchDate)) {
        return false;
      }
    }
    // Status filter
    if (statusFilter !== "all" && r.status !== statusFilter) {
      return false;
    }
    // Type filter
    if (typeFilter !== "all" && r.type !== typeFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="bg-[#fcfdfd] border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-[#0072BC]" />
            {lang === "ar" ? "طلبات الشراء اليومية" : "Daily Purchase Requests"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {lang === "ar" 
              ? "متابعة وإثبات طلبات الشراء النقدية والمواد اليومية والمصروفات بالتنسيق مع الشؤون المالية" 
              : "Manage and track daily cash purchases, side-materials, and internal requisitions with Finance integration."}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-center">
          <button
            onClick={() => fetchRequests()}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition duration-150"
            title={lang === "ar" ? "تحديث البيانات" : "Refresh"}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl transition duration-150 text-xs shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-700" />
            {lang === "ar" ? "تقرير المبالغ والملخص الشهري" : "Monthly Summary & Print"}
          </button>

          {canAdd && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-[#0072BC] hover:bg-[#0072BC]/90 text-white font-extrabold px-4 py-2.5 rounded-xl transition duration-150 text-xs shadow-md shadow-[#0072BC]/10"
            >
              <Plus className="w-4 h-4" />
              {lang === "ar" ? "إضافة طلب شرائي" : "Add Purchase Request"}
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
        
        {/* Search by Request Number */}
        <div className="relative">
          <label className="block text-[10px] font-bold text-slate-500 mb-1">
            {lang === "ar" ? "البحث برقم الطلب" : "Search by Request Number"}
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. PR26JUL0001"
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value)}
              className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 focus:border-[#0072BC] text-left font-mono bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        {/* Search by Day/Date */}
        <div className="relative">
          <label className="block text-[10px] font-bold text-slate-500 mb-1">
            {lang === "ar" ? "تصفية باليوم/التاريخ" : "Filter by Day/Date"}
          </label>
          <div className="relative">
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 focus:border-[#0072BC] bg-white"
            />
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        {/* Filter by Status */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1">
            {lang === "ar" ? "حالة الطلب المالي" : "Finance Status"}
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 focus:border-[#0072BC] bg-white"
          >
            <option value="all">{lang === "ar" ? "جميع الحالات" : "All Statuses"}</option>
            <option value="بانتظار التأكيد من المالية">{lang === "ar" ? "بانتظار التأكيد من المالية" : "Pending Finance"}</option>
            <option value="تم التأكيد والدفع من المالية">{lang === "ar" ? "تم تأكيد الصرف" : "Disbursement Confirmed"}</option>
            <option value="مرفوض">{lang === "ar" ? "مرفوض" : "Rejected"}</option>
          </select>
        </div>

        {/* Filter by Type */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1">
            {lang === "ar" ? "نوع طلب الشراء" : "Purchase Type"}
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 focus:border-[#0072BC] bg-white"
          >
            <option value="all">{lang === "ar" ? "جميع الأنواع" : "All Types"}</option>
            <option value="materials">{lang === "ar" ? "مواد من المستودع" : "Warehouse Materials"}</option>
            <option value="other">{lang === "ar" ? "داخلي/عام/أخرى" : "Other Requisitions"}</option>
          </select>
        </div>

      </div>

      {/* Requests Table/Grid List */}
      <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-2">
            <RefreshCw className="w-8 h-8 text-[#0072BC] animate-spin" />
            <p className="text-xs text-slate-400 font-bold">{lang === "ar" ? "جاري تحميل سجلات الشراء..." : "Loading purchase records..."}</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 mb-3 text-slate-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <p className="text-sm font-extrabold text-slate-700">{lang === "ar" ? "لا توجد أي طلبات شراء مطابقة" : "No matching purchase requests found"}</p>
            <p className="text-xs text-slate-400 mt-1">{lang === "ar" ? "يرجى تعديل محددات البحث أو إضافة طلب جديد" : "Adjust your search filters or create a new request."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-150 text-xs font-black">
                  <th className="py-3.5 px-4 text-center">{lang === "ar" ? "رقم الطلب" : "Request No."}</th>
                  <th className="py-3.5 px-4 text-center">{lang === "ar" ? "التاريخ" : "Date"}</th>
                  <th className="py-3.5 px-4">{lang === "ar" ? "نوع الطلب والبيان" : "Type & Item Detail"}</th>
                  <th className="py-3.5 px-4 text-center">{lang === "ar" ? "الكمية" : "Qty"}</th>
                  <th className="py-3.5 px-4 text-left">{lang === "ar" ? "سعر الوحدة" : "Unit Price"}</th>
                  <th className="py-3.5 px-4 text-left">{lang === "ar" ? "الإجمالي" : "Total (with Tax)"}</th>
                  <th className="py-3.5 px-4 text-center">{lang === "ar" ? "حالة الدفع" : "Status"}</th>
                  <th className="py-3.5 px-4 text-center">{lang === "ar" ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredRequests.map((req) => (
                  <tr 
                    key={req.id} 
                    className="hover:bg-slate-50/50 transition cursor-pointer"
                    onClick={() => {
                      setSelectedRequest(req);
                      setShowDetailModal(true);
                    }}
                  >
                    {/* Request No. */}
                    <td className="py-4 px-4 text-center font-mono font-bold text-slate-900">
                      {req.requestNumber}
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 text-center text-slate-500 whitespace-nowrap">
                      {req.date}
                    </td>

                    {/* Type and Item Description */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-slate-800 text-[13px]">{req.itemName}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                            req.type === "materials" 
                              ? "bg-blue-50 text-blue-700" 
                              : "bg-purple-50 text-purple-700"
                          }`}>
                            {req.type === "materials" 
                              ? (lang === "ar" ? "مواد مستودع" : "Warehouse Material") 
                              : (lang === "ar" ? "صنف جانبي/أخرى" : "Other Expense")}
                          </span>
                          
                          {req.source === "procurement_system" && (
                            <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-black">
                              {lang === "ar" ? "تلقائي من المشتريات" : "Auto Procurement"}
                            </span>
                          )}
                          
                          {req.projectName && (
                            <span className="text-[10px] text-slate-400 font-sans">
                              {req.projectName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Qty */}
                    <td className="py-4 px-4 text-center text-slate-950 font-sans font-bold">
                      {req.qty || 1}
                    </td>

                    {/* Unit Price */}
                    <td className="py-4 px-4 text-left font-sans font-bold text-slate-600">
                      SAR {Number(req.unitPrice || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Total Amount */}
                    <td className="py-4 px-4 text-left font-sans font-black text-slate-900 text-[13px]">
                      SAR {Number(req.totalAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Finance Status */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold ${
                        req.status === "تم التأكيد والدفع من المالية"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : req.status === "مرفوض"
                          ? "bg-rose-50 text-rose-700 border border-rose-100"
                          : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}>
                        {req.status === "تم التأكيد والدفع من المالية" ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            {lang === "ar" ? "تم تأكيد الصرف" : "Disbursement Confirmed"}
                          </>
                        ) : req.status === "مرفوض" ? (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            {lang === "ar" ? "مرفوض ماليًا" : "Rejected"}
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5" />
                            {lang === "ar" ? "بانتظار التأكيد ماليًا" : "Awaiting Finance"}
                          </>
                        )}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setShowDetailModal(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-[#0072BC] hover:bg-slate-100 rounded-lg transition"
                          title={lang === "ar" ? "معاينة التفاصيل" : "Preview Detail"}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canConfirmFinance && req.status === "بانتظار التأكيد من المالية" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                setShowConfirmDisburse(true);
                              }}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
                              title={lang === "ar" ? "تأكيد وصرف طلب الشراء اليومي" : "Confirm disbursement"}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                setRejectionReasonText("");
                                setShowRejectReasonModal(true);
                              }}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                              title={lang === "ar" ? "رفض طلب الشراء اليومي" : "Reject request"}
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {canDelete && (
                          <button
                            onClick={(e) => triggerDeleteConfirm(req, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title={lang === "ar" ? "حذف الطلب" : "Delete Request"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail & Action Popup Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs overflow-y-auto p-4 z-50 flex justify-center items-start sm:items-center">
          <div className="my-8 sm:my-auto bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-black text-sm">
                    {lang === "ar" ? `تفاصيل طلب شراء يومي ${selectedRequest.requestNumber}` : `Daily Purchase Request ${selectedRequest.requestNumber}`}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {lang === "ar" ? `تاريخ الطلب: ${selectedRequest.date}` : `Date: ${selectedRequest.date}`}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedRequest(null);
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-right">
              
              {/* Type and Status Highlights */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="block text-[10px] text-slate-400 font-bold">{lang === "ar" ? "النوع والمصدر" : "Type & Source"}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-extrabold text-[13px] text-slate-800">
                      {selectedRequest.type === "materials" 
                        ? (lang === "ar" ? "مستودع مواد" : "Warehouse Material") 
                        : (lang === "ar" ? "صنف أو مادة أخرى" : "Other Custom Item")}
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-black">
                      {selectedRequest.source === "manual" ? (lang === "ar" ? "يدوي" : "Manual") : (lang === "ar" ? "مشتريات تلقائي" : "Auto PO")}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="block text-[10px] text-slate-400 font-bold">{lang === "ar" ? "الحالة والاعتماد المالي" : "Finance Status"}</span>
                  <span className={`inline-block mt-1.5 text-xs font-black ${
                    selectedRequest.status === "تم التأكيد والدفع من المالية" 
                      ? "text-emerald-700" 
                      : selectedRequest.status === "مرفوض" 
                      ? "text-rose-700" 
                      : "text-amber-700"
                  }`}>
                    {selectedRequest.status === "تم التأكيد والدفع من المالية" ? (lang === "ar" ? "تم تأكيد الصرف والاعتماد المالي" : "Disbursement Confirmed") : selectedRequest.status}
                  </span>
                </div>
              </div>

              {/* Item / Project details block */}
              <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/30">
                <h4 className="font-black text-xs text-slate-500 mb-2">{lang === "ar" ? "تفاصيل الصنف والمبالغ" : "Item & Payment Details"}</h4>
                
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold">{lang === "ar" ? "البيان أو اسم المادة:" : "Item/Material Name:"}</span>
                    <span className="font-extrabold text-slate-900 text-sm">{selectedRequest.itemName}</span>
                  </div>

                  {selectedRequest.projectName && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-bold">{lang === "ar" ? "المشروع / الغرض:" : "Project / Purpose:"}</span>
                      <span className="font-bold text-slate-700">{selectedRequest.projectName}</span>
                    </div>
                  )}

                  {(selectedRequest as any).quotationRecord && (
                    <div className="flex justify-between items-center text-xs bg-indigo-50/50 p-2 rounded-lg border border-indigo-100/30">
                      <span className="text-indigo-700 font-extrabold">{lang === "ar" ? "عرض السعر / المستند المسجل:" : "Recorded Quotation/Vendor:"}</span>
                      <span className="font-extrabold text-indigo-900">{(selectedRequest as any).quotationRecord}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-400 font-bold">{lang === "ar" ? "الكمية المطلوبة" : "Qty Requested"}</span>
                      <span className="font-black text-slate-800 text-sm font-sans">{selectedRequest.qty || 1}</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-400 font-bold">{lang === "ar" ? "سعر الوحدة (شامل الضريبة)" : "Unit Price (with VAT)"}</span>
                      <span className="font-black text-slate-800 text-sm font-sans">SAR {Number(selectedRequest.unitPrice || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="text-center bg-blue-50/50 rounded-lg p-1 border border-blue-100/50">
                      <span className="block text-[10px] text-blue-600 font-bold">{lang === "ar" ? "الإجمالي الكلي" : "Total Amount"}</span>
                      <span className="font-black text-[#0072BC] text-sm font-sans">SAR {Number(selectedRequest.totalAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Justification & Reason */}
              {selectedRequest.reason && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                  <h4 className="font-black text-xs text-slate-500 mb-1.5">{lang === "ar" ? "السبب والمبرر للشراء:" : "Reason & Justification:"}</h4>
                  <p className="text-slate-800 text-xs leading-relaxed font-bold">{selectedRequest.reason}</p>
                </div>
              )}

              {/* Notes */}
              {selectedRequest.notes && (
                <div>
                  <h4 className="font-black text-xs text-slate-500 mb-1">{lang === "ar" ? "ملاحظات إضافية:" : "Additional Notes:"}</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">{selectedRequest.notes}</p>
                </div>
              )}

              {/* Itemized breakdown table */}
              {selectedRequest.itemsList && selectedRequest.itemsList.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
                  <div className="bg-slate-100 p-2 text-[10px] font-black text-slate-600 border-b border-slate-200">
                    {lang === "ar" ? "تفاصيل بنود المواد والأصناف المدرجة" : "Itemized breakdown of requested materials & items"}
                  </div>
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                        <th className="p-2">{lang === "ar" ? "المادة / الصنف" : "Item"}</th>
                        <th className="p-2 text-center">{lang === "ar" ? "الكمية" : "Qty"}</th>
                        <th className="p-2 text-left">{lang === "ar" ? "سعر الوحدة" : "Unit Price"}</th>
                        <th className="p-2 text-left">{lang === "ar" ? "الإجمالي" : "Total"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequest.itemsList.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-100">
                          <td className="p-2 font-bold">{item.itemName}</td>
                          <td className="p-2 text-center font-sans font-bold">{item.qty}</td>
                          <td className="p-2 text-left font-sans text-slate-600">SAR {Number(item.unitPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 text-left font-sans font-black">SAR {Number(item.total).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Activity / updates Log */}
              {selectedRequest.rejectReason && (
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-150 text-right space-y-1 my-3">
                  <h4 className="font-black text-xs text-rose-700 flex items-center gap-1 justify-end">
                    <span>{lang === "ar" ? "سبب رفض الطلب الموثق مالياً" : "Financial Rejection Reason"}</span>
                    <span>⚠️</span>
                  </h4>
                  <p className="text-rose-950 text-xs leading-relaxed font-extrabold">{selectedRequest.rejectReason}</p>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4 mt-4 text-right">
                <h4 className="font-black text-xs text-slate-500 mb-2 flex items-center gap-1.5 justify-end">
                  <span>{lang === "ar" ? "سجل الحركات والتأكيد المالي" : "Activity & Finance Logs"}</span>
                  <span className="text-slate-400">📜</span>
                </h4>
                {selectedRequest.updatesLog && selectedRequest.updatesLog.length > 0 ? (
                  <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedRequest.updatesLog.map((log: any, idx: number) => (
                      <div key={idx} className="flex flex-col gap-0.5 border-b border-slate-100 pb-1.5 last:border-0 last:pb-0 text-xs">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-slate-400 font-mono">
                            {new Date(log.timestamp).toLocaleString(lang === "ar" ? "ar-SA" : "en-US", { hour12: true })}
                          </span>
                          <span className="text-indigo-600">👤 {log.user}</span>
                        </div>
                        <p className="text-slate-800 text-[11px] mt-0.5 font-bold text-right">{log.action}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic text-right">
                    {lang === "ar" ? "لا يوجد سجل حركات متوفر بعد." : "No logs recorded yet."}
                  </p>
                )}
              </div>

              {/* Creator details */}
              <div className="text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-3 flex justify-between">
                <span>{lang === "ar" ? `أنشئ بواسطة: ${selectedRequest.userCreated}` : `Created by: ${selectedRequest.userCreated}`}</span>
                {selectedRequest.originalPoId && (
                  <span className="font-mono">PO ID: {selectedRequest.originalPoId}</span>
                )}
              </div>

            </div>

            {/* Modal Actions / Finance approvals */}
            <div className="bg-slate-50 p-4 border-t border-slate-150 flex flex-col md:flex-row gap-2 justify-between items-center">
              <div>
                {canDelete && (
                  <button
                    onClick={(e) => triggerDeleteConfirm(selectedRequest, e)}
                    className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition text-xs font-bold"
                  >
                    <Trash2 className="w-4 h-4" />
                    {lang === "ar" ? "حذف هذا الطلب" : "Delete Request"}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {canConfirmFinance && selectedRequest.status === "بانتظار التأكيد من المالية" && (
                  <>
                    <button
                      onClick={() => {
                        setRejectionReasonText("");
                        setShowRejectReasonModal(true);
                      }}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-black transition"
                    >
                      {lang === "ar" ? "رفض الطلب" : "Reject"}
                    </button>
                    <button
                      onClick={() => setShowConfirmDisburse(true)}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-sm"
                    >
                      {lang === "ar" ? "تأكيد الصرف" : "Confirm Disbursement"}
                    </button>
                  </>
                )}
                
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedRequest(null);
                  }}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  {lang === "ar" ? "إغلاق" : "Close"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs overflow-y-auto p-4 z-[60] flex justify-center items-start sm:items-center">
          <div className="my-8 sm:my-auto bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-rose-100 animate-in fade-in zoom-in-95 duration-100">
            <div className="p-5 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
                <Trash2 className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-base">{lang === "ar" ? "تأكيد الحذف النهائي" : "Confirm Deletion"}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {lang === "ar" 
                    ? `هل أنت متأكد من رغبتك في حذف طلب الشراء رقم (${requestToDelete?.requestNumber}) نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.` 
                    : `Are you sure you want to permanently delete daily purchase request (${requestToDelete?.requestNumber})? This action cannot be undone.`}
                </p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setRequestToDelete(null);
                }}
                className="px-4 py-2 text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold transition"
              >
                {lang === "ar" ? "إلغاء التراجع" : "Cancel"}
              </button>
              <button
                onClick={() => handleDeleteRequest()}
                className="px-4 py-2 text-white bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-extrabold transition shadow-sm shadow-rose-100"
              >
                {lang === "ar" ? "نعم، احذف للابد" : "Yes, Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Disbursement Modal */}
      {showConfirmDisburse && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs overflow-y-auto p-4 z-[60] flex justify-center items-start sm:items-center">
          <div className="my-8 sm:my-auto bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-emerald-100 animate-in fade-in zoom-in-95 duration-100">
            <div className="p-5 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                <CheckCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-base">{lang === "ar" ? "تأكيد الصرف والاعتماد المالي" : "Confirm Disbursement"}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {lang === "ar" 
                    ? `هل أنت متأكد من رغبتك في تأكيد صرف مبلغ (${Number(selectedRequest.totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR) لطلب الشراء رقم (${selectedRequest.requestNumber})؟ سيتم قيد هذا المبلغ وتسجيله فوراً كقيد يومي محاسبي ومصروف في النظام.` 
                    : `Are you sure you want to confirm the disbursement of (${Number(selectedRequest.totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR) for request (${selectedRequest.requestNumber})? This will automatically register a journal entry and expense in the system.`}
                </p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-2 justify-end">
              <button
                onClick={() => setShowConfirmDisburse(false)}
                className="px-4 py-2 text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold transition"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={() => {
                  handleUpdateStatus(selectedRequest.id, "تم التأكيد والدفع من المالية");
                  setShowConfirmDisburse(false);
                }}
                className="px-5 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-extrabold transition shadow-sm shadow-emerald-100"
              >
                {lang === "ar" ? "نعم، أكّد الصرف والقيد" : "Yes, Confirm & Post"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectReasonModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs overflow-y-auto p-4 z-[60] flex justify-center items-start sm:items-center">
          <div className="my-8 sm:my-auto bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-rose-100 animate-in fade-in zoom-in-95 duration-100">
            <div className="p-5 text-right space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
                <X className="w-6 h-6" />
              </div>
              <div className="text-center sm:text-right">
                <h3 className="font-black text-slate-800 text-base text-center">{lang === "ar" ? "رفض طلب الشراء اليومي" : "Reject Purchase Request"}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed text-center">
                  {lang === "ar" 
                    ? `الرجاء كتابة سبب الرفض لطلب الشراء رقم (${selectedRequest.requestNumber}):` 
                    : `Please provide the reason for rejecting request (${selectedRequest.requestNumber}):`}
                </p>
              </div>
              <div className="mt-3">
                <textarea
                  value={rejectionReasonText}
                  onChange={(e) => setRejectionReasonText(e.target.value)}
                  placeholder={lang === "ar" ? "اكتب سبب الرفض هنا بالتفصيل..." : "Enter rejection reason..."}
                  className="w-full text-xs font-bold p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 min-h-[90px] text-right"
                  required
                />
              </div>
            </div>
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowRejectReasonModal(false);
                  setRejectionReasonText("");
                }}
                className="px-4 py-2 text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold transition"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={() => {
                  if (!rejectionReasonText.trim()) {
                    alert(lang === "ar" ? "الرجاء كتابة سبب الرفض أولاً" : "Please provide a rejection reason first.");
                    return;
                  }
                  handleUpdateStatus(selectedRequest.id, "مرفوض", rejectionReasonText.trim());
                  setShowRejectReasonModal(false);
                  setRejectionReasonText("");
                }}
                className="px-5 py-2 text-white bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-extrabold transition shadow-sm shadow-rose-100"
              >
                {lang === "ar" ? "تأكيد الرفض والتعميم" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Request Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs overflow-y-auto p-4 z-50 flex justify-center items-start sm:items-center">
          <div className="my-8 sm:my-auto bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="bg-[#0072BC] text-white p-4 flex items-center justify-between">
              <h3 className="font-black text-sm">
                {lang === "ar" ? "إنشاء طلب شراء يومي جديد" : "Create New Daily Purchase Request"}
              </h3>
              <button 
                onClick={() => {
                  resetFormState();
                  setShowAddModal(false);
                }}
                className="p-1 hover:bg-white/10 rounded text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateRequest} className="p-6 space-y-4 text-right overflow-y-auto max-h-[85vh]">
              
              {/* Form Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">{lang === "ar" ? "تاريخ طلب الشراء" : "Purchase Date"}</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 focus:border-[#0072BC]"
                />
              </div>

              {/* Item Entry Section */}
              <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-xs font-black text-slate-700">{lang === "ar" ? "إضافة أصناف ومواد للطلب" : "Add Items/Materials to Request"}</span>
                </div>

                {/* Type Switcher */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">{lang === "ar" ? "نوع الصنف" : "Item Type"}</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setFormType("materials");
                        setSelectedMaterialId("");
                      }}
                      className={`py-1.5 px-3 rounded text-[11px] font-black transition ${
                        formType === "materials" 
                          ? "bg-white text-[#0072BC] shadow-xs font-black" 
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {lang === "ar" ? "مواد من المستودع 🧱" : "Warehouse Materials"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormType("other");
                        setSelectedMaterialId("");
                      }}
                      className={`py-1.5 px-3 rounded text-[11px] font-black transition ${
                        formType === "other" 
                          ? "bg-white text-[#0072BC] shadow-xs font-black" 
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {lang === "ar" ? "صنف أو مصلحة أخرى 📝" : "Other Requisitions"}
                    </button>
                  </div>
                </div>

                {/* Dynamic Material Select or Custom Item input */}
                {formType === "materials" ? (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">{lang === "ar" ? "اختر المادة من المستودع" : "Select Warehouse Material"}</label>
                    <select
                      value={selectedMaterialId}
                      onChange={(e) => setSelectedMaterialId(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 focus:border-[#0072BC] bg-white"
                    >
                      <option value="">{lang === "ar" ? "-- اختر مادة --" : "-- Select Material --"}</option>
                      {materials.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.itemNameAr || m.nameAr || m.name || m.itemName} ({m.itemCode || "---"})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">{lang === "ar" ? "اسم الصنف أو الشيء المراد شراؤه" : "Item / Service Description"}</label>
                    <input
                      type="text"
                      placeholder={lang === "ar" ? "مثال: مياه شرب للموظفين، مصاريف نقل..." : "e.g., Water bottles for factory, transport..."}
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 focus:border-[#0072BC]"
                    />
                  </div>
                )}

                {/* Quantity & Unit Price Row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Quantity */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">{lang === "ar" ? "الكمية المطلوبة" : "Quantity"}</label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={formQty}
                      onChange={(e) => setFormQty(Number(e.target.value))}
                      className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 focus:border-[#0072BC] text-left font-sans"
                    />
                  </div>

                  {/* Unit Price */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">{lang === "ar" ? "السعر شامل الضريبة" : "Price (VAT Inclusive)"}</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formUnitPrice}
                      onChange={(e) => setFormUnitPrice(Number(e.target.value))}
                      className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 focus:border-[#0072BC] text-left font-sans"
                    />
                  </div>
                </div>

                {/* Add current item button */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddFormItem}
                    className="flex items-center gap-1 bg-[#0072BC]/10 hover:bg-[#0072BC]/20 text-[#0072BC] font-bold px-3 py-2 rounded-lg transition duration-150 text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    {lang === "ar" ? "إضافة الصنف للقائمة" : "Add Item to List"}
                  </button>
                </div>
              </div>

              {/* Form Items List Table (if any) */}
              {formItems.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                  <div className="bg-slate-100 px-3 py-2 text-xs font-black text-slate-600 flex justify-between items-center">
                    <span>{lang === "ar" ? "الأصناف المدرجة في هذا الطلب" : "Items added to this request"}</span>
                    <span className="text-slate-400 font-mono text-[10px]">({formItems.length} {lang === "ar" ? "أصناف" : "items"})</span>
                  </div>
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                        <th className="p-2">{lang === "ar" ? "البيان / المادة" : "Item"}</th>
                        <th className="p-2 text-center">{lang === "ar" ? "الكمية" : "Qty"}</th>
                        <th className="p-2 text-left">{lang === "ar" ? "السعر" : "Price"}</th>
                        <th className="p-2 text-left">{lang === "ar" ? "الإجمالي" : "Total"}</th>
                        <th className="p-2 text-center" style={{ width: "40px" }}></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2 font-bold">{item.itemName}</td>
                          <td className="p-2 text-center font-sans font-semibold">{item.qty}</td>
                          <td className="p-2 text-left font-sans text-slate-600">SAR {item.unitPrice.toLocaleString()}</td>
                          <td className="p-2 text-left font-sans font-bold">SAR {item.total.toLocaleString()}</td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveFormItem(idx)}
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Reason / Justification */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">{lang === "ar" ? "السبب والمبرر لطلب الشراء" : "Reason / Justification"}</label>
                <textarea
                  required
                  rows={2}
                  placeholder={lang === "ar" ? "يرجى تحديد مبرر الطلب بدقة لإقناع الإدارة المالية والمشتريات" : "Provide justification for this request..."}
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 focus:border-[#0072BC] text-right"
                />
              </div>

              {/* Record Quotation / عرض السعر المسجل */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">{lang === "ar" ? "عرض السعر المسجل / المورد (اختياري)" : "Record Quotation / Vendor (Optional)"}</label>
                <input
                  type="text"
                  placeholder={lang === "ar" ? "مثال: عرض شركة العبيكان رقم QUO-9081" : "e.g., Obeikan Quotation QUO-9081..."}
                  value={formQuotationRecord}
                  onChange={(e) => setFormQuotationRecord(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 focus:border-[#0072BC]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">{lang === "ar" ? "ملاحظات إضافية (اختياري)" : "Additional Notes (Optional)"}</label>
                <input
                  type="text"
                  placeholder={lang === "ar" ? "أي تفاصيل أخرى إضافية..." : "Any other secondary details..."}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 focus:border-[#0072BC]"
                />
              </div>

              {/* Total Calculation Display */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold">{lang === "ar" ? "المجموع المحسوب للطلب (شامل الضريبة):" : "Calculated Total (VAT Inclusive):"}</span>
                <span className="font-sans font-black text-[#0072BC] text-sm">
                  SAR {
                    (formItems.length > 0 
                      ? formItems.reduce((sum, item) => sum + item.total, 0)
                      : (formQty * formUnitPrice)
                    ).toLocaleString("en-US", { minimumFractionDigits: 2 })
                  }
                </span>
              </div>

              {/* Form buttons */}
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    resetFormState();
                    setShowAddModal(false);
                  }}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  {lang === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0072BC] hover:bg-[#0072BC]/90 text-white rounded-xl text-xs font-extrabold transition shadow-md shadow-[#0072BC]/10"
                >
                  {lang === "ar" ? "حفظ وإضافة للطلب اليومي" : "Save & Add Request"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Monthly Print Selector Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs overflow-y-auto p-4 z-50 flex justify-center items-start sm:items-center">
          <div className="my-8 sm:my-auto bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-black text-xs">
                {lang === "ar" ? "تحديد شهر التقرير والملخص" : "Select Report Month & Year"}
              </h3>
              <button onClick={() => setShowPrintModal(false)} className="text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-right">
              
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">{lang === "ar" ? "اختر السنة" : "Select Year"}</label>
                <select
                  value={printYear}
                  onChange={(e) => setPrintYear(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 focus:border-[#0072BC]"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2027">2027</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">{lang === "ar" ? "اختر الشهر" : "Select Month"}</label>
                <select
                  value={printMonth}
                  onChange={(e) => setPrintMonth(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 focus:border-[#0072BC]"
                >
                  <option value="01">{lang === "ar" ? "يناير (01)" : "January"}</option>
                  <option value="02">{lang === "ar" ? "فبراير (02)" : "February"}</option>
                  <option value="03">{lang === "ar" ? "مارس (03)" : "March"}</option>
                  <option value="04">{lang === "ar" ? "أبريل (04)" : "April"}</option>
                  <option value="05">{lang === "ar" ? "مايو (05)" : "May"}</option>
                  <option value="06">{lang === "ar" ? "يونيو (06)" : "June"}</option>
                  <option value="07">{lang === "ar" ? "يوليو (07)" : "July"}</option>
                  <option value="08">{lang === "ar" ? "أغسطس (08)" : "August"}</option>
                  <option value="09">{lang === "ar" ? "سبتمبر (09)" : "September"}</option>
                  <option value="10">{lang === "ar" ? "أكتوبر (10)" : "October"}</option>
                  <option value="11">{lang === "ar" ? "نوفمبر (11)" : "November"}</option>
                  <option value="12">{lang === "ar" ? "ديسمبر (12)" : "December"}</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold"
                >
                  {lang === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  onClick={handlePrintSummary}
                  className="px-5 py-2 bg-[#0072BC] hover:bg-[#0072BC]/90 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition"
                >
                  <Printer className="w-4 h-4" />
                  {lang === "ar" ? "طباعة الملخص" : "Print Summary"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
