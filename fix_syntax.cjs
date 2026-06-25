const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// The syntax error is due to unmatched brackets for removed map...ToDB/fromDB.
// Let's just find those stranded return statements and objects and remove them.
content = content.replace(/,\n\s*home_address: e\.homeAddress,[\s\S]*?\}\n/g, '');

content = content.replace(/,\n\s*name_ar: e\.nameAr,[\s\S]*?\}\n/g, ''); 
content = content.replace(/,\n\s*name: e\.name,[\s\S]*?\}\n/g, '');

// Clean up "if (!)" lines
content = content.replace(/if \(!\) \{/g, 'if (true) {');

fs.writeFileSync('server.ts', content);
