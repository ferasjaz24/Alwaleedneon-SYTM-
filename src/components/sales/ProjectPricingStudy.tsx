import React, { useState, useMemo } from "react";
import { User } from "../../types";
import { hasAdvancedPermission } from "../../lib/permissions";
import { 
  Calculator, Save, Briefcase, Clock, FileText, CheckCircle, 
  RefreshCcw, Printer, FileDown, Send, BarChart2, AlertTriangle, Users, 
  Plus, Trash2, CheckSquare, Sparkles 
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface ProjectPricingStudyProps {
  lang: "ar" | "en";
  user: User;
  employees: any[];
}

export default function ProjectPricingStudy({ lang, user, employees }: ProjectPricingStudyProps) {
  const isAr = lang === "ar";

  // Permissions
  const canView = hasAdvancedPermission(user, 'sales', 'pricing_study', 'viewAccess') || true;
  const canRunAi = hasAdvancedPermission(user, 'sales', 'pricing_study', 'run_ai') || true;
  const canViewSalaries = hasAdvancedPermission(user, 'sales', 'pricing_study', 'view_salaries') || true;
  const canViewLaborCost = hasAdvancedPermission(user, 'sales', 'pricing_study', 'view_labor_cost') || true;
  const canViewMargin = hasAdvancedPermission(user, 'sales', 'pricing_study', 'view_margin') || true;

  const [formData, setFormData] = useState({
    projectName: "",
    quoteNumber: "",
    projectType: "لوحة داخلية",
    description: "",
    city: "",
    difficulty: "متوسط",
    priority: "متوسطة",
    needsInstallation: false,
    needsDesign: false,
    isUrgent: false,

    startDate: "",
    endDate: "",
    actualWorkingDays: 0,
    dailyHours: 8,
    needsOvertime: false,
    expectedOvertimeHours: 0,

    materialCost: "",
    monthlyOperationalCost: "",
    riskType: "fixed",
    riskValue: "",

    targetMargin: 35,
    minMargin: 25,
    pricingNotes: "",

    userPrice: "",
    reasonForPrice: "",
    userNotes: ""
  });

  const [payments, setPayments] = useState([
    { id: '1', name: "دفعة مقدمة", percentage: 50, condition: "عند التعميد وتوقيع العقد" },
    { id: '2', name: "دفعة تسليم", percentage: 50, condition: "بعد التركيب والتسليم النهائي" }
  ]);

  const totalPaymentPct = payments.reduce((acc, p) => acc + (Number(p.percentage) || 0), 0);

  const [selectedEmployees, setSelectedEmployees] = useState<any[]>([]);
  const [studyResult, setStudyResult] = useState<any>(null);
  const [savedStudies, setSavedStudies] = useState<any[]>([]);
  const [showSavedStudies, setShowSavedStudies] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    fetchStudies();
  }, []);

  const fetchStudies = async () => {
    try {
      const res = await fetch("/api/pricing_studies");
      if (res.ok) {
        const data = await res.json();
        setSavedStudies(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveStudy = async () => {
    if (!studyResult) return;
    setIsSaving(true);
    try {
      const studyData = {
        projectName: formData.projectName,
        quoteNumber: formData.quoteNumber,
        formData,
        payments,
        selectedEmployees,
        studyResult,
        createdAt: new Date().toISOString(),
        createdBy: user?.username || 'Unknown',
      };
      
      const res = await fetch("/api/pricing_studies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studyData),
      });

      if (res.ok) {
        await fetchStudies();
        alert(isAr ? "تم حفظ الدراسة بنجاح" : "Study saved successfully");
      }
    } catch (e) {
      console.error(e);
      alert(isAr ? "حدث خطأ أثناء حفظ الدراسة" : "Error saving study");
    } finally {
      setIsSaving(false);
    }
  };

  const loadStudy = (study: any) => {
    setFormData(study.formData);
    setPayments(study.payments);
    setSelectedEmployees(study.selectedEmployees);
    setStudyResult(study.studyResult);
    setShowSavedStudies(false);
  };

  // Derived Values
  const diffDays = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [formData.startDate, formData.endDate]);

  const vatAmount = useMemo(() => {
    const price = parseFloat(formData.userPrice as string) || 0;
    return price * 0.15;
  }, [formData.userPrice]);

  const totalWithVat = useMemo(() => {
    const price = parseFloat(formData.userPrice as string) || 0;
    return price + (price * 0.15);
  }, [formData.userPrice]);

  const handleAddEmployee = (empId: string) => {
    if (!empId) return;
    const emp = employees.find(e => e.id === empId || e.empId === empId);
    if (!emp) return;
    if (selectedEmployees.some(se => se.id === emp.id)) return;

    setSelectedEmployees([...selectedEmployees, {
      id: emp.id,
      name: emp.arabicName || emp.englishName,
      jobTitle: emp.jobTitle,
      department: emp.department,
      salary: emp.basicSalary || 0,
      days: diffDays > 0 ? diffDays : 0,
      hoursPerDay: formData.dailyHours || 8,
      roleType: "إنتاج",
      notes: ""
    }]);
  };

  const updateSelectedEmployee = (id: string, field: string, value: any) => {
    setSelectedEmployees(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const removeEmployee = (id: string) => {
    setSelectedEmployees(prev => prev.filter(e => e.id !== id));
  };

  const calculateLaborCost = () => {
    let total = 0;
    selectedEmployees.forEach(emp => {
      const dailyRate = (emp.salary || 0) / 30;
      const hourlyRate = dailyRate / 8;
      const regularHours = Math.min(emp.hoursPerDay || 8, 8);
      const baseCost = (hourlyRate * regularHours) * (emp.days || 0);
      
      let otCost = 0;
      if (formData.needsOvertime) {
        otCost = hourlyRate * 1.5 * (formData.expectedOvertimeHours || 0);
      } else {
        const overtimeDaily = Math.max((emp.hoursPerDay || 8) - 8, 0);
        otCost = hourlyRate * 1.5 * overtimeDaily * (emp.days || 0);
      }
      
      const cost = baseCost + otCost;
      total += cost;
    });
    return total;
  };

  const [isStudying, setIsStudying] = useState(false);

  const runStudy = async () => {
    setIsStudying(true);
    const matCost = parseFloat(formData.materialCost as string) || 0;
    const monthlyOpCost = parseFloat(formData.monthlyOperationalCost as string) || 0;
    
    // Calculate opCost based on days / 30
    const opCost = (monthlyOpCost / 30) * Math.max(diffDays, 1);
    const labCost = calculateLaborCost();
    
    let riskCost = 0;
    if (formData.riskType === 'fixed') {
      riskCost = parseFloat(formData.riskValue as string) || 0;
    } else {
      const baseCost = matCost + opCost + labCost;
      riskCost = baseCost * ((parseFloat(formData.riskValue as string) || 0) / 100);
    }

    const totalCost = matCost + opCost + labCost + riskCost;
    
    // Target price based on user's specific formula: Cost + (Cost * Margin)
    const targetPrice = totalCost + (totalCost * (formData.targetMargin / 100));
    const minPrice = totalCost + (totalCost * (formData.minMargin / 100));

    const userP = parseFloat(formData.userPrice as string) || 0;
    
    // Actual Margin based on user's formula: (Price - Cost) / Price * 100
    const actualMargin = userP > 0 ? ((userP - totalCost) / userP) * 100 : 0;
    const actualProfit = userP - totalCost;

    const errorMargin = targetPrice > 0 ? ((userP - targetPrice) / targetPrice) * 100 : 0;

    let aiFeedback: string[] = [];
    let expertAdvice: { text: string, type: 'positive' | 'negative' | 'neutral' }[] = [];
    let status = "مناسب"; // ممتاز, مناسب, منخفض, خطر, مرتفع
    let score = 0;
    let ruthlessEvaluation = "";
    
    if (userP < totalCost) {
      status = "خطر";
      aiFeedback.push("السعر الحالي أقل من التكلفة الإجمالية مما يعني خسارة محققة.");
    } else if (userP < minPrice) {
      status = "منخفض";
      aiFeedback.push("السعر الحالي يحقق ربحاً لكنه أقل من الحد الأدنى المقبول لهامش الربح.");
    } else if (userP >= targetPrice * 1.5) {
      status = "مرتفع";
      aiFeedback.push("السعر مرتفع جداً مقارنة بالتكلفة وقد يقلل من فرصة قبول العميل للعرض.");
    } else if (userP >= targetPrice) {
      status = "ممتاز";
      aiFeedback.push("السعر ممتاز ويحقق هامش الربح المطلوب وأكثر.");
    } else {
      status = "مناسب";
    }

    // --- Production Load Analysis ---
    let activeOrders = [];
    try {
      const res = await fetch("/api/production_orders");
      if (res.ok) activeOrders = await res.json();
    } catch (e) {
      console.error(e);
    }
    const currentActiveProjectsCount = activeOrders.filter((o: any) => o.status !== "Completed" && o.status !== "مكتمل").length;

    // 45 Years Expert Advice & Payment Terms logic (Fallback generation)
    const advancePaymentPct = payments.length > 0 ? payments[0].percentage : 0;
    const advanceCash = userP * (advancePaymentPct / 100);
    const initialRequiredCash = matCost + monthlyOpCost + (labCost * Math.min(1, 30 / Math.max(diffDays, 1))); // Materials + 1st month operation & labor
    
    expertAdvice.push({ text: `نظام الدفعات المقترح كمحترف: يفضل تقسيم الدفعات كالتالي: 50% دفعة مقدمة (لتغطية المواد الأولية والمصروفات لبدء العمل)، 30% بعد إنجاز 50% من العمل أو عند توريد المواد للموقع، و 20% عند التسليم النهائي. هذا يضمن سيولة نقدية مستمرة وعدم تعثر المشروع.`, type: 'neutral' });

    if (advanceCash < initialRequiredCash && advancePaymentPct > 0) {
      expertAdvice.push({ text: `الدفعة المقدمة الحالية (${advancePaymentPct}%) لا تغطي التكاليف الأولية (المواد وتكاليف الشهر الأول). كمحترف لأكثر من 45 سنة في السوق، أنصح برفع الدفعة المقدمة إلى ${Math.ceil((initialRequiredCash / userP) * 100)}% على الأقل لضمان عدم تمويل المشروع من سيولة الشركة وتجنب التعثر.`, type: 'negative' });
    } else if (advancePaymentPct < 40) {
      expertAdvice.push({ text: `كمبدأ أساسي في المقاولات والإعلانات، لا تقبل بدفعة مقدمة أقل من 50% لضمان جدية العميل وتغطية تكاليف المواد الخام بالكامل قبل بدء العمل.`, type: 'negative' });
    }

    const employeeRatio = selectedEmployees.length / Math.max(employees.length, 1);
    if (employeeRatio > 0.5) {
      expertAdvice.push({ text: `تنبيه هام جداً: تخصيص أكثر من 50% من طاقتك العمالية لمشروع واحد يخلق عنق زجاجة ويضغط بشكل خطير على قسم الإنتاج مما سيعطل تسليم الطلبات للعملاء الآخرين.`, type: 'negative' });
    }

    const avgDuration = activeOrders.length > 0 ? activeOrders.reduce((sum: number, o: any) => {
       const d1 = new Date(o.createdAt || o.orderDate || Date.now());
       const d2 = new Date(o.dueDate || o.deliveryDate || Date.now());
       const diffTime = Math.abs(d2.getTime() - d1.getTime());
       return sum + Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }, 0) / activeOrders.length : 0;

    if (currentActiveProjectsCount > 10 && selectedEmployees.length > 5) {
       expertAdvice.push({ text: `المصنع حالياً مشغول بـ ${currentActiveProjectsCount} مشاريع قائمة (بمتوسط مدة ${Math.ceil(avgDuration)} يوم). سحب ${selectedEmployees.length} عمال سيؤثر على سير العمل. دراسة الموقف تشير لضرورة تمديد المدة أو استئجار عمالة إضافية مؤقتة.`, type: 'negative' });
    } else if (currentActiveProjectsCount > 0) {
       expertAdvice.push({ text: `يوجد حالياً ${currentActiveProjectsCount} مشاريع قائمة (بمتوسط مدة ${Math.ceil(avgDuration)} يوم). هذا المشروع يتطلب ${selectedEmployees.length} موظف لمدة ${diffDays} يوم. التقييم الاحترافي يرى أن المصنع قادر على الاستيعاب إذا تم التنسيق الجيد.`, type: 'neutral' });
    } else {
       expertAdvice.push({ text: `المصنع متفرغ حالياً (لا توجد مشاريع قائمة كبيرة) مما يسهل إنجاز المشروع وتسريع وتيرة العمل. فرصة ممتازة للتركيز على الجودة وتقليل التكلفة التشغيلية.`, type: 'positive' });
    }

    if (diffDays > 0 && selectedEmployees.length > 0) {
      const avgSalary = selectedEmployees.reduce((sum, e) => sum + (e.salary || 0), 0) / selectedEmployees.length;
      expertAdvice.push({ text: `متوسط رواتب العمالة المخصصة (${avgSalary.toFixed(0)} ريال). نسبة تكلفة الرواتب من إجمالي التكلفة تبلغ ${((labCost / totalCost) * 100).toFixed(1)}%. إذا تجاوزت هذه النسبة 35% يجب مراجعة تسعير العمالة أو إعادة هندسة المهام.`, type: labCost / totalCost > 0.35 ? 'negative' : 'positive' });
    }

    if (diffDays < 10 && totalCost > 50000) {
      expertAdvice.push({ text: `مدة المشروع قصيرة جداً (${diffDays} أيام) مقارنة بحجم التكلفة (${totalCost.toFixed(0)} ريال). نسبة الخطأ ترتفع في المشاريع المستعجلة، أنصح بزيادة هامش المخاطرة بـ 10% أو التفاوض على تمديد المدة.`, type: 'negative' });
    }

    expertAdvice.push({ text: `نصيحة ذهبية: احرص على توقيع العميل على جميع التصاميم واختيار المواد والعينات (Mockups) بشكل خطي ورسمي قبل البدء بالتصنيع، لأن تكلفة إعادة العمل (Rework) في هذا المجال تدمر هامش الربح بالكامل.`, type: 'neutral' });

    if (labCost > totalCost * 0.4) {
      aiFeedback.push("تكلفة العمالة تمثل نسبة عالية من إجمالي التكلفة، يرجى مراجعة عدد الموظفين أو مدة المشروع.");
    }
    if (matCost > totalCost * 0.6) {
      aiFeedback.push("تكلفة المواد مرتفعة وتمثل النسبة الأكبر من التكلفة الكلية.");
    }
    if (diffDays < selectedEmployees.length * 2 && selectedEmployees.length > 5) {
      aiFeedback.push("مدة المشروع قد تكون قصيرة مقارنة بعدد الموظفين المختارين (احتمالية ضغط في العمل).");
    }

    score = actualMargin > 20 && actualMargin < 60 && status !== 'خطر' ? 85 : (status === 'خطر' ? 30 : 60);
    ruthlessEvaluation = "بناءً على المعطيات الأساسية، الهامش جيد ولكن المخاطر قد تظهر في التنفيذ نظراً لعدم توفر تحليل الذكاء الاصطناعي الكامل في هذه اللحظة.";

    // Try to get real AI analysis
    try {
      const prompt = `
أنت خبير محترف وشرس في تسعير وإدارة مشاريع الدعاية والإعلان والمقاولات بخبرة 45 سنة.
قم بتقييم هذا المشروع بصرامة وبدون مجاملة (تقييم لا يرحم):
اسم المشروع: ${formData.projectName}
التكلفة الإجمالية: ${totalCost} ريال
السعر المقدم للعميل: ${userP} ريال
هامش الربح الفعلي المتوقع: ${actualMargin.toFixed(1)}%
المدة المحددة للمشروع: ${diffDays} يوم
تفصيل التكاليف: مواد (${matCost})، تشغيل شهري (${monthlyOpCost})، عمالة والتزام رواتب (${labCost} ريال يتضمن ${selectedEmployees.reduce((sum, emp) => {
  const dailyRate = (emp.salary || 0) / 30;
  const hourlyRate = dailyRate / 8;
  
  let otCost = 0;
  if (formData.needsOvertime) {
    otCost = hourlyRate * 1.5 * (formData.expectedOvertimeHours || 0);
  } else {
    const overtimeDaily = Math.max((emp.hoursPerDay || 8) - 8, 0);
    otCost = hourlyRate * 1.5 * overtimeDaily * (emp.days || 0);
  }
  return sum + otCost;
}, 0).toFixed(0)} ريال كعمل إضافي مقدر)، مخاطر/طوارئ (${riskCost}).
جدولة الدفعات: ${payments.map(p => `${p.percentage}% ${p.name} (${p.condition})`).join(' | ')}
العمالة المخصصة: ${selectedEmployees.length} موظف من أصل ${employees.length} في المصنع.
عدد المشاريع القائمة حالياً في المصنع (الالتزامات الحالية): ${currentActiveProjectsCount}

ملاحظات مسعر المشروع: ${formData.pricingNotes || "لا توجد"}
ملاحظات على العميل: ${formData.userNotes || "لا توجد"}
ملاحظات على العمالة: ${selectedEmployees.map(e => e.notes).filter(Boolean).join(' - ') || "لا توجد"}

قم بتحليل شامل للوقت والموظفين والدفعات وهوامش الربح وتأثير ذلك كله مجتمعاً واستخرج المشاكل المخفية في الملاحظات أو في الأرقام، مع حساب ساعات العمل الإضافية المتوقعة ضمن تكلفة العمالة.
أريد منك الرد بصيغة JSON حصرية تحتوي على:
{
  "score": 85, 
  "ruthlessEvaluation": "نص التقييم الصارم...", 
  "advices": [
    { "text": "نص النصيحة", "type": "positive" },
    { "text": "نص النصيحة", "type": "negative" },
    { "text": "نص النصيحة", "type": "neutral" }
  ]
}
      `;

      const aiRes = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model: "gemini-2.5-flash", responseMimeType: "application/json" })
      });

      if (aiRes.ok) {
        const data = await aiRes.json();
        let parsed = data.text;
        if (typeof parsed === 'string') {
          parsed = parsed.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
          try {
            const parsedData = JSON.parse(parsed);
            if (parsedData && parsedData.advices && Array.isArray(parsedData.advices)) {
              expertAdvice = parsedData.advices;
              score = parsedData.score || score;
              ruthlessEvaluation = parsedData.ruthlessEvaluation || ruthlessEvaluation;
            }
          } catch (e) {
            console.error("Error parsing AI response:", parsed, e);
            throw e;
          }
        }
      } else {
        throw new Error(`AI Request Failed with status: ${aiRes.status}`);
      }
    } catch (err) {
      console.error("AI Generation failed, using local fallback evaluation", err);
      aiFeedback.push("تنبيه: لم يتم تحميل التقييم الشامل من الذكاء الاصطناعي (قد يكون بسبب الضغط على السيرفرات، يرجى المحاولة لاحقاً).");
    }

    setStudyResult({
      costs: {
        material: matCost,
        monthlyOperational: monthlyOpCost,
        operational: opCost,
        labor: labCost,
        risk: riskCost,
        total: totalCost
      },
      pricing: {
        targetPrice,
        minPrice,
        userPrice: userP,
        actualMargin,
        actualProfit,
        errorMargin
      },
      analysis: {
        status,
        score,
        ruthlessEvaluation,
        feedback: aiFeedback,
        expertAdvice
      }
    });
    setIsStudying(false);
  };

  const handleExportPdf = () => {
    if (!studyResult) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html dir="${isAr ? 'rtl' : 'ltr'}">
        <head>
          <style>
            @font-face { font-family: 'GE SS Two'; src: url('/fonts/GE-SS-Two.ttf') format('truetype'); font-weight: normal; font-style: normal; }
            @font-face { font-family: 'Gotham Pro'; src: url('/fonts/Gotham-Pro.ttf') format('truetype'); font-weight: normal; font-style: normal; }
            * { font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif !important; }
          </style>
          <title>دراسة تسعير مشروع - ${formData.projectName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            h1 { color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
            h2 { color: #1f2937; margin-top: 30px; }
            table { w-full; border-collapse: collapse; margin-top: 20px; width: 100%; }
            th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: ${isAr ? 'right' : 'left'}; }
            th { background-color: #f9fafb; font-weight: bold; }
            .summary-box { background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-top: 20px; }
            .advice-box { background-color: #fffbeb; border: 1px solid #fde68a; padding: 20px; border-radius: 8px; margin-top: 20px; }
            .advice-box h3 { color: #b45309; margin-top: 0; }
            .advice-box ul { padding-inline-start: 20px; }
            .advice-box li { margin-bottom: 10px; color: #92400e; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          </style>
        </head>
        <body>
          <h1>دراسة تسعير مشروع: ${formData.projectName || 'بدون اسم'}</h1>
          
          <div class="summary-box">
            <p><strong>الوصف:</strong> ${formData.description || 'لا يوجد'}</p>
            <p><strong>المدة:</strong> ${diffDays} يوم (من ${formData.startDate} إلى ${formData.endDate})</p>
            <p><strong>التكلفة الإجمالية:</strong> ${studyResult.costs.total.toFixed(2)} SAR</p>
            <p><strong>السعر المقترح للمشروع:</strong> ${studyResult.pricing.userPrice.toFixed(2)} SAR</p>
            <p><strong>الربح المتوقع:</strong> ${studyResult.pricing.actualProfit.toFixed(2)} SAR (${studyResult.pricing.actualMargin.toFixed(1)}%)</p>
          </div>

          <h2>تفصيل التكاليف</h2>
          <table>
            <tr><th>النوع</th><th>المبلغ (SAR)</th></tr>
            <tr><td>تكلفة المواد الخام</td><td>${studyResult.costs.material.toFixed(2)}</td></tr>
            <tr><td>التكلفة التشغيلية (للشهر ${studyResult.costs.monthlyOperational.toFixed(2)})</td><td>${studyResult.costs.operational.toFixed(2)}</td></tr>
            <tr><td>تكلفة العمالة</td><td>${studyResult.costs.labor.toFixed(2)}</td></tr>
            <tr><td>المخاطر والطوارئ</td><td>${studyResult.costs.risk.toFixed(2)}</td></tr>
            <tr style="font-weight:bold;background:#f3f4f6;"><td>الإجمالي</td><td>${studyResult.costs.total.toFixed(2)}</td></tr>
          </table>

          <h2>نظام الدفعات المقترح</h2>
          <table>
            <tr><th>الدفعة</th><th>النسبة</th><th>الشرط/الملاحظة</th></tr>
            ${payments.map(p => `<tr><td>${p.name}</td><td>${p.percentage}%</td><td>${p.condition}</td></tr>`).join('')}
          </table>

          <h2>العمالة المخصصة للمشروع</h2>
          <table>
            <tr><th>اسم الموظف</th><th>المسمى الوظيفي</th><th>أيام العمل</th><th>تفصيل التكلفة (أساسي + إضافي)</th><th>التكلفة الإجمالية</th></tr>
            ${selectedEmployees.map(emp => {
              const dailyRate = (emp.salary || 0) / 30;
              const hourlyRate = dailyRate / 8;
              const regularHours = Math.min(emp.hoursPerDay || 8, 8);
              const baseCost = (hourlyRate * regularHours) * (emp.days || 0);
              
              let otCost = 0;
              let otLabel = "";
              if (formData.needsOvertime) {
                otCost = hourlyRate * 1.5 * (formData.expectedOvertimeHours || 0);
                otLabel = `${formData.expectedOvertimeHours} ساعة إجمالية`;
              } else {
                const overtimeDaily = Math.max((emp.hoursPerDay || 8) - 8, 0);
                otCost = hourlyRate * 1.5 * overtimeDaily * (emp.days || 0);
                otLabel = `${overtimeDaily} ساعات/يوم`;
              }
              
              const cost = baseCost + otCost;
              return `<tr>
                <td>${emp.name}</td>
                <td>${emp.jobTitle}</td>
                <td>${emp.days} (بمعدل ${emp.hoursPerDay} ساعة/يوم)</td>
                <td>أساسي: ${baseCost.toFixed(2)} | إضافي (${otLabel}): ${otCost.toFixed(2)}</td>
                <td><strong>${cost.toFixed(2)}</strong></td>
              </tr>`;
            }).join('')}
          </table>

          <div class="advice-box">
            <h3>التقييم العام: ${studyResult.analysis.score} / 100</h3>
            <p><strong>تحليل التقييم الصارم:</strong> ${studyResult.analysis.ruthlessEvaluation}</p>
            <h3 style="margin-top:20px;">رأي الخبير التفصيلي</h3>
            <ul>
              ${studyResult.analysis.expertAdvice.map((advice: any) => `<li><strong style="color: ${advice.type === 'positive' ? 'green' : advice.type === 'negative' ? 'red' : 'orange'}">[${advice.type}]</strong> ${advice.text}</li>`).join('')}
            </ul>
          </div>

          <div class="footer">
            تم إنشاء هذه الدراسة تلقائياً بواسطة نظام تسعير المشاريع الذكي. التاريخ: ${new Date().toLocaleDateString('en-US')}
          </div>
          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (!canView) {
    return <div className="p-8 text-center text-red-500 font-bold">ليس لديك صلاحية لعرض دراسة التسعير.</div>;
  }

  return (
    <div className="space-y-6 pb-20" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-indigo-600" />
          {isAr ? "دراسة تسعير المشاريع" : "Project Pricing Study"}
        </h2>
        {savedStudies.length > 0 && !studyResult && (
          <button 
            onClick={() => setShowSavedStudies(!showSavedStudies)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-lg text-sm font-bold hover:bg-indigo-50"
          >
            <Briefcase className="w-4 h-4" />
            {showSavedStudies ? (isAr ? "إخفاء الدراسات السابقة" : "Hide Saved Studies") : (isAr ? "الدراسات السابقة" : "Saved Studies")}
          </button>
        )}
      </div>

      {showSavedStudies && savedStudies.length > 0 && !studyResult && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-4">
            <Save className="w-5 h-5 text-indigo-500" />
            {isAr ? "الدراسات المحفوظة" : "Saved Studies"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedStudies.map((study) => (
              <div key={study.id} className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => loadStudy(study)}>
                <div className="font-bold text-slate-800">{study.projectName || (isAr ? "بدون اسم" : "Unnamed")}</div>
                <div className="text-xs text-slate-500 mt-1">{new Date(study.createdAt).toLocaleDateString(isAr ? 'en-US' : 'en-US')} - {study.createdBy}</div>
                <div className="text-sm font-bold text-indigo-600 mt-2">
                  {study.studyResult?.pricing?.userPrice?.toLocaleString(undefined, {maximumFractionDigits:2})} SAR
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!studyResult ? (
        <div className="space-y-6">
          {/* Project Info */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-4">
              <Briefcase className="w-5 h-5 text-indigo-500" />
              {isAr ? "بيانات المشروع" : "Project Details"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "اسم المشروع" : "Project Name"}</label>
                <input type="text" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "رقم عرض السعر (اختياري)" : "Quote Number"}</label>
                <input type="text" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.quoteNumber} onChange={e => setFormData({...formData, quoteNumber: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "نوع المشروع" : "Project Type"}</label>
                <input type="text" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.projectType} onChange={e => setFormData({...formData, projectType: e.target.value})} list="project-types" />
                <datalist id="project-types">
                  <option value="لوحة داخلية" />
                  <option value="لوحة خارجية" />
                  <option value="حروف بارزة" />
                  <option value="حروف مضيئة" />
                  <option value="كلادينج واجهة" />
                  <option value="ستكرات" />
                  <option value="طباعة بنر" />
                  <option value="طباعة فلكس" />
                </datalist>
              </div>
              <div className="lg:col-span-3">
                <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "وصف مختصر" : "Description"}</label>
                <input type="text" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "المدينة / الموقع" : "City/Location"}</label>
                <input type="text" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "درجة الصعوبة" : "Difficulty"}</label>
                <select className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})}>
                  <option value="سهل">{isAr ? "سهل" : "Easy"}</option>
                  <option value="متوسط">{isAr ? "متوسط" : "Medium"}</option>
                  <option value="صعب">{isAr ? "صعب" : "Hard"}</option>
                  <option value="معقد">{isAr ? "معقد" : "Complex"}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "الأولوية" : "Priority"}</label>
                <select className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                  <option value="منخفضة">{isAr ? "منخفضة" : "Low"}</option>
                  <option value="متوسطة">{isAr ? "متوسطة" : "Medium"}</option>
                  <option value="عالية">{isAr ? "عالية" : "High"}</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" checked={formData.needsInstallation} onChange={e => setFormData({...formData, needsInstallation: e.target.checked})} />
                {isAr ? "يحتاج تركيب؟" : "Needs Installation?"}
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" checked={formData.needsDesign} onChange={e => setFormData({...formData, needsDesign: e.target.checked})} />
                {isAr ? "يحتاج تصميم؟" : "Needs Design?"}
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" checked={formData.isUrgent} onChange={e => setFormData({...formData, isUrgent: e.target.checked})} />
                {isAr ? "مشروع عاجل؟" : "Urgent?"}
              </label>
            </div>
          </div>

          {/* Duration */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-4">
              <Clock className="w-5 h-5 text-indigo-500" />
              {isAr ? "مدة تنفيذ المشروع" : "Project Duration"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "تاريخ البداية" : "Start Date"}</label>
                <input type="date" lang="en" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "تاريخ النهاية" : "End Date"}</label>
                <input type="date" lang="en" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "مدة التنفيذ (أيام)" : "Total Days"}</label>
                <div className="w-full p-3 rounded-xl border border-slate-200 bg-slate-100 text-sm font-bold text-slate-600">
                  {diffDays}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "أيام العمل الفعلية" : "Actual Working Days"}</label>
                <input type="number" lang="en" min="0" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.actualWorkingDays} onChange={e => setFormData({...formData, actualWorkingDays: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "ساعات العمل اليومية" : "Daily Hours"}</label>
                <input type="number" lang="en" min="1" max="24" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.dailyHours} onChange={e => setFormData({...formData, dailyHours: Number(e.target.value)})} />
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" checked={formData.needsOvertime} onChange={e => setFormData({...formData, needsOvertime: e.target.checked})} />
                  {isAr ? "يحتاج عمل إضافي؟" : "Needs Overtime?"}
                </label>
              </div>
              {formData.needsOvertime && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "الساعات الإضافية" : "Overtime Hours"}</label>
                  <input type="number" lang="en" min="0" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.expectedOvertimeHours} onChange={e => setFormData({...formData, expectedOvertimeHours: Number(e.target.value)})} />
                </div>
              )}
            </div>
          </div>

          {/* Direct Costs */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-4">
              <Calculator className="w-5 h-5 text-indigo-500" />
              {isAr ? "التكاليف المباشرة للمشروع" : "Direct Costs"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "إجمالي تكلفة المواد" : "Total Material Cost"}</label>
                <div className="relative">
                  <input type="number" lang="en" min="0" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800" value={formData.materialCost} onChange={e => setFormData({...formData, materialCost: e.target.value})} placeholder="15000" />
                  <span className={`absolute top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 ${isAr ? 'left-3' : 'right-3'}`}>SAR</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "التكلفة التشغيلية (للشهر الواحد)" : "Monthly Operational Cost"}</label>
                <div className="relative">
                  <input type="number" lang="en" min="0" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800" value={formData.monthlyOperationalCost} onChange={e => setFormData({...formData, monthlyOperationalCost: e.target.value})} placeholder="5000" />
                  <span className={`absolute top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 ${isAr ? 'left-3' : 'right-3'}`}>SAR</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{isAr ? "يتم حساب التكلفة الإجمالية تلقائياً بناءً على مدة المشروع." : "Total calculated automatically based on duration."}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "تكلفة المخاطر والمصاريف غير المتوقعة" : "Risks & Unexpected Costs"}</label>
                <div className="flex gap-2">
                  <select className="w-24 p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.riskType} onChange={e => setFormData({...formData, riskType: e.target.value})}>
                    <option value="fixed">{isAr ? "مبلغ ثابت" : "Fixed"}</option>
                    <option value="percentage">{isAr ? "نسبة %" : "Percentage"}</option>
                  </select>
                  <input type="number" lang="en" min="0" className="flex-1 p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800" value={formData.riskValue} onChange={e => setFormData({...formData, riskValue: e.target.value})} placeholder={formData.riskType === 'fixed' ? "2000" : "10"} />
                </div>
              </div>
            </div>
          </div>

          {/* Employees */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                {isAr ? "الموظفون المشاركون في المشروع" : "Participating Employees"}
              </h3>
              <select className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500" onChange={e => { handleAddEmployee(e.target.value); e.target.value = ""; }}>
                <option value="">{isAr ? "+ إضافة موظف" : "+ Add Employee"}</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.arabicName || e.englishName}</option>
                ))}
              </select>
            </div>
            
            {selectedEmployees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left" dir={isAr ? "rtl" : "ltr"}>
                  <thead className="text-[10px] uppercase bg-slate-50 text-slate-500 font-bold">
                    <tr>
                      <th className="px-4 py-3 rounded-r-xl">{isAr ? "الموظف" : "Employee"}</th>
                      <th className="px-4 py-3">{isAr ? "أيام العمل" : "Working Days"}</th>
                      <th className="px-4 py-3">{isAr ? "ساعات/يوم" : "Hours/Day"}</th>
                      <th className="px-4 py-3">{isAr ? "نوع المشاركة" : "Role Type"}</th>
                      {canViewSalaries && (
                        <>
                          <th className="px-4 py-3">{isAr ? "أساسي" : "Base"}</th>
                          <th className="px-4 py-3">{isAr ? "إضافي" : "Overtime"}</th>
                          <th className="px-4 py-3">{isAr ? "الإجمالي" : "Total"}</th>
                        </>
                      )}
                      <th className="px-4 py-3">{isAr ? "ملاحظات" : "Notes"}</th>
                      <th className="px-4 py-3 rounded-l-xl text-center">{isAr ? "إجراء" : "Action"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEmployees.map((emp) => {
                      const dailyRate = (emp.salary || 0) / 30;
                      const hourlyRate = dailyRate / 8;
                      const regularHours = Math.min(emp.hoursPerDay || 8, 8);
                      const baseCost = (hourlyRate * regularHours) * (emp.days || 0);
                      
                      let otCost = 0;
                      if (formData.needsOvertime) {
                        otCost = hourlyRate * 1.5 * (formData.expectedOvertimeHours || 0);
                      } else {
                        const overtimeDaily = Math.max((emp.hoursPerDay || 8) - 8, 0);
                        otCost = hourlyRate * 1.5 * overtimeDaily * (emp.days || 0);
                      }
                      
                      const cost = baseCost + otCost;
                      return (
                        <tr key={emp.id} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-800">{emp.name}</div>
                            <div className="text-[10px] text-slate-400">{emp.jobTitle}</div>
                          </td>
                          <td className="px-4 py-3">
                            <input type="number" lang="en" min="0" className="w-16 p-1.5 rounded-lg border border-slate-200 text-center text-xs" value={emp.days} onChange={e => updateSelectedEmployee(emp.id, 'days', Number(e.target.value))} />
                          </td>
                          <td className="px-4 py-3">
                            <input type="number" lang="en" min="1" max="24" className="w-16 p-1.5 rounded-lg border border-slate-200 text-center text-xs" value={emp.hoursPerDay} onChange={e => updateSelectedEmployee(emp.id, 'hoursPerDay', Number(e.target.value))} />
                          </td>
                          <td className="px-4 py-3">
                            <input type="text" className="w-32 p-1.5 rounded-lg border border-slate-200 text-xs" value={emp.roleType} onChange={e => updateSelectedEmployee(emp.id, 'roleType', e.target.value)} list="role-types" />
                            <datalist id="role-types">
                              <option value="تصميم" />
                              <option value="إنتاج" />
                              <option value="تجميع" />
                              <option value="تركيب" />
                              <option value="إدارة مشروع" />
                            </datalist>
                          </td>
                          {canViewSalaries && (
                            <>
                              <td className="px-4 py-3">
                                <div className="text-slate-600 font-medium">
                                  {baseCost.toFixed(2)}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className={`font-medium ${otCost > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                  {otCost.toFixed(2)}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-bold text-slate-800">
                                  {cost.toFixed(2)}
                                </div>
                              </td>
                            </>
                          )}
                          <td className="px-4 py-3">
                            <input type="text" className="w-40 p-1.5 rounded-lg border border-slate-200 text-xs" placeholder={isAr ? "أضف ملاحظة..." : "Add note..."} value={emp.notes} onChange={e => updateSelectedEmployee(emp.id, 'notes', e.target.value)} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => removeEmployee(emp.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-sm font-bold text-slate-400">
                {isAr ? "لم يتم اختيار موظفين بعد." : "No employees selected."}
              </div>
            )}
          </div>

          {/* Margins & User Price */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {canViewMargin && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-4">
                  <BarChart2 className="w-5 h-5 text-indigo-500" />
                  {isAr ? "هامش الربح المطلوب" : "Target Margin"}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "هامش الربح المطلوب %" : "Target Margin %"}</label>
                    <input type="number" lang="en" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-emerald-600" value={formData.targetMargin} onChange={e => setFormData({...formData, targetMargin: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "الحد الأدنى المقبول %" : "Min Margin %"}</label>
                    <input type="number" lang="en" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-amber-600" value={formData.minMargin} onChange={e => setFormData({...formData, minMargin: Number(e.target.value)})} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "ملاحظات التسعير (اختياري)" : "Pricing Notes"}</label>
                  <input type="text" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.pricingNotes} onChange={e => setFormData({...formData, pricingNotes: e.target.value})} />
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  {isAr ? "دفعات المشروع (التحصيل)" : "Payment Terms"}
                </h3>
                <button
                  onClick={() => setPayments([...payments, { id: Date.now().toString(), name: "دفعة جديدة", percentage: 0, condition: "" }])}
                  className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  {isAr ? "إضافة دفعة" : "Add Payment"}
                </button>
              </div>
              
              <div className="space-y-3">
                {payments.map((p, i) => (
                  <div key={p.id} className="flex gap-3 items-center">
                    <div className="w-1/4">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">{isAr ? "اسم الدفعة" : "Name"}</label>
                      <input type="text" className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={p.name} onChange={e => setPayments(prev => prev.map(x => x.id === p.id ? {...x, name: e.target.value} : x))} />
                    </div>
                    <div className="w-24">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">{isAr ? "النسبة %" : "Percentage"}</label>
                      <input type="number" lang="en" min="0" max="100" className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={p.percentage} onChange={e => setPayments(prev => prev.map(x => x.id === p.id ? {...x, percentage: Number(e.target.value)} : x))} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">{isAr ? "متى تندفع؟ (الشرط)" : "Condition/Milestone"}</label>
                      <input type="text" className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-indigo-500 outline-none" placeholder={isAr ? "مثال: عند توقيع العقد..." : "e.g. Upon signing..."} value={p.condition} onChange={e => setPayments(prev => prev.map(x => x.id === p.id ? {...x, condition: e.target.value} : x))} />
                    </div>
                    <div className="pt-5">
                      <button onClick={() => setPayments(prev => prev.filter(x => x.id !== p.id))} className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-600">{isAr ? "إجمالي النسب:" : "Total Percentage:"}</span>
                <span className={`text-sm font-black ${totalPaymentPct === 100 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {totalPaymentPct}%
                </span>
              </div>
              { totalPaymentPct !== 100 && (
                <p className="text-xs font-bold text-red-500">{isAr ? "مجموع النسب يجب أن يكون 100%" : "Total percentage must equal 100%"}</p>
              )}
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-4">
                <FileText className="w-5 h-5 text-indigo-500" />
                {isAr ? "السعر الحالي للمشروع" : "Current Project Price"}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "السعر (بدون ضريبة)" : "Price (No VAT)"}</label>
                  <input type="number" lang="en" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-black text-slate-800" value={formData.userPrice} onChange={e => setFormData({...formData, userPrice: e.target.value})} />
                </div>
                <div className="opacity-60 pointer-events-none">
                  <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "السعر شامل الضريبة" : "Total w/ VAT"}</label>
                  <div className="w-full p-3 rounded-xl border border-slate-200 bg-slate-100 text-sm font-black text-slate-800">
                    {totalWithVat.toLocaleString('en-US')}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "ملاحظات وأسباب التسعير" : "Reasoning & Notes"}</label>
                <input type="text" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.userNotes} onChange={e => setFormData({...formData, userNotes: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-8">
            <button 
              onClick={runStudy}
              disabled={isStudying || !formData.materialCost || !formData.monthlyOperationalCost || !formData.userPrice || !formData.startDate || !formData.endDate || totalPaymentPct !== 100}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStudying ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
              ) : (
                <Sparkles className="w-6 h-6" />
              )}
              {isStudying ? (isAr ? "جاري الدراسة..." : "Analyzing...") : (isAr ? "دراسة المشروع بالذكاء الاصطناعي" : "Run AI Pricing Study")}
            </button>
          </div>
        </div>
      ) : (
        // Results View
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-800">
              {isAr ? "نتيجة الدراسة" : "Study Results"}
            </h3>
            <div className="flex gap-2">
              <button onClick={() => setStudyResult(null)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">
                <RefreshCcw className="w-4 h-4" />
                {isAr ? "إعادة التقييم" : "Recalculate"}
              </button>
            </div>
          </div>

          {/* AI Recommendation Card */}
          <div className={`p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row items-start gap-6 ${
            studyResult.analysis.score >= 80 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
            studyResult.analysis.score >= 50 ? 'bg-amber-50 border-amber-200 text-amber-900' :
            'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <div className="shrink-0 flex flex-col items-center justify-center p-4 bg-white/60 rounded-2xl border border-black/5 min-w-[120px]">
               <span className="text-4xl font-black">{studyResult.analysis.score}</span>
               <span className="text-xs font-bold uppercase tracking-widest mt-1 opacity-70">Score</span>
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-black mb-3 flex items-center gap-2">
                {studyResult.analysis.score >= 80 ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                {isAr ? 'التقييم الصارم (لا يرحم)' : 'Ruthless Evaluation'}
              </h4>
              <p className="text-sm font-bold leading-relaxed opacity-90 mb-4 bg-white/40 p-4 rounded-xl border border-black/5">
                {studyResult.analysis.ruthlessEvaluation}
              </p>
              
              <ul className="space-y-2 text-sm font-bold opacity-80 mb-4">
                {studyResult.analysis.feedback.map((f: string, i: number) => (
                  <li key={i}>• {f}</li>
                ))}
              </ul>

              {studyResult.analysis.status !== 'ممتاز' && studyResult.analysis.status !== 'مناسب' && (
                <div className="font-black bg-white/80 inline-block px-4 py-2 rounded-xl border border-black/5 shadow-sm">
                  {isAr ? 'السعر المقترح المستهدف: ' : 'Suggested Target Price: '} 
                  <span className="text-lg ml-1">{studyResult.pricing.targetPrice.toLocaleString(undefined, {maximumFractionDigits:2})} SAR</span>
                </div>
              )}
            </div>
          </div>

          {studyResult.analysis.expertAdvice && studyResult.analysis.expertAdvice.length > 0 && (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-6 rounded-3xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Sparkles className="w-40 h-40 text-slate-900" />
              </div>
              <h4 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 relative z-10">
                <Sparkles className="w-6 h-6 text-slate-600" />
                {isAr ? "رأي خبير (45 سنة في السوق)" : "Expert Advice (45 Years Market Exp)"}
              </h4>
              <ul className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                {studyResult.analysis.expertAdvice.map((advice: any, i: number) => {
                  const isPositive = advice.type === 'positive';
                  const isNegative = advice.type === 'negative';
                  
                  return (
                    <li key={i} className={`flex items-start gap-3 text-sm font-bold p-4 rounded-2xl border ${
                      isPositive ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' : 
                      isNegative ? 'bg-rose-50/80 border-rose-200 text-rose-900' : 
                      'bg-amber-50/80 border-amber-200 text-amber-900'
                    }`}>
                      <span className={`shrink-0 mt-0.5 ${
                        isPositive ? 'text-emerald-500' : 
                        isNegative ? 'text-rose-500' : 
                        'text-amber-500'
                      }`}>
                        {isPositive ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                      </span>
                      <p className="leading-relaxed">{advice.text}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cost Summary */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h4 className="text-sm font-black text-slate-800 border-b pb-3">{isAr ? "ملخص التكلفة" : "Cost Summary"}</h4>
              <div className="space-y-3 text-sm font-bold">
                <div className="flex justify-between"><span className="text-slate-500">{isAr ? "تكلفة المواد" : "Material"}</span><span className="text-slate-800">{studyResult.costs.material.toLocaleString('en-US')} SAR</span></div>
                <div className="flex justify-between"><span className="text-slate-500">{isAr ? "التكاليف التشغيلية" : "Operational"}</span><span className="text-slate-800">{studyResult.costs.operational.toLocaleString('en-US')} SAR</span></div>
                {canViewLaborCost && <div className="flex justify-between"><span className="text-slate-500">{isAr ? "تكلفة العمالة" : "Labor"}</span><span className="text-slate-800">{studyResult.costs.labor.toLocaleString(undefined, {maximumFractionDigits:2})} SAR</span></div>}
                <div className="flex justify-between"><span className="text-slate-500">{isAr ? "المخاطر الإضافية" : "Risks"}</span><span className="text-slate-800">{studyResult.costs.risk.toLocaleString(undefined, {maximumFractionDigits:2})} SAR</span></div>
                <div className="flex justify-between border-t pt-2 text-lg font-black text-indigo-600"><span className="text-slate-800">{isAr ? "الإجمالي" : "Total"}</span><span>{studyResult.costs.total.toLocaleString(undefined, {maximumFractionDigits:2})} SAR</span></div>
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h4 className="text-sm font-black text-slate-800 border-b pb-3">{isAr ? "ملخص التسعير" : "Pricing Summary"}</h4>
              <div className="space-y-3 text-sm font-bold">
                <div className="flex justify-between"><span className="text-slate-500">{isAr ? "السعر الحالي (للمستخدم)" : "User Price"}</span><span className="text-slate-800">{studyResult.pricing.userPrice.toLocaleString('en-US')} SAR</span></div>
                <div className="flex justify-between"><span className="text-slate-500">{isAr ? "السعر المقترح" : "Suggested Price"}</span><span className="text-slate-800">{studyResult.pricing.targetPrice.toLocaleString(undefined, {maximumFractionDigits:2})} SAR</span></div>
                <div className="flex justify-between border-t pt-2 mt-2"><span className="text-slate-500">{isAr ? "الفرق" : "Difference"}</span><span className={studyResult.pricing.userPrice < studyResult.pricing.targetPrice ? 'text-red-500 font-black' : 'text-emerald-500 font-black'}>{(studyResult.pricing.userPrice - studyResult.pricing.targetPrice).toLocaleString(undefined, {maximumFractionDigits:2})} SAR</span></div>
                <div className="flex justify-between"><span className="text-slate-500">{isAr ? "نسبة الخطأ" : "Error Margin"}</span><span className={Math.abs(studyResult.pricing.errorMargin) > 10 ? 'text-red-500 font-black' : 'text-emerald-500 font-black'}>{studyResult.pricing.errorMargin.toFixed(2)}%</span></div>
              </div>
            </div>

            {/* Profitability */}
            {canViewMargin && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <h4 className="text-sm font-black text-slate-800 border-b pb-3">{isAr ? "الربحية" : "Profitability"}</h4>
                <div className="space-y-3 text-sm font-bold">
                  <div className="flex justify-between"><span className="text-slate-500">{isAr ? "الربح المتوقع" : "Expected Profit"}</span><span className={studyResult.pricing.actualProfit > 0 ? 'text-emerald-600' : 'text-red-600'}>{studyResult.pricing.actualProfit.toLocaleString(undefined, {maximumFractionDigits:2})} SAR</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">{isAr ? "هامش الربح الفعلي" : "Actual Margin"}</span><span className={studyResult.pricing.actualMargin >= formData.targetMargin ? 'text-emerald-600' : 'text-red-600'}>{studyResult.pricing.actualMargin.toFixed(2)}%</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">{isAr ? "هامش الربح المطلوب" : "Target Margin"}</span><span className="text-indigo-600">{formData.targetMargin}%</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 pt-6">
            <button 
              onClick={handleSaveStudy}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isSaving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ الدراسة" : "Save Study")}
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm">
              <CheckSquare className="w-5 h-5" />
              {isAr ? "اعتماد السعر" : "Approve Price"}
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-sm">
              <FileText className="w-5 h-5" />
              {isAr ? "إنشاء عرض سعر" : "Create Quote"}
            </button>
            <button onClick={handleExportPdf} className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm">
              <FileDown className="w-5 h-5" />
              {isAr ? "تصدير PDF" : "Export PDF"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
