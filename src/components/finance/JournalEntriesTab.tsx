import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, doc, getDocs, setDoc, updateDoc, getDoc } from "firebase/firestore";

interface JournalLine {
  id: string;
  lineNo: number;
  accountType: "Bank" | "Cash" | "Accounts Receivable" | "Revenue" | "VAT Output" | "Expense" | "Supplier" | "Accounts Payable" | "Equity" | "Other";
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  bankAccountId?: string;
  cashBoxId?: string;
  customerId?: string;
  supplierId?: string;
  invoiceId?: string;
  description: string;
}

interface JournalEntry {
  id: string;
  journalEntryNo: string;
  date: string;
  sourceModule: "Manual" | "Customer Invoice" | "Revenue Receipt" | "Bank Transfer" | "Adjustment" | "مشتريات يومية" | "Reversal Log" | string;
  sourceId?: string;
  description: string;
  status: "Draft" | "Approved" | "Reversed" | "Cancelled";
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  cashBankApplied: boolean;
  cashBankAppliedAt?: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  lines: JournalLine[];
  isDeleted?: boolean;
}

export default function JournalEntriesTab({ lang, user }: { lang: "ar" | "en"; user: any }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchNo, setSearchNo] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
  });
  const [showJournalPrintMenu, setShowJournalPrintMenu] = useState(false);
  const [showJournalReportModal, setShowJournalReportModal] = useState(false);

  // Modals
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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

  // Manual creation states
  const [journalForm, setJournalForm] = useState({
    journalEntryNo: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    status: "Draft" as "Draft" | "Approved",
    lines: [] as JournalLine[]
  });

  // Test Flow variables
  const [testLog, setTestLog] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);

  // Custom states for Daily Purchase approval
  const [showApprovalAccountModal, setShowApprovalAccountModal] = useState(false);
  const [approvalEntry, setApprovalEntry] = useState<JournalEntry | null>(null);
  const [selectedPaymentSource, setSelectedPaymentSource] = useState<{ type: "Bank" | "Cash"; id: string }>({ type: "Bank", id: "" });

  const handlePrintJournal = (autoPrint: boolean) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert(lang === "ar" ? "يرجى السماح بالنوافذ المنبثقة لطباعة التقرير." : "Please allow popups to print the report.");
      return;
    }

    const totalDebits = filteredEntries.reduce((sum, e) => sum + (Number(e.totalDebit) || 0), 0);
    const totalCredits = filteredEntries.reduce((sum, e) => sum + (Number(e.totalCredit) || 0), 0);
    const approvedCount = filteredEntries.filter(e => e.status === "Approved").length;

    const filterValueText = lang === "ar" 
      ? `الحالة: ${filterStatus === "all" ? "الكل" : filterStatus === "Approved" ? "معتمد" : filterStatus === "Draft" ? "مسودة" : "ملغى"}` 
      : `Status: ${filterStatus}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="${lang === "ar" ? "ar" : "en"}" dir="${lang === "ar" ? "rtl" : "ltr"}">
      <head>
        <meta charset="utf-8">
        <title>${lang === "ar" ? "تقرير القيود اليومية" : "Journal Entries Report"}</title>
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
                ${lang === "ar" ? "تقرير القيود اليومية" : "Journal Entries Report"}
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
              <td style="padding: 8px; border: 1.5px solid #000; width: 33.3%;">${lang === "ar" ? "إجمالي المدين (Debits)" : "Total Debits"}</td>
              <td style="padding: 8px; border: 1.5px solid #000; width: 33.3%;">${lang === "ar" ? "إجمالي الدائن (Credits)" : "Total Credits"}</td>
              <td style="padding: 8px; border: 1.5px solid #000; width: 33.3%;">${lang === "ar" ? "القيود المعتمدة والمرحلة" : "Approved Entries"}</td>
            </tr>
            <tr style="color: #000; font-weight: bold; font-size: 13px;">
              <td style="padding: 8px; border: 1.5px solid #000; font-weight: 800;">${totalDebits.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</td>
              <td style="padding: 8px; border: 1.5px solid #000; font-weight: 800;">${totalCredits.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</td>
              <td style="padding: 8px; border: 1.5px solid #000; font-weight: 800; color: #059669;">${approvedCount}</td>
            </tr>
          </table>

          <!-- Detail Table -->
          <table class="items-table" style="direction: rtl;">
            <thead>
              <tr>
                <th style="width: 100px;">${lang === "ar" ? "رقم القيد" : "Entry No"}</th>
                <th style="width: 90px;">${lang === "ar" ? "التاريخ" : "Date"}</th>
                <th>${lang === "ar" ? "بيان القيد العام" : "General Description"}</th>
                <th style="width: 110px;">${lang === "ar" ? "إجمالي المدين" : "Total Debit"}</th>
                <th style="width: 110px;">${lang === "ar" ? "إجمالي الدائن" : "Total Credit"}</th>
                <th style="width: 80px;">${lang === "ar" ? "الحالة" : "Status"}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEntries.map((jv) => `
                <tr>
                  <td style="font-weight: bold; font-family: monospace;">${jv.journalEntryNo}</td>
                  <td style="font-family: monospace;">${jv.date}</td>
                  <td style="text-align: right; padding-right: 12px; font-weight: bold;">${jv.description}</td>
                  <td style="font-family: monospace; text-align: left; padding-left: 10px;">${(Number(jv.totalDebit) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  <td style="font-family: monospace; text-align: left; padding-left: 10px;">${(Number(jv.totalCredit) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  <td>
                    <span style="font-weight: bold; color: ${
                      jv.status === 'Approved' ? '#059669' : jv.status === 'Draft' ? '#4b5563' : '#dc2626'
                    };">
                      ${jv.status === 'Approved' ? (lang === 'ar' ? 'معتمد' : 'Approved') : jv.status === 'Draft' ? (lang === 'ar' ? 'مسودة' : 'Draft') : (lang === 'ar' ? 'ملغى' : 'Cancelled')}
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
      const entSnap = await getDocs(collection(db, "journal_entries"));
      const entList = entSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as JournalEntry))
        .filter(x => !x.isDeleted)
        .sort((a, b) => {
          const timeA = new Date(a.createdAt || a.date || 0).getTime();
          const timeB = new Date(b.createdAt || b.date || 0).getTime();
          return timeB - timeA;
        });
      setEntries(entList);

      const bankSnap = await getDocs(collection(db, "bank_accounts"));
      setBanks(bankSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter((x: any) => !x.isDeleted));

      const boxSnap = await getDocs(collection(db, "cash_boxes"));
      setBoxes(boxSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter((x: any) => !x.isDeleted));

      const clientSnap = await getDocs(collection(db, "clients"));
      setClients(clientSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Recalculate financial impact on bank/cash boxes
  const applyJournalImpactToCashBank = async (jvId: string) => {
    const jvRef = doc(db, "journal_entries", jvId);
    const jvSnap = await getDoc(jvRef);
    if (!jvSnap.exists()) return;
    const jv = jvSnap.data() as JournalEntry;

    if (jv.status !== "Approved") return;
    if (jv.cashBankApplied) {
      alert(lang === "ar" ? "تم تطبيق أثر هذا القيد مسبقاً على الصندوق والبنك." : "Impact already applied to Cash/Bank.");
      return;
    }

    // Go line by line
    for (const line of jv.lines) {
      if (line.accountType === "Bank" && line.bankAccountId) {
        const bankRef = doc(db, "bank_accounts", line.bankAccountId);
        const bSnap = await getDoc(bankRef);
        if (bSnap.exists()) {
          const prevBal = Number(bSnap.data().current_balance ?? bSnap.data().currentBalance ?? 0);
          const diff = Number(line.debit) - Number(line.credit);
          const newBal = prevBal + diff;

          await updateDoc(bankRef, {
            current_balance: newBal,
            currentBalance: newBal
          });

          // Write cash_bank_transaction log
          const txId = `TX_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          await setDoc(doc(db, "cash_bank_transactions", txId), {
            id: txId,
            transactionNo: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
            journalEntryId: jvId,
            journalEntryNo: jv.journalEntryNo,
            accountType: "Bank",
            bankAccountId: line.bankAccountId,
            bankName: bSnap.data().bankName,
            direction: diff > 0 ? "In" : "Out",
            amount: Math.abs(diff),
            previousBalance: prevBal,
            newBalance: newBal,
            description: line.description || jv.description,
            sourceModule: jv.sourceModule,
            sourceId: jv.id,
            createdAt: new Date().toISOString(),
            createdBy: user?.username || "System",
          });
        }
      } else if (line.accountType === "Cash" && line.cashBoxId) {
        const boxRef = doc(db, "cash_boxes", line.cashBoxId);
        const bSnap = await getDoc(boxRef);
        if (bSnap.exists()) {
          const prevBal = Number(bSnap.data().current_balance ?? bSnap.data().currentBalance ?? 0);
          const diff = Number(line.debit) - Number(line.credit);
          const newBal = prevBal + diff;

          await updateDoc(boxRef, {
            current_balance: newBal,
            currentBalance: newBal
          });

          // Write cash_bank_transaction log
          const txId = `TX_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          await setDoc(doc(db, "cash_bank_transactions", txId), {
            id: txId,
            transactionNo: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
            journalEntryId: jvId,
            journalEntryNo: jv.journalEntryNo,
            accountType: "Cash",
            cashBoxId: line.cashBoxId,
            cashBoxName: bSnap.data().cashBoxName,
            direction: diff > 0 ? "In" : "Out",
            amount: Math.abs(diff),
            previousBalance: prevBal,
            newBalance: newBal,
            description: line.description || jv.description,
            sourceModule: jv.sourceModule,
            sourceId: jv.id,
            createdAt: new Date().toISOString(),
            createdBy: user?.username || "System",
          });
        }
      }
    }

    // Mark Applied
    await updateDoc(jvRef, {
      cashBankApplied: true,
      cashBankAppliedAt: new Date().toISOString()
    });
  };

  // Synchronize Approved Journal Entry to Expenses & Revenues automatic section (Smart Accountant Logic)
  const syncJournalEntryToExpensesAndRevenues = async (jvId: string, lang: "ar" | "en") => {
    try {
      const jvRef = doc(db, "journal_entries", jvId);
      const jvSnap = await getDoc(jvRef);
      if (!jvSnap.exists()) return;
      const jv = jvSnap.data() as JournalEntry;

      // Only sync if Approved
      if (jv.status !== "Approved") return;

      // 1. Analyze for Expense Lines
      // Check if there is a line with accountType === "Expense" or accountCode starts with "3" or "5", or accountName contains common Arabic/English expense terms, with debit > 0
      const expenseLines = jv.lines.filter(l => 
        l.debit > 0 && 
        (l.accountType === "Expense" || 
         String(l.accountCode).startsWith("5") || 
         String(l.accountCode).startsWith("3") ||
         /مصروف|مصاريف|مشتريات|رواتب|أجور|رواتب|إيجار|كهرباء|ماء|هاتف|صيانة|دعاية|إعلان|رسوم|شراء|إيجارات|سفر|عمولة|تأمين/i.test(l.accountName || "") ||
         /expense|purchase|salary|wage|rent|electricity|water|phone|maintenance|advertising|marketing|fees|commission|travel|insurance/i.test(l.accountName || ""))
      );

      // 2. Analyze for Revenue Lines
      // Check if there is a line with accountType === "Revenue" or accountCode starts with "4", or accountName contains Arabic/English revenue terms, with credit > 0
      const revenueLines = jv.lines.filter(l => 
        l.credit > 0 && 
        (l.accountType === "Revenue" || 
         String(l.accountCode).startsWith("4") ||
         /إيراد|إيرادات|مبيعات|أرباح|عمولة_مكتسبة/i.test(l.accountName || "") ||
         /revenue|sales|profit|commission_earned/i.test(l.accountName || ""))
      );

      if (expenseLines.length > 0) {
        // Find if there is a credit line on Bank or Cash to determine payment details
        const creditPaymentLine = jv.lines.find(l => l.credit > 0 && (l.accountType === "Bank" || l.accountType === "Cash"));
        const isPaid = !!creditPaymentLine;

        const totalAmount = expenseLines.reduce((sum, l) => sum + Number(l.debit), 0);
        // Look for any VAT Input line to break down subtotal and VAT
        const vatLine = jv.lines.find(l => l.debit > 0 && (l.accountType === "VAT Output" || l.accountCode === "2204" || /ضريبة|قيمة_مضافة|vat/i.test(l.accountName || "")));
        const vatAmount = vatLine ? Number(vatLine.debit) : 0;
        const subtotal = Math.max(0, totalAmount - vatAmount);

        const expenseId = `EXP_JV_${jv.id}`;
        const expenseNo = `EXP-JV-${jv.journalEntryNo.replace("JV-", "")}`;

        // Prepare transaction nature description
        const transactionNature = expenseLines.map(l => l.accountName).join(" + ") || (lang === "ar" ? "قيد مصروفات مانيوال" : "Manual Expenses JV");

        const expensePayload: any = {
          id: expenseId,
          expenseNo,
          supplierInvoiceId: "",
          invoiceNo: jv.journalEntryNo,
          supplierId: "JV_AUTO_EXP",
          supplierName: transactionNature, // State the nature of transaction / account instead of raw supplier!
          poId: "",
          projectName: "",
          expenseDate: jv.date,
          subtotal,
          vatAmount,
          totalAmount,
          paymentStatus: isPaid ? "Paid" : "Pending Payment",
          notes: jv.description || (lang === "ar" ? `قيد مصروفات معتمد تلقائي برقم القيد ${jv.journalEntryNo}` : `Approved expense auto-logged from JV ${jv.journalEntryNo}`),
          createdAt: new Date().toISOString(), // Sort at absolute top
          createdBy: jv.createdBy || "system",
          sourceJVId: jv.id,
        };

        if (isPaid && creditPaymentLine) {
          expensePayload.paidFromType = creditPaymentLine.accountType === "Bank" ? "Bank" : "Cash";
          expensePayload.paidFromId = creditPaymentLine.bankAccountId || creditPaymentLine.cashBoxId || "";
          expensePayload.paidFromName = creditPaymentLine.accountName;
          expensePayload.paidAt = jv.date;
        }

        await setDoc(doc(db, "expenses", expenseId), expensePayload, { merge: true });
        console.log(`Successfully synced Journal Entry ${jv.journalEntryNo} to Expenses: ${expenseNo}`);
      }

      if (revenueLines.length > 0) {
        // Find if there is a debit line on Bank or Cash
        const debitPaymentLine = jv.lines.find(l => l.debit > 0 && (l.accountType === "Bank" || l.accountType === "Cash"));
        const isPaid = !!debitPaymentLine;

        const totalAmount = revenueLines.reduce((sum, l) => sum + Number(l.credit), 0);
        const vatLine = jv.lines.find(l => l.credit > 0 && (l.accountType === "VAT Output" || l.accountCode === "2204" || /ضريبة|قيمة_مضافة|vat/i.test(l.accountName || "")));
        const vatAmount = vatLine ? Number(vatLine.credit) : 0;
        const taxableAmount = Math.max(0, totalAmount - vatAmount);

        const revenueId = `REV_JV_${jv.id}`;
        const revenueNo = `REV-JV-${jv.journalEntryNo.replace("JV-", "")}`;

        const transactionNature = revenueLines.map(l => l.accountName).join(" + ") || (lang === "ar" ? "قيد إيراد مبيعات مانيوال" : "Manual Revenues JV");

        const revenuePayload: any = {
          id: revenueId,
          revenueId: revenueNo,
          invoiceId: "",
          invoiceNo: jv.journalEntryNo,
          customerId: "JV_AUTO_REV",
          customerName: transactionNature, // State the nature of transaction
          revenueDate: jv.date,
          taxableAmount,
          vatAmount,
          totalAmount,
          paidAmount: isPaid ? totalAmount : 0,
          remainingAmount: isPaid ? 0 : totalAmount,
          revenueStatus: isPaid ? "Paid" : "Unpaid",
          notes: jv.description || (lang === "ar" ? `قيد إيراد معتمد تلقائي برقم القيد ${jv.journalEntryNo}` : `Approved revenue auto-logged from JV ${jv.journalEntryNo}`),
          createdAt: new Date().toISOString(), // Sort at absolute top
          createdBy: jv.createdBy || "system",
          sourceJVId: jv.id
        };

        await setDoc(doc(db, "revenues", revenueId), revenuePayload, { merge: true });
        console.log(`Successfully synced Journal Entry ${jv.journalEntryNo} to Revenues: ${revenueNo}`);
      }
    } catch (e) {
      console.error("Error syncing JV to expenses/revenues:", e);
    }
  };

  // Reverse financial impact
  const reverseJournalImpactFromCashBank = async (jvId: string) => {
    const jvRef = doc(db, "journal_entries", jvId);
    const jvSnap = await getDoc(jvRef);
    if (!jvSnap.exists()) return;
    const jv = jvSnap.data() as JournalEntry;

    if (!jv.cashBankApplied) return;

    for (const line of jv.lines) {
      if (line.accountType === "Bank" && line.bankAccountId) {
        const bankRef = doc(db, "bank_accounts", line.bankAccountId);
        const bSnap = await getDoc(bankRef);
        if (bSnap.exists()) {
          const prevBal = Number(bSnap.data().current_balance ?? bSnap.data().currentBalance ?? 0);
          // reversing: Debit becomes credit, credit becomes debit
          const diff = Number(line.credit) - Number(line.debit);
          const newBal = prevBal + diff;

          await updateDoc(bankRef, {
            current_balance: newBal,
            currentBalance: newBal
          });

          const txId = `TX_REV_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          await setDoc(doc(db, "cash_bank_transactions", txId), {
            id: txId,
            transactionNo: `TXN-REV-${Math.floor(100000 + Math.random() * 900000)}`,
            journalEntryId: jvId,
            journalEntryNo: jv.journalEntryNo,
            accountType: "Bank",
            bankAccountId: line.bankAccountId,
            bankName: bSnap.data().bankName,
            direction: diff > 0 ? "In" : "Out",
            amount: Math.abs(diff),
            previousBalance: prevBal,
            newBalance: newBal,
            description: `إلغاء وعكس أثر مالي: ${line.description || jv.description}`,
            sourceModule: "Reversal Log",
            sourceId: jv.id,
            createdAt: new Date().toISOString(),
            createdBy: user?.username || "System",
            isReversal: true
          });
        }
      } else if (line.accountType === "Cash" && line.cashBoxId) {
        const boxRef = doc(db, "cash_boxes", line.cashBoxId);
        const bSnap = await getDoc(boxRef);
        if (bSnap.exists()) {
          const prevBal = Number(bSnap.data().current_balance ?? bSnap.data().currentBalance ?? 0);
          const diff = Number(line.credit) - Number(line.debit);
          const newBal = prevBal + diff;

          await updateDoc(boxRef, {
            current_balance: newBal,
            currentBalance: newBal
          });

          const txId = `TX_REV_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          await setDoc(doc(db, "cash_bank_transactions", txId), {
            id: txId,
            transactionNo: `TXN-REV-${Math.floor(100000 + Math.random() * 900000)}`,
            journalEntryId: jvId,
            journalEntryNo: jv.journalEntryNo,
            accountType: "Cash",
            cashBoxId: line.cashBoxId,
            cashBoxName: bSnap.data().cashBoxName,
            direction: diff > 0 ? "In" : "Out",
            amount: Math.abs(diff),
            previousBalance: prevBal,
            newBalance: newBal,
            description: `إلغاء وعكس أثر مالي: ${line.description || jv.description}`,
            sourceModule: "Reversal Log",
            sourceId: jv.id,
            createdAt: new Date().toISOString(),
            createdBy: user?.username || "System",
            isReversal: true
          });
        }
      }
    }

    await updateDoc(jvRef, {
      cashBankApplied: false
    });
  };

  // Approval handler
  const handleApproveEntry = (jv: JournalEntry) => {
    // Check if it is from Daily Purchase Requests
    const isDailyPurchase = jv.sourceModule === "مشتريات يومية" || (jv.journalEntryNo && jv.journalEntryNo.startsWith("JV-BRQ"));

    if (isDailyPurchase) {
      setApprovalEntry(jv);
      const defaultType = banks.length > 0 ? "Bank" : "Cash";
      const defaultId = defaultType === "Bank" ? (banks[0]?.id || "") : (boxes[0]?.id || "");
      setSelectedPaymentSource({ type: defaultType, id: defaultId });
      setShowApprovalAccountModal(true);
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: lang === "ar" ? "اعتماد قيد محاسبي" : "Approve Journal Entry",
      message: lang === "ar" 
        ? `هل تريد بالتأكيد اعتماد القيد ${jv.journalEntryNo}؟ سيتم تطبيق الأثر المالي على أرصدة البنوك والصناديق.` 
        : `Are you sure you want to approve entry ${jv.journalEntryNo}? This will apply the financial impact.`,
      type: "info",
      onConfirm: async () => {
        const nowStr = new Date().toISOString();
        const userStr = user?.username || "System";

        await updateDoc(doc(db, "journal_entries", jv.id), {
          status: "Approved",
          approvedAt: nowStr,
          approvedBy: user?.id || "system",
          approvedByName: userStr
        });

        // Apply the financial balances
        await applyJournalImpactToCashBank(jv.id);

        // Sync with expenses/revenues automatically
        await syncJournalEntryToExpensesAndRevenues(jv.id, lang);

        // Save Audit Log
        const logId = `LOG_JV_APP_${Date.now()}`;
        await setDoc(doc(db, "audit_logs", logId), {
          userId: user?.id || "unknown",
          userName: user?.username || "System",
          userRole: user?.role || "Admin",
          action: "اعتماد قيد يومية محاسبي وتطبيق الأثر",
          module: "Journal Entries",
          recordId: jv.id,
          createdAt: nowStr
        });

        showToast(lang === "ar" ? "تم اعتماد القيد وتحديث أرصدة البنوك/الصناديق المحددة بنجاح" : "Entry approved and financial balances updated", "success");
        loadData();
      }
    });
  };

  // Reversal Entry (قيد عكسي) creation
  const handleCreateReversal = (jv: JournalEntry) => {
    setConfirmDialog({
      isOpen: true,
      title: lang === "ar" ? "إنشاء قيد عكسي" : "Create Reversal Entry",
      message: lang === "ar"
        ? `هل تريد بالتأكيد إنشاء قيد يومية عكسي بالكامل للقيد ${jv.journalEntryNo}؟`
        : `Create reversal entry for ${jv.journalEntryNo}?`,
      type: "warning",
      onConfirm: async () => {
        const jvId = `JV_REVERSAL_${jv.journalEntryNo}_${Date.now()}`;
        const journalEntryNo = `JV-REV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const nowStr = new Date().toISOString();
        const userStr = user?.username || "System";

        // Reverse lines: debit becomes credit, credit becomes debit
        const reversedLines = jv.lines.map((l, index) => ({
          ...l,
          id: `JV_L_REV_${index}_${Date.now()}`,
          debit: l.credit,
          credit: l.debit,
          description: `عكس لقيد ${jv.journalEntryNo}: ${l.description}`
        }));

        const reversalPayload: JournalEntry = {
          id: jvId,
          journalEntryNo,
          date: new Date().toISOString().split("T")[0],
          sourceModule: "Adjustment",
          sourceId: jv.id,
          description: `قيد عكسي تلقائي لتسوية القيد المعتمد رقم ${jv.journalEntryNo}`,
          status: "Draft", // starts as draft so they can review and approve
          totalDebit: jv.totalDebit,
          totalCredit: jv.totalCredit,
          isBalanced: true,
          cashBankApplied: false,
          createdAt: nowStr,
          createdBy: user?.id || "unknown",
          createdByName: userStr,
          lines: reversedLines
        };

        await setDoc(doc(db, "journal_entries", jvId), reversalPayload);

        // Audit Log
        const logId = `LOG_JV_REV_CRE_${Date.now()}`;
        await setDoc(doc(db, "audit_logs", logId), {
          userId: user?.id || "unknown",
          userName: user?.username || "System",
          userRole: user?.role || "Admin",
          action: "توليد قيد يومية عكسي جديد",
          module: "Journal Entries",
          recordId: jvId,
          createdAt: nowStr
        });

        showToast(lang === "ar" ? `تم إنشاء القيد العكسي كمسودة بنجاح برقم ${journalEntryNo}` : "Reversal draft created", "success");
        loadData();
      }
    });
  };

  // Delete/Cancel Approved Entry
  const handleCancelApprovedEntry = (jv: JournalEntry) => {
    setConfirmDialog({
      isOpen: true,
      title: lang === "ar" ? "إلغاء وتجميد القيد وعكس الأثر" : "Cancel Approved Entry",
      message: lang === "ar"
        ? `هذا قيد معتمد ومرحل. سيتم عكس أثره المالي تماماً من الخزائن والبنوك ثم إلغاؤه وتجميده. هل أنت متأكد؟`
        : "This is an approved journal. Cancel and reverse cash/bank?",
      type: "danger",
      onConfirm: async () => {
        const nowStr = new Date().toISOString();
        const userStr = user?.username || "System";

        // Reverse cash bank balances first
        await reverseJournalImpactFromCashBank(jv.id);

        // Mark cancelled & soft deleted
        await updateDoc(doc(db, "journal_entries", jv.id), {
          status: "Cancelled",
          isDeleted: true,
          deletedAt: nowStr,
          deletedBy: userStr,
          deleteReason: "إلغاء قيد يومية معتمد وعكس الأثر من الإدارة"
        });

        const logId = `LOG_JV_CANCEL_FULL_${Date.now()}`;
        await setDoc(doc(db, "audit_logs", logId), {
          userId: user?.id || "unknown",
          userName: user?.username || "System",
          userRole: user?.role || "Admin",
          action: "إلغاء قيد معتمد وعكس أثره المالي",
          module: "Journal Entries",
          recordId: jv.id,
          createdAt: nowStr
        });

        showToast(lang === "ar" ? "تم إلغاء القيد وعكس كافة الحركات المالية المرتبطة به بنجاح" : "Entry cancelled and balances reversed", "success");
        loadData();
      }
    });
  };

  // Delete Draft
  const handleDeleteDraft = (jv: JournalEntry) => {
    setConfirmDialog({
      isOpen: true,
      title: lang === "ar" ? "حذف مسودة القيد" : "Delete Draft Entry",
      message: lang === "ar" ? `هل تريد حذف القيد المسودة ${jv.journalEntryNo}؟` : `Delete draft ${jv.journalEntryNo}?`,
      type: "danger",
      onConfirm: async () => {
        await updateDoc(doc(db, "journal_entries", jv.id), {
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: user?.username || "System"
        });
        showToast(lang === "ar" ? "تم حذف مسودة القيد بنجاح" : "Draft entry deleted successfully", "success");
        loadData();
      }
    });
  };

  // Adding line in manual journal form
  const addFormLine = () => {
    const newLine: JournalLine = {
      id: `L_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      lineNo: journalForm.lines.length + 1,
      accountType: "Other",
      accountCode: "",
      accountName: "",
      debit: 0,
      credit: 0,
      description: ""
    };
    setJournalForm(prev => ({ ...prev, lines: [...prev.lines, newLine] }));
  };

  // Update line details in manual form
  const updateFormLine = (index: number, field: keyof JournalLine, val: any) => {
    const updated = [...journalForm.lines];
    updated[index] = { ...updated[index], [field]: val };
    
    // Automatically pre-set some helper account codes & names
    if (field === "accountType") {
      if (val === "Bank") {
        updated[index].accountCode = "1102";
        updated[index].accountName = "حساب بنكي تجاري";
      } else if (val === "Cash") {
        updated[index].accountCode = "1101";
        updated[index].accountName = "صندوق النقدية كاش";
      } else if (val === "Accounts Receivable") {
        updated[index].accountCode = "1201";
        updated[index].accountName = "ذمم عملاء مبيعات";
      } else if (val === "Revenue") {
        updated[index].accountCode = "4101";
        updated[index].accountName = "إيرادات مبيعات مخرجات";
      } else if (val === "VAT Output") {
        updated[index].accountCode = "2204";
        updated[index].accountName = "ضريبة مخرجات قيمة مضافة";
      }
    }

    setJournalForm(prev => ({ ...prev, lines: updated }));
  };

  // Compute sum debits and credits of form
  const getFormBalances = () => {
    const d = journalForm.lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
    const c = journalForm.lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
    return { debitTotal: d, creditTotal: c, isBalanced: Math.abs(d - c) < 0.01 };
  };

  const { debitTotal, creditTotal, isBalanced } = getFormBalances();

  // Save Manual Journal Entry
  const handleSaveJournalForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (journalForm.lines.length < 2) {
      alert(lang === "ar" ? "يجب إضافة سطرين قيود على الأقل" : "Must add at least two rows");
      return;
    }
    if (!isBalanced) {
      alert(lang === "ar" ? "القيد غير متوازن. يجب أن يساوي إجمالي المدين إجمالي الدائن." : "Journal is not balanced");
      return;
    }

    // Verify sub-ids
    for (const l of journalForm.lines) {
      if (l.debit < 0 || l.credit < 0) {
        alert(lang === "ar" ? "لا يسمح بإدخال مبالغ سالبة" : "Negatives are not allowed");
        return;
      }
      if (l.debit > 0 && l.credit > 0) {
        alert(lang === "ar" ? "لا يسمح بسطر فيه مدين ودائن معاً" : "Line cannot have both debit and credit");
        return;
      }
      if (l.accountType === "Bank" && !l.bankAccountId) {
        alert(lang === "ar" ? "يرجى تحديد الحساب البنكي المرتبط بالسطر" : "Please specify a bank account for the line");
        return;
      }
      if (l.accountType === "Cash" && !l.cashBoxId) {
        alert(lang === "ar" ? "يرجى تحديد صندوق النقدية المرتبط بالسطر" : "Please specify a cash box for the line");
        return;
      }
    }

    try {
      const jvId = selectedEntry ? selectedEntry.id : `JV_MAN_${Date.now()}`;
      const journalEntryNo = journalForm.journalEntryNo || `JV-MAN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const nowStr = new Date().toISOString();
      const userStr = user?.username || "System";

      const payload: JournalEntry = {
        id: jvId,
        journalEntryNo,
        date: journalForm.date,
        sourceModule: "Manual",
        description: journalForm.description,
        status: journalForm.status,
        totalDebit: debitTotal,
        totalCredit: creditTotal,
        isBalanced: true,
        cashBankApplied: false,
        createdAt: selectedEntry ? selectedEntry.createdAt : nowStr,
        createdBy: selectedEntry ? selectedEntry.createdBy : (user?.id || "unknown"),
        createdByName: selectedEntry ? selectedEntry.createdByName : userStr,
        lines: journalForm.lines
      };

      await setDoc(doc(db, "journal_entries", jvId), payload);

      // Save Audit Log
      const logId = `LOG_JV_MAN_${Date.now()}`;
      await setDoc(doc(db, "audit_logs", logId), {
        userId: user?.id || "unknown",
        userName: user?.username || "System",
        userRole: user?.role || "Admin",
        action: selectedEntry ? "تعديل قيد يومية مسودة" : "إنشاء قيد يومية مانيوال جديد",
        module: "Journal Entries",
        recordId: jvId,
        createdAt: nowStr
      });

      // If approved directly, apply impact and sync with expenses/revenues
      if (journalForm.status === "Approved") {
        await applyJournalImpactToCashBank(jvId);
        await syncJournalEntryToExpensesAndRevenues(jvId, lang);
      }

      alert(lang === "ar" ? "تم حفظ وتسجيل قيد اليومية بنجاح" : "Journal entry saved successfully");
      setShowJournalModal(false);
      setSelectedEntry(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const openJournalForm = (jv: JournalEntry | null) => {
    if (jv) {
      setSelectedEntry(jv);
      setJournalForm({
        journalEntryNo: jv.journalEntryNo,
        date: jv.date,
        description: jv.description,
        status: jv.status as any,
        lines: jv.lines
      });
    } else {
      setSelectedEntry(null);
      setJournalForm({
        journalEntryNo: `JV-MAN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().split("T")[0],
        description: "",
        status: "Draft",
        lines: [
          {
            id: `L_1_${Date.now()}`,
            lineNo: 1,
            accountType: "Other",
            accountCode: "",
            accountName: "",
            debit: 0,
            credit: 0,
            description: ""
          },
          {
            id: `L_2_${Date.now()}`,
            lineNo: 2,
            accountType: "Other",
            accountCode: "",
            accountName: "",
            debit: 0,
            credit: 0,
            description: ""
          }
        ]
      });
    }
    setShowJournalModal(true);
  };

  // END-TO-END AUTOMATED FLOW TEST (الاختبار المالي التلقائي المتكامل)
  const runEndToEndFinancialTest = async () => {
    setTesting(true);
    setTestLog([]);
    const logs: string[] = [];
    const log = (msg: string) => {
      logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
      setTestLog([...logs]);
    };

    try {
      log("🚀 بدء اختبار التدفق المالي المتكامل من الصفر...");
      
      // 1. Ensure test bank exists
      log("1. فحص الحسابات البنكية التجريبية...");
      const bankSnap = await getDocs(collection(db, "bank_accounts"));
      let testBank: any = bankSnap.docs.map(d => ({id: d.id, ...d.data()})).find((b: any) => b.bankName === "بنك الرياض التجريبي" && !b.isDeleted);
      if (!testBank) {
        log("• لم يتم العثور على البنك التجريبي. جاري إنشائه...");
        const bankId = `BANK_TEST_${Date.now()}`;
        const newBank = {
          id: bankId,
          bankName: "بنك الرياض التجريبي",
          accountName: "الحساب التجاري الاستعراضي",
          accountNumber: "102030405060",
          iban: "SA99000000102030405060",
          swiftCode: "RIYBSA22",
          openingBalance: 10000,
          opening_balance: 10000,
          currentBalance: 10000,
          current_balance: 10000,
          status: "Active",
          isDeleted: false,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, "bank_accounts", bankId), newBank);
        testBank = newBank;
        log(`• تم إنشاء بنك الرياض التجريبي برصيد افتتاحي 10,000 SAR.`);
      } else {
        testBank.currentBalance = Number(testBank.currentBalance ?? testBank.current_balance ?? 0);
        testBank.current_balance = testBank.currentBalance;
        log(`• تم العثور على البنك التجريبي برصيد حالي: ${testBank.currentBalance} SAR.`);
      }

      // 2. Ensure test cash box exists
      log("2. فحص صناديق النقدية التجريبية...");
      const boxSnap = await getDocs(collection(db, "cash_boxes"));
      let testBox: any = boxSnap.docs.map(d => ({id: d.id, ...d.data()})).find((b: any) => b.cashBoxName === "خزينة مبيعات تجريبية" && !b.isDeleted);
      if (!testBox) {
        log("• لم يتم العثور على الخزينة التجريبية. جاري إنشائها...");
        const boxId = `BOX_TEST_${Date.now()}`;
        const newBox = {
          id: boxId,
          cashBoxName: "خزينة مبيعات تجريبية",
          responsiblePerson: "فراس المشرف",
          openingBalance: 2000,
          opening_balance: 2000,
          currentBalance: 2000,
          current_balance: 2000,
          status: "Active",
          isDeleted: false,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, "cash_boxes", boxId), newBox);
        testBox = newBox;
        log(`• تم إنشاء الخزينة التجريبية برصيد افتتاحي 2,000 SAR.`);
      } else {
        testBox.currentBalance = Number(testBox.currentBalance ?? testBox.current_balance ?? 0);
        testBox.current_balance = testBox.currentBalance;
        log(`• تم العثور على الخزينة برصيد حالي: ${testBox.currentBalance} SAR.`);
      }

      // 3. Ensure test client registry exists
      log("3. فحص سجل العملاء التجريبيين...");
      const clientSnap = await getDocs(collection(db, "clients"));
      let testClient: any = clientSnap.docs.map(d => ({id: d.id, ...d.data()})).find((c: any) => c.name === "مؤسسة فهد التجارية التجريبية");
      if (!testClient) {
        log("• جاري إنشاء عميل تجريبي...");
        const clientId = `CLIENT_TEST_${Date.now()}`;
        testClient = {
          id: clientId,
          name: "مؤسسة فهد التجارية التجريبية",
          vatNumber: "300999988800003",
          crNumber: "1010888222",
          address: "طريق الملك فهد، الرياض",
          phone: "0501234567"
        };
        await setDoc(doc(db, "clients", clientId), testClient);
        log("• تم تسجيل العميل التجريبي بنجاح.");
      } else {
        log("• تم العثور على العميل التجريبي في النظام.");
      }

      // 4. Create Test Invoice representing sales loop
      log("4. جاري توليد فاتورة مبيعات ضريبية تجريبية قيمة 1,150 SAR (شاملة الضريبة)...");
      const invoiceId = `INV_TEST_${Date.now()}`;
      const invoiceNo = `INV-TEST-${Math.floor(1000 + Math.random() * 9000)}`;
      const testInvoice = {
        id: invoiceId,
        invoiceNo,
        invoiceDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 15*24*3600*1000).toISOString().split("T")[0],
        paymentTerms: "15 Days",
        projectName: "لوحة ذكية مضيئة تجريبية",
        salesperson: user?.username || "Feras Admin",
        invoiceType: "Tax Invoice",
        currency: "SAR",
        status: "Issued",
        customerId: testClient.id,
        customerName: testClient.name,
        customerAddress: testClient.address,
        customerVatNumber: testClient.vatNumber,
        customerCrNumber: testClient.crNumber,
        companyNameArabic: "شركة فنون الوليد للدعاية والإعلان",
        companyNameEnglish: "Al Waleed Arts Advertising Co.",
        companyVatNumber: "310123456700003",
        companyCrNumber: "1010123456",
        companyAddress: "الرياض، الياسمين",
        quotationId: "QUO_TEST_992",
        quotationNo: "QUO-992",
        items: [
          {
            id: "1",
            description: "لوحة أحرف بارزة مضيئة ليد",
            quantity: 1,
            unitPrice: 1000,
            discount: 0,
            taxableAmount: 1000,
            vatRate: 15,
            vatAmount: 150,
            lineTotal: 1150
          }
        ],
        subtotalBeforeDiscount: 1000,
        totalDiscount: 0,
        taxableAmount: 1000,
        vatTotal: 150,
        grandTotal: 1150,
        amountPaid: 0,
        remainingAmount: 1150,
        zatcaStatus: "Pending",
        createdAt: new Date().toISOString(),
        createdBy: "Auto-Tester"
      };

      await setDoc(doc(db, "customer_invoices", invoiceId), testInvoice);
      log(`• تم إصدار الفاتورة ${invoiceNo} بنجاح.`);

      // 5. Create draft receivable journal entry
      log("5. توليد قيد استحقاق الفاتورة التلقائي...");
      const jvId = `JV_TEST_INV_${invoiceNo}_${Date.now()}`;
      const jvNo = `JV-TEST-INV-${Math.floor(1000 + Math.random() * 9000)}`;
      const jvEntry = {
        id: jvId,
        journalEntryNo: jvNo,
        date: new Date().toISOString().split("T")[0],
        sourceModule: "Customer Invoice",
        sourceId: invoiceId,
        description: `قيد استحقاق تلقائي تجريبي للفاتورة ${invoiceNo}`,
        status: "Approved", // Approved immediately
        totalDebit: 1150,
        totalCredit: 1150,
        isBalanced: true,
        cashBankApplied: false,
        createdAt: new Date().toISOString(),
        createdBy: "Auto-Tester",
        createdByName: "ERP System Auto Test",
        lines: [
          {
            id: "L1",
            lineNo: 1,
            accountType: "Accounts Receivable",
            accountCode: "1201",
            accountName: `ذمم عملاء مبيعات - ${testClient.name}`,
            debit: 1150,
            credit: 0,
            customerId: testClient.id,
            invoiceId: invoiceId,
            description: "إثبات استحقاق مبيعات"
          },
          {
            id: "L2",
            lineNo: 2,
            accountType: "Revenue",
            accountCode: "4101",
            accountName: "إيرادات المبيعات واللوحات",
            debit: 0,
            credit: 1000,
            description: "تسجيل الإيراد الأساسي"
          },
          {
            id: "L3",
            lineNo: 3,
            accountType: "VAT Output",
            accountCode: "2204",
            accountName: "ضريبة مخرجات قيمة مضافة 15%",
            debit: 0,
            credit: 150,
            description: "ضريبة المخرجات المستحقة"
          }
        ]
      };
      await setDoc(doc(db, "journal_entries", jvId), jvEntry);
      log(`• تم إنشاء قيد استحقاق الفاتورة ${jvNo}.`);

      // 6. Approve the journal and verify no bank change
      log("6. اعتماد قيد الاستحقاق وفحص أرصدة البنك...");
      // For invoice receivable, bank impact is false, so bank should NOT change
      await applyJournalImpactToCashBank(jvId);
      
      const bCheckSnap = await getDoc(doc(db, "bank_accounts", testBank.id));
      const bCheckBal = bCheckSnap.data()?.current_balance;
      log(`• رصيد البنك بعد قيد الفاتورة: ${bCheckBal} SAR (لم يتغير - صحيح المحاسبية 100%).`);
      if ((bCheckBal ?? bCheckSnap.data()?.currentBalance) !== testBank.currentBalance) {
        throw new Error("فشل الفحص: رصيد البنك زاد عند قيد الاستحقاق وهذا خطأ فادح!");
      }

      // 7. Register a payment receivable of 1150
      log("7. تسجيل سند قبض تحصيل بقيمة 1,150 SAR على البنك...");
      const receiptId = `RCPT_TEST_${Date.now()}`;
      const receiptNo = `REC-TEST-${Math.floor(1000 + Math.random() * 9000)}`;
      const newReceipt = {
        id: receiptId,
        receiptNo,
        invoiceId,
        invoiceNo,
        customerId: testClient.id,
        customerName: testClient.name,
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMethod: "Bank Transfer",
        amount: 1150,
        bankAccountId: testBank.id,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "receipts", receiptId), newReceipt);

      // 8. Generate Payment Journal Entry and Approve
      log("8. جاري توليد قيد القبض والسداد المالي للبند...");
      const jvPmtId = `JV_TEST_PMT_${receiptNo}_${Date.now()}`;
      const jvPmtNo = `JV-TEST-PMT-${Math.floor(1000 + Math.random() * 9000)}`;
      const jvPmtEntry = {
        id: jvPmtId,
        journalEntryNo: jvPmtNo,
        date: new Date().toISOString().split("T")[0],
        sourceModule: "Revenue Receipt",
        sourceId: receiptId,
        description: `قيد سداد تحصيل الفاتورة ${invoiceNo} سند ${receiptNo}`,
        status: "Approved",
        totalDebit: 1150,
        totalCredit: 1150,
        isBalanced: true,
        cashBankApplied: false,
        createdAt: new Date().toISOString(),
        createdBy: "Auto-Tester",
        createdByName: "ERP System Auto Test",
        lines: [
          {
            id: "LP1",
            lineNo: 1,
            accountType: "Bank",
            accountCode: "1102",
            accountName: `حساب بنكي تجاري - ${testBank.bankName}`,
            debit: 1150,
            credit: 0,
            bankAccountId: testBank.id,
            description: "دخول متحصلات العميل البنك"
          },
          {
            id: "LP2",
            lineNo: 2,
            accountType: "Accounts Receivable",
            accountCode: "1201",
            accountName: `ذمم عملاء مبيعات - ${testClient.name}`,
            debit: 0,
            credit: 1150,
            customerId: testClient.id,
            invoiceId: invoiceId,
            description: "تخفيض ذمة العميل لتسديدها"
          }
        ]
      };
      await setDoc(doc(db, "journal_entries", jvPmtId), jvPmtEntry);
      
      // 9. Apply the bank payment impact
      log("9. ترحيل وتطبيق الأثر المالي لقيد القبض على البنك...");
      await applyJournalImpactToCashBank(jvPmtId);

      // 10. Check bank balance has increased by 1150
      log("10. التحقق من زيادة رصيد البنك بمبلغ التحصيل...");
      const bFinalSnap = await getDoc(doc(db, "bank_accounts", testBank.id));
      const bFinalBal = bFinalSnap.data()?.current_balance;
      log(`• رصيد البنك الجديد بعد المقبوضات: ${bFinalBal} SAR.`);
      if ((bFinalBal ?? bFinalSnap.data()?.currentBalance) !== testBank.currentBalance + 1150) {
        throw new Error(`فشل التحقق: رصيد البنك متطابق غير متطابق. المتوقع ${testBank.currentBalance + 1150} والمسجل هو ${bFinalBal}`);
      }
      log("• تم التأكد من ترحيل وزيادة البنك بنجاح تام (+1150 SAR).");

      // 11. Update invoice status & revenue status to Paid
      log("11. تحديث حالات الفاتورة ومستند الإيراد إلى مدفوعة بالكامل (Paid)...");
      await updateDoc(doc(db, "customer_invoices", invoiceId), {
        amountPaid: 1150,
        remainingAmount: 0,
        status: "Paid"
      });

      // Also ensure test revenue record exists and is Paid
      const revId = `REV_TEST_${Date.now()}`;
      await setDoc(doc(db, "revenues", revId), {
        revenueId: revId,
        invoiceId,
        invoiceNo,
        customerId: testClient.id,
        customerName: testClient.name,
        revenueDate: new Date().toISOString().split("T")[0],
        taxableAmount: 1000,
        vatAmount: 150,
        totalAmount: 1150,
        paidAmount: 1150,
        remainingAmount: 0,
        revenueStatus: "Paid",
        createdAt: new Date().toISOString(),
        createdBy: "Auto-Tester"
      });

      log("12. التحقق من مطابقة حركة الخزينة بالسجل التفصيلي...");
      const txCheckSnap = await getDocs(collection(db, "cash_bank_transactions"));
      const isLogged = txCheckSnap.docs.some(d => d.data().journalEntryId === jvPmtId);
      if (!isLogged) {
        throw new Error("فشل التحقق: لم يكتب النظام سجل تفصيلي في cash_bank_transactions!");
      }
      log("• تم العثور على سجل الحركة بنجاح مطرداً.");

      log("🎉 نجاح: اكتمل التدفق المالي المتكامل 100% بنجاح ودون أي خطأ محاسبي!");
      loadData();
    } catch (err: any) {
      log(`❌ فشل الاختبار: ${err.message || err}`);
      console.error(err);
    } finally {
      setTesting(false);
    }
  };

  const filteredEntries = entries.filter(e => {
    const matchNo = (e.journalEntryNo || "").toLowerCase().includes((searchNo || "").toLowerCase());
    const matchStat = filterStatus === "all" || e.status === filterStatus;
    const matchMonth = selectedMonth === "all" || !selectedMonth || (e.date && e.date.startsWith(selectedMonth));
    return matchNo && matchStat && matchMonth;
  });

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8 space-y-6" dir="rtl">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#005185] tracking-tight">
            📒 دفتر القيود اليومية وعمليات الأستاذ (Journal Entries)
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            إثبات وتثبيت القيود المالية واليومية العامة للشركة ومراجعة التوازن المحاسبي للأطراف الدائنة والمدينة.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => openJournalForm(null)}
            className="bg-[#0072BC] hover:bg-[#005185] text-white py-2.5 px-5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2"
          >
            <span>➕</span> إضافة قيد يومي مانيوال
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end no-print">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">🔍 بحث برقم القيد</label>
          <input
            type="text"
            value={searchNo}
            onChange={(e) => setSearchNo(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-[#0072BC]"
            placeholder="JV-XXXX"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">🚦 فلتر حالة القيد</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs bg-white font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-[#0072BC]"
          >
            <option value="all">كل الحالات (all)</option>
            <option value="Draft">مسودة (Draft)</option>
            <option value="Approved">معتمد ومرحل (Approved)</option>
            <option value="Cancelled">ملغى ومجمد</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">📅 تاريخ الشهر المالي</label>
          <div className="flex gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-[#0072BC] bg-white"
            />
            {selectedMonth !== "all" && (
              <button
                onClick={() => setSelectedMonth("all")}
                className="px-2.5 py-1 text-[10px] font-black text-slate-500 hover:text-white bg-slate-100 hover:bg-[#0072BC] rounded-lg transition-all"
              >
                الكل
              </button>
            )}
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowJournalPrintMenu(!showJournalPrintMenu)}
            className="w-full bg-[#005185] hover:bg-[#0072BC] text-white py-2 px-4 rounded-xl font-bold text-xs shadow transition-all flex items-center justify-center gap-1.5 h-[36px]"
          >
            🖨️ {lang === "ar" ? "خيارات تقرير الشهر" : "Monthly Report Options"}
          </button>
          {showJournalPrintMenu && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 py-1.5 z-30 font-bold text-slate-700 text-xs text-right animate-fade-in no-print">
              <button
                onClick={() => {
                  setShowJournalPrintMenu(false);
                  handlePrintJournal(false);
                }}
                className="w-full text-right px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 text-slate-800 transition"
              >
                👁️ {lang === "ar" ? "معاينة ملخص القيود" : "Preview Journal Summary"}
              </button>
              <button
                onClick={() => {
                  setShowJournalPrintMenu(false);
                  handlePrintJournal(true);
                }}
                className="w-full text-right px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 text-[#0072BC] border-t border-slate-100 transition"
              >
                🖨️ {lang === "ar" ? "طباعة الملخص المالي" : "Print Journal Summary"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Journal Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-20 text-slate-400 font-medium">
            لا توجد قيود يومية مسجلة مطابقة للفلاتر الحالية.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-right text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase border-b">
                <tr>
                  <th className="px-6 py-4">رقم القيد</th>
                  <th className="px-6 py-4">تاريخ السند</th>
                  <th className="px-6 py-4">المصدر والوحدة</th>
                  <th className="px-6 py-4">بيان القيد العام</th>
                  <th className="px-6 py-4 text-left">إجمالي المدين (SAR)</th>
                  <th className="px-6 py-4 text-left">إجمالي الدائن (SAR)</th>
                  <th className="px-6 py-4 text-center">الترحيل للنقدية</th>
                  <th className="px-6 py-4 text-center">الحالة</th>
                  <th className="px-6 py-4 text-center">العمليات والتحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold text-slate-600">
                {filteredEntries.map((jv) => (
                  <tr key={jv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[#0072BC]">
                      {jv.journalEntryNo}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{jv.date}</td>
                    <td className="px-6 py-4 text-[10px]">
                      <span className="bg-slate-100 text-slate-700 py-0.5 px-2 rounded-full font-extrabold">
                        {jv.sourceModule === "Manual" ? "قيد يدوي" : jv.sourceModule}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-[200px] truncate" title={jv.description}>
                      {jv.description}
                    </td>
                    <td className="px-6 py-4 text-left font-mono font-extrabold text-slate-800">
                      {Number(jv.totalDebit || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-left font-mono font-extrabold text-slate-800">
                      {Number(jv.totalCredit || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          jv.cashBankApplied ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {jv.cashBankApplied ? "✔️ مرحل للنقدية" : "✖️ غير مرحل"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold ${
                          jv.status === "Draft"
                            ? "bg-slate-100 text-slate-600"
                            : jv.status === "Approved"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {jv.status === "Draft" ? "مسودة" : jv.status === "Approved" ? "معتمد ومرحل" : "ملغى ومجمد"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedEntry(jv);
                            setShowDetailsModal(true);
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-1 px-2 rounded-lg text-[10px] font-bold"
                          title="عرض البنود"
                        >
                          👁️ بنود القيد
                        </button>
                        {jv.status === "Draft" && (
                          <>
                            <button
                              onClick={() => handleApproveEntry(jv)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white py-1 px-2 rounded-lg text-[10px] font-bold"
                            >
                              🚀 اعتماد
                            </button>
                            <button
                              onClick={() => handleDeleteDraft(jv)}
                              className="text-rose-600 hover:bg-rose-50 py-1 px-1.5 rounded"
                            >
                              ✕
                            </button>
                          </>
                        )}
                        {jv.status === "Approved" && (
                          <>
                            <button
                              onClick={() => handleCreateReversal(jv)}
                              className="bg-purple-50 hover:bg-purple-100 text-purple-700 py-1 px-2 rounded-lg text-[10px] font-bold"
                              title="توليد قيد عكسي مطابق تماماً بالاتجاهات المعاكسة"
                            >
                              🔄 عكس القيد
                            </button>
                            <button
                              onClick={() => handleCancelApprovedEntry(jv)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 py-1 px-2 rounded-lg text-[10px] font-bold"
                              title="إلغاء وتجميد وعكس الحركات المالية"
                            >
                              🚫 إلغاء وتجميد
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

      {/* CREATE MANUAL JOURNAL ENTRY MODAL */}
      {showJournalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] border">
            <div className="bg-gradient-to-r from-[#005185] to-[#0072BC] p-5 text-white flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold">➕ {selectedEntry ? `تعديل قيد يومية مسودة: ${selectedEntry.journalEntryNo}` : "إنشاء قيد يومية محاسبي جديد"}</h2>
              <button
                onClick={() => setShowJournalModal(false)}
                className="text-white hover:text-red-200 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveJournalForm} className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-700 text-xs font-bold">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-slate-600 mb-1">رقم القيد اليومي *</label>
                  <input
                    type="text"
                    required
                    value={journalForm.journalEntryNo}
                    onChange={(e) => setJournalForm({ ...journalForm, journalEntryNo: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">تاريخ اليومية *</label>
                  <input
                    type="date"
                    required
                    value={journalForm.date}
                    onChange={(e) => setJournalForm({ ...journalForm, date: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">حالة الحفظ الافتراضية</label>
                  <select
                    value={journalForm.status}
                    onChange={(e) => setJournalForm({ ...journalForm, status: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-white font-bold"
                  >
                    <option value="Draft">حفظ كمسودة (Draft)</option>
                    <option value="Approved">اعتماد وترحيل فوري (Approved)</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-slate-600 mb-1">شرح وبيان القيد العام *</label>
                  <input
                    type="text"
                    required
                    value={journalForm.description}
                    onChange={(e) => setJournalForm({ ...journalForm, description: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5"
                    placeholder="مثال: قيد إثبات رواتب أو تسوية فروقات بنكية..."
                  />
                </div>
              </div>

              {/* Journal Lines */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-sm font-extrabold text-[#005185]">سطور القيد المالي المدين والدائن</h3>
                  <button
                    type="button"
                    onClick={addFormLine}
                    className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-1.5 px-4 rounded-xl text-[10px] transition-all"
                  >
                    ➕ إضافة سطر قيد
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full min-w-max text-right text-[11px] whitespace-nowrap">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                      <tr>
                        <th className="px-3 py-2.5 w-44">نوع الحساب / Account Type</th>
                        <th className="px-3 py-2.5 w-48">الحساب التفصيلي الفرعي (ارتباط)</th>
                        <th className="px-3 py-2.5 w-24 text-left">مدين / Debit (SAR)</th>
                        <th className="px-3 py-2.5 w-24 text-left">دائن / Credit (SAR)</th>
                        <th className="px-3 py-2.5">شرح سطر القيد تفصيلي</th>
                        <th className="px-3 py-2.5 w-12 text-center">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-semibold">
                      {journalForm.lines.map((line, idx) => (
                        <tr key={line.id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-1.5">
                            <select
                              value={line.accountType}
                              onChange={(e) => updateFormLine(idx, "accountType", e.target.value)}
                              className="w-full border border-slate-200 rounded p-1 bg-white text-[10px]"
                            >
                              <option value="Other">عام / Other</option>
                              <option value="Bank">حساب بنكي / Bank</option>
                              <option value="Cash">صندوق نقدية / Cash</option>
                              <option value="Accounts Receivable">ذمم عملاء مدينة / Receivable</option>
                              <option value="Revenue">إيرادات / Revenue</option>
                              <option value="VAT Output">ضريبة مخرجات / VAT Output</option>
                              <option value="Expense">مصاريف / Expense</option>
                              <option value="Supplier">موردين / Supplier</option>
                            </select>
                          </td>
                          <td className="px-3 py-1.5 text-[10px]">
                            {line.accountType === "Bank" ? (
                              <select
                                value={line.bankAccountId || ""}
                                required
                                onChange={(e) => updateFormLine(idx, "bankAccountId", e.target.value)}
                                className="w-full border border-slate-200 rounded p-1 bg-white"
                              >
                                <option value="">-- اختر البنك --</option>
                                {banks.map(b => (
                                  <option key={b.id} value={b.id}>{b.bankName}</option>
                                ))}
                              </select>
                            ) : line.accountType === "Cash" ? (
                              <select
                                value={line.cashBoxId || ""}
                                required
                                onChange={(e) => updateFormLine(idx, "cashBoxId", e.target.value)}
                                className="w-full border border-slate-200 rounded p-1 bg-white"
                              >
                                <option value="">-- اختر الصندوق --</option>
                                {boxes.map(b => (
                                  <option key={b.id} value={b.id}>{b.cashBoxName}</option>
                                ))}
                              </select>
                            ) : line.accountType === "Accounts Receivable" ? (
                              <select
                                value={line.customerId || ""}
                                required
                                onChange={(e) => updateFormLine(idx, "customerId", e.target.value)}
                                className="w-full border border-slate-200 rounded p-1 bg-white"
                              >
                                <option value="">-- اختر العميل --</option>
                                {clients.map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-slate-400 italic font-medium">لا يتطلب ارتباط فرعي</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              value={line.debit}
                              min={0}
                              onChange={(e) => updateFormLine(idx, "debit", Number(e.target.value))}
                              className="w-full border border-slate-200 rounded p-1 font-mono text-left"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              value={line.credit}
                              min={0}
                              onChange={(e) => updateFormLine(idx, "credit", Number(e.target.value))}
                              className="w-full border border-slate-200 rounded p-1 font-mono text-left"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="text"
                              value={line.description}
                              required
                              onChange={(e) => updateFormLine(idx, "description", e.target.value)}
                              className="w-full border-none focus:ring-0 p-1 bg-transparent text-[10px]"
                              placeholder="بيان تفصيلي للسطر..."
                            />
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...journalForm.lines];
                                updated.splice(idx, 1);
                                setJournalForm(prev => ({ ...prev, lines: updated }));
                              }}
                              className="text-rose-600 hover:bg-rose-50 rounded px-1"
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

              {/* Form Balance Banner */}
              <div className="p-4 rounded-2xl border font-bold flex justify-between items-center text-xs">
                <div className="space-y-1">
                  <p>إجمالي المدين (Debits): <span className="font-mono text-slate-800">{debitTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</span></p>
                  <p>إجمالي الدائن (Credits): <span className="font-mono text-slate-800">{creditTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</span></p>
                </div>
                <div className="text-right">
                  {isBalanced ? (
                    <span className="text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1">
                      <span>✔️</span> القيد متوازن ومطابق محاسبياً
                    </span>
                  ) : (
                    <span className="text-rose-700 bg-rose-50 px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1 animate-pulse">
                      <span>⚠️</span> القيد غير متوازن! الفارق: {Math.abs(debitTotal - creditTotal).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR
                    </span>
                  )}
                </div>
              </div>
            </form>

            <div className="bg-slate-50 p-4 border-t flex justify-end gap-2.5 shrink-0">
              <button
                onClick={() => setShowJournalModal(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-5 rounded-xl text-xs transition-all"
              >
                إلغاء وإغلاق
              </button>
              <button
                onClick={handleSaveJournalForm}
                className="bg-[#0072BC] hover:bg-[#005185] text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-all shadow"
              >
                💾 حفظ سند القيد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHOW DETAILS MODAL */}
      {showDetailsModal && selectedEntry && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center animate-fade-in backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border overflow-hidden">
            <div className="bg-[#005185] p-5 text-white flex justify-between items-center">
              <h3 className="text-base font-bold">📄 تفاصيل بنود القيد رقم: {selectedEntry.journalEntryNo}</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-white hover:text-red-200 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600 bg-slate-50 p-4 rounded-xl border">
                <p>البيان العام: {selectedEntry.description}</p>
                <p>تاريخ السند: {selectedEntry.date}</p>
                <p>مصدر القيد: {selectedEntry.sourceModule}</p>
                <p>الحالة: <span className="font-extrabold text-[#0072BC]">{selectedEntry.status}</span></p>
              </div>

              <div className="border rounded-xl overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead className="bg-slate-100 border-b font-extrabold text-slate-700">
                    <tr>
                      <th className="p-2 w-8 text-center">#</th>
                      <th className="p-2">الحساب المحاسبي</th>
                      <th className="p-2 text-left w-24">المدين (SAR)</th>
                      <th className="p-2 text-left w-24">الدائن (SAR)</th>
                      <th className="p-2">البيان التفصيلي للسطر</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-semibold text-slate-600">
                    {(selectedEntry.lines || []).map((l, idx) => (
                      <tr key={l.id || idx}>
                        <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                        <td className="p-2">
                          <p className="font-bold text-slate-800">{l.accountName}</p>
                          <span className="text-[10px] text-slate-400">التصنيف: {l.accountType} (كود: {l.accountCode})</span>
                        </td>
                        <td className="p-2 text-left font-mono font-bold text-slate-700">
                          {l.debit > 0 ? l.debit.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "-"}
                        </td>
                        <td className="p-2 text-left font-mono font-bold text-slate-700">
                          {l.credit > 0 ? l.credit.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "-"}
                        </td>
                        <td className="p-2 text-[11px] text-slate-500">{l.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-6 rounded-xl text-xs"
              >
                إغلاق التفاصيل
              </button>
            </div>
          </div>
        </div>
      )}

      {showApprovalAccountModal && approvalEntry && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center animate-fade-in backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border overflow-hidden">
            <div className="bg-[#0072BC] p-5 text-white flex justify-between items-center">
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>🏦</span>
                {lang === "ar" ? "اعتماد وصرف قيد مشتريات يومية" : "Approve & Disburse Daily Purchases JV"}
              </h3>
              <button
                onClick={() => {
                  setShowApprovalAccountModal(false);
                  setApprovalEntry(null);
                }}
                className="text-white hover:text-red-200 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border space-y-2 text-xs font-semibold text-slate-700 text-right" dir="rtl">
                <p className="flex justify-between">
                  <span>{lang === "ar" ? "رقم القيد:" : "JV Number:"}</span>
                  <span className="font-bold text-slate-900">{approvalEntry.journalEntryNo}</span>
                </p>
                <p className="flex justify-between">
                  <span>{lang === "ar" ? "تاريخ القيد:" : "JV Date:"}</span>
                  <span className="font-bold text-slate-900">{approvalEntry.date}</span>
                </p>
                <p className="flex justify-between">
                  <span>{lang === "ar" ? "البيان العام:" : "Description:"}</span>
                  <span className="font-bold text-slate-900">{approvalEntry.description}</span>
                </p>
                <div className="border-t pt-2 mt-2 flex justify-between items-center">
                  <span className="font-bold text-[#0072BC]">{lang === "ar" ? "المبلغ الإجمالي:" : "Total Amount:"}</span>
                  <span className="font-black text-lg text-[#0072BC]">
                    {Number(approvalEntry.totalDebit).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-right" dir="rtl">
                <label className="block text-xs font-bold text-slate-500">
                  {lang === "ar" ? "طريقة الصرف وتحديد الحساب المالي:" : "Payment Method & Financial Account:"}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPaymentSource({
                        type: "Bank",
                        id: banks[0]?.id || ""
                      });
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                      selectedPaymentSource.type === "Bank"
                        ? "border-[#0072BC] bg-[#0072BC]/5 text-[#0072BC]"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-lg">💳</span>
                    <span>{lang === "ar" ? "حساب بنكي / تحويل" : "Bank Account"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPaymentSource({
                        type: "Cash",
                        id: boxes[0]?.id || ""
                      });
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                      selectedPaymentSource.type === "Cash"
                        ? "border-[#0072BC] bg-[#0072BC]/5 text-[#0072BC]"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-lg">💵</span>
                    <span>{lang === "ar" ? "نقدي / الصندوق" : "Cash / Safe Box"}</span>
                  </button>
                </div>

                {selectedPaymentSource.type === "Bank" ? (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400">
                      {lang === "ar" ? "اختر الحساب البنكي:" : "Select Bank Account:"}
                    </label>
                    <select
                      value={selectedPaymentSource.id}
                      onChange={(e) => setSelectedPaymentSource({ ...selectedPaymentSource, id: e.target.value })}
                      className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 focus:border-[#0072BC] bg-white"
                      required
                    >
                      <option value="">{lang === "ar" ? "-- اختر البنك لتأكيد الصرف منه --" : "-- Select Bank --"}</option>
                      {banks.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} ({lang === "ar" ? "الرصيد" : "Bal"}: {Number(b.currentBalance || b.current_balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400">
                      {lang === "ar" ? "اختر الصندوق النقدي:" : "Select Cash Box:"}
                    </label>
                    <select
                      value={selectedPaymentSource.id}
                      onChange={(e) => setSelectedPaymentSource({ ...selectedPaymentSource, id: e.target.value })}
                      className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 focus:border-[#0072BC] bg-white"
                      required
                    >
                      <option value="">{lang === "ar" ? "-- اختر الصندوق لتأكيد الصرف منه --" : "-- Select Cash Box --"}</option>
                      {boxes.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.cashBoxName} ({lang === "ar" ? "الرصيد" : "Bal"}: {Number(b.currentBalance || b.current_balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t flex justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowApprovalAccountModal(false);
                  setApprovalEntry(null);
                }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-6 rounded-xl text-xs transition"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (!selectedPaymentSource.id) {
                    alert(lang === "ar" ? "يرجى تحديد الحساب المالي أولاً" : "Please select a financial account first");
                    return;
                  }

                  const nowStr = new Date().toISOString();
                  const userStr = user?.username || "System";

                  // Replace temporary credit line with real cash/bank line
                  const updatedLines = approvalEntry.lines.map(line => {
                    const isCreditLiability = line.credit > 0 && (
                      line.accountType === "Accounts Payable" || 
                      line.accountCode === "2205" || 
                      line.accountName === "مستحقات مشتريات يومية" ||
                      line.accountName === "Accrued Daily Purchases"
                    );
                    
                    if (isCreditLiability) {
                      if (selectedPaymentSource.type === "Bank") {
                        const selectedBank = banks.find(b => b.id === selectedPaymentSource.id);
                        return {
                          ...line,
                          accountType: "Bank" as const,
                          accountCode: selectedBank?.accountCode || "1101",
                          accountName: selectedBank?.bankName || "البنك",
                          bankAccountId: selectedPaymentSource.id,
                          cashBoxId: "",
                          description: lang === "ar" 
                            ? `صرف من حساب البنك: ${selectedBank?.bankName}`
                            : `Disbursed from bank account: ${selectedBank?.bankName}`
                        };
                      } else {
                        const selectedBox = boxes.find(b => b.id === selectedPaymentSource.id);
                        return {
                          ...line,
                          accountType: "Cash" as const,
                          accountCode: selectedBox?.accountCode || "1102",
                          accountName: selectedBox?.cashBoxName || "الصندوق",
                          cashBoxId: selectedPaymentSource.id,
                          bankAccountId: "",
                          description: lang === "ar"
                            ? `صرف نقدي من الصندوق: ${selectedBox?.cashBoxName}`
                            : `Disbursed in cash from box: ${selectedBox?.cashBoxName}`
                        };
                      }
                    }
                    return line;
                  });

                  try {
                    // Update the entry in Firestore with approved status and updated lines
                    await updateDoc(doc(db, "journal_entries", approvalEntry.id), {
                      lines: updatedLines,
                      status: "Approved",
                      approvedAt: nowStr,
                      approvedBy: user?.id || "system",
                      approvedByName: userStr
                    });

                    // Apply impact to Bank/Cash Box balances
                    await applyJournalImpactToCashBank(approvalEntry.id);

                    // Sync the entry to the Expenses collection as Approved and Paid
                    await syncJournalEntryToExpensesAndRevenues(approvalEntry.id, lang);

                    // Save Audit Log
                    const logId = `LOG_JV_APP_${Date.now()}`;
                    await setDoc(doc(db, "audit_logs", logId), {
                      userId: user?.id || "unknown",
                      userName: user?.username || "System",
                      userRole: user?.role || "Admin",
                      action: "اعتماد قيد مشتريات يومية وتحديث رصيد الصرف",
                      module: "Journal Entries",
                      recordId: approvalEntry.id,
                      createdAt: nowStr
                    });

                    showToast(
                      lang === "ar" 
                        ? "تم اعتماد وصرف قيد المشتريات وتحديث الحسابات والمصروفات بنجاح!" 
                        : "Daily Purchases JV approved, disbursed, and synced to expenses successfully!",
                      "success"
                    );

                    setShowApprovalAccountModal(false);
                    setApprovalEntry(null);
                    loadData();
                  } catch (err: any) {
                    console.error("Failed to approve daily purchases entry:", err);
                    alert(lang === "ar" ? "فشل اعتماد القيد" : "Failed to approve journal entry");
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-xl text-xs transition"
              >
                {lang === "ar" ? "نعم، اعتمد واخصم الصرف" : "Yes, Approve & Disburse"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUTOMATED TEST FLOW LOG MODAL */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-slate-800 p-5 text-white flex justify-between items-center shrink-0">
              <h3 className="text-base font-extrabold flex items-center gap-1.5">
                <span>⚡</span> أداة محاكاة واختبار التدفق المالي المحاسبي والقيود التلقائية
              </h3>
              <button
                onClick={() => setShowTestModal(false)}
                className="text-white hover:text-red-200 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-semibold leading-relaxed space-y-1">
                <p className="font-extrabold text-sm text-amber-950">🤔 ماذا تفعل هذه المحاكاة؟</p>
                <p>• تقوم بفحص وإنشاء بنك وصندوق تجريبيين وعميل تجريبي في ثوانٍ.</p>
                <p>• تصدر فاتورة مبيعات ليد (1,150 SAR شاملة ضريبة القيمة المضافة 15%).</p>
                <p>• تنشئ قيد استحقاق الفاتورة بالكامل (مدين عملاء، دائن مبيعات ودائن مخرجات ضريبة).</p>
                <p>• تؤكد أن أرصدة البنك لم تتغير لمجرد قيد الاستحقاق.</p>
                <p>• تسجل حوالة تحصيل بنكية، وتولّد قيد القبض المالي، وتعتمد القيد لتأكيد زيادة البنك فعلياً بالـ 1,150 وتحديث الفاتورة كـ Paid بالربط التلقائي.</p>
              </div>

              <div className="bg-slate-900 text-[#00FF00] font-mono p-4 rounded-2xl text-xs space-y-1.5 h-64 overflow-y-auto select-all">
                {testLog.length === 0 ? (
                  <p className="text-slate-500 italic">اضغط "بدء المحاكاة الشاملة" للبدء بالتحليل المباشر...</p>
                ) : (
                  testLog.map((ln, idx) => (
                    <p key={idx} className="break-words">{ln}</p>
                  ))
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t flex justify-between items-center shrink-0">
              <span className="text-[10px] text-slate-500 font-bold">مربوط بالكامل مع Firebase Firestore</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTestModal(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-5 rounded-xl text-xs"
                >
                  إغلاق نافذة الاختبار
                </button>
                <button
                  disabled={testing}
                  onClick={runEndToEndFinancialTest}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-2 px-6 rounded-xl text-xs shadow disabled:opacity-50"
                >
                  {testing ? "جاري تشغيل الاختبار..." : "🚀 بدء المحاكاة الشاملة"}
                </button>
              </div>
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

      {/* JOURNAL ENTRIES MONTHLY REPORT PRINT MODAL */}
      {showJournalReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto no-print" dir={lang === "ar" ? "rtl" : "ltr"}>
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #journal-report-print-area, #journal-report-print-area * {
                visibility: visible !important;
              }
              #journal-report-print-area {
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
                  {lang === "ar" ? "ملخص تقرير القيود اليومية وعمليات الأستاذ" : "Journal Entries Summary Report"}
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
                  onClick={() => setShowJournalReportModal(false)}
                  className="text-white hover:text-red-200 text-lg font-bold px-2 transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Scrollable Preview Area for UI view */}
            <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
              <div className="bg-white p-8 rounded-2xl border shadow-sm max-w-4xl mx-auto text-right" id="journal-report-print-area">
                
                {/* Print Header */}
                <div className="flex justify-between items-start border-b-2 border-[#005185] pb-4 mb-6">
                  <div className="text-right space-y-1">
                    <h1 className="text-base font-black text-[#005185]">{lang === "ar" ? "شركة فنون الوليد للخدمات الصناعية" : "Al Waleed Arts Industrial Services Co."}</h1>
                    <p className="text-[10px] text-slate-400 font-bold">AL WALEED ARTS INDUSTRIAL SERVICES & ADV. CO.</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{lang === "ar" ? "الرقم الضريبي: ٣١٠٨٨٧٦٦٥٢٠٠٠٠٣" : "VAT ID: 310887665200003"}</p>
                  </div>
                  <div className="text-center bg-slate-50 border border-slate-200 px-4 py-1.5 rounded-lg">
                    <span className="block text-[11px] font-black text-slate-600">
                      {lang === "ar" ? "ملخص القيود لشهر" : "Journal Summary Period"}
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
                    <span className="text-slate-400 block text-[10px]">{lang === "ar" ? "إجمالي قيود الفترة" : "Total Records"}</span>
                    <span className="text-slate-800 font-bold font-mono mt-0.5 block">{filteredEntries.length}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">{lang === "ar" ? "نطاق الفحص المالي" : "Financial Scope"}</span>
                    <span className="text-[#0072BC] font-bold mt-0.5 block">{lang === "ar" ? "قيود اليومية العامة" : "General Ledger"}</span>
                  </div>
                </div>

                {/* Total Summary Mini-Bento inside Report */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  <div className="border border-slate-200/80 p-3 rounded-xl bg-slate-50/50 text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">{lang === "ar" ? "إجمالي المدين (Debits)" : "Total Debits"}</span>
                    <span className="text-sm font-black text-slate-800 font-mono mt-1 block">
                      {filteredEntries.reduce((sum, e) => sum + (Number(e.totalDebit) || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-[9px] text-slate-500">SAR</span>
                    </span>
                  </div>
                  <div className="border border-slate-200/80 p-3 rounded-xl bg-slate-50/50 text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">{lang === "ar" ? "إجمالي الدائن (Credits)" : "Total Credits"}</span>
                    <span className="text-sm font-black text-slate-800 font-mono mt-1 block">
                      {filteredEntries.reduce((sum, e) => sum + (Number(e.totalCredit) || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-[9px] text-slate-500">SAR</span>
                    </span>
                  </div>
                  <div className="border border-emerald-200 p-3 rounded-xl bg-emerald-50/10 text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">{lang === "ar" ? "القيود المعتمدة والمرحلة" : "Approved Entries"}</span>
                    <span className="text-sm font-black text-emerald-700 font-mono mt-1 block">
                      {filteredEntries.filter(e => e.status === "Approved").length} <span className="text-[9px] text-slate-500">{lang === "ar" ? "قيد" : "JV"}</span>
                    </span>
                  </div>
                </div>

                {/* Table of Items */}
                <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
                  <table className="w-full text-right text-[10px] text-slate-700 leading-normal">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-extrabold text-right">
                        <th className="p-2.5 font-bold">{lang === "ar" ? "رقم القيد" : "Entry No"}</th>
                        <th className="p-2.5 font-bold">{lang === "ar" ? "التاريخ" : "Date"}</th>
                        <th className="p-2.5 font-bold">{lang === "ar" ? "بيان القيد العام" : "General Description"}</th>
                        <th className="p-2.5 text-left font-bold">{lang === "ar" ? "إجمالي المدين" : "Total Debit"}</th>
                        <th className="p-2.5 text-left font-bold">{lang === "ar" ? "إجمالي الدائن" : "Total Credit"}</th>
                        <th className="p-2.5 text-center font-bold">{lang === "ar" ? "الحالة" : "Status"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((jv, idx) => (
                        <tr key={jv.id} className={`border-b border-slate-100 font-semibold ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
                          <td className="p-2.5 font-mono text-[#0072BC] font-bold">{jv.journalEntryNo}</td>
                          <td className="p-2.5 font-mono text-slate-500 font-bold">{jv.date}</td>
                          <td className="p-2.5 text-slate-800 font-bold max-w-[220px] truncate">{jv.description}</td>
                          <td className="p-2.5 text-left font-mono">{(Number(jv.totalDebit) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                          <td className="p-2.5 text-left font-mono">{(Number(jv.totalCredit) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                          <td className="p-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                              jv.status === "Approved" 
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                                : jv.status === "Draft" 
                                ? "bg-slate-50 text-slate-600" 
                                : "bg-rose-50 text-rose-600"
                            }`}>
                              {jv.status === "Approved" ? (lang === "ar" ? "معتمد" : "Approved") : jv.status === "Draft" ? (lang === "ar" ? "مسودة" : "Draft") : (lang === "ar" ? "ملغى" : "Cancelled")}
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
