const fs = require('fs');
const path = require('path');

let appPath = path.join(__dirname, 'src/App.tsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// Update salesSubmenus
appContent = appContent.replace(
/export const salesSubmenus = \[[\s\S]*?\];/,
`export const salesSubmenus = [
  { id: 'sales_crm', ar: '👥 العملاء', en: '👥 Clients' }
];`
);

fs.writeFileSync(appPath, appContent, 'utf8');
console.log('App.tsx updated');
