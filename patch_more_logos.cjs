const fs = require('fs');

const logoHtml = `<img src="https://pbs.twimg.com/media/HE46IrybcAAMq7L?format=png&name=small" referrerpolicy="no-referrer" alt="Fonoun Alwaleed Logo" style="width: 80px; height: 80px; object-fit: contain; margin-bottom: 10px;" />`;

function addLogo(filePath, regexStr) {
  let content = fs.readFileSync(filePath, 'utf8');
  const regex = new RegExp(regexStr, 'g');
  if (content.match(regex)) {
    content = content.replace(regex, `<div style="text-align: center;">${logoHtml}</div>\n          $1`);
    fs.writeFileSync(filePath, content);
  }
}

// FinancialCollections
addLogo('src/components/FinancialCollections.tsx', /(<div class="header-sec">)/);

// Add sharedPrintStyles / GE SS imports to those that lack it
const addFonts = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('printWindow.document.write(') || content.includes('win.document.write(') || content.includes('pWindow.document.write(') || content.includes('newWindow.document.write(')) {
        if (!content.includes('fonts.cdnfonts.com')) {
            content = content.replace(/<head>/g, `<head>\n          <style>\n            @import url('https://fonts.cdnfonts.com/css/ge-ss-two');\n            @import url('https://fonts.cdnfonts.com/css/gotham-pro');\n            * { font-family: 'GE SS Two', 'Gotham Pro', sans-serif !important; }\n          </style>`);
            fs.writeFileSync(filePath, content);
        }
    }
};

const path = require('path');
function walkDir2(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir2(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir2('src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      addFonts(filePath);
  }
});

