const fs = require('fs');

let content = fs.readFileSync('src/utils/PrintShared.ts', 'utf8');

// Replace fonts
content = content.replace(/Tajawal/g, 'GE SS Two');
content = content.replace(/sans-serif/g, '"Gotham Pro", sans-serif');

// Add imports for the new fonts in sharedPrintStyles
if (!content.includes('fonts.cdnfonts.com')) {
  content = content.replace(/@media print {/, `@import url('https://fonts.cdnfonts.com/css/ge-ss-two');\n    @import url('https://fonts.cdnfonts.com/css/gotham-pro');\n    @media print {`);
  content = content.replace(/body \{ font-family: 'GE SS Two', "Gotham Pro", sans-serif, system-ui; direction: rtl; \}/, `body { font-family: 'GE SS Two', "Gotham Pro", sans-serif, system-ui !important; direction: rtl; }\n  * { font-family: 'GE SS Two', "Gotham Pro", sans-serif !important; }`);
}

fs.writeFileSync('src/utils/PrintShared.ts', content);

let compContent = fs.readFileSync('src/utils/PrintSharedComponents.tsx', 'utf8');
compContent = compContent.replace(/Tajawal/g, 'GE SS Two');
compContent = compContent.replace(/sans-serif/g, '"Gotham Pro", sans-serif');
fs.writeFileSync('src/utils/PrintSharedComponents.tsx', compContent);

