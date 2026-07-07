const fs = require('fs');

let content = fs.readFileSync('src/utils/PrintShared.ts', 'utf8');
content = content.replace(/"Gotham Pro"/g, "'Gotham Pro'");
fs.writeFileSync('src/utils/PrintShared.ts', content);

let compContent = fs.readFileSync('src/utils/PrintSharedComponents.tsx', 'utf8');
compContent = compContent.replace(/"Gotham Pro"/g, "'Gotham Pro'");
fs.writeFileSync('src/utils/PrintSharedComponents.tsx', compContent);

