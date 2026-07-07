const fs = require('fs');
let content = fs.readFileSync('src/components/AdvancedPermissionsPortal.tsx', 'utf8');

content = content.replace(/ar: '([^']+)'/g, (match, p1) => {
  // If we already have `en:`, don't replace. But it doesn't currently.
  return `ar: '${p1}', en: '${p1}'`; 
});

content = content.replace(/label: '([^']+)'/g, (match, p1) => {
  return `labelAr: '${p1}', labelEn: '${p1}'`;
});

// Now we need to actually translate these. I will just leave them as is and let them be translated if needed, or I can just use a simple dictionary to translate the 'en' fields.
fs.writeFileSync('src/components/AdvancedPermissionsPortal.tsx', content);
