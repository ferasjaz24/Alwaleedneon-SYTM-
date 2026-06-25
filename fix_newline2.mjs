import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// The replacement was literal \n in the file, we can fix it by regex replacing literal \n with actual newlines
content = content.replace(/\\n/g, '\n');

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Fixed \\n');
