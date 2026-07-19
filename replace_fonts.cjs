const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const GE_SS_TWO_CDN = "@import url('https://fonts.cdnfonts.com/css/ge-ss-two');";
const GOTHAM_PRO_CDN = "@import url('https://fonts.cdnfonts.com/css/gotham-pro');";

const GE_SS_TWO_LOCAL = `@font-face { font-family: 'GE SS Two'; src: url('/fonts/GE-SS-Two.ttf') format('truetype'); font-weight: normal; font-style: normal; }`;
const GOTHAM_PRO_LOCAL = `@font-face { font-family: 'Gotham Pro'; src: url('/fonts/Gotham-Pro.ttf') format('truetype'); font-weight: normal; font-style: normal; }`;

const GE_SS_TWO_CDN_REGEX = /@import url\(['"]https:\/\/fonts\.cdnfonts\.com\/css\/ge-ss-two['"]\);/g;
const GOTHAM_PRO_CDN_REGEX = /@import url\(['"]https:\/\/fonts\.cdnfonts\.com\/css\/gotham-pro['"]\);/g;


walkDir('./src', function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.css')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    if (GE_SS_TWO_CDN_REGEX.test(content)) {
      content = content.replace(GE_SS_TWO_CDN_REGEX, GE_SS_TWO_LOCAL);
      modified = true;
    }
    
    if (GOTHAM_PRO_CDN_REGEX.test(content)) {
      content = content.replace(GOTHAM_PRO_CDN_REGEX, GOTHAM_PRO_LOCAL);
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log('Updated', filePath);
    }
  }
});
