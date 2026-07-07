const fs = require('fs');
let content = fs.readFileSync('src/components/SalesQuotations.tsx', 'utf8');

const replacements = {
  "'تم حذف عرض السعر بنجاح', 'success'": "lang === 'ar' ? 'تم حذف عرض السعر بنجاح' : 'Quotation deleted successfully', 'success'",
  "'فشل الحذف', 'error'": "lang === 'ar' ? 'فشل الحذف' : 'Deletion failed', 'error'",
  "'تم حذف عروض الأسعار المحددة بنجاح', 'success'": "lang === 'ar' ? 'تم حذف عروض الأسعار المحددة بنجاح' : 'Selected quotations deleted successfully', 'success'",
  "`تم اعتماد عرض السعر رقم ${payload.quotationNumber}`, 'success'": "lang === 'ar' ? `تم اعتماد عرض السعر رقم ${payload.quotationNumber}` : `Quotation ${payload.quotationNumber} approved successfully`, 'success'",
  "'تم إلغاء الاعتماد وتحويله إلى مسودة', 'success'": "lang === 'ar' ? 'تم إلغاء الاعتماد وتحويله إلى مسودة' : 'Approval canceled and converted to draft', 'success'",
  "'تم الحفظ بنجاح', 'success'": "lang === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully', 'success'",
  "'الرجاء إضافة نموذج جديد أولاً أو اختيار نموذج مخصص لتحديثه', 'error'": "lang === 'ar' ? 'الرجاء إضافة نموذج جديد أولاً أو اختيار نموذج مخصص لتحديثه' : 'Please add a new template first or select a custom one to update', 'error'",
  "'لا يمكن تعديل نموذج العقد القياسي الافتراضي. استخدم \"إضافة نموذج جديد\"', 'error'": "lang === 'ar' ? 'لا يمكن تعديل نموذج العقد القياسي الافتراضي. استخدم \"إضافة نموذج جديد\"' : 'Cannot edit the default standard contract template. Use \"Add new template\"', 'error'",
  "'تم حفظ النموذج بنجاح', 'success'": "lang === 'ar' ? 'تم حفظ النموذج بنجاح' : 'Template saved successfully', 'success'",
  "'فشل الحفظ', 'error'": "lang === 'ar' ? 'فشل الحفظ' : 'Saving failed', 'error'",
  "'تم الحذف بنجاح', 'success'": "lang === 'ar' ? 'تم الحذف بنجاح' : 'Deleted successfully', 'success'"
};

for (const [key, value] of Object.entries(replacements)) {
  content = content.split(key).join(value);
}

fs.writeFileSync('src/components/SalesQuotations.tsx', content);
