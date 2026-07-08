const fs = require('fs');

const code = fs.readFileSync('src/components/sales/DeliveryNoteBuilder.tsx', 'utf8');

// replace setDeliveryDate(e.currentTarget.innerText) with setDeliveryDate(e.currentTarget.innerText.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)))

let newCode = code.replace(/setDeliveryDate\(e\.currentTarget\.innerText\)/g, "setDeliveryDate(e.currentTarget.innerText.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString()))");
newCode = newCode.replace(/setDeliveryNoteNo\(e\.currentTarget\.innerText\)/g, "setDeliveryNoteNo(e.currentTarget.innerText.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString()))");

fs.writeFileSync('src/components/sales/DeliveryNoteBuilder.tsx', newCode);
