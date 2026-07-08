const fs = require('fs');

let code = fs.readFileSync('src/components/sales/DeliveryNoteBuilder.tsx', 'utf8');

code = code.replace(/updateItem\(idx, 'qty', e\.currentTarget\.innerText\)/g, "updateItem(idx, 'qty', e.currentTarget.innerText.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString()))");
code = code.replace(/updateItem\(idx, 'id', e\.currentTarget\.innerText\)/g, "updateItem(idx, 'id', e.currentTarget.innerText.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString()))");

fs.writeFileSync('src/components/sales/DeliveryNoteBuilder.tsx', code);
