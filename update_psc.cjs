const fs = require('fs');
let code = fs.readFileSync('src/utils/PrintSharedComponents.tsx', 'utf8');

code = code.replace(
  /fontFamily: "'GE SS Two', 'Gotham Pro', sans-serif"/g,
  "fontFamily: \"'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif\""
);
code = code.replace(
  /fontFamily: "'Gotham Pro', sans-serif"/g,
  "fontFamily: \"'EnglishNumbersOnly', 'Gotham Pro', sans-serif\""
);

fs.writeFileSync('src/utils/PrintSharedComponents.tsx', code);
