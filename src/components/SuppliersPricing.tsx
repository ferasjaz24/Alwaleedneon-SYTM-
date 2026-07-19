import { getStatusColors } from '../lib/statusUtils';
import { getAccessLevel, getAdvancedPermissionScope } from '../lib/permissions';
import React, { useState, useEffect } from "react";
import {
  Search,
  FileText,
  Check,
  Clock,
  ShieldCheck,
  X,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Tag,
  Calendar,
  User,
  Package,
  Layers,
  ExternalLink,
} from "lucide-react";
import {
  sharedPrintHeader,
  sharedPrintFooter,
  sharedPrintStyles,
} from "../utils/PrintShared";
import { detectBankFromIban } from "../utils/ibanHelper";
import { TranslatedText } from "../utils/translator";

interface SuppliersPricingProps {
  lang: "ar" | "en";
  user: any;
}

export default function SuppliersPricing({
  lang,
  user,
}: SuppliersPricingProps) {
  const [activePortal, setActivePortal] = useState<"requests" | "suppliers">(
    "requests",
  );

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Tag className="w-7 h-7 text-[#0072BC]" />
          {lang === "ar"
            ? "بوابة الموردين والتسعير"
            : "Suppliers & Pricing Portal"}
        </h2>
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto overflow-hidden">
          <button
            onClick={() => setActivePortal("requests")}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap ${activePortal === "requests" ? "bg-white text-[#0072BC] shadow" : "text-slate-600 hover:text-slate-800"}`}
          >
            {lang === "ar" ? "الطلبات المرسلة للتسعير" : "Pricing Requests"}
          </button>
          <button
            onClick={() => setActivePortal("suppliers")}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap ${activePortal === "suppliers" ? "bg-white text-[#0072BC] shadow" : "text-slate-600 hover:text-slate-800"}`}
          >
            {lang === "ar" ? "بوابة الموردين" : "Suppliers Portal"}
          </button>
        </div>
      </div>

      {activePortal === "requests" && (
        <PricingRequestsView lang={lang} user={user} />
      )}
      {activePortal === "suppliers" && (
        <SuppliersPortalView lang={lang} user={user} />
      )}
    </div>
  );
}

function PricingRequestsView({ lang, user }: { lang: "ar" | "en"; user: any }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [quoteDetails, setQuoteDetails] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const ts = Date.now();
      const [rReqs, rSupps, rMats] = await Promise.all([
        fetch(`/api/dynamic/pricing_requests?t=${ts}`).then((r) =>
          r.ok ? r.json() : [],
        ),
        fetch(`/api/dynamic/suppliers?t=${ts}`).then((r) =>
          r.ok ? r.json() : [],
        ),
        fetch(`/api/dynamic/materials_warehouse?t=${ts}`).then((r) =>
          r.ok ? r.json() : [],
        ),
      ]);
      setRequests(Array.isArray(rReqs) ? rReqs : []);
      setSuppliers(Array.isArray(rSupps) ? rSupps : []);
      setMaterials(Array.isArray(rMats) ? rMats : []);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openQuoteModal = (req: any) => {
    setSelectedReq(req);
    if (req.pricingDetails && req.pricingDetails.length > 0) {
      setQuoteDetails(req.pricingDetails);
    } else if (req.outOfStockItems && req.outOfStockItems.length > 0) {
      setQuoteDetails(
        req.outOfStockItems.map((item: any) => {
          const matchedMat = materials.find(
            (m: any) =>
              m.arabicName === item.itemName ||
              m.englishName === item.itemName ||
              m.name === item.itemName
          );
          const defSupId = matchedMat?.defaultSupplier || "";
          const defSup = suppliers.find((s: any) => String(s.id) === String(defSupId));
          return {
            materialName: item.itemName,
            quantity: item.qty,
            supplierId: defSupId,
            supplierName: defSup?.name || "",
            price: "",
            isVatInclusive: false,
          };
        }),
      );
    } else {
      setQuoteDetails([]);
    }
  };

  const updateQuoteDetail = (idx: number, field: string, val: any) => {
    const arr = [...quoteDetails];
    arr[idx] = { ...arr[idx], [field]: val };
    if (field === "supplierId") {
      const sup = suppliers.find((s: any) => String(s.id) === String(val));
      if (sup) {
        arr[idx] = { ...arr[idx], supplierName: sup.name };
      }
    }
    setQuoteDetails(arr);
  };

  const handleSaveQuoteDraft = async () => {
    if (!selectedReq) return;
    setIsSaving(true);
    try {
      const newLog = [
        ...(selectedReq.updatesLog || []),
        {
          user: user.username,
          action: lang === "ar" ? "حفظ مسودة التسعيرة" : "Saved quote draft",
          timestamp: new Date().toISOString(),
        }
      ];
      const payload = {
        pricingDetails: quoteDetails,
        updatesLog: newLog,
      };
      const res = await fetch(
        `/api/dynamic/pricing_requests/${selectedReq.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (res.ok) {
        setRequests(
          requests.map((r) =>
            r.id === selectedReq.id ? { ...r, ...payload } : r,
          ),
        );
        setSelectedReq({ ...selectedReq, ...payload });
        setToast({
          message:
            lang === "ar" ? "تم حفظ بيانات التسعيرة" : "Quote details saved",
          type: "success",
        });
      }
    } catch (e) {
      setToast({
        message: lang === "ar" ? "حدث خطأ" : "Error",
        type: "error",
      });
    }
    setIsSaving(false);
    setTimeout(() => setToast(null), 3000);
  };

  const handleExportPDF = () => {
    if (!selectedReq) return;
    const printWin = window.open("", "_blank");
    if (!printWin) return;

    let html = `
      <html>
      <head>
        <title>Pricing Response</title>
        <style>
          ${sharedPrintStyles}
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #f8f9fa; }
        </style>
      </head>
      <body dir="rtl">
        ${sharedPrintHeader}
        <h2 style="text-align: center; margin-bottom: 5px;">عرض سعر شراء مواد</h2>
        <h4 style="text-align: center; color: #555; margin-top: 0;">المشروع: ${selectedReq.projectName}</h4>
        
        <div style="margin-top: 15px; margin-bottom: 20px; border: 1.5px solid #000; padding: 12px; border-radius: 6px; background-color: #f9fafb; font-size: 12px; line-height: 1.6; font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif;">
          <table style="width: 100%; border: none; margin: 0; font-size: 12px;">
            <tr style="border: none;">
              <td style="border: none; padding: 4px; width: 50%;"><strong>اسم المشروع:</strong> ${selectedReq.projectName || "---"}</td>
              <td style="border: none; padding: 4px; width: 50%;"><strong>رقم مرجع التسعير:</strong> ${selectedReq.id || "---"} ${selectedReq.quotationNumber ? `(${selectedReq.quotationNumber})` : ""}</td>
            </tr>
            <tr style="border: none;">
              <td style="border: none; padding: 4px;"><strong>طالب التسعير (اليوزر):</strong> ${selectedReq.requestedBy || "غير معروف"}</td>
              <td style="border: none; padding: 4px;"><strong>تاريخ ووقت الطلب:</strong> ${selectedReq.requestedAt ? new Date(selectedReq.requestedAt).toLocaleString('ar-EG') : "---"}</td>
            </tr>
            ${selectedReq.sentToFinanceBy ? `
            <tr style="border: none;">
              <td style="border: none; padding: 4px; color: #4f46e5;"><strong>المصدر للمالية (اليوزر):</strong> ${selectedReq.sentToFinanceBy}</td>
              <td style="border: none; padding: 4px; color: #4f46e5;"><strong>تاريخ التصدير للمالية:</strong> ${selectedReq.sentToFinanceAt ? new Date(selectedReq.sentToFinanceAt).toLocaleString('ar-EG') : "---"}</td>
            </tr>
            ` : ""}
            <tr style="border: none;">
              <td style="border: none; padding: 4px;" colspan="2"><strong>حالة الطلب الحالية:</strong> <span style="font-weight: bold; color: #0072BC;">${selectedReq.status}</span></td>
            </tr>
          </table>
        </div>

        <div style="margin-top:20px;">
          <h3>المواد المتوفرة (الكمية تغطي الطلب)</h3>
          <table>
            <thead><tr><th>الصنف</th><th>الكمية</th></tr></thead>
            <tbody>
              ${selectedReq.inStockItems?.map((i: any) => `<tr><td>${i.itemName}</td><td>${i.qty}</td></tr>`).join("")}
            </tbody>
          </table>
        </div>

        <div style="margin-top:20px;">
          <h3>عناصر نفذت وتحتاج للطلب (التسعيرة)</h3>
          <table>
            <thead><tr><th>الصنف</th><th>الكمية</th><th>المورد المختار</th><th>السعر</th><th>شامل الضريبة</th></tr></thead>
            <tbody>
              ${quoteDetails
                .map((q: any) => {
                  const sName =
                    suppliers.find((s) => s.id === q.supplierId)?.name || "";
                  return `<tr><td>${q.materialName}</td><td>${q.quantity}</td><td>${sName}</td><td>${q.price}</td><td>${q.isVatInclusive ? "نعم" : "لا"}</td></tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </div>

        <div style="margin-top:30px;">
          <h3>الموردين والمستخلص المقترحين للطلب</h3>
          <table>
            <thead><tr><th>اسم المورد</th><th>رقم الجوال</th><th>المندوب</th><th>المواد التي يوفرها</th><th>العنوان/الموقع</th><th>IBAN</th></tr></thead>
            <tbody>
              ${suppliers
                .map((s) => {
                  const suppSpecialty = s.specialty
                    ? (s.specialty || '').toLowerCase()
                    : "";
                  const matchedItems = quoteDetails
                    .filter((q: any) => {
                      const itemName = q.materialName
                        ? (q.materialName || '').toLowerCase()
                        : "";
                      return (
                        suppSpecialty.includes(itemName) ||
                        itemName.includes(suppSpecialty) ||
                        suppSpecialty
                          .split(" ")
                          .some(
                            (w: string) => w.length > 2 && itemName.includes(w),
                          )
                      );
                    })
                    .map((q: any) => q.materialName)
                    .join("، ");

                  if (!matchedItems && suppliers.length > 5) return "";
                  return `<tr>
                  <td>${s.name}</td>
                  <td dir="ltr">${s.repPhone || "---"}</td>
                  <td>${s.repName || "---"}</td>
                  <td>${matchedItems || "---"}</td>
                  <td>${s.address || "---"}</td>
                  <td>${s.iban || "---"}</td>
                </tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </div>
        
        ${sharedPrintFooter}
      </body>
      </html>
    `;
    printWin.document.write(html);
    printWin.document.close();
    printWin.print();
  };

  const handleSendToFinance = async () => {
    if (!selectedReq) return;
    setConfirmDialog({
      message:
        lang === "ar"
          ? "هل أنت متأكد من تحويل طلب الشراء والتسعيرة للمسؤول المالي لاعتماده؟"
          : "Are you sure you want to send this quote to finance?",
      onConfirm: async () => {
        setIsSaving(true);
        try {
          const newLog = [
            ...(selectedReq.updatesLog || []),
            {
              user: user.username,
              action: lang === "ar" ? "تحويل طلب الشراء والتسعيرة للمسؤول المالي للاعتماد" : "Sent quote to finance for approval",
              timestamp: new Date().toISOString(),
            }
          ];
          // 1. Update Pricing Request
          const payload = {
            status: "في انتظار تعميد المسؤول المالي",
            pricingDetails: quoteDetails,
            sentToFinanceAt: new Date().toISOString(),
            sentToFinanceBy: user.username,
            updatesLog: newLog,
          };
          const res = await fetch(
            `/api/dynamic/pricing_requests/${selectedReq.id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            },
          );
          if (res.ok) {
            setRequests(
              requests.map((r) =>
                r.id === selectedReq.id ? { ...r, ...payload } : r,
              ),
            );
            setSelectedReq({ ...selectedReq, ...payload });
            setToast({
              message:
                lang === "ar"
                  ? "تم تحويل الطلب إلى المسؤول المالي"
                  : "Sent to finance",
              type: "success",
            });
          }
        } catch (e) {
          setToast({
            message: lang === "ar" ? "حدث خطأ" : "Error",
            type: "error",
          });
        }
        setIsSaving(false);
        setTimeout(() => setToast(null), 3000);
      },
    });
  };

  const handleRevertSendToFinance = async () => {
    if (!selectedReq) return;
    setConfirmDialog({
      message:
        lang === "ar"
          ? "هل أنت متأكد من التراجع وإلغاء إرسال الطلب للمسؤول المالي للعودة لحالة التسعير؟"
          : "Are you sure you want to revert sending to finance?",
      onConfirm: async () => {
        setIsSaving(true);
        try {
          const newLog = [
            ...(selectedReq.updatesLog || []),
            {
              user: user.username,
              action: lang === "ar" ? "إلغاء التحويل وتراجع للتسعير" : "Reverted sending to finance",
              timestamp: new Date().toISOString(),
            }
          ];
          const payload = {
            status: "تم الارسال للتسعير",
            sentToFinanceAt: null,
            sentToFinanceBy: null,
            updatesLog: newLog,
          };
          const res = await fetch(
            `/api/dynamic/pricing_requests/${selectedReq.id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            },
          );
          if (res.ok) {
            setRequests(
              requests.map((r) =>
                r.id === selectedReq.id ? { ...r, ...payload } : r,
              ),
            );
            setSelectedReq(null);
            setToast({
              message:
                lang === "ar" ? "تم التراجع وإعادة الطلب للتسعير" : "Reverted",
              type: "success",
            });
          }
        } catch (e) {
          setToast({
            message: lang === "ar" ? "حدث خطأ" : "Error",
            type: "error",
          });
        }
        setIsSaving(false);
        setTimeout(() => setToast(null), 3000);
      },
    });
  };

  const handleIssuePurchaseOrder = async () => {
    if (!selectedReq) return;
    setConfirmDialog({
      message:
        lang === "ar"
          ? "هل أنت متأكد من إصدار وتقييد أمر الشراء ليصبح رسمياً؟"
          : "Are you sure you want to officially issue this purchase order?",
      onConfirm: async () => {
        setIsSaving(true);
        try {
          const newLog = [
            ...(selectedReq.updatesLog || []),
            {
              user: user.username,
              action: lang === "ar" ? "إصدار وتقييد أمر الشراء" : "Issued Purchase Order",
              timestamp: new Date().toISOString(),
            }
          ];
          // Update Procurement Request to say order is created
          await fetch(
            `/api/dynamic/material_purchase_requests/${selectedReq.originalRequestId}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: "قيد الطلب",
                isOrder: true,
                orderCreatedBy: user.username,
                orderCreatedAt: new Date().toISOString(),
                pricingDetails: selectedReq.pricingDetails,
                inStockItems: selectedReq.inStockItems,
                outOfStockItems: selectedReq.outOfStockItems,
                updatesLog: newLog,
              }),
            },
          );

          await fetch(`/api/dynamic/pricing_requests/${selectedReq.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "تم اصدار امر شراء", updatesLog: newLog }),
          });

          setToast({
            message:
              lang === "ar"
                ? "تم اصدار امر شراء بنجاح"
                : "PO Issued successfully",
            type: "success",
          });
          fetchItems();
          setSelectedReq({ ...selectedReq, status: "تم اصدار امر شراء", updatesLog: newLog });
        } catch (e) {
          setToast({
            message: lang === "ar" ? "حدث خطأ" : "Error",
            type: "error",
          });
        }
        setIsSaving(false);
        setTimeout(() => setToast(null), 3000);
      },
    });
  };

  const handleRevertPurchaseOrder = async () => {
    if (!selectedReq) return;
    setConfirmDialog({
      message:
        lang === "ar"
          ? '⚠️ الانتباه: هل أنت متأكد من إلغاء أمر الشراء بعد اعتماده؟ سيتم إعادته لحالة "في انتظار إصدار أمر شراء".'
          : "Are you sure you want to cancel the PO and revert to pending state?",
      onConfirm: async () => {
        setIsSaving(true);
        try {
          const newLog = [
            ...(selectedReq.updatesLog || []),
            {
              user: user.username,
              action: lang === "ar" ? "إلغاء وتراجع عن أمر الشراء المعتمد" : "Reverted Purchase Order",
              timestamp: new Date().toISOString(),
            }
          ];
          await fetch(
            `/api/dynamic/material_purchase_requests/${selectedReq.originalRequestId}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: "مرسل للموردين والتسعير",
                isOrder: false,
                orderCreatedBy: null,
                orderCreatedAt: null,
                updatesLog: newLog,
              }),
            },
          );

          await fetch(`/api/dynamic/pricing_requests/${selectedReq.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "في انتظار اصدار امر شراء", updatesLog: newLog }),
          });

          setToast({
            message:
              lang === "ar"
                ? "تم التراجع وإلغاء أمر الشراء بنجاح"
                : "PO Cancelled successfully",
            type: "success",
          });
          fetchItems();
          setSelectedReq(null);
        } catch (e) {
          setToast({
            message: lang === "ar" ? "حدث خطأ" : "Error",
            type: "error",
          });
        }
        setIsSaving(false);
        setTimeout(() => setToast(null), 3000);
      },
    });
  };

  const isRoleAuthorizedForOrder =
    user.role === "Super Admin" ||
    user.username === "FERAS" ||
    user.role === "Senior Management" ||
    user.role === "الادارة العليا" ||
    user.role === "إداري";

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder={lang === "ar" ? "ابحث..." : "Search..."}
          className="flex-1 p-3 mx-4 lg:mx-0 border rounded-2xl outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {requests
          .filter((r) => {
            const scope = getAdvancedPermissionScope(user, "procurement", "suppliers", "view_suppliers");
            if (scope === 'own' && r.requestedBy !== user.username) {
              return false;
            }
            if (scope === 'none') {
              return false;
            }
            return (
              r.projectName?.includes(searchTerm) ||
              r.quotationNumber?.includes(searchTerm)
            );
          })
          .map((r) => (
            <div
              key={r.id}
              className="bg-white p-4 rounded-2xl border flex items-center justify-between"
            >
              <div>
                <h4 className="font-bold text-slate-800">{r.projectName}</h4>
                <span className={`mt-1 inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${getStatusColors(r.status)}`}>{r.status}</span>
              </div>
              <button
                onClick={() => openQuoteModal(r)}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition"
              >
                {lang === "ar"
                  ? "اصدار عرض سعر للشراء"
                  : "Issue Purchase Quotation"}
              </button>
            </div>
          ))}
      </div>

      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10 rounded-t-3xl">
              <h3 className="text-xl font-bold">
                {lang === "ar" ? "اصدار تسعيرة شراء" : "Issue Purchase Quote"}
              </h3>
              <button
                onClick={() => setSelectedReq(null)}
                className="p-2 hover:bg-slate-200 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* تفاصيل طلب التسعير الفنية والزمنية */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 font-bold mb-1">
                    {lang === "ar" ? "اسم المشروع:" : "Project Name:"}
                  </p>
                  <p className="font-extrabold text-slate-800 text-base">{selectedReq.projectName || "---"}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-bold mb-1">
                    {lang === "ar" ? "رقم مرجع التسعير:" : "Pricing Reference:"}
                  </p>
                  <p className="font-bold text-[#0072BC] font-mono">{selectedReq.id || "---"} {selectedReq.quotationNumber ? `(${selectedReq.quotationNumber})` : ""}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-bold mb-1">
                    {lang === "ar" ? "تاريخ ووقت إرسال الطلب:" : "Request Date & Time:"}
                  </p>
                  <p className="font-bold text-slate-700">
                    {selectedReq.requestedAt ? new Date(selectedReq.requestedAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-US") : "---"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 font-bold mb-1">
                    {lang === "ar" ? "اسم المستخدم (صاحب الطلب):" : "Requested By (User):"}
                  </p>
                  <p className="font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{selectedReq.requestedBy || "غير معروف"}</span>
                  </p>
                </div>

                {selectedReq.sentToFinanceBy && (
                  <>
                    <div>
                      <p className="text-indigo-500 font-bold mb-1">
                        {lang === "ar" ? "تاريخ التصدير للمالية:" : "Exported to Finance At:"}
                      </p>
                      <p className="font-bold text-indigo-700">
                        {selectedReq.sentToFinanceAt ? new Date(selectedReq.sentToFinanceAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-US") : "---"}
                      </p>
                    </div>
                    <div>
                      <p className="text-indigo-500 font-bold mb-1">
                        {lang === "ar" ? "المستخدم المصدر للمالية:" : "Exported to Finance By:"}
                      </p>
                      <p className="font-bold text-indigo-700 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-indigo-400" />
                        <span>{selectedReq.sentToFinanceBy}</span>
                      </p>
                    </div>
                  </>
                )}
              </div>

              {selectedReq.status === "مرفوض من المالية" &&
                selectedReq.financeRejectReason && (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col gap-2">
                    <h4 className="font-bold text-rose-800 text-sm">
                      {lang === "ar"
                        ? "سبب الرفض من المالية:"
                        : "Finance Rejection Reason:"}
                    </h4>
                    <p className="text-rose-700 text-sm font-bold">
                      {selectedReq.financeRejectReason}
                    </p>
                  </div>
                )}

              <div>
                <h4 className="font-bold mb-3">
                  {lang === "ar"
                    ? "المواد المتوفرة التي تغطي الطلب"
                    : "Available Items"}
                </h4>
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="p-2">الصنف</th>
                      <th className="p-2">الكمية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReq.inStockItems?.map((i: any, j: number) => (
                      <tr key={j} className="border-b">
                        <td className="p-2">{i.itemName}</td>
                        <td className="p-2 text-emerald-600 font-bold">
                          {i.qty} ✓
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="font-bold mb-3">
                  {lang === "ar"
                    ? "عناصر نفذت وتحتاج للطلب"
                    : "Out of stock items"}
                </h4>
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="p-2">الصنف</th>
                      <th className="p-2">الكمية المطلوبة</th>
                      <th className="p-2">اختيار مورد</th>
                      <th className="p-2">سعر الشراء</th>
                      <th className="p-2">شامل الضريبة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quoteDetails.map((q, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2 font-bold">
                          <div>{q.materialName}</div>
                          {(() => {
                            const matchedMat = materials.find(
                              (m: any) =>
                                m.arabicName === q.materialName ||
                                m.englishName === q.materialName ||
                                m.name === q.materialName
                            );
                            const defSupId = matchedMat?.defaultSupplier;
                            const defSup = suppliers.find((s: any) => String(s.id) === String(defSupId));
                            if (defSup) {
                              return (
                                <span className="inline-block mt-1 text-[10px] bg-sky-50 text-[#0072BC] px-2 py-0.5 rounded-md font-bold">
                                  {lang === "ar" ? `المورد الموصى به: ${defSup.name}` : `Recommended: ${defSup.name}`}
                                </span>
                              );
                            }
                            return (
                              <span className="inline-block mt-1 text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md font-bold">
                                {lang === "ar" ? "لم يحدد مورد افتراضي في المستودع" : "No default supplier set in warehouse"}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            className="w-16 p-1 border rounded disabled:opacity-50"
                            value={q.quantity}
                            onChange={(e) =>
                              updateQuoteDetail(idx, "quantity", e.target.value)
                            }
                            disabled={
                              !(
                                selectedReq.status === "تم الارسال للتسعير" ||
                                selectedReq.status === "مرفوض من المالية"
                              )
                            }
                          />
                        </td>
                        <td className="p-2">
                          <select
                            className="w-full p-1 border rounded disabled:opacity-50"
                            value={q.supplierId}
                            onChange={(e) =>
                              updateQuoteDetail(
                                idx,
                                "supplierId",
                                e.target.value,
                              )
                            }
                            disabled={
                              !(
                                selectedReq.status === "تم الارسال للتسعير" ||
                                selectedReq.status === "مرفوض من المالية"
                              )
                            }
                          >
                            <option value="">
                              {lang === "ar" ? "اختر..." : "Select..."}
                            </option>
                            {suppliers.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.repName || "بدون مندوب"})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            className="w-20 p-1 border rounded disabled:opacity-50"
                            value={q.price}
                            onChange={(e) =>
                              updateQuoteDetail(idx, "price", e.target.value)
                            }
                            disabled={
                              !(
                                selectedReq.status === "تم الارسال للتسعير" ||
                                selectedReq.status === "مرفوض من المالية"
                              )
                            }
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={q.isVatInclusive}
                            onChange={(e) =>
                              updateQuoteDetail(
                                idx,
                                "isVatInclusive",
                                e.target.checked,
                              )
                            }
                            disabled={
                              !(
                                selectedReq.status === "تم الارسال للتسعير" ||
                                selectedReq.status === "مرفوض من المالية"
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {quoteDetails.length > 0 && (
                <div className="mt-8">
                  <h4 className="font-bold text-slate-800 mb-4 border-t pt-4">
                    {lang === "ar"
                      ? "الموردين المقترحين لاحتياجات الطلب"
                      : "Suggested Suppliers For Order Needs"}
                  </h4>
                  <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full text-right text-sm">
                      <thead>
                        <tr className="bg-indigo-50 text-indigo-800">
                          <th className="p-2 border-b">اسم المورد</th>
                          <th className="p-2 border-b">رقم الجوال</th>
                          <th className="p-2 border-b">المندوب</th>
                          <th className="p-2 border-b w-1/3">
                            المواد التي يوفرها (من الطلب)
                          </th>
                          <th className="p-2 border-b">العنوان/الموقع</th>
                          <th className="p-2 border-b">IBAN</th>
                        </tr>
                      </thead>
                      <tbody>
                        {suppliers.map((s) => {
                          const suppSpecialty = s.specialty
                            ? (s.specialty || '').toLowerCase()
                            : "";
                          const matchedItems = quoteDetails
                            .filter((q) => {
                              const itemName = (q.materialName || '').toLowerCase();
                              return (
                                suppSpecialty.includes(itemName) ||
                                itemName.includes(suppSpecialty) ||
                                suppSpecialty
                                  .split(" ")
                                  .some(
                                    (w: string) =>
                                      w.length > 2 && itemName.includes(w),
                                  )
                              );
                            })
                            .map((q) => q.materialName)
                            .join("، ");

                          if (!matchedItems && suppliers.length > 5)
                            return null; // Only show matched if too many suppliers, or show all if few. Let's just show all.
                          return (
                            <tr
                              key={s.id}
                              className="border-b hover:bg-slate-50"
                            >
                              <td className="p-2 font-bold">{s.name}</td>
                              <td className="p-2" dir="ltr">
                                <span className="float-right">
                                  {s.repPhone || "---"}
                                </span>
                              </td>
                              <td className="p-2">{s.repName || "---"}</td>
                              <td className="p-2 text-indigo-600 font-bold">
                                {matchedItems || "---"}
                              </td>
                              <td className="p-2">{s.address || "---"}</td>
                              <td className="p-2 font-mono text-xs">
                                {s.iban || "---"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {selectedReq.updatesLog && selectedReq.updatesLog.length > 0 && (
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-2 mt-6">
                  <h4 className="text-xs font-black text-slate-500">
                    {lang === "ar"
                      ? "سجل تتبع التحديثات والحالات:"
                      : "Status Transition History:"}
                  </h4>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {selectedReq.updatesLog.map((log: any, i: number) => (
                      <div
                        key={i}
                        className="text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-white p-2.5 border border-slate-100 rounded-lg shadow-sm"
                      >
                        <span className="font-bold text-slate-700">
                          {log.action}{" "}
                          <span className="text-[#0072BC] font-black px-1">
                            بواسطة ({log.user})
                          </span>
                        </span>
                        <span className="text-slate-400 font-mono" dir="ltr">
                          {new Date(log.timestamp).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t sticky bottom-0 rounded-b-3xl flex gap-3 flex-wrap">
              <button
                onClick={handleExportPDF}
                className="px-5 py-2 hover:bg-slate-200 border rounded-xl font-bold bg-white transition"
              >
                {lang === "ar" ? "تصدير PDF" : "Export PDF"}
              </button>

              {(selectedReq.status === "تم الارسال للتسعير" ||
                selectedReq.status === "مرفوض من المالية") && (
                <>
                  <button
                    disabled={isSaving}
                    onClick={handleSaveQuoteDraft}
                    className="px-5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl font-bold transition"
                  >
                    {lang === "ar" ? "حفظ مسودة التسعيرة" : "Save Quote Draft"}
                  </button>
                  <button
                    disabled={isSaving}
                    onClick={handleSendToFinance}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition"
                  >
                    {lang === "ar"
                      ? "تصدير عرض سعر الشراء للمسؤول المالي"
                      : "Export to Finance"}
                  </button>
                </>
              )}

              {selectedReq.status === "في انتظار تعميد المسؤول المالي" &&
                isRoleAuthorizedForOrder && (
                  <button
                    disabled={isSaving}
                    onClick={handleRevertSendToFinance}
                    className="px-5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold transition"
                  >
                    {lang === "ar"
                      ? "إلغاء التحويل (تراجع للتسعير)"
                      : "Revert & Edit Quote"}
                  </button>
                )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg z-[2000] font-bold">
          {toast.message}
        </div>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in duration-300 border border-slate-100">
            <div className="p-6">
              <h3 className="text-lg font-black text-slate-800 mb-2">
                {lang === "ar" ? "تأكيد الإجراء" : "Confirm Action"}
              </h3>
              <p className="text-slate-600 font-bold text-sm leading-relaxed">
                {confirmDialog.message}
              </p>
            </div>
            <div className="flex bg-slate-50 border-t border-slate-100 p-4 gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 px-4 py-2.5 bg-white text-slate-700 font-extrabold text-sm rounded-xl border-slate-200 border cursor-pointer hover:bg-slate-50 transition"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="flex-1 px-4 py-2.5 bg-[#0072BC] text-white font-extrabold text-sm rounded-xl cursor-pointer hover:bg-blue-700 shadow-md transition"
              >
                {lang === "ar" ? "تأكيد واستمرار" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SuppliersPortalView({ lang, user }: { lang: "ar" | "en"; user: any }) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSup, setEditingSup] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dynamic/suppliers?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setSuppliers(Array.isArray(data) ? data : []);
      }
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSave = async () => {
    if (!editingSup.name) return alert("Name Required");
    setIsSaving(true);
    const ts = new Date().toISOString();
    try {
      const payload = {
        ...editingSup,
        id: editingSup.id || `SUP-${Date.now()}`,
        createdAt: editingSup.id ? editingSup.createdAt : ts,
      };
      const url = editingSup.id
        ? `/api/dynamic/suppliers/${editingSup.id}`
        : `/api/dynamic/suppliers`;
      const method = editingSup.id ? "PUT" : "POST";
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (e) {}
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    setConfirmDialog({
      message:
        lang === "ar"
          ? "هل أنت متأكد من حذف المورد بشكل نهائي؟"
          : "Are you sure you want to delete this supplier?",
      onConfirm: async () => {
        try {
          await fetch(`/api/dynamic/suppliers/${id}`, { method: "DELETE" });
          fetchSuppliers();
        } catch (e) {}
      },
    });
  };

  return (
    <div className="space-y-4">
      {confirmDialog && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in duration-300 border border-slate-100">
            <div className="p-6">
              <h3 className="text-lg font-black text-slate-800 mb-2">
                {lang === "ar" ? "تأكيد الإجراء" : "Confirm Action"}
              </h3>
              <p className="text-slate-600 font-bold text-sm leading-relaxed">
                {confirmDialog.message}
              </p>
            </div>
            <div className="flex bg-slate-50 border-t border-slate-100 p-4 gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 px-4 py-2.5 bg-white text-slate-700 font-extrabold text-sm rounded-xl border-slate-200 border cursor-pointer hover:bg-slate-50 transition"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="flex-1 px-4 py-2.5 bg-[#0072BC] text-white font-extrabold text-sm rounded-xl cursor-pointer hover:bg-blue-700 shadow-md transition"
              >
                {lang === "ar" ? "تأكيد واستمرار" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-4 flex-wrap">
        <input
          type="text"
          placeholder={
            lang === "ar" ? "بحث باسم المورد المندوب أو التخصص..." : "Search..."
          }
          className="flex-1 p-3 border rounded-2xl outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          onClick={() => {
            setEditingSup({});
            setIsModalOpen(true);
          }}
          className="px-5 py-3 bg-[#0072BC] text-white rounded-2xl font-bold flex gap-2 items-center"
        >
          <Plus className="w-5 h-5" />
          {lang === "ar" ? "إضافة مورد" : "Add Supplier"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers
          .filter(
            (s) =>
              (s.name || "").includes(searchTerm) ||
              (s.specialty || "").includes(searchTerm),
          )
          .map((s) => (
            <div
              key={s.id}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative group overflow-hidden"
            >
              <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setEditingSup(s);
                    setIsModalOpen(true);
                  }}
                  className="p-2 hover:bg-slate-100 text-slate-500 rounded-lg"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="p-2 hover:bg-rose-100 text-rose-500 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                <Building2Icon />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                <TranslatedText text={s.name} lang={lang} />
              </h3>
              <p className="text-xs text-slate-500 font-bold mb-4">
                <TranslatedText text={s.specialty} lang={lang} fallback={lang === "ar" ? "بدون تخصص" : "No specialty"} />
              </p>
              <div className="space-y-2 text-xs text-slate-600">
                {s.iban && (
                  <p>
                    <span className="text-slate-400 ml-1">IBAN:</span>{" "}
                    <span className="font-mono">{s.iban}</span>
                  </p>
                )}
                {s.address && (
                  <p>
                    <span className="text-slate-400 ml-1">
                      {lang === "ar" ? "العنوان:" : "Addr:"}
                    </span>{" "}
                    <TranslatedText text={s.address} lang={lang} />
                  </p>
                )}
                <hr className="my-2 border-slate-100" />
                <p>
                  <span className="text-slate-400 ml-1">
                    {lang === "ar" ? "المندوب:" : "Rep:"}
                  </span>{" "}
                  <strong className="text-slate-700">
                    <TranslatedText text={s.repName} lang={lang} />
                  </strong>{" "}
                  {s.repNationality ? `(${s.repNationality})` : ""}
                </p>
                <p>
                  <span className="text-slate-400 ml-1">
                    {lang === "ar" ? "جوال:" : "Phone:"}
                  </span>{" "}
                  <span dir="ltr">{s.repPhone}</span>
                </p>
              </div>

              {s.repPhone && (
                <a
                  href={`https://wa.me/${s.repPhone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 w-full block text-center py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl transition text-sm"
                >
                  تواصل واتساب
                </a>
              )}
            </div>
          ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold">
                {editingSup.id
                  ? lang === "ar"
                    ? "تعديل المورد"
                    : "Edit Supplier"
                  : lang === "ar"
                    ? "إضافة مورد"
                    : "New Supplier"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <input
                type="text"
                placeholder={lang === "ar" ? "اسم المورد" : "Supplier Name"}
                className="w-full p-3 border rounded-xl"
                value={editingSup.name || ""}
                onChange={(e) =>
                  setEditingSup({ ...editingSup, name: e.target.value })
                }
              />
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs text-slate-500 font-bold">IBAN</span>
                  {editingSup.iban && (() => {
                    const det = detectBankFromIban(editingSup.iban, lang);
                    return det.matched ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                        ✓ {lang === "ar" ? det.ar : det.en}
                      </span>
                    ) : null;
                  })()}
                </div>
                <input
                  type="text"
                  placeholder="IBAN"
                  className="w-full p-3 border rounded-xl font-mono text-center text-sm"
                  value={editingSup.iban || ""}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().replace(/\s+/g, "");
                    setEditingSup({ ...editingSup, iban: val });
                  }}
                />
              </div>
              <input
                type="text"
                placeholder={lang === "ar" ? "العنوان" : "Address"}
                className="w-full p-3 border rounded-xl"
                value={editingSup.address || ""}
                onChange={(e) =>
                  setEditingSup({ ...editingSup, address: e.target.value })
                }
              />
              <input
                type="text"
                placeholder={lang === "ar" ? "التخصص" : "Specialty"}
                className="w-full p-3 border rounded-xl"
                value={editingSup.specialty || ""}
                onChange={(e) =>
                  setEditingSup({ ...editingSup, specialty: e.target.value })
                }
              />
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <h4 className="font-bold text-sm text-slate-500">
                  {lang === "ar" ? "بيانات المندوب" : "Rep Info"}
                </h4>
                <input
                  type="text"
                  placeholder={lang === "ar" ? "اسم المندوب" : "Rep Name"}
                  className="w-full p-3 border rounded-xl bg-white"
                  value={editingSup.repName || ""}
                  onChange={(e) =>
                    setEditingSup({ ...editingSup, repName: e.target.value })
                  }
                />
                <input
                  type="tel"
                  placeholder={
                    lang === "ar" ? "رقم الجوال (مع رمز الدولة)" : "Phone No"
                  }
                  className="w-full p-3 border rounded-xl bg-white"
                  value={editingSup.repPhone || ""}
                  onChange={(e) =>
                    setEditingSup({ ...editingSup, repPhone: e.target.value })
                  }
                  dir="ltr"
                />
                <input
                  type="text"
                  placeholder={
                    lang === "ar"
                      ? "الجنسية (اختياري)"
                      : "Nationality (Optional)"
                  }
                  className="w-full p-3 border rounded-xl bg-white"
                  value={editingSup.repNationality || ""}
                  onChange={(e) =>
                    setEditingSup({
                      ...editingSup,
                      repNationality: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 bg-white border hover:bg-slate-100 text-slate-700 rounded-xl font-bold transition"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                disabled={isSaving}
                onClick={handleSave}
                className="flex-1 py-3 bg-[#0072BC] hover:bg-[#005a96] text-white rounded-xl font-bold transition"
              >
                {lang === "ar" ? "حفظ المورد" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Building2Icon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  );
}
