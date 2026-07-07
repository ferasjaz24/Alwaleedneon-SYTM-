const fs = require('fs');
let code = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

// A very naive JSX bracket balancer
let depth = 0;
let divDepth = 0;
let lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // This is super naive and will break on strings/comments, but it's a quick check
    let openDivs = (line.match(/<div(\s|>)/g) || []).length;
    let closeDivs = (line.match(/<\/div>/g) || []).length;
    divDepth += openDivs - closeDivs;
    if (divDepth < 0) {
        console.log(`Negative div depth at line ${i + 1}`);
        divDepth = 0; // reset to keep going
    }
}
console.log(`Final div depth: ${divDepth}`);
