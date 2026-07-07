import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { collection, doc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { motion } from "motion/react";
import {
  Percent,
  Calculator,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Eye,
  X,
  Printer,
  Coins,
  Building2,
  Info,
  ChevronDown,
  ArrowRightLeft,
  FileText
} from "lucide-react";
import { sharedPrintHeader, sharedPrintFooter, sharedPrintStyles } from "../../utils/PrintShared";

// Firestore Error Types as required by the Firebase Integration Skill
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error in ZakatTaxCalculator: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
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

interface CustomerInvoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  customerName: string;
  taxableAmount: number;
  vatTotal: number;
  grandTotal: number;
  status: string;
}

interface SupplierInvoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  supplierName: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  status: string;
}

interface ExpenseRecord {
  id: string;
  expenseNo: string;
  supplierInvoiceId?: string;
  expenseDate: string;
  supplierName: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  paymentStatus: string;
}

interface VatDeclaration {
  id: string;
  year: number;
  quarter: string;
  salesVat: number;
  purchasesVat: number;
  netVat: number;
  status: "Paid" | "Unpaid";
  paidAt?: string;
  paidBy?: string;
  paidFromType?: "Bank" | "Cash";
  paidFromId?: string;
  paidFromName?: string;
  notes?: string;
}

interface ZakatPayment {
  id: string;
  year: number;
  workingCapital: number;
  netProfit: number;
  zakatBase: number;
  zakatDue: number;
  status: "Paid" | "Unpaid";
  paidAt?: string;
  paidBy?: string;
  paidFromType?: "Bank" | "Cash";
  paidFromId?: string;
  paidFromName?: string;
  notes?: string;
}

export default function ZakatTaxCalculatorTab({ lang, user }: { lang: "ar" | "en"; user: any }) {
  // Master Lists
  const [customerInvoices, setCustomerInvoices] = useState<CustomerInvoice[]>([]);
  const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [cashBoxes, setCashBoxes] = useState<CashBox[]>([]);
  
  // Persistent Tax States from Firestore
  const [vatDeclarations, setVatDeclarations] = useState<Record<string, VatDeclaration>>({});
  const [zakatPayments, setZakatPayments] = useState<Record<string, ZakatPayment>>({});

  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedQuarter, setSelectedQuarter] = useState<string>("Q1");
  const [activeTab, setActiveTab] = useState<"vat" | "zakat">("vat");

  // Detail Modal States
  const [showVatDetails, setShowVatDetails] = useState(false);
  const [showZakatDetails, setShowZakatDetails] = useState(false);

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState<{
    isOpen: boolean;
    type: "vat" | "zakat";
    targetId: string; // e.g., "2026_Q1" or "2026"
    amount: number;
  }>({
    isOpen: false,
    type: "vat",
    targetId: "",
    amount: 0
  });

  // Payment Form States
  const [paymentForm, setPaymentForm] = useState({
    paidFromType: "Bank" as "Bank" | "Cash",
    paidFromId: "",
    notes: ""
  });

  // Toast notification state
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: "success" | "error" }>({
    show: false,
    msg: "",
    type: "success"
  });

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  };

  // Fetch all accounting records
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Customer Invoices
      let custInvs: CustomerInvoice[] = [];
      try {
        const snap = await getDocs(collection(db, "customer_invoices"));
        custInvs = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            invoiceNo: data.invoiceNo || "",
            invoiceDate: data.invoiceDate || "",
            customerName: data.customerName || "",
            taxableAmount: Number(data.taxableAmount) || 0,
            vatTotal: Number(data.vatTotal) || 0,
            grandTotal: Number(data.grandTotal) || 0,
            status: data.status || "Draft"
          };
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, "customer_invoices");
      }

      // 2. Supplier Invoices
      let suppInvs: SupplierInvoice[] = [];
      try {
        const snap = await getDocs(collection(db, "supplier_invoices"));
        suppInvs = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            invoiceNo: data.invoiceNo || "",
            invoiceDate: data.invoiceDate || "",
            supplierName: data.supplierName || "",
            subtotal: Number(data.subtotal) || 0,
            vatAmount: Number(data.vatAmount) || 0,
            totalAmount: Number(data.totalAmount) || 0,
            status: data.status || "Draft"
          };
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, "supplier_invoices");
      }

      // 3. Expenses
      let exps: ExpenseRecord[] = [];
      try {
        const snap = await getDocs(collection(db, "expenses"));
        exps = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            expenseNo: data.expenseNo || "",
            supplierInvoiceId: data.supplierInvoiceId || "",
            expenseDate: data.expenseDate || "",
            supplierName: data.supplierName || "",
            subtotal: Number(data.subtotal) || 0,
            vatAmount: Number(data.vatAmount) || 0,
            totalAmount: Number(data.totalAmount) || 0,
            paymentStatus: data.paymentStatus || "Pending"
          };
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, "expenses");
      }

      // 4. Bank Accounts
      let banks: BankAccount[] = [];
      try {
        const snap = await getDocs(collection(db, "bank_accounts"));
        banks = snap.docs
          .map(d => {
            const data = d.data();
            return {
              id: d.id,
              bankName: data.bankName || "",
              accountName: data.accountName || "",
              currentBalance: Number(data.currentBalance || data.current_balance) || 0,
              isDeleted: data.isDeleted || false,
              status: data.status || "Active"
            };
          })
          .filter(b => !b.isDeleted && b.status === "Active");
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, "bank_accounts");
      }

      // 5. Cash Boxes
      let boxes: CashBox[] = [];
      try {
        const snap = await getDocs(collection(db, "cash_boxes"));
        boxes = snap.docs
          .map(d => {
            const data = d.data();
            return {
              id: d.id,
              cashBoxName: data.cashBoxName || "",
              currentBalance: Number(data.currentBalance || data.current_balance) || 0,
              isDeleted: data.isDeleted || false,
              status: data.status || "Active"
            };
          })
          .filter(b => !b.isDeleted && b.status === "Active");
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, "cash_boxes");
      }

      // 6. Tax / VAT declarations persistent states
      let vatDecs: Record<string, VatDeclaration> = {};
      try {
        const snap = await getDocs(collection(db, "tax_vat_declarations"));
        snap.docs.forEach(doc => {
          vatDecs[doc.id] = { id: doc.id, ...doc.data() } as VatDeclaration;
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, "tax_vat_declarations");
      }

      // 7. Zakat payments persistent states
      let zakatPays: Record<string, ZakatPayment> = {};
      try {
        const snap = await getDocs(collection(db, "zakat_payments"));
        snap.docs.forEach(doc => {
          zakatPays[doc.id] = { id: doc.id, ...doc.data() } as ZakatPayment;
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, "zakat_payments");
      }

      setCustomerInvoices(custInvs);
      setSupplierInvoices(suppInvs);
      setExpenses(exps);
      setBankAccounts(banks);
      setCashBoxes(boxes);
      setVatDeclarations(vatDecs);
      setZakatPayments(zakatPays);

      // Auto set first account as default in payment form
      if (banks.length > 0) {
        setPaymentForm(prev => ({ ...prev, paidFromId: banks[0].id, paidFromType: "Bank" }));
      } else if (boxes.length > 0) {
        setPaymentForm(prev => ({ ...prev, paidFromId: boxes[0].id, paidFromType: "Cash" }));
      }

    } catch (e) {
      console.error(e);
      showToast(lang === "ar" ? "خطأ أثناء تحميل البيانات" : "Error loading financial data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Set default account when changing payment source type
  useEffect(() => {
    if (paymentForm.paidFromType === "Bank" && bankAccounts.length > 0) {
      setPaymentForm(prev => ({ ...prev, paidFromId: bankAccounts[0].id }));
    } else if (paymentForm.paidFromType === "Cash" && cashBoxes.length > 0) {
      setPaymentForm(prev => ({ ...prev, paidFromId: cashBoxes[0].id }));
    }
  }, [paymentForm.paidFromType, bankAccounts, cashBoxes]);

  // Date range helpers for Quarters
  const getQuarterDateRange = (year: number, quarter: string) => {
    switch (quarter) {
      case "Q1":
        return { start: `${year}-01-01`, end: `${year}-03-31` };
      case "Q2":
        return { start: `${year}-04-01`, end: `${year}-06-30` };
      case "Q3":
        return { start: `${year}-07-01`, end: `${year}-09-30` };
      case "Q4":
        return { start: `${year}-10-01`, end: `${year}-12-31` };
      default:
        return { start: `${year}-01-01`, end: `${year}-12-31` };
    }
  };

  // ----------------------------------------------------
  // VAT Calculations
  // ----------------------------------------------------
  const quarterRange = getQuarterDateRange(selectedYear, selectedQuarter);

  // Output VAT Invoices (approved customer invoices in selected quarter)
  const quarterSalesInvoices = customerInvoices.filter(inv => {
    const isApproved = inv.status !== "Draft" && inv.status !== "Cancelled";
    return isApproved && inv.invoiceDate >= quarterRange.start && inv.invoiceDate <= quarterRange.end;
  });

  const totalSalesVat = quarterSalesInvoices.reduce((sum, inv) => sum + inv.vatTotal, 0);
  const totalSalesAmount = quarterSalesInvoices.reduce((sum, inv) => sum + inv.taxableAmount, 0);

  // Input VAT Supplier Invoices (approved supplier invoices in selected quarter)
  const quarterSupplierInvoices = supplierInvoices.filter(inv => {
    const isApproved = inv.status === "Approved";
    return isApproved && inv.invoiceDate >= quarterRange.start && inv.invoiceDate <= quarterRange.end;
  });

  // Filter direct expenses to prevent double-counting if they originate from supplier invoices
  const quarterExpenses = expenses.filter(exp => {
    const isDirect = !exp.supplierInvoiceId;
    return isDirect && exp.expenseDate >= quarterRange.start && exp.expenseDate <= quarterRange.end;
  });

  const totalSupplierVat = quarterSupplierInvoices.reduce((sum, inv) => sum + inv.vatAmount, 0);
  const totalSupplierSubtotal = quarterSupplierInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);

  const totalExpensesVat = quarterExpenses.reduce((sum, exp) => sum + exp.vatAmount, 0);
  const totalExpensesSubtotal = quarterExpenses.reduce((sum, exp) => sum + exp.subtotal, 0);

  // Combined Input VAT (Purchases & Expenses Reclaimable)
  const totalPurchasesVat = totalSupplierVat + totalExpensesVat;
  const totalPurchasesAmount = totalSupplierSubtotal + totalExpensesSubtotal;

  // Net VAT Calculation
  const netVatAmount = totalSalesVat - totalPurchasesVat;

  const currentVatDeclarationId = `${selectedYear}_${selectedQuarter}`;
  const isVatPaid = vatDeclarations[currentVatDeclarationId]?.status === "Paid";
  const vatPaymentDetails = vatDeclarations[currentVatDeclarationId];

  // ----------------------------------------------------
  // Zakat Calculations (Annual)
  // ----------------------------------------------------
  const yearStart = `${selectedYear}-01-01`;
  const yearEnd = `${selectedYear}-12-31`;

  // 1. Working Capital / Liquidity (Sum of Bank & Cash Balances)
  const totalBankBalance = bankAccounts.reduce((sum, b) => sum + b.currentBalance, 0);
  const totalCashBalance = cashBoxes.reduce((sum, c) => sum + c.currentBalance, 0);
  const workingCapital = totalBankBalance + totalCashBalance;

  // 2. Annual Sales Revenue from Approved Customer Invoices
  const annualSalesInvoices = customerInvoices.filter(inv => {
    const isApproved = inv.status !== "Draft" && inv.status !== "Cancelled";
    return isApproved && inv.invoiceDate >= yearStart && inv.invoiceDate <= yearEnd;
  });
  const annualSalesRevenue = annualSalesInvoices.reduce((sum, inv) => sum + inv.taxableAmount, 0);

  // 3. Annual Cost / Expenses
  const annualSupplierInvoices = supplierInvoices.filter(inv => {
    const isApproved = inv.status === "Approved";
    return isApproved && inv.invoiceDate >= yearStart && inv.invoiceDate <= yearEnd;
  });
  const annualSupplierCost = annualSupplierInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);

  const annualExpenses = expenses.filter(exp => {
    const isDirect = !exp.supplierInvoiceId;
    return isDirect && exp.expenseDate >= yearStart && exp.expenseDate <= yearEnd;
  });
  const annualExpensesCost = annualExpenses.reduce((sum, exp) => sum + exp.subtotal, 0);

  const annualTotalCosts = annualSupplierCost + annualExpensesCost;

  // Net operating profit (before Zakat)
  const netAnnualProfit = annualSalesRevenue - annualTotalCosts;

  // Zakat Base = Working Capital + Net Profit (Simplified Saudi Zakat Estimation Base)
  // According to ZATCA rules: وعاء الزكاة المبسط للمكلفين ذوي الحسابات غير المنتظمة أو التقديرية يتكون من رأس المال والسيولة النقدية + صافي الأرباح المعدلة
  const zakatBase = Math.max(0, workingCapital + netAnnualProfit);

  // Zakat due rate: 2.5778% for Gregorian years (365 days) or 2.5% for Lunar hijri years (354 days).
  // Standard Gregorian Rate used by Saudi ZATCA: 2.5778%
  const ZAKAT_RATE = 0.025778;
  const zakatDueAmount = zakatBase * ZAKAT_RATE;

  const currentZakatPaymentId = `${selectedYear}`;
  const isZakatPaid = zakatPayments[currentZakatPaymentId]?.status === "Paid";
  const zakatPaymentDetails = zakatPayments[currentZakatPaymentId];

  // ----------------------------------------------------
  // Process Settle Payment (Writes to Firestore & Adjusts Balances)
  // ----------------------------------------------------
  const handleSettlePaymentSubmit = async () => {
    const { paidFromType, paidFromId, notes } = paymentForm;
    if (!paidFromId) {
      showToast(lang === "ar" ? "برجاء اختيار حساب الدفع" : "Please select payment account", "error");
      return;
    }

    const { type, targetId, amount } = showPaymentModal;
    const nowStr = new Date().toISOString();
    const operator = user?.username || "System User";

    try {
      // Find source name for logging
      let sourceName = "";
      let currentBal = 0;

      if (paidFromType === "Bank") {
        const acc = bankAccounts.find(b => b.id === paidFromId);
        sourceName = acc ? `${acc.bankName} - ${acc.accountName}` : "Bank Account";
        currentBal = acc?.currentBalance || 0;
      } else {
        const cb = cashBoxes.find(c => c.id === paidFromId);
        sourceName = cb ? cb.cashBoxName : "Cash Box";
        currentBal = cb?.currentBalance || 0;
      }

      // Prevent overdraft if needed (optional guard, we'll allow but warn, or subtract)
      const newBalance = currentBal - Math.abs(amount);

      // 1. Update the cash/bank document in Firestore
      const collectionName = paidFromType === "Bank" ? "bank_accounts" : "cash_boxes";
      try {
        await updateDoc(doc(db, collectionName, paidFromId), {
          currentBalance: newBalance,
          updatedAt: nowStr,
          updatedBy: operator
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `${collectionName}/${paidFromId}`);
      }

      // 2. Create the Automatic Journal Entry & Cash/Bank transaction log
      const refTxNo = `TX_${Date.now()}`;
      const refJeNo = `JE_${Date.now()}`;
      
      const txObj = {
        transactionNo: refTxNo,
        journalEntryId: refJeNo,
        journalEntryNo: refJeNo,
        date: nowStr.split("T")[0],
        type: "Payment",
        accountType: paidFromType,
        accountId: paidFromId,
        accountName: sourceName,
        partyType: "Tax Authority",
        partyName: lang === "ar" ? "الهيئة العامة للزكاة والضريبة والجمارك" : "Zakat, Tax and Customs Authority",
        amount: Math.abs(amount),
        description: type === "vat"
          ? `${lang === "ar" ? "سداد ضريبة القيمة المضافة للربع" : "VAT payment for"} ${targetId.replace("_", " ")} - ${notes}`
          : `${lang === "ar" ? "سداد الزكاة الشرعية للسنة المالية" : "Zakat payment for fiscal year"} ${targetId} - ${notes}`,
        status: "Completed",
        createdAt: nowStr,
        createdBy: operator
      };

      try {
        await setDoc(doc(db, "cash_bank_transactions", refTxNo), txObj);
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, "cash_bank_transactions");
      }

      // 3. Mark the declaration itself as paid in Firestore
      if (type === "vat") {
        const updatedVat: VatDeclaration = {
          id: targetId,
          year: selectedYear,
          quarter: selectedQuarter,
          salesVat: totalSalesVat,
          purchasesVat: totalPurchasesVat,
          netVat: netVatAmount,
          status: "Paid",
          paidAt: nowStr,
          paidBy: operator,
          paidFromType,
          paidFromId,
          paidFromName: sourceName,
          notes
        };

        try {
          await setDoc(doc(db, "tax_vat_declarations", targetId), updatedVat);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `tax_vat_declarations/${targetId}`);
        }

        setVatDeclarations(prev => ({ ...prev, [targetId]: updatedVat }));
        showToast(
          lang === "ar"
            ? `تم اعتماد دفع الضريبة بقيمة ${Math.abs(amount).toLocaleString("en-US")} ريال وتحديث الرصيد!`
            : `VAT payment of ${Math.abs(amount).toLocaleString("en-US")} SAR recorded successfully!`,
          "success"
        );
      } else {
        // Zakat
        const updatedZakat: ZakatPayment = {
          id: targetId,
          year: selectedYear,
          workingCapital,
          netProfit: netAnnualProfit,
          zakatBase,
          zakatDue: zakatDueAmount,
          status: "Paid",
          paidAt: nowStr,
          paidBy: operator,
          paidFromType,
          paidFromId,
          paidFromName: sourceName,
          notes
        };

        try {
          await setDoc(doc(db, "zakat_payments", targetId), updatedZakat);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `zakat_payments/${targetId}`);
        }

        setZakatPayments(prev => ({ ...prev, [targetId]: updatedZakat }));
        showToast(
          lang === "ar"
            ? `تم اعتماد دفع الزكاة بقيمة ${zakatDueAmount.toLocaleString("en-US")} ريال وتعديل الرصيد!`
            : `Zakat payment of ${zakatDueAmount.toLocaleString("en-US")} SAR recorded successfully!`,
          "success"
        );
      }

      // Close modal & reload data to reflect balances
      setShowPaymentModal(prev => ({ ...prev, isOpen: false }));
      setPaymentForm(prev => ({ ...prev, notes: "" }));
      loadData();

    } catch (err) {
      console.error(err);
      showToast(lang === "ar" ? "فشلت عملية السداد التلقائي" : "Payment processing failed", "error");
    }
  };

  // Helper to trigger print of calculations
  const triggerPrint = (title: string, printElementId: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const todayStr = new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    const isVatType = printElementId === "vat-print-content";
    const refNo = isVatType ? `VAT-${selectedYear}-${selectedQuarter}` : `ZKT-${selectedYear}`;

    let bodyHtml = "";

    if (isVatType) {
      bodyHtml = `
        <div style="font-family: 'Gotham Pro', 'GE SS Two', sans-serif; direction: rtl; text-align: right;">
          <!-- Header and Title -->
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="font-size: 18px; font-weight: 900; color: #0072BC; margin: 0 0 4px 0;">إقرار ضريبة القيمة المضافة المبسط</h1>
            <p style="font-size: 11px; color: #64748b; margin: 0;">Simplified Value Added Tax (VAT) Declaration</p>
          </div>

          <!-- Document Metadata Table -->
          <table style="width: 100%; margin-bottom: 16px; font-size: 10px; border: 1px solid #e2e8f0; border-collapse: collapse;">
            <tbody>
              <tr style="background-color: #f8fafc;">
                <td style="padding: 6px 10px; font-weight: bold; border: 1px solid #e2e8f0; width: 25%;">السنة المالية / Year:</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; width: 25%; font-family: monospace;">${selectedYear}</td>
                <td style="padding: 6px 10px; font-weight: bold; border: 1px solid #e2e8f0; width: 25%;">الفترة الضريبية / Quarter:</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; width: 25%; font-family: monospace;">الربع ${selectedQuarter.replace("Q", "")} (${selectedQuarter})</td>
              </tr>
              <tr>
                <td style="padding: 6px 10px; font-weight: bold; border: 1px solid #e2e8f0;">تاريخ الطباعة / Printed On:</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0;">${todayStr}</td>
                <td style="padding: 6px 10px; font-weight: bold; border: 1px solid #e2e8f0;">الرقم المرجعي / Ref No:</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #0072BC;">${refNo}</td>
              </tr>
              <tr style="background-color: #f8fafc;">
                <td style="padding: 6px 10px; font-weight: bold; border: 1px solid #e2e8f0;">الحالة الضريبية / Status:</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0;" colspan="3">
                  <span style="background-color: ${isVatPaid ? "#d1fae5" : "#fee2e2"}; color: ${isVatPaid ? "#065f46" : "#991b1b"}; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 9px;">
                    ${isVatPaid ? "مسدد ومكتمل / Settled" : "معلق السداد / Unpaid - Action Required"}
                  </span>
                  ${isVatPaid && vatPaymentDetails ? `<span style="font-size: 9px; color: #475569; margin-right: 8px;">(سُدد عبر: ${vatPaymentDetails.paidFromName} في ${vatPaymentDetails.paidAt?.split("T")[0]})</span>` : ""}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Financial Summary Grid (A4 Compact) -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px;">
            <div style="border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; background-color: #f0f9ff; border-right: 4px solid #0072BC;">
              <span style="font-size: 9px; font-weight: bold; color: #0369a1; display: block;">ضريبة المخرجات (المبيعات)</span>
              <span style="font-size: 14px; font-weight: 900; color: #0f172a; font-family: monospace; display: block; margin-top: 4px;">${totalSalesVat.toLocaleString("en-US", { minimumFractionDigits: 2 })} <span style="font-size: 9px; font-family: sans-serif;">ريال</span></span>
              <span style="font-size: 8px; color: #64748b; display: block; margin-top: 2px;">مجموع المبيعات الخاضعة: ${totalSalesAmount.toLocaleString("en-US")} ريال</span>
            </div>
            <div style="border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; background-color: #fffbeb; border-right: 4px solid #d97706;">
              <span style="font-size: 9px; font-weight: bold; color: #b45309; display: block;">ضريبة المدخلات (المشتريات)</span>
              <span style="font-size: 14px; font-weight: 900; color: #0f172a; font-family: monospace; display: block; margin-top: 4px;">${totalPurchasesVat.toLocaleString("en-US", { minimumFractionDigits: 2 })} <span style="font-size: 9px; font-family: sans-serif;">ريال</span></span>
              <span style="font-size: 8px; color: #64748b; display: block; margin-top: 2px;">مجموع التكاليف الخاضعة: ${totalPurchasesAmount.toLocaleString("en-US")} ريال</span>
            </div>
            <div style="border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; background-color: ${netVatAmount >= 0 ? "#fff5f5" : "#f0fdf4"}; border-right: 4px solid ${netVatAmount >= 0 ? "#ef4444" : "#22c55e"};">
              <span style="font-size: 9px; font-weight: bold; color: ${netVatAmount >= 0 ? "#991b1b" : "#166534"}; display: block;">
                ${netVatAmount >= 0 ? "صافي الضريبة مستحق الدفع" : "رصيد دائن مسترد للمنشأة"}
              </span>
              <span style="font-size: 14px; font-weight: 900; color: #0f172a; font-family: monospace; display: block; margin-top: 4px;">${Math.abs(netVatAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })} <span style="font-size: 9px; font-family: sans-serif;">ريال</span></span>
              <span style="font-size: 8px; color: #64748b; display: block; margin-top: 2px;">
                ${netVatAmount >= 0 ? "مستحق السداد لهيئة الزكاة والجمارك" : "رصيد مسترد يُرحل للفترات القادمة"}
              </span>
            </div>
          </div>

          <!-- Mathematical Formula Visual (A4 compact) -->
          <div style="border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 6px; background-color: #fafafa; margin-bottom: 16px; text-align: center; font-size: 10px; display: flex; align-items: center; justify-content: space-around;">
            <div>
              <span style="color: #64748b; display: block; font-size: 8px;">ضريبة المبيعات (+)</span>
              <strong style="font-family: monospace; font-size: 11px;">${totalSalesVat.toLocaleString("en-US", { minimumFractionDigits: 2 })} ريال</strong>
            </div>
            <div style="color: #94a3b8; font-weight: bold;">-</div>
            <div>
              <span style="color: #64748b; display: block; font-size: 8px;">ضريبة المشتريات (-)</span>
              <strong style="font-family: monospace; font-size: 11px;">${totalPurchasesVat.toLocaleString("en-US", { minimumFractionDigits: 2 })} ريال</strong>
            </div>
            <div style="color: #94a3b8; font-weight: bold;">=</div>
            <div>
              <span style="color: #0072BC; display: block; font-size: 8px;">صافي الضريبة الربعية</span>
              <strong style="font-family: monospace; font-size: 11px; color: ${netVatAmount >= 0 ? "#ef4444" : "#22c55e"};">${netVatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} ريال</strong>
            </div>
          </div>

          <!-- Tables Breakdown -->
          <h3 style="font-size: 11px; font-weight: 900; color: #0f172a; margin: 0 0 6px 0; padding-bottom: 4px; border-bottom: 1px solid #0072BC;">تفاصيل بنود الإقرار الضريبي</h3>
          <table style="width: 100%; font-size: 9px; border: 1px solid #e2e8f0; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #f1f5f9; text-align: right; font-weight: bold;">
                <th style="padding: 6px 10px; border: 1px solid #e2e8f0; width: 45%;">البيان وبند الاحتساب / Items & Parameters</th>
                <th style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: left; width: 25%;">المبلغ الخاضع للضريبة / Taxable Amt</th>
                <th style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: center; width: 10%;">النسبة / Rate</th>
                <th style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: left; width: 20%;">مبلغ الضريبة / VAT Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #0369a1;">1. المبيعات الخاضعة للنسبة الأساسية (المخرجات)</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace;">${totalSalesAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: center;">15%</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace; font-weight: bold;">${totalSalesVat.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #b45309;">2. المشتريات فواتير الموردين (المدخلات)</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace;">${totalSupplierSubtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: center;">15%</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace; color: #b45309;">${totalSupplierVat.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #b45309;">3. المصروفات التشغيلية الخاضعة للضريبة</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace;">${totalExpensesSubtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: center;">15%</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace; color: #b45309;">${totalExpensesVat.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr style="background-color: #f8fafc; font-weight: bold;">
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0;">إجمالي ضريبة المخرجات المستحقة (+)</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace; color: #64748b;">-</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: center;">-</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace; color: #0072BC;">${totalSalesVat.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr style="background-color: #f8fafc; font-weight: bold;">
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0;">إجمالي ضريبة المدخلات القابلة للاسترداد (-)</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace; color: #64748b;">-</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: center;">-</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace; color: #d97706;">${totalPurchasesVat.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr style="background-color: #f0fdf4; font-weight: 900; font-size: 10px; border-top: 2px solid #0072BC;">
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0; color: #166534;">صافي الالتزام الضريبي للفترة المحددة</td>
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace; color: #166534;" colspan="2">الصافي النهائي / Net Due</td>
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace; color: ${netVatAmount >= 0 ? "#ef4444" : "#22c55e"}; font-size: 11px;">
                  ${netVatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} ريال
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Signatures Block to look super corporate -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; margin-top: 30px; font-size: 9px; page-break-inside: avoid;">
            <div style="text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
              <strong style="color: #4b5563;">إعداد وتوقيع المحاسب المالي</strong>
              <p style="margin: 4px 0 0 0; color: #94a3b8;">توقيع وختم الإدارة المالية</p>
            </div>
            <div style="text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
              <strong style="color: #4b5563;">الاعتماد الإداري (رئيس مجلس الإدارة)</strong>
              <p style="margin: 4px 0 0 0; color: #94a3b8;">توقيع وختم المدير التنفيذي المعتمد</p>
            </div>
          </div>
        </div>
      `;
    } else {
      // Zakat Statement Report with Detailed explanatory breakdown (الشرح التفصيلي لآلية احتساب الزكاة والفرق عن الضريبة)
      bodyHtml = `
        <div style="font-family: 'Gotham Pro', 'GE SS Two', sans-serif; direction: rtl; text-align: right;">
          <!-- Header and Title -->
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="font-size: 18px; font-weight: 900; color: #047857; margin: 0 0 4px 0;">بيان احتساب الزكاة الشرعية السنوية</h1>
            <p style="font-size: 11px; color: #64748b; margin: 0;">Annual Islamic Zakat Liability & Methodology Statement</p>
          </div>

          <!-- Document Metadata Table -->
          <table style="width: 100%; margin-bottom: 16px; font-size: 10px; border: 1px solid #e2e8f0; border-collapse: collapse;">
            <tbody>
              <tr style="background-color: #f8fafc;">
                <td style="padding: 6px 10px; font-weight: bold; border: 1px solid #e2e8f0; width: 25%;">السنة المالية / Year:</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; width: 25%; font-family: monospace; font-weight: bold;">${selectedYear}</td>
                <td style="padding: 6px 10px; font-weight: bold; border: 1px solid #e2e8f0; width: 25%;">طريقة الاحتساب / Method:</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; width: 25%;">تقديرية مبسطة (مكلفين غير منتظمين)</td>
              </tr>
              <tr>
                <td style="padding: 6px 10px; font-weight: bold; border: 1px solid #e2e8f0;">تاريخ الطباعة / Printed On:</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0;">${todayStr}</td>
                <td style="padding: 6px 10px; font-weight: bold; border: 1px solid #e2e8f0;">الرقم المرجعي / Ref No:</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #047857;">${refNo}</td>
              </tr>
              <tr style="background-color: #f8fafc;">
                <td style="padding: 6px 10px; font-weight: bold; border: 1px solid #e2e8f0;">حالة الدفع الشرعي / Status:</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0;" colspan="3">
                  <span style="background-color: ${isZakatPaid ? "#d1fae5" : "#fee2e2"}; color: ${isZakatPaid ? "#065f46" : "#991b1b"}; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 9px;">
                    ${isZakatPaid ? "مسدد ومكتمل / Settled & Released" : "معلق السداد / Unpaid - Awaiting Settlement"}
                  </span>
                  ${isZakatPaid && zakatPaymentDetails ? `<span style="font-size: 9px; color: #475569; margin-right: 8px;">(سُدد من: ${zakatPaymentDetails.paidFromName} في ${zakatPaymentDetails.paidAt?.split("T")[0]})</span>` : ""}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Financial Summary Grid (A4 Compact) -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px;">
            <div style="border: 1px solid #e2e8f0; padding: 8px; border-radius: 6px; background-color: #faf5ff; border-right: 3px solid #8b5cf6;">
              <span style="font-size: 8px; font-weight: bold; color: #6d28d9; display: block;">1. النقدية والسيولة</span>
              <span style="font-size: 12px; font-weight: 900; color: #0f172a; font-family: monospace; display: block; margin-top: 4px;">${workingCapital.toLocaleString("en-US", { minimumFractionDigits: 2 })} <span style="font-size: 8px; font-family: sans-serif;">ريال</span></span>
              <span style="font-size: 7px; color: #64748b; display: block; margin-top: 2px;">أرصدة البنوك والصناديق</span>
            </div>
            <div style="border: 1px solid #e2e8f0; padding: 8px; border-radius: 6px; background-color: #ecfdf5; border-right: 3px solid #10b981;">
              <span style="font-size: 8px; font-weight: bold; color: #047857; display: block;">2. صافي الربح السنوي</span>
              <span style="font-size: 12px; font-weight: 900; color: #0f172a; font-family: monospace; display: block; margin-top: 4px;">${netAnnualProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })} <span style="font-size: 8px; font-family: sans-serif;">ريال</span></span>
              <span style="font-size: 7px; color: #64748b; display: block; margin-top: 2px;">الإيرادات - المصاريف والتكاليف</span>
            </div>
            <div style="border: 1px solid #e2e8f0; padding: 8px; border-radius: 6px; background-color: #f0f9ff; border-right: 3px solid #0072BC;">
              <span style="font-size: 8px; font-weight: bold; color: #0369a1; display: block;">3. الوعاء الزكوي التقديري</span>
              <span style="font-size: 12px; font-weight: 900; color: #0f172a; font-family: monospace; display: block; margin-top: 4px;">${zakatBase.toLocaleString("en-US", { minimumFractionDigits: 2 })} <span style="font-size: 8px; font-family: sans-serif;">ريال</span></span>
              <span style="font-size: 7px; color: #64748b; display: block; margin-top: 2px;">الوعاء = السيولة + صافي الربح</span>
            </div>
            <div style="border: 1px solid #e2e8f0; padding: 8px; border-radius: 6px; background-color: #f0fdf4; border-right: 3px solid #059669;">
              <span style="font-size: 8px; font-weight: bold; color: #059669; display: block;">4. الزكاة المستحقة (2.5778%)</span>
              <span style="font-size: 12px; font-weight: 900; color: #065f46; font-family: monospace; display: block; margin-top: 4px;">${zakatDueAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} <span style="font-size: 8px; font-family: sans-serif;">ريال</span></span>
              <span style="font-size: 7px; color: #047857; display: block; margin-top: 2px;">الوعاء المجموع * نسبة 2.5778%</span>
            </div>
          </div>

          <!-- Detailed Explanatory Panel (الشرح التفصيلي لآلية احتساب الزكاة الشرعية) -->
          <div style="border: 1px solid #d1fae5; padding: 10px 14px; border-radius: 8px; background-color: #f6fdfa; margin-bottom: 16px; font-size: 9px; line-height: 1.5; color: #0f5132;">
            <strong style="font-size: 11px; color: #047857; display: block; margin-bottom: 6px; border-bottom: 1px solid #a3e635; padding-bottom: 2px;">💡 التقرير الشامل التوضيحي لأولياء الأمور والمراجعين - آلية احتساب الزكاة:</strong>
            <ul style="margin: 0; padding-right: 15px; list-style-type: square; space-y: 4px;">
              <li><strong>هل تُقتطع الزكاة من ضريبة القيمة المضافة؟</strong> <span style="color: #1e293b;">قطعاً لا. الضريبة هي مبلغ يتم تحصيله لصالح ميزانية الدولة من المستهلك النهائي. أما الزكاة فهي فريضة شرعية سنوية تُفرض على الأصول النقدية والأرباح الخاصة بالمنشأة (ملكية الشركة القابلة للنماء).</span></li>
              <li><strong>لماذا صافي أرباح العمليات وليس إجمالي الإيرادات؟</strong> <span style="color: #1e293b;">لأن إجمالي الإيرادات يمثل المبيعات فقط دون خصم تكاليف شراء المواد، أجور العمال، فواتير التشغيل والإهلاك. احتساب الزكاة على إجمالي الإيرادات يسبب إجحافاً للمنشأة وضياعاً لسيولتها المخصصة لتسيير العمل. لذا، تأخذ الهيئة (صافي الربح السنوي المعدّل) لتمثيل الزيادة الحقيقية في مال المنشأة.</span></li>
              <li><strong>ما هي السيولة النقدية أو (رأس المال العامل)؟</strong> <span style="color: #1e293b;">تمثل مجموع أرصدة المنشأة النقدية المتوفرة حالياً في جميع حساباتها البنكية وصناديق الخزنة المعتمدة بالريال السعودي. وهي المال الذي حال عليه الحول ومتوفر للاستخدام.</span></li>
              <li><strong>لماذا نسبة الاحتساب هي 2.5778% وليست 2.5%؟</strong> <span style="color: #1e293b;">النسبة الشرعية للزكاة هي 2.5% للسنة الهجرية القمرية (354 يوماً)، وبما أن الدورة المالية والحسابات والتقارير تُعد طبقاً للتقويم الميلادي الشمسي (365 يوماً)، فقد قامت هيئة الزكاة والجمارك بتعديل النسبة لتبلغ 2.5778% لمساواة الـ 11 يوماً الإضافية، لضمان عدم نقص وعاء الزكاة وحقوق مصارفها الشرعية الثمانية.</span></li>
            </ul>
          </div>

          <!-- Breakdown Calculation Table -->
          <h3 style="font-size: 11px; font-weight: 900; color: #0f172a; margin: 0 0 6px 0; padding-bottom: 4px; border-bottom: 1px solid #047857;">تفاصيل الجدول الحسابي للوعاء الزكوي</h3>
          <table style="width: 100%; font-size: 9px; border: 1px solid #e2e8f0; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #f1f5f9; text-align: right; font-weight: bold;">
                <th style="padding: 6px 10px; border: 1px solid #e2e8f0; width: 60%;">البند الزكوي / Zakat Line Parameter</th>
                <th style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: left; width: 40%;">المبلغ بالريال السعودي / Amount (SAR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0;">مجموع الأرصدة البنكية والسيولة النقدية القائمة حالياً (رأس المال المتوفر)</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace; font-weight: bold;">${workingCapital.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; color: #047857;">مجموع مبيعات الفواتير الصادرة دون ضريبة (إجمالي إيرادات المبيعات)</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace;">${annualSalesRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; color: #ef4444;">مجموع فواتير الموردين والرواتب والمصروفات دون ضريبة (التكاليف التشغيلية)</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace; color: #ef4444;">-${annualTotalCosts.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr style="background-color: #ecfdf5; font-weight: bold;">
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; color: #047857;">صافي الأرباح السنوية القابلة للنماء والمضافة للوعاء</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace; color: #047857;">${netAnnualProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr style="background-color: #f8fafc; font-weight: 900; border-top: 2px solid #cbd5e1;">
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">إجمالي الوعاء الزكوي التقديري الخاضع للزكاة (السيولة + صافي أرباح العمليات)</td>
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace; color: #0369a1; font-size: 10px;">
                  ${zakatBase.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>
              <tr style="background-color: #f0fdf4; font-weight: 900; border-top: 2px solid #047857; font-size: 10px;">
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0; color: #065f46;">مبلغ الزكاة الشرعية المستحقة للدفع (الوعاء * 2.5778% للسنة الميلادية)</td>
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace; color: #065f46; font-size: 11px;">
                  ${zakatDueAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} ريال
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Signatures Block -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; margin-top: 30px; font-size: 9px; page-break-inside: avoid;">
            <div style="text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
              <strong style="color: #4b5563;">إعداد وتوقيع المحاسب المالي</strong>
              <p style="margin: 4px 0 0 0; color: #94a3b8;">توقيع وختم الإدارة المالية</p>
            </div>
            <div style="text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
              <strong style="color: #4b5563;">الاعتماد الإداري (رئيس مجلس الإدارة)</strong>
              <p style="margin: 4px 0 0 0; color: #94a3b8;">توقيع وختم المدير التنفيذي المعتمد</p>
            </div>
          </div>
        </div>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <title>${title}</title>
        <meta charset="utf-8" />
        <style>
          ${sharedPrintStyles}
          @media print {
            body { 
              padding: 0 !important; 
              margin: 0 !important; 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
            .page-container {
              width: 210mm;
              height: 297mm; /* Standard A4 height */
              padding: 10mm 15mm !important;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              page-break-after: avoid;
              page-break-inside: avoid;
            }
          }
          body {
            background-color: #f3f4f6;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
          }
          .page-container {
            background-color: #ffffff;
            width: 210mm;
            height: 297mm;
            padding: 12mm 15mm;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 6px 10px;
            text-align: right;
          }
          th {
            background-color: #f1f5f9;
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <!-- Shared Header of Fonoun AlWaleed -->
          <div>
            ${sharedPrintHeader}
            
            <!-- Document Body Content -->
            ${bodyHtml}
          </div>

          <!-- Shared Footer of Fonoun AlWaleed -->
          <div style="margin-top: auto; padding-top: 10px;">
            ${sharedPrintFooter}
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              // Do not close immediately so the user can see it in preview if they want
            }, 800);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast.show && (
        <div className={`fixed top-4 left-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl transition-all ${
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-xs font-bold font-sans">{toast.msg}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Abstract background vector patterns to avoid slop */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight font-sans">
                  {lang === "ar" ? "حاسبة الزكاة والضريبة الذكية" : "Zakat & Tax Smart Calculator"}
                </h1>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {lang === "ar"
                    ? "احتساب الزكاة السنوية وضريبة القيمة المضافة الربعية المستحقة والمدفوعة من البيانات المعتمدة"
                    : "Calculate annual Zakat & quarterly VAT liabilities directly from authenticated records"}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Select Controls */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-white text-xs font-black focus:outline-none cursor-pointer pr-4"
              >
                <option value="2025" className="bg-slate-800 text-white">2025</option>
                <option value="2026" className="bg-slate-800 text-white">2026</option>
                <option value="2027" className="bg-slate-800 text-white">2027</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tab Selector inside header */}
        <div className="relative z-10 flex gap-2 mt-6 border-t border-slate-800 pt-4">
          <button
            onClick={() => setActiveTab("vat")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "vat"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-slate-800/50 text-slate-400 hover:text-white"
            }`}
          >
            <Percent className="w-4 h-4" />
            {lang === "ar" ? "ضريبة القيمة المضافة (ربع سنوي)" : "Value Added Tax (VAT - Quarterly)"}
          </button>
          <button
            onClick={() => setActiveTab("zakat")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "zakat"
                ? "bg-emerald-600 text-white shadow-lg"
                : "bg-slate-800/50 text-slate-400 hover:text-white"
            }`}
          >
            <Coins className="w-4 h-4" />
            {lang === "ar" ? "الزكاة الشرعية المقررة (سنوي)" : "Islamic Zakat (Annual)"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-4" />
          <p className="text-xs text-slate-500 font-bold">
            {lang === "ar" ? "جاري جلب الفواتير وحساب الضريبة والزكاة..." : "Fetching logs & calculating parameters..."}
          </p>
        </div>
      ) : (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* ======================================================== */}
          {/* SECTION 1: VALUE ADDED TAX (VAT) */}
          {/* ======================================================== */}
          {activeTab === "vat" && (
            <>
              {/* Quarter Subtabs */}
              <div className="flex gap-1.5 p-1 bg-slate-100 rounded-2xl w-fit">
                {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setSelectedQuarter(q)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                      selectedQuarter === q
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {q} ({lang === "ar" ? `الربع ${q.replace("Q", "")}` : `Quarter ${q.replace("Q", "")}`})
                  </button>
                ))}
              </div>

              {/* VAT Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Sales VAT (Output) */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 block tracking-wider uppercase">
                      {lang === "ar" ? "ضريبة المخرجات (المبيعات)" : "Output VAT (Sales)"}
                    </span>
                    <div className="text-lg font-black font-mono text-slate-800">
                      {totalSalesVat.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      <span className="text-[10px] font-sans text-slate-500 mr-1 ml-1">SAR</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      {lang === "ar" ? "الفواتير الخاضعة للضريبة:" : "Taxable Sales:"}{" "}
                      <span className="font-mono text-slate-700">{totalSalesAmount.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                    </span>
                  </div>
                  <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                {/* 2. Purchases VAT (Input) */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 block tracking-wider uppercase">
                      {lang === "ar" ? "ضريبة المدخلات المستردة (المشتريات)" : "Input VAT (Purchases & Expenses)"}
                    </span>
                    <div className="text-lg font-black font-mono text-slate-800">
                      {totalPurchasesVat.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      <span className="text-[10px] font-sans text-slate-500 mr-1 ml-1">SAR</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      {lang === "ar" ? "المشتريات الخاضعة للضريبة:" : "Taxable Purchases:"}{" "}
                      <span className="font-mono text-slate-700">{totalPurchasesAmount.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                    </span>
                  </div>
                  <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl">
                    <Percent className="w-5 h-5" />
                  </div>
                </div>

                {/* 3. Net Tax Due */}
                <div className={`p-5 rounded-3xl border shadow-sm flex items-center justify-between ${
                  netVatAmount >= 0
                    ? "bg-rose-50/50 border-rose-100 text-rose-900"
                    : "bg-emerald-50/50 border-emerald-100 text-emerald-900"
                }`}>
                  <div className="space-y-1">
                    <span className={`text-[10px] font-black uppercase tracking-wider block ${
                      netVatAmount >= 0 ? "text-rose-500" : "text-emerald-500"
                    }`}>
                      {netVatAmount >= 0
                        ? lang === "ar" ? "صافي الضريبة المستحقة للدفع" : "Net VAT Payable (Due)"
                        : lang === "ar" ? "الرصيد الدائن المسترد" : "Net Refundable VAT Credit"
                      }
                    </span>
                    <div className={`text-lg font-black font-mono ${netVatAmount >= 0 ? "text-rose-700" : "text-emerald-700"}`}>
                      {Math.abs(netVatAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      <span className="text-[10px] font-sans mr-1 ml-1">SAR</span>
                    </div>
                    <span className="text-[10px] block opacity-75">
                      {netVatAmount >= 0
                        ? lang === "ar" ? "مستحق السداد لـ هيئة الزكاة والجمارك" : "Must be paid to ZATCA Authority"
                        : lang === "ar" ? "رصيد دائن يُرحل للفترة القادمة" : "Credit carried forward to next quarters"
                      }
                    </span>
                  </div>
                  <div className={`p-3.5 rounded-2xl ${netVatAmount >= 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {netVatAmount >= 0 ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* VAT Dynamic Calculation Breakdown Table */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-400" />
                    <h3 className="text-xs font-black text-slate-800">
                      {lang === "ar" ? "معادلة الاحتساب الرياضية والتفصيل" : "Detailed Calculation Formula Breakdown"}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowVatDetails(true)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {lang === "ar" ? "عرض تفاصيل الفواتير" : "View Invoice Logs"}
                    </button>
                    <button
                      onClick={() => triggerPrint(`${lang === "ar" ? "إقرار ضريبة القيمة المضافة" : "VAT Declaration"} ${selectedYear} ${selectedQuarter}`, "vat-print-content")}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      {lang === "ar" ? "طباعة الإقرار" : "Print Declaration"}
                    </button>
                  </div>
                </div>

                <div id="vat-print-content" className="space-y-4">
                  {/* Math Formula Visual Block */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-center gap-4 text-center font-sans">
                    <div className="bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold">
                        {lang === "ar" ? "ضريبة المبيعات" : "Sales VAT (Output)"}
                      </span>
                      <span className="text-sm font-black text-slate-700 font-mono">
                        +{totalSalesVat.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="text-slate-400 font-bold text-lg">-</div>

                    <div className="bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold">
                        {lang === "ar" ? "ضريبة المشتريات" : "Purchases VAT (Input)"}
                      </span>
                      <span className="text-sm font-black text-slate-700 font-mono">
                        -{totalPurchasesVat.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="text-slate-400 font-bold text-lg">=</div>

                    <div className={`px-4 py-2.5 rounded-xl shadow-sm border ${
                      netVatAmount >= 0 ? "bg-rose-50 border-rose-100 text-rose-700" : "bg-emerald-50 border-emerald-100 text-emerald-700"
                    }`}>
                      <span className="text-[10px] block font-bold opacity-75">
                        {lang === "ar" ? "الصافي المستحق/المسترد" : "Net Tax Due/Refundable"}
                      </span>
                      <span className="text-sm font-black font-mono">
                        {netVatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Summary grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-slate-100 p-4 rounded-2xl space-y-2">
                      <h4 className="text-[11px] font-black text-blue-600 block border-b border-slate-100 pb-1.5">
                        {lang === "ar" ? "تفاصيل المبيعات الضريبية" : "Sales VAT Details"}
                      </h4>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">{lang === "ar" ? "إجمالي الفواتير المعتمدة (دون ضريبة):" : "Approved Sales taxable subtotal:"}</span>
                        <span className="font-mono text-slate-700 font-bold">{totalSalesAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">{lang === "ar" ? "معدل ضريبة المبيعات المحسوب:" : "Output VAT rate applied:"}</span>
                        <span className="font-bold text-slate-700">15%</span>
                      </div>
                      <div className="flex justify-between text-[11px] border-t border-dashed border-slate-100 pt-1.5">
                        <span className="text-slate-600 font-bold">{lang === "ar" ? "إجمالي ضريبة المخرجات:" : "Total Output VAT (15%):"}</span>
                        <span className="font-mono text-slate-800 font-black">{totalSalesVat.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</span>
                      </div>
                    </div>

                    <div className="border border-slate-100 p-4 rounded-2xl space-y-2">
                      <h4 className="text-[11px] font-black text-amber-600 block border-b border-slate-100 pb-1.5">
                        {lang === "ar" ? "تفاصيل المشتريات الضريبية" : "Purchases VAT Details"}
                      </h4>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">{lang === "ar" ? "فواتير الموردين المعتمدة:" : "Approved supplier bills subtotal:"}</span>
                        <span className="font-mono text-slate-700">{totalSupplierSubtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">{lang === "ar" ? "المصروفات المباشرة الضريبية:" : "Direct taxed expenses subtotal:"}</span>
                        <span className="font-mono text-slate-700">{totalExpensesSubtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</span>
                      </div>
                      <div className="flex justify-between text-[11px] border-t border-dashed border-slate-100 pt-1.5">
                        <span className="text-slate-600 font-bold">{lang === "ar" ? "إجمالي ضريبة المدخلات المستردة:" : "Total Input VAT (15%):"}</span>
                        <span className="font-mono text-slate-800 font-black">{totalPurchasesVat.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Settle Actions Area */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${isVatPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {isVatPaid ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">{lang === "ar" ? "حالة الإقرار والربط المالي" : "VAT Filing Status"}</span>
                      <span className="text-xs font-black text-slate-700">
                        {isVatPaid
                          ? lang === "ar" ? "تم سداد الضريبة وإقفال الفترة" : "Filed & Paid (Period Closed)"
                          : lang === "ar" ? "معلق السداد والإقرار للهيئة" : "Unpaid / Filing Pending"
                        }
                      </span>
                      {isVatPaid && vatPaymentDetails && (
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          {lang === "ar" ? "مدفوع من:" : "Paid via:"} <span className="font-bold text-slate-600">{vatPaymentDetails.paidFromName}</span> | {vatPaymentDetails.paidAt?.split("T")[0]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isVatPaid ? (
                      <button
                        onClick={() => setShowPaymentModal({
                          isOpen: true,
                          type: "vat",
                          targetId: currentVatDeclarationId,
                          amount: netVatAmount
                        })}
                        disabled={netVatAmount === 0}
                        className={`font-black text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5 ${
                          netVatAmount === 0
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        <Coins className="w-4 h-4" />
                        {lang === "ar" ? "تسجيل سداد الضريبة" : "Record VAT Settlement"}
                      </button>
                    ) : (
                      <div className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-3.5 py-1.5 rounded-xl border border-emerald-100">
                        {lang === "ar" ? "مكتمل ومسدد" : "Paid & Closed"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ======================================================== */}
          {/* SECTION 2: ISLAMIC ZAKAT (ANNUAL) */}
          {/* ======================================================== */}
          {activeTab === "zakat" && (
            <>
              {/* Zakat Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 1. Working Capital */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 block tracking-wider uppercase">
                      {lang === "ar" ? "رأس المال والسيولة النقدية" : "Working Capital & Cash"}
                    </span>
                    <div className="text-base font-black font-mono text-slate-800">
                      {workingCapital.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      <span className="text-[9px] font-sans text-slate-500 mr-1 ml-1">SAR</span>
                    </div>
                    <span className="text-[9px] text-slate-400 block">
                      {lang === "ar" ? "رصيد البنك والسيولة في الصندوق" : "Total of all Bank & Cash Box balances"}
                    </span>
                  </div>
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Building2 className="w-4.5 h-4.5" />
                  </div>
                </div>

                {/* 2. Adjusted Net Profit */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 block tracking-wider uppercase">
                      {lang === "ar" ? "صافي الربح السنوي المعتمد" : "Adjusted Net Profit"}
                    </span>
                    <div className={`text-base font-black font-mono ${netAnnualProfit >= 0 ? "text-slate-800" : "text-rose-600"}`}>
                      {netAnnualProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      <span className="text-[9px] font-sans text-slate-500 mr-1 ml-1">SAR</span>
                    </div>
                    <span className="text-[9px] text-slate-400 block">
                      {lang === "ar" ? "الإيرادات المعتمدة مطروحاً منها المصاريف" : "Annual Sales minus Supplier Costs"}
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <TrendingUp className="w-4.5 h-4.5" />
                  </div>
                </div>

                {/* 3. Estimated Zakat Base */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 block tracking-wider uppercase">
                      {lang === "ar" ? "وعاء الزكاة التقديري" : "Estimated Zakat Base"}
                    </span>
                    <div className="text-base font-black font-mono text-slate-800">
                      {zakatBase.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      <span className="text-[9px] font-sans text-slate-500 mr-1 ml-1">SAR</span>
                    </div>
                    <span className="text-[9px] text-slate-400 block">
                      {lang === "ar" ? "رأس المال + صافي أرباح السنة" : "Zakat Base (Cash + Net Profit)"}
                    </span>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <Calculator className="w-4.5 h-4.5" />
                  </div>
                </div>

                {/* 4. Calculated Zakat Due */}
                <div className="bg-emerald-50/70 p-5 rounded-3xl border border-emerald-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-emerald-700 block tracking-wider uppercase">
                      {lang === "ar" ? "الزكاة الشرعية المستحقة (2.5778%)" : "Islamic Zakat Due (2.5778%)"}
                    </span>
                    <div className="text-base font-black font-mono text-emerald-800">
                      {zakatDueAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      <span className="text-[9px] font-sans mr-1 ml-1">SAR</span>
                    </div>
                    <span className="text-[9px] text-emerald-600 block">
                      {lang === "ar" ? "النسبة السنوية للسنوات الميلادية" : "Gregorian annual rate for commercial accounts"}
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                    <Coins className="w-4.5 h-4.5" />
                  </div>
                </div>
              </div>

              {/* Zakat Explanation and Method */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-black text-slate-800">
                      {lang === "ar" ? "تفصيل طريقة احتساب الزكاة الشرعية للسنة" : "Methodology of Zakat Calculation & Formula"}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowZakatDetails(true)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {lang === "ar" ? "عرض تفاصيل الحسابات" : "View Accounts Balances"}
                    </button>
                    <button
                      onClick={() => triggerPrint(`${lang === "ar" ? "احتساب الزكاة المقررة للسنة المالية" : "Calculated Zakat Statement for FY"} ${selectedYear}`, "zakat-print-content")}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      {lang === "ar" ? "طباعة بيان الزكاة" : "Print Zakat Statement"}
                    </button>
                  </div>
                </div>

                <div id="zakat-print-content" className="space-y-4 font-sans text-xs">
                  {/* Zakat Knowledge Hub - Brand Aligned Educational Panel */}
                  <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100/80 space-y-4">
                    <div className="border-b border-emerald-200/60 pb-3">
                      <h4 className="text-sm font-black text-emerald-800 flex items-center gap-2">
                        <span>💡</span>
                        {lang === "ar" ? "دليل المعرفة والاحتساب الزكوي المبسط للمنشأة" : "Simplified Zakat Knowledge & Calculation Guide"}
                      </h4>
                      <p className="text-[11px] text-emerald-700/80 mt-1 leading-relaxed">
                        {lang === "ar"
                          ? "تم بناء هذه الأداة وفق قواعد الاحتساب التقديري لهيئة الزكاة والضريبة والجمارك (ZATCA) لتوفير الشفافية الكاملة لأولياء الأمور والملاك. إليك توضيح مبسط للأسئلة الشائعة حول كيفية احتساب زكاتكم:"
                          : "This tool is structured in accordance with the simplified estimation rules of ZATCA in Saudi Arabia. Here is a clear breakdown of the Zakat principles applied:"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* FAQ 1 */}
                      <div className="bg-white p-4 rounded-2xl shadow-xs border border-emerald-100 flex flex-col justify-between">
                        <div>
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-md">
                            {lang === "ar" ? "الزكاة والضريبة" : "Zakat vs. VAT"}
                          </span>
                          <h5 className="text-[11px] font-black text-slate-800 mt-2">
                            {lang === "ar" ? "هل تؤخذ الزكاة من الضريبة؟" : "Is Zakat taken from VAT?"}
                          </h5>
                          <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                            {lang === "ar"
                              ? "قطعاً لا. ضريبة القيمة المضافة (VAT) هي استقطاع غير مباشر يُحصّل من المستهلك لصالح الدولة. أما الزكاة فهي ركن شرعي سنوي يُفرض على أصول وسيولة المنشأة وأرباحها النامية لإنفاقها في مصارفها الشرعية الثمانية."
                              : "Absolutely not. VAT is an indirect tax collected from the customer on behalf of the state. Zakat is an annual religious duty levied on the business's own wealth and capital assets."}
                          </p>
                        </div>
                      </div>

                      {/* FAQ 2 */}
                      <div className="bg-white p-4 rounded-2xl shadow-xs border border-emerald-100 flex flex-col justify-between">
                        <div>
                          <span className="bg-indigo-100 text-indigo-800 text-[9px] font-black px-2 py-0.5 rounded-md">
                            {lang === "ar" ? "وعاء الزكاة" : "Zakat Base components"}
                          </span>
                          <h5 className="text-[11px] font-black text-slate-800 mt-2">
                            {lang === "ar" ? "لماذا لا تؤخذ من الإيرادات الكلية؟" : "Why not use total revenue?"}
                          </h5>
                          <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                            {lang === "ar"
                              ? "لأن إجمالي الإيرادات يمثل مبيعات المنشأة دون خصم تكاليف التشغيل، فواتير الموردين، الأجور والالتزامات. احتساب الزكاة عليها يجحف بالمنشأة؛ لذا يتم أخذ السيولة النقدية (رأس المال العامل) ويُضاف إليها صافي الأرباح السنوية الفعلية."
                              : "Because total revenues include the cost of sales, worker salaries, and direct expenses. Calculating Zakat on gross revenues would harm liquidity; thus, only the net profit is added to the liquid cash base."}
                          </p>
                        </div>
                      </div>

                      {/* FAQ 3 */}
                      <div className="bg-white p-4 rounded-2xl shadow-xs border border-emerald-100 flex flex-col justify-between">
                        <div>
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-md">
                            {lang === "ar" ? "النسبة المعدلة 2.5778%" : "Adjusted Rate 2.5778%"}
                          </span>
                          <h5 className="text-[11px] font-black text-slate-800 mt-2">
                            {lang === "ar" ? "لماذا النسبة 2.5778% وليست 2.5%؟" : "Why 2.5778% instead of 2.5%?"}
                          </h5>
                          <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                            {lang === "ar"
                              ? "النسبة الشرعية هي 2.5% للسنوات الهجرية القمرية (354 يوماً). ولأن الحسابات والدورة المالية للشركات تُعد بالتقويم الميلادي (365 يوماً)، يتم تعديل النسبة إلى 2.5778% للتعويض عن الـ 11 يوماً الإضافية حمايةً لحقوق مصارف الزكاة."
                              : "The standard Sharia rate is 2.5% for Hijri lunar years. Since commercial fiscal accounts follow the Gregorian calendar (365 days), ZATCA adjusts the rate to 2.5778% to account for the extra 11 solar days."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Math Formula Visual Block */}
                    <div className="bg-white p-4 rounded-2xl border border-emerald-100/60 flex flex-col md:flex-row items-center justify-around text-center gap-4">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold">1. {lang === "ar" ? "السيولة والنقدية بالبنوك والصناديق" : "Working Capital (Cash/Bank)"}</span>
                        <strong className="text-xs font-black text-slate-700 font-mono">+{workingCapital.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</strong>
                      </div>
                      <div className="text-slate-400 font-bold text-lg">+</div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold">2. {lang === "ar" ? "صافي أرباح العمليات السنوية المعدل" : "Adjusted Net Annual Profit"}</span>
                        <strong className="text-xs font-black text-slate-700 font-mono">+{netAnnualProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</strong>
                      </div>
                      <div className="text-slate-400 font-bold text-lg">=</div>
                      <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                        <span className="text-[9px] text-emerald-800 block font-bold">{lang === "ar" ? "الوعاء الزكوي الخاضع للنسبة" : "Combined Zakat Base"}</span>
                        <strong className="text-xs font-black text-emerald-800 font-mono">{zakatBase.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</strong>
                      </div>
                    </div>
                  </div>

                  {/* Math Breakdown Table */}
                  <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="p-3 text-xs font-black text-slate-700">{lang === "ar" ? "بند الحساب" : "Calculation Line Item"}</th>
                          <th className="p-3 text-xs font-black text-slate-700 text-right">{lang === "ar" ? "القيمة بالريال" : "Amount (SAR)"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="p-3 text-slate-600">{lang === "ar" ? "مجموع الأرصدة البنكية والسيولة النقدية" : "Combined cash and bank balances"}</td>
                          <td className="p-3 font-mono text-right text-slate-800 font-bold">{workingCapital.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-slate-600">{lang === "ar" ? "إيرادات المبيعات السنوية المعتمدة (دون ضريبة)" : "Approved customer invoice sales (excl. VAT)"}</td>
                          <td className="p-3 font-mono text-right text-slate-800">{annualSalesRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-slate-600">{lang === "ar" ? "مشتريات الموردين وتكلفة المصروفات (دون ضريبة)" : "Supplier purchases and direct expenses (excl. VAT)"}</td>
                          <td className="p-3 font-mono text-right text-rose-600">-{annualTotalCosts.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr className="bg-slate-50/50 font-bold">
                          <td className="p-3 text-slate-700">{lang === "ar" ? "صافي أرباح العمليات السنوية" : "Annual Net Profit"}</td>
                          <td className="p-3 font-mono text-right text-emerald-600">{netAnnualProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr className="bg-slate-100 font-black">
                          <td className="p-3 text-slate-800">{lang === "ar" ? "وعاء الزكاة الخاضع للمكلف" : "Estimated Zakat Base Subtotal"}</td>
                          <td className="p-3 font-mono text-right text-slate-900">{zakatBase.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr className="bg-emerald-50/30 font-black text-emerald-800">
                          <td className="p-3">{lang === "ar" ? "الزكاة الشرعية المستحقة (2.5778% من الوعاء)" : "Islamic Zakat Due (2.5778% of Base)"}</td>
                          <td className="p-3 font-mono text-right">{zakatDueAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Settle Actions Area */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${isZakatPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {isZakatPaid ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">{lang === "ar" ? "حالة الدفع الشرعي والإقفال" : "Zakat Filing Status"}</span>
                      <span className="text-xs font-black text-slate-700">
                        {isZakatPaid
                          ? lang === "ar" ? "تم دفع الزكاة وإصدار براءة الذمة" : "Zakat Paid & Settled (FY Closed)"
                          : lang === "ar" ? "معلق السداد والإقرار للهيئة" : "Unpaid / Filing Pending"
                        }
                      </span>
                      {isZakatPaid && zakatPaymentDetails && (
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          {lang === "ar" ? "مدفوع من:" : "Paid via:"} <span className="font-bold text-slate-600">{zakatPaymentDetails.paidFromName}</span> | {zakatPaymentDetails.paidAt?.split("T")[0]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isZakatPaid ? (
                      <button
                        onClick={() => setShowPaymentModal({
                          isOpen: true,
                          type: "zakat",
                          targetId: currentZakatPaymentId,
                          amount: zakatDueAmount
                        })}
                        disabled={zakatDueAmount <= 0}
                        className={`font-black text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5 ${
                          zakatDueAmount <= 0
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                      >
                        <Coins className="w-4 h-4" />
                        {lang === "ar" ? "تسجيل سداد الزكاة" : "Record Zakat Settle"}
                      </button>
                    ) : (
                      <div className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-3.5 py-1.5 rounded-xl border border-emerald-100">
                        {lang === "ar" ? "براءة ذمة - مكتمل ومسدد" : "Paid & FY Closed"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: VAT INVOICE LIST DETAILS */}
      {/* ======================================================== */}
      {showVatDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-black">
                  {lang === "ar"
                    ? `تفاصيل فواتير ضريبة القيمة المضافة للربع ${selectedQuarter.replace("Q", "")} لعام ${selectedYear}`
                    : `VAT Invoice Records for FY ${selectedYear} ${selectedQuarter}`
                  }
                </h3>
              </div>
              <button
                onClick={() => setShowVatDetails(false)}
                className="text-slate-400 hover:text-white transition p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Sales Invoices List */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-blue-600 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  {lang === "ar" ? "فواتير المبيعات الصادرة (ضريبة المخرجات)" : "Customer Invoices (Output VAT)"}
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[9px] font-bold">
                    {quarterSalesInvoices.length} {lang === "ar" ? "فاتورة معتمدة" : "approved bills"}
                  </span>
                </h4>

                {quarterSalesInvoices.length === 0 ? (
                  <p className="text-slate-400 text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-100">
                    {lang === "ar" ? "لا توجد فواتير مبيعات معتمدة خلال هذه الفترة" : "No approved customer invoices for this period"}
                  </p>
                ) : (
                  <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="p-2.5 text-[10px] font-black text-slate-600">{lang === "ar" ? "رقم الفاتورة" : "Invoice No"}</th>
                          <th className="p-2.5 text-[10px] font-black text-slate-600">{lang === "ar" ? "التاريخ" : "Date"}</th>
                          <th className="p-2.5 text-[10px] font-black text-slate-600">{lang === "ar" ? "العميل" : "Customer"}</th>
                          <th className="p-2.5 text-[10px] font-black text-slate-600 text-right">{lang === "ar" ? "المبلغ الخاضع للضريبة" : "Taxable Subtotal"}</th>
                          <th className="p-2.5 text-[10px] font-black text-slate-600 text-right">{lang === "ar" ? "قيمة الضريبة (15%)" : "VAT Amount"}</th>
                          <th className="p-2.5 text-[10px] font-black text-slate-600 text-right">{lang === "ar" ? "الإجمالي" : "Grand Total"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {quarterSalesInvoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold font-mono text-slate-700">{inv.invoiceNo}</td>
                            <td className="p-2.5 text-slate-500">{inv.invoiceDate}</td>
                            <td className="p-2.5 text-slate-700">{inv.customerName}</td>
                            <td className="p-2.5 font-mono text-right text-slate-600">{inv.taxableAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                            <td className="p-2.5 font-mono text-right text-slate-800 font-bold">{inv.vatTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                            <td className="p-2.5 font-mono text-right text-slate-900">{inv.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Purchases & Expenses List */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-amber-600 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <Percent className="w-4 h-4" />
                  {lang === "ar" ? "مشتريات الموردين والمصروفات المباشرة (ضريبة المدخلات)" : "Supplier Bills & Direct Expenses (Input VAT)"}
                  <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-[9px] font-bold">
                    {quarterSupplierInvoices.length + quarterExpenses.length} {lang === "ar" ? "سجل معتمد" : "approved logs"}
                  </span>
                </h4>

                {quarterSupplierInvoices.length === 0 && quarterExpenses.length === 0 ? (
                  <p className="text-slate-400 text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-100">
                    {lang === "ar" ? "لا توجد فواتير شراء أو مصروفات خاضعة للضريبة" : "No approved purchases or direct taxed expenses logged"}
                  </p>
                ) : (
                  <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="p-2.5 text-[10px] font-black text-slate-600">{lang === "ar" ? "الرقم" : "Reference No"}</th>
                          <th className="p-2.5 text-[10px] font-black text-slate-600">{lang === "ar" ? "النوع" : "Type"}</th>
                          <th className="p-2.5 text-[10px] font-black text-slate-600">{lang === "ar" ? "التاريخ" : "Date"}</th>
                          <th className="p-2.5 text-[10px] font-black text-slate-600">{lang === "ar" ? "الجهة" : "Entity"}</th>
                          <th className="p-2.5 text-[10px] font-black text-slate-600 text-right">{lang === "ar" ? "المبلغ دون ضريبة" : "Subtotal"}</th>
                          <th className="p-2.5 text-[10px] font-black text-slate-600 text-right">{lang === "ar" ? "الضريبة المستردة" : "Input VAT"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {/* Supplier invoices */}
                        {quarterSupplierInvoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold font-mono text-slate-700">{inv.invoiceNo}</td>
                            <td className="p-2.5 text-blue-600 font-bold">{lang === "ar" ? "فاتورة مورد" : "Supplier Bill"}</td>
                            <td className="p-2.5 text-slate-500">{inv.invoiceDate}</td>
                            <td className="p-2.5 text-slate-700">{inv.supplierName}</td>
                            <td className="p-2.5 font-mono text-right text-slate-600">{inv.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                            <td className="p-2.5 font-mono text-right text-slate-800 font-bold">{inv.vatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                        {/* Expenses */}
                        {quarterExpenses.map((exp) => (
                          <tr key={exp.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold font-mono text-slate-700">{exp.expenseNo}</td>
                            <td className="p-2.5 text-amber-600 font-bold">{lang === "ar" ? "مصروف مباشر" : "Direct Expense"}</td>
                            <td className="p-2.5 text-slate-500">{exp.expenseDate}</td>
                            <td className="p-2.5 text-slate-700">{exp.supplierName}</td>
                            <td className="p-2.5 font-mono text-right text-slate-600">{exp.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                            <td className="p-2.5 font-mono text-right text-slate-800 font-bold">{exp.vatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 flex items-center justify-end border-t border-slate-100">
              <button
                onClick={() => setShowVatDetails(false)}
                className="bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-900 transition"
              >
                {lang === "ar" ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ZAKAT ACCOUNT DETAILS */}
      {/* ======================================================== */}
      {showZakatDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black">
                  {lang === "ar"
                    ? `تفاصيل أرصدة رأس المال والسيولة النقدية لعام ${selectedYear}`
                    : `Working Capital Balances for FY ${selectedYear}`
                  }
                </h3>
              </div>
              <button
                onClick={() => setShowZakatDetails(false)}
                className="text-slate-400 hover:text-white transition p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Bank Accounts */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  {lang === "ar" ? "أرصدة الحسابات البنكية النشطة" : "Active Bank Accounts"}
                </h4>
                {bankAccounts.length === 0 ? (
                  <p className="text-slate-400 text-center py-2">{lang === "ar" ? "لا توجد حسابات بنكية مسجلة" : "No active bank accounts found"}</p>
                ) : (
                  <div className="space-y-2">
                    {bankAccounts.map(b => (
                      <div key={b.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div>
                          <span className="font-bold text-slate-700 block">{b.bankName}</span>
                          <span className="text-[10px] text-slate-400">{b.accountName}</span>
                        </div>
                        <span className="font-mono font-black text-slate-900">{b.currentBalance.toLocaleString("en-US")} SAR</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cash Boxes */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  {lang === "ar" ? "أرصدة صناديق الخزنة والنقدية" : "Active Cash Boxes"}
                </h4>
                {cashBoxes.length === 0 ? (
                  <p className="text-slate-400 text-center py-2">{lang === "ar" ? "لا توجد صناديق نقدية مسجلة" : "No active cash boxes found"}</p>
                ) : (
                  <div className="space-y-2">
                    {cashBoxes.map(c => (
                      <div key={c.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div>
                          <span className="font-bold text-slate-700 block">{c.cashBoxName}</span>
                        </div>
                        <span className="font-mono font-black text-slate-900">{c.currentBalance.toLocaleString("en-US")} SAR</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals Summary */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
                <span className="text-[11px] font-bold">{lang === "ar" ? "إجمالي السيولة النقدية القابلة للزكاة:" : "Combined Liquid Capital:"}</span>
                <span className="font-mono font-black text-base text-emerald-400">{workingCapital.toLocaleString("en-US")} SAR</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 flex items-center justify-end border-t border-slate-100">
              <button
                onClick={() => setShowZakatDetails(false)}
                className="bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-900 transition"
              >
                {lang === "ar" ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: SUBMIT / SETTLE PAYMENT FOR TAX/ZAKAT */}
      {/* ======================================================== */}
      {showPaymentModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl border border-slate-100">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black">
                  {showPaymentModal.type === "vat"
                    ? lang === "ar" ? "تسجيل سداد ضريبة القيمة المضافة" : "Settle VAT Declaration"
                    : lang === "ar" ? "تسجيل سداد الزكاة السنوية" : "Settle Annual Zakat"
                  }
                </h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(prev => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-white transition p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">{lang === "ar" ? "قيمة المبلغ المطلوب سداده" : "Required Settle Amount"}</span>
                <span className="text-xl font-mono font-black text-slate-900">
                  {Math.abs(showPaymentModal.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  <span className="text-xs font-sans text-slate-500 mr-1 ml-1">SAR</span>
                </span>
                <span className="text-[9px] text-slate-400 block mt-1">
                  {showPaymentModal.type === "vat"
                    ? lang === "ar" ? `للفترة المالية: ${showPaymentModal.targetId.replace("_", " ")}` : `For Period: ${showPaymentModal.targetId.replace("_", " ")}`
                    : lang === "ar" ? `للسنة المالية: ${showPaymentModal.targetId}` : `For Fiscal Year: ${showPaymentModal.targetId}`
                  }
                </span>
              </div>

              {/* Payment source type */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-600 block">{lang === "ar" ? "الدفع من" : "Pay From"}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentForm(prev => ({ ...prev, paidFromType: "Bank" }))}
                    className={`p-2.5 rounded-xl border text-center font-bold transition flex items-center justify-center gap-1.5 ${
                      paymentForm.paidFromType === "Bank"
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    {lang === "ar" ? "حساب بنكي" : "Bank Account"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentForm(prev => ({ ...prev, paidFromType: "Cash" }))}
                    className={`p-2.5 rounded-xl border text-center font-bold transition flex items-center justify-center gap-1.5 ${
                      paymentForm.paidFromType === "Cash"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <Coins className="w-4 h-4" />
                    {lang === "ar" ? "صندوق نقدية" : "Cash Box"}
                  </button>
                </div>
              </div>

              {/* Account Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-600 block">{lang === "ar" ? "اختر الحساب المالي" : "Select Financial Account"}</label>
                <select
                  value={paymentForm.paidFromId}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, paidFromId: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-800"
                >
                  <option value="">{lang === "ar" ? "-- اختر حساباً --" : "-- Select Account --"}</option>
                  {paymentForm.paidFromType === "Bank"
                    ? bankAccounts.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} - {b.accountName} ({b.currentBalance.toLocaleString("en-US")} SAR)
                        </option>
                      ))
                    : cashBoxes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.cashBoxName} ({c.currentBalance.toLocaleString("en-US")} SAR)
                        </option>
                      ))}
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-600 block">{lang === "ar" ? "ملاحظات إضافية" : "Additional Notes"}</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  placeholder={lang === "ar" ? "رقم المرجع الضريبي للهيئة، ملاحظات السداد..." : "Tax filing number, references..."}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-800 text-xs"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setShowPaymentModal(prev => ({ ...prev, isOpen: false }))}
                className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-50 transition"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={handleSettlePaymentSubmit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-2 rounded-xl shadow-sm transition"
              >
                {lang === "ar" ? "تأكيد واعتماد الدفع" : "Confirm & Settle"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
