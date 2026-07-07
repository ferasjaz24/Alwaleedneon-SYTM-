const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Replace .toLocaleString() with .toLocaleString('en-US')
    if (content.match(/\.toLocaleString\(\)/)) {
        content = content.replace(/\.toLocaleString\(\)/g, `.toLocaleString('en-US')`);
        changed = true;
    }
    
    // Replace 'ar-SA' with 'en-US' in toLocaleString
    if (content.match(/\.toLocaleString\(['"]ar-SA['"]/)) {
        content = content.replace(/\.toLocaleString\(['"]ar-SA['"]/g, `.toLocaleString('en-US'`);
        changed = true;
    }
    
    // Replace 'ar-SA' with 'en-US' in toLocaleDateString
    if (content.match(/\.toLocaleDateString\(['"]ar-SA['"]/)) {
        content = content.replace(/\.toLocaleDateString\(['"]ar-SA['"]/g, `.toLocaleDateString('en-US'`);
        changed = true;
    }

    if (content.match(/lang === ['"]ar['"] \? ['"]ar-SA['"] : ['"]en-US['"]/)) {
        content = content.replace(/lang === ['"]ar['"] \? ['"]ar-SA['"] : ['"]en-US['"]/g, `'en-US'`);
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content);
    }
  }
});
