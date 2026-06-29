const fs = require('fs');
const content = fs.readFileSync('src/components/hr/HrPayrollTab.tsx', 'utf-8');
const lines = content.split('\n');

let level = 0;
for (let i = 835; i < lines.length; i++) {
  const line = lines[i];
  for (let char of line) {
    if (char === '{') level++;
    if (char === '}') level--;
  }
  if (level === 0 && line.includes(')}')) {
    console.log('Closes at:', i + 1, line);
    break;
  }
}
