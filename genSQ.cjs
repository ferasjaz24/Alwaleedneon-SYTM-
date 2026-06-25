const fs = require('fs');
const path = require('path');

const contractText = `اتفاقية تصنيع وتوريد وتركيب

مقدمة الاتفاقية:
بناءً على عرض الأسعار المعتمد، يُعد سداد (العربون أو الدفعة المقدمة) من قِبل العميل موافقة نهائية على البدء في تنفيذ الأعمال الموضحة أدناه، ويسري هذا العرض كعقد تجاري متبادل وملزم للطرفين وفقاً للأحكام التالية:

أطراف الاتفاقية:
الطرف الأول (العميل): الواردة بياناته في عرض الأسعار.
الطرف الثاني: شركة فنون الوليد للصناعة.

الأحكام العامة للتنفيذ

البند الأول (التصاميم المعتمدة):
يُعتبر التصميم والأبعاد والألوان المعتمدة من الطرف الأول جزءاً أساسياً من هذه الاتفاقية، ويلتزم الطرف الثاني بالتنفيذ التام بناءً عليها.

البند الثاني (تعديل الطلب):
نظراً لأن الأعمال تُصنع خصيصاً بناءً على طلب العميل، فإنه لا يمكن إلغاء أو تعديل أي صنف بعد اعتماده والبدء في تصنيعه إلا بموافقة خطية من الطرف الثاني، ويتحمل الطرف الأول قيمة ما تم تصنيعه أو توريده فعلياً.

البند الثالث (ملكية المواد):
تظل جميع المواد والأصناف الموردة ملكاً للطرف الثاني حتى يتم سداد كامل القيمة المتبقية وتوقيع سند الاستلام. وفي حال التخلف عن السداد، يحق للطرف الثاني استرداد المواد، وتخضع إعادة تركيبها لرسوم إضافية يتفق عليها الطرفان.

البند الرابع (تجهيز الموقع والكهرباء):
يتكرم الطرف الأول بتوفير مصدر ومخرجات التيار الكهربائي اللازمة لتشغيل اللوحات عند نقاط التركيب.
يلتزم الطرف الأول بتهيئة الموقع وإزالة العوائق قبل موعد التركيب. وفي حال عدم الجاهزية، يرجى إشعار الطرف الثاني قبل الموعد لإعادة جدولة التركيب بالتوافق.
في حال وصول فريق التركيب للموقع وتبين عدم جاهزيته دون إشعار مسبق، يتحمل الطرف الأول التكاليف التشغيلية الفعلية المترتبة على انتقال الفريق والمعدات.

النطاق المالي والزمني

البند الخامس (مدة التنفيذ):
يتم التوريد والتركيب خلال (30 يوم عمل)، وتبدأ المدة من تاريخ سداد الدفعة الأولى أو اعتماد التصاميم النهائية، أيهما أحدث.

البند السادس (آلية السداد):
دفعة مقدمة: 50% من القيمة الإجمالية لبدء التصنيع.
دفعة ختامية: 50% المتبقية، وتُسدد قبل الموعد المحدد للتركيب والتسليم.

البند السابع (الأعمال الإضافية):
في حال طلب العميل إضافة أمتار أو كميات خارج نطاق عرض الأسعار أثناء التنفيذ، يتم احتسابها في الفاتورة النهائية وفقاً لسعر الصنف المتفق عليه.

البند الثامن (التأخر في الاستلام والتخزين):
عند جاهزية الأعمال، يلتزم الطرف الأول بسداد المتبقّي واستلامها، ويُمنح مهلة استضافة وتخزين مجانية في مستودعاتنا لمدة (10 أيام).
في حال تجاوز المهلة، يحق للطرف الثاني احتساب رسوم تخزين يومية عادلة لمدة أقصاها (20 يوماً).
إذا استمر عدم الاستلام لأكثر من (30 يوماً) من تاريخ الجاهزية، يحق للطرف الثاني التصرف بالأعمال بالطريقة المناسبة لتغطية التكاليف والمساحة الاستيعابية دون مسؤولية تترتب عليه.

المواصفات الفنية والضمانات

جميع المواد المستخدمة أصلية وتحمل ضمانات الوكلاء الموردين كالتالي:

الإضاءة LED:
حبيبات Modules وليست شريط - SAMSUNG كوري - مدة الضمان 3 سنوات - الجهة الضامنة: الوكيل المورد.

المحولات:
صناعة كورية - مدة الضمان سنتان - الجهة الضامنة: الوكيل المورد.

الستانلس ستيل:
رقم 304 - صناعة تايوان - مقاوم للصدأ - مدة الضمان 10 سنوات - الجهة الضامنة: الوكيل المورد.

الكلادنغ:
منتج وطني مقاوم للحريق وبمواصفات عالمية - مدة الضمان 20 سنة - الجهة الضامنة: الوكيل المورد.

الألمنيوم تشانل:
دهان حراري مقاوم للعوامل الجوية Powder Coated - مدة الضمان 5 سنوات - الجهة الضامنة: الوكيل المورد.

الأكريليك:
صناعة إندونيسية عالية النقاء - مدة الضمان 3 سنوات - الجهة الضامنة: الوكيل المورد.

أعمال التركيب:
ضمان جودة التثبيت والتركيب من مصنعنا - مدة الضمان 5 سنوات - الجهة الضامنة: الطرف الثاني، ولا يشمل الطباعة.

شروط واستثناءات الضمان

أوقات التشغيل:
تم تصميم الإضاءة للتشغيل الليلي، لذا يجب ألا تتجاوز مدة التشغيل (8 ساعات ليلاً) مع تجنب تشغيلها نهاراً.

الاستثناءات:
الضمان يغطي العيوب المصنعية فقط، ولا يشمل الكسور أو الأضرار الناتجة عن الحوادث أو الكوارث الطبيعية أو مشاكل التيار الكهربائي.

قطع الغيار:
يشمل الضمان استبدال القطع التالفة بسبب عيب مصنعي، ولا يشمل مصاريف التشغيل أو أجور النقل عند الاستبدال.

تفعيل الضمان:
يسري الضمان من تاريخ التركيب الفعلي، ويُعتبر ختم الشركة والشعار ورقم الهاتف الموجود على اللوحة بمثابة بطاقة الضمان.

خاتمة الاتفاقية:
حرر هذا العقد وتُنظم أحكامه بموجب تاريخ عرض الأسعار الصادر، متمنين لكم ولمنشأتكم التجارية دوام التوفيق والنجاح.`;

let code = `
import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Search, Plus, Filter, ArrowRight, Save, CheckCircle, Eye, Copy, 
  Trash2, Edit2, Check, AlertCircle 
} from 'lucide-react';
import { Client, WarehouseItem } from '../types';
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

export default function SalesQuotations({ lang, user }: Props) {
  const [quotes, setQuotes] = useState<SalesQuotation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState<'list' | 'edit'>('list');
  const [editorQtn, setEditorQtn] = useState<Partial<SalesQuotation> | null>(null);

  // List Filters
  const [searchName, setSearchName] = useState('');
  const [searchQtn, setSearchQtn] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc'|'asc'>('desc');
  const [statusFilter, setStatusFilter] = useState('الكل');

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmTimer, setDeleteConfirmTimer] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resQ, resC, resW] = await Promise.all([
        fetch('/api/sales_quotations'),
        fetch('/api/clients'),
        fetch('/api/warehouse_items')
      ]);
      if (resQ.ok) setQuotes(await resQ.json());
      if (resC.ok) setClients(await resC.json());
      if (resW.ok) setWarehouseItems(await resW.json());
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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

  const handleSaveEditor = async (forceStatus?: 'مسودة' | 'معتمد', showAlerts = true) => {
    if (!editorQtn) return;
    
    // validate if not draft
    if (forceStatus === 'معتمد') {
      if (!editorQtn.quotationNumber || !editorQtn.clientName) {
        if(showAlerts) alert('الرجاء إكمال البيانات الأساسية قبل الاعتماد');
        return;
      }
    }

    const payload = {
      ...editorQtn,
      status: forceStatus || editorQtn.status || 'مسودة',
      lastUpdated: new Date().toISOString()
    };
    if (!payload.id) {
       payload.id = \`SQ-\${Date.now()}\`;
       payload.dateCreated = new Date().toISOString();
    }

    try {
      const method = editorQtn.id ? 'PUT' : 'POST';
      const url = editorQtn.id ? \`/api/sales_quotations/\${editorQtn.id}\` : '/api/sales_quotations';
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
           if (forceStatus === 'معتمد') alert('تم اعتماد عرض السعر ولا يمكن تعديله.');
           else alert('تم الحفظ بنجاح');
        }
      }
    } catch(e) {
      if(showAlerts) alert('فشل الحفظ!');
    }
  };

  const handleBackFromEditor = () => {
    if (editorQtn && editorQtn.status !== 'معتمد') {
      const isNotEmpty = editorQtn.quotationNumber || editorQtn.clientName || (editorQtn.items && editorQtn.items.length > 0);
      if (isNotEmpty) {
         handleSaveEditor('مسودة', false);
         alert('تم حفظ عرض السعر كمسودة تلقائياً.');
      }
    }
    setMode('list');
    setEditorQtn(null);
  };

  const handlePrintPreview = (sq: SalesQuotation) => {
     const win = window.open('', '_blank');
     if(!win) return;

     const subtotal = calculateAmountWithoutTax(sq.items);
     const vat = subtotal * 0.15;
     const total = subtotal + vat;

     const content = \`
     <div style="font-family: 'Tajawal', Tahoma, Arial; direction: rtl; text-align: right; padding: 20px;">
       <div style="display:flex; justify-content: space-between; align-items: start; border-bottom: 2px solid #0072BC; padding-bottom: 10px; margin-bottom: 20px;">
          <div>
            <h1 style="color: #0072BC; margin:0;">عروض أسعار</h1>
            <p style="margin:5px 0;">رقم: <strong style="font-family:monospace; font-size:16px;">\${sq.quotationNumber}</strong></p>
            <p style="margin:5px 0;">الحالة: <span style="background:\${sq.status==='معتمد'?'#10b981':'#f59e0b'}; color:#fff; padding:2px 8px; border-radius:4px; font-size:12px;">\${sq.status}</span></p>
          </div>
          <div style="text-align:left;">
            <p style="margin:5px 0;">التاريخ: <strong>\${sq.quoteDate}</strong></p>
            <p style="margin:5px 0;">السنة المالية: <strong>\${sq.financialYear}</strong></p>
          </div>
       </div>

       <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:15px; margin-bottom:20px;">
          <h3 style="margin-top:0; color:#334155; border-bottom:1px solid #cbd5e1; padding-bottom:5px;">بيانات العميل</h3>
          <table style="width:100%; border-collapse:collapse; font-size:14px;">
            <tr>
              <td style="padding:5px;">الاسم / الشركة:</td><td style="font-weight:bold;">\${sq.clientName}</td>
              <td style="padding:5px;">المشروع:</td><td style="font-weight:bold;">\${sq.projectName || '---'}</td>
            </tr>
          </table>
       </div>

       <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="border:1px solid #cbd5e1; padding:8px;">#</th>
              <th style="border:1px solid #cbd5e1; padding:8px;">رمز الصنف</th>
              <th style="border:1px solid #cbd5e1; padding:8px;">اسم الصنف</th>
              <th style="border:1px solid #cbd5e1; padding:8px;">الوصف</th>
              <th style="border:1px solid #cbd5e1; padding:8px;">الكمية</th>
              <th style="border:1px solid #cbd5e1; padding:8px;">الوحدة</th>
              <th style="border:1px solid #cbd5e1; padding:8px;">سعر الوحدة</th>
              <th style="border:1px solid #cbd5e1; padding:8px;">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            \${sq.items.map((it, idx) => \`
              <tr>
                <td style="border:1px solid #cbd5e1; padding:8px; text-align:center;">\${idx+1}</td>
                <td style="border:1px solid #cbd5e1; padding:8px; text-align:center; font-family:monospace;">\${it.itemCode}</td>
                <td style="border:1px solid #cbd5e1; padding:8px; font-weight:bold;">\${it.itemName}</td>
                <td style="border:1px solid #cbd5e1; padding:8px; white-space:pre-wrap;">\${it.description || ''}</td>
                <td style="border:1px solid #cbd5e1; padding:8px; text-align:center;">\${it.quantity}</td>
                <td style="border:1px solid #cbd5e1; padding:8px; text-align:center;">\${it.unit || '-'}</td>
                <td style="border:1px solid #cbd5e1; padding:8px; text-align:center;">\${it.unitPrice.toFixed(2)}</td>
                <td style="border:1px solid #cbd5e1; padding:8px; text-align:center; font-weight:bold;">\${(it.quantity * it.unitPrice * (1 - (it.discountPct||0)/100)).toFixed(2)}</td>
              </tr>
            \`).join('')}
          </tbody>
       </table>

       <div style="display:flex; justify-content:flex-end; margin-bottom: 20px;">
          <table style="width:300px; border-collapse:collapse; font-size:14px;">
            <tr>
              <th style="border:1px solid #cbd5e1; padding:8px; background:#f8fafc; text-align:right;">المجموع الصافي</th>
              <td style="border:1px solid #cbd5e1; padding:8px; font-weight:bold; text-align:left;">\${subtotal.toFixed(2)} \${sq.currency}</td>
            </tr>
            <tr>
              <th style="border:1px solid #cbd5e1; padding:8px; background:#f8fafc; text-align:right;">ضريبة القيمة المضافة 15%</th>
              <td style="border:1px solid #cbd5e1; padding:8px; font-weight:bold; text-align:left;">\${vat.toFixed(2)} \${sq.currency}</td>
            </tr>
            <tr>
              <th style="border:1px solid #cbd5e1; padding:8px; background:#f1f5f9; color:#0072BC; text-align:right; font-size:16px;">المجموع الإجمالي</th>
              <td style="border:1px solid #cbd5e1; padding:8px; font-weight:bold; text-align:left; font-size:16px;">\${total.toFixed(2)} \${sq.currency}</td>
            </tr>
          </table>
       </div>
       
       <div style="background:#e0f2fe; padding:10px; border-radius:8px; text-align:center; font-weight:bold; color:#0369a1; margin-bottom:30px;">
          \${tafqeet(total, sq.currency)}
       </div>

       \${sq.termsText ? \`<div style="font-size:12px; line-height:1.6; border-top:2px solid #000; padding-top:20px; white-space:pre-wrap;">\${sq.termsText}</div>\` : ''}

       <div style="margin-top: 50px; display:flex; justify-content:space-between; font-size:14px;">
          <div style="width:40%; text-align:center; border-top:1px solid #ccc; padding-top:10px;">
            <strong>الطرف الأول (العميل)</strong>
            <br/><br/> التوقيع / الختم
          </div>
          <div style="width:40%; text-align:center; border-top:1px solid #ccc; padding-top:10px;">
            <strong>الطرف الثاني (شركة فنون الوليد للصناعة)</strong>
            <br/><br/> التوقيع / الختم
          </div>
       </div>

     </div>
     \`;

     win.document.write(\`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <title>عرض سعر - \${sq.quotationNumber}</title>
          <style>\${sharedPrintStyles}</style>
        </head>
        <body style="background: #fff; direction: rtl; text-align: right; font-family: 'Tajawal', sans-serif;">
          \${sharedPrintHeader}
          \${content}
          \${sharedPrintFooter}
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    \`);
    win.document.close();
  };

  const filteredQuotes = quotes.filter(q => {
    if (searchQtn && !q.quotationNumber?.toLowerCase().includes(searchQtn.toLowerCase())) return false;
    if (searchName && (!q.clientName?.toLowerCase().includes(searchName.toLowerCase()) && !q.projectName?.toLowerCase().includes(searchName.toLowerCase()))) return false;
    if (statusFilter !== 'الكل' && q.status !== statusFilter) return false;
    return true;
  }).sort((a,b) => {
    const tA = new Date(a.dateCreated).getTime();
    const tB = new Date(b.dateCreated).getTime();
    return sortOrder === 'desc' ? tB - tA : tA - tB;
  });

  if (loading) return <div className="p-10 text-center text-indigo-500 font-bold">جاري التحميل...</div>;

  return (
    <div className="font-sans animate-fade-in" dir="rtl">
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
              <button onClick={handleCreateNew} className="flex items-center gap-2 px-6 py-3 bg-[#0072BC] hover:bg-sky-700 text-white rounded-xl text-sm font-black shadow-lg transition">
                <Plus className="w-5 h-5"/>
                إضافة عرض سعر
              </button>
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
                    return (
                      <tr key={q.id} className="hover:bg-slate-50 transition">
                        <td className="p-4 font-mono font-bold text-[#0072BC]" dir="ltr" style={{textAlign:'right'}}>{q.quotationNumber || '---'}</td>
                        <td className="p-4 font-bold text-slate-800">{q.projectName || '-'}</td>
                        <td className="p-4 text-slate-600">{q.clientName || '-'}</td>
                        <td className="p-4 text-slate-600">{q.quoteDate}</td>
                        <td className="p-4 text-center">{q.financialYear}</td>
                        <td className="p-4 text-center text-slate-600 text-xs">{q.orderType}</td>
                        <td className="p-4 text-center font-bold text-emerald-600" dir="ltr">{total.toFixed(2)} {q.currency}</td>
                        <td className="p-4 text-center">
                          {q.status === 'معتمد' && <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black">معتمد</span>}
                          {q.status === 'مسودة' && <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-black">مسودة</span>}
                          {q.status === 'نشط' && <span className="bg-blue-100 text-[#0072BC] px-3 py-1 rounded-full text-xs font-black">نشط</span>}
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
                           </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredQuotes.length === 0 && <tr><td colSpan={9} className="p-10 text-center text-slate-400 font-bold">لا يوجد عروض متطابقة</td></tr>}
                </tbody>
              </table>
           </div>
        </div>
      ) : (
        <EditorScreen 
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
        />
      )}
    </div>
  );
}

function EditorScreen({quote, onChange, onBack, onSave, onPreview, onCopy, clients, warehouseItems, allQuotes, termsTemplate}: any) {
  const [tab, setTab] = useState<'basic' | 'print'>('basic');
  const [qtnGenType, setQtnGenType] = useState<'auto'|'manual'>('manual');
  
  const isReadOnly = quote.status === 'معتمد';

  const [editingItemId, setEditingItemId] = useState<string|null>(null);

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
    const prefix = \`QTN\${yr}\`;
    let max = 0;
    allQuotes.forEach((q:any) => {
       if (q.quotationNumber?.startsWith(prefix)) {
          const num = parseInt(q.quotationNumber.replace(prefix, ''), 10);
          if (!isNaN(num) && num > max) max = num;
       }
    });
    const newNo = \`\${prefix}\${String(max+1).padStart(5,'0')}\`;
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
             {isReadOnly && <span className="mr-3 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs">معتمد ومقفل</span>}
           </h2>
         </div>
         <div className="flex gap-2">
            {!isReadOnly && <button onClick={() => onSave('مسودة')} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"><Save className="w-4 h-4"/> حفظ كمسودة</button>}
            {!isReadOnly && <button onClick={() => onSave('معتمد')} className="flex items-center gap-2 px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-xl text-xs font-bold transition"><CheckCircle className="w-4 h-4"/> اعتماد العرض</button>}
            <button onClick={onPreview} className="flex items-center gap-2 px-4 py-2 bg-[#0072BC] hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition"><Eye className="w-4 h-4"/> معاينة طباعة</button>
            <button onClick={onCopy} className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold transition"><Copy className="w-4 h-4"/> إنشاء نسخة</button>
         </div>
       </div>

       <div className="flex gap-4 p-4 border-b border-slate-100 text-sm font-bold bg-white">
         <button onClick={()=>setTab('basic')} className={\`px-6 py-2.5 rounded-full transition \${tab==='basic' ? 'bg-[#0072BC] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}\`}>المعلومات الأساسية</button>
         <button onClick={()=>setTab('print')} className={\`px-6 py-2.5 rounded-full transition \${tab==='print' ? 'bg-[#0072BC] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}\`}>معلومات الطباعة والشروط</button>
       </div>

       {tab === 'basic' && (
         <div className="p-6 space-y-8 animate-fade-in relative \${isReadOnly ? 'opacity-90 pointer-events-none' : ''}">
           
           {/* Section 1 */}
           <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              
              <div className="bg-slate-50 p-4 border rounded-2xl md:col-span-2">
                 <label className="block text-xs font-bold text-slate-600 mb-2">رقم الكوتيشن</label>
                 {!isReadOnly && (
                   <div className="flex gap-2 mb-3">
                     <button onClick={()=>setQtnGenType('manual')} className={\`px-3 py-1.5 rounded-lg text-xs font-bold border \${qtnGenType==='manual'?'bg-indigo-600 text-white border-indigo-600':'bg-white'}\`}>إدخال يدوي</button>
                     <button onClick={()=>setQtnGenType('auto')} className={\`px-3 py-1.5 rounded-lg text-xs font-bold border \${qtnGenType==='auto'?'bg-indigo-600 text-white border-indigo-600':'bg-white'}\`}>توليد تلقائي</button>
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

           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-50 p-4 border rounded-2xl md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-2">التسعيرة إلى</label>
                {!isReadOnly && (
                  <div className="flex gap-2 mb-3">
                     <button onClick={()=>onChange({...quote, quoteToType:'client'})} className={\`px-3 py-1.5 rounded-lg text-xs font-bold border \${quote.quoteToType==='client'?'bg-[#0072BC] text-white':'bg-white'}\`}>عميل مسجل</button>
                     <button onClick={()=>onChange({...quote, quoteToType:'initiative'})} className={\`px-3 py-1.5 rounded-lg text-xs font-bold border \${quote.quoteToType==='initiative'?'bg-[#0072BC] text-white':'bg-white'}\`}>مبادرة بيع / اسم مخصص</button>
                  </div>
                )}
                
                {quote.quoteToType === 'client' ? (
                  <select value={quote.clientId} disabled={isReadOnly} onChange={e=>{
                     const c = clients.find((cc:any) => cc.id === e.target.value);
                     if(c) onChange({...quote, clientId: c.id, clientName: c.clientName});
                  }} className="w-full p-2.5 border rounded-xl text-sm font-bold">
                    <option value="">-- اختر عميل من القاعدة --</option>
                    {clients.map((c:any) => <option key={c.id} value={c.id}>{c.clientName} {c.companyName ? \`- \${c.companyName}\` : ''}</option>)}
                  </select>
                ) : (
                  <input type="text" value={quote.clientName} disabled={isReadOnly} onChange={e=>onChange({...quote, clientName: e.target.value, clientId: ''})} className="w-full p-2.5 border rounded-xl text-sm" placeholder="اسم مبادرة البيع..." />
                )}
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
                           {/* Quick Item Code Lookup */}
                           <input type="text" value={it.itemCode} disabled={isReadOnly}
                             onChange={e => {
                               const v = e.target.value;
                               const wItem = warehouseItems.find((w:any) => w.itemCode === v);
                               if (wItem) {
                                  updateRow(it.id, {itemCode: v, itemName: wItem.itemNameAr, unit: wItem.defaultUnit});
                               } else {
                                  updateRow(it.id, {itemCode: v});
                               }
                             }}
                             className="w-full p-2 border rounded-lg font-mono text-xs focus:border-[#0072BC] outline-none" placeholder="اكتب كود المستودع..." dir="ltr"
                           />
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
                                 className={\`p-1.5 rounded-lg transition \${delWaitId===it.id ? 'bg-red-500 text-white w-24 text-[10px] font-bold' : 'bg-rose-50 hover:bg-rose-100 text-rose-600'}\`}
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
         <div className="p-6 space-y-6 max-w-4xl mx-auto animate-fade-in relative \${isReadOnly ? 'opacity-90 pointer-events-none' : ''}">
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
               <label className="block text-sm font-bold text-indigo-800 mb-2">تحديد الشروط والأحكام القياسية</label>
               <select disabled={isReadOnly} onChange={e => {
                 if (e.target.value === 'contract' && !quote.termsText) {
                    onChange({...quote, termsText: termsTemplate});
                 }
               }} className="w-full md:w-1/2 p-2.5 border rounded-xl outline-none font-bold">
                  <option value="">-- اختر النموذج --</option>
                  <option value="contract">نموذج العقد القياسي Contract</option>
               </select>
            </div>

            <div>
               <label className="block text-sm font-bold text-slate-600 mb-2">محرر الشروط والأحكام (يظهر في الطباعة)</label>
               <textarea disabled={isReadOnly} value={quote.termsText || ''} onChange={e=>onChange({...quote, termsText: e.target.value})} rows={20} className="w-full p-4 border rounded-2xl outline-none focus:border-[#0072BC] leading-relaxed resize-y" placeholder="اكتب الشروط هنا..."></textarea>
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
`;

fs.writeFileSync(path.join(__dirname, 'src/components/SalesQuotations.tsx'), code, 'utf8');

