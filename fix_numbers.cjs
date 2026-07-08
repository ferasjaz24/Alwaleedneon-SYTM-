const fs = require('fs');

let code = fs.readFileSync('src/components/sales/DeliveryNoteBuilder.tsx', 'utf8');

// Add .en-text to style
if (!code.includes('.en-text {')) {
  code = code.replace('.delivery-note-page {', '.en-text { font-family: Arial, Helvetica, sans-serif !important; direction: ltr !important; }\n        .delivery-note-page {');
}

// Add to date and DN NO
code = code.replace(/className="font-sans"/g, 'className="en-text"');

fs.writeFileSync('src/components/sales/DeliveryNoteBuilder.tsx', code);
