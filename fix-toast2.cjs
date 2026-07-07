const fs = require('fs');
let content = fs.readFileSync('src/components/SalesLetters.tsx', 'utf8');

const replacements = {
  "'حدث خطأ أثناء تقديم الطلب.', 'error'": "lang === 'ar' ? 'حدث خطأ أثناء تقديم الطلب.' : 'Error submitting request.', 'error'",
  "'فشل في تقديم الطلب، يرجى المحاولة مرة أخرى.', 'error'": "lang === 'ar' ? 'فشل في تقديم الطلب، يرجى المحاولة مرة أخرى.' : 'Failed to submit request, please try again.', 'error'",
  "'خطأ: المعرّف الخاص بهذا الخطاب غير متوفر. يرجى إعادة تحميل الصفحة.', 'error'": "lang === 'ar' ? 'خطأ: المعرّف الخاص بهذا الخطاب غير متوفر. يرجى إعادة تحميل الصفحة.' : 'Error: Letter identifier is not available. Please reload the page.', 'error'",
  "'خطأ: المعرّف أو الإجراء غير صالح.', 'error'": "lang === 'ar' ? 'خطأ: المعرّف أو الإجراء غير صالح.' : 'Error: Invalid identifier or action type.', 'error'",
  "'فشل إكمال الإجراء المطلوب.', 'error'": "lang === 'ar' ? 'فشل إكمال الإجراء المطلوب.' : 'Failed to complete requested action.', 'error'",
  "'حدث خطأ أثناء الاتصال بالخادم.', 'error'": "lang === 'ar' ? 'حدث خطأ أثناء الاتصال بالخادم.' : 'Server connection error occurred.', 'error'",
  "successMsg, 'success'": "successMsg, 'success'"
};

for (const [key, value] of Object.entries(replacements)) {
  content = content.split(key).join(value);
}

fs.writeFileSync('src/components/SalesLetters.tsx', content);
