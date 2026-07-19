const fs = require('fs');
let code = fs.readFileSync('src/utils/fallbackUsers.ts', 'utf8');

// The error was on line 1422 for FERAS24 which had email: ""
// Just replacing duplicate '    "email": "",' with nothing
code = code.replace(/,\s*"email": ""/g, "");
fs.writeFileSync('src/utils/fallbackUsers.ts', code);
console.log("Fixed duplicate email keys in fallbackUsers");
