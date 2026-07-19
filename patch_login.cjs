const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

const normalizeArabic = (str) => {
  if (!str) return "";
  return str.trim().toLowerCase()
    .replace(/[أإآا]/g, 'ا')
    .replace(/[ةه]/g, 'ه')
    .replace(/[يى]/g, 'ي')
    .replace(/\s+/g, ' ');
};

// We will inject a normalize function into server.ts
const normalizeFuncString = `
function normalizeUsername(str: string): string {
  if (!str) return "";
  return str.trim().toLowerCase()
    .replace(/[أإآا]/g, 'ا')
    .replace(/[ةه]/g, 'ه')
    .replace(/[يى]/g, 'ي')
    .replace(/\\s+/g, ' ');
}
`;

// Insert the normalize function before app.post("/api/login")
serverCode = serverCode.replace('  app.post("/api/login", async (req, res) => {', normalizeFuncString + '\n  app.post("/api/login", async (req, res) => {');

// Replace the username extraction
serverCode = serverCode.replace(
  'const uName = (req.body.username || "").trim();',
  'const rawUName = (req.body.username || "").trim();\n    const uName = rawUName;\n    const normUName = normalizeUsername(uName);'
);

// In the fallback scan, use normalizeUsername
serverCode = serverCode.replace(
  /const matchedDoc = snap\.docs\.find\(d =>\s*\(d\.id \|\| ""\)\.toUpperCase\(\) === uName\.toUpperCase\(\) \|\|\s*\(\(d\.data\(\) && d\.data\(\)\.username\) \|\| ""\)\.toUpperCase\(\) === uName\.toUpperCase\(\)\s*\);/g,
  `const matchedDoc = snap.docs.find(d => {
            const idNorm = normalizeUsername(d.id || "");
            const nameNorm = normalizeUsername(d.data()?.username || "");
            return idNorm === normUName || nameNorm === normUName || (d.id || "").toUpperCase() === uName.toUpperCase() || ((d.data() && d.data().username) || "").toUpperCase() === uName.toUpperCase();
          });`
);

// Also update the local backup scan
serverCode = serverCode.replace(
  /const matchedLocal = localList\.find\(u => \(u\.username \|\| u\.id \|\| ""\)\.toUpperCase\(\) === uName\.toUpperCase\(\)\);/g,
  `const matchedLocal = localList.find(u => {
          const uNorm = normalizeUsername(u.username || u.id || "");
          return uNorm === normUName || (u.username || u.id || "").toUpperCase() === uName.toUpperCase();
        });`
);

// Now bypass device lock
// Find the if (isDeveloper || openAnywhere || !isLockEnabled) and change it to if (true)
serverCode = serverCode.replace(
  'if (isDeveloper || openAnywhere || !isLockEnabled) {',
  'if (true || isDeveloper || openAnywhere || !isLockEnabled) { // BYPASSED DEVICE LOCK FOR EVERYONE'
);

// Also find the concurrent session block and bypass it
serverCode = serverCode.replace(
  'if (!isDeveloper && userData.blockConcurrentLogins === true) {',
  'if (false && !isDeveloper && userData.blockConcurrentLogins === true) { // BYPASSED CONCURRENT LOGINS'
);

fs.writeFileSync('server.ts', serverCode);
console.log("Login route patched!");
