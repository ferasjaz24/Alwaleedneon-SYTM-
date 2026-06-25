const fs = require('fs');
const path = require('path');

const updateStatusFallback = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/req\.status === 'PENDING'/g, "(req.status === 'PENDING' || !req.status)");
  fs.writeFileSync(filePath, content, 'utf8');
}

updateStatusFallback(path.join(__dirname, 'src/components/hr/HrLeavesTab.tsx'));

console.log('Fixed undefined status fallback');
