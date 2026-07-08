const fs = require('fs');
let code = fs.readFileSync('src/components/sales/DeliveryNoteBuilder.tsx', 'utf8');

// replace @media print styles for .delivery-note-page
code = code.replace(
  /\.delivery-note-page {\s*margin: 0;\s*width: 210mm;\s*min-height: 297mm;\s*box-shadow: none;\s*page-break-after: always;\s*}/,
  `.delivery-note-page {
            margin: 0;
            width: 100% !important;
            height: auto !important;
            min-height: 100% !important;
            box-shadow: none;
            page-break-after: always;
          }`
);

// We should also remove the inline styles that force width to 210mm in print, by relying on Tailwind classes instead.
// width: '210mm', minHeight: '297mm'
code = code.replace(
  /width: '210mm', minHeight: '297mm', /,
  ""
);
code = code.replace(
  /className="delivery-note-page relative mx-auto bg-white shadow print:shadow-none print:m-0 print:p-0 p-\[20mm\] overflow-hidden"/,
  `className="delivery-note-page relative mx-auto bg-white shadow print:shadow-none print:m-0 print:p-0 print:w-full print:min-h-full p-[20mm] overflow-hidden" style={{ width: '210mm', minHeight: '297mm' }}`
);

fs.writeFileSync('src/components/sales/DeliveryNoteBuilder.tsx', code);
