import { getStatusColors } from '../lib/statusUtils';
import { hasPermission, getAccessLevel, getAdvancedPermissionScope } from '../lib/permissions';

import React, { useState, useEffect, useRef } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// Register custom fonts
try {
  const Font = Quill.import('formats/font') as any;
  Font.whitelist = ['tajawal', 'arial', 'tahoma', 'cairo', 'times-new-roman'];
  Quill.register(Font, true);
} catch (e) {
  console.log("Quill font loading error", e);
}

import { 
  FileText, Search, Plus, Filter, ArrowRight, Save, CheckCircle, Eye, Copy, 
  Trash2, Edit2, Check, AlertCircle, XCircle 
} from 'lucide-react';
import { Client, WarehouseItem } from '../types';
import { searchQuotationsIndexed } from '../lib/searchIndex';
import { sharedPrintHeader, sharedPrintFooter, sharedPrintStyles } from '../utils/PrintShared';
import { numberToArabicWords } from '../utils/Tafqeet';

export interface SalesQuoteItem {
  id: string; 
  itemCode: string;
  itemName: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPct: number;
  internalNotes: string;
}

export interface SalesQuotation {
  id: string;
  quotationNumber: string;
  financialYear: string;
  quoteDate: string; 
  quoteToType: 'client' | 'initiative';
  clientId: string; 
  clientName: string;
  projectName: string;
  orderType: 'مبيعات' | 'صيانة';
  currency: string;
  items: SalesQuoteItem[];
  status: 'مسودة' | 'نشط' | 'معتمد';
  approvedBy?: string;
  createdBy?: string;
  salesRepName?: string;
  termsText: string;
  dateCreated: string;
  lastUpdated: string;
}

interface Props {
  lang: 'ar' | 'en';
  user: any;
}

const tafqeet = (num: number, currency: string) => {
  const cName = currency === 'SAR' ? 'ريال سعودي' : currency;
  return numberToArabicWords(num) + ' ' + cName + ' فقط لا غير';
};

const contractText = `عند دفع العربون فإنه يعد كموافقة على هذا العرض و يعمل به كوثيقة عقد تجاري بين الطرفين الواردة بياناتهم
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

export default function SalesQuotations({ lang, user }: Props) {
  const [quotes, setQuotes] = useState<SalesQuotation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [termsTemplates, setTermsTemplates] = useState<{id: string, name: string, content: string}[]>([{
    id: 'contract',
    name: 'نموذج العقد القياسي Contract',
    content: contractText
  }]);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState<'list' | 'edit'>('list');
  const [editorQtn, setEditorQtn] = useState<Partial<SalesQuotation> | null>(null);
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);

  // List Filters
  const [searchName, setSearchName] = useState('');
  const [searchQtn, setSearchQtn] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc'|'asc'>('desc');
  const [statusFilter, setStatusFilter] = useState('الكل');

  const isUserPrivileged = getAccessLevel(user, 'sales', 'deleteAccess') === 'all';

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmTimer, setDeleteConfirmTimer] = useState<any>(null);
  const [toastMsg, setToastMsg] = useState<{text: string, type: 'success'|'error'} | null>(null);

  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm';
    message: string;
    onConfirm?: () => void;
  }>({ isOpen: false, type: 'alert', message: '' });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({text, type});
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resQ, resC, resW, resT] = await Promise.all([
        fetch('/api/sales_quotations'),
        fetch('/api/clients'),
        fetch('/api/warehouse_items'),
        fetch('/api/dynamic/terms_templates')
      ]);
      if (resQ.ok) {
        let loadedQuotes = await resQ.json();
        // Permission check for viewing
        const viewScope = getAdvancedPermissionScope(user, 'sales', 'quotations', 'view_quotes');
        if (viewScope === 'own') {
           loadedQuotes = loadedQuotes.filter((q: any) => q.createdBy?.toLowerCase() === user?.username?.toLowerCase());
        } else if (viewScope === 'none') {
           loadedQuotes = [];
        }
        setQuotes(loadedQuotes);
      }
      if (resC.ok) setClients(await resC.json());
      if (resW.ok) setWarehouseItems(await resW.json());
      if (resT.ok) {
         const t = await resT.json();
         setTermsTemplates(prev => {
            // Keep the default contract template
            const others = t.filter((x:any) => x.id !== 'contract');
            return [prev[0], ...others];
         });
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQtn = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const qtn = quotes.find(q => q.id === id);
    if (qtn?.status === 'معتمد') {
       showToast(lang === 'ar' ? 'لا يمكن حذف عرض سعر معتمد' : 'Cannot delete approved quotation', 'error');
       return;
    }
    if (!isUserPrivileged) return;
    
    setDialogConfig({
      isOpen: true,
      type: 'confirm',
      message: 'هل أنت متأكد من حذف عرض السعر بشكل نهائي؟',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/sales_quotations/${id}`, { method: 'DELETE' });
          if (res.ok) {
            setQuotes(prev => prev.filter(q => q.id !== id));
            showToast(lang === 'ar' ? 'تم حذف عرض السعر بنجاح' : 'Quotation deleted successfully', 'success');
          }
        } catch(err) { showToast(lang === 'ar' ? 'فشل الحذف' : 'Deletion failed', 'error'); }
        setDialogConfig(prev => ({...prev, isOpen: false}));
      }
    });
  };

  const handleDeleteSelected = () => {
    if (!isUserPrivileged) {
       setDialogConfig({isOpen:true, type:'alert', message:'ليس لديك صلاحية الحذف'});
       return;
    }
    if (selectedQuotes.length === 0) return;
    
    // Check if any is approved
    const hasApproved = quotes.some(q => selectedQuotes.includes(q.id) && q.status === 'معتمد');
    if (hasApproved) {
       setDialogConfig({isOpen:true, type:'alert', message:'يوجد عروض أسعار معتمدة لا يمكن نعديلها أو حذفها'});
       return;
    }

    setDialogConfig({
      isOpen: true,
      type: 'confirm',
      message: 'هل أنت متأكد من حذف عروض الأسعار المحددة نهائياً؟',
      onConfirm: async () => {
        try {
          for (let id of selectedQuotes) {
            await fetch(`/api/sales_quotations/${id}`, { method: 'DELETE' });
          }
          setQuotes(prev => prev.filter(q => !selectedQuotes.includes(q.id)));
          setSelectedQuotes([]);
          showToast(lang === 'ar' ? 'تم حذف عروض الأسعار المحددة بنجاح' : 'Selected quotations deleted successfully', 'success');
        } catch(err) { showToast(lang === 'ar' ? 'فشل الحذف' : 'Deletion failed', 'error'); }
        setDialogConfig(prev => ({...prev, isOpen: false}));
      }
    });
  };




  const getPrintStyles = () => `
@page {
  size: A4 portrait;
  margin: 10mm 15mm 15mm 15mm;
}
html,
body {
  margin: 0;
  padding: 0;
  background: #ffffff;
  font-family: 'GE SS Two', 'Gotham Pro', Arial, Tahoma, sans-serif;
  color: #111;
  direction: rtl;
}
.quotation-print-wrapper {
  background: #ffffff;
  width: 100%;
  min-height: 100vh;
  direction: rtl;
}
.print-button {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 9999;
  background: #1e73b9;
  color: white;
  border: none;
  padding: 10px 22px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}
.quotation-print-page {
  width: 210mm;
  min-height: 297mm;
  box-sizing: border-box;
  padding: 4mm 6mm 8mm 6mm;
  background: #fff;
  margin: 0 auto;
  position: relative;
  direction: rtl;
  font-size: 11px;
}
/* أعلى كلمة مسودة */
.quotation-status {
  text-align: center;
  font-size: 17px;
  font-weight: 700;
  text-decoration: underline;
  color: #000;
  margin-top: 0;
  margin-bottom: 8mm;
}
/* رأس الصفحة */
.quotation-header {
  width: 100%;
  height: 35mm;
  position: relative;
}
.company-left {
  position: absolute;
  left: 0;
  top: 2mm;
  text-align: left;
  color: #777;
  direction: rtl;
}
.company-name-ar {
  font-size: 19px;
  letter-spacing: 3px;
  font-weight: 400;
  color: #777;
  white-space: nowrap;
}
.company-name-en {
  font-size: 13px;
  letter-spacing: 1.4px;
  font-weight: 700;
  color: #555;
  margin-top: 2px;
  direction: ltr;
  white-space: nowrap;
}
.company-logo-box {
  position: absolute;
  right: 0;
  top: 0;
  width: 36mm;
  height: 30mm;
  text-align: right;
}
.company-logo {
  max-width: 34mm;
  max-height: 29mm;
  object-fit: contain;
}
/* بيانات الشركة في المنتصف */
.middle-company-info {
  text-align: center;
  font-size: 9.5px;
  font-weight: 600;
  line-height: 1.55;
  margin-top: -16mm;
  margin-bottom: 2mm;
}
/* عنوان عروض الأسعار */
.quotation-title-box {
  text-align: right;
  margin-top: -13mm;
  margin-bottom: 6mm;
}
.quotation-title {
  font-size: 21px;
  font-weight: 400;
  color: #111;
  margin-bottom: 3mm;
}
.quotation-number {
  font-size: 14px;
  direction: ltr;
  font-weight: 500;
}
.header-line {
  border-top: 1px solid #9d9d9d;
  border-bottom: 1px solid #e6e6e6;
  height: 1px;
  margin: 0 0 7mm 0;
}
/* جدول بيانات العميل */
.client-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  margin-bottom: 8mm;
  font-size: 10.5px;
}
.client-table th,
.client-table td {
  border: 1px solid #d5d5d5;
  padding: 5px 7px;
  vertical-align: top;
  background: #fff;
}
.client-table th {
  width: 17%;
  text-align: center;
  font-weight: 700;
  color: #111;
}
.client-table td {
  width: 33%;
  text-align: center;
  font-weight: 600;
  color: #111;
}
.client-address {
  line-height: 1.45;
  direction: ltr;
  text-align: center !important;
}
/* جدول الأصناف */
.items-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  margin-bottom: 7mm;
  font-size: 10px;
}
.client-table th, .client-table td, .items-table th, .items-table td, .totals-table th, .totals-table td {
  text-align: center !important;
  vertical-align: middle !important;
}
.items-table th,
.items-table td {
  border: 1px solid #d8d8d8;
  padding: 6px 4px;
  text-align: center;
  vertical-align: middle;
  background: #fff;
  color: #111;
}
.items-table th {
  font-weight: 700;
  line-height: 1.25;
}
.items-table td {
  min-height: 14mm;
  height: 16mm;
  font-weight: 500;
}
.col-index {
  width: 7%;
}
.col-code {
  width: 8%;
}
.col-name {
  width: 19%;
}
.col-desc {
  width: 28%;
}
.col-qty {
  width: 9%;
}
.col-unit {
  width: 9%;
}
.col-price {
  width: 10%;
}
.col-amount {
  width: 10%;
}
.ltr-cell {
  direction: ltr;
  text-align: center;
  line-height: 1.25;
  font-size: 9.5px;
  font-weight: 600;
}
.desc-cell {
  direction: ltr;
  text-align: center;
  line-height: 1.25;
  font-size: 9.5px;
}
/* جدول المجاميع */
.totals-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  margin-top: 2mm;
  margin-bottom: 7mm;
  font-size: 10.8px;
}
.totals-table th,
.totals-table td {
  border: 1px solid #e0e0e0;
  padding: 6px 8px;
  background: #fff;
}
.totals-table th {
  width: 65%;
  text-align: center;
  font-weight: 700;
}
.totals-table td {
  width: 35%;
  text-align: center;
  direction: ltr;
  font-weight: 700;
}
.bold-total th,
.bold-total td {
  font-weight: 800;
}
.total-words {
  text-align: center !important;
  direction: rtl !important;
  font-weight: 800 !important;
  font-style: italic;
}
.vat-note {
  text-align: center !important;
  direction: rtl !important;
  font-weight: 800 !important;
  font-style: italic;
}
/* الشروط */
.terms-box {
  border: 1px solid #777;
  padding: 4mm 5mm;
  margin-top: 5mm;
  min-height: 115mm;
  page-break-inside: auto;
}
.terms-title {
  color: #b8b8b8;
  font-size: 12px;
  font-style: italic;
  text-align: right;
  margin-bottom: 7mm;
}
.terms-content {
  text-align: right;
  font-size: 10.2px;
  line-height: 1.55;
  color: #000;
  direction: rtl;
  white-space: pre-wrap; /* or pre-line */
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
  box-sizing: border-box;
  font-weight: 600;
}
.terms-content * {
  max-width: 100%;
  word-wrap: break-word;
  overflow-wrap: break-word;
  box-sizing: border-box;
}
.terms-content strong,
.terms-content b {
  font-weight: 800;
}
.terms-content .red,
.terms-content .important {
  color: #c00000;
  font-weight: 800;
}
.no-print {
  display: block;
}
/* Quill Print Styles */
.ql-align-center { text-align: center; }
.ql-align-right { text-align: right; }
.ql-align-left { text-align: left; }
.ql-align-justify { text-align: justify; }
.ql-font-tajawal { font-family: 'GE SS Two', 'Gotham Pro', sans-serif; }
.ql-font-arial { font-family: 'Arial', sans-serif; }
.ql-font-tahoma { font-family: 'Tahoma', sans-serif; }
.ql-font-cairo { font-family: 'GE SS Two', 'Gotham Pro', sans-serif; }
.ql-font-times-new-roman { font-family: 'Times New Roman', serif; }
.terms-content ul { padding-right: 20px; list-style-type: disc; }
.terms-content ol { padding-right: 20px; list-style-type: decimal; }
@media print {
  body {
    background: #ffffff !important;
  }
  .quotation-print-page {
    width: 100% !important;
    min-height: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    page-break-after: always;
  }
  
  .quotation-print-page:last-child {
    page-break-after: auto;
  }
  .no-print,
  .print-button {
    display: none !important;
  }
  .items-table,
  .client-table,
  .totals-table {
    page-break-inside: avoid;
  }
  .terms-box {
    page-break-inside: auto;
  }
}
  `;
  const generateSingleHTML = (sq, matchingClient, totalRounded, subtotal, vat, total, formattedTermsText) => {
    const statusText = sq.status || "مسودة";
    const statusColor = statusText === 'معتمد' ? '#10b981' : '#f59e0b';
    const statusBg = statusText === 'معتمد' ? '#ecfdf5' : '#fffbeb';

    return `
            <div class="quotation-print-page">
              <!-- رأس الصفحة المدمج مع الحالة في المنتصف -->
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0072BC; padding-bottom: 8px; margin-bottom: 20px; user-select: none; direction: ltr;">
                <!-- معلومات الشركة -->
                <div style="text-align: left; display: flex; flex-direction: column; justify-content: center; width: 40%;">
                  <h2 style="font-size: 20px; font-weight: 900; color: #374151; margin: 0; font-family: 'GE SS Two', 'Gotham Pro', sans-serif;" dir="rtl">
                    شركة فنون الوليد للصناعة
                  </h2>
                  <h3 style="font-size: 10px; font-weight: bold; color: #6b7280; margin: 2px 0 0 0; letter-spacing: 0.1em; font-family: sans-serif;">
                    FONOUN ALWALEED INDUSTRIAL CO.
                  </h3>
                </div>
                
                <!-- الحالة في منتصف رأس الصفحة -->
                <div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 20%;">
                  <span style="font-size: 15px; font-weight: 800; padding: 4px 14px; border: 2px solid ${statusColor}; color: ${statusColor}; border-radius: 6px; font-family: 'GE SS Two', 'Gotham Pro', 'GE SS Two', 'Gotham Pro', sans-serif; background-color: ${statusBg}; white-space: nowrap;">
                    ${statusText}
                  </span>
                </div>

                <!-- الشعار -->
                <div style="text-align: right; width: 40%; display: flex; justify-content: flex-end;">
                  <img src="https://pbs.twimg.com/media/HE46IrybcAAMq7L?format=png&name=small" referrerpolicy="no-referrer" alt="Fonoun Alwaleed Logo" style="width: 70px; height: 70px; object-fit: contain;" />
                </div>
              </div>
              
              <div style="justify-content: space-between; display: flex; align-items: flex-end; margin-bottom: 3mm; direction: rtl;">
                <!-- Title "عروض أسعار" on the right -->
                <div style="width: 45%; text-align: right;">
                   <div style="font-size: 24px; font-weight: 700; color: #111;">عروض أسعار</div>
                   <div style="font-size: 16px; direction: rtl; font-weight: 600;">${sq.quotationNumber || '-'}</div>
                </div>
                <!-- Address on the left -->
                <div style="width: 45%; text-align: left; font-size: 14px; font-weight: 600; line-height: 1.5; color: #333;">
                  <div>32445 شارع ابوبكر الرازي</div>
                  <div>حي النور - الدمام</div>
                </div>
              </div>
              <div class="header-line"></div>
              <!-- جدول بيانات العميل -->
              <table class="client-table">
                <tbody>
                  <tr>
                    <th>اسم</th>
                    <td>${sq.clientName}</td>
                    <th>تاريخ التسعيرة</th>
                    <td>${sq.quoteDate}</td>
                  </tr>
                  <tr>
                    <th>جهة اتصال</th>
                    <td class="client-address" style="line-height:1.5;">
                      ${matchingClient.email ? ("الإيميل: " + matchingClient.email + "<br />") : ""}
                      ${matchingClient.mobile || matchingClient.phone ? ("الجوال: " + (matchingClient.mobile || matchingClient.phone) + "<br />") : ""}
                      ${matchingClient.crNumber ? ("س.ت: " + matchingClient.crNumber) : ""}
                      ${!matchingClient.email && !matchingClient.mobile && !matchingClient.phone && !matchingClient.crNumber ? (matchingClient.contactName || "") : ""}
                    </td>
                    <th>عنوان</th>
                    <td class="client-address" style="line-height:1.5;">
                      ${matchingClient.address || ""}<br />
                      ${matchingClient.city || ""}<br />
                      ${matchingClient.postalCode ? ("الرمز البريدي: " + matchingClient.postalCode + "<br />") : ""}
                      ${matchingClient.country || ""}
                    </td>
                  </tr>
                  <tr>
                    <th>الرقم الضريبي للعميل</th>
                    <td colspan="3">${matchingClient.taxNumber || ""}</td>
                  </tr>
                </tbody>
              </table>
              <!-- جدول الأصناف -->
              <table class="items-table">
                <thead>
                  <tr>
                    <th class="col-index">الرقم</th>
                    <th class="col-code">رمز<br />الصنف</th>
                    <th class="col-name">اسم الصنف</th>
                    <th class="col-desc">وصف</th>
                    <th class="col-qty">الكمية</th>
                    <th class="col-unit">وحدة<br />القياس</th>
                    <th class="col-price">سعر الوحدة</th>
                    <th class="col-amount">مبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  ${(sq.items || []).map((item, index) => {
                    const cSym = sq.currency === 'SAR' ? 'ر.س' : (sq.currency === 'USD' ? '$' : (sq.currency || 'ر.س'));
                    return `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${item.itemCode || ""}</td>
                      <td class="ltr-cell">${item.itemName || ""}</td>
                      <td class="desc-cell" style="white-space:pre-wrap;">${item.description || ""}</td>
                      <td>${item.quantity || 0}</td>
                      <td>${item.unit || ""}</td>
                      <td dir="ltr">${Number(item.unitPrice || 0).toLocaleString('en-US',{minimumFractionDigits:2})} ${cSym}</td>
                      <td dir="ltr">${((item.quantity || 0) * (item.unitPrice || 0) * (1 - (item.discountPct||0)/100)).toLocaleString('en-US',{minimumFractionDigits:2})} ${cSym}</td>
                    </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
              <!-- المجاميع -->
              <table class="totals-table">
                <tbody>
                  <tr>
                    <th>المجموع الصافي</th>
                    <td dir="ltr">${subtotal.toLocaleString('en-US',{minimumFractionDigits:2})} ${sq.currency === 'SAR' ? 'ر.س' : (sq.currency === 'USD' ? '$' : (sq.currency || 'ر.س'))}</td>
                  </tr>
                  <tr>
                    <th>ضريبة القيمة المضافة VAT (15%)</th>
                    <td dir="ltr">${vat.toLocaleString('en-US',{minimumFractionDigits:2})} ${sq.currency === 'SAR' ? 'ر.س' : (sq.currency === 'USD' ? '$' : (sq.currency || 'ر.س'))}</td>
                  </tr>
                  <tr class="bold-total">
                    <th>المجموع الإجمالي *</th>
                    <td dir="ltr">${total.toLocaleString('en-US',{minimumFractionDigits:2})} ${sq.currency === 'SAR' ? 'ر.س' : (sq.currency === 'USD' ? '$' : (sq.currency || 'ر.س'))}</td>
                  </tr>
                  <tr>
                    <th>إجمالي مقرب</th>
                    <td dir="ltr">${totalRounded.toLocaleString('en-US',{minimumFractionDigits:2})} ${sq.currency === 'SAR' ? 'ر.س' : (sq.currency === 'USD' ? '$' : (sq.currency || 'ر.س'))}</td>
                  </tr>
                  <tr>
                    <td colspan="2" class="total-words">
                      ${tafqeet(totalRounded, sq.currency)}
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" class="vat-note">
                      *يتضمن ضريبة القيمة المضافة
                    </td>
                  </tr>
                </tbody>
              </table>
              <!-- الشروط -->
              <div class="terms-box" ${!formattedTermsText ? 'style="display:none;"' : ''}>
                <div class="terms-title">الشروط والأحكام ومعلومات أخرى</div>
                <div class="terms-content ql-editor">
                  ${formattedTermsText}
                </div>
              </div>
              
              ${sharedPrintFooter}
            </div>
  `;
  };
  const processQuotationContext = (sq) => {
     const subtotal = calculateAmountWithoutTax(sq.items);
     const vat = subtotal * 0.15;
     const total = subtotal + vat;
     const totalRounded = Math.round(total);
     let formattedTermsText = sq.termsText || '';
     const isHtml = formattedTermsText.includes('<p>') || formattedTermsText.includes('<br>');
     if (!isHtml) {
       formattedTermsText = formattedTermsText.replace(/\n/g, '<br/>');
       formattedTermsText = formattedTermsText.replace(/عند دفع العربون فإنه يعد كموافقة على هذا العرض و يعمل به كوثيقة عقد تجاري بين الطرفين الواردة بياناتهم<br\/>وتطبق الشروط والأحكام حسب البنود التالية:/g, '<span class="red">عند دفع العربون فإنه يعد كموافقة على هذا العرض و يعمل به كوثيقة عقد تجاري بين الطرفين الواردة بياناتهم<br/>وتطبق الشروط والأحكام حسب البنود التالية:</span>');
       formattedTermsText = formattedTermsText.replace(/مدة التنفيذ:/g, '<span class="red">مدة التنفيذ:</span>');
       formattedTermsText = formattedTermsText.replace(/طريقة الدفع/g, '<span class="red">طريقة الدفع</span>');
       formattedTermsText = formattedTermsText.replace(/المواصفات ومدة الضمان:/g, '<span class="red">المواصفات ومدة الضمان:</span>');
       formattedTermsText = formattedTermsText.replace(/شروط الضمان:/g, '<span class="red">شروط الضمان:</span>');
     }
     const matchingClient = clients.find((c) => c.id === sq.clientId || c.clientName === sq.clientName) || {};
     return generateSingleHTML(sq, matchingClient, totalRounded, subtotal, vat, total, formattedTermsText);
  };
  const writePrintDocument = (win, title, bodyContentsHtml) => {
     win.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <style>
            @import url('https://fonts.cdnfonts.com/css/ge-ss-two');
            @import url('https://fonts.cdnfonts.com/css/gotham-pro');
            * { font-family: 'GE SS Two', 'Gotham Pro', sans-serif !important; }
          </style>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
          <title>${title}</title>
          <style>${getPrintStyles()}</style>
        </head>
        <body>
          <script>document.title = "${title}";</script>
          <div class="quotation-print-wrapper" dir="rtl">
            <button class="print-button no-print" onclick="window.print()">طباعة</button>
            ${bodyContentsHtml}
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.document.title = title;
  };
  const handleExportSelected = () => {
    if (selectedQuotes.length === 0) return;
    const items = quotes.filter(q => selectedQuotes.includes(q.id));
    if(items.length === 0) return;
    
    const win = window.open('', '_blank');
    if (!win) return;
    const allHtml = items.map(sq => processQuotationContext(sq)).join('');
    writePrintDocument(win, `تصدير عروض أسعار (${items.length})`, allHtml);
  };













  const handleCreateNew = () => {
    setEditorQtn({
      id: '',
      quotationNumber: '',
      financialYear: new Date().getFullYear().toString(),
      quoteDate: new Date().toISOString().split('T')[0],
      quoteToType: 'client',
      clientId: '',
      clientName: '',
      projectName: '',
      orderType: 'مبيعات',
      currency: 'SAR',
      createdBy: user?.username || '',
      items: [],
      status: 'مسودة',
      termsText: '',
      dateCreated: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    });
    setMode('edit');
  };

  const calculateAmountWithoutTax = (items: SalesQuoteItem[] = []) => {
    return items.reduce((sum, it) => sum + (it.quantity * it.unitPrice * (1 - (it.discountPct || 0)/100)), 0);
  };

  const executeSave = async (payload: any, forceStatus: string | undefined, skipConfirm: boolean, showAlerts: boolean) => {
    try {
      const method = editorQtn?.id ? 'PUT' : 'POST';
      const url = editorQtn?.id ? `/api/sales_quotations/${editorQtn.id}` : '/api/sales_quotations';
      const res = await fetch(url, {
        method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
      });
      if (res.ok) {
        const saved = await res.json();
        setQuotes(prev => {
          const ex = prev.find(p => p.id === saved.item.id);
          if (ex) return prev.map(p => p.id === saved.item.id ? saved.item : p);
          return [saved.item, ...prev];
        });
        setEditorQtn(saved.item);
        if (showAlerts) {
           if (forceStatus === 'معتمد' && !skipConfirm) {
              showToast(lang === 'ar' ? `تم اعتماد عرض السعر رقم ${payload.quotationNumber}` : `Quotation ${payload.quotationNumber} approved successfully`, 'success');
           } else if (skipConfirm && forceStatus === 'مسودة') {
              showToast(lang === 'ar' ? 'تم إلغاء الاعتماد وتحويله إلى مسودة' : 'Approval canceled and converted to draft', 'success');
           } else {
              showToast(lang === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully', 'success');
           }
        }
        if (forceStatus === 'مسودة' && !skipConfirm) {
          setMode('list');
          setEditorQtn(null);
        }
      }
    } catch(e) {
      if(showAlerts) setDialogConfig({isOpen: true, type: 'alert', message: 'فشل الحفظ!'});
    }
  };

  const handleSaveEditor = async (forceStatus?: 'مسودة' | 'معتمد', showAlerts = true, skipConfirm = false) => {
    if (!editorQtn) return;
    
    // validate if not draft
    if (forceStatus === 'معتمد' && !skipConfirm) {
      if (!editorQtn.quotationNumber || !editorQtn.clientName) {
        if(showAlerts) setDialogConfig({isOpen: true, type: 'alert', message: 'الرجاء إكمال البيانات الأساسية قبل الاعتماد'});
        return;
      }
      
      setDialogConfig({
        isOpen: true,
        type: 'confirm',
        message: 'هل أنت متأكد من اعتماد عرض السعر؟ لن تتمكن من تعديل البيانات بعد الاعتماد.',
        onConfirm: () => {
          setDialogConfig(prev => ({...prev, isOpen: false}));
          const payload = {
            ...editorQtn,
            status: forceStatus || editorQtn.status || 'مسودة',
            lastUpdated: new Date().toISOString()
          };
          payload.approvedBy = user?.name || user?.username || 'المستخدم الحالي';
          if (!payload.id) {
             payload.id = `SQ-${Date.now()}`;
             payload.dateCreated = new Date().toISOString();
          }
          executeSave(payload, forceStatus, skipConfirm, showAlerts);
        }
      });
      return;
    }

    const payload = {
      ...editorQtn,
      status: forceStatus || editorQtn.status || 'مسودة',
      lastUpdated: new Date().toISOString()
    };
    if (forceStatus === 'معتمد') {
      payload.approvedBy = user?.name || user?.username || 'المستخدم الحالي';
    } else if (skipConfirm && forceStatus === 'مسودة') {
      // Unapproving
      payload.approvedBy = '';
    }
    if (!payload.id) {
       payload.id = `SQ-${Date.now()}`;
       payload.dateCreated = new Date().toISOString();
    }

    executeSave(payload, forceStatus, skipConfirm, showAlerts);
  };

  const handleBackFromEditor = () => {
    if (editorQtn && editorQtn.status !== 'معتمد') {
      const isNotEmpty = editorQtn.quotationNumber || editorQtn.clientName || (editorQtn.items && editorQtn.items.length > 0);
      if (isNotEmpty) {
         handleSaveEditor('مسودة', false);
         return; // handleSaveEditor will call setMode('list') if 'مسودة'
      }
    }
    setMode('list');
    setEditorQtn(null);
  };













  const handlePrintPreview = (sq: SalesQuotation) => {
     const win = window.open('', '_blank');
     if(!win) return;
     const sqHtml = processQuotationContext(sq);
     writePrintDocument(win, sq.quotationNumber, sqHtml);
  };













  const filteredQuotes = React.useMemo(() => {
    let baseList = quotes;
    if (searchName.trim()) {
      const { results } = searchQuotationsIndexed(searchName, quotes);
      baseList = results;
    }
    return baseList.filter(q => {
      if (searchQtn && !q.quotationNumber?.toLowerCase().includes(searchQtn.toLowerCase())) return false;
      if (statusFilter !== 'الكل' && q.status !== statusFilter) return false;
      return true;
    }).sort((a,b) => {
      const tA = new Date(a.dateCreated).getTime();
      const tB = new Date(b.dateCreated).getTime();
      return sortOrder === 'desc' ? tB - tA : tA - tB;
    });
  }, [quotes, searchName, searchQtn, statusFilter, sortOrder]);

  if (loading) return <div className="p-10 text-center text-indigo-500 font-bold">جاري التحميل...</div>;

  return (
    <div className="font-sans animate-fade-in" dir="rtl">
      {toastMsg && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[999] px-6 py-3 rounded-xl shadow-2xl font-bold text-white transition-all transform animate-pop-in ${toastMsg.type === 'error' ? 'bg-red-500' : 'bg-emerald-600'}`}>
           {toastMsg.text}
        </div>
      )}
      
      {dialogConfig.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-auto shadow-2xl animate-pop-in text-center">
              {dialogConfig.type === 'alert' ? (
                 <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              ) : (
                 <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              )}
              <h3 className="text-xl font-bold text-slate-800 mb-6">{dialogConfig.message}</h3>
              <div className="flex gap-3 justify-center">
                 <button onClick={() => setDialogConfig(prev => ({...prev, isOpen: false}))} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition">
                   {dialogConfig.type === 'alert' ? 'حسناً' : 'إلغاء'}
                 </button>
                 {dialogConfig.type === 'confirm' && (
                   <button onClick={dialogConfig.onConfirm} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition shadow-lg shadow-red-200">
                     تأكيد
                   </button>
                 )}
              </div>
           </div>
        </div>
      )}
      {mode === 'list' ? (
        <div className="space-y-6">
           <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100 gap-4">
              <div>
                <h2 className="text-xl font-black text-[#0072BC] flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  عروض الأسعار
                </h2>
                <p className="text-xs text-slate-500 mt-1">إدارة وإنشاء ومتابعة عروض الأسعار والنماذج التابعة للعملاء</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedQuotes.length > 0 && (
                  <div className="flex gap-2 animate-fade-in pl-4 border-l border-slate-200">
                    <button onClick={handleExportSelected} className="flex items-center gap-2 px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition">
                      <FileText className="w-4 h-4"/>
                      تصدير ({selectedQuotes.length})
                    </button>
                    {isUserPrivileged && (
                      <button onClick={handleDeleteSelected} className="flex items-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition">
                        <Trash2 className="w-4 h-4"/>
                        حذف ({selectedQuotes.length})
                      </button>
                    )}
                  </div>
                )}
                <button onClick={handleCreateNew} className="flex items-center gap-2 px-6 py-3 bg-[#0072BC] hover:bg-sky-700 text-white rounded-xl text-sm font-black shadow-lg transition">
                  <Plus className="w-5 h-5"/>
                  إضافة عرض سعر
                </button>
              </div>
           </div>

           <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">بحث بالعميل أو المشروع:</label>
                <input type="text" value={searchName} onChange={e=>setSearchName(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm outline-none focus:border-[#0072BC]" placeholder="..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">رقم الكوتيشن:</label>
                <input type="text" value={searchQtn} onChange={e=>setSearchQtn(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm outline-none focus:border-[#0072BC]" placeholder="QTN..." dir="ltr" style={{textAlign:'right'}} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">الترتيب:</label>
                <select value={sortOrder} onChange={e=>setSortOrder(e.target.value as any)} className="w-full p-2.5 border rounded-xl text-sm outline-none focus:border-[#0072BC]">
                  <option value="desc">الأحدث أولاً</option>
                  <option value="asc">الأقدم أولاً</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">الحالة:</label>
                <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm outline-none focus:border-[#0072BC]">
                  <option value="الكل">الكل</option>
                  <option value="مسودة">مسودة</option>
                  <option value="نشط">نشط</option>
                  <option value="معتمد">معتمد</option>
                </select>
              </div>
           </div>

           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                  <tr>
                    <th className="p-4 w-12 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedQuotes.length === filteredQuotes.length && filteredQuotes.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedQuotes(filteredQuotes.map(q => q.id));
                          else setSelectedQuotes([]);
                        }}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <td className="p-4">رقم الكوتيشن</td>
                    <td className="p-4">اسم المشروع</td>
                    <td className="p-4">العميل</td>
                    <td className="p-4">التاريخ</td>
                    <td className="p-4">السنة المالية</td>
                    <td className="p-4 text-center">نوع الطلب</td>
                    <td className="p-4 text-center">الإجمالي (شامل)</td>
                    <td className="p-4 text-center">الحالة</td>
                    <td className="p-4">الإجراءات</td>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQuotes.map(q => {
                    const sub = calculateAmountWithoutTax(q.items);
                    const total = sub * 1.15;
                    const isSelected = selectedQuotes.includes(q.id);
                    return (
                      <tr key={q.id} className={`transition ${isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                        <td className="p-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedQuotes(prev => [...prev, q.id]);
                              else setSelectedQuotes(prev => prev.filter(id => id !== q.id));
                            }}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="p-4 font-mono font-bold text-[#0072BC]" dir="ltr" style={{textAlign:'right'}}>{q.quotationNumber || '---'}</td>
                        <td className="p-4 font-bold text-slate-800">{q.projectName || '-'}</td>
                        <td className="p-4 text-slate-600">{q.clientName || '-'}</td>
                        <td className="p-4 text-slate-600">{q.quoteDate}</td>
                        <td className="p-4 text-center">{q.financialYear}</td>
                        <td className="p-4 text-center text-slate-600 text-xs">{q.orderType}</td>
                        <td className="p-4 text-center font-bold text-emerald-600" dir="ltr">{total.toFixed(2)} {q.currency}</td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-black ${getStatusColors(q.status)}`}>{q.status}</span>
                        </td>
                        <td className="p-4">
                           <div className="flex items-center gap-2">
                             <button onClick={() => { setEditorQtn(q); setMode('edit'); }} disabled={q.status==='معتمد'} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition" title="تعديل"><Edit2 className="w-4 h-4"/></button>
                             <button onClick={() => { setEditorQtn(q); setMode('edit'); }} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition" title="عرض"><Eye className="w-4 h-4"/></button>
                             <button onClick={() => handlePrintPreview(q)} className="p-2 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-indigo-600 transition" title="معاينة للطباعة"><FileText className="w-4 h-4"/></button>
                             <button onClick={() => {
                               const copy = {...q, id: '', quotationNumber: '', status: 'مسودة', dateCreated: new Date().toISOString()};
                               setEditorQtn(copy as any);
                               setMode('edit');
                             }} className="p-2 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-emerald-600 transition" title="إنشاء نسخة"><Copy className="w-4 h-4"/></button>
                             {isUserPrivileged && (
                               <button onClick={(e) => handleDeleteQtn(q.id, e)} disabled={q.status==='معتمد'} className="p-2 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition" title="حذف نهائي"><Trash2 className="w-4 h-4"/></button>
                             )}
                           </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredQuotes.length === 0 && <tr><td colSpan={10} className="p-10 text-center text-slate-400 font-bold">لا يوجد عروض متطابقة</td></tr>}
                </tbody>
              </table>
           </div>
        </div>
      ) : (
        <EditorScreen lang={lang} 
           quote={editorQtn as SalesQuotation} 
           onChange={setEditorQtn as any} 
           onBack={handleBackFromEditor}
           onSave={(s) => handleSaveEditor(s)}
           onPreview={() => handlePrintPreview(editorQtn as SalesQuotation)}
           onCopy={() => {
              const copy = {...editorQtn, id: '', quotationNumber: '', status: 'مسودة', dateCreated: new Date().toISOString()};
              setEditorQtn(copy as any);
           }}
           clients={clients}
           warehouseItems={warehouseItems}
           allQuotes={quotes}
           termsTemplate={contractText}
           termsTemplates={termsTemplates}
           setTermsTemplates={setTermsTemplates}
           user={user}
           showToast={showToast}
           setDialogConfig={setDialogConfig}
           onUnapprove={() => {
             if (!isUserPrivileged) {
               setDialogConfig({
                 isOpen: true,
                 type: 'alert',
                 message: 'لا يمكن الغاء عرض السعر الا من قبل الادارة العلياء و مسؤول النظام'
               });
               return;
             }
             setDialogConfig({
               isOpen: true,
               type: 'confirm',
               message: 'رسالة تحذير: هل أنت متأكد من إلغاء اعتماد عرض السعر وإعادته إلى حالة "مسودة"؟',
               onConfirm: () => {
                 setDialogConfig(prev => ({...prev, isOpen: false}));
                 handleSaveEditor('مسودة', true, true);
               }
             });
           }}
           onDelete={() => {
             setDialogConfig({
               isOpen: true,
               type: 'confirm',
               message: 'هل أنت متأكد من حذف عرض السعر بشكل نهائي؟',
               onConfirm: async () => {
                 try {
                   const res = await fetch(`/api/sales_quotations/${editorQtn!.id}`, { method: 'DELETE' });
                   if (res.ok) {
                     setQuotes(prev => prev.filter(q => q.id !== editorQtn!.id));
                     showToast(lang === 'ar' ? 'تم حذف عرض السعر بنجاح' : 'Quotation deleted successfully', 'success');
                     setMode('list');
                   }
                 } catch(err) { showToast(lang === 'ar' ? 'فشل الحذف' : 'Deletion failed', 'error'); }
                 setDialogConfig(prev => ({...prev, isOpen: false}));
               }
             });
           }}
        />
      )}
    </div>
  );
}

function EditorScreen({quote, lang, onChange, onBack, onSave, onPreview, onCopy, clients, warehouseItems, allQuotes, termsTemplate, termsTemplates, setTermsTemplates, user, onUnapprove, onDelete, showToast, setDialogConfig}: any) {
  const [tab, setTab] = useState<'basic' | 'print'>('basic');
  const [qtnGenType, setQtnGenType] = useState<'auto'|'manual'>('manual');
  
  const [selectedTpl, setSelectedTpl] = useState('');
  const [isAddingTpl, setIsAddingTpl] = useState(false);
  const [newTplName, setNewTplName] = useState('');

  const handleSaveTemplate = async () => {
    if (!newTplName && (!selectedTpl || selectedTpl === 'contract')) {
        showToast(lang === 'ar' ? 'الرجاء إضافة نموذج جديد أولاً أو اختيار نموذج مخصص لتحديثه' : 'Please add a new template first or select a custom one to update', 'error');
        return;
    }
    const isNew = isAddingTpl || !selectedTpl || selectedTpl === 'contract';
    if (selectedTpl === 'contract' && !isAddingTpl) {
       showToast(lang === 'ar' ? 'لا يمكن تعديل نموذج العقد القياسي الافتراضي. استخدم "إضافة نموذج جديد"' : 'Cannot edit the default standard contract template. Use "Add new template"', 'error');
       return;
    }

    const tplId = isNew ? `TPL-${Date.now()}` : selectedTpl;
    const tplName = isNew ? newTplName : termsTemplates.find((t:any) => t.id === selectedTpl)?.name;

    try {
      const res = await fetch(`/api/dynamic/terms_templates/${tplId}`, {
         method: 'PUT',
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({ id: tplId, name: tplName, content: quote.termsText || '' })
      });
      if (res.ok) {
         if (isNew) {
            setTermsTemplates((prev:any) => [...prev, {id: tplId, name: tplName, content: quote.termsText||''}]);
            setSelectedTpl(tplId);
            setIsAddingTpl(false);
            setNewTplName('');
         } else {
            setTermsTemplates((prev:any) => prev.map((t:any) => t.id === tplId ? {...t, content: quote.termsText||''} : t));
         }
         showToast(lang === 'ar' ? 'تم حفظ النموذج بنجاح' : 'Template saved successfully', 'success');
      }
    } catch(e) {
      showToast(lang === 'ar' ? 'فشل الحفظ' : 'Saving failed', 'error');
    }
  };

  const handleDeleteTemplate = () => {
    if (!selectedTpl || selectedTpl === 'contract') return;
    setDialogConfig({
      isOpen: true,
      type: 'confirm',
      message: 'هل أنت متأكد من حذف هذا النموذج؟',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/dynamic/terms_templates/${selectedTpl}`, { method: 'DELETE' });
          if (res.ok) {
             setTermsTemplates((prev:any) => prev.filter((t:any) => t.id !== selectedTpl));
             setSelectedTpl('');
             showToast(lang === 'ar' ? 'تم الحذف بنجاح' : 'Deleted successfully', 'success');
          }
        } catch(e) {
          showToast(lang === 'ar' ? 'فشل الحذف' : 'Deletion failed', 'error');
        }
        setDialogConfig((p:any) => ({...p, isOpen: false}));
      }
    });
  };

  const isReadOnly = quote.status === 'معتمد';
  const isUserPrivileged = user ? ['admin', 'manager', 'super admin', 'senior management', 'الادارة العليا'].includes(user.role?.toLowerCase() || '') : false;

  const [editingItemId, setEditingItemId] = useState<string|null>(null);
  const [clientSearchFocused, setClientSearchFocused] = useState(false);

  const [delWaitId, setDelWaitId] = useState<string|null>(null);
  const delTimerRef = useRef<any>(null);

  const handleDeleteItem = (rowId: string) => {
    if (delWaitId === rowId) {
       onChange({...quote, items: quote.items.filter((i:any) => i.id !== rowId)});
       setDelWaitId(null);
       clearTimeout(delTimerRef.current);
    } else {
       setDelWaitId(rowId);
       delTimerRef.current = setTimeout(() => {
          setDelWaitId(null);
       }, 3000);
    }
  };

  const handleGenerateQtn = () => {
    const yr = quote.financialYear || new Date().getFullYear().toString();
    const prefix = `QTN${yr}`;
    let max = 0;
    allQuotes.forEach((q:any) => {
       if (q.quotationNumber?.startsWith(prefix)) {
          const num = parseInt(q.quotationNumber.replace(prefix, ''), 10);
          if (!isNaN(num) && num > max) max = num;
       }
    });
    const newNo = `${prefix}${String(max+1).padStart(5,'0')}`;
    onChange({...quote, quotationNumber: newNo});
  };

  const handleManualQtnChange = (v: string) => {
    // check dupe ? 
    onChange({...quote, quotationNumber: v});
  };

  const addItemRow = () => {
    onChange({
      ...quote, 
      items: [...quote.items, {
        id: 'ITM'+Date.now() + Math.random(),
        itemCode: '', itemName: '', description: '', quantity: 1, unit: '', unitPrice: 0, discountPct: 0, internalNotes: ''
      }]
    });
  };

  const updateRow = (rowId: string, diff: any) => {
    onChange({...quote, items: quote.items.map((i:any) => i.id === rowId ? {...i, ...diff} : i)});
  };

  // Item Modal details
  const itemInEdit = quote.items.find((i:any) => i.id === editingItemId);

  const subtotal = quote.items.reduce((sum:number, it:any) => sum + (it.quantity * it.unitPrice * (1 - (it.discountPct||0)/100)), 0);
  const vat = subtotal * 0.15;
  const total = subtotal + vat;

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden relative pb-20">
       <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between sticky top-0 z-10">
         <div className="flex items-center gap-4">
           <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition"><ArrowRight className="w-5 h-5"/></button>
           <h2 className="font-black text-lg text-slate-800">
             {quote.id ? 'تعديل عرض سعر' : 'إنشاء عرض سعر جديد'}
             {isReadOnly && <span className="mr-3 bg-emerald-100 text-emerald-700 px-3 py-1 rounded text-xs">معتمد من قبل {quote.approvedBy || 'النظام'}</span>}
           </h2>
         </div>
         <div className="flex gap-2">
            {!isReadOnly && <button onClick={() => onSave('مسودة')} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"><Save className="w-4 h-4"/> حفظ كمسودة</button>}
            {!isReadOnly && <button onClick={() => onSave('معتمد')} className="flex items-center gap-2 px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-xl text-xs font-bold transition"><CheckCircle className="w-4 h-4"/> اعتماد العرض</button>}
            {isReadOnly && (
               <button onClick={onUnapprove} className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs font-bold transition"><XCircle className="w-4 h-4"/> إلغاء الاعتماد</button>
            )}
            {isUserPrivileged && !isReadOnly && quote.id && (
               <button onClick={onDelete} className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition"><Trash2 className="w-4 h-4"/> حذف العرض</button>
            )}
            <button onClick={onPreview} className="flex items-center gap-2 px-4 py-2 bg-[#0072BC] hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition"><Eye className="w-4 h-4"/> معاينة طباعة</button>
            <button onClick={onCopy} className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold transition"><Copy className="w-4 h-4"/> إنشاء نسخة</button>
         </div>
       </div>

       <div className="flex gap-4 p-4 border-b border-slate-100 text-sm font-bold bg-white">
         <button onClick={()=>setTab('basic')} className={`px-6 py-2.5 rounded-full transition ${tab==='basic' ? 'bg-[#0072BC] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>المعلومات الأساسية</button>
         <button onClick={()=>setTab('print')} className={`px-6 py-2.5 rounded-full transition ${tab==='print' ? 'bg-[#0072BC] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>معلومات الطباعة والشروط</button>
       </div>

       {tab === 'basic' && (
         <div className="p-6 space-y-8 animate-fade-in relative ${isReadOnly ? 'opacity-90 pointer-events-none' : ''}">
           
           {/* Section 1 */}
           <div className="space-y-6">
              {/* Row 1: Quotation Number */}
              <div className="w-full bg-slate-50 p-4 border rounded-2xl">
                 <label className="block text-xs font-bold text-slate-600 mb-2">رقم الكوتيشن</label>
                 {!isReadOnly && (
                   <div className="flex gap-2 mb-3">
                     <button onClick={()=>setQtnGenType('manual')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${qtnGenType==='manual'?'bg-indigo-600 text-white border-indigo-600':'bg-white'}`}>إدخال يدوي</button>
                     <button onClick={()=>setQtnGenType('auto')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${qtnGenType==='auto'?'bg-indigo-600 text-white border-indigo-600':'bg-white'}`}>توليد تلقائي</button>
                   </div>
                 )}
                 {qtnGenType === 'auto' ? (
                   <div className="flex gap-2">
                      <input type="text" value={quote.quotationNumber} readOnly className="w-full p-2.5 border rounded-xl font-mono bg-white" placeholder="اضغط توليد" dir="ltr"/>
                      {!isReadOnly && <button onClick={handleGenerateQtn} className="px-4 bg-emerald-600 text-white rounded-xl font-bold text-sm">توليد</button>}
                   </div>
                 ) : (
                   <input type="text" value={quote.quotationNumber} onChange={e=>handleManualQtnChange(e.target.value)} className="w-full p-2.5 border rounded-xl font-mono" placeholder="QTNXX..." dir="ltr" disabled={isReadOnly}/>
                 )}
                 {allQuotes.some((q:any) => q.quotationNumber === quote.quotationNumber && q.id !== quote.id) && (
                    <span className="text-red-500 text-xs font-bold mt-1 block">⚠️ رقم الكوتيشن مستخدم مسبقاً!</span>
                 )}
              </div>

              {/* Row 2 - Client combo */}
              <div className="bg-slate-50 p-4 border rounded-2xl w-full relative">
                <label className="block text-xs font-bold text-slate-600 mb-2">التسعيرة إلى (اسم العميل)</label>
                <input 
                  type="text" 
                  disabled={isReadOnly}
                  value={quote.clientName}
                  onFocus={() => setClientSearchFocused(true)}
                  onBlur={() => setTimeout(() => setClientSearchFocused(false), 200)}
                  onChange={e=>{
                    const txt = e.target.value;
                    const matchedClient = clients.find((c:any) => c.clientName === txt);
                    onChange({
                       ...quote, 
                       clientName: txt,
                       clientId: matchedClient ? matchedClient.id : ''
                    });
                  }}
                  className="w-full p-2.5 border rounded-xl text-sm font-bold bg-white focus:outline-none focus:border-[#0072BC]"
                  placeholder="ابحث بالنص أو اكتب اسماً جديداً..."
                />
                {!isReadOnly && clientSearchFocused && quote.clientName && clients.filter((c:any) => c.clientName?.toLowerCase().includes(quote.clientName?.toLowerCase() || '')).length > 0 && (
                  <div className="absolute z-50 w-full bg-white border border-slate-200 mt-1 rounded-xl shadow-xl max-h-60 overflow-y-auto left-0">
                     {clients.filter((c:any) => c.clientName?.toLowerCase().includes(quote.clientName?.toLowerCase() || '')).map((c:any) => (
                       <div 
                         key={c.id} 
                         onClick={() => {
                           onChange({...quote, clientName: c.clientName, clientId: c.id});
                           setClientSearchFocused(false);
                         }}
                         className="p-3 hover:bg-indigo-50 cursor-pointer border-b last:border-b-0 text-sm font-bold text-slate-700"
                       >
                         {c.clientName} {c.companyName ? <span className="text-xs text-slate-400 mr-2 font-normal">({c.companyName})</span> : ''}
                       </div>
                     ))}
                  </div>
                )}
              </div>

              {/* Row 3 - 4 columns */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">السنة المالية</label>
                  <select value={quote.financialYear} onChange={e=>onChange({...quote, financialYear:e.target.value})} disabled={isReadOnly} className="w-full p-2.5 border rounded-xl text-sm font-bold bg-slate-50 focus:bg-white transition">
                    {['2024','2025','2026','2027','2028','2029','2030'].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">تاريخ التسعيرة</label>
                  <input type="date" value={quote.quoteDate} onChange={e=>onChange({...quote, quoteDate:e.target.value})} disabled={isReadOnly} className="w-full p-2.5 border rounded-xl text-sm font-bold bg-slate-50 focus:bg-white transition" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-600 mb-1">اسم المشروع (اختياري)</label>
                   <input type="text" value={quote.projectName} disabled={isReadOnly} onChange={e=>onChange({...quote, projectName: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm bg-slate-50 focus:bg-white" placeholder="وصف موجز..." />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-600 mb-1">نوع الطلب</label>
                   <select value={quote.orderType} disabled={isReadOnly} onChange={e=>onChange({...quote, orderType: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm font-bold bg-slate-50 focus:bg-white">
                      <option value="مبيعات">مبيعات</option>
                      <option value="صيانة">صيانة</option>
                   </select>
                </div>
              </div>

              {/* Row 4 */}
              <div className="w-1/4 min-w-[200px]">
                <label className="block text-xs font-bold text-slate-600 mb-1">العملة وقائمة الأسعار</label>
                <select value={quote.currency} disabled={isReadOnly} onChange={e=>onChange({...quote, currency: e.target.value})} className="w-full p-2.5 border rounded-xl text-sm font-bold font-mono bg-slate-50 focus:bg-white">
                   <option value="SAR">SAR - الريال السعودي</option>
                   <option value="USD">USD - الدولار الأمريكي</option>
                   <option value="EUR">EUR - اليورو</option>
                   <option value="GBP">GBP - الجنيه الإسترليني</option>
                   <option value="AED">AED - الدرهم الإماراتي</option>
                   <option value="KWD">KWD - الدينار الكويتي</option>
                   <option value="BHD">BHD - الدينار البحريني</option>
                   <option value="QAR">QAR - الريال القطري</option>
                </select>
              </div>
           </div>

           <hr/>

           <div>
              <div className="flex justify-between items-end mb-4">
                 <h3 className="text-lg font-black text-slate-800">الأصناف</h3>
                 {!isReadOnly && <button onClick={addItemRow} className="flex items-center gap-1 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs"><Plus className="w-4 h-4"/> إضافة صنف جديد</button>}
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto shadow-sm">
                <table className="w-full text-sm text-right">
                  <thead className="bg-[#0072BC] text-white">
                    <tr>
                      <th className="p-3 w-12 text-center">#</th>
                      <th className="p-3 w-48">كود الصنف</th>
                      <th className="p-3 min-w-[200px]">اسم الصنف / البيان</th>
                      <th className="p-3 w-28 text-center">الكمية</th>
                      <th className="p-3 w-32 text-center">السعر ({quote.currency})</th>
                      <th className="p-3 w-32 text-center">المبلغ </th>
                      <th className="p-3 w-32 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {quote.items.map((it:any, idx:number) => (
                      <tr key={it.id}>
                        <td className="p-3 text-center text-slate-400 font-bold">{idx+1}</td>
                        <td className="p-3 relative">
                           {/* Quick Item Code Lookup with Datalist */}
                           <input 
                             type="text" 
                             list="warehouse-items-list"
                             value={it.itemCode} 
                             disabled={isReadOnly}
                             onChange={e => {
                               const v = e.target.value;
                               const wItem = warehouseItems.find((w:any) => w.itemCode === v);
                               if (wItem) {
                                  updateRow(it.id, {itemCode: v, itemName: wItem.itemNameAr, unit: wItem.defaultUnit});
                               } else {
                                  updateRow(it.id, {itemCode: v});
                               }
                             }}
                             className="w-full p-2 border rounded-lg font-mono text-xs focus:border-[#0072BC] outline-none" 
                             placeholder="اكتب كود المستودع..." 
                             dir="ltr"
                           />
                           <datalist id="warehouse-items-list">
                             {warehouseItems.map((w:any) => <option key={w.id} value={w.itemCode}>{w.itemNameAr}</option>)}
                           </datalist>
                           {warehouseItems.some((w:any)=>w.itemCode===it.itemCode) && <Check className="w-4 h-4 text-emerald-500 absolute top-5 left-4"/>}
                        </td>
                        <td className="p-3">
                           <input type="text" disabled={isReadOnly} value={it.itemName} onChange={e=>updateRow(it.id, {itemName: e.target.value})} className="w-full p-2 border rounded-lg text-xs font-bold" />
                           {it.description && <div className="text-[10px] mt-1 text-slate-500 truncate max-w-[200px]">{it.description}</div>}
                        </td>
                        <td className="p-3">
                           <input type="number" disabled={isReadOnly} value={it.quantity||0} onChange={e=>updateRow(it.id, {quantity: parseFloat(e.target.value)||0})} className="w-full p-2 border rounded-lg text-center font-bold" min="1"/>
                        </td>
                        <td className="p-3">
                           <input type="number" disabled={isReadOnly} value={it.unitPrice||0} onChange={e=>updateRow(it.id, {unitPrice: parseFloat(e.target.value)||0})} className="w-full p-2 border rounded-lg text-center font-bold" />
                        </td>
                        <td className="p-3 text-center font-black text-slate-700 bg-slate-50">
                           {((it.quantity*it.unitPrice)*(1 - (it.discountPct||0)/100)).toFixed(2)}
                        </td>
                        <td className="p-3">
                           <div className="flex items-center justify-center gap-1">
                              {!isReadOnly && <button onClick={()=>setEditingItemId(it.id)} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition" title="تعديل التفاصيل"><Edit2 className="w-4 h-4 text-slate-600"/></button>}
                              {!isReadOnly && <button 
                                 onClick={()=>handleDeleteItem(it.id)} 
                                 className={`p-1.5 rounded-lg transition ${delWaitId===it.id ? 'bg-red-500 text-white w-24 text-[10px] font-bold' : 'bg-rose-50 hover:bg-rose-100 text-rose-600'}`}
                              >
                                {delWaitId===it.id ? 'اضغط مرة أخرى للتأكيد' : <Trash2 className="w-4 h-4"/>}
                              </button>}
                           </div>
                        </td>
                      </tr>
                    ))}
                    {quote.items.length === 0 && <tr><td colSpan={7} className="p-10 text-center font-bold text-slate-400">لا يوجد أصناف. اضغط "إضافة صنف جديد"</td></tr>}
                  </tbody>
                </table>
              </div>
           </div>

           {/* Totals Box */}
           <div className="flex justify-end mt-4">
              <div className="w-full md:w-1/3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                 <h4 className="font-black text-sm mb-4 text-[#0072BC] border-b pb-2">المجاميع</h4>
                 <div className="flex justify-between items-center text-sm mb-2 font-bold text-slate-600">
                    <span>إجمالي المبلغ بدون ضريبة:</span>
                    <span>{subtotal.toFixed(2)} {quote.currency}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm mb-3 font-bold text-slate-600 border-b border-slate-200 pb-3">
                    <span>إجمالي مبلغ الضريبة (15%):</span>
                    <span>{vat.toFixed(2)} {quote.currency}</span>
                 </div>
                 <div className="flex justify-between items-center text-lg font-black text-emerald-700 mb-2">
                    <span>الإجمالي مع الضريبة:</span>
                    <span>{total.toFixed(2)} {quote.currency}</span>
                 </div>
                 <div className="text-xs text-center text-emerald-600 font-bold bg-emerald-50 py-2 rounded-lg break-words">
                    {tafqeet(total, quote.currency)}
                 </div>
              </div>
           </div>

         </div>
       )}

       {tab === 'print' && (
         <div className="p-6 space-y-6 max-w-4xl mx-auto animate-fade-in relative ${isReadOnly ? 'opacity-90 pointer-events-none' : ''}">
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
               <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                     <label className="block text-sm font-bold text-indigo-800 mb-2">تحديد الشروط والأحكام القياسية</label>
                     <div className="flex items-center gap-2">
                        <select disabled={isReadOnly} value={selectedTpl} onChange={e => {
                          const val = e.target.value;
                          setSelectedTpl(val);
                          setIsAddingTpl(false);
                          if (val) {
                             const found = termsTemplates.find((t:any) => t.id === val);
                             if (found) {
                                onChange({...quote, termsText: found.content});
                             }
                          }
                        }} className="flex-1 w-full p-2.5 border rounded-xl outline-none font-bold">
                           <option value="">-- اختر النموذج --</option>
                           {termsTemplates.map((t:any) => (
                             <option key={t.id} value={t.id}>{t.name}</option>
                           ))}
                        </select>
                        
                        {!isReadOnly && (
                          <button onClick={() => setIsAddingTpl(!isAddingTpl)} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex-shrink-0">
                             {isAddingTpl ? 'إلغاء الإضافة' : '+ إضافة نموذج جديد'}
                          </button>
                        )}
                     </div>
                  </div>
               </div>

               {isAddingTpl && !isReadOnly && (
                  <div className="mt-4 p-4 bg-white rounded-xl border border-indigo-100 flex items-end gap-2 animate-fade-in">
                     <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-600 mb-1">اسم النموذج الجديد</label>
                        <input type="text" value={newTplName} onChange={e=>setNewTplName(e.target.value)} className="w-full p-2 border rounded-lg text-sm" placeholder="مثال: نموذج صيانة سنوي..." />
                     </div>
                  </div>
               )}
               
               {(!isReadOnly && (isAddingTpl || (selectedTpl && selectedTpl !== 'contract'))) && (
                  <div className="mt-4 flex items-center gap-2 pt-4 border-t border-indigo-200">
                     <button onClick={handleSaveTemplate} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-2">
                        <Save className="w-4 h-4"/> 
                        {isAddingTpl ? 'حفظ النموذج الجديد' : 'تحديث معلومات النموذج'}
                     </button>
                     {(!isAddingTpl && selectedTpl && selectedTpl !== 'contract') && (
                        <button onClick={handleDeleteTemplate} className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-xs font-bold transition flex items-center gap-2">
                           <Trash2 className="w-4 h-4"/> 
                           حذف النموذج
                        </button>
                     )}
                  </div>
               )}
            </div>

            <div>
               <label className="block text-sm font-bold text-slate-600 mb-2">محرر الشروط والأحكام (يظهر في الطباعة)</label>
               <div className="bg-white rounded-2xl border mb-16 h-[500px]">
                  <ReactQuill 
                     theme="snow" 
                     value={quote.termsText || ''} 
                     onChange={(val) => onChange({...quote, termsText: val})}
                     readOnly={isReadOnly}
                     style={{height: '450px', border:'none'}}
                     modules={{
                        toolbar: [
                           [{ 'font': [false, 'tajawal', 'arial', 'tahoma', 'cairo', 'times-new-roman'] }],
                           [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                           [{ 'size': ['small', false, 'large', 'huge'] }],
                           [{ 'color': [] }, { 'background': [] }],
                           ['bold', 'italic', 'underline', 'strike'],
                           [{ 'align': [] }],
                           [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                           ['link'],
                           ['clean']
                        ],
                        clipboard: {
                           matchVisual: false // Retain formatting on paste
                        }
                     }}
                  />
               </div>
            </div>
         </div>
       )}

       {/* Item Details Modal */}
       {editingItemId && itemInEdit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onMouseDown={(e)=>{if(e.target===e.currentTarget) setEditingItemId(null)}}>
             <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden p-6 space-y-5" onMouseDown={e=>e.stopPropagation()}>
                <h3 className="font-black text-lg text-[#0072BC] border-b pb-3">معلومات إضافية للصنف رقم # {quote.items.findIndex((i:any)=>i.id===editingItemId)+1}</h3>
                
                <div>
                   <label className="block text-xs font-bold text-slate-600 mb-1">اسم الصنف</label>
                   <input type="text" value={itemInEdit.itemName} onChange={e=>updateRow(editingItemId, {itemName: e.target.value})} className="w-full p-2 border rounded-lg font-bold" />
                </div>
                
                <div>
                   <label className="block text-xs font-bold text-slate-600 mb-1">وصف تفصيلي الصنف (يظهر بالطباعة)</label>
                   <textarea value={itemInEdit.description||''} onChange={e=>updateRow(editingItemId, {description: e.target.value})} rows={3} className="w-full p-2 border rounded-lg font-bold resize-none" placeholder="أبعاد، ألوان، تفاصيل..."></textarea>
                </div>

                <div className="flex gap-4">
                   <div className="w-1/2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">خصم خاص بالصنف (%)</label>
                      <input type="number" min="0" max="100" value={itemInEdit.discountPct||0} onChange={e=>updateRow(editingItemId, {discountPct: parseFloat(e.target.value)||0})} className="w-full p-2 border rounded-lg font-bold" />
                   </div>
                   <div className="w-1/2 bg-slate-50 p-2 rounded-lg border flex flex-col justify-center items-center">
                     <span className="text-[10px] font-bold text-slate-400">السعر بعد الخصم</span>
                     <span className="text-lg font-black text-emerald-600">{ (itemInEdit.unitPrice * (1 - (itemInEdit.discountPct||0)/100)).toFixed(2) }</span>
                   </div>
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-600 mb-1">ملاحظات داخلية (لا تظهر بالطباعة)</label>
                   <input type="text" value={itemInEdit.internalNotes||''} onChange={e=>updateRow(editingItemId, {internalNotes: e.target.value})} className="w-full p-2 border rounded-lg bg-orange-50 font-bold text-orange-800 focus:border-orange-300 outline-none" />
                </div>

                <div className="pt-4 flex justify-end">
                  <button onClick={()=>setEditingItemId(null)} className="px-6 py-2.5 bg-[#0072BC] text-white rounded-xl font-bold shadow-lg shadow-sky-200">حفظ وحفظ التعديلات</button>
                </div>
             </div>
          </div>
       )}

    </div>
  )
}
