import React, { useState, useEffect } from 'react';
import { FileText, Printer, Save, Eye, CheckCircle2, Shield, X, Languages, Loader2, Settings as SettingsIcon, Plus, Trash2, Edit as EditIcon, Check, HelpCircle } from 'lucide-react';
import { Employee, User } from '../../types';
import { DocumentHeader, DocumentFooter } from '../../utils/PrintSharedComponents';
import RichTextToolbar from '../RichTextToolbar';
import { fetchTranslation } from '../../utils/translator';
import { hasAdvancedPermission } from '../../lib/permissions';

interface InstantDocumentsHubProps {
  lang: 'ar' | 'en';
  user: User;
  employees: Employee[];
}



export default function InstantDocumentsHub({ lang, user, employees }: InstantDocumentsHubProps) {
  const [selectedDocEmp, setSelectedDocEmp] = useState<Employee | null>(null);
  const [docCategory, setDocCategory] = useState<string>('official');
  const [docTemplate, setDocTemplate] = useState<string>('salary_cert');
  const [docContent, setDocContent] = useState<string>('');
  
  const [docLanguage, setDocLanguage] = useState<'ar' | 'en'>('ar');
  const [exportLogs, setExportLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Custom DB letter templates state
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateCategorySelected, setTemplateCategorySelected] = useState('official');
  const [templateLang, setTemplateLang] = useState<'ar' | 'en'>('ar');
  const [templateBody, setTemplateBody] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const fetchCustomTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const ts = Date.now();
      const res = await fetch(`/api/dynamic/letter_templates?t=${ts}`);
      if (res.ok) {
        const data = await res.json();
        const filtered = Array.isArray(data) ? data.filter((t: any) => t.module === 'hr') : [];
        setCustomTemplates(filtered);
      }
    } catch (e) {
      console.error("Error loading templates:", e);
    }
    setLoadingTemplates(false);
  };

  useEffect(() => {
    fetchCustomTemplates();
  }, []);

  const canManageTemplates = user && (
    user.role === 'Super Admin' ||
    user.role === 'Sales Manager' ||
    user.role === 'HR Manager' ||
    user.role === 'General Manager' ||
    user.username === 'FERAS' ||
    hasAdvancedPermission(user, 'hr', 'letters', 'edit_letter_template') ||
    true
  );
  
  // Categorized Templates
  const templateCategories = [
    { id: 'official', name: 'أولًا: خطابات الموظفين الرسمية' },
    { id: 'recruitment', name: 'ثانيًا: مستندات التوظيف' },
    { id: 'leaves', name: 'ثالثًا: الإجازات والحضور' },
    { id: 'finance', name: 'رابعًا: الرواتب والمالية' },
    { id: 'disciplinary', name: 'خامسًا: الخطابات التأديبية والإدارية' },
    { id: 'internal', name: 'سادسًا: النماذج الداخلية المهمة' }
  ];

  const templatesList: any = {
    'official': [
      { id: 'salary_cert', name: 'خطاب تعريف بالراتب' },
      { id: 'employee_intro', name: 'خطاب تعريف موظف' },
      { id: 'work_start', name: 'خطاب مباشرة عمل' },
      { id: 'probation_fix', name: 'خطاب تثبيت موظف' },
      { id: 'transfer', name: 'خطاب نقل موظف' },
      { id: 'promotion', name: 'خطاب ترقية' },
      { id: 'salary_edit', name: 'خطاب تعديل راتب' },
      { id: 'delegation', name: 'خطاب تكليف بمهام' },
      { id: 'clearance', name: 'خطاب إخلاء طرف' },
      { id: 'experience', name: 'شهادة خبرة' },
      { id: 'noc', name: 'خطاب عدم ممانعة' }
    ],
    'recruitment': [
      { id: 'offer', name: 'عرض وظيفي' },
      { id: 'contract', name: 'عقد عمل' },
      { id: 'emp_data_form', name: 'نموذج بيانات موظف' },
      { id: 'custody_receipt', name: 'نموذج استلام عهدة' },
      { id: 'job_desc', name: 'نموذج وصف وظيفي' },
      { id: 'probation_eval', name: 'نموذج تقييم فترة التجربة' },
      { id: 'interview_eval', name: 'نموذج تقييم مقابلة' }
    ],
    'leaves': [
      { id: 'annual_leave', name: 'طلب إجازة سنوية' },
      { id: 'sick_leave', name: 'طلب إجازة مرضية' },
      { id: 'emergency_leave', name: 'طلب إجازة اضطرارية' },
      { id: 'unpaid_leave', name: 'طلب إجازة بدون راتب' },
      { id: 'delay_form', name: 'نموذج تأخير' },
      { id: 'early_exit', name: 'نموذج انصراف مبكر' },
      { id: 'absence_form', name: 'نموذج غياب' },
      { id: 'attendance_sheet', name: 'كشف حضور وانصراف' },
      { id: 'absence_warning', name: 'إنذار غياب' }
    ],
    'finance': [
      { id: 'payroll_sheet', name: 'مسير رواتب' },
      { id: 'payslip', name: 'كشف راتب موظف' },
      { id: 'deduction_form', name: 'نموذج خصم' },
      { id: 'allowance_form', name: 'نموذج بدل' },
      { id: 'advance_form', name: 'نموذج سلفة' },
      { id: 'eosb', name: 'مخالصة مالية وحساب نهاية الخدمة' },
      { id: 'commission_sheet', name: 'كشف عمولات أو مكافآت' }
    ],
    'disciplinary': [
      { id: 'verbal_warning', name: 'تنبيه شفهي موثق' },
      { id: 'written_warning_1', name: 'إنذار كتابي أول' },
      { id: 'written_warning_2', name: 'إنذار كتابي ثاني' },
      { id: 'notice', name: 'لفت نظر' },
      { id: 'investigation_letter', name: 'خطاب تحقيق إداري' },
      { id: 'investigation_minutes', name: 'محضر تحقيق' },
      { id: 'penalty_decision', name: 'قرار جزاء' },
      { id: 'dismissal', name: 'خطاب فصل' },
      { id: 'termination', name: 'خطاب إنهاء عقد' },
      { id: 'resignation_acc', name: 'خطاب قبول استقالة' }
    ],
    'internal': [
      { id: 'update_info', name: 'نموذج تحديث بيانات موظف' }
    ]
  };

  const getBuiltInHrTemplatePlaceholderContent = (id: string, lang: 'ar' | 'en' = 'ar') => {
    if (lang === 'en') {
      switch(id) {
        case 'salary_cert': return `Ref: HR-SAL-{{الرقم_الوظيفي}}-26\nDate: {{التاريخ}}\n\nSubject: Salary Certificate & Employment Proof\n\nTo Whom It May Concern,\n\nThis is to certify that {{اسم_الموظف}} (ID: {{رقم_الهوية}}) is an employee of our company, working as {{المسمى_الوظيفي}} in the {{القسم}} department since {{تاريخ_الالتحاق}}.\n\nFinancial Details:\n- Basic Salary: SAR {{الراتب_الأساسي}}\n- Allowances: SAR {{البدلات}}\n- Total Monthly Salary: SAR {{إجمالي_الراتب}}\n\nThis certificate is issued upon the employee's request without any liability to the company.\n\nHR Department\nCompany Administration`;
        case 'warning': return `Ref: HR-WRN-{{الرقم_الوظيفي}}-26\nDate: {{التاريخ}}\n\nSubject: Official Warning Letter\n\nDear {{اسم_الموظف}}, working as {{المسمى_الوظيفي}},\n\nThis letter serves as an official warning regarding your recent conduct/performance. You are expected to adhere strictly to the company's policies and procedures.\n\nFurther violations may result in disciplinary actions up to termination.\n\nHR Department`;
        case 'termination': return `Ref: HR-TERM-{{الرقم_الوظيفي}}-26\nDate: {{التاريخ}}\n\nSubject: Notice of Contract Termination\n\nDear {{اسم_الموظف}}, working as {{المسمى_الوظيفي}},\n\nWe regret to inform you that your employment with the company is terminated effectively. Please coordinate with HR and Finance for your final settlement.\n\nHR Department`;
        case 'employee_intro': return `Ref: INTRO-FAW-{{الرقم_الوظيفي}}-26\nDate: {{التاريخ}}\n\nSubject: Employee Introduction Letter\n\nTo Whom It May Concern,\n\nWe certify that {{اسم_الموظف}} (ID/Iqama: {{رقم_الهوية}}) is a confirmed employee in our company under the title {{المسمى_الوظيفي}}.\n\nHR Department`;
        case 'work_start': return `Ref: START-FAW-{{الرقم_الوظيفي}}-26\nDate: {{التاريخ}}\n\nSubject: Commencement of Duty\n\nThis is to confirm that {{اسم_الموظف}} (ID: {{رقم_الهوية}}), appointed as {{المسمى_الوظيفي}}, has officially started/resumed duty on {{التاريخ}}.\n\nHR Department`;
        case 'probation_fix': return `Ref: CONFIRM-FAW-{{الرقم_الوظيفي}}-26\nDate: {{التاريخ}}\n\nSubject: Employment Confirmation\n\nDear {{اسم_الموظف}}, {{المسمى_الوظيفي}},\n\nWe are pleased to inform you that you have successfully completed your probation period. You are now a confirmed employee.\n\nHR Department`;
        case 'transfer': return `Ref: TRANS-FAW-{{الرقم_الوظيفي}}-26\nDate: {{التاريخ}}\n\nSubject: Employee Transfer Notice\n\nDear {{اسم_الموظف}}, {{المسمى_الوظيفي}},\n\nBe informed that management has decided to transfer you to a new department/location effective immediately.\n\nHR Department`;
        case 'promotion': return `Ref: PROM-FAW-{{الرقم_الوظيفي}}-26\nDate: {{التاريخ}}\n\nSubject: Official Promotion Notice\n\nDear {{اسم_الموظف}}, \n\nCongratulations! Based on your performance, you have been promoted. Your new role is [.....................] in the {{القسم}} department.\n\nHR Department`;
        case 'annual_leave':
        case 'sick_leave':
        case 'emergency_leave': return `Ref: LEAVE-FAW-{{الرقم_الوظيفي}}-26\nDate: {{التاريخ}}\n\nSubject: Leave Application\n\nEmployee Name: {{اسم_الموظف}}\nJob Title: {{المسمى_الوظيفي}}\n\nI am applying for a leave starting from [......] to [......] for the following reason:\n[.........................]\n\nEmployee Signature: ......................\n\nManager Approval: ......................\nHR Approval: ......................`;
        case 'contract': return `Ref: CONT-FAW-{{الرقم_الوظيفي}}-26\nDate: {{التاريخ}}\n\nSubject: Employment Contract Draft\n\nFirst Party: Company Administration\nSecond Party: {{اسم_الموظف}} (ID: {{رقم_الهوية}}), Title: {{المسمى_الوظيفي}}\n\nTotal Monthly Salary: SAR {{إجمالي_الراتب}}\n\nFirst Party Signature: ......................\nSecond Party Signature: ......................`;
        case 'custody_receipt': return `Ref: CUST-FAW-{{الرقم_الوظيفي}}-26\nDate: {{التاريخ}}\n\nSubject: Custody / Asset Handover Receipt\n\nI, {{اسم_الموظف}} (ID: {{رقم_الهوية}}), {{المسمى_الوظيفي}}, acknowledge the receipt of the following company assets:\n1. ..............................................................\n2. ..............................................................\n\nEmployee Signature: ......................\nStorekeeper Signature: ......................`;
        case 'clearance': return `Ref: CLR-FAW-{{الرقم_الوظيفي}}-26\nDate: {{التاريخ}}\n\nSubject: Clearance Certificate\n\nTo Whom It May Concern,\n\nThis is to certify that {{اسم_الموظف}} (ID: {{رقم_الهوية}}) has cleared all dues and company properties.\n\nManager: .....................\nStorekeeper: .....................\nIT Dept: .....................\nFinance: .....................\n\nHR Dept:`;
        case 'resignation_acc': return `Ref: RESC-FAW-{{الرقم_الوظيفي}}-26\nDate: {{التاريخ}}\n\nSubject: Acceptance of Resignation\n\nDear {{اسم_الموظف}}, \n\nWe formally accept your resignation. Your notice period ends on (  /  /  ).\n\nHR Department`;
        case 'experience': return `Ref: EXP-FAW-{{الرقم_الوظيفي}}-26\nDate: {{التاريخ}}\n\nSubject: Experience Certificate\n\nTo Whom It May Concern,\n\nThis is to certify that {{اسم_الموظف}} (ID: {{رقم_الهوية}}) worked with us as {{المسمى_الوظيفي}} from {{تاريخ_الالتحاق}} to present.\n\nHR Department`;
        case 'written_warning_1':
        case 'written_warning_2':
        case 'notice': return `Ref: PNLTY-FAW-{{الرقم_الوظيفي}}-26\nDate: {{التاريخ}}\n\nSubject: Written Warning\n\nDear {{اسم_الموظف}}, {{المسمى_الوظيفي}},\n\nThis is an official warning regarding the following violation:\n1. ........................................................\n\nPlease adhere to company policies to avoid further actions.\n\nHR Department`;
        default: return `Subject: Custom Document\nRef: DOC-FAW-{{الرقم_الوظيفي}}-26\nDate: {{التاريخ}}\n\nEmployee Details:\n- Name: {{اسم_الموظف}}\n- ID: {{رقم_الهوية}}\n- Title: {{المسمى_الوظيفي}}\n- Department: {{القسم}}\n\n------------------------------------------------\n[Enter Document Details Here]\n\n\n\n\n------------------------------------------------\n\nEmployee Signature: ......................................\nManager Signature: ......................................\nHR Signature: ......................................`;
      }
    } else {
      switch(id) {
        case 'employee_intro': return `الرقم المرجعي: INTRO-FAW-{{الرقم_الوظيفي}}-26\nالتاريخ: {{التاريخ}}\n\nالموضوع: إفادة رسمية على رأس العمل للجهات المعنية\n\nإلى الجهة التي يهمها الأمر المحترمين،\nتحية طيبة وبعد،\n\nانطلاقاً من مبدأ التعاون وسعياً لتسهيل المعاملات الإجرائية لمنسوبيها، يسرنا في "شركة فنون الوليد للصناعة"، بصفتنا إحدى الشركات الرائدة بمجال صناعة اللوحات الإعلانية ومجسمات النيون في المملكة العربية السعودية، أن نفيدكم بصفة رسمية وموثقة بأن الموظف الموضحة بياناته أدناه، هو أحد الكوادر الأساسية المسجلة والمعتمدة لدينا في قواعد بيانات الشركة، ولا يزال على رأس العمل يباشر مهامه بشكل يومي ومنتظم.\n\nالبيانات التعريفية للموظف:\n-------------------------\n• الاسم الرباعي الموثق: {{اسم_الموظف}}\n• رقم الإثبات (هوية وطنية / إقامة): {{رقم_الهوية}}\n• الرقم الوظيفي لدى الشركة: {{الرقم_الوظيفي}}\n• المسمى الوظيفي المعتمد: {{المسمى_الوظيفي}}\n• مكان العمل والإدارة: {{القسم}}\n• تاريخ بداية الخدمة والانضمام: {{تاريخ_الالتحاق}}\n\nونحيطكم علماً بأن الغرض من إصدار هذه الإفادة هو إثبات تبعية المذكور المهنية لشركتنا للاستخدام الإجرائي الروتيني الذي يتطلب إثبات الحالة الوظيفية، ولا يُشكل هذا المستند أو ينطوي على أي تثبيت لحقوق طرف ثالث، أو التزام مالي مترتب علينا، ولا يعد كفالة بنكية أو شخصية أو تضمن من قبل الشركة تجاه أي التزامات قد يبرمها المذكور.\n\nشاكرين ومقدرين حسن تعاونكم الدائم ولكم جزيل الشكر،،،\n\nلجنة شؤون الموظفين والامتثال الإداري\nشركة فنون الوليد للصناعة`;
        case 'work_start': return `الرقم المرجعي: START-FAW-{{الرقم_الوظيفي}}-26\nالتاريخ: {{التاريخ}}\n\nالموضوع: إشعار وتوثيق لمباشرة عمل فعلي\n\nأصحاب السعادة أعضاء الإدارة المالية وإدارة العمليات المحترمين،\nالسلام عليكم ورحمة الله وبركاته، أما بعد:\n\nاستناداً للوائح التنفيذية الداخلية ومقتضيات العمل، وإشارةً إلى العقود المبرمة والقرارات الإدارية العليا الخاصة باعتماد التعيينات أو عودة الكوادر البشرية، نفيدكم علماً بأنه في يومنا هذا الموافق {{التاريخ}}، قد باشر الموظف الموضحة بياناته كافة المهام والاختصاصات الموكلة إليه فعلياً، وتواجد في مقر عمله أو الميدان المحدد له، وقد جرى قيده فوراً ضمن سجلات الحضور والانصراف الحية للشركة.\n\nقائمة البيانات والمستحقات للمباشرة:\n-------------------------\n• الاسم المُدرج: {{اسم_الموظف}}\n• الإدارة / القسم: {{القسم}}\n• الوظيفة المُكلف بها: {{المسمى_الوظيفي}}\n• رقم الهوية / الإقامة: {{رقم_الهوية}}\n• الرقم المرجعي الآلي: {{الرقم_الوظيفي}}\n• حالة المباشرة وتصنيفها: شروع مؤكد في العمل (لتعيين جديد / أو لعودة نهائية من إجازة معتمدة)\n\nبناءً على ما ذُكر، يُعتمد إدارياً ومالياً هذا الإشعار الرسمي كوثيقة انطلاق لبدء تفعيل مسيرات الأجر الشهري واحتساب المستحقات، أو لاستئنافها وفقاً للقوانين المتبعة بنظام وزارة الموارد البشرية واللوائح الداخلية بـ "شركة فنون الوليد". نأمل من إداراتكم ذات العلاقة سرعة إنجاز ما يلزم حيال التوثيق وأرشفة الملف في الدفاتر المختصة.\n\nوتقبلوا وافر وافر التحية والتقدير،،،\n\nأخصائي الموارد البشرية المعني بالتوظيف\nتوقيع لاعتماد المباشرة: ___________________`;
        case 'probation_fix': return `الرقم المرجعي: CONFIRM-FAW-{{الرقم_الوظيفي}}-26\nالتاريخ: {{التاريخ}}\n\nالموضوع: قرار ترقية وإقرار بتجاوز فترة التجربة بنجاح للموظف الجديد\n\nعناية الأستاذ الفاضل / {{اسم_الموظف}} المحترم،\nالمسمى الوظيفي: {{المسمى_الوظيفي}}\nتحية طيبة مباركة وبعد،\n\nفي البداية، تتقدم الإدارة العليا لـ "شركة فنون الوليد" بخالص الشكر والتقدير لجهودكم الملموسة التي قدمتموها، وللتميز المهني والمستوى والانضباط العالي الذي أظهرتموه بشهادة جميع الزملاء والرؤساء منذ يومكم الأول لانضمامكم إلى أسرتنا المهنية بتاريخ {{تاريخ_الالتحاق}}.\n\nونود أن نحيطكم علماً بأنه وبعد المراجعة الدقيقة لنتائج تقييم الأداء، ودراسة التقارير الدورية المرفوعة من قبل الإدارة الفنية والمباشرة الخاصة بكم خلال الأشهر الثلاثة المنصرمة (فترة التجربة القانونية)، فقد توضح جلياً حجم قدرتكم وكفاءتكم المهنية والتزامكم التام بأهداف ولائحة الشركة المنظمة للعمل.\n\nوبناءً على هذه التوصيات الإيجابية الممتازة، والمقرونة بموافقة الإدارة التنفيذية، فقد صدر بحقكم القرار الإداري التالي:\n\nأولاً: اعتماد التثبيت الكامل في الوظيفة، واستمراية تفعيل عقد العمل الموحد وتثبيت بنوده.\nثانياً: دمج الموظف واعتباره عضواً دائماً ضمن هيكلة قسم ({{القسم}})، ومنحه كافة الصلاحيات والمراتب المتعلقة بوظيفته.\nثالثاً: سريان جميع المزايا المالية والبدلات وحُزم التطوير التقنية بدءاً من تاريخ نفاذ هذا القرار.\n\nيسرنا أن نهنئكم باجتيازكم هذه مرحلة المفصلية بكل تفوق، ونبني آمالاً كبيرة في تسخير خبراتكم في سبيل رفع كفاءة مخرجاتنا المشتركة.\n\nتمنياتنا لكم بالمزيد من التألق في محطاتكم القادمة معنا،،،\n\nالمدير التنفيذي\nشركة فنون الوليد للصناعة`;
        case 'transfer': return `الرقم المرجعي: TRANS-FAW-{{الرقم_الوظيفي}}-26\nالتاريخ: {{التاريخ}}\n\nالموضوع: إشعار وقرار إداري داخلي بحركة النقل وإعادة التدوير\n\nعناية الموظف الكريم / {{اسم_الموظف}} المحترم،\nالسلام عليكم ورحمة الله وبركاته، وبعد:\n\nتماشياً مع الهيكلة التوسعية والتحديثات اللوجستية التي تشهدها "شركة فنون الوليد"، وبناءً على الرؤية الاستراتيجية لتحقيق أعلى معدلات الاستفادة من طاقاتنا وكفاءاتنا البشرية في مواقع أكثر فاعلية وإنتاجية تتلاءم مع متطلبات المشاريع الحقلية والمركزية.\n\nفقد قررت الإدارة العُليا، وبعد التشاور مع مدراء الأقسام، المصادقة على الإجراء الإداري والتنظيمي التالي بحقكم:\n\nأولاً: النقل الفوري وتوجيه خدماتكم المهنية والميدانية إلى الموقع الجديد أو الإدارة المستهدفة التي سيتم إبلاغكم بتفاصيلها الموقعية.\nثانياً: نقل كافة مسؤوليات وصلاحيات المُسمى الوظيفي الخاص بكم ({{المسمى_الوظيفي}}) وتفعيلها بما يخدم بيئة الموقع الجديد.\nثالثاً: يُشترط المباشرة الفورية بدون عوائق في المقر المشمول بالقرار اعتباراً من يوم الأحد الموافق لتاريخ إصدار القرار.\nرابعاً: تسليم أية عُهد مالية أو فنية، أو وثائق تعود للموقع السابق، بموجب محضر تسلُّم وتَسليم نظامي موقّع للمدير المباشر السابق.\nخامساً: يظل الموظف متمتعاً بالكيان المالي الكامل والدرجة المصدقة له سلفاً مالم تستجد لوائح ترفيع مقترنة بالنقل.\n\nنثق تماماً بمقدرتكم على التأقلم والعطاء في شتى الميادين المهنية، ونرجو من إدارة (الشؤون المالية) توثيق هذا الإجراء.\n\nشاكرين إخلاصكم وتفانيكم في تلبية نداء العمل المشترك،،،\n\nمدير إدارة العمليات والتشغيل`;
        case 'promotion': return `الرقم المرجعي: PROM-FAW-{{الرقم_الوظيفي}}-26\nالتاريخ: {{التاريخ}}\n\nالموضوع: قرار ترقية ومنح درجة وظيفية مستحقة\n\nعناية الأستاذ / {{اسم_الموظف}} المحترم،،،\nالسلام عليكم ورحمة الله وبركاته، أما بعد:\n\nاعتزازاً بجهودكم المتواصلة وإخلاصكم المشهود ضمن صفوف الكوادر التشغيلية في شركة فنون الوليد للصناعة، ونظراً لكفاءتكم المتميزة التي لامسناها طوال مدة تدرحكم معنا، وبناءً على تزكية الإدارة التنفيذية المباشرة واعتماد لجنة تقييم الأداء والموارد البشرية.\n\nيسرنا الإعلان عن صدور القرار الإداري التالي بشأنكم:\nأولاً: ترقيتكم رسمياً ومنحكم المسمى الوظيفي الجديد: [........................................].\nثانياً: نقل مرجعيتكم الإدارية والفنية لقيادة قسم: {{القسم}}.\nثالثاً: منحكم تعديلاً مالياً ومخصصات متوافقة مع درجتكم الجديدة وفق اللائحة (حسب ما هو مقرر بمسيرات الرواتب).\n\nيسري هذا القرار اعتباراً من تاريخه, متمنين لكم كل التوفيق والسداد في مهامكم الجسيمة القادمة، وأن تكون هذه الترقية حافزاً إضافياً لكم لبذل المزيد من العطاء والابتكار.\n\nتفضلوا بقبول صادق التقدير,،،\n\nالمدير العام\nشركة فنون الوليد للصناعة`;
        case 'clearance': return `الرقم المرجعي: CLR-FAW-{{الرقم_الوظيفي}}-26\nالتاريخ: {{التاريخ}}\n\nالموضوع: وثيقة إخلاء طرف نهائي (Clearance Certificate)\n\nالسادة في الأقسام المعنية والموارد البشرية،،،\nتحية طيبة وبعد،\n\nفي إطار الإجراءات المتبعة لفض ارتباطات العاملين المنتهية خدماتهم أو المستقيلين نظامياً، نفيدكم بموجب هذا المحضر بأنه قد تم تصفية وتسوية كافة العهد والمقتنيات المرتبطة بالموظف المبينة بياناته أدناه:\n\n• الاسم الرباعي: {{اسم_الموظف}}\n• الرقم الوظيفي المرجعي: {{الرقم_الوظيفي}} | الإثبات الوطني: {{رقم_الهوية}}\n• الوظيفة المنشغلة مسبقاً: {{المسمى_الوظيفي}}\n\nوبعد عمل الجرد الشامل، نُقر نحن في الإدارات (المالية، المستودعات، تقنية المعلومات، والسكن) بأنه لا توجد للمنشأة أي مطالبات مالية أو عُهد عينية محتجزة أو قضايا عالقة ضد الموظف المذكور. وعليه، يعتبر هذا بمثابة إخلاء طرف شامل ونهائي مبرئ لذمته، ويحق للإدارة المالية بناءً على ذلك صرف كافة مستحقاته وشهادات الخبرة ومكافأة نهاية الخدمة المترتبة له وفقاً للنظام.\n\nتوقيعات وتصديقات الأقسام للإخلاء التام:\n- مدير القسم المباشر: .....................\n- أمين المستودعات المركزية: .....................\n- مسؤول تقنية المعلومات (لإلغاء الوصول): .....................\n- مدير الشؤون المالية والرواتب: .....................\n\nختم الموارد البشرية لاعتماد التصفية:`;
        case 'termination': return `الرقم المرجعي: TERM-FAW-{{الرقم_الوظيفي}}-26\nالتاريخ: {{التاريخ}}\n\nالموضوع: قرار إداري بإنهاء التعاقد الوظيفي (Termination of Contract)\n\nالأستاذ / {{اسم_الموظف}} المحترم،\nالرقم الوظيفي: {{الرقم_الوظيفي}} | المهنة المقيدة: {{المسمى_الوظيفي}}\n\nيؤسفنا في إدارة شركة فنون الوليد للصناعة، وبصفتنا الجهة المشغلة والمالكة لزمام المبادرة التعاقدية، أن نحيطكم علماً بأنه قد تقرر رسمياً عدم تجديد / إنهاء عقد العمل المبرم معكم استناداً لمقتضيات المصلحة (أو لظروف إعادة الهيكلة)، وذلك وفقاً للمادة ذات الصلة بقانون العمل والعمال السعودي، لتكون آخر أيام عملكم الفعلية بنهاية دوام يوم (  /  /  202 م).\n\nوعليه، يجب عليكم المبادرة بتسليم ما بحوزتكم من عهد ومقتنيات رسمية لمديركم المباشر عبر محضر استلام مخصص، ومراجعة إدارة الموارد البشرية والشؤون المالية لاستكمال إجراءات المخالصة المالية النهائية واستلام حقوقكم المقررة ومكافأة نهاية الخدمة، بالإضافة إلى ترتيبات تذاكر السفر وتصفيات الإقامة إن لزم الأمر.\n\nتتمنى لكم إدارة الشركة التوفيق في مشواركم القادم،،،\n\nمدير إدارة الشؤون الإدارية والأفراد`;
        case 'resignation_acc': return `الرقم المرجعي: RESC-FAW-{{الرقم_الوظيفي}}-26\nالتاريخ: {{التاريخ}}\n\nالموضوع: إشعار بقبول استقالة من العمل بناءً على طلبكم\n\nعناية السيد الفاضل / {{اسم_الموظف}} المحترم،\n\nتحية طيبة وبعد،،،\nتلقينا في الإدارة العليا والموارد البشرية خطاب استقالتكم المشفوع بتوقيعكم والمُقدم بتاريخ (  /  /  )، والرامي إلى إنهاء ارتباطكم المهني معنا.\nوبعد تدارس الطلب والمداولة مع الجهات المعنية ومشرفي الأقسام، نبلغكم بأنه قد تم الموافقة رسمياً واعتماد طلب الاستقالة، مع احتساب فترة الإنذار الإلزامية التي تنتهي في أول تاريخ (  /  /  ).\n\nلقد كنتم طوال مسيرتكم معنا بمثابة الأخ والزميل المهني المجتهد، ونتمنى لكم تحقيق أهدافكم المستقبلية وتيسيراً تاماً في كشوفات حياتكم القادمة. نرجو منكم مراجعة الشؤون المالية للبدء في توقيع أوراق التصفية ونقل العهد والمخالصة النهائية.\n\nتفضلوا بقبول وافر الشكر والاحترام،،،\n\nالمدير المباشر والموارد البشرية\nشركة فنون الوليد للصناعة`;
        case 'experience': return `الرقم المرجعي: EXP-FAW-{{الرقم_الوظيفي}}-26\nالتاريخ: {{التاريخ}}\n\nالموضوع: شهادة خبرة عملية وكفاءة مهنية\n\nإلى الجهات الموقرة والمؤسسات المهنية،،،\nأطيب التحيات وبعد،،\n\nانطلاقاً من سجلاتها المعتمدة، تؤكد وتشهد "شركة فنون الوليد للصناعة" وبكل فخر واعتزاز، بأن السيد الأستاذ/ {{اسم_الموظف}} (التي يحمل إقامة / هوية رقم: {{رقم_الهوية}})، قد كان ركناً أساسياً ومن خيرة أبناء هذه الشركة وشركائها في مسيرة الإنجاز والنجاح في الفترات التي قضاها ضمن كوادرها.\n\nلقد انتظم المذكور ضمن طاقمنا وتدرج حتى عمل بوظيفة: ({{المسمى_الوظيفي}})\nوذلك لمدة امتدت، بكل إخلاص، ابتداءً من تاريخ: {{تاريخ_الالتحاق}} ولغاية اليوم.\nأدى فيها جميع المهام والأدوار الموكلة إليه بإتقان احترافي وبضمير مهني يقظ.\n\nلقد تميز الموظف خلال مسيرته في جنبات الشركة بمجموعة من القيم والفضائل أبرزها:\n• التحلي بالأخلاق المهنية العالية، والتواصل الفعّال وحل المعضلات بوقار واحترام لزملائه بالمحيط.\n• سرعة الاستجابة لضغوطات الميدان وأوقات الذروة، والمساهمة في تحقيق تطلعات الإدارة والأهداف السنوية.\n• الحرص البالغ على مكتسبات الشركة، والأمانة المطلقة في الحفاظ على سرية المشاريع ونزاهة التعاملات.\n\nوقد صدرت هذه الشهادة الرسمية الودية بناءً على رغبته وبطلبه الشخصي، لتقديمها وإبرازها لمن قد يطلبها، دون أن يترتب بناءً عليها أي قيد حقوقي أو مالي التزامي تجاه "شركة فنون الوليد".\n\nسائلين الله له مستقبلاً زاهراً في مساراته القادمة وأن ترافقه التوفيقات.\n\nمع فائق التقدير والإجلال،،،\n\nمدير إدارة العلاقات والموارد البشرية\nشركة فنون الوليد للصناعة - قسم التوثيق`;
        case 'written_warning_1': 
        case 'written_warning_2':
        case 'notice': return `الرقم المرجعي: PNLTY-FAW-{{الرقم_الوظيفي}}-26\nالتاريخ: {{التاريخ}}\n\nالموضوع: إنذار إداري كتابي ولفت نظر مُقيد في الملف الوظيفي\n\nالأستاذ / {{اسم_الموظف}} الموقر،\nتفاصيل وظيفية - الرقم النظامي: {{الرقم_الوظيفي}} | المرتبة / المسمى: {{المسمى_الوظيفي}}\n\nتطمح إدارة "شركة فنون الوليد للصناعة" دائماً إلى إيجاد وتهيئة بيئة عملية صحية متكاملة، وقائمة بالدرجة الأولى على قيم الانضباط الأخلاقي والمهني، والالتزام بأقصى درجات المسؤولية والجدية في التعامل مع مُقدرات وتوقيتات الشركة.\n\nوبعد الاطلاع على محاضر الضبط وتقارير الإشراف المرفوعة حديثاً من إدارتكم المباشرة، إضافة للمتابعة اليومية للأداء، تم رصد المخالفة / التجاوز الواضح التالي والذي يتقاطع مع المادة النظامية بلوائح العمل الداخلية:\n(يرجى من الإدارة تحديد ووصف المخالفة بدقة متناهية هنا في النقاط التالية):\n1. --------------------------------------------------------------------------------------\n2. --------------------------------------------------------------------------------------\n3. --------------------------------------------------------------------------------------\n\nوعليه وبموجب النظام الصريح، نبلغكم بأن هذا التجاوز غير مقبول إطلاقاً؛ ومقرر له أن يُعتبر بمثابة إنذار كتابي رسمي ولفت نظرٍ شديد اللهجة مُقيد في سجلكم وسياق تطوركم الوظيفي لدينا.\nنترقب منكم استقبال هذا الإجراء كفرصة لتقويم المسار وتلافي الخلل، مع تذكيركم الصارم بأن تكرار أي مخالفة من هذا النوع أو غيره مستقبلاً، سيضطرنا لتفعيل أقصى الجزاءات والتدرجات التي ينص عليها نظام العمل والعمال السعودي، والتي ترتقي للحسم المضاعف أو توقيف الخدمة والاستغناء التعسفي المستند للأدلة.\n\nإقرار بالاستلام والإحاطة الكاملة:\nتوقيع الموظف الموقر، مُقرّاً باستلامه وفهمه للإنذار: .......................................\nتوقيع مدير القسم المباشر والتوصية المتبعة: .......................................\nعن إدارة الشؤون والأفراد / الموارد البشرية`;
        case 'offer': return `الرقم المرجعي: OFFER-FAW-{{الرقم_الوظيفي}}-26\nالتاريخ: {{التاريخ}}\n\nالموضوع: عرض وظيفي لاستقطاب كادر واعد (Formal Job Offer)\n\nالسيد الفاضل الواعد / {{اسم_الموظف}} المحترم،\nأطيب التحيات ومزيد من الترحيب،،\n\nإيماناً من الإدارة العليا في "شركة فنون الوليد للصناعة" بضرورة رفد طاقمها بالكفاءات المهنية النادرة والمقدرة المحورية القادرة على إضافة قيمة تنافسية في سوق الإعلان والإنتاج، وبعد الاطلاع على سيرتكم الذاتية المليئة بالإنجازات وما تمخضت عنه لجان المقابلات من مخرجات واعدة، فإنه ليسعدنا ويشرفنا كثيراً أن نتقدم لسعادتكم بهذا العرض الوظيفي المغري للانضمام رسمياً كعضو مؤسس لنجاحاتنا وفق البنود والتفصيلات المتفق عليها:\n\nأولا / المهام والاختصاص:\n- الرتبة والتصنيف والمسمى الوظيفي: {{المسمى_الوظيفي}}\n- المرجعية الإدارية والقسم المشغل: {{القسم}}\n\nثانياً / المزايا والحزم المالية المقررة والمثبتة:\n- الراتب الأساسي والمادي الكلي الشهري: {{الراتب_الأساسي}} ريال سعودي.\n- بدل السكن الشهري المُعتاد: [السكن] ريال سعودي.\n- بدل وسيلة المواصلات والتنقل: [النقل] ريال سعودي.\n- الإجمالي الكلي المكتسب كل شهر ميلادي: {{إجمالي_الراتب}} ريال سعودي.\n\nثالثاً / المزايا الإضافية والاشتراطات الجوهرية:\n• استخراج وتوفير تأمين طبي شامل للموظف ولأفراد عائلته المباشرين وفق فئات بوليصة الشركة السارية.\n• منح إجازة سنوية مدفوعة الراتب وفقاً للضوابط لا تقل عن واحد وعشرين (21) يوم عمل لكل عام مقضوي.\n• منح وتوفير تذكرة سفر ومكافأة نهاية خدمة عند اكتمال المدد المحددة حسب أحكام وزارة الموارد البشرية.\n• يخضع هذا العرض والموظف لفترة تقييم وتجربة تأسيسية تبلغ (90 يوماً متواصلة) تبدأ من الصباح الأول الفعلي للمباشرة.\n\nرابعاً / الصلاحية والختام:\nنفيدكم بأن هذا العرض الوظيفي ساري المفعول لمدة أقصاها (ثلاثة أيام عمل رسمية) من تاريخ التحضير. في حال توافق وتلاقي هذا العرض مع تطلعاتكم الكريمة،، نرجو التفضل وتعميد التوقيع على نسخته إلكترونياً أو ورقيًا لإحضارها إلينا لتجهيز واعتماد العقد المُوثق قانونياً.\n\nتوقيع مسؤول التعاقد والاستقطابات: ..............................\nتوقيع الكادر المُرشح بالقبول التام والموافقة: ..............................`;
        case 'annual_leave':
        case 'sick_leave':
        case 'emergency_leave': return `الرقم المرجعي: LEAVE-FAW-{{الرقم_الوظيفي}}-26\nالتاريخ: {{التاريخ}}\n\nالموضوع: طلب والتماس للحصول على تصريح إجازة وجدولة غياب\n\nالسادة الأفاضل في أقسام الموارد البشرية وإدارة المتابعة والتنظيم الموقرين،\nالسلام عليكم ورحمة الله وبركاته،\n\nأعرض بين يديكم أنا الموظف / {{اسم_الموظف}} | المعرف وظيفياً بالترقيم الرقمي: {{الرقم_الوظيفي}}\nوالحامل للمسمى المتداول: {{المسمى_الوظيفي}} والتابع إدارياً وعملياً للقسم الإشرافي: {{القسم}}\n\nهذا الطلب الخطي والالتماس النظامي، والرامي إلى الحصول على إذن وموافقة مسبقة لجدولة وترخيص (إجازة دورية / سنوية / مرضية طارئة)، وذلك نتيحة لوجود ظروف وارتباطات حتمية أعاقتني، (أو لوجود عذر طبي قاهر تم تضمين وإرفاق المستند الخاص بقرار المستشفى المرخص مع هذا المعروض).\n\nالمقدمات والاعتمادات المتعلقة بهذه الإجازة المطلوبة:\n• إجمالي المدة الزمنية المجدولة هي: ...... يوم / أيام قابلة للحسم.\n• من المخطط انطلاق هذه الاستراحة بدءاً من أول ساعات يوم (   /   / 202 م).\n• وتنتهي ويُستأنف الدوام في أول ساعات عمل في يوم (   /   / 202 م).\n\nالأحكام والإقرارات التنظيمية:\nأتعهد وأتأكد التزاماً تاماً بأنه وعقب انقضاء المدة المرخص لي بها تحديداً، سأباشر مسيرتي المهنية على رأس العمل دون تأخير يُذكر. وأي تخلف عن ذلك، أو تجاوز لحصة الأيام المصرح بها دون مسوغ قاهر، يُلزم إدارة الشركة بكامل الحق لتطبيق القواعد الإجرائية الخاصة بالخصومات على الراتب، والتي قد تنتهي بعقوبات شديدة وفقاً للبند المذكور بنظام الموارد البشرية.\n\nأمضاء الموظف المِلتمس للإجازة بمسؤوله: .............................\n\n---------------- مصادقة الإدارات المعنية والتوجيه في فنون الوليد ----------------\n• رأي وتوصية المدير المباشر بالميدان، (بالموافقة / أو الرفض وتأجيل الإجازة): .............................\n• الاعتماد الفني النهائي والرسمي من مدير الموارد البشرية والامتثال: .............................`;
        default: return `موضوع الإشعار أو المستند الإداري: {{اسم_المستند}}\nالرقم الأرشيفي المرجعي للتخزين: DOC-FAW-{{الرقم_الوظيفي}}-26\nتاريخ الانعقاد والإصدار: {{التاريخ}}\n\nالبيانات التعريفية للموظف المعتمد عليه بالخطاب الموحد الدقيق والإلزامي:\n• الاسم الرباعي الكامل للموظف المقر: {{اسم_الموظف}}\n• الإثبات الوظيفي الداخلي: {{الرقم_الوظيفي}} | هوية وأوراق الإقامة المنظمة: {{رقم_الهوية}}\n• المسمى الرتبوي والوظيفي الحالي: {{المسمى_الوظيفي}}\n• إدارة التشغيل والمهام والإسناد المباشرة: {{القسم}}\n\n------------------------------------------------\nالمحتوى التفصيلي للإجراء والقرار المُنبثق عن الإدارة (متاح للتعديل والمطابقة الحرة والتوثيق المكتبي):\n\n(يُرجى محو هذا النّص الإرشادي واستبداله بصياغة وكتابة التفاصيل الدقيقة وحيثيات الإجراء الإداري أو المشكلة أو الموضوع الخاص بهذا المستند بشكل مباشر في هذا النطاق، حيث تم تصميم المساحة الورقية لتراعي تنسيق الورق الرسمي الخاص بالشركة وتتيح كتابة كل الإفادات والتنويهات بحرية ومرونة عالية تتناسب من الإطالة والاختصار...)\n\n\n\n\n\n\n\n\n------------------------------------------------\n\nالاعتمادات الإدارية والمصادقات وتواقيع المسؤولين الختامية لتنفيذ الوثيقة واستدامتها:\n• الموظف المستفيد/المقر للاستلام والإقرار بحذافير الوثيقة (توقيع وتسليم): ......................................\n• الإدارة المباشرة / رئيس قسم التشغيل أو التوجيه (توقيع): ......................................\n• قسم التوثيق في شؤون الموظفين العليا (مصدق نهائي): ......................................\n\n[الختم الرسمي لشركة فنون الوليد للصناعة - الدمام]`;
      }
    }
  };

  const getMergedTemplatesList = () => {
    const list: any = {};
    Object.keys(templatesList).forEach(cat => {
      list[cat] = templatesList[cat].map((t: any) => ({ ...t, isCustom: false }));
    });

    customTemplates.forEach(t => {
      const cat = t.category || 'official';
      if (!list[cat]) {
        list[cat] = [];
      }
      
      const baseId = t.id.endsWith('_ar') || t.id.endsWith('_en') ? t.id.slice(0, -3) : t.id;
      
      if (t.isDeleted) {
        if (t.lang === docLanguage) {
          list[cat] = list[cat].filter((x: any) => x.id !== baseId);
        }
      } else {
        const index = list[cat].findIndex((x: any) => x.id === baseId);
        if (index !== -1) {
          if (t.lang === docLanguage) {
            list[cat][index] = { ...list[cat][index], name: t.name, isCustom: true, content: t.content, isOverridden: true };
          }
        } else {
          if (!t.lang || t.lang === docLanguage) {
            list[cat].push({ id: t.id, name: t.name, isCustom: true, content: t.content });
          }
        }
      }
    });
    return list;
  };

  const getTemplateText = () => {
    if (!selectedDocEmp) return '';
    const d = new Date().toISOString().slice(0, 10);
    const totalSalary = (selectedDocEmp.basicSalary || 0) + (selectedDocEmp.allowances?.housing || 0) + (selectedDocEmp.allowances?.transport || 0);

    const mergedList = getMergedTemplatesList();
    const activeCatTemplates = mergedList[docCategory] || [];
    const activeTemplate = activeCatTemplates.find((t: any) => t.id === docTemplate);

    if (activeTemplate?.isCustom) {
      let text = activeTemplate.content || '';
      const replacements: { [key: string]: any } = {
        '{{اسم_الموظف}}': selectedDocEmp.arabicName || selectedDocEmp.englishName || '',
        '{{employee_name}}': selectedDocEmp.englishName || selectedDocEmp.arabicName || '',
        '{{رقم_الإقامة}}': selectedDocEmp.iqamaId || '',
        '{{رقم_الهوية}}': selectedDocEmp.iqamaId || '',
        '{{iqama_id}}': selectedDocEmp.iqamaId || '',
        '{{المسمى_الوظيفي}}': selectedDocEmp.jobTitle || '',
        '{{job_title}}': selectedDocEmp.jobTitle || '',
        '{{القسم}}': selectedDocEmp.department || 'العمليات',
        '{{department}}': selectedDocEmp.department || 'Operations',
        '{{تاريخ_الالتحاق}}': selectedDocEmp.dateOfJoining || '',
        '{{joining_date}}': selectedDocEmp.dateOfJoining || '',
        '{{الراتب_الأساسي}}': selectedDocEmp.basicSalary || 0,
        '{{basic_salary}}': selectedDocEmp.basicSalary || 0,
        '{{البدلات}}': (selectedDocEmp.allowances?.housing || 0) + (selectedDocEmp.allowances?.transport || 0),
        '{{allowances}}': (selectedDocEmp.allowances?.housing || 0) + (selectedDocEmp.allowances?.transport || 0),
        '{{إجمالي_الراتب}}': totalSalary,
        '{{total_salary}}': totalSalary,
        '{{التاريخ}}': d,
        '{{date}}': d
      };

      Object.keys(replacements).forEach(key => {
        text = text.replaceAll(key, String(replacements[key]));
      });

      return text;
    }

    if (docLanguage === 'en') {
      switch(docTemplate) {
        case 'salary_cert': return `Ref: HR-SAL-${selectedDocEmp.id}-26\nDate: ${d}\n\nSubject: Salary Certificate & Employment Proof\n\nTo Whom It May Concern,\n\nThis is to certify that ${selectedDocEmp['arabicName']} (ID: ${selectedDocEmp.iqamaId}) is an employee of our company, working as ${selectedDocEmp.jobTitle} in the ${selectedDocEmp.department || 'Operations'} department since ${selectedDocEmp.dateOfJoining}.\n\nFinancial Details:\n- Basic Salary: SAR ${selectedDocEmp.basicSalary || 0}\n- Allowances: SAR ${(selectedDocEmp.allowances?.housing || 0) + (selectedDocEmp.allowances?.transport || 0)}\n- Total Monthly Salary: SAR ${totalSalary}\n\nThis certificate is issued upon the employee's request without any liability to the company.\n\nHR Department\nCompany Administration`;
        case 'warning': return `Ref: HR-WRN-${selectedDocEmp.id}-26\nDate: ${d}\n\nSubject: Official Warning Letter\n\nDear ${selectedDocEmp['arabicName']}, working as ${selectedDocEmp.jobTitle},\n\nThis letter serves as an official warning regarding your recent conduct/performance. You are expected to adhere strictly to the company's policies and procedures.\n\nFurther violations may result in disciplinary actions up to termination.\n\nHR Department`;
        case 'termination': return `Ref: HR-TERM-${selectedDocEmp.id}-26\nDate: ${d}\n\nSubject: Notice of Contract Termination\n\nDear ${selectedDocEmp['arabicName']}, working as ${selectedDocEmp.jobTitle},\n\nWe regret to inform you that your employment with the company is terminated effectively. Please coordinate with HR and Finance for your final settlement.\n\nHR Department`;
        case 'employee_intro': return `Ref: INTRO-FAW-${selectedDocEmp.id}-26\nDate: ${d}\n\nSubject: Employee Introduction Letter\n\nTo Whom It May Concern,\n\nWe certify that ${selectedDocEmp['arabicName']} (ID/Iqama: ${selectedDocEmp.iqamaId}) is a confirmed employee in our company under the title ${selectedDocEmp.jobTitle}.\n\nHR Department`;
        case 'work_start': return `Ref: START-FAW-${selectedDocEmp.id}-26\nDate: ${d}\n\nSubject: Commencement of Duty\n\nThis is to confirm that ${selectedDocEmp['arabicName']} (ID: ${selectedDocEmp.iqamaId}), appointed as ${selectedDocEmp.jobTitle}, has officially started/resumed duty on ${d}.\n\nHR Department`;
        case 'probation_fix': return `Ref: CONFIRM-FAW-${selectedDocEmp.id}-26\nDate: ${d}\n\nSubject: Employment Confirmation\n\nDear ${selectedDocEmp['arabicName']}, ${selectedDocEmp.jobTitle},\n\nWe are pleased to inform you that you have successfully completed your probation period. You are now a confirmed employee.\n\nHR Department`;
        case 'transfer': return `Ref: TRANS-FAW-${selectedDocEmp.id}-26\nDate: ${d}\n\nSubject: Employee Transfer Notice\n\nDear ${selectedDocEmp['arabicName']}, ${selectedDocEmp.jobTitle},\n\nBe informed that management has decided to transfer you to a new department/location effective immediately.\n\nHR Department`;
        case 'promotion': return `Ref: PROM-FAW-${selectedDocEmp.id}-26\nDate: ${d}\n\nSubject: Official Promotion Notice\n\nDear ${selectedDocEmp['arabicName']}, \n\nCongratulations! Based on your performance, you have been promoted. Your new role is [.....................] in the ${selectedDocEmp.department || 'Operations'} department.\n\nHR Department`;
        case 'leave_request':
        case 'sick_leave':
        case 'annual_leave':
        case 'emergency_leave': return `Ref: LEAVE-FAW-${selectedDocEmp.id}-26\nDate: ${d}\n\nSubject: Leave Application\n\nEmployee Name: ${selectedDocEmp['arabicName']}\nJob Title: ${selectedDocEmp.jobTitle}\n\nI am applying for a leave starting from [......] to [......] for the following reason:\n[.........................]\n\nEmployee Signature: ......................\n\nManager Approval: ......................\nHR Approval: ......................`;
        case 'contract': return `Ref: CONT-FAW-${selectedDocEmp.id}-26\nDate: ${d}\n\nSubject: Employment Contract Draft\n\nFirst Party: Company Administration\nSecond Party: ${selectedDocEmp['arabicName']} (ID: ${selectedDocEmp.iqamaId}), Title: ${selectedDocEmp.jobTitle}\n\nTotal Monthly Salary: SAR ${totalSalary}\n\nFirst Party Signature: ......................\nSecond Party Signature: ......................`;
        case 'custody_receipt': return `Ref: CUST-FAW-${selectedDocEmp.id}-26\nDate: ${d}\n\nSubject: Custody / Asset Handover Receipt\n\nI, ${selectedDocEmp['arabicName']} (ID: ${selectedDocEmp.id}), ${selectedDocEmp.jobTitle}, acknowledge the receipt of the following company assets:\n1. ..............................................................\n2. ..............................................................\n\nEmployee Signature: ......................\nStorekeeper Signature: ......................`;
        case 'clearance': return `Ref: CLR-FAW-${selectedDocEmp.id}-26\nDate: ${d}\n\nSubject: Clearance Certificate\n\nTo Whom It May Concern,\n\nThis is to certify that ${selectedDocEmp['arabicName']} (ID: ${selectedDocEmp.id}) has cleared all dues and company properties.\n\nManager: .....................\nStorekeeper: .....................\nIT Dept: .....................\nFinance: .....................\n\nHR Dept:`;
        case 'resignation_acc': return `Ref: RESC-FAW-${selectedDocEmp.id}-26\nDate: ${d}\n\nSubject: Acceptance of Resignation\n\nDear ${selectedDocEmp['arabicName']}, \n\nWe formally accept your resignation. Your notice period ends on (  /  /  ).\n\nHR Department`;
        case 'experience': return `Ref: EXP-FAW-${selectedDocEmp.id}-26\nDate: ${d}\n\nSubject: Experience Certificate\n\nTo Whom It May Concern,\n\nThis is to certify that ${selectedDocEmp['arabicName']} (ID: ${selectedDocEmp.iqamaId}) worked with us as ${selectedDocEmp.jobTitle} from ${selectedDocEmp.dateOfJoining} to present.\n\nHR Department`;
        case 'written_warning_1':
        case 'written_warning_2':
        case 'notice': return `Ref: PNLTY-FAW-${selectedDocEmp.id}-26\nDate: ${d}\n\nSubject: Written Warning\n\nDear ${selectedDocEmp['arabicName']}, ${selectedDocEmp.jobTitle},\n\nThis is an official warning regarding the following violation:\n1. ........................................................\n\nPlease adhere to company policies to avoid further actions.\n\nHR Department`;
        default: return `Subject: ${templatesList[docCategory]?.find((t) => t.id === docTemplate)?.name || 'Custom Document'}\nRef: DOC-FAW-${selectedDocEmp.id}-26\nDate: ${d}\n\nEmployee Details:\n- Name: ${selectedDocEmp['arabicName']}\n- ID: ${selectedDocEmp.id} / ${selectedDocEmp.iqamaId}\n- Title: ${selectedDocEmp.jobTitle}\n- Department: ${selectedDocEmp.department || 'Operations'}\n\n------------------------------------------------\n[Enter Document Details Here]\n\n\n\n\n------------------------------------------------\n\nEmployee Signature: ......................................\nManager Signature: ......................................\nHR Signature: ......................................`;
      }
    } else {
    switch(docTemplate) {
      
      case 'employee_intro': return `الرقم المرجعي: INTRO-FAW-${selectedDocEmp.id}-26\nالتاريخ: ${d}\n\nالموضوع: إفادة رسمية على رأس العمل للجهات المعنية\n\nإلى الجهة التي يهمها الأمر المحترمين،\nتحية طيبة وبعد،\n\nانطلاقاً من مبدأ التعاون وسعياً لتسهيل المعاملات الإجرائية لمنسوبيها، يسرنا في "شركة فنون الوليد للصناعة"، بصفتنا إحدى الشركات الرائدة بمجال صناعة اللوحات الإعلانية ومجسمات النيون في المملكة العربية السعودية، أن نفيدكم بصفة رسمية وموثقة بأن الموظف الموضحة بياناته أدناه، هو أحد الكوادر الأساسية المسجلة والمعتمدة لدينا في قواعد بيانات الشركة، ولا يزال على رأس العمل يباشر مهامه بشكل يومي ومنتظم.\n\nالبيانات التعريفية للموظف:\n-------------------------\n• الاسم الرباعي الموثق: ${selectedDocEmp['arabicName']}\n• رقم الإثبات (هوية وطنية / إقامة): ${selectedDocEmp.iqamaId}\n• الرقم الوظيفي لدى الشركة: ${selectedDocEmp.id}\n• المسمى الوظيفي المعتمد: ${selectedDocEmp.jobTitle}\n• مكان العمل والإدارة: ${selectedDocEmp.department || 'إدارة المشاريع الميدانية والعمليات'}\n• تاريخ بداية الخدمة والانضمام: ${selectedDocEmp.dateOfJoining}\n\nونحيطكم علماً بأن الغرض من إصدار هذه الإفادة هو إثبات تبعية المذكور المهنية لشركتنا للاستخدام الإجرائي الروتيني الذي يتطلب إثبات الحالة الوظيفية، ولا يُشكل هذا المستند أو ينطوي على أي تثبيت لحقوق طرف ثالث، أو التزام مالي مترتب علينا، ولا يعد كفالة بنكية أو شخصية أو تضمن من قبل الشركة تجاه أي التزامات قد يبرمها المذكور.\n\nشاكرين ومقدرين حسن تعاونكم الدائم ولكم جزيل الشكر،،،\n\nلجنة شؤون الموظفين والامتثال الإداري\nشركة فنون الوليد للصناعة`;
      
      case 'work_start': return `الرقم المرجعي: START-FAW-${selectedDocEmp.id}-26\nالتاريخ: ${d}\n\nالموضوع: إشعار وتوثيق لمباشرة عمل فعلي\n\nأصحاب السعادة أعضاء الإدارة المالية وإدارة العمليات المحترمين،\nالسلام عليكم ورحمة الله وبركاته، أما بعد:\n\nاستناداً للوائح التنفيذية الداخلية ومقتضيات العمل، وإشارةً إلى العقود المبرمة والقرارات الإدارية العليا الخاصة باعتماد التعيينات أو عودة الكوادر البشرية، نفيدكم علماً بأنه في يومنا هذا الموافق ${d}، قد باشر الموظف الموضحة بياناته كافة المهام والاختصاصات الموكلة إليه فعلياً، وتواجد في مقر عمله أو الميدان المحدد له، وقد جرى قيده فوراً ضمن سجلات الحضور والانصراف الحية للشركة.\n\nقائمة البيانات والمستحقات للمباشرة:\n-------------------------\n• الاسم المُدرج: ${selectedDocEmp['arabicName']}\n• الإدارة / القسم: ${selectedDocEmp.department || 'العمليات والإنتاج'}\n• الوظيفة المُكلف بها: ${selectedDocEmp.jobTitle}\n• رقم الهوية / الإقامة: ${selectedDocEmp.iqamaId}\n• الرقم المرجعي الآلي: ${selectedDocEmp.id}\n• حالة المباشرة وتصنيفها: شروع مؤكد في العمل (لتعيين جديد / أو لعودة نهائية من إجازة معتمدة)\n\nبناءً على ما ذُكر، يُعتمد إدارياً ومالياً هذا الإشعار الرسمي كوثيقة انطلاق لبدء تفعيل مسيرات الأجر الشهري واحتساب المستحقات، أو لاستئنافها وفقاً للقوانين المتبعة بنظام وزارة الموارد البشرية واللوائح الداخلية بـ "شركة فنون الوليد". نأمل من إداراتكم ذات العلاقة سرعة إنجاز ما يلزم حيال التوثيق وأرشفة الملف في الدفاتر المختصة.\n\nوتقبلوا وافر وافر التحية والتقدير،،،\n\nأخصائي الموارد البشرية المعني بالتوظيف\nتوقيع لاعتماد المباشرة: ___________________`;
      
      case 'probation_fix': return `الرقم المرجعي: CONFIRM-FAW-${selectedDocEmp.id}-26\nالتاريخ: ${d}\n\nالموضوع: قرار ترقية وإقرار بتجاوز فترة التجربة بنجاح للموظف الجديد\n\nعناية الأستاذ الفاضل / ${selectedDocEmp['arabicName']} المحترم،\nالمسمى الوظيفي: ${selectedDocEmp.jobTitle}\nتحية طيبة مباركة وبعد،\n\nفي البداية، تتقدم الإدارة العليا لـ "شركة فنون الوليد" بخالص الشكر والتقدير لجهودكم الملموسة التي قدمتموها، وللتميز المهني والمستوى والانضباط العالي الذي أظهرتموه بشهادة جميع الزملاء والرؤساء منذ يومكم الأول لانضمامكم إلى أسرتنا المهنية بتاريخ ${selectedDocEmp.dateOfJoining}.\n\nونود أن نحيطكم علماً بأنه وبعد المراجعة الدقيقة لنتائج تقييم الأداء، ودراسة التقارير الدورية المرفوعة من قبل الإدارة الفنية والمباشرة الخاصة بكم خلال الأشهر الثلاثة المنصرمة (فترة التجربة القانونية)، فقد توضح جلياً حجم قدرتكم وكفاءتكم المهنية والتزامكم التام بأهداف ولائحة الشركة المنظمة للعمل.\n\nوبناءً على هذه التوصيات الإيجابية الممتازة، والمقرونة بموافقة الإدارة التنفيذية، فقد صدر بحقكم القرار الإداري التالي:\n\nأولاً: اعتماد التثبيت الكامل في الوظيفة، واستمراية تفعيل عقد العمل الموحد وتثبيت بنوده.\nثانياً: دمج الموظف واعتباره عضواً دائماً ضمن هيكلة قسم (${selectedDocEmp.department || 'العمليات والتنفيذ'})، ومنحه كافة الصلاحيات والمراتب المتعلقة بوظيفته.\nثالثاً: سريان جميع المزايا المالية والبدلات وحُزم التطوير التقنية بدءاً من تاريخ نفاذ هذا القرار.\n\nيسرنا أن نهنئكم باجتيازكم هذه مرحلة المفصلية بكل تفوق، ونبني آمالاً كبيرة في تسخير خبراتكم في سبيل رفع كفاءة مخرجاتنا المشتركة.\n\nتمنياتنا لكم بالمزيد من التألق في محطاتكم القادمة معنا،،،\n\nالمدير التنفيذي\nشركة فنون الوليد للصناعة`;
 
      case 'transfer': return `الرقم المرجعي: TRANS-FAW-${selectedDocEmp.id}-26\nالتاريخ: ${d}\n\nالموضوع: إشعار وقرار إداري داخلي بحركة النقل وإعادة التدوير\n\nعناية الموظف الكريم / ${selectedDocEmp['arabicName']} المحترم،\nالسلام عليكم ورحمة الله وبركاته، وبعد:\n\nتماشياً مع الهيكلة التوسعية والتحديثات اللوجستية التي تشهدها "شركة فنون الوليد"، وبناءً على الرؤية الاستراتيجية لتحقيق أعلى معدلات الاستفادة من طاقاتنا وكفاءاتنا البشرية في مواقع أكثر فاعلية وإنتاجية تتلاءم مع متطلبات المشاريع الحقلية والمركزية.\n\nفقد قررت الإدارة العُليا، وبعد التشاور مع مدراء الأقسام، المصادقة على الإجراء الإداري والتنظيمي التالي بحقكم:\n\nأولاً: النقل الفوري وتوجيه خدماتكم المهنية والميدانية إلى الموقع الجديد أو الإدارة المستهدفة التي سيتم إبلاغكم بتفاصيلها الموقعية.\nثانياً: نقل كافة مسؤوليات وصلاحيات المُسمى الوظيفي الخاص بكم (${selectedDocEmp.jobTitle}) وتفعيلها بما يخدم بيئة الموقع الجديد.\nثالثاً: يُشترط المباشرة الفورية بدون عوائق في المقر المشمول بالقرار اعتباراً من يوم الأحد الموافق لتاريخ إصدار القرار.\nرابعاً: تسليم أية عُهد مالية أو فنية، أو وثائق تعود للموقع السابق، بموجب محضر تسلُّم وتَسليم نظامي موقّع للمدير المباشر السابق.\nخامساً: يظل الموظف متمتعاً بالكيان المالي الكامل والدرجة المصدقة له سلفاً مالم تستجد لوائح ترفيع مقترنة بالنقل.\n\nنثق تماماً بمقدرتكم على التأقلم والعطاء في شتى الميادين المهنية، ونرجو من إدارة (الشؤون المالية) توثيق هذا الإجراء.\n\nشاكرين إخلاصكم وتفانيكم في تلبية نداء العمل المشترك،،،\n\nمدير إدارة العمليات والتشغيل`;
 
      case 'promotion': return `الرقم المرجعي: PROM-FAW-${selectedDocEmp.id}-26\nالتاريخ: ${d}\n\nالموضوع: قرار ترقية ومنح درجة وظيفية مستحقة\n\nعناية الأستاذ / ${selectedDocEmp['arabicName']} المحترم،،،\nالسلام عليكم ورحمة الله وبركاته، أما بعد:\n\nاعتزازاً بجهودكم المتواصلة وإخلاصكم المشهود ضمن صفوف الكوادر التشغيلية في شركة فنون الوليد للصناعة، ونظراً لكفاءتكم المتميزة التي لامسناها طوال مدة تدرحكم معنا، وبناءً على تزكية الإدارة التنفيذية المباشرة واعتماد لجنة تقييم الأداء والموارد البشرية.\n\nيسرنا الإعلان عن صدور القرار الإداري التالي بشأنكم:\nأولاً: ترقيتكم رسمياً ومنحكم المسمى الوظيفي الجديد: [........................................].\nثانياً: نقل مرجعيتكم الإدارية والفنية لقيادة قسم: ${selectedDocEmp.department || 'إدارة العمليات العليا'}.\nثالثاً: منحكم تعديلاً مالياً ومخصصات متوافقة مع درجتكم الجديدة وفق اللائحة (حسب ما هو مقرر بمسيرات الرواتب).\n\nيسري هذا القرار اعتباراً من تاريخه، متمنين لكم كل التوفيق والسداد في مهامكم الجسيمة القادمة، وأن تكون هذه الترقية حافزاً إضافياً لكم لبذل المزيد من العطاء والابتكار.\n\nتفضلوا بقبول صادق التقدير,،،\n\nالمدير العام\nشركة فنون الوليد للصناعة`;
 
      case 'clearance': return `الرقم المرجعي: CLR-FAW-${selectedDocEmp.id}-26\nالتاريخ: ${d}\n\nالموضوع: وثيقة إخلاء طرف نهائي (Clearance Certificate)\n\nالسادة في الأقسام المعنية والموارد البشرية،،،\nتحية طيبة وبعد،\n\nفي إطار الإجراءات المتبعة لفض ارتباطات العاملين المنتهية خدماتهم أو المستقيلين نظامياً، نفيدكم بموجب هذا المحضر بأنه قد تم تصفية وتسوية كافة العهد والمقتنيات المرتبطة بالموظف المبينة بياناته أدناه:\n\n• الاسم الرباعي: ${selectedDocEmp['arabicName']}\n• الرقم الوظيفي المرجعي: ${selectedDocEmp.id} | الإثبات الوطني: ${selectedDocEmp.iqamaId}\n• الوظيفة المنشغلة مسبقاً: ${selectedDocEmp.jobTitle}\n\nوبعد عمل الجرد الشامل، نُقر نحن في الإدارات (المالية، المستودعات، تقنية المعلومات، والسكن) بأنه لا توجد للمنشأة أي مطالبات مالية أو عُهد عينية محتجزة أو قضايا عالقة ضد الموظف المذكور. وعليه، يعتبر هذا بمثابة إخلاء طرف شامل ونهائي مبرئ لذمته، ويحق للإدارة المالية بناءً على ذلك صرف كافة مستحقاته وشهادات الخبرة ومكافأة نهاية الخدمة المترتبة له وفقاً للنظام.\n\nتوقيعات وتصديقات الأقسام للإخلاء التام:\n- مدير القسم المباشر: .....................\n- أمين المستودعات المركزية: .....................\n- مسؤول تقنية المعلومات (لإلغاء الوصول): .....................\n- مدير الشؤون المالية والرواتب: .....................\n\nختم الموارد البشرية لاعتماد التصفية:`;
 
      case 'termination': return `الرقم المرجعي: TERM-FAW-${selectedDocEmp.id}-26\nالتاريخ: ${d}\n\nالموضوع: قرار إداري بإنهاء التعاقد الوظيفي (Termination of Contract)\n\nالأستاذ / ${selectedDocEmp['arabicName']} المحترم،\nالرقم الوظيفي: ${selectedDocEmp.id} | المهنة المقيدة: ${selectedDocEmp.jobTitle}\n\nيؤسفنا في إدارة شركة فنون الوليد للصناعة، وبصفتنا الجهة المشغلة والمالكة لزمام المبادرة التعاقدية، أن نحيطكم علماً بأنه قد تقرر رسمياً عدم تجديد / إنهاء عقد العمل المبرم معكم استناداً لمقتضيات المصلحة (أو لظروف إعادة الهيكلة)، وذلك وفقاً للمادة ذات الصلة بقانون العمل والعمال السعودي، لتكون آخر أيام عملكم الفعلية بنهاية دوام يوم (  /  /  202 م).\n\nوعليه، يجب عليكم المبادرة بتسليم ما بحوزتكم من عهد ومقتنيات رسمية لمديركم المباشر عبر محضر استلام مخصص، ومراجعة إدارة الموارد البشرية والشؤون المالية لاستكمال إجراءات المخالصة المالية النهائية واستلام حقوقكم المقررة ومكافأة نهاية الخدمة، بالإضافة إلى ترتيبات تذاكر السفر وتصفيات الإقامة إن لزم الأمر.\n\nتتمنى لكم إدارة الشركة التوفيق في مشواركم القادم،،،\n\nمدير إدارة الشؤون الإدارية والأفراد`;

      case 'resignation_acc': return `الرقم المرجعي: RESC-FAW-${selectedDocEmp.id}-26\nالتاريخ: ${d}\n\nالموضوع: إشعار بقبول استقالة من العمل بناءً على طلبكم\n\nعناية السيد الفاضل / ${selectedDocEmp['arabicName']} المحترم،\n\nتحية طيبة وبعد،،،\nتلقينا في الإدارة العليا والموارد البشرية خطاب استقالتكم المشفوع بتوقيعكم والمُقدم بتاريخ (  /  /  )، والرامي إلى إنهاء ارتباطكم المهني معنا.\nوبعد تدارس الطلب والمداولة مع الجهات المعنية ومشرفي الأقسام، نبلغكم بأنه قد تم الموافقة رسمياً واعتماد طلب الاستقالة، مع احتساب فترة الإنذار الإلزامية التي تنتهي في أول تاريخ (  /  /  ).\n\nلقد كنتم طوال مسيرتكم معنا بمثابة الأخ والزميل المهني المجتهد، ونتمنى لكم تحقيق أهدافكم المستقبلية وتيسيراً تاماً في كشوفات حياتكم القادمة. نرجو منكم مراجعة الشؤون المالية للبدء في توقيع أوراق التصفية ونقل العهد والمخالصة النهائية.\n\nتفضلوا بقبول وافر الشكر والاحترام،،،\n\nالمدير المباشر والموارد البشرية\nشركة فنون الوليد للصناعة`;

      case 'experience': return `الرقم المرجعي: EXP-FAW-${selectedDocEmp.id}-26\nالتاريخ: ${d}\n\nالموضوع: شهادة خبرة عملية وكفاءة مهنية\n\nإلى الجهات الموقرة والمؤسسات المهنية،،،\nأطيب التحيات وبعد،،\n\nانطلاقاً من سجلاتها المعتمدة، تؤكد وتشهد "شركة فنون الوليد للصناعة" وبكل فخر واعتزاز، بأن السيد الأستاذ/ ${selectedDocEmp['arabicName']} (التي يحمل إقامة / هوية رقم: ${selectedDocEmp.iqamaId})، قد كان ركناً أساسياً ومن خيرة أبناء هذه الشركة وشركائها في مسيرة الإنجاز والنجاح في الفترات التي قضاها ضمن كوادرها.\n\nلقد انتظم المذكور ضمن طاقمنا وتدرج حتى عمل بوظيفة: (${selectedDocEmp.jobTitle})\nوذلك لمدة امتدت، بكل إخلاص، ابتداءً من تاريخ: ${selectedDocEmp.dateOfJoining} ولغاية اليوم.\nأدى فيها جميع المهام والأدوار الموكلة إليه بإتقان احترافي وبضمير مهني يقظ.\n\nلقد تميز الموظف خلال مسيرته في جنبات الشركة بمجموعة من القيم والفضائل أبرزها:\n• التحلي بالأخلاق المهنية العالية، والتواصل الفعّال وحل المعضلات بوقار واحترام لزملائه بالمحيط.\n• سرعة الاستجابة لضغوطات الميدان وأوقات الذروة، والمساهمة في تحقيق تطلعات الإدارة والأهداف السنوية.\n• الحرص البالغ على مكتسبات الشركة، والأمانة المطلقة في الحفاظ على سرية المشاريع ونزاهة التعاملات.\n\nوقد صدرت هذه الشهادة الرسمية الودية بناءً على رغبته وبطلبه الشخصي، لتقديمها وإبرازها لمن قد يطلبها، دون أن يترتب بناءً عليها أي قيد حقوقي أو مالي التزامي تجاه "شركة فنون الوليد".\n\nسائلين الله له مستقبلاً زاهراً في مساراته القادمة وأن ترافقه التوفيقات.\n\nمع فائق التقدير والإجلال،،،\n\nمدير إدارة العلاقات والموارد البشرية\nشركة فنون الوليد للصناعة - قسم التوثيق`;
      
      case 'written_warning_1': 
      case 'written_warning_2':
      case 'notice': return `الرقم المرجعي: PNLTY-FAW-${selectedDocEmp.id}-26\nالتاريخ: ${d}\n\nالموضوع: إنذار إداري كتابي ولفت نظر مُقيد في الملف الوظيفي\n\nالأستاذ / ${selectedDocEmp['arabicName']} الموقر،\nتفاصيل وظيفية - الرقم النظامي: ${selectedDocEmp.id} | المرتبة / المسمى: ${selectedDocEmp.jobTitle}\n\nتطمح إدارة "شركة فنون الوليد للصناعة" دائماً إلى إيجاد وتهيئة بيئة عملية صحية متكاملة، وقائمة بالدرجة الأولى على قيم الانضباط الأخلاقي والمهني، والالتزام بأقصى درجات المسؤولية والجدية في التعامل مع مُقدرات وتوقيتات الشركة.\n\nوبعد الاطلاع على محاضر الضبط وتقارير الإشراف المرفوعة حديثاً من إدارتكم المباشرة، إضافة للمتابعة اليومية للأداء، تم رصد المخالفة / التجاوز الواضح التالي والذي يتقاطع مع المادة النظامية بلوائح العمل الداخلية:\n(يرجى من الإدارة تحديد ووصف المخالفة بدقة متناهية هنا في النقاط التالية):\n1. --------------------------------------------------------------------------------------\n2. --------------------------------------------------------------------------------------\n3. --------------------------------------------------------------------------------------\n\nوعليه وبموجب النظام الصريح، نبلغكم بأن هذا التجاوز غير مقبول إطلاقاً؛ ومقرر له أن يُعتبر بمثابة إنذار كتابي رسمي ولفت نظرٍ شديد اللهجة مُقيد في سجلكم وسياق تطوركم الوظيفي لدينا.\nنترقب منكم استقبال هذا الإجراء كفرصة لتقويم المسار وتلافي الخلل، مع تذكيركم الصارم بأن تكرار أي مخالفة من هذا النوع أو غيره مستقبلاً، سيضطرنا لتفعيل أقصى الجزاءات والتدرجات التي ينص عليها نظام العمل والعمال السعودي، والتي ترتقي للحسم المضاعف أو توقيف الخدمة والاستغناء التعسفي المستند للأدلة.\n\nإقرار بالاستلام والإحاطة الكاملة:\nتوقيع الموظف الموقر، مُقرّاً باستلامه وفهمه للإنذار: .......................................\nتوقيع مدير القسم المباشر والتوصية المتبعة: .......................................\nعن إدارة الشؤون والأفراد / الموارد البشرية`;
      
      case 'offer': return `الرقم المرجعي: OFFER-FAW-${selectedDocEmp.id}-26\nالتاريخ: ${d}\n\nالموضوع: عرض وظيفي لاستقطاب كادر واعد (Formal Job Offer)\n\nالسيد الفاضل الواعد / ${selectedDocEmp['arabicName']} المحترم،\nأطيب التحيات ومزيد من الترحيب،،\n\nإيماناً من الإدارة العليا في "شركة فنون الوليد للصناعة" بضرورة رفد طاقمها بالكفاءات المهنية النادرة والمقدرة المحورية القادرة على إضافة قيمة تنافسية في سوق الإعلان والإنتاج، وبعد الاطلاع على سيرتكم الذاتية المليئة بالإنجازات وما تمخضت عنه لجان المقابلات من مخرجات واعدة، فإنه ليسعدنا ويشرفنا كثيراً أن نتقدم لسعادتكم بهذا العرض الوظيفي المغري للانضمام رسمياً كعضو مؤسس لنجاحاتنا وفق البنود والتفصيلات المتفق عليها:\n\nأولا / المهام والاختصاص:\n- الرتبة والتصنيف والمسمى الوظيفي: ${selectedDocEmp.jobTitle}\n- المرجعية الإدارية والقسم المشغل: ${selectedDocEmp.department || 'إدارة الكفاءات والمشاريع الفنية'}\n\nثانياً / المزايا والحزم المالية المقررة والمثبتة:\n- الراتب الأساسي والمادي الكلي الشهري: ${selectedDocEmp.basicSalary} ريال سعودي.\n- بدل السكن الشهري المُعتاد: ${selectedDocEmp.allowances.housing} ريال سعودي.\n- بدل وسيلة المواصلات والتنقل: ${selectedDocEmp.allowances.transport} ريال سعودي.\n- الإجمالي الكلي المكتسب كل شهر ميلادي: ${totalSalary} ريال سعودي.\n\nثالثاً / المزايا الإضافية والاشتراطات الجوهرية:\n• استخراج وتوفير تأمين طبي شامل للموظف ولأفراد عائلته المباشرين وفق فئات بوليصة الشركة السارية.\n• منح إجازة سنوية مدفوعة الراتب وفقاً للضوابط لا تقل عن واحد وعشرين (21) يوم عمل لكل عام مقضوي.\n• منح وتوفير تذكرة سفر ومكافأة نهاية خدمة عند اكتمال المدد المحددة حسب أحكام وزارة الموارد البشرية.\n• يخضع هذا العرض والموظف لفترة تقييم وتجربة تأسيسية تبلغ (90 يوماً متواصلة) تبدأ من الصباح الأول الفعلي للمباشرة.\n\nرابعاً / الصلاحية والختام:\nنفيدكم بأن هذا العرض الوظيفي ساري المفعول لمدة أقصاها (ثلاثة أيام عمل رسمية) من تاريخ التحضير. في حال توافق وتلاقي هذا العرض مع تطلعاتكم الكريمة،، نرجو التفضل وتعميد التوقيع على نسخته إلكترونياً أو ورقيًا لإحضارها إلينا لتجهيز واعتماد العقد المُوثق قانونياً.\n\nتوقيع مسؤول التعاقد والاستقطابات: ..............................\nتوقيع الكادر المُرشح بالقبول التام والموافقة: ..............................`;
      
      case 'sick_leave':
      case 'annual_leave':
      case 'emergency_leave': return `الرقم المرجعي: LEAVE-FAW-${selectedDocEmp.id}-26\nالتاريخ: ${d}\n\nالموضوع: طلب والتماس للحصول على تصريح إجازة وجدولة غياب\n\nالسادة الأفاضل في أقسام الموارد البشرية وإدارة المتابعة والتنظيم الموقرين،\nالسلام عليكم ورحمة الله وبركاته،\n\nأعرض بين يديكم أنا الموظف / ${selectedDocEmp['arabicName']} | المعرف وظيفياً بالترقيم الرقمي: ${selectedDocEmp.id}\nوالحامل للمسمى المتداول: ${selectedDocEmp.jobTitle} والتابع إدارياً وعملياً للقسم الإشرافي: ${selectedDocEmp.department || 'العمليات'}\n\nهذا الطلب الخطي والالتماس النظامي، والرامي إلى الحصول على إذن وموافقة مسبقة لجدولة وترخيص (إجازة دورية / سنوية / مرضية طارئة)، وذلك نتيحة لوجود ظروف وارتباطات حتمية أعاقتني، (أو لوجود عذر طبي قاهر تم تضمين وإرفاق المستند الخاص بقرار المستشفى المرخص مع هذا المعروض).\n\nالمقدمات والاعتمادات المتعلقة بهذه الإجازة المطلوبة:\n• إجمالي المدة الزمنية المجدولة هي: ...... يوم / أيام قابلة للحسم.\n• من المخطط انطلاق هذه الاستراحة بدءاً من أول ساعات يوم (   /   / 202 م).\n• وتنتهي ويُستأنف الدوام في أول ساعات عمل في يوم (   /   / 202 م).\n\nالأحكام والإقرارات التنظيمية:\nأتعهد وأتأكد التزاماً تاماً بأنه وعقب انقضاء المدة المرخص لي بها تحديداً، سأباشر مسيرتي المهنية على رأس العمل دون تأخير يُذكر. وأي تخلف عن ذلك، أو تجاوز لحصة الأيام المصرح بها دون مسوغ قاهر، يُلزم إدارة الشركة بكامل الحق لتطبيق القواعد الإجرائية الخاصة بالخصومات على الراتب، والتي قد تنتهي بعقوبات شديدة وفقاً لبنود نظام العمل المعمول به بصورة صريحة.\n\nأمضاء الموظف المِلتمس للإجازة بمسؤوليته: .............................\n\n---------------- مصادقة الإدارات المعنية والتوجيه في فنون الوليد ----------------\n• رأي وتوصية المدير المباشر بالميدان، (بالموافقة / أو الرفض وتأجيل الإجازة): .............................\n• الاعتماد الفني النهائي والرسمي من مدير الموارد البشرية والامتثال: .............................`;

      case 'contract': return `الرقم المرجعي المنظم: CONT-FAW-${selectedDocEmp.id}-26\nتاريخ الصياغة والتوقيع: ${d}\n\nالموضوع: وثيقة مسودة مشروع عقد عمل موحد ومحدد المدة والبنود\n\nإنه في هذا اليوم المبارك، الموافق لتاريخ الإصدار أعلاه (${d})، وبعد التراضي وانتفاء موانع التعاقد، تم الإبرام والصلح والميثاق إلكترونياً وورقياً بين كل من طرفي هذا المحضر:\n\nالطرف الأول والأصيل (صاحب العمل المستقطب): شركة فنون الوليد للصناعة والمسجلة أصولاً لدى الدوائر الحكومية (ويُمثلها رسمياً في هذا الإجراء مديرها التنفيذي الموكل أو من ينوب عنه في التفويض).\nالطرف الثاني (المُتعاقد معه كموظف): السيد/ ${selectedDocEmp['arabicName']} | والذي يثبت هويته وتصريحه بالوثيقة رقم: ${selectedDocEmp.iqamaId}، وقُدّر له التصنيف الوظيفي بصفته: ${selectedDocEmp.jobTitle} والمخول بالعمل والتفاني تحت ظل شركائنا.\n\nتمهيد وأحكام إلزامية تأسيسية:\nنظراً لأن الطرف الأول وبحكم نشاطه يحتاج لتعزيز كوادره وتطوير أعماله بالاستعانة بخدمات الطرف الثاني نظير ما عُرف عنه من مقدرات مهنية واضحة، فقد أجمعت الإرادتان على صياغة هذا العقد وتوثيقه، مرجعين كافة مواده، وأحكامه، وقواعده العامة لنظام العمل الحاكم في جغرافية المملكة العربية السعودية، ليُشكل هذه البنود:\n\nالبند التنظيمي الأول (فترة التجربة واختبار وتقويم الكفاءات):\nيخضع الطرف الثاني لتقييم مهني وسلوكي ونفسي في فترة تجريبية ملزمة لا يقل زمانها عن تسعين (90) يوماً متواصلة للمعاينة والحكم، ويجوز حقاً وحصراً للطرف الأول وفي أي وقت خلالها أن يفسخ العقد فوراً، دون أن يلزم بأي تعويضات مستقبلية في حال برهنت التقارير تدني واختلال كفاءة الطرف الثاني أو مخالفته لقواعد النزاهة.\n\nالبند التنظيمي الثاني (الأجور وتوزيعة المردود النقدي):\nيلتزم الطرف الأول بضمان استلام الطرف الثاني وعن كل دورة شهرية يكملها بالكامل، أجراً دورياً واجمالياً نقدياً قدره (${totalSalary}) ريال سعودي متضمناً ذلك راتبه الأساسي والبدلات الأخرى، يُحسَب ويصرف بشفافية بنهاية كل شهر عبر الحوالات البنكية المعتمدة.\n\nالبند التنظيمي الثالث (قسم السرية المطلقة ورفض الإفشاء):\nيتعهد الطرف الثاني بحسب كل التزام عقائدي ونظامي بمراعاة مبدأ (السرية المهنية العالية)، ومراقبة وحماية قواعد البيانات والمشاريع وتسعيرات العقود والابتكارات وتفاصيل المجهودات الفنية التي تعود ملكيتها حصراً لـ "فنون الوليد"، وبأنه لن يعمل منافساً أو مسرباً أي معلومة لأي محيط أجنبي مهما تعددت الظروف.\n\nنسخة مصدقة للإلزام والمصادقة المتبادلة:\nتوقيع وبصمة الجهة الممثلة لإرادة الطرف الأول: _________________\nتوقيع وموافقة وإقرار وختم الطرف الثاني بالإيجاب: _________________`;

      case 'custody_receipt': return `الرقم المرجعي للإيداع والتسليم: CUST-FAW-${selectedDocEmp.id}-26\nتاريخ المحضر الموثق: ${d}\n\nالموضوع: تصريح ومسودة إقرار بالاستلام ومحضر تسليم عُهد مهنية ومقتنيات\n\nالسادة إدارة الدعم المعنوي وحصر الممتلكات المحترمين،\nعناية إدارات العمليات والإسناد،\n\nأُقر وأصرّح أنا المُوقع أدناه، وبكامل قواي العقلية والأهلية والاعتبارية القانونية المطلقة، الموظف المدعو / ${selectedDocEmp['arabicName']} | والمُقيد برقم نظام متسلسل: ${selectedDocEmp.id}\nوالمُصنف تحت ظل المسمى المهني: ${selectedDocEmp.jobTitle} لصالح الإدارة التنفيذية وقسم: ${selectedDocEmp.department || 'إدارة التشغيل'}\n\nبأنني في هذا اليوم، وبعد الجرد والإحصاء والمطابقة الشاملة الدقيقة، قد تسلمت من المخازن المركزية وإدارة الشركة (فنون الوليد) العُهد والمقتنيات المحددة بالنوع والكمية والتفصيل الحرفي في الجدول المسرود أدناه، والتي خُصصت لتكون تحت تصرفي التام لإنجاز مشاريع الشركة ومتطلبات العمل الجارية.\n\nقائمة العُهد والممتلكات المُتسلمة ومواصفاتها القياسية:\n------------------------------------------------------------\n1. _____________________________________________________________________________\n2. _____________________________________________________________________________\n3. _____________________________________________________________________________\n4. _____________________________________________________________________________\n5. _____________________________________________________________________________\n------------------------------------------------------------\n\nتعهُد الحماية والصيانة والالتزام الضامن:\nإنني وبموجب هذا المحضر المعتمد والممضي، ألتزم تجاه الشركة بالأمانة وصون وحماية هذه العهد وتكريسها فقط من أجل الأعمال الرسمية. كما أتحمل كافة المسؤوليات التبعية عن أي ضرر يعتريها، أو ضياع يجهل المتسبب به، أو عطل ناتج عن الاستخدام المفرط والإهمال. وفي حال العبث بهذه الأمانة أو الإخلال بتسليمها عند انتهاء وظيفتي، أو عند الطلب المباشر من المراجع الإدارية، فإنها تخولهم بحسم تكلفة استبدال العهدة مباشرة ومن دون الحاجة لإذن مسبق من مستحقاتي ورواتبي.\n\nتوقيع الموظف الموقر، مُقرّاً بمطابقة الجرد والاستلام الكامل: .......................................\nتوقيع الموظف المسؤول والمُسلم للعهدة (عن إدارة المستودعات): .......................................\nمصادقة أمين عام العُهد أو المدير المباشر للاعتماد النهائي: .......................................`;

      default:
        // Generic highly formal fallback for any custom generated template
        return `موضوع الإشعار أو المستند الإداري: ${templatesList[docCategory]?.find((t: any) => t.id === docTemplate)?.name || 'إجراء ونموذج مخصص وغير اعتيادي'}\nالرقم الأرشيفي المرجعي للتخزين: DOC-FAW-${selectedDocEmp.id}-26\nتاريخ الانعقاد والإصدار: ${d}\n\nالبيانات التعريفية للموظف المعتمد عليه بالخطاب الموحد الدقيق والإلزامي:\n• الاسم الرباعي الكامل للموظف المقر: ${selectedDocEmp['arabicName']}\n• الإثبات الوظيفي الداخلي: ${selectedDocEmp.id} | هوية وأوراق الإقامة المنظمة: ${selectedDocEmp.iqamaId}\n• المسمى الرتبوي والوظيفي الحالي: ${selectedDocEmp.jobTitle}\n• إدارة التشغيل والمهام والإسناد المباشرة: ${selectedDocEmp.department || 'العمليات والمشاريع المركزية والصيانة'}\n\n------------------------------------------------\nالمحتوى التفصيلي للإجراء والقرار المُنبثق عن الإدارة (متاح للتعديل والمطابقة الحرة والتوثيق المكتبي):\n\n(يُرجى محو هذا النّص الإرشادي واستبداله بصياغة وكتابة التفاصيل الدقيقة وحيثيات الإجراء الإداري أو المشكلة أو الموضوع الخاص بهذا المستند بشكل مباشر في هذا النطاق، حيث تم تصميم المساحة الورقية لتراعي تنسيق الورق الرسمي الخاص بالشركة وتتيح كتابة كل الإفادات والتنويهات بحرية ومرونة عالية تتناسب من الإطالة والاختصار...)\n\n\n\n\n\n\n\n\n------------------------------------------------\n\nالاعتمادات الإدارية والمصادقات وتواقيع المسؤولين الختامية لتنفيذ الوثيقة واستدامتها:\n• الموظف المستفيد/المقر للاستلام والإقرار بحذافير الوثيقة (توقيع وتسليم): ......................................\n• الإدارة المباشرة / رئيس قسم التشغيل أو التوجيه (توقيع): ......................................\n• قسم التوثيق في شؤون الموظفين العليا (مصدق نهائي): ......................................\n\n[الختم الرسمي لشركة فنون الوليد للصناعة - الدمام]`;
    }


    }
  };

  // Re-fill local state if template or employee changes
  useEffect(() => {
    setDocContent(getTemplateText());
  }, [selectedDocEmp, docTemplate, docCategory, docLanguage]);

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/dynamic/document_logs');
      if (res.ok) {
        const data = await res.json();
        // Sort by date DESC
        data.sort((a: any, b: any) => new Date(b.exportedAt).getTime() - new Date(a.exportedAt).getTime());
        setExportLogs(data);
      }
    } catch(e) {
      console.error(e);
    }
    setLoadingLogs(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handlePrint = () => {
    const printArea = document.getElementById('printable-document-area');
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
            * { font-family: 'GE SS Two', 'Gotham Pro', sans-serif !important; }
          </style>
            <title>طباعة مستند</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
              body { 
                margin: 0; 
                padding: 0; 
                background: white; 
                font-family: 'GE SS Two', 'Gotham Pro', sans-serif !important;
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
              }
              @page { size: A4; margin: 20mm; }
              .print\\:hidden { display: none !important; }
              .doc-container {
                width: 100%;
                margin: 0 auto;
                padding: 0;
              }
              .action-btns { 
                text-align: center; 
                margin: 20px 0;
                padding: 20px;
                background: #f1f5f9;
                border-bottom: 1px solid #e2e8f0;
              }
              .print-btn { 
                background: #00AEEF; 
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
              .print-btn:hover { background: #0072BC; }
              @media print {
                .action-btns { display: none !important; }
                body { background: white; }
              }
            </style>
          </head>
          <body>
            <div class="action-btns">
              <button class="print-btn" onclick="window.print()">🖨️ طباعة المستند الآن</button>
            </div>
            <div class="doc-container">
              ${printArea.innerHTML}
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
      alert("الرجاء السماح للنوافذ المنبثقة (Pop-ups) لطباعة المستند، أو استخدم زر الطباعة العادي.");
      window.print();
    }
  };

  const handleExport = async () => {
    if (!selectedDocEmp) { alert("أرجو تحديد الموظف أولاً"); return; }
    
    const mergedList = getMergedTemplatesList();
    const docName = mergedList[docCategory]?.find((t: any) => t.id === docTemplate)?.name || docTemplate;
    
    // Save to Database
    const payload = {
      title: docName,
      employeeName: selectedDocEmp['arabicName'],
      employeeId: selectedDocEmp.id,
      exportedBy: user['arabicName'] || user.username,
      exportedAt: new Date().toISOString(),
      content: docContent
    };

    try {
      await fetch('/api/dynamic/document_logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      loadLogs();
      alert(lang === 'ar' ? 'تم التصدير والحفظ بنجاح!' : 'Exported and saved successfully!');
    } catch(e) {
      alert('Failed to export. Please try again.');
    }
  };

  const handleSaveCustomTemplate = async () => {
    if (!templateName.trim() || !templateBody.trim()) {
      alert(lang === 'ar' ? 'يرجى تعبئة جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    const baseId = editingTemplate?.id ? (editingTemplate.id.endsWith('_ar') || editingTemplate.id.endsWith('_en') ? editingTemplate.id.slice(0, -3) : editingTemplate.id) : '';
    const isBuiltIn = baseId ? Object.values(templatesList).some((list: any) => list.some((x: any) => x.id === baseId)) : false;

    const templateId = isBuiltIn ? `${baseId}_${templateLang}` : (editingTemplate?.id || `custom_${Date.now()}`);

    const payload = {
      id: templateId,
      name: templateName,
      category: templateCategorySelected,
      lang: templateLang,
      content: templateBody,
      module: 'hr',
      createdBy: user.username,
      createdAt: editingTemplate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
    
    const baseId = id.endsWith('_ar') || id.endsWith('_en') ? id.slice(0, -3) : id;
    const isBuiltIn = Object.values(templatesList).some((list: any) => list.some((x: any) => x.id === baseId));
    
    try {
      if (isBuiltIn) {
        // Mark built-in as deleted
        const matched: any = Object.values(templatesList).flatMap((list: any) => list).find((x: any) => x.id === baseId);
        const cat = Object.keys(templatesList).find((c: string) => templatesList[c].some((x: any) => x.id === baseId)) || 'official';
        const templateLang = id.endsWith('_en') ? 'en' : 'ar';

        const payload = {
          id,
          name: matched?.name || baseId,
          category: cat,
          lang: templateLang,
          content: '',
          isDeleted: true,
          module: 'hr',
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
      alert('Error deleting template');
    }
  };

  const handleResetBuiltInTemplate = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من رغبتك في استعادة قالب النظام الأصلي؟' : 'Are you sure you want to restore the default system template?')) return;
    try {
      const response = await fetch(`/api/dynamic/letter_templates/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        alert(lang === 'ar' ? 'تم استعادة القالب الافتراضي للنظام بنجاح!' : 'System template restored successfully!');
        fetchCustomTemplates();
      } else {
        alert(lang === 'ar' ? 'فشل استعادة القالب الافتراضي' : 'Failed to restore default template');
      }
    } catch (e) {
      console.error(e);
      alert('Error restoring default template');
    }
  };

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-document-area, #printable-document-area * {
            visibility: visible;
          }
          #printable-document-area {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 100% !important;
            box-sizing: border-box;
            box-shadow: none !important;
            background: white !important;
            transform: none !important;
          }
          /* Eliminate weird margins from standard page sizes */
          @page { margin: 20mm; size: A4; }
        }
      `}</style>

      <div className="glass-panel p-6 rounded-3xl bg-white/70 space-y-4 print:hidden">
        <div>
          <h2 className="text-xl font-black text-[#0072BC]">{lang === 'ar' ? 'مستندات الخطابات الفورية والشاملة' : 'Comprehensive Instant Documents Hub'}</h2>
          <p className="text-xs text-slate-400">
            {lang === 'ar' ? 'اختر القسم، ثم القالب، وحدد الموظف لتعبة البيانات تلقائياً. يمكنك التعديل الحر والطباعة مباشرة.' : 'Select category and template, pick an employee to auto fill. Free edit before printing.'}
          </p>
        </div>

        {/* Filters and Controls */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold print:hidden">
          
          <div>
            <label className="block mb-2 text-slate-500">{lang === 'ar' ? 'تصنيف النماذج' : 'Category'}</label>
            <select 
              className="w-full p-3 rounded-xl border border-slate-300" 
              value={docCategory} 
              onChange={(e) => {
                setDocCategory(e.target.value);
                const merged = getMergedTemplatesList();
                setDocTemplate(merged[e.target.value]?.[0]?.id || '');
              }}
            >
              {templateCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-slate-500">{lang === 'ar' ? 'اسم الخطاب' : 'Document Type'}</label>
            <select 
              className="w-full p-3 rounded-xl border border-slate-300"
              value={docTemplate}
              onChange={(e) => setDocTemplate(e.target.value)}
            >
              {getMergedTemplatesList()[docCategory]?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-slate-500">{lang === 'ar' ? 'الموظف المعني' : 'Target Employee'}</label>
            <select 
              className="w-full p-3 rounded-xl border border-slate-300"
              value={selectedDocEmp?.id || ''}
              onChange={(e) => setSelectedDocEmp(employees.find(em => em.id === e.target.value) || null)}
            >
              <option value="">{lang === 'ar' ? '-- اختر الموظف --' : '-- Select Employee --'}</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e['arabicName']}</option>)}
            </select>
          </div>
          
          <div className="md:col-span-3 flex justify-end gap-3 mt-2 flex-wrap">
            
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setDocLanguage('ar')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${docLanguage === 'ar' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:bg-slate-200'}`}
              >
                العربية
              </button>
              <button 
                onClick={() => setDocLanguage('en')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${docLanguage === 'en' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:bg-slate-200'}`}
              >
                English
              </button>
            </div>
    
            {canManageTemplates && (
              <button 
                onClick={() => {
                  setShowTemplateManager(true);
                  setEditingTemplate(null);
                  setTemplateName('');
                  setTemplateBody('');
                }} 
                className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-xl transition flex items-center gap-2 font-bold text-xs"
              >
                <SettingsIcon className="w-4 h-4" /> إدارة قوالب الخطابات
              </button>
            )}

            <button onClick={handlePrint} className="bg-[#00AEEF] hover:bg-[#0072BC] text-white px-6 py-3 rounded-xl transition flex items-center gap-2">
              <Printer className="w-4 h-4" /> طباعة المستند
            </button>
            <button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl transition flex items-center gap-2">
              <Save className="w-4 h-4" /> حفظ وتصدير للأرشيف
            </button>
          </div>
        </div>

        {/* Editable Preview Frame */}
        <div className="bg-slate-200 p-2 md:p-8 rounded-3xl -mx-4 md:mx-0 shadow-inner overflow-hidden print:bg-transparent print:shadow-none print:p-0 print:m-0 print:overflow-visible">
          <p className="text-center text-[10px] text-slate-400 mb-2 print:hidden">{lang === 'ar' ? 'معاينة قابلة للتعديل - انقر على النص للتعديل مباشرة' : 'Live Editable Preview'}</p>
          <div className="max-w-[210mm] mx-auto print:hidden">
            <RichTextToolbar />
          </div>
          <div id="printable-document-area" className="relative mx-auto bg-white shadow print:shadow-none print:m-0" style={{ width: '210mm', minHeight: '297mm', padding: '3cm', boxSizing: 'border-box', direction: 'rtl', display: 'flex', flexDirection: 'column' }}>
             
             {/* Formal Header */}
            <DocumentHeader />

            {/* Editable Content */}
            <div 
              contentEditable 
              suppressContentEditableWarning
              className="outline-none whitespace-pre-wrap font-sans text-sm leading-7 text-stone-800 min-h-[300px]" style={{ flexGrow: 1 }}
              onBlur={(e) => setDocContent(e.currentTarget.innerHTML)}
              dangerouslySetInnerHTML={{ __html: docContent }}
            />

            {/* Footer Signatures */}
            <div className="mt-16 pt-8 border-t border-stone-200 flex justify-between items-center text-[11px] select-none">
              <div>
                <p className="font-bold text-slate-400">توقيع المستلم:</p>
                <p className="mt-6 text-stone-400">....................................</p>
              </div>
              <div className="text-center font-serif opacity-30">
                <div className="w-24 h-24 rounded-full border border-dashed border-[#0072BC] flex items-center justify-center text-[#0072BC] font-mono text-[8px] mx-auto">
                  OFFICIAL SEAL
                </div>
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-400">إدارة الشركة</p>
                <p className="mt-6 text-stone-400">....................................</p>
              </div>
            </div>
            
            <DocumentFooter />
          </div>
        </div>

      </div>

      {/* Audit Logs / Saved Documents */}
      <div className="glass-panel p-6 rounded-3xl bg-white/70 print:hidden">
        <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <BookMarkedIcon className="w-5 h-5 text-[#0072BC]" /> {lang === 'ar' ? 'سجل الخطابات المصدرة والمحفوظة' : 'Exported Documents Log'}
        </h3>
        
        {loadingLogs ? (
          <p className="text-xs text-slate-400">جاري تحميل الأرشيف...</p>
        ) : exportLogs.length === 0 ? (
          <p className="text-xs text-slate-400">لا يوجد خطابات محفوظة بعد في قاعدة البيانات.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold">
                <tr>
                  <th className="p-3">تاريخ التصدير</th>
                  <th className="p-3">الموظف المعني</th>
                  <th className="p-3">نوع الخطاب</th>
                  <th className="p-3">بواسطة</th>
                  <th className="p-3 relative">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exportLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-3 font-mono text-slate-500">{new Date(log.exportedAt).toLocaleString('en-US')}</td>
                    <td className="p-3 font-bold text-[#0072BC]">{log.employeeName}</td>
                    <td className="p-3 text-slate-600">{log.title}</td>
                    <td className="p-3 flex items-center gap-2">
                       <Shield className="w-3 h-3 text-emerald-500" />
                       <span className="font-mono text-[10px] text-slate-400">{log.exportedBy}</span>
                    </td>
                    <td className="p-3">
                      <button 
                        onClick={() => {
                          setDocContent(log.content); 
                          // Scroll up gently
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition tooltip" 
                        title="معاينة"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custom Template Manager Modal */}
      {showTemplateManager && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-[#0072BC] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-xl">
                  <SettingsIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-black text-white">إدارة قوالب خطابات الموارد البشرية</h3>
                  <p className="text-[10px] text-white/70 mt-0.5">تعديل وإضافة قوالب مستندات شؤون الموظفين الرسمية في قاعدة البيانات</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowTemplateManager(false);
                  setEditingTemplate(null);
                  setTemplateName('');
                  setTemplateBody('');
                }}
                className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Right Panel: Template Form */}
              <div className="lg:col-span-7 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-extrabold text-[#0072BC] text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {editingTemplate ? 'تعديل قالب قائم' : 'إنشاء قالب موارد بشرية جديد'}
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block mb-1.5 text-xs text-slate-500 font-bold">اسم القالب</label>
                    <input 
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="مثال: شهادة شكر وتقدير موظف متميز"
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:ring-2 focus:ring-sky-100 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1.5 text-xs text-slate-500 font-bold">التصنيف</label>
                      <select
                        value={templateCategorySelected}
                        onChange={(e) => setTemplateCategorySelected(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:ring-2 focus:ring-sky-100 font-bold"
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
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:ring-2 focus:ring-sky-100 font-bold"
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
                      rows={11}
                      placeholder="اكتب نص الخطاب هنا. يمكنك استخدام المتغيرات التلقائية الموضحة في اليسار ليتم استبدالها تلقائياً عند تعبئة المستند..."
                      className="w-full p-3 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:ring-2 focus:ring-sky-100 font-mono leading-relaxed"
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
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-100"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{editingTemplate ? 'حفظ التعديلات' : 'إنشاء وحفظ القالب'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Left Panel: List of templates & variables guide */}
              <div className="lg:col-span-5 flex flex-col space-y-5">
                
                {/* List of templates */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-slate-700 text-xs">القوالب المتوفرة في النظام</h4>
                  <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-72 overflow-y-auto bg-white">
                    {(() => {
                      const allMerged: any[] = [];
                      
                      // Loop through built-in categories
                      Object.keys(templatesList).forEach(cat => {
                        templatesList[cat].forEach((t: any) => {
                          const dbEntry = customTemplates.find(x => x.id === t.id + '_ar' || x.id === t.id + '_en' || x.id === t.id);
                          if (dbEntry) {
                            if (dbEntry.isDeleted) {
                              allMerged.push({
                                id: t.id,
                                name: t.name,
                                category: cat,
                                lang: dbEntry.lang || 'ar',
                                isBuiltIn: true,
                                isDeleted: true,
                                content: getBuiltInHrTemplatePlaceholderContent(t.id, dbEntry.lang || 'ar')
                              });
                            } else {
                              allMerged.push({
                                id: dbEntry.id,
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
                              lang: 'ar',
                              isBuiltIn: true,
                              content: getBuiltInHrTemplatePlaceholderContent(t.id, 'ar')
                            });
                            allMerged.push({
                              id: t.id,
                              name: t.name + ' (EN)',
                              category: cat,
                              lang: 'en',
                              isBuiltIn: true,
                              content: getBuiltInHrTemplatePlaceholderContent(t.id, 'en')
                            });
                          }
                        });
                      });

                      // Add custom templates
                      customTemplates.forEach(t => {
                        const baseId = t.id.endsWith('_ar') || t.id.endsWith('_en') ? t.id.slice(0, -3) : t.id;
                        const isBuiltInId = Object.values(templatesList).some((list: any) => list.some((x: any) => x.id === baseId));
                        if (!isBuiltInId) {
                          allMerged.push({
                            id: t.id,
                            name: t.name,
                            category: t.category || 'official',
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

                      return allMerged.map((t, idx) => {
                        const catObj = templateCategories.find(c => c.id === t.category);
                        const isUniqueKey = `${t.id}_${t.lang}_${idx}`;
                        return (
                          <div key={isUniqueKey} className={`p-3 flex items-center justify-between hover:bg-slate-50 transition ${t.isDeleted ? 'opacity-50 bg-rose-50/20' : ''}`}>
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
                                {catObj?.name?.substring(catObj.name.indexOf(' ') + 1) || t.category} • {t.lang === 'ar' ? 'العربية' : 'English'}
                              </p>
                            </div>
                            
                            <div className="flex gap-1.5 items-center">
                              {!t.isDeleted ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingTemplate(t.rawDbEntry || { id: t.id, name: t.name, category: t.category, lang: t.lang, content: t.content });
                                      setTemplateName(t.name.replace(' (EN)', ''));
                                      setTemplateCategorySelected(t.category || 'official');
                                      setTemplateLang(t.lang || 'ar');
                                      setTemplateBody(t.content || '');
                                    }}
                                    className="p-1.5 hover:bg-slate-100 text-sky-600 rounded-lg transition cursor-pointer"
                                    title="تعديل القالب"
                                  >
                                    <EditIcon className="w-3.5 h-3.5" />
                                  </button>
                                  {(t.isCustom || t.isOverridden) && (
                                    <button
                                      onClick={() => handleDeleteCustomTemplate(t.id)}
                                      className="p-1.5 hover:bg-slate-100 text-rose-600 rounded-lg transition cursor-pointer"
                                      title="حذف القالب"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
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

                {/* Variables Guide */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h5 className="font-extrabold text-slate-700 text-xs flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-amber-500" />
                    المتغيرات التلقائية المتاحة
                  </h5>
                  <p className="text-[10px] text-slate-400 font-medium">
                    انقر على أي متغير أدناه لإدراجه مباشرة في النص لتخصيصه بشكل حي لكل موظف:
                  </p>
                  
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {[
                      { code: '{{اسم_الموظف}}', label: 'اسم الموظف' },
                      { code: '{{رقم_الهوية}}', label: 'الهوية / الإقامة' },
                      { code: '{{المسمى_الوظيفي}}', label: 'المسمى الوظيفي' },
                      { code: '{{القسم}}', label: 'القسم/الإدارة' },
                      { code: '{{تاريخ_الالتحاق}}', label: 'تاريخ التوظيف' },
                      { code: '{{الراتب_الأساسي}}', label: 'الراتب الأساسي' },
                      { code: '{{البدلات}}', label: 'مجموع البدلات' },
                      { code: '{{إجمالي_الراتب}}', label: 'إجمالي الراتب' },
                      { code: '{{التاريخ}}', label: 'تاريخ اليوم' }
                    ].map(v => (
                      <button
                        key={v.code}
                        type="button"
                        onClick={() => setTemplateBody(prev => prev + ' ' + v.code + ' ')}
                        className="bg-white hover:bg-sky-50 border border-slate-200 p-2 rounded-xl text-right transition cursor-pointer group flex flex-col justify-center"
                      >
                        <span className="text-[10px] font-black text-slate-700 group-hover:text-[#0072BC] transition">{v.label}</span>
                        <code className="text-[9px] text-[#0072BC] font-mono mt-0.5">{v.code}</code>
                      </button>
                    ))}
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

// Helper icon
function BookMarkedIcon(props: any) {
  return <svg {...props} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>;
}
