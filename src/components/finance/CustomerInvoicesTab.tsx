import React, { useState, useEffect, useRef } from "react";
import { db } from "../../firebase";
import { collection, doc, getDocs, setDoc, getDoc } from "firebase/firestore";
import { getZatcaTLV } from "./ZatcaSettingsTab";
import { sharedPrintHeader, sharedPrintFooter, sharedPrintStyles } from "../../utils/PrintShared";

interface SignageItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxableAmount?: number;
  vatRate?: number;
  vatAmount?: number;
  lineTotal?: number;
}

interface CustomerInvoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  projectName: string;
  salesperson: string;
  invoiceType: "Tax Invoice" | "Simplified Tax Invoice";
  currency: string;
  status: "Draft" | "Issued" | "Partially Paid" | "Paid" | "Cancelled" | "Credit Note Issued";
  
  // Customer info
  customerId: string;
  customerName: string;
  customerAddress?: string;
  customerVatNumber?: string;
  customerCrNumber?: string;
  customerPhone?: string;
  customerEmail?: string;

  // Company info (copied from ZATCA settings at issue time)
  companyNameArabic: string;
  companyNameEnglish: string;
  companyVatNumber: string;
  companyCrNumber: string;
  companyAddress: string;

  // Quotation info
  quotationId: string;
  quotationNo: string;

  // Financial Items & Totals
  items: SignageItem[];
  subtotalBeforeDiscount: number;
  totalDiscount: number;
  taxableAmount: number;
  vatTotal: number;
  grandTotal: number;
  amountPaid: number;
  remainingAmount: number;

  // ZATCA specific
  zatcaStatus: "Not Submitted" | "Pending" | "Cleared" | "Reported" | "Failed";
  zatcaResponse?: string;
  zatcaErrorMessage?: string;
  qrCodeBase64?: string;
  invoiceHash?: string;
  
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

export default function CustomerInvoicesTab({ lang, user }: { lang: "ar" | "en"; user: any }) {
  // Lists from DB
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchNo, setSearchNo] = useState("");
  const [searchName, setSearchName] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterZatca, setFilterZatca] = useState("all");

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    actionLoading?: boolean;
    type?: "danger" | "warning" | "info" | "success";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Toast notifications state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info" | "warning";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (msg: string, type: "success" | "error" | "info" | "warning" = "success") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // Modal control
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<CustomerInvoice | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Searchable client state in modal
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClientForInvoice, setSelectedClientForInvoice] = useState<any | null>(null);

  // Form Fields
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNo: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split("T")[0],
    paymentTerms: "15 Days",
    projectName: "",
    salesperson: "",
    invoiceType: "Tax Invoice" as "Tax Invoice" | "Simplified Tax Invoice",
    currency: "SAR",
    customerId: "",
    customerName: "",
    customerAddress: "",
    customerVatNumber: "",
    customerCrNumber: "",
    customerPhone: "",
    customerEmail: "",
    quotationId: "",
    quotationNo: "",
    items: [] as SignageItem[],
    totalDiscount: 0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // Load invoices
      const invSnap = await getDocs(collection(db, "customer_invoices"));
      const invList = invSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as CustomerInvoice))
        .sort((a, b) => {
          const dateA = a.invoiceDate || "";
          const dateB = b.invoiceDate || "";
          if (dateA !== dateB) return dateB.localeCompare(dateA);
          return (b.invoiceNo || "").localeCompare(a.invoiceNo || "");
        });
      setInvoices(invList);

      // Load approved quotations (stage === 'Approved' or status === 'معتمد')
      const quoSnap = await getDocs(collection(db, "sales_quotations"));
      const quoList = quoSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setQuotations(quoList);

      // Load clients for manual billing
      const clientSnap = await getDocs(collection(db, "clients"));
      const clientList = clientSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setClients(clientList);

      // Load company ZATCA settings
      const companyDoc = await getDoc(doc(db, "settings", "zatca"));
      if (companyDoc.exists()) {
        setCompanySettings(companyDoc.data());
      } else {
        setCompanySettings({
          companyNameArabic: "شركة فنون الوليد للدعاية والإعلان",
          companyNameEnglish: "Al Waleed Arts Advertising Co.",
          vatNumber: "310123456700003",
          crNumber: "1010123456",
          nationalAddress: "الرياض، المملكة العربية السعودية",
          vatEnabled: true,
          defaultVatRate: 15
        });
      }
    } catch (err) {
      console.error("Error loading invoices data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenPrintTab = (inv: CustomerInvoice) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("الرجاء السماح بفتح النوافذ المنبثقة لطباعة الفاتورة");
      return;
    }

    const qrCodeHtml = inv.qrCodeBase64 ? `
      <div style="text-align: center;">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(inv.qrCodeBase64)}" style="width: 100px; height: 100px; border: 1px solid #cbd5e1; padding: 4px; border-radius: 4px; background: white;" />
        <div style="font-size: 8px; color: #94a3b8; margin-top: 2px;">ZATCA Compliant QR</div>
      </div>
    ` : `
      <div style="width: 100px; height: 100px; border: 1px dashed #cbd5e1; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #94a3b8;">ZATCA QR</div>
    `;

    const itemsRowsHtml = (inv.items || []).map((it, idx) => `
      <tr>
        <td style="text-align: center; color: #64748b;">${idx + 1}</td>
        <td><strong>${it.description}</strong></td>
        <td style="text-align: center; font-family: monospace;">${it.quantity}</td>
        <td style="text-align: left; font-family: monospace;">${Number(it.unitPrice || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
        <td style="text-align: left; font-family: monospace; color: #94a3b8;">${Number(it.discount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
        <td style="text-align: left; font-family: monospace;">${Number(it.taxableAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
        <td style="text-align: center; font-family: monospace;">${it.vatRate || 15}%</td>
        <td style="text-align: left; font-family: monospace;">${Number(it.vatAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
        <td style="text-align: left; font-family: monospace; font-weight: 900; color: #0072BC;">${Number(it.lineTotal || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="utf-8" />
         <title>فاتورة ضريبية - ${inv.invoiceNo}</title>
         <style>
           ${sharedPrintStyles}
           @media print {
             @page {
               margin: 10mm 12mm;
               size: A4;
             }
             .invoice-container {
               min-height: 94vh;
               page-break-inside: avoid;
             }
           }
           body {
             padding: 0;
             margin: 0;
             background: white;
             color: #1e293b;
             font-size: 11px;
             line-height: 1.5;
             -webkit-print-color-adjust: exact;
             print-color-adjust: exact;
           }
           .invoice-container {
             display: flex;
             flex-direction: column;
             min-height: 98vh;
             box-sizing: border-box;
             padding: 10px;
           }
           /* Compact style optimizations for 1 to 3 items */
           .compact-invoice {
             padding: 5px !important;
           }
           .compact-invoice > div:first-child {
             padding-bottom: 6px !important;
             margin-bottom: 12px !important;
           }
           .compact-invoice > div:first-child img {
             width: 50px !important;
             height: 50px !important;
           }
           .compact-invoice > div:first-child h2 {
             font-size: 16px !important;
           }
           .compact-invoice .title-area {
             margin-bottom: 8px !important;
           }
           .compact-invoice .title-tag {
             font-size: 11px !important;
             padding: 3px 10px !important;
           }
           .compact-invoice .meta-grid {
             margin-bottom: 8px !important;
             padding: 6px !important;
             gap: 6px !important;
           }
           .compact-invoice .meta-label {
             font-size: 8px !important;
           }
           .compact-invoice .meta-value {
             font-size: 10px !important;
           }
           .compact-invoice .details-grid {
             margin-bottom: 8px !important;
             gap: 8px !important;
           }
           .compact-invoice .details-box {
             padding: 6px 10px !important;
           }
           .compact-invoice .details-title {
             font-size: 10px !important;
             padding-bottom: 4px !important;
             margin-bottom: 4px !important;
           }
           .compact-invoice .items-table {
             margin-bottom: 8px !important;
           }
           .compact-invoice .items-table th {
             padding: 4px 6px !important;
             font-size: 8px !important;
           }
           .compact-invoice .items-table td {
             padding: 4px 6px !important;
             font-size: 9px !important;
           }
           .compact-invoice .totals-area {
             margin-bottom: 8px !important;
             gap: 10px !important;
           }
           .compact-invoice .bank-box, .compact-invoice .totals-box {
             padding: 6px 10px !important;
           }
           .compact-invoice .totals-row {
             padding: 2px 0 !important;
             font-size: 9px !important;
           }
           .compact-invoice .totals-row.grand {
             font-size: 11px !important;
             padding-top: 4px !important;
           }
           .compact-invoice .signatures {
             margin-top: 10px !important;
             padding-top: 10px !important;
           }
           .compact-invoice .sig-line {
             padding-top: 4px !important;
             font-size: 9px !important;
           }
          .title-area {
            text-align: center;
            margin-bottom: 24px;
          }
          .title-tag {
            display: inline-block;
            border: 2px solid #0072BC;
            color: #0072BC;
            font-size: 14px;
            font-weight: 900;
            padding: 6px 16px;
            border-radius: 6px;
            text-transform: uppercase;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            background: #f8fafc;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            margin-bottom: 20px;
          }
          .meta-item {
            display: flex;
            flex-direction: column;
            text-align: right;
          }
          .meta-label {
            font-size: 9px;
            color: #64748b;
            font-weight: bold;
          }
          .meta-value {
            font-size: 11px;
            font-weight: bold;
            color: #0f172a;
            margin-top: 2px;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 24px;
          }
          .details-box {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
            text-align: right;
          }
          .details-title {
            font-size: 11px;
            font-weight: 900;
            color: #0f172a;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
            margin-top: 0;
            margin-bottom: 8px;
          }
          .details-row {
            margin-bottom: 4px;
          }
          .details-row span {
            font-weight: bold;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
            text-align: right;
          }
          .items-table th {
            background: #f1f5f9;
            color: #475569;
            font-weight: bold;
            font-size: 9px;
            padding: 8px;
            border: 1px solid #cbd5e1;
          }
          .items-table td {
            padding: 8px;
            border: 1px solid #e2e8f0;
            font-size: 10px;
          }
          .items-table tr:nth-child(even) {
            background: #f8fafc;
          }
          .totals-area {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 30px;
            text-align: right;
          }
          .bank-box {
            width: 50%;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
          }
          .totals-box {
            width: 50%;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 12px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            font-size: 10px;
          }
          .totals-row.grand {
            font-size: 12px;
            font-weight: 900;
            color: #0072BC;
            border-top: 2px solid #cbd5e1;
            padding-top: 8px;
            margin-top: 4px;
          }
          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: auto;
            padding-top: 40px;
            text-align: center;
          }
          .sig-line {
            border-top: 1px dashed #cbd5e1;
            padding-top: 8px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container ${(inv.items || []).length <= 3 ? "compact-invoice" : ""}">
          ${sharedPrintHeader}
          
          <div class="title-area">
            <div class="title-tag">
              ${inv.invoiceType === "Tax Invoice" ? "فاتورة ضريبية / TAX INVOICE" : "فاتورة مبسطة / SIMPLIFIED TAX INVOICE"}
            </div>
          </div>

          <!-- Layout of QR Code and Info -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; direction: rtl;">
            <div style="display: flex; flex-direction: column; gap: 4px; text-align: right;">
              <p style="margin: 0; font-size: 11px;"><strong>الرقم الضريبي الموحد للمنشأة:</strong> <span style="font-family: monospace;">${inv.companyVatNumber || "310123456700003"}</span></p>
              <p style="margin: 0; font-size: 11px;"><strong>رقم السجل التجاري:</strong> <span style="font-family: monospace;">${inv.companyCrNumber || "1010123456"}</span></p>
              <p style="margin: 0; font-size: 10px; color: #64748b;">${inv.companyAddress || "الرياض، المملكة العربية السعودية"}</p>
            </div>
            
            ${qrCodeHtml}
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">رقم الفاتورة / Invoice No</span>
              <span class="meta-value" style="font-family: monospace; color: #0072BC;">${inv.invoiceNo}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">تاريخ الإصدار / Issue Date</span>
              <span class="meta-value">${inv.invoiceDate}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">تاريخ الاستحقاق / Due Date</span>
              <span class="meta-value">${inv.dueDate}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">طريقة الدفع / Payment Terms</span>
              <span class="meta-value">${inv.paymentTerms || "تحويل بنكي"}</span>
            </div>
          </div>

          <div class="details-grid">
            <div class="details-box">
              <h3 class="details-title">موجّه إلى / Customer Details</h3>
              <div class="details-row"><strong>اسم العميل:</strong> <span>${inv.customerName}</span></div>
              <div class="details-row"><strong>الرقم الضريبي:</strong> <span style="font-family: monospace;">${inv.customerVatNumber || "غير متوفر"}</span></div>
              <div class="details-row"><strong>رقم السجل:</strong> <span style="font-family: monospace;">${inv.customerCrNumber || "غير متوفر"}</span></div>
              <div class="details-row"><strong>العنوان:</strong> <span>${inv.customerAddress || "N/A"}</span></div>
              ${inv.customerPhone ? `<div class="details-row"><strong>الهاتف:</strong> <span>${inv.customerPhone}</span></div>` : ""}
            </div>

            <div class="details-box">
              <h3 class="details-title">تفاصيل المشروع / Project Info</h3>
              <div class="details-row"><strong>اسم المشروع:</strong> <span>${inv.projectName || "توريد لوحات إعلانية"}</span></div>
              <div class="details-row"><strong>رقم عرض السعر المرتبط:</strong> <span style="font-family: monospace;">${inv.quotationNo || "N/A"}</span></div>
              <div class="details-row"><strong>مسؤول المبيعات:</strong> <span>${inv.salesperson || "قسم المبيعات"}</span></div>
              <div class="details-row"><strong>العملة:</strong> <span>${inv.currency || "SAR"}</span></div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">#</th>
                <th style="width: 35%;">الوصف والبيان / Item Description</th>
                <th style="width: 8%; text-align: center;">الكمية / Qty</th>
                <th style="width: 10%; text-align: left;">السعر / Unit Price</th>
                <th style="width: 8%; text-align: left;">الخصم / Disc</th>
                <th style="width: 10%; text-align: left;">الخاضع للضريبة / Taxable</th>
                <th style="width: 6%; text-align: center;">النسبة / Rate</th>
                <th style="width: 10%; text-align: left;">الضريبة / VAT</th>
                <th style="width: 12%; text-align: left;">الإجمالي / Line Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRowsHtml}
            </tbody>
          </table>

          <div class="totals-area">
            <div class="bank-box">
              <h4 style="margin-top: 0; margin-bottom: 6px; font-size: 10px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">الحسابات البنكية المعتمدة للتحويل / Wire Details:</h4>
              <p style="margin: 0; font-size: 9px; color: #475569; line-height: 1.6;">
                يمكنكم سداد قيمة هذه الفاتورة بالتحويل البنكي المباشر لأحد الحسابات التالية:<br />
                • <strong>مصرف الراجحي:</strong> <span style="font-family: monospace;">SA48800000045612347890</span><br />
                • <strong>بنك الرياض:</strong> <span style="font-family: monospace;">SA22200000001234567891</span>
              </p>
            </div>

            <div class="totals-box">
              <div class="totals-row">
                <span>المجموع قبل الخصم / Subtotal:</span>
                <span style="font-family: monospace;">${Number(inv.subtotalBeforeDiscount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} ${inv.currency || "SAR"}</span>
              </div>
              <div class="totals-row" style="color: #ef4444;">
                <span>الخصومات الكلية / Total Discount:</span>
                <span style="font-family: monospace;">-${Number(inv.totalDiscount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} ${inv.currency || "SAR"}</span>
              </div>
              <div class="totals-row" style="border-top: 1px dashed #cbd5e1; padding-top: 6px; margin-top: 4px;">
                <span>المبلغ الخاضع للضريبة / Taxable Amount:</span>
                <span style="font-family: monospace;">${Number(inv.taxableAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} ${inv.currency || "SAR"}</span>
              </div>
              <div class="totals-row" style="color: #0369a1;">
                <span>ضريبة القيمة المضافة / VAT (15%):</span>
                <span style="font-family: monospace;">+${Number(inv.vatTotal || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} ${inv.currency || "SAR"}</span>
              </div>
              <div class="totals-row grand">
                <span>الصافي النهائي المستحق / Grand Total:</span>
                <span style="font-family: monospace;">${Number(inv.grandTotal || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} ${inv.currency || "SAR"}</span>
              </div>
            </div>
          </div>

          <div class="signatures">
            <div>
              <div class="sig-line">توقيع المستلم / Receiver Signature</div>
              <p style="margin: 4px 0 0 0; font-size: 9px; color: #64748b;">اسم وتوقيع وختم العميل المستلم</p>
            </div>
            <div>
              <div class="sig-line" style="color: #0072BC; border-top-color: #0072BC;">توقيع المنشأة المعتمد / Authorized Signature</div>
              <p style="margin: 4px 0 0 0; font-size: 9px; color: #64748b;">قسم الإدارة المالية والمحاسبية</p>
            </div>
          </div>

          ${sharedPrintFooter}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // When selected quotation changes, prefill items & client details
  const handleQuotationChange = (quoId: string) => {
    if (!quoId) return;
    const q = quotations.find((x) => x.id === quoId);
    if (!q) return;

    // Look up client details in client portal (clients state)
    const targetClient = clients.find(
      (c) =>
        c.id === q.clientId ||
        c.id === q.customerId ||
        c.clientName === q.clientName ||
        c.companyName === q.clientName
    );

    let customerAddress = q.installationAddress || q.clientAddress || "";
    let customerVatNumber = q.clientVatNumber || q.vatNumber || "";
    let customerCrNumber = q.clientCrNumber || "";
    let customerPhone = q.clientPhone || q.clientMobile || "";
    let customerEmail = q.clientEmail || "";

    if (targetClient) {
      customerVatNumber = targetClient.taxNumber || targetClient.vatNumber || customerVatNumber || "";
      customerCrNumber = targetClient.crNumber || customerCrNumber || "";
      customerPhone = targetClient.mobile || targetClient.phone || customerPhone || "";
      customerEmail = targetClient.email || customerEmail || "";
      
      let addr = "";
      if (targetClient.nationalAddress) {
        const na = targetClient.nationalAddress;
        addr = [na.streetName, na.district, na.city, na.buildingNumber, na.postalCode].filter(Boolean).join(", ");
      }
      if (!addr) {
        addr = targetClient.city || targetClient.country || "";
      }
      if (addr) {
        customerAddress = addr;
      }
    }

    // Map quotation items to SignageItem with calculations
    const mappedItems = (q.items || []).map((it: any, index: number) => {
      const discount = 0;
      const taxable = it.quantity * it.unitPrice - discount;
      const vatRate = companySettings?.defaultVatRate || 15;
      const vatAmount = (taxable * vatRate) / 100;
      return {
        id: it.id || `ITEM_${index}_${Date.now()}`,
        description: it.description || "",
        quantity: Number(it.quantity || 1),
        unitPrice: Number(it.unitPrice || 0),
        discount: discount,
        taxableAmount: taxable,
        vatRate: vatRate,
        vatAmount: vatAmount,
        lineTotal: taxable + vatAmount,
      } as SignageItem;
    });

    setInvoiceForm((prev) => ({
      ...prev,
      quotationId: q.id,
      quotationNo: q.quotationNumber || q.id,
      projectName: q.projectName || "",
      salesperson: q.salesRepName || user?.username || "",
      customerName: targetClient?.companyName || targetClient?.clientName || q.clientName || "",
      customerId: q.clientId || q.customerId || targetClient?.id || "",
      customerAddress,
      customerVatNumber,
      customerCrNumber,
      customerPhone,
      customerEmail,
      items: mappedItems,
      invoiceNo: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    }));
  };

  // Live item total updates
  const updateItemRow = (index: number, field: keyof SignageItem, val: any) => {
    const updated = [...invoiceForm.items];
    const item = { ...updated[index], [field]: val };

    // Recalculate row
    const qty = Number(field === "quantity" ? val : item.quantity);
    const price = Number(field === "unitPrice" ? val : item.unitPrice);
    const disc = Number(field === "discount" ? val : (item.discount || 0));

    const taxable = qty * price - disc;
    const vatRate = item.vatRate || companySettings?.defaultVatRate || 15;
    const vatAmount = (taxable * vatRate) / 100;

    item.quantity = qty;
    item.unitPrice = price;
    item.discount = disc;
    item.taxableAmount = taxable;
    item.vatAmount = vatAmount;
    item.lineTotal = taxable + vatAmount;

    updated[index] = item;
    setInvoiceForm((prev) => ({ ...prev, items: updated }));
  };

  // Add Item Line
  const addLine = () => {
    const newLine: SignageItem = {
      id: `ITEM_MAN_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      description: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxableAmount: 0,
      vatRate: companySettings?.defaultVatRate || 15,
      vatAmount: 0,
      lineTotal: 0,
    };
    setInvoiceForm((prev) => ({ ...prev, items: [...prev.items, newLine] }));
  };

  // Remove Item Line
  const removeLine = (index: number) => {
    const updated = [...invoiceForm.items];
    updated.splice(index, 1);
    setInvoiceForm((prev) => ({ ...prev, items: updated }));
  };

  // Math totals calculation
  const getFormTotals = () => {
    let subtotalBeforeDiscount = 0;
    let totalDiscount = Number(invoiceForm.totalDiscount || 0);
    
    invoiceForm.items.forEach((it) => {
      subtotalBeforeDiscount += it.quantity * it.unitPrice;
    });

    const taxableAmount = subtotalBeforeDiscount - totalDiscount;
    let vatTotal = 0;
    
    invoiceForm.items.forEach((it) => {
      // proportional discount allocation per line to compute line VAT accurately
      const linePropDisc = subtotalBeforeDiscount > 0 ? (it.quantity * it.unitPrice / subtotalBeforeDiscount) * totalDiscount : 0;
      const lineTaxable = (it.quantity * it.unitPrice) - linePropDisc;
      const rate = it.vatRate || companySettings?.defaultVatRate || 15;
      vatTotal += (lineTaxable * rate) / 100;
    });

    const grandTotal = taxableAmount + vatTotal;

    return {
      subtotalBeforeDiscount,
      totalDiscount,
      taxableAmount,
      vatTotal,
      grandTotal,
    };
  };

  const { subtotalBeforeDiscount, totalDiscount, taxableAmount, vatTotal, grandTotal } = getFormTotals();

  // Save/Issue Invoice
  const handleSaveInvoice = async (isDraft: boolean) => {
    if (!invoiceForm.customerName) {
      alert(lang === "ar" ? "يرجى تحديد العميل أولاً" : "Please specify a customer");
      return;
    }
    if (invoiceForm.items.length === 0) {
      alert(lang === "ar" ? "لا يمكن إصدار فاتورة فارغة بدون أصناف" : "Cannot issue an empty invoice");
      return;
    }
    if (grandTotal <= 0) {
      alert(lang === "ar" ? "يجب أن يكون إجمالي الفاتورة أكبر من صفر" : "Grand total must be greater than zero");
      return;
    }

    // Check duplicate invoice numbers
    const isDup = invoices.some((x) => x.invoiceNo === invoiceForm.invoiceNo && x.id !== selectedInvoice?.id);
    if (isDup) {
      alert(lang === "ar" ? "رقم الفاتورة مكرر، يرجى كتابة رقم آخر" : "Invoice number already exists");
      return;
    }

    try {
      const invoiceId = selectedInvoice ? selectedInvoice.id : `INV_${Date.now()}`;
      const nowStr = new Date().toISOString();
      const userStr = user?.username || "System";

      // ZATCA Compliance TLV Base64 QR code generation
      const seller = companySettings?.sellerNameForQR || companySettings?.companyNameArabic || "شركة فنون الوليد للدعاية والإعلان";
      const vatNum = companySettings?.vatNumber || "310123456700003";
      const qrB64 = getZatcaTLV(seller, vatNum, nowStr, grandTotal.toFixed(2), vatTotal.toFixed(2));

      const invoicePayload: CustomerInvoice = {
        id: invoiceId,
        invoiceNo: invoiceForm.invoiceNo,
        invoiceDate: invoiceForm.invoiceDate,
        dueDate: invoiceForm.dueDate,
        paymentTerms: invoiceForm.paymentTerms,
        projectName: invoiceForm.projectName,
        salesperson: invoiceForm.salesperson,
        invoiceType: invoiceForm.invoiceType,
        currency: invoiceForm.currency || "SAR",
        status: isDraft ? "Draft" : "Issued",
        customerId: invoiceForm.customerId || `CUST_${Date.now()}`,
        customerName: invoiceForm.customerName,
        customerAddress: invoiceForm.customerAddress,
        customerVatNumber: invoiceForm.customerVatNumber,
        customerCrNumber: invoiceForm.customerCrNumber,
        customerPhone: invoiceForm.customerPhone,
        customerEmail: invoiceForm.customerEmail,
        companyNameArabic: companySettings?.companyNameArabic || "شركة فنون الوليد للدعاية والإعلان",
        companyNameEnglish: companySettings?.companyNameEnglish || "Al Waleed Arts Advertising Co.",
        companyVatNumber: companySettings?.vatNumber || "310123456700003",
        companyCrNumber: companySettings?.crNumber || "1010123456",
        companyAddress: companySettings?.nationalAddress || "الرياض، المملكة العربية السعودية",
        quotationId: invoiceForm.quotationId,
        quotationNo: invoiceForm.quotationNo,
        items: invoiceForm.items,
        subtotalBeforeDiscount,
        totalDiscount,
        taxableAmount,
        vatTotal,
        grandTotal,
        amountPaid: 0,
        remainingAmount: grandTotal,
        zatcaStatus: isDraft ? "Not Submitted" : "Pending",
        qrCodeBase64: qrB64,
        createdAt: selectedInvoice ? selectedInvoice.createdAt : nowStr,
        createdBy: selectedInvoice ? selectedInvoice.createdBy : userStr,
        updatedAt: nowStr,
        updatedBy: userStr,
      };

      await setDoc(doc(db, "customer_invoices", invoiceId), invoicePayload);

      // Save Audit Log
      const logId = `LOG_INV_${Date.now()}`;
      await setDoc(doc(db, "audit_logs", logId), {
        userId: user?.id || "unknown",
        userName: user?.username || "System",
        userRole: user?.role || "Admin",
        action: isDraft ? "إنشاء فاتورة عميل كمسودة" : "إصدار فاتورة عميل معتمدة ومطابقة لـ ZATCA",
        module: "Customer Invoices",
        recordId: invoiceId,
        createdAt: nowStr,
      });

      // If Issued (not draft), do the AUTOMATIC Accounting Integrations:
      if (!isDraft) {
        // 1. Create Revenue Record representing receivable
        const revId = `REV_${Date.now()}`;
        await setDoc(doc(db, "revenues", revId), {
          revenueId: revId,
          invoiceId,
          invoiceNo: invoiceForm.invoiceNo,
          customerId: invoicePayload.customerId,
          customerName: invoiceForm.customerName,
          quotationId: invoiceForm.quotationId,
          quotationNo: invoiceForm.quotationNo,
          revenueDate: invoiceForm.invoiceDate,
          taxableAmount,
          vatAmount: vatTotal,
          totalAmount: grandTotal,
          paidAmount: 0,
          remainingAmount: grandTotal,
          revenueStatus: "Unpaid",
          createdAt: nowStr,
          createdBy: userStr,
        });

        // 2. Create approved Journal Entry (القيد اليومي التلقائي للفاتورة)
        // Debit Accounts Receivable [Grand Total]
        // Credit Revenue [Taxable Amount]
        // Credit VAT Output [VAT Total]
        const jvId = `JV_INV_${invoiceForm.invoiceNo}_${Date.now()}`;
        const journalEntryNo = `JV-INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const lines = [
          {
            id: `JV_L_1_${Date.now()}`,
            lineNo: 1,
            accountType: "Accounts Receivable",
            accountCode: "1201",
            accountName: `حسابات مدراء عملاء - ${invoiceForm.customerName}`,
            debit: grandTotal,
            credit: 0,
            customerId: invoicePayload.customerId,
            invoiceId: invoiceId,
            description: `قيد إثبات استحقاق الفاتورة رقم ${invoiceForm.invoiceNo} للعميل ${invoiceForm.customerName}`,
            createdAt: nowStr,
          },
          {
            id: `JV_L_2_${Date.now()}`,
            lineNo: 2,
            accountType: "Revenue",
            accountCode: "4101",
            accountName: "إيرادات مبيعات اللوحات والكلادينج",
            debit: 0,
            credit: taxableAmount,
            invoiceId: invoiceId,
            description: `قيد إيراد الفاتورة رقم ${invoiceForm.invoiceNo}`,
            createdAt: nowStr,
          },
          {
            id: `JV_L_3_${Date.now()}`,
            lineNo: 3,
            accountType: "VAT Output",
            accountCode: "2204",
            accountName: "حساب ضريبة مخرجات قيمة مضافة 15%",
            debit: 0,
            credit: vatTotal,
            invoiceId: invoiceId,
            description: `ضريبة مبيعات مستحقة للفاتورة رقم ${invoiceForm.invoiceNo}`,
            createdAt: nowStr,
          },
        ];

        await setDoc(doc(db, "journal_entries", jvId), {
          id: jvId,
          journalEntryNo,
          date: invoiceForm.invoiceDate,
          sourceModule: "Customer Invoice",
          sourceId: invoiceId,
          description: `قيد الفاتورة التلقائي رقم ${invoiceForm.invoiceNo} للعميل ${invoiceForm.customerName}`,
          status: "Approved", // Auto-approved to log receivables
          totalDebit: grandTotal,
          totalCredit: grandTotal,
          isBalanced: true,
          cashBankApplied: false, // Bank and cash are NOT changed by invoice creation
          createdAt: nowStr,
          createdBy: "System_Auto_Invoice",
          createdByName: "ERP System",
          lines: lines,
        });

        // Audit Log for Journal Entry
        const jvLogId = `LOG_JV_AUTO_${Date.now()}`;
        await setDoc(doc(db, "audit_logs", jvLogId), {
          userId: "system",
          userName: "ERP System",
          userRole: "System Controller",
          action: "توليد قيد الاستحقاق التلقائي للفاتورة",
          module: "Journal Entries",
          recordId: jvId,
          notes: `تم إنشاء واعتماد قيد الفاتورة رقم ${invoiceForm.invoiceNo} بقيمة ${grandTotal} SAR`,
          createdAt: nowStr,
        });
      }

      alert(lang === "ar" ? "تم حفظ وإصدار الفاتورة وتوليد القيود المحاسبية التلقائية" : "Invoice issued and automatic accounting entries generated");
      setShowInvoiceModal(false);
      setSelectedInvoice(null);
      loadData();
    } catch (err) {
      console.error(err);
      alert(lang === "ar" ? "فشل حفظ الفاتورة" : "Failed to save invoice");
    }
  };

  // Soft cancel / credit note invoice
  const handleCancelInvoice = (inv: CustomerInvoice) => {
    const rawInv = inv as any;
    const invId = inv.id;
    const invoiceNo = inv.invoiceNo || rawInv.invoiceNo || rawInv.invoice_no || "UNKNOWN";
    const grandTotal = Number(inv.grandTotal ?? rawInv.grandTotal ?? rawInv.grand_total ?? 0);
    const taxableAmount = Number(inv.taxableAmount ?? rawInv.taxableAmount ?? rawInv.taxable_amount ?? 0);
    const vatTotal = Number(inv.vatTotal ?? rawInv.vatTotal ?? rawInv.vat_total ?? 0);
    const customerName = inv.customerName || rawInv.customerName || rawInv.customer_name || "";
    const customerId = inv.customerId || rawInv.customerId || rawInv.customer_id || "";

    setConfirmDialog({
      isOpen: true,
      title: lang === "ar" ? "إلغاء الفاتورة وعكس الأثر" : "Cancel Invoice",
      message: lang === "ar" 
        ? `هل أنت متأكد من إلغاء الفاتورة ${invoiceNo} وعكس أثرها المالي؟ سيتم إلغاء الإيرادات وتوليد قيد تسوية عكسي تلقائي.`
        : `Are you sure you want to cancel invoice ${invoiceNo} and reverse its financial impact?`,
      type: "danger",
      onConfirm: async () => {
        const nowStr = new Date().toISOString();
        const userStr = user?.username || "System";

        // 1. Update invoice status to Cancelled
        await setDoc(doc(db, "customer_invoices", invId), {
          ...inv,
          status: "Cancelled",
          updatedAt: nowStr,
          updatedBy: userStr,
        });

        // 2. Cancel linked revenue
        const revSnap = await getDocs(collection(db, "revenues"));
        const linkedRev = revSnap.docs.find((x) => x.data().invoiceId === invId);
        if (linkedRev) {
          await setDoc(doc(db, "revenues", linkedRev.id), {
            ...linkedRev.data(),
            revenueStatus: "Cancelled",
            remainingAmount: 0,
          });
        }

        // 3. Create reverse Journal Entry to reverse the receivable and VAT liability
        const jvId = `JV_REVERSAL_INV_${invoiceNo}_${Date.now()}`;
        const journalEntryNo = `JV-REV-INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const lines = [
          {
            id: `JV_L_REV_1_${Date.now()}`,
            lineNo: 1,
            accountType: "Accounts Receivable",
            accountCode: "1201",
            accountName: `حسابات مدراء عملاء - ${customerName}`,
            debit: 0,
            credit: grandTotal,
            customerId: customerId,
            invoiceId: invId,
            description: `عكس قيد الفاتورة رقم ${invoiceNo} بسبب إلغائها`,
            createdAt: nowStr,
          },
          {
            id: `JV_L_REV_2_${Date.now()}`,
            lineNo: 2,
            accountType: "Revenue",
            accountCode: "4101",
            accountName: "إيرادات مبيعات اللوحات والكلادينج",
            debit: taxableAmount,
            credit: 0,
            invoiceId: invId,
            description: `عكس إيراد الفاتورة رقم ${invoiceNo}`,
            createdAt: nowStr,
          },
          {
            id: `JV_L_REV_3_${Date.now()}`,
            lineNo: 3,
            accountType: "VAT Output",
            accountCode: "2204",
            accountName: "حساب ضريبة مخرجات قيمة مضافة 15%",
            debit: vatTotal,
            credit: 0,
            invoiceId: invId,
            description: `عكس ضريبة مخرجات الفاتورة رقم ${invoiceNo}`,
            createdAt: nowStr,
          },
        ];

        await setDoc(doc(db, "journal_entries", jvId), {
          id: jvId,
          journalEntryNo,
          date: new Date().toISOString().split("T")[0],
          sourceModule: "Customer Invoice Reversal",
          sourceId: invId,
          description: `عكس قيد استحقاق الفاتورة الملغاة رقم ${invoiceNo}`,
          status: "Approved",
          totalDebit: grandTotal,
          totalCredit: grandTotal,
          isBalanced: true,
          cashBankApplied: false,
          createdAt: nowStr,
          createdBy: "System_Auto_Invoice",
          createdByName: "ERP System",
          lines: lines,
        });

        const logId = `LOG_INV_CANCEL_${Date.now()}`;
        await setDoc(doc(db, "audit_logs", logId), {
          userId: user?.id || "unknown",
          userName: user?.username || "System",
          userRole: user?.role || "Admin",
          action: "إلغاء فاتورة وعكس قيود الاستحقاق",
          module: "Customer Invoices",
          recordId: invId,
          createdAt: nowStr,
        });

        showToast(lang === "ar" ? "تم إلغاء الفاتورة وعكس قيد الاستحقاق بالكامل" : "Invoice cancelled and reversing journal entry created", "success");
        loadData();
      }
    });
  };

  const openInvoiceForm = (inv: CustomerInvoice | null) => {
    setClientSearch("");
    setShowClientDropdown(false);
    if (inv) {
      setSelectedInvoice(inv);
      const matchedClient = clients.find(c => c.id === inv.customerId);
      setSelectedClientForInvoice(matchedClient || {
        id: inv.customerId,
        companyName: inv.customerName,
        clientName: inv.customerName,
        taxNumber: inv.customerVatNumber,
        crNumber: inv.customerCrNumber,
        mobile: inv.customerPhone,
        email: inv.customerEmail,
        address: inv.customerAddress
      });
      setInvoiceForm({
        invoiceNo: inv.invoiceNo,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        paymentTerms: inv.paymentTerms,
        projectName: inv.projectName,
        salesperson: inv.salesperson,
        invoiceType: inv.invoiceType,
        currency: inv.currency || "SAR",
        customerId: inv.customerId,
        customerName: inv.customerName,
        customerAddress: inv.customerAddress || "",
        customerVatNumber: inv.customerVatNumber || "",
        customerCrNumber: inv.customerCrNumber || "",
        customerPhone: inv.customerPhone || "",
        customerEmail: inv.customerEmail || "",
        quotationId: inv.quotationId,
        quotationNo: inv.quotationNo,
        items: inv.items,
        totalDiscount: inv.totalDiscount,
      });
    } else {
      setSelectedInvoice(null);
      setSelectedClientForInvoice(null);
      setInvoiceForm({
        invoiceNo: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        invoiceDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split("T")[0],
        paymentTerms: "15 Days",
        projectName: "",
        salesperson: "",
        invoiceType: "Tax Invoice",
        currency: "SAR",
        customerId: "",
        customerName: "",
        customerAddress: "",
        customerVatNumber: "",
        customerCrNumber: "",
        customerPhone: "",
        customerEmail: "",
        quotationId: "",
        quotationNo: "",
        items: [],
        totalDiscount: 0,
      });
    }
    setShowInvoiceModal(true);
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchNo = (inv.invoiceNo || "").toLowerCase().includes((searchNo || "").toLowerCase());
    const matchName = (inv.customerName || "").toLowerCase().includes((searchName || "").toLowerCase());
    const matchStat = filterStatus === "all" || inv.status === filterStatus;
    const matchZatca = filterZatca === "all" || inv.zatcaStatus === filterZatca;
    return matchNo && matchName && matchStat && matchZatca;
  });

  const clientQuotations = quotations.filter((q) => {
    const isApproved = q.stage === "Approved" || q.isApproved || q.status === "معتمد";
    if (!isApproved) return false;
    if (!selectedClientForInvoice) return false;
    return (
      q.clientId === selectedClientForInvoice.id ||
      q.customerId === selectedClientForInvoice.id ||
      (q.clientName && q.clientName === selectedClientForInvoice.clientName) ||
      (q.clientName && q.clientName === selectedClientForInvoice.companyName) ||
      (q.clientName && q.clientName === selectedClientForInvoice.name)
    );
  });

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#005185] tracking-tight">
            🧾 فواتير العملاء والفوترة الضريبية الذكية
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            إصدار فواتير المبيعات الضريبية والتبسيطية المتوافقة مع هيئة الزكاة والضريبة والجمارك (ZATCA Phase 1) ومراقبة مستحقاتها المالية.
          </p>
        </div>
        <button
          onClick={() => openInvoiceForm(null)}
          className="bg-[#0072BC] hover:bg-[#005185] text-white py-3 px-6 rounded-2xl font-bold text-sm shadow-lg transition-all flex items-center gap-2"
        >
          <span>➕</span> إصدار فاتورة عميل جديدة
        </button>
      </div>

      {/* Filters Panel */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">بحث برقم الفاتورة</label>
          <input
            type="text"
            value={searchNo}
            onChange={(e) => setSearchNo(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs"
            placeholder="INV-XXXX"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">بحث باسم العميل</label>
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs"
            placeholder="شركة..."
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">فلتر حالة الدفع</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs bg-white"
          >
            <option value="all">كل حالات الفواتير</option>
            <option value="Draft">مسودة (Draft)</option>
            <option value="Issued">معتمدة (Issued)</option>
            <option value="Partially Paid">مدفوعة جزئياً</option>
            <option value="Paid">مدفوعة بالكامل</option>
            <option value="Cancelled">ملغاة</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">حالة ZATCA</label>
          <select
            value={filterZatca}
            onChange={(e) => setFilterZatca(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs bg-white"
          >
            <option value="all">كل الحالات الإلكترونية</option>
            <option value="Pending">مبسطة جاهزة للتبليغ (Pending)</option>
            <option value="Cleared">مستوفية التخليص (Cleared)</option>
            <option value="Reported">تم الإبلاغ (Reported)</option>
            <option value="Failed">فشل الإرسال (Failed)</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-20 text-slate-400 font-medium">
            لا توجد فواتير تطابق شروط البحث الفلترة. يرجى إصدار أول فاتورة لتبدأ الدورة المالية.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">رقم الفاتورة</th>
                  <th className="px-6 py-4">العميل</th>
                  <th className="px-6 py-4">التاريخ</th>
                  <th className="px-6 py-4">تاريخ الاستحقاق</th>
                  <th className="px-6 py-4 text-left">قيمة الفاتورة (SAR)</th>
                  <th className="px-6 py-4 text-left">المدفوع</th>
                  <th className="px-6 py-4 text-left">المتبقي</th>
                  <th className="px-6 py-4 text-center">حالة الدفع</th>
                  <th className="px-6 py-4 text-center">نوع الفاتورة</th>
                  <th className="px-6 py-4 text-center">العمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold text-slate-600">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[#0072BC]">
                      {inv.invoiceNo}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-extrabold text-slate-800">{inv.customerName}</p>
                        {inv.projectName && <span className="text-[10px] text-slate-400">المشروع: {inv.projectName}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{inv.invoiceDate}</td>
                    <td className="px-6 py-4 text-slate-500">{inv.dueDate}</td>
                    <td className="px-6 py-4 text-left font-mono font-bold text-slate-800">
                      {Number(inv.grandTotal || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-left font-mono text-emerald-600 font-bold">
                      {Number(inv.amountPaid || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-left font-mono text-rose-600 font-bold">
                      {Number(inv.remainingAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold ${
                          inv.status === "Draft"
                            ? "bg-slate-100 text-slate-600"
                            : inv.status === "Issued"
                            ? "bg-sky-50 text-sky-700"
                            : inv.status === "Partially Paid"
                            ? "bg-amber-50 text-amber-700"
                            : inv.status === "Paid"
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {inv.status === "Draft"
                          ? "مسودة"
                          : inv.status === "Issued"
                          ? "معتمدة ومستحقة"
                          : inv.status === "Partially Paid"
                          ? "مدفوعة جزئياً"
                          : inv.status === "Paid"
                          ? "مدفوعة بالكامل"
                          : "ملغاة"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-[10px] font-bold text-slate-500">
                      {inv.invoiceType === "Tax Invoice" ? "فاتورة ضريبية (B2B)" : "فاتورة مبسطة (B2C)"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setShowPrintModal(true);
                          }}
                          className="bg-[#0072BC]/10 hover:bg-[#0072BC]/20 text-[#0072BC] py-1 px-2.5 rounded-lg text-[11px] font-bold transition-all"
                          title="عرض الفاتورة"
                        >
                          👁️ عرض
                        </button>
                        <button
                          onClick={() => handleOpenPrintTab(inv)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-1 px-2.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                          title="طباعة الفاتورة في علامة تبويب جديدة"
                        >
                          🖨️ طباعة
                        </button>
                        {inv.status === "Draft" && (
                          <button
                            onClick={() => openInvoiceForm(inv)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-1 px-2 rounded-lg text-[11px] font-bold transition-all"
                          >
                            📝 تعديل
                          </button>
                        )}
                        {inv.status !== "Cancelled" && (
                          <button
                            onClick={() => handleCancelInvoice(inv)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 py-1 px-2 rounded-lg text-[11px] font-bold transition-all"
                          >
                            🚫 إلغاء وعكس
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

      {/* CREATE / EDIT INVOICE MODAL (FULL SCREEN) */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-0 md:p-6 animate-fade-in">
          <div className="bg-white w-full h-full md:max-w-7xl md:h-[95vh] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden border">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#005185] to-[#0072BC] p-5 text-white flex justify-between items-center shrink-0">
              <h2 className="text-xl font-extrabold flex items-center gap-2">
                <span>🧾</span> {selectedInvoice ? `تعديل الفاتورة الضريبية: ${selectedInvoice.invoiceNo}` : "إصدار فاتورة ضريبية جديدة مخرجات"}
              </h2>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="text-white hover:text-red-200 text-2xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
              {/* Alert */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-700">
                <p>• الفواتير المصدرة ترحل تلقائياً إلى ذمم العملاء المدينة (Accounts Receivable) والإيرادات المؤجلة وتسجل قيودها الضريبية التلقائية.</p>
                <span className="text-[#0072BC]">ZATCA Phase 1 Ready ✔️</span>
              </div>

              {/* Quotation selection */}
              {!selectedInvoice && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-sky-50/50 rounded-2xl border border-sky-100">
                  {/* Searchable Customer Dropdown */}
                  <div className="relative">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">اختر العميل (مع إمكانية البحث) *</label>
                    <div 
                      onClick={() => setShowClientDropdown(!showClientDropdown)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs bg-white font-bold cursor-pointer flex justify-between items-center hover:border-slate-300"
                    >
                      <span>
                        {selectedClientForInvoice 
                          ? (selectedClientForInvoice.companyName || selectedClientForInvoice.clientName || selectedClientForInvoice.name) 
                          : "-- ابحث واختر العميل --"}
                      </span>
                      <span className="text-slate-400">▼</span>
                    </div>
                    
                    {showClientDropdown && (
                      <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl p-3 space-y-2">
                        <input
                          type="text"
                          placeholder="🔍 ابحث بالاسم، الجوال، أو الرقم الضريبي..."
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 font-bold"
                        />
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {clients
                            .filter(c => {
                              const query = clientSearch.toLowerCase();
                              return (
                                (c.companyName || "").toLowerCase().includes(query) ||
                                (c.clientName || "").toLowerCase().includes(query) ||
                                (c.name || "").toLowerCase().includes(query) ||
                                (c.mobile || "").includes(query) ||
                                (c.phone || "").includes(query) ||
                                (c.taxNumber || "").includes(query) ||
                                (c.vatNumber || "").includes(query)
                              );
                            })
                            .map(c => (
                              <div
                                key={c.id}
                                onClick={() => {
                                  setSelectedClientForInvoice(c);
                                  setClientSearch("");
                                  setShowClientDropdown(false);
                                  
                                  // Auto populate client details
                                  let customerAddress = "";
                                  if (c.nationalAddress) {
                                    const na = c.nationalAddress;
                                    customerAddress = [na.streetName, na.district, na.city, na.buildingNumber, na.postalCode].filter(Boolean).join(", ");
                                  }
                                  if (!customerAddress) {
                                    customerAddress = c.address || c.city || c.country || "";
                                  }
                                  
                                  setInvoiceForm(prev => ({
                                    ...prev,
                                    customerId: c.id,
                                    customerName: c.companyName || c.clientName || c.name || "",
                                    customerAddress,
                                    customerVatNumber: c.taxNumber || c.vatNumber || "",
                                    customerCrNumber: c.crNumber || "",
                                    customerPhone: c.mobile || c.phone || "",
                                    customerEmail: c.email || "",
                                    quotationId: "",
                                    quotationNo: "",
                                    items: [],
                                  }));
                                }}
                                className="px-3 py-2 text-xs hover:bg-blue-50 rounded-lg cursor-pointer flex justify-between items-center transition-colors font-bold text-right"
                              >
                                <div>
                                  <p className="text-slate-800">{c.companyName || c.clientName || c.name}</p>
                                  <p className="text-[10px] text-slate-400 font-semibold">{c.mobile || c.phone || "بدون جوال"} | {c.taxNumber || c.vatNumber || "بدون رقم ضريبي"}</p>
                                </div>
                                {selectedClientForInvoice?.id === c.id && (
                                  <span className="text-emerald-600 font-extrabold text-xs">✓</span>
                                )}
                              </div>
                            ))}
                          {clients.filter(c => {
                            const query = clientSearch.toLowerCase();
                            return (
                              (c.companyName || "").toLowerCase().includes(query) ||
                              (c.clientName || "").toLowerCase().includes(query) ||
                              (c.name || "").toLowerCase().includes(query) ||
                              (c.mobile || "").includes(query) ||
                              (c.phone || "").includes(query) ||
                              (c.taxNumber || "").includes(query) ||
                              (c.vatNumber || "").includes(query)
                            );
                          }).length === 0 && (
                            <p className="text-xs text-slate-400 text-center py-2">لا يوجد عملاء مطبقين</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Filtered Quotations Select */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">ارتباط بعرض سعر معتمد *</label>
                    <select
                      value={invoiceForm.quotationId}
                      onChange={(e) => handleQuotationChange(e.target.value)}
                      disabled={!selectedClientForInvoice}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs bg-white font-semibold outline-none focus:ring-2 focus:ring-[#0072BC] disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">
                        {!selectedClientForInvoice 
                          ? "-- اختر العميل أولاً لعرض عروض أسعاره --" 
                          : clientQuotations.length === 0 
                            ? "-- لا يوجد عروض أسعار معتمدة لهذا العميل --" 
                            : "-- اختر عرض السعر المعتمد --"}
                      </option>
                      {clientQuotations.map((q) => (
                        <option key={q.id} value={q.id}>
                          رقم عرض السعر: {q.quotationNumber || q.id} | المشروع: {q.projectName || "بدون عنوان"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Base Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">رقم الفاتورة *</label>
                  <input
                    type="text"
                    required
                    value={invoiceForm.invoiceNo}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNo: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">تاريخ الفاتورة *</label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.invoiceDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">تاريخ الاستحقاق *</label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">نوع الفاتورة</label>
                  <select
                    value={invoiceForm.invoiceType}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceType: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs bg-white font-bold"
                  >
                    <option value="Tax Invoice">فاتورة ضريبية قياسية (B2B)</option>
                    <option value="Simplified Tax Invoice">فاتورة ضريبية مبسطة (B2C)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0072BC] mb-1">عُملة الفاتورة *</label>
                  <select
                    value={invoiceForm.currency}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, currency: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs bg-white font-bold"
                  >
                    <option value="SAR">SAR - ريال سعودي</option>
                    <option value="USD">USD - دولار أمريكي</option>
                    <option value="EUR">EUR - يورو أوروبي</option>
                    <option value="AED">AED - درهم إماراتي</option>
                    <option value="KWD">KWD - دينار كويتي</option>
                    <option value="BHD">BHD - دينار بحريني</option>
                    <option value="QAR">QAR - ريال قطري</option>
                  </select>
                </div>
              </div>

              {/* Client Info Grid */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-700 mb-4 flex items-center gap-1.5 border-b pb-2">
                  <span>👤</span> بيانات العميل والمشروع
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">اسم العميل *</label>
                    <input
                      type="text"
                      required
                      value={invoiceForm.customerName}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, customerName: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs"
                      placeholder="اسم المنشأة أو العميل"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">الرقم الضريبي للعميل</label>
                    <input
                      type="text"
                      maxLength={15}
                      value={invoiceForm.customerVatNumber}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, customerVatNumber: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs font-mono"
                      placeholder="300XXXXXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">رقم السجل التجاري</label>
                    <input
                      type="text"
                      value={invoiceForm.customerCrNumber}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, customerCrNumber: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">عنوان العميل</label>
                    <input
                      type="text"
                      value={invoiceForm.customerAddress}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, customerAddress: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">رقم الجوال</label>
                    <input
                      type="text"
                      value={invoiceForm.customerPhone}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, customerPhone: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">عنوان المشروع المرتبط</label>
                    <input
                      type="text"
                      value={invoiceForm.projectName}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, projectName: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Items Grid */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-sm font-extrabold text-[#005185] flex items-center gap-1.5">
                    <span>🛒</span> بنود وأصناف الفاتورة التفصيلية
                  </h3>
                  <button
                    type="button"
                    onClick={addLine}
                    className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-1.5 px-4 rounded-xl text-xs transition-all"
                  >
                    ➕ إضافة سطر جديد
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                      <tr>
                        <th className="px-4 py-3">الوصف والبيان</th>
                        <th className="px-4 py-3 w-20">الكمية</th>
                        <th className="px-4 py-3 w-28">سعر الوحدة</th>
                        <th className="px-4 py-3 w-24">الخصم المباشر</th>
                        <th className="px-4 py-3 w-28">الخاضع للضريبة</th>
                        <th className="px-4 py-3 w-20">الضريبة %</th>
                        <th className="px-4 py-3 w-24">قيمة الضريبة</th>
                        <th className="px-4 py-3 w-28">إجمالي السطر</th>
                        <th className="px-4 py-3 w-16 text-center">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-semibold">
                      {invoiceForm.items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={item.description}
                              required
                              onChange={(e) => updateItemRow(index, "description", e.target.value)}
                              className="w-full border-none focus:ring-0 p-1 bg-transparent"
                              placeholder="بيان الصنف..."
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={item.quantity}
                              min={1}
                              onChange={(e) => updateItemRow(index, "quantity", Number(e.target.value))}
                              className="w-full border border-slate-200 rounded p-1 font-mono text-center"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={item.unitPrice}
                              min={0}
                              onChange={(e) => updateItemRow(index, "unitPrice", Number(e.target.value))}
                              className="w-full border border-slate-200 rounded p-1 font-mono text-left"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={item.discount || 0}
                              onChange={(e) => updateItemRow(index, "discount", Number(e.target.value))}
                              className="w-full border border-slate-200 rounded p-1 font-mono text-left"
                            />
                          </td>
                          <td className="px-4 py-2 font-mono text-slate-500 font-bold text-left">
                            {(item.taxableAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={item.vatRate || 15}
                              onChange={(e) => updateItemRow(index, "vatRate", Number(e.target.value))}
                              className="w-full border border-slate-200 rounded p-1 font-mono text-center"
                            />
                          </td>
                          <td className="px-4 py-2 font-mono text-slate-500 font-bold text-left">
                            {(item.vatAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-2 font-mono text-slate-800 font-extrabold text-left">
                            {(item.lineTotal || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeLine(index)}
                              className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary and Discount */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">الخصم الإجمالي الإضافي للفاتورة (SAR)</label>
                  <input
                    type="number"
                    value={invoiceForm.totalDiscount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, totalDiscount: Number(e.target.value) })}
                    className="border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold max-w-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    خصم شامل يطرح من المجموع الكلي قبل احتساب ضريبة القيمة المضافة.
                  </p>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 font-bold text-slate-700 space-y-3.5">
                  <div className="flex justify-between items-center text-xs">
                    <span>المجموع قبل الخصم (Subtotal):</span>
                    <span className="font-mono text-sm">{subtotalBeforeDiscount.toLocaleString("en-US", { minimumFractionDigits: 2 })} {invoiceForm.currency}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-rose-600">
                    <span>إجمالي الخصم (Discount):</span>
                    <span className="font-mono text-sm">-{totalDiscount.toLocaleString("en-US", { minimumFractionDigits: 2 })} {invoiceForm.currency}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>المبلغ الخاضع للضريبة (Taxable):</span>
                    <span className="font-mono text-sm">{taxableAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} {invoiceForm.currency}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-sky-700">
                    <span>ضريبة القيمة المضافة (VAT 15%):</span>
                    <span className="font-mono text-sm">+{vatTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} {invoiceForm.currency}</span>
                  </div>
                  <hr className="border-slate-200" />
                  <div className="flex justify-between items-center text-base text-slate-900">
                    <span>الصافي النهائي المستحق (Grand Total):</span>
                    <span className="font-mono text-lg text-[#0072BC] font-extrabold">{grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} {invoiceForm.currency}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-5 border-t shrink-0 flex justify-end gap-3.5">
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-6 rounded-2xl text-xs transition-all"
              >
                إلغاء وإغلاق
              </button>
              <button
                type="button"
                onClick={() => handleSaveInvoice(true)}
                className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-2xl text-xs transition-all"
              >
                💾 حفظ كمسودة (Draft)
              </button>
              <button
                type="button"
                onClick={() => handleSaveInvoice(false)}
                className="bg-[#0072BC] hover:bg-[#005185] text-white font-bold py-3 px-8 rounded-2xl text-xs transition-all shadow-md"
              >
                🚀 اعتماد وإصدار الفاتورة وتوليد القيد (Issue)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT PREVIEW / DETAILED VIEW MODAL */}
      {showPrintModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border overflow-hidden my-8">
            <div className="bg-[#005185] p-5 text-white flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold">📄 معاينة الطباعة للفاتورة الضريبية</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenPrintTab(selectedInvoice)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-4 rounded-xl font-bold text-xs"
                >
                  🖨️ طباعة الفاتورة (تبويب جديد)
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="text-white hover:text-red-200 text-xl font-bold px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Invoice Container */}
            <div className="p-8 space-y-6 text-slate-800 text-xs select-text leading-relaxed" id="invoice-print-area">
              {/* Top Row: Brand & ZATCA QR */}
              <div className="flex justify-between items-start border-b border-slate-300 pb-5">
                <div className="space-y-1.5 text-right">
                  <h1 className="text-lg font-extrabold text-[#005185]">{selectedInvoice.companyNameArabic}</h1>
                  <p className="text-[10px] text-slate-400 font-bold">{selectedInvoice.companyNameEnglish}</p>
                  <p className="font-semibold">الرقم الضريبي الموحد: <span className="font-mono font-bold">{selectedInvoice.companyVatNumber}</span></p>
                  <p className="font-semibold">سجل تجاري: <span className="font-mono font-bold">{selectedInvoice.companyCrNumber}</span></p>
                  <p className="text-slate-500 text-[10px]">{selectedInvoice.companyAddress}</p>
                </div>

                <div className="text-center space-y-2">
                  <span className="border-2 border-[#005185] text-[#005185] font-extrabold px-3 py-1 text-xs block rounded">
                    {selectedInvoice.invoiceType === "Tax Invoice" ? "فاتورة ضريبية / TAX INVOICE" : "فاتورة مبسطة / SIMPLIFIED TAX INVOICE"}
                  </span>
                  {selectedInvoice.qrCodeBase64 ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(selectedInvoice.qrCodeBase64)}`}
                        alt="ZATCA Compliance QR Code"
                        className="w-24 h-24 border p-1 rounded bg-white"
                      />
                      <span className="text-[7px] text-slate-400 font-mono mt-1">ZATCA Compliant Code</span>
                    </div>
                  ) : (
                    <div className="w-24 h-24 border border-dashed flex items-center justify-center text-slate-300">
                      No QR Mapped
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Meta Table */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border">
                <div>
                  <span className="text-slate-400 font-bold">رقم الفاتورة / Invoice No:</span>
                  <p className="font-mono font-extrabold text-[#0072BC] text-sm mt-0.5">{selectedInvoice.invoiceNo}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold">تاريخ الإصدار / Date:</span>
                  <p className="font-bold mt-0.5">{selectedInvoice.invoiceDate}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold">تاريخ الاستحقاق / Due Date:</span>
                  <p className="font-bold mt-0.5">{selectedInvoice.dueDate}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold">طريقة الدفع / Terms:</span>
                  <p className="font-bold mt-0.5">{selectedInvoice.paymentTerms || "تحويل بنكي"}</p>
                </div>
              </div>

              {/* Bill To & Project Meta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl border border-slate-200 space-y-1.5">
                  <h3 className="font-extrabold text-slate-800 text-xs border-b pb-1">موجّه إلى / Customer Details</h3>
                  <p className="font-bold">اسم العميل: <span className="text-[#005185]">{selectedInvoice.customerName}</span></p>
                  <p>الرقم الضريبي: <span className="font-mono font-bold">{selectedInvoice.customerVatNumber || "غير متوفر"}</span></p>
                  <p>رقم السجل: <span className="font-mono font-bold">{selectedInvoice.customerCrNumber || "غير متوفر"}</span></p>
                  <p>العنوان: {selectedInvoice.customerAddress || "N/A"}</p>
                  {selectedInvoice.customerPhone && <p>الهاتف: {selectedInvoice.customerPhone}</p>}
                </div>

                <div className="p-4 rounded-xl border border-slate-200 space-y-1.5">
                  <h3 className="font-extrabold text-slate-800 text-xs border-b pb-1">تفاصيل المشروع / Project Info</h3>
                  <p>اسم المشروع: <span className="font-bold">{selectedInvoice.projectName || "توريد لوحات إعلانية"}</span></p>
                  <p>رقم عرض السعر المرتبط: <span className="font-mono font-bold">{selectedInvoice.quotationNo || "N/A"}</span></p>
                  <p>مسؤول المبيعات: {selectedInvoice.salesperson || "قسم المبيعات"}</p>
                  <p>العملة المستعملة: <span className="font-bold">{selectedInvoice.currency || "SAR"}</span></p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-right text-[10px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                    <tr>
                      <th className="px-3 py-2 w-10 text-center">#</th>
                      <th className="px-3 py-2">الوصف والبيان / Item & Description</th>
                      <th className="px-3 py-2 text-center w-12">الكمية / Qty</th>
                      <th className="px-3 py-2 text-left w-20">السعر / Price</th>
                      <th className="px-3 py-2 text-left w-16">الخصم / Disc</th>
                      <th className="px-3 py-2 text-left w-20">الخاضع للضريبة</th>
                      <th className="px-3 py-2 text-center w-12">الضريبة</th>
                      <th className="px-3 py-2 text-left w-20">مبلغ الضريبة</th>
                      <th className="px-3 py-2 text-left w-24">الإجمالي شامل الضريبة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-semibold">
                    {(selectedInvoice.items || []).map((it, idx) => (
                      <tr key={it.id || idx} className="hover:bg-slate-50/40">
                        <td className="px-3 py-2 text-center text-slate-400">{idx + 1}</td>
                        <td className="px-3 py-2 font-bold text-slate-800">{it.description}</td>
                        <td className="px-3 py-2 text-center font-mono">{it.quantity}</td>
                        <td className="px-3 py-2 text-left font-mono">{Number(it.unitPrice || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2 text-left font-mono text-slate-400">{Number(it.discount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2 text-left font-mono">{Number(it.taxableAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2 text-center font-mono">{it.vatRate || 15}%</td>
                        <td className="px-3 py-2 text-left font-mono">{Number(it.vatAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2 text-left font-mono font-extrabold text-[#0072BC]">{Number(it.lineTotal || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="flex justify-between items-start gap-4">
                <div className="w-1/2 p-4 rounded-xl border space-y-2">
                  <h4 className="font-bold border-b pb-1">الحسابات البنكية للتحويل / Wire Details:</h4>
                  <p className="text-[10px] font-semibold text-slate-500">
                    يمكنكم سداد مبلغ الفاتورة المعتمد بالتحويل لأحد الحسابات التالية:<br />
                    • مصرف الراجحي: <span className="font-mono text-slate-700 font-bold">SA48800000045612347890</span><br />
                    • بنك الرياض: <span className="font-mono text-slate-700 font-bold">SA22200000001234567891</span>
                  </p>
                </div>

                <div className="w-1/2 bg-slate-50 p-4 rounded-xl border font-bold space-y-2 text-right">
                  <div className="flex justify-between text-[10px]">
                    <span>المجموع قبل الخصم / Subtotal:</span>
                    <span className="font-mono">{Number(selectedInvoice.subtotalBeforeDiscount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} {selectedInvoice.currency || "SAR"}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-rose-600">
                    <span>الخصومات الكلية / Total Discount:</span>
                    <span className="font-mono">-{Number(selectedInvoice.totalDiscount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} {selectedInvoice.currency || "SAR"}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span>الخاضع للضريبة / Taxable Amount:</span>
                    <span className="font-mono">{Number(selectedInvoice.taxableAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} {selectedInvoice.currency || "SAR"}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-sky-700">
                    <span>ضريبة القيمة المضافة / VAT 15%:</span>
                    <span className="font-mono">+{Number(selectedInvoice.vatTotal || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} {selectedInvoice.currency || "SAR"}</span>
                  </div>
                  <hr className="border-slate-300" />
                  <div className="flex justify-between text-xs text-slate-900">
                    <span>الصافي شامل الضريبة / Grand Total:</span>
                    <span className="font-mono text-sm text-[#0072BC] font-extrabold">{Number(selectedInvoice.grandTotal || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} {selectedInvoice.currency || "SAR"}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Layout Signatures */}
              <div className="grid grid-cols-2 gap-12 pt-8 text-center font-bold">
                <div className="space-y-12">
                  <p className="border-b pb-1 text-slate-400">توقيع المستلم / Receiver Signature</p>
                  <p className="text-slate-300 text-[10px]">توقيع وختم العميل</p>
                </div>
                <div className="space-y-12">
                  <p className="border-b pb-1 text-[#005185]">توقيع المنشأة المعتمد / Authorized Signature</p>
                  <p className="text-slate-500 font-extrabold text-[10px]">الإدارة المالية والمحاسبية</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-6 rounded-xl text-xs transition-all"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Beautiful Custom Confirm Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col p-6 space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
                confirmDialog.type === "danger" ? "bg-rose-100 text-rose-600" :
                confirmDialog.type === "warning" ? "bg-amber-100 text-amber-600" :
                "bg-blue-100 text-blue-600"
              }`}>
                {confirmDialog.type === "danger" ? "⚠️" : "ℹ️"}
              </span>
              <h3 className="text-base font-bold text-slate-800">{confirmDialog.title}</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                disabled={confirmDialog.actionLoading}
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs transition duration-150"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                disabled={confirmDialog.actionLoading}
                onClick={async () => {
                  setConfirmDialog(prev => ({ ...prev, actionLoading: true }));
                  try {
                    await confirmDialog.onConfirm();
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setConfirmDialog(prev => ({ ...prev, isOpen: false, actionLoading: false }));
                  }
                }}
                className={`text-white font-bold py-2 px-5 rounded-xl text-xs transition duration-150 flex items-center gap-1.5 shadow ${
                  confirmDialog.type === "danger" ? "bg-rose-600 hover:bg-rose-700" :
                  confirmDialog.type === "warning" ? "bg-amber-600 hover:bg-amber-700" :
                  "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {confirmDialog.actionLoading && (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                )}
                {lang === "ar" ? "تأكيد العملية" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Beautiful custom Toast feedback */}
      {toast.show && (
        <div className="fixed bottom-5 right-5 z-[200] max-w-sm bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 border border-slate-800 animate-slide-in">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
            toast.type === "success" ? "bg-emerald-500 text-white" :
            toast.type === "error" ? "bg-rose-500 text-white" :
            toast.type === "warning" ? "bg-amber-500 text-white" :
            "bg-blue-500 text-white"
          }`}>
            {toast.type === "success" ? "✓" : "!"}
          </span>
          <p className="text-xs font-bold text-slate-100 leading-snug">{toast.message}</p>
        </div>
      )}
    </div>
  );
}
