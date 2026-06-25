const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const clientBlockRegex = /  \/\/ Client Front-end integration setup[\s\S]*?    \}\);\n  \}/;

const match = code.match(clientBlockRegex);
if (match) {
    const clientBlock = match[0];
    code = code.replace(clientBlock, "");
    
    // insert clientBlock just before app.listen
    code = code.replace("  app.listen(PORT", clientBlock + "\n\n  app.listen(PORT");
    fs.writeFileSync('server.ts', code);
    console.log("Fixed order!");
} else {
    console.log("Could not find client frontend integration block");
}
