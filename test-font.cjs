const fs = require('fs');

let code = fs.readFileSync('src/components/sales/DeliveryNoteBuilder.tsx', 'utf8');
code = code.replace(/<div contentEditable suppressContentEditableWarning onBlur=\{e => setDeliveryDate/g, "<div contentEditable suppressContentEditableWarning className=\"font-sans\" dir=\"ltr\" onBlur=\{e => setDeliveryDate");
code = code.replace(/<div contentEditable suppressContentEditableWarning onBlur=\{e => setDeliveryNoteNo/g, "<div contentEditable suppressContentEditableWarning className=\"font-sans\" dir=\"ltr\" onBlur=\{e => setDeliveryNoteNo");

fs.writeFileSync('src/components/sales/DeliveryNoteBuilder.tsx', code);
