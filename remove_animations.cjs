const fs = require('fs');

let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

// Remove animate-in and related
code = code.replace(/animate-in fade-in duration-700/g, '');

// Remove transitions
code = code.replace(/transition-all duration-300/g, '');
code = code.replace(/transition duration-300/g, '');
code = code.replace(/transition-colors/g, '');
code = code.replace(/transition-transform/g, '');
code = code.replace(/transition-all/g, '');

// Remove translate and scale
code = code.replace(/hover:-translate-y-1/g, '');
code = code.replace(/hover:-translate-y-0\.5/g, '');
code = code.replace(/hover:scale-\[1\.02\]/g, '');
code = code.replace(/group-hover:scale-105/g, '');
code = code.replace(/origin-left/g, '');

// Clean up double spaces that might result
code = code.replace(/  +/g, ' ');

fs.writeFileSync('src/components/MainDashboard.tsx', code);
