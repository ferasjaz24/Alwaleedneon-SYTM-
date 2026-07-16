import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, doc, getDocs, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { Search, CheckCircle, AlertCircle, Calendar, DollarSign, ArrowLeft, Eye, X } from "lucide-react";

interface ExpenseRecord {
  id: string;
  expenseNo: string;
  supplierInvoiceId: string;
  invoiceNo: string;
  supplierId: string;
  supplierName: string;
  poId: string;
  projectName: string;
  expenseDate: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  paymentStatus: "Pending Payment" | "Paid" | "Partially Paid";
  paidFromType?: "Bank" | "Cash";
  paidFromId?: string;
  paidFromName?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  currentBalance: number;
}

interface CashBox {
  id: string;
  cashBoxName: string;
  currentBalance: number;
}

export default function ExpensesTab({ lang, user }: { lang: "ar" | "en"; user: any }) {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [boxes, setBoxes] = useState<CashBox[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchNo, setSearchNo] = useState("");
  const [searchSupplier, setSearchSupplier] = useState("");
  const [filterPayment, setFilterPayment] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-07");
  const [showReportPrintModal, setShowReportPrintModal] = useState<boolean>(false);
  const [showExpensesPrintMenu, setShowExpensesPrintMenu] = useState<boolean>(false);

  // Selected Expense for payment modal
  const [selectedExpenseForPayment, setSelectedExpenseForPayment] = useState<ExpenseRecord | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Selected for Details View
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Payment Form state
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: "Bank" as "Bank" | "Cash",
    bankAccountId: "",
    cashBoxId: "",
  });

  // Custom Confirmation Dialog
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

  // Toast notifications state
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

  const handlePrintExpenses = (autoPrint: boolean) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert(lang === "ar" ? "يرجى السماح بالنوافذ المنبثقة لطباعة التقرير." : "Please allow popups to print the report.");
      return;
    }

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.totalAmount) || 0), 0);
    const totalPaid = filteredExpenses.filter(e => e.paymentStatus === "Paid").reduce((sum, e) => sum + (Number(e.totalAmount) || 0), 0);
    const totalUnpaid = filteredExpenses.filter(e => e.paymentStatus === "Pending Payment").reduce((sum, e) => sum + (Number(e.totalAmount) || 0), 0);
    const totalVat = filteredExpenses.reduce((sum, e) => sum + (Number(e.vatAmount) || 0), 0);

    const filterValueText = lang === "ar"
      ? `حالة الدفع: ${filterPayment === "all" ? "الكل" : filterPayment === "Paid" ? "مسدد" : "معلق"}`
      : `Payment Status: ${filterPayment}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="${lang === "ar" ? "ar" : "en"}" dir="${lang === "ar" ? "rtl" : "ltr"}">
      <head>
        <meta charset="utf-8">
        <title>${lang === "ar" ? "تقرير المصروفات والمستحقات" : "Expenses & Liabilities Report"}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Tajawal:wght@400;500;700;900&display=swap');
          
          body {
            font-family: 'Tajawal', 'Cairo', sans-serif;
            direction: rtl;
            text-align: right;
            padding: 20px;
            color: #000 !important;
            font-size: 13px;
            background-color: #f1f5f9;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .invoice-container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            border: 1.5px solid #000;
            padding: 30px;
            border-radius: 8px;
            position: relative;
            box-sizing: border-box;
            background-color: white;
          }

          .header-line {
            border-top: 2px solid #0072BC;
            border-bottom: 1px solid #000;
            height: 1px;
            margin: 15px 0;
          }

          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            margin-bottom: 25px;
          }

          .items-table th {
            background-color: #0072BC !important;
            color: #ffffff !important;
            font-weight: bold;
            padding: 8px;
            font-size: 11px;
            border: 1.5px solid #000 !important;
            text-align: center;
          }

          .items-table td {
            padding: 6px 8px;
            border: 1.5px solid #000 !important;
            font-size: 11px;
            color: #000 !important;
            font-weight: 600;
            text-align: center;
            vertical-align: middle;
          }

          .items-table tr:nth-child(even) {
            background-color: #fcfcfc !important;
          }

          /* Floating action print button */
          .print-button {
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 99999;
            background-color: #0072BC;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 114, 188, 0.3);
            font-family: 'Tajawal', sans-serif;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
          }

          .print-button:hover {
            background-color: #005185;
            transform: translateY(-1px);
          }

          @media print {
            .no-print {
              display: none !important;
            }
            body {
              padding: 0;
              background-color: white !important;
            }
            .invoice-container {
              border: none;
              padding: 0;
              width: 100%;
            }
            @page {
              size: A4 portrait;
              margin: 12mm;
            }
          }
        </style>
      </head>
      <body>
        <button class="print-button no-print" onclick="window.print()">🖨️ ${lang === "ar" ? "طباعة التقرير" : "Print Report"}</button>
        
        <div class="invoice-container">
          <!-- Standard Header layout -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0072BC; padding-bottom: 12px; margin-bottom: 20px; user-select: none; direction: ltr;">
            <!-- معلومات الشركة -->
            <div style="text-align: left; display: flex; flex-direction: column; justify-content: center; width: 40%;">
              <h2 style="font-size: 19px; font-weight: 900; color: #111; margin: 0; font-family: 'Tajawal', sans-serif;" dir="rtl">
                شركة فنون الوليد للصناعة
              </h2>
              <h3 style="font-size: 10px; font-weight: bold; color: #555; margin: 2px 0 0 0; letter-spacing: 0.1em; font-family: sans-serif;">
                FONOUN ALWALEED INDUSTRIAL CO.
              </h3>
            </div>
            
            <!-- الحالة في منتصف رأس الصفحة -->
            <div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 20%;">
              <span style="font-size: 12px; font-weight: 800; padding: 4px 12px; border: 2px solid #0072BC; color: #0072BC; border-radius: 6px; font-family: 'Tajawal', sans-serif; background-color: #f1f5f9; white-space: nowrap;">
                ${lang === "ar" ? "تقرير المصروفات" : "Expenses Report"}
              </span>
            </div>

            <!-- الشعار -->
            <div style="text-align: right; width: 40%; display: flex; justify-content: flex-end;">
              <img src="https://i.postimg.cc/0jQj3XVc/Alwaleed-Logo-Vertical-Blue.png" referrerpolicy="no-referrer" alt="Fonoun Alwaleed Logo" style="width: 120px; height: 120px; object-fit: contain;" />
            </div>
          </div>

          <!-- Report Filter Criteria -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1.5px solid #000; text-align: center; font-size: 11px; direction: rtl;">
            <tr style="background: #f1f5f9; font-weight: bold; color: #000;">
              <td style="padding: 8px; border: 1.5px solid #000; width: 25%;">${lang === "ar" ? "تاريخ الاستخراج" : "Date Generated"}</td>
              <td style="padding: 8px; border: 1.5px solid #000; width: 25%;">${lang === "ar" ? "الفترة المحددة" : "Selected Period"}</td>
              <td style="padding: 8px; border: 1.5px solid #000; width: 25%;">${lang === "ar" ? "معايير التصفية والفلترة" : "Filter Criteria"}</td>
              <td style="padding: 8px; border: 1.5px solid #000; width: 25%;">${lang === "ar" ? "المستخرج بواسطة" : "Generated By"}</td>
            </tr>
            <tr style="color: #000; font-weight: bold;">
              <td style="padding: 8px; border: 1.5px solid #000;">${new Date().toLocaleDateString("en-US")}</td>
              <td style="padding: 8px; border: 1.5px solid #000;">${selectedMonth === "all" ? (lang === "ar" ? "جميع الفترات" : "All Periods") : selectedMonth}</td>
              <td style="padding: 8px; border: 1.5px solid #000;">${filterValueText}</td>
              <td style="padding: 8px; border: 1.5px solid #000;">${user?.username || "Financial Accountant"}</td>
            </tr>
          </table>

          <!-- Total Summary Box -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; border: 1.5px solid #000; text-align: center; font-size: 11px; direction: rtl;">
            <tr style="background: #f1f5f9; font-weight: bold; color: #000;">
              <td style="padding: 8px; border: 1.5px solid #000; width: 25%;">${lang === "ar" ? "إجمالي المصروفات" : "Total Expenses"}</td>
              <td style="padding: 8px; border: 1.5px solid #000; width: 25%;">${lang === "ar" ? "المدفوع والمسدد" : "Total Paid"}</td>
              <td style="padding: 8px; border: 1.5px solid #000; width: 25%;">${lang === "ar" ? "الالتزامات المعلقة" : "Total Unpaid"}</td>
              <td style="padding: 8px; border: 1.5px solid #000; width: 25%;">${lang === "ar" ? "قيمة الضريبة VAT" : "Total VAT"}</td>
            </tr>
            <tr style="color: #000; font-weight: bold; font-size: 13px;">
              <td style="padding: 8px; border: 1.5px solid #000; font-weight: 800;">${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</td>
              <td style="padding: 8px; border: 1.5px solid #000; font-weight: 800; color: #059669;">${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</td>
              <td style="padding: 8px; border: 1.5px solid #000; font-weight: 800; color: #dc2626;">${totalUnpaid.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</td>
              <td style="padding: 8px; border: 1.5px solid #000; font-weight: 800;">${totalVat.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</td>
            </tr>
          </table>

          <!-- Detail Table -->
          <table class="items-table" style="direction: rtl;">
            <thead>
              <tr>
                <th style="width: 100px;">${lang === "ar" ? "رقم المصروف" : "Expense No"}</th>
                <th>${lang === "ar" ? "طبيعة المعاملة والمستفيد" : "Nature & Party"}</th>
                <th style="width: 120px;">${lang === "ar" ? "رقم السند/الفاتورة" : "Voucher/Invoice No"}</th>
                <th style="width: 90px;">${lang === "ar" ? "تاريخ الاستحقاق" : "Date"}</th>
                <th style="width: 100px;">${lang === "ar" ? "قبل الضريبة" : "Subtotal"}</th>
                <th style="width: 80px;">${lang === "ar" ? "الضريبة" : "VAT"}</th>
                <th style="width: 100px;">${lang === "ar" ? "الإجمالي" : "Total Amount"}</th>
                <th style="width: 85px;">${lang === "ar" ? "حالة السداد" : "Status"}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredExpenses.map((exp) => `
                <tr>
                  <td style="font-weight: bold; font-family: monospace;">${exp.expenseNo}</td>
                  <td style="text-align: right; padding-right: 12px; font-weight: bold;">${exp.supplierName}</td>
                  <td style="font-family: monospace;">${exp.invoiceNo}</td>
                  <td style="font-family: monospace;">${exp.expenseDate}</td>
                  <td style="font-family: monospace; text-align: left; padding-left: 10px;">${(Number(exp.subtotal) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  <td style="font-family: monospace; text-align: left; padding-left: 10px;">${(Number(exp.vatAmount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  <td style="font-family: monospace; text-align: left; padding-left: 10px; font-weight: bold; color: #dc2626;">${(Number(exp.totalAmount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  <td>
                    <span style="font-weight: bold; color: ${
                      exp.paymentStatus === 'Paid' ? '#059669' : '#dc2626'
                    };">
                      ${exp.paymentStatus === 'Paid' ? (lang === 'ar' ? 'مسدد' : 'Paid') : (lang === 'ar' ? 'معلق' : 'Unpaid')}
                    </span>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <!-- Signatures Section -->
          <div style="margin-top: 35px; display: flex; justify-content: space-between; align-items: center; border-top: 1.5px solid #000; padding-top: 15px; direction: rtl;">
            <div style="text-align: right; width: 30%;">
              <div style="font-size: 11px; font-weight: bold; color: #000;">توقيع واعتماد قسم الحسابات والتدقيق المالي</div>
              <div style="font-size: 10px; color: #555; margin-top: 4px; font-weight: bold;">شركة فنون الوليد للصناعة</div>
              <div style="width: 150px; border-bottom: 1.5px solid #000; margin-top: 35px;"></div>
            </div>
            <div style="text-align: center; width: 30%;">
              <div style="font-size: 11px; font-weight: bold; color: #000;">اعتماد المدير المالي والتدقيق</div>
              <div style="font-size: 10px; color: #555; margin-top: 4px; font-weight: bold;">مراجعة الصلاحيات الحسابية</div>
              <div style="width: 150px; border-bottom: 1.5px solid #000; margin-top: 35px;"></div>
            </div>
            <div style="text-align: left; width: 30%;">
              <div style="font-size: 11px; font-weight: bold; color: #000;">المجلس التنفيذي والختم الرسمي</div>
              <div style="font-size: 10px; color: #555; margin-top: 4px; font-weight: bold;">شركة فنون الوليد للخدمات الصناعية</div>
              <div style="width: 150px; border-bottom: 1.5px solid #000; margin-top: 35px;"></div>
            </div>
          </div>

          <!-- Standard Corporate Footer -->
          <div style="margin-top: 45px; border-top: 2px solid #0072BC; padding-top: 12px; display: flex; justify-content: space-between; align-items: flex-start; font-size: 10px; color: #111; user-select: none; direction: ltr; min-height: 80px; font-family: 'Tajawal', sans-serif;">
            <div style="text-align: left; line-height: 1.6;">
              <p style="margin:0;"><span style="font-weight: bold; color: #0072BC;">T:</span> +966 13 833 4115</p>
              <p style="margin:0;"><span style="font-weight: bold; color: #0072BC;">Factory:</span> Dallah Industrial District, Dammam 32445, Saudi Arabia.</p>
            </div>
            <div style="text-align: right; line-height: 1.6;">
              <p style="margin:0;">info@alwaleedneon.com | www.alwaleedneon.com</p>
              <p style="margin:0;"><span style="font-weight: bold; color: #0072BC;">Riyad Bank Iban:</span> SA6 320 000 003 220 402 999 901</p>
            </div>
          </div>

        </div>

        ${autoPrint ? `
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        ` : ""}
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch Expenses
      const expSnap = await getDocs(collection(db, "expenses"));
      const expList = expSnap.docs
        .map((d) => ({ id: d.id, ...d.data() } as ExpenseRecord))
        .sort((a, b) => {
          const timeA = new Date(a.createdAt || a.expenseDate || 0).getTime();
          const timeB = new Date(b.createdAt || b.expenseDate || 0).getTime();
          return timeB - timeA;
        });
      setExpenses(expList);

      // Fetch Banks & Cashboxes
      const [banksSnap, boxesSnap] = await Promise.all([
        getDocs(collection(db, "bank_accounts")),
        getDocs(collection(db, "cash_boxes")),
      ]);

      const bankList = banksSnap.docs.map((d) => {
        const data = d.data();
        const currentBalance = Number(data.currentBalance ?? data.current_balance ?? 0);
        return {
          id: d.id,
          bankName: data.bankName || "",
          accountName: data.accountName || "",
          currentBalance,
        };
      });

      const boxList = boxesSnap.docs.map((d) => {
        const data = d.data();
        const currentBalance = Number(data.currentBalance ?? data.current_balance ?? 0);
        return {
          id: d.id,
          cashBoxName: data.cashBoxName || "",
          currentBalance,
        };
      });

      setBanks(bankList);
      setBoxes(boxList);

      // Set default payment selections
      if (bankList.length > 0) {
        setPaymentForm((prev) => ({ ...prev, bankAccountId: bankList[0].id }));
      }
      if (boxList.length > 0) {
        setPaymentForm((prev) => ({ ...prev, cashBoxId: boxList[0].id }));
      }
    } catch (e) {
      console.error(e);
      showToast(lang === "ar" ? "خطأ في تحميل البيانات" : "Error loading data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Initiate Payment Approval Modal
  const initiatePayment = (exp: ExpenseRecord) => {
    setSelectedExpenseForPayment(exp);
    setShowPaymentModal(true);
  };

  // Process Expense Payment & Generate Draft Journal Entry
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpenseForPayment) return;

    let targetAccountName = "";
    let targetAccountId = "";
    const isBank = paymentForm.paymentMethod === "Bank";

    if (isBank) {
      const selectedBank = banks.find((b) => b.id === paymentForm.bankAccountId);
      if (!selectedBank) {
        showToast(lang === "ar" ? "الرجاء اختيار البنك" : "Please select bank account", "error");
        return;
      }
      targetAccountName = `${selectedBank.bankName} - ${selectedBank.accountName}`;
      targetAccountId = selectedBank.id;
    } else {
      const selectedBox = boxes.find((b) => b.id === paymentForm.cashBoxId);
      if (!selectedBox) {
        showToast(lang === "ar" ? "الرجاء اختيار الصندوق" : "Please select cash box", "error");
        return;
      }
      targetAccountName = selectedBox.cashBoxName;
      targetAccountId = selectedBox.id;
    }

    setConfirmDialog({
      isOpen: true,
      title: lang === "ar" ? "تأكيد عملية الصرف ماليًا" : "Confirm Payment Release",
      message:
        lang === "ar"
          ? `هل أنت متأكد من صرف مبلغ ${(Number(selectedExpenseForPayment.totalAmount) || 0).toLocaleString("en-US")} SAR للمورد ${selectedExpenseForPayment.supplierName} من الحساب (${targetAccountName})؟ سيتم توليد قيد يومي مسودة وبانتظار اعتمادك من شاشة القيود اليومية قبل الخصم من الرصيد.`
          : `Are you sure you want to release ${(Number(selectedExpenseForPayment.totalAmount) || 0).toLocaleString("en-US")} SAR to ${selectedExpenseForPayment.supplierName} from ${targetAccountName}? A draft journal entry will be generated.`,
      onConfirm: async () => {
        try {
          const nowStr = new Date().toISOString();
          const expenseId = selectedExpenseForPayment.id;

          // 1. Update the Expense Record to Paid
          await updateDoc(doc(db, "expenses", expenseId), {
            paymentStatus: "Paid",
            paidFromType: paymentForm.paymentMethod,
            paidFromId: targetAccountId,
            paidFromName: targetAccountName,
            paidAt: nowStr,
          });

          // 2. Generate Draft Journal Entry
          const jvId = `JV_EXP_${Date.now()}`;
          const journalEntryNo = `JV-EXP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

          const journalPayload = {
            id: jvId,
            journalEntryNo,
            date: new Date().toISOString().split("T")[0],
            sourceModule: "Adjustment",
            sourceId: expenseId,
            description: `صرف مصروفات فاتورة المورد ${selectedExpenseForPayment.supplierName} - فاتورة رقم ${selectedExpenseForPayment.invoiceNo}`,
            status: "Draft", // Stays Draft as required so user can approve in Journal Entries
            totalDebit: selectedExpenseForPayment.totalAmount,
            totalCredit: selectedExpenseForPayment.totalAmount,
            isBalanced: true,
            cashBankApplied: false,
            createdAt: nowStr,
            createdBy: user?.id || "unknown",
            createdByName: user?.username || "System",
            lines: [
              {
                id: `L1_${Date.now()}`,
                lineNo: 1,
                accountType: "Expense",
                accountCode: "4101",
                accountName: `مشتريات ومصروفات الموردين (${selectedExpenseForPayment.supplierName})`,
                debit: selectedExpenseForPayment.totalAmount,
                credit: 0,
                supplierId: selectedExpenseForPayment.supplierId,
                description: `إثبات مصروف فاتورة المورد ${selectedExpenseForPayment.supplierName}`,
              },
              {
                id: `L2_${Date.now()}`,
                lineNo: 2,
                accountType: isBank ? "Bank" : "Cash",
                accountCode: isBank ? "1102" : "1101",
                accountName: targetAccountName,
                debit: 0,
                credit: selectedExpenseForPayment.totalAmount,
                bankAccountId: isBank ? targetAccountId : "",
                cashBoxId: isBank ? "" : targetAccountId,
                description: `سداد للمورد ${selectedExpenseForPayment.supplierName} من ${targetAccountName}`,
              },
            ],
          };

          await setDoc(doc(db, "journal_entries", jvId), journalPayload);

          showToast(
            lang === "ar"
              ? "تمت عملية الصرف بنجاح وإنشاء قيد يومية مسودة (Draft) بانتظار الاعتماد"
              : "Payment released. Draft journal entry created successfully.",
            "success"
          );

          setShowPaymentModal(false);
          loadData();
        } catch (e) {
          console.error(e);
          showToast(lang === "ar" ? "حدث خطأ أثناء الصرف" : "Error processing payment", "error");
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Filter lists with smart month selection
  const filteredExpenses = expenses.filter((exp) => {
    const matchNo = (exp.expenseNo || "").toLowerCase().includes((searchNo || "").toLowerCase()) || (exp.invoiceNo || "").toLowerCase().includes((searchNo || "").toLowerCase());
    const matchSup = (exp.supplierName || "").toLowerCase().includes((searchSupplier || "").toLowerCase());
    const matchPay = filterPayment === "all" ? true : exp.paymentStatus === filterPayment;
    
    // Support matching both YYYY-MM dates and specific custom formats
    const matchMonth = selectedMonth === "all" || !selectedMonth || (exp.expenseDate && exp.expenseDate.startsWith(selectedMonth));
    
    return matchNo && matchSup && matchPay && matchMonth;
  });

  return (
    <div id="expenses-tab-container" className="space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div
          id="expenses-toast"
          className={`fixed top-4 left-4 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-xs font-black transition-all transform animate-bounce duration-300 ${
            toast.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
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
                className="px-5 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-opacity-95 rounded-xl shadow-md transition"
              >
                {lang === "ar" ? "تأكيد وصرف" : "Confirm Release"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            💰 {lang === "ar" ? "المصروفات والمستحقات والذمم الدائنة" : "Expenses & Liabilities"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {lang === "ar"
              ? "متابعة وتقارير المصروفات والمدفوعات والذمم الدائنة المعتمدة تلقائياً من قيود اليومية أو المسجلة يدوياً."
              : "Track and report expenses, liabilities, and payments approved automatically from general journal entries."}
          </p>
        </div>

        {/* Date Selector & Print Report Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 p-1.5 rounded-2xl">
            <span className="text-[11px] font-black text-slate-500 mr-1.5 flex items-center gap-1">
              📅 {lang === "ar" ? "الشهر المالي:" : "Month:"}
            </span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1 text-xs font-bold border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#0072BC] bg-white text-slate-700"
            />
            {selectedMonth !== "all" && (
              <button
                onClick={() => setSelectedMonth("all")}
                className="px-2.5 py-1 text-[10px] font-black text-slate-500 hover:text-white bg-slate-200 hover:bg-[#0072BC] rounded-lg transition-all"
              >
                {lang === "ar" ? "الكل" : "All"}
              </button>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowExpensesPrintMenu(!showExpensesPrintMenu)}
              className="px-4 py-2 text-xs font-black text-white bg-[#0072BC] hover:bg-[#005185] rounded-xl shadow-md hover:shadow-lg transition-all duration-150 flex items-center gap-2"
            >
              🖨️ {lang === "ar" ? "خيارات تقرير المصروفات" : "Expenses Report Options"}
            </button>
            {showExpensesPrintMenu && (
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-1.5 z-30 font-bold text-slate-700 text-xs text-right animate-fade-in no-print">
                <button
                  onClick={() => {
                    setShowExpensesPrintMenu(false);
                    handlePrintExpenses(false);
                  }}
                  className="w-full text-right px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 text-slate-800 transition"
                >
                  👁️ {lang === "ar" ? "معاينة تقرير المصروفات" : "Preview Expenses Report"}
                </button>
                <button
                  onClick={() => {
                    setShowExpensesPrintMenu(false);
                    handlePrintExpenses(true);
                  }}
                  className="w-full text-right px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 text-[#0072BC] border-t border-slate-100 transition"
                >
                  🖨️ {lang === "ar" ? "طباعة تقرير المصروفات" : "Print Expenses Report"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        {/* Card 1: Total Expenses */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between transition-all duration-150 hover:shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block">
              {lang === "ar" ? "إجمالي المصروفات للمدة" : "Total Expenses"}
            </span>
            <span className="text-base font-black text-slate-800 font-mono">
              {filteredExpenses.reduce((sum, e) => sum + (Number(e.totalAmount) || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-[9px] text-slate-500 font-sans">SAR</span>
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: Total Unpaid Liabilities */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between transition-all duration-150 hover:shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block">
              {lang === "ar" ? "الذمم الدائنة المطلوبة" : "Unpaid Liabilities"}
            </span>
            <span className="text-base font-black text-rose-600 font-mono">
              {filteredExpenses.filter(e => e.paymentStatus === "Pending Payment").reduce((sum, e) => sum + (Number(e.totalAmount) || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-[9px] text-rose-500 font-sans">SAR</span>
            </span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3: Pending Partial Expenses */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between transition-all duration-150 hover:shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block">
              {lang === "ar" ? "صرف جزئي معلق للمدة" : "Pending Partial"}
            </span>
            <span className="text-base font-black text-amber-600 font-mono">
              {filteredExpenses.filter(e => e.paymentStatus === "Partially Paid").reduce((sum, e) => sum + (Number(e.totalAmount) || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-[9px] text-amber-500 font-sans">SAR</span>
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Calendar className="w-4 h-4" />
          </div>
        </div>

        {/* Card 4: Actually Paid Expenses */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between transition-all duration-150 hover:shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block">
              {lang === "ar" ? "المصروفات المدفوعة فعلياً" : "Actually Paid"}
            </span>
            <span className="text-base font-black text-emerald-600 font-mono">
              {filteredExpenses.filter(e => e.paymentStatus === "Paid").reduce((sum, e) => sum + (Number(e.totalAmount) || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-[9px] text-emerald-500 font-sans">SAR</span>
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
            {lang === "ar" ? "البحث برقم المصروف أو الفاتورة" : "Search by Expense or Invoice No"}
          </label>
          <div className="relative">
            <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchNo}
              onChange={(e) => setSearchNo(e.target.value)}
              placeholder={lang === "ar" ? "أدخل رقم المصروف أو الفاتورة..." : "Search number..."}
              className="w-full pl-4 pr-10 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#0072BC]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
            {lang === "ar" ? "طبيعة المعاملة أو الجهة" : "Transaction Nature or Party"}
          </label>
          <div className="relative">
            <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchSupplier}
              onChange={(e) => setSearchSupplier(e.target.value)}
              placeholder={lang === "ar" ? "البحث بطبيعة المعاملة أو الجهة..." : "Search nature or party..."}
              className="w-full pl-4 pr-10 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#0072BC]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
            {lang === "ar" ? "حالة الصرف" : "Payment Status"}
          </label>
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#0072BC] font-semibold"
          >
            <option value="all">{lang === "ar" ? "جميع الحالات" : "All"}</option>
            <option value="Pending Payment">{lang === "ar" ? "في انتظار الصرف" : "Pending Payment"}</option>
            <option value="Partially Paid">{lang === "ar" ? "صرف جزئي معلق" : "Partially Paid"}</option>
            <option value="Paid">{lang === "ar" ? "تم الصرف والدفع" : "Paid"}</option>
          </select>
        </div>
      </div>

      {/* List Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-slate-500">
            {lang === "ar" ? "جاري تحميل المصروفات..." : "Loading Expenses..."}
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-xs font-bold text-slate-400">
            {lang === "ar" ? "لا يوجد مصروفات مطابقة للبحث" : "No expenses found"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-100 font-bold">
                  <th className="p-4">{lang === "ar" ? "رقم المصروف" : "Expense No"}</th>
                  <th className="p-4">{lang === "ar" ? "طبيعة المعاملة والمستفيد" : "Transaction Nature & Party"}</th>
                  <th className="p-4">{lang === "ar" ? "رقم السند/الفاتورة" : "Voucher/Invoice No"}</th>
                  <th className="p-4">{lang === "ar" ? "المشروع" : "Project"}</th>
                  <th className="p-4">{lang === "ar" ? "تاريخ الاستحقاق" : "Date"}</th>
                  <th className="p-4 text-left">{lang === "ar" ? "المبلغ المطلوب" : "Amount"}</th>
                  <th className="p-4 text-center">{lang === "ar" ? "حالة الدفع" : "Payment Status"}</th>
                  <th className="p-4">{lang === "ar" ? "صرف من" : "Paid From"}</th>
                  <th className="p-4 text-center">{lang === "ar" ? "الإجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition duration-150">
                    <td className="p-4 font-mono font-bold text-rose-600">{exp.expenseNo}</td>
                    <td className="p-4 font-bold text-slate-800">{exp.supplierName}</td>
                    <td className="p-4 font-mono font-semibold text-slate-500">{exp.invoiceNo}</td>
                    <td className="p-4 font-semibold text-slate-600">{exp.projectName || "---"}</td>
                    <td className="p-4 font-semibold text-slate-500">{exp.expenseDate}</td>
                    <td className="p-4 text-left font-mono font-black text-rose-700">
                      {(Number(exp.totalAmount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[10px] font-black ${
                          exp.paymentStatus === "Paid"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : exp.paymentStatus === "Partially Paid"
                            ? "bg-amber-50 text-amber-600 border border-amber-100 animate-pulse"
                            : "bg-rose-50 text-rose-600 border border-rose-100 animate-pulse"
                        }`}
                      >
                        {exp.paymentStatus === "Paid"
                          ? lang === "ar"
                            ? "تم الصرف"
                            : "Paid"
                          : exp.paymentStatus === "Partially Paid"
                          ? lang === "ar"
                            ? "صرف جزئي معلق"
                            : "Partially Paid"
                          : lang === "ar"
                          ? "انتظار الصرف"
                          : "Pending"}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-600">
                      {exp.paymentStatus === "Paid" ? (
                        <div className="flex flex-col">
                          <span>{exp.paidFromName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{exp.paidAt ? new Date(exp.paidAt).toLocaleDateString() : ""}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">---</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedExpense(exp);
                            setShowDetailModal(true);
                          }}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                          title={lang === "ar" ? "عرض التفاصيل" : "View Details"}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {(exp.paymentStatus === "Pending Payment" || exp.paymentStatus === "Partially Paid") && (
                          <button
                            onClick={() => initiatePayment(exp)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1.5 transition shadow-sm"
                            title={lang === "ar" ? "تأكيد عملية الصرف مالياً" : "Confirm Payment Release"}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>{lang === "ar" ? "تأكيد عملية الصرف مالياً" : "Confirm Payment Release"}</span>
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

      {/* release payment Modal */}
      {showPaymentModal && selectedExpenseForPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200 text-right">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="text-sm font-black text-slate-800">
                💰 {lang === "ar" ? "تأكيد عملية الصرف مالياً" : "Confirm Payment Release"}
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              {/* Payment Info Box */}
              <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 space-y-2 text-xs font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === "ar" ? "المورد المستحق:" : "Supplier:"}</span>
                  <span className="text-slate-800 font-bold">{selectedExpenseForPayment.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === "ar" ? "قيمة الفاتورة المطلوبة:" : "Invoice Amount:"}</span>
                  <span className="text-rose-700 font-mono font-black">
                    {(Number(selectedExpenseForPayment.totalAmount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === "ar" ? "رقم الفاتورة:" : "Invoice No:"}</span>
                  <span className="text-slate-700 font-mono">{selectedExpenseForPayment.invoiceNo}</span>
                </div>
              </div>

              {/* Payment Method / Account Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {lang === "ar" ? "طريقة الصرف والخصم *" : "Deduction Method *"}
                </label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => setPaymentForm({ ...paymentForm, paymentMethod: "Bank" })}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1.5 ${
                      paymentForm.paymentMethod === "Bank"
                        ? "border-[#0072BC] bg-[#0072BC]/5 text-[#0072BC]"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    🏦 {lang === "ar" ? "حساب بنكي" : "Bank Account"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentForm({ ...paymentForm, paymentMethod: "Cash" })}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1.5 ${
                      paymentForm.paymentMethod === "Cash"
                        ? "border-[#0072BC] bg-[#0072BC]/5 text-[#0072BC]"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    💵 {lang === "ar" ? "صندوق / خزينة كاش" : "Cash Box"}
                  </button>
                </div>

                {paymentForm.paymentMethod === "Bank" ? (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                      {lang === "ar" ? "اختر الحساب البنكي الخصيم *" : "Select Bank Account *"}
                    </label>
                    <select
                      value={paymentForm.bankAccountId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, bankAccountId: e.target.value })}
                      className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#0072BC] font-semibold"
                      required
                    >
                      {banks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} - {b.accountName} (رصيد: {(Number(b.currentBalance) || 0).toLocaleString("en-US")} SAR)
                        </option>
                      ))}
                      {banks.length === 0 && (
                        <option value="">{lang === "ar" ? "-- لا يوجد حسابات بنكية معرفة --" : "-- No bank accounts --"}</option>
                      )}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                      {lang === "ar" ? "اختر الخزينة / الصندوق الخصيم *" : "Select Cash Box *"}
                    </label>
                    <select
                      value={paymentForm.cashBoxId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, cashBoxId: e.target.value })}
                      className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#0072BC] font-semibold"
                      required
                    >
                      {boxes.map((bx) => (
                        <option key={bx.id} value={bx.id}>
                          {bx.cashBoxName} (رصيد: {(Number(bx.currentBalance) || 0).toLocaleString("en-US")} SAR)
                        </option>
                      ))}
                      {boxes.length === 0 && (
                        <option value="">{lang === "ar" ? "-- لا يوجد صناديق كاش معرفة --" : "-- No cash boxes --"}</option>
                      )}
                    </select>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition"
                >
                  {lang === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-opacity-95 rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{lang === "ar" ? "تأكيد وإصدار القيد" : "Confirm Payment"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailModal && selectedExpense && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200 text-right">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="text-sm font-black text-slate-800">
                📄 {lang === "ar" ? `تفاصيل مستند الصرف: ${selectedExpense.expenseNo}` : `Expense Details: ${selectedExpense.expenseNo}`}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-slate-500 block">{lang === "ar" ? "المورد:" : "Supplier:"}</span>
                  <span className="text-slate-800 font-bold text-sm block mt-0.5">{selectedExpense.supplierName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{lang === "ar" ? "رقم الفاتورة:" : "Invoice No:"}</span>
                  <span className="text-slate-800 font-mono text-sm block mt-0.5">{selectedExpense.invoiceNo}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-slate-500 block">{lang === "ar" ? "المشروع المرتبط:" : "Project:"}</span>
                  <span className="text-slate-700 block mt-0.5">{selectedExpense.projectName || "بدون مشروع"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{lang === "ar" ? "أمر الشراء (PO):" : "PO ID:"}</span>
                  <span className="text-indigo-600 font-mono block mt-0.5">{selectedExpense.poId || "غير مرتبط"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-slate-500 block">{lang === "ar" ? "تاريخ الاستحقاق:" : "Due Date:"}</span>
                  <span className="text-slate-700 block mt-0.5">{selectedExpense.expenseDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{lang === "ar" ? "حالة الصرف:" : "Payment Status:"}</span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black mt-1 ${
                      selectedExpense.paymentStatus === "Paid"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : selectedExpense.paymentStatus === "Partially Paid"
                        ? "bg-amber-50 text-amber-600 border border-amber-100"
                        : "bg-rose-50 text-rose-600 border border-rose-100"
                    }`}
                  >
                    {selectedExpense.paymentStatus === "Paid"
                      ? lang === "ar"
                        ? "تم الصرف"
                        : "Paid"
                      : selectedExpense.paymentStatus === "Partially Paid"
                      ? lang === "ar"
                        ? "صرف جزئي معلق"
                        : "Partially Paid"
                      : lang === "ar"
                      ? "انتظار الصرف"
                      : "Pending"}
                  </span>
                </div>
              </div>

              {selectedExpense.paymentStatus === "Paid" && (
                <div className="bg-slate-50 p-3 rounded-2xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{lang === "ar" ? "وسيلة الدفع والخصم:" : "Method:"}</span>
                    <span className="text-slate-800 font-bold">{selectedExpense.paidFromName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{lang === "ar" ? "تاريخ ووقت الصرف المالي:" : "Paid At:"}</span>
                    <span className="text-slate-600 font-mono">
                      {selectedExpense.paidAt ? new Date(selectedExpense.paidAt).toLocaleString("en-US") : ""}
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-slate-50/50 p-4 rounded-2xl space-y-2 border border-slate-100 font-semibold text-right">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>{lang === "ar" ? "المبلغ قبل الضريبة:" : "Subtotal:"}</span>
                  <span className="font-mono">{(Number(selectedExpense.subtotal) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>{lang === "ar" ? "ضريبة القيمة المضافة:" : "VAT amount:"}</span>
                  <span className="font-mono">{(Number(selectedExpense.vatAmount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</span>
                </div>
                <hr className="border-slate-200" />
                <div className="flex justify-between text-sm font-black text-rose-600">
                  <span>{lang === "ar" ? "الإجمالي المستحق للصرف:" : "Total release:"}</span>
                  <span className="font-mono">{(Number(selectedExpense.totalAmount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">{lang === "ar" ? "ملاحظات إضافية:" : "Notes:"}</span>
                <p className="bg-slate-50 p-2.5 rounded-xl text-slate-600">{selectedExpense.notes || "لا يوجد"}</p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t mt-5">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition"
              >
                {lang === "ar" ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPENSES MONTHLY/PERIODICAL REPORT PRINT MODAL */}
      {showReportPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto no-print" dir={lang === "ar" ? "rtl" : "ltr"}>
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #expenses-report-print-area, #expenses-report-print-area * {
                visibility: visible !important;
              }
              #expenses-report-print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 10mm !important;
                background: white !important;
                color: black !important;
                direction: rtl !important;
                font-family: sans-serif !important;
              }
              .no-print-modal {
                display: none !important;
              }
            }
          `}} />
          
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border overflow-hidden flex flex-col my-8 max-h-[90vh] no-print-modal">
            <div className="bg-[#005185] p-5 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">📄</span>
                <h2 className="text-sm font-black">
                  {lang === "ar" ? "تقرير المصروفات والمستحقات المالي" : "Financial Expenses & Liabilities Report"}
                </h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-white hover:bg-slate-100 text-[#005185] py-1.5 px-4 rounded-xl font-black text-xs transition duration-150 shadow"
                >
                  🖨️ {lang === "ar" ? "طباعة التقرير الآن" : "Print Report Now"}
                </button>
                <button
                  onClick={() => setShowReportPrintModal(false)}
                  className="text-white hover:text-red-200 text-lg font-bold px-2 transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Scrollable Preview Area for UI view */}
            <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
              <div className="bg-white p-8 rounded-2xl border shadow-sm max-w-4xl mx-auto" id="expenses-report-print-area">
                
                {/* Print Header */}
                <div className="flex justify-between items-start border-b-2 border-[#005185] pb-4 mb-6">
                  <div className="text-right space-y-1">
                    <h1 className="text-base font-black text-[#005185]">{lang === "ar" ? "شركة فنون الوليد للخدمات الصناعية" : "Al Waleed Arts Industrial Services Co."}</h1>
                    <p className="text-[10px] text-slate-400 font-bold">AL WALEED ARTS INDUSTRIAL SERVICES & ADV. CO.</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{lang === "ar" ? "الرقم الضريبي: ٣١٠٨٨٧٦٦٥٢٠٠٠٠٣" : "VAT ID: 310887665200003"}</p>
                  </div>
                  <div className="text-center bg-slate-50 border border-slate-200 px-4 py-1.5 rounded-lg">
                    <span className="block text-[11px] font-black text-slate-600">
                      {lang === "ar" ? "تقرير مصروفات الفترة" : "Expenses Period Report"}
                    </span>
                    <span className="block text-xs font-mono font-bold text-[#005185] mt-0.5">
                      {selectedMonth === "all" ? (lang === "ar" ? "جميع الفترات" : "All Periods") : selectedMonth}
                    </span>
                  </div>
                </div>

                {/* Report Meta Metadata */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
                  <div>
                    <span className="text-slate-400 block text-[10px]">{lang === "ar" ? "تاريخ الاستخراج" : "Date Generated"}</span>
                    <span className="text-slate-800 font-bold font-mono mt-0.5 block">{new Date().toLocaleDateString("en-US")}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">{lang === "ar" ? "المستخدم المستخرج" : "Generated By"}</span>
                    <span className="text-slate-800 font-bold mt-0.5 block">{user?.username || "Financial Accountant"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">{lang === "ar" ? "عدد قيود المصروفات" : "Total Records"}</span>
                    <span className="text-slate-800 font-bold font-mono mt-0.5 block">{filteredExpenses.length}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">{lang === "ar" ? "نطاق الفحص المالي" : "Financial Scope"}</span>
                    <span className="text-[#0072BC] font-bold mt-0.5 block">{lang === "ar" ? "المصروفات والالتزامات المعتمدة" : "Approved Balances"}</span>
                  </div>
                </div>

                {/* Total Summary Mini-Bento inside Report */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="border border-slate-200/80 p-3 rounded-xl bg-slate-50/50 text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">{lang === "ar" ? "إجمالي المصروفات" : "Total Expenses"}</span>
                    <span className="text-sm font-black text-slate-800 font-mono mt-1 block">
                      {filteredExpenses.reduce((sum, e) => sum + (Number(e.totalAmount) || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-[9px] text-slate-500">SAR</span>
                    </span>
                  </div>
                  <div className="border border-[#005185]/30 p-3 rounded-xl bg-blue-50/20 text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">{lang === "ar" ? "المدفوع والمسدد" : "Total Paid"}</span>
                    <span className="text-sm font-black text-emerald-700 font-mono mt-1 block">
                      {filteredExpenses.filter(e => e.paymentStatus === "Paid").reduce((sum, e) => sum + (Number(e.totalAmount) || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-[9px] text-slate-500">SAR</span>
                    </span>
                  </div>
                  <div className="border border-rose-200 p-3 rounded-xl bg-rose-50/10 text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">{lang === "ar" ? "الالتزامات غير المدفوعة" : "Total Unpaid"}</span>
                    <span className="text-sm font-black text-rose-600 font-mono mt-1 block">
                      {filteredExpenses.filter(e => e.paymentStatus === "Pending Payment").reduce((sum, e) => sum + (Number(e.totalAmount) || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-[9px] text-slate-500">SAR</span>
                    </span>
                  </div>
                  <div className="border border-amber-200 p-3 rounded-xl bg-amber-50/10 text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">{lang === "ar" ? "قيمة الضريبة المستردة" : "Total VAT"}</span>
                    <span className="text-sm font-black text-amber-700 font-mono mt-1 block">
                      {filteredExpenses.reduce((sum, e) => sum + (Number(e.vatAmount) || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-[9px] text-slate-500">SAR</span>
                    </span>
                  </div>
                </div>

                {/* Table of Items */}
                <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
                  <table className="w-full text-right text-[10px] text-slate-700 leading-normal">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-extrabold text-right">
                        <th className="p-2.5 font-bold">{lang === "ar" ? "رقم المصروف" : "Expense No"}</th>
                        <th className="p-2.5 font-bold">{lang === "ar" ? "طبيعة المعاملة والمستفيد" : "Nature & Party"}</th>
                        <th className="p-2.5 font-bold">{lang === "ar" ? "رقم السند" : "Voucher"}</th>
                        <th className="p-2.5 font-bold">{lang === "ar" ? "تاريخ الاستحقاق" : "Date"}</th>
                        <th className="p-2.5 text-left font-bold">{lang === "ar" ? "قبل الضريبة" : "Subtotal"}</th>
                        <th className="p-2.5 text-left font-bold">{lang === "ar" ? "الضريبة" : "VAT"}</th>
                        <th className="p-2.5 text-left font-bold">{lang === "ar" ? "الإجمالي" : "Total Amount"}</th>
                        <th className="p-2.5 text-center font-bold">{lang === "ar" ? "حالة السداد" : "Status"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map((exp, idx) => (
                        <tr key={exp.id} className={`border-b border-slate-100 font-semibold ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
                          <td className="p-2.5 font-mono text-rose-600 font-bold">{exp.expenseNo}</td>
                          <td className="p-2.5 font-bold text-slate-800">{exp.supplierName}</td>
                          <td className="p-2.5 font-mono text-slate-500 font-bold">{exp.invoiceNo}</td>
                          <td className="p-2.5 text-slate-500 font-mono font-bold">{exp.expenseDate}</td>
                          <td className="p-2.5 text-left font-mono">{(Number(exp.subtotal) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                          <td className="p-2.5 text-left font-mono text-amber-700">{(Number(exp.vatAmount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                          <td className="p-2.5 text-left font-mono font-black text-rose-700">{(Number(exp.totalAmount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                          <td className="p-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                              exp.paymentStatus === "Paid" 
                                ? "bg-emerald-50 text-emerald-600" 
                                : "bg-rose-50 text-rose-600"
                            }`}>
                              {exp.paymentStatus === "Paid" ? (lang === "ar" ? "مسدد" : "Paid") : (lang === "ar" ? "معلق" : "Unpaid")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Print Signatures and Approvals */}
                <div className="grid grid-cols-3 gap-6 pt-12 text-center font-extrabold text-[10px] text-slate-800">
                  <div className="space-y-12">
                    <p className="text-[#005185] border-b pb-1.5">{lang === "ar" ? "توقيع المحاسب المالي" : "Financial Accountant Sign"}</p>
                    <span className="block text-slate-400 font-normal">________________________</span>
                  </div>
                  <div className="space-y-12">
                    <p className="text-[#005185] border-b pb-1.5">{lang === "ar" ? "اعتماد المدير المالي" : "Finance Director Approval"}</p>
                    <span className="block text-slate-400 font-normal">________________________</span>
                  </div>
                  <div className="space-y-12">
                    <p className="text-[#005185] border-b pb-1.5">{lang === "ar" ? "المجلس التنفيذي والختم" : "Executive Board & Stamp"}</p>
                    <span className="block text-slate-400 font-normal">________________________</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
