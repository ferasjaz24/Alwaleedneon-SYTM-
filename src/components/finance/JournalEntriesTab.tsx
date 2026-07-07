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
  sourceModule: "Manual" | "Customer Invoice" | "Revenue Receipt" | "Bank Transfer" | "Adjustment";
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

  const loadData = async () => {
    setLoading(true);
    try {
      const entSnap = await getDocs(collection(db, "journal_entries"));
      const entList = entSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as JournalEntry))
        .filter(x => !x.isDeleted)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

      // If approved directly, apply impact
      if (journalForm.status === "Approved") {
        await applyJournalImpactToCashBank(jvId);
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
    return matchNo && matchStat;
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
          <button
            onClick={() => setShowTestModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white py-2.5 px-5 rounded-xl font-extrabold text-sm shadow-md transition-all flex items-center gap-2"
          >
            <span>⚡</span> اختبار التدفق المالي التلقائي (Test Flow)
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">بحث برقم القيد</label>
          <input
            type="text"
            value={searchNo}
            onChange={(e) => setSearchNo(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs"
            placeholder="JV-XXXX"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">فلتر حالة القيد</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs bg-white font-semibold text-slate-700"
          >
            <option value="all">كل القيود (النشطة)</option>
            <option value="Draft">مسودة (Draft)</option>
            <option value="Approved">معتمد ومرحل (Approved)</option>
            <option value="Cancelled">ملغى ومجمد</option>
          </select>
        </div>
        <div className="flex items-end pb-1 text-slate-400 font-bold text-xs">
          • جميع القيود المعتمدة (Approved) يرحل أثرها للبنك والصندوق فوراً.
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
            <table className="w-full text-right text-xs">
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
                              onClick={() => openJournalForm(jv)}
                              className="text-[#0072BC] hover:bg-sky-50 py-1 px-1.5 rounded"
                            >
                              📝
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
                  <table className="w-full text-right text-[11px]">
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
    </div>
  );
}
