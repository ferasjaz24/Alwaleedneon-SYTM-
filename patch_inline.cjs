const fs = require('fs');
const path = require('path');

const filesToPatch = [
  'src/components/ProductionHub.tsx',
  'src/components/SalesRepsTargets.tsx'
];

const englishNumbersFontFace = `@font-face { font-family: 'EnglishNumbersOnly'; unicode-range: U+0030-0039, U+002E, U+002F, U+002D, U+0025; src: url('/fonts/Gotham-Pro.ttf') format('truetype'), local("Arial"); }`;

for (const file of filesToPatch) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Add @font-face
    if (!content.includes("font-family: 'EnglishNumbersOnly'; unicode-range:")) {
      content = content.replace(
        /@font-face \{ font-family: 'GE SS Two';/g,
        englishNumbersFontFace + "\n            @font-face { font-family: 'GE SS Two';"
      );
      modified = true;
    }
    
    // Update font-family
    if (content.includes("font-family: 'GE SS Two', 'Gotham Pro'")) {
        content = content.replace(/font-family: 'GE SS Two', 'Gotham Pro'/g, "font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro'");
        modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Patched', file);
    }
  }
}
