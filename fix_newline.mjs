import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  'import AISettingsModal from "./components/AISettingsModal";\\nimport MainDashboard from "./components/MainDashboard";',
  'import AISettingsModal from "./components/AISettingsModal";\nimport MainDashboard from "./components/MainDashboard";'
);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Fixed \\n');
