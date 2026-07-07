const fs = require('fs');
let indexCss = fs.readFileSync('src/index.css', 'utf8');

// We add a specific font face for digits. Since we import Gotham Pro from cdnfonts,
// we can just use local("Gotham Pro") or the cdn url, but to be safe, we can just 
// redefine the unicode range over the existing stack, OR we can just use 
// font-family: 'Gotham Pro', 'GE SS Two' - wait, if we put Gotham Pro first, English letters and digits will use Gotham Pro, and Arabic letters will fallback to GE SS Two! Because Gotham Pro doesn't support Arabic!
// Let's test if Gotham Pro supports Arabic. Usually it doesn't.
// So font-family: 'Gotham Pro', 'GE SS Two', sans-serif !important; is PERFECT!

indexCss = indexCss.replace(/\* \{ font-family: 'GE SS Two', 'Gotham Pro', sans-serif !important; \}/g, `* { font-family: 'Gotham Pro', 'GE SS Two', sans-serif !important; }`);
indexCss = indexCss.replace(/--font-sans: "GE SS Two", "GE SS", "Gotham Pro", sans-serif;/g, `--font-sans: "Gotham Pro", "GE SS Two", "GE SS", sans-serif;`);
indexCss = indexCss.replace(/--font-arabic: "GE SS Two", "GE SS", sans-serif;/g, `--font-arabic: "Gotham Pro", "GE SS Two", "GE SS", sans-serif;`);

fs.writeFileSync('src/index.css', indexCss);

// Also fix in PrintShared.ts
let printShared = fs.readFileSync('src/utils/PrintShared.ts', 'utf8');
printShared = printShared.replace(/\* \{ font-family: 'GE SS Two', 'Gotham Pro', sans-serif !important; \}/g, `* { font-family: 'Gotham Pro', 'GE SS Two', sans-serif !important; }`);
printShared = printShared.replace(/body \{ font-family: 'GE SS Two', 'Gotham Pro', sans-serif, system-ui !important; direction: rtl; \}/g, `body { font-family: 'Gotham Pro', 'GE SS Two', sans-serif, system-ui !important; direction: rtl; }`);
fs.writeFileSync('src/utils/PrintShared.ts', printShared);

