const fs = require('fs');
let code = fs.readFileSync('src/components/SalesLetters.tsx', 'utf8');

code = code.replace(
  "{ id: 'handover', name: 'خطاب تسليم الأعمال' }",
  "{ id: 'handover', name: 'خطاب تسليم الأعمال' },\n      { id: 'delivery_note', name: 'سند تسليم مهني (Delivery Note)' }"
);

fs.writeFileSync('src/components/SalesLetters.tsx', code);
