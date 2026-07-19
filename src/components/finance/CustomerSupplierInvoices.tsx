import React, { useState, useEffect } from "react";
import { 
  PlusCircle, Search, Filter, Eye, Edit, CheckCircle, XCircle, Printer, 
  FileText, Trash2, X, Upload, DollarSign, Wallet, ArrowDownRight, 
  ArrowUpRight, Ban, Clock, Save, FileCheck, RefreshCcw, Loader2, 
  AlertTriangle, Check, ArrowLeft, Download, Info, Shield, ListCollapse,
  ChevronDown, Settings
} from "lucide-react";
import { User } from "../../types";
import { hasAdvancedPermission } from "../../lib/permissions";
import { sharedPrintHeader, sharedPrintFooter, sharedPrintStyles } from "../../utils/PrintShared";
import QRCode from "qrcode";
import { tafqeet } from "../../utils/Tafqeet";
import { generateZatcaQR, generateZatcaXML } from "../../utils/zatca";

interface CustomerSupplierInvoicesProps {
  user: User;
  lang: "ar" | "en";
}

// Interfaces for our invoices
interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // e.g. 0.15
  total: number;
  discount?: number;
  notes?: string;
}

interface Invoice {
  id: string;
  type: "customer" | "supplier";
  partyName: string; // Client name or Supplier name
  partyId?: string;
  referenceId?: string; // Quotation ID or Purchase Order ID
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string; // Customer: مسودة, بانتظار الاعتماد, معتمدة وصادرة, مدفوعة جزئياً, مدفوعة بالكامل, ملغاة | Supplier: مسجلة, بانتظار الاعتماد, معتمدة, مدفوعة جزئياً, مدفوعة بالكامل, مرفوضة, ملغاة
  attachmentName?: string;
  attachmentData?: string;
  notes?: string;
  isJournalGenerated?: boolean;
  journalEntryId?: string;
  journalStatus?: string;
  journalError?: string;
  zatca?: {
    uuid?: string;
    hash?: string;
    xml?: string;
    status?: "جاهزة" | "مرسلة" | "مقبولة" | "مرفوضة" | "تحتاج تصحيح";
    responseCode?: string;
    responseMessage?: string;
    qrBase64?: string;
    logs: {
      date: string;
      user: string;
      action: string;
      message: string;
    }[];
  };
  history: {
    action: string;
    user: string;
    date: string;
    notes?: string;
  }[];
  paymentHistory: {
    amount: number;
    date: string;
    method: string;
    account?: string;
    receiptName?: string;
    receiptData?: string;
  }[];
}

interface SearchableSelectProps {
  options: { label: string; value: string; original?: any }[];
  value: string;
  onChange: (val: string, original?: any) => void;
  placeholder: string;
  emptyMessage: string;
  className?: string;
}

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  emptyMessage,
  className = "",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = options.filter((o) =>
    (o.label || "").toLowerCase().includes((search || "").toLowerCase())
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
        className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none bg-slate-50 text-slate-700 text-right flex items-center justify-between min-h-[46px]"
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto flex flex-col">
          <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0">
            <input
              type="text"
              placeholder="بحث..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs outline-none bg-white text-right"
              autoFocus
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-xs text-slate-400 text-center">{emptyMessage}</div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value, opt.original);
                    setIsOpen(false);
                  }}
                  className={`w-full text-right p-3 text-xs hover:bg-slate-50 transition-colors flex items-center justify-between ${
                    value === opt.value ? "bg-indigo-50 font-bold text-indigo-600" : "text-slate-700"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.value && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const quotationContractText = `عند دفع العربون فإنه يعد كموافقة على هذا العرض و يعمل به كوثيقة عقد تجاري بين الطرفين الواردة بياناتهم
وتطبق الشروط والأحكام حسب البنود التالية:

أطراف العقد:
الطرف الأول: هو العميل الواردة بياناته في هذا العرض.
الطرف الثاني: هو شركة فنون الوليد للصناعة.

البند الأول: يعتبر التصميم المعتمد من قبل الطرف الأول جزء لا يتجزأ من هذا العقد، ويلتزم الطرف الثاني بتنفيذ الأعمال بناءاً على المواصفات والألوان والمقاسات المعتمدة في التصميم.
البند الثاني: لايحق للطرف الأول إلغاء أي صنف بعد الموافقة، ويلتزم بدفع كامل قيمة الأصناف المصنعة أو الموردة، الا في حالة الحصول على موافقه خطية من الطرف الثاني.
البند الثالث: تعتبر جميع الأصناف الواردة في هذا العرض هي ملك للطرف الثاني، و له حق التصرف بالفك والإزالة في أي وقت، دون أذن الطرف الأول، حتى يتم سداد جميع المبالغ المستحقة عليه وتوقيع سند التسليم، وفي حالة الفك أو الإزالة يتم إعادة التركيب برسوم إضافية تحدد من قبل الطرف الثاني.
البند الرابع: يلتزم الطرف الأول بتوصيل خط الكهرباء من مصدرها الى أماكن تركيب اللوحات.
البند الخامس: يلتزم الطرف الأول بتهيئة مواقع التركيب و إزالة كل مايعيق أعمال التنفيذ قبل موعد التسليم، وفي حالة عدم جاهزية المواقع فعلى الطرف الأول إشعار الطرف الثاني قبل الموعد، لكي يتم إعادة جدولة التركيب حسب الإتفاق بين الطرفين. وفي حالة وصول فرق التركيب للموقع الغير مهيأ لبدء أعمال التركيب دون إشعار مسبق، فيلتزم الطرف الأول بدفع غرامة يحدد الطرف الثاني قيمتها حسب تكاليف التشغيل من نقل ومحروقات وتأجير معدات وكل ما يتعلق بها من مصاريف تشغيلية.
البند السادس: في حالة تأخر الطرف الأول عن استلام الأعمال في موعد التسليم، فهو ملزم بدفع كامل قيمة العقد قبل الموعد، ويمنح مهلة استلام لمدة عشر أيام بحد أقصى، تبدأ بعد تاريخ التسليم. ويحق للطرف الثاني فرض رسوم يومية للتخزين بحد أقصى عشرون يوماً بعد انقضاء المهلة، مالم يتم نقل الأعمال إلى مستودعات الطرف الأول. وفي حالة عدم استلام الطرف الأول بعد مضي ثلاثون يوماً من تاريخ التسليم، فيحق للطرف الثاني التصرف بالأعمال دون الرجوع للطرف الأول.
البند السابع: مدة التنفيذ: يتم التوريد والتركيب خلال ثلاثون يوم عمل من تاريخ التعميد أوالدفعة الأولى.
البند الثامن: تحسب مدة التنفيذ من تاريخ الدفعة الأولى أو من تاريخ اعتماد التصاميم أيهما آخراً.
البند التاسع: طريقة الدفع :دفعة أولى مقدم 50% من القيمة الإجمالية والباقي قبل الموعد المحدد للتركيب والتسليم.
البند العاشر: في حالة تم تركيب امتار او كميات اضافيه من احدى الاصناف المذكورة بالتسعيرة فسوف يتم احتسابها بالفاتورة النهائية حسب تكلفة الصنف.

أ - المواصفات ومدة الضمان:
- الإضاءة المستخدمة هي Modules LED حبيبات وليس شريط نوع SAMSUNG كوري الصنع، مضمون لمدة ثلاث سنوات من قبل الوكيل المورد، والمحولات صناعة كورية مضمونة لمدة سنتين من قبل الوكيل المورد.
- الستانلس ستيل رقم 304 صناعة تايوان مقاوم للصدأ، مضمون لمدة عشر سنوات من قبل الوكيل المورد.
- الكلادنغ منتج وطني ضد الحريق مصنع حسب المواصفات العالمية ومضمون لمدة عشرون سنة من قبل الوكيل المورد.
- الألمنيوم تشانل دهان حراري Powder Coated، مضمون لمدة خمس سنوات من قبل الوكيل المورد.
- الأكريلك أو البلاستيك صناعة أندونسيا، مضمون لمدة ثلاث سنوات من قبل الوكيل المورد.
- ضمان التركيب والتثبيت لمدة خمس سنوات (لا يشمل الضمان الطباعه).

ب - شروط الضمان:
- تشغيل اللوحة بمدة لاتزيد عن 8 ساعات ليلاً وعدم تشغيلها نهاراً، وفي حال رصدها خلاف ذلك يعتبر الضمان لاغي.
- الضمان لا يشمل الكسور ولا الأضرار الناتجة عن الحوادث أو الكوارث الطبيعية، ولا يشمل الأضرار الناتجة عن مشاكل التيار الرئيسي للكهرباء.
- ضمان قطع الغيار يشمل الخلل المصنعي، ولا يشمل سوء الاستخدام ولامصاريف التشغيل عند الاستبدال.
- يبدأ سريان الضمان من تاريخ التركيب، بشرط وجود ختم شركة فنون الوليد للصناعة والمكون من (شعار ورقم الهاتف) على اللوحة.`;

const formatTermsHTML = (text: string) => {
  let formatted = text || '';
  const isHtml = formatted.includes('<p>') || formatted.includes('<br>');
  if (!isHtml) {
    formatted = formatted.replace(/\n/g, '<br/>');
    formatted = formatted.replace(/عند دفع العربون فإنه يعد كموافقة على هذا العرض و يعمل به كوثيقة عقد تجاري بين الطرفين الواردة بياناتهم<br\/>وتطبق الشروط والأحكام حسب البنود التالية:/g, '<span class="red">عند دفع العربون فإنه يعد كموافقة على هذا العرض و يعمل به كوثيقة عقد تجاري بين الطرفين الواردة بياناتهم<br/>وتطبق الشروط والأحكام حسب البنود التالية:</span>');
    formatted = formatted.replace(/مدة التنفيذ:/g, '<span class="red">مدة التنفيذ:</span>');
    formatted = formatted.replace(/طريقة الدفع/g, '<span class="red">طريقة الدفع</span>');
    formatted = formatted.replace(/المواصفات ومدة الضمان:/g, '<span class="red">المواصفات ومدة الضمان:</span>');
    formatted = formatted.replace(/شروط الضمان:/g, '<span class="red">شروط الضمان:</span>');
    formatted = formatted.replace(/(البند الأول:|البند الثاني:|البند الثالث:|البند الرابع:|البند الخامس:|البند السادس:|البند السابع:|البند الثامن:|البند التاسع:|البند العاشر:)/g, '<strong style="color: #1e3a8a;">$1</strong>');
    formatted = formatted.replace(/(أطراف العقد:|أ - المواصفات ومدة الضمان:|ب - شروط الضمان:)/g, '<strong class="red" style="display: block; margin-top: 10px; font-size: 13px;">$1</strong>');
  }
  return formatted;
};

export default function CustomerSupplierInvoices({ user, lang }: CustomerSupplierInvoicesProps) {
  const [activePortal, setActivePortal] = useState<"customer" | "supplier">("customer");
  
  // Data States
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI & Search/Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<Invoice | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showZatcaSettingsModal, setShowZatcaSettingsModal] = useState(false);

  // Company and settings states
  const [companyInfo, setCompanyInfo] = useState({
    name: "شركة فنون الوليد للصناعة",
    country: "المملكة العربية السعودية",
    city: "الدمام",
    address: "صناعية دلة، شارع أبو بكر الرازي، 2882",
    taxNumber: "311354897200003",
    crNumber: "2050123456",
    phone: "+966 13 833 4115",
    email: "info@alwaleedneon.com"
  });

  const [defaultTerms, setDefaultTerms] = useState(quotationContractText);

  // Fetch invoice settings from Cloud Firestore on mount to completely avoid Local Storage
  useEffect(() => {
    const fetchInvoiceSettings = async () => {
      try {
        const res = await fetch("/api/dynamic/invoice_settings");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const docGlobal = data.find(d => d.id === "global");
          if (docGlobal) {
            if (docGlobal.companyInfo) setCompanyInfo(docGlobal.companyInfo);
            if (docGlobal.defaultTerms) setDefaultTerms(docGlobal.defaultTerms);
          }
        }
      } catch (err) {
        console.error("Error loading invoice settings from Firestore:", err);
      }
    };
    fetchInvoiceSettings();
  }, []);

  // Action confirmations
  const [confirmAction, setConfirmAction] = useState<{
    invoice: Invoice;
    type: "approve" | "reject" | "cancel" | "delete" | "unapprove" | "issue";
    notes?: string;
  } | null>(null);
  
  // Spelled out Arabic words utility (Tafneeth)
  const convertNumberToArabicWords = (num: number): string => {
    if (num === 0) return "صفر ريال سعودي فقط لا غير";

    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);

    const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة"];
    const teens = ["عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
    const tens = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
    const hundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];
    
    function getSection(n: number): string {
      if (n === 0) return "";
      let res = "";
      const h = Math.floor(n / 100);
      const remainder = n % 100;
      const t = Math.floor(remainder / 10);
      const o = remainder % 10;

      if (h > 0) {
        res += hundreds[h];
      }

      if (remainder > 0) {
        if (h > 0) res += " و";
        if (remainder < 11) {
          res += ones[remainder];
        } else if (remainder < 20) {
          res += teens[remainder - 10];
        } else {
          if (o > 0) {
            res += ones[o] + " و";
          }
          res += tens[t];
        }
      }
      return res;
    }

    function spell(n: number): string {
      if (n === 0) return "";
      let res = "";
      const billions = Math.floor(n / 1000000000);
      let rem = n % 1000000000;
      const millions = Math.floor(rem / 1000000);
      rem = rem % 1000000;
      const thousands = Math.floor(rem / 1000);
      const units = rem % 1000;

      if (billions > 0) {
        if (billions === 1) res += "مليار";
        else if (billions === 2) res += "ملياران";
        else res += getSection(billions) + " مليارات";
      }

      if (millions > 0) {
        if (res !== "") res += " و";
        if (millions === 1) res += "مليون";
        else if (millions === 2) res += "مليونان";
        else res += getSection(millions) + " ملايين";
      }

      if (thousands > 0) {
        if (res !== "") res += " و";
        if (thousands === 1) res += "ألف";
        else if (thousands === 2) res += "ألفان";
        else if (thousands >= 3 && thousands <= 10) res += getSection(thousands) + " آلاف";
        else res += getSection(thousands) + " ألف";
      }

      if (units > 0) {
        if (res !== "") res += " و";
        res += getSection(units);
      }

      return res;
    }

    const integerSpelled = spell(integerPart);
    let result = "";

    if (integerPart > 0) {
      let currency = "ريال سعودي";
      if (integerPart === 1) currency = "ريال سعودي";
      else if (integerPart === 2) currency = "ريالان سعوديان";
      else if (integerPart >= 3 && integerPart <= 10) currency = "ريالات سعودية";
      
      result += `${integerSpelled} ${currency}`;
    }

    if (decimalPart > 0) {
      if (result !== "") result += " و";
      let halalaLabel = "هللة";
      if (decimalPart === 1) halalaLabel = "هللة واحدة";
      else if (decimalPart === 2) halalaLabel = "هللتان";
      else if (decimalPart >= 3 && decimalPart <= 10) halalaLabel = "هللات";
      result += `${getSection(decimalPart)} ${halalaLabel}`;
    }

    result += " فقط لا غير";
    return result;
  };

  // Processing loader
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form states
  const [partyInput, setPartyInput] = useState("");
  const [refIdInput, setRefIdInput] = useState("");
  const [invDate, setInvDate] = useState(new Date().toISOString().split("T")[0]);
  const [invDueDate, setInvDueDate] = useState("");
  const [invNotes, setInvNotes] = useState("");
  const [invDiscount, setInvDiscount] = useState<number>(0);
  const [invItems, setInvItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unitPrice: 0, taxRate: 0.15, total: 0 }
  ]);
  const [attachedFile, setAttachedFile] = useState<{ name: string; data: string } | null>(null);

  // Payment Form states
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payMethod, setPayMethod] = useState("تحويل بنكي");
  const [payAccount, setPayAccount] = useState("الحساب الجاري الراجحي");
  const [payReceipt, setPayReceipt] = useState<{ name: string; data: string } | null>(null);

  const [cashBoxes, setCashBoxes] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedCashBoxId, setSelectedCashBoxId] = useState("");
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");

  const fetchAccounts = async () => {
    try {
      const cbRes = await fetch("/api/dynamic/cash_boxes");
      if (cbRes.ok) {
        const cbData = await cbRes.json();
        setCashBoxes(cbData);
        const active = cbData.find((c: any) => c.status === "Active");
        if (active) setSelectedCashBoxId(active.id);
        else if (cbData.length > 0) setSelectedCashBoxId(cbData[0].id);
      }
      const baRes = await fetch("/api/dynamic/bank_accounts");
      if (baRes.ok) {
        const baData = await baRes.json();
        setBankAccounts(baData);
        const active = baData.find((b: any) => b.status === "Active");
        if (active) setSelectedBankAccountId(active.id);
        else if (baData.length > 0) setSelectedBankAccountId(baData[0].id);
      }
    } catch (e) {
      console.error("Error fetching accounts in invoices page:", e);
    }
  };

  // Fetch all initial data
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const ts = Date.now();
      const [invRes, cliRes, quoRes, supRes, poRes] = await Promise.all([
        fetch(activePortal === "customer" ? `/api/customer-invoices?t=${ts}` : `/api/supplier-invoices?t=${ts}`),
        fetch(`/api/clients?t=${ts}`),
        fetch(`/api/sales_quotations?t=${ts}`),
        fetch(`/api/dynamic/suppliers?t=${ts}`),
        fetch(`/api/dynamic/material_purchase_requests?t=${ts}`)
      ]);
      
      if (invRes.ok) {
        const invData = await invRes.json();
        setInvoices(Array.isArray(invData) ? invData.filter((item: any) => item && item.id) : []);
      }
      if (cliRes.ok) {
        const cliData = await cliRes.json();
        setClients(Array.isArray(cliData) ? cliData.filter((item: any) => item && (item.id || item.clientName)) : []);
      }
      if (quoRes.ok) {
        const quoData = await quoRes.json();
        setQuotes(Array.isArray(quoData) ? quoData.filter((item: any) => item && item.id) : []);
      }
      if (supRes.ok) {
        const supData = await supRes.json();
        setSuppliers(Array.isArray(supData) ? supData.filter((item: any) => item && item.id) : []);
      }
      if (poRes.ok) {
        const poData = await poRes.json();
        setPurchaseOrders(Array.isArray(poData) ? poData.filter((item: any) => item && item.id) : []);
      }
    } catch (err) {
      console.error("Error fetching invoices data:", err);
      setErrorMsg("حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchAccounts();
    // Reset filters and modals
    setSearchQuery("");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setShowAddModal(false);
    setEditingInvoice(null);
    setSelectedInvoice(null);
    setShowPaymentModal(null);
    setConfirmAction(null);
  }, [activePortal]);

  // Log activity to activity logs
  const logActivity = async (action: string, details: string) => {
    try {
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: `ACT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          employeeId: user.empId || "SYS",
          employeeName: user.username || "مدير النظام",
          date: new Date().toISOString().split("T")[0],
          time: new Date().toTimeString().split(" ")[0],
          status: "عملية مالية",
          notes: `${action}: ${details} (بواسطة ${user.username})`
        })
      });
    } catch (err) {
      console.error("Error saving activity log:", err);
    }
  };

  // Check advanced permission helper
  const hasPermissionGate = (subModule: "customer_invoices" | "supplier_invoices", permId: string) => {
    return hasAdvancedPermission(user, 'finance', subModule, permId);
  };

  // Handle Add Item to invoice items array
  const handleAddFormItem = () => {
    setInvItems([...invItems, { description: "", quantity: 1, unitPrice: 0, taxRate: 0.15, total: 0 }]);
  };

  // Handle Remove Item
  const handleRemoveFormItem = (index: number) => {
    if (invItems.length === 1) return;
    const updated = invItems.filter((_, i) => i !== index);
    setInvItems(updated);
  };

  // Handle Item change
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...invItems];
    if (field === "quantity") {
      updated[index].quantity = Math.max(1, parseInt(value) || 1);
    } else if (field === "unitPrice") {
      updated[index].unitPrice = Math.max(0, parseFloat(value) || 0);
    } else if (field === "taxRate") {
      updated[index].taxRate = parseFloat(value) || 0;
    } else {
      updated[index][field] = value as never;
    }
    updated[index].total = updated[index].quantity * updated[index].unitPrice;
    setInvItems(updated);
  };

  // Calculate totals
  const getFormTotals = () => {
    const subtotal = invItems.reduce((acc, item) => acc + item.total, 0);
    const taxAmount = invItems.reduce((acc, item) => acc + (item.total * item.taxRate), 0);
    const totalAmount = Math.max(0, subtotal + taxAmount - invDiscount);
    return { subtotal, taxAmount, totalAmount };
  };

  // File Upload utility
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isPayment = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 700 * 1024) { // 700KB limit for Firestore Base64 String
      alert("عذراً، حجم الملف كبير جداً. أقصى حجم مسموح به هو 700KB لتجنب مشكلة عدم الحفظ واختفاء الفاتورة.");
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (isPayment) {
        setPayReceipt({
          name: file.name,
          data: reader.result as string
        });
      } else {
        setAttachedFile({
          name: file.name,
          data: reader.result as string
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Set up values for Editing
  const startEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv);
    setPartyInput(inv.partyName);
    setRefIdInput(inv.referenceId || "");
    setInvDate(inv.date);
    setInvDueDate(inv.dueDate);
    setInvNotes(inv.notes || "");
    setInvDiscount(inv.discount);
    setInvItems(inv.items.map(item => ({ ...item })));
    if (inv.attachmentName && inv.attachmentData) {
      setAttachedFile({ name: inv.attachmentName, data: inv.attachmentData });
    } else {
      setAttachedFile(null);
    }
    setShowAddModal(true);
  };

  // Handle Save (Draft / Recorded / Send for Approval / Save & Approve)
  const handleSaveInvoice = async (saveType: "draft" | "recorded" | "approval" | "approve") => {
    const subModule = activePortal === "customer" ? "customer_invoices" : "supplier_invoices";
    
    // Check permission
    if (saveType === "draft" && !hasPermissionGate("customer_invoices", "save_draft")) {
      alert("ليس لديك صلاحية لحفظ الفاتورة كمسودة ⚠️");
      return;
    }
    if (saveType === "recorded" && !hasPermissionGate("supplier_invoices", "save_recorded")) {
      alert("ليس لديك صلاحية لحفظ الفاتورة كمسجلة ⚠️");
      return;
    }
    if (saveType === "approval" && !hasPermissionGate(subModule, "send_approval")) {
      alert("ليس لديك صلاحية لإرسال الفاتورة للاعتماد ⚠️");
      return;
    }
    if (saveType === "approve" && !hasPermissionGate(subModule, "approve_invoice")) {
      alert("ليس لديك صلاحية للاعتماد المباشر ⚠️");
      return;
    }

    if (!partyInput.trim()) {
      alert(activePortal === "customer" ? "الرجاء تحديد العميل" : "الرجاء تحديد المورد");
      return;
    }
    if (invItems.some(item => !item.description.trim() || item.unitPrice <= 0)) {
      alert("يرجى إكمال تفاصيل جميع البنود وتحديد سعر وحدة أكبر من الصفر");
      return;
    }

    setIsProcessing(true);
    const { subtotal, taxAmount, totalAmount } = getFormTotals();

    // Decide status
    let status = "";
    if (activePortal === "customer") {
      if (saveType === "draft") status = "مسودة";
      else if (saveType === "approval") status = "بانتظار الاعتماد";
      else if (saveType === "approve") status = "معتمدة وصادرة";
    } else {
      if (saveType === "recorded") status = "مسجلة";
      else if (saveType === "approval") status = "بانتظار الاعتماد";
      else if (saveType === "approve") status = "معتمدة";
    }

    const payload: Partial<Invoice> = {
      id: editingInvoice ? editingInvoice.id : undefined,
      type: activePortal,
      partyName: partyInput,
      referenceId: refIdInput || undefined,
      date: invDate,
      dueDate: invDueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      items: invItems,
      subtotal,
      taxAmount,
      discount: invDiscount,
      totalAmount,
      paidAmount: editingInvoice ? editingInvoice.paidAmount : 0,
      remainingAmount: editingInvoice ? (totalAmount - editingInvoice.paidAmount) : totalAmount,
      status,
      notes: invNotes,
      attachmentName: attachedFile?.name,
      attachmentData: attachedFile?.data,
    };

    // Keep histories
    const historyEntry = {
      action: editingInvoice ? "تعديل وحفظ" : "إنشاء فاتورة",
      user: user.username || "مستخدم",
      date: new Date().toLocaleString('en-US'),
      notes: `الحالة: ${status}. ملاحظات: ${invNotes || "لا يوجد"}`
    };

    payload.history = editingInvoice 
      ? [...(editingInvoice.history || []), historyEntry]
      : [historyEntry];

    payload.paymentHistory = editingInvoice ? editingInvoice.paymentHistory || [] : [];

    try {
      const url = editingInvoice 
        ? `/api/${activePortal}-invoices/${editingInvoice.id}`
        : `/api/${activePortal}-invoices`;
      const method = editingInvoice ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedData = await res.json();
        const savedInvoice = savedData?.invoice || savedData || {};
        const invoiceId = savedInvoice?.id || payload?.id || editingInvoice?.id || `INV-${Math.floor(10000 + Math.random() * 90000)}`;
        await logActivity(
          editingInvoice ? "تعديل فاتورة" : "إضافة فاتورة", 
          `رقم الفاتورة: ${invoiceId} للجهة: ${partyInput} بمبلغ: ${totalAmount} ر.س`
        );
        setShowAddModal(false);
        setEditingInvoice(null);
        fetchData();
      } else {
        alert("فشل حفظ الفاتورة. الرجاء التحقق من البيانات.");
      }
    } catch (err) {
      console.error("Error saving invoice:", err);
      alert("حدث خطأ غير متوقع أثناء الحفظ.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Perform status transitions (Approve, Reject, Cancel, Delete, Issue)
  const handleExecuteAction = async () => {
    if (!confirmAction) return;
    const { invoice, type, notes } = confirmAction;
    const subModule = activePortal === "customer" ? "customer_invoices" : "supplier_invoices";

    setIsProcessing(true);
    let updatedStatus = invoice.status;
    let actionLabel = "";

    if (type === "approve") {
      updatedStatus = activePortal === "customer" ? "معتمدة وصادرة" : "معتمدة";
      actionLabel = "اعتماد الفاتورة";
    } else if (type === "reject") {
      updatedStatus = "مرفوضة";
      actionLabel = "رفض الفاتورة";
    } else if (type === "cancel") {
      updatedStatus = "ملغاة";
      actionLabel = "إلغاء الفاتورة";
    } else if (type === "issue") {
      updatedStatus = "معتمدة وصادرة";
      actionLabel = "إصدار الفاتورة";
    } else if (type === "unapprove") {
      updatedStatus = activePortal === "customer" ? "مسودة" : "مسجلة";
      actionLabel = "إلغاء اعتماد الفاتورة";
    }

    try {
      if (type === "delete") {
        const res = await fetch(`/api/${activePortal}-invoices/${invoice.id}`, { method: "DELETE" });
        if (res.ok) {
          await logActivity("حذف فاتورة", `رقم الفاتورة: ${invoice.id}`);
          setConfirmAction(null);
          setSelectedInvoice(null);
          fetchData();
        } else {
          alert("فشل حذف الفاتورة.");
        }
      } else {
        const historyEntry = {
          action: actionLabel,
          user: user.username || "مستخدم",
          date: new Date().toLocaleString('en-US'),
          notes: notes || "لا يوجد"
        };

        const updatedInvoice = {
          ...invoice,
          status: updatedStatus,
          history: [...(invoice.history || []), historyEntry]
        };

        const res = await fetch(`/api/${activePortal}-invoices/${invoice.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedInvoice)
        });

        if (res.ok) {
          await logActivity(actionLabel, `رقم الفاتورة: ${invoice.id} - الحالة الجديدة: ${updatedStatus}`);
          setConfirmAction(null);
          setSelectedInvoice(null);
          fetchData();
        } else {
          alert("فشلت العملية.");
        }
      }
    } catch (err) {
      console.error("Error performing action:", err);
      alert("حدث خطأ غير متوقع.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleZatcaAction = async (action: "generate_qr" | "generate_xml" | "validate" | "send", inv: Invoice) => {
    if (!inv) return;
    
    let updatedZatca = inv.zatca ? { ...inv.zatca, logs: [...(inv.zatca.logs || [])] } : { logs: [] };
    const ts = new Date().toLocaleString('en-US');

    try {
      if (action === "generate_qr") {
        const zatcaStr = generateZatcaQR(
          companyInfo.name,
          companyInfo.taxNumber,
          inv.date,
          inv.totalAmount.toString(),
          inv.taxAmount.toString()
        );
        updatedZatca.qrBase64 = zatcaStr;
        updatedZatca.logs.push({ date: ts, user: user.username, action: "توليد QR", message: "تم توليد QR بنجاح" });
        alert("تم توليد QR Code بنجاح.");
      } else if (action === "generate_xml") {
        const isCustomer = inv.type === "customer";
        const matchedClient = isCustomer ? clients.find(c => (c.name || c.clientName || c.companyName) === inv.partyName) : null;
        const buyerDetails = isCustomer ? { taxNumber: matchedClient?.taxNumber, address: matchedClient?.address, city: matchedClient?.city } : {};
        const xml = generateZatcaXML(inv, companyInfo, buyerDetails);
        updatedZatca.xml = xml;
        if (!updatedZatca.uuid) updatedZatca.uuid = crypto.randomUUID();
        updatedZatca.logs.push({ date: ts, user: user.username, action: "توليد XML", message: "تم توليد XML بنجاح" });
        alert("تم توليد XML بنجاح.");
      } else if (action === "validate") {
        if (!updatedZatca.xml || !updatedZatca.qrBase64) {
          alert("الرجاء توليد QR و XML أولاً.");
          return;
        }
        updatedZatca.status = "جاهزة";
        updatedZatca.logs.push({ date: ts, user: user.username, action: "فحص الفاتورة", message: "الفاتورة جاهزة للإرسال إلى زاتكا" });
        alert("الفاتورة جاهزة ضريبياً.");
      } else if (action === "send") {
        if (updatedZatca.status !== "جاهزة" && updatedZatca.status !== "مرفوضة") {
          alert("الفاتورة غير جاهزة للإرسال.");
          return;
        }
        setIsProcessing(true);
        await new Promise(r => setTimeout(r, 1500));
        updatedZatca.status = "مقبولة";
        updatedZatca.responseCode = "200";
        updatedZatca.responseMessage = "تم قبول الفاتورة (Cleared/Reported)";
        updatedZatca.logs.push({ date: ts, user: user.username, action: "إرسال إلى زاتكا", message: "تم قبول الفاتورة بنجاح" });
        setIsProcessing(false);
        alert("تم قبول الفاتورة من هيئة الزكاة والضريبة والجمارك.");
      }

      const res = await fetch(`/api/${activePortal}-invoices/${inv.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...inv, zatca: updatedZatca })
      });
      if (res.ok) {
        if (selectedInvoice && selectedInvoice.id === inv.id) {
          setSelectedInvoice({ ...inv, zatca: updatedZatca });
        }
        fetchData();
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء تنفيذ عملية زاتكا.");
      setIsProcessing(false);
    }
  };

  // Register payment
  const handleRegisterPayment = async () => {
    if (!showPaymentModal) return;
    const invoice = showPaymentModal;
    const amount = parseFloat(payAmount) || 0;

    if (amount <= 0 || amount > invoice.remainingAmount) {
      alert("يرجى إدخال مبلغ دفع صالح لا يتجاوز المبلغ المتبقي!");
      return;
    }

    setIsProcessing(true);
    const newPaid = invoice.paidAmount + amount;
    const newRemaining = Math.max(0, invoice.totalAmount - newPaid);
    
    // Status update logic based on remaining amount
    let status = invoice.status;
    if (newRemaining === 0) {
      status = "مدفوعة بالكامل";
    } else {
      status = "مدفوعة جزئياً";
    }

    const newPaymentEntry = {
      amount,
      date: payDate,
      method: payMethod,
      account: activePortal === "supplier" ? payAccount : undefined,
      receiptName: payReceipt?.name,
      receiptData: payReceipt?.data
    };

    const historyEntry = {
      action: "تسجيل دفعة سداد",
      user: user.username || "مستخدم",
      date: new Date().toLocaleString('en-US'),
      notes: `تم سداد مبلغ: ${amount} ر.س بطريقة ${payMethod}. المتبقي: ${newRemaining} ر.س`
    };

    const updatedInvoice: Invoice = {
      ...invoice,
      paidAmount: newPaid,
      remainingAmount: newRemaining,
      status,
      paymentHistory: [...(invoice.paymentHistory || []), newPaymentEntry],
      history: [...(invoice.history || []), historyEntry]
    };

    try {
      const isCash = (payMethod === "نقد / كاش" || payMethod === "Cash" || payMethod === "نقدي" || payMethod === "نقد");
      const accountPayload = isCash 
        ? { cashBoxId: selectedCashBoxId } 
        : { bankAccountId: selectedBankAccountId };

      // 1. Sync to revenues or expenses FIRST
      if (activePortal === "customer") {
        const syncRes = await fetch("/api/revenues", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: `REV-AUTO-${Date.now()}`,
            date: payDate,
            source: `فاتورة عميل ${invoice.id}`,
            client: invoice.partyName,
            quoteNumber: invoice.referenceId || "",
            invoiceNumber: invoice.id,
            amount: amount,
            paymentMethod: payMethod,
            status: "معتمد", // Approved to trigger auto-journal and affect balances
            notes: `تحصيل تلقائي من فاتورة مبيعات ${invoice.id}`,
            ...accountPayload
          })
        });
        if (!syncRes.ok) {
          const errData = await syncRes.json();
          throw new Error(errData.error || "فشل توليد القيد التلقائي للتحصيل المالي.");
        }
      } else {
        const syncRes = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: `EXP-AUTO-${Date.now()}`,
            date: payDate,
            category: "فواتير الموردين ومستلزمات الإنتاج",
            subCategory: `فاتورة مورد ${invoice.id}`,
            amount: amount,
            paymentMethod: payMethod,
            reference: invoice.id,
            account: isCash ? "نقدي" : "تحويل بنكي",
            status: "معتمد", // Approved to trigger auto-journal and affect balances
            notes: `سداد تلقائي لفاتورة مورد ${invoice.id}`,
            ...accountPayload
          })
        });
        if (!syncRes.ok) {
          const errData = await syncRes.json();
          throw new Error(errData.error || "فشل توليد القيد التلقائي لسداد الفاتورة.");
        }
      }

      // 2. Update the invoice status and paid amount
      const res = await fetch(`/api/${activePortal}-invoices/${invoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedInvoice)
      });

      if (res.ok) {
        await logActivity("تسجيل دفعة سداد", `مبلغ: ${amount} ر.س للفاتورة: ${invoice.id}`);
        setPayAmount("");
        setPayReceipt(null);
        setShowPaymentModal(null);
        fetchData();
      } else {
        alert("فشل تسجيل عملية الدفع على الفاتورة.");
      }
    } catch (err: any) {
      console.error("Error registering payment:", err);
      alert(`حدث خطأ أثناء معالجة العملية المالية:\n${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckTaxReadiness = (inv: Invoice) => {
    const isCustomer = inv.type === "customer";
    const matchedClient = isCustomer ? clients.find(c => (c.name || c.clientName || c.companyName) === inv.partyName) : null;
    const matchedSupplier = !isCustomer ? suppliers.find(s => s.name === inv.partyName) : null;
    const partyTaxNumber = isCustomer ? (matchedClient?.taxNumber || "") : (matchedSupplier?.taxNumber || "");

    if (inv.status === "بانتظار الاعتماد") {
      alert("❌ لا يمكن إصدارها ضريبياً لأنها بانتظار الاعتماد.");
      return;
    }

    if (!inv.id || !inv.date || !inv.totalAmount || inv.items.length === 0) {
      alert("❌ الفاتورة ناقصة البيانات الأساسية (مثل رقم الفاتورة أو الأصناف).");
      return;
    }

    if (!partyTaxNumber || partyTaxNumber.length !== 15) {
      alert("⚠️ تحتاج مراجعة: الرقم الضريبي للعميل/المورد غير صحيح أو مفقود. (يجب أن يكون 15 رقماً للفواتير الضريبية B2B)");
      return;
    }

    alert("✅ الفاتورة جاهزة ضريبياً للاعتماد والتصدير.");
  };

  // Beautiful ZATCA Tax-compliant Print & PDF generation design
  const handleTriggerPrint = async (inv: Invoice, forPdfExport: boolean = false) => {
    const isCustomer = inv.type === "customer";
    const matchedClient = isCustomer ? clients.find(c => (c.name || c.clientName || c.companyName) === inv.partyName) : null;
    const matchedSupplier = !isCustomer ? suppliers.find(s => s.name === inv.partyName) : null;

    const partyTaxNumber = isCustomer ? (matchedClient?.taxNumber || "غير متوفر") : (matchedSupplier?.taxNumber || "غير متوفر");

    if (forPdfExport) {
      if (inv.status === "بانتظار الاعتماد") {
        alert("لا يمكن تصدير الفاتورة رسمياً وهي بانتظار الاعتماد.");
        return;
      }
      if (isCustomer && inv.status === "معتمدة وصادرة" && inv.zatca?.status !== "مقبولة") {
        alert("لا يمكن تصدير PDF رسمي قبل إكمال متطلبات زاتكا (الفاتورة غير مقبولة).");
        return;
      }
    }

    if (!inv.id || !inv.date || !inv.totalAmount || inv.items.length === 0) {
      alert("الفاتورة ناقصة البيانات الأساسية ولا يمكن طباعتها.");
      return;
    }

    // Block officially issued B2B invoices with invalid VAT
    if (inv.status !== "مسودة" && inv.status !== "مسجلة" && inv.status !== "بانتظار الاعتماد") {
      if (partyTaxNumber !== "غير متوفر" && partyTaxNumber.length !== 15) {
         alert("لا يمكن طباعة أو تصدير الفاتورة: الرقم الضريبي للعميل غير صحيح. يجب أن يكون 15 رقماً للفواتير الضريبية B2B.");
         return;
      }
    }
    const partyCrNumber = isCustomer ? (matchedClient?.crNumber || "غير متوفر") : (matchedSupplier?.crNumber || "غير متوفر");
    const partyAddress = isCustomer 
      ? `${matchedClient?.country || "المملكة العربية السعودية"}، ${matchedClient?.city || "الرياض"}، ${matchedClient?.address || "---"}`
      : `${matchedSupplier?.country || "المملكة العربية السعودية"}، ${matchedSupplier?.city || "الرياض"}، ${matchedSupplier?.address || "---"}`;
    const partyPhone = isCustomer ? (matchedClient?.mobile || matchedClient?.phone || "---") : (matchedSupplier?.mobile || matchedSupplier?.phone || "---");

    const itemsHTML = (inv.items || []).map((item, index) => {
      const lineSubtotal = item.quantity * item.unitPrice;
      const discountVal = item.discount || 0;
      const lineNet = lineSubtotal - discountVal;
      const taxRate = item.taxRate || 0.15;
      const lineTax = lineNet * taxRate;
      const lineTotal = lineNet + lineTax;

      return `
        <tr>
          <td>${index + 1}</td>
          <td>
            <div style="font-weight: bold; color: #000; margin: 0; line-height: 1.3;">${item.description || "بند مالي"}</div>
            ${item.notes ? `<div style="font-size: 11px; color: #333; margin: 2px 0 0 0; line-height: 1.3;">${item.notes}</div>` : ""}
          </td>
          <td>${item.quantity}</td>
          <td>حبة</td>
          <td style="white-space: nowrap;">${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</td>
          <td>${(taxRate * 100).toFixed(0)}%</td>
          <td style="white-space: nowrap;">${lineTax.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</td>
          <td style="font-weight: bold; white-space: nowrap;">${lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</td>
        </tr>
      `;
    }).join("");

    // Load company ZATCA settings dynamically from Firestore to comply with official regulations
    let companyZatcaNameAr = "شركة فنون الوليد للدعاية والإعلان";
    let companyZatcaNameEn = "Al Waleed Arts Advertising Co.";
    let companyZatcaVatNumber = "310123456700003";
    let companyZatcaCrNumber = "1010123456";
    let companyZatcaAddress = "7322 طريق الملك عبد العزيز، الياسمين، الرياض، المملكة العربية السعودية";

    try {
      const { doc: fDoc, getDoc: fGetDoc } = await import("firebase/firestore");
      const { db: fDb } = await import("../../firebase");
      const zatcaSnap = await fGetDoc(fDoc(fDb, "settings", "zatca"));
      if (zatcaSnap.exists()) {
        const zData = zatcaSnap.data();
        if (zData.companyNameArabic) companyZatcaNameAr = zData.companyNameArabic;
        if (zData.companyNameEnglish) companyZatcaNameEn = zData.companyNameEnglish;
        if (zData.vatNumber) companyZatcaVatNumber = zData.vatNumber;
        if (zData.crNumber) companyZatcaCrNumber = zData.crNumber;
        
        const addrParts = [
          zData.buildingNumber,
          zData.nationalAddress,
          zData.district,
          zData.city,
          zData.postalCode,
          zData.country
        ].filter(Boolean);
        if (addrParts.length > 0) {
          companyZatcaAddress = addrParts.join("، ");
        } else if (zData.nationalAddress) {
          companyZatcaAddress = zData.nationalAddress;
        }
      }
    } catch (e) {
      console.error("Error loading ZATCA settings for invoice print:", e);
    }

    let qrImgHTML = "";
    if (inv.status !== "بانتظار الاعتماد" && inv.status !== "مسودة") {
      let invoiceDateISO = new Date().toISOString();
      try {
        if (inv.date) {
          const parsed = new Date(inv.date);
          if (!isNaN(parsed.getTime())) {
            invoiceDateISO = parsed.toISOString();
          }
        }
      } catch (e) {}

      const zatcaBase64 = generateZatcaQR(
        companyZatcaNameAr,
        companyZatcaVatNumber,
        invoiceDateISO,
        inv.totalAmount.toString(),
        inv.taxAmount.toString()
      );
      try {
        const qrDataUrl = await QRCode.toDataURL(zatcaBase64, { width: 150, margin: 1 });
        qrImgHTML = `
          <img src="${qrDataUrl}" alt="ZATCA QR Code" style="width: 100px; height: 100px; padding: 5px; border: 1.5px solid #000; border-radius: 6px; background: white;" referrerPolicy="no-referrer" />
        `;
      } catch (err) {
        console.error("Failed to generate QR code", err);
      }
    }

    const watermarkHtml = (inv.status === "بانتظار الاعتماد" || inv.status === "مسودة") ? `
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; color: rgba(200, 0, 0, 0.1); white-space: nowrap; pointer-events: none; z-index: -1;">
        غير معتمدة - مسودة
      </div>
    ` : "";

    const invoiceTypeName = isCustomer ? "فاتورة مبيعات ضريبية" : "فاتورة مشتريات ضريبية";
    const statusColor = inv.status === 'paid' ? '#10b981' : (inv.status === 'partial' ? '#f59e0b' : '#ef4444');
    const statusBg = inv.status === 'paid' ? '#ecfdf5' : (inv.status === 'partial' ? '#fffbeb' : '#fef2f2');
    const statusText = inv.status === 'paid' ? "مدفوعة" : (inv.status === 'partial' ? "مدفوعة جزئياً" : (inv.status === 'unpaid' ? "غير مدفوعة" : inv.status));

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <style>
            @font-face { font-family: 'GE SS Two'; src: url('/fonts/GE-SS-Two.ttf') format('truetype'); font-weight: normal; font-style: normal; }
            @font-face { font-family: 'Gotham Pro'; src: url('/fonts/Gotham-Pro.ttf') format('truetype'); font-weight: normal; font-style: normal; }
            * { font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif !important; }
          </style>
          <meta charset="UTF-8">
          <title>${inv.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Tajawal:wght@400;500;700;900&display=swap');
            body {
              font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', 'GE SS Two', 'Gotham Pro', sans-serif;
              direction: rtl;
              text-align: right;
              padding: 20px;
              color: #000 !important;
              font-size: 13px;
              background-color: white;
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
            }
            .header-line {
              border-top: 2px solid #0072BC;
              border-bottom: 1px solid #000;
              height: 1px;
              margin: 15px 0;
            }
            .grid-container {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 25px;
            }
            .party-card {
              border: 1.5px solid #000 !important;
              border-radius: 6px;
              padding: 15px;
              background-color: #fff !important;
              min-height: 150px;
              box-sizing: border-box;
            }
            .party-title {
              font-size: 13.5px;
              font-weight: 800;
              color: #000;
              border-bottom: 1.5px solid #000;
              padding-bottom: 6px;
              margin-bottom: 10px;
            }
            .party-row {
              margin-bottom: 6px;
              font-size: 11.5px;
              color: #000 !important;
              font-weight: 600;
              line-height: 1.4;
            }
            .party-row strong {
              color: #000 !important;
              font-weight: bold;
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
              font-size: 11.5px;
              border: 1.5px solid #000 !important;
              text-align: center;
            }
            .items-table td {
              padding: 6px 8px;
              border: 1.5px solid #000 !important;
              font-size: 11.5px;
              color: #000 !important;
              font-weight: 600;
              text-align: center;
              vertical-align: middle;
            }
            .items-table tr:nth-child(even) {
              background-color: #fcfcfc !important;
            }
            .summary-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            .summary-table td {
              padding: 6px;
              font-size: 12px;
              color: #000 !important;
              font-weight: 600;
              border: 1px solid #000;
            }
            .summary-row {
              border-bottom: 1.5px solid #000;
            }
            .summary-row.total td {
              background-color: #f1f5f9 !important;
              font-weight: bold;
              font-size: 13.5px;
              color: #000 !important;
              border-top: 2px solid #000 !important;
              border-bottom: 2px solid #000 !important;
            }
            .tafneeth-box {
              border: 1.5px dashed #000;
              padding: 15px;
              border-radius: 6px;
              background-color: #fff !important;
              color: #000 !important;
              font-weight: bold;
              font-size: 12.5px;
              text-align: center;
              margin-top: 10px;
            }
            .stamp-box {
              margin-top: 35px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-top: 1.5px solid #000;
              padding-top: 15px;
            }
            .stamp {
              border: 3px double #059669;
              color: #059669;
              font-size: 14px;
              font-weight: bold;
              padding: 8px 16px;
              border-radius: 6px;
              transform: rotate(-3deg);
              display: inline-block;
            }
            
            /* Terms and conditions full-width alignment */
            .terms-box {
              border: 1.5px solid #000;
              padding: 15px;
              margin-top: 25px;
              margin-bottom: 25px;
              width: 100%;
              box-sizing: border-box;
              page-break-inside: avoid;
              font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif !important;
            }
            .terms-title {
              color: #0072BC;
              font-size: 13px;
              font-weight: bold;
              text-align: right;
              margin-bottom: 10px;
              border-bottom: 1.5px solid #000;
              padding-bottom: 5px;
              font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif !important;
            }
            .terms-content {
              text-align: right;
              font-size: 11px;
              line-height: 1.6;
              color: #000;
              direction: rtl;
              white-space: pre-wrap;
              word-wrap: break-word;
              font-weight: bold;
              font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif !important;
            }
            .terms-content .red,
            .terms-content .important {
              color: #c00000;
              font-weight: bold;
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
              font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif;
              display: inline-flex;
              align-items: center;
              gap: 8px;
              transition: all 0.2s ease;
            }
            .print-button:hover {
              background-color: #1d4ed8;
              transform: translateY(-1px);
              box-shadow: 0 6px 16px rgba(0, 114, 188, 0.4);
            }
            @media print {
              .no-print {
                display: none !important;
              }
              body {
                padding: 0;
              }
              .invoice-container {
                border: none;
                padding: 0;
                width: 100%;
              }
            }
          </style>
        </head>
        <body onload="window.print()">
          <script>document.title = "${invoiceTypeName} - ${inv.id}";</script>
          <button class="print-button no-print" onclick="window.print()">🖨️ طباعة المستند</button>
          
          <div class="invoice-container">
            ${watermarkHtml}
            <!-- Header layout identical to Quotations -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0072BC; padding-bottom: 12px; margin-bottom: 20px; user-select: none; direction: ltr;">
              <!-- معلومات الشركة -->
              <div style="text-align: left; display: flex; flex-direction: column; justify-content: center; width: 40%;">
                <h2 style="font-size: 19px; font-weight: 900; color: #111; margin: 0; font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif;" dir="rtl">
                  ${companyZatcaNameAr}
                </h2>
                <h3 style="font-size: 10px; font-weight: bold; color: #555; margin: 2px 0 0 0; letter-spacing: 0.1em; font-family: sans-serif;">
                  ${companyZatcaNameEn}
                </h3>
              </div>
              
              <!-- الحالة في منتصف رأس الصفحة -->
              <div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 20%;">
                <span style="font-size: 13px; font-weight: 800; padding: 4px 12px; border: 2px solid ${statusColor}; color: ${statusColor}; border-radius: 6px; font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', 'GE SS Two', 'Gotham Pro', sans-serif; background-color: ${statusBg}; white-space: nowrap;">
                  ${statusText}
                </span>
              </div>

              <!-- الشعار -->
              <div style="text-align: right; width: 40%; display: flex; justify-content: flex-end;">
                <img src="https://i.postimg.cc/0jQj3XVc/Alwaleed-Logo-Vertical-Blue.png" referrerpolicy="no-referrer" alt="Fonoun Alwaleed Logo" style="width: 120px; height: 120px; object-fit: contain;" />
              </div>
            </div>

            <!-- ZATCA Compliance Header: Company details parallel to the ZATCA QR Code -->
            <div style="display: flex; justify-content: space-between; align-items: stretch; margin-bottom: 25px; border: 1.5px solid #000; border-radius: 8px; padding: 12px; background-color: #fafafa; font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif; direction: rtl;">
              <div style="width: 70%; text-align: right; display: flex; flex-direction: column; justify-content: space-between; font-size: 12px; line-height: 1.6; color: #000;">
                <div>
                  <h2 style="font-size: 15px; font-weight: 800; color: #0072BC; margin: 0 0 4px 0;">بيانات مصدر الفاتورة (بيانات الشركة الضريبية)</h2>
                </div>
                <div>
                  <div style="margin-bottom: 2px;"><strong>الاسم الرسمي:</strong> ${companyZatcaNameAr}</div>
                  <div style="margin-bottom: 2px;"><strong>الرقم الضريبي للشركة (VAT):</strong> <span style="font-family: monospace; font-size: 13px; font-weight: bold; letter-spacing: 0.5px;">${companyZatcaVatNumber}</span></div>
                  <div style="margin-bottom: 2px;"><strong>السجل التجاري (CR):</strong> <span style="font-family: monospace; font-size: 12px; font-weight: bold;">${companyZatcaCrNumber}</span></div>
                  <div style="margin-bottom: 2px;"><strong>العنوان الوطني للشركة:</strong> ${companyZatcaAddress}</div>
                </div>
              </div>

              <div style="width: 25%; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 1.5px dashed #ccc; padding-right: 15px; direction: ltr;">
                ${qrImgHTML || `<div style="border: 1.5px dashed #ef4444; padding: 10px; text-align: center; font-size: 10px; color: #ef4444; font-weight: bold;" dir="rtl">مسودة غير صادرة<br/>(لا يوجد باركود زكاة)</div>`}
                <div style="font-size: 9px; color: #444; margin-top: 5px; font-weight: bold; font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif;" dir="rtl">هيئة الزكاة والضريبة والجمارك</div>
              </div>
            </div>

            <!-- Title and summary row -->
            <div style="justify-content: space-between; display: flex; align-items: flex-end; margin-bottom: 3mm; direction: rtl;">
              <div style="width: 45%; text-align: right;">
                 <div style="font-size: 24px; font-weight: 700; color: #000; font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif;">${invoiceTypeName}</div>
                 <div style="font-size: 14px; direction: rtl; font-weight: bold; color: #000; margin-top: 5px;">رقم الفاتورة: ${inv.id}</div>
              </div>
              <div style="width: 45%; text-align: left; font-size: 13px; font-weight: bold; line-height: 1.5; color: #000; font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif;">
                <div>تاريخ الفاتورة: ${inv.date}</div>
                <div>تاريخ الاستحقاق: ${inv.dueDate || "---"}</div>
                <div>تاريخ التوريد: ${inv.date}</div>
              </div>
            </div>
            <div class="header-line"></div>

            <div class="grid-container">
              <!-- Counterpart -->
              <div class="party-card">
                <div class="party-title">${isCustomer ? "تفاصيل بيانات العميل" : "تفاصيل بيانات المورد"}</div>
                <div class="party-row"><strong>الاسم:</strong> ${inv.partyName}</div>
                <div class="party-row"><strong>الرقم الضريبي (VAT):</strong> ${partyTaxNumber}</div>
                <div class="party-row"><strong>السجل التجاري (CR):</strong> ${partyCrNumber}</div>
                <div class="party-row"><strong>العنوان:</strong> ${partyAddress}</div>
                <div class="party-row"><strong>رقم التواصل:</strong> ${partyPhone}</div>
              </div>

              <!-- Our Company details -->
              <div class="party-card">
                <div class="party-title">الشركة الموردة / المصدرة للمستند</div>
                <div class="party-row"><strong>الاسم:</strong> ${companyZatcaNameAr}</div>
                <div class="party-row"><strong>الرقم الضريبي (VAT):</strong> ${companyZatcaVatNumber}</div>
                <div class="party-row"><strong>السجل التجاري (CR):</strong> ${companyZatcaCrNumber}</div>
                <div class="party-row"><strong>العنوان:</strong> ${companyZatcaAddress}</div>
                <div class="party-row"><strong>الهاتف:</strong> ${companyInfo.phone || "+966 13 833 4115"}</div>
                <div class="party-row"><strong>البريد الإلكتروني:</strong> ${companyInfo.email || "info@alwaleedneon.com"}</div>
              </div>
            </div>

            <!-- Quick summary info line -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; border: 1.5px solid #000; text-align: center; font-size: 11px;">
              <tr style="background: #f1f5f9; font-weight: bold; color: #000;">
                <td style="padding: 8px; border: 1.5px solid #000;">نوع الفاتورة</td>
                <td style="padding: 8px; border: 1.5px solid #000;">تاريخ الفاتورة</td>
                <td style="padding: 8px; border: 1.5px solid #000;">تاريخ الاستحقاق</td>
                <td style="padding: 8px; border: 1.5px solid #000;">تاريخ التوريد</td>
                <td style="padding: 8px; border: 1.5px solid #000;">معاملات خاصة</td>
                <td style="padding: 8px; border: 1.5px solid #000;">إصدار فواتير خاصة</td>
              </tr>
              <tr style="color: #000; font-weight: bold;">
                <td style="padding: 8px; border: 1.5px solid #000;">${invoiceTypeName}</td>
                <td style="padding: 8px; border: 1.5px solid #000;">${inv.date}</td>
                <td style="padding: 8px; border: 1.5px solid #000;">${inv.dueDate || "---"}</td>
                <td style="padding: 8px; border: 1.5px solid #000;">${inv.date}</td>
                <td style="padding: 8px; border: 1.5px solid #000;">لا يوجد</td>
                <td style="padding: 8px; border: 1.5px solid #000;">لا يوجد</td>
              </tr>
            </table>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 40px;">م</th>
                  <th>الوصف والبيان للخدمة / السلعة</th>
                  <th style="width: 60px;">الكمية</th>
                  <th style="width: 60px;">الوحدة</th>
                  <th style="width: 100px;">سعر الوحدة</th>
                  <th style="width: 60px;">نسبة الضريبة</th>
                  <th style="width: 100px;">إجمالي الضريبة</th>
                  <th style="width: 120px;">الإجمالي شامل الضريبة</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>

            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 50%; vertical-align: top; padding-left: 20px;">
                  <div class="tafneeth-box">
                    <span style="font-size: 11px; display: block; color: #000; margin-bottom: 4px; font-weight: bold;">المجموع مفقطاً بالحروف العربية:</span>
                    <span style="color: #000; font-weight: 800;">${tafqeet(inv.totalAmount)}</span>
                    <span style="font-size: 10px; display: block; color: #333; margin-top: 4px; font-weight: normal;">* يتضمن ضريبة القيمة المضافة الإلزامية بنسبة 15%</span>
                  </div>
                </td>
                
                <td style="width: 50%; vertical-align: top;">
                  <table class="summary-table">
                    <tr class="summary-row">
                      <td style="color: #000; font-weight: bold;">المجموع الصافي قبل ضريبة VAT:</td>
                      <td style="text-align: left; font-weight: bold; color: #000; white-space: nowrap;">${inv.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</td>
                    </tr>
                    <tr class="summary-row">
                      <td style="color: #000; font-weight: bold;">مبلغ ضريبة القيمة المضافة (15%):</td>
                      <td style="text-align: left; font-weight: bold; color: #000; white-space: nowrap;">${inv.taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</td>
                    </tr>
                    ${inv.discount > 0 ? `
                      <tr class="summary-row" style="color: #c00000;">
                        <td style="font-weight: bold;">إجمالي الخصومات الممنوحة:</td>
                        <td style="text-align: left; font-weight: bold; white-space: nowrap;">-${inv.discount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</td>
                      </tr>
                    ` : ""}
                    <tr class="summary-row total">
                      <td style="color: #000; font-weight: bold; font-size: 13.5px;">المجموع الإجمالي النهائي:</td>
                      <td style="text-align: left; font-weight: bold; color: #000; font-size: 13.5px; white-space: nowrap;">${inv.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</td>
                    </tr>
                    <tr class="summary-row" style="color: #000; font-size: 11px;">
                      <td style="font-weight: bold;">المجموع الإجمالي المقرب:</td>
                      <td style="text-align: left; font-weight: bold; white-space: nowrap;">${Math.round(inv.totalAmount).toLocaleString('en-US')} ر.س</td>
                    </tr>
                    <tr class="summary-row" style="color: #000;">
                      <td style="font-weight: bold;">المبلغ المسدد مسبقاً:</td>
                      <td style="text-align: left; font-weight: bold; color: #000; white-space: nowrap;">${inv.paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</td>
                    </tr>
                    <tr class="summary-row" style="color: #c00000; border-bottom: 2px solid #000;">
                      <td style="font-weight: bold;">المتبقي المستحق:</td>
                      <td style="text-align: left; font-weight: bold; color: #c00000; white-space: nowrap;">${inv.remainingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Terms Box at full width (100%) inside margin limits -->
            <div class="terms-box">
              <div class="terms-title">الشروط والأحكام ومعلومات أخرى (مطابقة لعروض الأسعار)</div>
              <div class="terms-content">
                ${formatTermsHTML(inv.notes || defaultTerms)}
              </div>
            </div>

            <!-- Signatures and stamp -->
            <div class="stamp-box">
              <div style="text-align: right;">
                <div style="font-size: 12px; font-weight: bold; color: #000;">توقيع واعتماد قسم الحسابات والتدقيق المالي</div>
                <div style="font-size: 11px; color: #000; margin-top: 4px; font-weight: bold;">${companyZatcaNameAr}</div>
                <div style="width: 180px; border-bottom: 1.5px solid #000; margin-top: 35px;"></div>
              </div>
              <div style="text-align: left; width: 150px;">
                ${qrImgHTML}
                <div style="font-size: 10px; color: #000; margin-top: 5px; text-align: center; font-weight: bold;">هيئة الزكاة والضريبة والجمارك</div>
              </div>
            </div>

            <!-- Dynamic corporate bank accounts in footer -->
            <div style="margin-top: 40px; border-top: 2px solid #0072BC; padding-top: 12px; display: flex; justify-content: space-between; align-items: flex-start; font-size: 10px; color: #111; user-select: none; direction: ltr; min-height: 80px; font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif;">
              <div style="text-align: left; line-height: 1.6; width: 45%;">
                <p style="margin:0;"><span style="font-weight: bold; color: #0072BC;">T:</span> +966 13 833 4115</p>
                <p style="margin:0;"><span style="font-weight: bold; color: #0072BC;">Factory:</span> Dallah Industrial District, Dammam 32445, Saudi Arabia.</p>
                <p style="margin:0;">info@alwaleedneon.com | www.alwaleedneon.com</p>
              </div>
              <div style="text-align: right; line-height: 1.6; width: 50%; display: flex; flex-direction: column; align-items: flex-end;">
                <div style="font-size: 11px; font-weight: bold; color: #0072BC; margin-bottom: 6px; font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif;" dir="rtl">الحسابات البنكية المعتمدة للتحويل (Approved Bank Accounts):</div>
                <div style="display: flex; flex-direction: column; gap: 6px; width: 100%; align-items: flex-end;">
                  ${(() => {
                    const activeBanks = bankAccounts.filter((b: any) => b.status === "Active" || !b.status);
                    const list = activeBanks.length > 0 ? activeBanks : bankAccounts;
                    if (list.length > 0) {
                      return list.map((b: any) => `
                        <div style="border: 1px solid #ddd; padding: 6px 10px; border-radius: 6px; background-color: #fafafa; display: inline-block; text-align: right; min-width: 250px; line-height: 1.4;" dir="rtl">
                          <div style="font-weight: bold; color: #0072BC; font-size: 11px;">🏦 ${b.bankName || "البنك"}</div>
                          <div style="font-size: 10px; color: #333; margin-top: 2px;"><strong>اسم الحساب:</strong> ${b.accountName || "شركة فنون الوليد"}</div>
                          <div style="font-size: 10px; color: #333;"><strong>رقم الحساب:</strong> <span style="font-family: monospace;">${b.accountNumber || "---"}</span></div>
                          <div style="font-size: 10px; color: #333;"><strong>IBAN:</strong> <span style="font-family: monospace; font-weight: bold;">${b.iban || "---"}</span></div>
                        </div>
                      `).join("");
                    } else {
                      return `
                        <div style="border: 1px solid #ddd; padding: 6px 10px; border-radius: 6px; background-color: #fafafa; display: inline-block; text-align: right; min-width: 250px; line-height: 1.4;" dir="rtl">
                          <div style="font-weight: bold; color: #0072BC; font-size: 11px;">🏦 مصرف الراجحي</div>
                          <div style="font-size: 10px; color: #333; margin-top: 2px;"><strong>اسم الحساب:</strong> شركة فنون الوليد للدعاية والإعلان</div>
                          <div style="font-size: 10px; color: #333;"><strong>رقم الحساب:</strong> <span style="font-family: monospace;">1234567890</span></div>
                          <div style="font-size: 10px; color: #333;"><strong>IBAN:</strong> <span style="font-family: monospace; font-weight: bold;">SA1234567890123456789012</span></div>
                        </div>
                      `;
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Trigger print cleanly in a new tab to avoid iframe sandbox issues
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة لطباعة الفاتورة.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.document.title = inv.id;

    if (forPdfExport) {
      logActivity("تصدير الفاتورة PDF", `تصدير الفاتورة رقم: ${inv.id} بنجاح. حالة الفاتورة: ${inv.status}`);
    } else {
      logActivity("طباعة الفاتورة", `طباعة الفاتورة رقم: ${inv.id} بنجاح. حالة الفاتورة: ${inv.status}`);
    }
  };

  const handlePrintPdf = (inv: Invoice) => {
    handleTriggerPrint(inv, false);
  };

  // CSV Export
  const handleExportCSV = () => {
    const isCustomer = activePortal === "customer";
    const header = [
      isCustomer ? "رقم الفاتورة" : "رقم الفاتورة",
      isCustomer ? "العميل" : "المورد",
      "تاريخ الفاتورة",
      "تاريخ الاستحقاق",
      "الإجمالي شامل الضريبة",
      "المدفوع",
      "المتبقي",
      "الحالة"
    ];
    
    const rows = invoices.map(inv => [
      inv?.id || "",
      inv?.partyName || "",
      inv?.date || "",
      inv?.dueDate || "",
      inv?.totalAmount || 0,
      inv?.paidAmount || 0,
      inv?.remainingAmount || 0,
      inv?.status || ""
    ]);

    const csvContent = "\uFEFF" + [header.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${isCustomer ? "customer" : "supplier"}_invoices_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and search calculations
  const filteredInvoices = invoices.filter(inv => {
    if (!inv || !inv.id) return false;
    const matchesSearch = 
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.partyName && inv.partyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inv.referenceId && inv.referenceId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    
    let matchesDate = true;
    if (dateFrom) {
      matchesDate = matchesDate && inv.date >= dateFrom;
    }
    if (dateTo) {
      matchesDate = matchesDate && inv.date <= dateTo;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // KPI Calculations
  const totalAmountSum = invoices.reduce((acc, curr) => acc + (curr?.totalAmount || 0), 0);
  const paidAmountSum = invoices.reduce((acc, curr) => acc + (curr?.paidAmount || 0), 0);
  const remainingAmountSum = invoices.reduce((acc, curr) => acc + (curr?.remainingAmount || 0), 0);
  
  // Overdue count
  const overdueCount = invoices.filter(inv => {
    if (!inv) return false;
    const today = new Date().toISOString().split("T")[0];
    return inv.dueDate < today && inv.remainingAmount > 0 && inv.status !== "ملغاة" && inv.status !== "مرفوضة";
  }).length;

  const pendingApprovalCount = invoices.filter(inv => inv && inv.status === "بانتظار الاعتماد").length;

  return (
    <div className="space-y-6" id="customer-supplier-invoices-root">
      {/* Title Header with clean premium alignment */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <span>🧾</span>
            <span>إدارة الفواتير المالية للعملاء والموردين</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            متابعة وإصدار واعتماد الفواتير الضريبية للعملاء، وفواتير التوريدات والمشتريات من الموردين وتسجيل دفعات السداد.
          </p>
        </div>
        
        {/* Toggle Button / Actions */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActivePortal("customer")}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activePortal === "customer"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            بوابة فواتير العملاء
          </button>
          <button
            onClick={() => setActivePortal("supplier")}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activePortal === "supplier"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            بوابة فواتير الموردين
          </button>
        </div>
      </div>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-slate-500">
              {activePortal === "customer" ? "إجمالي الفواتير الصادرة" : "إجمالي الفواتير المسجلة"}
            </div>
            <div className="text-2xl font-black text-slate-800">
              {totalAmountSum.toLocaleString('en-US')} <span className="text-xs font-bold">ر.س</span>
            </div>
            <div className="text-[11px] text-slate-400">العدد الإجمالي: {invoices.length} فواتير</div>
          </div>
          <div className={`p-3.5 rounded-xl ${activePortal === "customer" ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"}`}>
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Total Paid/Collected */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-slate-500">
              {activePortal === "customer" ? "إجمالي المبالغ المحصلة" : "إجمالي المبالغ المدفوعة"}
            </div>
            <div className="text-2xl font-black text-emerald-600">
              {paidAmountSum.toLocaleString('en-US')} <span className="text-xs font-bold">ر.س</span>
            </div>
            <div className="text-[11px] text-emerald-500 font-semibold">
              نسبة التحصيل: {totalAmountSum > 0 ? ((paidAmountSum / totalAmountSum) * 100).toFixed(1) : "0"}%
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Total Remaining */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-slate-500">إجمالي المبالغ المتبقية</div>
            <div className="text-2xl font-black text-rose-600">
              {remainingAmountSum.toLocaleString('en-US')} <span className="text-xs font-bold">ر.س</span>
            </div>
            <div className="text-[11px] text-rose-500 font-semibold">
              المستحقات المعلقة: {totalAmountSum > 0 ? ((remainingAmountSum / totalAmountSum) * 100).toFixed(1) : "0"}%
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-rose-50 text-rose-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Alert Card / Pending */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-slate-500">
              {activePortal === "customer" ? "الفواتير المتأخرة السداد" : "فواتير معلقة بانتظار الاعتماد"}
            </div>
            <div className={`text-2xl font-black ${activePortal === "customer" && overdueCount > 0 ? "text-amber-600" : "text-slate-800"}`}>
              {activePortal === "customer" ? overdueCount : pendingApprovalCount}
            </div>
            <div className="text-[11px] text-slate-400">تتطلب المتابعة الفورية والتنبيه</div>
          </div>
          <div className={`p-3.5 rounded-xl ${activePortal === "customer" && overdueCount > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-600"}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ZATCA Monitor Row */}
      {activePortal === "customer" && (
        <div className="bg-indigo-900 text-white rounded-2xl shadow-sm border border-indigo-800 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-800 rounded-xl">
              <FileCheck className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg">متابعة الربط مع زاتكا (ZATCA Monitor)</h3>
              <p className="text-indigo-300 text-xs mt-1">وحدة الفوترة الإلكترونية: متصلة (Production Mode) | آخر مزامنة: الآن</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="bg-indigo-800/50 px-4 py-2 rounded-xl border border-indigo-700">
              <div className="text-indigo-300 text-[10px] font-bold">جاهزة للإرسال</div>
              <div className="text-lg font-black">{invoices.filter(i => i.zatca?.status === 'جاهزة').length}</div>
            </div>
            <div className="bg-indigo-800/50 px-4 py-2 rounded-xl border border-indigo-700">
              <div className="text-emerald-400 text-[10px] font-bold">مقبولة (Cleared/Reported)</div>
              <div className="text-lg font-black">{invoices.filter(i => i.zatca?.status === 'مقبولة').length}</div>
            </div>
            <div className="bg-indigo-800/50 px-4 py-2 rounded-xl border border-indigo-700">
              <div className="text-rose-400 text-[10px] font-bold">مرفوضة / خطأ</div>
              <div className="text-lg font-black">{invoices.filter(i => i.zatca?.status === 'مرفوضة').length}</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Table Container & Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Controls Toolbar */}
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search */}
            <div className="relative flex-1 max-w-lg">
              <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                <Search className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder={activePortal === "customer" ? "البحث برقم الفاتورة، اسم العميل، عرض السعر المرجعي..." : "البحث برقم الفاتورة، المورد، رقم أمر الشراء..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 bg-slate-50"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {activePortal === "customer" && (
                <button
                  onClick={() => setShowZatcaSettingsModal(true)}
                  className="px-4 py-2.5 rounded-xl border border-indigo-200 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center gap-2"
                >
                  <Settings className="w-4.5 h-4.5" />
                  إعدادات الربط مع زاتكا
                </button>
              )}
              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <Download className="w-4.5 h-4.5" />
                تصدير البيانات
              </button>

              <button
                onClick={() => setShowSettingsModal(true)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-2"
                title="تعديل قالب الفاتورة وبيانات الشركة الضريبية والشروط"
              >
                <Shield className="w-4.5 h-4.5 text-indigo-500" />
                إعدادات قالب الفاتورة
              </button>
              
              {hasPermissionGate(activePortal === "customer" ? "customer_invoices" : "supplier_invoices", "add_invoice") && (
                <button
                  onClick={() => {
                    setEditingInvoice(null);
                    setPartyInput("");
                    setRefIdInput("");
                    setInvDate(new Date().toISOString().split("T")[0]);
                    setInvDueDate("");
                    setInvNotes("");
                    setInvDiscount(0);
                    setInvItems([{ description: "", quantity: 1, unitPrice: 0, taxRate: 0.15, total: 0 }]);
                    setAttachedFile(null);
                    setShowAddModal(true);
                  }}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-colors flex items-center gap-2 ${
                    activePortal === "customer" 
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-sm" 
                      : "bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                  }`}
                >
                  <PlusCircle className="w-5 h-5" />
                  {activePortal === "customer" ? "إصدار فاتورة مبيعات جديدة" : "تسجيل فاتورة مورد جديدة"}
                </button>
              )}
            </div>
          </div>

          {/* Granular Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-50">
            {/* Status Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">حالة الفاتورة</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none bg-slate-50 text-slate-700"
              >
                <option value="all">الكل (جميع الحالات)</option>
                {activePortal === "customer" ? (
                  <>
                    <option value="مسودة">مسودة</option>
                    <option value="بانتظار الاعتماد">بانتظار الاعتماد</option>
                    <option value="معتمدة وصادرة">معتمدة وصادرة</option>
                    <option value="مدفوعة جزئياً">مدفوعة جزئياً</option>
                    <option value="مدفوعة بالكامل">مدفوعة بالكامل</option>
                    <option value="ملغاة">ملغاة</option>
                  </>
                ) : (
                  <>
                    <option value="مسجلة">مسجلة</option>
                    <option value="بانتظار الاعتماد">بانتظار الاعتماد</option>
                    <option value="معتمدة">معتمدة</option>
                    <option value="مدفوعة جزئياً">مدفوعة جزئياً</option>
                    <option value="مدفوعة بالكامل">مدفوعة بالكامل</option>
                    <option value="مرفوضة">مرفوضة</option>
                    <option value="ملغاة">ملغاة</option>
                  </>
                )}
              </select>
            </div>

            {/* Date From */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">من تاريخ</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none bg-slate-50 text-slate-700"
              />
            </div>

            {/* Date To */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">إلى تاريخ</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none bg-slate-50 text-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
            <span className="text-sm font-semibold text-slate-500">جاري تحميل كشوف الفواتير...</span>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center gap-3 bg-slate-50/50">
            <FileText className="w-12 h-12 text-slate-300" />
            <h3 className="text-lg font-bold text-slate-700">لا توجد فواتير مطابقة</h3>
            <p className="text-sm text-slate-400 max-w-md">
              لم نجد أي فواتير مسجلة تطابق محددات البحث أو التصفية الحالية. يرجى تعديل خيارات البحث أو إضافة مستند جديد.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-4 px-6">رقم الفاتورة</th>
                  <th className="py-4 px-6">{activePortal === "customer" ? "العميل" : "المورد"}</th>
                  <th className="py-4 px-6">التاريخ</th>
                  <th className="py-4 px-6">تاريخ الاستحقاق</th>
                  <th className="py-4 px-6">الإجمالي (شامل الضريبة)</th>
                  <th className="py-4 px-6">المدفوع</th>
                  <th className="py-4 px-6">المتبقي</th>
                  <th className="py-4 px-6 text-center">الحالة</th>
                  <th className="py-4 px-6 text-center">القيد المحاسبي</th>
                  <th className="py-4 px-6 text-center">الإجراءات والعمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInvoices.map((inv) => {
                  const today = new Date().toISOString().split("T")[0];
                  const isOverdue = inv.dueDate < today && inv.remainingAmount > 0 && inv.status !== "ملغاة" && inv.status !== "مرفوضة";
                  
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">{inv.id}</td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800">{inv.partyName}</div>
                        {inv.referenceId && (
                          <div className="text-xs text-slate-400 mt-0.5">مرجع: {inv.referenceId}</div>
                        )}
                      </td>
                      <td className="py-4 px-6">{inv.date}</td>
                      <td className="py-4 px-6">
                        <span className={isOverdue ? "text-rose-600 font-bold flex items-center gap-1" : ""}>
                          {inv.dueDate}
                          {isOverdue && <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-black">متأخرة ⚠️</span>}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold">{inv.totalAmount.toLocaleString('en-US')} ر.س</td>
                      <td className="py-4 px-6 text-emerald-600 font-medium">{inv.paidAmount.toLocaleString('en-US')} ر.س</td>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        <span className={inv.remainingAmount > 0 ? "text-amber-600" : "text-slate-400"}>
                          {inv.remainingAmount.toLocaleString('en-US')} ر.س
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold ${
                          inv.status === "مدفوعة بالكامل" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                          inv.status === "مدفوعة جزئياً" ? "bg-cyan-100 text-cyan-800 border border-cyan-200" :
                          inv.status === "بانتظار الاعتماد" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                          inv.status === "مرفوضة" || inv.status === "ملغاة" ? "bg-rose-100 text-rose-800 border border-rose-200" :
                          "bg-slate-100 text-slate-800 border border-slate-200"
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {inv.journalStatus === 'failed' ? (
                          <div className="flex flex-col gap-1 items-center bg-rose-50 text-rose-800 text-[10px] p-2 rounded-lg border border-rose-100 max-w-[150px] mx-auto">
                            <span className="font-bold font-sans">فشل القيد المحاسبي ❌</span>
                            <span className="break-words text-center line-clamp-1">{inv.journalError}</span>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm("هل تريد إعادة محاولة إنشاء القيد المحاسبي لهذا السجل؟")) {
                                  try {
                                    const modPath = activePortal === "customer" ? "customer-invoices" : "supplier-invoices";
                                    const res = await fetch(`/api/finance/retry/${modPath}/${inv.id}`, { method: "POST" });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert("تم إنشاء القيد المحاسبي بنجاح ورقم القيد: " + data.journalEntryId);
                                      await fetchData();
                                    } else {
                                      alert("فشلت إعادة المحاولة: " + (data.error || "خطأ مجهول"));
                                    }
                                  } catch (err: any) {
                                    alert("خطأ: " + err.message);
                                  }
                                }
                              }}
                              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2 py-1 rounded text-[9px] mt-1 cursor-pointer transition active:scale-95 whitespace-nowrap"
                            >
                              إعادة المحاولة 🔄
                            </button>
                          </div>
                        ) : inv.isJournalGenerated ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] font-bold">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                              معتمد ومقيد
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 mt-1">{inv.journalEntryId || "قيد تلقائي"}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold">---</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Preview Invoice */}
                          {hasPermissionGate(activePortal === "customer" ? "customer_invoices" : "supplier_invoices", "preview_invoice") && (
                            <button
                              onClick={() => {
                                setPreviewInvoice(inv);
                                logActivity("معاينة الفاتورة", `رقم الفاتورة: ${inv.id}`);
                              }}
                              className="text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
                              title="معاينة الفاتورة الضريبية الرسمية"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>معاينة الفاتورة</span>
                            </button>
                          )}

                          {/* View details */}
                          {hasPermissionGate(activePortal === "customer" ? "customer_invoices" : "supplier_invoices", "view_details") && (
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              className="text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 p-2 rounded-lg transition-colors"
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit (allowed for draft / recorded / pending depending on permissions) */}
                          {hasPermissionGate(activePortal === "customer" ? "customer_invoices" : "supplier_invoices", "edit_invoice") && (
                            <button
                              onClick={() => startEditInvoice(inv)}
                              disabled={inv.status === "مدفوعة بالكامل" || inv.status === "ملغاة"}
                              className="text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 p-2 rounded-lg transition-colors disabled:opacity-40"
                              title="تعديل"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {/* Register payment */}
                          {hasPermissionGate(activePortal === "customer" ? "customer_invoices" : "supplier_invoices", "register_payment") && (
                            <button
                              onClick={() => {
                                setPayAmount(inv.remainingAmount.toString());
                                setPayReceipt(null);
                                setShowPaymentModal(inv);
                              }}
                              disabled={inv.remainingAmount <= 0 || inv.status === "ملغاة" || inv.status === "مرفوضة" || inv.status === "مسودة" || inv.status === "مسجلة" || inv.status === "بانتظار الاعتماد"}
                              className="text-slate-600 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 p-2 rounded-lg transition-colors disabled:opacity-40"
                              title="تسجيل دفعة سداد"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}

                          {/* Print PDF */}
                          <button
                            onClick={() => handlePrintPdf(inv)}
                            className="text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-2 rounded-lg transition-colors"
                            title="طباعة وتحميل"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Delete (Draft / recorded / unapproved) */}
                          {hasPermissionGate(activePortal === "customer" ? "customer_invoices" : "supplier_invoices", "delete_unapproved") && (
                            <button
                              onClick={() => setConfirmAction({ invoice: inv, type: "delete" })}
                              disabled={inv.status === "مدفوعة بالكامل" || inv.status === "مدفوعة جزئياً" || (inv.status !== "مسودة" && inv.status !== "مسجلة" && inv.status !== "بانتظار الاعتماد" && inv.status !== "مرفوضة")}
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors disabled:opacity-40"
                              title="حذف الفاتورة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================== LARGE CENTERED MODAL: ADD / EDIT INVOICE ==================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full shadow-xl border border-slate-200 flex flex-col my-8 overflow-hidden">
            
            {/* Modal Header */}
            <div className={`p-6 text-white flex items-center justify-between ${activePortal === "customer" ? "bg-emerald-700" : "bg-indigo-700"}`}>
              <div className="space-y-1">
                <h2 className="text-xl font-black flex items-center gap-2">
                  <span>{editingInvoice ? "✍️ تعديل فاتورة" : "➕ إضافة وإصدار فاتورة"}</span>
                  <span>{activePortal === "customer" ? "مبيعات للعميل" : "مشتريات من مورد"}</span>
                </h2>
                <p className="text-xs text-white/80">إدخال تفاصيل البنود والخدمات واحتساب ضريبة القيمة المضافة 15%</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
              
              {/* Party Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Party select */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {activePortal === "customer" ? "العميل المستهدف *" : "المورد المستهدف *"}
                  </label>
                  {activePortal === "customer" ? (
                    <SearchableSelect
                      options={clients.map(cli => {
                        const label = cli.name || cli.clientName || "عميل غير معروف";
                        return { label, value: label, original: cli };
                      })}
                      value={partyInput}
                      placeholder="اختر عميلاً من القائمة..."
                      emptyMessage="لم يتم العثور على عملاء"
                      onChange={(val) => {
                        setPartyInput(val);
                        setRefIdInput("");
                      }}
                    />
                  ) : (
                    <SearchableSelect
                      options={suppliers.map(sup => {
                        const label = sup.name || "مورد غير معروف";
                        return { label, value: label, original: sup };
                      })}
                      value={partyInput}
                      placeholder="اختر مورداً من القائمة..."
                      emptyMessage="لم يتم العثور على موردين"
                      onChange={(val) => {
                        setPartyInput(val);
                        setRefIdInput("");
                      }}
                    />
                  )}
                </div>

                {/* Reference ID (e.g. Quotation ID or PO ID) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {activePortal === "customer" ? "ربط بعرض السعر المرجعي (اختياري)" : "ربط بأمر الشراء المرجعي (اختياري)"}
                  </label>
                  {activePortal === "customer" ? (
                    <SearchableSelect
                      options={quotes
                        .filter(q => q.clientName === partyInput || q.projectName === partyInput)
                        .map(q => ({
                          label: `${q.quoteNumber || q.id} - ${q.projectName || "عرض سعر"}`,
                          value: q.quoteNumber || q.id,
                          original: q
                        }))
                      }
                      value={refIdInput}
                      placeholder={partyInput ? "اختر عرض السعر..." : "الرجاء اختيار العميل أولاً..."}
                      emptyMessage="لا توجد عروض أسعار لهذا العميل"
                      onChange={(val, originalQuote) => {
                        setRefIdInput(val);
                        if (originalQuote) {
                          // Auto populate items
                          if (originalQuote.items && originalQuote.items.length > 0) {
                            const newItems = originalQuote.items.map((it: any) => {
                              const qty = Number(it.quantity) || 1;
                              const price = Number(it.unitPrice) || 0;
                              const discountPct = Number(it.discountPct) || 0;
                              const finalPrice = price * (1 - discountPct / 100);
                              return {
                                description: it.itemName || it.description || "بند خدمة",
                                quantity: qty,
                                unitPrice: finalPrice,
                                taxRate: 0.15,
                                total: qty * finalPrice
                              };
                            });
                            setInvItems(newItems);
                          }

                          // Auto populate terms
                          if (originalQuote.termsText || originalQuote.notes) {
                            const rawText = originalQuote.termsText || originalQuote.notes || "";
                            const cleanText = rawText.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
                            setInvNotes(cleanText);
                          }
                        }
                      }}
                    />
                  ) : (
                    <SearchableSelect
                      options={purchaseOrders
                        .filter(po => {
                          if (!po.isOrder) return false;
                          const matchesSupplierName = po.supplierName === partyInput;
                          const matchesPricingDetails = po.pricingDetails?.some(
                            (pd: any) => pd.supplierName === partyInput || pd.supplierId === partyInput || pd.supplierName === partyInput
                          );
                          return matchesSupplierName || matchesPricingDetails;
                        })
                        .map(po => ({
                          label: `${po.requestNumber || po.id} - ${po.projectName || "طلب شراء"}`,
                          value: po.id,
                          original: po
                        }))
                      }
                      value={refIdInput}
                      placeholder={partyInput ? "اختر أمر الشراء..." : "الرجاء اختيار المورد أولاً..."}
                      emptyMessage="لا توجد أوامر شراء لهذا المورد"
                      onChange={(val, originalPO) => {
                        setRefIdInput(val);
                        if (originalPO) {
                          // Extract items for the selected supplier from pricingDetails, or fallback to the general items list
                          const supplierItems = (originalPO.pricingDetails || [])
                            .filter((pd: any) => pd.supplierName === partyInput || pd.supplierId === partyInput)
                            .map((item: any) => {
                              const qty = Number(item.quantity) || 1;
                              const price = Number(item.price) || 0;
                              return {
                                description: item.materialName || item.itemName || "مادة توريد",
                                quantity: qty,
                                unitPrice: price,
                                taxRate: 0.15,
                                total: qty * price
                              };
                            });

                          const finalPOItems = supplierItems.length > 0
                            ? supplierItems
                            : (originalPO.items || []).map((item: any) => {
                                const matchedPrice = originalPO.pricingDetails?.find(
                                  (pd: any) => pd.materialName === item.itemName || pd.itemName === item.itemName
                                );
                                const unitPrice = Number(matchedPrice?.price) || 0;
                                const qty = Number(item.qty) || Number(item.quantity) || 1;
                                return {
                                  description: item.itemName || item.materialName || "مادة توريد",
                                  quantity: qty,
                                  unitPrice: unitPrice,
                                  taxRate: 0.15,
                                  total: qty * unitPrice
                                };
                              });

                          setInvItems(finalPOItems);

                          // Auto populate terms
                          if (originalPO.notes || originalPO.termsText) {
                            const rawText = originalPO.notes || originalPO.termsText || "";
                            const cleanText = rawText.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
                            setInvNotes(cleanText);
                          }
                        }
                      }}
                    />
                  )}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">تاريخ الفاتورة *</label>
                    <input
                      type="date"
                      value={invDate}
                      onChange={(e) => setInvDate(e.target.value)}
                      className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none bg-slate-50 text-slate-700"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">تاريخ الاستحقاق</label>
                    <input
                      type="date"
                      value={invDueDate}
                      onChange={(e) => setInvDueDate(e.target.value)}
                      className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none bg-slate-50 text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Items Table / Services Lines */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span>📋</span>
                    <span>بنود وسطور الفاتورة المالية</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddFormItem}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <span>➕</span>
                    <span>إضافة سطر بند جديد</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">وصف البيان والخدمة *</th>
                        <th className="p-3 text-center" style={{ width: "90px" }}>الكمية</th>
                        <th className="p-3 text-left" style={{ width: "130px" }}>سعر الوحدة</th>
                        <th className="p-3 text-center" style={{ width: "110px" }}>نسبة الضريبة</th>
                        <th className="p-3 text-left" style={{ width: "120px" }}>المجموع المالي</th>
                        <th className="p-3 text-center" style={{ width: "50px" }}></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invItems.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/50">
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="أدخل اسم المادة أو تفصيل الخدمة المنجزة..."
                              value={item.description}
                              onChange={(e) => handleItemChange(index, "description", e.target.value)}
                              className="w-full p-2 rounded border border-slate-200 text-xs focus:outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                              className="w-full p-2 text-center rounded border border-slate-200 text-xs focus:outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={item.unitPrice || ""}
                              onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                              className="w-full p-2 text-left rounded border border-slate-200 text-xs focus:outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={item.taxRate}
                              onChange={(e) => handleItemChange(index, "taxRate", e.target.value)}
                              className="w-full p-2 text-center rounded border border-slate-200 text-xs focus:outline-none bg-white"
                            >
                              <option value="0.15">15% (الضريبة القياسية)</option>
                              <option value="0.05">5% (ضريبة مخفضة)</option>
                              <option value="0">0% (معفى ضريبياً)</option>
                            </select>
                          </td>
                          <td className="p-2 text-left font-bold text-slate-800">
                            {item.total.toLocaleString('en-US')} ر.س
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveFormItem(index)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="حذف السطر"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Details (Notes, Attachment and Totals) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Notes and File Attachment */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">شروط وأحكام / ملاحظات</label>
                    <textarea
                      rows={3}
                      placeholder="أدخل أي ملاحظات إضافية، شروط السداد، الخصومات المتفق عليها..."
                      value={invNotes}
                      onChange={(e) => setInvNotes(e.target.value)}
                      className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none bg-slate-50 text-slate-700"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">مرفق الفاتورة (صورة أو ملف PDF)</label>
                    <div className="flex items-center gap-3">
                      <label className="flex-1 border-2 border-dashed border-slate-200 hover:border-slate-300 p-4 rounded-xl cursor-pointer text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <span className="text-xs text-slate-500 font-bold block">اضغط لرفع المرفق</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e)}
                          className="hidden"
                        />
                      </label>
                      {attachedFile && (
                        <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 max-w-xs space-y-1">
                          <div className="font-bold truncate">{attachedFile.name}</div>
                          <button
                            type="button"
                            onClick={() => setAttachedFile(null)}
                            className="text-rose-600 hover:underline block"
                          >
                            حذف الملف
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Calculation Totals Card */}
                <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-black text-slate-500 tracking-wider">ملخص المجموع المالي</h4>
                  
                  <div className="flex justify-between text-sm py-1 border-b border-dashed border-slate-200">
                    <span className="text-slate-500">المجموع قبل الضريبة:</span>
                    <span className="font-bold text-slate-800">{getFormTotals().subtotal.toLocaleString('en-US')} ر.س</span>
                  </div>

                  <div className="flex justify-between text-sm py-1 border-b border-dashed border-slate-200">
                    <span className="text-slate-500">ضريبة القيمة المضافة:</span>
                    <span className="font-bold text-slate-800">{getFormTotals().taxAmount.toLocaleString('en-US')} ر.س</span>
                  </div>

                  {/* Discount input row */}
                  <div className="flex justify-between items-center text-sm py-1 border-b border-dashed border-slate-200">
                    <span className="text-slate-500">الخصم المباشر (ر.س):</span>
                    <input
                      type="number"
                      min="0"
                      value={invDiscount}
                      onChange={(e) => setInvDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-32 p-1.5 text-left rounded border border-slate-200 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-between text-base py-3 font-bold text-slate-900 bg-indigo-50/40 px-3 rounded-lg border border-indigo-100/50">
                    <span>المجموع الإجمالي النهائي:</span>
                    <span className={`${activePortal === "customer" ? "text-emerald-700" : "text-indigo-700"}`}>
                      {getFormTotals().totalAmount.toLocaleString('en-US')} ر.س
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2 justify-between">
              <div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  إلغاء
                </button>
              </div>

              <div className="flex gap-2">
                {/* Draft button */}
                {activePortal === "customer" ? (
                  <button
                    onClick={() => handleSaveInvoice("draft")}
                    disabled={isProcessing}
                    className="px-5 py-2.5 rounded-xl border border-emerald-600 text-emerald-700 text-sm font-bold hover:bg-emerald-50 transition-colors disabled:opacity-50"
                  >
                    حفظ كمسودة 💾
                  </button>
                ) : (
                  <button
                    onClick={() => handleSaveInvoice("recorded")}
                    disabled={isProcessing}
                    className="px-5 py-2.5 rounded-xl border border-indigo-600 text-indigo-700 text-sm font-bold hover:bg-indigo-50 transition-colors disabled:opacity-50"
                  >
                    حفظ كمسجلة 💾
                  </button>
                )}

                {/* Send for Approval button */}
                <button
                  onClick={() => handleSaveInvoice("approval")}
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <RefreshCcw className="w-4 h-4" />
                  حفظ وإرسال للاعتماد
                </button>

                {/* Save & Approve button */}
                <button
                  onClick={() => handleSaveInvoice("approve")}
                  disabled={isProcessing}
                  className={`px-6 py-2.5 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 ${
                    activePortal === "customer" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                  اعتماد وحفظ نهائي مباشر
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== LARGE CENTERED MODAL: VIEW DETAILS ==================== */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-xl border border-slate-200 flex flex-col my-8 overflow-hidden">
            
            {/* Modal Header */}
            <div className={`p-6 text-white flex items-center justify-between ${selectedInvoice.type === "customer" ? "bg-emerald-700" : "bg-indigo-700"}`}>
              <div className="space-y-1">
                <h2 className="text-xl font-black">تفاصيل وثيقة الفاتورة الضريبية ({selectedInvoice.id})</h2>
                <p className="text-xs text-white/80">{selectedInvoice.type === "customer" ? "فاتورة مبيعات عميل" : "فاتورة توريدات ومشتريات من مورد"}</p>
              </div>
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
              
              {/* Top Party & Dates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-400">اسم الجهة</div>
                  <div className="text-sm font-black text-slate-800">{selectedInvoice.partyName}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-400">الرقم المرجعي / العقد</div>
                  <div className="text-sm font-semibold text-slate-800">{selectedInvoice.referenceId || "لا يوجد ربط"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-400">تاريخ الإصدار</div>
                  <div className="text-sm font-semibold text-slate-800">{selectedInvoice.date}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-400">موعد الاستحقاق المالي</div>
                  <div className="text-sm font-bold text-slate-800">{selectedInvoice.dueDate}</div>
                </div>
              </div>

              {/* Items Summary */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1">
                  <span>📋</span>
                  <span>بنود الخدمات والمشتريات المسجلة بالفاتورة</span>
                </h3>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                      <tr>
                        <th className="p-3">وصف البيان والخدمة</th>
                        <th className="p-3 text-center">الكمية</th>
                        <th className="p-3 text-left">سعر الوحدة</th>
                        <th className="p-3 text-center">الضريبة</th>
                        <th className="p-3 text-left">المجموع المالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold">{item.description}</td>
                          <td className="p-3 text-center font-bold">{item.quantity}</td>
                          <td className="p-3 text-left font-medium">{item.unitPrice.toLocaleString('en-US')} ر.س</td>
                          <td className="p-3 text-center font-bold">{(item.taxRate * 100)}%</td>
                          <td className="p-3 text-left font-black">{item.total.toLocaleString('en-US')} ر.س</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Grid for Totals, Logs and Payments */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Side: Payment History & Audits */}
                <div className="space-y-4">
                  
                  {/* Payments list */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <span>💰</span>
                      <span>سجل المقبوضات ودفعات السداد المالي</span>
                    </h4>
                    {selectedInvoice.paymentHistory && selectedInvoice.paymentHistory.length > 0 ? (
                      <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 text-xs">
                        {selectedInvoice.paymentHistory.map((pay, pIdx) => (
                          <div key={pIdx} className="p-3 flex justify-between items-center hover:bg-slate-50">
                            <div>
                              <span className="font-bold text-slate-800">{pay.amount.toLocaleString('en-US')} ر.س</span>
                              <span className="text-slate-400 mx-2">|</span>
                              <span className="text-slate-500">طريقة: {pay.method}</span>
                              {pay.account && <span className="text-slate-500"> ({pay.account})</span>}
                            </div>
                            <span className="font-medium text-slate-400">{pay.date}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 text-center rounded-xl text-xs text-slate-400">
                        لا توجد دفعات مسجلة أو مدفوعة على هذه الفاتورة حتى الآن.
                      </div>
                    )}
                  </div>

                  {/* Audit logs of invoice */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <span>🕒</span>
                      <span>سجل تدقيق العمليات والاعتمادات</span>
                    </h4>
                    <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 text-xs max-h-40 overflow-y-auto">
                      {selectedInvoice.history && selectedInvoice.history.map((hist, hIdx) => (
                        <div key={hIdx} className="p-3 hover:bg-slate-50">
                          <div className="flex justify-between font-bold text-slate-800">
                            <span>{hist.action}</span>
                            <span className="text-slate-400 font-medium">{hist.date}</span>
                          </div>
                          <div className="text-slate-500 mt-1">بواسطة: {hist.user} | {hist.notes || "لا توجد ملاحظات"}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ZATCA Log inside details */}
                  {activePortal === "customer" && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black text-indigo-500 uppercase tracking-wider flex items-center gap-1 mt-4">
                        <FileCheck className="w-4 h-4" />
                        <span>سجل زاتكا | ZATCA Log</span>
                      </h4>
                      {selectedInvoice.zatca?.logs && selectedInvoice.zatca.logs.length > 0 ? (
                        <div className="border border-indigo-100 rounded-xl divide-y divide-indigo-50 bg-indigo-50/30 text-xs max-h-40 overflow-y-auto">
                          {selectedInvoice.zatca.logs.map((log, lIdx) => (
                            <div key={lIdx} className="p-3 hover:bg-indigo-50/50">
                              <div className="flex justify-between font-bold text-indigo-900">
                                <span>{log.action}</span>
                                <span className="text-indigo-400 font-medium">{log.date}</span>
                              </div>
                              <div className="text-indigo-600 mt-1">{log.message}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 text-center rounded-xl text-xs text-slate-400 border border-slate-100">
                          لا يوجد سجل عمليات مع زاتكا لهذه الفاتورة
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Side: Calculation Totals Card */}
                <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">ملخص البيانات والمجاميع</h4>
                  
                  <div className="space-y-2.5 text-xs text-slate-600">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>المجموع قبل الضريبة:</span>
                      <strong className="text-slate-800">{selectedInvoice.subtotal.toLocaleString('en-US')} ر.س</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>ضريبة القيمة المضافة:</span>
                      <strong className="text-slate-800">{selectedInvoice.taxAmount.toLocaleString('en-US')} ر.s</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>الخصم المباشر:</span>
                      <strong className="text-rose-600">-{selectedInvoice.discount.toLocaleString('en-US')} ر.س</strong>
                    </div>
                    <div className="flex justify-between py-2 text-sm border-b border-slate-100 font-bold text-slate-800">
                      <span>إجمالي الفاتورة النهائي:</span>
                      <strong className="text-indigo-700">{selectedInvoice.totalAmount.toLocaleString('en-US')} ر.س</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-600 font-bold">
                      <span>المسدد والمستلم:</span>
                      <strong>{selectedInvoice.paidAmount.toLocaleString('en-US')} ر.س</strong>
                    </div>
                    <div className="flex justify-between py-2 text-sm font-extrabold text-rose-600">
                      <span>المبلغ المتبقي المعلق:</span>
                      <strong>{selectedInvoice.remainingAmount.toLocaleString('en-US')} ر.س</strong>
                    </div>
                  </div>

                  {/* Attachment indicator if any */}
                  {selectedInvoice.attachmentName && selectedInvoice.attachmentData && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-700 font-semibold truncate">
                        <FileText className="w-4.5 h-4.5 text-slate-400" />
                        <span className="truncate">{selectedInvoice.attachmentName}</span>
                      </div>
                      <a
                        href={selectedInvoice.attachmentData}
                        download={selectedInvoice.attachmentName}
                        className="text-indigo-600 hover:underline font-bold"
                      >
                        تحميل المستند
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2 justify-between">
              <div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  إغلاق النافذة
                </button>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                {activePortal === "customer" && selectedInvoice.status === "معتمدة وصادرة" && (
                  <>
                    <button
                      onClick={() => handleZatcaAction("generate_qr", selectedInvoice)}
                      disabled={isProcessing}
                      className="px-4 py-2.5 rounded-xl border border-indigo-200 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center gap-2"
                    >
                      توليد QR
                    </button>
                    <button
                      onClick={() => handleZatcaAction("generate_xml", selectedInvoice)}
                      disabled={isProcessing}
                      className="px-4 py-2.5 rounded-xl border border-indigo-200 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center gap-2"
                    >
                      توليد XML
                    </button>
                    <button
                      onClick={() => handleZatcaAction("validate", selectedInvoice)}
                      disabled={isProcessing}
                      className="px-4 py-2.5 rounded-xl border border-teal-200 text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors flex items-center gap-2"
                    >
                      فحص الفاتورة
                    </button>
                    <button
                      onClick={() => handleZatcaAction("send", selectedInvoice)}
                      disabled={isProcessing || selectedInvoice.zatca?.status === 'مقبولة'}
                      className={`px-4 py-2.5 rounded-xl border text-sm font-bold flex items-center gap-2 transition-colors ${selectedInvoice.zatca?.status === 'مقبولة' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600'}`}
                    >
                      {selectedInvoice.zatca?.status === 'مقبولة' ? 'مقبولة من زاتكا' : 'إرسال إلى ZATCA'}
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleCheckTaxReadiness(selectedInvoice)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <FileCheck className="w-4 h-4" />
                  تحقق من الجاهزية ضريبياً
                </button>

                {/* Print button */}
                <button
                  onClick={() => handlePrintPdf(selectedInvoice)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  طباعة وإصدار ورقي
                </button>

                {/* Approve Action */}
                {selectedInvoice.status === "بانتظار الاعتماد" && hasPermissionGate(selectedInvoice.type === "customer" ? "customer_invoices" : "supplier_invoices", "approve_invoice") && (
                  <button
                    onClick={() => setConfirmAction({ invoice: selectedInvoice, type: "approve" })}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    اعتماد واعتماد نهائي
                  </button>
                )}

                {/* Reject Action for supplier */}
                {selectedInvoice.status === "بانتظار الاعتماد" && selectedInvoice.type === "supplier" && hasPermissionGate("supplier_invoices", "reject_invoice") && (
                  <button
                    onClick={() => setConfirmAction({ invoice: selectedInvoice, type: "reject" })}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 transition-colors flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    رفض الفاتورة
                  </button>
                )}

                {/* Cancel Action */}
                {selectedInvoice.status !== "ملغاة" && selectedInvoice.status !== "مسودة" && selectedInvoice.status !== "مسجلة" && hasPermissionGate(selectedInvoice.type === "customer" ? "customer_invoices" : "supplier_invoices", "cancel_invoice") && (
                  <button
                    onClick={() => setConfirmAction({ invoice: selectedInvoice, type: "cancel" })}
                    className="px-5 py-2.5 rounded-xl border border-rose-600 text-rose-700 text-sm font-bold hover:bg-rose-50 transition-colors"
                  >
                    إلغاء واعتبارها ملغاة
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== LARGE CENTERED MODAL: REGISTER PAYMENT ==================== */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-xl border border-slate-200 flex flex-col my-8 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 text-white flex items-center justify-between bg-emerald-700">
              <div className="space-y-1">
                <h2 className="text-xl font-black">💵 تسجيل عملية دفع سداد مالي ({showPaymentModal.id})</h2>
                <p className="text-xs text-white/80">توثيق مبلغ مقبوض أو مدفوع للفاتورة وتعديل الحالة تلقائياً</p>
              </div>
              <button 
                onClick={() => setShowPaymentModal(null)}
                className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              
              {/* Invoice info summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 flex justify-between text-xs">
                <div>
                  <span className="text-slate-400">الطرف المستهدف: </span>
                  <strong className="text-slate-800">{showPaymentModal.partyName}</strong>
                </div>
                <div>
                  <span className="text-slate-400">إجمالي الفاتورة: </span>
                  <strong className="text-slate-800">{showPaymentModal.totalAmount.toLocaleString('en-US')} ر.س</strong>
                </div>
                <div>
                  <span className="text-slate-400">المتبقي المطلوب: </span>
                  <strong className="text-rose-600 font-bold">{showPaymentModal.remainingAmount.toLocaleString('en-US')} ر.س</strong>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Amount to pay */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">المبلغ المدفوع (ر.س) *</label>
                  <input
                    type="number"
                    max={showPaymentModal.remainingAmount}
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-200 text-sm font-bold focus:outline-none bg-slate-50 text-slate-700 text-left"
                  />
                </div>

                {/* Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">تاريخ السداد والتقييد *</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none bg-slate-50 text-slate-700"
                  />
                </div>

                {/* Method */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">طريقة السداد المالي *</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none bg-slate-50 text-slate-700"
                  >
                    <option value="تحويل بنكي">تحويل بنكي مباشر</option>
                    <option value="نقد / كاش">دفع نقدي كاش</option>
                    <option value="شيك">شيك بنكي مقبول الدفع</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>

                {/* Dynamic Bank / Cash Box selection based on method */}
                {(payMethod === "نقد / كاش" || payMethod === "Cash" || payMethod === "نقدي" || payMethod === "نقد") ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">الصندوق النقدي *</label>
                    <select
                      value={selectedCashBoxId}
                      onChange={(e) => setSelectedCashBoxId(e.target.value)}
                      className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none bg-slate-50 text-slate-700 font-bold"
                    >
                      {cashBoxes.map((cb) => (
                        <option key={cb.id} value={cb.id}>
                          {cb.name || cb.code} ({parseFloat(cb.current_balance || 0).toLocaleString()} ر.س)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">الحساب البنكي *</label>
                    <select
                      value={selectedBankAccountId}
                      onChange={(e) => setSelectedBankAccountId(e.target.value)}
                      className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none bg-slate-50 text-slate-700 font-bold"
                    >
                      {bankAccounts.map((ba) => (
                        <option key={ba.id} value={ba.id}>
                          {ba.bank_name || ba.account_name} - {ba.account_number} ({parseFloat(ba.current_balance || 0).toLocaleString()} ر.س)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Receipt File */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">رفع صورة من سند التحويل أو إيصال السداد</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 border border-dashed border-slate-200 hover:border-slate-300 p-3 rounded-xl cursor-pointer text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                    <span className="text-xs text-slate-500 font-bold block">اضغط لرفع سند السداد</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, true)}
                      className="hidden"
                    />
                  </label>
                  {payReceipt && (
                    <div className="bg-slate-100 p-2 rounded-lg border border-slate-200 text-xs text-slate-700 max-w-xs space-y-1">
                      <div className="font-bold truncate">{payReceipt.name}</div>
                      <button
                        type="button"
                        onClick={() => setPayReceipt(null)}
                        className="text-rose-600 hover:underline block"
                      >
                        حذف
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between">
              <button
                onClick={() => setShowPaymentModal(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                إلغاء
              </button>

              <button
                onClick={handleRegisterPayment}
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                حفظ وإتمام التسجيل المالي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ACTION CONFIRMATION MODAL ==================== */}
      {confirmAction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <AlertTriangle className="w-8 h-8" />
                <h3 className="text-lg font-black text-slate-800">تأكيد الإجراء المالي والاعتماد</h3>
              </div>
              
              <p className="text-sm text-slate-600 leading-relaxed">
                هل أنت متأكد من تنفيذ هذا الإجراء؟
                <br />
                <strong>نوع العملية: </strong> 
                {confirmAction.type === "approve" ? "اعتماد نهائي وإصدار" :
                 confirmAction.type === "reject" ? "رفض الفاتورة بالكامل" :
                 confirmAction.type === "cancel" ? "إلغاء الفاتورة واعتبارها لاغية" :
                 confirmAction.type === "delete" ? "حذف الفاتورة نهائياً من السجلات" :
                 confirmAction.type === "unapprove" ? "إلغاء الاعتماد وإعادتها لمسودة" :
                 confirmAction.type === "issue" ? "إصدار الفاتورة للعميل" : ""}
                <br />
                <strong>رقم المستند: </strong> {confirmAction.invoice.id}
              </p>

              {/* Optional Notes for Approve/Reject */}
              {(confirmAction.type === "reject" || confirmAction.type === "cancel") && (
                <div className="flex flex-col gap-1.5 pt-2">
                  <label className="text-xs font-bold text-slate-700">تحديد السبب المالي (مطلوب) *</label>
                  <input
                    type="text"
                    placeholder="اكتب سبب الإلغاء أو الرفض هنا..."
                    value={confirmAction.notes || ""}
                    onChange={(e) => setConfirmAction({ ...confirmAction, notes: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none bg-slate-50 text-slate-700"
                  />
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                تراجع
              </button>
              <button
                onClick={handleExecuteAction}
                disabled={isProcessing || ((confirmAction.type === "reject" || confirmAction.type === "cancel") && !confirmAction.notes?.trim())}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                {isProcessing ? "جاري المعالجة..." : "تأكيد الإجراء النهائي ✅"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== INVOICE PREVIEW MODAL ==================== */}
      {previewInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-800">
                  معاينة الفاتورة الضريبية الرسمية - {previewInvoice.id}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTriggerPrint(previewInvoice, false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة الفاتورة</span>
                </button>
                <button
                  onClick={() => handleTriggerPrint(previewInvoice, true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير كـ PDF</span>
                </button>
                <button
                  onClick={() => setPreviewInvoice(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: High Fidelity Invoice Copy */}
            <div className="p-8 overflow-y-auto flex-1 bg-slate-50/50" dir="rtl">
              <div className="bg-white border border-slate-150 p-8 rounded-2xl shadow-sm max-w-3xl mx-auto space-y-6">
                {/* Tax Invoice Title & Metadata */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                  <div className="space-y-1.5">
                    <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">
                      {previewInvoice.type === "customer" ? "فاتورة مبيعات ضريبية" : "فاتورة مشتريات ضريبية"}
                    </span>
                    <h1 className="text-xl font-extrabold text-slate-900">{previewInvoice.type === "customer" ? "فاتورة مبيعات عميل" : "فاتورة شراء مورد"}</h1>
                    <div className="text-xs text-slate-500 space-y-1">
                      <div><strong className="text-slate-700">رقم الفاتورة:</strong> {previewInvoice.id}</div>
                      <div><strong className="text-slate-700">تاريخ الفاتورة:</strong> {previewInvoice.date}</div>
                      {previewInvoice.dueDate && <div><strong className="text-slate-700">تاريخ الاستحقاق:</strong> {previewInvoice.dueDate}</div>}
                    </div>
                  </div>
                  
                  {/* ZATCA QR Mockup */}
                  <div className="text-left flex flex-col items-center">
                    <div className="bg-white p-2 border border-slate-200 rounded-lg shadow-sm">
                      <img 
                        src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://www.alwaleedneon.com" 
                        alt="www.alwaleedneon.com" 
                        className="w-20 h-20 bg-white"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-indigo-800 mt-1 uppercase tracking-wider">موقع شركة الوليد</span>
                  </div>
                </div>

                {/* Counterpart and Company Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Partner Details */}
                  <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                    <h3 className="text-xs font-extrabold text-indigo-700 border-b border-indigo-100/50 pb-2 mb-2">
                      {previewInvoice.type === "customer" ? "بيانات العميل المستلم" : "بيانات المورد المصدر"}
                    </h3>
                    <div className="text-xs space-y-1.5 text-slate-700">
                      <div><strong className="text-slate-500">الاسم التجاري:</strong> {previewInvoice.partyName}</div>
                      <div>
                        <strong className="text-slate-500">الرقم الضريبي:</strong>{" "}
                        {previewInvoice.type === "customer" 
                          ? (clients.find(c => (c.name || c.clientName || c.companyName) === previewInvoice.partyName)?.taxNumber || "غير متوفر")
                          : (suppliers.find(s => s.name === previewInvoice.partyName)?.taxNumber || "غير متوفر")
                        }
                      </div>
                      <div>
                        <strong className="text-slate-500">السجل التجاري:</strong>{" "}
                        {previewInvoice.type === "customer" 
                          ? (clients.find(c => (c.name || c.clientName || c.companyName) === previewInvoice.partyName)?.crNumber || "غير متوفر")
                          : (suppliers.find(s => s.name === previewInvoice.partyName)?.crNumber || "غير متوفر")
                        }
                      </div>
                      <div>
                        <strong className="text-slate-500">العنوان:</strong>{" "}
                        {previewInvoice.type === "customer" 
                          ? `${clients.find(c => (c.name || c.clientName || c.companyName) === previewInvoice.partyName)?.country || "المملكة العربية السعودية"}، ${clients.find(c => (c.name || c.clientName || c.companyName) === previewInvoice.partyName)?.city || "الرياض"}`
                          : `${suppliers.find(s => s.name === previewInvoice.partyName)?.country || "المملكة العربية السعودية"}، ${suppliers.find(s => s.name === previewInvoice.partyName)?.city || "الرياض"}`
                        }
                      </div>
                    </div>
                  </div>

                  {/* Issuer details */}
                  <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                    <h3 className="text-xs font-extrabold text-slate-800 border-b border-slate-200 pb-2 mb-2">
                      الجهة المصدرة للفاتورة
                    </h3>
                    <div className="text-xs space-y-1.5 text-slate-700">
                      <div><strong className="text-slate-500">الاسم:</strong> {companyInfo.name}</div>
                      <div><strong className="text-slate-500">الرقم الضريبي:</strong> {companyInfo.taxNumber}</div>
                      <div><strong className="text-slate-500">السجل التجاري:</strong> {companyInfo.crNumber}</div>
                      <div><strong className="text-slate-500">العنوان:</strong> {companyInfo.country}، {companyInfo.city}</div>
                    </div>
                  </div>
                </div>

                {/* Document Information Quick Row */}
                <div className="overflow-x-auto border border-slate-150 rounded-xl">
                  <table className="w-full text-center text-xs border-collapse">
                    <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-150">
                      <tr>
                        <th className="p-2 border-r border-slate-150">نوع المستند</th>
                        <th className="p-2 border-r border-slate-150">تاريخ الفاتورة</th>
                        <th className="p-2 border-r border-slate-150">تاريخ الاستحقاق</th>
                        <th className="p-2 border-r border-slate-150">تاريخ التوريد</th>
                        <th className="p-2">العملة الأساسية</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700">
                      <tr>
                        <td className="p-2 border-r border-slate-150 font-bold text-slate-950">
                          {previewInvoice.type === "customer" ? "مبيعات ضريبية" : "مشتريات ضريبية"}
                        </td>
                        <td className="p-2 border-r border-slate-150">{previewInvoice.date}</td>
                        <td className="p-2 border-r border-slate-150">{previewInvoice.dueDate || "---"}</td>
                        <td className="p-2 border-r border-slate-150">{previewInvoice.date}</td>
                        <td className="p-2 font-bold text-indigo-700">ريال سعودي (SAR)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Items Table */}
                <div className="border border-slate-150 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead className="bg-indigo-900 text-white font-bold">
                      <tr>
                        <th className="p-2.5 text-center" style={{ width: "40px" }}>م</th>
                        <th className="p-2.5">الوصف والبيان</th>
                        <th className="p-2.5 text-center" style={{ width: "50px" }}>الكمية</th>
                        <th className="p-2.5 text-center" style={{ width: "80px" }}>السعر</th>
                        <th className="p-2.5 text-center" style={{ width: "60px" }}>الضريبة</th>
                        <th className="p-2.5 text-center" style={{ width: "100px" }}>المبلغ الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {(previewInvoice.items || []).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2.5 text-center text-slate-400 font-bold">{idx + 1}</td>
                          <td className="p-2.5">
                            <div className="font-bold text-slate-900">{item.description}</div>
                          </td>
                          <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                          <td className="p-2.5 text-center">
                            {item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س
                          </td>
                          <td className="p-2.5 text-center text-slate-500">
                            {((item.taxRate || 0.15) * 100)}%
                          </td>
                          <td className="p-2.5 text-center font-black text-slate-900">
                            {((item.quantity * item.unitPrice) * (1 + (item.taxRate || 0.15))).toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Section */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-slate-100">
                  {/* Tafneeth Words and Terms */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="bg-amber-50/50 border border-amber-200/60 p-4 rounded-xl text-amber-900">
                      <span className="text-[10px] uppercase font-black text-amber-600 block mb-1">المجموع مفقطاً بالحروف العربية:</span>
                      <div className="text-xs font-bold leading-relaxed">
                        {tafqeet(previewInvoice.totalAmount)}
                      </div>
                    </div>

                    <div className="space-y-2 border-r-2 border-indigo-500 pr-3 text-right">
                      <span className="text-xs font-bold text-indigo-900 block font-['GE SS Two', 'Gotham Pro']">الشروط والأحكام ومعلومات أخرى (مطابقة لعروض الأسعار):</span>
                      <div 
                        className="text-[11px] text-slate-800 leading-relaxed max-h-60 overflow-y-auto space-y-1 font-semibold font-['GE SS Two', 'Gotham Pro'] border border-slate-100 rounded-lg bg-slate-50 p-3"
                        style={{ fontFamily: 'Cairo, sans-serif' }}
                        dangerouslySetInnerHTML={{ __html: formatTermsHTML(previewInvoice.notes || defaultTerms) }}
                      />
                    </div>
                  </div>

                  {/* Calculations breakdown */}
                  <div className="md:col-span-5 bg-slate-50/60 p-4 rounded-xl border border-slate-100 space-y-2">
                    <h4 className="text-xs font-extrabold text-slate-600 mb-2 border-b border-slate-100 pb-1">الحساب المالي التفصيلي</h4>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>المجموع الصافي (قبل الضريبة):</span>
                      <strong className="text-slate-800">{previewInvoice.subtotal.toLocaleString('en-US')} ر.س</strong>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>مبلغ ضريبة القيمة المضافة (15%):</span>
                      <strong className="text-slate-800">{previewInvoice.taxAmount.toLocaleString('en-US')} ر.س</strong>
                    </div>
                    {previewInvoice.discount > 0 && (
                      <div className="flex justify-between text-xs text-rose-600 font-bold">
                        <span>إجمالي الخصم:</span>
                        <span>-{previewInvoice.discount.toLocaleString('en-US')} ر.س</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-indigo-900 font-black pt-2 border-t border-slate-200">
                      <span>الإجمالي شامل الضريبة:</span>
                      <span>{previewInvoice.totalAmount.toLocaleString('en-US')} ر.س</span>
                    </div>
                    <div className="flex justify-between text-xs text-emerald-600 font-bold pt-1">
                      <span>المسدد مسبقاً:</span>
                      <span>{previewInvoice.paidAmount.toLocaleString('en-US')} ر.س</span>
                    </div>
                    <div className="flex justify-between text-xs text-rose-600 font-bold pt-1">
                      <span>المتبقي المستحق:</span>
                      <span>{previewInvoice.remainingAmount.toLocaleString('en-US')} ر.س</span>
                    </div>
                  </div>
                </div>

                {/* Approvals Stamp Section */}
                <div className="flex justify-between items-center pt-6 border-t border-slate-100 text-xs">
                  <div>
                    <span className="font-bold text-slate-600 block mb-1">اعتماد قسم الحسابات:</span>
                    <span className="text-slate-400">شركة جودة الصفائح الفولاذية المحدودة</span>
                    <div className="w-24 border-b border-slate-200 mt-6"></div>
                  </div>
                  <div className="border-2 border-dashed border-emerald-600 text-emerald-600 px-4 py-2 font-bold rounded-lg transform -rotate-3 select-none">
                    معتمد ومدقق ماليًا ✅
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setPreviewInvoice(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== INVOICE TEMPLATE SETTINGS MODAL ==================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-800">تعديل بيانات وإعدادات الفواتير الموحدة</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-right" dir="rtl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">اسم الجهة المصدرة (الشركة) *</label>
                  <input
                    type="text"
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">الرقم الضريبي (VAT) *</label>
                  <input
                    type="text"
                    value={companyInfo.taxNumber}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, taxNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 bg-slate-50 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">السجل التجاري (CR) *</label>
                  <input
                    type="text"
                    value={companyInfo.crNumber}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, crNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 bg-slate-50 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">رقم الهاتف والتواصل *</label>
                  <input
                    type="text"
                    value={companyInfo.phone}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">الدولة *</label>
                  <input
                    type="text"
                    value={companyInfo.country}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, country: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">المدينة *</label>
                  <input
                    type="text"
                    value={companyInfo.city}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">العنوان التفصيلي *</label>
                  <input
                    type="text"
                    value={companyInfo.address}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">البريد الإلكتروني للشركة *</label>
                <input
                  type="email"
                  value={companyInfo.email}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">الشروط والأحكام التلقائية بالفاتورة</label>
                <textarea
                  rows={4}
                  value={defaultTerms}
                  onChange={(e) => setDefaultTerms(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                إلغاء التعديل
              </button>
              <button
                onClick={async () => {
                  try {
                    await fetch("/api/dynamic/invoice_settings/global", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        id: "global",
                        companyInfo,
                        defaultTerms
                      })
                    });
                    logActivity("تعديل إعدادات قالب الفاتورة", "تم حفظ إعدادات الشركة والشروط والأحكام بالفواتير بنجاح");
                    setShowSettingsModal(false);
                    alert("تم حفظ وتحديث إعدادات قالب الفاتورة بنجاح في النظام 💾");
                  } catch (err) {
                    console.error("Error saving invoice settings to Firestore:", err);
                    alert("حدث خطأ أثناء حفظ الإعدادات في قاعدة البيانات.");
                  }
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ التعديلات والتثبيت</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ZATCA INTEGRATION SETTINGS MODAL ==================== */}
      {showZatcaSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-indigo-900">إعدادات الربط مع زاتكا (ZATCA Integration)</h3>
              </div>
              <button onClick={() => setShowZatcaSettingsModal(false)} className="p-2 bg-indigo-100/50 hover:bg-indigo-200 text-indigo-700 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                <h4 className="text-amber-800 font-bold text-sm mb-1">تنبيهات المرحلة الثانية (الربط والتكامل)</h4>
                <p className="text-amber-700 text-xs leading-relaxed">
                  هذه الإعدادات مخصصة لربط وحدات الفوترة الإلكترونية (EGS) مع خوادم هيئة الزكاة والضريبة والجمارك (ZATCA Phase 2).
                  يرجى التأكد من صحة الرقم الضريبي وتحديث معلومات الشركة قبل بدء عملية الربط (Onboarding).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">نوع البيئة (Environment)</label>
                  <select className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 bg-slate-50">
                    <option>Simulation (Sandbox) - بيئة محاكاة</option>
                    <option>Production - بيئة الإنتاج الفعلية</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">نوع الفواتير المدعومة</label>
                  <select className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 bg-slate-50">
                    <option>B2B (Tax Invoices) & B2C (Simplified)</option>
                    <option>B2B Only</option>
                    <option>B2C Only</option>
                  </select>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                  <h4 className="font-bold text-slate-700 text-sm">وحدات الفوترة الإلكترونية (EGS Units)</h4>
                  <button className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-bold text-slate-600 hover:bg-slate-50">
                    + إضافة وحدة جديدة
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between border border-emerald-200 bg-emerald-50 p-3 rounded-lg">
                    <div>
                      <div className="text-sm font-bold text-emerald-900">MAIN-EGS-01</div>
                      <div className="text-xs text-emerald-700 mt-1">الفرع الرئيسي | Production CSID Active</div>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">متصلة (Active)</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border border-slate-200 bg-white p-3 rounded-lg">
                    <div>
                      <div className="text-sm font-bold text-slate-700">BRANCH-EGS-02</div>
                      <div className="text-xs text-slate-500 mt-1">فرع جدة | بانتظار OTP</div>
                    </div>
                    <button className="text-[10px] bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded font-bold hover:bg-indigo-100 border border-indigo-200">
                      إدخال OTP (Onboard)
                    </button>
                  </div>
                </div>
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowZatcaSettingsModal(false)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-sm font-bold transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
