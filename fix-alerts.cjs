const fs = require('fs');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [key, value] of Object.entries(replacements)) {
    content = content.split(key).join(value);
  }
  fs.writeFileSync(filePath, content);
}

replaceInFile('src/components/hr/InstantDocumentsHub.tsx', {
  "alert('تم التصدير والحفظ بنجاح!');": "alert(lang === 'ar' ? 'تم التصدير والحفظ بنجاح!' : 'Exported and saved successfully!');"
});

replaceInFile('src/components/HrSubSections.tsx', {
  "alert('عذراً، فشل رفع الرسالة وخوادم الاستعلام.');": "alert(lang === 'ar' ? 'عذراً، فشل رفع الرسالة وخوادم الاستعلام.' : 'Sorry, failed to upload message to servers.');"
});

replaceInFile('src/components/SalesLetters.tsx', {
  "alert('حدث خطأ أثناء الحفظ.');": "alert(lang === 'ar' ? 'حدث خطأ أثناء الحفظ.' : 'Error saving.');",
  "alert('فشل في التصدير، يرجى المحاولة مرة أخرى.');": "alert(lang === 'ar' ? 'فشل في التصدير، يرجى المحاولة مرة أخرى.' : 'Failed to export, please try again.');"
});

replaceInFile('src/components/SalesRepsTargets.tsx', {
  "alert('تم تحديث الهدف بنجاح');": "alert(lang === 'ar' ? 'تم تحديث الهدف بنجاح' : 'Target updated successfully');"
});

