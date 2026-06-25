import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, Phone, Mail, MapPin, User, Search, Filter, Calendar, Save, Trash2, 
  Upload, Sparkles, Printer, Info, CheckCircle2, AlertTriangle, FileSpreadsheet,
  X, MessageCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { Quotation, Employee, Client } from '../types';
import { sharedPrintHeader, sharedPrintFooter, sharedPrintStyles } from '../utils/PrintShared';
import { getAdvancedPermissionScope } from '../lib/permissions';

const arabCountries = [
  { name: 'السعودية', flag: '🇸🇦' },
  { name: 'الإمارات', flag: '🇦🇪' },
  { name: 'الكويت', flag: '🇰🇼' },
  { name: 'قطر', flag: '🇶🇦' },
  { name: 'البحرين', flag: '🇧🇭' },
  { name: 'عمان', flag: '🇴🇲' },
  { name: 'مصر', flag: '🇪🇬' },
  { name: 'الأردن', flag: '🇯🇴' },
  { name: 'المغرب', flag: '🇲🇦' },
  { name: 'الجزائر', flag: '🇩🇿' },
  { name: 'تونس', flag: '🇹🇳' },
  { name: 'العراق', flag: '🇮🇶' },
  { name: 'اليمن', flag: '🇾🇪' },
  { name: 'سوريا', flag: '🇸🇾' },
  { name: 'فلسطين', flag: '🇵🇸' },
  { name: 'لبنان', flag: '🇱🇧' },
  { name: 'ليبيا', flag: '🇱🇾' },
  { name: 'السودان', flag: '🇸🇩' },
  { name: 'موريتانيا', flag: '🇲🇷' },
  { name: 'الصومال', flag: '🇸🇴' },
  { name: 'غير ذلك', flag: '🌍' }
];

const saudiRegions = ['المنطقة الشرقية', 'المنطقة الوسطى', 'المنطقة الشمالية', 'المنطقة الغربية', 'المنطقة الجنوبية'];
const saudiCities = {
  'المنطقة الشرقية': ['الدمام', 'الخبر', 'الظهران', 'الاحساء', 'الجبيل', 'القطيف', 'الخفجي', 'حفر الباطن'],
  'المنطقة الوسطى': ['الرياض', 'الخرج', 'بريدة', 'عنيزة', 'الزلفي', 'المجمعة', 'الرس'],
  'المنطقة الغربية': ['مكة المكرمة', 'جدة', 'الطائف', 'المدينة المنورة', 'ينبع', 'رابغ'],
  'المنطقة الجنوبية': ['ابها', 'خميس مشيط', 'نجران', 'جازان', 'الباحة', 'بيشة'],
  'المنطقة الشمالية': ['تبوك', 'حائل', 'عرعر', 'سكاكا', 'القريات', 'طريف', 'رفحاء']
};


interface SalesHubProps {
  lang: 'ar' | 'en';
  user: { username: string; role: string; jobTitle: string };
  quotations: Quotation[];
  onSaveQuotation?: (q: Quotation) => Promise<void>;
  onDeleteQuotation?: (id: string) => Promise<void>;
  employees?: any[];
  activeSubTab?: string;
}

export default function SalesHub({ lang, user, quotations }: SalesHubProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [salesQuotes, setSalesQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [classFilter, setClassFilter] = useState(''); // Commercial classification
  const [statusFilter, setStatusFilter] = useState(''); // Active, dormant, etc.
  
  const [sortOrder, setSortOrder] = useState<'desc'|'asc'>('desc');
  const [timeFilter, setTimeFilter] = useState('all'); // all, today, month, prev_month, year

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null);

  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  const [noDataToast, setNoDataToast] = useState(false);
  const [showNationalAddress, setShowNationalAddress] = useState(false);
  
  // Country Search state
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const showNoDataPopup = () => {
    setNoDataToast(true);
    setTimeout(() => setNoDataToast(false), 3000);
  };


  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const commercialClasses = [
    'كوفي', 'مطعم', 'مشروع عقاري', 'مشروع تجاري عملاق',
    'مشروع تجاري', 'تجاري', 'حكومي', 'شخص'
  ];

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const [res, sysRes] = await Promise.all([fetch('/api/clients'), fetch('/api/sales_quotations')]);
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
      if (sysRes && sysRes.ok) {
        const sqData = await sysRes.json();
        setSalesQuotes(sqData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getClientStatus = (clientId: string) => {
    const clientQuotes = salesQuotes.filter(q => (q.clientId === clientId || q.clientName === getClientName(clientId)) && q.status === 'معتمد');
    if (clientQuotes.length === 0) return 'عميل راكد';
    
    // Get latest approved quote date
    const latestQuote = clientQuotes.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime())[0];
    const monthsDiff = (new Date().getTime() - new Date(latestQuote.dateCreated).getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsDiff <= 1) return 'عميل نشط';
    if (monthsDiff > 12) return 'عميل قديم';
    if (monthsDiff > 5) return 'عميل منسي';
    if (monthsDiff > 2) return 'عميل راكد';
    return 'عميل نشط'; 
  };

  const getClientName = (id: string) => clients.find(c => c.id === id)?.clientName || '';

  const isManagement = () => {
    const role = user.role?.toLowerCase() || '';
    const name = user.username?.toLowerCase() || '';
    return role.includes('manager') || role.includes('admin') || role.includes('owner') || name === 'feras' || role.includes('إدارة');
  };

  const handleDeleteClient = async (id: string) => {
    // Cannot delete if linked
    const isLinked = salesQuotes.some(q => q.clientId === id || q.clientName === getClientName(id));
    if (isLinked) {
      alert(lang === 'ar' ? 'لا يمكن حذف عميل مرتبط بعرض سعر (سواء معتمد أو مسودة)' : 'Cannot delete client linked to quotations');
      return;
    }

    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف العميل نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.' : 'Confirm deletion?')) return;

    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setClients(clients.filter(c => c.id !== id));
      }
    } catch(e) {
      console.error(e);
    }
  };

  const handleSaveClient = async (isManualSave = true) => {
    if (!editingClient || !editingClient.clientName || !editingClient.mobile) {
      if (isManualSave) alert(lang === 'ar' ? 'يجب إدخال اسم العميل ورقم الجوال كحد أدنى' : 'Client name and mobile are required');
      return;
    }

    const payload = {
      ...editingClient,
      isDraft: !isManualSave,
      ...(editingClient.id ? {} : { createdBy: user?.username || 'المستخدم الحالي' })
    };

    try {
      const method = payload.id ? 'PUT' : 'POST';
      const url = payload.id ? `/api/clients/${payload.id}` : '/api/clients';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const saved = payload.id ? payload : (await res.json()).client;
        setClients(prev => {
          const exists = prev.find(p => p.id === saved.id);
          if (exists) return prev.map(p => p.id === saved.id ? saved as Client : p);
          return [...prev, saved as Client];
        });
        if (isManualSave) {
          setIsClientModalOpen(false);
          setEditingClient(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleModalClose = () => {
    // Auto save as draft if there's text
    if (editingClient && (editingClient.clientName || editingClient.mobile)) {
       handleSaveClient(false); // save as draft
    }
    setIsClientModalOpen(false);
    setEditingClient(null);
  };

  const handleAIParse = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // alert removed, parsing in bg
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch('/api/gemini/parse-client', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ fileBase64: reader.result })
        });
        if (res.ok) {
          const data = await res.json();
          if (!data.clientName && !data.companyName && !data.mobile && !data.crNumber && !data.taxNumber) {
            showNoDataPopup();
            return;
          }
          setEditingClient({
             ...editingClient,
             clientName: data.clientName || '',
             companyName: data.companyName || '',
             mobile: data.mobile || '',
             email: data.email || '',
             city: data.city || '',
             crNumber: data.crNumber || '',
             taxNumber: data.taxNumber || ''
          });
          setIsClientModalOpen(true);
        }
      } catch (err) {
        console.error(err);
        showNoDataPopup();
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input so same file can be selected again
  };

  const filteredClients = clients.filter(c => {
    const viewScope = getAdvancedPermissionScope(user as any, 'sales', 'clients', 'view_clients');
    if (viewScope === 'own' && (c as any).createdBy && (c as any).createdBy !== user?.username) return false;
    if (viewScope === 'none') return false;

    if (searchTerm && !c.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) && !c.companyName?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (cityFilter && !c.city?.toLowerCase().includes(cityFilter.toLowerCase())) return false;
    if (classFilter && c.classification !== classFilter) return false;
    
    // Status Filter
    if (statusFilter) {
       const stat = getClientStatus(c.id);
       if (stat !== statusFilter) return false;
    }

    // Time filter
    if (timeFilter !== 'all' && c.dateCreated) {
       const cd = new Date(c.dateCreated);
       const now = new Date();
       if (timeFilter === 'today') {
         if (cd.toDateString() !== now.toDateString()) return false;
       } else if (timeFilter === 'month') {
         if (cd.getMonth() !== now.getMonth() || cd.getFullYear() !== now.getFullYear()) return false;
       } else if (timeFilter === 'prev_month') {
         const prevM = new Date();
         prevM.setMonth(prevM.getMonth() - 1);
         if (cd.getMonth() !== prevM.getMonth() || cd.getFullYear() !== prevM.getFullYear()) return false;
       } else if (timeFilter === 'year') {
         if (cd.getFullYear() !== now.getFullYear()) return false;
       }
    }
    return true;
  }).sort((a, b) => {
    const tA = new Date(a.dateCreated || 0).getTime();
    const tB = new Date(b.dateCreated || 0).getTime();
    return sortOrder === 'desc' ? tB - tA : tA - tB;
  });

  const printClientDetails = (client: Client) => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    
    const clientQuotes = salesQuotes.filter(q => (q.clientId === client.id || q.clientName === client.clientName) && q.status === 'معتمد');

    const printContent = `
      <div style="font-family: 'Tajawal', Tahoma, Arial; direction: rtl; text-align: right; padding: 20px;">
        <h2 style="color: #0072BC; text-align: center; border-bottom: 2px solid #0072BC; padding-bottom: 10px;">سجل وملخص العميل</h2>
        
        <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
          <tr>
            <th style="border: 1px solid #ccc; padding: 10px; background: #f8fafc; width: 25%;">اسم العميل</th>
            <td style="border: 1px solid #ccc; padding: 10px; font-weight: bold;">${client.clientName || '---'}</td>
            <th style="border: 1px solid #ccc; padding: 10px; background: #f8fafc; width: 25%;">اسم الشركة / المنشأة</th>
            <td style="border: 1px solid #ccc; padding: 10px; font-weight: bold;">${client.companyName || '---'}</td>
          </tr>
          <tr>
            <th style="border: 1px solid #ccc; padding: 10px; background: #f8fafc;">رقم الجوال</th>
            <td style="border: 1px solid #ccc; padding: 10px;">${client.mobile || '---'}</td>
            <th style="border: 1px solid #ccc; padding: 10px; background: #f8fafc;">البريد الإلكتروني</th>
            <td style="border: 1px solid #ccc; padding: 10px;">${client.email || '---'}</td>
          </tr>
           
          <tr>
            <th style="border: 1px solid #ccc; padding: 10px; background: #f8fafc;">الدولة</th>
            <td style="border: 1px solid #ccc; padding: 10px;">${client.country || '---'}</td>
             <th style="border: 1px solid #ccc; padding: 10px; background: #f8fafc;">الاقليم / المنطقة</th>
            <td style="border: 1px solid #ccc; padding: 10px;">${client.region || '---'}</td>
          </tr>
          <tr>
             <th style="border: 1px solid #ccc; padding: 10px; background: #f8fafc;">المدينة</th>
            <td style="border: 1px solid #ccc; padding: 10px;">${client.city || '---'}</td>
            <th style="border: 1px solid #ccc; padding: 10px; background: #f8fafc;">التصنيف التجاري</th>
            <td style="border: 1px solid #ccc; padding: 10px;">${client.classification || '---'}</td>
          </tr>
          <tr>
            <th style="border: 1px solid #ccc; padding: 10px; background: #f8fafc;">السجل التجاري</th>
            <td style="border: 1px solid #ccc; padding: 10px;">${client.crNumber || '---'}</td>
            <th style="border: 1px solid #ccc; padding: 10px; background: #f8fafc;">الرقم الضريبي</th>
            <td style="border: 1px solid #ccc; padding: 10px;">${client.taxExempt ? 'معفى من الضريبة' : client.taxNumber || '---'}</td>
          </tr>
        </table>

        ${client.nationalAddress && (client.nationalAddress.buildingNumber || client.nationalAddress.streetName || client.nationalAddress.district || client.nationalAddress.city || client.nationalAddress.postalCode || client.nationalAddress.additionalNumber) ? `
        <h3 style="color: #334155; margin-top: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">تفاصيل العنوان الوطني</h3>
        <table style="width: 100%; margin-top: 10px; border-collapse: collapse; font-size: 13px;">
          <tr>
            <th style="border: 1px solid #ccc; padding: 8px; background: #f8fafc;">رقم المبنى</th>
            <td style="border: 1px solid #ccc; padding: 8px;">${client.nationalAddress.buildingNumber || '---'}</td>
            <th style="border: 1px solid #ccc; padding: 8px; background: #f8fafc;">اسم الشارع</th>
            <td style="border: 1px solid #ccc; padding: 8px;">${client.nationalAddress.streetName || '---'}</td>
          </tr>
          <tr>
            <th style="border: 1px solid #ccc; padding: 8px; background: #f8fafc;">اسم الحي</th>
            <td style="border: 1px solid #ccc; padding: 8px;">${client.nationalAddress.district || '---'}</td>
            <th style="border: 1px solid #ccc; padding: 8px; background: #f8fafc;">المدينة</th>
            <td style="border: 1px solid #ccc; padding: 8px;">${client.nationalAddress.city || '---'}</td>
          </tr>
           <tr>
             <th style="border: 1px solid #ccc; padding: 8px; background: #f8fafc;">الرمز البريدي</th>
            <td style="border: 1px solid #ccc; padding: 8px;">${client.nationalAddress.postalCode || '---'}</td>
             <th style="border: 1px solid #ccc; padding: 8px; background: #f8fafc;">الرقم الإضافي</th>
            <td style="border: 1px solid #ccc; padding: 8px;">${client.nationalAddress.additionalNumber || '---'}</td>
          </tr>
        </table>` : ''}

        <h3 style="color: #334155; margin-top: 40px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">سجل عروض الأسعار المرتبطة</h3>
        <table style="width: 100%; margin-top: 15px; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f1f5f9;">رقم العرض</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f1f5f9;">المشروع</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f1f5f9;">التاريخ</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f1f5f9;">الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${clientQuotes.length > 0 ? clientQuotes.map((q, i) => `
              <tr>
                <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${q.quotationNumber || q.id}</td>
                <td style="border: 1px solid #ccc; padding: 8px;">${q.projectName || '--'}</td>
                <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${q.quoteDate || new Date(q.dateCreated).toLocaleDateString('en-GB')}</td>
                <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${q.stage}</td>
              </tr>
            `).join('') : `<tr><td colspan="4" style="border: 1px solid #ccc; padding: 15px; text-align: center; color: #64748b;">لا توجد عروض أسعار مسجلة لهذا العميل.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <title>سجل العميل - ${client.clientName}</title>
          <style>${sharedPrintStyles}</style>
        </head>
        <body style="background: #fff; direction: rtl; text-align: right; font-family: 'Tajawal', sans-serif;">
          ${sharedPrintHeader}
          ${printContent}
          ${sharedPrintFooter}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 700);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const getWhatsAppLink = (phone: string) => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('05')) clean = '966' + clean.substring(1);
    return `https://api.whatsapp.com/send?phone=${clean}`;
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-[#0072BC] font-bold text-xl">جاري تحميل العملاء...</div>;

  return (
    <div className="space-y-6 animate-fade-in font-sans" dir="rtl">
      {noDataToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-rose-500 text-white px-6 py-3 rounded-full text-sm font-bold shadow-xl animate-fade-in flex items-center gap-2">
          <AlertTriangle className="w-5 h-5"/>
          {lang === 'ar' ? 'لا توجد معلومات للعملاء من الملف' : 'No client information found from file'}
        </div>
      )}

      {/* HEADER & TOP ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h2 className="text-xl font-black text-[#0072BC] flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            {lang === 'ar' ? 'إدارة العملاء و السجل التجاري' : 'Clients & CRM Manager'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">{lang === 'ar' ? 'هذا القسم لإدارة العملاء فقط.' : 'This section is strictly for client administration.'}</p>
        </div>
        
        <div className="flex flex-wrap gap-2 justify-end">
          <input type="file" accept=".pdf,.csv,.xlsx" hidden ref={fileInputRef} onChange={handleAIParse} />
          <input type="file" accept="image/*" hidden ref={imageInputRef} onChange={handleAIParse} />

          <button onClick={() => imageInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition">
            <Sparkles className="w-4 h-4" />
            {lang === 'ar' ? 'استيراد وقراءة بالذكاء الاصطناعي (صور)' : 'AI Parse from Image'}
          </button>
          
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition">
            <Sparkles className="w-4 h-4" />
            {lang === 'ar' ? 'استيراد بالذكاء الاصطناعي (PDF/Excel)' : 'AI Parse from Excel/PDF'}
          </button>

          <button onClick={() => setIsClientModalOpen(true)} className="flex items-center gap-2 px-5 py-2 bg-[#0072BC] hover:bg-sky-700 text-white rounded-xl text-xs font-black shadow-lg shadow-[#0072BC]/20 transition">
            <User className="w-4 h-4" />
            {lang === 'ar' ? 'إضافة عميل جديد' : 'Add New Client'}
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-bold text-slate-600">
        <div className="col-span-1 md:col-span-2">
          <label className="block mb-1">{lang === 'ar' ? 'البحث بالاسم / الشركة:' : 'Search Name/Company:'}</label>
          <input 
            type="text" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="..."
            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#0072BC]"
          />
        </div>
        <div>
          <label className="block mb-1">{lang === 'ar' ? 'تصفية بالمدينة:' : 'Filter by City:'}</label>
          <input 
            type="text" 
            value={cityFilter} 
            onChange={e => setCityFilter(e.target.value)}
            placeholder="..."
            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#0072BC]"
          />
        </div>
        <div>
          <label className="block mb-1">{lang === 'ar' ? 'التصنيف التجاري:' : 'Comm. Class:'}</label>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl">
            <option value="">{lang === 'ar' ? 'الكل' : 'All'}</option>
            {commercialClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1">{lang === 'ar' ? 'حالة العميل (ديناميكي):' : 'Status:'}</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl">
            <option value="">{lang === 'ar' ? 'الكل' : 'All'}</option>
            <option value="عميل نشط">عميل نشط (آخر طلب &lt; شهر)</option>
            <option value="عميل راكد">عميل راكد (&gt; شهرين)</option>
            <option value="عميل منسي">عميل منسي (&gt; 5 شهور)</option>
            <option value="عميل قديم">عميل قديم (&gt; سنة)</option>
          </select>
        </div>
        <div>
          <label className="block mb-1">{lang === 'ar' ? 'الفترة الزمنية:' : 'Time Filter:'}</label>
          <select value={timeFilter} onChange={e => setTimeFilter(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl">
            <option value="all">{lang === 'ar' ? 'الكل' : 'All'}</option>
            <option value="today">{lang === 'ar' ? 'اليوم' : 'Today'}</option>
            <option value="month">{lang === 'ar' ? 'هذا الشهر' : 'This Month'}</option>
            <option value="prev_month">{lang === 'ar' ? 'الشهر السابق' : 'Previous Month'}</option>
            <option value="year">{lang === 'ar' ? 'منذ سنة (هذا العام)' : 'This Year'}</option>
          </select>
        </div>
        <div>
          <label className="block mb-1">{lang === 'ar' ? 'الترتيب (الأقدم/الأحدث):' : 'Sorting:'}</label>
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value as any)} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl">
            <option value="desc">{lang === 'ar' ? 'من الأحدث إلى الأقدم' : 'Newest First'}</option>
            <option value="asc">{lang === 'ar' ? 'من الأقدم إلى الأحدث' : 'Oldest First'}</option>
          </select>
        </div>
      </div>

      {/* CLIENTS LIST */}
      <div className="space-y-4">
        {filteredClients.map(client => {
           const stat = getClientStatus(client.id);
           const isExpanded = expandedClientId === client.id;
           let statColor = 'bg-slate-100 text-slate-600';
           if (stat === 'عميل نشط') statColor = 'bg-emerald-100/60 text-emerald-700';
           if (stat === 'عميل راكد') statColor = 'bg-amber-100/60 text-amber-700';
           if (stat === 'عميل منسي') statColor = 'bg-orange-100/60 text-orange-700';
           if (stat === 'عميل قديم') statColor = 'bg-rose-100/60 text-rose-700';

           return (
             <div key={client.id} className="bg-white border flex flex-col rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition duration-200 p-1">
               {/* Simplified View Header */}
               <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <div className="flex-1 flex flex-col gap-1">
                   <div className="flex items-center gap-3">
                     <h3 className="font-extrabold text-slate-800 text-sm">{client.clientName}</h3>
                     {client.isDraft && <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] rounded font-black">مسودة</span>}
                     <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${statColor}`}>{stat}</span>
                   </div>
                   <div className="flex items-center gap-4 text-xs font-bold text-slate-500 mt-1">
                     <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {client.mobile || '---'}</span>
                     <span className="flex items-center gap-1"><Building2 className="w-3 h-3"/> {client.companyName || '---'}</span>
                     <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {client.city || '---'}</span>
                   </div>
                 </div>
                 <div>
                   <button 
                     onClick={() => setExpandedClientId(isExpanded ? null : client.id)}
                     className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition"
                   >
                     {isExpanded ? (lang === 'ar' ? 'إخفاء التفاصيل ▲' : 'Hide Details ▲') : (lang === 'ar' ? 'عرض التفاصيل ▼' : 'Show Details ▼')}
                   </button>
                 </div>
               </div>

               {/* Expanded Details View */}
               {isExpanded && (
                 <div className="p-5 bg-slate-50 border-t border-slate-100 animate-fade-in relative space-y-5">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <div>
                        <p className="text-slate-400 mb-1">البريد الإلكتروني:</p>
                        <p className="font-bold">{client.email || 'غير متوفر'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 mb-1">السجل التجاري:</p>
                        <p className="font-bold">{client.crNumber || 'غير متوفر'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 mb-1">الرقم الضريبي:</p>
                        <p className="font-bold">{client.taxExempt ? <span className="text-emerald-600">معفى من الضريبة</span> : client.taxNumber || 'غير متوفر'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 mb-1">تصنيف النشاط:</p>
                        <p className="font-bold">{client.classification || 'غير متوفر'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 mb-1">تاريخ الإضافة بالنظام:</p>
                        <p className="font-bold font-mono">{client.dateCreated ? new Date(client.dateCreated).toLocaleString('en-GB') : 'غير متوفر'}</p>
                      </div>
                   </div>

                   <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200">
                     <button 
                       onClick={() => window.open(getWhatsAppLink(client.mobile), '_blank')}
                       className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition"
                     >
                       <MessageCircle className="w-4 h-4" />
                       التواصل على الواتس اب
                     </button>
                     
                     <button 
                       onClick={() => {
                          setEditingClient(client);
                          setIsClientModalOpen(true);
                       }}
                       className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-black transition"
                     >
                       <Building2 className="w-4 h-4" />
                       تعديل البيانات
                     </button>

                     <button 
                       onClick={() => printClientDetails(client)}
                       className="flex items-center gap-2 px-4 py-2 bg-[#0072BC] hover:bg-sky-700 text-white rounded-xl text-xs font-black transition"
                     >
                       <Printer className="w-4 h-4" />
                       طباعة سجل عميل
                     </button>

                     <button 
                         onClick={() => handleDeleteClient(client.id)}
                         className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-black transition mr-auto"
                       >
                         <Trash2 className="w-4 h-4" />
                         حذف العميل نهائياً
                       </button>
                   </div>
                 </div>
               )}
             </div>
           )
        })}
        {filteredClients.length === 0 && (
          <div className="p-10 text-center text-slate-400 font-bold bg-white border rounded-2xl">
            لا توجد بيانات عملاء متطابقة مع البحث
          </div>
        )}
      </div>

      {/* ADD/EDIT CLIENT MODAL */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-extrabold text-[#0072BC] flex items-center gap-2">
                <User className="w-5 h-5"/>
                {editingClient?.id ? 'تعديل بيانات العميل' : 'إضافة عميل جديد للنظام'}
              </h3>
              <button onClick={handleModalClose} className="p-2 hover:bg-slate-200 rounded-full transition">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 text-sm font-bold text-slate-600 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block mb-1.5">اسم العميل <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    value={editingClient?.clientName || ''}
                    onChange={e => setEditingClient({...editingClient, clientName: e.target.value})}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-[#0072BC]"
                    placeholder="اسم المسؤول أو الشخص..."
                  />
                </div>
                <div>
                  <label className="block mb-1.5">رقم الجوال <span className="text-rose-500">*</span></label>
                  <input 
                    type="tel" 
                    value={editingClient?.mobile || ''}
                    onChange={e => setEditingClient({...editingClient, mobile: e.target.value})}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-[#0072BC]"
                    placeholder="05..."
                    dir="ltr"
                    style={{ textAlign: 'right' }}
                  />
                </div>
                <div>
                  <label className="block mb-1.5">اسم الشركة / المنشأة التجاري</label>
                  <input 
                    type="text" 
                    value={editingClient?.companyName || ''}
                    onChange={e => setEditingClient({...editingClient, companyName: e.target.value})}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-[#0072BC]"
                    placeholder="مطاعم..."
                  />
                </div>
                
                {/* Country Selection */}
                <div className="relative">
                  <label className="block mb-1.5">دولة العميل</label>
                  <div 
                    className="w-full p-2.5 border border-slate-300 rounded-xl cursor-pointer bg-white flex justify-between items-center"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  >
                    <span>
                      {editingClient?.country ? (arabCountries.find(c => c.name === editingClient.country)?.flag || '🌍') + ' ' + editingClient.country : 'اختر الدولة...'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>
                  {showCountryDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-xl z-50 overflow-hidden">
                      <div className="p-2 border-b">
                        <input 
                          type="text" 
                          placeholder="ابحث عن دولة..." 
                          className="w-full p-2 bg-slate-50 border rounded-lg outline-none"
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto p-2">
                        {arabCountries.filter(c => c.name.includes(countrySearch)).map(country => (
                          <div 
                            key={country.name}
                            className="p-2 hover:bg-slate-50 cursor-pointer rounded-lg flex items-center gap-2"
                            onClick={() => {
                               setEditingClient({...editingClient, country: country.name, region: '', city: ''});
                               setShowCountryDropdown(false);
                               setCountrySearch('');
                            }}
                          >
                            <span>{country.flag}</span>
                            <span>{country.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Region if KSA */}
                {editingClient?.country === 'السعودية' && (
                  <div>
                    <label className="block mb-1.5">اقليم العميل</label>
                    <select 
                      value={editingClient?.region || ''}
                      onChange={e => setEditingClient({...editingClient, region: e.target.value, city: ''})}
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-[#0072BC]"
                    >
                      <option value="">اختر الإقليم...</option>
                      {saudiRegions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                )}

                {/* City based on logic */}
                <div>
                  <label className="block mb-1.5">المدينة / المنطقة</label>
                  {editingClient?.country === 'السعودية' && editingClient?.region ? (
                    <select 
                      value={editingClient?.city || ''}
                      onChange={e => setEditingClient({...editingClient, city: e.target.value})}
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-[#0072BC]"
                    >
                      <option value="">اختر المدينة...</option>
                      {saudiCities[editingClient?.region as keyof typeof saudiCities]?.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      value={editingClient?.city || ''}
                      onChange={e => setEditingClient({...editingClient, city: e.target.value})}
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-[#0072BC]"
                      placeholder={editingClient?.country === 'السعودية' ? 'اختر الإقليم لتظهر المدن...' : 'اكتب اسم المدينة...'}
                      disabled={editingClient?.country === 'السعودية' && !editingClient?.region}
                    />
                  )}
                </div>

                <div>
                  <label className="block mb-1.5">البريد الإلكتروني</label>
                  <input 
                    type="email" 
                    value={editingClient?.email || ''}
                    onChange={e => setEditingClient({...editingClient, email: e.target.value})}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-[#0072BC]"
                    placeholder="example@mail.com"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block mb-1.5">السجل التجاري C.R</label>
                  <input 
                    type="text" 
                    value={editingClient?.crNumber || ''}
                    onChange={e => setEditingClient({...editingClient, crNumber: e.target.value})}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-[#0072BC]"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 border rounded-xl space-y-4">
                <div className="flex items-center gap-3 bg-white p-3 border rounded-lg shadow-sm w-fit cursor-pointer" onClick={() => setEditingClient({...editingClient, taxExempt: !editingClient?.taxExempt})}>
                  <input 
                    type="checkbox" 
                    checked={editingClient?.taxExempt || false}
                    onChange={() => {}}
                    className="w-5 h-5 cursor-pointer accent-[#0072BC]"
                  />
                  <label className="cursor-pointer">هذا العميل جهة معفاة من ضريبة القيمة المضافة بشكل رسمي</label>
                </div>
                
                {!editingClient?.taxExempt && (
                  <div className="w-1/2 min-w-[250px] animate-fade-in">
                    <label className="block mb-1.5">الرقم الضريبي (VAT)</label>
                    <input 
                      type="text" 
                      value={editingClient?.taxNumber || ''}
                      onChange={e => setEditingClient({...editingClient, taxNumber: e.target.value})}
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-[#0072BC]"
                      dir="ltr"
                    />
                  </div>
                )}
              </div>

              
              <div>
                <div className="flex flex-col md:flex-row gap-6 mt-4">
                  {/* Comm. Classification */}
                  <div className="flex-1">
                    <label className="block mb-1.5 text-indigo-700 font-bold">التصنيف التجاري لنشاط العميل</label>
                    <div className="flex flex-wrap gap-2">
                      {commercialClasses.map(cl => (
                        <button
                          key={cl}
                          onClick={() => setEditingClient({...editingClient, classification: cl})}
                          className={`px-3 py-1.5 border rounded-lg transition text-xs ${editingClient?.classification === cl ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-600'}`}
                        >
                          {cl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* National Address Header (Toggle) */}
                  <div className="flex-1">
                     <label className="block mb-1.5 text-indigo-700 font-bold">&nbsp;</label>
                     <button
                       onClick={() => setShowNationalAddress(!showNationalAddress)}
                       className="w-full justify-between flex items-center gap-2 px-4 py-2 border-2 border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 rounded-xl font-bold transition"
                     >
                       <span>📍 تفاصيل العنوان الوطني</span>
                       {showNationalAddress ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                     </button>
                  </div>
                </div>

                {/* National Address Fields */}
                {showNationalAddress && (
                  <div className="mt-4 bg-indigo-50/30 p-5 rounded-2xl border border-indigo-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in relative">
                     <span className="absolute -top-3 right-6 bg-white px-3 text-xs text-indigo-600 font-bold border border-indigo-100 rounded-lg">بيانات العنوان الوطني للتسجيل</span>
                     <div>
                       <label className="block mb-1 text-xs text-slate-500">رقم المبنى</label>
                       <input 
                         type="text" 
                         maxLength={4}
                         value={editingClient?.nationalAddress?.buildingNumber || ''}
                         onChange={e => setEditingClient({...editingClient, nationalAddress: {...(editingClient.nationalAddress || {}), buildingNumber: e.target.value.replace(/\D/g,'')}})}
                         className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                         placeholder="4 أرقام"
                         dir="ltr"
                       />
                     </div>
                     <div>
                       <label className="block mb-1 text-xs text-slate-500">اسم الشارع</label>
                       <input 
                         type="text" 
                         value={editingClient?.nationalAddress?.streetName || ''}
                         onChange={e => setEditingClient({...editingClient, nationalAddress: {...(editingClient.nationalAddress || {}), streetName: e.target.value}})}
                         className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                         placeholder="شارع الأمير..."
                       />
                     </div>
                     <div>
                       <label className="block mb-1 text-xs text-slate-500">اسم الحي</label>
                       <input 
                         type="text" 
                         value={editingClient?.nationalAddress?.district || ''}
                         onChange={e => setEditingClient({...editingClient, nationalAddress: {...(editingClient.nationalAddress || {}), district: e.target.value}})}
                         className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                         placeholder="حي الورود..."
                       />
                     </div>
                     <div>
                       <label className="block mb-1 text-xs text-slate-500">المدينة (بالعنوان)</label>
                       <input 
                         type="text" 
                         value={editingClient?.nationalAddress?.city || ''}
                         onChange={e => setEditingClient({...editingClient, nationalAddress: {...(editingClient.nationalAddress || {}), city: e.target.value}})}
                         className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                         placeholder="الرياض..."
                       />
                     </div>
                     <div>
                       <label className="block mb-1 text-xs text-slate-500">الرمز البريدي</label>
                       <input 
                         type="text" 
                         maxLength={5}
                         value={editingClient?.nationalAddress?.postalCode || ''}
                         onChange={e => setEditingClient({...editingClient, nationalAddress: {...(editingClient.nationalAddress || {}), postalCode: e.target.value.replace(/\D/g,'')}})}
                         className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                         placeholder="5 أرقام"
                         dir="ltr"
                       />
                     </div>
                     <div>
                       <label className="block mb-1 text-xs text-slate-500">الرقم الإضافي / الفرعي</label>
                       <input 
                         type="text" 
                         maxLength={4}
                         value={editingClient?.nationalAddress?.additionalNumber || ''}
                         onChange={e => setEditingClient({...editingClient, nationalAddress: {...(editingClient.nationalAddress || {}), additionalNumber: e.target.value.replace(/\D/g,'')}})}
                         className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                         placeholder="4 أرقام"
                         dir="ltr"
                       />
                     </div>
                  </div>
                )}
              </div>


            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <div className="flex gap-2">
                 <button 
                  onClick={() => handleSaveClient(true)}
                  className="px-6 py-2.5 bg-[#0072BC] hover:bg-sky-700 text-white rounded-xl text-sm font-black shadow-lg shadow-[#0072BC]/20 transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4"/> حفظ بيانات العميل
                </button>
                {editingClient?.mobile && (
                   <button 
                    onClick={() => window.open(getWhatsAppLink(editingClient.mobile!), '_blank')}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-black transition flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4"/> تواصل واتس
                  </button>
                )}
              </div>
              <button onClick={handleModalClose} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition">
                إغلاق للحين (حفظ كمسودة)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
