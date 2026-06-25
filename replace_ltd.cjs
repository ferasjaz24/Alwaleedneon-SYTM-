const fs = require('fs');
const path = require('path');

const appFile = path.join(__dirname, 'src/App.tsx');
let content = fs.readFileSync(appFile, 'utf8');

content = content.replace(/المحدودة/g, 'للصناعة');

fs.writeFileSync(appFile, content, 'utf8');
console.log('Replaced المحدودة with للصناعة in App.tsx');
