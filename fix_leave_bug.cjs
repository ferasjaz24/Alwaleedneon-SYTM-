const fs = require('fs');
const path = require('path');

const fixPayload = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/submissionType:\s*'self'/g, "status: 'PENDING', submissionType: 'self'");
  content = content.replace(/submissionType:\s*'hr'/g, "status: 'PENDING',\n      submissionType: 'hr'");
  fs.writeFileSync(filePath, content, 'utf8');
};

fixPayload(path.join(__dirname, 'src/components/hr/HrSelfServiceTab.tsx'));
fixPayload(path.join(__dirname, 'src/components/hr/HrLeavesTab.tsx'));

const serverPath = path.join(__dirname, 'server.ts');
let serverContent = fs.readFileSync(serverPath, 'utf8');
serverContent = serverContent.replace(/const l = req.body;\n\s+if \(!l.id\) l.id = `LV-\$\{Date.now\(\)\}`;/g, "const l = req.body;\n    if (!l.id) l.id = `LV-${Date.now()}`;\n    if (!l.status) l.status = 'PENDING';");
fs.writeFileSync(serverPath, serverContent, 'utf8');

console.log('Fixed leave requests status defaulting to PENDING');
