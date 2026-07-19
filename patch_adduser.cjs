const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const firebaseEmail = \`\$\{payload\.username\.toLowerCase\(\)\}\@alwaleed-factory\.com\`;[\s\S]*?const firebasePassword = \`\$\{payload\.password \|\| "123456"\}\_alwaleed\_pass\`;/m;

code = code.replace(regex, `const firebaseEmail = payload.email || \`\${payload.username.toLowerCase()}@alwaleed-factory.com\`;
        const firebasePassword = \`\${payload.password || "123456"}_alwaleed_pass\`;`);

const payloadRegex = /const payload: any = \{\s*username: newUsername,[\s\S]*?\s*\};/m;

const match = code.match(payloadRegex);
if (match) {
  const replacement = match[0].replace('username: newUsername,', 'username: newUsername,\n        email: `${newUsername.toLowerCase()}@alwaleed-factory.com`,');
  code = code.replace(payloadRegex, replacement);
}

fs.writeFileSync('src/App.tsx', code);
console.log("Patched adduser");
