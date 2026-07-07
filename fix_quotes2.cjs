const fs = require('fs');

let content = fs.readFileSync('src/utils/PrintSharedComponents.tsx', 'utf8');
content = content.replace(/fontFamily:\s*'"GE SS Two", 'Gotham Pro', sans-serif'/g, `fontFamily: "'GE SS Two', 'Gotham Pro', sans-serif"`);
fs.writeFileSync('src/utils/PrintSharedComponents.tsx', content);

