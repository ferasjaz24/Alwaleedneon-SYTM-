const fs = require('fs');
let code = fs.readFileSync('src/components/SalesQuotations.tsx', 'utf8');

code = code.replace(
  /\* \{ font-family: 'GE SS Two', 'Gotham Pro', sans-serif !important; \}/g,
  "* { font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif !important; }"
);
code = code.replace(
  /font-family: 'GE SS Two', 'Gotham Pro', Arial, Tahoma, sans-serif;/g,
  "font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', Arial, Tahoma, sans-serif;"
);
code = code.replace(
  /font-family: 'GE SS Two', 'Gotham Pro', sans-serif;/g,
  "font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif;"
);

fs.writeFileSync('src/components/SalesQuotations.tsx', code);
