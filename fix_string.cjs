const fs = require('fs');

let content = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');
content = content.replace(/"<html><head>\n          <style>\n            @import url\('https:\/\/fonts\.cdnfonts\.com\/css\/ge-ss-two'\);\n            @import url\('https:\/\/fonts\.cdnfonts\.com\/css\/gotham-pro'\);\n            \* { font-family: 'GE SS Two', 'Gotham Pro', sans-serif !important; }\n          <\/style><title>"\s*\+/g, 
  `"<html><head><style>@import url('https://fonts.cdnfonts.com/css/ge-ss-two'); @import url('https://fonts.cdnfonts.com/css/gotham-pro'); * { font-family: 'GE SS Two', 'Gotham Pro', sans-serif !important; }</style><title>" +`);
fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', content);

