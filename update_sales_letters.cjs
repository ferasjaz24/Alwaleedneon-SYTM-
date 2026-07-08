const fs = require('fs');
let code = fs.readFileSync('src/components/SalesLetters.tsx', 'utf8');

code = code.replace(
  /\* \{ font-family: 'GE SS Two', 'Gotham Pro', sans-serif !important; \}/g,
  "* { font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif !important; }"
);
code = code.replace(
  /font-family: 'GE SS Two', 'Gotham Pro', sans-serif !important;/g,
  "font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif !important;"
);

fs.writeFileSync('src/components/SalesLetters.tsx', code);
