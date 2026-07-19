const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.css')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    content = content.replace(/font-family: 'GE SS Two', 'Gotham Pro'/g, "font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro'");
    content = content.replace(/font-family: "GE SS Two", "Gotham Pro"/g, "font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro'");
    content = content.replace(/font-family: 'GE SS Two', sans-serif/g, "font-family: 'EnglishNumbersOnly', 'GE SS Two', sans-serif");
    content = content.replace(/font-family: "GE SS Two", sans-serif/g, "font-family: 'EnglishNumbersOnly', 'GE SS Two', sans-serif");

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log('Updated font stack in', filePath);
    }
  }
});
