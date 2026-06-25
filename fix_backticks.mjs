import fs from 'fs';

let content = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

// The replacement was literal \\` in the file, we can fix it by regex replacing literal \\` with `
content = content.replace(/\\\\`/g, '`').replace(/\\`/g, '`');

fs.writeFileSync('src/components/MainDashboard.tsx', content, 'utf8');
console.log('Fixed backticks');
