import fs from 'fs';

let content = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

content = content.replace(/\\\$/g, '$');

fs.writeFileSync('src/components/MainDashboard.tsx', content, 'utf8');
console.log('Fixed variables');
