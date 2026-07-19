const fs = require('fs');
let code = fs.readFileSync('src/utils/fallbackUsers.ts', 'utf8');

// Simple regex replace to add an email field derived from username for all fallback users that don't have it.
code = code.replace(/"username":\s*"([^"]+)"/g, (match, p1) => {
  return `"username": "${p1}",\n    "email": "${p1.toLowerCase()}@alwaleed-factory.com"`;
});

fs.writeFileSync('src/utils/fallbackUsers.ts', code);
console.log("Patched fallbackUsers");
