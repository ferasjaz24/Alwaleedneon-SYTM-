let fs = require("fs");
let c = fs.readFileSync("src/components/SalesHub.tsx", "utf8");

c = c.replace(/\$\{q\.id\}<\/td>/g, "${q.quotationNumber || q.id}</td>");
c = c.replace(/\$\{q\.projectTitle \|\| q\.title \|\| '--'\}<\/td>/g, "${q.projectName || '--'}</td>");
c = c.replace(/\$\{new Date\(q\.dateCreated\)\.toLocaleDateString\('en-GB'\)\}<\/td>/g, "${q.quoteDate || new Date(q.dateCreated).toLocaleDateString('en-GB')}</td>");

fs.writeFileSync("src/components/SalesHub.tsx", c);
console.log("Fixed SalesHub tags");
