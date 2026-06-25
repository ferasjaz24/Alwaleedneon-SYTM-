const fs = require('fs');
let c = fs.readFileSync('server.ts', 'utf-8');
c = c.replace(/      return;\n    }\n  }\);\n/g, '');
fs.writeFileSync('server.ts', c, 'utf-8');
