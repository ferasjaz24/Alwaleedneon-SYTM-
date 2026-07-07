const fs = require('fs');

let content = fs.readFileSync('src/utils/PrintSharedComponents.tsx', 'utf8');
content = content.replace(/fontFamily: ''Gotham Pro', sans-serif'/g, `fontFamily: "'Gotham Pro', sans-serif"`);
fs.writeFileSync('src/utils/PrintSharedComponents.tsx', content);

