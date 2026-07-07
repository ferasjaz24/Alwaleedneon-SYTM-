const fs = require('fs');
let content = fs.readFileSync('src/components/AdvancedPermissionsPortal.tsx', 'utf8');

// The portal has `{lang === 'ar' ? ... : ...}` in the render, but the structure might not.
// Let's replace the usage in the component:
content = content.replace(/moduleData\.ar/g, 'lang === "ar" ? moduleData.ar : (moduleData.en || moduleData.ar)');
content = content.replace(/subData\.ar/g, 'lang === "ar" ? subData.ar : (subData.en || subData.ar)');
content = content.replace(/perm\.label/g, 'lang === "ar" ? perm.labelAr : (perm.labelEn || perm.labelAr)');

fs.writeFileSync('src/components/AdvancedPermissionsPortal.tsx', content);
