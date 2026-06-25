const fs = require('fs');

let lines = fs.readFileSync('server.ts', 'utf8').split('\n');
let newLines = [];

for (let i = 0; i < lines.length; i++) {
    let l = lines[i];
    if (l === '}' && lines[i-1] === ';') {
       newLines.pop(); // remove ';'
       continue; // skip '}'
    }
    if (l === '}') {
        // We will just let tsc tell us what to fix if simple
    }
    newLines.push(l);
}

fs.writeFileSync('server.ts', newLines.join('\n'));
