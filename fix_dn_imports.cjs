const fs = require('fs');
let code = fs.readFileSync('src/components/sales/DeliveryNoteBuilder.tsx', 'utf8');

if (!code.includes("import { DocumentHeader")) {
  code = code.replace(
    "import { User } from '../../types';",
    "import { User } from '../../types';\nimport { DocumentHeader, DocumentFooter } from '../utils/PrintSharedComponents';"
  );
}

// Now replace the header
const headerRegex = /<header className="dn-header">[\s\S]*?<\/div>\s*<\/header>\s*<div className="header-line"><\/div>/;
code = code.replace(headerRegex, "<DocumentHeader />");

// Replace the footer
const footerRegex = /<footer className="dn-footer">[\s\S]*?<\/footer>/;
code = code.replace(footerRegex, '<div className="mt-auto relative z-0"><DocumentFooter /></div>');

// Make the delivery-note-page a flex column so mt-auto pushes the footer to the bottom
code = code.replace(
  /<div className="delivery-note-page" id="deliveryNotePrintArea" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>/,
  `<div className="delivery-note-page" id="deliveryNotePrintArea" dir="ltr" style={{ direction: 'ltr', textAlign: 'left', display: 'flex', flexDirection: 'column' }}>`
);

fs.writeFileSync('src/components/sales/DeliveryNoteBuilder.tsx', code);
