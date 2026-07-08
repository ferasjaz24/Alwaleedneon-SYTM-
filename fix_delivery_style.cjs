const fs = require('fs');
let code = fs.readFileSync('src/components/sales/DeliveryNoteBuilder.tsx', 'utf8');

code = code.replace(
  /className="delivery-note-page relative mx-auto bg-white shadow print:shadow-none print:m-0 print:p-0 print:w-full print:min-h-full p-\[20mm\] overflow-hidden" id="deliveryNotePrintArea" dir="ltr" style=\{\{ width: '210mm', minHeight: '297mm', direction: 'ltr', textAlign: 'left', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' \}\}/,
  `className="delivery-note-page relative mx-auto bg-white shadow print:shadow-none print:m-0 print:p-0 w-[210mm] min-h-[297mm] print:!w-full print:!h-auto print:!min-h-full p-[20mm] overflow-hidden" id="deliveryNotePrintArea" dir="ltr" style={{ direction: 'ltr', textAlign: 'left', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}`
);

fs.writeFileSync('src/components/sales/DeliveryNoteBuilder.tsx', code);
