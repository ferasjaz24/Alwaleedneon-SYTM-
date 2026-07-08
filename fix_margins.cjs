const fs = require('fs');
let code = fs.readFileSync('src/components/sales/DeliveryNoteBuilder.tsx', 'utf8');

// replace @page
code = code.replace(
  /@page {\s*size: A4 portrait;\s*margin: 0;\s*}/g,
  `@page { size: A4 portrait; margin: 20mm; }`
);

// replace padding: '3cm' with padding: '20mm' and handle print:p-0
code = code.replace(
  /padding: '3cm'/g,
  `padding: '0'` // we will add tailwind classes instead for padding
);

code = code.replace(
  /className="delivery-note-page relative mx-auto bg-white shadow print:shadow-none print:m-0 overflow-hidden"/g,
  `className="delivery-note-page relative mx-auto bg-white shadow print:shadow-none print:m-0 print:p-0 p-[20mm] overflow-hidden"`
);

// wait, if I put padding: '0' in inline style, it will override tailwind.
// Let's remove padding: '0' from inline style entirely
code = code.replace(
  /, padding: '0'/g,
  ""
);

fs.writeFileSync('src/components/sales/DeliveryNoteBuilder.tsx', code);
