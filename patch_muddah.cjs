const fs = require('fs');
let content = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

// Replace in initial state
content = content.replace(
    'food: 0,\n    loans: 0,',
    'food: 0,\n    muddah: 0,\n    loans: 0,'
);

// Replace in button 1
content = content.replace(
    'food:\n                                        (selectedEmp.allowances as any)?.food ||\n                                        0,\n                                      loans:',
    'food:\n                                        (selectedEmp.allowances as any)?.food ||\n                                        0,\n                                      muddah: (selectedEmp.allowances as any)?.muddah || 0,\n                                      loans:'
);

// Replace in button 2
content = content.replace(
    'food:\n                                    (selectedEmp.allowances as any)?.food || 0,\n                                  loans:',
    'food:\n                                    (selectedEmp.allowances as any)?.food || 0,\n                                  muddah: (selectedEmp.allowances as any)?.muddah || 0,\n                                  loans:'
);

fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', content);
