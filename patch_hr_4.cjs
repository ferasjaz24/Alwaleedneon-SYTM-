const fs = require('fs');

let content = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

content = content.replace(/allowances: \{ housing: 1500, transport: 500, phone: 0 \}/,
    `allowances: { housing: 1500, transport: 500, phone: 0, muddah: 0, food: 0 }`);

fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', content);

