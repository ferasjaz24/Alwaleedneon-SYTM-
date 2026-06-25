export const getStatusColors = (statusStr: string | undefined): string => {
  if (!statusStr) return 'bg-slate-100 text-slate-700 border border-slate-200';
  
  const s = statusStr.trim();
  switch (s) {
    // Green
    case 'مكتمل':
    case 'معتمد':
    case 'Approved':
    case 'تم التحصيل':
    case 'تم التحصيل متأخر':
    case 'تم الدفع':
    case 'مدفوعة':
    case 'مدفوع':
    case 'تم التركيب بنجاح':
    case 'تم التركيب والتشغيل':
    case 'تم التسليم':
    case 'مقبول':
    case 'approved':
      return 'bg-emerald-50 text-emerald-800 border border-emerald-200';

    // Amber / Orange
    case 'قيد المعالجة':
    case 'تحت المعالجة':
    case 'قيد التنفيذ':
    case 'في التنفيذ':
    case 'في انتظار الدفعة':
    case 'في انتظار الدفع':
    case 'في انتظار تعميد المسؤول المالي':
    case 'في انتظار المراجعة':
    case 'في التوريد':
      return 'bg-amber-50 text-amber-800 border border-amber-200';

    // Yellow
    case 'جاهز للتركيب':
    case 'قيد المراجعة':
    case 'مطلوب تعديل':
    case 'pending':
      return 'bg-yellow-50 text-yellow-800 border border-yellow-200';

    // Red
    case 'مرفوض':
    case 'مرفوض من المالية':
    case 'متأخر':
    case 'استحقاق متأخر':
    case 'غير مدفوع':
    case 'rejected':
      return 'bg-red-50 text-red-800 border border-red-200';

    // Blue
    case 'نشط':
    case 'أمر إنتاج':
    case 'قيد الإنتاج':
    case 'قيد الطلب':
    case 'في التركيب':
    case 'في المعالجة':
    case 'تم الارسال للتسعير':
      return 'bg-blue-50 text-blue-800 border border-blue-200';

    // Sky
    case 'في انتظار التركيب':
    case 'تم استلام المواد':
    case 'تم الطلب من المورد':
    case 'تم التقييد':
      return 'bg-sky-50 text-sky-800 border border-sky-200';

    // Purple
    case 'تم استلام الطلب':
    case 'طلب مبدئي':
      return 'bg-purple-50 text-purple-800 border border-purple-200';
      
    // Gray
    case 'مسودة':
    case 'Draft':
    case 'without_stamp':
    default:
      return 'bg-slate-50 text-slate-700 border border-slate-200';
  }
};
