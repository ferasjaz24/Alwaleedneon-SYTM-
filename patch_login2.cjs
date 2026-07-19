const fs = require('fs');
let serverCode = fs.readFileSync('server.ts', 'utf8');

const replacement = `
function normalizeUsername(str: string): string {
  if (!str) return "";
  return str.trim().toLowerCase()
    .replace(/[\\u200B-\\u200D\\uFEFF\\u200E\\u200F]/g, '') // Remove zero-width and bidi characters
    .replace(/[أإآا]/g, 'ا')
    .replace(/[ةه]/g, 'ه')
    .replace(/[يى]/g, 'ي')
    .replace(/\\s+/g, ' ');
}
`;

serverCode = serverCode.replace(/function normalizeUsername[\s\S]*?\}\n/, replacement);
fs.writeFileSync('server.ts', serverCode);
console.log("Login route patched again!");
