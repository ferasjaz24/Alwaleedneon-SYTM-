const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const logoHtml = `<img src="https://pbs.twimg.com/media/HE46IrybcAAMq7L?format=png&name=small" referrerpolicy="no-referrer" alt="Fonoun Alwaleed Logo" style="width: 80px; height: 80px; object-fit: contain;" />`;

walkDir('src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Replace Tajawal, Cairo, etc with the exact font string
    if (content.match(/['"]Tajawal['"]/g) || content.match(/['"]Cairo['"]/g)) {
        content = content.replace(/['"]Tajawal['"]/g, `'GE SS Two', 'Gotham Pro'`);
        content = content.replace(/['"]Cairo['"]/g, `'GE SS Two', 'Gotham Pro'`);
        changed = true;
    }
    
    // MonthlyPayrollRuns specific SVGs replace with actual logo
    if (content.includes('<svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#0072BC"')) {
        content = content.replace(/<svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#0072BC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\s*<path d="M3 21h18"><\/path>\s*<path d="M9 8h1"><\/path>\s*<path d="M9 12h1"><\/path>\s*<path d="M9 16h1"><\/path>\s*<path d="M14 8h1"><\/path>\s*<path d="M14 12h1"><\/path>\s*<path d="M14 16h1"><\/path>\s*<path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"><\/path>\s*<\/svg>/g, logoHtml);
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content);
    }
  }
});
