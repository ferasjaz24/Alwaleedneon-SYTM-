const fs = require('fs');
const path = require('path');
let f = path.join(__dirname, 'src/components/SalesQuotations.tsx');
let c = fs.readFileSync(f, 'utf8');
const text = "اتفاقية تصنيع...";
c = c.replace('export default function SalesQuotations', `const contractText = ` + JSON.stringify(text) + `;\n\nexport default function SalesQuotations`);
fs.writeFileSync(f, c, 'utf8');
