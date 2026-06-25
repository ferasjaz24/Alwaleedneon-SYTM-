const fs = require('fs');
const path = require('path');

let f = path.join(__dirname, 'src/components/SalesHub.tsx');
let c = fs.readFileSync(f, 'utf8');

c = c.replace(/fetch\(\\\`\/api\/clients\/\\\$\\{id\\}\\\`/g, "fetch(`/api/clients/${id}`");
c = c.replace(/const url = payload\.id \? \\`\/api\/clients\/\\\$\\{payload\.id\\}\\\` : '\/api\/clients';/g, "const url = payload.id ? `/api/clients/${payload.id}` : '/api/clients';");

c = c.replace(/const printContent = \\`/g, "const printContent = `");
c = c.replace(/printWin\.document\.write\(\\`\n/g, "printWin.document.write(`\n");
c = c.replace(/<\/html>\n    \\`\);/g, "</html>\n    `);");

// Clean all escaped dollars and backticks from printContent
c = c.replace(/\\\$/g, "$");
c = c.replace(/\\`/g, "`");

fs.writeFileSync(f, c, 'utf8');
