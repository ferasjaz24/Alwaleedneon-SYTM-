import React, { useState, useEffect } from 'react';
import { FileText, Printer, Save, PenTool, Search } from 'lucide-react';
import { User } from '../types';
import { DocumentHeader, DocumentFooter } from '../utils/PrintSharedComponents';
import { sharedPrintHeader, sharedPrintFooter } from '../utils/PrintShared';
import RichTextToolbar from './RichTextToolbar';
import { getAdvancedPermissionScope } from '../lib/permissions';

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

  const handleTranslateLetter = async (targetLang: "ar" | "en") => {
    if (!docContent || !docContent.trim()) {
      showToast(lang === "ar" ? "لا يوجد محتوى لترجمته" : "No content to translate", "error");
      return;
    }
    setIsTranslating(true);
    try {
      // Strip some HTML tags for translation, or just translate directly as it is an HTML block.
      // Gemini handles HTML structure translation very well if instructed properly.
      const response = await fetch("/api/gemini/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: docContent,
          targetLang: targetLang,
          context: `An official business letter from Al Waleed Neon company (fnoon alwaleed neon). Keep all HTML tags (like <div>, <p>, <br>, <b>, <strong>, etc.) exactly intact in their original places, only translating the human text content inside/between them professionally.`
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.translatedText) {
          setDocContent(data.translatedText);
          showToast(lang === "ar" ? "تمت الترجمة بنجاح" : "Translated successfully", "success");
        } else {
          showToast(lang === "ar" ? "فشلت الترجمة" : "Translation failed", "error");
        }
      } else {
        showToast(lang === "ar" ? "فشلت الترجمة" : "Translation failed", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsTranslating(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const canApprove = user && (
    user.role === 'Super Admin' ||
    user.username === 'FERAS' ||
    user.role === 'Senior Management' ||
    user.role === 'الادارة العليا' ||
    user.role === 'Admin' ||
    user.role === 'Sales Manager' ||
    user.role === 'HR Manager'
  );

  // Categorized Templates
  const templateCategories = [
    { id: 'financial', name: 'أولاً: الخطابات والمطالبات المالية' },
    { id: 'operational', name: 'ثانياً: الخطابات التشغيلية والفنية' },
    { id: 'warnings', name: 'ثالثاً: الإنذارات والمطالبات النهائية' }
  ];

  const templatesList: any = {
    'financial': [
      { id: 'advance_payment', name: 'طلب سداد دفعة مقدمة' },
      { id: 'due_payment', name: 'طلب سداد دفعة مستحقة' },
      { id: 'late_payment', name: 'تذكير بسداد دفعة متأخرة' },
      { id: 'final_payment', name: 'مطالبة بالمبلغ المتبقي' }
    ],
    'operational': [
      { id: 'site_prep', name: 'طلب تجهيز الموقع' },
      { id: 'design_approval', name: 'اعتماد التصميم النهائي' },
      { id: 'installation_ready', name: 'جاهزية الأعمال للتركيب' },
      { id: 'handover', name: 'خطاب تسليم الأعمال' }
    ],
    'warnings': [
      { id: 'warning', name: 'إنذار نهائي قبل التصعيد' },
      { id: 'expire_quote', name: 'انتهاء صلاحية عرض السعر' }
    ]
  };

  const fetchData = async () => {
    try {
      const ts = Date.now();
      const [resQuotes, resClients, resPlans] = await Promise.all([
        fetch(`/api/sales_quotations?t=${ts}`),
        fetch(`/api/customers?t=${ts}`),
        fetch(`/api/dynamic/financial_collections?t=${ts}`)
      ]);
      if (resQuotes.ok && resClients.ok) {
        const qData = await resQuotes.json();
        const cData = await resClients.json();
        const pData = resPlans.ok ? await resPlans.json() : [];
        let approved = Array.isArray(qData) ? qData.filter((q: any) => q.status === 'معتمد') : [];
        
        const lettersScope = getAdvancedPermissionScope(user, 'sales', 'letters', 'view_letters');
        if (lettersScope === 'own') {
          approved = approved.filter((q: any) => q.createdBy?.toLowerCase() === user?.username?.toLowerCase());
        } else if (lettersScope === 'none') {
          approved = [];
        }
        
        setQuotes(approved);
        setClients(Array.isArray(cData) ? cData : []);
        setFinancialPlans(Array.isArray(pData) ? pData : []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingData(false);
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const ts = Date.now();
      const res = await fetch(`/api/dynamic/sales_letters_logs?t=${ts}`);
      if (res.ok) {
        let data = await res.json();
        const lettersScope = getAdvancedPermissionScope(user, 'sales', 'letters', 'view_letters');
        if (lettersScope === 'own') {
          data = data.filter((log: any) => log.exportedBy === user?.username);
        } else if (lettersScope === 'none') {
          data = [];
        }
        data.sort((a: any, b: any) => new Date(b.exportedAt).getTime() - new Date(a.exportedAt).getTime());
        setExportLogs(data);
      }
    } catch(e) {
      console.error(e);
    }
    setLoadingLogs(false);
  };

  useEffect(() => {
    fetchData();
    loadLogs();
  }, []);

  const getTemplateText = () => {
    if (!selectedQuoteId) {
      return docLanguage === 'ar' 
        ? 'يرجى تحديد عرض السعر المعتمد أولاً لتعبئة البيانات التلقائية للمستند.'
        : 'Please select an approved quotation first to populate the automatic document fields.';
    }
    
    const quote = quotes.find(q => q.id === selectedQuoteId);
    if (!quote) return '';

    const d = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    const client = clients.find(c => c.id === quote.clientId);
    const fullClientName = client ? (client.companyName || client.name) : 'العميل الكريم';
    const repName = docLanguage === 'ar'
      ? (client?.contactName || 'عناية المعني')
      : (client?.contactName || 'Attn: Representative');

    const projectName = docLanguage === 'ar'
      ? (quote.projectName || 'الأعمال المعتمدة بالعرض')
      : (quote.projectName || 'approved works under quotation');

    const qtnNo = quote.quotationNumber || quote.id;

    if (docLanguage === 'ar') {
      const phaseNote = selectedPhaseLabel && selectedPhaseAmount > 0 ? `\n\nنفيدكم بأن مبلغ الدفعة المطلوبة (${selectedPhaseLabel}) هو: ${selectedPhaseAmount} ريال سعودي، نرجو التفضل بتحويله لإكمال الإجراءات المعتمدة.\n\n` : '\n\n';

      switch(docTemplate) {
        case 'advance_payment': return `الرقم المرجعي: SL-ADV-${qtnNo}\nالتاريخ: ${d}\n\nالموضوع: طلب سداد الدفعة المقدمة للبدء بتنفيذ الأعمال\n\nعناية السادة / ${fullClientName} المحترمين\nعناية الأستاذ / ${repName}\nالسلام عليكم ورحمة الله وبركاته،\n\nفي البداية، نود أن نشكركم على ثقتكم الغالية باختيار "شركة فنون الوليد للصناعة" لتنفيذ وتصنيع متطلباتكم لمشروع (${projectName}).\n\nنأمل الإحاطة بأنه تم استلام وتوثيق اعتمادكم لعرض السعر رقم (${qtnNo}). وحرصاً منا على تقديم أفضل مستويات الخدمة والبدء الفوري في أعمال التوريد والتصنيع لضمان تسليم الأعمال ضمن الجدول الزمني المتفق عليه، نأمل منكم التكرم بتحويل الدفعة المقدمة المنصوص عليها في عرض السعر المعتمد.${phaseNote}يسرنا استقبال التحويل على حسابات الشركة البنكية المرفقة طيه مع تزويدنا بصورة من إيصال الحوالة للبدء مباشرة في جدولة العمليات.\n\nنقدر لكم تعاونكم الدائم وسرعة استجابتكم.\n\nوتفضلوا بقبول فائق التحية والاحترام،،،\n\nإدارة المبيعات والتحصيل\nشركة فنون الوليد للصناعة`;
        
        case 'due_payment': return `الرقم المرجعي: SL-DUE-${qtnNo}\nالتاريخ: ${d}\n\nالموضوع: طلب سداد دفعة مالية مستحقة حسب مراحل الإنجاز\n\nعناية السادة / ${fullClientName} المحترمين\nعناية الأستاذ / ${repName}\nالسلام عليكم ورحمة الله وبركاته،\n\nاستناداً إلى مسيرة العمل المشتركة في مشروع (${projectName}) وفق عرض السعر المعتمد رقم (${qtnNo})، يسعدنا إبلاغكم بأننا قد أنجزنا بنجاح المرحلة المقررة من الأعمال وتم تسليمها أو تجهيزها وفقاً لأعلى معايير الجودة المتبعة لدينا.\n\nوبناءً على جدول الدفعات المتفق عليه، فقد حان موعد استحقاق الدفعة التالية المترتبة على هذه المرحلة.${phaseNote}نرجو من سعادتكم التكرم بترتيب إجراءات السداد في أقرب وقت ممكن لضمان سير الأعمال اللاحقة بسلاسة ودون أية توقفات أو تأخير في الجدول الزمني الكلي للمشروع.\n\nشاكرين ومقرارين لكم التزامكم ودعمكم المستمر لجهودنا.\n\nوتفضلوا بقبول خالص التقدير والاحترام،،،\n\nإدارة المبيعات والتحصيل\nشركة فنون الوليد للصناعة`;
        
        case 'late_payment': return `الرقم المرجعي: SL-LT-${qtnNo}\nالتاريخ: ${d}\n\nالموضوع: تذكير ودي بشأن دفعة مالية متأخرة\n\nعناية السادة / ${fullClientName} المحترمين\nعناية الأستاذ / ${repName}\nالسلام عليكم ورحمة الله وبركاته،\n\nنبعث إليكم أطيب تحياتنا في "شركة فنون الوليد للصناعة"، متمنين لكم دوام التوفيق والنجاح.\n\nنرجو التكرم بالإحاطة بأنه من خلال مراجعة سجلاتنا المالية لمشروع (${projectName}) بعرض السعر رقم (${qtnNo})، تبين لنا عدم استلام الدفعة المستحقة عن الأعمال المنجزة حتى تاريخه، والتي قمنا بإشعاركم بها مسبقاً.${phaseNote}لعله من باب السهو أو مشاغلكم العملية تأخر الدفع، ولذا نرجو منكم التفضل بحث القسم المالي لديكم على إنهاء وإتمام عملية السداد للمبلغ المستحق حفاظاً على سير العلاقة والجدول الزمني للعمل دون عوائق.\n\nنؤكد التزامنا التام بإنهاء المشروع على الوجه الأكمل المأمول بمجرد تسوية الوضع المالي المطلوب.\n\nشاكرين لكم حسن استيعابكم وتجاوبكم المستمر.\n\nوتفضلوا بقبول أسمى اعتباراتنا،،،\n\nالقسم المالي وإدارة المشاريع\nشركة فنون الوليد للصناعة`;

        case 'site_prep': return `الرقم المرجعي: SL-PRP-${qtnNo}\nالتاريخ: ${d}\n\nالموضوع: إشعار وتوجيه لطلب جاهزية الموقع قبل بدء التركيب\n\nعناية السادة / ${fullClientName} المحترمين\nعناية الأستاذ / ${repName}\nالسلام عليكم ورحمة الله وبركاته،\n\nفي إطار التعاون المشترك للبدء بمشروع (${projectName}) بناءً على عرض السعر رقم (${qtnNo})، وحرصاً على تنفيذ أعمال التركيب باحترافية وسرعة قياسية.\n\nنود إفادتكم بضرورة تجهيز وإعداد الموقع الميداني لاستقبال الفرق الفنية التابعة لنا. ويشمل ذلك التأكد من خلو واجهة التركيب أو المنطقة المستهدفة من أية عوائق، وتوفير التمديدات الكهربائية اللازمة، وإصدار أية تصاريح دخول مؤقتة (إن وجدت) لمركباتنا وفنيينا.\n\nنأمل إفادتنا خطياً أو بمكتب رسمي عبر البريد الإلكتروني أو وسائل التواصل المعتمدة حال جاهزية الموقع لديكم بالكامل، ليتم إدراجكم فوراً في جدول أعمال التركيبات النهائية.\n\nنشكر لكم تعاونكم الفعّال لضمان جودة المخرجات.\n\nمع التحية والتقدير،،،\n\nإدارة الهندسية وأعمال التشغيل\nشركة فنون الوليد للصناعة`;

        case 'design_approval': return `الرقم المرجعي: SL-APP-${qtnNo}\nالتاريخ: ${d}\n\nالموضوع: طلب المراجعة والاعتماد النهائي للتصاميم الفنية\n\nعناية السادة / ${fullClientName} المحترمين\nعناية الأستاذ / ${repName}\nالسلام عليكم ورحمة الله وبركاته،\n\nإلحاقاً للتوافق على أعمال مشروع (${projectName}) بموجب عرض السعر رقم (${qtnNo})، يسرنا أن نرفق لكم طيه المخططات والتصاميم الفنية النهائية المقترحة لتنفيذ المتطلبات.\n\nيرجى التكرم بالاطلاع وإجراء المراجعة التفصيلية للأبعاد، والألوان، والمواد الموضحة بالتصميم. وحيث أن عملية التصنيع والإنتاج مبنية كلياً على هذا الاعتماد.\n\nونأمل الإحاطة بأن أي تعديلات بعد الاعتماد الخطي ستتطلب تقييماً جديداً للتكاليف والمدة الزمنية وفق جدول الإنتاج.\n\nآملين سرعة الرد ليتسنى لنا بدء مراحل التصنيع دون تأخير.\n\nوتفضلوا بقبول فائق التقدير،،،\n\nقسم التصميم والمبيعات\nشركة فنون الوليد للصناعة`;

        case 'installation_ready': return `الرقم المرجعي: SL-RDY-${qtnNo}\nالتاريخ: ${d}\n\nالموضوع: إشعار جاهزية الأعمال للتنفيذ والتركيب الميداني\n\nعناية السادة / ${fullClientName} المحترمين\nعناية الأستاذ / ${repName}\nالسلام عليكم ورحمة الله وبركاته،\n\nنهديكم أطيب تحياتنا ونتمنى لكم التوفيق المتواصل.\nنود أن نزف لكم خبر اكتمال تصنيع كافة المواد والواجهات الخاصة بمشروع (${projectName}) المتعلق بعرض السعر رقم (${qtnNo}) في ورشنا المركزية، وبأنها الآن قد اجتازت اختبارات الجودة وباتت جاهزة تماماً للتركيب.\n\nوبناءً عليه، نرجو منكم تأكيد النطاق الزمني المناسب لكم لاستقبال الفرق الفنية للبدء في التركيب، مع ضمان جاهزية الموقع من طرفكم (وصول التيار، التصاريح الأمنية إن لزمت، وخلو المسار).\n\nكما نذكركم بلطف بأنه -إن وُجد- التزام بدفعة ملزمة قبل التركيب بناءً على جدول العقد، فإنه يُرجى تصفيتها قبل جدولة الفرق تفادياً للتأخير.\n\nجزيل الشكر لاختياركم لنا ونتطلع لإخراج الموقع بأبهى حُلة.\n\nمع وافر الاحترام،،،\n\nإدارة الإنتاج والعمليات الميدانية\nشركة فنون الوليد للصناعة`;

        case 'handover': return `الرقم المرجعي: SL-HND-${qtnNo}\nالتاريخ: ${d}\n\nالموضوع: مستند وخطاب تسليم الأعمال النهائية للمشروع\n\nعناية السادة / ${fullClientName} المحترمين\nعناية الأستاذ / ${repName}\nالسلام عليكم ورحمة الله وبركاته،\n\nبكل فخر واعتزاز، نعلن لكم عن الانتهاء الكامل للمهام الموكلة إلينا وتوريد وتثبيت مكونات مشروع (${projectName}) المشار إليه بعرض سعر رقم (${qtnNo}).\n\nلقد قمنا بتنفيذ الأعمال بمنتهى الدقة والاحترافية مطابقة للمواصفات الفنية والتصاميم المعتمدة من قبلكم. نُقدّم لكم بموجب هذا الخطاب مستند التسليم الابتدائي/النهائي للأعمال؛ ونرجو من جهتكم الموقرة التفضل بمعاينة و فحص الموقع والمشغولات والمصادقة على استلامها.\n\nإن توقيعكم بالاستلام يُمثل شهادة ثقة نعتز بها وتأكيداً على مطابقة الأعمال، ويُمثل إيذاناً ببدء فترات الضمان في حال نص العقد عليها، وانتقال مسؤولية العناية بها لجهاتكم الكريمة.\n\nنشكر لكم إتاحة الفرصة لنا لنكون شركاء في نجاحكم، ونتطلع لخدمتكم بمشاريع لاحقة.\n\nتفضلوا بقبول التحيات والتقدير،،،\n\nإدارة المشاريع\nشركة فنون الوليد للصناعة`;

        case 'final_payment': return `الرقم المرجعي: SL-FNL-${qtnNo}\nالتاريخ: ${d}\n\nالموضوع: المطالبة الرسمية بالدفعة الختامية وتسوية المستحقات المالية\n\nعناية السادة / ${fullClientName} المحترمين\nعناية الأستاذ / ${repName}\nالسلام عليكم ورحمة الله وبركاته،\n\nتهنئكم "شركة فنون الوليد للصناعة" بباكورة الانتهاء من مشروع (${projectName}) وفقاً لعرض السعر رقم (${qtnNo})، والذي تم تسليم أعماله بنجاح ولله الحمد وفقاً للضوابط والمعايير المتفق عليها.\n\nوإذ نتطلع إلى إنهاء إغلاق الدفاتر المالية لهذا المشروع، نتقدم لكم اليوم بهذه المطالبة الرسمية المتعلقة بسداد (الدفعة الختامية المتبقية) نظير تسليم الأعمال.\n\nنأمل من إدارتكم المالية الموقرة سرعة تسوية هذه المستحقات وإصدار الإجراء اللازم لصرفها في حينه، تجسيداً لحسن المعاملة المتبادلة وتتويجاً لهذا الإنجاز المشترك الذي نأمل بأن يكون قد حاز على رضاكم المطلق.${phaseNote}\n\nنشكر حسن تفهكم وسرعة تجاوبكم باستمرار.\n\nوتقبلوا وافر وافر التحية والتقدير،،،\n\nإدارة الشؤون المالية والتحصيل\nشركة فنون الوليد للصناعة`;

        case 'warning': return `الرقم المرجعي: SL-WRN-${qtnNo}\nالتاريخ: ${d}\n\nالموضوع: إنذار نهائي ومخاطبة بضرورة تسوية الموقف المالي/التشغيلي\n\nإلى السادة / ${fullClientName} المحترمين\nالسلام عليكم ورحمة الله وبركاته، أما بعد:\n\nتشير سجلاتنا المحاسبية والتنسيقية لمشروع (${projectName}) المرتبط بعرض سعر رقم (${qtnNo})، بأننا التزمنا التزاماً عميقاً وصبرنا لفترة طويلة حيال الإخلال ببند (السداد للمستحقات / أو تعطيل الأعمال من جهتكم)، وسبق أن تمت مخاطبتكم مراراً بأسلوب ودي دون جدوى أو استجابة تصحيحية جادة.\n\nوحيث أن هذا التعطيل كبّد الشركة التزامات وتكاليف إضافية خارجة عن النطاق الموصوف؛ فإننا نوجه لكم هذا الخطاب كإشعار أخير وملزم بضرورة التجاوب وتسوية المبالغ أو المعوقات خلال (5 أيام عمل) كحد أقصى من استلامكم لهذا الخطاب.\n\nفي حال الانقضاء دون معالجة جذرية، تحتفظ "شركة فنون الوليد للصناعة" بجميع حقوقها القانونية والنظامية الكاملة باللجوء إلى الطرق الرسمية والقضائية المعمول بها في وزارة العدل والمحاكم المختصة لاسترداد الحقوق وفرض غرامات التأخير أو التعويضات الناتجة، ولنا الأمل ألا نضطر لهذه الخطوة و نكتفي بحسّهم المهني وتفهمكم.\n\nولكم منا الاحترام المتبادل،،،\n\nإدارة القانونية والمالية\nشركة فنون الوليد للصناعة`;

        case 'expire_quote': return `الرقم المرجعي: SL-EXP-${qtnNo}\nالتاريخ: ${d}\n\nالموضوع: إشعار بانتهاء صلاحية عرض السعر المرفوع\n\nعناية السادة / ${fullClientName} المحترمين\nعناية الأستاذ / ${repName}\nالسلام عليكم ورحمة الله وبركاته،\n\nبالإشارة لسعيكم المستمر لتطوير أعمالكم وطلبكم لتسعير خدماتنا المرتبطة بمشروع (${projectName}) والذي صدر بموجبه عرض السعر رقم (${qtnNo}).\n\nنلفت انتباهكم الراقي إلى أن المدة القانونية لصلاحية الأرقام والتكاليف والمواد المعروضة بالخطاب قد انقضت (حيث كانت المشروطية 15 إلى 30 يوماً كأقصى تقدير).\nوبطبيعة ديناميكية السوق واختلاف تكاليف المواد الخام، فإننا نعتذر عن استمرار الالتزام بالتسعيرة السابقة بعد هذا التاريخ.\n\nفي حال رغبتكم بتجديد الاهتمام والبدء بالمشروع، يُسعدنا دوماً خدمتكم، ولكننا سنكون بحاجة لإصدار تسعيرة مُحدّثة تعكس التغيرات الحالية للمواد.\n\nنأمل أن تجمعنا بكم مشاريع مشتركة دوماً.\n\nمع فائق الاحترام والتقدير،،،\n\nقسم دراسة المشاريع والمبيعات\nشركة فنون الوليد للصناعة`;

        default:
          return 'محتوى النموذج';
      }
    } else {
      const phaseNote = selectedPhaseLabel && selectedPhaseAmount > 0 
        ? `\n\nPlease be informed that the required payment amount for (${selectedPhaseLabel}) is: SAR ${selectedPhaseAmount}, which we kindly request you to transfer to finalize the approved actions.\n\n` 
        : '\n\n';

      switch(docTemplate) {
        case 'advance_payment': return `Reference: SL-ADV-${qtnNo}\nDate: ${d}\n\nSubject: Request for Advance Payment to Initiate Execution of Works\n\nAttn: Messrs. / ${fullClientName}\nAttn: Mr. / ${repName}\nPeace, mercy, and blessings of God be upon you,\n\nFirst of all, we would like to extend our sincere appreciation for your confidence in choosing "Al Waleed Fine Arts Industry Company" (Fnoon Al Waleed Industry) to manufacture and execute your project requirements for (${projectName}).\n\nPlease be informed that we have received and documented your approval of Quotation No. (${qtnNo}). To ensure immediate commencement of raw material procurement and fabrication scheduling to meet the agreed timeline, we kindly request the transfer of the advance payment specified in the approved quotation.${phaseNote}We are pleased to receive your bank transfer on the company's attached bank accounts. Please provide us with a copy of the transfer receipt to proceed immediately.\n\nThank you for your continuous cooperation and prompt action.\n\nBest regards,\n\nSales & Collection Department\nAl Waleed Fine Arts Industry Co.`;
        
        case 'due_payment': return `Reference: SL-DUE-${qtnNo}\nDate: ${d}\n\nSubject: Request for Payment of Outstanding Stage Instalment\n\nAttn: Messrs. / ${fullClientName}\nAttn: Mr. / ${repName}\nPeace, mercy, and blessings of God be upon you,\n\nBased on our mutual cooperation in executing the (${projectName}) project in accordance with approved Quotation No. (${qtnNo}), we are pleased to inform you that we have successfully completed and prepared the designated stage of works in line with our highest quality standards.\n\nAs per the agreed payment schedule, the instalment for this stage is now due for settlement.${phaseNote}We kindly request your esteemed team to arrange for the payment of the due amount at your earliest convenience to ensure subsequent project stages proceed smoothly and without any delays or halts to the overall project schedule.\n\nWe highly appreciate your continuous support and commitment to our shared goals.\n\nBest regards,\n\nSales & Collection Department\nAl Waleed Fine Arts Industry Co.`;
        
        case 'late_payment': return `Reference: SL-LT-${qtnNo}\nDate: ${d}\n\nSubject: Friendly Reminder Regarding Outstanding Past-Due Payment\n\nAttn: Messrs. / ${fullClientName}\nAttn: Mr. / ${repName}\nPeace, mercy, and blessings of God be upon you,\n\nWe send you our warmest greetings from "Al Waleed Fine Arts Industry Company", wishing you continued success and prosperity.\n\nWe would like to kindly bring to your attention that, upon reviewing our financial records for the (${projectName}) project under Quotation No. (${qtnNo}), we have not yet received the due instalment for the completed works, of which we have previously notified you.${phaseNote}Assuming this might have been an oversight amidst your busy business operations, we kindly request you to instruct your finance department to process the settlement of the due amount to maintain our fruitful progress and keep the execution on schedule.\n\nWe remain fully committed to completing the project to your utmost satisfaction upon the settlement of this financial balance.\n\nThank you for your understanding and prompt cooperation.\n\nBest regards,\n\nFinance Department & Project Management\nAl Waleed Fine Arts Industry Co.`;

        case 'site_prep': return `Reference: SL-PRP-${qtnNo}\nDate: ${d}\n\nSubject: Notice and Request for Site Readiness Prior to Installation\n\nAttn: Messrs. / ${fullClientName}\nAttn: Mr. / ${repName}\nPeace, mercy, and blessings of God be upon you,\n\nIn the framework of our mutual cooperation to commence the (${projectName}) project based on Quotation No. (${qtnNo}), and in our pursuit of executing the installation works with the highest level of professionalism and speed:\n\nWe would like to inform you of the necessity of preparing the site to receive our technical installation teams. This includes ensuring the installation facade or target area is completely clear of any obstacles, providing necessary electrical connections, and issuing any required temporary access permits for our vehicles and technicians.\n\nPlease notify us in writing or via an official email once the site is fully prepared on your end, so that your project can be immediately scheduled for final field installation works.\n\nThank you for your active cooperation in ensuring the highest quality of deliverables.\n\nBest regards,\n\nEngineering & Operations Department\nAl Waleed Fine Arts Industry Co.`;

        case 'design_approval': return `Reference: SL-APP-${qtnNo}\nDate: ${d}\n\nSubject: Request for Review and Final Approval of Technical Designs\n\nAttn: Messrs. / ${fullClientName}\nAttn: Mr. / ${repName}\nPeace, mercy, and blessings of God be upon you,\n\nFurther to our agreement regarding the (${projectName}) project pursuant to Quotation No. (${qtnNo}), we are pleased to attach herewith the proposed final technical designs and shop drawings for your review and approval.\n\nWe kindly request you to carefully review the dimensions, colors, and materials indicated in the designs. Please note that the fabrication and manufacturing process is entirely built upon this written approval.\n\nKindly be informed that any modifications requested after this written approval will require a new cost and timeline evaluation in accordance with our production schedule.\n\nWe look forward to your prompt response so we may proceed with the fabrication phases without delay.\n\nBest regards,\n\nDesign & Sales Department\nAl Waleed Fine Arts Industry Co.`;

        case 'installation_ready': return `Reference: SL-RDY-${qtnNo}\nDate: ${d}\n\nSubject: Notification of Production Completion and Field Installation Readiness\n\nAttn: Messrs. / ${fullClientName}\nAttn: Mr. / ${repName}\nPeace, mercy, and blessings of God be upon you,\n\nWe send you our warmest greetings, wishing you continued success.\nWe are delighted to inform you that the manufacturing and fabrication of all signages, structures, and facades for the (${projectName}) project under Quotation No. (${qtnNo}) have been fully completed at our central workshops. The products have successfully passed all quality assurance tests and are now completely ready for installation.\n\nAccordingly, we kindly request you to confirm the most suitable schedule on your end to receive our technical teams, while ensuring that the site is fully prepared (power supply available, security access permits cleared, and installation area accessible).\n\nWe also kindly remind you that any due payment required before installation according to the agreement terms should be settled prior to scheduling the installation teams to avoid any delays.\n\nThank you for choosing Al Waleed. We look forward to executing a stellar installation.\n\nBest regards,\n\nProduction & Field Operations Department\nAl Waleed Fine Arts Industry Co.`;

        case 'handover': return `Reference: SL-HND-${qtnNo}\nDate: ${d}\n\nSubject: Project Handover Document and Completion Certificate\n\nAttn: Messrs. / ${fullClientName}\nAttn: Mr. / ${repName}\nPeace, mercy, and blessings of God be upon you,\n\nWith great pride and pleasure, we announce the complete and successful execution of all assigned works, delivery, and installation for the (${projectName}) project under Quotation No. (${qtnNo}).\n\nThe works have been executed with the utmost precision and professionalism, conforming fully to the technical specifications and designs approved by your esteemed team. We hereby submit this official handover document for your inspection, review, and endorsement of successful completion.\n\nYour signature on this handover represents a certificate of trust we cherish, confirming project conformity, and marking the official start of the warranty period (if stipulated) as well as the transition of care to your side.\n\nThank you for giving us the opportunity to be partners in your success. We look forward to serving you in future projects.\n\nBest regards,\n\nProject Management Department\nAl Waleed Fine Arts Industry Co.`;

        case 'final_payment': return `Reference: SL-FNL-${qtnNo}\nDate: ${d}\n\nSubject: Official Invoice for Final Payment and Account Reconciliation\n\nAttn: Messrs. / ${fullClientName}\nAttn: Mr. / ${repName}\nPeace, mercy, and blessings of God be upon you,\n\n"Al Waleed Fine Arts Industry Company" congratulates you on the successful completion of the (${projectName}) project in accordance with Quotation No. (${qtnNo}), the works of which have been delivered successfully.\n\nAs we work towards closing the financial books for this completed project, we submit this official request for the settlement of the remaining final payment instalment.\n\nWe kindly request your esteemed finance department to expedite the processing of this payment, as a testament to our fruitful mutual business and to culminate this shared achievement.${phaseNote}\n\nThank you for your understanding and prompt response.\n\nBest regards,\n\nFinance & Collection Department\nAl Waleed Fine Arts Industry Co.`;

        case 'warning': return `Reference: SL-WRN-${qtnNo}\nDate: ${d}\n\nSubject: Final Written Warning and Demand for Financial / Operational Settlement\n\nTo: Messrs. / ${fullClientName}\nPeace, mercy, and blessings of God be upon you,\n\nOur accounting and project coordination records for the (${projectName}) project under Quotation No. (${qtnNo}) indicate that, despite our deep commitment and extensive patience, there is an ongoing breach regarding (settlement of outstanding dues / or obstruction of operations from your side), about which we have repeatedly contacted you in a friendly manner without receiving a serious corrective response.\n\nSince this delay has caused our company additional financial obligations and logistical costs outside the agreed scope, we hereby issue this final and binding notification demanding immediate response and settlement of all dues or obstacles within a maximum of (5 working days) from the receipt of this letter.\n\nShould this period elapse without resolution, "Al Waleed Fine Arts Industry Company" reserves its full legal and system rights to resort to formal and judicial procedures through the Ministry of Justice and competent courts to recover all dues, impose delay penalties, and seek damages. We sincerely hope we do not have to resort to such actions and count on your high sense of professionalism.\n\nRespectfully,\n\nLegal & Finance Department\nAl Waleed Fine Arts Industry Co.`;

        case 'expire_quote': return `Reference: SL-EXP-${qtnNo}\nDate: ${d}\n\nSubject: Notice of Expiry of Submitted Price Quotation\n\nAttn: Messrs. / ${fullClientName}\nAttn: Mr. / ${repName}\nPeace, mercy, and blessings of God be upon you,\n\nWith reference to your interest in our services and your request for a price quotation for the (${projectName}) project, under which Quotation No. (${qtnNo}) was issued:\n\nWe kindly draw your attention to the fact that the validity period for the costs, materials, and rates proposed in the quotation has now expired (the validity period being 15 to 30 days maximum from the date of issue).\nDue to the dynamic nature of the market and fluctuations in the costs of raw materials, we regret to inform you that we cannot commit to the previously quoted prices beyond this date.\n\nShould you wish to renew your interest and proceed with the project, we will be absolutely delighted to serve you. However, we will need to issue a revised and updated quotation reflecting current market rates.\n\nWe hope to partner with you in upcoming opportunities.\n\nBest regards,\n\nProject Costing & Sales Department\nAl Waleed Fine Arts Industry Co.`;

        default:
          return 'Template Content';
      }
    }
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
            <title>طباعة خطاب المبيعات</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
              body { 
                margin: 0; 
                padding: 0; 
                background: white; 
                font-family: 'Tajawal', sans-serif !important;
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
              }
              @page { size: A4; margin: 20mm; }
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
    
    const docName = templatesList[docCategory]?.find((t: any) => t.id === docTemplate)?.name || docTemplate;
    const quote = quotes.find(q => q.id === selectedQuoteId);
    const isRep = user?.role === 'Sales Rep';
    
    const payload = {
      title: docName,
      clientName: quote?.clientName || 'غير محدد',
      quoteId: selectedQuoteId,
      quotationNumber: quote?.quotationNumber || quote?.id || '',
      exportedBy: user.username,
      exportedAt: new Date().toISOString(),
      content: docContent,
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
        alert('حدث خطأ أثناء الحفظ.');
      }
    } catch(e) {
      alert('فشل في التصدير، يرجى المحاولة مرة أخرى.');
    }
  };

  const handleRequestApproval = async () => {
    if (!selectedQuoteId) { alert("يرجى اختيار عرض السعر المعتمد أولاً."); return; }
    
    const docName = templatesList[docCategory]?.find((t: any) => t.id === docTemplate)?.name || docTemplate;
    const quote = quotes.find(q => q.id === selectedQuoteId);
    
    const payload = {
      title: docName,
      clientName: quote?.clientName || 'غير محدد',
      quoteId: selectedQuoteId,
      quotationNumber: quote?.quotationNumber || quote?.id || '',
      exportedBy: user.username,
      exportedAt: new Date().toISOString(),
      content: docContent,
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
            <title>طباعة خطاب المبيعات - أرشيف</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
              body { 
                margin: 0; 
                padding: 0; 
                background: white; 
                font-family: 'Tajawal', sans-serif !important;
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
              }
              @page { size: A4; margin: 20mm; }
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
          @page { margin: 20mm; size: A4; }
        }
      `}</style>
      
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 print:hidden">
         <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600">
           <PenTool className="w-8 h-8" />
         </div>
         <div>
           <h2 className="text-xl font-black text-indigo-800">خطابات المبيعات والمطالبات</h2>
           <p className="text-slate-500 mt-1 text-sm font-bold">إصدار الخطابات والمستندات السريعة بصيغة قانونية وفقاً لبيانات عروض الأسعار والعملاء.</p>
         </div>
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
                setDocCategory(e.target.value);
                setDocTemplate(templatesList[e.target.value][0].id);
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
              {templatesList[docCategory]?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
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
                      <option key={ph.id} value={ph.id}>{ph.stageName} - {ph.amount} ريال ({ph.status})</option>
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
          <p className="text-center text-[10px] text-slate-400 mb-2 print:hidden font-bold">معاينة قابلة للتعديل - انقر على النص للتعديل وإضافة بنودك مباشرة قبل الطباعة</p>
          <div className="max-w-[210mm] mx-auto print:hidden">
            <RichTextToolbar />
            
            {/* AI Professional Translation Bar */}
            <div className="bg-white border-t border-slate-100 p-3 flex flex-wrap items-center justify-between gap-2 rounded-b-xl mb-4 shadow-sm text-right" dir="rtl">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                ✨ {lang === 'ar' ? 'ترجمة الخطاب الفورية (Gemini AI):' : 'Instant AI Translation (Gemini):'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleTranslateLetter("ar")}
                  disabled={isTranslating}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isTranslating ? 'جاري الترجمة...' : 'ترجمة إلى العربية 🇸🇦'}
                </button>
                <button
                  onClick={() => handleTranslateLetter("en")}
                  disabled={isTranslating}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isTranslating ? 'Translating...' : 'Translate to English 🇬🇧'}
                </button>
              </div>
            </div>
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
                          {new Date(log.exportedAt).toLocaleString('ar-SA')}
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
                  <img src="https://pbs.twimg.com/media/HE46IrybcAAMq7L?format=png&name=small" referrerPolicy="no-referrer" className="h-12 object-contain" alt="Logo" />
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
                <span className="font-bold font-mono text-slate-700">{new Date(confirmTargetLog.exportedAt).toLocaleDateString('ar-SA')}</span>
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
