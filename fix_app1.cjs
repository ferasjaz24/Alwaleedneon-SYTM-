const fs = require('fs');
const path = require('path');
let f = path.join(__dirname, 'src/App.tsx');
let c = fs.readFileSync(f, 'utf8');

c = c.replace(/const getDocumentText = \(\) => {[\s\S]*?return '';\n  };/, '');
c = c.replace('setSelectedDocEmp(null);', '');

fs.writeFileSync(f, c, 'utf8');
