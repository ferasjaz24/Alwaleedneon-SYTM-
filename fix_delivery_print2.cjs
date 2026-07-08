const fs = require('fs');
let code = fs.readFileSync('src/components/sales/DeliveryNoteBuilder.tsx', 'utf8');

// remove duplicate style prop
code = code.replace(
  /style=\{\{ width: '210mm', minHeight: '297mm' \}\} id="deliveryNotePrintArea" dir="ltr" style=\{\{ direction: 'ltr', textAlign: 'left', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' \}\}/,
  `id="deliveryNotePrintArea" dir="ltr" style={{ width: '210mm', minHeight: '297mm', direction: 'ltr', textAlign: 'left', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}`
);

fs.writeFileSync('src/components/sales/DeliveryNoteBuilder.tsx', code);
