const fs = require('fs');
const path = require('path');

const docFile = path.join(__dirname, 'src/components/hr/InstantDocumentsHub.tsx');
let content2 = fs.readFileSync(docFile, 'utf8');

content2 = content2.replace(/المحدودة/g, 'للصناعة');

fs.writeFileSync(docFile, content2, 'utf8');
console.log('Replaced in InstantDocumentsHub');
