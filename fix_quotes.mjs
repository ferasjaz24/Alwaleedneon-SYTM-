import fs from 'fs';

let content = fs.readFileSync('src/components/UserPermissionsModal.tsx', 'utf8');

// replace all \` with `
content = content.replace(/\\\`/g, '\`');
// we also have \$ we need to be careful. In the previous `create_file` call, I escaped `$` as well possibly? Wait, no, only \${} wasn't escaped, I escaped \`${...}\`.
content = content.replace(/\\\$/g, '$');

fs.writeFileSync('src/components/UserPermissionsModal.tsx', content, 'utf8');
