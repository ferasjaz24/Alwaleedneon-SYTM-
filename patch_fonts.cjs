const fs = require('fs');

let indexCss = fs.readFileSync('src/index.css', 'utf8');

// replace google fonts import with cdnfonts
indexCss = indexCss.replace(
  /@import url\('https:\/\/fonts.googleapis.com\/css2\?family=Cairo[^]*?display=swap'\);/,
  `@import url('https://fonts.cdnfonts.com/css/ge-ss-two');\n@import url('https://fonts.cdnfonts.com/css/gotham-pro');`
);

// update :root and @theme
indexCss = indexCss.replace(/--font-sans:[^;]+;/g, '--font-sans: "GE SS Two", "GE SS", "Gotham Pro", sans-serif;');
indexCss = indexCss.replace(/--font-arabic:[^;]+;/g, '--font-arabic: "GE SS Two", "GE SS", sans-serif;');
indexCss = indexCss.replace(/--font-english:[^;]+;/g, '--font-english: "Gotham Pro", sans-serif;');

// replace 'Tajawal' instances
indexCss = indexCss.replace(/Tajawal/g, 'GE SS Two');

// enforce global font via * selector
if (!indexCss.includes('* { font-family:')) {
  indexCss += `\n* {\n  font-family: var(--font-sans) !important;\n}\n`;
}

fs.writeFileSync('src/index.css', indexCss);

