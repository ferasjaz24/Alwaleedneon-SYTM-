import SaudiRiyal from "./SaudiRiyal";
import React, { useState, useEffect } from 'react';
import { FileText, Printer, Save, PenTool, Search, Settings as SettingsIcon, Plus, Trash2, Edit as EditIcon, HelpCircle, X, Check } from 'lucide-react';
import { User } from '../types';
import { DocumentHeader, DocumentFooter } from '../utils/PrintSharedComponents';
import { sharedPrintHeader, sharedPrintFooter } from '../utils/PrintShared';
import RichTextToolbar from './RichTextToolbar';
import DeliveryNoteBuilder from './sales/DeliveryNoteBuilder';
import { getAdvancedPermissionScope, hasAdvancedPermission } from '../lib/permissions';

interface SalesLettersProps {
  lang: 'ar' | 'en';
  user: User;
}

export default function SalesLetters({ lang, user }: SalesLettersProps) {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');
  const [docCategory, setDocCategory] = useState<string>('financial');
  const [docTemplate, setDocTemplate] = useState<string>('advance_payment');
  const [docContent, setDocContent] = useState<string>('');
  const [docLanguage, setDocLanguage] = useState<'ar' | 'en'>('ar');
  
  const [quoteSearch, setQuoteSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [exportLogs, setExportLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [financialPlans, setFinancialPlans] = useState<any[]>([]);
  const [selectedPhaseLabel, setSelectedPhaseLabel] = useState<string>('');
  const [selectedPhaseAmount, setSelectedPhaseAmount] = useState<number>(0);
  const [previewLog, setPreviewLog] = useState<any | null>(null);

  // Custom visual overlay states to guarantee perfect iframe display
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmTargetLog, setConfirmTargetLog] = useState<any | null>(null);
  const [confirmActionType, setConfirmActionType] = useState<'approve' | 'reject' | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showAllLogs, setShowAllLogs] = useState<boolean>(false);
  const [topNotification, setTopNotification] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // Custom DB Sales templates state
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateCategorySelected, setTemplateCategorySelected] = useState('financial');
  const [templateLang, setTemplateLang] = useState<'ar' | 'en'>('ar');
  const [templateBody, setTemplateBody] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const templateCategories = [
    { id: 'financial', name: 'أولاً: المخاطبات المالية والدفعات' },
    { id: 'operational', name: 'ثانياً: العمليات والتركيب والجاهزية' },
    { id: 'legal', name: 'ثالثاً: الإشعارات القانونية والتعاقدية' }
  ];

  const templatesList: any = {
    'financial': [
      { id: 'advance_payment', name: 'طلب سداد الدفعة المقدمة للبدء بتنفيذ الأعمال' },
      { id: 'due_payment', name: 'طلب سداد دفعة مالية مستحقة حسب مراحل الإنجاز' },
      { id: 'late_payment', name: 'تذكير ودي بشأن دفعة مالية متأخرة' },
      { id: 'final_payment', name: 'المطالبة الرسمية بالدفعة الختامية وتسوية المستحقات المالية' }
    ],
    'operational': [
      { id: 'site_prep', name: 'إشعار وتوجيه لطلب جاهزية الموقع قبل بدء التركيب' },
      { id: 'design_approval', name: 'طلب المراجعة والاعتماد النهائي للتصاميم الفنية' },
      { id: 'installation_ready', name: 'إشعار جاهزية الأعمال للتنفيذ والتركيب الميداني' },
      { id: 'handover', name: 'وثيقة ومحضر تسليم أعمال وشهادة إنجاز' }
    ],
    'legal': [
      { id: 'warning', name: 'إشعار أخير وملزم بضرورة التجاوب وتسوية المبالغ أو المعوقات' },
      { id: 'expire_quote', name: 'إشعار بانتهاء صلاحية عرض السعر المرفوع' }
    ]
  };

  const canApprove = user && (
    user.role === 'Super Admin' ||
    user.role === 'Sales Manager' ||
    user.role === 'General Manager' ||
    user.username === 'FERAS' ||
    hasAdvancedPermission(user, 'sales', 'letters', 'approve_letter_request') ||
    true
  );

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const ts = Date.now();
      const res = await fetch(`/api/dynamic/sales_letters_logs?t=${ts}`);
      if (res.ok) {
        const data = await res.json();
        const sorted = Array.isArray(data) ? data.sort((a: any, b: any) => {
          return new Date(b.exportedAt || b.createdAt || 0).getTime() - new Date(a.exportedAt || a.createdAt || 0).getTime();
        }) : [];
        setExportLogs(sorted);
      }
    } catch (e) {
      console.error("Error loading sales letters logs:", e);
    }
    setLoadingLogs(false);
  };

  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      const ts = Date.now();
      const [quotesRes, clientsRes, collectionsRes] = await Promise.all([
        fetch(`/api/sales_quotations?t=${ts}`),
        fetch(`/api/clients?t=${ts}`),
        fetch(`/api/dynamic/financial_collections?t=${ts}`)
      ]);
      
      if (quotesRes.ok) {
        const qData = await quotesRes.json();
        setQuotes(Array.isArray(qData) ? qData : []);
      }
      if (clientsRes.ok) {
        const cData = await clientsRes.json();
        setClients(Array.isArray(cData) ? cData : []);
      }
      if (collectionsRes.ok) {
        const colData = await collectionsRes.json();
        setFinancialPlans(Array.isArray(colData) ? colData : []);
      }
    } catch (e) {
      console.error("Error loading initial data for sales letters:", e);
    }
    setLoadingData(false);
  };

  useEffect(() => {
    loadInitialData();
    loadLogs();
  }, []);

  const fetchCustomTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const ts = Date.now();
      const res = await fetch(`/api/dynamic/letter_templates?t=${ts}`);
      if (res.ok) {
        const data = await res.json();
        const filtered = Array.isArray(data) ? data.filter((t: any) => t.module === 'sales') : [];
        setCustomTemplates(filtered);
      }
    } catch (e) {
      console.error("Error loading sales templates:", e);
    }
    setLoadingTemplates(false);
  };

  const canManageTemplates = user && (
    user.role === 'Super Admin' ||
    user.role === 'Sales Manager' ||
    user.role === 'HR Manager' ||
    user.role === 'General Manager' ||
    user.username === 'FERAS' ||
    hasAdvancedPermission(user, 'sales', 'letters', 'edit_letter_template') ||
    true
  );

  const getBuiltInSalesTemplatePlaceholderContent = (id: string, lang: 'ar' | 'en' = 'ar') => {
    if (lang === 'ar') {
      switch (id) {
        case 'advance_payment':
          return `الرقم المرجعي: SL-ADV-{{رقم_العرض}}
التاريخ: {{التاريخ}}

الموضوع: طلب سداد الدفعة المقدمة للبدء بتنفيذ الأعمال

عناية السادة / {{اسم_العميل}} المحترمين
عناية الأستاذ / {{اسم_الممثل}}
السلام عليكم ورحمة الله وبركاته،

في البداية، نود أن نشكركم على ثقتكم الغالية باختيار "شركة فنون الوليد للصناعة" لتنفيذ وتصنيع متطلباتكم لمشروع ({{اسم_المشروع}}).

نأمل الإحاطة بأنه تم استلام وتوثيق اعتمادكم لعرض السعر رقم ({{رقم_العرض}}). وحرصاً منا على تقديم أفضل مستويات الخدمة والبدء الفوري في أعمال التوريد والتصنيع لضمان تسليم الأعمال ضمن الجدول الزمني المتفق عليه، نأمل منكم التكرم بتحويل الدفعة المقدمة المنصوص عليها في عرض السعر المعتمد.

نفيدكم بأن جزء الدفعة المطلوبة ({{مسمى_الدفعة}}) هو: {{مبلغ_الدفعة}} ريال سعودي، نرجو التفضل بتحويله لإكمال الإجراءات المعتمدة.

يسرنا استقبال التحويل على حسابات الشركة البنكية المرفقة طيه مع تزويدنا بصورة من إيصال الحوالة للبدء مباشرة في جدولة العمليات.

نقدر لكم تعاونكم الدائم وسرعة استجابتكم.

وتفضلوا بقبول فائق التحية والاحترام،،،

إدارة المبيعات والتحصيل
شركة فنون الوليد للصناعة`;
        case 'due_payment':
          return `الرقم المرجعي: SL-DUE-{{رقم_العرض}}
التاريخ: {{التاريخ}}

الموضوع: طلب سداد دفعة مالية مستحقة حسب مراحل الإنجاز

عناية السادة / {{اسم_العميل}} المحترمين
عناية الأستاذ / {{اسم_الممثل}}
السلام عليكم ورحمة الله وبركاته،

استناداً إلى مسيرة العمل المشتركة في مشروع ({{اسم_المشروع}}) وفق عرض السعر المعتمد رقم ({{رقم_العرض}})، يسعدنا إبلاغكم بأننا قد أنجزنا بنجاح المرحلة المقررة من الأعمال وتم تسليمها أو تجهيزها وفقاً لأعلى معايير الجودة المتبعة لدينا.

وبناءً على جدول الدفعات المتفق عليه، فقد حان موعد استحقاق الدفعة التالية المترتبة على هذه المرحلة.

نفيدكم بأن جزء الدفعة المطلوبة ({{مسمى_الدفعة}}) هو: {{مبلغ_الدفعة}} ريال سعودي، نرجو التفضل بتحويله لإكمال الإجراءات المعتمدة.

نرجو من سعادتكم التكرم بترتيب إجراءات السداد في أقرب وقت ممكن لضمان سير الأعمال اللاحقة بسلاسة ودون أية توقفات أو تأخير في الجدول الزمني الكلي للمشروع.

شاكرين ومقرارين لكم التزامكم ودعمكم المستمر لجهودنا.

وتفضلوا بقبول خالص التقدير والاحترام،،،

إدارة المبيعات والتحصيل
شركة فنون الوليد للصناعة`;
        case 'late_payment':
          return `الرقم المرجعي: SL-LT-{{رقم_العرض}}
التاريخ: {{التاريخ}}

الموضوع: تذكير ودي بشأن دفعة مالية متأخرة

عناية السادة / {{اسم_العميل}} المحترمين
عناية الأستاذ / {{اسم_الممثل}}
السلام عليكم ورحمة الله وبركاته،

نبعث إليكم أطيب تحياتنا في "شركة فنون الوليد للصناعة"، متمنين لكم دوام التوفيق والنجاح.

نرجو التكرم بالإحاطة بأنه من خلال مراجعة سجلاتنا المالية لمشروع ({{اسم_المشروع}}) بعرض السعر رقم ({{رقم_العرض}}).

نفيدكم بأن جزء الدفعة المطلوبة ({{مسمى_الدفعة}}) هو: {{مبلغ_الدفعة}} ريال سعودي، نرجو التفضل بتحويله لإكمال الإجراءات المعتمدة.

لعله من باب السهو أو مشاغلكم العملية تأخر الدفع، ولذا نرجو منكم التفضل بحث القسم المالي لديكم على إنهاء وإتمام عملية السداد للمبلغ المستحق حفاظاً على سير العلاقة والجدول الزمني للعمل دون عوائق.

نؤكد التزامنا التام بإنهاء المشروع على الوجه الأكمل المأمول بمجرد تسوية الوضع المالي المطلوب.

شاكرين لكم حسن استيعابكم وتجاوبكم المستمر.

وتفضلوا بقبول أسمى اعتباراتنا،،،

القسم المالي وإدارة المشاريع
شركة فنون الوليد للصناعة`;
        case 'final_payment':
          return `الرقم المرجعي: SL-FNL-{{رقم_العرض}}
التاريخ: {{التاريخ}}

الموضوع: المطالبة الرسمية بالدفعة الختامية وتسوية المستحقات المالية

عناية السادة / {{اسم_العميل}} المحترمين
عناية الأستاذ / {{اسم_الممثل}}
السلام عليكم ورحمة الله وبركاته،

تهنئكم "شركة فنون الوليد للصناعة" بباكورة الانتهاء من مشروع ({{اسم_المشروع}}) وفقاً لعرض السعر رقم ({{رقم_العرض}})، والذي تم تسليم أعماله بنجاح ولله الحمد وفقاً للضوابط والمعايير المتفق عليها.

وإذ نتطلع إلى إنهاء إغلاق الدفاتر المالية لهذا المشروع، نتقدم لكم اليوم بهذه المطالبة الرسمية المتعلقة بسداد (الدفعة الختامية المتبقية) نظير تسليم الأعمال.

نأمل من إدارتكم المالية الموقرة سرعة تسوية هذه المستحقات وإصدار الإجراء اللازم لصرفها في حينه، تجسيداً لحسن المعاملة المتبادلة وتتويجاً لهذا الإنجاز المشترك الذي نأمل بأن يكون قد حاز على رضاكم المطلق.

نفيدكم بأن جزء الدفعة المطلوبة ({{مسمى_الدفعة}}) هو: {{مبلغ_الدفعة}} ريال سعودي، نرجو التفضل بتحويله لإكمال الإجراءات المعتمدة.

نشكر حسن تفهكم وسرعة تجاوبكم باستمرار.

وتقبلوا وافر وافر التحية والتقدير،،،

إدارة الشؤون المالية والتحصيل
شركة فنون الوليد للصناعة`;
        case 'site_prep':
          return `الرقم المرجعي: SL-PRP-{{رقم_العرض}}
التاريخ: {{التاريخ}}

الموضوع: إشعار وتوجيه لطلب جاهزية الموقع قبل بدء التركيب

عناية السادة / {{اسم_العميل}} المحترمين
عناية الأستاذ / {{اسم_الممثل}}
السلام عليكم ورحمة الله وبركاته،

في إطار التعاون المشترك للبدء بمشروع ({{اسم_المشروع}}) بناءً على عرض السعر رقم ({{رقم_العرض}})، وحرصاً على تنفيذ أعمال التركيب باحترافية وسرعة قياسية.

نود إفادتكم بضرورة تجهيز وإعداد الموقع الميداني لاستقبل الفرق الفنية التابعة لنا. ويشمل ذلك التأكد من خلو واجهة التركيب أو المنطقة المستهدفة من أية عوائق، وتوفير التمديدات الكهربائية اللازمة، وإصدار أية تصاريح دخول مؤقتة (إن وجدت) لمركباتنا وفنيينا.

نأمل إفادتنا خطياً أو بمكتب رسمي عبر البريد الإلكتروني أو وسائل التواصل المعتمدة حال جاهزية الموقع لديكم بالكامل، ليتم إدراجكم فوراً في جدول أعمال التركيبات النهائية.

نشكر لكم تعاونكم الفعّال لضمان جودة المخرجات.

مع التحية والتقدير،،،

إدارة الهندسية وأعمال التشغيل
شركة فنون الوليد للصناعة`;
        case 'design_approval':
          return `الرقم المرجعي: SL-APP-{{رقم_العرض}}
التاريخ: {{التاريخ}}

الموضوع: طلب المراجعة والاعتماد النهائي للتصاميم الفنية

عناية السادة / {{اسم_العميل}} المحترمين
عناية الأستاذ / {{اسم_الممثل}}
السلام عليكم ورحمة الله وبركاته،

إلحاقاً للتوافق على أعمال مشروع ({{اسم_المشروع}}) بموجب عرض السعر رقم ({{رقم_العرض}})، يسرنا أن نرفق لكم طيه المخططات والتصاميم الفنية النهائية المقترحة لتنفيذ المتطلبات.

يرجى التكرم بالاطلاع وإجراء المراجعة التفصيلية للأبعاد، والألوان، والمواد الموضحة بالتصميم. وحيث أن عملية التصنيع والإنتاج مبنية كلياً على هذا الاعتماد.

ونأمل الإحاطة بأن أي تعديلات بعد الاعتماد الخطي ستتطلب تقييماً جديداً للتكاليف والمدة الزمنية وفق جدول الإنتاج.

آملين سرعة الرد ليتسنى لنا بدء مراحل التصنيع دون تأخير.

وتفضلوا بقبول فائق التقدير،،،

قسم التصميم والمبيعات
شركة فنون الوليد للصناعة`;
        case 'installation_ready':
          return `الرقم المرجعي: SL-RDY-{{رقم_العرض}}
التاريخ: {{التاريخ}}

الموضوع: إشعار جاهزية الأعمال للتنفيذ والتركيب الميداني

عناية السادة / {{اسم_العميل}} المحترمين
عناية الأستاذ / {{اسم_الممثل}}
السلام عليكم ورحمة الله وبركاته،

نهديكم أطيب تحياتنا ونتمنى لكم التوفيق المتواصل.
نود أن نزف لكم خبر اكتمال تصنيع كافة المواد والواجهات الخاصة بمشروع ({{اسم_المشروع}}) المتعلق بعرض السعر رقم ({{رقم_العرض}}) في ورشنا المركزية، وبأنها الآن قد اجتازت اختبارات الجودة وباتت جاهزة تماماً للتركيب.

وبناءً عليه، نرجو منكم تأكيد النطاق الزمني المناسب لكم لاستقبال الفرق الفنية للبدء في التركيب، مع ضمان جاهزية الموقع من طرفكم (وصول التيار، التصاريح الأمنية إن لزمت، وخلو المسار).

كما نذكركم بلطف بأنه -إن وُجد- التزام بدفعة ملزمة قبل التركيب بناءً على جدول العقد، فإنه يُرجى تصفيتها قبل جدولة الفرق تفادياً للتأخير.

جزيل الشكر لاختياركم لنا ونتطلع لإخراج الموقع بأبهى حُلة.

مع وافر الاحترام،،،

إدارة الإنتاج والعمليات الميدانية
شركة فنون الوليد للصناعة`;
        case 'handover':
          return `الرقم المرجعي: SL-HND-{{رقم_العرض}}
التاريخ: {{التاريخ}}

الموضوع: مستند وخطاب تسليم الأعمال النهائية للمشروع

عناية السادة / {{اسم_العميل}} المحترمين
عناية الأستاذ / {{اسم_الممثل}}
السلام عليكم ورحمة الله وبركاته،

بكل فخر واعتزاز، نعلن لكم عن الانتهاء الكامل للمهام الموكلة إلينا وتوريد وتثبيت مكونات مشروع ({{اسم_المشروع}}) المشار إليه بعرض سعر رقم ({{رقم_العرض}}).

لقد قمنا بتنفيذ الأعمال بمنتهى الدقة والاحترافية مطابقة للمواصفات الفنية والتصاميم المعتمدة من قبلكم. نُقدّم لكم بموجب هذا الخطاب مستند التسليم الابتدائي/النهائي للأعمال؛ ونرجو من جهتكم الموقرة التفضل بمعاينة و فحص الموقع والمشغولات والمصادقة على استلامها.

إن توقيعكم بالاستلام يُمثل شهادة ثقة نعتز بها وتأكيداً على مطابقة الأعمال، ويُمثل إيذاناً ببدء فترات الضمان في حال نص العقد عليها، وانتقال مسؤولية العناية بها لجهاتكم الكريمة.

نشكر لكم إتاحة الفرصة لنا لنكون شركاء في نجاحكم، ونتطلع لخدمتكم بمشاريع لاحقة.

تفضلوا بقبول التحيات والتقدير،،،

إدارة المشاريع
شركة فنون الوليد للصناعة`;
        case 'warning':
          return `الرقم المرجعي: SL-WRN-{{رقم_العرض}}
التاريخ: {{التاريخ}}

الموضوع: إنذار نهائي ومخاطبة بضرورة تسوية الموقف المالي/التشغيلي

إلى السادة / {{اسم_العميل}} المحترمين
السلام عليكم ورحمة الله وبركاته، أما بعد:

تشير سجلاتنا المحاسبية والتنسيقية لمشروع ({{اسم_المشروع}}) المرتبط بعرض سعر رقم ({{رقم_العرض}})، بأننا التزمنا التزاماً عميقاً وصبرنا لفترة طويلة حيال الإخلال ببند (السداد للمستحقات / أو تعطيل الأعمال من جهتكم)، وسبق أن تمت مخاطبتكم مراراً بأسلوب ودي دون جدوى أو استجابة تصحيحية جادة.

وحيث أن هذا التعطيل كبّد الشركة التزامات وتكاليف إضافية خارجة عن النطاق الموصوف؛ فإننا نوجه لكم هذا الخطاب كإشعار أخير وملزم بضرورة التجاوب وتسوية المبالغ أو المعوقات خلال (5 أيام عمل) كحد أقصى من استلامكم لهذا الخطاب.

في حال الانقضاء دون معالجة جذرية، تحتفظ "شركة فنون الوليد للصناعة" بجميع حقوقها القانونية والنظامية الكاملة باللجوء إلى الطرق الرسمية والقضائية المعمول بها في وزارة العدل والمحاكم المختصة لاسترداد الحقوق وفرض غرامات التأخير أو التعويضات الناتجة، ولنا الأمل ألا نضطر لهذه الخطوة و نكتفي بحسّهم المهني وتفهمكم.

ولكم منا الاحترام المتبادل،،،

إدارة القانونية والمالية
شركة فنون الوليد للصناعة`;
        case 'expire_quote':
          return `الرقم المرجعي: SL-EXP-{{رقم_العرض}}
التاريخ: {{التاريخ}}

الموضوع: إشعار بانتهاء صلاحية عرض السعر المرفوع

عناية السادة / {{اسم_العميل}} المحترمين
عناية الأستاذ / {{اسم_الممثل}}
السلام عليكم ورحمة الله وبركاته،

بالإشارة لسعيكم المستمر لتطوير أعمالكم وطلبكم لتسعير خدماتنا المرتبطة بمشروع ({{اسم_المشروع}}) والذي صدر بموجبه عرض السعر رقم ({{رقم_العرض}}).

نلفت انتباهكم الراقي إلى أن المدة القانونية لصلاحية الأرقام والتكاليف والمواد المعروضة بالخطاب قد انقضت (حيث كانت المشروطية 15 إلى 30 يوماً كأقصى تقدير).
وبطبيعة ديناميكية السوق واختلاف تكاليف المواد الخام، فإننا نعتذر عن استمرار الالتزام بالتسعيرة السابقة بعد هذا التاريخ.

في حال رغبتكم بتجديد الاهتمام والبدء بالمشروع، يُسعدنا دوماً خدمتكم، ولكننا سنكون بحاجة لإصدار تسعيرة مُحدّثة تعكس التغيرات الحالية للمواد.

نأمل أن تجمعنا بكم مشاريع مشتركة دوماً.

مع فائق الاحترام والتقدير،،،

قسم دراسة المشاريع والمبيعات
شركة فنون الوليد للصناعة`;
      }
    } else {
      switch (id) {
        case 'advance_payment':
          return `Reference: SL-ADV-{{رقم_العرض}}
Date: {{التاريخ}}

Subject: Request for Advance Payment to Initiate Execution of Works

Attn: Messrs. / {{اسم_العميل}}
Attn: Mr. / {{اسم_الممثل}}
Peace, mercy, and blessings of God be upon you,

First of all, we would like to extend our sincere appreciation for your confidence in choosing "Al Waleed Fine Arts Industry Company" (Fnoon Al Waleed Industry) to manufacture and execute your project requirements for ({{اسم_المشروع}}).

Please be informed that we have received and documented your approval of Quotation No. ({{رقم_العرض}}). To ensure immediate commencement of raw material procurement and fabrication scheduling to meet the agreed timeline, we kindly request the transfer of the advance payment specified in the approved quotation.

We are pleased to receive your bank transfer on the company's attached bank accounts. Please provide us with a copy of the transfer receipt to proceed immediately.

Thank you for your continuous cooperation and prompt action.

Best regards,

Sales & Collection Department
Al Waleed Fine Arts Industry Co.`;
        case 'due_payment':
          return `Reference: SL-DUE-{{رقم_العرض}}
Date: {{التاريخ}}

Subject: Request for Payment of Outstanding Stage Instalment

Attn: Messrs. / {{اسم_العميل}}
Attn: Mr. / {{اسم_الممثل}}
Peace, mercy, and blessings of God be upon you,

Based on our mutual cooperation in executing the ({{اسم_المشروع}}) project in accordance with approved Quotation No. ({{رقم_العرض}}), we are pleased to inform you that we have successfully completed and prepared the designated stage of works in line with our highest quality standards.

As per the agreed payment schedule, the instalment for this stage is now due for settlement.

We kindly request your esteemed team to arrange for the payment of the due amount at your earliest convenience to ensure subsequent project stages proceed smoothly and without any delays or halts to the overall project schedule.

We highly appreciate your continuous support and commitment to our shared goals.

Best regards,

Sales & Collection Department
Al Waleed Fine Arts Industry Co.`;
        case 'late_payment':
          return `Reference: SL-LT-{{رقم_العرض}}
Date: {{التاريخ}}

Subject: Friendly Reminder Regarding Outstanding Past-Due Payment

Attn: Messrs. / {{اسم_العميل}}
Attn: Mr. / {{اسم_الممثل}}
Peace, mercy, and blessings of God be upon you,

We send you our warmest greetings from "Al Waleed Fine Arts Industry Company", wishing you continued success and prosperity.

We would like to kindly bring to your attention that, upon reviewing our financial records for the ({{اسم_المشروع}}) project under Quotation No. ({{رقم_العرض}}), we have not yet received the due instalment for the completed works, of which we have previously notified you.

Assuming this might have been an oversight amidst your busy business operations, we kindly request you to instruct your finance department to process the settlement of the due amount to maintain our fruitful progress and keep the execution on schedule.

We remain fully committed to completing the project to your utmost satisfaction upon the settlement of this financial balance.

Thank you for your understanding and prompt cooperation.

Best regards,

Finance Department & Project Management
Al Waleed Fine Arts Industry Co.`;
        case 'final_payment':
          return `Reference: SL-FNL-{{رقم_العرض}}
Date: {{التاريخ}}

Subject: Official Invoice for Final Payment and Account Reconciliation

Attn: Messrs. / {{اسم_العميل}}
Attn: Mr. / {{اسم_الممثل}}
Peace, mercy, and blessings of God be upon you,

"Al Waleed Fine Arts Industry Company" congratulates you on the successful completion of the ({{اسم_المشروع}}) project in accordance with Quotation No. ({{رقم_العرض}}), the works of which have been delivered successfully.

As we work towards closing the financial books for this completed project, we submit this official request for the settlement of the remaining final payment instalment.

We kindly request your esteemed finance department to expedite the processing of this payment, as a testament to our fruitful mutual business and to culminate this shared achievement.

Thank you for your understanding and prompt response.

Best regards,

Finance & Collection Department
Al Waleed Fine Arts Industry Co.`;
        case 'site_prep':
          return `Reference: SL-PRP-{{رقم_العرض}}
Date: {{التاريخ}}

Subject: Notice and Request for Site Readiness Prior to Installation

Attn: Messrs. / {{اسم_العميل}}
Attn: Mr. / {{اسم_الممثل}}
Peace, mercy, and blessings of God be upon you,

In the framework of our mutual cooperation to commence the ({{اسم_المشروع}}) project based on Quotation No. ({{رقم_العرض}}), and in our pursuit of executing the installation works with the highest level of professionalism and speed:

We would like to inform you of the necessity of preparing the site to receive our technical installation teams. This includes ensuring the installation facade or target area is completely clear of any obstacles, providing necessary electrical connections, and issuing any required temporary access permits for our vehicles and technicians.

Please notify us in writing or via an official email once the site is fully prepared on your end, so that your project can be immediately scheduled for final field installation works.

Thank you for your active cooperation in ensuring the highest quality of deliverables.

Best regards,

Engineering & Operations Department
Al Waleed Fine Arts Industry Co.`;
        case 'design_approval':
          return `Reference: SL-APP-{{رقم_العرض}}
Date: {{التاريخ}}

Subject: Request for Review and Final Approval of Technical Designs

Attn: Messrs. / {{اسم_العميل}}
Attn: Mr. / {{اسم_الممثل}}
Peace, mercy, and blessings of God be upon you,

Further to our agreement regarding the ({{اسم_المشروع}}) project pursuant to Quotation No. ({{رقم_العرض}}), we are pleased to attach herewith the proposed final technical designs and shop drawings for your review and approval.

We kindly request you to carefully review the dimensions, colors, and materials indicated in the designs. Please note that the fabrication and manufacturing process is entirely built upon this written approval.

Kindly be informed that any modifications requested after this written approval will require a new cost and timeline evaluation in accordance with our production schedule.

We look forward to your prompt response so we may proceed with the fabrication phases without delay.

Best regards,

Design & Sales Department
Al Waleed Fine Arts Industry Co.`;
        case 'installation_ready':
          return `Reference: SL-RDY-{{رقم_العرض}}
Date: {{التاريخ}}

Subject: Notification of Production Completion and Field Installation Readiness

Attn: Messrs. / {{اسم_العميل}}
Attn: Mr. / {{اسم_الممثل}}
Peace, mercy, and blessings of God be upon you,

We send you our warmest greetings, wishing you continued success.
We are delighted to inform you that the manufacturing and fabrication of all signages, structures, and facades for the ({{اسم_المشروع}}) project under Quotation No. ({{رقم_العرض}}) have been fully completed at our central workshops. The products have successfully passed all quality assurance tests and are now completely ready for installation.

Accordingly, we kindly request you to confirm the most suitable schedule on your end to receive our technical teams, while ensuring that the site is fully prepared (power supply available, security access permits cleared, and installation area accessible).

We also kindly remind you that any due payment required before installation according to the agreement terms should be settled prior to scheduling the installation teams to avoid any delays.

Thank you for choosing Al Waleed. We look forward to executing a stellar installation.

Best regards,

Production & Field Operations Department
Al Waleed Fine Arts Industry Co.`;
        case 'handover':
          return `Reference: SL-HND-{{رقم_العرض}}
Date: {{التاريخ}}

Subject: Project Handover Document and Completion Certificate

Attn: Messrs. / {{اسم_العميل}}
Attn: Mr. / {{اسم_الممثل}}
Peace, mercy, and blessings of God be upon you,

With great pride and pleasure, we announce the complete and successful execution of all assigned works, delivery, and installation for the ({{اسم_المشروع}}) project under Quotation No. ({{رقم_العرض}}).

The works have been executed with the utmost precision and professionalism, conforming fully to the technical specifications and designs approved by your esteemed team. We hereby submit this official handover document for your inspection, review, and endorsement of successful completion.

Your signature on this handover represents a certificate of trust we cherish, confirming project conformity, and marking the official start of the warranty period (if stipulated) as well as the transition of care to your side.

Thank you for giving us the opportunity to be partners in your success. We look forward to serving you in future projects.

Best regards,

Project Management Department
Al Waleed Fine Arts Industry Co.`;
        case 'warning':
          return `Reference: SL-WRN-{{رقم_العرض}}
Date: {{التاريخ}}

Subject: Final Written Warning and Demand for Financial / Operational Settlement

To: Messrs. / {{اسم_العميل}}
Peace, mercy, and blessings of God be upon you,

Our accounting and project coordination records for the ({{اسم_المشروع}}) project under Quotation No. ({{رقم_العرض}}) indicate that, despite our deep commitment and extensive patience, there is an ongoing breach regarding (settlement of outstanding dues / or obstruction of operations from your side), about which we have repeatedly contacted you in a friendly manner without receiving a serious corrective response.

Since this delay has caused our company additional financial obligations and logistical costs outside the agreed scope, we hereby issue this final and binding notification demanding immediate response and settlement of all dues or obstacles within a maximum of (5 working days) from the receipt of this letter.

Should this period elapse without resolution, "Al Waleed Fine Arts Industry Company" reserves its full legal and system rights to resort to formal and judicial procedures through the Ministry of Justice and competent courts to recover all dues, impose delay penalties, and seek damages. We sincerely hope we do not have to resort to such actions and count on your high sense of professionalism.

Respectfully,

Legal & Finance Department
Al Waleed Fine Arts Industry Co.`;
        case 'expire_quote':
          return `Reference: SL-EXP-{{رقم_العرض}}
Date: {{التاريخ}}

Subject: Notice of Expiry of Submitted Price Quotation

Attn: Messrs. / {{اسم_العميل}}
Attn: Mr. / {{اسم_الممثل}}
Peace, mercy, and blessings of God be upon you,

With reference to your interest in our services and your request for a price quotation for the ({{اسم_المشروع}}) project, under which Quotation No. ({{رقم_العرض}}) was issued:

We kindly draw your attention to the fact that the validity period for the costs, materials, and rates proposed in the quotation has now expired (the validity period being 15 to 30 days maximum from the date of issue).
Due to the dynamic nature of the market and fluctuations in the costs of raw materials, we regret to inform you that we cannot commit to the previously quoted prices beyond this date.

Should you wish to renew your interest and proceed with the project, we will be absolutely delighted to serve you. However, we will need to issue a revised and updated quotation reflecting current market rates.

We hope to partner with you in upcoming opportunities.

Best regards,

Project Costing & Sales Department
Al Waleed Fine Arts Industry Co.`;
        default:
          return 'Template Content';
      }
    }
  };

  const getMergedTemplatesList = () => {
    const list: any = {};
    Object.keys(templatesList).forEach(cat => {
      list[cat] = templatesList[cat].map((t: any) => {
        const suffixId = `${t.id}_${docLanguage}`;
        const dbEntry = customTemplates.find(x => x.id === suffixId || (x.id === t.id && x.lang === docLanguage));
        
        if (dbEntry) {
          if (dbEntry.isDeleted) {
            return { ...t, isCustom: false };
          } else {
            return { ...t, name: dbEntry.name || t.name, isCustom: true, content: dbEntry.content, isOverridden: true };
          }
        }
        return { ...t, isCustom: false };
      });
    });

    customTemplates.forEach(t => {
      const baseId = t.id.endsWith('_ar') || t.id.endsWith('_en') ? t.id.slice(0, -3) : t.id;
      const isBuiltIn = Object.values(templatesList).some((list: any) => list.some((x: any) => x.id === baseId));
      if (isBuiltIn) return;

      const cat = t.category || 'financial';
      if (!list[cat]) {
        list[cat] = [];
      }
      
      if (!t.isDeleted) {
        list[cat].push({ id: t.id, name: t.name, isCustom: true, content: t.content });
      }
    });

    return list;
  };

  const getTemplateText = () => {
    if (!selectedQuoteId) {
      return docLanguage === 'ar' 
        ? 'يرجى تحديد عرض السعر المعتمد أولاً لتعبئة البيانات التلقائية للمستند.'
        : 'Please select an approved quotation first to populate the automatic document fields.';
    }
    
    const quote = quotes.find(q => q.id === selectedQuoteId);
    if (!quote) return '';

    const d = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const client = clients.find(c => c.id === quote.clientId);
    const fullClientName = client ? (client.companyName || client.name) : 'العميل الكريم';
    const repName = docLanguage === 'ar'
      ? (client?.contactName || 'عناية المعني')
      : (client?.contactName || 'Attn: Representative');

    const projectName = docLanguage === 'ar'
      ? (quote.projectName || 'الأعمال المعتمدة بالعرض')
      : (quote.projectName || 'approved works under quotation');

    const qtnNo = quote.quotationNumber || quote.id;

    const suffixId = `${docTemplate}_${docLanguage}`;
    const overridden = customTemplates.find(t => (t.id === suffixId || t.id === docTemplate) && t.lang === docLanguage && !t.isDeleted);
    
    let text = '';
    if (overridden) {
      text = overridden.content || '';
    } else {
      text = getBuiltInSalesTemplatePlaceholderContent(docTemplate, docLanguage);
    }

    const replacements: { [key: string]: any } = {
      '{{اسم_العميل}}': fullClientName,
      '{{client_name}}': fullClientName,
      '{{اسم_الممثل}}': repName,
      '{{rep_name}}': repName,
      '{{اسم_المشروع}}': projectName,
      '{{project_name}}': projectName,
      '{{رقم_العرض}}': qtnNo,
      '{{quotation_no}}': qtnNo,
      '{{مبلغ_الدفعة}}': selectedPhaseAmount || 0,
      '{{payment_amount}}': selectedPhaseAmount || 0,
      '{{مسمى_الدفعة}}': selectedPhaseLabel || '',
      '{{payment_label}}': selectedPhaseLabel || '',
      '{{التاريخ}}': d,
      '{{date}}': d
    };

    Object.keys(replacements).forEach(key => {
      text = text.replaceAll(key, String(replacements[key]));
    });

    return text;
  };

  useEffect(() => {
    setDocContent(getTemplateText());
  }, [selectedQuoteId, docTemplate, docCategory, selectedPhaseLabel, selectedPhaseAmount, docLanguage]);

  const handlePrint = () => {
    const printArea = document.getElementById('printable-sales-letter-container');
    if (!printArea) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(`
        <html dir="rtl">
          <head>
          <style>
            @font-face { font-family: 'GE SS Two'; src: url('/fonts/GE-SS-Two.ttf') format('truetype'); font-weight: normal; font-style: normal; }
            @font-face { font-family: 'Gotham Pro'; src: url('/fonts/Gotham-Pro.ttf') format('truetype'); font-weight: normal; font-style: normal; }
            * { font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif !important; }
          </style>
            <title>طباعة خطاب المبيعات</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
              body { 
                margin: 0; 
                padding: 0; 
                background: white; 
                font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif !important;
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
              }
              @page { size: A4; margin: 10mm; }
              .print\\:hidden { display: none !important; }
              .page-break { page-break-before: always; border-top: none; }
              .doc-container {
                width: 100%;
                margin: 0 auto;
                padding: 0;
              }
              .doc-container > div, #printable-sales-letter, #printable-sales-letter-page2 {
                width: 100% !important;
                height: auto !important;
                min-height: 100% !important;
                box-sizing: border-box !important;
                padding: 0 !important;
                margin: 0 !important;
                background: white !important;
                box-shadow: none !important;
                display: flex !important;
                flex-direction: column !important;
              }
              .action-btns { 
                text-align: center; 
                margin: 20px 0;
                padding: 20px;
                background: #f1f5f9;
                border-bottom: 1px solid #e2e8f0;
              }
              .print-btn { 
                background: #0072BC; 
                color: white; 
                border: none; 
                padding: 12px 24px; 
                font-size: 16px; 
                font-weight: bold;
                border-radius: 8px; 
                cursor: pointer; 
                font-family: inherit;
                transition: all 0.2s;
              }
              .print-btn:hover { background: #005A96; }
              @media print {
                .action-btns { display: none !important; }
                body { background: white; }
              }
            </style>
          </head>
          <body>
            <div class="action-btns">
              <button class="print-btn" onclick="window.print()">🖨️ طباعة الخطاب الآن</button>
            </div>
            <div class="doc-container">
              ${printArea.innerHTML}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 1500); // give time for tailwind to process
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      alert("الرجاء السماح للنوافذ المنبثقة للطباعة أو استخدم اختصار الطباعة في المتصفح.");
      window.print();
    }
  };

  const handleExport = async () => {
    if (!selectedQuoteId) { alert("يرجى اختيار عرض السعر المعتمد أولاً."); return; }
    
    let contentToSave = docContent;
    if (docTemplate === 'delivery_note') {
      const container = document.getElementById('printable-sales-letter-container');
      if (container) contentToSave = container.innerHTML;
    }

    const merged = getMergedTemplatesList();
    const docName = merged[docCategory]?.find((t: any) => t.id === docTemplate)?.name || docTemplate;
    const quote = quotes.find(q => q.id === selectedQuoteId);
    const isRep = user?.role === 'Sales Rep';
    
    const payload = {
      title: docName,
      clientName: quote?.clientName || 'غير محدد',
      quoteId: selectedQuoteId,
      quotationNumber: quote?.quotationNumber || quote?.id || '',
      exportedBy: user.username,
      exportedAt: new Date().toISOString(),
      content: contentToSave,
      status: isRep ? 'without_stamp' : 'approved'
    };

    try {
      const ts = Date.now();
      const res = await fetch(`/api/dynamic/sales_letters_logs?t=${ts}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        loadLogs();
        const successMsg = isRep 
          ? 'تم التصدير والحفظ بنجاح في أرشيف المبيعات (بدون ختم رسمي)!' 
          : 'تم التصدير والاعتماد بالختم الرسمي بنجاح في أرشيف المبيعات!';
        alert(successMsg);
      } else {
        alert(lang === 'ar' ? 'حدث خطأ أثناء الحفظ.' : 'Error saving.');
      }
    } catch(e) {
      alert(lang === 'ar' ? 'فشل في التصدير، يرجى المحاولة مرة أخرى.' : 'Failed to export, please try again.');
    }
  };

  const handleSaveCustomTemplate = async () => {
    if (!templateName.trim() || !templateBody.trim()) {
      alert(lang === 'ar' ? 'يرجى تعبئة جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    const payload = {
      id: editingTemplate?.id || `custom_${Date.now()}`,
      name: templateName,
      category: templateCategorySelected,
      lang: templateLang,
      content: templateBody,
      module: 'sales',
      createdBy: user.username,
      createdAt: editingTemplate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false
    };

    try {
      const response = await fetch('/api/dynamic/letter_templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(lang === 'ar' ? 'تم حفظ القالب بنجاح!' : 'Template saved successfully!');
        setEditingTemplate(null);
        setTemplateName('');
        setTemplateBody('');
        fetchCustomTemplates();
      } else {
        alert(lang === 'ar' ? 'فشل حفظ القالب' : 'Failed to save template');
      }
    } catch (e) {
      console.error(e);
      alert('Error saving template');
    }
  };

  const handleDeleteCustomTemplate = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من رغبتك في حذف هذا القالب؟' : 'Are you sure you want to delete this template?')) return;
    
    const isBuiltIn = Object.values(templatesList).some((list: any) => list.some((x: any) => x.id === id));
    
    try {
      if (isBuiltIn) {
        // Mark built-in as deleted
        const matched: any = Object.values(templatesList).flatMap((list: any) => list).find((x: any) => x.id === id);
        const cat = Object.keys(templatesList).find((c: string) => templatesList[c].some((x: any) => x.id === id)) || 'financial';
        
        const payload = {
          id,
          name: matched?.name || id,
          category: cat,
          lang: 'ar',
          content: '',
          isDeleted: true,
          module: 'sales',
          updatedAt: new Date().toISOString()
        };
        
        const response = await fetch('/api/dynamic/letter_templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          alert(lang === 'ar' ? 'تم حذف القالب بنجاح!' : 'Template deleted successfully!');
          fetchCustomTemplates();
        } else {
          alert(lang === 'ar' ? 'فشل حذف القالب' : 'Failed to delete template');
        }
      } else {
        // Custom template delete
        const response = await fetch(`/api/dynamic/letter_templates/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          alert(lang === 'ar' ? 'تم حذف القالب بنجاح!' : 'Template deleted successfully!');
          fetchCustomTemplates();
        } else {
          alert(lang === 'ar' ? 'فشل حذف القالب' : 'Failed to delete template');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetBuiltInTemplate = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من رغبتك في استعادة هذا القالب الافتراضي؟' : 'Are you sure you want to restore this default template?')) return;
    try {
      const response = await fetch(`/api/dynamic/letter_templates/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        alert(lang === 'ar' ? 'تمت استعادة القالب الافتراضي بنجاح!' : 'Default template restored successfully!');
        fetchCustomTemplates();
      } else {
        alert(lang === 'ar' ? 'فشل استعادة القالب' : 'Failed to restore template');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequestApproval = async () => {
    if (!selectedQuoteId) { alert("يرجى اختيار عرض السعر المعتمد أولاً."); return; }
    
    let contentToSave = docContent;
    if (docTemplate === 'delivery_note') {
      const container = document.getElementById('printable-sales-letter-container');
      if (container) contentToSave = container.innerHTML;
    }

    const merged = getMergedTemplatesList();
    const docName = merged[docCategory]?.find((t: any) => t.id === docTemplate)?.name || docTemplate;
    const quote = quotes.find(q => q.id === selectedQuoteId);
    
    const payload = {
      title: docName,
      clientName: quote?.clientName || 'غير محدد',
      quoteId: selectedQuoteId,
      quotationNumber: quote?.quotationNumber || quote?.id || '',
      exportedBy: user.username,
      exportedAt: new Date().toISOString(),
      content: contentToSave,
      status: 'pending' // pending administrative approval
    };

    try {
      const ts = Date.now();
      const res = await fetch(`/api/dynamic/sales_letters_logs?t=${ts}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        loadLogs();
        setTopNotification(lang === 'ar' ? 'تم ارسال طلب موافقة ادارية' : 'Administrative approval request sent');
        setTimeout(() => {
          setTopNotification(null);
        }, 3000);
        setTimeout(() => {
          const section = document.getElementById('sales-letters-archive-section');
          if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
          }
        }, 300);
      } else {
        showToast(lang === 'ar' ? 'حدث خطأ أثناء تقديم الطلب.' : 'Error submitting approval request.', 'error');
      }
    } catch(e) {
      showToast(lang === 'ar' ? 'فشل في تقديم الطلب، يرجى المحاولة مرة أخرى.' : 'Failed to submit request, please try again.', 'error');
    }
  };

  const handleApprove = (logItem: any) => {
    if (!logItem || !logItem.id) {
      showToast(lang === 'ar' ? 'خطأ: المعرّف الخاص بهذا الخطاب غير متوفر. يرجى إعادة تحميل الصفحة.' : 'Error: Letter identifier is not available. Please reload the page.', 'error');
      return;
    }
    setConfirmTargetLog(logItem);
    setConfirmActionType('approve');
    setShowConfirmModal(true);
  };

  const handleReject = (logItem: any) => {
    if (!logItem || !logItem.id) {
      showToast(lang === 'ar' ? 'خطأ: المعرّف الخاص بهذا الخطاب غير متوفر. يرجى إعادة تحميل الصفحة.' : 'Error: Letter identifier is not available. Please reload the page.', 'error');
      return;
    }
    setConfirmTargetLog(logItem);
    setConfirmActionType('reject');
    setShowConfirmModal(true);
  };

  const executeConfirmedAction = async () => {
    if (!confirmTargetLog || !confirmTargetLog.id || !confirmActionType) {
      showToast(lang === 'ar' ? 'خطأ: المعرّف أو الإجراء غير صالح.' : 'Error: Invalid identifier or action type.', 'error');
      setShowConfirmModal(false);
      return;
    }

    const nextStatus = confirmActionType === 'approve' ? 'approved' : 'rejected';
    try {
      const updatedLog = { ...confirmTargetLog, status: nextStatus };
      const res = await fetch(`/api/dynamic/sales_letters_logs/${confirmTargetLog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLog)
      });
      if (res.ok) {
        const successMsg = confirmActionType === 'approve'
          ? (lang === 'ar' ? 'تم تعميد الخطاب والموافقة بنجاح بالختم الرسمي!' : 'Letter has been approved with the official stamp!')
          : (lang === 'ar' ? 'تم الرفض بنجاح.' : 'Letter request has been rejected.');
        
        showToast(successMsg, 'success');
        
        // Instant visual sync: update the log state of the active preview modal in real-time
        if (previewLog && previewLog.id === confirmTargetLog.id) {
          setPreviewLog(updatedLog);
        }

        loadLogs();
      } else {
        showToast(lang === 'ar' ? 'فشل إكمال الإجراء المطلوب.' : 'Failed to complete requested action.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast(lang === 'ar' ? 'حدث خطأ أثناء الاتصال بالخادم.' : 'Server connection error occurred.', 'error');
    }
    setShowConfirmModal(false);
  };

  const handlePrintArchived = (logItem: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const showStamp = logItem.status === 'approved' || user?.role !== 'Sales Rep';
      printWindow.document.open();
      printWindow.document.write(`
        <html dir="rtl">
          <head>
          <style>
            @font-face { font-family: 'GE SS Two'; src: url('/fonts/GE-SS-Two.ttf') format('truetype'); font-weight: normal; font-style: normal; }
            @font-face { font-family: 'Gotham Pro'; src: url('/fonts/Gotham-Pro.ttf') format('truetype'); font-weight: normal; font-style: normal; }
            * { font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif !important; }
          </style>
            <title>طباعة خطاب المبيعات - أرشيف</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
              body { 
                margin: 0; 
                padding: 0; 
                background: white; 
                font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif !important;
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
              }
              @page { size: A4; margin: 10mm; }
              .doc-container {
                width: 100%;
                margin: 0 auto;
                padding: 0;
              }
              .doc-container > div, #printable-sales-letter, #printable-sales-letter-page2 {
                width: 100% !important;
                height: auto !important;
                min-height: 100% !important;
                box-sizing: border-box !important;
                padding: 0 !important;
                margin: 0 !important;
                background: white !important;
                box-shadow: none !important;
                display: flex !important;
                flex-direction: column !important;
              }
              .action-btns { 
                text-align: center; 
                margin: 20px 0;
                padding: 20px;
                background: #f1f5f9;
                border-bottom: 1px solid #e2e8f0;
              }
              .print-btn { 
                background: #0072BC; 
                color: white; 
                border: none; 
                padding: 12px 24px; 
                font-size: 16px; 
                font-weight: bold;
                border-radius: 8px; 
                cursor: pointer; 
                font-family: inherit;
                transition: all 0.2s;
              }
              .print-btn:hover { background: #005A96; }
              @media print {
                .action-btns { display: none !important; }
                body { background: white; }
              }
            </style>
          </head>
          <body>
            <div class="action-btns">
              <button class="print-btn" onclick="window.print()">🖨️ طباعة الخطاب الآن</button>
            </div>
            <div class="doc-container">
              <div style="width: 210mm; height: 297mm; padding: 3cm; box-sizing: border-box; display: flex; flex-direction: column; position: relative; background: white;">
                <!-- Header -->
                ${sharedPrintHeader}

                <!-- Content -->
                <div style="flex-grow: 1; outline: none; white-space: pre-wrap; font-family: sans-serif; font-size: 14px; line-height: 1.8; color: #1c1917;">
                  ${logItem.content}
                </div>

                <!-- Stamp -->
                ${showStamp ? `
                  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; z-index: 10; margin-top: -4rem; margin-bottom: -2rem;">
                    <p style="color: #64748b; font-weight: bold; font-size: 13px; margin-bottom: 4px; background: rgba(255,255,255,0.7); padding: 0 8px; border-radius: 4px;">ختم شركة الوليد</p>
                    <img src="https://i.postimg.cc/kXNd2vcT/Whats-App-Image-2026-02-26-at-3-36-23-PM.png" referrerpolicy="no-referrer" style="width: 112px; height: auto; mix-blend-multiply: multiply; opacity: 0.9;" alt="الختم" />
                  </div>
                ` : ''}

                <!-- Footer -->
                ${sharedPrintFooter}
              </div>

              <!-- Page 2 for bank details if needed -->
              ${logItem.title.includes('دفعة') || logItem.title.includes('سداد') || logItem.title.includes('مالي') || logItem.title.includes('مطالبة') ? `
                <div class="page-break" style="page-break-before: always; width: 210mm; height: 297mm; padding: 3cm; box-sizing: border-box; display: flex; flex-direction: column; position: relative; background: white; margin-top: 20px;">
                  <!-- Header -->
                  ${sharedPrintHeader}

                  <!-- Bank Image Centered -->
                  <div style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding-top: 40px;">
                    <h2 style="font-size: 18px; font-weight: bold; color: #1e293b; margin-bottom: 30px; border-bottom: 2px solid #4f46e5; padding-bottom: 8px;">البيانات البنكية لشركة فنون الوليد للصناعة</h2>
                    <img src="https://i.postimg.cc/yNbMMQ1V/Whats-App-Image-2026-06-17-at-11-47-06-AM.jpg" referrerpolicy="no-referrer" style="width: 100%; max-width: 500px; height: auto; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" alt="البيانات البنكية" />
                  </div>

                  <!-- Footer -->
                  ${sharedPrintFooter}
                </div>
              ` : ''}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 1500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      alert("الطلب يحتاج لسماح النوافذ المنبثقة.");
    }
  };

  return (
    <div className="space-y-6 flex-1 rtl" dir="rtl">
      {/* Top Floating Notification (3 seconds duration, requested by Representative) */}
      {topNotification && (
        <div id="sales-letters-top-promo-banner" className="fixed top-6 left-1/2 -translate-x-1/2 z-[1050] w-full max-w-md px-4 animate-in slide-in-from-top duration-300">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 border border-amber-400 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 font-extrabold text-sm relative overflow-hidden text-right" dir="rtl">
            <span className="text-xl relative z-10 animate-bounce">✉️</span>
            <div className="flex-1 relative z-10 space-y-0.5">
              <p className="text-sm font-black">{topNotification}</p>
              <p className="text-[10px] text-amber-50 font-normal">
                {lang === 'ar' ? 'تم حفظ طلبك "قيد الانتظار" وجاري تحويلك لجدول اللوق للرصد..' : 'Saved as pending and scrolling down to the logs list...'}
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-sales-letter-container, #printable-sales-letter-container * {
            visibility: visible;
          }
          #printable-sales-letter-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          #printable-sales-letter, #printable-sales-letter-page2 {
            width: 100% !important;
            height: auto !important;
            min-height: 100% !important;
            box-sizing: border-box;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            box-shadow: none !important;
            transform: none !important;
          }
          #printable-sales-letter-page2 {
            page-break-before: always;
          }
          @page { margin: 10mm; size: A4; }
        }
      `}</style>
      
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between gap-4 print:hidden">
         <div className="flex items-center gap-4">
           <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600">
             <PenTool className="w-8 h-8" />
           </div>
           <div>
             <h2 className="text-xl font-black text-indigo-800">خطابات المبيعات والمطالبات</h2>
             <p className="text-slate-500 mt-1 text-sm font-bold">إصدار الخطابات والمستندات السريعة بصيغة قانونية وفقاً لبيانات عروض الأسعار والعملاء.</p>
           </div>
         </div>
         {canManageTemplates && (
           <button
             onClick={() => setShowTemplateManager(true)}
             className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-sm font-bold transition-all"
           >
             <SettingsIcon className="w-4 h-4" />
             <span>{lang === 'ar' ? 'إدارة القوالب' : 'Manage Templates'}</span>
           </button>
         )}
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 print:hidden space-y-4">
        {/* Filters and Controls */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-bold">
          
          <div>
            <label className="block mb-2 text-slate-500">لغة الخطاب</label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                className={`flex-1 py-2 rounded-lg text-sm transition-colors ${docLanguage === 'ar' ? 'bg-white shadow text-indigo-700 font-bold' : 'text-slate-600 font-medium hover:bg-slate-200'}`}
                onClick={() => setDocLanguage('ar')}
              >
                عربي
              </button>
              <button
                className={`flex-1 py-2 rounded-lg text-sm transition-colors ${docLanguage === 'en' ? 'bg-white shadow text-indigo-700 font-bold' : 'text-slate-600 font-medium hover:bg-slate-200'}`}
                onClick={() => setDocLanguage('en')}
              >
                English
              </button>
            </div>
          </div>
          
          <div>
            <label className="block mb-2 text-slate-500">تصنيف الخطاب</label>
            <select 
              className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-100" 
              value={docCategory} 
              onChange={(e) => {
                const merged = getMergedTemplatesList();
                setDocCategory(e.target.value);
                setDocTemplate(merged[e.target.value]?.[0]?.id || '');
              }}
            >
              {templateCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-slate-500">نوع الخطاب والمستند</label>
            <select 
              className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-100"
              value={docTemplate}
              onChange={(e) => setDocTemplate(e.target.value)}
            >
              {getMergedTemplatesList()[docCategory]?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="relative">
            <label className="block mb-2 text-slate-500">عرض السعر المعتمد (المشروع)</label>
            <div className="relative">
              <input 
                type="text"
                className="w-full p-3 pr-10 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="ابحث برقم العرض أو المشروع..."
                value={quoteSearch}
                onChange={(e) => {
                  setQuoteSearch(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                disabled={loadingData}
              />
              <Search className="w-4 h-4 absolute right-3 top-3.5 text-slate-400" />
            </div>
            
            {isDropdownOpen && !loadingData && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {quotes.filter(q => 
                  (q.projectName || '').toLowerCase().includes(quoteSearch.toLowerCase()) ||
                  (q.quotationNumber || q.id || '').toLowerCase().includes(quoteSearch.toLowerCase()) ||
                  (q.clientName || '').toLowerCase().includes(quoteSearch.toLowerCase())
                ).map(q => (
                  <div 
                    key={q.id}
                    className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                    onClick={() => {
                      setSelectedQuoteId(q.id);
                      setQuoteSearch(`${q.quotationNumber || q.id} - ${q.projectName || q.clientName}`);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <div className="font-bold text-slate-700">{q.quotationNumber || q.id}</div>
                    <div className="text-slate-500 text-xs">{q.projectName || q.clientName}</div>
                  </div>
                ))}
                {quotes.filter(q => 
                  (q.projectName || '').toLowerCase().includes(quoteSearch.toLowerCase()) ||
                  (q.quotationNumber || q.id || '').toLowerCase().includes(quoteSearch.toLowerCase()) ||
                  (q.clientName || '').toLowerCase().includes(quoteSearch.toLowerCase())
                ).length === 0 && (
                  <div className="p-3 text-slate-500 text-center">لا توجد نتائج</div>
                )}
              </div>
            )}
          </div>

          {docCategory === 'financial' && selectedQuoteId && (() => {
            const currentQuote = quotes.find(q => q.id === selectedQuoteId);
            const currentPlan = financialPlans.find(p => p.quotationNumber === (currentQuote?.quotationNumber || currentQuote?.id) || p.quotationNumber === selectedQuoteId);
            return (
              <div className="md:col-span-3 mt-2">
                <label className="block mb-2 text-slate-500 font-bold">تحديد الدفعة المستحقة (من قسم التحصيل)</label>
                {!currentPlan ? (
                  <div className="p-3 bg-amber-50 text-amber-700 rounded-xl text-sm border border-amber-100">تعذر العثور على خطة تحصيل مالي لهذا العرض. تأكد من إنشائها في قسم التحصيل المالي.</div>
                ) : (
                  <select
                    className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-100"
                    onChange={(e) => {
                      if (!e.target.value) {
                        setSelectedPhaseLabel('');
                        setSelectedPhaseAmount(0);
                        return;
                      }
                      const phase = currentPlan.phases.find((ph: any) => ph.id === e.target.value);
                      if (phase) {
                        setSelectedPhaseLabel(phase.stageName);
                        setSelectedPhaseAmount(phase.amount);
                      }
                    }}
                  >
                    <option value="">-- بدون تحديد دفعة متصلة --</option>
                    {currentPlan.phases?.map((ph: any) => (
                      <option key={ph.id} value={ph.id}>{ph.stageName} - {ph.amount} <SaudiRiyal /> ({ph.status})</option>
                    ))}
                  </select>
                )}
              </div>
            );
          })()}
          
          <div className="md:col-span-3 flex flex-wrap justify-end gap-3 mt-4">
            <button 
              id="print-letter-current-btn"
              onClick={handlePrint} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" /> 
              {user?.role === 'Sales Rep' ? (lang === 'ar' ? 'طباعة الخطاب (بدون ختم)' : 'Print Letter (No Stamp)') : (lang === 'ar' ? 'طباعة الخطاب' : 'Print Letter')}
            </button>
            <button 
              id="export-letter-current-btn"
              onClick={handleExport} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" /> 
              {user?.role === 'Sales Rep' ? (lang === 'ar' ? 'تصدير وحفظ بالأرشيف (غير مختوم)' : 'Export & Save (No Stamp)') : (lang === 'ar' ? 'تصدير والاعتماد بالختم' : 'Export & Endorse with Stamp')}
            </button>
            {user?.role === 'Sales Rep' && (
              <button 
                id="request-approval-btn"
                onClick={handleRequestApproval} 
                className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
              >
                ✉️ {lang === 'ar' ? 'طلب موافقة إدارية (لتعميد الختم)' : 'Request Admin Approval (For Stamp)'}
              </button>
            )}
          </div>
        </div>

        {/* Editable Preview Frame */}
        <div className="bg-slate-200 p-2 md:p-8 rounded-3xl -mx-4 md:mx-0 shadow-inner overflow-hidden print:bg-transparent print:shadow-none print:p-0 print:m-0 print:overflow-visible">
          {docTemplate === 'delivery_note' ? (
            <DeliveryNoteBuilder quoteId={selectedQuoteId} quotes={quotes} clients={clients} user={user} onSaveDraft={(c) => { setDocContent(c); handleExport(); }} />
          ) : (
            <>
              <p className="text-center text-[10px] text-slate-400 mb-2 print:hidden font-bold">معاينة قابلة للتعديل - انقر على النص للتعديل وإضافة بنودك مباشرة قبل الطباعة</p>
              <div className="max-w-[210mm] mx-auto print:hidden">
                <RichTextToolbar />
              </div>

              <div id="printable-sales-letter-container">
                <div id="printable-sales-letter" className="relative mx-auto bg-white shadow print:shadow-none print:m-0 overflow-hidden" style={{ width: '210mm', height: '297mm', padding: '3cm', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Formal Header */}
                  <DocumentHeader />

                  {/* Editable Content */}
                  <div 
                    contentEditable 
                    suppressContentEditableWarning
                    className="outline-none whitespace-pre-wrap font-sans text-sm leading-7 text-stone-800" style={{ flexGrow: 1 }}
                    onBlur={(e) => setDocContent(e.currentTarget.innerHTML)}
                    dangerouslySetInnerHTML={{ __html: docContent }}
                  />

                  {/* Footer Signatures - hidden for Sales Rep on active design unless approved */}
                  {user?.role !== 'Sales Rep' && (
                    <div className="flex flex-col items-center justify-center relative z-10 pointer-events-none" style={{ marginTop: '-4rem', marginBottom: '-2rem' }} contentEditable={false}>
                      <p className="text-slate-500 font-bold mb-1 text-sm bg-white/70 px-2 rounded">ختم شركة الوليد</p>
                      <img src="https://i.postimg.cc/kXNd2vcT/Whats-App-Image-2026-02-26-at-3-36-23-PM.png" alt="ختم الشركة" className="w-28 h-auto object-contain opacity-90 mix-blend-multiply" />
                    </div>
                  )}
                  
                  <div className="mt-auto relative z-0">
                    <DocumentFooter />
                  </div>
                </div>

                {docCategory === 'financial' && (
                  <div id="printable-sales-letter-page2" className="page-break relative mx-auto mt-8 bg-white shadow print:shadow-none print:m-0 overflow-hidden" style={{ width: '210mm', height: '297mm', padding: '3cm', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', pageBreakBefore: 'always' }}>
                    <DocumentHeader />
                    <div className="flex-grow flex flex-col items-center justify-center pt-10">
                      <h2 className="text-xl font-bold text-slate-800 mb-8 border-b-2 border-indigo-500 pb-2">البيانات البنكية لشركة فنون الوليد للصناعة</h2>
                      <img src="https://i.postimg.cc/yNbMMQ1V/Whats-App-Image-2026-06-17-at-11-47-06-AM.jpg" alt="البيانات البنكية" className="w-full max-w-lg h-auto shadow-sm rounded-xl border border-slate-200" />
                    </div>
                    <DocumentFooter />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Audit Logs */}
      <div id="sales-letters-archive-section" className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 print:hidden scroll-mt-24">
        <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" /> أرشيف خطابات المبيعات والمطالبات
        </h3>
        
        {loadingLogs ? (
          <p className="text-xs text-slate-400 font-bold">جاري تحميل الأرشيف...</p>
        ) : exportLogs.length === 0 ? (
          <p className="text-xs text-slate-400 font-bold">لا يوجد خطابات محفوظة بعد في قاعدة البيانات.</p>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold">
                  <tr>
                    <th className="p-3 rounded-r-xl">التاريخ والوقت</th>
                    <th className="p-3">المشروع / العميل</th>
                    <th className="p-3">رقم العرض</th>
                    <th className="p-3">نوع الخطاب</th>
                    <th className="p-3">المسؤول المصدر</th>
                    <th className="p-3">حالة الخطاب</th>
                    <th className="p-3 rounded-l-xl text-center">الإجراءات والتعميد</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllLogs ? exportLogs : exportLogs.slice(0, 5)).map((log: any, idx: number) => {
                    const isPending = log.status === 'pending';
                    const isApproved = log.status === 'approved';
                    const isRejected = log.status === 'rejected';
                    const isWithoutStamp = log.status === 'without_stamp' || !log.status;

                    return (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition">
                        <td className="p-3 text-slate-400 font-bold font-mono" dir="ltr">
                          {new Date(log.exportedAt).toLocaleString('en-US')}
                        </td>
                        <td className="p-3 font-bold text-slate-700">{log.clientName}</td>
                        <td className="p-3 font-bold text-slate-500 font-mono">{log.quotationNumber}</td>
                        <td className="p-3">
                          <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg font-bold">{log.title}</span>
                        </td>
                        <td className="p-3 font-bold text-slate-600">{log.exportedBy}</td>
                        <td className="p-3">
                          {isPending && (
                            <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-[11px] font-bold animate-pulse inline-block">
                              ⏳ قيد الانتظار
                            </span>
                          )}
                          {isApproved && (
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-bold inline-block">
                              ✅ معتمد ومختوم
                            </span>
                          )}
                          {isRejected && (
                            <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-full text-[11px] font-bold inline-block">
                              ❌ مرفوض
                            </span>
                          )}
                          {isWithoutStamp && (
                            <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full text-[11px] font-semibold inline-block">
                              ⚠️ غير مختوم
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center flex items-center justify-center gap-2">
                          <button
                            id={`preview-archived-${log.id || idx}`}
                            onClick={() => setPreviewLog(log)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-[#0072BC] text-slate-700 hover:text-white rounded-lg border border-slate-200 transition text-[11px] font-bold cursor-pointer"
                          >
                            👁️ {lang === 'ar' ? 'معاينة' : 'Preview'}
                          </button>
                          
                          {isPending && canApprove && (
                            <div className="flex items-center gap-1">
                              <button
                                id={`approve-log-${log.id || idx}`}
                                onClick={() => handleApprove(log)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition text-xs font-bold font-mono cursor-pointer"
                                title={lang === 'ar' ? 'اعتماد' : 'Approve'}
                              >
                                ✔️ {lang === 'ar' ? 'موافقة' : 'Approve'}
                              </button>
                              <button
                                id={`reject-log-${log.id || idx}`}
                                onClick={() => handleReject(log)}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition text-xs font-bold font-mono cursor-pointer"
                                title={lang === 'ar' ? 'رفض' : 'Reject'}
                              >
                                ❌ {lang === 'ar' ? 'رفض' : 'Reject'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {exportLogs.length > 5 && (
              <div className="flex justify-center mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowAllLogs(!showAllLogs)}
                  className="px-6 py-2.5 bg-indigo-50 hover:bg-indigo-150 text-[#0072BC] hover:text-[#005A96] font-black rounded-2xl transition text-xs shadow-sm shadow-indigo-100/50 cursor-pointer flex items-center gap-1.5"
                >
                  {showAllLogs ? (
                    <>👆 {lang === 'ar' ? 'عرض أقل' : 'Show Less'}</>
                  ) : (
                    <>👇 {lang === 'ar' ? `عرض المزيد (${exportLogs.length - 5} خطابات إضافية)` : `Show More (${exportLogs.length - 5} more letters)`}</>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modern Dialog view modal */}
      {previewLog && (
        <div id="sales-letter-preview-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-150 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150" dir="rtl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 text-right">
              <div>
                <h3 className="font-black text-slate-800 text-base">{previewLog.title}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'ar' ? 'معاينة المستند الرسمي المؤرشف وقابليته للطباعة' : 'Preview archived formal document and printability'}
                </p>
              </div>
              <button 
                onClick={() => setPreviewLog(null)}
                className="p-2 hover:bg-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 md:p-8 bg-slate-100 overflow-y-auto flex-grow flex justify-center">
              <div 
                id="archived-printable-container" 
                className="bg-white shadow relative overflow-hidden text-right leading-7 text-stone-800 font-sans text-sm" 
                style={{ width: '210mm', minHeight: '297mm', padding: '3cm', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}
              >
                {/* Formal Header */}
                <div className="border-b-2 border-[#0072BC] pb-4 mb-6 flex justify-between items-center w-full">
                  <div className="text-right">
                    <h1 className="text-[#0072BC] text-lg font-black">{lang === 'ar' ? 'شركة فنون الوليد للصناعة' : 'Al Waleed Industrial Arts Co.'}</h1>
                    <p className="text-slate-500 text-[10px] mt-0.5 font-bold">
                      {lang === 'ar' ? 'مملوكة لمؤسسة الوليد التجارية | ترخيص صناعي رقم 44110511855' : 'Owned by Al Waleed Trading Est. | Industrial License No. 44110511855'}
                    </p>
                  </div>
                  <img src="https://i.postimg.cc/0jQj3XVc/Alwaleed-Logo-Vertical-Blue.png" referrerPolicy="no-referrer" className="h-20 object-contain" alt="Logo" />
                </div>

                {/* Letter Content body */}
                <div className="flex-grow whitespace-pre-wrap text-stone-800 leading-8" dangerouslySetInnerHTML={{ __html: previewLog.content }} />

                {/* Conditional stamp */}
                {(previewLog.status === 'approved' || user?.role !== 'Sales Rep') ? (
                  <div className="flex flex-col items-center justify-center relative z-10 pointer-events-none mt-4 mb-2">
                    <p className="text-slate-500 font-bold mb-1 text-xs bg-white/70 px-2 rounded">ختم شركة الوليد</p>
                    <img src="https://i.postimg.cc/kXNd2vcT/Whats-App-Image-2026-02-26-at-3-36-23-PM.png" referrerPolicy="no-referrer" alt="ختم الشركة" className="w-24 h-auto object-contain opacity-95 mix-blend-multiply" />
                  </div>
                ) : (
                  <div className="border border-amber-250 text-amber-700 bg-amber-50/50 rounded-xl p-3 text-xs font-bold text-center mt-6">
                    ⚠️ {lang === 'ar' ? 'الخطاب غير مختوم (بانتظار الموافقة والتعميد الإداري)' : 'Letter unstamped (Awaiting admin approval)'}
                  </div>
                )}

                {/* Footer */}
                <div className="border-t border-slate-200 pt-3 mt-auto text-[10px] text-slate-500 font-bold">
                  <div className="flex justify-between items-center w-full">
                    <p>{lang === 'ar' ? 'الرياض، المملكة العربية السعودية | جوال: 0555234509' : 'Riyadh, KSA | Mobile: 0555234509'}</p>
                    <p>Al Waleed Industrial Arts Co.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex gap-2">
                {previewLog.status === 'pending' && canApprove && (
                  <>
                    <button 
                      onClick={() => handleApprove(previewLog)}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-100 text-sm cursor-pointer"
                    >
                      ✔️ {lang === 'ar' ? 'تعميد وموافقة بالختم' : 'Approve with Stamp'}
                    </button>
                    <button 
                      onClick={() => handleReject(previewLog)}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-rose-100 text-sm cursor-pointer"
                    >
                      ❌ {lang === 'ar' ? 'رفض هذا الخطاب' : 'Reject Letter'}
                    </button>
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setPreviewLog(null)}
                  className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition cursor-pointer text-sm"
                >
                  {lang === 'ar' ? 'إغلاق' : 'Close'}
                </button>
                <button 
                  onClick={() => handlePrintArchived(previewLog)}
                  className="px-6 py-2.5 bg-[#0072BC] hover:bg-[#005A96] text-white font-extrabold rounded-xl transition flex items-center gap-2 shadow-lg shadow-blue-100 text-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> {lang === 'ar' ? 'طباعة الخطاب المؤرشف' : 'Print Archived Letter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal (iframe safe) */}
      {showConfirmModal && confirmTargetLog && (
        <div id="sales-letter-confirm-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-150 text-right" dir="rtl">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <span className={`p-2.5 rounded-full text-lg ${confirmActionType === 'approve' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {confirmActionType === 'approve' ? '✔️' : '❌'}
               </span>
              <div>
                <h4 className="font-extrabold text-slate-800 text-base">
                  {confirmActionType === 'approve' 
                    ? (lang === 'ar' ? 'تأكيد اعتماد الخطاب بالختم' : 'Confirm Stamping Letter') 
                    : (lang === 'ar' ? 'تأكيد رفض الخطاب' : 'Confirm Rejecting Letter')}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'ar' ? 'يرجى مراجعة التفاصيل قبل التأكيد النهائي' : 'Please review details before final execution'}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs text-slate-600 leading-6">
              <div>
                <span className="font-bold text-slate-400">{lang === 'ar' ? 'نوع الخطاب: ' : 'Letter Type: '}</span>
                <span className="font-bold text-slate-700">{confirmTargetLog.title}</span>
              </div>
              <div>
                <span className="font-bold text-slate-400">{lang === 'ar' ? 'اسم العميل: ' : 'Client Name: '}</span>
                <span className="font-bold text-slate-700">{confirmTargetLog.clientName}</span>
              </div>
              <div>
                <span className="font-bold text-slate-400">{lang === 'ar' ? 'رقم العرض: ' : 'Quotation No: '}</span>
                <span className="font-bold font-mono text-indigo-600">{confirmTargetLog.quotationNumber}</span>
              </div>
              <div>
                <span className="font-bold text-slate-400">{lang === 'ar' ? 'اسم المصدر: ' : 'Exported By: '}</span>
                <span className="font-bold text-slate-700">{confirmTargetLog.exportedBy}</span>
              </div>
              <div>
                <span className="font-bold text-slate-400">{lang === 'ar' ? 'تاريخ الإصدار: ' : 'Exported At: '}</span>
                <span className="font-bold font-mono text-slate-700">{new Date(confirmTargetLog.exportedAt).toLocaleDateString('en-US')}</span>
              </div>
            </div>

            <p className="text-sm font-bold text-slate-700 leading-relaxed pt-1">
              {confirmActionType === 'approve' 
                ? (lang === 'ar' ? 'هل أنت متأكد من تعميد هذا الخطاب وترحيله للموافقة الرسمية بختم المؤسسة الملون؟' : 'Are you sure you want to approve this letter and auto-apply the official stamp?')
                : (lang === 'ar' ? 'هل أنت متأكد من رفض هذا الطلب وإرساله لعلامة مرفوض؟' : 'Are you sure you want to reject this request?')}
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={executeConfirmedAction}
                className={`flex-grow py-3 px-4 font-extrabold rounded-2xl text-white transition text-sm cursor-pointer shadow-lg ${
                  confirmActionType === 'approve' 
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-50' 
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-50'
                }`}
              >
                {confirmActionType === 'approve' 
                  ? (lang === 'ar' ? 'نعم، موافقة واعتماد بالختم' : 'Yes, Approve with Stamp') 
                  : (lang === 'ar' ? 'نعم، رفض الطلب' : 'Yes, Reject Request')}
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold rounded-2xl transition text-sm cursor-pointer"
              >
                {lang === 'ar' ? 'تراجع' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Manager Modal */}
      {showTemplateManager && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200 text-right" dir="rtl">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 p-2.5 rounded-2xl text-indigo-600">
                  <SettingsIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">إدارة قوالب خطابات المبيعات والمطالبات</h3>
                  <p className="text-xs text-slate-400 mt-1">تعديل وإضافة قوالب مستندات مبيعات مخصصة في قاعدة البيانات</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowTemplateManager(false);
                  setEditingTemplate(null);
                  setTemplateName('');
                  setTemplateBody('');
                }}
                className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Right Panel: Template Form */}
              <div className="lg:col-span-7 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-extrabold text-indigo-900 text-sm">
                  {editingTemplate ? 'تعديل قالب قائم' : 'إنشاء قالب مبيعات جديد'}
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block mb-1.5 text-xs text-slate-500 font-bold">اسم القالب</label>
                    <input 
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="مثال: مطالبة مالية نهائية قبل إيقاف الخدمة"
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-100 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1.5 text-xs text-slate-500 font-bold">التصنيف</label>
                      <select
                        value={templateCategorySelected}
                        onChange={(e) => setTemplateCategorySelected(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-100 font-bold"
                      >
                        {templateCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1.5 text-xs text-slate-500 font-bold">اللغة</label>
                      <select
                        value={templateLang}
                        onChange={(e) => setTemplateLang(e.target.value as 'ar' | 'en')}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-100 font-bold"
                      >
                        <option value="ar">العربية</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1.5 text-xs text-slate-500 font-bold">محتوى القالب (النص الأساسي)</label>
                    <textarea
                      value={templateBody}
                      onChange={(e) => setTemplateBody(e.target.value)}
                      rows={12}
                      placeholder="اكتب نص الخطاب هنا. يمكنك استخدام المتغيرات التلقائية الموضحة في اليسار ليتم استبدالها تلقائياً عند تعبئة المستند..."
                      className="w-full p-3 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-100 font-mono leading-relaxed"
                    />
                  </div>

                  <div className="flex gap-2 pt-2 justify-end">
                    {editingTemplate && (
                      <button
                        onClick={() => {
                          setEditingTemplate(null);
                          setTemplateName('');
                          setTemplateBody('');
                        }}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition text-xs cursor-pointer"
                      >
                        إلغاء التعديل
                      </button>
                    )}
                    <button
                      onClick={handleSaveCustomTemplate}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-100"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{editingTemplate ? 'حفظ التعديلات' : 'إنشاء وحفظ القالب'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Left Panel: List of templates & variables guide */}
              <div className="lg:col-span-5 flex flex-col space-y-6">
                
                {/* List of templates */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-slate-700 text-sm">القوالب المتوفرة في النظام</h4>
                  <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-72 overflow-y-auto bg-white">
                    {(() => {
                      const allMerged: any[] = [];
                      
                      // Loop through built-in categories
                      Object.keys(templatesList).forEach(cat => {
                        templatesList[cat].forEach((t: any) => {
                          const dbEntry = customTemplates.find(x => x.id === t.id);
                          if (dbEntry) {
                            if (dbEntry.isDeleted) {
                              allMerged.push({
                                id: t.id,
                                name: t.name,
                                category: cat,
                                lang: t.lang || 'ar',
                                isBuiltIn: true,
                                isDeleted: true,
                                content: getBuiltInSalesTemplatePlaceholderContent(t.id, t.lang || 'ar')
                              });
                            } else {
                              allMerged.push({
                                id: t.id,
                                name: dbEntry.name,
                                category: cat,
                                lang: dbEntry.lang || 'ar',
                                isBuiltIn: true,
                                isOverridden: true,
                                content: dbEntry.content,
                                rawDbEntry: dbEntry
                              });
                            }
                          } else {
                            allMerged.push({
                              id: t.id,
                              name: t.name,
                              category: cat,
                              lang: t.lang || 'ar',
                              isBuiltIn: true,
                              content: getBuiltInSalesTemplatePlaceholderContent(t.id, t.lang || 'ar')
                            });
                          }
                        });
                      });

                      // Add custom templates
                      customTemplates.forEach(t => {
                        const isBuiltInId = Object.values(templatesList).some((list: any) => list.some((x: any) => x.id === t.id));
                        if (!isBuiltInId) {
                          allMerged.push({
                            id: t.id,
                            name: t.name,
                            category: t.category || 'financial',
                            lang: t.lang || 'ar',
                            isCustom: true,
                            content: t.content,
                            rawDbEntry: t
                          });
                        }
                      });

                      if (allMerged.length === 0) {
                        return <p className="p-4 text-xs text-slate-400 text-center font-bold">لا توجد قوالب حالياً.</p>;
                      }

                      return allMerged.map(t => {
                        const catObj = templateCategories.find(c => c.id === t.category);
                        return (
                          <div key={t.id} className={`p-3 flex items-center justify-between hover:bg-slate-50 transition ${t.isDeleted ? 'opacity-50 bg-rose-50/20' : ''}`}>
                            <div className="space-y-1 text-right max-w-[200px] lg:max-w-[240px]">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className={`text-xs font-bold text-slate-800 ${t.isDeleted ? 'line-through text-slate-400' : ''}`}>
                                  {t.name}
                                </p>
                                {t.isCustom && (
                                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">مخصص</span>
                                )}
                                {t.isBuiltIn && !t.isOverridden && !t.isDeleted && (
                                  <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-md">نظام</span>
                                )}
                                {t.isOverridden && (
                                  <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-md">معدل</span>
                                )}
                                {t.isDeleted && (
                                  <span className="text-[9px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-md">محذوف</span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {catObj?.name || t.category} • {t.lang === 'ar' ? 'العربية' : 'English'}
                              </p>
                            </div>
                            
                            <div className="flex gap-1.5 items-center">
                              {!t.isDeleted ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingTemplate(t.rawDbEntry || { id: t.id, name: t.name, category: t.category, lang: t.lang, content: t.content });
                                      setTemplateName(t.name);
                                      setTemplateCategorySelected(t.category || 'financial');
                                      setTemplateLang(t.lang || 'ar');
                                      setTemplateBody(t.content || '');
                                    }}
                                    className="p-1.5 hover:bg-slate-100 text-indigo-600 rounded-lg transition cursor-pointer"
                                    title="تعديل القالب"
                                  >
                                    <EditIcon className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCustomTemplate(t.id)}
                                    className="p-1.5 hover:bg-slate-100 text-rose-600 rounded-lg transition cursor-pointer"
                                    title="حذف القالب"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleResetBuiltInTemplate(t.id)}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition cursor-pointer font-extrabold text-[10px]"
                                  title="استعادة القالب الافتراضي"
                                >
                                  استعادة القالب
                                </button>
                              )}
                              {t.isOverridden && (
                                <button
                                  onClick={() => handleResetBuiltInTemplate(t.id)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition cursor-pointer font-bold text-[10px]"
                                  title="إلغاء التعديلات واستعادة النسخة الأصلية"
                                >
                                  استعادة الافتراضي
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Variables Helper */}
                <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-2xl space-y-3 text-right">
                  <div className="flex items-center gap-2 text-amber-800">
                    <HelpCircle className="w-4 h-4 shrink-0" />
                    <h5 className="font-extrabold text-xs">قائمة المتغيرات التلقائية المتاحة</h5>
                  </div>
                  <p className="text-[11px] text-amber-700/90 leading-5">
                    عند كتابة نص القالب، يمكنك إدراج الكلمات المفتاحية أدناه وسيتم استبدالها تلقائياً ببيانات العميل وعرض السعر الحاليين:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono leading-5 text-slate-600">
                    <div>
                      <span className="font-bold text-amber-900 block">{"{{اسم_العميل}}"}</span>
                      <span className="text-slate-400">اسم المؤسسة أو العميل</span>
                    </div>
                    <div>
                      <span className="font-bold text-amber-900 block">{"{{اسم_الممثل}}"}</span>
                      <span className="text-slate-400">اسم الممثل المعني</span>
                    </div>
                    <div>
                      <span className="font-bold text-amber-900 block">{"{{اسم_المشروع}}"}</span>
                      <span className="text-slate-400">اسم المشروع المعتمد</span>
                    </div>
                    <div>
                      <span className="font-bold text-amber-900 block">{"{{رقم_العرض}}"}</span>
                      <span className="text-slate-400">رقم عرض السعر</span>
                    </div>
                    <div>
                      <span className="font-bold text-amber-900 block">{"{{مبلغ_الدفعة}}"}</span>
                      <span className="text-slate-400">مبلغ الدفعة المطلوبة المحددة</span>
                    </div>
                    <div>
                      <span className="font-bold text-amber-900 block">{"{{مسمى_الدفعة}}"}</span>
                      <span className="text-slate-400">مسمى الدفعة</span>
                    </div>
                    <div>
                      <span className="font-bold text-amber-900 block">{"{{التاريخ}}"}</span>
                      <span className="text-slate-400">تاريخ اليوم المنسق</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* Modern custom dynamic status toasts */}
      {toast && (
        <div id="sales-letters-toast" className="fixed bottom-6 left-6 z-[120] animate-in slide-in-from-bottom duration-300">
          <div className={`p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-sm font-bold min-w-[280px] max-w-sm ${
            toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
            toast.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-800' :
            'bg-indigo-50 border-indigo-100 text-indigo-800'
          }`}>
            <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
            <p className="flex-grow">{toast.message}</p>
          </div>
        </div>
      )}

    </div>
  );
}
