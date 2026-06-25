const fs = require('fs');
const path = require('path');

let f = path.join(__dirname, 'src/components/SalesHub.tsx');
let c = fs.readFileSync(f, 'utf8');

c = c.replace(/\\\$\{/g, '${');
c = c.replace(/\\\}/g, '}');
c = c.replace(/\\`/g, '`');

fs.writeFileSync(f, c, 'utf8');
