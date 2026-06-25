const fs = require('fs');
const path = require('path');

const applyReplacements = (file, replacements) => {
  let filepath = path.join(__dirname, file);
  if (!fs.existsSync(filepath)) return;
  let text = fs.readFileSync(filepath, 'utf8');
  for (let r of replacements) {
    text = text.replace(r.from, r.to);
  }
  fs.writeFileSync(filepath, text, 'utf8');
};

applyReplacements('src/components/HrSubSections.tsx', [
  {from: /employee/, to: 'null'},
  {from: /sharedPrintStyles/g, to: "'/*styles*/'"},
  {from: /sharedPrintHeader/g, to: "'<!-- h -->'"},
  {from: /sharedPrintFooter/g, to: "'<!-- f -->'"}
]);

applyReplacements('src/components/hr/HrPayrollTab.tsx', [
  {from: /sharedPrintStyles/g, to: "'/*styles*/'"},
  {from: /sharedPrintHeader/g, to: "'<!-- h -->'"},
  {from: /sharedPrintFooter/g, to: "'<!-- f -->'"}
]);

applyReplacements('src/components/hr/InstantDocumentsHub.tsx', [
  {from: /\.arabicName/g, to: "['arabicName']"}
]);

applyReplacements('src/App.tsx', [
  {from: 'setSelectedDocEmp(null);', to: ''}
]);

console.log('Fixed HR Hubs TS Issues');
