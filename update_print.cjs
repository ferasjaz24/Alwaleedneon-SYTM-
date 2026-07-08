const fs = require('fs');
let code = fs.readFileSync('src/utils/PrintShared.ts', 'utf8');

code = code.replace(
  "body { font-family: 'Gotham Pro', 'GE SS', 'GE SS Two', sans-serif, system-ui !important; direction: rtl; }",
  "body { font-family: 'EnglishNumbersOnly', 'Gotham Pro', 'GE SS', 'GE SS Two', sans-serif, system-ui !important; direction: rtl; }"
);
code = code.replace(
  "* { font-family: 'Gotham Pro', 'GE SS', 'GE SS Two', sans-serif !important; }",
  "* { font-family: 'EnglishNumbersOnly', 'Gotham Pro', 'GE SS', 'GE SS Two', sans-serif !important; }"
);

fs.writeFileSync('src/utils/PrintShared.ts', code);
