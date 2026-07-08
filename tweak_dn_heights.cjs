const fs = require('fs');

let code = fs.readFileSync('src/components/sales/DeliveryNoteBuilder.tsx', 'utf8');

code = code.replace(/height: 18mm;/g, 'height: 14mm;');
code = code.replace(/minHeight: "12mm"/g, 'minHeight: "10mm"');

fs.writeFileSync('src/components/sales/DeliveryNoteBuilder.tsx', code);
