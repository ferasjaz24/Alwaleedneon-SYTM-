const fs = require('fs');
const path = require('path');
const f = path.join(__dirname, 'src/components/SalesQuotations.tsx');
let c = fs.readFileSync(f, 'utf8');
const text = require('./contract.json').contractText;

if (!c.includes('const contractText')) {
   c = c.replace('export default function SalesQuotations', 'const contractText = ' + JSON.stringify(text) + ';\n\nexport default function SalesQuotations');
   fs.writeFileSync(f, c, 'utf8');
}
