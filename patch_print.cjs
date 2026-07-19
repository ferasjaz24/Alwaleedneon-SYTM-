const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/utils/PrintShared.ts');
let content = fs.readFileSync(file, 'utf8');

const englishNumbersFontFace = `
  @font-face { 
    font-family: 'EnglishNumbersOnly'; 
    unicode-range: U+0030-0039, U+002E, U+002F, U+002D, U+0025; 
    src: url('/fonts/Gotham-Pro.ttf') format('truetype'), local("Arial"); 
  }
`;

if (!content.includes("font-family: 'EnglishNumbersOnly'; unicode-range:")) {
  content = content.replace(
    /export const sharedPrintStyles = `/,
    "export const sharedPrintStyles = `" + englishNumbersFontFace
  );
  fs.writeFileSync(file, content, 'utf8');
  console.log('Patched PrintShared.ts');
} else {
  console.log('Already patched PrintShared.ts');
}
