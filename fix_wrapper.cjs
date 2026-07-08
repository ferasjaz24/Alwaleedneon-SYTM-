const fs = require('fs');
let code = fs.readFileSync('src/components/sales/DeliveryNoteBuilder.tsx', 'utf8');

code = code.replace(
  /<div className="delivery-note-page" id="deliveryNotePrintArea" dir="ltr" style={{ direction: 'ltr', textAlign: 'left', display: 'flex', flexDirection: 'column' }}>/,
  `<div className="delivery-note-page relative mx-auto bg-white shadow print:shadow-none print:m-0 overflow-hidden" id="deliveryNotePrintArea" dir="ltr" style={{ direction: 'ltr', textAlign: 'left', display: 'flex', flexDirection: 'column', width: '210mm', minHeight: '297mm', padding: '3cm', boxSizing: 'border-box' }}>`
);

// We can also remove `width: 210mm; min-height: 297mm; background: #ffffff; margin: 0 auto; padding: 3cm; box-sizing: border-box;` from `.delivery-note-page` CSS since we are inline styling it to match exactly, or just let it override.
code = code.replace(
  /width: 210mm;\s*min-height: 297mm;\s*background: #ffffff;\s*margin: 0 auto;\s*padding: 3cm;\s*box-sizing: border-box;/g,
  ""
);

fs.writeFileSync('src/components/sales/DeliveryNoteBuilder.tsx', code);
