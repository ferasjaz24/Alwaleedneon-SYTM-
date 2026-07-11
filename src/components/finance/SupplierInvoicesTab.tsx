import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, doc, getDocs, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { Plus, Search, Trash2, Edit2, CheckCircle, Printer, FileText, Eye, AlertCircle, X, ChevronDown } from "lucide-react";
import { sharedPrintHeader, sharedPrintFooter, sharedPrintStyles } from "../../utils/PrintShared";

interface SupplierInvoiceItem {
  itemName: string;
  qty: number;
  unitPrice: number;
  isVatInclusive: boolean;
  total: number;
}

interface SupplierInvoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  supplierId: string;
  supplierName: string;
  poId: string;
  projectName: string;
  items: SupplierInvoiceItem[];
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  status: "Draft" | "Approved";
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export default function SupplierInvoicesTab({ lang, user }: { lang: "ar" | "en"; user: any }) {
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchNo, setSearchNo] = useState("");
  const [searchSupplier, setSearchSupplier] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Modal control
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Supplier search inside modal
  const [supplierSearchText, setSupplierSearchText] = useState("");
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [selectedSupplierForInvoice, setSelectedSupplierForInvoice] = useState<any | null>(null);

  // Form Fields
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNo: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    poId: "",
    projectName: "",
    notes: "",
    items: [] as SupplierInvoiceItem[],
  });

  // Custom confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Toast notification state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  // Load Initial Data
  const loadData = async () => {
    setLoading(true);
    try {
      const ts = Date.now();
      // Load Supplier Invoices
      const invSnap = await getDocs(collection(db, "supplier_invoices"));
      const invList = invSnap.docs
        .map((d) => ({ id: d.id, ...d.data() } as SupplierInvoice))
        .sort((a, b) => {
          const dateA = a.invoiceDate || "";
          const dateB = b.invoiceDate || "";
          if (dateA !== dateB) return dateB.localeCompare(dateA);
          return (b.invoiceNo || "").localeCompare(a.invoiceNo || "");
        });
      setInvoices(invList);

      // Load Suppliers
      const supRes = await fetch(`/api/dynamic/suppliers?t=${ts}`);
      const supData = await supRes.ok ? await supRes.json() : [];
      setSuppliers(supData);

      // Load Pricing Requests as Purchase Orders (status === "تم اصدار امر شراء")
      const poRes = await fetch(`/api/dynamic/pricing_requests?t=${ts}`);
      const poData = await poRes.ok ? await poRes.json() : [];
      setPurchaseOrders(poData.filter((x: any) => x.status === "تم اصدار امر شراء"));
    } catch (e) {
      console.error(e);
      showToast(lang === "ar" ? "فشل تحميل البيانات" : "Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenPrintTab = (inv: SupplierInvoice) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("الرجاء السماح بفتح النوافذ المنبثقة لطباعة الفاتورة");
      return;
    }

    const itemsRowsHtml = (inv.items || []).map((it, idx) => `
      <tr>
        <td style="text-align: center; color: #64748b;">${idx + 1}</td>
        <td><strong>${it.itemName}</strong></td>
        <td style="text-align: center; font-family: monospace;">${it.qty}</td>
        <td style="text-align: left; font-family: monospace;">${Number(it.unitPrice || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
        <td style="text-align: center;">${it.isVatInclusive ? "نعم / Yes" : "لا / No"}</td>
        <td style="text-align: left; font-family: monospace; font-weight: 900; color: #0072BC;">${Number(it.total || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="utf-8" />
         <title>فاتورة المورد - ${inv.invoiceNo}</title>
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
          .notes-box {
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
              سند تسجيل فاتورة مورد / SUPPLIER INVOICE RECORD
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">رقم الفاتورة / Invoice No</span>
              <span class="meta-value" style="font-family: monospace; color: #0072BC;">${inv.invoiceNo}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">تاريخ الفاتورة / Invoice Date</span>
              <span class="meta-value">${inv.invoiceDate}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">تاريخ التسجيل / Entry Date</span>
              <span class="meta-value">${inv.createdAt ? inv.createdAt.split('T')[0] : ""}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">المُسجل / Created By</span>
              <span class="meta-value">${inv.createdBy || "النظام"}</span>
            </div>
          </div>

          <div class="details-grid">
            <div class="details-box">
              <h3 class="details-title">بيانات المورد / Supplier Details</h3>
              <div class="details-row"><strong>اسم المورد:</strong> <span>${inv.supplierName}</span></div>
              <div class="details-row"><strong>معرف المورد (ID):</strong> <span style="font-family: monospace;">${inv.supplierId || "N/A"}</span></div>
              <div class="details-row"><strong>حالة الاعتماد المالي:</strong> 
                <span>${inv.status === "Approved" ? "معتمد ومرحل للمصروفات" : "مسودة بانتظار الاعتماد"}</span>
              </div>
            </div>

            <div class="details-box">
              <h3 class="details-title">تفاصيل المشروع والطلب / Project & Order Info</h3>
              <div class="details-row"><strong>المشروع المرتبط:</strong> <span>${inv.projectName || "بدون مشروع"}</span></div>
              <div class="details-row"><strong>رقم أمر الشراء (PO):</strong> <span style="font-family: monospace; color: #4f46e5;">${inv.poId || "غير مرتبط"}</span></div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">#</th>
                <th style="width: 45%;">البند والوصف / Item Description</th>
                <th style="width: 10%; text-align: center;">الكمية / Qty</th>
                <th style="width: 15%; text-align: left;">سعر الوحدة / Unit Price</th>
                <th style="width: 10%; text-align: center;">شامل الضريبة / VAT Inc</th>
                <th style="width: 15%; text-align: left;">الإجمالي / Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRowsHtml}
            </tbody>
          </table>

          <div class="totals-area">
            <div class="notes-box">
              <h4 style="margin-top: 0; margin-bottom: 6px; font-size: 10px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">ملاحظات / Notes:</h4>
              <p style="margin: 0; font-size: 10px; color: #475569; line-height: 1.6;">
                ${inv.notes || "لا توجد ملاحظات إضافية لهذا المستند."}
              </p>
            </div>

            <div class="totals-box">
              <div class="totals-row">
                <span>المجموع الخاضع للضريبة / Subtotal:</span>
                <span style="font-family: monospace;">${Number(inv.subtotal || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</span>
              </div>
              <div class="totals-row" style="color: #0369a1;">
                <span>مبلغ ضريبة القيمة المضافة / VAT Amount:</span>
                <span style="font-family: monospace;">+${Number(inv.vatAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</span>
              </div>
              <div class="totals-row grand">
                <span>الإجمالي شامل الضريبة / Grand Total:</span>
                <span style="font-family: monospace;">${Number(inv.totalAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</span>
              </div>
            </div>
          </div>

          <!-- Symmetrical approvals and corporate details -->
          <div style="margin-top: 30px; border-top: 2px solid #000; padding-top: 20px; display: flex; justify-content: space-between; align-items: stretch; gap: 20px; direction: rtl; text-align: right;">
            <!-- Right Side: Corporate Details as the Receiver -->
            <div style="width: 50%; border: 1.5px solid #000; border-radius: 8px; padding: 15px; display: flex; flex-direction: column; justify-content: space-between; background: #fff; box-sizing: border-box;">
              <div>
                <div style="font-size: 13px; font-weight: 800; color: #0072BC; border-bottom: 1.5px solid #000; padding-bottom: 6px; margin-bottom: 10px; font-family: 'GE SS Two', 'Gotham Pro', sans-serif;">
                  الجهة المستلمة والمستفيدة (شركة فنون الوليد)
                </div>
                <div style="font-size: 11px; line-height: 1.6; color: #000; font-weight: bold;">
                  <div><strong>الاسم القانوني:</strong> شركة فنون الوليد للصناعة (فنون الوليد للديكور والمقاولات)</div>
                  <div><strong>الرقم الضريبي الموحد (VAT):</strong> <span style="font-family: monospace; font-size: 11.5px; font-weight: 900;">311354897200003</span></div>
                  <div><strong>رقم السجل التجاري (CR):</strong> <span style="font-family: monospace; font-size: 11.5px; font-weight: 900;">2050123456</span></div>
                  <div><strong>العنوان الوطني:</strong> المنطقة الصناعية بـ دلة، شارع أبو بكر الرازي، الدمام 32445، المملكة العربية السعودية</div>
                </div>
              </div>
            </div>
            
            <!-- Left Side: Received and Approved Stamp/Signatures -->
            <div style="width: 45%; border: 1.5px solid #000; border-radius: 8px; padding: 15px; display: flex; flex-direction: column; justify-content: space-between; background: #fff; box-sizing: border-box;">
              <div>
                <div style="font-size: 13px; font-weight: 800; color: #0072BC; border-bottom: 1.5px solid #000; padding-bottom: 6px; margin-bottom: 15px; width: 100%; font-family: 'GE SS Two', 'Gotham Pro', sans-serif;">
                  الاعتماد والتدقيق المالي
                </div>
                <div style="font-size: 10.5px; font-weight: bold; color: #000; margin-bottom: 5px;">توقيع الموظف المستلم (قسم المستودعات):</div>
                <div style="border-bottom: 1px dashed #ccc; height: 35px; margin-bottom: 15px;"></div>
                <div style="font-size: 10.5px; font-weight: bold; color: #000; margin-bottom: 5px;">توقيع واعتماد قسم المحاسبة والتدقيق:</div>
                <div style="border-bottom: 1px dashed #ccc; height: 35px; margin-bottom: 10px;"></div>
              </div>
              <div style="display: flex; justify-content: flex-end;">
                <div style="font-size: 10.5px; border: 2px solid #0072BC; color: #0072BC; border-radius: 50%; padding: 4px 10px; transform: rotate(-5deg); font-weight: bold; display: inline-block;">مُدَقّق ومُعْتَمَد</div>
              </div>
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

  // Filtered Purchase Orders for selected supplier
  const getSupplierPurchaseOrders = () => {
    if (!selectedSupplierForInvoice) return [];
    return purchaseOrders.filter((po) => {
      // Linked if pricing details contains items matching supplierId
      const hasSupplierItem = po.pricingDetails?.some(
        (item: any) => String(item.supplierId) === String(selectedSupplierForInvoice.id)
      );
      const isDirectSupplier = String(po.supplierId) === String(selectedSupplierForInvoice.id);
      return hasSupplierItem || isDirectSupplier;
    });
  };

  const handleSupplierSelect = (sup: any) => {
    setSelectedSupplierForInvoice(sup);
    setSupplierSearchText("");
    setShowSupplierDropdown(false);
    setInvoiceForm((prev) => ({ ...prev, poId: "", projectName: "", items: [] }));
  };

  const handlePurchaseOrderChange = (poId: string) => {
    if (!poId) {
      setInvoiceForm((prev) => ({ ...prev, poId: "", projectName: "", items: [] }));
      return;
    }
    const po = purchaseOrders.find((x) => x.id === poId);
    if (!po) return;

    // Filter pricingDetails for this supplier
    const supplierItems = (po.pricingDetails || []).filter(
      (item: any) => String(item.supplierId) === String(selectedSupplierForInvoice.id)
    );

    const mappedItems: SupplierInvoiceItem[] = supplierItems.map((item: any) => {
      const q = parseFloat(item.quantity || 0);
      const p = parseFloat(item.price || 0);
      const isInclusive = !!item.isVatInclusive;
      const total = isInclusive ? q * p : q * p * 1.15;
      return {
        itemName: item.materialName || item.itemName || "صنف غير معرف",
        qty: q,
        unitPrice: p,
        isVatInclusive: isInclusive,
        total: parseFloat(total.toFixed(2)),
      };
    });

    setInvoiceForm((prev) => ({
      ...prev,
      poId,
      projectName: po.projectName || "بدون مشروع",
      items: mappedItems,
    }));
  };

  // Calculations
  const calculateTotals = (items: SupplierInvoiceItem[]) => {
    let subtotal = 0;
    let vatAmount = 0;
    let totalAmount = 0;

    items.forEach((item) => {
      const q = Number(item.qty || 0);
      const p = Number(item.unitPrice || 0);
      const lineTotal = q * p;

      if (item.isVatInclusive) {
        const base = lineTotal / 1.15;
        const vat = lineTotal - base;
        subtotal += base;
        vatAmount += vat;
        totalAmount += lineTotal;
      } else {
        const vat = lineTotal * 0.15;
        subtotal += lineTotal;
        vatAmount += vat;
        totalAmount += lineTotal + vat;
      }
    });

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      vatAmount: parseFloat(vatAmount.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
    };
  };

  const handleAddItem = () => {
    const newItem: SupplierInvoiceItem = {
      itemName: "",
      qty: 1,
      unitPrice: 0,
      isVatInclusive: false,
      total: 0,
    };
    setInvoiceForm((prev) => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...invoiceForm.items];
    updated.splice(index, 1);
    setInvoiceForm((prev) => ({ ...prev, items: updated }));
  };

  const handleItemChange = (index: number, field: keyof SupplierInvoiceItem, val: any) => {
    const updated = [...invoiceForm.items];
    const item = { ...updated[index], [field]: val };

    // Recalculate line total
    const q = Number(field === "qty" ? val : item.qty);
    const p = Number(field === "unitPrice" ? val : item.unitPrice);
    const isVat = field === "isVatInclusive" ? val : item.isVatInclusive;
    const lineTotal = q * p;
    const total = isVat ? lineTotal : lineTotal * 1.15;

    item.total = parseFloat(total.toFixed(2));
    updated[index] = item;
    setInvoiceForm((prev) => ({ ...prev, items: updated }));
  };

  // Save Supplier Invoice
  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForInvoice) {
      showToast(lang === "ar" ? "الرجاء اختيار المورد أولاً" : "Please select supplier", "error");
      return;
    }
    if (!invoiceForm.invoiceNo.trim()) {
      showToast(lang === "ar" ? "يرجى كتابة رقم الفاتورة" : "Please specify Invoice No", "error");
      return;
    }
    if (invoiceForm.items.length === 0) {
      showToast(lang === "ar" ? "يجب إضافة صنف واحد على الأقل" : "Please add at least one item", "error");
      return;
    }

    const { subtotal, vatAmount, totalAmount } = calculateTotals(invoiceForm.items);
    const invId = selectedInvoice ? selectedInvoice.id : `SUP_INV_${Date.now()}`;

    const payload: SupplierInvoice = {
      id: invId,
      invoiceNo: invoiceForm.invoiceNo,
      invoiceDate: invoiceForm.invoiceDate,
      supplierId: selectedSupplierForInvoice.id,
      supplierName: selectedSupplierForInvoice.name,
      poId: invoiceForm.poId || "",
      projectName: invoiceForm.projectName || "",
      items: invoiceForm.items,
      subtotal,
      vatAmount,
      totalAmount,
      status: selectedInvoice ? selectedInvoice.status : "Draft",
      notes: invoiceForm.notes,
      createdAt: selectedInvoice ? selectedInvoice.createdAt : new Date().toISOString(),
      createdBy: selectedInvoice ? selectedInvoice.createdBy : user?.username || "System",
    };

    try {
      await setDoc(doc(db, "supplier_invoices", invId), payload);
      showToast(
        lang === "ar" ? "تم حفظ فاتورة المورد بنجاح" : "Supplier Invoice saved successfully",
        "success"
      );
      setShowInvoiceModal(false);
      loadData();
    } catch (e) {
      console.error(e);
      showToast(lang === "ar" ? "خطأ أثناء الحفظ" : "Error saving invoice", "error");
    }
  };

  // Open New Invoice Modal
  const openNewInvoiceModal = () => {
    setSelectedInvoice(null);
    setSelectedSupplierForInvoice(null);
    setSupplierSearchText("");
    setInvoiceForm({
      invoiceNo: `PINV-${Math.floor(100000 + Math.random() * 900000)}`,
      invoiceDate: new Date().toISOString().split("T")[0],
      poId: "",
      projectName: "",
      notes: "",
      items: [],
    });
    setShowInvoiceModal(true);
  };

  // Open Edit Invoice Modal
  const openEditInvoiceModal = (inv: SupplierInvoice) => {
    setSelectedInvoice(inv);
    const matchedSup = suppliers.find((s) => s.id === inv.supplierId);
    setSelectedSupplierForInvoice(matchedSup || { id: inv.supplierId, name: inv.supplierName });
    setSupplierSearchText("");
    setInvoiceForm({
      invoiceNo: inv.invoiceNo,
      invoiceDate: inv.invoiceDate,
      poId: inv.poId,
      projectName: inv.projectName,
      notes: inv.notes || "",
      items: inv.items,
    });
    setShowInvoiceModal(true);
  };

  // Delete Invoice
  const handleDeleteInvoice = (invId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: lang === "ar" ? "حذف فاتورة المورد" : "Delete Supplier Invoice",
      message:
        lang === "ar"
          ? "هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء."
          : "Are you sure you want to delete this invoice? This cannot be undone.",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "supplier_invoices", invId));
          showToast(lang === "ar" ? "تم حذف الفاتورة" : "Invoice deleted", "success");
          loadData();
        } catch (e) {
          showToast(lang === "ar" ? "فشل الحذف" : "Failed to delete", "error");
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Approve Invoice & Convert to Expense
  const handleApproveInvoice = (inv: SupplierInvoice) => {
    setConfirmDialog({
      isOpen: true,
      title: lang === "ar" ? "اعتماد فاتورة المورد" : "Approve Supplier Invoice",
      message:
        lang === "ar"
          ? "هل أنت متأكد من اعتماد الفاتورة؟ سيتم ترحيل الفاتورة كـ مصروف مستحق الدفع وتثبيتها."
          : "Are you sure you want to approve this invoice? It will be registered as a pending expense.",
      onConfirm: async () => {
        try {
          // 1. Update Invoice status to Approved
          await setDoc(
            doc(db, "supplier_invoices", inv.id),
            { status: "Approved" },
            { merge: true }
          );

          // 2. Write Expense document to "expenses"
          const expId = `EXP_${Date.now()}`;
          await setDoc(doc(db, "expenses", expId), {
            id: expId,
            expenseNo: `EXP-${Math.floor(100000 + Math.random() * 900000)}`,
            supplierInvoiceId: inv.id,
            invoiceNo: inv.invoiceNo,
            supplierId: inv.supplierId,
            supplierName: inv.supplierName,
            poId: inv.poId || "",
            projectName: inv.projectName || "",
            expenseDate: inv.invoiceDate,
            subtotal: inv.subtotal,
            vatAmount: inv.vatAmount,
            totalAmount: inv.totalAmount,
            paymentStatus: "Pending Payment", // Pending payment approval in Expenses
            notes: inv.notes || `فاتورة مورد مرحلة رقم ${inv.invoiceNo}`,
            createdAt: new Date().toISOString(),
            createdBy: user?.username || "System",
          });

          showToast(
            lang === "ar"
              ? "تم اعتماد الفاتورة وترحيلها بنجاح إلى قسم المصروفات"
              : "Invoice approved and moved to Expenses section",
            "success"
          );
          loadData();
        } catch (e) {
          console.error(e);
          showToast(lang === "ar" ? "فشل الاعتماد" : "Failed to approve", "error");
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Filter lists
  const filteredInvoices = invoices.filter((inv) => {
    const matchNo = (inv.invoiceNo || "").toLowerCase().includes((searchNo || "").toLowerCase());
    const matchSup = (inv.supplierName || "").toLowerCase().includes((searchSupplier || "").toLowerCase());
    const matchStat = filterStatus === "all" ? true : inv.status === filterStatus;
    return matchNo && matchSup && matchStat;
  });

  const totals = calculateTotals(invoiceForm.items);

  return (
    <div id="supplier-invoices-tab-container" className="space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div
          id="supplier-invoice-toast"
          className={`fixed top-4 left-4 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-xs font-black transition-all transform animate-bounce duration-300 ${
            toast.type === "success"
              ? "bg-emerald-500 text-white"
              : toast.type === "error"
              ? "bg-rose-500 text-white"
              : "bg-blue-500 text-white"
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-250">
            <h3 className="text-sm font-black text-slate-800 mb-3">{confirmDialog.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-5 py-2 text-xs font-black text-white bg-[#0072BC] hover:bg-opacity-90 rounded-xl shadow-md transition"
              >
                {lang === "ar" ? "تأكيد" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header and Control Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            🧾 {lang === "ar" ? "فواتير الموردين" : "Supplier Invoices"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {lang === "ar"
              ? "إدارة فواتير المشتريات والموردين استناداً إلى عروض وأوامر الشراء المعتمدة."
              : "Manage supplier purchasing invoices based on approved purchase orders."}
          </p>
        </div>
        <button
          onClick={openNewInvoiceModal}
          className="bg-[#0072BC] hover:bg-opacity-90 text-white text-xs font-black px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-md"
        >
          <Plus className="w-4 h-4" />
          {lang === "ar" ? "إضافة فاتورة مورد" : "Add Supplier Invoice"}
        </button>
      </div>

      {/* Filter and Search Section */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
            {lang === "ar" ? "البحث برقم الفاتورة" : "Search by Invoice No"}
          </label>
          <div className="relative">
            <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchNo}
              onChange={(e) => setSearchNo(e.target.value)}
              placeholder={lang === "ar" ? "أدخل رقم الفاتورة..." : "Invoice No..."}
              className="w-full pl-4 pr-10 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#0072BC]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
            {lang === "ar" ? "اسم المورد" : "Supplier Name"}
          </label>
          <div className="relative">
            <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchSupplier}
              onChange={(e) => setSearchSupplier(e.target.value)}
              placeholder={lang === "ar" ? "ابحث باسم المورد..." : "Supplier name..."}
              className="w-full pl-4 pr-10 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#0072BC]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
            {lang === "ar" ? "حالة الفاتورة" : "Invoice Status"}
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#0072BC] font-semibold"
          >
            <option value="all">{lang === "ar" ? "جميع الحالات" : "All Statuses"}</option>
            <option value="Draft">{lang === "ar" ? "مسودة (Draft)" : "Draft"}</option>
            <option value="Approved">{lang === "ar" ? "معتمد ومرحل (Approved)" : "Approved"}</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-slate-500">
            {lang === "ar" ? "جاري تحميل فواتير الموردين..." : "Loading Supplier Invoices..."}
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-xs font-bold text-slate-400">
            {lang === "ar" ? "لا يوجد فواتير موردين مطابقة للبحث" : "No supplier invoices found"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-100 font-bold">
                  <th className="p-4">{lang === "ar" ? "رقم الفاتورة" : "Invoice No"}</th>
                  <th className="p-4">{lang === "ar" ? "المورد" : "Supplier"}</th>
                  <th className="p-4">{lang === "ar" ? "المشروع" : "Project"}</th>
                  <th className="p-4">{lang === "ar" ? "أمر الشراء" : "Purchase Order"}</th>
                  <th className="p-4">{lang === "ar" ? "تاريخ الفاتورة" : "Invoice Date"}</th>
                  <th className="p-4 text-left">{lang === "ar" ? "القيمة الإجمالية" : "Total Amount"}</th>
                  <th className="p-4 text-center">{lang === "ar" ? "الحالة" : "Status"}</th>
                  <th className="p-4 text-center">{lang === "ar" ? "الإجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition duration-150">
                    <td className="p-4 font-mono font-bold text-[#0072BC]">{inv.invoiceNo}</td>
                    <td className="p-4 font-bold text-slate-800">{inv.supplierName}</td>
                    <td className="p-4 font-semibold text-slate-600">{inv.projectName || "---"}</td>
                    <td className="p-4 font-mono text-[11px] text-indigo-600 font-semibold">{inv.poId || "---"}</td>
                    <td className="p-4 font-semibold text-slate-500">{inv.invoiceDate}</td>
                    <td className="p-4 text-left font-mono font-black text-slate-800">
                      {(Number(inv.totalAmount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[10px] font-black ${
                          inv.status === "Approved"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : "bg-amber-50 text-amber-600 border border-amber-100"
                        }`}
                      >
                        {inv.status === "Approved"
                          ? lang === "ar"
                            ? "معتمد ومرحل"
                            : "Approved"
                          : lang === "ar"
                          ? "مسودة"
                          : "Draft"}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setShowDetailModal(true);
                          }}
                          title={lang === "ar" ? "عرض تفاصيل الفاتورة" : "View Invoice"}
                          className="p-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenPrintTab(inv)}
                          title={lang === "ar" ? "طباعة الفاتورة (علامة تبويب جديدة)" : "Print Invoice (New Tab)"}
                          className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {inv.status === "Draft" && (
                          <>
                            <button
                              onClick={() => handleApproveInvoice(inv)}
                              title={lang === "ar" ? "اعتماد وترحيل للمصروفات" : "Approve & Move to Expenses"}
                              className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditInvoiceModal(inv)}
                              title={lang === "ar" ? "تعديل" : "Edit"}
                              className="p-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteInvoice(inv.id)}
                              title={lang === "ar" ? "حذف" : "Delete"}
                              className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
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

      {/* Add / Edit Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-4 mb-5">
              <h3 className="text-sm font-black text-slate-800">
                {selectedInvoice
                  ? lang === "ar"
                    ? "تعديل فاتورة مورد"
                    : "Edit Supplier Invoice"
                  : lang === "ar"
                  ? "إضافة فاتورة مورد جديدة"
                  : "Add New Supplier Invoice"}
              </h3>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-5 text-right">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Searchable Supplier Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {lang === "ar" ? "المورد *" : "Supplier *"}
                  </label>
                  
                  {/* Dropdown Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setShowSupplierDropdown(!showSupplierDropdown)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 outline-none hover:border-slate-300 focus:ring-2 focus:ring-[#0072BC] transition text-right"
                  >
                    <span className="truncate font-semibold text-slate-800">
                      {selectedSupplierForInvoice
                        ? selectedSupplierForInvoice.name
                        : lang === "ar"
                        ? "اختر المورد..."
                        : "Select supplier..."}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mr-1 ml-1" />
                  </button>

                  {/* Dropdown Menu */}
                  {showSupplierDropdown && (
                    <>
                      {/* Click outside backdrop overlay to close dropdown */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => {
                          setShowSupplierDropdown(false);
                          setSupplierSearchText("");
                        }}
                      />
                      <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-hidden flex flex-col text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                        {/* Search Input Box */}
                        <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                          <Search className="w-4 h-4 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            autoFocus
                            value={supplierSearchText}
                            onChange={(e) => setSupplierSearchText(e.target.value)}
                            placeholder={lang === "ar" ? "ابحث عن مورد..." : "Type to search..."}
                            className="w-full bg-transparent border-0 outline-none text-xs text-slate-700 py-1"
                          />
                          {supplierSearchText && (
                            <button
                              type="button"
                              onClick={() => setSupplierSearchText("")}
                              className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Suppliers List */}
                        <div className="overflow-y-auto max-h-48 divide-y divide-slate-50">
                          {suppliers
                            .filter((s) => {
                              const nameMatch = (s.name || "").toLowerCase().includes(supplierSearchText.toLowerCase());
                              const codeMatch = (s.code || "").toLowerCase().includes(supplierSearchText.toLowerCase());
                              return nameMatch || codeMatch;
                            })
                            .map((sup) => {
                              const isSelected = selectedSupplierForInvoice?.id === sup.id;
                              return (
                                <button
                                  key={sup.id}
                                  type="button"
                                  onClick={() => {
                                    handleSupplierSelect(sup);
                                  }}
                                  className={`w-full text-right px-4 py-2.5 hover:bg-slate-50 flex items-center justify-between font-semibold transition ${
                                    isSelected ? "bg-blue-50/50 text-[#0072BC]" : "text-slate-700"
                                  }`}
                                >
                                  <span>{sup.name}</span>
                                  {isSelected && <span className="text-[#0072BC] text-xs">✓</span>}
                                </button>
                              );
                            })}
                          
                          {suppliers.filter((s) => {
                            const nameMatch = (s.name || "").toLowerCase().includes(supplierSearchText.toLowerCase());
                            const codeMatch = (s.code || "").toLowerCase().includes(supplierSearchText.toLowerCase());
                            return nameMatch || codeMatch;
                          }).length === 0 && (
                            <div className="p-4 text-slate-400 text-center font-medium">
                              {lang === "ar" ? "لا يوجد نتائج" : "No results found"}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Purchase Order Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {lang === "ar" ? "ارتباط بأمر شراء" : "Link with PO"}
                  </label>
                  <select
                    value={invoiceForm.poId}
                    onChange={(e) => handlePurchaseOrderChange(e.target.value)}
                    disabled={!selectedSupplierForInvoice}
                    className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#0072BC] disabled:bg-slate-50 disabled:text-slate-400 font-semibold"
                  >
                    <option value="">
                      {!selectedSupplierForInvoice
                        ? lang === "ar"
                          ? "-- اختر المورد أولاً لتصفية الأوامر --"
                          : "-- Select Supplier First --"
                        : getSupplierPurchaseOrders().length === 0
                        ? lang === "ar"
                          ? "-- لا يوجد أوامر شراء معتمدة للمورد --"
                          : "-- No POs found for supplier --"
                        : lang === "ar"
                        ? "-- اختر أمر الشراء المرتبط --"
                        : "-- Select Purchase Order --"}
                    </option>
                    {getSupplierPurchaseOrders().map((po) => (
                      <option key={po.id} value={po.id}>
                        {lang === "ar"
                          ? `أمر شراء: ${po.id} | مشروع: ${po.projectName || "بدون مشروع"}`
                          : `PO: ${po.id} | Project: ${po.projectName || "None"}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Invoice Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {lang === "ar" ? "رقم الفاتورة *" : "Invoice Number *"}
                  </label>
                  <input
                    type="text"
                    value={invoiceForm.invoiceNo}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNo: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Project Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {lang === "ar" ? "اسم المشروع" : "Project Name"}
                  </label>
                  <input
                    type="text"
                    value={invoiceForm.projectName}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, projectName: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {lang === "ar" ? "تاريخ الفاتورة" : "Invoice Date"}
                  </label>
                  <input
                    type="date"
                    value={invoiceForm.invoiceDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden mt-4">
                <div className="bg-slate-50 p-3 flex justify-between items-center border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-700">
                    📋 {lang === "ar" ? "بنود الفاتورة" : "Invoice Items"}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-black text-white bg-[#0072BC] hover:bg-opacity-90 px-3 py-1.5 rounded-lg transition"
                  >
                    + {lang === "ar" ? "إضافة بند" : "Add Item"}
                  </button>
                </div>

                <div className="p-4 space-y-3 bg-white max-h-60 overflow-y-auto">
                  {invoiceForm.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 pb-3 border-b border-slate-100 last:border-0 items-end">
                      <div className="md:col-span-4">
                        <label className="block text-[10px] text-slate-500 mb-1">{lang === "ar" ? "اسم الصنف *" : "Item Name"}</label>
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(idx, "itemName", e.target.value)}
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] text-slate-500 mb-1">{lang === "ar" ? "الكمية" : "Qty"}</label>
                        <input
                          type="number"
                          step="any"
                          value={item.qty}
                          onChange={(e) => handleItemChange(idx, "qty", parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-center"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] text-slate-500 mb-1">{lang === "ar" ? "سعر الوحدة" : "Unit Price"}</label>
                        <input
                          type="number"
                          step="any"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-left font-mono"
                          required
                        />
                      </div>
                      <div className="md:col-span-2 flex items-center justify-center h-10">
                        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={item.isVatInclusive}
                            onChange={(e) => handleItemChange(idx, "isVatInclusive", e.target.checked)}
                            className="w-4 h-4 text-[#0072BC] border-slate-300 rounded"
                          />
                          <span>{lang === "ar" ? "شامل الضريبة" : "VAT Inc."}</span>
                        </label>
                      </div>
                      <div className="md:col-span-1.5 text-left font-mono font-bold text-xs self-center">
                        {(Number(item.total) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR
                      </div>
                      <div className="md:col-span-0.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                  {invoiceForm.items.length === 0 && (
                    <div className="text-center text-xs text-slate-400 py-6">
                      {lang === "ar" ? "لا يوجد بنود مضافة حالياً. يرجى إضافة بند جديد أو ارتباط بأمر شراء." : "No items added. Add item or link to purchase order."}
                    </div>
                  )}
                </div>
              </div>

              {/* Totals Box */}
              <div className="flex justify-end mt-4">
                <div className="bg-slate-50 p-4 rounded-2xl w-full max-w-sm space-y-2 border border-slate-100 font-semibold">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>{lang === "ar" ? "المجموع قبل الضريبة:" : "Subtotal (Excl. VAT):"}</span>
                    <span className="font-mono">{(Number(totals.subtotal) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>{lang === "ar" ? "ضريبة القيمة المضافة (15%):" : "VAT (15%):"}</span>
                    <span className="font-mono">{(Number(totals.vatAmount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</span>
                  </div>
                  <hr className="border-slate-200" />
                  <div className="flex justify-between text-sm font-black text-[#0072BC]">
                    <span>{lang === "ar" ? "الإجمالي النهائي:" : "Grand Total:"}</span>
                    <span className="font-mono">{(Number(totals.totalAmount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {lang === "ar" ? "ملاحظات إضافية" : "Additional Notes"}
                </label>
                <textarea
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl"
                  placeholder={lang === "ar" ? "أية تفاصيل أو ملاحظات حول الفاتورة..." : "Any details..."}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition"
                >
                  {lang === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-black text-white bg-[#0072BC] hover:bg-opacity-90 rounded-xl shadow-md transition"
                >
                  {lang === "ar" ? "حفظ كـ مسودة" : "Save as Draft"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in duration-200 text-right">
            <div className="flex items-center justify-between border-b pb-4 mb-5">
              <h3 className="text-sm font-black text-slate-800">
                📄 {lang === "ar" ? `تفاصيل فاتورة المورد: ${selectedInvoice.invoiceNo}` : `Supplier Invoice: ${selectedInvoice.invoiceNo}`}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-xs font-semibold">
              <div className="space-y-2">
                <div>
                  <span className="text-slate-500">{lang === "ar" ? "المورد:" : "Supplier:"} </span>
                  <span className="text-slate-800 font-bold">{selectedInvoice.supplierName}</span>
                </div>
                <div>
                  <span className="text-slate-500">{lang === "ar" ? "المشروع المرتبط:" : "Project:"} </span>
                  <span className="text-slate-800 font-bold">{selectedInvoice.projectName || "بدون مشروع"}</span>
                </div>
                <div>
                  <span className="text-slate-500">{lang === "ar" ? "رقم أمر الشراء (PO):" : "PO ID:"} </span>
                  <span className="text-indigo-600 font-bold">{selectedInvoice.poId || "غير مرتبط"}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-slate-500">{lang === "ar" ? "تاريخ الفاتورة:" : "Invoice Date:"} </span>
                  <span className="text-slate-800 font-bold">{selectedInvoice.invoiceDate}</span>
                </div>
                <div>
                  <span className="text-slate-500">{lang === "ar" ? "بواسطة:" : "Created By:"} </span>
                  <span className="text-slate-800 font-bold">{selectedInvoice.createdBy}</span>
                </div>
                <div>
                  <span className="text-slate-500">{lang === "ar" ? "حالة الفاتورة:" : "Status:"} </span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      selectedInvoice.status === "Approved"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : "bg-amber-50 text-amber-600 border border-amber-100"
                    }`}
                  >
                    {selectedInvoice.status === "Approved"
                      ? lang === "ar"
                        ? "معتمد ومرحل"
                        : "Approved"
                      : lang === "ar"
                      ? "مسودة"
                      : "Draft"}
                  </span>
                </div>
              </div>
            </div>

            <div className="border rounded-2xl overflow-hidden mb-6">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b">
                    <th className="p-3">{lang === "ar" ? "البند" : "Item"}</th>
                    <th className="p-3 text-center">{lang === "ar" ? "الكمية" : "Qty"}</th>
                    <th className="p-3 text-left">{lang === "ar" ? "سعر الوحدة" : "Unit Price"}</th>
                    <th className="p-3 text-center">{lang === "ar" ? "شامل الضريبة" : "VAT Inc."}</th>
                    <th className="p-3 text-left">{lang === "ar" ? "الإجمالي" : "Total"}</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedInvoice.items || []).map((item, idx) => (
                    <tr key={idx} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-800">{item.itemName}</td>
                      <td className="p-3 text-center font-bold text-slate-700">{item.qty}</td>
                      <td className="p-3 text-left font-mono text-slate-600">{(Number(item.unitPrice) || 0).toLocaleString("en-US")} SAR</td>
                      <td className="p-3 text-center font-bold text-slate-500">{item.isVatInclusive ? "نعم" : "لا"}</td>
                      <td className="p-3 text-left font-mono font-bold text-slate-800">
                        {(Number(item.total) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-start gap-4">
              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl flex-1">
                <span className="font-bold block mb-1">{lang === "ar" ? "ملاحظات:" : "Notes:"}</span>
                {selectedInvoice.notes || "لا يوجد ملاحظات إضافية"}
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl w-full max-w-sm space-y-2 font-semibold">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>{lang === "ar" ? "المجموع قبل الضريبة:" : "Subtotal:"}</span>
                  <span className="font-mono">{(Number(selectedInvoice.subtotal) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>{lang === "ar" ? "ضريبة القيمة المضافة:" : "VAT Amount:"}</span>
                  <span className="font-mono">{(Number(selectedInvoice.vatAmount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</span>
                </div>
                <hr className="border-slate-200" />
                <div className="flex justify-between text-sm font-black text-[#0072BC]">
                  <span>{lang === "ar" ? "الإجمالي النهائي:" : "Grand Total:"}</span>
                  <span className="font-mono">{(Number(selectedInvoice.totalAmount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
              <button
                onClick={() => handleOpenPrintTab(selectedInvoice)}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                🖨️ {lang === "ar" ? "طباعة الفاتورة" : "Print Invoice"}
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition"
              >
                {lang === "ar" ? "إغلاق" : "Close"}
              </button>
              {selectedInvoice.status === "Draft" && (
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleApproveInvoice(selectedInvoice);
                  }}
                  className="px-5 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-opacity-95 rounded-xl shadow-md transition"
                >
                  {lang === "ar" ? "اعتماد وترحيل الفاتورة" : "Approve & Post Invoice"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
