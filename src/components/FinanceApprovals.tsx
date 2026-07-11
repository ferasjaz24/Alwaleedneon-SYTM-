import { getStatusColors } from '../lib/statusUtils';
import { getAccessLevel, getAdvancedPermissionScope } from '../lib/permissions';
import React, { useState, useEffect } from "react";
import {
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  Building,
  Target,
} from "lucide-react";
import {
  sharedPrintHeader,
  sharedPrintFooter,
  sharedPrintStyles,
} from "../utils/PrintShared";

interface FinanceApprovalsProps {
  lang: "ar" | "en";
  user: any;
}

export default function FinanceApprovals({
  lang,
  user,
}: FinanceApprovalsProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [filterMonth, setFilterMonth] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRequests = requests.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchSearch = r.projectName?.toLowerCase().includes(q) || r.quotationNumber?.toLowerCase().includes(q);
    const matchMonth = filterMonth ? r.sentToFinanceAt?.startsWith(filterMonth) || r.createdAt?.startsWith(filterMonth) : true;
    return matchSearch && matchMonth;
  });

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const ts = Date.now();
      const [rReqs, rSupps] = await Promise.all([
        fetch(`/api/dynamic/pricing_requests?t=${ts}`).then((r) =>
          r.ok ? r.json() : [],
        ),
        fetch(`/api/dynamic/suppliers?t=${ts}`).then((r) =>
          r.ok ? r.json() : [],
        ),
      ]);
      // Filter for ones that are sent to Finance or rejected from Finance
      const procurementViewAccess = getAdvancedPermissionScope(user, "procurement", "finance_approval", "view_finance_po");
      setRequests(
        Array.isArray(rReqs)
          ? rReqs.filter(
              (r: any) => {
                if (procurementViewAccess === 'own' && r.requestedBy !== user.username) return false;
                if (procurementViewAccess === 'none') return false;
                return r.status === "في انتظار تعميد المسؤول المالي" ||
                r.status === "تم اصدار امر شراء" ||
                r.status === "مرفوض من المالية";
              }
            )
          : [],
      );
      setSuppliers(Array.isArray(rSupps) ? rSupps : []);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleExportPDF = () => {
    if (!selectedReq) return;
    const printWin = window.open("", "_blank");
    if (!printWin) return;

    let html = `
      <html>
      <head>
        <title>Purchase Order Finance</title>
        <style>
          ${sharedPrintStyles}
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #f8f9fa; }
        </style>
      </head>
      <body dir="rtl">
        ${sharedPrintHeader}
        <h2 style="text-align: center; margin-bottom: 5px;">تعميد عرض الشراء (Finance)</h2>
        <h4 style="text-align: center; color: #555; margin-top: 0;">المشروع: ${selectedReq.projectName}</h4>
        
        <div style="margin-top:20px;">
          <p><strong>رقم الكوتيشن:</strong> ${selectedReq.quotationNumber}</p>
          <p><strong>بواسطة:</strong> ${selectedReq.requestedBy}</p>
        </div>

        <div style="margin-top:20px;">
          <h3>المواد المتوفرة (الكمية تغطي الطلب)</h3>
          <table>
            <tr><th>الصنف</th><th>الكمية</th></tr>
            ${selectedReq.inStockItems?.map((i: any) => `<tr><td>${i.itemName}</td><td>${i.qty}</td></tr>`).join("") || "لا يوجد"}
          </table>
        </div>
        
        <div style="margin-top:20px;">
          <h3>تسعيرة الشراء واعتمادها</h3>
          <table>
            <tr><th>المادة</th><th>الكمية</th><th>المورد</th><th>السعر الإفرادي</th><th>شامل الضريبة؟</th><th>الإجمالي</th></tr>
            ${
              selectedReq.pricingDetails
                ?.map((i: any) => {
                  const total =
                    parseFloat(i.price || 0) * parseFloat(i.quantity || 0);
                  const sName =
                    suppliers.find((s) => s.id === i.supplierId)?.name ||
                    i.supplierName ||
                    i.supplierId ||
                    "";
                  return `<tr>
                <td>${i.materialName}</td>
                <td>${i.quantity}</td>
                <td>${sName}</td>
                <td>${i.price}</td>
                <td>${i.isVatInclusive ? "نعم" : "لا"}</td>
                <td>${total.toFixed(2)}</td>
              </tr>`;
                })
                .join("") || "لا يوجد"
            }
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
                  const matchedItems =
                    selectedReq.pricingDetails
                      ?.filter((q: any) => {
                        const itemName = q.materialName
                          ? (q.materialName || '').toLowerCase()
                          : "";
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
                      .map((q: any) => q.materialName)
                      .join("، ") || "";

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
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    printWin.document.title = `Finance_Approval_${selectedReq.quotationNumber || selectedReq.id}`;
    printWin.print();
  };

  const handleApprove = async () => {
    if (!selectedReq) return;
    setConfirmDialog({
      message:
        lang === "ar"
          ? "هل أنت متأكد من قبول عرض الشراء وإنشاء أمر شراء في النظام؟"
          : "Are you sure you want to approve and create a PO?",
      onConfirm: async () => {
        setIsSaving(true);
        try {
          const approverName = user.name || user.username || "المالية";
          const approveAction = lang === "ar"
            ? "تم قبول عرض الشراء واعتماد اصدار امر الشراء من الادارة المالية"
            : "Approved and PO Created by Finance";

          // 1. Update purchase request -> became an order
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
                financeApprovedBy: user.username,
                financeApprovedAt: new Date().toISOString(),
                updatesLog: [
                  ...(selectedReq.updatesLog || []),
                  {
                    user: approverName,
                    action: approveAction,
                    timestamp: new Date().toISOString(),
                  },
                ],
              }),
            },
          );

          // 2. Update pricing request -> completed
          const payload = {
            status: "تم اصدار امر شراء",
            financeApprovedBy: user.username,
            financeApprovedAt: new Date().toISOString(),
            updatesLog: [
              ...(selectedReq.updatesLog || []),
              {
                user: approverName,
                action: approveAction,
                timestamp: new Date().toISOString(),
              },
            ],
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
            setToast({
              message:
                lang === "ar"
                  ? "تم قبول وانشاء امر شراء بنجاح!"
                  : "Approved and PO Created!",
              type: "success",
            });
            fetchRequests();
            setSelectedReq(null);
          }
        } catch (e) {
          setToast({ message: "Error", type: "error" });
        }
        setIsSaving(false);
      },
    });
  };

  const handleReject = async () => {
    if (!selectedReq) return;
    if (!rejectReason.trim()) {
      alert(
        lang === "ar" ? "يجب ادخال سبب الرفض!" : "Reject reason is required!",
      );
      return;
    }

    setConfirmDialog({
      message:
        lang === "ar"
          ? "هل أنت متأكد من رفض عرض الشراء وإعادته للمشتريات؟"
          : "Are you sure you want to reject this quote?",
      onConfirm: async () => {
        setIsSaving(true);
        try {
          const rejecterName = user.name || user.username || "المالية";
          const rejectAction = lang === "ar"
            ? `تم رفض عرض الشراء من الإدارة المالية - السبب: ${rejectReason}`
            : `Quote Rejected by Finance - Reason: ${rejectReason}`;

          const payload = {
            status: "مرفوض من المالية",
            financeRejectReason: rejectReason,
            financeRejectedBy: user.username,
            financeRejectedAt: new Date().toISOString(),
            updatesLog: [
              ...(selectedReq.updatesLog || []),
              {
                user: rejecterName,
                action: rejectAction,
                timestamp: new Date().toISOString(),
              },
            ],
          };
          const res = await fetch(
            `/api/dynamic/pricing_requests/${selectedReq.id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            },
          );

          // Optional: Update original request status
          await fetch(
            `/api/dynamic/material_purchase_requests/${selectedReq.originalRequestId}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: "مرفوض من المالية",
                updatesLog: [
                  ...(selectedReq.updatesLog || []),
                  {
                    user: rejecterName,
                    action: rejectAction,
                    timestamp: new Date().toISOString(),
                  },
                ],
              }),
            },
          );

          if (res.ok) {
            setToast({
              message:
                lang === "ar" ? "تم رفض عرض الشراء وإرجاعه" : "Quote Rejected",
              type: "success",
            });
            fetchRequests();
            setSelectedReq(null);
            setRejectReason("");
          }
        } catch (e) {
          setToast({ message: "Error", type: "error" });
        }
        setIsSaving(false);
      },
    });
  };

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Building className="w-7 h-7 text-[#0072BC]" />
          {lang === "ar"
            ? "بوابة تعميد عرض الشراء"
            : "Finance Approvals Quotes"}
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <input
            type="text"
            placeholder="بحث بالمشروع، رقم العرض..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
          />
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full sm:w-48 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.map((r, i) => (
            <div
              key={i}
              className="flex flex-col md:flex-row items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:shadow-md transition"
              onClick={() => setSelectedReq(r)}
            >
              <div>
                <h3 className="font-bold text-slate-800 text-lg">
                  {r.projectName} - {r.quotationNumber}
                </h3>
                <p className="text-sm text-slate-500">
                  {lang === "ar" ? "مرسل بواسطة:" : "Sent by:"}{" "}
                  {r.sentToFinanceBy}
                </p>
                <div className={`mt-2 text-xs font-bold inline-block px-3 py-1 rounded-full ${getStatusColors(r.status)}`}>{r.status}</div>
              </div>
              <button className="mt-4 md:mt-0 px-4 py-2 bg-slate-50 text-[#0072BC] hover:bg-blue-50 border border-blue-100 rounded-xl font-bold text-sm transition">
                {lang === "ar" ? "عرض الطلب والتسعير" : "View Quote & Details"}
              </button>
            </div>
          ))}
          {requests.length === 0 && (
            <div className="text-center text-slate-400 py-10 font-bold bg-white rounded-2xl border border-slate-100">
              {lang === "ar"
                ? "لا توجد طلبات تعميد حاليا"
                : "No approvals requested."}
            </div>
          )}
        </div>
      )}

      {selectedReq && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">
            <button
              onClick={() => {
                setSelectedReq(null);
                setRejectReason("");
              }}
              className="absolute top-4 left-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition"
            >
              <XCircle className="w-5 h-5" />
            </button>
            <div className="p-8">
              <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2 border-b pb-4">
                <Target className="w-6 h-6 text-[#0072BC]" />
                {lang === "ar"
                  ? "تفاصيل عرض التسعيرة (المالية)"
                  : "Finance Quote Approval Details"}
                {selectedReq.status === "تم اصدار امر شراء" && (
                  <span className="text-sm bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full">
                    {lang === "ar" ? "تم الاعتماد" : "Approved"}
                  </span>
                )}
                {selectedReq.status === "مرفوض من المالية" && (
                  <span className="text-sm bg-rose-100 text-rose-800 border border-rose-200 px-3 py-1 rounded-full">
                    {lang === "ar" ? "مرفوض" : "Rejected"}
                  </span>
                )}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs text-slate-400 mb-1">
                    {lang === "ar" ? "المشروع" : "Project"}
                  </p>
                  <p className="font-bold text-slate-800">
                    {selectedReq.projectName}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs text-slate-400 mb-1">
                    {lang === "ar" ? "رقم الكوتيشن" : "Quotation"}
                  </p>
                  <p className="font-bold text-slate-800">
                    {selectedReq.quotationNumber}
                  </p>
                </div>
              </div>

              <div className="mb-6 border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-[#0072BC]/5 border-b border-slate-200 text-[#0072BC]">
                    <tr>
                      <th className="p-3 font-bold">
                        {lang === "ar" ? "المادة المطلوبة" : "Material"}
                      </th>
                      <th className="p-3 font-bold text-center">
                        {lang === "ar" ? "الكمية" : "Qty"}
                      </th>
                      <th className="p-3 font-bold text-center">
                        {lang === "ar" ? "المورد" : "Supplier"}
                      </th>
                      <th className="p-3 font-bold text-center">
                        {lang === "ar" ? "السعر الإفرادي" : "Price"}
                      </th>
                      <th className="p-3 font-bold text-center">
                        {lang === "ar" ? "الضريبة" : "VAT Inc."}
                      </th>
                      <th className="p-3 font-bold text-center">
                        {lang === "ar" ? "الإجمالي" : "Total"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReq.pricingDetails?.map((q: any, idx: number) => {
                      const qty = parseFloat(q.quantity || 0);
                      const price = parseFloat(q.price || 0);
                      const total = qty * price;
                      return (
                        <tr
                          key={idx}
                          className="border-b last:border-b-0 hover:bg-slate-50 relative group"
                        >
                          <td className="p-3 font-bold text-slate-700">
                            {q.materialName}
                          </td>
                          <td className="p-3 text-center font-bold">
                            {q.quantity}
                          </td>
                          <td className="p-3 text-center text-slate-600">
                            {q.supplierName || q.supplierId || "-"}
                          </td>
                          <td className="p-3 text-center font-mono text-blue-700 text-xs bg-blue-50/50">
                            {q.price}
                          </td>
                          <td className="p-3 text-center">
                            {q.isVatInclusive ? (
                              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-bold">
                                شامل
                              </span>
                            ) : (
                              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                غير شامل
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center font-bold text-[#0072BC] bg-[#0072BC]/5">
                            {total.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-[#0072BC]/10 border-t-2 border-[#0072BC]/20">
                    <tr>
                      <td
                        colSpan={5}
                        className="p-3 font-black text-left text-[#0072BC]"
                      >
                        {lang === "ar"
                          ? "المجموع الكلي المبدئي:"
                          : "Approx Grand Total:"}
                      </td>
                      <td className="p-3 text-center font-black text-indigo-700 text-lg">
                        {selectedReq.pricingDetails
                          ?.reduce(
                            (sum: number, q: any) =>
                              sum +
                              parseFloat(q.quantity || 0) *
                                parseFloat(q.price || 0),
                            0,
                          )
                          .toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {selectedReq.pricingDetails &&
                selectedReq.pricingDetails.length > 0 && (
                  <div className="mb-8">
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
                            const matchedItems =
                              selectedReq.pricingDetails
                                ?.filter((q: any) => {
                                  const itemName = q.materialName
                                    ? (q.materialName || '').toLowerCase()
                                    : "";
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
                                .map((q: any) => q.materialName)
                                .join("، ") || "";

                            if (!matchedItems && suppliers.length > 5)
                              return null;
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

              {/* سجل تتبع العمليات والتعميد (Workflow Log) */}
              <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl mb-6">
                <h4 className="text-xs font-black text-slate-500 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                  {lang === "ar"
                    ? "سجل تتبع العمليات والاعتمادات (Workflow Audit Log):"
                    : "Workflow Audit Log:"}
                </h4>
                <div className="space-y-2">
                  {(!selectedReq.updatesLog || selectedReq.updatesLog.length === 0) ? (
                    <div className="space-y-2">
                      <div className="text-[10px] flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-white p-3 border border-slate-100 rounded-xl">
                        <span className="font-bold text-slate-700">
                          {lang === "ar" ? "تم إنشاء طلب التسعير وإرساله للمالية" : "Pricing request submitted to Finance"}{" "}
                          <span className="text-indigo-600 font-black px-1">
                            بواسطة ({selectedReq.sentToFinanceBy || selectedReq.requestedBy || "---"})
                          </span>
                        </span>
                        <span className="text-slate-400 font-mono text-[9px]" dir="ltr">
                          {selectedReq.sentToFinanceAt ? new Date(selectedReq.sentToFinanceAt).toLocaleString('en-US') : selectedReq.createdAt ? new Date(selectedReq.createdAt).toLocaleString('en-US') : "---"}
                        </span>
                      </div>
                      
                      {selectedReq.status === "تم اصدار امر شراء" && (
                        <div className="text-[10px] flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-white p-3 border border-slate-100 rounded-xl">
                          <span className="font-bold text-emerald-700">
                            {lang === "ar" ? "تم قبول طلب الشراء واعتماده مالياً" : "PO Approved and committed by Finance"}{" "}
                            <span className="text-emerald-600 font-black px-1">
                              بواسطة ({selectedReq.financeApprovedBy || "المالية"})
                            </span>
                          </span>
                          <span className="text-slate-400 font-mono text-[9px]" dir="ltr">
                            {selectedReq.financeApprovedAt ? new Date(selectedReq.financeApprovedAt).toLocaleString('en-US') : "---"}
                          </span>
                        </div>
                      )}

                      {selectedReq.status === "مرفوض من المالية" && (
                        <div className="text-[10px] flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-white p-3 border border-slate-100 rounded-xl">
                          <span className="font-bold text-rose-700">
                            {lang === "ar" ? "تم رفض الطلب وإعادته للمشتريات" : "Request Rejected by Finance"}{" "}
                            <span className="text-rose-600 font-black px-1">
                              بواسطة ({selectedReq.financeRejectedBy || "المالية"})
                            </span>
                            {selectedReq.financeRejectReason && <span className="block text-slate-500 font-normal mt-1">السبب: {selectedReq.financeRejectReason}</span>}
                          </span>
                          <span className="text-slate-400 font-mono text-[9px]" dir="ltr">
                            {selectedReq.financeRejectedAt ? new Date(selectedReq.financeRejectedAt).toLocaleString('en-US') : "---"}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedReq.updatesLog.map((log: any, i: number) => (
                        <div
                          key={i}
                          className="text-[10px] flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-white p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition"
                        >
                          <span className="font-bold text-slate-700">
                            {log.action}{" "}
                            <span className="text-indigo-600 font-black px-1">
                              بواسطة ({log.user})
                            </span>
                          </span>
                          <span className="text-slate-400 font-mono text-[9px]" dir="ltr">
                            {new Date(log.timestamp).toLocaleString('en-US')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mb-8">
                <button
                  onClick={handleExportPDF}
                  className="flex flex-1 items-center justify-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition shadow-md shadow-slate-900/20"
                >
                  <FileText className="w-5 h-5" />
                  {lang === "ar" ? "تصدير عرض السعر (PDF)" : "Export PDF"}
                </button>
              </div>

              {selectedReq.status === "في انتظار تعميد المسؤول المالي" && (
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-inner">
                  <h3 className="font-bold text-slate-800 mb-4">
                    {lang === "ar" ? "قرار الاعتماد" : "Approval Decision"}
                  </h3>
                  <div className="flex flex-col gap-4">
                    <button
                      disabled={isSaving}
                      onClick={handleApprove}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition shadow-lg shadow-emerald-600/30 text-lg"
                    >
                      <CheckCircle className="w-6 h-6" />
                      {lang === "ar"
                        ? "قبول وإنشاء أمر شراء رسمي"
                        : "Approve & Issue PO"}
                    </button>

                    <div className="mt-4 border-t border-slate-200 pt-6">
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        {lang === "ar"
                          ? "سبب الرفض (إلزامي في حال الرفض)"
                          : "Rejection Reason (Required if Rejecting)"}
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 mb-3 text-sm h-20 resize-none shadow-inner"
                        placeholder="..."
                      />
                      <button
                        disabled={isSaving}
                        onClick={handleReject}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 rounded-xl transition shadow-sm"
                      >
                        <XCircle className="w-5 h-5" />
                        {lang === "ar"
                          ? "رفض عرض التسعير وإعادته للمشتريات"
                          : "Reject Quote"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg z-[3000] font-bold text-white ${toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}
        >
          {toast.message}
        </div>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100">
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
                className="flex-1 px-4 py-2.5 bg-white text-slate-700 font-extrabold text-sm rounded-xl border-slate-200 border hover:bg-slate-50 transition shadow-sm"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="flex-1 px-4 py-2.5 bg-[#0072BC] text-white font-extrabold text-sm rounded-xl hover:bg-blue-700 transition shadow-md"
              >
                {lang === "ar" ? "تأكيد" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
