const fs = require('fs');
const code = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

let parenCount = 0;
let braceCount = 0;
const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '(') parenCount++;
    if (line[j] === ')') parenCount--;
    if (line[j] === '{') braceCount++;
    if (line[j] === '}') braceCount--;
  }
  if (parenCount > 0 && parenCount < 5) {
     // console.log(`Line ${i + 1}: parenCount = ${parenCount}`);
  }
}
console.log(`Total Paren: ${parenCount}`);
console.log(`Total Brace: ${braceCount}`);
